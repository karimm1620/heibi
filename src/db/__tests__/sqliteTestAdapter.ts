import initSqlJs from "sql.js";

/**
 * Subset dari `expo-sqlite`'s `SQLiteDatabase`/`Transaction` API yang beneran
 * dipake di codebase ini (lihat `client.ts`, `backup.ts`, `useGoalsStore.ts`
 * dst) — bukan seluruh permukaan expo-sqlite.
 */
export interface TestSqliteDb {
  execAsync(sql: string): Promise<void>;
  runAsync(
    sql: string,
    params?: readonly unknown[],
  ): Promise<{ changes: number; lastInsertRowId: number }>;
  getAllAsync<T>(sql: string, params?: readonly unknown[]): Promise<T[]>;
  getFirstAsync<T>(sql: string, params?: readonly unknown[]): Promise<T | null>;
  withExclusiveTransactionAsync(
    task: (txn: TestSqliteDb) => Promise<void>,
  ): Promise<void>;
}

// `initSqlJs()` nge-load binary WASM-nya — mahal, jadi di-cache 1x per proses
// test (bukan 1x per `createTestSqliteDb()` call, yang bisa dipanggil banyak
// kali kalau `jest.resetModules()` dipake di banyak test).
let sqlModulePromise: ReturnType<typeof initSqlJs> | null = null;
function loadSqlJs() {
  if (!sqlModulePromise) {
    sqlModulePromise = initSqlJs();
  }
  return sqlModulePromise;
}

/**
 * Bikin database SQLite BENERAN, in-memory (bukan fake object JS) — biar
 * test migration/backup beneran ngejalanin SQL-nya (ALTER TABLE, transaction
 * rollback dst), bukan cuma nyimulasiin API shape doang. `expo-sqlite` gak
 * bisa dipake langsung di Jest/Node (native binding buat device), jadi
 * `sql.js` (SQLite asli, di-compile ke WASM — BUKAN native addon, jadi zero
 * resiko `npm install` gagal compile di mesin manapun) dipake sebagai
 * pengganti KHUSUS buat test, di-wrap biar method-nya sama kayak yang
 * dipanggil kode asli.
 */
export async function createTestSqliteDb(): Promise<TestSqliteDb> {
  const SQL = await loadSqlJs();
  const raw = new SQL.Database();

  function wrap(target: InstanceType<typeof SQL.Database>): TestSqliteDb {
    return {
      async execAsync(sql) {
        target.exec(sql);
      },
      async runAsync(sql, params = []) {
        target.run(sql, params as (string | number | Uint8Array | null)[]);
        const changes = target.getRowsModified();
        return { changes, lastInsertRowId: 0 }; // lastInsertRowId gak dipake di manapun di codebase
      },
      async getAllAsync<T>(sql: string, params: readonly unknown[] = []) {
        const stmt = target.prepare(sql);
        try {
          stmt.bind(params as (string | number | Uint8Array | null)[]);
          const rows: T[] = [];
          while (stmt.step()) {
            rows.push(stmt.getAsObject() as T);
          }
          return rows;
        } finally {
          stmt.free();
        }
      },
      async getFirstAsync<T>(sql: string, params: readonly unknown[] = []) {
        const stmt = target.prepare(sql);
        try {
          stmt.bind(params as (string | number | Uint8Array | null)[]);
          const row = stmt.step() ? (stmt.getAsObject() as T) : null;
          return row;
        } finally {
          stmt.free();
        }
      },
      async withExclusiveTransactionAsync(task) {
        // BEGIN IMMEDIATE beneran, BUKAN cuma penanda — kalau `task` throw,
        // ROLLBACK beneran ngebalikin SEMUA statement di dalamnya (termasuk
        // DDL kayak ALTER TABLE — ini fitur asli SQLite, transactional DDL).
        // Ini yang bikin test atomic-migration di bawah valid, bukan cuma
        // nge-test bentuk API doang.
        target.exec("BEGIN IMMEDIATE");
        try {
          await task(wrap(target));
          target.exec("COMMIT");
        } catch (err) {
          try {
            target.exec("ROLLBACK");
          } catch {
            // Kalau ROLLBACK sendiri gagal (misal transaction udah keburu
            // auto-rollback gara-gara error tertentu), abaikan — error asli
            // dari `task` yang penting buat di-propagate ke caller.
          }
          throw err;
        }
      },
    };
  }

  return wrap(raw);
}
