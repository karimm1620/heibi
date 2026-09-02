import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useEffect, useRef, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import Animated, {
  ReduceMotion,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { OriginalLiquidGlassSurface } from "../../../modules/expo-liquid-glass";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { spacing, withOpacity } from "../../theme/colors";
import { useTheme } from "../../theme/useTheme";
import {
  bottomNavigationAccessibilityState,
  resolveLiquidIndicatorMotion,
  resolveLiquidNavigationRefreshKey,
  type BottomNavigationPresentationProps,
} from "./bottom-navigation-contract";
import { BOTTOM_NAVIGATION_INSET_GAP } from "./bottom-navigation-layout";

const LIQUID_NAVIGATION_HEIGHT = 72;
const LIQUID_INDICATOR_INSET = spacing.xs;

export function LiquidNavigationBar({
  bottomInset,
  destinations,
  onDestinationPress,
  selectedIndex,
}: BottomNavigationPresentationProps) {
  const { colors, isDark, motion, shapes, states, typography } = useTheme();
  const reducedMotion = useReducedMotion();
  const [barWidth, setBarWidth] = useState(0);
  const indicatorX = useSharedValue(0);
  const previousWidth = useRef(0);
  const hasPositionedIndicator = useRef(false);
  const itemWidth = destinations.length > 0 ? barWidth / destinations.length : 0;
  const refreshKey = resolveLiquidNavigationRefreshKey(selectedIndex, isDark);

  useEffect(() => {
    if (itemWidth <= 0) return;

    const target = selectedIndex * itemWidth + LIQUID_INDICATOR_INSET;
    const hasStableLayout =
      hasPositionedIndicator.current && previousWidth.current === barWidth;
    const mode = resolveLiquidIndicatorMotion(reducedMotion, hasStableLayout);

    indicatorX.set(
      mode === "spring"
        ? withSpring(target, {
            ...motion.selectionSpring,
            reduceMotion: ReduceMotion.System,
          })
        : target,
    );

    hasPositionedIndicator.current = true;
    previousWidth.current = barWidth;
  }, [
    barWidth,
    indicatorX,
    itemWidth,
    motion.selectionSpring,
    reducedMotion,
    selectedIndex,
  ]);

  const indicatorStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: indicatorX.get() }],
  }));

  const handleLayout = (event: LayoutChangeEvent) => {
    const nextWidth = event.nativeEvent.layout.width;
    setBarWidth((currentWidth) =>
      Math.abs(currentWidth - nextWidth) < 0.5 ? currentWidth : nextWidth,
    );
  };

  return (
    <OriginalLiquidGlassSurface
      interactionEnabled={false}
      materialTone="navigation"
      onLayout={handleLayout}
      refreshKey={refreshKey}
      style={[
        styles.bar,
        {
          bottom: Math.max(0, bottomInset) + BOTTOM_NAVIGATION_INSET_GAP,
          borderRadius: shapes.floating,
          height: LIQUID_NAVIGATION_HEIGHT,
        },
      ]}
    >
      {itemWidth > 0 ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.indicator,
            {
              backgroundColor: withOpacity(colors.selected, isDark ? 0.58 : 0.52),
              borderColor: colors.glassBorder,
              borderRadius: shapes.full,
              width: Math.max(0, itemWidth - LIQUID_INDICATOR_INSET * 2),
            },
            indicatorStyle,
          ]}
        />
      ) : null}

      <View style={styles.destinations}>
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
              onPress={() => onDestinationPress(destination)}
              pressRetentionOffset={12}
              style={({ pressed }) => [
                styles.destination,
                {
                  minHeight: states.minTouchTarget,
                  opacity: pressed ? states.pressedOpacity : 1,
                },
              ]}
            >
              <MaterialCommunityIcons
                color={
                  destination.selected ? colors.onSelected : colors.textSecondary
                }
                name={iconName}
                size={23}
              />
              <Text
                numberOfLines={1}
                style={[
                  typography.caption,
                  styles.label,
                  {
                    color: destination.selected
                      ? colors.onSelected
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
    </OriginalLiquidGlassSurface>
  );
}

const styles = StyleSheet.create({
  bar: {
    position: "absolute",
    left: spacing.sm,
    right: spacing.sm,
    overflow: "hidden",
  },
  indicator: {
    position: "absolute",
    left: 0,
    top: spacing.sm,
    bottom: spacing.sm,
    borderWidth: 1,
  },
  destinations: {
    flex: 1,
    flexDirection: "row",
  },
  destination: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: spacing.xs,
  },
  label: {
    textAlign: "center",
  },
});
