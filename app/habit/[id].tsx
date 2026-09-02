import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo } from "react";
import { Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../../src/components/AppAlert";
import { AppSurface } from "../../src/components/AppSurface";
import { GlassCard } from "../../src/components/GlassCard";
import type { HabitIconName } from "../../src/components/HabitIconPicker";
import { HabitHeatmap } from "../../src/components/HabitHeatmap";
import { SectionHeading } from "../../src/components/ScreenHeading";
import { usePressFeedback } from "../../src/components/pressFeedback";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useHabitActions } from "../../src/hooks/useHabitActions";
import { useReducedMotion } from "../../src/hooks/useReducedMotion";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useHabitsStore } from "../../src/store/useHabitsStore";
import { spacing } from "../../src/theme/colors";
import { m3ElevationStyle, m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import {
  calculateCompletionRate,
  calculateCurrentStreak,
  getLocalDateKey,
  isWeekdaySelected,
  WEEKDAYS_SHORT_BY_LANGUAGE,
} from "../../src/utils/date";

export default function HabitDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark, material3 } = useTheme();
  const { t, language, interpolate } = useTranslation();
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const linkPressFeedback = usePressFeedback(colors.primary, { radius: m3Shape.full });
  const dangerPressFeedback = usePressFeedback(colors.danger, { radius: m3Shape.full });
  const markPressFeedback = usePressFeedback(material3.onPrimary, { radius: m3Shape.full });
  const reducedMotion = useReducedMotion();
  const { archiveWithCleanup, unarchiveWithReschedule, deletePermanentlyWithCleanup } =
    useHabitActions();

  const habit = useHabitsStore((s) => s.getHabitById(id));
  const habitLogs = useHabitsStore((s) => s.habitLogs);
  const toggleHabitToday = useHabitsStore((s) => s.toggleHabitToday);

  const completedDateKeys = useMemo(() => {
    if (!habit) return new Set<string>();
    return new Set(
      habitLogs.filter((l) => l.habitId === habit.id).map((l) => l.date),
    );
  }, [habitLogs, habit]);

  const styles = useMemo(
    () => createStyles(colors, typography, material3),
    [colors, typography, material3],
  );

  // Pinch-to-dismiss remains optional navigation, but the gesture now stays
  // on the UI runtime. React receives only the final committed dismissal.
  const DISMISS_THRESHOLD = 0.72;
  const pinchScale = useSharedValue(1);
  const announcePinchCommit = () => {
    void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
  };
  const finishPinchDismiss = () => router.back();
  const pinchGesture = Gesture.Pinch()
    .onUpdate((event) => {
      if (reducedMotion) return;
      pinchScale.set(Math.max(0.68, Math.min(1, event.scale)));
    })
    .onEnd((event) => {
      if (event.scale <= DISMISS_THRESHOLD) {
        scheduleOnRN(announcePinchCommit);
        if (reducedMotion) {
          scheduleOnRN(finishPinchDismiss);
          return;
        }
        pinchScale.set(withTiming(0.9, { duration: 120 }, (finished) => {
          if (finished) scheduleOnRN(finishPinchDismiss);
        }));
        return;
      }
      pinchScale.set(reducedMotion ? 1 : withSpring(1, { damping: 18, stiffness: 260 }));
    });
  const pinchStyle = useAnimatedStyle(() => ({
    opacity: pinchScale.get(),
    transform: [{ scale: pinchScale.get() }],
  }));

  if (!habit) {
    return (
      <View style={[styles.container, styles.centered]}>
        <Text style={typography.body}>{t.habitDetail.notFound}</Text>
      </View>
    );
  }

  const currentStreak = calculateCurrentStreak(habit, completedDateKeys);
  const completionRate = calculateCompletionRate(habit, completedDateKeys);
  const doneToday = completedDateKeys.has(getLocalDateKey());

  const frequencyLabel =
    habit.frequencyType === "daily"
      ? t.habitDetail.dailyFrequency
      : WEEKDAYS_SHORT_BY_LANGUAGE[language]
          .filter((_, i) => isWeekdaySelected(habit.weekdaysMask, i))
          .join(", ") || t.habitDetail.noWeekdaysSelected;

  const handleToggleToday = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    void toggleHabitToday(habit.id);
  };

  const handleToggleArchive = () => {
    if (habit.archivedAt) {
      void unarchiveWithReschedule(habit);
      return;
    }
    showAlert(
      t.habitDetail.archiveConfirmTitle,
      interpolate(t.habitDetail.archiveConfirmMessage, { name: habit.name }),
      [
        { label: t.common.cancel, style: "cancel" },
        {
          label: t.habitDetail.archiveLink,
          onPress: async () => {
            await archiveWithCleanup(habit);
            router.back();
          },
        },
      ],
    );
  };

  const handleDelete = () => {
    showAlert(
      t.habitDetail.deleteConfirmTitle,
      interpolate(t.habitDetail.deleteConfirmMessage, { name: habit.name }),
      [
        { label: t.common.cancel, style: "cancel" },
        {
          label: t.common.delete,
          style: "destructive",
          onPress: async () => {
            await deletePermanentlyWithCleanup(habit);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View style={{ flex: 1 }}>
      <GestureDetector gesture={pinchGesture}>
        <Animated.View
          key={isDark ? "dark" : "light"}
          style={[styles.container, pinchStyle]}
        >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60 },
        ]}
      >
        <View style={styles.headerRow}>
          <View
            style={[styles.iconCircle, { backgroundColor: `${habit.color}33` }]}
          >
            <MaterialCommunityIcons
              name={habit.icon as HabitIconName}
              size={26}
              color={habit.color}
            />
          </View>
        </View>

        <Text accessibilityRole="header" style={styles.title}>{habit.name}</Text>
        <Text style={typography.caption}>
          {frequencyLabel}
          {habit.reminderTime ? ` · ${habit.reminderTime}` : ""}
        </Text>

        <AppSurface variant="muted" elevation="none" style={styles.statsRow}>
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{currentStreak}</Text>
            <Text style={styles.statLabel}>{t.habitDetail.streakLabel}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{habit.bestStreak}</Text>
            <Text style={styles.statLabel}>{t.habitDetail.bestStreakLabel}</Text>
          </View>
          <View style={styles.statDivider} />
          <View style={styles.statCard}>
            <Text style={styles.statValue}>{completionRate}%</Text>
            <Text style={styles.statLabel}>{t.habitDetail.last30DaysLabel}</Text>
          </View>
        </AppSurface>

        <View style={styles.metaRow}>
          <Pressable
            onPress={() => router.push(`/habit/add?id=${habit.id}`)}
            accessibilityRole="button"
            accessibilityLabel={t.habitDetail.editAccessibilityLabel}
            android_ripple={linkPressFeedback.androidRipple}
            style={({ pressed }) => [
              styles.metaLinkButton,
              { opacity: linkPressFeedback.opacity(pressed) },
            ]}
          >
            <Text style={[styles.metaLink, { color: colors.textSecondary }]}>
              {t.habitDetail.editLink}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleToggleArchive}
            accessibilityRole="button"
            accessibilityLabel={
              habit.archivedAt
                ? t.habitDetail.unarchiveAccessibilityLabel
                : t.habitDetail.archiveAccessibilityLabel
            }
            android_ripple={linkPressFeedback.androidRipple}
            style={({ pressed }) => [
              styles.metaLinkButton,
              { opacity: linkPressFeedback.opacity(pressed) },
            ]}
          >
            <Text style={[styles.metaLink, { color: colors.textSecondary }]}>
              {habit.archivedAt ? t.habitDetail.unarchiveLink : t.habitDetail.archiveLink}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel={t.habitDetail.deletePermanentAccessibilityLabel}
            android_ripple={dangerPressFeedback.androidRipple}
            style={({ pressed }) => [
              styles.metaLinkButton,
              { opacity: dangerPressFeedback.opacity(pressed) },
            ]}
          >
            <Text style={[styles.metaLink, { color: colors.danger }]}>
              {t.habitDetail.deletePermanentLink}
            </Text>
          </Pressable>
        </View>

        <SectionHeading title={t.habitDetail.historySection} />
        <GlassCard style={styles.heatmapCard} elevationLevel="level1">
          <HabitHeatmap habit={habit} completedDateKeys={completedDateKeys} />
        </GlassCard>

        <Pressable
          onPress={handleToggleToday}
          style={({ pressed }) => [
            styles.markButton,
            {
              backgroundColor: doneToday
                ? material3.secondaryContainer
                : habit.color,
              opacity: markPressFeedback.opacity(pressed),
            },
          ]}
          accessibilityRole="button"
          accessibilityLabel={interpolate(
            doneToday
              ? t.habitDetail.markDoneAccessibilityIncomplete
              : t.habitDetail.markDoneAccessibilityComplete,
            { name: habit.name },
          )}
          android_ripple={markPressFeedback.androidRipple}
        >
          {doneToday && (
            <MaterialCommunityIcons
              name="check"
              size={18}
              color={material3.onSecondaryContainer}
            />
          )}
          <Text
            style={[
              styles.markButtonText,
              {
                color: doneToday
                  ? material3.onSecondaryContainer
                  : material3.onPrimary,
              },
            ]}
          >
            {doneToday ? t.habitDetail.markDoneButtonDone : t.habitDetail.markDoneButton}
          </Text>
        </Pressable>
      </ScrollView>
        </Animated.View>
      </GestureDetector>

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </View>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  material3: ReturnType<typeof useTheme>["material3"],
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    centered: {
      alignItems: "center",
      justifyContent: "center",
    },
    content: {
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    headerRow: {
      flexDirection: "row",
      marginBottom: spacing.sm,
    },
    iconCircle: {
      width: 52,
      height: 52,
      borderRadius: m3Shape.full,
      alignItems: "center",
      justifyContent: "center",
    },
    title: {
      ...typography.display,
      fontSize: 24,
      marginTop: spacing.sm,
    },
    statsRow: {
      flexDirection: "row",
      marginTop: spacing.lg,
      paddingVertical: spacing.md,
    },
    statCard: {
      flex: 1,
      alignItems: "center",
      paddingHorizontal: spacing.xs,
    },
    statValue: {
      ...typography.title,
      fontVariant: ["tabular-nums"],
    },
    statLabel: {
      ...typography.caption,
      marginTop: 2,
      textAlign: "center",
    },
    statDivider: {
      width: 1,
      backgroundColor: colors.divider,
      marginVertical: spacing.xs,
    },
    metaRow: {
      flexDirection: "row",
      justifyContent: "center",
      gap: spacing.xs,
      marginTop: spacing.lg,
      flexWrap: "wrap",
    },
    metaLinkButton: {
      minHeight: 48,
      paddingHorizontal: spacing.sm,
      borderRadius: m3Shape.full,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    metaLink: {
      ...typography.caption,
      fontWeight: "600",
    },
    heatmapCard: {
      padding: spacing.md,
    },
    markButton: {
      marginTop: spacing.xl,
      borderRadius: m3Shape.full,
      paddingVertical: spacing.md,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.xs,
      overflow: "hidden",
      ...m3ElevationStyle("level1"),
    },
    markButtonText: {
      ...typography.subtitle,
    },
  });
}
