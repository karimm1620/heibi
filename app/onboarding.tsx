import { MaterialCommunityIcons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import { Animated, Easing, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useReducedMotion } from "../src/hooks/useReducedMotion";
import { useSettingsStore } from "../src/store/useSettingsStore";
import { accentByKey, radius, spacing, withOpacity } from "../src/theme/colors";
import type { AccentKey } from "../src/theme/colors";
import { m3Motion, m3Shape } from "../src/theme/material3/tokens";
import { useTheme } from "../src/theme/useTheme";
import { requestNotificationPermission } from "../src/utils/notifications";

interface OnboardingStep {
  icon: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  accentKey: AccentKey;
  title: string;
  description: string;
}

/**
 * 3 layar fitur (Savings/Habit/Planner) + 1 layar izin notifikasi di akhir
 * (spec 5e: "perkenalan fitur + minta izin notifikasi di layar terakhir").
 * Nama icon di sini SENGAJA cuma dipilih dari yang udah kepakai/terverifikasi
 * di tempat lain di app ini (`piggy-bank` di HabitIconPicker, `dumbbell` di
 * HabitIconPicker, `calendar-check-outline` di TabMeta) -- sandbox sesi ini
 * gak bisa npm install/tsc buat validasi nama icon MaterialCommunityIcons
 * (lihat catatan checkpoint), jadi diminimalkan resikonya dengan reuse yang
 * udah pasti valid, bukan nebak nama baru.
 */
const FEATURE_STEPS: OnboardingStep[] = [
  {
    icon: "piggy-bank",
    accentKey: "mint",
    title: "Nabung buat goal impianmu",
    description:
      "Bikin goal tabungan, catat tiap setor atau tarik, dan lihat progresnya langsung tanpa ribet.",
  },
  {
    icon: "dumbbell",
    accentKey: "rose",
    title: "Bangun kebiasaan baik",
    description:
      "Tandai habit harian dan pantau konsistensimu lewat heatmap streak dari hari ke hari.",
  },
  {
    icon: "calendar-check-outline",
    accentKey: "sky",
    title: "Rencanain hari kamu",
    description:
      "Kelola tugas harian bareng tabungan dan habit, semuanya kumpul di satu tempat.",
  },
];

const PERMISSION_STEP: OnboardingStep = {
  icon: "bell-outline",
  accentKey: "lavender",
  title: "Jangan sampai kelewatan",
  description:
    "Aktifkan notifikasi biar bisa diingetin buat nabung, ngerjain tugas, dan jaga streak habit tiap hari.",
};

const STEPS: OnboardingStep[] = [...FEATURE_STEPS, PERMISSION_STEP];

export default function OnboardingScreen() {
  const { colors, typography, material3 } = useTheme();
  const insets = useSafeAreaInsets();
  const reducedMotion = useReducedMotion();
  const router = useRouter();
  const completeOnboarding = useSettingsStore((state) => state.completeOnboarding);

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
      {!isLastStep && (
        <Pressable
          onPress={finish}
          hitSlop={12}
          style={styles.skipButton}
          accessibilityRole="button"
          accessibilityLabel="Lewati onboarding"
          android_ripple={{ color: colors.glassBorder, borderless: true, radius: 24 }}
        >
          <Text style={styles.skipText}>Lewati</Text>
        </Pressable>
      )}

      <View style={[styles.content, isLastStep && styles.contentNoSkipOffset]}>
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
              key={s.title}
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
          accessibilityLabel={isLastStep ? "Aktifkan notifikasi" : "Lanjut"}
          android_ripple={{ color: withOpacity(material3.onPrimary, 0.24) }}
        >
          <Text style={styles.primaryButtonText}>
            {isLastStep ? "Aktifkan Notifikasi" : "Lanjut"}
          </Text>
        </Pressable>

        {isLastStep && (
          <Pressable
            onPress={finish}
            disabled={busy}
            hitSlop={12}
            style={styles.laterButton}
            accessibilityRole="button"
            accessibilityLabel="Lewati izin notifikasi"
          >
            <Text style={styles.laterButtonText}>Nanti aja</Text>
          </Pressable>
        )}
      </View>
    </View>
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
    skipButton: {
      alignSelf: "flex-end",
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
    },
    skipText: { ...typography.body, color: colors.textSecondary, fontWeight: "600" },
    content: {
      flex: 1,
      alignItems: "center",
      justifyContent: "center",
      paddingHorizontal: spacing.xl,
    },
    // Step terakhir gak punya tombol Lewati di atas (lihat komentar di
    // render) -- kompensasi biar konten gak keliatan "melorot" ke bawah
    // dibanding 3 step sebelumnya yang punya ruang tombol Lewati di atas.
    contentNoSkipOffset: {
      marginTop: spacing.xl + spacing.md,
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
