import { getAccentColors } from "../theme/colors";
import type { Goal, Habit, HabitLog } from "../types";
import {
  calculateCurrentStreak,
  getLocalDateKey,
} from "../utils/date";

/** Sesuai desain widget baru -- strip 2 minggu per habit, bukan grid 30 hari agregat. */
export const WIDGET_HABIT_ROW_WINDOW_DAYS = 14;
/** Batas jumlah baris habit yang dikirim; widget nyaring lagi sisanya sesuai ukurannya sendiri. */
export const WIDGET_MAX_HABIT_ROWS = 8;

export interface WidgetSnapshotGoal {
  id: string;
  name: string;
  emoji?: string;
  currentAmount: number;
  targetAmount: number;
  /** Hex, resolve dari `AccentKey` goal itu sendiri -- bukan satu warna fix buat semua goal. */
  accentBase: string;
  accentDeep: string;
}

export interface WidgetSnapshotHabitDay {
  dateKey: string;
  done: boolean;
}

export interface WidgetSnapshotHabitRow {
  id: string;
  name: string;
  /** Hex warna habit itu sendiri (`habit.color`), dipakai buat dot & strip cell. */
  colorHex: string;
  currentStreak: number;
  /** Terurut LAMA -> BARU, `WIDGET_HABIT_ROW_WINDOW_DAYS` hari terakhir. */
  days: WidgetSnapshotHabitDay[];
}

export interface WidgetSnapshot {
  generatedAt: number;
  goals: WidgetSnapshotGoal[];
  /** Terurut sesuai `sortOrder` di app, dibatasi `WIDGET_MAX_HABIT_ROWS`. */
  habits: WidgetSnapshotHabitRow[];
}

/**
 * Bangun snapshot data buat widget native (Kotlin gak pernah baca SQLite
 * langsung, lihat catatan di `WidgetUpdater.kt` checkpoint 4a). Due/done per
 * hari & current streak dihitung pakai fungsi yang SAMA persis dipakai
 * in-app (`isHabitDueOnDate`, `calculateCurrentStreak`) -- biar angka di
 * widget gak pernah divergen dari yang ditampilin di app.
 */
export function buildWidgetSnapshot(
  goals: Pick<
    Goal,
    "id" | "name" | "emoji" | "currentAmount" | "targetAmount" | "accent"
  >[],
  habits: Pick<
    Habit,
    "id" | "name" | "color" | "frequencyType" | "weekdaysMask" | "archivedAt" | "sortOrder"
  >[],
  habitLogs: Pick<HabitLog, "habitId" | "date">[],
  referenceDate: Date = new Date(),
): WidgetSnapshot {
  const activeHabits = [...habits]
    .filter((h) => !h.archivedAt)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .slice(0, WIDGET_MAX_HABIT_ROWS);

  const habitRows: WidgetSnapshotHabitRow[] = activeHabits.map((habit) => {
    const completedDateKeys = new Set(
      habitLogs.filter((l) => l.habitId === habit.id).map((l) => l.date),
    );

    const cursor = new Date(
      referenceDate.getFullYear(),
      referenceDate.getMonth(),
      referenceDate.getDate(),
    );
    const days: WidgetSnapshotHabitDay[] = [];
    for (let i = 0; i < WIDGET_HABIT_ROW_WINDOW_DAYS; i++) {
      const dateKey = getLocalDateKey(cursor);
      days.push({ dateKey, done: completedDateKeys.has(dateKey) });
      cursor.setDate(cursor.getDate() - 1);
    }
    days.reverse();

    return {
      id: habit.id,
      name: habit.name,
      colorHex: habit.color,
      currentStreak: calculateCurrentStreak(habit, completedDateKeys, referenceDate),
      days,
    };
  });

  return {
    generatedAt: Date.now(),
    goals: goals.map((g) => {
      const { base, deep } = getAccentColors(g.accent);
      return {
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount,
        accentBase: base,
        accentDeep: deep,
      };
    }),
    habits: habitRows,
  };
}
