import { Redirect } from "expo-router";
import React, { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import type { LiquidGlassRendererState } from "../../modules/expo-liquid-glass";
import { LiquidSelectedControl } from "../../src/components/liquid/LiquidSelectedControl";
import { spacing } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/useTheme";

const ranges = [
  { value: "today", label: "Hari ini" },
  { value: "week", label: "Minggu" },
  { value: "month", label: "Bulan" },
] as const;

type Range = (typeof ranges)[number]["value"];

/** Unlinked development-only surface for the Checkpoint 4 feasibility POC. */
export default function LiquidFeasibilityScreen() {
  const { colors, typography } = useTheme();
  const [range, setRange] = useState<Range>("week");
  const [rendererState, setRendererState] = useState<LiquidGlassRendererState | null>(null);

  if (!__DEV__) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: colors.background }]}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={[typography.title, { color: colors.textPrimary }]}>Uji material Liquid</Text>
        <Text style={[typography.body, styles.intro, { color: colors.textSecondary }]}>
          POC renderer Android orisinal yang dibatasi untuk satu kontrol mengambang. Material
          menangkap konteks di belakangnya tanpa mengubah navigasi produksi.
        </Text>

        <View style={[styles.context, { backgroundColor: colors.surfaceMuted }]}>
          <Text style={[typography.section, { color: colors.textPrimary }]}>Ringkasan tabungan</Text>
          <View style={styles.goalRow}>
            <View style={[styles.goalMark, { backgroundColor: colors.primaryContainer }]} />
            <View style={styles.goalCopy}>
              <Text style={[typography.subtitle, { color: colors.textPrimary }]}>Dana darurat</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>68% tercapai</Text>
            </View>
            <Text style={[typography.subtitle, styles.amount, { color: colors.textPrimary }]}>Rp 6,8 jt</Text>
          </View>
          <View style={styles.goalRow}>
            <View style={[styles.goalMark, { backgroundColor: colors.expressiveContainer }]} />
            <View style={styles.goalCopy}>
              <Text style={[typography.subtitle, { color: colors.textPrimary }]}>Liburan</Text>
              <Text style={[typography.caption, { color: colors.textSecondary }]}>42% tercapai</Text>
            </View>
            <Text style={[typography.subtitle, styles.amount, { color: colors.textPrimary }]}>Rp 2,1 jt</Text>
          </View>

          <View
            accessibilityElementsHidden
            importantForAccessibility="no-hide-descendants"
            pointerEvents="none"
            style={styles.backdropEvidence}
          >
            <View style={[styles.backdropRail, { backgroundColor: colors.primaryContainer }]} />
            <View style={[styles.backdropDot, { backgroundColor: colors.expressiveContainer }]} />
          </View>

          <LiquidSelectedControl
            accessibilityLabel="Rentang ringkasan"
            material="optical-poc"
            onRendererStateChange={setRendererState}
            options={ranges}
            refreshKey={ranges.findIndex((option) => option.value === range)}
            style={styles.controlPosition}
            value={range}
            onChange={setRange}
          />
        </View>

        <Text style={[typography.caption, { color: colors.textSecondary }]}>
          Tier aktif: {rendererState?.tier ?? "mendeteksi"}. API {rendererState?.apiLevel ?? "–"};
          capture {rendererState?.captureCount ?? 0}. Fallback tonal tetap dipakai untuk API
          24–30, low-RAM, kegagalan renderer, atau saat renderer dinonaktifkan.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    gap: spacing.md,
  },
  intro: {
    maxWidth: 560,
  },
  context: {
    minHeight: 300,
    borderRadius: 32,
    overflow: "hidden",
    padding: spacing.md,
    gap: spacing.md,
  },
  goalRow: {
    flexDirection: "row",
    minHeight: 64,
    alignItems: "center",
    gap: spacing.sm,
  },
  goalMark: {
    width: 12,
    alignSelf: "stretch",
    borderRadius: 6,
  },
  goalCopy: {
    flex: 1,
    gap: spacing.xs,
  },
  amount: {
    fontVariant: ["tabular-nums"],
  },
  controlPosition: {
    position: "absolute",
    left: spacing.md,
    right: spacing.md,
    bottom: spacing.md,
  },
  backdropEvidence: {
    position: "absolute",
    left: spacing.lg,
    right: spacing.lg,
    bottom: 38,
    height: 36,
    justifyContent: "center",
  },
  backdropRail: {
    height: 12,
    borderRadius: 6,
    marginHorizontal: spacing.sm,
  },
  backdropDot: {
    position: "absolute",
    right: spacing.lg,
    width: 32,
    height: 32,
    borderRadius: 16,
  },
});
