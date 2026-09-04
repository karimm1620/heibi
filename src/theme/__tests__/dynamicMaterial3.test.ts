import {
  MATERIAL3_FALLBACK_SEED,
  resolveMaterial3Palette,
} from "../material3/colors";

jest.mock("@pchmn/expo-material3-theme", () => ({
  createMaterial3Theme: jest.fn(() => ({
    light: {
      primary: "#FALLBACK_LIGHT_PRIMARY",
      error: "#FALLBACK_LIGHT_ERROR",
      surfaceContainer: "#FALLBACK_LIGHT_SURFACE_CONTAINER",
    },
    dark: {
      primary: "#FALLBACK_DARK_PRIMARY",
      error: "#FALLBACK_DARK_ERROR",
      surfaceContainer: "#FALLBACK_DARK_SURFACE_CONTAINER",
    },
  })),
}));

describe("resolveMaterial3Palette", () => {
  it("uses the fallback generator when no Android system palette is available", () => {
    const resolved = resolveMaterial3Palette(null);

    expect(resolved.source).toBe("fallback");
    expect(resolved.theme.light.primary).toBe(
      "#FALLBACK_LIGHT_PRIMARY",
    );
    expect(resolved.theme.dark.primary).toBe(
      "#FALLBACK_DARK_PRIMARY",
    );

    const { createMaterial3Theme } = jest.requireMock(
      "@pchmn/expo-material3-theme",
    ) as {
      createMaterial3Theme: jest.Mock;
    };

    expect(createMaterial3Theme).toHaveBeenCalledWith(
      MATERIAL3_FALLBACK_SEED,
    );
  });

  it("overlays wallpaper-driven Android roles without losing generated M3 roles", () => {
    const resolved = resolveMaterial3Palette({
      light: {
        primary: "#123456",
        surface: "#F9FAFB",
      },
      dark: {
        primary: "#ABCDEF",
        surface: "#101214",
      },
    });

    expect(resolved.source).toBe("system-dynamic");

    expect(resolved.theme.light.primary).toBe("#123456");
    expect(resolved.theme.light.surface).toBe("#F9FAFB");
    expect(resolved.theme.dark.primary).toBe("#ABCDEF");
    expect(resolved.theme.dark.surface).toBe("#101214");

    expect(resolved.theme.light.error).toBe(
      "#FALLBACK_LIGHT_ERROR",
    );
    expect(resolved.theme.dark.surfaceContainer).toBe(
      "#FALLBACK_DARK_SURFACE_CONTAINER",
    );
  });
});