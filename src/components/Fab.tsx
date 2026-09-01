import React, { useState } from "react";
import { Platform, Pressable, StyleSheet, Text } from "react-native";
import Animated from "react-native-reanimated";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { resolveAndroidSurfaceDepth } from "./appSurfaceDepth";
import { FAB_SIZE } from "./navigation/bottom-navigation-layout";

interface FabProps {
  onPress: () => void;
  icon?: string;
  accessibilityLabel: string;
  bottomOffset: number;
}

export function Fab({ onPress, icon = "+", accessibilityLabel, bottomOffset }: FabProps) {
  const { colors, effects, motion, shapes, states } = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressed, setPressed] = useState(false);
  const depthStyle = resolveAndroidSurfaceDepth(
    "medium",
    effects.shadows.medium,
    Number(Platform.Version),
  );

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: bottomOffset,
          transform: [{ scale: reducedMotion || !pressed ? 1 : states.pressedScale }],
          transitionProperty: "transform",
          transitionDuration: reducedMotion ? "0ms" : `${motion.feedbackMs}ms`,
          transitionTimingFunction: "ease-out",
        },
      ]}
      pointerEvents="box-none"
    >
      <Pressable
        onPress={onPress}
        onPressIn={() => setPressed(true)}
        onPressOut={() => setPressed(false)}
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        android_ripple={{ color: withOpacity(colors.onPrimaryContainer, states.rippleOpacity) }}
        style={[
          styles.fab,
          {
            backgroundColor: colors.primaryContainer,
            borderRadius: shapes.floating,
            ...depthStyle,
            opacity: pressed ? states.pressedOpacity : 1,
          },
        ]}
      >
        <Text style={[styles.icon, { color: colors.onPrimaryContainer }]}>{icon}</Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: "absolute", right: 16 },
  fab: {
    width: FAB_SIZE,
    height: FAB_SIZE,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  icon: { fontSize: 28, fontWeight: "400", marginTop: -2 },
});
