const fs = require("node:fs");
const path = require("node:path");
const { describe, expect, it } = require("@jest/globals");

describe("production bottom navigation source contract", () => {
  it("keeps the feasibility route out of production routing", () => {
    const tabsLayout = fs.readFileSync(
      path.join(process.cwd(), "app/(tabs)/_layout.tsx"),
      "utf8",
    );
    expect(tabsLayout).not.toContain("liquid-feasibility");
    expect(tabsLayout).toContain('animation: "none"');
  });

  it("centralizes one selection haptic behind the committed-selection gate", () => {
    const dispatcher = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/navigation/bottom-navigation.tsx",
      ),
      "utf8",
    );

    expect(dispatcher.match(/Haptics\.selectionAsync\(\)/g)).toHaveLength(1);
    expect(dispatcher).toContain("shouldCommitTabSelection");
    expect(dispatcher).not.toContain("ImpactFeedbackStyle");
  });

  it("uses one bounded optical host and no JavaScript frame loop", () => {
    const liquidNavigation = fs.readFileSync(
      path.join(
        process.cwd(),
        "src/components/navigation/liquid-navigation-bar.tsx",
      ),
      "utf8",
    );

    expect(liquidNavigation.match(/<OriginalLiquidGlassSurface\b/g)).toHaveLength(1);
    expect(liquidNavigation).toContain("interactionEnabled={false}");
    expect(liquidNavigation).toContain("refreshKey={refreshKey}");
    expect(liquidNavigation).toContain("BOTTOM_NAVIGATION_INSET_GAP");
    expect(liquidNavigation).not.toMatch(/requestAnimationFrame|setInterval/);
  });
});
