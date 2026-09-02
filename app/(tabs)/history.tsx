import React, { useMemo, useState } from "react";
import { Pressable, SectionList, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { EmptyState } from "../../src/components/EmptyState";
import { DayHistorySheet } from "../../src/components/DayHistorySheet";
import { GlassCard } from "../../src/components/GlassCard";
import { HabitConsistencyHeatmap } from "../../src/components/HabitConsistencyHeatmap";
import { ScreenHeading } from "../../src/components/ScreenHeading";
import { usePressFeedback } from "../../src/components/pressFeedback";
import { TransactionRow } from "../../src/components/TransactionRow";
import { resolveBottomNavigationLayout } from "../../src/components/navigation/bottom-navigation-layout";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import { useHabitsStore } from "../../src/store/useHabitsStore";
import { buildHistorySections, type HistorySection } from "../../src/screens/historySections";
import { spacing } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/useTheme";
import type { Transaction } from "../../src/types";

export default function HistoryScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const { t, language } = useTranslation();
  const transactions = useGoalsStore((state) => state.transactions);
  const goals = useGoalsStore((state) => state.goals);
  const habits = useHabitsStore((state) => state.habits);
  const habitLogs = useHabitsStore((state) => state.habitLogs);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const datePressFeedback = usePressFeedback(colors.primary);

  const sorted = useMemo(
    () => [...transactions].sort((a, b) => b.createdAt - a.createdAt),
    [transactions],
  );

  const sections = useMemo(
    () => buildHistorySections(sorted, language),
    [language, sorted],
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
        listContent: {
          paddingTop: spacing.md,
          paddingBottom: resolveBottomNavigationLayout(insets.bottom).contentBottomPadding,
        },
        rowCard: {
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
        },
        heatmapWrapper: {
          marginBottom: spacing.lg,
        },
        sectionTitle: {
          ...typography.section,
          color: colors.textSecondary,
        },
        sectionButton: {
          minHeight: 48,
          justifyContent: "center",
          borderRadius: 24,
          overflow: "hidden",
        },
      }),
    [colors, typography, insets.bottom],
  );

  return (
    <View
      key={isDark ? "dark" : "light"}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      <ScreenHeading title={t.history.headerTitle} supportingText={t.history.subtitle} />

      <SectionList<Transaction, HistorySection>
        sections={sections}
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
              goalName={goalNameById[item.goalId] ?? t.history.deletedGoalFallback}
            />
          </GlassCard>
        )}
        renderSectionHeader={({ section }) => (
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={section.title}
            onPress={() => setSelectedDate(section.key)}
            android_ripple={datePressFeedback.androidRipple}
            style={({ pressed }) => [
              styles.sectionButton,
              { opacity: datePressFeedback.opacity(pressed) },
            ]}
          >
            <Text accessibilityRole="header" style={styles.sectionTitle}>
              {section.title}
            </Text>
          </Pressable>
        )}
        stickySectionHeadersEnabled={false}
        ListEmptyComponent={
          <EmptyState
            icon="history"
            title={t.history.emptyTitle}
            description={t.history.emptyDescription}
          />
        }
      />
      <DayHistorySheet dateKey={selectedDate} onClose={() => setSelectedDate(null)} />
    </View>
  );
}
