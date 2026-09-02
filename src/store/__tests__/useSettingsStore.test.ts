/* eslint-disable @typescript-eslint/no-require-imports -- each test reloads
   the Zustand and database singletons after jest.resetModules(). */
import { createTestSqliteDb, type TestSqliteDb } from "../../testUtils/sqliteTestAdapter";

beforeEach(() => {
  jest.resetModules();
});

function mockExpoSqliteWith(testDb: TestSqliteDb) {
  jest.doMock("expo-sqlite", () => ({
    openDatabaseAsync: jest.fn().mockResolvedValue(testDb),
  }));
}

async function loadSettingsStore(testDb: TestSqliteDb) {
  mockExpoSqliteWith(testDb);
  const { initDatabase } = require("../../db/client");
  await initDatabase();
  const { useSettingsStore } = require("../useSettingsStore");
  return useSettingsStore;
}

describe("useSettingsStore — visual theme", () => {
  it("defaults an existing database without visual_theme to material3", async () => {
    const testDb = await createTestSqliteDb();
    const useSettingsStore = await loadSettingsStore(testDb);

    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().visualTheme).toBe("material3");
    expect(useSettingsStore.getState().hasHydrated).toBe(true);
  });

  it("hydrates a persisted liquid theme", async () => {
    const testDb = await createTestSqliteDb();
    await testDb.execAsync(
      `CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
    );
    await testDb.runAsync(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
      ["visual_theme", JSON.stringify("liquid")],
    );
    const useSettingsStore = await loadSettingsStore(testDb);

    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().visualTheme).toBe("liquid");
  });

  it.each([
    ["malformed JSON", "not-json"],
    ["unknown future value", JSON.stringify("liquid-v2")],
    ["wrong JSON type", JSON.stringify({ theme: "liquid" })],
  ])("falls back to material3 for %s", async (_label, storedValue) => {
    const testDb = await createTestSqliteDb();
    await testDb.execAsync(
      `CREATE TABLE settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL);`,
    );
    await testDb.runAsync(
      "INSERT INTO settings (key, value) VALUES (?, ?)",
      ["visual_theme", storedValue],
    );
    const useSettingsStore = await loadSettingsStore(testDb);

    await expect(useSettingsStore.getState().hydrate()).resolves.toBeUndefined();
    expect(useSettingsStore.getState().visualTheme).toBe("material3");
  });

  it("writes through to SQLite and survives a fresh store instance", async () => {
    const testDb = await createTestSqliteDb();
    let useSettingsStore = await loadSettingsStore(testDb);
    await useSettingsStore.getState().hydrate();

    await useSettingsStore.getState().setVisualTheme("liquid");

    expect(useSettingsStore.getState().visualTheme).toBe("liquid");
    expect(
      await testDb.getFirstAsync<{ value: string }>(
        "SELECT value FROM settings WHERE key = ?",
        ["visual_theme"],
      ),
    ).toEqual({ value: JSON.stringify("liquid") });

    jest.resetModules();
    useSettingsStore = await loadSettingsStore(testDb);
    await useSettingsStore.getState().hydrate();

    expect(useSettingsStore.getState().visualTheme).toBe("liquid");
  });

  it("persists the selected language", async () => {
    const testDb = await createTestSqliteDb();
    let useSettingsStore = await loadSettingsStore(testDb);
    await useSettingsStore.getState().hydrate();

    await useSettingsStore.getState().setLanguage("en");

    jest.resetModules();
    useSettingsStore = await loadSettingsStore(testDb);
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().language).toBe("en");
  });

  it("persists independent savings and planner reminder settings", async () => {
    const testDb = await createTestSqliteDb();
    let useSettingsStore = await loadSettingsStore(testDb);
    await useSettingsStore.getState().hydrate();

    await useSettingsStore.getState().setReminder("savings", true, 7, 15, "saving-id");
    await useSettingsStore.getState().setReminder("planner", true, 20, 30, "planner-id");

    jest.resetModules();
    useSettingsStore = await loadSettingsStore(testDb);
    await useSettingsStore.getState().hydrate();
    expect(useSettingsStore.getState().savingsReminder).toEqual({
      enabled: true,
      hour: 7,
      minute: 15,
      notificationId: "saving-id",
    });
    expect(useSettingsStore.getState().plannerReminder).toEqual({
      enabled: true,
      hour: 20,
      minute: 30,
      notificationId: "planner-id",
    });
  });
});
