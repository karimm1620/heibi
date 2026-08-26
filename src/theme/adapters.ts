import type { Material3Scheme } from "@pchmn/expo-material3-theme";
import { financialColors, type ThemeColors, withOpacity } from "./colors";
import type {
  SemanticThemeContract,
  ThemeEffectTokens,
  ThemeMotionTokens,
  ThemeShapeTokens,
} from "./contracts";
import { mapMaterial3ToThemeColors } from "./material3/colors";
import { m3Motion, m3Shape } from "./material3/tokens";
import { buildMaterial3Typography } from "./material3/typography";
import type { VisualTheme } from "./visualTheme";

const material3Shapes: ThemeShapeTokens = {
  content: m3Shape.medium,
  card: m3Shape.extraLarge,
  control: m3Shape.full,
  selected: m3Shape.full,
  floating: m3Shape.large,
  sheet: m3Shape.extraLarge,
  full: m3Shape.full,
};

const liquidShapes: ThemeShapeTokens = {
  content: m3Shape.medium,
  card: m3Shape.large,
  control: m3Shape.full,
  selected: m3Shape.full,
  floating: m3Shape.extraLarge2,
  sheet: m3Shape.extraLarge2,
  full: m3Shape.full,
};

const material3Motion: ThemeMotionTokens = {
  feedbackMs: m3Motion.duration.short3,
  transitionMs: m3Motion.duration.medium1,
  emphasizedMs: m3Motion.duration.medium4,
  selectionSpring: { damping: 24, stiffness: 320, mass: 1 },
};

const liquidMotion: ThemeMotionTokens = {
  feedbackMs: m3Motion.duration.short3,
  transitionMs: m3Motion.duration.medium2,
  emphasizedMs: m3Motion.duration.long1,
  selectionSpring: { damping: 20, stiffness: 260, mass: 0.9 },
};

const material3Effects: ThemeEffectTokens = {
  contentSurface: "opaque-tonal",
  chromeSurface: "opaque-tonal",
  chromeOpacity: 1,
  chromeBorderWidth: 0,
  backdropRenderer: "none",
};

function buildLiquidEffects(isDark: boolean): ThemeEffectTokens {
  return {
    contentSurface: "opaque-tonal",
    chromeSurface: "translucent-tonal",
    chromeOpacity: isDark ? 0.88 : 0.82,
    chromeBorderWidth: 1,
    backdropRenderer: "none",
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
    effects: visualTheme === "liquid" ? buildLiquidEffects(isDark) : material3Effects,
  };
}

export const visualThemePreviewShapes: Record<VisualTheme, ThemeShapeTokens> = {
  material3: material3Shapes,
  liquid: liquidShapes,
};
