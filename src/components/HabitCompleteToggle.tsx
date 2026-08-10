import { MaterialCommunityIcons } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";
import React, { useEffect, useRef, useState } from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { CelebrationBurst } from "./CelebrationBurst";
import { useReducedMotion } from "../hooks/useReducedMotion";
import { m3Shape } from "../theme/material3/tokens";
import { useTheme } from "../theme/useTheme";

interface HabitCompleteToggleProps {
  done: boolean;
  onToggle: () => void;
  habitName: string;
}

// Spring-based, bukan bezier -- beda dari m3Motion (yang bezier/duration
// buat transisi standar M3). Ini butuh overshoot fisik ("pop") yang cuma
// natural datang dari spring, jadi didefinisikan terpisah di sini daripada
// dipaksain ke token m3Motion yang emang gak didesain buat ini.
const SPRING_SNAPPY = { damping: 14, stiffness: 260, mass: 0.5 };
const SPRING_BOUNCY = { damping: 9, stiffness: 220, mass: 0.6 };

/**
 * Completion control per-habit di Today screen (checkbox bulat kecil).
 * Reaktif ke TRANSISI prop `done` (bukan ke event press-nya langsung) --
 * biar animasi/haptic/burst tetap benar walau togglenya kejadian dari
 * tempat lain nantinya, bukan cuma dari tap di sini. Skip animasi & haptic
 * di render PERTAMA (`isFirstRender` guard) -- biar buka Today screen yang
 * sebagian habit-nya udah selesai dari kemarin gak animasi/getar semua
 * sekaligus pas app baru dibuka.
 *
 * Reanimated dipakai KHUSUS di komponen ini (dan `CelebrationBurst`) --
 * bukan migrasi arsitektur besar. Drag-reorder (`useDragReorder`) & swipe
 * action (`SwipeableRow`) TETAP pakai PanResponder/Animated API classic
 * seperti sebelumnya, gak disentuh.
 */
export function HabitCompleteToggle({ done, onToggle, habitName }: HabitCompleteToggleProps) {
  const { colors, material3 } = useTheme();
  const reducedMotion = useReducedMotion();

  const checkScale = useSharedValue(done ? 1 : 0);
  const boxScale = useSharedValue(1);
  const isFirstEffect = useRef(true);

  // Burst token di-increment lewat "adjusting state during render" (pola
  // sama kayak UndoSnackbar.tsx / goal/add.tsx) -- react-hooks/set-state-
  // in-effect ngelarang setState SINKRON di body effect. `trackedDone`
  // diinisialisasi SAMA DENGAN `done` saat mount, jadi cuma transisi
  // false->true di render BERIKUTNYA yang men-trigger burst -- render
  // pertama gak pernah kena karena belum ada "transisi" buat dibandingin.
  const [trackedDone, setTrackedDone] = useState(done);
  const [burstToken, setBurstToken] = useState(0);
  if (done !== trackedDone) {
    setTrackedDone(done);
    if (done) {
      setBurstToken((token) => token + 1);
    }
  }

  useEffect(() => {
    if (isFirstEffect.current) {
      isFirstEffect.current = false;
      return;
    }

    if (reducedMotion) {
      checkScale.value = done ? 1 : 0;
      boxScale.value = 1;
    } else if (done) {
      checkScale.value = withSpring(1, SPRING_BOUNCY);
      boxScale.value = withSequence(withSpring(1.12, SPRING_SNAPPY), withSpring(1, SPRING_BOUNCY));
    } else {
      checkScale.value = withTiming(0, { duration: 120 });
    }

    if (done) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => {});
    } else {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
    }
    // `checkScale`/`boxScale` referensi shared-value stabil -- aman di-omit.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [done, reducedMotion]);

  const checkStyle = useAnimatedStyle(() => ({
    transform: [{ scale: checkScale.value }],
    opacity: checkScale.value,
  }));

  const boxStyle = useAnimatedStyle(() => ({
    transform: [{ scale: boxScale.value }],
  }));

  return (
    <View style={styles.wrapper}>
      <Animated.View
        style={[
          styles.checkbox,
          boxStyle,
          {
            backgroundColor: done ? material3.primary : "transparent",
            borderColor: done ? material3.primary : colors.glassBorder,
          },
        ]}
      >
        <Pressable
          onPress={onToggle}
          hitSlop={10}
          accessibilityRole="checkbox"
          accessibilityState={{ checked: done }}
          accessibilityLabel={`Tandai ${habitName} ${done ? "belum selesai" : "sudah selesai"}`}
          style={styles.pressable}
        >
          <Animated.View style={checkStyle}>
            <MaterialCommunityIcons name="check" size={14} color={material3.onPrimary} />
          </Animated.View>
        </Pressable>
      </Animated.View>

      <CelebrationBurst trigger={burstToken} color={material3.primary} reducedMotion={reducedMotion} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    width: 28,
    height: 28,
  },
  checkbox: {
    width: 28,
    height: 28,
    borderRadius: m3Shape.extraSmall,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pressable: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
});
