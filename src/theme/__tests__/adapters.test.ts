import type { Material3Scheme } from "@pchmn/expo-material3-theme";
import { buildSemanticTheme } from "../adapters";

jest.mock("@pchmn/expo-material3-theme", () => ({
  useMaterial3Theme: jest.fn(),
}));

const scheme = {
  primary: "#4455AA",
  onPrimary: "#FFFFFF",
  primaryContainer: "#DDE1FF",
  onPrimaryContainer: "#10164B",
  secondaryContainer: "#E0E1F2",
  onSecondaryContainer: "#191A2C",
  tertiary: "#8A4962",
  onTertiary: "#FFFFFF",
  tertiaryContainer: "#FFD9E5",
  onTertiaryContainer: "#3E001D",
  surface: "#FBF8FF",
  surfaceContainerLowest: "#FFFFFF",
  surfaceContainerLow: "#F5F2FA",
  surfaceContainer: "#EFECF4",
  surfaceContainerHigh: "#E9E6EE",
  surfaceContainerHighest: "#E3E0E8",
  onSurface: "#1B1B20",
  onSurfaceVariant: "#46464F",
  outline: "#777680",
  outlineVariant: "#C7C5D0",
  error: "#BA1A1A",
  onError: "#FFFFFF",
  errorContainer: "#FFDAD6",
  onErrorContainer: "#410002",
  inverseSurface: "#303034",
  inverseOnSurface: "#F3F0F7",
  inversePrimary: "#BAC3FF",
  scrim: "#000000",
} as Material3Scheme;

describe("buildSemanticTheme", () => {
  it("keeps Material 3 as an opaque tonal contract", () => {
    const theme = buildSemanticTheme("material3", scheme, false);

    expect(theme.visualTheme).toBe("material3");
    expect(theme.colors.background).toBe(scheme.surface);
    expect(theme.colors.surface).toBe(scheme.surfaceContainerLowest);
    expect(theme.colors.surfaceInteractive).toBe(scheme.surfaceContainerHighest);
    expect(theme.colors.selected).toBe(scheme.secondaryContainer);
    expect(theme.colors.expressiveContainer).toBe(scheme.tertiaryContainer);
    expect(theme.colors.onDanger).toBe(scheme.onError);
    expect(theme.colors.inverseSurface).toBe(scheme.inverseSurface);
    expect(theme.states).toMatchObject({
      disabledOpacity: 0.38,
      rippleOpacity: 0.12,
      minTouchTarget: 48,
    });
    expect(theme.effects).toMatchObject({
      contentSurface: "opaque-tonal",
      chromeSurface: "opaque-tonal",
      backdropRenderer: "none",
    });
    expect(theme.effects.shadows.medium).not.toBe("none");
    expect(theme.shapes.selected).toMatchObject({
      borderRadius: 16,
      borderTopLeftRadius: 28,
      borderTopRightRadius: 12,
    });
    expect(theme.typography.display.fontWeight).toBe("700");
    expect(theme.typography.section.fontWeight).toBe("700");
    expect(theme.typography.amount.fontVariant).toContain("tabular-nums");
  });

  it("switches centralized Liquid intent without changing content semantics", () => {
    const material = buildSemanticTheme("material3", scheme, true);
    const liquid = buildSemanticTheme("liquid", scheme, true);

    expect(liquid.visualTheme).toBe("liquid");
    expect(liquid.colors.background).toBe(material.colors.background);
    expect(liquid.colors.textPrimary).toBe(material.colors.textPrimary);
    expect(liquid.typography.body).toEqual(material.typography.body);
    expect(liquid.shapes.floating).not.toBe(material.shapes.floating);
    expect(liquid.motion.selectionSpring).not.toEqual(material.motion.selectionSpring);
    expect(liquid.states).toMatchObject({
      pressedOpacity: 0.82,
      rippleOpacity: 0,
      minTouchTarget: 48,
    });
    expect(liquid.effects).toMatchObject({
      contentSurface: "opaque-tonal",
      chromeSurface: "translucent-tonal",
      backdropRenderer: "none",
    });
  });
});
