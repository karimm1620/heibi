import {
  requireNativeView,
  requireOptionalNativeModule,
} from "expo";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  Platform,
  processColor,
  type NativeSyntheticEvent,
  type ViewProps,
} from "react-native";
import { useReducedMotion } from "../../../src/hooks/useReducedMotion";
import { useTheme } from "../../../src/theme/useTheme";
import { LiquidMaterialSurface } from "../../../src/components/liquid/LiquidMaterialSurface";
import {
  resolveLiquidGlassMaterialColors,
  type LiquidGlassMaterialTone,
} from "./liquidGlassMaterialColors";

export type LiquidGlassRendererTier = "tonal" | "blur" | "optical";

export interface LiquidGlassRendererState {
  tier: LiquidGlassRendererTier;
  fallbackReason:
    | "none"
    | "api-below-31"
    | "disabled"
    | "low-ram"
    | "module-unavailable"
    | "capture-failed"
    | "hardware-acceleration-unavailable"
    | "blur-failed"
    | "runtime-shader-failed";
  apiLevel: number;
  lowRam: boolean;
  capturesBackdrop: boolean;
  appliesBlur: boolean;
  appliesRefraction: boolean;
  captureCount: number;
  backdropLuminance: number | null;
}

type NativeProps = ViewProps & {
  fallbackColor: number;
  boundaryColor: number;
  interactionEnabled: boolean;
  lightMaterial: boolean;
  tintColor: number;
  edgeColor: number;
  cornerRadius: number;
  blurRadius: number;
  refractionStrength: number;
  refreshKey: number;
  rendererEnabled: boolean;
  reducedMotion: boolean;
  maxTier: LiquidGlassRendererTier;
  onRendererStateChange?: (
    event: NativeSyntheticEvent<LiquidGlassRendererState>,
  ) => void;
};

const nativeModule =
  Platform.OS === "android"
    ? requireOptionalNativeModule("ExpoLiquidGlass")
    : null;

const NativeLiquidGlassView = nativeModule
  ? requireNativeView<NativeProps>("ExpoLiquidGlass")
  : null;

export interface OriginalLiquidGlassSurfaceProps extends ViewProps {
  active?: boolean;
  interactionEnabled?: boolean;
  materialTone?: LiquidGlassMaterialTone;
  maxTier?: LiquidGlassRendererTier;
  refreshKey?: number;
  rendererEnabled?: boolean;
  onRendererStateChange?: (state: LiquidGlassRendererState) => void;
}

function platformApiLevel() {
  const apiLevel = Number(Platform.Version);
  return Number.isFinite(apiLevel) ? apiLevel : 0;
}

function fallbackState(
  fallbackReason: LiquidGlassRendererState["fallbackReason"],
): LiquidGlassRendererState {
  return {
    tier: "tonal",
    fallbackReason,
    apiLevel: platformApiLevel(),
    lowRam: false,
    capturesBackdrop: false,
    appliesBlur: false,
    appliesRefraction: false,
    captureCount: 0,
    backdropLuminance: null,
  };
}

/**
 * Reusable Android optical host, selectively production-adopted for
 * Checkpoint 5 navigation after successful EAS and API-36 device validation.
 *
 * API 24-30, missing-module, low-RAM, disabled, and renderer-failure paths
 * return the existing LiquidMaterialSurface rather than inventing a second
 * JavaScript fallback. The Android native view is only mounted on API 31+.
 */
export function OriginalLiquidGlassSurface({
  active = false,
  children,
  interactionEnabled = true,
  materialTone = "default",
  maxTier = "optical",
  refreshKey = 0,
  rendererEnabled = true,
  onRendererStateChange,
  style,
  ...rest
}: OriginalLiquidGlassSurfaceProps) {
  const { colors, isDark, shapes } = useTheme();
  const reducedMotion = useReducedMotion();
  const rendererConfigurationKey = `${maxTier}:${rendererEnabled}`;
  const [failedConfigurationKey, setFailedConfigurationKey] = useState<string | null>(null);
  const nativeFallback = failedConfigurationKey === rendererConfigurationKey;
  const apiLevel = platformApiLevel();
  const nativeEligible =
    Platform.OS === "android" &&
    apiLevel >= 31 &&
    NativeLiquidGlassView !== null &&
    rendererEnabled &&
    maxTier !== "tonal" &&
    !nativeFallback;

  useEffect(() => {
    if (nativeEligible || nativeFallback) {
      return;
    }

    const reason: LiquidGlassRendererState["fallbackReason"] =
      !rendererEnabled || maxTier === "tonal"
        ? "disabled"
        : Platform.OS !== "android" || NativeLiquidGlassView === null
          ? "module-unavailable"
          : apiLevel < 31
            ? "api-below-31"
            : "capture-failed";
    onRendererStateChange?.(fallbackState(reason));
  }, [
    apiLevel,
    maxTier,
    nativeEligible,
    nativeFallback,
    onRendererStateChange,
    rendererEnabled,
  ]);

  const nativeColors = useMemo(() => {
    const resolved = resolveLiquidGlassMaterialColors(colors, isDark, materialTone);
    return {
      fallbackColor: processColor(resolved.fallbackColor) as number,
      boundaryColor: processColor(resolved.boundaryColor) as number,
      tintColor: processColor(resolved.tintColor) as number,
      edgeColor: processColor(resolved.edgeColor) as number,
      lightMaterial: resolved.lightMaterial,
    };
  }, [colors, isDark, materialTone]);

  const handleRendererStateChange = useCallback(
    (event: NativeSyntheticEvent<LiquidGlassRendererState>) => {
      const state = event.nativeEvent;
      onRendererStateChange?.(state);
      if (state.tier === "tonal") {
        setFailedConfigurationKey(rendererConfigurationKey);
      }
    },
    [onRendererStateChange, rendererConfigurationKey],
  );

  if (!nativeEligible || NativeLiquidGlassView === null) {
    return (
      <LiquidMaterialSurface
        active={active}
        materialTone={materialTone}
        style={style}
        {...rest}
      >
        {children}
      </LiquidMaterialSurface>
    );
  }

  return (
    <NativeLiquidGlassView
      {...rest}
      {...nativeColors}
      accessible={false}
      blurRadius={12}
      cornerRadius={shapes.floating}
      interactionEnabled={interactionEnabled}
      maxTier={maxTier}
      onRendererStateChange={handleRendererStateChange}
      reducedMotion={reducedMotion}
      refractionStrength={2.25}
      refreshKey={refreshKey}
      rendererEnabled={rendererEnabled}
      style={style}
    >
      {children}
    </NativeLiquidGlassView>
  );
}
