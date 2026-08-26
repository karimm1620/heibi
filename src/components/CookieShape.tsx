import React, { useMemo, type ReactNode } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { buildCookiePath } from "../theme/material3/expressiveShapes";

interface CookieShapeProps {
  size: number;
  color: string;
  children?: ReactNode;
  lobes?: number;
  style?: StyleProp<ViewStyle>;
}

/** Small expressive focal shape; keep it out of ordinary content containers. */
export function CookieShape({
  size,
  color,
  children,
  lobes = 8,
  style,
}: CookieShapeProps) {
  const path = useMemo(() => buildCookiePath(size, lobes), [lobes, size]);

  return (
    <View
      style={[
        { width: size, height: size, alignItems: "center", justifyContent: "center" },
        style,
      ]}
    >
      <Svg
        width={size}
        height={size}
        viewBox={`0 0 ${size} ${size}`}
        pointerEvents="none"
        style={{ position: "absolute" }}
      >
        <Path d={path} fill={color} />
      </Svg>
      {children}
    </View>
  );
}
