import { resolveLiquidGlassMaterialColors } from "../../../../modules/expo-liquid-glass/src/liquidGlassMaterialColors";

const colors = {
  glassTintLight: "#F5F2FA",
  surfaceInteractive: "#DDE1FFD6",
};

describe("Liquid optical material colors", () => {
  it("uses a neutral, translucent light navigation material", () => {
    expect(resolveLiquidGlassMaterialColors(colors, false, "navigation")).toEqual({
      fallbackColor: "#F2F4F1",
      tintColor: "#F8FAF775",
      edgeColor: "rgba(255,255,255,0.88)",
      boundaryColor: "rgba(70,76,73,0.20)",
      lightMaterial: true,
    });
  });

  it("uses neutral dark glass without a dynamic primary-container cast", () => {
    expect(resolveLiquidGlassMaterialColors(colors, true, "navigation")).toEqual({
      fallbackColor: "#202225",
      tintColor: "#25282B66",
      edgeColor: "rgba(255,255,255,0.34)",
      boundaryColor: "rgba(255,255,255,0)",
      lightMaterial: false,
    });
  });

  it("isolates navigation tint from wallpaper-derived Material colors", () => {
    const greenDynamicColors = {
      glassTintLight: "#E2F0DB",
      surfaceInteractive: "#244A2ED6",
    };
    expect(
      resolveLiquidGlassMaterialColors(greenDynamicColors, true, "navigation"),
    ).toEqual(resolveLiquidGlassMaterialColors(colors, true, "navigation"));
  });

  it("does not silently change the default optical material", () => {
    expect(resolveLiquidGlassMaterialColors(colors, false, "default")).toMatchObject({
      fallbackColor: "#DDE1FFD6",
      tintColor: "#DDE1FF94",
      boundaryColor: "rgba(255,255,255,0)",
      lightMaterial: false,
    });
  });

  it("never emits the invalid nested-alpha color that caused the charcoal fallback", () => {
    for (const isDark of [false, true]) {
      const resolved = resolveLiquidGlassMaterialColors(colors, isDark, "navigation");
      expect(resolved.tintColor).toMatch(/^#[0-9A-F]{8}$/);
    }
  });
});
