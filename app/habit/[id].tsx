import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useRef, useState } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import {
  PinchGestureHandler,
  type PinchGestureHandlerGestureEvent,
  type PinchGestureHandlerStateChangeEvent,
  State,
} from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../../src/components/AppAlert";
import { GlassCard } from "../../src/components/GlassCard";
import type { HabitIconName } from "../../src/components/HabitIconPicker";
import { HabitHeatmap } from "../../src/components/HabitHeatmap";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useHabitActions } from "../../src/hooks/useHabitActions";
import { useHabitsStore } from "../../src/store/useHabitsStore";
import { spacing } from "../../src/theme/colors";
import { m3ElevationStyle, m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import {
  calculateCompletionRate,
  calculateCurrentStreak,
  getLocalDateKey,
  isWeekdaySelected,
  WEEKDAY_LABELS_SHORT,
} from "../../src/utils/date";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark, material3 } = useTheme();
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const { archiveWithCleanup, unarchiveWithReschedule, deletePermanentlyWithCleanup } =
    useHabitActions();

  const habit = useHabitsStore((s) => s.getHabitById(id));
  const habitLogs = useHabitsStore((s) => s.habitLogs);
  const toggleHabitToday = useHabitsStore((s) => s.toggleHabitToday);

  const completedDateKeys = useMemo(() => {
    if (!habit) return new Set<string>();
    return new Set(
      habitLogs.filter((l) => l.habitId === habit.id).map((l) => l.date),
    );
  }, [habitLogs, habit]);

  const styles = useMemo(
    () => createStyles(colors, typography, material3),
    [colors, typography, material3],
  );

  // Pinch-to-dismiss: pinch ke dalam (nyubit, jari nutup) di layar detail
  // habit ini buat balik ke home — mirip pola "pinch to close" di app foto.
  // Haptic bertingkat: tick ringan tiap ngelewatin ambang batas pas lagi
  // nyubit (biar berasa "makin deket"), notif sukses pas beneran ke-dismiss,
  // tick ringan lagi kalau dilepas sebelum ambang batas (batal, snap balik).
  // Checkpoint 6/7: useState(() => ...) gantiin useRef(...).current buat
  // Animated.Value (hindari react-hooks/refs). crossedThresholdsRef TETAP
  // useRef biasa -- cuma dibaca/ditulis di dalam handler, gak pernah diakses
  // langsung pas render.
  const [pinchScale] = useState(() => new Animated.Value(1));
  const crossedThresholdsRef = useRef<Set<number>>(new Set());
  const HAPTIC_THRESHOLDS = [0.94, 0.86, 0.78];
  const DISMISS_THRESHOLD = 0.72;

  /* eslint-disable react-hooks/refs -- false positive: linter nganggep
     closure `listener` di bawah ini "dibaca pas render" karena
     `Animated.event(...)` dipanggil di render body, tapi
     `crossedThresholdsRef.current` di dalemnya CUMA keeksekusi pas event
     pinch beneran nembak (listener callback), gak pernah pas render itu
     sendiri. */
  const onPinchGestureEvent = Animated.event(
    [{ nativeEvent: { scale: pinchScale } }],
    {
      useNativeDriver: true,
      listener: (event: PinchGestureHandlerGestureEvent) => {
        const scale = event.nativeEvent.scale;
        for (const threshold of HAPTIC_THRESHOLDS) {
          if (scale <= threshold && !crossedThresholdsRef.current.has(threshold)) {
            crossedThresholdsRef.current.add(threshold);
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
          } else if (scale > threshold + 0.03) {
            crossedThresholdsRef.current.delete(threshold);
          }
        }
      },
    },
  );
  /* eslint-enable react-hooks/refs */

  const onPinchHandlerStateChange = (event: PinchGestureHandlerStateChangeEvent) => {
    if (event.nativeEvent.oldState !== State.ACTIVE) return;
    crossedThresholdsRef.current.clear();

    if (event.nativeEvent.scale <= DISMISS_THRESHOLD) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
      Animated.timing(pinchScale, {
        toValue: 0.3,
        duration: 180,
        useNativeDriver: true,
      }).start(() => router.back());
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
      Animated.spring(pinchScale, {
        toValue: 1,
        useNativeDriver: true,
        damping: 16,
        stiffness: 220,
        mass: 0.7,
      }).start();
    }
  };

  const pinchOpacity = pinchScale.interpolate({
    inputRange: [0.3, 1],
    outputRange: [0, 1],
    extrapolate: "clamp",
  });

  if (!habit) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={typography.body}>Habit gak ditemukan.</Text>
      </View>
    );
  }

  const currentStreak = calculateCurrentStreak(habit, completedDateKeys);
  const completionRate = calculateCompletionRate(habit, completedDateKeys);
  const doneToday = completedDateKeys.has(getLocalDateKey());

  const frequencyLabel =
    habit.frequencyType === "daily"
      ? "Setiap hari"
      : WEEKDAY_LABELS_SHORT.filter((_, i) =>
          isWeekdaySelected(habit.weekdaysMask, i),
        ).join(", ") || "Belum ada hari dipilih";

  const handleToggleToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    void toggleHabitToday(habit.id);
  };

  const handleToggleArchive = () => {
    if (habit.archivedAt) {
      void unarchiveWithReschedule(habit);
      return;
    }
    showAlert(
      "Arsipkan habit?",
      `"${habit.name}" gak akan muncul lagi di Today, tapi histori dan streak-nya tetap tersimpan. Bisa diaktifkan lagi kapan saja.`,
      [
        { label: "Batal", style: "cancel" },
        {
          label: "Arsipkan",
          onPress: async () => {
            await archiveWithCleanup(habit);
            router.back();
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    showAlert(
      "Hapus permanen?",
      `Semua histori "${habit.name}" akan hilang selamanya, ini gak bisa di-undo. Kalau cuma mau berhenti tanpa kehilangan histori, pakai "Arsipkan" aja.`,
      [
        { label: "Batal", style: "cancel" },
        {
          label: "Hapus",
          style: "destructive",
          onPress: async () => {
            await deletePermanentlyWithCleanup(habit);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <PinchGestureHandler
        onGestureEvent={onPinchGestureEvent}
        onHandlerStateChange={onPinchHandlerStateChange}
      >
        <Animated.View
          key={isDark ? "dark" : "light"}
          style={[
            styles.container,
            { transform: [{ scale: pinchScale }], opacity: pinchOpacity },
          ]}
        >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60 },
        ]}
      >
        <View style={styles.headerRow}>
          <View
            style={[styles.iconCircle, { backgroundColor: `${habit.color}33` }]}
          >
            <MaterialCommunityIcons
              name={habit.icon as HabitIconName}
              size={26}
              color={habit.color}
            />
          </View>
        </View>

        <Text style={styles.title}>{habit.name}</Text>
        <Text style={typography.caption}>
          {frequencyLabel}
          {habit.reminderTime ? ` · ${habit.reminderTime}` : ""}
        </Text>

        <View style={styles.statsRow}>
          <GlassCard style={styles.statCard} elevationLevel="level1">
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>day streak</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} elevationLevel="level1">
            <Text style={styles.statValue}>{habit.bestStreak}</Text>
            <Text style={styles.statLabel}>best streak</Text>
          </GlassCard>
          <GlassCard style={styles.statCard} elevationLevel="level1">
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>30 hari terakhir</Text>
          </GlassCard>
        </View>

        <View style={styles.metaRow}>
          <Pressable
            onPress={() => router.push(`/habit/add?id=${habit.id}`)}
            accessibilityRole="button"
            accessibilityLabel="Edit habit ini"
          >
            <Text style={[styles.metaLink, { color: colors.textSecondary }]}>
              Edit habit
            </Text>
          </Pressable>
          <Pressable
            onPress={handleToggleArchive}
            accessibilityRole="button"
            accessibilityLabel={
              habit.archivedAt ? "Batalkan arsip habit ini" : "Arsipkan habit ini"
            }
          >
            <Text style={[styles.metaLink, { color: colors.textSecondary }]}>
              {habit.archivedAt ? "Batalkan arsip" : "Arsipkan"}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel="Hapus habit ini permanen"
          >
            <Text style={[styles.metaLink, { color: colors.danger }]}>
              Hapus permanen
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>History</Text>
        <GlassCard style={styles.heatmapCard} elevationLevel="level1">
          <HabitHeatmap habit={habit} completedDateKeys={completedDateKeys} />
        </GlassCard>

        <Pressable
          onPress={handleToggleToday}
          style={[
            styles.markButton,
            {
              backgroundColor: doneToday
                ? material3.secondaryContainer
                : habit.color,
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={
            doneToday
              ? `Tandai ${habit.name} belum selesai hari ini`
              : `Tandai ${habit.name} sudah selesai hari ini`
          }
          android_ripple={{ color: colors.glassBorder }}
        >
          {doneToday && (
            <MaterialCommunityIcons
              name="check"
              size={18}
              color={material3.onSecondaryContainer}
            />
          )}
          <Text
            style={[
              styles.markButtonText,
              {
                color: doneToday
                  ? material3.onSecondaryContainer
                  : material3.onPrimary,
              },
            ]}
          >
            {doneToday ? "Sudah selesai hari ini" : "Tandai selesai hari ini"}
          </Text>
        </Pressable>
      </ScrollView>
        </Animated.View>
      </PinchGestureHandler>

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  material3: ReturnType<typeof useTheme>["material3"],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    headerRow: {
      flexDirection: "row",
      marginBottom: spacing.sm,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: m3Shape.full,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...typography.display,
      fontSize: 24,
      marginTop: spacing.sm,
    },
    statsRow: {
      flexDirection: "row",
      gap: spacing.sm,
      marginTop: spacing.lg,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      paddingVertical: spacing.md,
    },
    statValue: {
      ...typography.title,
    },
    statLabel: {
      ...typography.caption,
      marginTop: 2,
      textAlign: "center",
    },
    metaRow: {
      flexDirection: "row",
      gap: spacing.lg,
      marginTop: spacing.lg,
    },
    metaLink: {
      ...typography.caption,
      fontWeight: "600",
    },
    sectionTitle: {
      ...typography.caption,
      fontWeight: "700",
      textTransform: "uppercase",
      marginTop: spacing.xl,
      marginBottom: spacing.sm,
    },
    heatmapCard: {
      padding: spacing.md,
    },
    markButton: {
      marginTop: spacing.xl,
      borderRadius: m3Shape.full,
      paddingVertical: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      overflow: "hidden",
      ...m3ElevationStyle("level1"),
    },
    markButtonText: {
      ...typography.subtitle,
    },
  });
}
