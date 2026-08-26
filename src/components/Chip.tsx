import React from "react";
import { Pressable, StyleSheet, Text } from "react-native";
import { spacing, withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";

interface ChipProps {
  label: string;
  selected: boolean;
  onPress: () => void;
  accessibilityLabel?: string;
  disabled?: boolean;
}

export function Chip({ label, selected, onPress, accessibilityLabel, disabled = false }: ChipProps) {
  const { colors, shapes, states, typography } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel ?? label}
      accessibilityState={{ selected, disabled }}
      disabled={disabled}
      android_ripple={{ color: withOpacity(colors.onSelected, states.rippleOpacity) }}
      hitSlop={{ top: 6, bottom: 6, left: 4, right: 4 }}
      pressRetentionOffset={12}
      style={({ pressed }) => [
        styles.chip,
        {
          borderRadius: shapes.content,
          backgroundColor: selected ? colors.selected : "transparent",
          borderColor: selected ? "transparent" : colors.outline,
          opacity: disabled
            ? states.disabledOpacity
            : pressed
              ? states.pressedOpacity
              : 1,
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
