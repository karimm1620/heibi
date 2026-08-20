/* eslint-disable @typescript-eslint/no-require-imports -- `jest.resetModules()`
   di bawah cuma berefek kalau modul (termasuk store Zustand-nya sendiri, yang
   singleton per-module) di-require() ULANG per test, bukan di-`import` statis
   1x di atas. */
import { createTestSqliteDb, type TestSqliteDb } from "../../testUtils/sqliteTestAdapter";
import type { CreateHabitInput, Habit } from "../../types";

beforeEach(() => {
  jest.resetModules();
});

function mockExpoSqliteWith(testDb: TestSqliteDb) {
  jest.doMock("expo-sqlite", () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue(testDb),
  }));
}

/** DB SQLite beneran (schema ter-migrate) + store Zustand yang FRESH — gak ada state nyisa dari test sebelumnya. */
async function setUp() {
  const testDb = await createTestSqliteDb();
  mockExpoSqliteWith(testDb);
  const { initDatabase } = require("../../db/client");
  await initDatabase();
  const { useHabitsStore } = require("../useHabitsStore");
  return { testDb, useHabitsStore };
}

const dailyInput: CreateHabitInput = {
  name: "Baca buku",
  icon: "book",
  color: "blue",
  frequencyType: "daily",
  weekdaysMask: 0,
  reminderTime: null,
};

describe("useHabitsStore — write-through", () => {
  it("addHabit: DB dan state konsisten", async () => {
    const { testDb, useHabitsStore } = await setUp();

    const habit = await useHabitsStore.getState().addHabit(dailyInput);

    expect(useHabitsStore.getState().habits).toEqual([habit]);
    const rows = await testDb.getAllAsync<{ id: string; name: string; best_streak: number }>(
      "SELECT id, name, best_streak FROM habits",
    );
    expect(rows).toEqual([{ id: habit.id, name: "Baca buku", best_streak: 0 }]);
  });

  it("addHabit: habit baru selalu ditaro PALING DEPAN (sortOrder lebih kecil dari yang udah ada)", async () => {
    const { useHabitsStore } = await setUp();

    const first = await useHabitsStore.getState().addHabit({ ...dailyInput, name: "A" });
    const second = await useHabitsStore.getState().addHabit({ ...dailyInput, name: "B" });

    expect(second.sortOrder).toBeLessThan(first.sortOrder);
    expect(useHabitsStore.getState().habits.map((h: Habit) => h.id)).toEqual([
      second.id,
      first.id,
    ]);
  });

  it("updateHabit: field yang di-patch ke-update, field yang gak disentuh TETAP", async () => {
    const { testDb, useHabitsStore } = await setUp();
    const habit = await useHabitsStore.getState().addHabit(dailyInput);

    await useHabitsStore.getState().updateHabit(habit.id, { name: "Baca buku 30 menit" });

    const updated = useHabitsStore.getState().getHabitById(habit.id);
    expect(updated.name).toBe("Baca buku 30 menit");
    expect(updated.icon).toBe("book"); // gak disentuh, tetap
    const row = await testDb.getFirstAsync<{ name: string; icon: string }>(
      "SELECT name, icon FROM habits WHERE id = ?",
      [habit.id],
    );
    expect(row).toEqual({ name: "Baca buku 30 menit", icon: "book" });
  });

  it("archiveHabit lalu unarchiveHabit: archived_at ke-set terus ke-clear lagi, DB & state konsisten", async () => {
    const { testDb, useHabitsStore } = await setUp();
    const habit = await useHabitsStore.getState().addHabit(dailyInput);

    await useHabitsStore.getState().archiveHabit(habit.id);
    expect(useHabitsStore.getState().getHabitById(habit.id)?.archivedAt).not.toBeNull();
    let row = await testDb.getFirstAsync<{ archived_at: number | null }>(
      "SELECT archived_at FROM habits WHERE id = ?",
      [habit.id],
    );
    expect(row?.archived_at).not.toBeNull();

    await useHabitsStore.getState().unarchiveHabit(habit.id);
    expect(useHabitsStore.getState().getHabitById(habit.id)?.archivedAt).toBeNull();
    row = await testDb.getFirstAsync<{ archived_at: number | null }>(
      "SELECT archived_at FROM habits WHERE id = ?",
      [habit.id],
    );
    expect(row?.archived_at).toBeNull();
  });

  it("deleteHabitPermanently: habit DAN log-nya kehapus (FK cascade), dari DB dan state", async () => {
    const { testDb, useHabitsStore } = await setUp();
    const habit = await useHabitsStore.getState().addHabit(dailyInput);
    await useHabitsStore.getState().toggleHabitToday(habit.id); // bikin 1 log

    await useHabitsStore.getState().deleteHabitPermanently(habit.id);

    expect(useHabitsStore.getState().habits).toEqual([]);
    expect(useHabitsStore.getState().habitLogs).toEqual([]);
    expect(await testDb.getAllAsync("SELECT id FROM habits")).toEqual([]);
    expect(await testDb.getAllAsync("SELECT id FROM habit_logs")).toEqual([]);
  });

  it("setHabitNotificationId: set lalu clear (null)", async () => {
    const { testDb, useHabitsStore } = await setUp();
    const habit = await useHabitsStore.getState().addHabit(dailyInput);

    await useHabitsStore.getState().setHabitNotificationId(habit.id, "notif_abc");
    expect(useHabitsStore.getState().getHabitById(habit.id)?.notificationId).toBe("notif_abc");

    await useHabitsStore.getState().setHabitNotificationId(habit.id, null);
    expect(useHabitsStore.getState().getHabitById(habit.id)?.notificationId).toBeNull();
    const row = await testDb.getFirstAsync<{ notification_id: string | null }>(
      "SELECT notification_id FROM habits WHERE id = ?",
      [habit.id],
    );
    expect(row?.notification_id).toBeNull();
  });
});

describe("useHabitsStore — toggleHabitToday", () => {
  it("tandain selesai: nambah log HARI INI, DB & state konsisten", async () => {
    const { testDb, useHabitsStore } = await setUp();
    const habit = await useHabitsStore.getState().addHabit(dailyInput);

    await useHabitsStore.getState().toggleHabitToday(habit.id);

    expect(useHabitsStore.getState().isHabitCompletedToday(habit.id)).toBe(true);
    expect(useHabitsStore.getState().habitLogs).toHaveLength(1);
    const rows = await testDb.getAllAsync("SELECT id FROM habit_logs WHERE habit_id = ?", [
      habit.id,
    ]);
    expect(rows).toHaveLength(1);
  });

  it("toggle lagi (udah selesai -> belum): log HARI INI kehapus, bestStreak GAK berubah", async () => {
    const { testDb, useHabitsStore } = await setUp();
    const habit = await useHabitsStore.getState().addHabit(dailyInput);

    await useHabitsStore.getState().toggleHabitToday(habit.id); // selesai
    const bestStreakAfterFirst = useHabitsStore.getState().getHabitById(habit.id)?.bestStreak;
    await useHabitsStore.getState().toggleHabitToday(habit.id); // batal lagi

    expect(useHabitsStore.getState().isHabitCompletedToday(habit.id)).toBe(false);
    expect(useHabitsStore.getState().habitLogs).toEqual([]);
    expect(useHabitsStore.getState().getHabitById(habit.id)?.bestStreak).toBe(
      bestStreakAfterFirst,
    );
    expect(await testDb.getAllAsync("SELECT id FROM habit_logs")).toEqual([]);
  });

  it("streak baru LEBIH TINGGI dari bestStreak -> best_streak ke-bump di DB & state", async () => {
    const { testDb, useHabitsStore } = await setUp();
    const habit = await useHabitsStore.getState().addHabit(dailyInput);

    await useHabitsStore.getState().toggleHabitToday(habit.id); // streak jadi 1, bestStreak awal 0

    expect(useHabitsStore.getState().getHabitById(habit.id)?.bestStreak).toBe(1);
    const row = await testDb.getFirstAsync<{ best_streak: number }>(
      "SELECT best_streak FROM habits WHERE id = ?",
      [habit.id],
    );
    expect(row?.best_streak).toBe(1);
  });

  it("streak baru LEBIH RENDAH/SAMA DENGAN bestStreak yang udah ada -> best_streak GAK ke-tulis ulang", async () => {
    const { testDb, useHabitsStore } = await setUp();
    const habit = await useHabitsStore.getState().addHabit(dailyInput);
    // Paksa best_streak udah tinggi dari sebelumnya (simulasi histori lama).
    await testDb.runAsync("UPDATE habits SET best_streak = 99 WHERE id = ?", [habit.id]);
    await useHabitsStore.getState().hydrate();

    await useHabitsStore.getState().toggleHabitToday(habit.id); // streak baru cuma 1, < 99

    expect(useHabitsStore.getState().getHabitById(habit.id)?.bestStreak).toBe(99);
    const row = await testDb.getFirstAsync<{ best_streak: number }>(
      "SELECT best_streak FROM habits WHERE id = ?",
      [habit.id],
    );
    expect(row?.best_streak).toBe(99);
  });
});

describe("useHabitsStore — getTodayHabits / getCompletedDateKeys / getCurrentStreak", () => {
  it("getTodayHabits: cuma include habit yang DUE hari ini DAN belum di-archive", async () => {
    const { useHabitsStore } = await setUp();
    const daily = await useHabitsStore.getState().addHabit({ ...dailyInput, name: "Daily" });
    // weekdaysMask 0 buat frequencyType 'weekdays' = gak ada hari yang due sama sekali.
    await useHabitsStore.getState().addHabit({
      ...dailyInput,
      name: "Weekdays kosong",
      frequencyType: "weekdays",
      weekdaysMask: 0,
    });
    const archivedDaily = await useHabitsStore
      .getState()
      .addHabit({ ...dailyInput, name: "Udah diarsip" });
    await useHabitsStore.getState().archiveHabit(archivedDaily.id);

    const todayIds = useHabitsStore.getState().getTodayHabits().map((h: Habit) => h.id);

    expect(todayIds).toEqual([daily.id]);
  });

  it("getCompletedDateKeys: balikin Set tanggal yang completed buat habit itu doang (bukan habit lain)", async () => {
    const { useHabitsStore } = await setUp();
    const a = await useHabitsStore.getState().addHabit({ ...dailyInput, name: "A" });
    const b = await useHabitsStore.getState().addHabit({ ...dailyInput, name: "B" });
    await useHabitsStore.getState().toggleHabitToday(a.id);

    expect(useHabitsStore.getState().getCompletedDateKeys(a.id).size).toBe(1);
    expect(useHabitsStore.getState().getCompletedDateKeys(b.id).size).toBe(0);
  });

  it("getCurrentStreak: ke-hitung dari completedDateKeys habit tersebut (nyambung bener ke calculateCurrentStreak)", async () => {
    const { useHabitsStore } = await setUp();
    const habit = await useHabitsStore.getState().addHabit(dailyInput);
    expect(useHabitsStore.getState().getCurrentStreak(habit.id)).toBe(0);

    await useHabitsStore.getState().toggleHabitToday(habit.id);
    expect(useHabitsStore.getState().getCurrentStreak(habit.id)).toBe(1);
  });
});

describe("useHabitsStore — hydrate", () => {
  it("load habits & habitLogs dari DB ke state kosong", async () => {
    const { testDb, useHabitsStore } = await setUp();
    await testDb.runAsync(
      `INSERT INTO habits (id, name, icon, color, frequency_type, weekdays_mask, reminder_time, notification_id, best_streak, created_at, archived_at, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["habit_seed", "Seed", "book", "blue", "daily", 0, null, null, 0, 1, null, 0],
    );

    expect(useHabitsStore.getState().hasHydrated).toBe(false);
    await useHabitsStore.getState().hydrate();

    expect(useHabitsStore.getState().hasHydrated).toBe(true);
    expect(useHabitsStore.getState().habits.map((h: Habit) => h.id)).toEqual(["habit_seed"]);
  });
});

describe("useHabitsStore — reorderHabits", () => {
  it("sort_order di DB & urutan state ngikutin index array baru", async () => {
    const { testDb, useHabitsStore } = await setUp();
    const a = await useHabitsStore.getState().addHabit({ ...dailyInput, name: "A" });
    const b = await useHabitsStore.getState().addHabit({ ...dailyInput, name: "B" });
    const c = await useHabitsStore.getState().addHabit({ ...dailyInput, name: "C" });

    await useHabitsStore.getState().reorderHabits([b, c, a]);

    expect(useHabitsStore.getState().habits.map((h: Habit) => h.id)).toEqual([b.id, c.id, a.id]);
    const rows = await testDb.getAllAsync<{ id: string }>(
      "SELECT id FROM habits ORDER BY sort_order ASC",
    );
    expect(rows.map((r) => r.id)).toEqual([b.id, c.id, a.id]);
  });
});
