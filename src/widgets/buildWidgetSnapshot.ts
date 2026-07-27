import type { Goal, Habit, HabitLog } from "../types";
import { getLocalDateKey, isHabitDueOnDate } from "../utils/date";

/** Sama kayak window `calculateCompletionRate` (utils/date.ts) & tab History. */
export const WIDGET_HEATMAP_WINDOW_DAYS = 30;

export interface WidgetSnapshotGoal {
  id: string;
  name: string;
  emoji?: string;
  currentAmount: number;
  targetAmount: number;
}

export interface WidgetSnapshotHeatmapDay {
  dateKey: string;
  /** 0..1 — rasio habit due yang completed di hari itu. */
  ratio: number;
}

export interface WidgetSnapshot {
  generatedAt: number;
  goals: WidgetSnapshotGoal[];
  /** Terurut LAMA -> BARU, `WIDGET_HEATMAP_WINDOW_DAYS` hari terakhir. */
  heatmap: WidgetSnapshotHeatmapDay[];
}

/**
 * Bangun snapshot data buat widget native (Kotlin gak pernah baca SQLite
 * langsung, lihat catatan di `WidgetUpdater.kt` checkpoint 4a). Rasio
 * heatmap dihitung pakai logic yang SAMA kayak
 * `buildHabitConsistencyHeatmap` (utils/date.ts, dipakai tab History) —
 * biar angka yang ditampilin widget konsisten sama yang di app, bukan
 * rumus terpisah yang gampang divergen.
 */
export function buildWidgetSnapshot(
  goals: Pick<Goal, "id" | "name" | "emoji" | "currentAmount" | "targetAmount">[],
  habits: Pick<Habit, "id" | "frequencyType" | "weekdaysMask" | "archivedAt">[],
  habitLogs: Pick<HabitLog, "habitId" | "date">[],
  referenceDate: Date = new Date(),
): WidgetSnapshot {
  const activeHabits = habits.filter((h) => !h.archivedAt);
  const completedSetByHabit = new Map<string, Set<string>>();
  for (const habit of activeHabits) {
    completedSetByHabit.set(
      habit.id,
      new Set(habitLogs.filter((l) => l.habitId === habit.id).map((l) => l.date)),
    );
  }

  const cursor = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const days: WidgetSnapshotHeatmapDay[] = [];
  for (let i = 0; i < WIDGET_HEATMAP_WINDOW_DAYS; i++) {
    const dateKey = getLocalDateKey(cursor);
    let due = 0;
    let done = 0;
    for (const habit of activeHabits) {
      if (isHabitDueOnDate(habit, dateKey)) {
        due++;
        if (completedSetByHabit.get(habit.id)?.has(dateKey)) done++;
      }
    }
    days.push({ dateKey, ratio: due > 0 ? done / due : 0 });
    cursor.setDate(cursor.getDate() - 1);
  }
  days.reverse();

  return {
    generatedAt: Date.now(),
    goals: goals.map((g) => ({
      id: g.id,
      name: g.name,
      emoji: g.emoji,
      currentAmount: g.currentAmount,
      targetAmount: g.targetAmount,
    })),
    heatmap: days,
  };
}
