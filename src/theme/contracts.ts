import type { ThemeColors } from "./colors";
import type { Typography } from "./material3/typography";
import type { VisualTheme } from "./visualTheme";

export interface ThemeShapeTokens {
  content: number;
  card: number;
  control: number;
  selected: number;
  floating: number;
  sheet: number;
  full: number;
}

export interface ThemeMotionTokens {
  feedbackMs: number;
  transitionMs: number;
  emphasizedMs: number;
  selectionSpring: {
    damping: number;
    stiffness: number;
    mass: number;
  };
}

export type ThemeSurfaceTreatment = "opaque-tonal" | "translucent-tonal";

export interface ThemeEffectTokens {
  contentSurface: "opaque-tonal";
  chromeSurface: ThemeSurfaceTreatment;
  chromeOpacity: number;
  chromeBorderWidth: number;
  /** No optical renderer is claimed until Checkpoint 4 proves one. */
  backdropRenderer: "none";
}

export interface SemanticThemeContract {
  visualTheme: VisualTheme;
  colors: ThemeColors;
  typography: Typography;
  shapes: ThemeShapeTokens;
  motion: ThemeMotionTokens;
  effects: ThemeEffectTokens;
}
