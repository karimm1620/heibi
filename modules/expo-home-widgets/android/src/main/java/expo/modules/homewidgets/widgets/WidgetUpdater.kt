package expo.modules.homewidgets.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import androidx.glance.state.PreferencesGlanceStateDefinition

val WidgetSnapshotJsonKey = stringPreferencesKey("widget_snapshot_json")

/**
 * Trigger update buat semua widget yang lagi kepasang di home screen user.
 * Dipanggil dari [expo.modules.homewidgets.HomeWidgetsModule] abis snapshot
 * data ditulis ulang. Keempat widget memakai snapshot Glance yang sama, jadi
 * resolve tiap installed AppWidget ID ke GlanceId resmi sebelum update. Ini
 * menghindari stale instance discovery dan tetap event-driven -- gak ada
 * polling/worker periodik.
 */
object WidgetUpdater {
  const val SNAPSHOT_FILE_NAME = "widget_snapshot.json"

  suspend fun updateAll(context: Context, snapshotJson: String) {
    var firstFailure: Throwable? = null

    suspend fun updateSafely(
      providerClass: Class<*>,
      widget: GlanceAppWidget,
    ) {
      try {
        updateInstalled(context, providerClass, widget, snapshotJson)
      } catch (error: Throwable) {
        if (firstFailure == null) firstFailure = error
      }
    }

    updateSafely(HeatmapWidgetProvider::class.java, HeatmapWidget())
    updateSafely(SimpleTrackerWidgetProvider::class.java, SimpleTrackerWidget())
    updateSafely(GoalBalanceWidgetProvider::class.java, GoalBalanceWidget())
    updateSafely(ChartWidgetProvider::class.java, ChartWidget())

    firstFailure?.let { throw it }
  }

  private suspend fun updateInstalled(
    context: Context,
    providerClass: Class<*>,
    widget: GlanceAppWidget,
    snapshotJson: String,
  ) {
    val appWidgetIds = AppWidgetManager.getInstance(context).getAppWidgetIds(
      ComponentName(context, providerClass),
    )
    val glanceManager = GlanceAppWidgetManager(context)
    appWidgetIds.forEach { appWidgetId ->
      val glanceId = glanceManager.getGlanceIdBy(appWidgetId)
      updateAppWidgetState(
        context,
        PreferencesGlanceStateDefinition,
        glanceId,
      ) { preferences ->
        preferences.toMutablePreferences().apply {
          this[WidgetSnapshotJsonKey] = snapshotJson
        }
      }
      widget.update(context, glanceId)
    }
  }
}
