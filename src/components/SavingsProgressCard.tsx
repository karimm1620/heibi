import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

import type { Goal, Transaction } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { getAccentColors, spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { clampPercent, formatIDR } from "../utils/currency";
import { AppSurface } from "./AppSurface";
import { JarProgress } from "./JarProgress";
import { usePressFeedback } from "./pressFeedback";
import { SavingsLineChart } from "./SavingsLineChart";

interface SavingsProgressCardProps { goal: Goal; transactions: Transaction[]; onPress: () => void }

export function SavingsProgressCard({ goal, transactions, onPress }: SavingsProgressCardProps) {
  const { colors, shapes, typography } = useTheme();
  const { t, interpolate } = useTranslation();
  const accent = getAccentColors(goal.accent);
  const percent = clampPercent(goal.currentAmount, goal.targetAmount);
  const press = usePressFeedback(colors.primary, { radius: shapes.card });
  const styles = useMemo(() => createStyles(colors, typography), [colors, typography]);

  return (
    <Pressable accessibilityRole="button" accessibilityLabel={interpolate(t.goalProgress.openAccessibilityLabel, { name: goal.name, percent: Math.round(percent * 100) })} onPress={onPress} android_ripple={press.androidRipple} style={({ pressed }) => [styles.pressable, { opacity: press.opacity(pressed) }]}>
      <AppSurface variant="elevated" elevation="low" style={styles.card}>
        <View style={styles.header}>
          <View style={styles.copy}>
            <Text style={styles.eyebrow}>{t.goalProgress.cardEyebrow}</Text>
            <Text style={styles.amount} selectable>{formatIDR(goal.currentAmount)}</Text>
            <Text style={styles.target}>dari {formatIDR(goal.targetAmount)}</Text>
          </View>
          <JarProgress compact currentAmount={goal.currentAmount} targetAmount={goal.targetAmount} accentBase={accent.base} accentDeep={accent.deep} />
        </View>
        <SavingsLineChart goal={goal} transactions={transactions} compact height={88} />
        <View style={styles.footer}>
          <Text style={styles.footerLabel}>{t.goalProgress.viewFlow}</Text>
          <MaterialCommunityIcons name="arrow-right" size={20} color={colors.primary} />
        </View>
      </AppSurface>
    </Pressable>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"], typography: ReturnType<typeof useTheme>["typography"]) {
  return StyleSheet.create({
    pressable: { borderRadius: 24, overflow: "hidden" },
    card: { padding: spacing.lg },
    header: { flexDirection: "row", alignItems: "flex-start", justifyContent: "space-between", gap: spacing.md },
    copy: { flex: 1 },
    eyebrow: { ...typography.label, color: colors.textSecondary, letterSpacing: 0.8 },
    amount: { ...typography.amount, color: colors.textPrimary, marginTop: spacing.xs },
    target: { ...typography.caption, color: colors.textSecondary, marginTop: spacing.xs },
    footer: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.divider, marginTop: spacing.sm, paddingTop: spacing.sm },
    footerLabel: { ...typography.label, color: colors.primary, textTransform: "none" },
  });
}
