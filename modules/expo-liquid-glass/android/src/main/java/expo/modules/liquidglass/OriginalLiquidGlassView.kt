package expo.modules.liquidglass

import android.annotation.TargetApi
import android.app.ActivityManager
import android.content.Context
import android.graphics.Bitmap
import android.graphics.BitmapShader
import android.graphics.Canvas
import android.graphics.Color
import android.graphics.LinearGradient
import android.graphics.Paint
import android.graphics.Path
import android.graphics.PorterDuff
import android.graphics.RectF
import android.graphics.RenderEffect
import android.graphics.RenderNode
import android.graphics.RuntimeShader
import android.graphics.Shader
import android.os.Build
import android.os.SystemClock
import android.view.MotionEvent
import android.view.View
import android.view.ViewGroup
import android.view.ViewTreeObserver
import expo.modules.kotlin.AppContext
import expo.modules.kotlin.viewevent.EventDispatcher
import expo.modules.kotlin.views.ExpoView
import kotlin.math.max

private enum class RendererTier(val wireValue: String) {
  TONAL("tonal"),
  BLUR("blur"),
  OPTICAL("optical"),
}

private enum class FallbackReason(val wireValue: String) {
  NONE("none"),
  API_BELOW_31("api-below-31"),
  DISABLED("disabled"),
  LOW_RAM("low-ram"),
  CAPTURE_FAILED("capture-failed"),
  HARDWARE_ACCELERATION_UNAVAILABLE("hardware-acceleration-unavailable"),
  BLUR_FAILED("blur-failed"),
  RUNTIME_SHADER_FAILED("runtime-shader-failed"),
}

/**
 * One bounded Android View/Canvas optical material host.
 *
 * The view captures only its immediate parent and must be its last overlay
 * child. During capture this host and all of its accessible descendants are
 * excluded, preventing recursive glass and ghosted labels. Capture is
 * invalidation-driven; there is no idle frame callback or animation loop.
 */
class OriginalLiquidGlassView(
  context: Context,
  appContext: AppContext,
) : ExpoView(context, appContext) {
  private companion object {
    /** Active scroll capture is bounded to roughly 30fps and stops with scroll events. */
    const val ACTIVE_CAPTURE_INTERVAL_MS = 32L
  }

  val onRendererStateChange by EventDispatcher()

  private val density = resources.displayMetrics.density
  private val activityManager =
    context.getSystemService(Context.ACTIVITY_SERVICE) as? ActivityManager
  private val lowRamDevice = activityManager?.isLowRamDevice == true
  private val materialPaint = Paint(Paint.ANTI_ALIAS_FLAG or Paint.FILTER_BITMAP_FLAG)
  private val fillPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val boundaryPaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val edgePaint = Paint(Paint.ANTI_ALIAS_FLAG)
  private val materialRect = RectF()
  private val clippingPath = Path()
  private val selfLocation = IntArray(2)
  private val sourceLocation = IntArray(2)

  private var fallbackColor = Color.argb(255, 48, 46, 56)
  private var boundaryColor = Color.TRANSPARENT
  private var tintColor = Color.argb(156, 48, 46, 56)
  private var edgeColor = Color.argb(140, 255, 255, 255)
  private var cornerRadiusPx = 28f * density
  private var blurRadiusPx = 12f * density
  private var refractionStrengthPx = 2.25f * density
  private var rendererEnabled = true
  private var interactionEnabled = true
  private var lightMaterial = false
  private var reducedMotion = false
  private var maximumTier = RendererTier.OPTICAL
  private var currentTier = RendererTier.TONAL
  private var fallbackReason = FallbackReason.NONE
  private var refreshKey = 0
  private var opticalFailed = false
  private var blurFailed = false

  private var captureBitmap: Bitmap? = null
  private var capturePending = false
  private var pendingCaptureReason = "initial"
  private var captureCount = 0
  private var backdropLuminance: Float? = null
  private var capturingBackdrop = false
  private var cleanedUp = false
  private var observedViewTreeObserver: ViewTreeObserver? = null
  private var lastActiveCaptureRequestUptimeMs = 0L
  private var activeCaptureScheduled = false
  private var pendingActiveCaptureReason = "ancestor-change"

  private var blurEffect: Any? = null
  private var renderNode: Any? = null
  private var renderNodeRecordingDirty = true
  private var runtimeShader: Any? = null
  private var touchX = 0f
  private var touchY = 0f
  private var touchPressure = 0f

  private val preDrawListener = ViewTreeObserver.OnPreDrawListener {
    if (capturePending && currentTier != RendererTier.TONAL) {
      captureBackdrop()
    }
    true
  }

  private val ancestorScrollListener = ViewTreeObserver.OnScrollChangedListener {
    requestActiveBackdropCapture("ancestor-scroll")
  }

  private val ancestorLayoutListener = ViewTreeObserver.OnGlobalLayoutListener {
    requestActiveBackdropCapture("ancestor-layout")
  }

  private val trailingActiveCapture = Runnable {
    activeCaptureScheduled = false
    if (cleanedUp || !isAttachedToWindow) return@Runnable
    lastActiveCaptureRequestUptimeMs = SystemClock.uptimeMillis()
    requestBackdropCapture(pendingActiveCaptureReason)
  }

  init {
    setWillNotDraw(false)
    clipChildren = true
    clipToPadding = false
    importantForAccessibility = View.IMPORTANT_FOR_ACCESSIBILITY_NO
    isFocusable = false
    recomputeTier("initial")
  }

  fun setFallbackColor(color: Int) {
    fallbackColor = color
    invalidate()
  }

  fun setBoundaryColor(color: Int) {
    boundaryColor = color
    invalidate()
  }

  fun setTintColor(color: Int) {
    tintColor = color
    invalidate()
  }

  fun setEdgeColor(color: Int) {
    edgeColor = color
    updateEdgeShader()
    invalidate()
  }

  fun setCornerRadiusDp(radius: Float) {
    cornerRadiusPx = max(0f, radius * density)
    updateGeometry(width, height)
    invalidate()
  }

  fun setBlurRadiusDp(radius: Float) {
    blurRadiusPx = max(0.5f, radius * density)
    blurEffect = null
    requestBackdropCapture("blur-radius")
  }

  fun setRefractionStrengthDp(strength: Float) {
    refractionStrengthPx = max(0f, strength * density)
    renderNodeRecordingDirty = true
    invalidate()
  }

  fun setRendererEnabled(enabled: Boolean) {
    if (rendererEnabled == enabled) return
    rendererEnabled = enabled
    recomputeTier("renderer-enabled")
  }

  fun setInteractionEnabled(enabled: Boolean) {
    if (interactionEnabled == enabled) return
    interactionEnabled = enabled
    if (!enabled) {
      touchPressure = 0f
      touchX = width * 0.5f
      touchY = height * 0.5f
      renderNodeRecordingDirty = true
      invalidate()
    }
  }

  fun setLightMaterial(light: Boolean) {
    if (lightMaterial == light) return
    lightMaterial = light
    invalidate()
  }

  fun setReducedMotion(reduced: Boolean) {
    if (reducedMotion == reduced) return
    reducedMotion = reduced
    if (reduced) {
      touchPressure = 0f
      touchX = width * 0.5f
      touchY = height * 0.5f
    }
    renderNodeRecordingDirty = true
    invalidate()
  }

  fun setMaximumTier(tier: String?) {
    val next = when (tier) {
      "tonal" -> RendererTier.TONAL
      "blur" -> RendererTier.BLUR
      else -> RendererTier.OPTICAL
    }
    if (maximumTier == next) return
    maximumTier = next
    recomputeTier("maximum-tier")
  }

  fun setRefreshKey(nextRefreshKey: Int) {
    if (refreshKey == nextRefreshKey) return
    refreshKey = nextRefreshKey
    requestBackdropCapture("refresh-key")
  }

  fun requestBackdropCapture(reason: String) {
    if (cleanedUp || currentTier == RendererTier.TONAL) return
    removeCallbacks(trailingActiveCapture)
    activeCaptureScheduled = false
    capturePending = true
    pendingCaptureReason = reason
    invalidate()
  }

  private fun requestActiveBackdropCapture(reason: String) {
    if (capturePending) return
    val now = SystemClock.uptimeMillis()
    val elapsed = now - lastActiveCaptureRequestUptimeMs
    if (elapsed >= ACTIVE_CAPTURE_INTERVAL_MS) {
      removeCallbacks(trailingActiveCapture)
      activeCaptureScheduled = false
      lastActiveCaptureRequestUptimeMs = now
      requestBackdropCapture(reason)
      return
    }

    pendingActiveCaptureReason = reason
    if (activeCaptureScheduled) return
    activeCaptureScheduled = true
    postDelayed(trailingActiveCapture, ACTIVE_CAPTURE_INTERVAL_MS - elapsed)
  }

  override fun onAttachedToWindow() {
    super.onAttachedToWindow()
    cleanedUp = false
    addViewTreeObservers()
    requestBackdropCapture("attached")
    post { emitRendererState() }
  }

  override fun onDetachedFromWindow() {
    removeViewTreeObservers()
    releaseCaptureResources()
    super.onDetachedFromWindow()
  }

  override fun onWindowFocusChanged(hasWindowFocus: Boolean) {
    super.onWindowFocusChanged(hasWindowFocus)
    if (hasWindowFocus) {
      requestBackdropCapture("window-focus")
    }
  }

  override fun onSizeChanged(width: Int, height: Int, oldWidth: Int, oldHeight: Int) {
    super.onSizeChanged(width, height, oldWidth, oldHeight)
    updateGeometry(width, height)
    releaseBitmap()
    requestBackdropCapture("size")
  }

  override fun onLayout(changed: Boolean, left: Int, top: Int, right: Int, bottom: Int) {
    super.onLayout(changed, left, top, right, bottom)
    if (changed) {
      requestBackdropCapture("layout")
    }
  }

  override fun onDraw(canvas: Canvas) {
    super.onDraw(canvas)
    if (capturingBackdrop) return

    materialRect.set(0f, 0f, width.toFloat(), height.toFloat())
    val saveCount = canvas.save()
    canvas.clipPath(clippingPath)

    fillPaint.shader = null
    fillPaint.color = fallbackColor
    canvas.drawRect(materialRect, fillPaint)

    val drewBackdrop = drawBackdrop(canvas)
    if (drewBackdrop) {
      drawAdaptiveContrast(canvas)
    }

    fillPaint.color = tintColor
    canvas.drawRect(materialRect, fillPaint)
    canvas.restoreToCount(saveCount)
    drawEdgeLight(canvas)
  }

  override fun dispatchDraw(canvas: Canvas) {
    if (capturingBackdrop) return
    val saveCount = canvas.save()
    canvas.clipPath(clippingPath)
    super.dispatchDraw(canvas)
    canvas.restoreToCount(saveCount)
  }

  override fun dispatchTouchEvent(event: MotionEvent): Boolean {
    if (interactionEnabled && !reducedMotion && currentTier == RendererTier.OPTICAL) {
      when (event.actionMasked) {
        MotionEvent.ACTION_DOWN -> {
          touchX = event.x
          touchY = event.y
          touchPressure = 1f
          renderNodeRecordingDirty = true
          requestBackdropCapture("touch-down")
          postInvalidateOnAnimation()
        }
        MotionEvent.ACTION_MOVE -> {
          touchX = event.x
          touchY = event.y
          renderNodeRecordingDirty = true
          postInvalidateOnAnimation()
        }
        MotionEvent.ACTION_UP, MotionEvent.ACTION_CANCEL -> {
          touchPressure = 0f
          touchX = width * 0.5f
          touchY = height * 0.5f
          renderNodeRecordingDirty = true
          postInvalidateOnAnimation()
        }
      }
    }
    return super.dispatchTouchEvent(event)
  }

  fun cleanup() {
    if (cleanedUp) return
    cleanedUp = true
    removeViewTreeObservers()
    releaseCaptureResources()
  }

  private fun recomputeTier(reason: String) {
    val nextReason: FallbackReason
    val nextTier = when {
      !rendererEnabled || maximumTier == RendererTier.TONAL -> {
        nextReason = FallbackReason.DISABLED
        RendererTier.TONAL
      }
      lowRamDevice -> {
        nextReason = FallbackReason.LOW_RAM
        RendererTier.TONAL
      }
      Build.VERSION.SDK_INT < 31 -> {
        nextReason = FallbackReason.API_BELOW_31
        RendererTier.TONAL
      }
      blurFailed -> {
        nextReason = FallbackReason.BLUR_FAILED
        RendererTier.TONAL
      }
      Build.VERSION.SDK_INT >= 33 &&
        maximumTier == RendererTier.OPTICAL &&
        !opticalFailed -> {
        nextReason = FallbackReason.NONE
        RendererTier.OPTICAL
      }
      else -> {
        nextReason = if (opticalFailed) {
          FallbackReason.RUNTIME_SHADER_FAILED
        } else {
          FallbackReason.NONE
        }
        RendererTier.BLUR
      }
    }

    val changed = currentTier != nextTier || fallbackReason != nextReason
    currentTier = nextTier
    fallbackReason = nextReason
    blurEffect = null
    runtimeShader = null
    renderNodeRecordingDirty = true
    if (nextTier == RendererTier.TONAL) {
      releaseBitmap()
      capturePending = false
    } else {
      requestBackdropCapture(reason)
    }
    if (changed) {
      emitRendererState()
      invalidate()
    }
  }

  private fun captureBackdrop() {
    capturePending = false
    val source = parent as? ViewGroup
    if (source == null || width <= 0 || height <= 0) {
      fallbackReason = FallbackReason.CAPTURE_FAILED
      currentTier = RendererTier.TONAL
      releaseBitmap()
      emitRendererState()
      invalidate()
      return
    }

    try {
      val bitmap = obtainBitmap(width, height)
      val captureCanvas = Canvas(bitmap)
      captureCanvas.drawColor(Color.TRANSPARENT, PorterDuff.Mode.CLEAR)
      getLocationInWindow(selfLocation)
      source.getLocationInWindow(sourceLocation)
      captureCanvas.translate(
        (sourceLocation[0] - selfLocation[0]).toFloat(),
        (sourceLocation[1] - selfLocation[1]).toFloat(),
      )

      capturingBackdrop = true
      try {
        source.draw(captureCanvas)
      } finally {
        capturingBackdrop = false
      }

      backdropLuminance = sampleLuminance(bitmap)
      captureCount += 1
      renderNodeRecordingDirty = true
      preparePlatformEffects()
      emitRendererState()
      invalidate()
    } catch (_: Throwable) {
      capturingBackdrop = false
      fallbackReason = FallbackReason.CAPTURE_FAILED
      currentTier = RendererTier.TONAL
      releaseCaptureResources()
      emitRendererState()
      invalidate()
    }
  }

  private fun drawBackdrop(canvas: Canvas): Boolean {
    val bitmap = captureBitmap ?: return false
    if (currentTier == RendererTier.TONAL) return false
    if (!canvas.isHardwareAccelerated) {
      post {
        fallbackReason = FallbackReason.HARDWARE_ACCELERATION_UNAVAILABLE
        currentTier = RendererTier.TONAL
        emitRendererState()
        invalidate()
      }
      return false
    }

    return try {
      val node = renderNode ?: Api31Renderer.createRenderNode().also {
        renderNode = it
        renderNodeRecordingDirty = true
      }
      val drewBackdrop = when (currentTier) {
        RendererTier.BLUR -> Api31Renderer.draw(
          canvas,
          materialRect,
          materialPaint,
          bitmap,
          blurEffect ?: Api31Renderer.createBlurEffect(blurRadiusPx).also {
            blurEffect = it
          },
          node,
          renderNodeRecordingDirty,
        )
        RendererTier.OPTICAL -> Api33Renderer.draw(
          canvas,
          materialRect,
          materialPaint,
          bitmap,
          blurEffect ?: Api31Renderer.createBlurEffect(blurRadiusPx).also {
            blurEffect = it
          },
          runtimeShader ?: Api33Renderer.createShader().also {
            runtimeShader = it
          },
          node,
          renderNodeRecordingDirty,
          width.toFloat(),
          height.toFloat(),
          touchX.takeIf { it > 0f } ?: width * 0.5f,
          touchY.takeIf { it > 0f } ?: height * 0.5f,
          if (reducedMotion) 0f else touchPressure,
          refractionStrengthPx,
        )
        RendererTier.TONAL -> false
      }
      if (drewBackdrop) {
        renderNodeRecordingDirty = false
      }
      drewBackdrop
    } catch (_: Throwable) {
      post {
        if (currentTier == RendererTier.OPTICAL) {
          opticalFailed = true
        } else {
          blurFailed = true
        }
        recomputeTier("draw-failure")
      }
      false
    }
  }

  private fun preparePlatformEffects() {
    if (currentTier == RendererTier.TONAL) return
    try {
      if (blurEffect == null) {
        blurEffect = Api31Renderer.createBlurEffect(blurRadiusPx)
      }
      if (currentTier == RendererTier.OPTICAL && runtimeShader == null) {
        runtimeShader = Api33Renderer.createShader()
        renderNodeRecordingDirty = true
      }
    } catch (_: Throwable) {
      if (currentTier == RendererTier.OPTICAL) {
        opticalFailed = true
      } else {
        blurFailed = true
      }
      recomputeTier("effect-creation-failure")
    }
  }

  private fun drawAdaptiveContrast(canvas: Canvas) {
    val luminance = backdropLuminance ?: return
    fillPaint.shader = null
    fillPaint.color = if (lightMaterial) {
      if (luminance >= 0.58f) {
        Color.argb(8, 255, 255, 255)
      } else {
        Color.argb(24, 255, 255, 255)
      }
    } else if (luminance >= 0.58f) {
      Color.argb(18, 0, 0, 0)
    } else {
      Color.argb(12, 255, 255, 255)
    }
    canvas.drawRect(materialRect, fillPaint)
  }

  private fun drawEdgeLight(canvas: Canvas) {
    val inset = max(0.5f, density * 0.5f)
    boundaryPaint.shader = null
    boundaryPaint.style = Paint.Style.STROKE
    boundaryPaint.strokeWidth = max(1f, density)
    boundaryPaint.color = boundaryColor
    canvas.drawRoundRect(
      inset,
      inset,
      width - inset,
      height - inset,
      max(0f, cornerRadiusPx - inset),
      max(0f, cornerRadiusPx - inset),
      boundaryPaint,
    )
    edgePaint.style = Paint.Style.STROKE
    edgePaint.strokeWidth = max(1f, density)
    canvas.drawRoundRect(
      inset,
      inset,
      width - inset,
      height - inset,
      max(0f, cornerRadiusPx - inset),
      max(0f, cornerRadiusPx - inset),
      edgePaint,
    )
  }

  private fun updateGeometry(width: Int, height: Int) {
    materialRect.set(0f, 0f, width.toFloat(), height.toFloat())
    clippingPath.reset()
    clippingPath.addRoundRect(
      materialRect,
      cornerRadiusPx,
      cornerRadiusPx,
      Path.Direction.CW,
    )
    touchX = width * 0.5f
    touchY = height * 0.5f
    updateEdgeShader()
  }

  private fun updateEdgeShader() {
    edgePaint.shader = LinearGradient(
      0f,
      0f,
      max(1f, width.toFloat()),
      max(1f, height.toFloat()),
      intArrayOf(edgeColor, Color.TRANSPARENT, Color.TRANSPARENT),
      floatArrayOf(0f, 0.48f, 1f),
      Shader.TileMode.CLAMP,
    )
  }

  private fun obtainBitmap(width: Int, height: Int): Bitmap {
    val current = captureBitmap
    if (current != null && current.width == width && current.height == height && !current.isRecycled) {
      return current
    }
    releaseBitmap()
    return Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888).also {
      captureBitmap = it
    }
  }

  private fun sampleLuminance(bitmap: Bitmap): Float {
    val columns = 8
    val rows = 4
    var sum = 0f
    var samples = 0
    for (row in 0 until rows) {
      val y = ((row + 0.5f) * bitmap.height / rows).toInt().coerceIn(0, bitmap.height - 1)
      for (column in 0 until columns) {
        val x = ((column + 0.5f) * bitmap.width / columns).toInt().coerceIn(0, bitmap.width - 1)
        val color = bitmap.getPixel(x, y)
        val red = Color.red(color) / 255f
        val green = Color.green(color) / 255f
        val blue = Color.blue(color) / 255f
        sum += (0.2126f * red) + (0.7152f * green) + (0.0722f * blue)
        samples += 1
      }
    }
    return if (samples == 0) 0.5f else sum / samples
  }

  private fun emitRendererState() {
    onRendererStateChange(
      mapOf<String, Any>(
        "tier" to currentTier.wireValue,
        "fallbackReason" to fallbackReason.wireValue,
        "apiLevel" to Build.VERSION.SDK_INT,
        "lowRam" to lowRamDevice,
        "capturesBackdrop" to (currentTier != RendererTier.TONAL && captureBitmap != null),
        "appliesBlur" to (currentTier != RendererTier.TONAL),
        "appliesRefraction" to (currentTier == RendererTier.OPTICAL),
        "captureCount" to captureCount,
        "backdropLuminance" to (backdropLuminance ?: -1f),
        "lastCaptureReason" to pendingCaptureReason,
      ),
    )
  }

  private fun addViewTreeObservers() {
    val observer = viewTreeObserver
    if (!observer.isAlive) return
    observedViewTreeObserver = observer
    observer.addOnPreDrawListener(preDrawListener)
    observer.addOnScrollChangedListener(ancestorScrollListener)
    observer.addOnGlobalLayoutListener(ancestorLayoutListener)
  }

  private fun removeViewTreeObservers() {
    observedViewTreeObserver?.takeIf { it.isAlive }?.let { observer ->
      observer.removeOnPreDrawListener(preDrawListener)
      observer.removeOnScrollChangedListener(ancestorScrollListener)
      observer.removeOnGlobalLayoutListener(ancestorLayoutListener)
    }
    observedViewTreeObserver = null
    removeCallbacks(trailingActiveCapture)
    activeCaptureScheduled = false
    lastActiveCaptureRequestUptimeMs = 0L
  }

  private fun releaseCaptureResources() {
    if (Build.VERSION.SDK_INT >= 31) {
      renderNode?.let(Api31Renderer::releaseRenderNode)
    }
    renderNode = null
    renderNodeRecordingDirty = true
    releaseBitmap()
    blurEffect = null
    runtimeShader = null
    materialPaint.shader = null
  }

  private fun releaseBitmap() {
    if (Build.VERSION.SDK_INT >= 31) {
      renderNode?.let(Api31Renderer::discardRecording)
    }
    renderNodeRecordingDirty = true
    captureBitmap?.takeIf { !it.isRecycled }?.recycle()
    captureBitmap = null
    backdropLuminance = null
  }
}

@TargetApi(31)
private object Api31Renderer {
  fun createRenderNode(): Any = RenderNode("HeibiLiquidGlass")

  fun createBlurEffect(radius: Float): Any =
    RenderEffect.createBlurEffect(
      max(0.5f, radius),
      max(0.5f, radius),
      Shader.TileMode.CLAMP,
    )

  fun draw(
    canvas: Canvas,
    bounds: RectF,
    paint: Paint,
    bitmap: Bitmap,
    effect: Any,
    nodeValue: Any,
    recordingDirty: Boolean,
  ): Boolean {
    val node = nodeValue as RenderNode
    val width = max(1, bounds.width().toInt())
    val height = max(1, bounds.height().toInt())
    node.setPosition(0, 0, width, height)
    node.setClipToBounds(true)
    node.setRenderEffect(effect as RenderEffect)

    if (recordingDirty) {
      val recordingCanvas = node.beginRecording(width, height)
      try {
        paint.shader = BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP)
        recordingCanvas.drawRect(0f, 0f, width.toFloat(), height.toFloat(), paint)
      } finally {
        paint.shader = null
        node.endRecording()
      }
    }

    canvas.drawRenderNode(node)
    return true
  }

  fun discardRecording(nodeValue: Any) {
    (nodeValue as RenderNode).discardDisplayList()
  }

  fun releaseRenderNode(nodeValue: Any) {
    val node = nodeValue as RenderNode
    node.setRenderEffect(null)
    node.discardDisplayList()
  }
}

@TargetApi(33)
private object Api33Renderer {
  fun createShader(): Any = RuntimeShader(HEIBI_LIQUID_SHADER)

  fun draw(
    canvas: Canvas,
    bounds: RectF,
    paint: Paint,
    bitmap: Bitmap,
    effect: Any,
    shaderValue: Any,
    nodeValue: Any,
    recordingDirty: Boolean,
    width: Float,
    height: Float,
    touchX: Float,
    touchY: Float,
    pressure: Float,
    strength: Float,
  ): Boolean {
    val node = nodeValue as RenderNode
    val shader = shaderValue as RuntimeShader
    val nodeWidth = max(1, bounds.width().toInt())
    val nodeHeight = max(1, bounds.height().toInt())
    node.setPosition(0, 0, nodeWidth, nodeHeight)
    node.setClipToBounds(true)
    node.setRenderEffect(effect as RenderEffect)

    if (recordingDirty) {
      val recordingCanvas = node.beginRecording(nodeWidth, nodeHeight)
      try {
        shader.setInputShader(
          "content",
          BitmapShader(bitmap, Shader.TileMode.CLAMP, Shader.TileMode.CLAMP),
        )
        shader.setFloatUniform("size", width, height)
        shader.setFloatUniform("touch", touchX, touchY)
        shader.setFloatUniform("press", pressure)
        shader.setFloatUniform("strength", strength)
        paint.shader = shader
        recordingCanvas.drawRect(
          0f,
          0f,
          nodeWidth.toFloat(),
          nodeHeight.toFloat(),
          paint,
        )
      } finally {
        paint.shader = null
        node.endRecording()
      }
    }

    canvas.drawRenderNode(node)
    return true
  }
}
