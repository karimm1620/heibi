import { resolveAndroidSurfaceDepth } from "../appSurfaceDepth";

describe("resolveAndroidSurfaceDepth", () => {
  it.each([
    [24, "low", 1],
    [27, "medium", 6],
    [27, "high", 12],
    [27, "none", 0],
  ] as const)(
    "uses native elevation on Android API %i for %s depth",
    (androidApiLevel, elevation, expectedElevation) => {
      expect(
        resolveAndroidSurfaceDepth(
          elevation,
          "0 3px 8px rgba(0, 0, 0, 0.16)",
          androidApiLevel,
        ),
      ).toEqual({ elevation: expectedElevation });
    },
  );

  it.each([28, 36])(
    "preserves boxShadow on Android API %i without adding elevation",
    (androidApiLevel) => {
      const boxShadow = "0 3px 8px rgba(0, 0, 0, 0.16)";

      expect(
        resolveAndroidSurfaceDepth("medium", boxShadow, androidApiLevel),
      ).toEqual({ boxShadow });
    },
  );
});
