import * as SQLite from "expo-sqlite";
import { CREATE_TABLES_SQL, MIGRATIONS } from "./schema";

/**
 * Nama file DB sengaja generic ("app.db", bukan "tabungan.db") — rename app
 * ke "heibi" nanti (lihat PROJECT_CONTEXT.md) gak perlu migrasi file DB.
 */
const DB_NAME = "app.db";

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;

/** Singleton koneksi database — dibuka sekali per lifecycle app. */
export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) {
    dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  }
  return dbPromise;
}

let initPromise: Promise<void> | null = null;

/**
 * Bikin semua tabel kalau belum ada (`CREATE TABLE IF NOT EXISTS`, aman
 * dipanggil berkali-kali), lalu jalanin migration incremental yang belum
 * ke-apply (dilacak via `PRAGMA user_version`, bawaan SQLite — bukan tabel
 * custom). WAJIB di-await sebelum query lain jalan — panggil ini paling
 * awal di bootstrap `app/_layout.tsx`.
 */
export function initDatabase(): Promise<void> {
  if (!initPromise) {
    initPromise = (async () => {
      const db = await getDb();
      await db.execAsync(CREATE_TABLES_SQL);

      const row = await db.getFirstAsync<{ user_version: number }>(
        "PRAGMA user_version",
      );
      let version = row?.user_version ?? 0;

      for (const migration of MIGRATIONS) {
        if (migration.version > version) {
          // Migration SQL + bump `user_version` dalam SATU transaction —
          // `user_version` ikut aturan transaction SQLite (bagian dari
          // header DB), jadi kalau app mati/error di tengah migration,
          // SEMUA (schema change + version bump) ke-rollback bareng. Tanpa
          // ini, migration multi-statement yang mati di tengah bisa
          // ninggalin schema udah berubah tapi `user_version` masih versi
          // lama → migration yang sama dicoba ulang launch berikutnya →
          // "duplicate column name" dst.
          await db.withExclusiveTransactionAsync(async (txn) => {
            await txn.execAsync(migration.sql);
            await txn.execAsync(`PRAGMA user_version = ${migration.version}`);
          });
          version = migration.version;
        }
      }
    })();
  }
  return initPromise;
}
