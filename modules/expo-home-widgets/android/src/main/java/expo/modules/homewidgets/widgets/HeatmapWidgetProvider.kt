package expo.modules.homewidgets.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import expo.modules.homewidgets.R

/**
 * Placeholder -- konten heatmap 30 hari beneran (grid + baca
 * [WidgetUpdater.SNAPSHOT_FILE_NAME]) masuk di checkpoint 4c, sekalian
 * migrasi ke Jetpack Glance. Provider ini cuma buat mastiin widget udah
 * kedaftar & bisa di-update dari native module.
 */
class HeatmapWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    for (appWidgetId in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.widget_heatmap_placeholder)
      appWidgetManager.updateAppWidget(appWidgetId, views)
    }
  }
}
