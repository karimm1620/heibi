package expo.modules.homewidgets.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent
import androidx.glance.appwidget.updateAll

/**
 * Trigger update buat semua widget provider yang lagi kepasang di home
 * screen user. Dipanggil dari [expo.modules.homewidgets.HomeWidgetsModule]
 * abis snapshot data ditulis ulang.
 */
object WidgetUpdater {
  const val SNAPSHOT_FILE_NAME = "widget_snapshot.json"

  suspend fun updateAll(context: Context) {
    // Widget 1 -- Glance (checkpoint 4c), pakai API resmi-nya.
    HeatmapWidget().updateAll(context)

    // Widget 2 -- masih RemoteViews klasik, migrasi ke Glance di
    // checkpoint 4d. Sampai saat itu, trigger lewat broadcast biasa.
    updateClassicProvider(context, GoalBalanceWidgetProvider::class.java)
  }

  private fun updateClassicProvider(context: Context, provider: Class<*>) {
    val manager = AppWidgetManager.getInstance(context)
    val componentName = ComponentName(context, provider)
    val ids = manager.getAppWidgetIds(componentName)
    if (ids.isEmpty()) return

    val intent = Intent(context, provider).apply {
      action = AppWidgetManager.ACTION_APPWIDGET_UPDATE
      putExtra(AppWidgetManager.EXTRA_APPWIDGET_IDS, ids)
    }
    context.sendBroadcast(intent)
  }
}
