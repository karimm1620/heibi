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
 * Wrapper swipe-to-reveal-actions buat row Habit/Todo.
 *
 * Checkpoint 23: BALIK ke `Swipeable` KLASIK, ngebalikin keputusan
 * Checkpoint 16 (pindah ke `ReanimatedSwipeable`). Alasannya: user laporan
 * tombol aksi hasil swipe (Edit/Arsip/Hapus) GAK BISA DI-TEKEN sama sekali
 * di Android -- ternyata itu bug KONFIRMASI di upstream
 * `react-native-gesture-handler` sendiri (issue #3223 & PR fix #4192, gak
 * spesifik ke kode project ini). Root cause: container aksi kiri/kanan di
 * `ReanimatedSwipeable` itu absolute-fill overlay yang di-animate ke
 * `opacity: 0` pas gak keliatan -- TAPI di Android, View opacity-0 TETAP
 * nerima sentuhan, jadi sisi yang lagi HIDDEN nutupin z-order dan nyegat
 * tap yang seharusnya nyampe ke sisi yang keliatan (atau ke row content
 * itu sendiri). Ini kejadian walau cuma 1 sisi (`renderRightActions` ATAU
 * `renderLeftActions`) yang dipake -- sisi yang gak dipake tetep bikin
 * container kosong yang nyegat tap, makanya Habit (2 sisi) MAUPUN Todo (1
 * sisi doang) sama-sama kena.
 *
 * Fix resminya (PR #4192, nambahin `pointerEvents: 'none'` pas hidden)
 * UDAH di-merge ke `main` GH 16 Juni 2026 -- TAPI versi stabil yang
 * kepasang sekarang (`2.32.0`, persis yang di-bundle SDK 57) di-publish 11
 * Juni 2026, 5 HARI SEBELUM fix itu ke-merge. Belum ada rilis `2.32.x`
 * yang bawa fix ini balik (backport) -- fix-nya baru masuk di seri v3.x,
 * dan project ini SENGAJA gak mau bump ke v3 (belum ke-test Expo buat SDK
 * 57, keputusan yang udah didiskusiin & ditolak beberapa kali). `Swipeable`
 * klasik gak kena bug ini sama sekali (arsitektur action container-nya
 * beda) -- makanya balik ke situ, walau konsekuensinya warning deprecation
 * di console balik lagi (COSMETIC doang, gak ngaruh ke user, bukan
 * fungsional). Kalau GH ngeluarin `2.32.x`/`2.33.x` patch yang bawa fix
 * ini, ReanimatedSwipeable bisa dicoba lagi -- CEK DULU changelog-nya
 * sebelum migrasi ulang, jangan asumsi otomatis fixed.
 *
 * Checkpoint 5b: aksi yang kereveal chip ROUNDED dengan inset (bukan blok
 * kotak full-height nempel ke tepi row) -- ada backdrop warna
 * `colors.surface` di belakangnya biar transisi ke row list yang flat
 * (gak ada card individual, cuma divider) gak kerasa "cutout" tiba-tiba.
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
