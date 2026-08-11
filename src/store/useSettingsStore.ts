import { create } from "zustand";
import { getDb } from "../db/client";
import type { Language } from "../i18n";

export type ReminderDomain = "savings" | "planner";

export interface ReminderSettings {
  enabled: boolean;
  hour: number;
  minute: number;
  notificationId: string | null;
}

const DEFAULT_REMINDER: ReminderSettings = {
  enabled: false,
  hour: 20,
  minute: 0,
  notificationId: null,
};

/**
 * Key `settings` per domain reminder. `savings` pakai key LAMA (`reminder`,
 * dari sebelum ada domain lain) — JANGAN diubah, biar reminder savings user
 * existing gak kereset ke default pas update ke versi ini.
 */
const SETTINGS_KEY_BY_DOMAIN: Record<ReminderDomain, string> = {
  savings: "reminder",
  planner: "planner_reminder",
};

/** Key generic `settings` buat flag onboarding — nama ini udah dianggap
 * sejak schema.ts ditulis (lihat komentar di atas `CREATE TABLE settings`). */
const ONBOARDING_KEY = "onboarding_complete";

const LANGUAGE_KEY = "language";
/** Default `id` -- user existing (belum pernah nge-set bahasa) TETAP dapet
 * Bahasa Indonesia kayak sebelumnya, gak ada perubahan behavior mendadak. */
const DEFAULT_LANGUAGE: Language = "id";

interface SettingsState {
  savingsReminder: ReminderSettings;
  plannerReminder: ReminderSettings;
  /** True kalau user udah pernah nyelesain/nge-skip flow onboarding. */
  hasOnboarded: boolean;
  hasHydrated: boolean;
  language: Language;

  /** Load setting dari SQLite ke memory. Panggil sekali di bootstrap app. */
  hydrate: () => Promise<void>;
  setReminder: (
    domain: ReminderDomain,
    enabled: boolean,
    hour: number,
    minute: number,
    notificationId: string | null,
  ) => Promise<void>;
  /** Tandai onboarding selesai (baik lewat flow lengkap atau tombol Lewati). */
  completeOnboarding: () => Promise<void>;
  setLanguage: (language: Language) => Promise<void>;
}

async function readReminder(
  db: Awaited<ReturnType<typeof getDb>>,
  domain: ReminderDomain,
): Promise<ReminderSettings> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [SETTINGS_KEY_BY_DOMAIN[domain]],
  );
  return row ? JSON.parse(row.value) : DEFAULT_REMINDER;
}

async function readOnboarded(
  db: Awaited<ReturnType<typeof getDb>>,
): Promise<boolean> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [ONBOARDING_KEY],
  );
  // Belum pernah ke-set = user baru / DB lama sebelum ada flag ini ->
  // dianggap belum onboarding, BUKAN error/exception.
  return row ? JSON.parse(row.value) === true : false;
}

async function readLanguage(db: Awaited<ReturnType<typeof getDb>>): Promise<Language> {
  const row = await db.getFirstAsync<{ value: string }>(
    "SELECT value FROM settings WHERE key = ?",
    [LANGUAGE_KEY],
  );
  return row ? (JSON.parse(row.value) as Language) : DEFAULT_LANGUAGE;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  savingsReminder: DEFAULT_REMINDER,
  plannerReminder: DEFAULT_REMINDER,
  hasOnboarded: false,
  hasHydrated: false,
  language: DEFAULT_LANGUAGE,

  hydrate: async () => {
    const db = await getDb();
    const [savingsReminder, plannerReminder, hasOnboarded, language] = await Promise.all([
      readReminder(db, "savings"),
      readReminder(db, "planner"),
      readOnboarded(db),
      readLanguage(db),
    ]);
    set({ savingsReminder, plannerReminder, hasOnboarded, language, hasHydrated: true });
  },

  setReminder: async (domain, enabled, hour, minute, notificationId) => {
    const db = await getDb();
    const value: ReminderSettings = { enabled, hour, minute, notificationId };
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [SETTINGS_KEY_BY_DOMAIN[domain], JSON.stringify(value)],
    );

    set(
      domain === "savings"
        ? { savingsReminder: value }
        : { plannerReminder: value },
    );
  },

  completeOnboarding: async () => {
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [ONBOARDING_KEY, JSON.stringify(true)],
    );
    set({ hasOnboarded: true });
  },

  setLanguage: async (language) => {
    const db = await getDb();
    await db.runAsync(
      "INSERT OR REPLACE INTO settings (key, value) VALUES (?, ?)",
      [LANGUAGE_KEY, JSON.stringify(language)],
    );
    set({ language });
  },
}));
