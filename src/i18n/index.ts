import { en } from "./en";
import { id, type TranslationDict } from "./id";

export type Language = "id" | "en";

export const translations: Record<Language, TranslationDict> = { id, en };

export type { TranslationDict };

type InterpolationValue = string | number;

/**
 * Ganti placeholder `{{key}}` di template string sama value dari `params`.
 * Dipake buat string yang butuh data dinamis (jumlah, nama file, jam,
 * dst) yang beda tiap render, bukan cuma teks statis biasa.
 *
 * Contoh: `interpolate(t.settings.backup.confirmMessage, { goals: 2,
 * habits: 3, todos: 1 })`
 */
export function interpolate(template: string, params?: Record<string, InterpolationValue>): string {
  if (!params) return template;
  return template.replace(/\{\{(\w+)\}\}/g, (match, key: string) => {
    const value = params[key];
    return value !== undefined ? String(value) : match;
  });
}
