import { MaterialCommunityIcons } from "@expo/vector-icons";
import React, { useMemo } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { spacing, withOpacity } from "../theme/colors";
import { m3Shape } from "../theme/material3/tokens";
import { buildM3FullTypeScale } from "../theme/material3/typography";
import { useTheme } from "../theme/useTheme";

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
  const { colors, material3, typography } = useTheme();
  const styles = useMemo(() => createStyles(typography), [typography]);
  const ctaLabelStyle = useMemo(
    () => buildM3FullTypeScale(colors.textPrimary, colors.textSecondary).labelLarge,
    [colors.textPrimary, colors.textSecondary],
  );
  const showCta = Boolean(ctaLabel && onPressCta);

  return (
    <View style={styles.container}>
      <MaterialCommunityIcons name={icon} size={40} color={colors.textSecondary} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.description} numberOfLines={1}>
        {description}
      </Text>
      {showCta && (
        <Pressable
          onPress={onPressCta}
          style={[styles.cta, { backgroundColor: material3.secondaryContainer }]}
          accessibilityRole="button"
          accessibilityLabel={ctaLabel}
          android_ripple={{ color: withOpacity(material3.onSecondaryContainer, 0.12) }}
          // Checkpoint <next>: fix flash yang sama kayak MaterialNavigationBar/
          // Fab -- warna "on*Container" itu buat teks, bukan overlay, harus
          // dibungkus withOpacity biar gak nge-flash opaque pas ditekan.
        >
          <Text
            style={[ctaLabelStyle, { color: material3.onSecondaryContainer, textTransform: "none" }]}
            numberOfLines={1}
          >
            {ctaLabel}
          </Text>
        </Pressable>
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
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
      borderRadius: m3Shape.full,
      alignItems: "center",
      justifyContent: "center",
      overflow: "hidden",
    },
  });
}
