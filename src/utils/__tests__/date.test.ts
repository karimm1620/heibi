import {
  ALL_WEEKDAYS_MASK,
  addDays,
  buildHeatmapWeeks,
  calculateCompletionRate,
  calculateCurrentStreak,
  getLocalDateKey,
  getWeekdayIndex,
  isHabitDueOnDate,
  isWeekdaySelected,
  parseDateKey,
  startOfWeekMonday,
  toggleWeekdayBit,
} from "../date";

// Referensi minggu tetap dipakai di seluruh file ini biar gampang dicek manual:
// Sen 2026-08-17, Sel 08-18, Rab 08-19, Kam 08-20, Jum 08-21, Sab 08-22, Min 08-23.

describe("getLocalDateKey", () => {
  it("format YYYY-MM-DD, zero-padded, waktu lokal (bukan UTC)", () => {
    expect(getLocalDateKey(new Date(2026, 0, 5))).toBe("2026-01-05");
    expect(getLocalDateKey(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("parseDateKey", () => {
  it("roundtrip sama getLocalDateKey, gak geser tanggal", () => {
    const key = "2026-08-19";
    expect(getLocalDateKey(parseDateKey(key))).toBe(key);
  });
});

describe("getWeekdayIndex", () => {
  it("Senin=0 ... Minggu=6 (kebalikan Date#getDay bawaan)", () => {
    expect(getWeekdayIndex(new Date(2026, 7, 17))).toBe(0); // Senin
    expect(getWeekdayIndex(new Date(2026, 7, 19))).toBe(2); // Rabu
    expect(getWeekdayIndex(new Date(2026, 7, 23))).toBe(6); // Minggu
  });
});

describe("addDays", () => {
  it("nambah/ngurangin hari, hasil dinormalize ke tengah malam lokal", () => {
    const base = new Date(2026, 7, 19, 23, 59);
    const next = addDays(base, 1);
    expect(getLocalDateKey(next)).toBe("2026-08-20");
    expect(next.getHours()).toBe(0);
    expect(next.getMinutes()).toBe(0);
  });

  it("handle rollover bulan", () => {
    expect(getLocalDateKey(addDays(new Date(2026, 7, 31), 1))).toBe("2026-09-01");
  });

  it("bisa mundur (angka negatif)", () => {
    expect(getLocalDateKey(addDays(new Date(2026, 7, 1), -1))).toBe("2026-07-31");
  });
});

describe("startOfWeekMonday", () => {
  it("balikin hari Senin di minggu yang sama", () => {
    expect(getLocalDateKey(startOfWeekMonday(new Date(2026, 7, 20)))).toBe("2026-08-17");
  });

  it("no-op kalau tanggalnya udah Senin", () => {
    expect(getLocalDateKey(startOfWeekMonday(new Date(2026, 7, 17)))).toBe("2026-08-17");
  });
});

describe("isWeekdaySelected / toggleWeekdayBit", () => {
  it("baca & toggle bit per-hari", () => {
    let mask = 0;
    expect(isWeekdaySelected(mask, 0)).toBe(false);
    mask = toggleWeekdayBit(mask, 0);
    expect(isWeekdaySelected(mask, 0)).toBe(true);
    mask = toggleWeekdayBit(mask, 0);
    expect(isWeekdaySelected(mask, 0)).toBe(false);
  });

  it("ALL_WEEKDAYS_MASK milih semua 7 hari", () => {
    for (let i = 0; i < 7; i++) {
      expect(isWeekdaySelected(ALL_WEEKDAYS_MASK, i)).toBe(true);
    }
  });
});

describe("isHabitDueOnDate", () => {
  it("habit daily selalu due", () => {
    const habit = { frequencyType: "daily" as const, weekdaysMask: 0 };
    expect(isHabitDueOnDate(habit, "2026-08-19")).toBe(true);
    expect(isHabitDueOnDate(habit, "2026-08-23")).toBe(true);
  });

  it("habit weekdays cuma due di hari yang dipilih", () => {
    // Cuma Senin (index 0) yang dipilih
    const habit = { frequencyType: "weekdays" as const, weekdaysMask: 0b0000001 };
    expect(isHabitDueOnDate(habit, "2026-08-17")).toBe(true); // Senin
    expect(isHabitDueOnDate(habit, "2026-08-18")).toBe(false); // Selasa
  });
});

describe("calculateCompletionRate", () => {
  it("hitung persentase hari DUE yang completed dalam window", () => {
    const habit = { frequencyType: "daily" as const, weekdaysMask: 0 };
    const completed = new Set(["2026-08-17", "2026-08-18", "2026-08-19"]);
    // window 4 hari berakhir 08-19: 08-16,17,18,19 semua due (daily)
    // completed: 17,18,19 -> 3/4 = 75%
    const rate = calculateCompletionRate(habit, completed, 4, new Date(2026, 7, 19));
    expect(rate).toBe(75);
  });

  it("return 0 kalau gak ada hari yang due di window (weekdaysMask kosong)", () => {
    const habit = { frequencyType: "weekdays" as const, weekdaysMask: 0 };
    const rate = calculateCompletionRate(habit, new Set(), 7, new Date(2026, 7, 19));
    expect(rate).toBe(0);
  });

  it("cuma ngitung hari DUE, hari libur gak masuk pembagi", () => {
    // Cuma Rabu (index 2) yang due
    const habit = { frequencyType: "weekdays" as const, weekdaysMask: 0b0000100 };
    const completed = new Set(["2026-08-19"]); // Rabu ini completed
    // window 7 hari (08-13..08-19): cuma ada 1 Rabu di window ini (08-19 itu sendiri)
    const rate = calculateCompletionRate(habit, completed, 7, new Date(2026, 7, 19));
    expect(rate).toBe(100);
  });
});

describe("buildHeatmapWeeks", () => {
  it("bikin N minggu, tiap minggu 7 hari, mulai dari Senin", () => {
    const { weeks } = buildHeatmapWeeks(3, new Date(2026, 7, 19));
    expect(weeks).toHaveLength(3);
    weeks.forEach((week) => expect(week).toHaveLength(7));
    // Minggu terakhir (minggu ini) harus mulai dari Senin 2026-08-17
    expect(weeks[2][0].dateKey).toBe("2026-08-17");
    expect(weeks[2][0].weekdayIndex).toBe(0);
  });

  it("nandain hari SETELAH referenceDate sebagai isFuture", () => {
    const { weeks } = buildHeatmapWeeks(1, new Date(2026, 7, 19)); // Rabu
    const thisWeek = weeks[0];
    const wed = thisWeek.find((d) => d.dateKey === "2026-08-19");
    const thu = thisWeek.find((d) => d.dateKey === "2026-08-20");
    expect(wed?.isFuture).toBe(false);
    expect(thu?.isFuture).toBe(true);
  });
});

describe("calculateCurrentStreak", () => {
  const daily = { frequencyType: "daily" as const, weekdaysMask: 0 };
  // Senin-Jumat aja (bit 0-4)
  const weekdaysOnly = { frequencyType: "weekdays" as const, weekdaysMask: 0b0011111 };

  it("grace period: hari ini due tapi belum completed -> streak dihitung dari kemarin, BUKAN putus", () => {
    const completed = new Set(["2026-08-16", "2026-08-17", "2026-08-18"]); // 08-19 (hari ini) belum
    const streak = calculateCurrentStreak(daily, completed, new Date(2026, 7, 19));
    expect(streak).toBe(3);
  });

  it("hari ini due DAN completed -> ikut dihitung", () => {
    const completed = new Set(["2026-08-17", "2026-08-18", "2026-08-19"]);
    const streak = calculateCurrentStreak(daily, completed, new Date(2026, 7, 19));
    expect(streak).toBe(3);
  });

  it("ada bolong di tengah -> streak berhenti di situ, gak ngitung yang sebelum bolong", () => {
    // 08-17 SENGAJA gak completed, 08-16/08-18/08-19 completed
    const completed = new Set(["2026-08-16", "2026-08-18", "2026-08-19"]);
    const streak = calculateCurrentStreak(daily, completed, new Date(2026, 7, 19));
    expect(streak).toBe(2); // cuma 08-19 & 08-18
  });

  it("gak ada yang completed sama sekali -> 0", () => {
    const streak = calculateCurrentStreak(daily, new Set(), new Date(2026, 7, 19));
    expect(streak).toBe(0);
  });

  it("habit weekdays: akhir pekan di-skip, gak motong streak", () => {
    // Completed: Kam 08-13, Jum 08-14, Sen 08-17, Sel 08-18. Rabu 08-19 (hari ini) belum.
    const completed = new Set(["2026-08-13", "2026-08-14", "2026-08-17", "2026-08-18"]);
    const streak = calculateCurrentStreak(weekdaysOnly, completed, new Date(2026, 7, 19));
    // Grace shift ke Sel 08-18(+1) -> Sen 08-17(+2) -> Min/Sab di-skip -> Jum 08-14(+3) -> Kam 08-13(+4) -> Rab 08-12 gak completed, stop
    expect(streak).toBe(4);
  });

  it("hari ini BUKAN hari due (weekend buat habit weekdays) -> gak trigger grace shift, tetep dihitung bener", () => {
    // Sabtu 08-22 bukan hari due buat weekdaysOnly. Jumat 08-21 completed.
    const completed = new Set(["2026-08-21"]);
    const streak = calculateCurrentStreak(weekdaysOnly, completed, new Date(2026, 7, 22));
    expect(streak).toBe(1);
  });
});
