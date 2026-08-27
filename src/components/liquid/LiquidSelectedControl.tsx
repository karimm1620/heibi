import React, { useState } from "react";
import {
  Pressable,
  StyleSheet,
  Text,
  View,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import Animated from "react-native-reanimated";
import {
  OriginalLiquidGlassSurface,
  type LiquidGlassRendererState,
} from "../../../modules/expo-liquid-glass";
import { useReducedMotion } from "../../hooks/useReducedMotion";
import { spacing, withOpacity } from "../../theme/colors";
import { useTheme } from "../../theme/useTheme";
import { LiquidMaterialSurface } from "./LiquidMaterialSurface";

export interface LiquidSelectedControlOption<T extends string> {
  value: T;
  label: string;
}

export interface LiquidSelectedControlProps<T extends string> {
  accessibilityLabel: string;
  material?: "tonal" | "optical-poc";
  onRendererStateChange?: (state: LiquidGlassRendererState) => void;
  options: readonly LiquidSelectedControlOption<T>[];
  refreshKey?: number;
  style?: StyleProp<ViewStyle>;
  value: T;
  onChange: (value: T) => void;
}

/**
 * Interactive POC for one selected control inside a single material plane.
 * The selected wash is a thin overlay, not a second glass surface.
 */
export function LiquidSelectedControl<T extends string>({
  accessibilityLabel,
  material = "tonal",
  onRendererStateChange,
  options,
  refreshKey = 0,
  style,
  value,
  onChange,
}: LiquidSelectedControlProps<T>) {
  const { colors, isDark, motion, shapes, states, typography } = useTheme();
  const reducedMotion = useReducedMotion();
  const [pressedValue, setPressedValue] = useState<T | null>(null);

  const content = (
    <View
      accessibilityRole="radiogroup"
      accessibilityLabel={accessibilityLabel}
      style={styles.row}
    >
      {options.map((option) => {
        const selected = option.value === value;
        const pressed = option.value === pressedValue;

        return (
          <Pressable
            key={option.value}
            onPress={() => onChange(option.value)}
            onPressIn={() => setPressedValue(option.value)}
            onPressOut={() => setPressedValue(null)}
            accessibilityRole="radio"
            accessibilityLabel={option.label}
            accessibilityState={{ selected }}
            pressRetentionOffset={12}
            style={styles.optionPressable}
          >
            <Animated.View
              style={[
                styles.option,
                {
                  minHeight: states.minTouchTarget,
                  borderRadius: shapes.control,
                  backgroundColor: selected
                    ? withOpacity(colors.selected, isDark ? 0.72 : 0.66)
                    : "transparent",
                  opacity: pressed ? states.pressedOpacity : 1,
                  transform: [{ scale: reducedMotion || !pressed ? 1 : states.pressedScale }],
                  transitionProperty: ["backgroundColor", "transform"],
                  transitionDuration: reducedMotion ? "0ms" : `${motion.transitionMs}ms`,
                  transitionTimingFunction: "ease-out",
                },
              ]}
            >
              <Text
                numberOfLines={1}
                style={[
                  typography.subtitle,
                  styles.label,
                  { color: selected ? colors.onSelected : colors.textSecondary },
                ]}
              >
                {option.label}
              </Text>
            </Animated.View>
          </Pressable>
        );
      })}
    </View>
  );

  if (material === "optical-poc") {
    return (
      <OriginalLiquidGlassSurface
        active={pressedValue !== null}
        onRendererStateChange={onRendererStateChange}
        refreshKey={refreshKey}
        style={[styles.material, style]}
      >
        {content}
      </OriginalLiquidGlassSurface>
    );
  }

  return (
    <LiquidMaterialSurface
      active={pressedValue !== null}
      style={[styles.material, style]}
    >
      {content}
    </LiquidMaterialSurface>
  );
}

const styles = StyleSheet.create({
  material: {
    padding: spacing.xs,
  },
  row: {
    flexDirection: "row",
    gap: spacing.xs,
  },
  optionPressable: {
    flex: 1,
  },
  option: {
    paddingHorizontal: spacing.sm,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  label: {
    fontWeight: "600",
    textAlign: "center",
  },
});
