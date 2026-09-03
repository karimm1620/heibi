import HomeWidgetsModule from "../../modules/expo-home-widgets";
import { useGoalsStore } from "../store/useGoalsStore";
import { useHabitsStore } from "../store/useHabitsStore";
import { buildWidgetSnapshot } from "./buildWidgetSnapshot";
import { createWidgetSnapshotSyncCoordinator } from "./widgetSnapshotSyncCoordinator";

const widgetSnapshotSync = createWidgetSnapshotSyncCoordinator({
  delayMs: 300,
  buildSnapshot: () => {
    const { goals, transactions } = useGoalsStore.getState();
    const { habits, habitLogs } = useHabitsStore.getState();
    return JSON.stringify(buildWidgetSnapshot(goals, habits, habitLogs, transactions));
  },
  writeSnapshot: (snapshotJson) => HomeWidgetsModule.updateWidgets(snapshotJson),
  onError: (error) => {
    console.warn("[widgets] Gagal sinkronisasi snapshot widget:", error);
  },
});

/**
 * Bangun snapshot terbaru dari state Zustand SEKARANG (`getState()`, bukan
 * hook — ini dipanggil dari luar komponen React) & kirim ke native module.
 * Di-debounce dikit biar gak nembak native call berkali-kali kalau
 * beberapa store berubah nyaris bersamaan (mis. deposit yang nulis
 * `transactions` + `goals` sekaligus).
 */
export function syncWidgetSnapshot() {
  widgetSnapshotSync.request();
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
    if (
      state.goals !== prevState.goals ||
      state.transactions !== prevState.transactions
    ) {
      syncWidgetSnapshot();
    }
  });
  useHabitsStore.subscribe((state, prevState) => {
    if (state.habits !== prevState.habits || state.habitLogs !== prevState.habitLogs) {
      syncWidgetSnapshot();
    }
  });
}
