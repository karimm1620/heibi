import { resolveLiquidGlassMaterialColors } from "../../../../modules/expo-liquid-glass/src/liquidGlassMaterialColors";

const colors = {
  glassTintLight: "#F5F2FA",
  surfaceInteractive: "#DDE1FFD6",
};

describe("Liquid optical material colors", () => {
  it("uses a neutral, translucent light navigation material", () => {
    expect(resolveLiquidGlassMaterialColors(colors, false, "navigation")).toEqual({
      fallbackColor: "#F5F2FA",
      tintColor: "#F5F2FA3D",
      edgeColor: "rgba(255,255,255,0.78)",
      lightMaterial: true,
    });
  });

  it("preserves the accepted dark navigation material", () => {
    expect(resolveLiquidGlassMaterialColors(colors, true, "navigation")).toEqual({
      fallbackColor: "#DDE1FFD6",
      tintColor: "#DDE1FFA8",
      edgeColor: "rgba(255,255,255,0.44)",
      lightMaterial: false,
    });
  });

  it("does not silently change the default optical material", () => {
    expect(resolveLiquidGlassMaterialColors(colors, false, "default")).toMatchObject({
      fallbackColor: "#DDE1FFD6",
      tintColor: "#DDE1FF94",
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
