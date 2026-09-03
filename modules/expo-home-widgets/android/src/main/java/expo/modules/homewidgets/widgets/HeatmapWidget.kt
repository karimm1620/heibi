package expo.modules.homewidgets.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.Preferences
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
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
import androidx.glance.layout.fillMaxWidth
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.state.GlanceStateDefinition
import androidx.glance.state.PreferencesGlanceStateDefinition
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import expo.modules.homewidgets.R

private val HeatmapBackground = ColorProvider(R.color.widget_background)
private val HeatmapText = ColorProvider(R.color.widget_text_primary)
private val HeatmapMuted = ColorProvider(R.color.widget_text_secondary)
private val HeatmapEmpty = ColorProvider(R.color.widget_heatmap_cell_empty)
private val HeatmapPadding = 14.dp
private const val HEATMAP_DAY_COUNT = 14
private const val HEATMAP_WEEK_COLUMNS = 7

private data class HeatmapLayout(
  val cellSize: Dp,
  val cellGap: Dp,
  val nameWidth: Dp,
  val rowHeight: Dp,
  val maxRows: Int,
  val showStreak: Boolean,
)

private fun resolveHeatmapLayout(width: Dp, height: Dp): HeatmapLayout {
  val rowHeight = if (width < 240.dp) 24.dp else 28.dp
  val maxRows = ((height - 54.dp) / rowHeight).toInt().coerceIn(1, 8)
  return when {
    width < 240.dp -> HeatmapLayout(5.dp, 1.dp, 46.dp, rowHeight, maxRows, false)
    width < 360.dp -> HeatmapLayout(7.dp, 2.dp, 62.dp, rowHeight, maxRows, false)
    else -> HeatmapLayout(9.dp, 2.dp, 82.dp, rowHeight, maxRows, true)
  }
}

/** Redesigned habit heatmap: dense calendar rhythm, no repeated flames or stretched bars. */
class HeatmapWidget : GlanceAppWidget() {
  override val stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition
  override val sizeMode = SizeMode.Exact

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    provideContent {
      val snapshotJson = currentState<Preferences>()[WidgetSnapshotJsonKey]
      HeatmapContent(
        context,
        WidgetSnapshotReader.parse(snapshotJson ?: WidgetSnapshotReader.readJson(context)),
      )
    }
  }
}

@Composable
private fun HeatmapContent(context: Context, snapshot: WidgetSnapshot) {
  val size = LocalSize.current
  val layout = resolveHeatmapLayout(size.width, size.height)
  val rows = snapshot.habits.take(layout.maxRows)

  Column(
    modifier = GlanceModifier.fillMaxSize()
      .background(HeatmapBackground)
      .cornerRadius(22.dp)
      .clickable(actionStartActivity(WidgetDeepLinks.today(context)))
      .padding(HeatmapPadding),
  ) {
    Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
      Text("14 hari", style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold, color = HeatmapText))
      Spacer(GlanceModifier.defaultWeight())
      Text("KONSISTENSI", style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Medium, color = HeatmapMuted))
    }
    Spacer(GlanceModifier.height(8.dp))

    if (rows.isEmpty()) {
      Text("Tambahkan habit untuk mulai melihat ritmemu.", style = TextStyle(fontSize = 12.sp, color = HeatmapMuted))
      return@Column
    }

    rows.forEach { habit -> HeatmapHabitRow(habit, layout) }
  }
}

@Composable
private fun HeatmapHabitRow(habit: WidgetHabitRow, layout: HeatmapLayout) {
  val accent = ColorProvider(parseHexColor(habit.colorHex))
  val capturedDays = habit.days.takeLast(HEATMAP_DAY_COUNT)
  val days: List<WidgetHabitDay?> =
    List(HEATMAP_DAY_COUNT - capturedDays.size) { null } + capturedDays
  Row(modifier = GlanceModifier.fillMaxWidth().height(layout.rowHeight), verticalAlignment = Alignment.CenterVertically) {
    Text(habit.name, maxLines = 1, style = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Medium, color = HeatmapText), modifier = GlanceModifier.width(layout.nameWidth))
    Spacer(GlanceModifier.width(6.dp))
    HeatmapDayGrid(days, layout, accent)
    if (layout.showStreak) {
      Spacer(GlanceModifier.defaultWeight())
      Text("${habit.currentStreak} hari", style = TextStyle(fontSize = 10.sp, color = HeatmapMuted))
    }
  }
}

/**
 * Glance translates each Row into RemoteViews. Keeping each calendar row to
 * seven direct children avoids the launcher child ceiling that previously
 * rendered only five cells from the alternating cell/spacer sequence.
 */
@Composable
private fun HeatmapDayGrid(
  days: List<WidgetHabitDay?>,
  layout: HeatmapLayout,
  accent: ColorProvider,
) {
  Column {
    days.chunked(HEATMAP_WEEK_COLUMNS).forEachIndexed { rowIndex, week ->
      Row {
        week.forEach { day ->
          Box(
            GlanceModifier
              .width(layout.cellSize + layout.cellGap)
              .height(layout.cellSize),
          ) {
            Box(
              GlanceModifier
                .width(layout.cellSize)
                .height(layout.cellSize)
                .cornerRadius(3.dp)
                .background(if (day?.done == true) accent else HeatmapEmpty),
            ) {}
          }
        }
      }
      if (rowIndex == 0) Spacer(GlanceModifier.height(layout.cellGap))
    }
  }
}
