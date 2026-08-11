import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import ReanimatedSwipeable, { SwipeableMethods } from "react-native-gesture-handler/ReanimatedSwipeable";
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
 * Wrapper swipe-to-reveal-actions buat row Habit/Todo. Checkpoint 16: pindah
 * dari `Swipeable` KLASIK ke `ReanimatedSwipeable` (masih dari
 * `react-native-gesture-handler` v2.32 yang SAMA, cuma beda subpath import
 * -- BUKAN bump ke v3). `Swipeable` klasik udah deprecated di v2.x (nge-
 * warn di console tiap dipake), itu alasan kenapa Expo kerasa "nyuruh
 * update terus" walau app ini gak beneran ketinggalan versi. GH v2.32
 * TETEP dipertahankan (persis versi yang di-bundle SDK 57) -- migrasi ini
 * CUMA ganti API yang dipake di dalam versi yang sama, bukan ngangkat
 * versi major GH-nya. Reanimated sendiri emang udah ada di project dari
 * Checkpoint 14 (habit completion) & 15 (kalender), jadi ini gak nambah
 * dependency baru.
 *
 * `ref` sekarang bertipe `SwipeableMethods` (API baru), bukan instance
 * `Swipeable` langsung -- tapi method `.close()` yang dipake di sini
 * signature-nya sama persis, gak ada perubahan behavior kerasa dari sisi
 * pemanggil (`HabitRow`/`TodoRow`).
 *
 * Checkpoint 5b: aksi yang kereveal chip ROUNDED dengan inset (bukan blok
 * kotak full-height nempel ke tepi row) -- ada backdrop warna
 * `colors.surface` di belakangnya biar transisi ke row list yang flat
 * (gak ada card individual, cuma divider) gak kerasa "cutout" tiba-tiba.
 */
export function SwipeableRow({ children, quickAction, menuActions }: SwipeableRowProps) {
  const swipeableRef = useRef<SwipeableMethods>(null);

  const closeAndRun = (action: SwipeAction) => {
    swipeableRef.current?.close();
    action.onPress();
  };

  return (
    <ReanimatedSwipeable
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
    </ReanimatedSwipeable>
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
