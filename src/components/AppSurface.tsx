import React, { useMemo } from "react";
import { StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "../theme/useTheme";

export type AppSurfaceVariant =
  | "base"
  | "muted"
  | "elevated"
  | "interactive"
  | "selected"
  | "expressive"
  | "inverse";

export type AppSurfaceElevation = "none" | "low" | "medium" | "high";

export interface AppSurfaceProps extends ViewProps {
  variant?: AppSurfaceVariant;
  elevation?: AppSurfaceElevation;
  radiusSize?: number;
}

/**
 * Shared opaque/tonal content surface. Theme adapters may vary tone, shape,
 * border, and depth here without making screen files branch on visualTheme.
 * Optical Liquid chrome is intentionally a different future primitive.
 */
export function AppSurface({
  variant = "elevated",
  elevation = "low",
  radiusSize,
  style,
  ...rest
}: AppSurfaceProps) {
  const { colors, effects, shapes } = useTheme();

  const semanticStyle = useMemo(() => {
    const backgroundColor = {
      base: colors.surface,
      muted: colors.surfaceMuted,
      elevated: colors.surfaceElevated,
      interactive: colors.surfaceInteractive,
      selected: colors.selected,
      expressive: colors.expressiveContainer,
      inverse: colors.inverseSurface,
    }[variant];

    const outlined = variant === "interactive";

    return {
      backgroundColor,
      borderRadius: radiusSize ?? shapes.card,
      borderCurve: "continuous" as const,
      borderWidth: outlined ? effects.chromeBorderWidth : 0,
      borderColor: colors.outline,
      boxShadow: effects.shadows[elevation],
    };
  }, [colors, effects, elevation, radiusSize, shapes.card, variant]);

  return <View style={[styles.base, semanticStyle, style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
