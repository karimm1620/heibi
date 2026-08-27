import React, { type ReactNode } from "react";
import {
  Pressable,
  StyleSheet,
  View,
  type AccessibilityRole,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { spacing, withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { AppDivider } from "./AppDivider";

interface AppListRowProps {
  children: ReactNode;
  leading?: ReactNode;
  trailing?: ReactNode;
  onPress?: () => void;
  accessibilityRole?: AccessibilityRole;
  accessibilityLabel?: string;
  selected?: boolean;
  disabled?: boolean;
  divider?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppListRow({
  children,
  leading,
  trailing,
  onPress,
  accessibilityRole,
  accessibilityLabel,
  selected = false,
  disabled = false,
  divider = false,
  style,
}: AppListRowProps) {
  const { colors, shapes, states } = useTheme();

  const content = (
    <>
      {leading ? <View style={styles.leading}>{leading}</View> : null}
      <View style={styles.content}>{children}</View>
      {trailing ? <View style={styles.trailing}>{trailing}</View> : null}
      {divider ? <AppDivider style={styles.divider} /> : null}
    </>
  );

  const semanticStyle = {
    minHeight: states.minTouchTarget,
    ...(selected ? shapes.selected : { borderRadius: 0 }),
    backgroundColor: selected ? colors.selected : "transparent",
  };

  if (!onPress) {
    return <View style={[styles.row, semanticStyle, style]}>{content}</View>;
  }

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={accessibilityRole ?? "button"}
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected, disabled }}
      pressRetentionOffset={12}
      android_ripple={{ color: withOpacity(colors.primary, states.rippleOpacity) }}
      style={({ pressed }) => [
        styles.row,
        styles.pressable,
        semanticStyle,
        { opacity: disabled ? states.disabledOpacity : pressed ? states.pressedOpacity : 1 },
        style,
      ]}
    >
      {content}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    position: "relative",
    flexDirection: "row",
    alignItems: "center",
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  pressable: {
    overflow: "hidden",
  },
  leading: {
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    flex: 1,
  },
  trailing: {
    alignItems: "center",
    justifyContent: "center",
  },
  divider: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
});
