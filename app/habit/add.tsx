import { DateTimePicker } from "@expo/ui/community/datetime-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useMemo, useState } from "react";
import {
  KeyboardAvoidingView,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppAlert } from "../../src/components/AppAlert";
import { Chip } from "../../src/components/Chip";
import {
  HABIT_COLOR_OPTIONS,
  HabitColorPicker,
} from "../../src/components/HabitColorPicker";
import {
  HABIT_ICON_OPTIONS,
  HabitIconPicker,
  type HabitIconName,
} from "../../src/components/HabitIconPicker";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useHabitsStore } from "../../src/store/useHabitsStore";
import { spacing, withOpacity } from "../../src/theme/colors";
import { m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import type { HabitFrequencyType } from "../../src/types";
import {
  ALL_WEEKDAYS_MASK,
  isWeekdaySelected,
  toggleWeekdayBit,
  WEEKDAYS_SHORT_BY_LANGUAGE,
} from "../../src/utils/date";
import {
  cancelReminder,
  isNotificationsAvailable,
  requestNotificationPermission,
  scheduleHabitReminder,
} from "../../src/utils/notifications";

const TIME_PRESETS = [
  { hour: 6, minute: 0, label: "06.00" },
  { hour: 7, minute: 0, label: "07.00" },
  { hour: 9, minute: 0, label: "09.00" },
  { hour: 12, minute: 0, label: "12.00" },
  { hour: 18, minute: 0, label: "18.00" },
  { hour: 20, minute: 0, label: "20.00" },
  { hour: 21, minute: 0, label: "21.00" },
];

export default function AddHabitScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { colors, typography, isDark, material3 } = useTheme();
  const { t, language, interpolate } = useTranslation();
  const { alertState, showAlert, hideAlert } = useAppAlert();

  const habit = useHabitsStore((s) =>
    id ? s.getHabitById(id) : undefined,
  );
  const addHabit = useHabitsStore((s) => s.addHabit);
  const updateHabit = useHabitsStore((s) => s.updateHabit);
  const setHabitNotificationId = useHabitsStore(
    (s) => s.setHabitNotificationId,
  );

  const [name, setName] = useState("");
  const [icon, setIcon] = useState<HabitIconName>(HABIT_ICON_OPTIONS[0]);
  const [color, setColor] = useState<string>(HABIT_COLOR_OPTIONS[0]);
  const [frequencyType, setFrequencyType] =
    useState<HabitFrequencyType>("daily");
  const [weekdaysMask, setWeekdaysMask] = useState<number>(ALL_WEEKDAYS_MASK);
  const [reminderEnabled, setReminderEnabled] = useState(false);
  const [reminderHour, setReminderHour] = useState(20);
  const [reminderMinute, setReminderMinute] = useState(0);
  const [showTimePicker, setShowTimePicker] = useState(false);

  // Checkpoint 9: adjusting state during render (bukan useEffect) -- lihat
  // catatan sama di goal/add.tsx. `habit` baru kebaca async dari SQLite,
  // jadi tetap butuh guard "belum di-populate buat id ini", bukan cuma
  // lazy initializer useState biasa.
  const [populatedHabitId, setPopulatedHabitId] = useState<string | undefined>(undefined);
  if (habit && habit.id !== populatedHabitId) {
    setPopulatedHabitId(habit.id);
    setName(habit.name);
    setIcon(habit.icon as HabitIconName);
    setColor(habit.color);
    setFrequencyType(habit.frequencyType);
    setWeekdaysMask(habit.weekdaysMask);
    if (habit.reminderTime) {
      const [h, m] = habit.reminderTime.split(":").map(Number);
      setReminderEnabled(true);
      setReminderHour(h);
      setReminderMinute(m);
    }
  }

  // Chip "Atur sendiri" dobel fungsi: kalau reminder aktif lagi pas jam yang
  // gak ada di TIME_PRESETS (hasil dari custom picker), chip ini yang jadi
  // "aktif" dan labelnya ganti nampilin jam kustomnya.
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

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName) {
      showAlert(t.habitForm.emptyNameTitle, t.habitForm.emptyNameMessage);
      return;
    }
    if (frequencyType === "weekdays" && weekdaysMask === 0) {
      showAlert(t.habitForm.noWeekdaysTitle, t.habitForm.noWeekdaysMessage);
      return;
    }

    const reminderTime = reminderEnabled
      ? `${String(reminderHour).padStart(2, "0")}:${String(reminderMinute).padStart(2, "0")}`
      : null;

    // Reminder lama (kalau ada, mode edit) selalu di-cancel dulu — baik
    // karena reminder dimatiin, jamnya diganti, ATAU mau di-reschedule ulang
    // di bawah. Lebih aman nyandingin fresh schedule daripada nyoba nge-diff
    // "apa jam-nya beneran berubah" (murah dijalanin, gak ada downside).
    if (isEditMode && habit?.notificationId) {
      await cancelReminder(habit.notificationId);
    }

    let notificationId: string | null = null;

    if (reminderEnabled) {
      if (!isNotificationsAvailable) {
        showAlert(t.habitForm.reminderUnavailableTitle, t.habitForm.reminderUnavailableMessage);
      } else {
        const granted = await requestNotificationPermission();
        if (!granted) {
          showAlert(t.habitForm.reminderPermissionTitle, t.habitForm.reminderPermissionMessage, [
            { label: t.common.later, style: "cancel" },
            { label: t.reminder.permissionOpenSettings, onPress: () => Linking.openSettings() },
          ]);
        } else {
          notificationId = await scheduleHabitReminder(
            trimmedName,
            reminderHour,
            reminderMinute,
            language,
          );
        }
      }
    }

    const input = {
      name: trimmedName,
      icon,
      color,
      frequencyType,
      weekdaysMask,
      reminderTime,
    };

    if (isEditMode && id) {
      await updateHabit(id, input);
      await setHabitNotificationId(id, notificationId);
    } else {
      const created = await addHabit(input);
      if (notificationId) {
        await setHabitNotificationId(created.id, notificationId);
      }
    }
    router.back();
  };

  const styles = useMemo(
    () => createStyles(colors, typography, material3),
    [colors, typography, material3],
  );

  return (
    <KeyboardAvoidingView key={isDark ? "dark" : "light"} style={{ flex: 1 }}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
      >
        <Text style={styles.label}>{t.habitForm.nameLabel}</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder={t.habitForm.namePlaceholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
        />

        <Text style={styles.label}>{t.habitForm.iconLabel}</Text>
        <HabitIconPicker selected={icon} color={color} onSelect={setIcon} />

        <Text style={styles.label}>{t.habitForm.colorLabel}</Text>
        <HabitColorPicker selected={color} onSelect={setColor} />

        <Text style={styles.label}>{t.habitForm.frequencyLabel}</Text>
        <View style={styles.chipRow}>
          <Chip
            label={t.habitForm.dailyChip}
            selected={frequencyType === "daily"}
            onPress={() => setFrequencyType("daily")}
          />
          <Chip
            label={t.habitForm.weekdaysChip}
            selected={frequencyType === "weekdays"}
            onPress={() => setFrequencyType("weekdays")}
          />
        </View>

        {frequencyType === "weekdays" && (
          <View style={styles.weekdayRow}>
            {WEEKDAYS_SHORT_BY_LANGUAGE[language].map((label, index) => {
              const active = isWeekdaySelected(weekdaysMask, index);
              return (
                <Pressable
                  key={label}
                  onPress={() =>
                    setWeekdaysMask((prev) => toggleWeekdayBit(prev, index))
                  }
                  style={[
                    styles.weekdayChip,
                    active && {
                      backgroundColor: material3.secondaryContainer,
                      borderColor: "transparent",
                    },
                  ]}
                  accessibilityRole="button"
                  accessibilityLabel={interpolate(t.habitForm.weekdayAccessibilityLabel, { label })}
                  accessibilityState={{ selected: active }}
                  android_ripple={{ color: colors.glassBorder }}
                >
                  <Text
                    style={[
                      typography.caption,
                      {
                        color: active
                          ? material3.onSecondaryContainer
                          : colors.textSecondary,
                      },
                    ]}
                  >
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
        )}

        <View style={styles.reminderHeader}>
          <Text style={[styles.label, { marginTop: 0 }]}>{t.habitForm.reminderLabel}</Text>
          <Switch
            value={reminderEnabled}
            onValueChange={setReminderEnabled}
            trackColor={{ true: material3.primary }}
            accessibilityLabel={t.habitForm.reminderAccessibilityLabel}
          />
        </View>

        {reminderEnabled && (
          <View style={styles.chipRow}>
            {TIME_PRESETS.map((preset) => (
              <Chip
                key={preset.label}
                label={preset.label}
                selected={
                  reminderHour === preset.hour &&
                  reminderMinute === preset.minute
                }
                onPress={() => {
                  setReminderHour(preset.hour);
                  setReminderMinute(preset.minute);
                }}
              />
            ))}
            <Chip
              key="custom"
              label={customChipLabel}
              selected={!matchesPreset}
              onPress={() => setShowTimePicker(true)}
              accessibilityLabel={t.reminder.customChipAccessibilityLabel}
            />
          </View>
        )}

        {showTimePicker && (
          <DateTimePicker
            value={pickerValue}
            mode="time"
            presentation="dialog"
            is24Hour
            accentColor={material3.primary}
            onValueChange={(_event, date) => {
              setShowTimePicker(false);
              setReminderHour(date.getHours());
              setReminderMinute(date.getMinutes());
            }}
            onDismiss={() => setShowTimePicker(false)}
          />
        )}

        <Pressable
          onPress={handleSave}
          style={styles.saveButton}
          accessibilityRole="button"
          accessibilityLabel={
            isEditMode ? t.habitForm.saveAccessibilityEdit : t.habitForm.saveAccessibilityCreate
          }
          android_ripple={{ color: withOpacity(material3.onPrimary, 0.24) }}
        >
          <Text style={styles.saveButtonText}>
            {isEditMode ? t.habitForm.saveButtonEdit : t.habitForm.saveButtonCreate}
          </Text>
        </Pressable>
      </ScrollView>

      <AppAlert
        visible={alertState.visible}
        title={alertState.title}
        message={alertState.message}
        buttons={alertState.buttons}
        onClose={hideAlert}
      />
    </KeyboardAvoidingView>
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
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    label: {
      ...typography.label,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    input: {
      ...typography.body,
      backgroundColor: colors.surface,
      borderRadius: m3Shape.extraSmall,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      borderWidth: 1,
      borderColor: colors.glassBorder,
    },
    chipRow: {
      flexDirection: "row",
      flexWrap: "wrap",
      gap: spacing.sm,
    },
    weekdayRow: {
      flexDirection: "row",
      gap: spacing.xs,
      marginTop: spacing.sm,
    },
    weekdayChip: {
      width: 40,
      height: 40,
      borderRadius: m3Shape.full,
      borderWidth: 1,
      borderColor: colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
      // Checkpoint 13: fix KEDUA buat bug flash (lihat komentar sama di
      // Chip.tsx) -- overflow:hidden biar ripple clip ke bentuk circular
      // chip-nya, bukan ke bounding-box persegi.
      overflow: "hidden",
    },
    reminderHeader: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
      marginTop: spacing.lg,
    },
    saveButton: {
      marginTop: spacing.xl,
      backgroundColor: material3.primary,
      borderRadius: m3Shape.full,
      paddingVertical: spacing.md,
      alignItems: "center",
      overflow: "hidden",
    },
    saveButtonText: {
      ...typography.subtitle,
      color: material3.onPrimary,
    },
  });
}
