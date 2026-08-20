/* eslint-disable @typescript-eslint/no-require-imports -- sama alasannya kayak
   `db/__tests__/client.test.ts`: `jest.resetModules()` cuma berefek kalau
   modul di-require() ULANG per test, bukan di-`import` statis 1x di atas. */
import { createTestSqliteDb, type TestSqliteDb } from "../../testUtils/sqliteTestAdapter";
import type { BackupPayload } from "../backup";

// `readGoalImageAsBase64`/`writeGoalImageFromBase64` itu wrapper tipis di
// atas `expo-file-system` (native, gak jalan di Jest) — di-mock di titik ini
// (bukan di-reimplementasi expo-file-system-nya), fungsi lain di file yang
// sama (`deleteGoalImage` dst) TETEP real implementation-nya via
// `requireActual`, cuma 2 fungsi ini yang di-override.
jest.mock("../imageStorage", () => ({
  ...jest.requireActual("../imageStorage"),
  readGoalImageAsBase64: jest.fn(),
  writeGoalImageFromBase64: jest.fn(),
}));

// Stub minimal — cukup buat `new File(uri).extension` (dipake langsung di
// `buildBackupPayload`) sama `new Directory(...)`/`Paths.*` (dipanggil pas
// modul `imageStorage.ts`/`backup.ts` di-import, di top-level file, WALAU
// gak dipanggil fungsinya di test ini).
jest.mock("expo-file-system", () => ({
  File: jest.fn().mockImplementation((uri: unknown) => {
    const source = typeof uri === "string" ? uri : "";
    const match = /\.[^./]+$/.exec(source);
    return { extension: match ? match[0] : "" };
  }),
  Directory: jest.fn().mockImplementation(() => ({
    exists: true,
    create: jest.fn(),
  })),
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

/** DB SQLite beneran + schema-nya UDAH di-migrate ke versi terbaru (pake `initDatabase()` ASLI, bukan disimulasiin). */
async function setUpTestDb(): Promise<TestSqliteDb> {
  const testDb = await createTestSqliteDb();
  mockExpoSqliteWith(testDb);
  const { initDatabase } = require("../../db/client");
  await initDatabase();
  return testDb;
}

describe("buildBackupPayload + restoreFromBackup — round-trip", () => {
  it("goal dengan gambar: base64 ke-embed di payload, URI BARU (device tujuan) yang dipake pas restore — bukan path device asal", async () => {
    const testDb = await setUpTestDb();
    const { readGoalImageAsBase64, writeGoalImageFromBase64 } = require("../imageStorage");
    (readGoalImageAsBase64 as jest.Mock).mockResolvedValue("ZmFrZS1pbWFnZS1ieXRlcw==");
    (writeGoalImageFromBase64 as jest.Mock).mockReturnValue(
      "file:///device-B/goal-images/img_new.jpg",
    );

    await testDb.runAsync(
      `INSERT INTO savings_goals (id, name, target_amount, current_amount, image_uri, emoji, accent, created_at, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["goal_1", "Motor baru", 10_000_000, 2_000_000, "file:///device-A/goal-images/img_a.jpg", null, "orange", 1000, 0],
    );

    const { buildBackupPayload, restoreFromBackup } = require("../backup");
    const payload: BackupPayload = await buildBackupPayload();

    expect(payload.data.goalImages).toEqual([
      { goalId: "goal_1", base64: "ZmFrZS1pbWFnZS1ieXRlcw==", extension: ".jpg" },
    ]);

    await restoreFromBackup(payload);

    expect(writeGoalImageFromBase64).toHaveBeenCalledWith("ZmFrZS1pbWFnZS1ieXRlcw==", ".jpg");
    const rows = await testDb.getAllAsync<{ id: string; image_uri: string }>(
      "SELECT id, image_uri FROM savings_goals",
    );
    expect(rows).toEqual([{ id: "goal_1", image_uri: "file:///device-B/goal-images/img_new.jpg" }]);
  });

  it("goal TANPA gambar: gak ada entry goalImages, restore jalan normal (image_uri null)", async () => {
    const testDb = await setUpTestDb();

    await testDb.runAsync(
      `INSERT INTO savings_goals (id, name, target_amount, current_amount, image_uri, emoji, accent, created_at, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["goal_2", "Liburan", 5_000_000, 0, null, "🏖️", "blue", 2000, 0],
    );

    const { buildBackupPayload, restoreFromBackup } = require("../backup");
    const payload: BackupPayload = await buildBackupPayload();
    expect(payload.data.goalImages).toEqual([]);

    await restoreFromBackup(payload);
    const rows = await testDb.getAllAsync<{ id: string; image_uri: string | null }>(
      "SELECT id, image_uri FROM savings_goals",
    );
    expect(rows).toEqual([{ id: "goal_2", image_uri: null }]);
  });

  it("backup v1 lama (formatVersion 1, gak punya field goalImages): restore FALLBACK ke imageUri asli apa adanya, bukan gagal", async () => {
    const testDb = await setUpTestDb();
    const { writeGoalImageFromBase64 } = require("../imageStorage");
    const { restoreFromBackup } = require("../backup");

    const v1Payload = {
      formatVersion: 1,
      exportedAt: Date.now(),
      data: {
        savingsGoals: [
          {
            id: "goal_old",
            name: "Dari backup lama",
            targetAmount: 1_000_000,
            currentAmount: 0,
            imageUri: "file:///device-A/goal-images/img_old.jpg",
            accent: "green",
            createdAt: 500,
            sortOrder: 0,
          },
        ],
        savingsTransactions: [],
        habits: [],
        habitLogs: [],
        todos: [],
        settings: [],
        // SENGAJA gak ada `goalImages` sama sekali — persis bentuk backup v1.
      },
    };

    await restoreFromBackup(v1Payload as unknown as BackupPayload);

    expect(writeGoalImageFromBase64).not.toHaveBeenCalled();
    const rows = await testDb.getAllAsync<{ id: string; image_uri: string }>(
      "SELECT id, image_uri FROM savings_goals",
    );
    // URI-nya emang bakal broken di device ini (file gak pernah ke-backup),
    // tapi itu SAMA PERSIS behavior lama, bukan bikin restore gagal.
    expect(rows).toEqual([{ id: "goal_old", image_uri: "file:///device-A/goal-images/img_old.jpg" }]);
  });

  it("restore itu REPLACE TOTAL: data lama device ini abis diganti isi backup, bukan di-merge", async () => {
    const testDb = await setUpTestDb();

    await testDb.runAsync(
      `INSERT INTO savings_goals (id, name, target_amount, current_amount, image_uri, emoji, accent, created_at, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["goal_local_only", "Bakal ke-hapus", 1, 0, null, "🎯", "orange", 1, 0],
    );
    await testDb.runAsync(
      `INSERT INTO habits (id, name, icon, color, frequency_type, weekdays_mask, reminder_time, notification_id, best_streak, created_at, archived_at, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      ["habit_local_only", "Bakal ke-hapus juga", "book", "blue", "daily", 127, null, "notif_123", 0, 1, null, 0],
    );

    const { restoreFromBackup } = require("../backup");
    const incomingPayload: BackupPayload = {
      formatVersion: 2,
      exportedAt: Date.now(),
      data: {
        savingsGoals: [
          {
            id: "goal_from_backup",
            name: "Dari backup",
            targetAmount: 2,
            currentAmount: 0,
            accent: "mint",
            createdAt: 2,
            sortOrder: 0,
          },
        ],
        savingsTransactions: [],
        habits: [],
        habitLogs: [],
        todos: [],
        settings: [],
        goalImages: [],
      },
    };

    await restoreFromBackup(incomingPayload);

    const goalIds = (await testDb.getAllAsync<{ id: string }>("SELECT id FROM savings_goals")).map(
      (r) => r.id,
    );
    const habitIds = (await testDb.getAllAsync<{ id: string }>("SELECT id FROM habits")).map(
      (r) => r.id,
    );
    expect(goalIds).toEqual(["goal_from_backup"]);
    expect(habitIds).toEqual([]); // habit lama ke-hapus, backup gak bawa habit baru
  });

  it("restore MEMPERTAHANKAN internal settings device ini (notification/pending-deletion flag), TIDAK ikut ditimpa/dihapus dari backup", async () => {
    const testDb = await setUpTestDb();

    // `pending_goal_deletion` itu salah satu INTERNAL_SETTINGS_KEYS di backup.ts
    // — state lokal device ini, sengaja gak boleh kena replace dari restore.
    await testDb.runAsync("INSERT INTO settings (key, value) VALUES (?, ?)", [
      "pending_goal_deletion",
      "goal_being_undone",
    ]);
    await testDb.runAsync("INSERT INTO settings (key, value) VALUES (?, ?)", [
      "theme",
      "light",
    ]);

    const { restoreFromBackup } = require("../backup");
    const payload: BackupPayload = {
      formatVersion: 2,
      exportedAt: Date.now(),
      data: {
        savingsGoals: [],
        savingsTransactions: [],
        habits: [],
        habitLogs: [],
        todos: [],
        settings: [{ key: "theme", value: "dark" }],
        goalImages: [],
      },
    };

    await restoreFromBackup(payload);

    const settings = await testDb.getAllAsync<{ key: string; value: string }>(
      "SELECT key, value FROM settings ORDER BY key",
    );
    expect(settings).toEqual([
      { key: "pending_goal_deletion", value: "goal_being_undone" }, // TETAP, gak kesentuh
      { key: "theme", value: "dark" }, // ke-update dari backup
    ]);
  });
});
