import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { StyleSheet, Text, View } from "react-native";
import { spacing } from "../theme/colors";
import { useTheme } from "../theme/useTheme";
import { AppButton } from "./AppButton";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface EmptyStateProps {
  icon: IconName;
  title: string;
  /** Selalu dipotong ke 1 baris (numberOfLines=1) — tulis singkat dari awal, jangan ngandelin truncate. */
  description: string;
  /** Opsional — cuma render tombol CTA kalau KEDUANYA diisi (ctaLabel + onPressCta). */
  ctaLabel?: string;
  onPressCta?: () => void;
}

/**
 * Checkpoint 6: standar empty state di seluruh app — icon (MaterialCommunityIcons,
 * BUKAN emoji lagi) + title + deskripsi 1 baris + CTA opsional. CTA cuma
 * dipasang di pemanggil kalau ada aksi yang beneran nutup gap (misal "Tambah
 * Goal"), dibiarin kosong kalau aksinya udah keliatan jelas di tempat lain di
 * screen yang sama (contoh: goal detail udah ada tombol "+ Nabung"/"- Tarik"
 * di atas, jadi gak perlu CTA dobel di history kosongnya).
 */
export function EmptyState({
  icon,
  title,
  description,
  ctaLabel,
  onPressCta,
}: EmptyStateProps) {
  const { colors, typography } = useTheme();
  const styles = useMemo(() => createStyles(typography), [typography]);
  const showCta = Boolean(ctaLabel && onPressCta);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={40} color={colors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description} numberOfLines={1}>
        {description}
      </Text>
      {showCta && (
        <AppButton
          label={ctaLabel!}
          onPress={onPressCta!}
          variant="secondary"
          size="compact"
          style={styles.cta}
          accessibilityLabel={ctaLabel}
        />
      )}
    </View>
  );
}

function createStyles(typography: ReturnType<typeof useTheme>["typography"]) {
  return StyleSheet.create({
    container: {
      alignItems: "center",
      justifyContent: "center",
      paddingVertical: spacing.xxl,
      paddingHorizontal: spacing.xl,
      gap: spacing.xs,
    },
    title: {
      ...typography.subtitle,
      textAlign: "center",
      marginTop: spacing.sm,
    },
    description: {
      ...typography.caption,
      textAlign: "center",
    },
    cta: {
      marginTop: spacing.md,
    },
  });
}
