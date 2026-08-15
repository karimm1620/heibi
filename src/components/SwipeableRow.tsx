import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
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
  /**
   * Swipe JAUH ngelewatin COMMIT_DISTANCE + DILEPAS = `quickAction` auto-
   * jalan (ala Gmail archive), gak perlu tap tombol. Default `false` --
   * WAJIB opt-in eksplisit per pemakaian, JANGAN nyalain ke SEMUA quickAction
   * tanpa mikir: kalau quickAction-nya destructive (misal Hapus, lihat Todo
   * row di `app/(tabs)/index.tsx`) auto-eksekusi via swipe jauh itu resiko
   * gak sengaja ke-trigger tanpa konfirmasi. Cuma cocok buat aksi yang aman/
   * reversible (Arsip di Habit row).
   */
  quickActionAutoExecute?: boolean;
  /** Menu lengkap pas swipe KANAN (row digeser ke kanan, menu muncul dari kiri) — bisa >1 aksi. */
  menuActions?: SwipeAction[];
}

const ACTION_WIDTH = 68;
// Titik reveal (sama kayak rightThreshold/leftThreshold) -- lewatin ini
// tombol keliatan penuh + haptic tick pertama.
const REVEAL_DISTANCE = 40;
// Checkpoint <next>: titik "commit" ala Gmail archive -- lewatin jarak ini
// terus DILEPAS, quickAction LANGSUNG jalan otomatis (gak perlu nge-tap
// tombol lagi). ~2.6x lebar tombol -- cukup jauh biar gak ke-trigger gak
// sengaja, tapi masih kepegang natural (gak kejauhan sampe kerasa berat).
// SENGAJA cuma di quickAction (1 aksi jelas, ala "archive") -- BUKAN di
// menuActions (>1 pilihan kayak Edit/Arsip/Hapus, auto-eksekusi salah
// satu di situ ambigu & beresiko -- misal gak sengaja "Hapus" ke-trigger).
const COMMIT_DISTANCE = ACTION_WIDTH * 2.6;

type SwipeStage = "idle" | "revealed" | "committed";
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
 * 57, keputusan yang udah didiskusiin & ditolak beberapa kali). Checkpoint
 * <next>: DICEK ULANG changelog GH (per Agustus 2026) -- rilis abis 2.32.0
 * langsung lompat ke v3.0.1/v3.0.2/v3.1.0, GAK ADA patch 2.32.x/2.33.x yang
 * bawa fix ini balik. Jadi TETEP di `Swipeable` klasik, bug-nya masih ada.
 * `Swipeable` klasik gak kena bug ini sama sekali (arsitektur action
 * container-nya beda) -- konsekuensinya cuma warning deprecation di
 * console (COSMETIC doang, gak ngaruh ke user, bukan fungsional).
 *
 * Checkpoint 5b: aksi yang kereveal chip ROUNDED dengan inset (bukan blok
 * kotak full-height nempel ke tepi row) -- ada backdrop warna
 * `colors.surface` di belakangnya biar transisi ke row list yang flat
 * (gak ada card individual, cuma divider) gak kerasa "cutout" tiba-tiba.
 *
 * Checkpoint <next>: nambah animasi reveal (icon pop-in ngikutin jarak
 * drag) + haptic 2-stage (tick ringan pas lewatin REVEAL_DISTANCE, tick
 * lebih tegas pas lewatin COMMIT_DISTANCE) + mode "swipe jauh = auto-
 * eksekusi" ala Gmail archive KHUSUS quickAction. Dibangun di atas
 * `Swipeable` klasik yang sama (gak butuh Reanimated/v3) -- `transX` yang
 * dipassing render-prop itu `AnimatedInterpolation` STABIL (dicek langsung
 * dari source RNGH: dibikin sekali di constructor, cuma di-`setValue(0)`
 * pas nutup, BUKAN diciptain ulang tiap gesture) jadi aman di-`addListener`.
 */
export function SwipeableRow({
  children,
  quickAction,
  quickActionAutoExecute = false,
  menuActions,
}: SwipeableRowProps) {
  const swipeableRef = useRef<Swipeable>(null);
  const hasCommittedRef = useRef(false);
  const quickActionListenerRef = useRef<ListenerHandle | null>(null);
  const menuListenerRef = useRef<ListenerHandle | null>(null);

  const closeAndRun = (action: SwipeAction) => {
    swipeableRef.current?.close();
    action.onPress();
  };

  // `getDistance` beda formula tergantung sisi -- transX NEGATIF pas
  // renderRightActions (row digeser ke KIRI), POSITIF pas renderLeftActions
  // (row digeser ke KANAN). `isCommitTracked` cuma true buat quickAction
  // (satu-satunya sisi yang boleh auto-eksekusi).
  const attachStageListener = (
    dragX: AnimInterp,
    listenerRef: React.MutableRefObject<ListenerHandle | null>,
    getDistance: (value: number) => number,
    isCommitTracked: boolean,
  ) => {
    if (listenerRef.current) {
      listenerRef.current.value.removeListener(listenerRef.current.id);
    }
    let stage: SwipeStage = "idle";
    const id = dragX.addListener(({ value }) => {
      const distance = getDistance(value);
      let nextStage: SwipeStage = "idle";
      if (isCommitTracked && distance >= COMMIT_DISTANCE) {
        nextStage = "committed";
      } else if (distance >= REVEAL_DISTANCE) {
        nextStage = "revealed";
      }

      if (nextStage !== stage) {
        if (nextStage === "revealed" && stage === "idle") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
        } else if (nextStage === "committed") {
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium).catch(() => {});
        }
        stage = nextStage;
      }
      if (isCommitTracked) {
        hasCommittedRef.current = nextStage === "committed";
      }
    });
    listenerRef.current = { value: dragX, id };
  };

  return (
    <Swipeable
      ref={swipeableRef}
      overshootRight={quickActionAutoExecute}
      overshootLeft={false}
      overshootFriction={8}
      friction={2}
      rightThreshold={REVEAL_DISTANCE}
      leftThreshold={REVEAL_DISTANCE}
      onSwipeableOpen={(direction) => {
        // Swipe jauh ngelewatin COMMIT_DISTANCE terus DILEPAS -- daripada
        // dibiarin "kebuka" (nunggu di-tap), langsung jalanin quickAction
        // & tutup lagi, ala Gmail full-swipe-to-archive.
        if (direction === "right" && quickActionAutoExecute && hasCommittedRef.current && quickAction) {
          hasCommittedRef.current = false;
          closeAndRun(quickAction);
        }
      }}
      renderRightActions={
        quickAction
          ? (_progress, dragX) => {
              attachStageListener(dragX, quickActionListenerRef, (v) => -v, quickActionAutoExecute);
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
              attachStageListener(dragX, menuListenerRef, (v) => v, false);
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
  const { typography } = useTheme();

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
      style={[styles.actionButton, { backgroundColor: action.color }]}
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
