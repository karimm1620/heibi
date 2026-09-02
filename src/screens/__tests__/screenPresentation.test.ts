/* eslint-disable @typescript-eslint/no-require-imports, import/first -- source-contract guards run in Jest. */
const fs = require("fs") as { readFileSync: (path: string, encoding: string) => string };
const path = require("path") as { resolve: (...paths: string[]) => string; join: (...paths: string[]) => string };
import type { Goal, Transaction } from "../../types";
import { buildGoalList } from "../goalListPresentation";
import { buildHistorySections } from "../historySections";

const root = path.resolve(".");
const read = (relativePath: string) => fs.readFileSync(path.join(root, relativePath), "utf8");

const goal = (id: string, name: string, currentAmount: number, targetAmount = 100): Goal => ({
  id,
  name,
  currentAmount,
  targetAmount,
  accent: "mint",
  emoji: "🎯",
  imageUri: undefined,
  createdAt: 1,
  sortOrder: 0,
});

describe("screen presentation contracts", () => {
  it("keeps the dependency graph on the aligned Expo SDK 57 family", () => {
    const packageJson = JSON.parse(read("package.json")) as {
      dependencies: Record<string, string>;
    };

    expect(packageJson.dependencies.expo).toBe("~57.0.19");
    expect(packageJson.dependencies["@expo/ui"]).toBe("~57.0.15");
    expect(packageJson.dependencies.react).toBe("19.2.3");
    expect(packageJson.dependencies["react-native"]).toBe("0.86.3");
    expect(packageJson.dependencies["react-native-gesture-handler"]).toBe("~2.32.0");
    expect(packageJson.dependencies["react-native-reanimated"]).toBe("4.5.1");
  });

  it("filters and sorts goals without changing persisted manual order", () => {
    const goals = [goal("b", "Beta", 25), goal("a", "Alpha", 100)];

    expect(buildGoalList(goals, "newest", false).map((item) => item.id)).toEqual(["b", "a"]);
    expect(buildGoalList(goals, "closest", false).map((item) => item.id)).toEqual(["a", "b"]);
    expect(buildGoalList(goals, "az", false).map((item) => item.id)).toEqual(["a", "b"]);
    expect(buildGoalList(goals, "newest", true).map((item) => item.id)).toEqual(["a"]);
    expect(goals.map((item) => item.id)).toEqual(["b", "a"]);
  });

  it("groups the financial timeline by local day in source order", () => {
    const first = { id: "1", createdAt: new Date(2026, 8, 2, 18).getTime() } as Transaction;
    const second = { id: "2", createdAt: new Date(2026, 8, 2, 9).getTime() } as Transaction;
    const third = { id: "3", createdAt: new Date(2026, 8, 1, 12).getTime() } as Transaction;

    const sections = buildHistorySections([first, second, third], "en");

    expect(sections.map((section) => section.key)).toEqual(["2026-09-02", "2026-09-01"]);
    expect(sections[0].data.map((item) => item.id)).toEqual(["1", "2"]);
  });

  it("keeps swipe and reorder on the established native/UI-thread paths", () => {
    const today = read("app/(tabs)/index.tsx");
    const goals = read("app/(tabs)/goals.tsx");
    const habitDetail = read("app/habit/[id].tsx");

    expect(today).toContain("<SwipeableRow");
    expect(today).toContain("useDragReorder<Habit>");
    expect(goals).toContain("useDragReorder<Goal>");
    expect(today).not.toContain("PanResponder");
    expect(habitDetail).toContain("Gesture.Pinch()");
    expect(habitDetail).toContain("useSharedValue(1)");
  });

  it("keeps Material ripple intentional and Liquid navigation ripple-free", () => {
    const material = read("src/components/MaterialNavigationBar.tsx");
    const liquid = read("src/components/navigation/liquid-navigation-bar.tsx");

    expect(material).toContain("android_ripple={pressFeedback.androidRipple}");
    expect(material).toMatch(/iconContainer:\s*\{[\s\S]*width: 64,[\s\S]*height: 32,/);
    expect(liquid).not.toContain("android_ripple");
    expect(liquid).toContain("interactionEnabled={false}");
  });

  it("does not use timer-driven press feedback or horizontal tab scenes", () => {
    expect(read("src/components/pressFeedback.ts")).not.toContain("setTimeout");
    expect(read("app/(tabs)/_layout.tsx")).toContain('animation: "none"');
  });

  it("keeps settings and edit flows wired to their existing product state", () => {
    const settings = read("app/(tabs)/settings.tsx");
    const habitForm = read("app/habit/add.tsx");
    const goalForm = read("app/goal/add.tsx");

    expect(settings).toContain("setVisualTheme");
    expect(settings).toContain('<ReminderCard domain="savings" />');
    expect(settings).toContain('<ReminderCard domain="planner" />');
    expect(settings).toContain('setLanguage("en")');
    expect(habitForm).toContain("editScreenTitle");
    expect(habitForm).toContain("keyboardShouldPersistTaps=\"handled\"");
    expect(goalForm).toContain("editScreenTitle");
    expect(goalForm).toContain("accessibilityLabel={t.goalForm.targetLabel}");
  });

  it("keeps secondary states accessible and reduced-motion aware", () => {
    const alert = read("src/components/AppAlert.tsx");
    const empty = read("src/components/EmptyState.tsx");
    const celebration = read("src/components/CelebrationOverlay.tsx");
    const snackbar = read("src/components/UndoSnackbar.tsx");

    expect(alert).toContain("accessibilityViewIsModal");
    expect(alert).toContain('accessibilityRole="header"');
    expect(empty).not.toContain('numberOfLines={1}');
    expect(celebration).toContain("reducedMotion");
    expect(celebration).toContain('accessibilityRole="alert"');
    expect(snackbar).toContain('accessibilityLiveRegion="polite"');
  });
});
