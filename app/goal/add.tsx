import { MaterialCommunityIcons } from "@expo/vector-icons";
import { Stack, useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Image,
  KeyboardAvoidingView,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { AppAlert } from "../../src/components/AppAlert";
import { AppButton } from "../../src/components/AppButton";
import { AppSurface } from "../../src/components/AppSurface";
import { EmojiPicker } from "../../src/components/EmojiPicker";
import { usePressFeedback } from "../../src/components/pressFeedback";
import { useAppAlert } from "../../src/hooks/useAppAlert";
import { useTranslation } from "../../src/hooks/useTranslation";
import { useGoalsStore } from "../../src/store/useGoalsStore";
import { accentByKey, radius, spacing } from "../../src/theme/colors";
import { m3Shape } from "../../src/theme/material3/tokens";
import { useTheme } from "../../src/theme/useTheme";
import { formatThousands, parseThousands } from "../../src/utils/currency";
import {
  deleteGoalImage,
  ImagePermissionDeniedError,
  pickGoalImage,
} from "../../src/utils/imageStorage";

export default function AddGoalScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditMode = !!id;
  const { colors, typography, isDark } = useTheme();
  const { t } = useTranslation();
  const { alertState, showAlert, hideAlert } = useAppAlert();

  const goal = useGoalsStore((state) =>
    id ? state.getGoalById(id) : undefined,
  );
  const addGoal = useGoalsStore((state) => state.addGoal);
  const updateGoal = useGoalsStore((state) => state.updateGoal);

  const [name, setName] = useState("");
  const [targetDisplay, setTargetDisplay] = useState("");
  const [imageUri, setImageUri] = useState<string | undefined>(undefined);
  const [emoji, setEmoji] = useState<string | undefined>("🎯");
  const [pickerBusy, setPickerBusy] = useState(false);
  const imagePressFeedback = usePressFeedback(colors.primary, {
    disabled: pickerBusy,
    radius: radius.lg,
  });
  const removePressFeedback = usePressFeedback(colors.danger, { radius: m3Shape.full });

  const [originalImageUri, setOriginalImageUri] = useState<string | undefined>(undefined);
  const savedSuccessfully = useRef(false);

  // Checkpoint 9: dulu populate form (edit mode) lewat useEffect + setState
  // -- kena react-hooks/set-state-in-effect (nge-trigger cascading render).
  // `goal` baru kebaca async dari SQLite (bisa masih undefined pas mount
  // pertama, baru keisi begitu store selesai hydrate), jadi gak bisa cukup
  // lazy initializer useState biasa. Pola resmi React buat kasus ini:
  // "adjusting state during render" -- setState dipanggil LANGSUNG di body
  // render (bukan di useEffect), dijaga guard biar cuma jalan sekali per
  // goal.id. React bakal langsung re-render sebelum paint, gak ada
  // efek "kedip" state lama, dan gak masuk kategori warning ini lagi
  // (https://react.dev/learn/you-might-not-need-an-effect#adjusting-some-state-when-a-prop-changes).
  const [populatedGoalId, setPopulatedGoalId] = useState<string | undefined>(undefined);
  if (goal && goal.id !== populatedGoalId) {
    setPopulatedGoalId(goal.id);
    setName(goal.name);
    setTargetDisplay(formatThousands(String(goal.targetAmount)));
    setImageUri(goal.imageUri);
    setOriginalImageUri(goal.imageUri);
    setEmoji(goal.emoji ?? "🎯");
  }

  useEffect(() => {
    return () => {
      if (
        !savedSuccessfully.current &&
        imageUri &&
        imageUri !== originalImageUri
      ) {
        deleteGoalImage(imageUri);
      }
    };
  }, [imageUri, originalImageUri]);

  const handlePickImage = async () => {
    setPickerBusy(true);
    try {
      const uri = await pickGoalImage();
      if (uri) {
        if (imageUri && imageUri !== originalImageUri) {
          deleteGoalImage(imageUri);
        }
        setImageUri(uri);
      }
    } catch (error) {
      if (error instanceof ImagePermissionDeniedError) {
        showAlert(t.goalForm.permissionRequiredTitle, t.goalForm.permissionRequiredMessage);
      } else {
        showAlert(t.goalForm.pickImageErrorTitle, t.goalForm.pickImageErrorMessage);
      }
    } finally {
      setPickerBusy(false);
    }
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    const amount = parseThousands(targetDisplay);

    if (!trimmedName) {
      showAlert(t.goalForm.emptyNameTitle, t.goalForm.emptyNameMessage);
      return;
    }
    if (amount <= 0) {
      showAlert(t.goalForm.emptyTargetTitle, t.goalForm.emptyTargetMessage);
      return;
    }

    if (isEditMode && id) {
      await updateGoal(id, {
        name: trimmedName,
        targetAmount: amount,
        imageUri,
        emoji,
      });
    } else {
      await addGoal({ name: trimmedName, targetAmount: amount, imageUri, emoji });
    }
    savedSuccessfully.current = true;
    router.back();
  };

  const styles = useMemo(
    () =>
      StyleSheet.create({
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
        imageRow: {
          flexDirection: "row",
          alignItems: "center",
        },
        imagePicker: {
          width: 88,
          height: 88,
          borderRadius: radius.lg,
          backgroundColor: colors.surfaceMuted,
          borderWidth: 1.5,
          borderColor: colors.glassBorder,
          borderStyle: "dashed",
          alignItems: "center",
          justifyContent: "center",
          gap: 2,
          overflow: "hidden",
        },
        imagePreview: {
          width: "100%",
          height: "100%",
        },
        imagePickerText: {
          ...typography.caption,
          textAlign: "center",
        },
        removeImageBtn: {
          marginLeft: spacing.md,
          minHeight: 48,
          paddingHorizontal: spacing.sm,
          borderRadius: m3Shape.full,
          justifyContent: "center",
          overflow: "hidden",
        },
        removeImageText: {
          ...typography.caption,
          color: accentByKey.rose.deep,
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
        currencyInputWrap: {
          flexDirection: "row",
          alignItems: "center",
          backgroundColor: colors.surface,
          borderRadius: m3Shape.extraSmall,
          borderWidth: 1,
          borderColor: colors.glassBorder,
          paddingHorizontal: spacing.md,
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
        saveButton: {
          marginTop: spacing.xl,
        },
        formSection: {
          padding: spacing.md,
          marginBottom: spacing.md,
        },
        firstLabel: {
          marginTop: 0,
        },
      }),
    [colors, typography],
  );

  return (
    <KeyboardAvoidingView key={isDark ? "dark" : "light"} style={{ flex: 1 }}>
      <Stack.Screen
        options={{
          title: isEditMode ? t.goalForm.editScreenTitle : t.goalForm.screenTitle,
        }}
      />
      <ScrollView
        style={styles.container}
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
      >
        <AppSurface variant="muted" elevation="none" style={styles.formSection}>
          <Text accessibilityRole="header" style={[styles.label, styles.firstLabel]}>
            {t.goalForm.imageLabel}
          </Text>
          <View style={styles.imageRow}>
          <Pressable
            onPress={handlePickImage}
            disabled={pickerBusy}
            style={({ pressed }) => [
              styles.imagePicker,
              { opacity: imagePressFeedback.opacity(pressed) },
            ]}
            accessibilityRole="button"
            accessibilityLabel={t.goalForm.pickImageAccessibilityLabel}
            android_ripple={imagePressFeedback.androidRipple}
          >
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} />
            ) : pickerBusy ? (
              <Text style={styles.imagePickerText}>...</Text>
            ) : (
              <>
                <MaterialCommunityIcons
                  name="camera-outline"
                  size={24}
                  color={colors.textSecondary}
                />
                <Text style={styles.imagePickerText}>{t.goalForm.uploadLabel}</Text>
              </>
            )}
          </Pressable>
          {imageUri ? (
            <Pressable
              onPress={() => setImageUri(undefined)}
              style={({ pressed }) => [
                styles.removeImageBtn,
                { opacity: removePressFeedback.opacity(pressed) },
              ]}
              accessibilityRole="button"
              accessibilityLabel={t.goalForm.removeImageAccessibilityLabel}
              android_ripple={removePressFeedback.androidRipple}
            >
              <Text style={styles.removeImageText}>
                {t.goalForm.removeImageLabel}
              </Text>
            </Pressable>
          ) : null}
          </View>

          {!imageUri && (
            <>
              <Text style={styles.label}>{t.goalForm.emojiLabel}</Text>
              <EmojiPicker selected={emoji} onSelect={setEmoji} />
            </>
          )}
        </AppSurface>

        <AppSurface variant="muted" elevation="none" style={styles.formSection}>
          <Text accessibilityRole="header" style={[styles.label, styles.firstLabel]}>
            {t.goalForm.nameLabel}
          </Text>
          <TextInput
            value={name}
            onChangeText={setName}
            placeholder={t.goalForm.namePlaceholder}
            placeholderTextColor={colors.textSecondary}
            style={styles.input}
            accessibilityLabel={t.goalForm.nameLabel}
            returnKeyType="next"
          />

          <Text style={styles.label}>{t.goalForm.targetLabel}</Text>
          <View style={styles.currencyInputWrap}>
            <Text style={styles.currencyPrefix}>Rp</Text>
            <TextInput
              value={targetDisplay}
              onChangeText={(text) => setTargetDisplay(formatThousands(text))}
              placeholder="0"
              placeholderTextColor={colors.textSecondary}
              keyboardType="number-pad"
              style={styles.currencyInput}
              accessibilityLabel={t.goalForm.targetLabel}
            />
          </View>
        </AppSurface>

        <AppButton
          label={isEditMode ? t.goalForm.saveButtonEdit : t.goalForm.saveButtonCreate}
          size="large"
          onPress={handleSave}
          style={styles.saveButton}
          accessibilityLabel={
            isEditMode ? t.goalForm.saveAccessibilityEdit : t.goalForm.saveAccessibilityCreate
          }
        />
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
