/* eslint-disable @typescript-eslint/no-require-imports -- `jest.resetModules()`
   di bawah cuma berefek kalau modul-nya di-require() ULANG di dalem tiap
   `it()` (bukan `import` statis di atas, yang cuma jalan sekali pas file di-load). */
import { createTestSqliteDb, type TestSqliteDb } from "../../testUtils/sqliteTestAdapter";

/**
 * `getDb()`/`initDatabase()` di `client.ts` nyimpen singleton di module-level
 * closure (`dbPromise`/`initPromise`) — SENGAJA (biar 1 koneksi per app
 * lifecycle). Tapi itu artinya tiap test butuh module `client.ts` (dan mock
 * `expo-sqlite`/`./schema`-nya) yang BENER-BENER baru, bukan reuse dari test
 * sebelumnya. `jest.resetModules()` + `require()` di dalem tiap test (bukan
 * `import` di atas) itu caranya.
 */
beforeEach(() => {
  jest.resetModules();
});

afterEach(() => {
  // `jest.doMock` (dipake buat nyuntik migration yang sengaja dirusak di 2
  // test paling bawah) tetep "nempel" walau `jest.resetModules()` dipanggil
  // — resetModules cuma nge-clear cache module, BUKAN nge-unregister mock
  // factory-nya. Tanpa ini, test yang doMock `../schema` bisa bocor ke test
  // sesudahnya yang harusnya pake migration asli.
  jest.dontMock("../schema");
});

function mockExpoSqliteWith(testDb: TestSqliteDb) {
  jest.doMock("expo-sqlite", () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue(testDb),
  }));
}

describe("initDatabase — migration atomic (fix checkpoint sebelumnya)", () => {
  it("dari DB kosong: semua tabel dibuat & migrate sampe SCHEMA_VERSION terbaru", async () => {
    const testDb = await createTestSqliteDb();
    mockExpoSqliteWith(testDb);

    const { initDatabase } = require("../client");
    const { SCHEMA_VERSION } = require("../schema");

    await initDatabase();

    const versionRow = await testDb.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    expect(versionRow?.user_version).toBe(SCHEMA_VERSION);

    // Migration v2 (notification_id) & v3 (sort_order) harus ke-apply.
    const habitCols = await testDb.getAllAsync<{ name: string }>(
      "PRAGMA table_info(habits)",
    );
    expect(habitCols.some((c) => c.name === "notification_id")).toBe(true);
    expect(habitCols.some((c) => c.name === "sort_order")).toBe(true);

    const goalCols = await testDb.getAllAsync<{ name: string }>(
      "PRAGMA table_info(savings_goals)",
    );
    expect(goalCols.some((c) => c.name === "sort_order")).toBe(true);
  });

  it("device yang udah pernah migrate ke v2: cuma migration v3 (yang pending) yang dijalanin, bukan diulang dari awal", async () => {
    const testDb = await createTestSqliteDb();
    // Simulasiin device yang state DB-nya "udah di versi 2 sebelumnya".
    await testDb.execAsync("PRAGMA user_version = 2");
    mockExpoSqliteWith(testDb);

    const { initDatabase } = require("../client");
    const { SCHEMA_VERSION } = require("../schema");

    await initDatabase();

    const versionRow = await testDb.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    expect(versionRow?.user_version).toBe(SCHEMA_VERSION);

    const goalCols = await testDb.getAllAsync<{ name: string }>(
      "PRAGMA table_info(savings_goals)",
    );
    expect(goalCols.some((c) => c.name === "sort_order")).toBe(true);
  });

  it("migration yang GAGAL DI TENGAH (simulasi app mati/error): schema change & user_version bump SAMA-SAMA ke-rollback, bukan nyangkut setengah jalan", async () => {
    const testDb = await createTestSqliteDb();
    mockExpoSqliteWith(testDb);

    // Migration v2 SENGAJA dirusak: statement pertama valid (nambah kolom),
    // statement kedua invalid (syntax error) — niru "app mati/crash di
    // tengah migration multi-statement" yang disebutin di komentar client.ts.
    jest.doMock("../schema", () => {
      const actual = jest.requireActual("../schema");
      return {
        ...actual,
        MIGRATIONS: [
          {
            version: 2,
            sql: `
              ALTER TABLE habits ADD COLUMN notification_id TEXT;
              ALTER TABLE tabel_yang_gak_ada SET kolom = 1;
            `,
          },
        ],
      };
    });

    const { initDatabase } = require("../client");

    await expect(initDatabase()).rejects.toThrow();

    // user_version HARUS TETAP 0 — BUKAN nyangkut di angka yang keliru gara2
    // sebagian migration sukses.
    const versionRow = await testDb.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    expect(versionRow?.user_version).toBe(0);

    // Kolom `notification_id` (statement PERTAMA di migration, yang secara
    // teknis "sukses" sebelum statement kedua error) HARUS IKUT ke-rollback.
    // Kalau kolom ini ada tapi user_version masih 0, berarti transaction gak
    // beneran atomic — persis bug yang lagi divalidasi test ini.
    const habitCols = await testDb.getAllAsync<{ name: string }>(
      "PRAGMA table_info(habits)",
    );
    expect(habitCols.some((c) => c.name === "notification_id")).toBe(false);
  });

  it("migration yang gagal: retry initDatabase() abis fix migration-nya HARUS sukses jalan dari awal lagi (bukan ke-block gara2 kolom udah ada duluan)", async () => {
    const testDb = await createTestSqliteDb();
    mockExpoSqliteWith(testDb);

    jest.doMock("../schema", () => {
      const actual = jest.requireActual("../schema");
      return {
        ...actual,
        MIGRATIONS: [
          {
            version: 2,
            sql: `ALTER TABLE habits ADD COLUMN notification_id TEXT; ALTER TABLE nope SET x = 1;`,
          },
        ],
      };
    });

    const client = require("../client");
    await expect(client.initDatabase()).rejects.toThrow();

    // App di-restart (module baru, initPromise fresh) — kali ini TANPA
    // di-doMock ulang, jadi `../schema` yang KEPAKE migration ASLI yang
    // bener (simulasi developer udah ngerilis versi yang migration-nya gak
    // rusak). Yang lagi divalidasi: device yang kena crash pas percobaan
    // pertama HARUS bisa lanjut normal, BUKAN ke-block "duplicate column
    // name" gara-gara sisa state dari percobaan yang gagal.
    //
    // `jest.dontMock` WAJIB dipanggil eksplisit di sini — `jest.resetModules()`
    // doang gak cukup, itu cuma nge-clear cache module, mock factory dari
    // `doMock` di atas tetep "nempel" ke path yang sama kalau gak di-unmock.
    jest.dontMock("../schema");
    jest.resetModules();
    mockExpoSqliteWith(testDb);
    const { initDatabase } = require("../client");
    const { SCHEMA_VERSION } = require("../schema");

    await initDatabase(); // gak boleh throw "duplicate column name"

    const versionRow = await testDb.getFirstAsync<{ user_version: number }>(
      "PRAGMA user_version",
    );
    expect(versionRow?.user_version).toBe(SCHEMA_VERSION);
  });
});
