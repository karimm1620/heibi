import { resolveAndroidSurfaceDepth } from "../appSurfaceDepth";

describe("resolveAndroidSurfaceDepth", () => {
  it.each([
    [24, "low", 1],
    [27, "high", 12],
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

  it.each([24, 27])(
    "uses the native level-3 elevation for FAB depth on Android API %i",
    (androidApiLevel) => {
      expect(
        resolveAndroidSurfaceDepth(
          "medium",
          "0 3px 8px rgba(0, 0, 0, 0.16)",
          androidApiLevel,
        ),
      ).toEqual({ elevation: 6 });
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

  it.each([24, 27, 28, 36])(
    "omits unnecessary depth styles for none on Android API %i",
    (androidApiLevel) => {
      expect(
        resolveAndroidSurfaceDepth("none", "none", androidApiLevel),
      ).toEqual({});
    },
  );
});
