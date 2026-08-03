import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { radius, spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";

export type SwipeIconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

export interface SwipeAction {
  label: string;
  icon: SwipeIconName;
  color: string;
  onPress: () => void;
}

interface SwipeableRowProps {
  children: React.ReactNode;
  /** Aksi cepat pas swipe KIRI (row digeser ke kiri, tombol muncul dari kanan) — 1 aksi utama. */
  quickAction?: SwipeAction;
  /** Menu lengkap pas swipe KANAN (row digeser ke kanan, menu muncul dari kiri) — bisa >1 aksi. */
  menuActions?: SwipeAction[];
}

const ACTION_WIDTH = 68;

/**
 * Wrapper swipe-to-reveal-actions buat row Habit/Todo. Pakai `Swipeable`
 * KLASIK dari react-native-gesture-handler (BUKAN `ReanimatedSwipeable`) —
 * SENGAJA, karena app ini gak pakai Reanimated sama sekali (dihapus dari
 * awal project, lihat PROJECT_CONTEXT.md).
 *
 * Checkpoint 5b: aksi yang kereveal sekarang chip ROUNDED dengan inset
 * (bukan blok kotak full-height nempel ke tepi row kayak sebelumnya) --
 * ada backdrop warna `colors.surface` di belakangnya biar transisi ke row
 * list yang flat (gak ada card individual, cuma divider) gak kerasa
 * "cutout" tiba-tiba pas digeser.
 */
export function SwipeableRow({ children, quickAction, menuActions }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);

  const closeAndRun = (action: SwipeAction) => {
    swipeableRef.current?.close();
    action.onPress();
  };

  return (
    <Swipeable
      ref={swipeableRef}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      rightThreshold={40}
      leftThreshold={40}
      renderRightActions={
        quickAction
          ? () => (
              <View style={[styles.actionsBackdrop]}>
                <ActionButton action={quickAction} onPress={closeAndRun} />
              </View>
            )
          : undefined
      }
      renderLeftActions={
        menuActions && menuActions.length > 0
          ? () => (
              <View
                style={[
                  styles.actionsBackdrop,
                  styles.leftActionsRow,
                ]}
              >
                {menuActions.map((action) => (
                  <ActionButton key={action.label} action={action} onPress={closeAndRun} />
                ))}
              </View>
            )
          : undefined
      }
    >
      {children}
    </Swipeable>
  );
}

function ActionButton({
  action,
  onPress,
}: {
  action: SwipeAction;
  onPress: (action: SwipeAction) => void;
}) {
  const { typography } = useTheme();
  return (
    <Pressable
      onPress={() => onPress(action)}
      style={[styles.actionButton, { backgroundColor: action.color }]}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <MaterialCommunityIcons name={action.icon} size={18} color="#FFFFFF" />
      <Text style={[typography.caption, styles.actionLabel]} numberOfLines={1}>
        {action.label}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  actionsBackdrop: {
    justifyContent: "center",
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
  },
  actionButton: {
    width: ACTION_WIDTH,
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "stretch",
    marginHorizontal: spacing.xs / 2,
    borderRadius: radius.sm,
  },
  actionLabel: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 10,
    marginTop: 2,
  },
  leftActionsRow: {
    flexDirection: "row",
  },
});
