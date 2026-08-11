import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Animated, Modal, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "./EmptyState";
import { useSheetMotion } from "../hooks/useSheetMotion";
import { useTranslation } from "../hooks/useTranslation";
import { useHabitsStore } from "../store/useHabitsStore";
import { useTodosStore } from "../store/useTodosStore";
import { radius, spacing, withOpacity } from "../theme/colors";
import { m3ElevationStyle, m3Shape } from "../theme/material3/tokens";
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
 * perlu migrasi schema). Reuse `useSheetMotion` yang sama kayak dipakai
 * `ReminderSheet`/`goal/[id].tsx`.
 */
export function DayHistorySheet({ dateKey, onClose }: DayHistorySheetProps) {
  const { colors, typography } = useTheme();
  const { t, language } = useTranslation();
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

  const styles = useMemo(
    () => createStyles(colors, typography, insets.bottom),
    [colors, typography, insets.bottom],
  );

  if (!mounted) return null;

  const headerDate = dateKey ? parseDateKey(dateKey) : null;
  const headerLabel = headerDate ? `${formatLongDate(headerDate, language)} ${headerDate.getFullYear()}` : "";

  return (
    <Modal visible={mounted} transparent animationType="none" statusBarTranslucent onRequestClose={onClose}>
      <Animated.View style={[styles.backdrop, { opacity: backdropOpacity }]}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
      </Animated.View>

      <View style={styles.sheetWrapper} pointerEvents="box-none">
        <Animated.View style={[styles.sheetCard, { transform: [{ translateY: sheetTranslateY }] }]}>
          <View style={styles.grabber} hitSlop={{ top: 12, bottom: 12, left: 24, right: 24 }} {...dragHandlers} />
          <Text style={styles.title}>{headerLabel}</Text>

          <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false}>
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
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      justifyContent: "flex-end",
    },
    sheetCard: {
      backgroundColor: colors.surface,
      borderTopLeftRadius: m3Shape.extraLarge,
      borderTopRightRadius: m3Shape.extraLarge,
      padding: spacing.lg,
      paddingBottom: spacing.lg + bottomInset,
      // `minHeight` -- SENGAJA, bukan cuma `maxHeight` -- biar sheet SELALU
      // nutup sampe area tab bar navigasi apapun jumlah entry-nya (0 atau 1
      // entry sebelumnya bikin card mepet/collapse duluan sebelum nutupin
      // tab bar, keliatan "kepotong"). `sheetWrapper` di atas HARUS punya
      // `top:0` (bukan cuma `bottom:0`) biar dia dapet tinggi PASTI dari
      // Modal (full-screen) -- tanpa itu, persentase di sini gak ada
      // ancestor bertinggi pasti buat di-resolve, computed height jadi
      // ambigu (ini yang bikin ScrollView collapse ke ~0 pas isinya dikit).
      minHeight: "50%",
      maxHeight: "80%",
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
      // `flex: 1` (BUKAN `flexGrow: 0` kayak sebelumnya) -- sekarang
      // `sheetCard` punya `minHeight`/`maxHeight` yang well-defined, jadi
      // ScrollView ini boleh & AMAN ngisi sisa ruang yang ada. Ini yang
      // benerin bug "1 entry gak nampil apa-apa" & "EmptyState cuma
      // nongol icon doang" -- sebelumnya ScrollView collapse duluan
      // sebelum sempet render isinya.
      flex: 1,
    },
    listContent: {
      // BUKAN `justifyContent:"center"` -- sempet dicoba tapi kelihatan
      // "ketengah banget" pas isinya cuma 1-2 entry di sheet yang minHeight
      // 50%. List nature-nya emang harus nempel ATAS (`flex-start`, default),
      // biar konsisten sama ekspektasi list pada umumnya & gak keliatan
      // ngambang di tengah ruang kosong.
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
