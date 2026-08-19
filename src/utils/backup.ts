import { Directory, File, Paths } from "expo-file-system";
import { getDb } from "../db/client";
import {
  type GoalRow,
  rowToGoal,
  rowToTx,
  type TxRow,
} from "../store/useGoalsStore";
import {
  type HabitLogRow,
  type HabitRow,
  rowToHabit,
  rowToLog,
} from "../store/useHabitsStore";
import { rowToTodo, type TodoRow } from "../store/useTodosStore";
import type { Goal, Habit, HabitLog, Todo, Transaction } from "../types";
import { getLocalDateKey } from "./date";
import { readGoalImageAsBase64, writeGoalImageFromBase64 } from "./imageStorage";

export const BACKUP_FORMAT_VERSION = 2;

/**
 * Key di tabel `settings` yang SENGAJA gak ikut backup/restore — ini state
 * internal/transient, bukan data user. Restore `pending_goal_deletion` dari
 * device lain misalnya, bisa bikin state undo-delete yang aneh; restore
 * migration flag jelas gak relevan di device manapun.
 */
const INTERNAL_SETTINGS_KEYS = new Set<string>([
  "migrated_from_async_storage_v1",
  "pending_goal_deletion",
]);

interface SettingRow {
  key: string;
  value: string;
}

/**
 * Gambar goal, di-embed langsung sebagai base64 di dalam backup JSON (bukan
 * file terpisah/zip) — biar export/import tetap 1 file `.json` kayak
 * sekarang, gak nambah dependency zip baru. Dipisah dari `Goal` (bukan field
 * di objek goal-nya) biar `Goal` di `src/types` tetap bersih dari concern
 * backup-only ini.
 */
export interface BackupGoalImage {
  goalId: string;
  base64: string;
  extension: string;
}

export interface BackupPayload {
  formatVersion: number;
  exportedAt: number;
  data: {
    savingsGoals: Goal[];
    savingsTransactions: Transaction[];
    habits: Habit[];
    habitLogs: HabitLog[];
    todos: Todo[];
    settings: SettingRow[];
    /**
     * v2+. Absent di backup v1 lama (`formatVersion === 1`) — backup v1
     * tetap bisa di-restore, cuma gambar goal-nya akan tetap nunjuk ke
     * `imageUri` device asal (bisa broken di device lain), persis behavior
     * lama, karena gambarnya emang gak pernah ke-backup di format v1.
     */
    goalImages?: BackupGoalImage[];
  };
}

/** Baca semua data dari SQLite, susun jadi satu payload backup. */
export async function buildBackupPayload(): Promise<BackupPayload> {
  const db = await getDb();
  const [goalRows, txRows, habitRows, logRows, todoRows, settingsRows] =
    await Promise.all([
      db.getAllAsync<GoalRow>("SELECT * FROM savings_goals"),
      db.getAllAsync<TxRow>("SELECT * FROM savings_tx"),
      db.getAllAsync<HabitRow>("SELECT * FROM habits"),
      db.getAllAsync<HabitLogRow>("SELECT * FROM habit_logs"),
      db.getAllAsync<TodoRow>("SELECT * FROM todos"),
      db.getAllAsync<SettingRow>("SELECT * FROM settings"),
    ]);

  const savingsGoals = goalRows.map(rowToGoal);

  // Embed gambar goal sebagai base64 — bukan cuma nyimpen `imageUri` (path
  // lokal device ini) doang, itu penyebab gambar goal broken kalau backup
  // di-restore di device lain. Gambar yang gagal dibaca (file udah gak ada
  // dsb) di-skip diam-diam, bukan bikin backup gagal total.
  const goalImages: BackupGoalImage[] = [];
  for (const g of savingsGoals) {
    if (!g.imageUri) continue;
    const base64 = await readGoalImageAsBase64(g.imageUri);
    if (base64) {
      const extension = new File(g.imageUri).extension || ".jpg";
      goalImages.push({ goalId: g.id, base64, extension });
    }
  }

  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: Date.now(),
    data: {
      savingsGoals,
      savingsTransactions: txRows.map(rowToTx),
      habits: habitRows.map(rowToHabit),
      habitLogs: logRows.map(rowToLog),
      todos: todoRows.map(rowToTodo),
      settings: settingsRows.filter((r) => !INTERNAL_SETTINGS_KEYS.has(r.key)),
      goalImages,
    },
  };
}

const backupsDir = new Directory(Paths.cache, "backups");

function ensureBackupsDir() {
  if (!backupsDir.exists) {
    backupsDir.create({ intermediates: true, idempotent: true });
  }
}

/**
 * Tulis backup ke file JSON di cache directory (buat di-share, BUKAN
 * penyimpanan permanen — cache bisa dibersihin OS kapan aja). Return
 * `File` yang siap dilempar ke `expo-sharing`.
 */
export async function exportBackupToFile(): Promise<File> {
  const payload = await buildBackupPayload();
  ensureBackupsDir();

  const filename = `heibi-backup-${getLocalDateKey()}.json`;
  const file = new File(backupsDir, filename);
  file.create({ overwrite: true });
  file.write(JSON.stringify(payload, null, 2));
  return file;
}

export interface BackupValidationResult {
  valid: boolean;
  error?: string;
  payload?: BackupPayload;
}

/**
 * Validasi RUNTIME (bukan cuma type-check TypeScript, itu gak ngaruh ke JSON
 * dari luar) — cek field wajib & tipe dasar tiap record, biar backup file
 * yang corrupt/gak lengkap/dari versi lain gak nge-crash pas di-restore,
 * dan errornya jelas buat user (bukan cuma "gagal").
 */
export function validateBackupPayload(raw: unknown): BackupValidationResult {
  if (typeof raw !== "object" || raw === null) {
    return { valid: false, error: "File bukan format JSON yang valid." };
  }

  const obj = raw as Record<string, unknown>;

  if (typeof obj.formatVersion !== "number") {
    return { valid: false, error: "File ini gak dikenali sebagai backup heibi." };
  }
  if (obj.formatVersion > BACKUP_FORMAT_VERSION) {
    return {
      valid: false,
      error: "Backup ini dibuat dari versi app yang lebih baru, update app dulu sebelum restore.",
    };
  }
  if (typeof obj.data !== "object" || obj.data === null) {
    return { valid: false, error: "Backup ini gak punya data yang bisa dipulihkan." };
  }

  const data = obj.data as Record<string, unknown>;
  const arrayFields: (keyof BackupPayload["data"])[] = [
    "savingsGoals",
    "savingsTransactions",
    "habits",
    "habitLogs",
    "todos",
    "settings",
  ];
  for (const field of arrayFields) {
    if (!Array.isArray(data[field])) {
      return { valid: false, error: `Bagian "${field}" di backup ini rusak atau hilang.` };
    }
  }

  // `goalImages` opsional (gak ada di backup v1 lama) — kalau ADA, harus array.
  if (data.goalImages !== undefined && !Array.isArray(data.goalImages)) {
    return { valid: false, error: `Bagian "goalImages" di backup ini rusak.` };
  }

  // Cek dangkal per-record — bukan validasi tiap field exhaustive, cukup
  // buat nangkep file yang jelas-jelas bukan backup heibi atau kepotong.
  const goals = data.savingsGoals as unknown[];
  for (const g of goals) {
    if (
      typeof g !== "object" ||
      g === null ||
      typeof (g as Goal).id !== "string" ||
      typeof (g as Goal).name !== "string" ||
      typeof (g as Goal).targetAmount !== "number"
    ) {
      return { valid: false, error: "Ada data goal tabungan yang gak valid di backup ini." };
    }
  }

  const habits = data.habits as unknown[];
  for (const h of habits) {
    if (
      typeof h !== "object" ||
      h === null ||
      typeof (h as Habit).id !== "string" ||
      typeof (h as Habit).name !== "string"
    ) {
      return { valid: false, error: "Ada data habit yang gak valid di backup ini." };
    }
  }

  return { valid: true, payload: obj as unknown as BackupPayload };
}

/**
 * REPLACE total — semua data existing di device DIHAPUS, diganti isi backup.
 * Bukan merge. UI WAJIB konfirmasi eksplisit ke user sebelum manggil ini
 * (lihat `app/settings.tsx`), karena ini destruktif dan gak ada undo.
 */
export async function restoreFromBackup(payload: BackupPayload): Promise<void> {
  const db = await getDb();
  const { data } = payload;

  // Tulis ulang gambar goal dari base64 DULUAN, di luar transaction DB (ini
  // I/O filesystem, bukan operasi SQLite). Hasilnya map goalId -> URI lokal
  // BARU yang valid di device ini. Kalau nulis satu gambar gagal, goal itu
  // tetap direstore (cuma tanpa gambar) — bukan bikin restore gagal total.
  const goalIdToImageUri = new Map<string, string | null>();
  for (const img of data.goalImages ?? []) {
    try {
      goalIdToImageUri.set(img.goalId, writeGoalImageFromBase64(img.base64, img.extension));
    } catch {
      goalIdToImageUri.set(img.goalId, null);
    }
  }

  await db.withExclusiveTransactionAsync(async (txn) => {
    // Urutan hapus: anak dulu baru induk gak masalah di sini karena semua
    // FK udah ON DELETE CASCADE — tapi tetap eksplisit hapus semua tabel
    // biar gak nyisa baris "yatim" kalau backup lama gak lengkap.
    await txn.runAsync("DELETE FROM savings_tx");
    await txn.runAsync("DELETE FROM savings_goals");
    await txn.runAsync("DELETE FROM habit_logs");
    await txn.runAsync("DELETE FROM habits");
    await txn.runAsync("DELETE FROM todos");
    // Setting internal punya device ini SENGAJA dipertahankan (bukan ikut
    // di-hapus/restore dari backup) — flag migrasi & pending-deletion itu
    // fakta lokal device ini, bukan sesuatu yang masuk akal "dipulihkan".
    await txn.runAsync(
      `DELETE FROM settings WHERE key NOT IN (${[...INTERNAL_SETTINGS_KEYS].map(() => "?").join(",") || "''"})`,
      [...INTERNAL_SETTINGS_KEYS],
    );

    for (const g of data.savingsGoals) {
      // Kalau goalImages punya entry buat goal ini, pake URI baru yang udah
      // ditulis ulang di device ini. Kalau gak ada entry (backup v1 lama
      // tanpa `goalImages`, atau gambarnya gagal dibaca pas export) fallback
      // ke `g.imageUri` apa adanya — sama kayak behavior lama.
      const imageUri =
        (goalIdToImageUri.has(g.id) ? goalIdToImageUri.get(g.id) : g.imageUri) ?? null;
      await txn.runAsync(
        `INSERT INTO savings_goals (id, name, target_amount, current_amount, image_uri, emoji, accent, created_at, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [g.id, g.name, g.targetAmount, g.currentAmount, imageUri, g.emoji ?? null, g.accent, g.createdAt, g.sortOrder],
      );
    }
    for (const t of data.savingsTransactions) {
      await txn.runAsync(
        `INSERT INTO savings_tx (id, goal_id, type, amount, note, created_at) VALUES (?, ?, ?, ?, ?, ?)`,
        [t.id, t.goalId, t.type, t.amount, t.note ?? null, t.createdAt],
      );
    }
    for (const h of data.habits) {
      await txn.runAsync(
        `INSERT INTO habits
          (id, name, icon, color, frequency_type, weekdays_mask, reminder_time, notification_id, best_streak, created_at, archived_at, sort_order)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          h.id,
          h.name,
          h.icon,
          h.color,
          h.frequencyType,
          h.weekdaysMask,
          h.reminderTime,
          // notification_id SENGAJA gak dipulihkan — ID notifikasi lama itu
          // gak valid lagi di device ini (belum tentu ke-schedule ulang).
          // Reminder tetap kesimpen di reminderTime, user tinggal edit
          // habit-nya kalau mau nyalain lagi remindernya.
          null,
          h.bestStreak,
          h.createdAt,
          h.archivedAt,
          h.sortOrder,
        ],
      );
    }
    for (const l of data.habitLogs) {
      await txn.runAsync(
        `INSERT INTO habit_logs (id, habit_id, date, completed_at) VALUES (?, ?, ?, ?)`,
        [l.id, l.habitId, l.date, l.completedAt],
      );
    }
    for (const td of data.todos) {
      await txn.runAsync(
        `INSERT INTO todos (id, title, date, completed_at, created_at) VALUES (?, ?, ?, ?, ?)`,
        [td.id, td.title, td.date, td.completedAt, td.createdAt],
      );
    }
    for (const s of data.settings) {
      if (INTERNAL_SETTINGS_KEYS.has(s.key)) continue;
      await txn.runAsync(
        "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
        [s.key, s.value],
      );
    }
  });
}
