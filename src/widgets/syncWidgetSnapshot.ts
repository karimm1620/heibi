import HomeWidgetsModule from "../../modules/expo-home-widgets";
import { useGoalsStore } from "../store/useGoalsStore";
import { useHabitsStore } from "../store/useHabitsStore";
import { buildWidgetSnapshot } from "./buildWidgetSnapshot";

let syncTimeout: ReturnType<typeof setTimeout> | null = null;

/**
 * Bangun snapshot terbaru dari state Zustand SEKARANG (`getState()`, bukan
 * hook — ini dipanggil dari luar komponen React) & kirim ke native module.
 * Di-debounce dikit biar gak nembak native call berkali-kali kalau
 * beberapa store berubah nyaris bersamaan (mis. deposit yang nulis
 * `transactions` + `goals` sekaligus).
 */
export function syncWidgetSnapshot() {
  if (syncTimeout) clearTimeout(syncTimeout);
  syncTimeout = setTimeout(() => {
    syncTimeout = null;
    try {
      const { goals } = useGoalsStore.getState();
      const { habits, habitLogs } = useHabitsStore.getState();
      const snapshot = buildWidgetSnapshot(goals, habits, habitLogs);

      HomeWidgetsModule.updateWidgets(JSON.stringify(snapshot)).catch((error: unknown) => {
        console.warn("[widgets] Gagal update snapshot widget:", error);
      });
    } catch (error) {
      // Exception SINKRON (mis. gagal bangun snapshot) sebelumnya bisa
      // diam-diam gak ketahuan sama sekali di listener store subscribe.
      console.warn("[widgets] Gagal bangun snapshot widget:", error);
    }
  }, 300);
}

let registered = false;

/**
 * Pasang subscriber ke `useGoalsStore` & `useHabitsStore` SEKALI di
 * bootstrap app (dipanggil dari `app/_layout.tsx`, di luar komponen biar
 * kepasang sebelum `hydrate()` pertama jalan). Otomatis sync ulang widget
 * abis SEMUA mutasi relevan (deposit, withdraw, tambah/edit/hapus goal,
 * toggle/archive/hapus habit, dll) — gak perlu manual panggil satu-satu di
 * tiap action, jadi gak ada risiko kelewatan action baru di masa depan.
 */
export function registerWidgetSync() {
  if (registered) return;
  registered = true;

  useGoalsStore.subscribe((state, prevState) => {
    if (state.goals !== prevState.goals) syncWidgetSnapshot();
  });
  useHabitsStore.subscribe((state, prevState) => {
    if (state.habits !== prevState.habits || state.habitLogs !== prevState.habitLogs) {
      syncWidgetSnapshot();
    }
  });
}
