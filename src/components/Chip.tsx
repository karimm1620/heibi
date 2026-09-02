import React from "react";
import { Pressable, StyleSheet, Text, type AccessibilityRole } from "react-native";
import { spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { resolvePressFeedback } from "./pressFeedback";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  accessibilityRole?: AccessibilityRole;
  disabled?: boolean;
}

export function Chip({
  label,
  selected,
  onPress,
  accessibilityLabel,
  accessibilityRole = "button",
  disabled = false,
}: ChipProps) {
  const { colors, shapes, states, typography, visualTheme } = useTheme();
  const pressFeedback = resolvePressFeedback({
    visualTheme,
    states,
    color: selected ? colors.onSelected : colors.primary,
    disabled,
    radius: shapes.control,
  });

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole={accessibilityRole}
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      android_ripple={pressFeedback.androidRipple}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      pressRetentionOffset={12}
      style={({ pressed }) => [
        styles.chip,
        {
          ...(selected ? shapes.selected : { borderRadius: shapes.content }),
          backgroundColor: selected ? colors.selected : "transparent",
          borderColor: selected ? "transparent" : colors.outline,
          opacity: pressFeedback.opacity(pressed),
        },
      ]}
    >
      <Text
        style={[
          typography.body,
          styles.label,
          {
            color: selected ? colors.onSelected : colors.textSecondary,
          },
        ]}
        numberOfLines={1}
      >
        {label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    height: 36,
    paddingHorizontal: spacing.md,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  label: {
    fontWeight: "500",
  },
});
