export type AppSurfaceElevation = "none" | "low" | "medium" | "high";

const ANDROID_OUTSET_BOX_SHADOW_MIN_API = 28;

/**
 * Native elevation fallback for Android 7–8.1, where React Native's outset
 * boxShadow renderer is unavailable. Values follow the existing Material
 * elevation scale so the shared depth hierarchy remains intact.
 */
const legacyAndroidElevation: Record<AppSurfaceElevation, number> = {
  none: 0,
  low: 1,
  medium: 6,
  high: 12,
};

export function resolveAndroidSurfaceDepth(
  elevation: AppSurfaceElevation,
  boxShadow: string,
  androidApiLevel: number,
) {
  if (elevation === "none") {
    return {};
  }

  if (androidApiLevel < ANDROID_OUTSET_BOX_SHADOW_MIN_API) {
    return { elevation: legacyAndroidElevation[elevation] };
  }

  return { boxShadow };
}
