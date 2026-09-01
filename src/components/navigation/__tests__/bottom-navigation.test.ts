import { TAB_META } from "../../TabMeta";
import {
  bottomNavigationAccessibilityState,
  resolveBottomNavigationVariant,
  resolveLiquidIndicatorMotion,
  resolveLiquidNavigationRefreshKey,
  shouldCommitTabSelection,
} from "../bottom-navigation-contract";
import {
  FAB_SIZE,
  resolveBottomNavigationLayout,
} from "../bottom-navigation-layout";

describe("theme-aware bottom navigation contract", () => {
  it("dispatches Material and Liquid through one explicit theme variant", () => {
    expect(resolveBottomNavigationVariant("material3")).toBe("material");
    expect(resolveBottomNavigationVariant("liquid")).toBe("liquid");
  });

  it("commits only a new, unprevented destination selection", () => {
    expect(shouldCommitTabSelection(false, false)).toBe(true);
    expect(shouldCommitTabSelection(true, false)).toBe(false);
    expect(shouldCommitTabSelection(false, true)).toBe(false);
  });

  it("exposes the selected state used by TalkBack", () => {
    expect(bottomNavigationAccessibilityState(true)).toEqual({ selected: true });
    expect(bottomNavigationAccessibilityState(false)).toEqual({ selected: false });
  });

  it("removes indicator spring motion when reduced motion is enabled", () => {
    expect(resolveLiquidIndicatorMotion(true, true)).toBe("immediate");
    expect(resolveLiquidIndicatorMotion(false, false)).toBe("immediate");
    expect(resolveLiquidIndicatorMotion(false, true)).toBe("spring");
  });

  it("refreshes the Liquid capture for route and system-appearance changes", () => {
    expect(resolveLiquidNavigationRefreshKey(2, false)).toBe(4);
    expect(resolveLiquidNavigationRefreshKey(2, true)).toBe(5);
    expect(resolveLiquidNavigationRefreshKey(3, true)).toBe(7);
  });

  it("derives FAB, snackbar, and screen padding from one safe-area metric", () => {
    const layout = resolveBottomNavigationLayout(24);

    expect(layout).toEqual({
      barHeight: 104,
      contentBottomPadding: 136,
      fabBottomOffset: 112,
      snackbarBottomOffset: 192,
    });
    expect(layout.snackbarBottomOffset - layout.fabBottomOffset).toBe(
      FAB_SIZE + 24,
    );
  });

  it("keeps the dev-only feasibility route out of production tab metadata", () => {
    expect(Object.keys(TAB_META)).toEqual([
      "index",
      "goals",
      "history",
      "settings",
    ]);

  });
});
