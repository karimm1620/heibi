import { MaterialCommunityIcons } from "@expo/vector-icons";
import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useFocusEffect } from "expo-router/react-navigation";
import React, { useCallback, useMemo, useState } from "react";
import { Linking, Pressable, StyleSheet, Switch, Text, View } from "react-native";
import { useAppAlert } from "../hooks/useAppAlert";
import { useTranslation } from "../hooks/useTranslation";
import { type ReminderDomain, useSettingsStore } from "../store/useSettingsStore";
import { radius, spacing, withOpacity } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import {
  cancelReminder,
  checkNotificationPermission,
  isNotificationsAvailable,
  requestNotificationPermission,
  scheduleReminder,
} from "../utils/notifications";
import { AppAlert } from "./AppAlert";
import { GlassCard } from "./GlassCard";

const TIME_PRESETS = [
  { hour: 7, minute: 0, label: "07.00" },
  { hour: 9, minute: 0, label: "09.00" },
  { hour: 12, minute: 0, label: "12.00" },
  { hour: 18, minute: 0, label: "18.00" },
  { hour: 20, minute: 0, label: "20.00" },
  { hour: 21, minute: 0, label: "21.00" },
];

interface ReminderCardProps {
  domain: ReminderDomain;
}

/**
 * Versi INLINE (bukan modal/bottom-sheet) dari reminder toggle+time-picker —
 * dulu `ReminderSheet.tsx` (dibuka via bell icon di Goals/Today), sekarang
 * semua notification setting dipindah jadi konten statis di tab Settings
 * (lihat `app/(tabs)/settings.tsx`). Logic permission-check/schedule/cancel
 * SAMA PERSIS, cuma shell-nya yang beda (card biasa, bukan Modal+drag).
 */
export function ReminderCard({ domain }: ReminderCardProps) {
  const { colors, typography } = useTheme();
  const { t, interpolate, language } = useTranslation();
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const reminder = useSettingsStore((s) =>
    domain === "savings" ? s.savingsReminder : s.plannerReminder,
  );
  const setReminder = useSettingsStore((s) => s.setReminder);
  const copy = t.reminder[domain];

  const {
    enabled: reminderEnabled,
    hour: reminderHour,
    minute: reminderMinute,
    notificationId: reminderNotificationId,
  } = reminder;

  const [busy, setBusy] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Ganti dari "tiap kali sheet dibuka" (dulu, keyed ke prop `visible`) jadi
  // "tiap kali user balik fokus ke tab Settings ini" — behavior setara buat
  // konten yang sekarang selalu ke-mount statis, bukan modal yang dibuka-tutup.
  useFocusEffect(
    useCallback(() => {
      if (!reminderEnabled || !isNotificationsAvailable) return;
      let cancelled = false;
      (async () => {
        const granted = await checkNotificationPermission();
        if (cancelled || granted) return;
        await cancelReminder(reminderNotificationId);
        await setReminder(domain, false, reminderHour, reminderMinute, null);
        showAlert(t.reminder.disabledTitle, t.reminder.disabledMessage);
      })();
      return () => {
        cancelled = true;
      };
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [reminderEnabled, reminderNotificationId, domain]),
  );

  const handleToggle = async (value: boolean) => {
    if (!isNotificationsAvailable) {
      showAlert(t.reminder.expoGoTitle, t.reminder.expoGoMessage);
      return;
    }

    if (!value) {
      setBusy(true);
      await cancelReminder(reminderNotificationId);
      await setReminder(domain, false, reminderHour, reminderMinute, null);
      setBusy(false);
      return;
    }

    setBusy(true);
    const granted = await requestNotificationPermission();
    if (!granted) {
      setBusy(false);
      showAlert(t.reminder.permissionTitle, t.reminder.permissionMessage, [
        { label: t.common.later, style: "cancel" },
        { label: t.reminder.permissionOpenSettings, onPress: () => Linking.openSettings() },
      ]);
      return;
    }

    await cancelReminder(reminderNotificationId);
    const id = await scheduleReminder(domain, reminderHour, reminderMinute, language);
    if (!id) {
      setBusy(false);
      showAlert(t.reminder.scheduleErrorTitle, t.reminder.scheduleErrorMessage);
      return;
    }
    await setReminder(domain, true, reminderHour, reminderMinute, id);
    setBusy(false);
  };

  const handlePickTime = async (hour: number, minute: number) => {
    if (!reminderEnabled || busy || !isNotificationsAvailable) return;
    setBusy(true);
    await cancelReminder(reminderNotificationId);
    const id = await scheduleReminder(domain, hour, minute, language);
    if (id) {
      await setReminder(domain, true, hour, minute, id);
    }
    setBusy(false);
  };

  // Chip "Atur sendiri" dobel fungsi: kalau reminder aktif lagi pas jam yang
  // gak ada di TIME_PRESETS (hasil dari custom picker), chip ini yang jadi
  // "aktif" dan labelnya ganti nampilin jam kustomnya -- bukan cuma tombol
  // buka dialog doang.
  const matchesPreset = TIME_PRESETS.some(
    (preset) => preset.hour === reminderHour && preset.minute === reminderMinute,
  );
  const customChipLabel = matchesPreset
    ? t.reminder.customChipLabel
    : `${String(reminderHour).padStart(2, "0")}.${String(reminderMinute).padStart(2, "0")}`;

  const pickerValue = useMemo(() => {
    const date = new Date();
    date.setHours(reminderHour, reminderMinute, 0, 0);
    return date;
  }, [reminderHour, reminderMinute]);

  const styles = useMemo(
    () =>
      StyleSheet.create({
        card: { padding: spacing.lg, marginBottom: spacing.md },
        title: { ...typography.subtitle, marginBottom: spacing.xs },
        description: { ...typography.caption, marginBottom: spacing.md },
        unavailableNotice: {
          flexDirection: "row",
          alignItems: "center",
          gap: spacing.xs,
          backgroundColor: withOpacity(colors.danger, 0.1),
          padding: spacing.sm,
          borderRadius: radius.md,
          marginBottom: spacing.md,
        },
        unavailableNoticeText: {
          ...typography.caption,
          color: colors.danger,
          flexShrink: 1,
        },
        toggleRow: {
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "space-between",
          paddingVertical: spacing.sm,
        },
        toggleLabel: { ...typography.body, flex: 1, marginRight: spacing.md },
        timeGrid: {
          flexDirection: "row",
          flexWrap: "wrap",
          gap: spacing.sm,
          marginTop: spacing.md,
        },
        timeChip: {
          paddingHorizontal: spacing.md,
          paddingVertical: spacing.sm,
          borderRadius: radius.pill,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1.5,
          borderColor: "transparent",
        },
        timeChipActive: {
          borderColor: colors.deposit,
          backgroundColor: withOpacity(colors.deposit, 0.15),
        },
        timeChipText: {
          ...typography.caption,
          fontWeight: "600",
          color: colors.textSecondary,
        },
        timeChipTextActive: { color: colors.textPrimary },
      }),
    [colors, typography],
  );

  return (
    <GlassCard style={styles.card} elevationLevel="level1">
      <Text style={styles.title}>{copy.title}</Text>
      <Text style={styles.description}>{copy.description}</Text>

      {!isNotificationsAvailable && (
        <View style={styles.unavailableNotice}>
          <MaterialCommunityIcons name="alert-outline" size={16} color={colors.danger} />
          <Text style={styles.unavailableNoticeText}>{t.reminder.unavailableNotice}</Text>
        </View>
      )}

      <View style={styles.toggleRow}>
        <Text style={styles.toggleLabel}>{copy.toggleLabel}</Text>
        <Switch
          value={reminderEnabled}
          onValueChange={handleToggle}
          disabled={busy || !isNotificationsAvailable}
          trackColor={{ false: colors.glassBorder, true: colors.deposit }}
          thumbColor="#FFFFFF"
          accessibilityLabel={copy.toggleLabel}
          accessibilityRole="switch"
        />
      </View>

      {reminderEnabled && (
        <View style={styles.timeGrid}>
          {TIME_PRESETS.map((preset) => {
            const isActive =
              reminderHour === preset.hour && reminderMinute === preset.minute;
            return (
              <Pressable
                key={preset.label}
                onPress={() => handlePickTime(preset.hour, preset.minute)}
                disabled={busy}
                style={[styles.timeChip, isActive && styles.timeChipActive]}
                accessibilityRole="button"
                accessibilityLabel={interpolate(t.reminder.presetAccessibilityLabel, { time: preset.label })}
                accessibilityState={{ selected: isActive }}
              >
                <Text
                  style={[
                    styles.timeChipText,
                    isActive && styles.timeChipTextActive,
                  ]}
                >
                  {preset.label}
                </Text>
              </Pressable>
            );
          })}
          <Pressable
            key="custom"
            onPress={() => setShowTimePicker(true)}
            disabled={busy}
            style={[styles.timeChip, !matchesPreset && styles.timeChipActive]}
            accessibilityRole="button"
            accessibilityLabel={t.reminder.customChipAccessibilityLabel}
            accessibilityState={{ selected: !matchesPreset }}
          >
            <Text
              style={[
                styles.timeChipText,
                !matchesPreset && styles.timeChipTextActive,
              ]}
            >
              {customChipLabel}
            </Text>
          </Pressable>
        </View>
      )}

      {showTimePicker && (
        <DateTimePicker
          value={pickerValue}
          mode="time"
          presentation="dialog"
          is24Hour
          accentColor={colors.deposit}
          onValueChange={(_event, date) => {
            setShowTimePicker(false);
            handlePickTime(date.getHours(), date.getMinutes());
          }}
          onDismiss={() => setShowTimePicker(false)}
        />
      )}

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </GlassCard>
  );
}
