import React from "react";
import { StyleSheet, Text, View, type StyleProp, type ViewStyle } from "react-native";
import { spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";

interface ScreenHeadingProps {
  title: string;
  supportingText?: string;
  style?: StyleProp<ViewStyle>;
}

export function ScreenHeading({ title, supportingText, style }: ScreenHeadingProps) {
  const { colors, typography } = useTheme();

  return (
    <View style={[styles.header, style]}>
      <Text accessibilityRole="header" style={[typography.display, styles.title]}>
        {title}
      </Text>
      {supportingText ? (
        <Text style={[typography.body, { color: colors.textSecondary }]}>
          {supportingText}
        </Text>
      ) : null}
    </View>
  );
}

export function SectionHeading({ title }: { title: string }) {
  const { typography } = useTheme();

  return (
    <Text accessibilityRole="header" style={[typography.section, styles.section]}>
      {title}
    </Text>
  );
}

const styles = StyleSheet.create({
  header: {
    gap: spacing.xs,
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
  },
  section: {
    marginTop: spacing.lg,
    marginBottom: spacing.sm,
  },
});
