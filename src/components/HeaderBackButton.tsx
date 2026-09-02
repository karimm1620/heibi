import { MaterialCommunityIcons } from "@expo/vector-icons";
import { router } from "expo-router";
import React from "react";
import { Pressable, StyleSheet } from "react-native";
import { useTranslation } from "../hooks/useTranslation";
import { m3ElevationStyle } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";
import { usePressFeedback } from "./pressFeedback";

/**
 * Tombol back custom buat header `headerTransparent: true` (`goal/[id]`,
 * `habit/[id]`) -- native default cuma icon panah polos ngambang di atas
 * konten, kontrasnya gampang ilang tergantung apa yang ada di belakangnya.
 * Background lingkaran tonal SENGAJA reuse `colors.glassTintLight` (warna
 * netral yang sama kayak `GlassCard`), BUKAN warna accent per-goal/habit --
 * biar konsisten di SEMUA detail screen, gak clash sama accent yang beda-
 * beda tiap goal/habit yang lagi dibuka.
 *
 * `router` diimport sebagai singleton (bukan `useRouter()` hook) karena
 * komponen ini dipasang lewat `headerLeft` di `options` object literal
 * `app/_layout.tsx`, bukan dirender langsung sebagai children -- akses
 * imperatif ini yang dipake expo-router buat kasus kayak gini.
 */
export function HeaderBackButton() {
  const { colors, material3 } = useTheme();
  const pressFeedback = usePressFeedback(material3.onSurface, { radius: 20 });
  const { t } = useTranslation();

  return (
    <Pressable
      onPress={() => router.back()}
      hitSlop={8}
      accessibilityRole="button"
      accessibilityLabel={t.common.back}
      style={({ pressed }) => [
        styles.button,
        m3ElevationStyle("level1"),
        { backgroundColor: colors.glassTintLight, opacity: pressFeedback.opacity(pressed) },
      ]}
      android_ripple={pressFeedback.androidRipple}
    >
      <MaterialCommunityIcons name="arrow-left" size={22} color={colors.textPrimary} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  // overflow:hidden WAJIB di sini (lesson ripple-flash: borderRadius tanpa
  // overflow:hidden bikin ripple Android clip ke bounding-box PERSEGI,
  // bukan ke lingkaran yang dimaksud -- lihat Fab.tsx/Chip.tsx).
  button: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
