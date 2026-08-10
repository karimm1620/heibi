import type { Habit, WeekdaysMask } from "../types";

const INDONESIAN_WEEKDAYS = [
  "Minggu",
  "Senin",
  "Selasa",
  "Rabu",
  "Kamis",
  "Jumat",
  "Sabtu",
];

export const INDONESIAN_MONTHS = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

/**
 * "Minggu, 20 Juli" — hardcode nama hari/bulan Indonesia (bukan `Intl`/
 * `toLocaleDateString`) karena dukungan ICU locale Hermes gak konsisten di
 * semua build Android, dan seluruh app ini emang berbahasa Indonesia.
 */
export function formatIndonesianDate(date: Date = new Date()): string {
  return `${INDONESIAN_WEEKDAYS[date.getDay()]}, ${date.getDate()} ${INDONESIAN_MONTHS[date.getMonth()]}`;
}

/** "YYYY-MM-DD" di waktu LOKAL device — BUKAN `toISOString()` (itu UTC, bisa geser tanggal). */
export function getLocalDateKey(date: Date = new Date()): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

export function parseDateKey(dateKey: string): Date {
  const [y, m, d] = dateKey.split("-").map(Number);
  return new Date(y, m - 1, d);
}

/** Senin=0 ... Minggu=6 (beda dari `Date.getDay()` bawaan JS yang Minggu=0). */
export function getWeekdayIndex(date: Date): number {
  const jsDay = date.getDay();
  return jsDay === 0 ? 6 : jsDay - 1;
}

/** Tambah/kurang N hari, normalize ke tengah malam LOKAL (bukan geser jam). */
export function addDays(date: Date, days: number): Date {
  const result = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  result.setDate(result.getDate() + days);
  return result;
}

/** Senin minggu itu — buat `WeekCalendarStrip` (Senin=0 konsisten sama `getWeekdayIndex`). */
export function startOfWeekMonday(date: Date): Date {
  return addDays(date, -getWeekdayIndex(date));
}

/** "14:05" dari epoch ms, waktu LOKAL device (`Date.getHours/getMinutes` udah otomatis lokal, bukan UTC). */
export function formatTimeOfDay(epochMs: number): string {
  const date = new Date(epochMs);
  const h = String(date.getHours()).padStart(2, "0");
  const m = String(date.getMinutes()).padStart(2, "0");
  return `${h}:${m}`;
}

export const ALL_WEEKDAYS_MASK: WeekdaysMask = 0b1111111; // 127 — semua hari

export function isWeekdaySelected(
  mask: WeekdaysMask,
  weekdayIndex: number,
): boolean {
  return (mask & (1 << weekdayIndex)) !== 0;
}

export function toggleWeekdayBit(
  mask: WeekdaysMask,
  weekdayIndex: number,
): WeekdaysMask {
  return mask ^ (1 << weekdayIndex);
}

export function isHabitDueOnDate(
  habit: Pick<Habit, "frequencyType" | "weekdaysMask">,
  dateKey: string,
): boolean {
  if (habit.frequencyType === "daily") return true;
  return isWeekdaySelected(habit.weekdaysMask, getWeekdayIndex(parseDateKey(dateKey)));
}

/**
 * Persentase hari DUE yang completed dalam `windowDays` hari kalender
 * terakhir (termasuk hari ini). Beda dari streak — ini gak peduli
 * berturut-turut atau enggak, murni rasio.
 */
export function calculateCompletionRate(
  habit: Pick<Habit, "frequencyType" | "weekdaysMask">,
  completedDateKeys: ReadonlySet<string>,
  windowDays: number = 30,
  referenceDate: Date = new Date(),
): number {
  const cursor = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  let due = 0;
  let done = 0;
  for (let i = 0; i < windowDays; i++) {
    const key = getLocalDateKey(cursor);
    if (isHabitDueOnDate(habit, key)) {
      due++;
      if (completedDateKeys.has(key)) done++;
    }
    cursor.setDate(cursor.getDate() - 1);
  }
  return due > 0 ? Math.round((done / due) * 100) : 0;
}

export const WEEKDAY_LABELS_SHORT = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const INDONESIAN_MONTHS_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

export interface HeatmapDay {
  dateKey: string;
  /** 0=Senin ... 6=Minggu */
  weekdayIndex: number;
  isFuture: boolean;
}

/**
 * Versi GABUNGAN dari `buildHeatmapWeeks` — ngitung rasio completion di
 * SEMUA habit aktif per hari (bukan per-habit kayak `HabitHeatmap.tsx` yang
 * dipakai di `habit/[id].tsx`, itu SENGAJA gak diubah/disentuh). Dipakai
 * buat heatmap ringkasan konsistensi di atas tab History.
 */
export function buildHabitConsistencyHeatmap(
  habits: Pick<Habit, "id" | "frequencyType" | "weekdaysMask" | "archivedAt">[],
  habitLogs: { habitId: string; date: string }[],
  numberOfWeeks: number,
  referenceDate: Date = new Date(),
) {
  const activeHabits = habits.filter((h) => !h.archivedAt);
  const completedSetByHabit = new Map<string, Set<string>>();
  for (const habit of activeHabits) {
    completedSetByHabit.set(
      habit.id,
      new Set(
        habitLogs.filter((l) => l.habitId === habit.id).map((l) => l.date),
      ),
    );
  }

  const { weeks, monthLabelByWeekIndex } = buildHeatmapWeeks(
    numberOfWeeks,
    referenceDate,
  );

  const weeksWithRatio = weeks.map((week) =>
    week.map((day) => {
      if (day.isFuture) return { ...day, ratio: 0 };
      let due = 0;
      let done = 0;
      for (const habit of activeHabits) {
        if (isHabitDueOnDate(habit, day.dateKey)) {
          due++;
          if (completedSetByHabit.get(habit.id)?.has(day.dateKey)) done++;
        }
      }
      return { ...day, ratio: due > 0 ? done / due : 0 };
    }),
  );

  return { weeks: weeksWithRatio, monthLabelByWeekIndex };
}
export function buildHeatmapWeeks(
  numberOfWeeks: number,
  referenceDate: Date = new Date(),
): { weeks: HeatmapDay[][]; monthLabelByWeekIndex: (string | null)[] } {
  const today = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const todayWeekdayIndex = getWeekdayIndex(today);
  const currentWeekMonday = new Date(today);
  currentWeekMonday.setDate(today.getDate() - todayWeekdayIndex);

  const firstMonday = new Date(currentWeekMonday);
  firstMonday.setDate(currentWeekMonday.getDate() - (numberOfWeeks - 1) * 7);

  const weeks: HeatmapDay[][] = [];
  const monthLabelByWeekIndex: (string | null)[] = [];
  let lastMonth = -1;

  for (let w = 0; w < numberOfWeeks; w++) {
    const week: HeatmapDay[] = [];
    for (let d = 0; d < 7; d++) {
      const date = new Date(firstMonday);
      date.setDate(firstMonday.getDate() + w * 7 + d);
      week.push({
        dateKey: getLocalDateKey(date),
        weekdayIndex: d,
        isFuture: date.getTime() > today.getTime(),
      });
    }
    weeks.push(week);

    const mondayMonth = parseDateKey(week[0].dateKey).getMonth();
    if (mondayMonth !== lastMonth) {
      monthLabelByWeekIndex.push(INDONESIAN_MONTHS_SHORT[mondayMonth]);
      lastMonth = mondayMonth;
    } else {
      monthLabelByWeekIndex.push(null);
    }
  }

  return { weeks, monthLabelByWeekIndex };
}

// Batas aman buat cegah infinite loop kalau habit gak due di hari manapun
// (weekdaysMask = 0) — bukan angka yang punya arti fungsional.
const MAX_STREAK_LOOKBACK_DAYS = 3650;

/**
 * Hitung current streak: mundur dari `referenceDate`, ngitung hari-hari DUE
 * yang completed berturut-turut. Hari yang gak due (sesuai weekdaysMask)
 * di-SKIP — gak motong streak, cuma dilewatin.
 *
 * Grace period: kalau HARI INI due tapi belum di-mark selesai, streak BELUM
 * dianggap putus — mulai ngitung dari kemarin. User masih punya waktu
 * sampai tengah malam buat nyelesein hari ini.
 */
export function calculateCurrentStreak(
  habit: Pick<Habit, "frequencyType" | "weekdaysMask">,
  completedDateKeys: ReadonlySet<string>,
  referenceDate: Date = new Date(),
): number {
  const cursor = new Date(
    referenceDate.getFullYear(),
    referenceDate.getMonth(),
    referenceDate.getDate(),
  );
  const todayKey = getLocalDateKey(cursor);

  if (isHabitDueOnDate(habit, todayKey) && !completedDateKeys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  for (let i = 0; i < MAX_STREAK_LOOKBACK_DAYS; i++) {
    const key = getLocalDateKey(cursor);
    if (isHabitDueOnDate(habit, key)) {
      if (completedDateKeys.has(key)) {
        streak++;
      } else {
        break;
      }
    }
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}
