const fs = require("node:fs");
const path = require("node:path");
const { describe, expect, it } = require("@jest/globals");

const componentSource = fs.readFileSync(
  path.join(process.cwd(), "src/components/AppBottomSheet.tsx"),
  "utf8",
);
const dayHistorySource = fs.readFileSync(
  path.join(process.cwd(), "src/components/DayHistorySheet.tsx"),
  "utf8",
);
const goalSource = fs.readFileSync(
  path.join(process.cwd(), "app/goal/[id].tsx"),
  "utf8",
);

describe("production transient-surface source contract", () => {
  it("delegates back, scrim, drag, scroll, and keyboard behavior to the native SDK 57 sheet", () => {
    expect(componentSource).toContain('@expo/ui/community/bottom-sheet');
    expect(componentSource).toContain("enablePanDownToClose");
    expect(componentSource).toContain("onClose={onDismiss}");
    expect(componentSource).toContain("AppBottomSheetScrollView");
    expect(componentSource).not.toMatch(/PanResponder|useSheetMotion|Animated\.timing/);
  });

  it("keeps the native scrim non-interactive to TalkBack and the sheet content modal", () => {
    expect(componentSource).toContain("accessibilityViewIsModal={visible}");
    expect(componentSource).toContain('accessibilityRole="button"');
    expect(componentSource).toContain("states.minTouchTarget");
  });

  it("uses tonal Liquid material rather than unsupported cross-window optical capture", () => {
    expect(componentSource).toContain("LiquidMaterialSurface");
    expect(componentSource).not.toContain("OriginalLiquidGlassSurface");
  });

  it("migrates both incumbent production sheets without a JS gesture loop", () => {
    expect(dayHistorySource).toContain("<AppBottomSheet");
    expect(dayHistorySource).toContain("<AppBottomSheetScrollView");
    expect(goalSource).toContain("<AppBottomSheet");
    expect(dayHistorySource).not.toMatch(/PanResponder|useSheetMotion|<Modal/);
    expect(goalSource).not.toMatch(/PanResponder|useSheetMotion|<Modal/);
  });

  it("emits one light haptic only after a transaction commits", () => {
    expect(goalSource.match(/Haptics\.impactAsync/g)).toHaveLength(2);
    expect(goalSource).toContain("if (!result.ok)");
    expect(goalSource).not.toContain("Haptics.selectionAsync");
  });
});
