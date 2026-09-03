import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";

import { radius, spacing, withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { clampPercent, formatIDR } from "../utils/currency";

interface JarProgressProps {
  currentAmount: number;
  targetAmount: number;
  accentBase: string;
  accentDeep: string;
  compact?: boolean;
}

/** A quiet savings vessel that keeps progress informative without a toy-like jar. */
export function JarProgress({ currentAmount, targetAmount, accentBase, accentDeep, compact = false }: JarProgressProps) {
  const { colors, typography } = useTheme();
  const percent = clampPercent(currentAmount, targetAmount);
  const styles = useMemo(() => createStyles(colors, typography, compact), [colors, compact, typography]);

  return (
    <View accessible accessibilityRole="progressbar" accessibilityValue={{ min: 0, max: 100, now: Math.round(percent * 100) }} accessibilityLabel={`${formatIDR(currentAmount)} dari ${formatIDR(targetAmount)}`} style={styles.wrapper}>
      <View style={styles.vessel}>
        <View style={[styles.fill, { height: `${Math.max(5, percent * 100)}%`, backgroundColor: accentBase, borderTopColor: accentDeep }]} />
        <View style={styles.vesselHighlight} />
        <View style={styles.iconWrap}>
          <MaterialCommunityIcons name={percent >= 1 ? "check-bold" : "safe-square-outline"} size={compact ? 20 : 24} color={accentDeep} />
        </View>
      </View>
      <Text style={styles.percent}>{Math.round(percent * 100)}%</Text>
    </View>
  );
}

function createStyles(colors: ReturnType<typeof useTheme>["colors"], typography: ReturnType<typeof useTheme>["typography"], compact: boolean) {
  const vesselHeight = compact ? 76 : 112;
  const vesselWidth = compact ? 52 : 72;
  return StyleSheet.create({
    wrapper: { alignItems: "center", gap: spacing.xs },
    vessel: { width: vesselWidth, height: vesselHeight, borderRadius: radius.lg, backgroundColor: colors.surfaceMuted, borderWidth: 1.5, borderColor: colors.outline, overflow: "hidden", justifyContent: "flex-end", alignItems: "center" },
    fill: { position: "absolute", left: 0, right: 0, bottom: 0, borderTopWidth: 2 },
    vesselHighlight: { position: "absolute", top: 8, bottom: 8, left: 8, width: 4, borderRadius: radius.pill, backgroundColor: withOpacity("#FFFFFF", 0.5) },
    iconWrap: { width: compact ? 34 : 40, height: compact ? 34 : 40, marginBottom: compact ? 10 : 16, borderRadius: radius.pill, backgroundColor: withOpacity(colors.surface, 0.78), alignItems: "center", justifyContent: "center" },
    percent: { ...typography.label, color: colors.textSecondary, textTransform: "none" },
  });
}
