const fs = require("node:fs");
const path = require("node:path");
const { describe, expect, it } = require("@jest/globals");

const rendererPath = path.join(
  process.cwd(),
  "modules/expo-liquid-glass/android/src/main/java/expo/modules/liquidglass/OriginalLiquidGlassView.kt",
);
const rendererSource = fs.readFileSync(rendererPath, "utf8");
const moduleSource = fs.readFileSync(
  path.join(
    process.cwd(),
    "modules/expo-liquid-glass/android/src/main/java/expo/modules/liquidglass/ExpoLiquidGlassModule.kt",
  ),
  "utf8",
);

describe("native Liquid RenderEffect pipeline", () => {
  it("never applies RenderEffect to Paint", () => {
    expect(rendererSource).not.toMatch(/\bpaint\.setRenderEffect\s*\(/);
  });

  it("records the bounded material into a reusable RenderNode", () => {
    expect(rendererSource).toContain("RenderNode(\"HeibiLiquidGlass\")");
    expect(rendererSource).toContain("node.beginRecording");
    expect(rendererSource).toContain("node.setRenderEffect");
    expect(rendererSource).toContain("canvas.drawRenderNode(node)");
    expect(rendererSource).toContain("node.discardDisplayList()");
  });

  it("can disable touch-following work without disabling the static optical tier", () => {
    expect(moduleSource).toContain('Prop("interactionEnabled")');
    expect(rendererSource).toContain(
      "interactionEnabled && !reducedMotion && currentTier == RendererTier.OPTICAL",
    );
  });

  it("uses an explicit light adaptive-contrast path without changing tiers", () => {
    expect(moduleSource).toContain('Prop("lightMaterial")');
    expect(moduleSource).toContain('Prop("boundaryColor")');
    expect(rendererSource).toContain("if (lightMaterial)");
    expect(rendererSource).toContain("Color.argb(24, 255, 255, 255)");
    expect(rendererSource).toContain("Color.argb(18, 0, 0, 0)");
  });

  it("draws a separate material boundary without changing backdrop capture", () => {
    expect(rendererSource).toContain("private val boundaryPaint = Paint");
    expect(rendererSource).toContain("fun setBoundaryColor(color: Int)");
    expect(rendererSource).toContain("boundaryPaint.color = boundaryColor");
    expect(rendererSource).toContain("drawEdgeLight(canvas)");
  });

  it("refreshes on bounded native scroll/layout dirtiness without an idle frame loop", () => {
    expect(rendererSource).toContain("ACTIVE_CAPTURE_INTERVAL_MS = 32L");
    expect(rendererSource).toContain("addOnScrollChangedListener(ancestorScrollListener)");
    expect(rendererSource).toContain("addOnGlobalLayoutListener(ancestorLayoutListener)");
    expect(rendererSource).toContain('requestActiveBackdropCapture("ancestor-scroll")');
    expect(rendererSource).toContain('requestActiveBackdropCapture("ancestor-layout")');
    expect(rendererSource).toContain("postDelayed(trailingActiveCapture");
    expect(rendererSource).not.toMatch(/Choreographer|requestAnimationFrame|Timer\s*\(/);
  });

  it("coalesces active capture requests and removes every observer on detach", () => {
    expect(rendererSource).toContain("if (capturePending) return");
    expect(rendererSource).toContain("activeCaptureScheduled = false\n    capturePending = true");
    expect(rendererSource).toContain("removeOnPreDrawListener(preDrawListener)");
    expect(rendererSource).toContain("removeOnScrollChangedListener(ancestorScrollListener)");
    expect(rendererSource).toContain("removeOnGlobalLayoutListener(ancestorLayoutListener)");
    expect(rendererSource).toContain("removeCallbacks(trailingActiveCapture)");
    expect(rendererSource).toContain("releaseCaptureResources()\n    super.onDetachedFromWindow()");
  });
});
