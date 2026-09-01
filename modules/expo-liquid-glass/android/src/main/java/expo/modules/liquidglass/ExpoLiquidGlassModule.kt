package expo.modules.liquidglass

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoLiquidGlassModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoLiquidGlass")

    View(OriginalLiquidGlassView::class) {
      Events("onRendererStateChange")

      Prop("fallbackColor") { view: OriginalLiquidGlassView, color: Int? ->
        color?.let(view::setFallbackColor)
      }
      Prop("tintColor") { view: OriginalLiquidGlassView, color: Int? ->
        color?.let(view::setTintColor)
      }
      Prop("edgeColor") { view: OriginalLiquidGlassView, color: Int? ->
        color?.let(view::setEdgeColor)
      }
      Prop("cornerRadius") { view: OriginalLiquidGlassView, radius: Double? ->
        view.setCornerRadiusDp(radius?.toFloat() ?: 0f)
      }
      Prop("blurRadius") { view: OriginalLiquidGlassView, radius: Double? ->
        view.setBlurRadiusDp(radius?.toFloat() ?: 0f)
      }
      Prop("refractionStrength") { view: OriginalLiquidGlassView, strength: Double? ->
        view.setRefractionStrengthDp(strength?.toFloat() ?: 0f)
      }
      Prop("rendererEnabled") { view: OriginalLiquidGlassView, enabled: Boolean? ->
        view.setRendererEnabled(enabled == true)
      }
      Prop("interactionEnabled") { view: OriginalLiquidGlassView, enabled: Boolean? ->
        view.setInteractionEnabled(enabled != false)
      }
      Prop("reducedMotion") { view: OriginalLiquidGlassView, reduced: Boolean? ->
        view.setReducedMotion(reduced == true)
      }
      Prop("maxTier") { view: OriginalLiquidGlassView, tier: String? ->
        view.setMaximumTier(tier)
      }
      Prop("refreshKey") { view: OriginalLiquidGlassView, refreshKey: Int? ->
        view.setRefreshKey(refreshKey ?: 0)
      }

      GroupView<OriginalLiquidGlassView> {}

      AsyncFunction("refreshBackdrop") { view: OriginalLiquidGlassView ->
        view.requestBackdropCapture("imperative")
      }

      OnViewDestroys { view: OriginalLiquidGlassView ->
        view.cleanup()
      }
    }
  }
}
