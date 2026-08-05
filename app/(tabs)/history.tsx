import React, { useMemo } from "react";
import { FlatList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "../../src/components/EmptyState";
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MARGIN,
} from "../../src/components/FloatingTabBar";
import { GlassCard } from "../../src/components/GlassCard";
import { HabitConsistencyHeatmap } from "../../src/components/HabitConsistencyHeatmap";
import { TransactionRow } from "../../src/components/TransactionRow";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import { useHabitsStore } from "../../src/store/useHabitsStore";
import { spacing } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/useTheme";
import type { Transaction } from "../../src/types";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const transactions = useGoalsStore((state) => state.transactions);
  const goals = useGoalsStore((state) => state.goals);
  const habits = useHabitsStore((state) => state.habits);
  const habitLogs = useHabitsStore((state) => state.habitLogs);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.createdAt - a.createdAt),
    [transactions],
  );

  const goalNameById = useMemo(() => {
    const map: Record<string, string> = {};
    goals.forEach((g) => {
      map[g.id] = g.name;
    });
    return map;
  }, [goals]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
          paddingHorizontal: spacing.lg,
        },
        headerTitle: {
          ...typography.display,
          fontSize: 28,
          marginTop: 2,
        },
        listContent: {
          paddingTop: spacing.lg,
          paddingBottom:
            insets.bottom +
            FLOATING_TAB_BAR_MARGIN +
            FLOATING_TAB_BAR_HEIGHT +
            spacing.lg,
        },
        rowCard: {
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
        },
        heatmapWrapper: {
          marginBottom: spacing.lg,
        },
      }),
    [colors, typography, insets.bottom],
  );

  return (
    <View
      key={isDark ? "dark" : "light"}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      <Text style={styles.headerTitle}>Histori</Text>
      <Text style={typography.caption}>
        Semua transaksi dari seluruh goal-mu
      </Text>

      <FlatList<Transaction>
        data={sorted}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        ListHeaderComponent={
          habits.some((h) => !h.archivedAt) ? (
            <View style={styles.heatmapWrapper}>
              <HabitConsistencyHeatmap habits={habits} habitLogs={habitLogs} />
            </View>
          ) : null
        }
        renderItem={({ item }) => (
          <GlassCard tintColor={colors.surface} style={styles.rowCard}>
            <TransactionRow
              transaction={item}
              goalName={goalNameById[item.goalId] ?? "Goal terhapus"}
            />
          </GlassCard>
        )}
        ListEmptyComponent={
          <EmptyState
            icon="history"
            title="Belum ada transaksi"
            description="Riwayat menabung & menarik bakal muncul di sini."
          />
        }
      />
    </View>
  );
}