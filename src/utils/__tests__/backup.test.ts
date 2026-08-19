import { BACKUP_FORMAT_VERSION, validateBackupPayload } from "../backup";

/** Payload v2 minimal yang valid — dipakai sebagai basis, di-mutasi per test. */
function makeValidPayload(overrides: Record<string, unknown> = {}) {
  return {
    formatVersion: BACKUP_FORMAT_VERSION,
    exportedAt: Date.now(),
    data: {
      savingsGoals: [
        {
          id: "goal_1",
          name: "Motor baru",
          targetAmount: 10_000_000,
          currentAmount: 0,
          accent: "orange",
          createdAt: Date.now(),
          sortOrder: 0,
        },
      ],
      savingsTransactions: [],
      habits: [
        {
          id: "habit_1",
          name: "Baca buku",
          icon: "book",
          color: "blue",
          frequencyType: "daily",
          weekdaysMask: 0,
          reminderTime: null,
          bestStreak: 0,
          createdAt: Date.now(),
          archivedAt: null,
          sortOrder: 0,
        },
      ],
      habitLogs: [],
      todos: [],
      settings: [],
      goalImages: [{ goalId: "goal_1", base64: "aGVsbG8=", extension: ".jpg" }],
      ...overrides,
    },
  };
}

describe("validateBackupPayload — kasus valid", () => {
  it("terima payload v2 lengkap dengan goalImages", () => {
    const result = validateBackupPayload(makeValidPayload());
    expect(result.valid).toBe(true);
    expect(result.payload).toBeDefined();
  });

  it("terima payload v1 lama tanpa field goalImages sama sekali (backward-compat)", () => {
    const v1 = makeValidPayload({ goalImages: undefined });
    delete (v1.data as Record<string, unknown>).goalImages;
    const result = validateBackupPayload({ ...v1, formatVersion: 1 });
    expect(result.valid).toBe(true);
  });
});

describe("validateBackupPayload — struktur dasar rusak", () => {
  it("tolak input yang bukan object", () => {
    expect(validateBackupPayload(null).valid).toBe(false);
    expect(validateBackupPayload("bukan json").valid).toBe(false);
    expect(validateBackupPayload(42).valid).toBe(false);
  });

  it("tolak kalau formatVersion gak ada / bukan number", () => {
    const payload = makeValidPayload();
    // @ts-expect-error sengaja rusak buat test
    delete payload.formatVersion;
    expect(validateBackupPayload(payload).valid).toBe(false);
  });

  it("tolak backup dari versi app yang LEBIH BARU dari yang didukung", () => {
    const payload = makeValidPayload({ }) as { formatVersion: number };
    payload.formatVersion = BACKUP_FORMAT_VERSION + 1;
    const result = validateBackupPayload(payload);
    expect(result.valid).toBe(false);
    expect(result.error).toMatch(/lebih baru/i);
  });

  it("tolak kalau field data gak ada", () => {
    const payload = makeValidPayload() as Record<string, unknown>;
    delete payload.data;
    expect(validateBackupPayload(payload).valid).toBe(false);
  });
});

describe("validateBackupPayload — field array wajib", () => {
  const requiredArrayFields = [
    "savingsGoals",
    "savingsTransactions",
    "habits",
    "habitLogs",
    "todos",
    "settings",
  ];

  for (const field of requiredArrayFields) {
    it(`tolak kalau "${field}" bukan array`, () => {
      const payload = makeValidPayload({ [field]: "bukan array" });
      const result = validateBackupPayload(payload);
      expect(result.valid).toBe(false);
      expect(result.error).toContain(field);
    });
  }

  it("tolak kalau goalImages ADA tapi bukan array", () => {
    const payload = makeValidPayload({ goalImages: "bukan array" });
    const result = validateBackupPayload(payload);
    expect(result.valid).toBe(false);
    expect(result.error).toContain("goalImages");
  });
});

describe("validateBackupPayload — record per-item gak valid", () => {
  it("tolak goal yang gak punya id/name/targetAmount valid", () => {
    const payload = makeValidPayload({
      savingsGoals: [{ id: "goal_1" /* name & targetAmount ilang */ }],
    });
    expect(validateBackupPayload(payload).valid).toBe(false);
  });

  it("tolak habit yang gak punya id/name valid", () => {
    const payload = makeValidPayload({
      habits: [{ id: "habit_1" /* name ilang */ }],
    });
    expect(validateBackupPayload(payload).valid).toBe(false);
  });
});
