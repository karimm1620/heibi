export interface ThemeColors {
  background: string;
  surface: string;
  surfaceMuted: string;
  surfaceElevated: string;
  surfaceInteractive: string;
  primary: string;
  onPrimary: string;
  primaryContainer: string;
  onPrimaryContainer: string;
  selected: string;
  onSelected: string;
  expressive: string;
  onExpressive: string;
  expressiveContainer: string;
  onExpressiveContainer: string;
  outline: string;
  divider: string;
  glassTintLight: string;
  glassTintLavender: string;
  glassBorder: string;
  deposit: string;
  withdraw: string;
  textPrimary: string;
  textSecondary: string;
  textInverse: string;
  danger: string;
  onDanger: string;
  dangerContainer: string;
  onDangerContainer: string;
  inverseSurface: string;
  inverseText: string;
  inverseAction: string;
  overlayScrim: string;
}

/**
 * Warna semantik finansial (deposit/withdraw) — SENGAJA TETAP STATIS, gak
 * ikut Material You dynamic color. Alasan: hijau=masuk, pink=keluar harus
 * konsisten dikenali user kapan pun, gak boleh geser cuma karena ganti
 * wallpaper. Lihat ui-registry.md bagian Checkpoint 0 (Android-only cleanup).
 */
export const financialColors = {
  light: { deposit: '#6FBFA6', withdraw: '#EE7FA0' },
  dark: { deposit: '#7FD1B8', withdraw: '#F294B0' },
};

/**
 * Fallback statis KHUSUS buat `ErrorBoundary` — itu class component, gak
 * bisa pakai hook `useMaterial3Theme()` (React hook rule), jadi gak bisa
 * ikut dynamic color. Bukan representasi warna app yang beroperasi
 * sehari-hari, cuma buat fallback screen error yang jarang muncul.
 */
export const errorFallbackColors = {
  light: { background: '#F6F4FB', textPrimary: '#332E4A', textSecondary: '#8B84A0' },
  dark: { background: '#17151F', textPrimary: '#F4F2FA', textSecondary: '#A79FBF' },
};

export type AccentKey = 'mint' | 'peach' | 'lavender' | 'rose' | 'sky';

export const accentByKey: Record<AccentKey, { base: string; deep: string }> = {
  mint: { base: '#BFE8DA', deep: '#6FBFA6' },
  peach: { base: '#FFD9C2', deep: '#F2A374' },
  lavender: { base: '#D9C9F2', deep: '#A985E0' },
  rose: { base: '#FFCBDA', deep: '#EE7FA0' },
  sky: { base: '#C6E3F7', deep: '#6FAEDE' },
};

/** Warna teks yang dipakai di atas chip/icon-wrap ber-background aksen pastel */
export const textOnAccent = '#332E4A';

const accentKeys = Object.keys(accentByKey) as AccentKey[];

/** Pilih AccentKey berdasarkan hash sederhana dari seed (id/nama) — konsisten tiap render */
export function pickAccentKey(seed: string): AccentKey {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return accentKeys[hash % accentKeys.length];
}

/** Lookup warna {base, deep} dari AccentKey yang tersimpan di data Goal */
export function getAccentColors(key: AccentKey): { base: string; deep: string } {
  return accentByKey[key] ?? accentByKey.mint;
}

export const radius = {
  sm: 12,
  md: 18,
  lg: 24,
  xl: 32,
  pill: 999,
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
};

export function withOpacity(hexColor: string, alpha: number): string {
  const clamped = Math.max(0, Math.min(1, alpha));
  const alphaHex = Math.round(clamped * 255)
    .toString(16)
    .padStart(2, '0')
    .toUpperCase();
  return `${hexColor}${alphaHex}`;
}

export const glassShineTint = 'rgba(255,255,255,0.25)';

/**
 * Optical chrome stays deliberately neutral instead of inheriting Material
 * You's wallpaper-derived primary container. Accent still belongs to selected
 * controls; these tones only establish the glass body and cross-window sheet.
 */
export const liquidChromeColors = {
  light: {
    navigationFallback: '#F2F4F1',
    navigationTint: '#F8FAF7',
    navigationEdge: 'rgba(255,255,255,0.88)',
    navigationBoundary: 'rgba(70,76,73,0.20)',
    sheetSurface: '#F5F6F3',
    sheetBorder: 'rgba(76,82,79,0.20)',
  },
  dark: {
    navigationFallback: '#202225',
    navigationTint: '#25282B',
    navigationEdge: 'rgba(255,255,255,0.34)',
    navigationBoundary: 'rgba(255,255,255,0)',
    sheetSurface: '#202225',
    sheetBorder: 'rgba(255,255,255,0.16)',
  },
} as const;
