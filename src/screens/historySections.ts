import type { Language } from "../i18n";
import type { Transaction } from "../types";
import { formatLongDate, getLocalDateKey } from "../utils/date";

export interface HistorySection {
  key: string;
  title: string;
  data: Transaction[];
}

export function buildHistorySections(
  transactions: Transaction[],
  language: Language,
): HistorySection[] {
  const grouped = new Map<string, Transaction[]>();

  for (const transaction of transactions) {
    const date = new Date(transaction.createdAt);
    const key = getLocalDateKey(date);
    const group = grouped.get(key) ?? [];
    group.push(transaction);
    grouped.set(key, group);
  }

  return [...grouped.entries()].map(([key, data]) => ({
    key,
    title: formatLongDate(new Date(data[0].createdAt), language),
    data,
  }));
}
