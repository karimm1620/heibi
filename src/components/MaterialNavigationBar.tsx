import { MaterialCommunityIcons } from "@expo/vector-icons";
import type { BottomTabBarProps } from "expo-router/js-tabs";
import React, { useEffect, useMemo, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { m3ElevationStyle, m3Motion, m3Shape } from "../theme/material3/tokens";
import { buildM3FullTypeScale } from "../theme/material3/typography";
import { useTheme } from "../theme/useTheme";
import { TAB_META } from "./TabMeta";

export const MATERIAL_NAV_BAR_HEIGHT = 80;

export function MaterialNavigationBar({ state, navigation }: BottomTabBarProps) {
  const { colors, material3 } = useTheme();
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

  useEffect(() => {
    state.routes.forEach((_, i) => {
      Animated.timing(anims[i], {
        toValue: state.index === i ? 1 : 0,
        duration: m3Motion.duration.medium2,
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
        const meta = TAB_META[route.name] ?? {
          icon: "help-circle-outline" as const,
          label: route.name,
        };
        const iconName = isFocused ? (meta.iconActive ?? meta.icon) : meta.icon;

        const onPress = () => {
          const event = navigation.emit({
            type: "tabPress",
            target: route.key,
            canPreventDefault: true,
          });
          if (!isFocused && !event.defaultPrevented) {
            navigation.navigate(route.name);
          }
        };

        const pillScale = anims[index].interpolate({
          inputRange: [0, 1],
          outputRange: [0.6, 1],
        });

        return (
          <Pressable
            key={route.key}
            onPress={onPress}
            style={styles.tab}
            accessibilityRole="tab"
            accessibilityLabel={meta.label}
            accessibilityState={{ selected: isFocused }}
            android_ripple={{
              color: material3.onSurfaceVariant,
              // Checkpoint 6: dulu `borderless: true, radius: 32` -- ripple-nya
              // jadi lingkaran penuh (diameter 64) yang gak diclip ke bentuk
              // pill oval 64x32 ATAU ke batas tab, jadi nongol kayak bayangan
              // gelap gak wajar pas transisi (borderless ripple di RN memang
              // sengaja "kabur" dari bounds view, cocok buat icon-button kecil,
              // tapi bukan buat area setinggi tab ini). Indikator "aktif" udah
              // ditangani full sama Animated pill di bawah (warna+scale), jadi
              // ripple bawaan cukup jadi feedback taktil biasa yang diclip ke
              // area tab (borderless: false, default).
              borderless: false,
            }}
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
              <MaterialCommunityIcons
                name={iconName}
                size={22}
                color={isFocused ? colors.textPrimary : colors.textSecondary}
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
              {meta.label}
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
});