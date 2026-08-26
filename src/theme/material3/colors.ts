import { Material3Scheme, useMaterial3Theme } from "@pchmn/expo-material3-theme";
import { ThemeColors, withOpacity } from "../colors";

/**
 * Seed warna fallback kalau dynamic color gak tersedia (Android <12, atau
 * device yang API-nya gagal). SENGAJA dipilih dari `accentByKey.lavender.deep`
 * yang sudah dipakai di app ini — supaya brand identity tetap kerasa "Tabungan-ku"
 * walau device-nya gak support Material You, bukan ungu default Google (#6750A4).
 */
export const MATERIAL3_FALLBACK_SEED = "#A985E0";

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

/** Hook utama buat ambil M3 dynamic color — app ini Android-only, jadi selalu dipakai. */
export function useMaterial3Palette(isDark: boolean) {
  const { theme } = useMaterial3Theme({
    fallbackSourceColor: MATERIAL3_FALLBACK_SEED,
  });
  const scheme = isDark ? theme.dark : theme.light;
  return { scheme, theme };
}
