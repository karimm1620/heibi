import type { ThemeColors } from "./colors";
import type { Typography } from "./material3/typography";
import type { VisualTheme } from "./visualTheme";

export interface ThemeShapeTokens {
  content: number;
  card: number;
  control: number;
  selected: {
    borderRadius: number;
    borderTopLeftRadius?: number;
    borderTopRightRadius?: number;
    borderBottomRightRadius?: number;
    borderBottomLeftRadius?: number;
  };
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

export interface ThemeStateTokens {
  disabledOpacity: number;
  pressedOpacity: number;
  pressedScale: number;
  rippleOpacity: number;
  minTouchTarget: number;
}

export type ThemeSurfaceTreatment = "opaque-tonal" | "translucent-tonal";

export interface ThemeEffectTokens {
  contentSurface: "opaque-tonal";
  chromeSurface: ThemeSurfaceTreatment;
  chromeOpacity: number;
  chromeBorderWidth: number;
  shadows: {
    none: string;
    low: string;
    medium: string;
    high: string;
  };
  /** No optical renderer is claimed until Checkpoint 4 proves one. */
  backdropRenderer: "none";
}

export interface SemanticThemeContract {
  visualTheme: VisualTheme;
  colors: ThemeColors;
  typography: Typography;
  shapes: ThemeShapeTokens;
  motion: ThemeMotionTokens;
  states: ThemeStateTokens;
  effects: ThemeEffectTokens;
}
