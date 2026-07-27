package expo.modules.homewidgets.widgets

import android.appwidget.AppWidgetManager
import android.appwidget.AppWidgetProvider
import android.content.Context
import android.widget.RemoteViews
import expo.modules.homewidgets.R

/**
 * Placeholder -- konten saldo goal + Configuration Activity buat milih
 * goal mana yang ditampilin (per appWidgetId) masuk di checkpoint 4d,
 * sekalian migrasi ke Jetpack Glance. Provider ini cuma buat mastiin
 * widget udah kedaftar & bisa di-update dari native module.
 */
class GoalBalanceWidgetProvider : AppWidgetProvider() {
  override fun onUpdate(
    context: Context,
    appWidgetManager: AppWidgetManager,
    appWidgetIds: IntArray,
  ) {
    for (appWidgetId in appWidgetIds) {
      val views = RemoteViews(context.packageName, R.layout.widget_goal_balance_placeholder)
      appWidgetManager.updateAppWidget(appWidgetId, views)
    }
  }
}
