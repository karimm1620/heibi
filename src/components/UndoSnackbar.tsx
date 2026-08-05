import React, { useEffect, useMemo, useRef, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { UNDO_WINDOW_MS, useGoalsStore } from "../store/useGoalsStore";
import { spacing } from "../theme/colors";
import { m3Motion } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { GlassCard } from "./GlassCard";

// Harus konsisten sama ukuran nyata di Fab.tsx (56dp tombol + jarak aman)
// -- dulu UndoSnackbar & Fab dapet `bottomOffset` yang SAMA persis, jadi
// snackbar (full width) numpuk pas di belakang FAB (pojok kanan-bawah).
// Sekarang snackbar digeser naik biar duduk DI ATAS FAB, bukan sejajar.
const FAB_HEIGHT = 56;
const FAB_SNACKBAR_GAP = spacing.sm;

export function UndoSnackbar({ bottomOffset = 0 }: { bottomOffset?: number }) {
  const { colors, typography } = useTheme();
  const reducedMotion = useReducedMotion();
  const pendingDeletion = useGoalsStore((s) => s.pendingDeletion);
  const undoDelete = useGoalsStore((s) => s.undoDelete);
  const commitPendingDeletion = useGoalsStore((s) => s.commitPendingDeletion);

  const [mounted, setMounted] = useState(false);
  // Checkpoint 9: useState(() => ...) gantiin useRef(...).current buat
  // Animated.Value. timerRef TETAP useRef biasa -- cuma dibaca/ditulis di
  // dalam effect/cleanup, gak pernah diakses langsung pas render.
  const [translateY] = useState(() => new Animated.Value(120));
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Checkpoint 9: dulu `setMounted(true)` dipanggil sinkron di awal body
  // useEffect -- kena react-hooks/set-state-in-effect. Dipindah ke
  // "adjusting state during render" (pola sama kayak goal/add.tsx &
  // habit/add.tsx): begitu ada pendingDeletion BARU (dibedain lewat
  // deletedAt), langsung mounted=true di render itu juga, gak nunggu extra
  // render dari effect. `setMounted(false)` di bawah TETAP di dalam
  // callback `.start()` animasi (async, bukan sinkron di body effect) jadi
  // udah lint-clean dari awal, gak perlu dipindah.
  const [trackedDeletionAt, setTrackedDeletionAt] = useState<number | null>(null);
  if (pendingDeletion && pendingDeletion.deletedAt !== trackedDeletionAt) {
    setTrackedDeletionAt(pendingDeletion.deletedAt);
    setMounted(true);
  }

  useEffect(() => {
    if (pendingDeletion) {
      if (reducedMotion) {
        Animated.timing(translateY, {
          toValue: 0,
          duration: 1,
          useNativeDriver: true,
        }).start();
      } else {
        Animated.timing(translateY, {
          toValue: 0,
          duration: m3Motion.duration.medium2,
          easing: Easing.bezier(...m3Motion.easing.emphasizedDecelerate),
          useNativeDriver: true,
        }).start();
      }

      const elapsed = Date.now() - pendingDeletion.deletedAt;
      const remaining = Math.max(0, UNDO_WINDOW_MS - elapsed);
      timerRef.current = setTimeout(() => {
        void commitPendingDeletion();
      }, remaining);
    } else if (mounted) {
      Animated.timing(translateY, {
        toValue: 120,
        duration: reducedMotion ? 1 : m3Motion.duration.short3,
        easing: reducedMotion ? undefined : Easing.bezier(...m3Motion.easing.emphasizedAccelerate),
        useNativeDriver: true,
      }).start(() => setMounted(false));
    }

    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [pendingDeletion, commitPendingDeletion, mounted, translateY, reducedMotion]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        wrapper: {
          position: "absolute",
          left: spacing.lg,
          right: spacing.lg,
          bottom: spacing.md + bottomOffset + FAB_HEIGHT + FAB_SNACKBAR_GAP,
        },
        card: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.md,
          paddingHorizontal: spacing.lg,
        },
        text: {
          ...typography.body,
          flex: 1,
          marginRight: spacing.md,
        },
        undoText: {
          ...typography.subtitle,
          color: colors.deposit,
        },
      }),
    [colors, typography, bottomOffset],
  );

  if (!mounted) return null;

  return (
    <View style={styles.wrapper} pointerEvents="box-none">
      <Animated.View style={{ transform: [{ translateY }] }}>
        <GlassCard tintColor={colors.surface} style={styles.card}>
          <Text style={styles.text} numberOfLines={1}>
            {pendingDeletion?.goal.name} dihapus
          </Text>
          <Pressable
            onPress={() => void undoDelete()}
            hitSlop={8}
            accessibilityRole="button"
            accessibilityLabel="Batalkan penghapusan goal"
          >
            <Text style={styles.undoText}>Undo</Text>
          </Pressable>
        </GlassCard>
      </Animated.View>
    </View>
  );
}