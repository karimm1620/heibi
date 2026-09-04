import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppSurface } from "../../src/components/AppSurface";
import { Chip } from "../../src/components/Chip";
import { DragReorderRow } from "../../src/components/DragReorderRow";
import { EmptyState } from "../../src/components/EmptyState";
import { GoalCard } from "../../src/components/GoalCard";
import { ScreenHeading } from "../../src/components/ScreenHeading";
import { WaveShape } from "../../src/components/WaveShape";
import { resolveBottomNavigationLayout } from "../../src/components/navigation/bottom-navigation-layout";
import { useDragReorder } from "../../src/hooks/useDragReorder";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import { buildGoalList, type GoalSortOption } from "../../src/screens/goalListPresentation";
import { spacing, withOpacity } from "../../src/theme/colors";
import { useTheme } from "../../src/theme/useTheme";
import type { Goal } from "../../src/types";
import { formatIDR } from "../../src/utils/currency";

const DEFAULT_ROW_HEIGHT = 112;

export default function GoalsScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const { t, interpolate } = useTranslation();
  const goals = useGoalsStore((state) => state.goals);
  const reorderGoals = useGoalsStore((state) => state.reorderGoals);

  const SORT_OPTIONS: { key: GoalSortOption; label: string }[] = [
    { key: "newest", label: t.goalsList.sortNewest },
    { key: "closest", label: t.goalsList.sortClosest },
    { key: "az", label: t.goalsList.sortAZ },
  ];

  const [sortOption, setSortOption] = useState<GoalSortOption>("newest");
  const [showCompletedOnly, setShowCompletedOnly] = useState(false);
  const [rowHeight, setRowHeight] = useState(DEFAULT_ROW_HEIGHT);

  const totalSaved = useMemo(
    () => goals.reduce((sum, g) => sum + g.currentAmount, 0),
    [goals],
  );
  const totalTarget = useMemo(
    () => goals.reduce((sum, g) => sum + g.targetAmount, 0),
    [goals],
  );

  const displayedGoals = useMemo(
    () => buildGoalList(goals, sortOption, showCompletedOnly),
    [goals, sortOption, showCompletedOnly],
  );

  // Drag-reorder cuma masuk akal kalau list lagi nunjukin urutan "asli"
  // (bukan hasil re-sort Terdekat/A-Z, bukan lagi difilter Selesai) — di
  // mode lain handle-nya disembunyiin biar gak ambigu urutan mana yang
  // sebenarnya ke-persist.
  const canReorder = sortOption === "newest" && !showCompletedOnly;

  const { order, draggingKey, controller } = useDragReorder<Goal>({
    items: displayedGoals,
    keyExtractor: (g) => g.id,
    onReorderCommit: reorderGoals,
  });

  const listToRender = canReorder ? order : displayedGoals;

  const styles = useMemo(
    () => createStyles(colors, typography, insets.bottom),
    [colors, typography, insets.bottom],
  );

  return (
    <View
      key={isDark ? "dark" : "light"}
      style={[styles.container, { paddingTop: insets.top + spacing.md }]}
    >
      <ScrollView
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        scrollEnabled={draggingKey === null}
      >
        <ScreenHeading title={t.goalsList.headerTitle} />

        <AppSurface
          variant="expressive"
          elevation="none"
          style={styles.summaryCard}
        >
          <Text style={styles.summaryLabel}>{t.goalsList.totalSavingsLabel}</Text>
          <Text style={styles.summaryAmount} selectable>{formatIDR(totalSaved)}</Text>
          <Text style={styles.summaryTarget} selectable>
            {interpolate(t.goalsList.summaryTargetSuffix, {
              target: formatIDR(totalTarget),
              count: goals.length,
            })}
          </Text>
          <WaveShape
            color={withOpacity(colors.expressive, 0.18)}
            height={18}
            style={styles.summaryWave}
          />
        </AppSurface>

        {goals.length > 0 && (
          <View style={styles.androidChipRow}>
            {SORT_OPTIONS.map((option) => (
              <Chip
                key={option.key}
                label={option.label}
                selected={sortOption === option.key}
                onPress={() => setSortOption(option.key)}
                accessibilityRole="radio"
                accessibilityLabel={interpolate(t.goalsList.sortAccessibilityLabel, { label: option.label })}
              />
            ))}
            <View style={styles.androidChipDivider} />
            <Chip
              label={t.goalsList.completedChip}
              selected={showCompletedOnly}
              onPress={() => setShowCompletedOnly((prev) => !prev)}
              accessibilityLabel={t.goalsList.completedFilterAccessibilityLabel}
            />
          </View>
        )}

        {listToRender.length === 0 ? (
          <EmptyState
            icon={showCompletedOnly ? "party-popper" : "piggy-bank-outline"}
            title={
              showCompletedOnly
                ? t.goalsList.emptyCompletedTitle
                : t.goalsList.emptyTitle
            }
            description={
              showCompletedOnly
                ? t.goalsList.emptyCompletedDescription
                : t.goalsList.emptyDescription
            }
            ctaLabel={showCompletedOnly ? t.goalsList.viewAllCta : t.goalsList.addGoalCta}
            onPressCta={
              showCompletedOnly
                ? () => setShowCompletedOnly(false)
                : () => router.push("/goal/add")
            }
          />
        ) : (
          listToRender.map((item, index) => (
            <DragReorderRow
              key={item.id}
              itemKey={item.id}
              index={index}
              itemHeight={rowHeight}
              itemCount={listToRender.length}
              controller={controller}
              enabled={canReorder && (draggingKey === null || draggingKey === item.id)}
              onLayout={setRowHeight}
              style={styles.row}
              handle={
                canReorder ? (
                  <View
                    style={styles.dragHandle}
                    hitSlop={8}
                    accessibilityRole="adjustable"
                    accessibilityLabel={interpolate(t.goalsList.reorderAccessibilityLabel, {
                      name: item.name,
                    })}
                  >
                    <MaterialCommunityIcons
                      name="drag-vertical"
                      size={22}
                      color={colors.textSecondary}
                    />
                  </View>
                ) : undefined
              }
            >
              <View style={{ flex: 1 }}>
                <GoalCard
                  goal={item}
                  onPress={() => router.push(`/goal/${item.id}`)}
                />
              </View>
            </DragReorderRow>
          ))
        )}
      </ScrollView>
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  insetBottom: number,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingHorizontal: spacing.md,
    },
    summaryCard: {
      padding: spacing.md,
      marginBottom: spacing.lg,
    },
    summaryLabel: {
      ...typography.section,
      color: colors.onExpressiveContainer,
      marginBottom: spacing.xs,
    },
    summaryAmount: {
      ...typography.amount,
      color: colors.onExpressiveContainer,
    },
    summaryTarget: {
      ...typography.caption,
      color: withOpacity(colors.onExpressiveContainer, 0.76),
      marginTop: spacing.xs,
    },
    summaryWave: {
      marginTop: spacing.sm,
    },
    androidChipRow: {
      flexDirection: "row",
      alignItems: "center",
      flexWrap: "wrap",
      gap: spacing.xs,
      marginBottom: spacing.md,
    },
    androidChipDivider: {
      width: 1,
      height: 20,
      backgroundColor: colors.glassBorder,
      marginHorizontal: spacing.xs,
    },
    listContent: {
      paddingBottom: resolveBottomNavigationLayout(insetBottom).contentBottomPadding,
    },
    row: {
      flexDirection: "row",
      alignItems: "center",
    },
    dragHandle: {
      width: 40,
      height: 40,
      alignItems: "center",
      justifyContent: "center",
    },
  });
}
