package expo.modules.homewidgets.widgets

import android.appwidget.AppWidgetManager
import android.content.ComponentName
import android.content.Context
import android.content.Intent

/**
 * Trigger update buat semua widget provider yang lagi kepasang di home
 * screen user. Dipanggil dari [expo.modules.homewidgets.HomeWidgetsModule]
 * abis snapshot data ditulis ulang.
 *
 * Checkpoint 4a -- widget di sini SENGAJA masih pakai RemoteViews klasik
 * (bukan Jetpack Glance/Compose). Alasannya: nambahin Glance berarti nambah
 * Compose Compiler Gradle plugin yang versinya HARUS presisi nempel ke
 * versi Kotlin project (2.0.21 di setup Expo SDK 54 ini) -- itu risiko
 * yang lebih pas digabung sekalian pas widget beneran dibikin (checkpoint
 * 4c/4d), bukan dicampur ke fondasi native module + registrasi provider di
 * checkpoint ini. RemoteViews klasik gak butuh dependency tambahan sama
 * sekali, jadi checkpoint ini bisa diverifikasi end-to-end dulu (module
 * ke-panggil dari JS -> provider ke-update) sebelum nambah kerumitan UI.
 */
object WidgetUpdater {
  const val SNAPSHOT_FILE_NAME = "widget_snapshot.json"

  fun updateAll(context: Context) {
    val manager = AppWidgetManager.getInstance(context)

    updateProvider(context, manager, HeatmapWidgetProvider::class.java)
    updateProvider(context, manager, GoalBalanceWidgetProvider::class.java)
  }

  private fun updateProvider(context: Context, manager: AppWidgetManager, provider: Class<*>) {
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
