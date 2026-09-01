import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type React from "react";
import type { VisualTheme } from "../../theme/visualTheme";

export type BottomNavigationVariant = "material" | "liquid";
export type BottomNavigationIconName = React.ComponentProps<
  typeof MaterialCommunityIcons
>["name"];

export interface BottomNavigationDestination {
  icon: BottomNavigationIconName;
  iconActive?: BottomNavigationIconName;
  index: number;
  key: string;
  label: string;
  name: string;
  selected: boolean;
}

export interface BottomNavigationPresentationProps {
  bottomInset: number;
  destinations: readonly BottomNavigationDestination[];
  onDestinationPress: (destination: BottomNavigationDestination) => void;
  selectedIndex: number;
}

export function resolveBottomNavigationVariant(
  visualTheme: VisualTheme,
): BottomNavigationVariant {
  return visualTheme === "liquid" ? "liquid" : "material";
}

export function shouldCommitTabSelection(
  selected: boolean,
  defaultPrevented: boolean,
): boolean {
  return !selected && !defaultPrevented;
}

export function bottomNavigationAccessibilityState(selected: boolean) {
  return { selected } as const;
}

export function resolveLiquidIndicatorMotion(
  reducedMotion: boolean,
  hasStableLayout: boolean,
): "immediate" | "spring" {
  return reducedMotion || !hasStableLayout ? "immediate" : "spring";
}

/** Invalidates the bounded capture when either route or system appearance changes. */
export function resolveLiquidNavigationRefreshKey(
  selectedIndex: number,
  isDark: boolean,
): number {
  return selectedIndex * 2 + (isDark ? 1 : 0);
}
