import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import * as Haptics from "expo-haptics";
import React, { useEffect, useMemo, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { m3ElevationStyle, m3Motion, m3Shape } from "../theme/material3/tokens";
import { buildM3FullTypeScale } from "../theme/material3/typography";
import { useTheme } from "../theme/useTheme";
import { useTranslation } from "../hooks/useTranslation";
import { TAB_META } from "./TabMeta";

export const MATERIAL_NAV_BAR_HEIGHT = 80;

export function MaterialNavigationBar({ state, navigation }: BottomTabBarProps) {
  const { colors, material3 } = useTheme();
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

  // buildM3FullTypeScale menghitung 15 role sekaligus — di-memo biar gak
  // dihitung ulang tiap render (nav bar ini persistent, re-render tiap
  // pindah tab).
  const typeScale = useMemo(
    () => buildM3FullTypeScale(colors.textPrimary, colors.textSecondary),
    [colors.textPrimary, colors.textSecondary],
  );

  // Checkpoint 6: dulu `useRef(state.routes.map(...)).current` -- selain
  // kena warning `react-hooks/refs` (baca ref pas render), argumen useRef
  // itu sebenarnya kehitung ulang (map() bikin array Animated.Value baru)
  // di SETIAP render, cuma hasil render pertama yang kepake (`.current`),
  // sisanya langsung dibuang -- mubazir. `useState(() => ...)` pakai lazy
  // initializer yang beneran cuma jalan sekali pas mount.
  const [anims] = useState(() =>
    state.routes.map((_, i) => new Animated.Value(state.index === i ? 1 : 0)),
  );
  // State layer press feedback (checkpoint <next>) -- GANTI total dari
  // `android_ripple` bawaan. `android_ripple` sebelumnya diclip ke bounds
  // `styles.tab` (satu kolom PENUH icon+label, gak ada borderRadius) jadi
  // ripple-nya keliatan kotak nutupin label juga -- bukan ngikutin bentuk
  // pill bulat di belakang icon. Solusinya: matiin ripple native-nya sama
  // sekali, ganti Animated.View sendiri yang di-absolute-position PAS di
  // ukuran+bentuk pill (64x32, radius full) -- tap area (`styles.tab`)
  // tetep sekolom penuh biar gampang dipencet, visual feedback-nya doang
  // yang dikecilin. Bonus: opacity di-animate manual (bukan RippleDrawable
  // native), jadi genuinely fade-in halus dari 0, gak ada "flash" opaque
  // instan kayak masalah warna solid mentah yang udah dicatet di komentar
  // `android_ripple` versi lama.
  const [pressAnims] = useState(() => state.routes.map(() => new Animated.Value(0)));

  useEffect(() => {
    state.routes.forEach((_, i) => {
      // Animated.spring (bukan .timing lagi) -- kasih efek "pop" dikit pas
      // tab kepencet (overshoot dikit ngelewatin scale 1 sebelum settle),
      // ngikutin feel Play Store yang lebih snappy dibanding fade linear
      // biasa. bounciness/speed dipilih moderat -- overshoot KERASA tapi
      // gak norak/berlebihan.
      Animated.spring(anims[i], {
        toValue: state.index === i ? 1 : 0,
        bounciness: 6,
        speed: 14,
        useNativeDriver: true,
      }).start();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.index]);

  return (
    <View
      style={[
        styles.bar,
        m3ElevationStyle("level2"),
        {
          backgroundColor: colors.surface,
          height: MATERIAL_NAV_BAR_HEIGHT + insets.bottom,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const meta = TAB_META[route.name] ?? { icon: "help-circle-outline" as const };
        const label = t.tabs[route.name as keyof typeof t.tabs] ?? route.name;
        const iconName = isFocused ? (meta.iconActive ?? meta.icon) : meta.icon;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => {});
            navigation.navigate(route.name);
          }
        };

        const onPressIn = () => {
          Animated.timing(pressAnims[index], {
            toValue: 1,
            duration: m3Motion.duration.short2,
            useNativeDriver: true,
          }).start();
        };

        const onPressOut = () => {
          Animated.timing(pressAnims[index], {
            toValue: 0,
            duration: m3Motion.duration.medium1,
            useNativeDriver: true,
          }).start();
        };

        const pillScale = anims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        });
        const iconScale = anims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.85, 1],
        });
        const stateLayerOpacity = pressAnims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0, 0.12],
        });

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            onPressIn={onPressIn}
            onPressOut={onPressOut}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={label}
            accessibilityState={{ selected: isFocused }}
          >
            <View style={styles.iconRow}>
              <Animated.View
                style={[
                  styles.pill,
                  {
                    backgroundColor: material3.secondaryContainer,
                    opacity: anims[index],
                    transform: [{ scale: pillScale }],
                  },
                ]}
              />
              <Animated.View style={{ transform: [{ scale: iconScale }] }}>
                <MaterialCommunityIcons
                  name={iconName}
                  size={22}
                  color={isFocused ? colors.textPrimary : colors.textSecondary}
                />
              </Animated.View>
              <Animated.View
                pointerEvents="none"
                style={[
                  styles.stateLayer,
                  {
                    backgroundColor: material3.onSurfaceVariant,
                    opacity: stateLayerOpacity,
                  },
                ]}
              />
            </View>
            <Text
              numberOfLines={1}
              style={[
                typeScale.labelMedium,
                {
                  color: isFocused ? colors.textPrimary : colors.textSecondary,
                },
              ]}
            >
              {label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: "row",
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
  },
  tab: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    gap: 4,
    paddingTop: 12,
  },
  iconRow: {
    width: 64,
    height: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  pill: {
    position: "absolute",
    width: 64,
    height: 32,
    borderRadius: m3Shape.full,
  },
  // Ukuran & posisi SAMA PERSIS sama `pill` -- ini yang bikin state layer
  // press-feedback ngikutin bentuk pill (bulat), bukan kotak kolom tab.
  stateLayer: {
    position: "absolute",
    width: 64,
    height: 32,
    borderRadius: m3Shape.full,
  },
});