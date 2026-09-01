import {
  resolveAppBottomSheetIndex,
  resolveAppBottomSheetMaterial,
} from "../appBottomSheetContract";

describe("shared bottom-sheet contract", () => {
  it("dispatches Material to an opaque semantic surface", () => {
    expect(resolveAppBottomSheetMaterial("material3")).toBe("material-opaque");
  });

  it("dispatches Liquid to the safe tonal material for a separate dialog window", () => {
    expect(resolveAppBottomSheetMaterial("liquid")).toBe("liquid-tonal");
  });

  it("maps controlled visibility to the native sheet index", () => {
    expect(resolveAppBottomSheetIndex(true)).toBe(0);
    expect(resolveAppBottomSheetIndex(false)).toBe(-1);
  });
});
