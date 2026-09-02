import type { PressableAndroidRippleConfig } from "react-native";
import { useMemo } from "react";
import type { ThemeStateTokens } from "../theme/contracts";
import type { VisualTheme } from "../theme/visualTheme";
import { withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";

interface PressFeedbackOptions {
  visualTheme: VisualTheme;
  states: ThemeStateTokens;
  color: string;
  disabled?: boolean;
  radius?: number;
}

export interface PressFeedbackContract {
  androidRipple: PressableAndroidRippleConfig | undefined;
  opacity: (pressed: boolean) => number;
}

/**
 * One Android press contract for app controls. Material uses a clipped,
 * semantic background ripple; Liquid uses its restrained opacity response.
 * Callers own geometry and must clip the Pressable to that geometry.
 */
export function resolvePressFeedback({
  visualTheme,
  states,
  color,
  disabled = false,
  radius,
}: PressFeedbackOptions): PressFeedbackContract {
  const materialRipple = visualTheme === "material3" && !disabled;

  return {
    androidRipple: materialRipple
      ? {
          color: withOpacity(color, states.rippleOpacity),
          borderless: false,
          foreground: false,
          ...(radius === undefined ? {} : { radius }),
        }
      : undefined,
    opacity: (pressed) => {
      if (disabled) return states.disabledOpacity;
      if (visualTheme === "liquid" && pressed) return states.pressedOpacity;
      return 1;
    },
  };
}

export function usePressFeedback(
  color: string,
  options: Pick<PressFeedbackOptions, "disabled" | "radius"> = {},
): PressFeedbackContract {
  const { visualTheme, states } = useTheme();
  const { disabled, radius } = options;

  return useMemo(
    () => resolvePressFeedback({ visualTheme, states, color, disabled, radius }),
    [color, disabled, radius, states, visualTheme],
  );
}
