package expo.modules.homewidgets.widgets

import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.GlanceAppWidgetReceiver

/**
 * Nama class SENGAJA dipertahankan sama kayak checkpoint 4a (RemoteViews)
 * biar entry <receiver> di AndroidManifest.xml gak perlu berubah -- cuma
 * base class & isinya yang migrasi ke Glance.
 */
class HeatmapWidgetProvider : GlanceAppWidgetReceiver() {
  override val glanceAppWidget: GlanceAppWidget = HeatmapWidget()
}
