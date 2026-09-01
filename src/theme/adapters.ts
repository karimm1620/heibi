import type { Material3Scheme } from "@pchmn/expo-material3-theme";
import { financialColors, type ThemeColors, withOpacity } from "./colors";
import type {
  SemanticThemeContract,
  ThemeEffectTokens,
  ThemeMotionTokens,
  ThemeShapeTokens,
  ThemeStateTokens,
} from "./contracts";
import { mapMaterial3ToThemeColors } from "./material3/colors";
import { m3Motion, m3Shape } from "./material3/tokens";
import { buildMaterial3Typography } from "./material3/typography";
import type { VisualTheme } from "./visualTheme";

const material3Shapes: ThemeShapeTokens = {
  content: m3Shape.medium,
  card: m3Shape.large,
  control: m3Shape.full,
  selected: {
    borderRadius: m3Shape.large,
    borderTopLeftRadius: m3Shape.extraLarge,
    borderTopRightRadius: m3Shape.medium,
    borderBottomRightRadius: m3Shape.extraLarge,
    borderBottomLeftRadius: m3Shape.medium,
  },
  floating: m3Shape.large,
  sheet: m3Shape.extraLarge,
  full: m3Shape.full,
};

const liquidShapes: ThemeShapeTokens = {
  content: m3Shape.medium,
  card: m3Shape.large,
  control: m3Shape.full,
  selected: { borderRadius: m3Shape.full },
  floating: m3Shape.extraLarge2,
  sheet: m3Shape.extraLarge2,
  full: m3Shape.full,
};

const material3Motion: ThemeMotionTokens = {
  feedbackMs: m3Motion.duration.short2,
  transitionMs: m3Motion.duration.medium1,
  emphasizedMs: m3Motion.duration.medium4,
  selectionSpring: { damping: 24, stiffness: 320, mass: 1 },
};

const liquidMotion: ThemeMotionTokens = {
  feedbackMs: 120,
  transitionMs: m3Motion.duration.medium2,
  emphasizedMs: m3Motion.duration.long1,
  selectionSpring: { damping: 26, stiffness: 340, mass: 1 },
};

const material3States: ThemeStateTokens = {
  disabledOpacity: 0.38,
  pressedOpacity: 1,
  pressedScale: 0.96,
  rippleOpacity: 0.12,
  minTouchTarget: 48,
};

const liquidStates: ThemeStateTokens = {
  disabledOpacity: 0.42,
  pressedOpacity: 0.82,
  pressedScale: 0.97,
  rippleOpacity: 0,
  minTouchTarget: 48,
};

const material3Effects: ThemeEffectTokens = {
  contentSurface: "opaque-tonal",
  chromeSurface: "opaque-tonal",
  chromeOpacity: 1,
  chromeBorderWidth: 0,
  shadows: {
    none: "none",
    low: "0 1px 2px rgba(0, 0, 0, 0.14)",
    medium: "0 3px 8px rgba(0, 0, 0, 0.16)",
    high: "0 8px 20px rgba(0, 0, 0, 0.20)",
  },
  backdropRenderer: "none",
};

function buildLiquidEffects(isDark: boolean): ThemeEffectTokens {
  return {
    contentSurface: "opaque-tonal",
    chromeSurface: "translucent-tonal",
    chromeOpacity: isDark ? 0.88 : 0.82,
    chromeBorderWidth: 1,
    shadows: {
      none: "none",
      low: "0 2px 8px rgba(0, 0, 0, 0.12)",
      medium: "0 6px 18px rgba(0, 0, 0, 0.16)",
      high: "0 10px 28px rgba(0, 0, 0, 0.20)",
    },
    backdropRenderer: "original-android",
  };
}

function mapLiquidToThemeColors(
  scheme: Material3Scheme,
  keep: Pick<ThemeColors, "deposit" | "withdraw">,
  isDark: boolean,
): ThemeColors {
  const material = mapMaterial3ToThemeColors(scheme, keep, isDark);

  return {
    ...material,
    // Content remains opaque/tonal. Only interactive/chrome roles get a
    // lighter material treatment in later checkpoints.
    surfaceInteractive: withOpacity(scheme.primaryContainer, isDark ? 0.78 : 0.84),
    selected: scheme.tertiaryContainer,
    onSelected: scheme.onTertiaryContainer,
    outline: withOpacity(scheme.outline, isDark ? 0.82 : 0.68),
  };
}

export function buildSemanticTheme(
  visualTheme: VisualTheme,
  material3: Material3Scheme,
  isDark: boolean,
): SemanticThemeContract {
  const keep = isDark ? financialColors.dark : financialColors.light;
  const colors = visualTheme === "liquid"
    ? mapLiquidToThemeColors(material3, keep, isDark)
    : mapMaterial3ToThemeColors(material3, keep, isDark);

  return {
    visualTheme,
    colors,
    typography: buildMaterial3Typography(colors.textPrimary, colors.textSecondary),
    shapes: visualTheme === "liquid" ? liquidShapes : material3Shapes,
    motion: visualTheme === "liquid" ? liquidMotion : material3Motion,
    states: visualTheme === "liquid" ? liquidStates : material3States,
    effects: visualTheme === "liquid" ? buildLiquidEffects(isDark) : material3Effects,
  };
}

export const visualThemePreviewShapes: Record<VisualTheme, ThemeShapeTokens> = {
  material3: material3Shapes,
  liquid: liquidShapes,
};
