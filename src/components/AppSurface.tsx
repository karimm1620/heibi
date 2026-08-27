import React, { useMemo } from "react";
import { Platform, StyleSheet, View, type ViewProps } from "react-native";
import { useTheme } from "../theme/useTheme";
import {
  resolveAndroidSurfaceDepth,
  type AppSurfaceElevation,
} from "./appSurfaceDepth";

export type { AppSurfaceElevation } from "./appSurfaceDepth";

export type AppSurfaceVariant =
  | "base"
  | "muted"
  | "elevated"
  | "interactive"
  | "selected"
  | "expressive"
  | "inverse";

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
    const depthStyle = resolveAndroidSurfaceDepth(
      elevation,
      effects.shadows[elevation],
      Number(Platform.Version),
    );

    return {
      backgroundColor,
      borderRadius: radiusSize ?? shapes.card,
      borderCurve: "continuous" as const,
      borderWidth: outlined ? effects.chromeBorderWidth : 0,
      borderColor: colors.outline,
      ...depthStyle,
    };
  }, [colors, effects, elevation, radiusSize, shapes.card, variant]);

  return <View style={[styles.base, semanticStyle, style]} {...rest} />;
}

const styles = StyleSheet.create({
  base: {
    overflow: "hidden",
  },
});
