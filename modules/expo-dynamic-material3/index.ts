import { requireNativeModule } from "expo-modules-core";
import { Platform } from "react-native";

export type SystemMaterial3Scheme = Record<string, string>;

export interface SystemMaterial3Theme {
  light: SystemMaterial3Scheme;
  dark: SystemMaterial3Scheme;
}

interface ExpoDynamicMaterial3NativeModule {
  getSystemTheme(): SystemMaterial3Theme | null;
}

let cachedModule: ExpoDynamicMaterial3NativeModule | null | undefined;
let didWarnUnavailable = false;

function warnUnavailable(error?: unknown) {
  if (didWarnUnavailable) {
    return;
  }

  didWarnUnavailable = true;
  console.warn(
    "[Heibi theme] Android dynamic color is unavailable on an API 31+ device; using the fallback palette.",
    error,
  );
}

function getNativeModule(): ExpoDynamicMaterial3NativeModule | null {
  if (cachedModule !== undefined) {
    return cachedModule;
  }

  try {
    cachedModule = requireNativeModule<ExpoDynamicMaterial3NativeModule>(
      "ExpoDynamicMaterial3",
    );
  } catch (error) {
    cachedModule = null;
    warnUnavailable(error);
  }

  return cachedModule;
}

export function getSystemMaterial3Theme(): SystemMaterial3Theme | null {
  if (Platform.OS !== "android" || Number(Platform.Version) < 31) {
    return null;
  }

  const theme = getNativeModule()?.getSystemTheme() ?? null;
  if (!theme) {
    warnUnavailable();
  }

  return theme;
}
