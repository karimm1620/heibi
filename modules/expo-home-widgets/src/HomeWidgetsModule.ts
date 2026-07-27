import { NativeModule, requireNativeModule } from "expo";

declare class HomeWidgetsModule extends NativeModule {
  /**
   * Nulis `snapshotJson` ke file yang bisa dibaca widget provider, terus
   * trigger update ke semua widget yang lagi kepasang di home screen.
   * Dipanggil abis ada perubahan data relevan (saldo goal, completion
   * habit) -- lihat `src/widgets/updateWidgetSnapshot.ts` (checkpoint 4b)
   * buat pemanggilnya.
   */
  updateWidgets(snapshotJson: string): Promise<void>;
}

// This call loads the native module object from the JSI.
export default requireNativeModule<HomeWidgetsModule>("HomeWidgets");
