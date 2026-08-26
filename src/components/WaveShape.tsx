import React, { useMemo } from "react";
import { View, type StyleProp, type ViewStyle } from "react-native";
import Svg, { Path } from "react-native-svg";
import { buildWavePath } from "../theme/material3/expressiveShapes";

const VIEWBOX_WIDTH = 100;
const VIEWBOX_HEIGHT = 24;

interface WaveShapeProps {
  color: string;
  height?: number;
  waves?: number;
  style?: StyleProp<ViewStyle>;
}

/** Decorative section/progress rhythm. Never place body text directly on it. */
export function WaveShape({ color, height = 18, waves = 2, style }: WaveShapeProps) {
  const path = useMemo(
    () => buildWavePath(VIEWBOX_WIDTH, VIEWBOX_HEIGHT, waves),
    [waves],
  );

  return (
    <View
      accessible={false}
      importantForAccessibility="no-hide-descendants"
      style={[{ width: "100%", height, overflow: "hidden" }, style]}
    >
      <Svg
        width="100%"
        height="100%"
        viewBox={`0 0 ${VIEWBOX_WIDTH} ${VIEWBOX_HEIGHT}`}
        preserveAspectRatio="none"
        pointerEvents="none"
      >
        <Path d={path} fill={color} />
      </Svg>
    </View>
  );
}
