import React, { useCallback, useEffect, useMemo, useState } from "react";
import { LayoutChangeEvent, Pressable, StyleSheet, Text, View } from "react-native";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import Animated, {
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

import { useReducedMotion } from "../hooks/useReducedMotion";
import { useTranslation } from "../hooks/useTranslation";
import { useTheme } from "../theme/useTheme";
import {
  addDays,
  getLocalDateKey,
  MONTHS_BY_LANGUAGE,
  startOfWeekMonday,
  WEEKDAYS_SHORT_BY_LANGUAGE,
} from "../utils/date";

interface WeekCalendarStripProps {
  /** Dipanggil pas tanggal manapun di-tap -- buka `DayHistorySheet`, BUKAN nge-set "selected" permanen. */
  onSelectDate: (dateKey: string) => void;
}

const SWIPE_DISTANCE_RATIO = 0.28;
const SWIPE_VELOCITY_THRESHOLD = 800;
const SLIDE_DURATION = 220;
const SPRING_CANCEL = { damping: 18, stiffness: 260, mass: 0.5 };

/**
 * Strip kalender 1 minggu di atas progress card Today screen. Swipe kiri/
 * kanan pindah minggu -- 3 minggu di-buffer sekaligus (prev/current/next)
 * di satu track, biar transisinya nyambung (bukan "slide lalu ganti" yang
 * keliatan loncat). Label bulan di atas ngikutin hari KAMIS minggu yang
 * lagi tampil (titik tengah Senin-Minggu, representatif kalau minggunya
 * nyebrang bulan).
 *
 * "Hari ini" SELALU ditandain lingkaran isi accent M3, apapun minggu yang
 * lagi ditampilin. Tap tanggal MANAPUN (termasuk yang bukan hari ini) buka
 * `DayHistorySheet` lewat `onSelectDate` -- ini sesaat/gak nge-persist jadi
 * "selected", beda dari penanda "hari ini" yang permanen.
 */
export function WeekCalendarStrip({ onSelectDate }: WeekCalendarStripProps) {
  const { colors } = useTheme();
  const { language } = useTranslation();
  const reducedMotion = useReducedMotion();

  const todayKey = useMemo(() => getLocalDateKey(), []);
  const [anchorWeekStart, setAnchorWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [containerWidth, setContainerWidth] = useState(0);

  const translateX = useSharedValue(0);
  const isAnimating = useSharedValue(false);

  const handleLayout = useCallback((event: LayoutChangeEvent) => {
    const width = event.nativeEvent.layout.width;
    setContainerWidth((prev) => (Math.abs(prev - width) > 0.5 ? width : prev));
  }, []);

  const commitShift = useCallback((direction: 1 | -1) => {
    setAnchorWeekStart((prev) => addDays(prev, 7 * direction));
  }, []);

  // Reset translateX SETELAH React commit `anchorWeekStart` baru (bukan di
  // dalam callback animasi worklet) -- biar di titik snap-nya, konten
  // "current" udah pasti kereflect data minggu baru. Kalau di-reset lebih
  // awal (langsung di worklet callback), sempet ada 1 frame nunjukkin data
  // LAMA di posisi baru sebelum React sempet re-render -- keliatan kayak
  // "loncat balik" sekilas. `translateX`/`isAnimating` shared-value ref
  // stabil, aman dimasukin deps.
  useEffect(() => {
    translateX.value = 0;
    isAnimating.value = false;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [anchorWeekStart]);

  const pan = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-14, 14])
    .onUpdate((event) => {
      if (isAnimating.value || containerWidth === 0) return;
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      if (isAnimating.value || containerWidth === 0) return;

      const passedThreshold =
        Math.abs(event.translationX) > containerWidth * SWIPE_DISTANCE_RATIO ||
        Math.abs(event.velocityX) > SWIPE_VELOCITY_THRESHOLD;

      if (!passedThreshold) {
        translateX.value = reducedMotion ? 0 : withSpring(0, SPRING_CANCEL);
        return;
      }

      const direction: 1 | -1 = event.translationX < 0 ? 1 : -1;

      if (reducedMotion) {
        runOnJS(commitShift)(direction);
        return;
      }

      isAnimating.value = true;
      translateX.value = withTiming(-direction * containerWidth, { duration: SLIDE_DURATION }, (finished) => {
        if (finished) {
          runOnJS(commitShift)(direction);
        }
      });
    });

  const trackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: -containerWidth + translateX.value }],
  }));

  const weeks = useMemo(
    () => ({
      prev: addDays(anchorWeekStart, -7),
      current: anchorWeekStart,
      next: addDays(anchorWeekStart, 7),
    }),
    [anchorWeekStart],
  );

  const headerDate = addDays(anchorWeekStart, 3);
  const monthLabel = `${MONTHS_BY_LANGUAGE[language][headerDate.getMonth()]} ${headerDate.getFullYear()}`;

  return (
    <View>
      <Text style={[styles.monthLabel, { color: colors.textSecondary }]}>{monthLabel}</Text>

      <View style={styles.weekdayRow}>
        {WEEKDAYS_SHORT_BY_LANGUAGE[language].map((label) => (
          <Text key={label} style={[styles.weekdayLabel, { color: colors.textSecondary }]}>
            {label}
          </Text>
        ))}
      </View>

      <View onLayout={handleLayout} style={styles.viewport}>
        {containerWidth > 0 && (
          <GestureDetector gesture={pan}>
            <Animated.View style={[styles.track, { width: containerWidth * 3 }, trackStyle]}>
              <WeekDatesRow width={containerWidth} weekStart={weeks.prev} todayKey={todayKey} onSelectDate={onSelectDate} />
              <WeekDatesRow width={containerWidth} weekStart={weeks.current} todayKey={todayKey} onSelectDate={onSelectDate} />
              <WeekDatesRow width={containerWidth} weekStart={weeks.next} todayKey={todayKey} onSelectDate={onSelectDate} />
            </Animated.View>
          </GestureDetector>
        )}
      </View>
    </View>
  );
}

interface WeekDatesRowProps {
  width: number;
  weekStart: Date;
  todayKey: string;
  onSelectDate: (dateKey: string) => void;
}

function WeekDatesRow({ width, weekStart, todayKey, onSelectDate }: WeekDatesRowProps) {
  const { colors, material3 } = useTheme();
  const { t, interpolate } = useTranslation();
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)), [weekStart]);
  const today = useMemo(() => new Date(), []);

  return (
    <View style={[styles.weekRow, { width }]}>
      {days.map((day) => {
        const dateKey = getLocalDateKey(day);
        const isToday = dateKey === todayKey;
        const isFuture = day.getTime() > today.getTime();

        return (
          <Pressable
            key={dateKey}
            onPress={() => onSelectDate(dateKey)}
            accessibilityRole="button"
            accessibilityLabel={interpolate(t.calendar.dateAccessibilityLabel, { day: day.getDate() })}
            style={styles.dateCell}
            hitSlop={4}
          >
            <View
              style={[
                styles.dateCircle,
                { backgroundColor: isToday ? material3.primary : "transparent" },
              ]}
            >
              <Text
                style={[
                  styles.dateNumber,
                  {
                    color: isToday ? material3.onPrimary : colors.textPrimary,
                    opacity: isFuture && !isToday ? 0.4 : 1,
                  },
                ]}
              >
                {day.getDate()}
              </Text>
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  monthLabel: {
    fontSize: 13,
    fontWeight: "600",
    marginBottom: 8,
  },
  weekdayRow: {
    flexDirection: "row",
  },
  weekdayLabel: {
    flex: 1,
    textAlign: "center",
    fontSize: 12,
    marginBottom: 6,
  },
  viewport: {
    overflow: "hidden",
  },
  track: {
    flexDirection: "row",
  },
  weekRow: {
    flexDirection: "row",
  },
  dateCell: {
    flex: 1,
    alignItems: "center",
  },
  dateCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  dateNumber: {
    fontSize: 14,
    fontWeight: "600",
  },
});
