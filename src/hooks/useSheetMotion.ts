import { useEffect, useMemo, useRef, useState } from "react";
import {
  Animated,
  Easing,
  GestureResponderHandlers,
  PanResponder,
} from "react-native";
import { m3Motion } from "../theme/material3/tokens";
import { useReducedMotion } from "./useReducedMotion";

interface UseSheetMotionOptions {
  visible: boolean;
  onDismiss: () => void;
  hiddenTranslateY?: number;
  dismissThreshold?: number;
}

interface UseSheetMotionResult {
  mounted: boolean;
  backdropOpacity: Animated.Value;
  sheetTranslateY: Animated.Value;
  dragHandlers: Partial<GestureResponderHandlers>;
}

const EMPHASIZED_DECELERATE = Easing.bezier(...m3Motion.easing.emphasizedDecelerate);
const EMPHASIZED_ACCELERATE = Easing.bezier(...m3Motion.easing.emphasizedAccelerate);
const STANDARD_DECELERATE = Easing.bezier(...m3Motion.easing.standardDecelerate);
const INSTANT_DURATION = 1; // bukan 0 — RN Animated butuh durasi >0 buat tetep manggil callback .start() dengan benar

/**
 * Animasi masuk/keluar bottom sheet — dipakai bareng oleh `ReminderSheet`
 * dan `goal/[id].tsx` (dua bottom sheet yang ada di app ini), diekstrak ke
 * sini biar logic-nya gak dobel di dua tempat.
 *
 * - Timing + kurva M3 "emphasized" (bukan spring/bounce — large-surface
 *   entrance di M3 pakai duration+curve, bukan overshoot), PLUS drag-to-dismiss
 *   via PanResponder (built-in RN, gak nambah dependency baru).
 * - Reduce Motion (OS setting) -> transisi jadi hampir instan (bukan
 *   di-skip total, karena `onRequestClose`/animasi keluar tetap perlu
 *   trigger `setMounted(false)` lewat callback `.start()`). Drag-to-dismiss
 *   tetap aktif — itu interaksi, bukan animasi dekoratif, cuma "snap back"-nya
 *   yang jadi instan.
 */
export function useSheetMotion({
  visible,
  onDismiss,
  hiddenTranslateY = 400,
  dismissThreshold = 100,
}: UseSheetMotionOptions): UseSheetMotionResult {
  const [mounted, setMounted] = useState(false);
  // Checkpoint 9: useState(() => ...) gantiin useRef(...).current buat
  // Animated.Value (hindari react-hooks/refs -- ini juga otomatis nge-fix
  // warning yang sama di `panResponder` useMemo & return statement di bawah,
  // soalnya keduanya cuma "ketularan" gara-gara dua value ini asalnya dari ref).
  const [backdropOpacity] = useState(() => new Animated.Value(0));
  const [sheetTranslateY] = useState(() => new Animated.Value(hiddenTranslateY));
  const dragStartValue = useRef(0);
  const reducedMotion = useReducedMotion();

  // Checkpoint 9: dulu `setMounted(true)` dipanggil sinkron di awal body
  // useEffect -- kena react-hooks/set-state-in-effect. `visible` boolean
  // sederhana (beda sama UndoSnackbar yang butuh lacak identitas
  // pendingDeletion), jadi cukup guard "visible tapi belum mounted" LANGSUNG
  // di body render -- otomatis cuma jalan sekali per transisi off->on.
  // `setMounted(false)` di useEffect bawah TETAP di dalam callback `.start()`
  // (async, bukan sinkron di body effect) jadi udah lint-clean dari awal.
  if (visible && !mounted) {
    setMounted(true);
  }

  useEffect(() => {
    if (visible) {
      if (reducedMotion) {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: INSTANT_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(sheetTranslateY, {
            toValue: 0,
            duration: INSTANT_DURATION,
            useNativeDriver: true,
          }),
        ]).start();
      } else {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 1,
            duration: m3Motion.duration.short4,
            easing: STANDARD_DECELERATE,
            useNativeDriver: true,
          }),
          Animated.timing(sheetTranslateY, {
            toValue: 0,
            duration: m3Motion.duration.medium4,
            easing: EMPHASIZED_DECELERATE,
            useNativeDriver: true,
          }),
        ]).start();
      }
    } else if (mounted) {
      if (reducedMotion) {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: INSTANT_DURATION,
            useNativeDriver: true,
          }),
          Animated.timing(sheetTranslateY, {
            toValue: hiddenTranslateY,
            duration: INSTANT_DURATION,
            useNativeDriver: true,
          }),
        ]).start(() => setMounted(false));
      } else {
        Animated.parallel([
          Animated.timing(backdropOpacity, {
            toValue: 0,
            duration: m3Motion.duration.short3,
            easing: EMPHASIZED_ACCELERATE,
            useNativeDriver: true,
          }),
          Animated.timing(sheetTranslateY, {
            toValue: hiddenTranslateY,
            duration: m3Motion.duration.short4,
            easing: EMPHASIZED_ACCELERATE,
            useNativeDriver: true,
          }),
        ]).start(() => setMounted(false));
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, reducedMotion]);

  /* eslint-disable react-hooks/refs -- false positive: linter nganggep
     `PanResponder.create({...})` di dalam factory `useMemo` ini "dibaca pas
     render" karena factory-nya emang jalan pas render, tapi `dragStartValue
     .current` di dalem `onPanResponderGrant`/`onPanResponderMove` CUMA
     keeksekusi pas user beneran narik gesture (callback event), gak pernah
     pas render/useMemo itu sendiri jalan. */
  const panResponder = useMemo(
    () =>
      PanResponder.create({
        onStartShouldSetPanResponder: () => true,
        onMoveShouldSetPanResponder: (_, gesture) => Math.abs(gesture.dy) > 4,
        onPanResponderGrant: () => {
          sheetTranslateY.stopAnimation((value) => {
            dragStartValue.current = value;
          });
        },
        onPanResponderMove: (_, gesture) => {
          sheetTranslateY.setValue(Math.max(0, dragStartValue.current + gesture.dy));
        },
        onPanResponderRelease: (_, gesture) => {
          const shouldDismiss = gesture.dy > dismissThreshold || gesture.vy > 1.2;
          if (shouldDismiss) {
            onDismiss();
          } else {
            Animated.timing(sheetTranslateY, {
              toValue: 0,
              duration: reducedMotion ? INSTANT_DURATION : m3Motion.duration.short4,
              easing: reducedMotion ? undefined : EMPHASIZED_DECELERATE,
              useNativeDriver: true,
            }).start();
          }
        },
      }),
    [dismissThreshold, onDismiss, sheetTranslateY, reducedMotion],
  );
  /* eslint-enable react-hooks/refs */

  return {
    mounted,
    backdropOpacity,
    sheetTranslateY,
    dragHandlers: panResponder.panHandlers,
  };
}