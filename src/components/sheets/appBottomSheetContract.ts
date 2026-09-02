import type { VisualTheme } from "../../theme/visualTheme";

export type AppBottomSheetMaterial = "material-opaque" | "liquid-tonal";

export function resolveAppBottomSheetMaterial(
  visualTheme: VisualTheme,
): AppBottomSheetMaterial {
  return visualTheme === "liquid" ? "liquid-tonal" : "material-opaque";
}

export function resolveAppBottomSheetIndex(visible: boolean): 0 | -1 {
  return visible ? 0 : -1;
}
