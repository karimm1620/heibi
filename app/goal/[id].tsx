import * as Haptics from "expo-haptics";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../../src/components/AppAlert";
import { AppBottomSheet } from "../../src/components/AppBottomSheet";
import { EmptyState } from "../../src/components/EmptyState";
import { GlassCard } from "../../src/components/GlassCard";
import { JarProgress } from "../../src/components/JarProgress";
import { TransactionRow } from "../../src/components/TransactionRow";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import {
  getAccentColors,
  spacing,
  withOpacity,
} from "../../src/theme/colors";
import { m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import { formatIDR, formatThousands, parseThousands } from "../../src/utils/currency";

type ActionType = "deposit" | "withdraw" | null;

export default function GoalDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark } = useTheme();
  const { t, interpolate } = useTranslation();
  const { alertState, showAlert, hideAlert } = useAppAlert();

  const goal = useGoalsStore((state) => state.getGoalById(id));
  const allTransactions = useGoalsStore((state) => state.transactions);
  const deposit = useGoalsStore((state) => state.deposit);
  const withdraw = useGoalsStore((state) => state.withdraw);
  const deleteGoal = useGoalsStore((state) => state.deleteGoal);

  const transactions = useMemo(
    () =>
      allTransactions
        .filter((t) => t.goalId === id)
        .sort((a, b) => b.createdAt - a.createdAt),
    [allTransactions, id],
  );

  const [action, setAction] = useState<ActionType>(null);
  const [amountDisplay, setAmountDisplay] = useState("");
  const [note, setNote] = useState("");

  const closeSheet = () => {
    setAction(null);
    setAmountDisplay("");
    setNote("");
  };

  const accent = useMemo(() => getAccentColors(goal?.accent ?? "mint"), [goal]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        container: {
          flex: 1,
          backgroundColor: colors.background,
        },
        content: {
          paddingHorizontal: spacing.lg,
          paddingBottom: spacing.xxl,
        },
        goalName: {
          ...typography.title,
          textAlign: "center",
          marginBottom: spacing.md,
        },
        actionRow: {
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.lg,
        },
        actionButton: {
          flex: 1,
          borderRadius: m3Shape.full,
          paddingVertical: spacing.md,
          alignItems: "center",
          overflow: "hidden",
        },
        actionButtonText: {
          ...typography.subtitle,
          color: colors.textInverse,
        },
        metaRow: {
          flexDirection: "row",
          justifyContent: "center",
          gap: spacing.lg,
          marginTop: spacing.lg,
        },
        metaLink: {
          ...typography.caption,
          fontWeight: "600",
        },
        sectionTitle: {
          ...typography.subtitle,
          marginTop: spacing.xl,
          marginBottom: spacing.sm,
        },
        txCard: {
          paddingHorizontal: spacing.md,
          marginBottom: spacing.sm,
        },
        modalHint: {
          ...typography.caption,
          marginBottom: spacing.sm,
        },
        currencyInputWrap: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surfaceMuted,
          borderRadius: m3Shape.extraSmall,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          paddingHorizontal: spacing.md,
          marginTop: spacing.sm,
        },
        currencyPrefix: {
          ...typography.subtitle,
          color: colors.textSecondary,
          marginRight: spacing.xs,
        },
        currencyInput: {
          ...typography.amount,
          flex: 1,
          paddingVertical: spacing.md,
        },
        noteInput: {
          ...typography.body,
          backgroundColor: colors.surfaceMuted,
          borderRadius: m3Shape.extraSmall,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          marginTop: spacing.md,
        },
        modalActions: {
          flexDirection: "row",
          gap: spacing.md,
          marginTop: spacing.lg,
        },
        modalButton: {
          flex: 1,
          borderRadius: m3Shape.full,
          paddingVertical: spacing.md,
          alignItems: "center",
          overflow: "hidden",
        },
        modalButtonGhost: {
          backgroundColor: colors.surfaceMuted,
        },
        modalButtonGhostText: {
          ...typography.subtitle,
          color: colors.textPrimary,
        },
      }),
    [colors, typography],
  );

  if (!goal) {
    return (
      <View
        key={isDark ? "dark" : "light"}
        style={[styles.container, { paddingTop: insets.top + spacing.xl }]}
      >
        <EmptyState
          icon="magnify-close"
          title={t.goalDetail.notFoundTitle}
          description={t.goalDetail.notFoundDescription}
          ctaLabel={t.goalDetail.backCta}
          onPressCta={() => router.back()}
        />
      </View>
    );
  }

  const handleConfirm = async () => {
    const amount = parseThousands(amountDisplay);
    if (amount <= 0) {
      showAlert(t.goalDetail.emptyAmountTitle, t.goalDetail.emptyAmountMessage);
      return;
    }

    if (action === "deposit") {
      await deposit(goal.id, amount, note.trim() || undefined);
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      closeSheet();
    } else if (action === "withdraw") {
      const result = await withdraw(
        goal.id,
        amount,
        note.trim() || undefined,
      );
      if (!result.ok) {
        showAlert(t.goalDetail.withdrawErrorTitle, result.error ?? t.goalDetail.withdrawErrorFallback);
        return;
      }
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
      closeSheet();
    }
  };

  const handleDelete = () => {
    showAlert(
      t.goalDetail.deleteConfirmTitle,
      interpolate(t.goalDetail.deleteConfirmMessage, { name: goal.name }),
      [
        { label: t.common.cancel, style: "cancel" },
        {
          label: t.common.delete,
          style: "destructive",
          onPress: async () => {
            await deleteGoal(goal.id);
            router.back();
          },
        },
      ],
    );
  };

  return (
    <View key={isDark ? "dark" : "light"} style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + 60 },
        ]}
      >
        <Text style={styles.goalName}>{goal.name}</Text>

        <JarProgress
          currentAmount={goal.currentAmount}
          targetAmount={goal.targetAmount}
          accentBase={accent.base}
          accentDeep={accent.deep}
        />

        <View style={styles.actionRow}>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.deposit }]}
            onPress={() => setAction("deposit")}
            accessibilityRole="button"
            accessibilityLabel={t.goalDetail.depositAccessibilityLabel}
            android_ripple={{ color: withOpacity(colors.textInverse, 0.24) }}
          >
            <Text style={styles.actionButtonText}>{t.goalDetail.depositButton}</Text>
          </Pressable>
          <Pressable
            style={[styles.actionButton, { backgroundColor: colors.withdraw }]}
            onPress={() => setAction("withdraw")}
            accessibilityRole="button"
            accessibilityLabel={t.goalDetail.withdrawAccessibilityLabel}
            android_ripple={{ color: withOpacity(colors.textInverse, 0.24) }}
          >
            <Text style={styles.actionButtonText}>{t.goalDetail.withdrawButton}</Text>
          </Pressable>
        </View>

        <View style={styles.metaRow}>
          <Pressable
            onPress={() => router.push(`/goal/add?id=${goal.id}`)}
            accessibilityRole="button"
            accessibilityLabel={t.goalDetail.editAccessibilityLabel}
          >
            <Text style={[styles.metaLink, { color: colors.textSecondary }]}>
              {t.goalDetail.editLink}
            </Text>
          </Pressable>
          <Pressable
            onPress={handleDelete}
            accessibilityRole="button"
            accessibilityLabel={t.goalDetail.deleteAccessibilityLabel}
          >
            <Text style={[styles.metaLink, { color: colors.danger }]}>
              {t.goalDetail.deleteLink}
            </Text>
          </Pressable>
        </View>

        <Text style={styles.sectionTitle}>{t.goalDetail.historySection}</Text>
        {transactions.length === 0 ? (
          <EmptyState
            icon="sprout"
            title={t.goalDetail.emptyTransactionsTitle}
            description={t.goalDetail.emptyTransactionsDescription}
          />
        ) : (
          transactions.map((tx) => (
            <GlassCard key={tx.id} tintColor={colors.surface} style={styles.txCard}>
              <TransactionRow transaction={tx} />
            </GlassCard>
          ))
        )}
      </ScrollView>

      <AppBottomSheet
        visible={action !== null}
        onDismiss={closeSheet}
        title={action === "deposit" ? t.goalDetail.sheetTitleDeposit : t.goalDetail.sheetTitleWithdraw}
        testID="goal-transaction-sheet"
      >
        {action === "withdraw" && (
          <Text style={styles.modalHint}>
            {interpolate(t.goalDetail.availableBalance, { amount: formatIDR(goal.currentAmount) })}
          </Text>
        )}

        <View style={styles.currencyInputWrap}>
          <Text style={styles.currencyPrefix}>Rp</Text>
          <TextInput
            value={amountDisplay}
            onChangeText={(text) => setAmountDisplay(formatThousands(text))}
            placeholder="0"
            placeholderTextColor={colors.textSecondary}
            keyboardType="number-pad"
            style={styles.currencyInput}
            autoFocus
          />
        </View>

        <TextInput
          value={note}
          onChangeText={setNote}
          placeholder={t.goalDetail.notePlaceholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.noteInput}
        />

        <View style={styles.modalActions}>
          <Pressable
            onPress={closeSheet}
            style={[styles.modalButton, styles.modalButtonGhost]}
            accessibilityRole="button"
            accessibilityLabel={t.goalDetail.cancelAccessibilityLabel}
            android_ripple={{ color: colors.glassBorder }}
          >
            <Text style={styles.modalButtonGhostText}>{t.common.cancel}</Text>
          </Pressable>
          <Pressable
            onPress={handleConfirm}
            style={[
              styles.modalButton,
              {
                backgroundColor: action === "deposit" ? colors.deposit : colors.withdraw,
              },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.goalDetail.confirmAccessibilityLabel}
            android_ripple={{ color: withOpacity(colors.textInverse, 0.24) }}
          >
            <Text style={styles.actionButtonText}>{t.goalDetail.confirmButton}</Text>
          </Pressable>
        </View>
      </AppBottomSheet>

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
