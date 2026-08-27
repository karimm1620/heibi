export const liquidMaterialPocCapability = {
  renderer: "tonal-fallback",
  minimumAndroidApi: 24,
  capturesBackdrop: false,
  appliesBlur: false,
  appliesRefraction: false,
} as const;

export type LiquidMaterialPocCapability = typeof liquidMaterialPocCapability;

export type OpticalLiquidRendererTier = "tonal" | "blur" | "optical";

export interface OpticalLiquidRendererEnvironment {
  apiLevel: number;
  lowRam: boolean;
  rendererEnabled: boolean;
  nativeModuleAvailable: boolean;
  blurFailed?: boolean;
  opticalFailed?: boolean;
  maxTier?: OpticalLiquidRendererTier;
}

export const originalOpticalLiquidPocCapability = {
  renderer: "original-android-native-view",
  minimumAndroidApi: 24,
  blurMinimumAndroidApi: 31,
  refractionMinimumAndroidApi: 33,
  capturesBoundedParent: true,
  redrawsContinuouslyWhileIdle: false,
  addsThirdPartyDependency: false,
  productionAdopted: false,
} as const;

/** Mirrors the native tier gate so API/failure behavior stays reviewable in Jest. */
export function resolveOpticalLiquidRendererTier({
  apiLevel,
  lowRam,
  rendererEnabled,
  nativeModuleAvailable,
  blurFailed = false,
  opticalFailed = false,
  maxTier = "optical",
}: OpticalLiquidRendererEnvironment): OpticalLiquidRendererTier {
  if (
    !rendererEnabled ||
    !nativeModuleAvailable ||
    lowRam ||
    apiLevel < 31 ||
    maxTier === "tonal" ||
    blurFailed
  ) {
    return "tonal";
  }

  if (apiLevel >= 33 && maxTier === "optical" && !opticalFailed) {
    return "optical";
  }

  return "blur";
}
