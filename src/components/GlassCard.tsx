import React from "react";
import { type ViewProps } from "react-native";
import { type M3ElevationKey } from "../theme/material3/tokens";
import { AppSurface, type AppSurfaceElevation } from "./AppSurface";

interface GlassCardProps extends ViewProps {
  /** Optional compatibility tint; defaults to the semantic elevated surface. */
  tintColor?: string;
  radiusSize?: number;
  /** Level elevation M3 (default: level1). */
  elevationLevel?: M3ElevationKey;
}

const elevationMap: Record<M3ElevationKey, AppSurfaceElevation> = {
  level0: "none",
  level1: "low",
  level2: "low",
  level3: "medium",
  level4: "medium",
  level5: "high",
};

/**
 * Compatibility wrapper for existing card call sites. New shared work should
 * prefer AppSurface so Material and Liquid remain semantic, not component-name
 * branches. A GlassCard is intentionally tonal/opaque until optical Android
 * chrome has a dedicated, measured primitive.
 */
export function GlassCard({
  style,
  tintColor,
  radiusSize,
  elevationLevel = "level1",
  children,
  ...rest
}: GlassCardProps) {
  return (
    <AppSurface
      variant="elevated"
      elevation={elevationMap[elevationLevel]}
      radiusSize={radiusSize}
      style={[tintColor ? { backgroundColor: tintColor } : null, style]}
      {...rest}
    >
      {children}
    </AppSurface>
  );
}
