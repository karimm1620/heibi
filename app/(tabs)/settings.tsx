import { MaterialCommunityIcons } from "@expo/vector-icons";
import Constants from "expo-constants";
import { File } from "expo-file-system";
import * as DocumentPicker from "expo-document-picker";
import * as Sharing from "expo-sharing";
import React, { useMemo, useState } from "react";
import {
  Linking,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { AppAlert } from "../../src/components/AppAlert";
import { AppButton } from "../../src/components/AppButton";
import { AppListRow } from "../../src/components/AppListRow";
import { AppSurface } from "../../src/components/AppSurface";
import { CookieShape } from "../../src/components/CookieShape";
import {
  FLOATING_TAB_BAR_HEIGHT,
  FLOATING_TAB_BAR_MARGIN,
} from "../../src/components/FloatingTabBar";
import { ReminderCard } from "../../src/components/ReminderCard";
import { WaveShape } from "../../src/components/WaveShape";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import { useHabitsStore } from "../../src/store/useHabitsStore";
import { useSettingsStore } from "../../src/store/useSettingsStore";
import { useTodosStore } from "../../src/store/useTodosStore";
import { spacing, withOpacity } from "../../src/theme/colors";
import { visualThemePreviewShapes } from "../../src/theme/adapters";
import { m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import type { VisualTheme } from "../../src/theme/visualTheme";
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
  const { colors, typography, isDark, material3, visualTheme } = useTheme();
  const { t, interpolate, language } = useTranslation();
  const setLanguage = useSettingsStore((s) => s.setLanguage);
  const setVisualTheme = useSettingsStore((s) => s.setVisualTheme);
  const { alertState, showAlert, hideAlert } = useAppAlert();
  const [busy, setBusy] = useState<"export" | "import" | null>(null);
  const [themeBusy, setThemeBusy] = useState(false);

  const hydrateGoals = useGoalsStore((s) => s.hydrate);
  const hydrateSettings = useSettingsStore((s) => s.hydrate);
  const hydrateHabits = useHabitsStore((s) => s.hydrate);
  const hydrateTodos = useTodosStore((s) => s.hydrate);

  const styles = useMemo(
    () => createStyles(colors, typography, material3, insets.top),
    [colors, typography, material3, insets.top],
  );

  const handleThemeChange = async (nextTheme: VisualTheme) => {
    if (nextTheme === visualTheme || themeBusy) return;

    setThemeBusy(true);
    try {
      await setVisualTheme(nextTheme);
    } catch {
      showAlert(t.settings.theme.changeErrorTitle, t.settings.theme.changeErrorMessage);
    } finally {
      setThemeBusy(false);
    }
  };

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

        <Text style={styles.sectionTitle}>{t.settings.sections.theme}</Text>
        <AppSurface variant="muted" elevation="none" style={styles.card}>
          <Text style={[typography.body, { color: colors.textSecondary }]}>
            {t.settings.theme.description}
          </Text>
          <View style={styles.themeRow}>
            <ThemeOption
              visualTheme="material3"
              title={t.settings.theme.material3Title}
              description={t.settings.theme.material3Description}
              accessibilityLabel={t.settings.theme.material3AccessibilityLabel}
              active={visualTheme === "material3"}
              disabled={themeBusy}
              onPress={() => void handleThemeChange("material3")}
              styles={styles}
              colors={colors}
              material3={material3}
            />
            <ThemeOption
              visualTheme="liquid"
              title={t.settings.theme.liquidTitle}
              description={t.settings.theme.liquidDescription}
              accessibilityLabel={t.settings.theme.liquidAccessibilityLabel}
              active={visualTheme === "liquid"}
              disabled={themeBusy}
              onPress={() => void handleThemeChange("liquid")}
              styles={styles}
              colors={colors}
              material3={material3}
            />
          </View>
        </AppSurface>

        <Text style={styles.sectionTitle}>{t.settings.sections.language}</Text>
        <AppSurface variant="muted" elevation="none" style={styles.card}>
          <View style={styles.languageRow}>
            <LanguageOption
              label={t.settings.language.id}
              active={language === "id"}
              onPress={() => setLanguage("id")}
              styles={styles}
            />
            <LanguageOption
              label={t.settings.language.en}
              active={language === "en"}
              onPress={() => setLanguage("en")}
              styles={styles}
            />
          </View>
        </AppSurface>

        <Text style={styles.sectionTitle}>{t.settings.sections.notifications}</Text>
        <ReminderCard domain="savings" />
        <ReminderCard domain="planner" />

        <Text style={styles.sectionTitle}>{t.settings.sections.backup}</Text>
        <AppSurface variant="muted" elevation="none" style={styles.card}>
          <Text style={typography.body}>{t.settings.backup.description}</Text>

          <AppButton
            label={t.settings.backup.exportButton}
            onPress={handleExport}
            disabled={busy !== null}
            loading={busy === "export"}
            style={styles.backupButton}
            accessibilityLabel={t.settings.backup.exportAccessibilityLabel}
          />

          <AppButton
            label={t.settings.backup.importButton}
            variant="secondary"
            onPress={handleImport}
            disabled={busy !== null}
            loading={busy === "import"}
            style={styles.backupButton}
            accessibilityLabel={t.settings.backup.importAccessibilityLabel}
          />
        </AppSurface>

        <Text style={styles.sectionTitle}>{t.settings.sections.about}</Text>
        <AppSurface variant="muted" elevation="none" style={[styles.card, styles.aboutCard]}>
          <AppListRow
            onPress={() => Linking.openURL(GITHUB_URL).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel={t.settings.about.githubAccessibilityLabel}
            divider
            leading={<MaterialCommunityIcons name="github" size={20} color={colors.textPrimary} />}
            trailing={
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.textSecondary} />
            }
          >
            <Text style={typography.body}>{t.settings.about.github}</Text>
          </AppListRow>

          <AppListRow
            onPress={() => Linking.openURL(SAWERIA_URL).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel={t.settings.about.coffeeAccessibilityLabel}
            divider
            leading={<MaterialCommunityIcons name="coffee" size={20} color={colors.textPrimary} />}
            trailing={
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.textSecondary} />
            }
          >
            <Text style={typography.body}>{t.settings.about.coffee}</Text>
            <Text style={[typography.caption, { color: colors.textSecondary }]}>
              {t.settings.about.coffeeSubtitle}
            </Text>
          </AppListRow>

          <AppListRow
            onPress={() => Linking.openURL(PRIVACY_POLICY).catch(() => {})}
            accessibilityRole="link"
            accessibilityLabel={t.settings.about.privacyPolicyAccessibilityLabel}
            divider
            leading={<MaterialCommunityIcons name="license" size={20} color={colors.textPrimary} />}
            trailing={
              <MaterialCommunityIcons name="open-in-new" size={16} color={colors.textSecondary} />
            }
          >
            <Text style={typography.body}>{t.settings.about.privacyPolicy}</Text>
          </AppListRow>

          <AppListRow
            trailing={
              <Text style={[typography.body, { color: colors.textSecondary }]}>{appVersion}</Text>
            }
          >
            <Text style={typography.body}>{t.settings.about.appVersion}</Text>
          </AppListRow>
        </AppSurface>
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

interface ThemeOptionProps {
  visualTheme: VisualTheme;
  title: string;
  description: string;
  accessibilityLabel: string;
  active: boolean;
  disabled: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
  colors: ReturnType<typeof useTheme>["colors"];
  material3: ReturnType<typeof useTheme>["material3"];
}

function ThemeOption({
  visualTheme,
  title,
  description,
  accessibilityLabel,
  active,
  disabled,
  onPress,
  styles,
  colors,
  material3,
}: ThemeOptionProps) {
  const previewShape = visualThemePreviewShapes[visualTheme];

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="radio"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ selected: active, disabled }}
      android_ripple={{ color: withOpacity(colors.primary, 0.12) }}
      style={({ pressed }) => [
        styles.themeOption,
        {
          backgroundColor: active ? colors.selected : colors.surfaceElevated,
          borderColor: active ? colors.primary : colors.outline,
          borderRadius: previewShape.card,
        },
        pressed && styles.themeOptionPressed,
      ]}
    >
      <View
        accessible={false}
        importantForAccessibility="no-hide-descendants"
        style={[
          styles.themePreview,
          {
            backgroundColor: material3.surfaceContainerHighest,
            borderRadius: previewShape.floating,
          },
        ]}
      >
        {visualTheme === "material3" ? (
          <>
            <WaveShape
              color={material3.secondaryContainer}
              height={18}
              style={styles.materialPreviewWave}
            />
            <CookieShape size={28} color={material3.primary}>
              <View style={[styles.materialPreviewDot, { backgroundColor: material3.onPrimary }]} />
            </CookieShape>
            <View
              style={[
                styles.materialPreviewBar,
                { backgroundColor: material3.secondaryContainer },
              ]}
            />
          </>
        ) : (
          <View
            style={[
              styles.liquidPreviewChrome,
              {
                backgroundColor: withOpacity(material3.surfaceBright, 0.84),
                borderColor: withOpacity(material3.outline, 0.5),
              },
            ]}
          >
            <View style={[styles.liquidPreviewDot, { backgroundColor: material3.onSurfaceVariant }]} />
            <View
              style={[
                styles.liquidPreviewSelection,
                { backgroundColor: withOpacity(material3.primaryContainer, 0.9) },
              ]}
            />
            <View style={[styles.liquidPreviewDot, { backgroundColor: material3.onSurfaceVariant }]} />
          </View>
        )}
      </View>
      <Text style={[styles.themeOptionTitle, active && { color: colors.onSelected }]}>
        {title}
      </Text>
      <Text
        style={[
          styles.themeOptionDescription,
          active && { color: withOpacity(colors.onSelected, 0.76) },
        ]}
      >
        {description}
      </Text>
    </Pressable>
  );
}

interface LanguageOptionProps {
  label: string;
  active: boolean;
  onPress: () => void;
  styles: ReturnType<typeof createStyles>;
}

function LanguageOption({ label, active, onPress, styles }: LanguageOptionProps) {
  const { colors, shapes, states } = useTheme();

  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="radio"
      accessibilityState={{ selected: active }}
      pressRetentionOffset={12}
      android_ripple={{ color: withOpacity(colors.onSelected, states.rippleOpacity) }}
      style={({ pressed }) => [
        styles.languageChip,
        active
          ? {
              ...shapes.selected,
              backgroundColor: colors.selected,
              borderColor: colors.selected,
            }
          : { borderRadius: shapes.control },
        { opacity: pressed ? states.pressedOpacity : 1 },
      ]}
    >
      <Text
        style={[styles.languageChipText, active && { color: colors.onSelected }]}
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
      paddingHorizontal: spacing.md,
      paddingBottom:
        FLOATING_TAB_BAR_MARGIN + FLOATING_TAB_BAR_HEIGHT + spacing.xl,
    },
    headerTitle: {
      ...typography.display,
      marginBottom: spacing.md,
    },
    sectionTitle: {
      ...typography.section,
      marginTop: spacing.lg,
      marginBottom: spacing.sm,
    },
    card: {
      padding: spacing.md,
      gap: spacing.md,
      marginBottom: spacing.md,
    },
    themeRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    themeOption: {
      flex: 1,
      minHeight: 148,
      padding: spacing.sm + spacing.xs,
      borderWidth: 1,
      overflow: "hidden",
    },
    themeOptionPressed: {
      opacity: 0.76,
    },
    themePreview: {
      height: 52,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.sm,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "center",
      gap: spacing.sm,
      overflow: "hidden",
    },
    materialPreviewDot: {
      width: 8,
      height: 8,
      borderRadius: m3Shape.full,
    },
    materialPreviewWave: {
      position: "absolute",
      left: 0,
      right: 0,
      bottom: 0,
    },
    materialPreviewBar: {
      width: 42,
      height: 20,
      borderRadius: m3Shape.small,
    },
    liquidPreviewChrome: {
      width: "100%",
      height: 34,
      paddingHorizontal: spacing.sm,
      borderRadius: m3Shape.full,
      borderWidth: 1,
      flexDirection: "row",
      alignItems: "center",
      justifyContent: "space-between",
    },
    liquidPreviewDot: {
      width: 6,
      height: 6,
      borderRadius: m3Shape.full,
    },
    liquidPreviewSelection: {
      width: 32,
      height: 22,
      borderRadius: m3Shape.full,
    },
    themeOptionTitle: {
      ...typography.subtitle,
      color: colors.textPrimary,
      marginBottom: spacing.xs,
    },
    themeOptionDescription: {
      ...typography.caption,
      color: colors.textSecondary,
    },
    backupButton: {
      marginTop: spacing.sm,
      width: "100%",
    },
    aboutCard: {
      gap: 0,
      paddingVertical: spacing.sm,
    },
    languageRow: {
      flexDirection: "row",
      gap: spacing.sm,
    },
    languageChip: {
      flex: 1,
      minHeight: 48,
      paddingVertical: spacing.sm,
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
