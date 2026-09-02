import React, { useMemo } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  type PressableProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { resolvePressFeedback } from "./pressFeedback";

export type AppButtonVariant = "primary" | "secondary" | "ghost" | "danger" | "inverse";
export type AppButtonSize = "compact" | "medium" | "large";

export interface AppButtonProps
  extends Omit<PressableProps, "children" | "disabled" | "style"> {
  label: string;
  variant?: AppButtonVariant;
  size?: AppButtonSize;
  loading?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

export function AppButton({
  label,
  variant = "primary",
  size = "medium",
  loading = false,
  disabled = false,
  accessibilityLabel = label,
  style,
  ...rest
}: AppButtonProps) {
  const { colors, shapes, states, typography, visualTheme } = useTheme();
  const blocked = disabled || loading;

  const variantTokens = useMemo(
    () => ({
      primary: { background: colors.primary, foreground: colors.onPrimary },
      secondary: { background: colors.selected, foreground: colors.onSelected },
      ghost: { background: "transparent", foreground: colors.primary },
      danger: { background: colors.danger, foreground: colors.onDanger },
      inverse: { background: "transparent", foreground: colors.inverseAction },
    }),
    [colors],
  );
  const tokens = variantTokens[variant];
  const pressFeedback = resolvePressFeedback({
    visualTheme,
    states,
    color: tokens.foreground,
    disabled: blocked,
    radius: shapes.control,
  });

  return (
    <Pressable
      {...rest}
      disabled={blocked}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ ...rest.accessibilityState, disabled: blocked, busy: loading }}
      pressRetentionOffset={rest.pressRetentionOffset ?? 12}
      android_ripple={pressFeedback.androidRipple}
      style={({ pressed }) => [
        styles.base,
        styles[size],
        {
          minHeight: states.minTouchTarget,
          borderRadius: shapes.control,
          backgroundColor: tokens.background,
          opacity: pressFeedback.opacity(pressed),
        },
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={tokens.foreground} />
      ) : (
        <Text
          style={[typography.subtitle, styles.label, { color: tokens.foreground }]}
          numberOfLines={1}
        >
          {label}
        </Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  compact: {
    paddingHorizontal: spacing.md,
  },
  medium: {
    paddingHorizontal: spacing.lg,
  },
  large: {
    paddingHorizontal: spacing.xl,
  },
  label: {
    textAlign: "center",
  },
});
