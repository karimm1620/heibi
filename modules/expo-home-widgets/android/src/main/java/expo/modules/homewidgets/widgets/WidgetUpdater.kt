package expo.modules.homewidgets.widgets

import android.content.Context
import androidx.glance.appwidget.updateAll

/**
 * Trigger update buat semua widget yang lagi kepasang di home screen user.
 * Dipanggil dari [expo.modules.homewidgets.HomeWidgetsModule] abis snapshot
 * data ditulis ulang. Keempat widget memakai snapshot Glance yang sama, jadi
 * cukup lewat API resmi-nya -- gak perlu broadcast AppWidgetManager manual
 * lagi kayak jaman placeholder RemoteViews (checkpoint 4a).
 */
object WidgetUpdater {
  const val SNAPSHOT_FILE_NAME = "widget_snapshot.json"

  suspend fun updateAll(context: Context) {
    HeatmapWidget().updateAll(context)
    SimpleTrackerWidget().updateAll(context)
    GoalBalanceWidget().updateAll(context)
    ChartWidget().updateAll(context)
  }
}
