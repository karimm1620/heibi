import { useColorScheme } from 'react-native';
import { useMemo } from 'react';
import { useSettingsStore } from '../store/useSettingsStore';
import { buildSemanticTheme } from './adapters';
import type { SemanticThemeContract } from './contracts';
import { useMaterial3Palette } from './material3/colors';
import type { Material3Scheme } from '@pchmn/expo-material3-theme';

export interface AppTheme extends SemanticThemeContract {
  isDark: boolean;
  material3: Material3Scheme;
}

/**
 * Runtime theme entry point. Both visual languages inherit Android dynamic
 * color and system light/dark, then diverge only through centralized semantic
 * adapters. `material3` remains exposed temporarily for components that have
 * not yet moved to semantic roles; Checkpoint 2 handles that migration.
 */
export function useTheme(): AppTheme {
  const scheme = useColorScheme();
  const isDark = scheme === 'dark';
  const visualTheme = useSettingsStore((state) => state.visualTheme);

  const { scheme: material3Scheme } = useMaterial3Palette(isDark);
  const semanticTheme = useMemo(
    () => buildSemanticTheme(visualTheme, material3Scheme, isDark),
    [visualTheme, material3Scheme, isDark],
  );

  return { ...semanticTheme, isDark, material3: material3Scheme };
}
