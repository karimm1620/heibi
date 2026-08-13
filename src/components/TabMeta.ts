import type { MaterialCommunityIcons } from "@expo/vector-icons";
import type React from "react";

type IconName = React.ComponentProps<typeof MaterialCommunityIcons>["name"];

interface TabMetaEntry {
  icon: IconName;
  /** Dipakai pas tab AKTIF — kalau gak diisi, `icon` dipakai buat dua-duanya (cuma beda warna). */
  iconActive?: IconName;
}

/**
 * Label per-tab DIPINDAH ke kamus i18n (`t.tabs.*`, di-lookup pake
 * `route.name` sebagai key di `MaterialNavigationBar.tsx`) -- ini cuma
 * nyimpen data yang gak berubah per-bahasa (icon).
 */
export const TAB_META: Record<string, TabMetaEntry> = {
  index: { icon: "calendar-check-outline", iconActive: "calendar-check" },
  goals: { icon: "target" },
  history: { icon: "history" },
  settings: { icon: "cog-outline", iconActive: "cog" },
};