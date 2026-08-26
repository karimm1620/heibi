export const VISUAL_THEMES = ["material3", "liquid"] as const;

export type VisualTheme = (typeof VISUAL_THEMES)[number];

export const DEFAULT_VISUAL_THEME: VisualTheme = "material3";

export function isVisualTheme(value: unknown): value is VisualTheme {
  return typeof value === "string" && VISUAL_THEMES.includes(value as VisualTheme);
}

/**
 * Settings values are JSON-encoded in SQLite. Older databases have no theme
 * row, while a hand-edited/corrupt backup may contain malformed JSON or a
 * future value this app version does not understand. Every such case keeps
 * the existing Material 3 experience instead of failing app bootstrap.
 */
export function parseStoredVisualTheme(value: string | null | undefined): VisualTheme {
  if (!value) return DEFAULT_VISUAL_THEME;

  try {
    const parsed: unknown = JSON.parse(value);
    return isVisualTheme(parsed) ? parsed : DEFAULT_VISUAL_THEME;
  } catch {
    return DEFAULT_VISUAL_THEME;
  }
}
