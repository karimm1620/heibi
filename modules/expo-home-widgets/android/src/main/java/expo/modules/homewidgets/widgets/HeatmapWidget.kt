package expo.modules.homewidgets.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.Dp
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.LocalSize
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
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
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import expo.modules.homewidgets.R

// Warna tetap (background/teks) lewat resource @color + values-night.
private val ColorBackground = ColorProvider(R.color.widget_background)
private val ColorTextPrimary = ColorProvider(R.color.widget_text_primary)
private val ColorTextSecondary = ColorProvider(R.color.widget_text_secondary)
private val ColorCellEmpty = ColorProvider(R.color.widget_heatmap_cell_empty)

private val CONTAINER_PADDING = 10.dp
private val TITLE_RESERVED_HEIGHT = 22.dp
private val DOT_SIZE = 8.dp
private val STREAK_WIDTH = 32.dp

private data class HeatmapLayout(
  val cellGap: Dp,
  val cellSize: Dp,
  val dotGap: Dp,
  val maxRows: Int,
  val nameGap: Dp,
  val nameWidth: Dp,
  val rowHeight: Dp,
  val showStreak: Boolean,
  val streakGap: Dp,
)

private fun resolveHeatmapLayout(width: Dp, height: Dp): HeatmapLayout {
  val compact = width < 240.dp
  val wide = width >= 360.dp
  val rowHeight = if (compact) 24.dp else 26.dp
  val availableHeight = (height - CONTAINER_PADDING * 2 - TITLE_RESERVED_HEIGHT)
    .coerceAtLeast(0.dp)
  val maxRows = (availableHeight / rowHeight).toInt().coerceIn(1, 8)

  return when {
    compact -> HeatmapLayout(
      cellGap = 1.dp,
      cellSize = 5.dp,
      dotGap = 4.dp,
      maxRows = maxRows,
      nameGap = 4.dp,
      nameWidth = 40.dp,
      rowHeight = rowHeight,
      showStreak = false,
      streakGap = 0.dp,
    )
    wide -> HeatmapLayout(
      cellGap = 2.dp,
      cellSize = 10.dp,
      dotGap = 6.dp,
      maxRows = maxRows,
      nameGap = 8.dp,
      nameWidth = 72.dp,
      rowHeight = rowHeight,
      showStreak = true,
      streakGap = 8.dp,
    )
    else -> HeatmapLayout(
      cellGap = 2.dp,
      cellSize = 6.dp,
      dotGap = 6.dp,
      maxRows = maxRows,
      nameGap = 6.dp,
      nameWidth = 52.dp,
      rowHeight = rowHeight,
      showStreak = true,
      streakGap = 6.dp,
    )
  }
}

/**
 * Widget 1 -- konsistensi habit, satu baris per habit (dot warna khas
 * habit itu, nama, strip 14 hari terakhir, current streak).
 *
 * Fourteen means chronological calendar-day slots, oldest to newest. Exact
 * width classes keep those cells bounded: compact hides the streak, medium
 * fits the full row, and wide grows cells only to 10dp instead of stretching
 * them into bars.
 */
class HeatmapWidget : GlanceAppWidget() {
  override val sizeMode = SizeMode.Exact

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val snapshot = WidgetSnapshotReader.read(context)

    provideContent {
      HeatmapContent(snapshot)
    }
  }
}

@Composable
private fun HeatmapContent(snapshot: WidgetSnapshot) {
  val size = LocalSize.current
  val layout = resolveHeatmapLayout(size.width, size.height)
  val rows = snapshot.habits
    .take(layout.maxRows)
    .map { habit -> habit.copy(days = alignWidgetDays(habit.days)) }

  Column(
    modifier = GlanceModifier
      .fillMaxSize()
      .background(ColorBackground)
      .cornerRadius(16.dp) // catatan: cuma jalan di Android 12+ (API 31+)
      .padding(CONTAINER_PADDING),
    verticalAlignment = Alignment.Top,
  ) {
    Text(
      text = "Konsistensi Habit",
      style = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold, color = ColorTextSecondary),
      modifier = GlanceModifier.padding(bottom = 6.dp),
    )

    if (rows.isEmpty()) {
      Text(
        text = "Belum ada habit aktif",
        style = TextStyle(fontSize = 11.sp, color = ColorTextSecondary),
      )
      return@Column
    }

    for (habit in rows) {
      HabitRow(habit, layout)
    }
  }
}

@Composable
private fun HabitRow(habit: WidgetHabitRow, layout: HeatmapLayout) {
  val habitColor = ColorProvider(parseHexColor(habit.colorHex))

  Row(
    modifier = GlanceModifier.fillMaxWidth().height(layout.rowHeight),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    Box(
      modifier = GlanceModifier
        .width(DOT_SIZE)
        .height(DOT_SIZE)
        .cornerRadius(4.dp)
        .background(habitColor),
    ) {}

    Spacer(modifier = GlanceModifier.width(layout.dotGap))

    Text(
      text = habit.name,
      maxLines = 1,
      style = TextStyle(fontSize = 11.sp, color = ColorTextPrimary),
      modifier = GlanceModifier.width(layout.nameWidth),
    )

    Spacer(modifier = GlanceModifier.width(layout.nameGap))

    Row(verticalAlignment = Alignment.CenterVertically) {
      for ((index, day) in habit.days.withIndex()) {
        Box(
          modifier = GlanceModifier
            .width(layout.cellSize)
            .height(layout.cellSize)
            .cornerRadius(2.dp)
            .background(if (day.done) habitColor else ColorCellEmpty),
        ) {}
        if (index != habit.days.lastIndex) {
          Spacer(modifier = GlanceModifier.width(layout.cellGap))
        }
      }
    }

    if (layout.showStreak) {
      Spacer(modifier = GlanceModifier.defaultWeight())
      Spacer(modifier = GlanceModifier.width(layout.streakGap))
      Text(
        text = "🔥${habit.currentStreak}",
        style = TextStyle(fontSize = 10.sp, color = ColorTextSecondary),
        modifier = GlanceModifier.width(STREAK_WIDTH),
      )
    }
  }
}
