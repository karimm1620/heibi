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
  const providerXml = read(
    "modules/expo-home-widgets/android/src/main/res/xml/heatmap_widget_info.xml",
  );

  it("keeps parser keys aligned with the JavaScript snapshot", () => {
    for (const key of ["generatedAt", "goals", "habits", "colorHex", "currentStreak", "days", "dateKey", "done"]) {
      expect(reader).toContain(`\"${key}\"`);
    }
  });

  it("renders the fourteen snapshot-date slots without desynchronizing the streak", () => {
    expect(renderer).toContain("snapshot.habits.take(layout.maxRows)");
    expect(renderer).not.toContain("alignWidgetDays");
    expect(renderer).toContain("for ((index, day) in habit.days.withIndex())");
  });

  it("uses bounded compact, medium, and wide cell sizes instead of weighted bars", () => {
    expect(renderer).toContain("width < 240.dp");
    expect(renderer).toContain("width >= 360.dp");
    expect(renderer).toContain("cellSize = 5.dp");
    expect(renderer).toContain("cellSize = 6.dp");
    expect(renderer).toContain("cellSize = 10.dp");
    expect(renderer).not.toContain(".defaultWeight()\n            .height");
  });

  it("retains launcher resize metadata and the exact-size renderer", () => {
    expect(renderer).toContain("SizeMode.Exact");
    expect(providerXml).toContain('android:minWidth="180dp"');
    expect(providerXml).toContain('android:minHeight="70dp"');
    expect(providerXml).toContain('android:maxResizeWidth="450dp"');
    expect(providerXml).toContain('android:maxResizeHeight="500dp"');
    expect(providerXml).toContain('android:resizeMode="horizontal|vertical"');
  });

  it("centralizes mutation and hydration sync without adding widget variants", () => {
    const sync = read("src/widgets/syncWidgetSnapshot.ts");
    const rootLayout = read("app/_layout.tsx");

    expect(sync).toContain("state.goals !== prevState.goals");
    expect(sync).toContain("state.habits !== prevState.habits");
    expect(sync).toContain("state.habitLogs !== prevState.habitLogs");
    expect(sync).toContain("createWidgetSnapshotSyncCoordinator");
    expect(rootLayout).toContain("registerWidgetSync();");
    expect(rootLayout).toContain("syncWidgetSnapshot();");
    expect(renderer).not.toMatch(/SimpleTracker|SavingsVariant|Checkpoint 9/);
  });
});
