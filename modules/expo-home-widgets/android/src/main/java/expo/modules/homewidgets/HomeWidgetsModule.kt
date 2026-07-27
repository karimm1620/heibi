package expo.modules.homewidgets

import expo.modules.homewidgets.widgets.WidgetUpdater
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import java.io.File

class HomeWidgetsModule : Module() {
  override fun definition() = ModuleDefinition {
    Name("HomeWidgets")

    // Satu pintu masuk buat JS: tulis snapshot data terbaru + trigger update
    // semua widget yang lagi kepasang, dalam satu panggilan atomik -- biar
    // gak ada state di mana widget ke-trigger update tapi snapshot-nya
    // belum ke-tulis (atau sebaliknya).
    AsyncFunction("updateWidgets") { snapshotJson: String ->
      val context = appContext.reactContext
        ?: throw IllegalStateException("React context belum siap")

      File(context.filesDir, WidgetUpdater.SNAPSHOT_FILE_NAME).writeText(snapshotJson)
      WidgetUpdater.updateAll(context)
    }
  }
}
