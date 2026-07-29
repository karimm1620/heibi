package expo.modules.homewidgets.widgets

import android.content.Context
import androidx.compose.runtime.Composable
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
private val ROW_HEIGHT = 26.dp
private val CELL_HEIGHT = 14.dp
private val DOT_SIZE = 8.dp
private val DOT_GAP = 6.dp
private val NAME_WIDTH = 56.dp
private val NAME_GAP = 6.dp
private val STREAK_WIDTH = 32.dp
private val STREAK_GAP = 6.dp
private val CELL_GAP = 2.dp

/**
 * Widget 1 -- konsistensi habit, satu baris per habit (dot warna khas
 * habit itu, nama, strip 14 hari terakhir, current streak).
 *
 * Checkpoint 4g: strip sel sekarang pake `GlanceModifier.defaultWeight()`
 * (mekanisme weight LinearLayout Android asli) buat ngisi SISA lebar row,
 * bukan hitungan manual dari `LocalSize` (checkpoint 4f) yang ternyata
 * masih nyisain banyak ruang kosong -- weight lebih robust karena
 * di-resolve sama layout engine Android langsung pas render, gak gantung
 * ke akurasi angka yang Glance laporin balik ke composable.
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
  // Row count masih dari LocalSize (soal tinggi, bukan lebar) -- gak ada
  // laporan masalah di sisi ini, cuma lebar yang kemarin gak ngisi penuh.
  val availableHeight = (size.height - CONTAINER_PADDING * 2 - TITLE_RESERVED_HEIGHT)
    .coerceAtLeast(0.dp)
  val maxRows = (availableHeight / ROW_HEIGHT).toInt().coerceAtLeast(1)
  val rows = snapshot.habits.take(maxRows)

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
      HabitRow(habit)
    }
  }
}

@Composable
private fun HabitRow(habit: WidgetHabitRow) {
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

    // Strip ini yang NYERAP SISA lebar row lewat defaultWeight() -- bukan
    // hitungan dp manual lagi. Dot/nama/streak di kanan-kiri tetap ukuran
    // tetap, strip ini yang otomatis melar/menyempit ngisi sisanya.
    Row(
      modifier = GlanceModifier.defaultWeight(),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      for ((index, day) in habit.days.withIndex()) {
        Box(
          modifier = GlanceModifier
            .defaultWeight()
            .height(CELL_HEIGHT)
            .cornerRadius(3.dp)
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
