import type { Goal, Transaction } from "../../types";
import {
  buildSavingsTrend,
  sampleSavingsTrend,
  savingsTrendBounds,
} from "../savingsTrend";

const goal: Goal = {
  id: "goal-1",
  name: "Dana aman",
  currentAmount: 1_250_000,
  targetAmount: 5_000_000,
  accent: "mint",
  createdAt: 100,
  sortOrder: 0,
};

function transaction(
  id: string,
  type: Transaction["type"],
  amount: number,
  createdAt: number,
): Transaction {
  return { id, goalId: goal.id, type, amount, createdAt };
}

describe("savings trend", () => {
  it("maps deposits up and withdrawals down in chronological order", () => {
    const trend = buildSavingsTrend(goal, [
      transaction("later", "withdrawal", 250_000, 300),
      transaction("first", "deposit", 1_000_000, 200),
    ]);

    expect(trend.points.map((point) => point.balance)).toEqual([
      500_000,
      1_500_000,
      1_250_000,
    ]);
    expect(trend.deposits).toBe(1_000_000);
    expect(trend.withdrawals).toBe(250_000);
    expect(trend.net).toBe(750_000);
  });

  it("keeps same-time transactions deterministic and supports an empty goal", () => {
    const sameTime = buildSavingsTrend(
      { ...goal, currentAmount: 200 },
      [
        transaction("b", "withdrawal", 100, 200),
        transaction("a", "deposit", 300, 200),
      ],
    );
    expect(sameTime.points.map((point) => point.transactionId)).toEqual([
      null,
      "a",
      "b",
    ]);

    const empty = buildSavingsTrend({ ...goal, currentAmount: 0 }, []);
    expect(empty.points).toHaveLength(1);
    expect(empty.points[0].balance).toBe(0);
  });

  it("samples endpoints and returns stable chart bounds", () => {
    const trend = buildSavingsTrend(
      { ...goal, currentAmount: 500 },
      Array.from({ length: 8 }, (_, index) =>
        transaction(String(index), "deposit", 100, 200 + index),
      ),
    );
    const sampled = sampleSavingsTrend(trend.points, 5);
    expect(sampled).toHaveLength(5);
    expect(sampled[0]).toBe(trend.points[0]);
    expect(sampled.at(-1)).toBe(trend.points.at(-1));
    expect(savingsTrendBounds(sampled).span).toBeGreaterThan(0);
  });
});
