import React, { useEffect } from "react";
import { StyleSheet, View } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from "react-native-reanimated";

const PARTICLE_COUNT = 6;
const BURST_DISTANCE = 18;
const BURST_DURATION = 420;

interface CelebrationBurstProps {
  /** Increment buat replay burst-nya. `0` = belum pernah dipicu, gak render apa-apa. */
  trigger: number;
  color: string;
  /** Skip burst sepenuhnya -- menghormati Reduce Motion OS (`useReducedMotion`). */
  reducedMotion?: boolean;
}

/**
 * Burst radial kecil (6 titik) buat completion control PER-HABIT di Today
 * screen -- BEDA dari `CelebrationOverlay` yang cuma muncul sekali pas
 * SEMUA item hari ini kelar. Ini jauh lebih ringan & subtle: gak ada card,
 * gak ada teks, gak ada haptic sendiri (haptic dipegang caller yaitu
 * `HabitCompleteToggle`). Re-fire tiap `trigger` berubah -- tiap `Particle`
 * di-key pakai trigger value, jadi REMOUNT-nya sendiri yang restart
 * animasi, gak perlu reset shared value manual.
 */
export function CelebrationBurst({ trigger, color, reducedMotion }: CelebrationBurstProps) {
  if (trigger === 0 || reducedMotion) return null;

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      {Array.from({ length: PARTICLE_COUNT }).map((_, index) => (
        <Particle key={`${trigger}-${index}`} index={index} color={color} />
      ))}
    </View>
  );
}

function Particle({ index, color }: { index: number; color: string }) {
  const progress = useSharedValue(0);

  useEffect(() => {
    progress.value = withTiming(1, { duration: BURST_DURATION, easing: Easing.out(Easing.cubic) });
    // Jalan sekali per mount -- tiap Particle instance emang baru per burst.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const angle = (index / PARTICLE_COUNT) * Math.PI * 2;

  const style = useAnimatedStyle(() => ({
    opacity: 1 - progress.value,
    transform: [
      { translateX: Math.cos(angle) * BURST_DISTANCE * progress.value },
      { translateY: Math.sin(angle) * BURST_DISTANCE * progress.value },
      { scale: 1 - progress.value * 0.4 },
    ],
  }));

  return <Animated.View style={[styles.particle, style, { backgroundColor: color }]} />;
}

const styles = StyleSheet.create({
  particle: {
    position: "absolute",
    top: "50%",
    left: "50%",
    width: 6,
    height: 6,
    marginTop: -3,
    marginLeft: -3,
    borderRadius: 3,
  },
});
