import type { BottomTabBarProps } from "expo-router/js-tabs";
import * as Haptics from "expo-haptics";
import React, { useCallback, useMemo } from "react";
import { useTranslation } from "../../hooks/useTranslation";
import { useTheme } from "../../theme/useTheme";
import { MaterialNavigationBar } from "../MaterialNavigationBar";
import { TAB_META } from "../TabMeta";
import {
  resolveBottomNavigationVariant,
  shouldCommitTabSelection,
  type BottomNavigationDestination,
} from "./bottom-navigation-contract";
import { LiquidNavigationBar } from "./liquid-navigation-bar";

export function BottomNavigation({
  state,
  navigation,
  insets,
}: BottomTabBarProps) {
  const { visualTheme } = useTheme();
  const { t } = useTranslation();
  const variant = resolveBottomNavigationVariant(visualTheme);

  const destinations = useMemo<BottomNavigationDestination[]>(
    () =>
      state.routes.map((route, index) => {
        const meta = TAB_META[route.name] ?? {
          icon: "help-circle-outline" as const,
        };

        return {
          ...meta,
          index,
          key: route.key,
          label: t.tabs[route.name as keyof typeof t.tabs] ?? route.name,
          name: route.name,
          selected: state.index === index,
        };
      }),
    [state.index, state.routes, t],
  );

  const handleDestinationPress = useCallback(
    (destination: BottomNavigationDestination) => {
      const event = navigation.emit({
        type: "tabPress",
        target: destination.key,
        canPreventDefault: true,
      });

      if (!shouldCommitTabSelection(destination.selected, event.defaultPrevented)) {
        return;
      }

      Haptics.selectionAsync().catch(() => {});
      navigation.navigate(destination.name);
    },
    [navigation],
  );

  const presentationProps = {
    bottomInset: insets.bottom,
    destinations,
    onDestinationPress: handleDestinationPress,
    selectedIndex: state.index,
  };

  return variant === "liquid" ? (
    <LiquidNavigationBar {...presentationProps} />
  ) : (
    <MaterialNavigationBar {...presentationProps} />
  );
}
