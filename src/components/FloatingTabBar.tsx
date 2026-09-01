import type { BottomTabBarProps } from "expo-router/js-tabs";
import React from "react";
import { BottomNavigation } from "./navigation/bottom-navigation";
import {
  BOTTOM_NAVIGATION_CONTENT_HEIGHT,
  BOTTOM_NAVIGATION_MARGIN,
} from "./navigation/bottom-navigation-layout";

/**
 * Dulu dispatcher iOS capsule / Android docked bar (lihat ui-registry.md
 * versi lama) — capsule iOS udah dihapus total di Checkpoint 0 (Android-only).
 * Nama file dipertahankan sebagai compatibility entry point. Dispatcher
 * tematik dan routing bersama sekarang dimiliki `BottomNavigation`.
 */
export const FLOATING_TAB_BAR_HEIGHT = BOTTOM_NAVIGATION_CONTENT_HEIGHT;
export const FLOATING_TAB_BAR_MARGIN = BOTTOM_NAVIGATION_MARGIN;

export function FloatingTabBar(props: BottomTabBarProps) {
  return <BottomNavigation {...props} />;
}
