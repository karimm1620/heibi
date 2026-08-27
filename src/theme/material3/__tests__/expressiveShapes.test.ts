import { buildCookiePath, buildWavePath } from "../expressiveShapes";

describe("Material expressive shape geometry", () => {
  it("builds a closed rounded cookie path with one curve per vertex", () => {
    const path = buildCookiePath(40, 8);

    expect(path.startsWith("M ")).toBe(true);
    expect(path.endsWith("Z")).toBe(true);
    expect(path.match(/ Q /g)).toHaveLength(16);
    expect(path).not.toContain("NaN");
  });

  it("clamps invalid cookie inputs to finite reusable geometry", () => {
    const path = buildCookiePath(Number.NaN, 99, 5);

    expect(path.endsWith("Z")).toBe(true);
    expect(path.match(/ Q /g)).toHaveLength(24);
    expect(path).not.toContain("NaN");
  });

  it("builds a filled wave with two curves per requested wave", () => {
    const path = buildWavePath(100, 24, 2);

    expect(path.startsWith("M 0 ")).toBe(true);
    expect(path.endsWith("L 100 24 L 0 24 Z")).toBe(true);
    expect(path.match(/C /g)).toHaveLength(4);
    expect(path).not.toContain("NaN");
  });
});
