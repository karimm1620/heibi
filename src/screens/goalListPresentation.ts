import type { Goal } from "../types";
import { clampPercent } from "../utils/currency";

export type GoalSortOption = "newest" | "closest" | "az";

export function buildGoalList(
  goals: Goal[],
  sortOption: GoalSortOption,
  completedOnly: boolean,
): Goal[] {
  const list = completedOnly
    ? goals.filter((goal) => clampPercent(goal.currentAmount, goal.targetAmount) >= 1)
    : [...goals];

  if (sortOption === "closest") {
    return list.sort(
      (a, b) =>
        clampPercent(b.currentAmount, b.targetAmount) -
        clampPercent(a.currentAmount, a.targetAmount),
    );
  }
  if (sortOption === "az") {
    return list.sort((a, b) => a.name.localeCompare(b.name));
  }

  return list;
}
