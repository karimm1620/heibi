package expo.modules.homewidgets.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalSize
import androidx.glance.action.clickable
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.action.actionStartActivity
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import expo.modules.homewidgets.R

class SimpleTrackerWidget : GlanceAppWidget() {
  override val sizeMode = SizeMode.Exact

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val snapshot = WidgetSnapshotReader.read(context)
    provideContent { SimpleTrackerContent(context, snapshot) }
  }
}

@Composable
private fun SimpleTrackerContent(context: Context, snapshot: WidgetSnapshot) {
  val due = snapshot.habits.filter { it.dueToday }
  val completed = due.count { it.days.lastOrNull()?.done == true }
  val percentage = if (due.isEmpty()) 0 else ((completed.toFloat() / due.size) * 100).toInt()
  val compact = LocalSize.current.width < 220.dp
  val accent = ColorProvider(R.color.widget_accent)

  Row(
    modifier = GlanceModifier.fillMaxSize()
      .background(ColorProvider(R.color.widget_background))
      .cornerRadius(22.dp)
      .clickable(actionStartActivity(WidgetDeepLinks.today(context)))
      .padding(if (compact) 12.dp else 16.dp),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    Column(modifier = GlanceModifier.defaultWeight()) {
      Text("HARI INI", style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold, color = ColorProvider(R.color.widget_text_secondary)))
      Text("$percentage%", style = TextStyle(fontSize = if (compact) 30.sp else 38.sp, fontWeight = FontWeight.Bold, color = ColorProvider(R.color.widget_text_primary)))
      Text(
        if (due.isEmpty()) "Belum ada habit terjadwal" else "$completed dari ${due.size} habit selesai",
        maxLines = 2,
        style = TextStyle(fontSize = 11.sp, color = ColorProvider(R.color.widget_text_secondary)),
      )
    }
    Spacer(GlanceModifier.width(12.dp))
    Column(horizontalAlignment = Alignment.CenterHorizontally) {
      Box(GlanceModifier.width(if (compact) 52.dp else 64.dp).height(if (compact) 52.dp else 64.dp).cornerRadius(32.dp).background(accent)) {
        Text("✓", style = TextStyle(fontSize = if (compact) 26.sp else 32.sp, fontWeight = FontWeight.Bold, color = ColorProvider(R.color.widget_on_accent)), modifier = GlanceModifier.padding(if (compact) 12.dp else 15.dp))
      }
    }
  }
}
