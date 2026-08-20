/* eslint-disable @typescript-eslint/no-require-imports -- `jest.resetModules()`
   di bawah cuma berefek kalau modul (termasuk store Zustand-nya sendiri, yang
   singleton per-module) di-require() ULANG per test, bukan di-`import` statis
   1x di atas. */
import { createTestSqliteDb, type TestSqliteDb } from "../../testUtils/sqliteTestAdapter";
import type { Goal } from "../../types";

// `deleteGoalImage` itu wrapper tipis di atas `expo-file-system` (native,
// gak jalan di Jest) — di-mock di titik ini, fungsi lain di file yang sama
// TETEP real implementation-nya via `requireActual`.
jest.mock("../../utils/imageStorage", () => ({
  ...jest.requireActual("../../utils/imageStorage"),
  deleteGoalImage: jest.fn(),
}));

// Stub minimal buat `new Directory(...)`/`Paths.*` yang dipanggil di
// top-level `imageStorage.ts` pas di-`requireActual` di atas.
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation(() => ({ exists: false, delete: jest.fn() })),
  Directory: jest.fn().mockImplementation(() => ({ exists: true, create: jest.fn() })),
  Paths: { cache: "mock://cache", document: "mock://document" },
}));

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
  const { useGoalsStore, UNDO_WINDOW_MS } = require("../useGoalsStore");
  return { testDb, useGoalsStore, UNDO_WINDOW_MS };
}

describe("useGoalsStore — addGoal", () => {
  it("nulis ke DB DAN update state in-memory sekaligus (write-through)", async () => {
    const { testDb, useGoalsStore } = await setUp();

    const goal = await useGoalsStore.getState().addGoal({
      name: "Motor baru",
      targetAmount: 5_000_000,
    });

    expect(useGoalsStore.getState().goals).toEqual([goal]);
    const rows = await testDb.getAllAsync<{ id: string; name: string; target_amount: number }>(
      "SELECT id, name, target_amount FROM savings_goals",
    );
    expect(rows).toEqual([{ id: goal.id, name: "Motor baru", target_amount: 5_000_000 }]);
  });

  it("goal baru selalu ditaro PALING DEPAN (sortOrder lebih kecil dari semua yang udah ada)", async () => {
    const { useGoalsStore } = await setUp();

    const first = await useGoalsStore.getState().addGoal({ name: "A", targetAmount: 1 });
    const second = await useGoalsStore.getState().addGoal({ name: "B", targetAmount: 1 });

    expect(second.sortOrder).toBeLessThan(first.sortOrder);
    expect(useGoalsStore.getState().goals[0].id).toBe(second.id);
  });
});

describe("useGoalsStore — deposit/withdraw", () => {
  it("deposit: nambah currentAmount & nyatet transaksi, DB dan state konsisten", async () => {
    const { testDb, useGoalsStore } = await setUp();
    const goal = await useGoalsStore.getState().addGoal({ name: "Motor", targetAmount: 1_000_000 });

    await useGoalsStore.getState().deposit(goal.id, 200_000, "gaji");

    expect(useGoalsStore.getState().getGoalById(goal.id)?.currentAmount).toBe(200_000);
    expect(useGoalsStore.getState().transactions).toHaveLength(1);
    const row = await testDb.getFirstAsync<{ current_amount: number }>(
      "SELECT current_amount FROM savings_goals WHERE id = ?",
      [goal.id],
    );
    expect(row?.current_amount).toBe(200_000);
  });

  it("deposit: amount 0 atau negatif di-ignore diam-diam, gak ngubah apa-apa", async () => {
    const { useGoalsStore } = await setUp();
    const goal = await useGoalsStore.getState().addGoal({ name: "Motor", targetAmount: 1_000_000 });

    await useGoalsStore.getState().deposit(goal.id, 0);
    await useGoalsStore.getState().deposit(goal.id, -100);

    expect(useGoalsStore.getState().getGoalById(goal.id)?.currentAmount).toBe(0);
    expect(useGoalsStore.getState().transactions).toHaveLength(0);
  });

  it("withdraw: sukses ngurangin saldo & nyatet transaksi", async () => {
    const { useGoalsStore } = await setUp();
    const goal = await useGoalsStore.getState().addGoal({ name: "Motor", targetAmount: 1_000_000 });
    await useGoalsStore.getState().deposit(goal.id, 300_000);

    const result = await useGoalsStore.getState().withdraw(goal.id, 100_000, "belanja");

    expect(result).toEqual({ ok: true });
    expect(useGoalsStore.getState().getGoalById(goal.id)?.currentAmount).toBe(200_000);
  });

  it("withdraw: TOLAK kalau amount melebihi saldo — DB dan state gak berubah sama sekali", async () => {
    const { testDb, useGoalsStore } = await setUp();
    const goal = await useGoalsStore.getState().addGoal({ name: "Motor", targetAmount: 1_000_000 });
    await useGoalsStore.getState().deposit(goal.id, 100_000);

    const result = await useGoalsStore.getState().withdraw(goal.id, 200_000);

    expect(result.ok).toBe(false);
    expect(useGoalsStore.getState().getGoalById(goal.id)?.currentAmount).toBe(100_000);
    const row = await testDb.getFirstAsync<{ current_amount: number }>(
      "SELECT current_amount FROM savings_goals WHERE id = ?",
      [goal.id],
    );
    expect(row?.current_amount).toBe(100_000);
  });

  it("withdraw: tolak amount 0 atau negatif", async () => {
    const { useGoalsStore } = await setUp();
    const goal = await useGoalsStore.getState().addGoal({ name: "Motor", targetAmount: 1_000_000 });
    await useGoalsStore.getState().deposit(goal.id, 100_000);

    expect((await useGoalsStore.getState().withdraw(goal.id, 0)).ok).toBe(false);
    expect((await useGoalsStore.getState().withdraw(goal.id, -50)).ok).toBe(false);
    expect(useGoalsStore.getState().getGoalById(goal.id)?.currentAmount).toBe(100_000);
  });

  it("withdraw: goal yang gak ada -> error, bukan throw", async () => {
    const { useGoalsStore } = await setUp();
    const result = await useGoalsStore.getState().withdraw("goal_gak_ada", 100);
    expect(result.ok).toBe(false);
  });
});

describe("useGoalsStore — delete / undo / commit", () => {
  it("deleteGoal lalu undoDelete: goal & transaksinya balik PERSIS, di DB dan state", async () => {
    const { testDb, useGoalsStore } = await setUp();
    const goal = await useGoalsStore.getState().addGoal({ name: "Motor", targetAmount: 1_000_000 });
    await useGoalsStore.getState().deposit(goal.id, 100_000);

    await useGoalsStore.getState().deleteGoal(goal.id);
    expect(useGoalsStore.getState().goals).toEqual([]);
    expect(useGoalsStore.getState().transactions).toEqual([]);
    expect(await testDb.getAllAsync("SELECT id FROM savings_goals")).toEqual([]);

    await useGoalsStore.getState().undoDelete();
    expect(useGoalsStore.getState().goals.map((g: Goal) => g.id)).toEqual([goal.id]);
    expect(useGoalsStore.getState().getGoalById(goal.id)?.currentAmount).toBe(100_000);
    expect(useGoalsStore.getState().transactions).toHaveLength(1);
    expect(await testDb.getAllAsync("SELECT id FROM savings_goals")).toEqual([{ id: goal.id }]);
  });

  it("deleteGoal: transaksi terkait ikut ilang dari savings_tx juga (FK ON DELETE CASCADE)", async () => {
    const { testDb, useGoalsStore } = await setUp();
    const goal = await useGoalsStore.getState().addGoal({ name: "Motor", targetAmount: 1_000_000 });
    await useGoalsStore.getState().deposit(goal.id, 100_000);

    await useGoalsStore.getState().deleteGoal(goal.id);

    expect(await testDb.getAllAsync("SELECT id FROM savings_tx")).toEqual([]);
  });

  it("commitPendingDeletion: pendingDeletion & settings row-nya ilang permanen, gak bisa di-undo lagi", async () => {
    const { testDb, useGoalsStore } = await setUp();
    const goal = await useGoalsStore.getState().addGoal({ name: "Motor", targetAmount: 1_000_000 });
    await useGoalsStore.getState().deleteGoal(goal.id);
    expect(useGoalsStore.getState().pendingDeletion).not.toBeNull();

    await useGoalsStore.getState().commitPendingDeletion();

    expect(useGoalsStore.getState().pendingDeletion).toBeNull();
    expect(
      await testDb.getAllAsync("SELECT key FROM settings WHERE key = 'pending_goal_deletion'"),
    ).toEqual([]);

    // Undo abis commit = no-op, gak ada apa-apa buat di-undo.
    await useGoalsStore.getState().undoDelete();
    expect(useGoalsStore.getState().goals).toEqual([]);
  });

  it("commitPendingDeletion: gambar goal (kalau ada) ikut dihapus lewat deleteGoalImage", async () => {
    const { useGoalsStore } = await setUp();
    const { deleteGoalImage } = require("../../utils/imageStorage");
    const goal = await useGoalsStore.getState().addGoal({
      name: "Motor",
      targetAmount: 1,
      imageUri: "file://motor.jpg",
    });

    await useGoalsStore.getState().deleteGoal(goal.id);
    await useGoalsStore.getState().commitPendingDeletion();

    expect(deleteGoalImage).toHaveBeenCalledWith("file://motor.jpg");
  });
});

describe("useGoalsStore — updateGoal (urutan tulis DB vs hapus gambar lama)", () => {
  it("ganti gambar: deleteGoalImage dipanggil dengan URI LAMA, state ke-update ke URI baru", async () => {
    const { useGoalsStore } = await setUp();
    const { deleteGoalImage } = require("../../utils/imageStorage");
    const goal = await useGoalsStore.getState().addGoal({
      name: "Motor",
      targetAmount: 1,
      imageUri: "file://old.jpg",
    });

    await useGoalsStore.getState().updateGoal(goal.id, { imageUri: "file://new.jpg" });

    expect(deleteGoalImage).toHaveBeenCalledWith("file://old.jpg");
    expect(useGoalsStore.getState().getGoalById(goal.id)?.imageUri).toBe("file://new.jpg");
  });

  it("gambar gak diubah (patch lain doang): deleteGoalImage GAK dipanggil", async () => {
    const { useGoalsStore } = await setUp();
    const { deleteGoalImage } = require("../../utils/imageStorage");
    const goal = await useGoalsStore.getState().addGoal({
      name: "Motor",
      targetAmount: 1,
      imageUri: "file://old.jpg",
    });

    await useGoalsStore.getState().updateGoal(goal.id, { name: "Motor Baru" });

    expect(deleteGoalImage).not.toHaveBeenCalled();
    expect(useGoalsStore.getState().getGoalById(goal.id)?.imageUri).toBe("file://old.jpg");
    expect(useGoalsStore.getState().getGoalById(goal.id)?.name).toBe("Motor Baru");
  });
});

describe("useGoalsStore — hydrate", () => {
  it("load goals/transactions dari DB ke state kosong, set hasHydrated", async () => {
    const { testDb, useGoalsStore } = await setUp();
    await testDb.runAsync(
      `INSERT INTO savings_goals (id, name, target_amount, current_amount, image_uri, emoji, accent, created_at, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["goal_seed", "Seed", 1000, 0, null, "🎯", "mint", 1, 0],
    );

    expect(useGoalsStore.getState().hasHydrated).toBe(false);
    await useGoalsStore.getState().hydrate();

    expect(useGoalsStore.getState().hasHydrated).toBe(true);
    expect(useGoalsStore.getState().goals.map((g: Goal) => g.id)).toEqual(["goal_seed"]);
  });

  it("pendingDeletion yang window undo-nya UDAH LEWAT otomatis di-commit permanen pas hydrate", async () => {
    const { testDb, useGoalsStore, UNDO_WINDOW_MS } = await setUp();
    const staleGoal = {
      id: "goal_stale",
      name: "Lama",
      targetAmount: 1,
      currentAmount: 0,
      accent: "mint",
      createdAt: 1,
      sortOrder: 0,
    };
    const pending = {
      goal: staleGoal,
      transactions: [],
      deletedAt: Date.now() - (UNDO_WINDOW_MS + 5000), // window UDAH lewat
    };
    await testDb.runAsync("INSERT INTO settings (key, value) VALUES (?, ?)", [
      "pending_goal_deletion",
      JSON.stringify(pending),
    ]);

    await useGoalsStore.getState().hydrate();

    expect(useGoalsStore.getState().pendingDeletion).toBeNull();
    expect(
      await testDb.getAllAsync("SELECT key FROM settings WHERE key = 'pending_goal_deletion'"),
    ).toEqual([]);
  });

  it("pendingDeletion yang window undo-nya MASIH JALAN dibiarin (BUKAN langsung di-commit)", async () => {
    const { testDb, useGoalsStore } = await setUp();
    const staleGoal = {
      id: "goal_fresh",
      name: "Baru dihapus",
      targetAmount: 1,
      currentAmount: 0,
      accent: "mint",
      createdAt: 1,
      sortOrder: 0,
    };
    const pending = { goal: staleGoal, transactions: [], deletedAt: Date.now() };
    await testDb.runAsync("INSERT INTO settings (key, value) VALUES (?, ?)", [
      "pending_goal_deletion",
      JSON.stringify(pending),
    ]);

    await useGoalsStore.getState().hydrate();

    expect(useGoalsStore.getState().pendingDeletion).not.toBeNull();
    expect(
      await testDb.getAllAsync("SELECT key FROM settings WHERE key = 'pending_goal_deletion'"),
    ).toHaveLength(1);
  });
});

describe("useGoalsStore — reorderGoals", () => {
  it("sort_order di DB & urutan di state ngikutin index array yang dikasih", async () => {
    const { testDb, useGoalsStore } = await setUp();
    const a = await useGoalsStore.getState().addGoal({ name: "A", targetAmount: 1 });
    const b = await useGoalsStore.getState().addGoal({ name: "B", targetAmount: 1 });
    const c = await useGoalsStore.getState().addGoal({ name: "C", targetAmount: 1 });

    await useGoalsStore.getState().reorderGoals([b, c, a]);

    expect(useGoalsStore.getState().goals.map((g: Goal) => g.id)).toEqual([b.id, c.id, a.id]);
    const rows = await testDb.getAllAsync<{ id: string; sort_order: number }>(
      "SELECT id, sort_order FROM savings_goals ORDER BY sort_order ASC",
    );
    expect(rows.map((r) => r.id)).toEqual([b.id, c.id, a.id]);
  });
});
