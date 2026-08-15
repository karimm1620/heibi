import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "../src/hooks/useReducedMotion";
import { useTranslation } from "../src/hooks/useTranslation";
import type { Language } from "../src/i18n";
import { useSettingsStore } from "../src/store/useSettingsStore";
import { accentByKey, radius, spacing, withOpacity } from "../src/theme/colors";
import type { AccentKey } from "../src/theme/colors";
import { m3Motion, m3Shape } from "../src/theme/material3/tokens";
import { useTheme } from "../src/theme/useTheme";
import { requestNotificationPermission } from "../src/utils/notifications";

interface OnboardingStep {
  id: string;
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  accentKey: AccentKey;
  title: string;
  description: string;
}

/**
 * 3 layar fitur (Savings/Habit/Planner) + 1 layar izin notifikasi di akhir
 * (spec 5e: "perkenalan fitur + minta izin notifikasi di layar terakhir").
 * Nama icon SENGAJA cuma dipilih dari yang udah kepakai/terverifikasi di
 * tempat lain di app ini (`piggy-bank` di HabitIconPicker, `dumbbell` di
 * HabitIconPicker, `calendar-check-outline` di TabMeta) -- reuse yang
 * udah pasti valid, bukan nebak nama baru.
 *
 * Isinya (title/description) DIBANGUN DI DALAM komponen (bukan module-level
 * constant lagi kayak sebelum Checkpoint 21) -- butuh `t` dari
 * `useTranslation()` yang cuma keakses lewat hook, gak bisa di module scope.
 */
export default function OnboardingScreen() {
  const { colors, typography, material3 } = useTheme();
  const { t, language } = useTranslation();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);
  const setLanguage = useSettingsStore((state) => state.setLanguage);

  const STEPS: OnboardingStep[] = useMemo(
    () => [
      {
        id: "savings",
        icon: "piggy-bank",
        accentKey: "mint",
        title: t.onboarding.savingsTitle,
        description: t.onboarding.savingsDescription,
      },
      {
        id: "habits",
        icon: "dumbbell",
        accentKey: "rose",
        title: t.onboarding.habitsTitle,
        description: t.onboarding.habitsDescription,
      },
      {
        id: "planner",
        icon: "calendar-check-outline",
        accentKey: "sky",
        title: t.onboarding.plannerTitle,
        description: t.onboarding.plannerDescription,
      },
      {
        id: "notifications",
        icon: "bell-outline",
        accentKey: "lavender",
        title: t.onboarding.notificationsTitle,
        description: t.onboarding.notificationsDescription,
      },
    ],
    [t],
  );

  const [step, setStep] = useState(0);
  const [busy, setBusy] = useState(false);
  const isLastStep = step === STEPS.length - 1;
  const current = STEPS[step];
  const accent = accentByKey[current.accentKey];

  // useState (bukan useRef) sengaja dipilih di sini -- `useRef(...).current`
  // kena warning React "Cannot access refs during render" (persis pola yang
  // udah jadi technical debt di eslint.config.js buat kode animasi lama
  // PanResponder/Animated.Value). Baca `.current` milik ref pas render itu
  // yang di-flag; baca dari `useState` pas render itu justru wajar/expected,
  // jadi Animated.Value yang immutable-referensinya ini aman disimpan lewat
  // lazy initializer state, TANPA nambah instance baru ke debt yang udah ada.
  const [opacity] = useState(() => new Animated.Value(1));
  const [translateY] = useState(() => new Animated.Value(0));

  // Crossfade + rise tipis tiap ganti step. Bukan swipe carousel gesture --
  // flow-nya linear (fitur 1 -> 2 -> 3 -> izin notifikasi), gak ada alasan
  // buat drag antar step kayak SwipeableRow/drag-reorder di layar lain.
  useEffect(() => {
    opacity.setValue(0);
    translateY.setValue(reducedMotion ? 0 : 12);
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: reducedMotion ? 1 : m3Motion.duration.medium2,
        easing: Easing.bezier(...m3Motion.easing.standardDecelerate),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: reducedMotion ? 1 : m3Motion.duration.medium2,
        easing: Easing.bezier(...m3Motion.easing.standardDecelerate),
        useNativeDriver: true,
      }),
    ]).start();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reducedMotion]);

  const finish = async () => {
    await completeOnboarding();
    router.replace("/(tabs)");
  };

  const handlePrimaryPress = async () => {
    if (!isLastStep) {
      setStep((s) => s + 1);
      return;
    }
    setBusy(true);
    // Hasil grant/deny sengaja gak dicek di sini -- diterima atau ditolak,
    // onboarding tetap dianggap selesai. User masih bisa aktifin lewat tab
    // Settings (ReminderCard) kapan pun kalau berubah pikiran belakangan.
    await requestNotificationPermission();
    await finish();
  };

  const styles = useMemo(
    () => createStyles(colors, typography, material3, insets),
    [colors, typography, material3, insets],
  );

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <LanguageToggle
          language={language}
          onSelect={setLanguage}
          idLabel={t.settings.language.id}
          enLabel={t.settings.language.en}
          styles={styles}
          material3={material3}
        />
        {!isLastStep && (
          <Pressable
            onPress={finish}
            hitSlop={12}
            style={styles.skipButton}
            accessibilityRole="button"
            accessibilityLabel={t.onboarding.skipAccessibilityLabel}
            android_ripple={{ color: colors.glassBorder, borderless: true, radius: 24 }}
          >
            <Text style={styles.skipText}>{t.onboarding.skipButton}</Text>
          </Pressable>
        )}
      </View>

      <View style={styles.content}>
        <Animated.View style={[styles.stepBody, { opacity, transform: [{ translateY }] }]}>
          <View style={[styles.iconWrap, { backgroundColor: accent.base }]}>
            <MaterialCommunityIcons name={current.icon} size={56} color={accent.deep} />
          </View>
          <Text style={styles.title}>{current.title}</Text>
          <Text style={styles.description}>{current.description}</Text>
        </Animated.View>
      </View>

      <View style={styles.footer}>
        <View style={styles.dots}>
          {STEPS.map((s, index) => (
            <View
              key={s.id}
              style={[
                styles.dot,
                index === step
                  ? { backgroundColor: material3.primary, width: 20 }
                  : { backgroundColor: colors.glassBorder },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handlePrimaryPress}
          disabled={busy}
          style={styles.primaryButton}
          accessibilityRole="button"
          accessibilityLabel={
            isLastStep
              ? t.onboarding.enableNotificationsAccessibilityLabel
              : t.onboarding.continueAccessibilityLabel
          }
          android_ripple={{ color: withOpacity(material3.onPrimary, 0.24) }}
        >
          <Text style={styles.primaryButtonText}>
            {isLastStep ? t.onboarding.enableNotificationsButton : t.onboarding.continueButton}
          </Text>
        </Pressable>

        {isLastStep && (
          <Pressable
            onPress={finish}
            disabled={busy}
            hitSlop={12}
            style={styles.laterButton}
            accessibilityRole="button"
            accessibilityLabel={t.onboarding.skipPermissionAccessibilityLabel}
          >
            <Text style={styles.laterButtonText}>{t.onboarding.skipPermissionButton}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

interface LanguageToggleProps {
  language: Language;
  onSelect: (language: Language) => Promise<void> | void;
  idLabel: string;
  enLabel: string;
  styles: ReturnType<typeof createStyles>;
  material3: ReturnType<typeof useTheme>["material3"];
}

/**
 * Toggle bahasa versi kompak (segmented pill "ID | EN") -- beda dari
 * `LanguageOption` 2-chip lebar penuh di Settings, di sini butuh yang
 * lebih kecil biar gak ganggu fokus konten onboarding. Accessibility
 * label per segmen REUSE `t.settings.language.id`/`.en` ("Indonesia"/
 * "English") yang udah ada, bukan bikin key baru duplikat -- teks
 * visible-nya sendiri ("ID"/"EN") sengaja gak diterjemahin, kode bahasa
 * itu universal/gak butuh terjemahan.
 */
function LanguageToggle({ language, onSelect, idLabel, enLabel, styles, material3 }: LanguageToggleProps) {
  return (
    <View style={styles.languageToggle}>
      <LanguageSegment
        code="ID"
        active={language === "id"}
        accessibilityLabel={idLabel}
        onPress={() => onSelect("id")}
        styles={styles}
        material3={material3}
      />
      <LanguageSegment
        code="EN"
        active={language === "en"}
        accessibilityLabel={enLabel}
        onPress={() => onSelect("en")}
        styles={styles}
        material3={material3}
      />
    </View>
  );
}

interface LanguageSegmentProps {
  code: string;
  active: boolean;
  accessibilityLabel: string;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  material3: ReturnType<typeof useTheme>["material3"];
}

function LanguageSegment({ code, active, accessibilityLabel, onPress, styles, material3 }: LanguageSegmentProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active }}
      style={[styles.languageSegment, active && { backgroundColor: material3.primary }]}
      android_ripple={{ color: withOpacity(material3.onPrimary, 0.16) }}
    >
      <Text style={[styles.languageSegmentText, active && { color: material3.onPrimary }]}>
        {code}
      </Text>
    </Pressable>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  material3: ReturnType<typeof useTheme>["material3"],
  insets: { top: number; bottom: number; left: number; right: number },
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
      paddingTop: insets.top,
      paddingBottom: insets.bottom + spacing.lg,
    },
    // Header row SELALU render (language toggle minimal ada di semua step,
    // skip cuma di step non-terakhir) -- beda dari sebelumnya yang bikin
    // header ilang total pas step terakhir & butuh compensation margin di
    // content. Sekarang tinggi header konsisten tiap step, gak perlu hack
    // "contentNoSkipOffset" lagi.
    headerRow: {
      flexDirection: "row",
      justifyContent: "space-between",
      alignItems: "center",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.xs,
    },
    skipButton: {
      paddingVertical: spacing.md,
    },
    skipText: { ...typography.body, color: colors.textSecondary, fontWeight: "600" },
    languageToggle: {
      flexDirection: "row",
      borderRadius: m3Shape.full,
      borderWidth: 1.5,
      borderColor: colors.glassBorder,
      overflow: "hidden",
    },
    languageSegment: {
      paddingHorizontal: spacing.sm + 4,
      paddingVertical: spacing.xs + 2,
      minWidth: 44,
      alignItems: "center",
      justifyContent: "center",
    },
    languageSegmentText: {
      ...typography.caption,
      fontWeight: "700",
      color: colors.textSecondary,
    },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    stepBody: { alignItems: "center" },
    iconWrap: {
      width: 120,
      height: 120,
      borderRadius: radius.xl,
      alignItems: "center",
      justifyContent: "center",
      marginBottom: spacing.xl,
    },
    title: {
      ...typography.display,
      textAlign: "center",
      marginBottom: spacing.sm,
    },
    description: {
      ...typography.body,
      color: colors.textSecondary,
      textAlign: "center",
    },
    footer: { paddingHorizontal: spacing.xl },
    dots: {
      flexDirection: "row",
      justifyContent: "center",
      alignItems: "center",
      gap: spacing.xs,
      marginBottom: spacing.xl,
    },
    dot: { height: 8, width: 8, borderRadius: radius.pill },
    primaryButton: {
      backgroundColor: material3.primary,
      borderRadius: m3Shape.full,
      paddingVertical: spacing.md,
      alignItems: "center",
      overflow: "hidden",
    },
    primaryButtonText: { ...typography.subtitle, color: material3.onPrimary },
    laterButton: {
      alignItems: "center",
      marginTop: spacing.md,
      paddingVertical: spacing.sm,
    },
    laterButtonText: { ...typography.body, color: colors.textSecondary, fontWeight: "600" },
  });
}
