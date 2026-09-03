import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import Svg, { Circle, Path } from "react-native-svg";

import type { Transaction } from "../types";
import { useTranslation } from "../hooks/useTranslation";
import { buildSavingsTrend, sampleSavingsTrend, savingsTrendBounds } from "../savings/savingsTrend";
import { spacing, withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { formatIDR } from "../utils/currency";

interface SavingsLineChartProps {
  goal: { id: string; createdAt: number; currentAmount: number };
  transactions: Transaction[];
  height?: number;
  compact?: boolean;
}

const VIEWBOX_WIDTH = 320;
const HORIZONTAL_PADDING = 8;
const VERTICAL_PADDING = 8;

export function SavingsLineChart({ goal, transactions, height = 124, compact = false }: SavingsLineChartProps) {
  const { colors, typography } = useTheme();
  const { t, interpolate } = useTranslation();
  const trend = useMemo(() => buildSavingsTrend(goal, transactions), [goal, transactions]);
  const points = useMemo(() => sampleSavingsTrend(trend.points, compact ? 12 : 32), [compact, trend.points]);
  const bounds = useMemo(() => savingsTrendBounds(points), [points]);
  const chartHeight = height - VERTICAL_PADDING * 2;
  const chartWidth = VIEWBOX_WIDTH - HORIZONTAL_PADDING * 2;
  const plotted = points.map((point, index) => ({
    ...point,
    x: HORIZONTAL_PADDING + (points.length === 1 ? chartWidth : (index / (points.length - 1)) * chartWidth),
    y: VERTICAL_PADDING + chartHeight - ((point.balance - bounds.min) / bounds.span) * chartHeight,
  }));
  const path = plotted.map((point, index) => `${index === 0 ? "M" : "L"}${point.x},${point.y}`).join(" ");
  const accessibilityLabel = interpolate(t.goalProgress.flowAccessibilityLabel, {
    balance: formatIDR(goal.currentAmount),
    deposits: formatIDR(trend.deposits),
    withdrawals: formatIDR(trend.withdrawals),
  });

  return (
    <View accessible accessibilityRole="image" accessibilityLabel={accessibilityLabel} style={styles.container}>
      <Svg width="100%" height={height} viewBox={`0 0 ${VIEWBOX_WIDTH} ${height}`} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Path d={`M${HORIZONTAL_PADDING},${height - VERTICAL_PADDING} H${VIEWBOX_WIDTH - HORIZONTAL_PADDING}`} stroke={withOpacity(colors.outline, 0.28)} strokeWidth={1} />
        <Path d={path} fill="none" stroke={colors.primary} strokeLinecap="round" strokeLinejoin="round" strokeWidth={compact ? 3 : 3.5} />
        {plotted.slice(1).map((point) => (
          <Circle key={point.transactionId ?? `${point.x}`} cx={point.x} cy={point.y} r={compact ? 2.3 : 3} fill={point.type === "withdrawal" ? colors.withdraw : colors.deposit} stroke={colors.surface} strokeWidth={1.5} />
        ))}
      </Svg>
      {!compact ? (
        <View style={styles.legend} accessibilityElementsHidden>
          <Text style={[typography.caption, { color: colors.deposit }]}>{t.goalProgress.flowInShort}</Text>
          <Text style={[typography.caption, { color: colors.withdraw }]}>{t.goalProgress.flowOutShort}</Text>
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { width: "100%" },
  legend: { flexDirection: "row", justifyContent: "flex-end", gap: spacing.md, marginTop: -spacing.xs },
});
