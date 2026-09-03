package expo.modules.homewidgets

import expo.modules.homewidgets.widgets.WidgetUpdater
import expo.modules.kotlin.functions.Coroutine
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class HomeWidgetsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HomeWidgets")

    // Satu pintu masuk buat JS: tulis snapshot data terbaru + trigger update
    // semua widget yang lagi kepasang, dalam satu panggilan atomik. Pakai
    // `Coroutine` (bukan lambda suspend biasa) karena `WidgetUpdater.updateAll`
    // sekarang suspend function -- ngikutin API resmi Glance (`updateAll`).
    AsyncFunction("updateWidgets") Coroutine { snapshotJson: String ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context belum siap")

      File(context.filesDir, WidgetUpdater.SNAPSHOT_FILE_NAME).writeText(snapshotJson)
      WidgetUpdater.updateAll(context, snapshotJson)
    }
  }
}
