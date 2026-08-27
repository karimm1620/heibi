import React, { useMemo } from "react";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import Animated from "react-native-reanimated";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { useTheme } from "../../theme/useTheme";
import { resolveAndroidSurfaceDepth } from "../appSurfaceDepth";

export interface LiquidMaterialSurfaceProps extends ViewProps {
  active?: boolean;
}

/**
 * Checkpoint 4 tonal fallback for selective Liquid chrome.
 *
 * This surface intentionally does not capture, blur, or refract its backdrop.
 * It proves semantic tone, depth, edge light, and touch response while the
 * native optical renderer remains behind the feasibility decision gate.
 */
export function LiquidMaterialSurface({
  active = false,
  children,
  style,
  ...rest
}: LiquidMaterialSurfaceProps) {
  const { colors, effects, motion, shapes, states } = useTheme();
  const reducedMotion = useReducedMotion();

  const depthStyle = useMemo(
    () =>
      resolveAndroidSurfaceDepth(
        "medium",
        effects.shadows.medium,
        Number(Platform.Version),
      ),
    [effects.shadows.medium],
  );

  return (
    <Animated.View
      {...rest}
      style={[
        styles.surface,
        {
          backgroundColor: colors.surfaceInteractive,
          borderColor: colors.glassBorder,
          borderRadius: shapes.floating,
          transform: [{ scale: reducedMotion || !active ? 1 : states.pressedScale }],
          transitionProperty: "transform",
          transitionDuration: reducedMotion ? "0ms" : `${motion.feedbackMs}ms`,
          transitionTimingFunction: "ease-out",
          ...depthStyle,
        },
        style,
      ]}
    >
      <View
        pointerEvents="none"
        style={[
          styles.edgeLight,
          {
            backgroundColor: active
              ? "rgba(255, 255, 255, 0.62)"
              : "rgba(255, 255, 255, 0.36)",
            borderTopLeftRadius: shapes.floating,
            borderTopRightRadius: shapes.floating,
          },
        ]}
      />
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  surface: {
    overflow: "hidden",
    borderWidth: 1,
  },
  edgeLight: {
    position: "absolute",
    top: 0,
    left: 12,
    right: 12,
    height: 1,
  },
});
