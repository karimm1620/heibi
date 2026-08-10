import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "./EmptyState";
import { useSheetMotion } from "../hooks/useSheetMotion";
import { useHabitsStore } from "../store/useHabitsStore";
import { useTodosStore } from "../store/useTodosStore";
import { radius, spacing, withOpacity } from "../theme/colors";
import { m3ElevationStyle, m3Shape } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";
import { formatIndonesianDate, formatTimeOfDay, parseDateKey } from "../utils/date";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface DayHistorySheetProps {
  /** `null` = sheet tertutup. */
  dateKey: string | null;
  onClose: () => void;
}

interface HistoryEntry {
  id: string;
  label: string;
  icon: IconName;
  color: string;
  completedAt: number;
}

/**
 * Bottom sheet riwayat 1 hari -- dibuka dari tap tanggal di
 * `WeekCalendarStrip`. Gabungan habit yang di-complete + tugas yang
 * diselesaikan di tanggal itu, diurutin kronologis pagi->malam pake
 * timestamp `completedAt` yang emang udah kesimpen di DB dari awal (gak
 * perlu migrasi schema). Reuse `useSheetMotion` yang sama kayak dipakai
 * `ReminderSheet`/`goal/[id].tsx`.
 */
export function DayHistorySheet({ dateKey, onClose }: DayHistorySheetProps) {
  const { colors, typography } = useTheme();
  const insets = useSafeAreaInsets();
  const habits = useHabitsStore((state) => state.habits);
  const habitLogs = useHabitsStore((state) => state.habitLogs);
  const todos = useTodosStore((state) => state.todos);

  const { mounted, backdropOpacity, sheetTranslateY, dragHandlers } = useSheetMotion({
    visible: dateKey !== null,
    onDismiss: onClose,
  });

  const entries = useMemo<HistoryEntry[]>(() => {
    if (!dateKey) return [];

    const habitById = new Map(habits.map((h) => [h.id, h]));

    const fromHabits: HistoryEntry[] = habitLogs
      .filter((log) => log.date === dateKey)
      .map((log) => {
        const habit = habitById.get(log.habitId);
        return {
          id: `habit-${log.id}`,
          label: habit?.name ?? "Habit terhapus",
          icon: (habit?.icon ?? "check-circle") as IconName,
          color: habit?.color ?? colors.textSecondary,
          completedAt: log.completedAt,
        };
      });

    const fromTodos: HistoryEntry[] = todos
      .filter((todo) => todo.date === dateKey && todo.completedAt !== null)
      .map((todo) => ({
        id: `todo-${todo.id}`,
        label: todo.title,
        icon: "checkbox-marked-circle-outline" as IconName,
        color: colors.textSecondary,
        completedAt: todo.completedAt as number,
      }));

    return [...fromHabits, ...fromTodos].sort((a, b) => a.completedAt - b.completedAt);
  }, [dateKey, habits, habitLogs, todos, colors.textSecondary]);

  const styles = useMemo(
    () => createStyles(colors, typography, insets.bottom),
    [colors, typography, insets.bottom],
  );

  if (!mounted) return null;

  const headerDate = dateKey ? parseDateKey(dateKey) : null;
  const headerLabel = headerDate ? `${formatIndonesianDate(headerDate)} ${headerDate.getFullYear()}` : "";

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheetCard, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View style={styles.grabber} hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }} {...dragHandlers} />
          <Text style={styles.title}>{headerLabel}</Text>

          <ScrollView style={styles.list} showsVerticalScrollIndicator={false}>
            {entries.length === 0 ? (
              <EmptyState
                icon="calendar-blank-outline"
                title="Belum ada aktivitas"
                description="Gak ada habit atau tugas yang diselesaikan di tanggal ini."
              />
            ) : (
              entries.map((entry) => (
                <View key={entry.id} style={styles.entryRow}>
                  <View style={[styles.entryIcon, { backgroundColor: withOpacity(entry.color, 0.16) }]}>
                    <MaterialCommunityIcons name={entry.icon} size={18} color={entry.color} />
                  </View>
                  <Text style={[typography.body, styles.entryLabel, { color: colors.textPrimary }]} numberOfLines={1}>
                    {entry.label}
                  </Text>
                  <Text style={[typography.caption, { color: colors.textSecondary }]}>
                    {formatTimeOfDay(entry.completedAt)}
                  </Text>
                </View>
              ))
            )}
          </ScrollView>
        </Animated.View>
      </View>
    </Modal>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  bottomInset: number,
) {
  return StyleSheet.create({
    backdrop: {
      flex: 1,
      backgroundColor: colors.overlayScrim,
    },
    sheetWrapper: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
    sheetCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: m3Shape.extraLarge,
      borderTopRightRadius: m3Shape.extraLarge,
      padding: spacing.lg,
      paddingBottom: spacing.lg + bottomInset,
      maxHeight: "70%",
      ...m3ElevationStyle("level1"),
    },
    grabber: {
      width: 40,
      height: 5,
      borderRadius: radius.pill,
      backgroundColor: colors.glassBorder,
      alignSelf: "center",
      marginBottom: spacing.md,
    },
    title: {
      ...typography.subtitle,
      marginBottom: spacing.md,
    },
    list: {
      flexGrow: 0,
    },
    entryRow: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
      paddingVertical: spacing.sm,
    },
    entryIcon: {
      width: 32,
      height: 32,
      borderRadius: radius.md,
      alignItems: "center",
      justifyContent: "center",
    },
    entryLabel: {
      flex: 1,
    },
  });
}
