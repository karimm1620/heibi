import {
  createMaterial3Theme,
  type Material3Scheme,
  type Material3Theme,
} from "@pchmn/expo-material3-theme";
import { useEffect, useState } from "react";
import { AppState } from "react-native";
import {
  getSystemMaterial3Theme,
  type SystemMaterial3Theme,
} from "../../../modules/expo-dynamic-material3";
import { ThemeColors, withOpacity } from "../colors";

/**
 * Seed warna fallback kalau dynamic color gak tersedia (Android <12, atau
 * native dynamic-color bridge gagal). Ini hanya fallback; Android 12+ harus
 * lebih dulu mencoba palette wallpaper melalui local Expo module Heibi.
 */
export const MATERIAL3_FALLBACK_SEED = "#A985E0";

export type Material3PaletteSource = "system-dynamic" | "fallback";

export interface ResolvedMaterial3Palette {
  theme: Material3Theme;
  source: Material3PaletteSource;
}

/**
 * Gabungkan role inti dynamic color Android dengan role M3 lengkap hasil
 * generator JS. Dengan begitu Heibi tidak lagi bergantung pada native bridge
 * milik @pchmn/expo-material3-theme yang bisa gagal secara silent, tetapi tetap
 * mempertahankan role tambahan seperti surfaceContainer*, error, scrim, dll.
 */
export function resolveMaterial3Palette(
  systemTheme: SystemMaterial3Theme | null,
): ResolvedMaterial3Palette {
  const fallbackTheme = createMaterial3Theme(MATERIAL3_FALLBACK_SEED);

  if (!systemTheme) {
    return { theme: fallbackTheme, source: "fallback" };
  }

  return {
    source: "system-dynamic",
    theme: {
      light: {
        ...fallbackTheme.light,
        ...systemTheme.light,
      } as Material3Scheme,
      dark: { ...fallbackTheme.dark, ...systemTheme.dark } as Material3Scheme,
    },
  };
}

function readMaterial3Palette(): ResolvedMaterial3Palette {
  return resolveMaterial3Palette(getSystemMaterial3Theme());
}

/**
 * Field ThemeColors yang SENGAJA TIDAK di-drive oleh dynamic color.
 * Alasan: deposit/withdraw itu warna semantik finansial (hijau=masuk,
 * pink/merah=keluar) — harus konsisten dikenali user kapan pun, gak boleh
 * ikut geser warna cuma karena user ganti wallpaper. danger & overlayScrim
 * sekarang DIPETAKAN ke role M3 (error, scrim) karena M3 memang punya role
 * resmi buat itu dan tetap kontras-aman lewat algoritma M3.
 */
export function mapMaterial3ToThemeColors(
  scheme: Material3Scheme,
  keep: Pick<ThemeColors, "deposit" | "withdraw">,
  isDark: boolean,
): ThemeColors {
  return {
    background: scheme.surface,
    surface: scheme.surfaceContainerLowest,
    surfaceMuted: scheme.surfaceContainer,
    surfaceElevated: scheme.surfaceContainerLow,
    surfaceInteractive: scheme.surfaceContainerHighest,

    primary: scheme.primary,
    onPrimary: scheme.onPrimary,
    primaryContainer: scheme.primaryContainer,
    onPrimaryContainer: scheme.onPrimaryContainer,
    selected: scheme.secondaryContainer,
    onSelected: scheme.onSecondaryContainer,
    expressive: scheme.tertiary,
    onExpressive: scheme.onTertiary,
    expressiveContainer: scheme.tertiaryContainer,
    onExpressiveContainer: scheme.onTertiaryContainer,
    outline: scheme.outline,
    divider: scheme.outlineVariant,

    glassTintLight: scheme.surfaceContainerLow,
    glassTintLavender: scheme.tertiaryContainer,
    glassBorder: scheme.outlineVariant,

    deposit: keep.deposit,
    withdraw: keep.withdraw,

    textPrimary: scheme.onSurface,
    textSecondary: scheme.onSurfaceVariant,
    textInverse: scheme.onPrimary,

    danger: scheme.error,
    onDanger: scheme.onError,
    dangerContainer: scheme.errorContainer,
    onDangerContainer: scheme.onErrorContainer,
    inverseSurface: scheme.inverseSurface,
    inverseText: scheme.inverseOnSurface,
    inverseAction: scheme.inversePrimary,
    overlayScrim: withOpacity(scheme.scrim, isDark ? 0.6 : 0.35),
  };
}

/** Hook utama Material 3: system palette di API 31+, fallback di bawahnya. */
export function useMaterial3Palette(isDark: boolean) {
  const [resolved, setResolved] = useState(() => readMaterial3Palette());

  useEffect(() => {
    const subscription = AppState.addEventListener("change", (state) => {
      if (state === "active") {
        setResolved(readMaterial3Palette());
      }
    });

    return () => subscription.remove();
  }, []);

  const scheme = isDark ? resolved.theme.dark : resolved.theme.light;
  return { scheme, theme: resolved.theme, source: resolved.source };
}
