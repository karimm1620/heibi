import React, { useMemo } from "react";
import type { LayoutChangeEvent, StyleProp, ViewStyle } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  ReduceMotion,
  useAnimatedReaction,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
} from "react-native-reanimated";
import { scheduleOnRN } from "react-native-worklets";
import type { DragReorderController } from "../hooks/useDragReorder";

const LONG_PRESS_DURATION_MS = 350;

interface DragReorderRowProps {
  itemKey: string;
  index: number;
  itemHeight: number;
  itemCount: number;
  controller: DragReorderController;
  enabled?: boolean;
  style?: StyleProp<ViewStyle>;
  onLayout?: (height: number) => void;
  children: React.ReactNode;
  handle?: React.ReactElement;
}

/**
 * Satu row sortable. Gesture + transform hidup di UI thread:
 * - dragged row mengikuti jari langsung lewat shared value
 * - sibling cuma bergeser satu slot saat target index berubah
 * - React/SQLite baru dipanggil SEKALI setelah drop settle
 */
export function DragReorderRow({
  itemKey,
  index,
  itemHeight,
  itemCount,
  controller,
  enabled = true,
  style,
  onLayout,
  children,
  handle,
}: DragReorderRowProps) {
  const {
    activeIndex,
    targetIndex,
    dragY,
    onDragStart,
    onDragDrop,
    onDragCancel,
  } = controller;
  const displacedY = useSharedValue(0);
  const liftScale = useSharedValue(1);

  useAnimatedReaction(
    () => ({
      activeIndex: activeIndex.get(),
      targetIndex: targetIndex.get(),
    }),
    ({ activeIndex, targetIndex }) => {
      let nextDisplacement = 0;

      if (activeIndex >= 0 && index !== activeIndex) {
        if (activeIndex < targetIndex && index > activeIndex && index <= targetIndex) {
          nextDisplacement = -itemHeight;
        } else if (
          activeIndex > targetIndex &&
          index < activeIndex &&
          index >= targetIndex
        ) {
          nextDisplacement = itemHeight;
        }
      }

      displacedY.set(
        withSpring(nextDisplacement, {
          duration: 260,
          dampingRatio: 0.9,
          reduceMotion: ReduceMotion.System,
        }),
      );
      liftScale.set(
        withSpring(activeIndex === index ? 1.02 : 1, {
          duration: 180,
          dampingRatio: 1,
          reduceMotion: ReduceMotion.System,
        }),
      );
    },
    [index, itemHeight],
  );

  const animatedStyle = useAnimatedStyle(() => {
    const isActive = activeIndex.get() === index;

    return {
      transform: [
        { translateY: isActive ? dragY.get() : displacedY.get() },
        { scale: liftScale.get() },
      ],
      zIndex: isActive ? 100 : 0,
      elevation: isActive ? 8 : 0,
      opacity: isActive ? 0.98 : 1,
    };
  }, [index]);

  const panGesture = useMemo(
    () =>
      Gesture.Pan()
        .enabled(enabled)
        .hitSlop(8)
        .activateAfterLongPress(LONG_PRESS_DURATION_MS)
        .onStart(() => {
          activeIndex.set(index);
          targetIndex.set(index);
          dragY.set(0);
          scheduleOnRN(onDragStart, itemKey);
        })
        .onUpdate((event) => {
          dragY.set(event.translationY);

          const shift = Math.round(event.translationY / itemHeight);
          const nextTarget = Math.min(Math.max(index + shift, 0), itemCount - 1);
          if (nextTarget !== targetIndex.get()) {
            targetIndex.set(nextTarget);
          }
        })
        .onEnd((event) => {
          const finalTarget = targetIndex.get();
          const finalOffset = (finalTarget - index) * itemHeight;

          // Finger-driven interaction: settle pakai spring dan bawa velocity
          // gesture. Commit JS/DB baru dilakukan setelah posisi visual pas di
          // slot tujuan, jadi gak ada snap akibat latency write-through DB.
          dragY.set(
            withSpring(
              finalOffset,
              {
                duration: 300,
                dampingRatio: 0.82,
                velocity: event.velocityY,
                reduceMotion: ReduceMotion.System,
              },
              (finished) => {
                if (finished) {
                  scheduleOnRN(onDragDrop, itemKey, finalTarget);
                } else {
                  activeIndex.set(-1);
                  targetIndex.set(-1);
                  dragY.set(0);
                  scheduleOnRN(onDragCancel);
                }
              },
            ),
          );
        })
        .onFinalize((_event, success) => {
          if (!success && activeIndex.get() === index) {
            activeIndex.set(-1);
            targetIndex.set(-1);
            dragY.set(0);
            scheduleOnRN(onDragCancel);
          }
        }),
    [
      activeIndex,
      dragY,
      enabled,
      index,
      itemCount,
      itemHeight,
      itemKey,
      onDragCancel,
      onDragDrop,
      onDragStart,
      targetIndex,
    ],
  );

  const handleLayout = (event: LayoutChangeEvent) => {
    onLayout?.(event.nativeEvent.layout.height);
  };

  return (
    <Animated.View onLayout={handleLayout} style={[style, animatedStyle]}>
      {children}
      {handle ? <GestureDetector gesture={panGesture}>{handle}</GestureDetector> : null}
    </Animated.View>
  );
}
