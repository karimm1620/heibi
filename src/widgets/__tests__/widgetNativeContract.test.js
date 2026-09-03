const fs = require("node:fs");
const path = require("node:path");
const { describe, expect, it } = require("@jest/globals");

const read = (relativePath) =>
  fs.readFileSync(path.join(process.cwd(), relativePath), "utf8");

describe("home widget native contract", () => {
  const reader = read(
    "modules/expo-home-widgets/android/src/main/java/expo/modules/homewidgets/widgets/WidgetSnapshotReader.kt",
  );
  const renderer = read(
    "modules/expo-home-widgets/android/src/main/java/expo/modules/homewidgets/widgets/HeatmapWidget.kt",
  );
  const tracker = read(
    "modules/expo-home-widgets/android/src/main/java/expo/modules/homewidgets/widgets/SimpleTrackerWidget.kt",
  );
  const saving = read(
    "modules/expo-home-widgets/android/src/main/java/expo/modules/homewidgets/widgets/GoalBalanceWidget.kt",
  );
  const chart = read(
    "modules/expo-home-widgets/android/src/main/java/expo/modules/homewidgets/widgets/ChartWidget.kt",
  );
  const manifest = read("modules/expo-home-widgets/android/src/main/AndroidManifest.xml");
  const providerXml = read(
    "modules/expo-home-widgets/android/src/main/res/xml/heatmap_widget_info.xml",
  );

  it("keeps parser keys aligned with the JavaScript snapshot", () => {
    for (const key of ["version", "generatedAt", "goals", "habits", "transactions", "createdAt", "goalId", "type", "amount", "colorHex", "currentStreak", "dueToday", "days", "dateKey", "done"]) {
      expect(reader).toContain(`\"${key}\"`);
    }
  });

  it("renders the fourteen snapshot-date slots without desynchronizing the streak", () => {
    expect(renderer).toContain("snapshot.habits.take(layout.maxRows)");
    expect(renderer).not.toContain("alignWidgetDays");
    expect(renderer).toContain("HEATMAP_DAY_COUNT = 14");
    expect(renderer).toContain("HEATMAP_WEEK_COLUMNS = 7");
    expect(renderer).toContain("habit.days.takeLast(HEATMAP_DAY_COUNT)");
    expect(renderer).toContain("days.chunked(HEATMAP_WEEK_COLUMNS)");
    expect(renderer).not.toMatch(/take(?:Last)?\([1-9]\)/);
    expect(renderer).not.toContain("🔥");
  });

  it("uses bounded compact, medium, and wide cell sizes instead of weighted bars", () => {
    expect(renderer).toContain("width < 240.dp");
    expect(renderer).toContain("width < 360.dp");
    expect(renderer).toContain("HeatmapLayout(5.dp");
    expect(renderer).toContain("HeatmapLayout(7.dp");
    expect(renderer).toContain("HeatmapLayout(9.dp");
  });

  it("retains launcher resize metadata and the exact-size renderer", () => {
    expect(renderer).toContain("SizeMode.Exact");
    expect(providerXml).toContain('android:minWidth="180dp"');
    expect(providerXml).toContain('android:minHeight="70dp"');
    expect(providerXml).toContain('android:maxResizeWidth="450dp"');
    expect(providerXml).toContain('android:maxResizeHeight="500dp"');
    expect(providerXml).toContain('android:resizeMode="horizontal|vertical"');
  });

  it("centralizes mutation and hydration sync for the exact four-widget suite", () => {
    const sync = read("src/widgets/syncWidgetSnapshot.ts");
    const rootLayout = read("app/_layout.tsx");

    expect(sync).toContain("state.goals !== prevState.goals");
    expect(sync).toContain("state.transactions !== prevState.transactions");
    expect(sync).toContain("state.habits !== prevState.habits");
    expect(sync).toContain("state.habitLogs !== prevState.habitLogs");
    expect(sync).toContain("createWidgetSnapshotSyncCoordinator");
    expect(rootLayout).toContain("registerWidgetSync();");
    expect(rootLayout).toContain("syncWidgetSnapshot();");
    for (const provider of ["HeatmapWidgetProvider", "SimpleTrackerWidgetProvider", "GoalBalanceWidgetProvider", "ChartWidgetProvider"]) {
      expect(manifest).toContain(provider);
    }
    expect((manifest.match(/android:name="\.widgets\.[A-Za-z]+WidgetProvider"/g) ?? [])).toHaveLength(4);
    expect(tracker).toContain("dueToday");
    expect(saving).toContain("WidgetDeepLinks.goal");
    expect(chart).toContain("buildWidgetBalances");
    expect(chart).toContain("drawTrendBitmap");
    expect(chart).toContain("coerceIn(2, 720)");
    expect(chart).toContain("coerceIn(2, 160)");
  });

  it("centralizes deep links and keeps widgets snapshot-driven", () => {
    const links = read("modules/expo-home-widgets/android/src/main/java/expo/modules/homewidgets/widgets/WidgetDeepLinks.kt");
    const updater = read("modules/expo-home-widgets/android/src/main/java/expo/modules/homewidgets/widgets/WidgetUpdater.kt");
    expect(links).toContain('private const val SCHEME = "heibi"');
    expect(links).toContain("goalProgress");
    expect(updater).toContain("SimpleTrackerWidgetProvider::class.java");
    expect(updater).toContain("ChartWidgetProvider::class.java");
    expect(updater).toContain("getAppWidgetIds");
    expect(updater).toContain("getGlanceIdBy(appWidgetId)");
    expect(updater).toContain("WidgetSnapshotJsonKey");
    expect(updater).toContain("updateAppWidgetState");
    expect(tracker).toContain("currentState<Preferences>()");
    expect(tracker).toContain("WidgetSnapshotReader.parse");
    expect(updater).not.toMatch(/scheduleAtFixedRate|WorkManager|setInterval/);
    expect([renderer, tracker, saving, chart].join("\n")).not.toMatch(/SQLite|setInterval|scheduleAtFixedRate/);
  });
});
