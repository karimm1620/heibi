import { interpolate, translations } from "../i18n";
import { useSettingsStore } from "../store/useSettingsStore";

/**
 * `t` diakses lewat PROPERTY OBJECT (`t.settings.title`), bukan string key
 * (`t("settings.title")`) -- typo ke-tangkep tsc + autocomplete jalan.
 * `interpolate` diekspor bareng buat string yang butuh data dinamis, lihat
 * `src/i18n/index.ts`.
 */
export function useTranslation() {
  const language = useSettingsStore((state) => state.language);
  return { t: translations[language], language, interpolate };
}
