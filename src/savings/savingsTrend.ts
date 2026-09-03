import type { Goal, Transaction } from "../types";

export interface SavingsTrendPoint {
  balance: number;
  createdAt: number;
  transactionId: string | null;
  type: Transaction["type"] | "opening";
  amount: number;
}

export interface SavingsTrendSummary {
  deposits: number;
  withdrawals: number;
  net: number;
  points: SavingsTrendPoint[];
}

/**
 * Reconstructs a chronological running balance from persisted transactions.
 * `currentAmount` remains authoritative; the opening point is derived by
 * subtracting the complete net flow so older goals do not falsely start at 0.
 */
export function buildSavingsTrend(
  goal: Pick<Goal, "id" | "createdAt" | "currentAmount">,
  transactions: Pick<Transaction, "id" | "goalId" | "type" | "amount" | "createdAt">[],
): SavingsTrendSummary {
  const ordered = transactions
    .filter((transaction) => transaction.goalId === goal.id)
    .sort((a, b) => a.createdAt - b.createdAt || a.id.localeCompare(b.id));

  const deposits = ordered.reduce(
    (total, transaction) =>
      total + (transaction.type === "deposit" ? transaction.amount : 0),
    0,
  );
  const withdrawals = ordered.reduce(
    (total, transaction) =>
      total + (transaction.type === "withdrawal" ? transaction.amount : 0),
    0,
  );
  const openingBalance = Math.max(0, goal.currentAmount - (deposits - withdrawals));
  const firstTimestamp = ordered[0]?.createdAt ?? goal.createdAt;
  let runningBalance = openingBalance;

  const points: SavingsTrendPoint[] = [
    {
      balance: openingBalance,
      createdAt: Math.min(goal.createdAt, firstTimestamp),
      transactionId: null,
      type: "opening",
      amount: 0,
    },
  ];

  for (const transaction of ordered) {
    runningBalance = Math.max(
      0,
      runningBalance +
        (transaction.type === "deposit" ? transaction.amount : -transaction.amount),
    );
    points.push({
      balance: runningBalance,
      createdAt: transaction.createdAt,
      transactionId: transaction.id,
      type: transaction.type,
      amount: transaction.amount,
    });
  }

  // The store's current amount is the persisted authority. Pin the final
  // point to it in case an imported/legacy dataset is incomplete.
  points[points.length - 1] = {
    ...points[points.length - 1],
    balance: Math.max(0, goal.currentAmount),
  };

  return {
    deposits,
    withdrawals,
    net: deposits - withdrawals,
    points,
  };
}

export function sampleSavingsTrend(
  points: SavingsTrendPoint[],
  maxPoints: number,
): SavingsTrendPoint[] {
  if (maxPoints <= 1 || points.length <= maxPoints) return points;

  const sampled = [points[0]];
  const interiorSlots = maxPoints - 2;
  for (let index = 1; index <= interiorSlots; index += 1) {
    const sourceIndex = Math.round(
      (index * (points.length - 1)) / (maxPoints - 1),
    );
    sampled.push(points[sourceIndex]);
  }
  sampled.push(points.at(-1)!);
  return sampled;
}

export function savingsTrendBounds(points: SavingsTrendPoint[]) {
  const balances = points.map((point) => point.balance);
  const min = Math.min(...balances, 0);
  const max = Math.max(...balances, 1);
  return { min, max, span: Math.max(1, max - min) };
}
