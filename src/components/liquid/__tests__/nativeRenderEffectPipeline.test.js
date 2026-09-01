const fs = require("node:fs");
const path = require("node:path");
const { describe, expect, it } = require("@jest/globals");

const rendererPath = path.join(
  process.cwd(),
  "modules/expo-liquid-glass/android/src/main/java/expo/modules/liquidglass/OriginalLiquidGlassView.kt",
);
const rendererSource = fs.readFileSync(rendererPath, "utf8");

describe("native Liquid RenderEffect pipeline", () => {
  it("never applies RenderEffect to Paint", () => {
    expect(rendererSource).not.toMatch(/\bpaint\.setRenderEffect\s*\(/);
  });

  it("records the bounded material into a reusable RenderNode", () => {
    expect(rendererSource).toContain("RenderNode(\"HeibiLiquidGlass\")");
    expect(rendererSource).toContain("node.beginRecording");
    expect(rendererSource).toContain("node.setRenderEffect");
    expect(rendererSource).toContain("canvas.drawRenderNode(node)");
    expect(rendererSource).toContain("node.discardDisplayList()");
  });
});
