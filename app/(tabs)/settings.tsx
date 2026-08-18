import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { File } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import React, { useMemo, useState } from "react";
import {
  ActivityIndicator,
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../../src/components/AppAlert";
import { GlassCard } from "../../src/components/GlassCard";
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MARGIN,
} from "../../src/components/FloatingTabBar";
import { ReminderCard } from "../../src/components/ReminderCard";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import { useHabitsStore } from "../../src/store/useHabitsStore";
import { useSettingsStore } from "../../src/store/useSettingsStore";
import { useTodosStore } from "../../src/store/useTodosStore";
import { spacing } from "../../src/theme/colors";
import { m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import {
  exportBackupToFile,
  restoreFromBackup,
  validateBackupPayload,
} from "../../src/utils/backup";

const GITHUB_URL = "https://github.com/karimm1620/heibi";
const SAWERIA_URL = "https://saweria.co/immu";
const PRIVACY_POLICY = "https://karimm1620.github.io/heibi-privacy-policy/privacy-policy.html"

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const { colors, typography, isDark, material3 } = useTheme();
  const { t, interpolate, language } = useTranslation();
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const [busy, setBusy] = useState<"export" | "import" | null>(null);

  const hydrateGoals = useGoalsStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateHabits = useHabitsStore((s) => s.hydrate);
  const hydrateTodos = useTodosStore((s) => s.hydrate);

  const styles = useMemo(
    () => createStyles(colors, typography, material3, insets.top),
    [colors, typography, material3, insets.top],
  );

  const handleExport = async () => {
    setBusy("export");
    try {
      const file = await exportBackupToFile();
      const available = await Sharing.isAvailableAsync();
      if (available) {
        await Sharing.shareAsync(file.uri, {
          mimeType: "application/json",
          dialogTitle: t.settings.backup.shareDialogTitle,
        });
      } else {
        showAlert(
          t.settings.backup.exportSuccessTitle,
          interpolate(t.settings.backup.exportSuccessMessage, { uri: file.uri }),
        );
      }
    } catch {
      showAlert(t.settings.backup.exportErrorTitle, t.settings.backup.exportErrorMessage);
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async () => {
    let result: DocumentPicker.DocumentPickerResult;
    try {
      result = await DocumentPicker.getDocumentAsync({
        type: "application/json",
        copyToCacheDirectory: true,
      });
    } catch {
      showAlert(t.settings.backup.importOpenErrorTitle, t.settings.backup.importOpenErrorMessage);
      return;
    }
    if (result.canceled || !result.assets?.length) return;

    setBusy("import");
    let parsed: unknown;
    try {
      const file = new File(result.assets[0].uri);
      const text = await file.text();
      parsed = JSON.parse(text);
    } catch {
      setBusy(null);
      showAlert(t.settings.backup.importParseErrorTitle, t.settings.backup.importParseErrorMessage);
      return;
    }

    const validation = validateBackupPayload(parsed);
    setBusy(null);
    if (!validation.valid || !validation.payload) {
      showAlert(
        t.settings.backup.importInvalidTitle,
        validation.error ?? t.settings.backup.importInvalidFallback,
      );
      return;
    }

    const { data } = validation.payload;
    showAlert(
      t.settings.backup.confirmTitle,
      interpolate(t.settings.backup.confirmMessage, {
        goals: data.savingsGoals.length,
        habits: data.habits.length,
        todos: data.todos.length,
      }),
      [
        { label: t.common.cancel, style: "cancel" },
        {
          label: t.settings.backup.confirmRestore,
          style: "destructive",
          onPress: async () => {
            setBusy("import");
            try {
              await restoreFromBackup(validation.payload!);
              await Promise.all([
                hydrateGoals(),
                hydrateSettings(),
                hydrateHabits(),
                hydrateTodos(),
              ]);
              showAlert(t.settings.backup.restoreSuccessTitle, t.settings.backup.restoreSuccessMessage);
            } catch {
              showAlert(t.settings.backup.restoreErrorTitle, t.settings.backup.restoreErrorMessage);
            } finally {
              setBusy(null);
            }
          },
        },
      ],
    );
  };

  const appVersion = Constants.expoConfig?.version ?? "-";

  return (
    <View key={isDark ? "dark" : "light"} style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.headerTitle}>{t.settings.title}</Text>

        <Text style={styles.sectionTitle}>{t.settings.sections.language}</Text>
        <GlassCard style={styles.card} elevationLevel="level1">
          <View style={styles.languageRow}>
            <LanguageOption
              label={t.settings.language.id}
              active={language === "id"}
              onPress={() => setLanguage("id")}
              styles={styles}
              material3={material3}
            />
            <LanguageOption
              label={t.settings.language.en}
              active={language === "en"}
              onPress={() => setLanguage("en")}
              styles={styles}
              material3={material3}
            />
          </View>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t.settings.sections.notifications}</Text>
        <ReminderCard domain="savings" />
        <ReminderCard domain="planner" />

        <Text style={styles.sectionTitle}>{t.settings.sections.backup}</Text>
        <GlassCard style={styles.card} elevationLevel="level1">
          <Text style={typography.body}>{t.settings.backup.description}</Text>

          <Pressable
            onPress={handleExport}
            disabled={busy !== null}
            style={[styles.primaryButton, busy === "export" && styles.buttonDisabled]}
            accessibilityRole="button"
            accessibilityLabel={t.settings.backup.exportAccessibilityLabel}
            android_ripple={{ color: colors.glassBorder }}
          >
            {busy === "export" ? (
              <ActivityIndicator color={material3.onPrimary} />
            ) : (
              <Text style={styles.primaryButtonText}>{t.settings.backup.exportButton}</Text>
            )}
          </Pressable>

          <Pressable
            onPress={handleImport}
            disabled={busy !== null}
            style={[styles.secondaryButton, busy === "import" && styles.buttonDisabled]}
            accessibilityRole="button"
            accessibilityLabel={t.settings.backup.importAccessibilityLabel}
            android_ripple={{ color: colors.glassBorder }}
          >
            {busy === "import" ? (
              <ActivityIndicator color={material3.primary} />
            ) : (
              <Text style={styles.secondaryButtonText}>{t.settings.backup.importButton}</Text>
            )}
          </Pressable>
        </GlassCard>

        <Text style={styles.sectionTitle}>{t.settings.sections.about}</Text>
        <GlassCard style={styles.card} elevationLevel="level1">
          <Pressable
            onPress={() => Linking.openURL(GITHUB_URL).catch(() => {})}
            style={styles.aboutRow}
            accessibilityRole="link"
            accessibilityLabel={t.settings.about.githubAccessibilityLabel}
            android_ripple={{ color: colors.glassBorder }}
          >
            <View style={styles.aboutRowLabel}>
              <MaterialCommunityIcons name="github" size={20} color={colors.textPrimary} />
              <Text style={typography.body}>{t.settings.about.github}</Text>
            </View>
            <MaterialCommunityIcons
              name="open-in-new"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(SAWERIA_URL).catch(() => {})}
            style={styles.aboutRow}
            accessibilityRole="link"
            accessibilityLabel={t.settings.about.coffeeAccessibilityLabel}
            android_ripple={{ color: colors.glassBorder }}
          >
            <View style={styles.aboutRowLabel}>
              <MaterialCommunityIcons name="coffee" size={20} color={colors.textPrimary} />
              <View>
                <Text style={typography.body}>{t.settings.about.coffee}</Text>
                <Text style={[typography.caption, { color: colors.textSecondary }]}>
                  {t.settings.about.coffeeSubtitle}
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons
              name="open-in-new"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>

          <Pressable
            onPress={() => Linking.openURL(PRIVACY_POLICY).catch(() => {})}
            style={styles.aboutRow}
            accessibilityRole="link"
            accessibilityLabel={t.settings.about.privacyPolicyAccessibilityLabel}
            android_ripple={{ color: colors.glassBorder }}
          >
            <View style={styles.aboutRowLabel}>
              <MaterialCommunityIcons name="license" size={20} color={colors.textPrimary} />
              <Text style={typography.body}>{t.settings.about.privacyPolicy}</Text>
            </View>
            <MaterialCommunityIcons
              name="open-in-new"
              size={16}
              color={colors.textSecondary}
            />
          </Pressable>

          <View style={styles.aboutRow}>
            <Text style={typography.body}>{t.settings.about.appVersion}</Text>
            <Text style={[typography.body, { color: colors.textSecondary }]}>
              {appVersion}
            </Text>
          </View>
        </GlassCard>
      </ScrollView>

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

interface LanguageOptionProps {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  material3: ReturnType<typeof useTheme>["material3"];
}

function LanguageOption({ label, active, onPress, styles, material3 }: LanguageOptionProps) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      style={[
        styles.languageChip,
        active && { backgroundColor: material3.primary, borderColor: material3.primary },
      ]}
    >
      <Text
        style={[styles.languageChipText, active && { color: material3.onPrimary }]}
      >
        {label}
      </Text>
    </Pressable>
  );
}

function createStyles(
  colors: ReturnType<typeof useTheme>["colors"],
  typography: ReturnType<typeof useTheme>["typography"],
  material3: ReturnType<typeof useTheme>["material3"],
  paddingTop: number,
) {
  return StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: colors.background,
    },
    content: {
      paddingTop: paddingTop + spacing.md,
      paddingHorizontal: spacing.lg,
      paddingBottom:
        FLOATING_TAB_BAR_MARGIN + FLOATING_TAB_BAR_HEIGHT + spacing.xl,
    },
    headerTitle: {
      ...typography.display,
      fontSize: 28,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.caption,
      fontWeight: "700",
      textTransform: "uppercase",
      marginTop: spacing.md,
      marginBottom: spacing.sm,
    },
    card: {
      padding: spacing.lg,
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    primaryButton: {
      marginTop: spacing.sm,
      width: "100%",
      backgroundColor: material3.primary,
      borderRadius: m3Shape.full,
      paddingVertical: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    primaryButtonText: {
      ...typography.subtitle,
      textAlign: "center",
      color: material3.onPrimary,
    },
    secondaryButton: {
      width: "100%",
      backgroundColor: material3.secondaryContainer,
      borderRadius: m3Shape.full,
      paddingVertical: spacing.md,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
    secondaryButtonText: {
      ...typography.subtitle,
      textAlign: "center",
      color: material3.onSecondaryContainer,
    },
    buttonDisabled: {
      opacity: 0.7,
    },
    aboutRow: {
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    aboutRowLabel: {
      flexDirection: "row",
      alignItems: "center",
      gap: spacing.sm,
    },
    languageRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    languageChip: {
      flex: 1,
      paddingVertical: spacing.sm,
      borderRadius: m3Shape.full,
      borderWidth: 1.5,
      borderColor: colors.glassBorder,
      alignItems: "center",
      justifyContent: "center",
    },
    languageChipText: {
      ...typography.body,
      fontWeight: "600",
      color: colors.textPrimary,
    },
  });
}
