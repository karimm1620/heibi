import { getAccentColors } from "../theme/colors";
import type { Goal, Habit, HabitLog, Transaction } from "../types";
import {
  calculateCurrentStreak,
  getLocalDateKey,
  isHabitDueOnDate,
} from "../utils/date";

/** Sesuai desain widget baru -- strip 2 minggu per habit, bukan grid 30 hari agregat. */
export const WIDGET_HABIT_ROW_WINDOW_DAYS = 14;
/** Batas jumlah baris habit yang dikirim; widget nyaring lagi sisanya sesuai ukurannya sendiri. */
export const WIDGET_MAX_HABIT_ROWS = 8;
export const WIDGET_MAX_TRANSACTIONS = 120;

export interface WidgetSnapshotGoal {
  id: string;
  name: string;
  emoji?: string;
  currentAmount: number;
  targetAmount: number;
  createdAt: number;
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
  dueToday: boolean;
  /** Terurut LAMA -> BARU, `WIDGET_HABIT_ROW_WINDOW_DAYS` hari terakhir. */
  days: WidgetSnapshotHabitDay[];
}

export interface WidgetSnapshotTransaction {
  id: string;
  goalId: string;
  type: Transaction["type"];
  amount: number;
  createdAt: number;
}

export interface WidgetSnapshot {
  version: 2;
  generatedAt: number;
  goals: WidgetSnapshotGoal[];
  /** Terurut sesuai `sortOrder` di app, dibatasi `WIDGET_MAX_HABIT_ROWS`. */
  habits: WidgetSnapshotHabitRow[];
  /** Newest-first, bounded history used by saving/chart widgets. */
  transactions: WidgetSnapshotTransaction[];
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
    "id" | "name" | "emoji" | "currentAmount" | "targetAmount" | "createdAt" | "accent"
  >[],
  habits: Pick<
    Habit,
    "id" | "name" | "color" | "frequencyType" | "weekdaysMask" | "archivedAt" | "sortOrder"
  >[],
  habitLogs: Pick<HabitLog, "habitId" | "date">[],
  transactions: Pick<Transaction, "id" | "goalId" | "type" | "amount" | "createdAt">[] = [],
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
      dueToday: isHabitDueOnDate(habit, getLocalDateKey(referenceDate)),
      days,
    };
  });

  return {
    version: 2,
    generatedAt: Date.now(),
    goals: goals.map((g) => {
      const { base, deep } = getAccentColors(g.accent);
      return {
        id: g.id,
        name: g.name,
        emoji: g.emoji,
        currentAmount: g.currentAmount,
        targetAmount: g.targetAmount,
        createdAt: g.createdAt,
        accentBase: base,
        accentDeep: deep,
      };
    }),
    habits: habitRows,
    transactions: [...transactions]
      .sort((a, b) => b.createdAt - a.createdAt || b.id.localeCompare(a.id))
      .slice(0, WIDGET_MAX_TRANSACTIONS)
      .map(({ id, goalId, type, amount, createdAt }) => ({
        id,
        goalId,
        type,
        amount,
        createdAt,
      })),
  };
}
