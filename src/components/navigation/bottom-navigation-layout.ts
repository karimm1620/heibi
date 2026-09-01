import { spacing } from "../../theme/colors";

/** Stable geometry shared by both navigation themes and every bottom overlay. */
export const BOTTOM_NAVIGATION_CONTENT_HEIGHT = 80;
export const BOTTOM_NAVIGATION_MARGIN = 0;
export const BOTTOM_NAVIGATION_INSET_GAP = spacing.sm;
export const BOTTOM_NAVIGATION_OVERLAY_GAP = spacing.sm;
export const BOTTOM_NAVIGATION_SCREEN_GAP = spacing.xl;
export const FAB_SIZE = 56;
export const FAB_SNACKBAR_GAP = spacing.sm;
export const SNACKBAR_EDGE_GAP = spacing.md;

export interface BottomNavigationLayoutMetrics {
  barHeight: number;
  contentBottomPadding: number;
  fabBottomOffset: number;
  snackbarBottomOffset: number;
}

export function resolveBottomNavigationLayout(
  bottomInset: number,
): BottomNavigationLayoutMetrics {
  const safeBottomInset = Math.max(0, bottomInset);
  const barHeight =
    safeBottomInset + BOTTOM_NAVIGATION_MARGIN + BOTTOM_NAVIGATION_CONTENT_HEIGHT;
  const fabBottomOffset = barHeight + BOTTOM_NAVIGATION_OVERLAY_GAP;

  return {
    barHeight,
    contentBottomPadding: barHeight + BOTTOM_NAVIGATION_SCREEN_GAP,
    fabBottomOffset,
    snackbarBottomOffset:
      fabBottomOffset + FAB_SIZE + FAB_SNACKBAR_GAP + SNACKBAR_EDGE_GAP,
  };
}
