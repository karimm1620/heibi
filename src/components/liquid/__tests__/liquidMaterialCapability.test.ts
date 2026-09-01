import {
  liquidMaterialPocCapability,
  originalOpticalLiquidPocCapability,
  resolveOpticalLiquidRendererTier,
} from "../liquidMaterialCapability";

describe("liquidMaterialPocCapability", () => {
  it("keeps the isolated POC compatible with heibi's Android API floor", () => {
    expect(liquidMaterialPocCapability.minimumAndroidApi).toBe(24);
  });

  it("does not claim an optical renderer", () => {
    expect(liquidMaterialPocCapability).toMatchObject({
      renderer: "tonal-fallback",
      capturesBackdrop: false,
      appliesBlur: false,
      appliesRefraction: false,
    });
  });
});

describe("originalOpticalLiquidPocCapability", () => {
  const supportedEnvironment = {
    lowRam: false,
    rendererEnabled: true,
    nativeModuleAvailable: true,
  };

  it("keeps API 24-30 and low-RAM devices on the tonal fallback", () => {
    expect(
      resolveOpticalLiquidRendererTier({
        ...supportedEnvironment,
        apiLevel: 30,
      }),
    ).toBe("tonal");
    expect(
      resolveOpticalLiquidRendererTier({
        ...supportedEnvironment,
        apiLevel: 35,
        lowRam: true,
      }),
    ).toBe("tonal");
  });

  it("selects blur for API 31-32", () => {
    expect(
      resolveOpticalLiquidRendererTier({
        ...supportedEnvironment,
        apiLevel: 31,
      }),
    ).toBe("blur");
  });

  it("selects restrained optical rendering on API 33+", () => {
    expect(
      resolveOpticalLiquidRendererTier({
        ...supportedEnvironment,
        apiLevel: 33,
      }),
    ).toBe("optical");
  });

  it("degrades optical failure to blur and blur failure to tonal", () => {
    expect(
      resolveOpticalLiquidRendererTier({
        ...supportedEnvironment,
        apiLevel: 35,
        opticalFailed: true,
      }),
    ).toBe("blur");
    expect(
      resolveOpticalLiquidRendererTier({
        ...supportedEnvironment,
        apiLevel: 35,
        blurFailed: true,
      }),
    ).toBe("tonal");
  });

  it("records dependency-free navigation-only production adoption", () => {
    expect(originalOpticalLiquidPocCapability).toMatchObject({
      capturesBoundedParent: true,
      redrawsContinuouslyWhileIdle: false,
      addsThirdPartyDependency: false,
      productionAdoption: "navigation-only",
    });
  });
});
