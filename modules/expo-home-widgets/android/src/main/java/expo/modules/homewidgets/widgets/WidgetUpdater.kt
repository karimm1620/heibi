package expo.modules.homewidgets.widgets

import android.content.Context
import androidx.glance.appwidget.updateAll

/**
 * Trigger update buat semua widget yang lagi kepasang di home screen user.
 * Dipanggil dari [expo.modules.homewidgets.HomeWidgetsModule] abis snapshot
 * data ditulis ulang. Kedua widget udah Glance (checkpoint 4c & 4d), jadi
 * cukup lewat API resmi-nya -- gak perlu broadcast AppWidgetManager manual
 * lagi kayak jaman placeholder RemoteViews (checkpoint 4a).
 */
object WidgetUpdater {
  const val SNAPSHOT_FILE_NAME = "widget_snapshot.json"

  suspend fun updateAll(context: Context) {
    HeatmapWidget().updateAll(context)
    GoalBalanceWidget().updateAll(context)
  }
}
