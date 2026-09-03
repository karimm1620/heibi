import type { ThemeColors } from "../../../src/theme/colors";
import { liquidChromeColors, withOpacity } from "../../../src/theme/colors";

export type LiquidGlassMaterialTone = "default" | "navigation";

export interface LiquidGlassMaterialColors {
  edgeColor: string;
  fallbackColor: string;
  lightMaterial: boolean;
  tintColor: string;
}

function replaceOpacity(color: string, alpha: number): string {
  const opaqueHex = /^#[0-9A-Fa-f]{8}$/.test(color) ? color.slice(0, 7) : color;
  return withOpacity(opaqueHex, alpha);
}

/**
 * Navigation needs a neutral optical tint in light mode. Reusing the general
 * interactive primary-container role here lets that color dominate the
 * captured backdrop and makes the whole bar read like a dense opaque slab.
 */
export function resolveLiquidGlassMaterialColors(
  colors: Pick<ThemeColors, "glassTintLight" | "surfaceInteractive">,
  isDark: boolean,
  tone: LiquidGlassMaterialTone,
): LiquidGlassMaterialColors {
  if (tone === "navigation") {
    const chrome = isDark ? liquidChromeColors.dark : liquidChromeColors.light;
    return {
      fallbackColor: chrome.navigationFallback,
      tintColor: withOpacity(chrome.navigationTint, isDark ? 0.4 : 0.36),
      edgeColor: chrome.navigationEdge,
      lightMaterial: !isDark,
    };
  }

  return {
    fallbackColor: colors.surfaceInteractive,
    tintColor: replaceOpacity(colors.surfaceInteractive, isDark ? 0.66 : 0.58),
    edgeColor: isDark
      ? "rgba(255,255,255,0.44)"
      : "rgba(255,255,255,0.68)",
    lightMaterial: false,
  };
}
