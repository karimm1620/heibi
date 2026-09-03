import type { Habit, HabitLog } from "../../types";
import {
  buildWidgetSnapshot,
  WIDGET_HABIT_ROW_WINDOW_DAYS,
  WIDGET_MAX_HABIT_ROWS,
} from "../buildWidgetSnapshot";

function habit(
  id: string,
  sortOrder: number,
  overrides: Partial<Habit> = {},
): Habit {
  return {
    id,
    name: `Habit ${id}`,
    icon: "check",
    color: "#6FAEDE",
    frequencyType: "daily",
    weekdaysMask: 0,
    reminderTime: null,
    notificationId: null,
    bestStreak: 0,
    createdAt: 1,
    archivedAt: null,
    sortOrder,
    ...overrides,
  };
}

function log(habitId: string, date: string): HabitLog {
  return { id: `${habitId}-${date}`, habitId, date, completedAt: 1 };
}

describe("buildWidgetSnapshot", () => {
  it("maps exactly 14 local calendar days oldest to newest", () => {
    const reference = new Date(2026, 8, 14, 12, 0, 0);
    const snapshot = buildWidgetSnapshot(
      [],
      [habit("a", 0)],
      [log("a", "2026-09-01"), log("a", "2026-09-14")],
      [],
      reference,
    );

    const row = snapshot.habits[0];
    expect(row.days).toHaveLength(WIDGET_HABIT_ROW_WINDOW_DAYS);
    expect(row.days[0]).toEqual({ dateKey: "2026-09-01", done: true });
    expect(row.days.at(-1)).toEqual({ dateKey: "2026-09-14", done: true });
    expect(row.days[1]).toEqual({ dateKey: "2026-09-02", done: false });
    expect(row.currentStreak).toBe(1);
    expect(row.dueToday).toBe(true);
    expect(row.colorHex).toBe("#6FAEDE");
  });

  it("filters archived habits, preserves sort order, and bounds native rows", () => {
    const habits = [
      habit("archived", -1, { archivedAt: 10 }),
      ...Array.from({ length: WIDGET_MAX_HABIT_ROWS + 2 }, (_, index) =>
        habit(String(index), WIDGET_MAX_HABIT_ROWS + 2 - index),
      ),
    ];

    const rows = buildWidgetSnapshot([], habits, [], [], new Date(2026, 8, 14)).habits;

    expect(rows).toHaveLength(WIDGET_MAX_HABIT_ROWS);
    expect(rows.map((row) => row.id)).toEqual(["9", "8", "7", "6", "5", "4", "3", "2"]);
    expect(rows.some((row) => row.id === "archived")).toBe(false);
  });

  it("extends the versioned snapshot with bounded newest-first transactions", () => {
    const snapshot = buildWidgetSnapshot(
      [],
      [],
      [],
      [
        { id: "older", goalId: "g", type: "deposit", amount: 100, createdAt: 1 },
        { id: "newer", goalId: "g", type: "withdrawal", amount: 20, createdAt: 2 },
      ],
      new Date(2026, 8, 14),
    );

    expect(snapshot.version).toBe(2);
    expect(snapshot.transactions.map((transaction) => transaction.id)).toEqual([
      "newer",
      "older",
    ]);
  });
});
