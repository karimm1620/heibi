import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { m3ElevationStyle } from "../theme/material3/tokens";
import { buildM3FullTypeScale } from "../theme/material3/typography";
import { useTheme } from "../theme/useTheme";
import {
  bottomNavigationAccessibilityState,
  type BottomNavigationPresentationProps,
} from "./navigation/bottom-navigation-contract";
import { BOTTOM_NAVIGATION_CONTENT_HEIGHT } from "./navigation/bottom-navigation-layout";
import { resolvePressFeedback } from "./pressFeedback";

export const MATERIAL_NAV_BAR_HEIGHT = BOTTOM_NAVIGATION_CONTENT_HEIGHT;

export function MaterialNavigationBar({
  bottomInset,
  destinations,
  onDestinationPress,
}: BottomNavigationPresentationProps) {
  const { colors, material3, shapes, states, visualTheme } = useTheme();
  const pressFeedback = resolvePressFeedback({
    visualTheme,
    states,
    color: material3.onSurfaceVariant,
    radius: 32,
  });
  const typeScale = useMemo(
    () => buildM3FullTypeScale(colors.textPrimary, colors.textSecondary),
    [colors.textPrimary, colors.textSecondary],
  );

  return (
    <View
      style={[
        styles.bar,
        m3ElevationStyle("level2"),
        {
          backgroundColor: colors.surface,
          height: MATERIAL_NAV_BAR_HEIGHT + bottomInset,
          paddingBottom: bottomInset,
        },
      ]}
    >
      {destinations.map((destination) => {
        const iconName = destination.selected
          ? (destination.iconActive ?? destination.icon)
          : destination.icon;

        return (
          <Pressable
            key={destination.key}
            accessibilityLabel={destination.label}
            accessibilityRole="tab"
            accessibilityState={bottomNavigationAccessibilityState(
              destination.selected,
            )}
            android_ripple={pressFeedback.androidRipple}
            onPress={() => onDestinationPress(destination)}
            pressRetentionOffset={12}
            style={styles.destination}
          >
            <View
              style={[
                styles.iconContainer,
                destination.selected && {
                  backgroundColor: colors.selected,
                  borderRadius: shapes.full,
                },
              ]}
            >
              <MaterialCommunityIcons
                color={
                  destination.selected ? colors.onSelected : colors.textSecondary
                }
                name={iconName}
                size={22}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                typeScale.labelMedium,
                {
                  color: destination.selected
                    ? colors.textPrimary
                    : colors.textSecondary,
                  fontWeight: destination.selected ? "700" : "500",
                },
              ]}
            >
              {destination.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  destination: {
    flex: 1,
    minHeight: 48,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    marginVertical: 8,
    marginHorizontal: 2,
    paddingTop: 4,
    borderRadius: 32,
    overflow: "hidden",
  },
  iconContainer: {
    width: 64,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
});
