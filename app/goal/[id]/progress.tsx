import { useLocalSearchParams } from "expo-router";
import React, { useMemo } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { AppSurface } from "../../../src/components/AppSurface";
import { EmptyState } from "../../../src/components/EmptyState";
import { JarProgress } from "../../../src/components/JarProgress";
import { SavingsLineChart } from "../../../src/components/SavingsLineChart";
import { SectionHeading } from "../../../src/components/ScreenHeading";
import { TransactionRow } from "../../../src/components/TransactionRow";
import { useTranslation } from "../../../src/hooks/useTranslation";
import { buildSavingsTrend } from "../../../src/savings/savingsTrend";
import { useGoalsStore } from "../../../src/store/useGoalsStore";
import { getAccentColors, spacing } from "../../../src/theme/colors";
import { useTheme } from "../../../src/theme/useTheme";
import { clampPercent, formatIDR } from "../../../src/utils/currency";

export default function GoalProgressScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const insets = useSafeAreaInsets();
  const { colors, typography } = useTheme();
  const { t, interpolate } = useTranslation();
  const goal = useGoalsStore((state) => state.getGoalById(id));
  const allTransactions = useGoalsStore((state) => state.transactions);
  const transactions = useMemo(
    () => allTransactions.filter((transaction) => transaction.goalId === id),
    [allTransactions, id],
  );
  const trend = useMemo(
    () => goal ? buildSavingsTrend(goal, transactions) : null,
    [goal, transactions],
  );
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  if (!goal || !trend) {
    return <View style={[styles.container, { paddingTop: insets.top }]}><EmptyState icon="magnify-close" title={t.goalDetail.notFoundTitle} description={t.goalDetail.notFoundDescription} /></View>;
  }

  const accent = getAccentColors(goal.accent);
  const percent = clampPercent(goal.currentAmount, goal.targetAmount);

  return (
    <ScrollView style={styles.container} contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + spacing.xl }]} showsVerticalScrollIndicator={false}>
      <Text accessibilityRole="header" style={styles.goalName}>{goal.name}</Text>
      <AppSurface variant="elevated" style={styles.hero}>
        <View style={styles.heroRow}>
          <View style={styles.heroCopy}>
            <Text style={styles.label}>{t.goalProgress.balanceLabel}</Text>
            <Text style={styles.amount} selectable>{formatIDR(goal.currentAmount)}</Text>
            <Text style={styles.target}>{t.goalProgress.targetLabel} {formatIDR(goal.targetAmount)}</Text>
          </View>
          <JarProgress compact currentAmount={goal.currentAmount} targetAmount={goal.targetAmount} accentBase={accent.base} accentDeep={accent.deep} />
        </View>
        <Text style={styles.percent}>{interpolate(t.goalProgress.progressPercent, { percent: Math.round(percent * 100) })}</Text>
      </AppSurface>

      <SectionHeading title={t.goalProgress.flowHeading} />
      <Text style={styles.supporting}>{t.goalProgress.flowDescription}</Text>
      <AppSurface variant="base" elevation="none" style={styles.chartCard}>
        <SavingsLineChart goal={goal} transactions={transactions} height={180} />
        <View style={styles.flowRow}>
          <View><Text style={styles.flowLabel}>{t.goalProgress.depositedLabel}</Text><Text style={[styles.flowValue, { color: colors.deposit }]}>{formatIDR(trend.deposits)}</Text></View>
          <View><Text style={styles.flowLabel}>{t.goalProgress.withdrawnLabel}</Text><Text style={[styles.flowValue, { color: colors.withdraw }]}>{formatIDR(trend.withdrawals)}</Text></View>
        </View>
      </AppSurface>

      <SectionHeading title={t.goalProgress.recentHeading} />
      {transactions.length === 0 ? (
        <EmptyState icon="chart-line" title={t.goalProgress.emptyTitle} description={t.goalProgress.emptyDescription} />
      ) : (
        [...transactions].sort((a, b) => b.createdAt - a.createdAt).slice(0, 12).map((transaction) => (
          <AppSurface key={transaction.id} variant="base" elevation="none" style={styles.transaction}>
            <TransactionRow transaction={transaction} />
          </AppSurface>
        ))
      )}
    </ScrollView>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"], typography: ReturnType<typeof useTheme>["typography"]) {
  return StyleSheet.create({
    container: { flex: 1, backgroundColor: colors.background },
    content: { paddingTop: spacing.lg, paddingHorizontal: spacing.lg },
    goalName: { ...typography.display, color: colors.textPrimary, marginBottom: spacing.lg },
    hero: { padding: spacing.lg },
    heroRow: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
    heroCopy: { flex: 1 },
    label: { ...typography.label, color: colors.textSecondary },
    amount: { ...typography.amount, color: colors.textPrimary, marginTop: spacing.xs },
    target: { ...typography.body, color: colors.textSecondary, marginTop: spacing.xs },
    percent: { ...typography.label, color: colors.primary, marginTop: spacing.md, textTransform: "none" },
    supporting: { ...typography.body, color: colors.textSecondary, marginTop: -spacing.sm, marginBottom: spacing.md },
    chartCard: { padding: spacing.md },
    flowRow: { flexDirection: "row", justifyContent: "space-between", gap: spacing.md, marginTop: spacing.md },
    flowLabel: { ...typography.caption, color: colors.textSecondary },
    flowValue: { ...typography.subtitle, marginTop: spacing.xs },
    transaction: { paddingHorizontal: spacing.md, marginBottom: spacing.sm },
  });
}
