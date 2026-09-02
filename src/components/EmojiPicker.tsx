import React, { useMemo } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
} from "react-native";
import { radius, spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { usePressFeedback } from "./pressFeedback";

const EMOJI_OPTIONS = [
  "🎯",
  "💰",
  "🏠",
  "🧳",
  "🚗",
  "🎓",
  "💍",
  "📱",
  "💻",
  "🎮",
  "📷",
  "🚲",
  "⌚️",
  "👟",
  "🎸",
  "🏖️",
  "🐶",
  "👶",
  "🎁",
  "⛑️",
  "🛋️",
  "✈️",
  "🌱",
];

interface EmojiPickerProps {
  selected?: string;
  onSelect: (emoji: string) => void;
}

export function EmojiPicker({ selected, onSelect }: EmojiPickerProps) {
  const { colors, material3 } = useTheme();
  const pressFeedback = usePressFeedback(material3.onSecondaryContainer, {
    radius: radius.md,
  });

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          paddingVertical: spacing.xs,
          gap: spacing.sm,
        },
        item: {
          width: 48,
          height: 48,
          borderRadius: radius.md,
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: colors.surfaceMuted,
          marginRight: spacing.sm,
          borderWidth: 1.5,
          borderColor: "transparent",
          overflow: "hidden",
        },
        itemActive: {
          borderColor: material3.primary,
          backgroundColor: material3.secondaryContainer,
        },
        emoji: {
          fontSize: 22,
        },
      }),
    [colors, material3],
  );

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {EMOJI_OPTIONS.map((emoji) => {
        const isActive = emoji === selected;
        return (
          <Pressable
            key={emoji}
            onPress={() => onSelect(emoji)}
            style={({ pressed }) => [
              styles.item,
              isActive && styles.itemActive,
              { opacity: pressFeedback.opacity(pressed) },
            ]}
            accessibilityRole="button"
            accessibilityLabel={`Pilih ikon ${emoji}`}
            accessibilityState={{ selected: isActive }}
            android_ripple={pressFeedback.androidRipple}
          >
            <Text style={styles.emoji}>{emoji}</Text>
          </Pressable>
        );
      })}
    </ScrollView>
  );
}
