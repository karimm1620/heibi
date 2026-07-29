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

/** Harus sinkron sama `WIDGET_HABIT_ROW_WINDOW_DAYS` di buildWidgetSnapshot.ts. */
private const val DAYS_PER_ROW = 14

private val CONTAINER_PADDING = 10.dp
private val TITLE_RESERVED_HEIGHT = 22.dp
private val ROW_HEIGHT = 26.dp
private val DOT_SIZE = 8.dp
private val DOT_GAP = 6.dp
private val NAME_WIDTH = 56.dp
private val NAME_GAP = 6.dp
private val STREAK_WIDTH = 32.dp
private val STREAK_GAP = 6.dp
private val CELL_GAP = 2.dp
private val MIN_CELL_SIZE = 4.dp
private val MAX_CELL_SIZE = 18.dp

/**
 * Widget 1 -- konsistensi habit, satu baris per habit (dot warna khas
 * habit itu, nama, strip 14 hari terakhir, current streak).
 *
 * Checkpoint 4f: pindah dari `SizeMode.Responsive` (2 preset ukuran) ke
 * `SizeMode.Exact` -- konten sekarang ngitung ULANG lebar strip sel &
 * jumlah baris berdasarkan ukuran ASLI widget secara terus-menerus, biar
 * bener-bener ngisi ruang yang tersedia pas widget di-resize (sebelumnya
 * kepake cuma sebagian kecil kalau widget lebih lebar dari preset).
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

  val availableHeight = (size.height - CONTAINER_PADDING * 2 - TITLE_RESERVED_HEIGHT)
    .coerceAtLeast(0.dp)
  val maxRows = (availableHeight / ROW_HEIGHT).toInt().coerceAtLeast(1)
  val rows = snapshot.habits.take(maxRows)

  val fixedPartWidth = DOT_SIZE + DOT_GAP + NAME_WIDTH + NAME_GAP + STREAK_GAP + STREAK_WIDTH
  val stripAreaWidth = (size.width - CONTAINER_PADDING * 2 - fixedPartWidth).coerceAtLeast(0.dp)
  val totalGapWidth = CELL_GAP * (DAYS_PER_ROW - 1)
  val cellSize = ((stripAreaWidth - totalGapWidth) / DAYS_PER_ROW).coerceIn(MIN_CELL_SIZE, MAX_CELL_SIZE)

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
      HabitRow(habit, cellSize)
    }
  }
}

@Composable
private fun HabitRow(habit: WidgetHabitRow, cellSize: Dp) {
  val habitColor = ColorProvider(parseHexColor(habit.colorHex))

  Row(
    modifier = GlanceModifier.fillMaxWidth().height(ROW_HEIGHT),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    Box(
      modifier = GlanceModifier
        .width(DOT_SIZE)
        .height(DOT_SIZE)
        .cornerRadius(4.dp)
        .background(habitColor),
    ) {}

    Spacer(modifier = GlanceModifier.width(DOT_GAP))

    Text(
      text = habit.name,
      maxLines = 1,
      style = TextStyle(fontSize = 11.sp, color = ColorTextPrimary),
      modifier = GlanceModifier.width(NAME_WIDTH),
    )

    Spacer(modifier = GlanceModifier.width(NAME_GAP))

    Row {
      for ((index, day) in habit.days.withIndex()) {
        Box(
          modifier = GlanceModifier
            .width(cellSize)
            .height(cellSize)
            .cornerRadius((cellSize.value / 6).dp)
            .background(if (day.done) habitColor else ColorCellEmpty),
        ) {}
        if (index != habit.days.lastIndex) {
          Spacer(modifier = GlanceModifier.width(CELL_GAP))
        }
      }
    }

    Spacer(modifier = GlanceModifier.width(STREAK_GAP))

    Text(
      text = "🔥${habit.currentStreak}",
      style = TextStyle(fontSize = 10.sp, color = ColorTextSecondary),
      modifier = GlanceModifier.width(STREAK_WIDTH),
    )
  }
}
