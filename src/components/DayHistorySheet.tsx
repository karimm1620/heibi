import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { AppBottomSheet, AppBottomSheetScrollView } from "./AppBottomSheet";
import { EmptyState } from "./EmptyState";
import { useTranslation } from "../hooks/useTranslation";
import { useHabitsStore } from "../store/useHabitsStore";
import { useTodosStore } from "../store/useTodosStore";
import { radius, spacing, withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { formatLongDate, formatTimeOfDay, parseDateKey } from "../utils/date";

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
 * perlu migrasi schema). Presentation, back, scrim, and scroll/drag handoff
 * are owned by the shared native sheet contract.
 */
export function DayHistorySheet({ dateKey, onClose }: DayHistorySheetProps) {
  const { colors, typography } = useTheme();
  const { t, language } = useTranslation();
  const habits = useHabitsStore((state) => state.habits);
  const habitLogs = useHabitsStore((state) => state.habitLogs);
  const todos = useTodosStore((state) => state.todos);

  const entries = useMemo<HistoryEntry[]>(() => {
    if (!dateKey) return [];

    const habitById = new Map(habits.map((h) => [h.id, h]));

    const fromHabits: HistoryEntry[] = habitLogs
      .filter((log) => log.date === dateKey)
      .map((log) => {
        const habit = habitById.get(log.habitId);
        return {
          id: `habit-${log.id}`,
          label: habit?.name ?? t.dayHistory.deletedHabitFallback,
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
  }, [dateKey, habits, habitLogs, todos, colors.textSecondary, t]);

  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  const headerDate = dateKey ? parseDateKey(dateKey) : null;
  const headerLabel = headerDate ? `${formatLongDate(headerDate, language)} ${headerDate.getFullYear()}` : "";

  return (
    <AppBottomSheet
      visible={dateKey !== null}
      onDismiss={onClose}
      title={headerLabel}
      snapPoints={["50%", "90%"]}
      testID="day-history-sheet"
    >
      <AppBottomSheetScrollView
        style={styles.list}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
      >
        {entries.length === 0 ? (
          <EmptyState
            icon="calendar-blank-outline"
            title={t.dayHistory.emptyTitle}
            description={t.dayHistory.emptyDescription}
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
      </AppBottomSheetScrollView>
    </AppBottomSheet>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
) {
  return StyleSheet.create({
    list: {
      flex: 1,
    },
    listContent: {
      flexGrow: 1,
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
