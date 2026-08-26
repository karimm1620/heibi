import React, { useEffect, useMemo, useState } from "react";
import {
  Animated,
  Easing,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  View,
} from "react-native";
import type { AppAlertButton } from "../hooks/useAppAlert";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { spacing } from "../theme/colors";
import { m3Motion } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";
import { AppButton } from "./AppButton";
import { AppSurface } from "./AppSurface";

interface AppAlertProps {
  visible: boolean;
  title: string;
  message?: string;
  buttons: AppAlertButton[];
  onClose: () => void;
}

export function AppAlert({
  visible,
  title,
  message,
  buttons,
  onClose,
}: AppAlertProps) {
  const { colors, typography } = useTheme();
  const reducedMotion = useReducedMotion();
  // Checkpoint 9: useState(() => ...) gantiin useRef(...).current buat
  // Animated.Value (hindari react-hooks/refs) -- restore rule ke "error".
  const [scale] = useState(() => new Animated.Value(0.9));
  const [opacity] = useState(() => new Animated.Value(0));

  useEffect(() => {
    if (visible) {
      if (reducedMotion) {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: 1,
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: 1,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(opacity, {
            toValue: 1,
            duration: m3Motion.duration.short4,
            easing: Easing.bezier(...m3Motion.easing.standardDecelerate),
            useNativeDriver: true,
          }),
          Animated.timing(scale, {
            toValue: 1,
            duration: m3Motion.duration.short4,
            easing: Easing.bezier(...m3Motion.easing.emphasizedDecelerate),
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else {
      opacity.setValue(0);
      scale.setValue(0.9);
    }
  }, [visible, reducedMotion, opacity, scale]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        backdrop: {
          flex: 1,
          backgroundColor: colors.overlayScrim,
        },
        centerWrap: {
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          alignItems: "center",
          justifyContent: "center",
          paddingHorizontal: spacing.xl,
        },
        card: {
          width: "100%",
          maxWidth: 340,
        },
        cardContent: {
          padding: spacing.lg,
        },
        title: {
          ...typography.subtitle,
          textAlign: "center",
        },
        message: {
          ...typography.body,
          color: colors.textSecondary,
          textAlign: "center",
          marginTop: spacing.sm,
        },
        buttonRow: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginTop: spacing.lg,
          justifyContent: "center",
          flexWrap: "wrap",
        },
        button: {
          minWidth: 96,
          flexGrow: 1,
        },
      }),
    [colors, typography],
  );

  const handlePress = (button: AppAlertButton) => {
    onClose();
    button.onPress?.();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.backdrop, { opacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View style={styles.centerWrap} pointerEvents="box-none">
        <Animated.View
          style={[styles.card, { transform: [{ scale }], opacity }]}
        >
          <AppSurface variant="elevated" elevation="medium" style={styles.cardContent}>
            <Text style={styles.title} selectable>
              {title}
            </Text>
            {message ? (
              <Text style={styles.message} selectable>
                {message}
              </Text>
            ) : null}

            <View style={styles.buttonRow}>
              {buttons.map((btn, index) => {
                const isDestructive = btn.style === "destructive";
                const isCancel =
                  btn.style === "cancel" ||
                  (!btn.style && buttons.length > 1 && index === 0);

                return (
                  <AppButton
                    key={`${btn.label}-${index}`}
                    label={btn.label}
                    variant={isDestructive ? "danger" : isCancel ? "ghost" : "primary"}
                    size="compact"
                    style={styles.button}
                    accessibilityLabel={btn.label}
                    onPress={() => handlePress(btn)}
                  />
                );
              })}
            </View>
          </AppSurface>
        </Animated.View>
      </View>
    </Modal>
  );
}
