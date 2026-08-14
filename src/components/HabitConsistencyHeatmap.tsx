import React, { useEffect, useMemo, useRef } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useTranslation } from "../hooks/useTranslation";
import { spacing, withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import type { Habit, HabitLog } from "../types";
import { buildHabitConsistencyHeatmap } from "../utils/date";

const CELL_SIZE = 11;
const CELL_GAP = 3;
const WEEKS_TO_SHOW = 20;

interface HabitConsistencyHeatmapProps {
  habits: Habit[];
  habitLogs: HabitLog[];
}

/**
 * Heatmap GABUNGAN (semua habit aktif, bukan per-habit) — dipasang di atas
 * tab History (di bawah list transaksi savings tetap seperti biasa). BEDA
 * dari `HabitHeatmap.tsx` (yang dipakai di `habit/[id].tsx`, per-habit,
 * SENGAJA gak disentuh) — di sini warna cell berdasarkan RASIO completion
 * hari itu (0 habit selesai -> kosong, semua habit due selesai -> warna
 * penuh), pakai satu warna aksen (M3 primary), bukan warna per-habit,
 * karena ini ringkasan gabungan.
 */
export function HabitConsistencyHeatmap({
  habits,
  habitLogs,
}: HabitConsistencyHeatmapProps) {
  const { colors, typography, material3 } = useTheme();
  const { t, language } = useTranslation();
  const scrollRef = useRef<ScrollView>(null);

  const { weeks, monthLabelByWeekIndex } = useMemo(
    () => buildHabitConsistencyHeatmap(habits, habitLogs, WEEKS_TO_SHOW, new Date(), language),
    [habits, habitLogs, language],
  );

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      scrollRef.current?.scrollToEnd({ animated: false });
    });
    return () => cancelAnimationFrame(frame);
  }, []);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        monthLabel: {
          ...typography.caption,
          fontSize: 10,
          height: 14,
          color: colors.textSecondary,
        },
        column: {
          marginRight: CELL_GAP,
        },
        cell: {
          width: CELL_SIZE,
          height: CELL_SIZE,
          borderRadius: 3,
          marginBottom: CELL_GAP,
        },
      }),
    [typography, colors],
  );

  const cellColor = (ratio: number, isFuture: boolean) => {
    if (isFuture) return "transparent";
    if (ratio <= 0) return colors.surfaceMuted;
    if (ratio <= 0.34) return withOpacity(material3.primary, 0.3);
    if (ratio <= 0.67) return withOpacity(material3.primary, 0.6);
    return material3.primary;
  };

  const hasAnyHabit = habits.some((h) => !h.archivedAt);
  if (!hasAnyHabit) return null;

  return (
    <View>
      <Text style={[typography.caption, { fontWeight: "700", textTransform: "uppercase", marginBottom: spacing.sm }]}>
        {t.history.consistencyHeading}
      </Text>
      <ScrollView ref={scrollRef} horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: "row", paddingRight: spacing.xs }}>
          {weeks.map((week, weekIndex) => (
            <View key={week[0].dateKey} style={styles.column}>
              <Text style={styles.monthLabel} numberOfLines={1}>
                {monthLabelByWeekIndex[weekIndex] ?? ""}
              </Text>
              {week.map((day) => (
                <View
                  key={day.dateKey}
                  style={[
                    styles.cell,
                    { backgroundColor: cellColor(day.ratio, day.isFuture) },
                  ]}
                />
              ))}
            </View>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}
