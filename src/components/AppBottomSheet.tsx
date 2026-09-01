import {
  BottomSheet as ExpoBottomSheet,
  BottomSheetScrollView,
  BottomSheetView,
} from "@expo/ui/community/bottom-sheet";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { type ReactNode, useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useTranslation } from "../hooks/useTranslation";
import { spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { LiquidMaterialSurface } from "./liquid/LiquidMaterialSurface";
import {
  resolveAppBottomSheetIndex,
  resolveAppBottomSheetMaterial,
} from "./sheets/appBottomSheetContract";

export { BottomSheetScrollView as AppBottomSheetScrollView };

interface AppBottomSheetProps {
  visible: boolean;
  onDismiss: () => void;
  title: string;
  children: ReactNode;
  snapPoints?: (string | number)[];
  testID?: string;
}

/**
 * Shared Android transient-surface contract.
 *
 * The installed SDK 57 `@expo/ui` implementation owns system-back, scrim,
 * swipe dismissal, scroll handoff, and IME behavior in a native Material 3
 * modal sheet. Liquid uses the established tonal material here: the native
 * sheet is hosted in a separate dialog window, so the activity backdrop is
 * not available to the bounded optical capture view without a heavier
 * cross-window renderer.
 */
export function AppBottomSheet({
  visible,
  onDismiss,
  title,
  children,
  snapPoints,
  testID,
}: AppBottomSheetProps) {
  const { colors, shapes, states, typography, visualTheme } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const material = resolveAppBottomSheetMaterial(visualTheme);
  const styles = useMemo(
    () =>
      StyleSheet.create({
        surface: {
          backgroundColor: colors.surface,
          borderTopLeftRadius: shapes.sheet,
          borderTopRightRadius: shapes.sheet,
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.lg + insets.bottom,
        },
        liquidSurface: {
          backgroundColor: colors.surfaceInteractive,
          borderBottomLeftRadius: 0,
          borderBottomRightRadius: 0,
        },
        fill: {
          flex: 1,
        },
        header: {
          minHeight: states.minTouchTarget,
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.sm,
          marginBottom: spacing.sm,
        },
        title: {
          ...typography.subtitle,
          color: colors.textPrimary,
          flex: 1,
        },
        closeButton: {
          width: states.minTouchTarget,
          height: states.minTouchTarget,
          borderRadius: shapes.full,
          alignItems: "center",
          justifyContent: "center",
          overflow: "hidden",
        },
      }),
    [colors, insets.bottom, shapes, states.minTouchTarget, typography],
  );

  const content = (
    <>
      <View style={styles.header}>
        <Text accessibilityRole="header" style={styles.title} numberOfLines={2}>
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t.common.close}
          onPress={onDismiss}
          style={styles.closeButton}
          android_ripple={{ color: colors.glassBorder, borderless: true }}
          hitSlop={4}
        >
          <MaterialCommunityIcons name="close" size={24} color={colors.textPrimary} />
        </Pressable>
      </View>
      {children}
    </>
  );

  return (
    <ExpoBottomSheet
      index={resolveAppBottomSheetIndex(visible)}
      snapPoints={snapPoints}
      enableDynamicSizing={!snapPoints}
      enablePanDownToClose
      onClose={onDismiss}
      backgroundStyle={{
        backgroundColor: material === "liquid-tonal" ? colors.surfaceInteractive : colors.surface,
      }}
    >
      <BottomSheetView style={snapPoints ? styles.fill : undefined}>
        {material === "liquid-tonal" ? (
          <LiquidMaterialSurface
            accessibilityViewIsModal={visible}
            accessibilityElementsHidden={!visible}
            importantForAccessibility={visible ? "yes" : "no-hide-descendants"}
            style={[styles.surface, snapPoints ? styles.fill : null, styles.liquidSurface]}
            testID={testID}
          >
            {content}
          </LiquidMaterialSurface>
        ) : (
          <View
            accessibilityViewIsModal={visible}
            accessibilityElementsHidden={!visible}
            importantForAccessibility={visible ? "yes" : "no-hide-descendants"}
            style={[styles.surface, snapPoints ? styles.fill : null]}
            testID={testID}
          >
            {content}
          </View>
        )}
      </BottomSheetView>
    </ExpoBottomSheet>
  );
}
