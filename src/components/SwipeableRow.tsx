import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { radius, spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { usePressFeedback } from "./pressFeedback";

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
// Titik reveal (sama kayak rightThreshold/leftThreshold) -- lewatin ini
// tombol keliatan penuh + haptic tick.
const REVEAL_DISTANCE = 40;

type AnimInterp = Animated.AnimatedInterpolation<number>;
type ListenerHandle = { value: AnimInterp; id: string };

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
 * 57, keputusan yang udah didiskusiin & ditolak beberapa kali). Dicek ulang
 * per Agustus 2026 -- rilis abis 2.32.0 langsung lompat ke v3.0.1/v3.0.2/
 * v3.1.0, GAK ADA patch 2.32.x/2.33.x yang bawa fix ini balik. Jadi TETEP
 * di `Swipeable` klasik, bug-nya masih ada. `Swipeable` klasik gak kena bug
 * ini sama sekali (arsitektur action container-nya beda) -- konsekuensinya
 * cuma warning deprecation di console (COSMETIC doang, gak ngaruh ke user).
 *
 * Checkpoint 5b: aksi yang kereveal chip ROUNDED dengan inset (bukan blok
 * kotak full-height nempel ke tepi row) -- ada backdrop warna
 * `colors.surface` di belakangnya biar transisi ke row list yang flat
 * (gak ada card individual, cuma divider) gak kerasa "cutout" tiba-tiba.
 *
 * Checkpoint 29-31: sempet nyoba nambah animasi pop-in + haptic 2-stage +
 * mode "swipe jauh = auto-eksekusi" ala Gmail archive. Animasi pop-in +
 * haptic reveal-nya KEBUKTI jalan bagus (confirmed via video). Tapi mode
 * auto-eksekusi-nya DIBATALIN setelah 2 ronde percobaan gagal: percobaan
 * pertama COMMIT_DISTANCE-nya gak reachable secara fisik (butuh ~1485px
 * tarikan jari -- salah itung formula overshoot RNGH yang compound sama
 * `friction`). Percobaan kedua abis angkanya dibenerin TETEP gak jalan --
 * dugaan kuat race condition antara `dragX.addListener` (JS thread) yang
 * nentuin status "committed" vs `onSwipeableOpen` (native gesture callback)
 * yang bisa aja kepanggil duluan sebelum listener sempet update, apalagi
 * buat swipe cepat/flick. Daripada trial-error lebih jauh buat fitur yang
 * sifatnya nice-to-have, USER MINTA DI-DROP -- balik ke behavior aman
 * (WAJIB tap tombol buat semua aksi, gak ada auto-eksekusi sama sekali),
 * pop-in animasi + haptic reveal-nya TETEP dipertahanin karena udah
 * confirmed bagus.
 */
export function SwipeableRow({ children, quickAction, menuActions }: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const quickActionListenerRef = useRef<ListenerHandle | null>(null);
  const menuListenerRef = useRef<ListenerHandle | null>(null);

  const closeAndRun = (action: SwipeAction) => {
    swipeableRef.current?.close();
    action.onPress();
  };

  // Haptic tick ringan pas lewatin REVEAL_DISTANCE -- `getDistance` beda
  // formula tergantung sisi (transX NEGATIF pas renderRightActions, POSITIF
  // pas renderLeftActions).
  const attachRevealListener = (
    dragX: AnimInterp,
    listenerRef: React.MutableRefObject<ListenerHandle | null>,
    getDistance: (value: number) => number,
  ) => {
    if (listenerRef.current) {
      listenerRef.current.value.removeListener(listenerRef.current.id);
    }
    let revealed = false;
    const id = dragX.addListener(({ value }) => {
      const distance = getDistance(value);
      const nextRevealed = distance >= REVEAL_DISTANCE;
      if (nextRevealed && !revealed) {
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      }
      revealed = nextRevealed;
    });
    listenerRef.current = { value: dragX, id };
  };

  return (
    <Swipeable
      ref={swipeableRef}
      overshootRight={false}
      overshootLeft={false}
      friction={2}
      rightThreshold={REVEAL_DISTANCE}
      leftThreshold={REVEAL_DISTANCE}
      renderRightActions={
        quickAction
          ? (_progress, dragX) => {
              attachRevealListener(dragX, quickActionListenerRef, (v) => -v);
              return (
                <View style={styles.actionsBackdrop}>
                  <ActionButton action={quickAction} onPress={closeAndRun} dragX={dragX} isRightSide />
                </View>
              );
            }
          : undefined
      }
      renderLeftActions={
        menuActions && menuActions.length > 0
          ? (_progress, dragX) => {
              attachRevealListener(dragX, menuListenerRef, (v) => v);
              return (
                <View style={[styles.actionsBackdrop, styles.leftActionsRow]}>
                  {menuActions.map((action) => (
                    <ActionButton
                      key={action.label}
                      action={action}
                      onPress={closeAndRun}
                      dragX={dragX}
                      isRightSide={false}
                    />
                  ))}
                </View>
              );
            }
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
  dragX,
  isRightSide,
}: {
  action: SwipeAction;
  onPress: (action: SwipeAction) => void;
  dragX: AnimInterp;
  /** true = renderRightActions (transX negatif pas ke-reveal), false = renderLeftActions (positif). */
  isRightSide: boolean;
}) {
  const { colors, typography } = useTheme();
  const pressFeedback = usePressFeedback(colors.textInverse, { radius: radius.sm });

  // Pop-in halus ngikutin jarak drag -- 0.5 (baru mulai keliatan) ke 1
  // (kebuka penuh di REVEAL_DISTANCE), biar kerasa "nyambung" ke jari,
  // bukan nongol instan pas row-nya udah kegeser.
  const scale = isRightSide
    ? dragX.interpolate({
        inputRange: [-REVEAL_DISTANCE, 0],
        outputRange: [1, 0.5],
        extrapolate: "clamp",
      })
    : dragX.interpolate({
        inputRange: [0, REVEAL_DISTANCE],
        outputRange: [0.5, 1],
        extrapolate: "clamp",
      });

  return (
    <Pressable
      onPress={() => onPress(action)}
      android_ripple={pressFeedback.androidRipple}
      style={({ pressed }) => [
        styles.actionButton,
        { backgroundColor: action.color, opacity: pressFeedback.opacity(pressed) },
      ]}
      accessibilityRole="button"
      accessibilityLabel={action.label}
    >
      <Animated.View style={{ transform: [{ scale }], alignItems: "center" }}>
        <MaterialCommunityIcons name={action.icon} size={18} color="#FFFFFF" />
        <Text style={[typography.caption, styles.actionLabel]} numberOfLines={1}>
          {action.label}
        </Text>
      </Animated.View>
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
