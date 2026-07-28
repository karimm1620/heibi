package expo.modules.homewidgets.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
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
import androidx.glance.layout.height
import androidx.glance.layout.padding
import androidx.glance.layout.width
import androidx.glance.text.FontWeight
import androidx.glance.text.Text
import androidx.glance.text.TextStyle
import androidx.glance.unit.ColorProvider
import expo.modules.homewidgets.R

// Warna day/night lewat resource @color + values-night (BUKAN
// `ColorProvider(day=, night=)` -- overload itu gak ada di versi Glance
// yang ke-resolve di project ini, cuma ada `ColorProvider(Color)` &
// `ColorProvider(resId: Int)`. Mekanisme resource day/night ini yang sama
// persis udah kebukti jalan buat splash icon, jadi dipakai lagi di sini).
private val ColorBackground = ColorProvider(R.color.widget_background)
private val ColorTextSecondary = ColorProvider(R.color.widget_text_secondary)
private val ColorCellEmpty = ColorProvider(R.color.widget_heatmap_cell_empty)
private val ColorCellLow = ColorProvider(R.color.widget_heatmap_cell_low)
private val ColorCellMid = ColorProvider(R.color.widget_heatmap_cell_mid)
private val ColorCellFull = ColorProvider(R.color.widget_heatmap_cell_full)

private val SIZE_SMALL = DpSize(180.dp, 110.dp)
private val SIZE_MEDIUM = DpSize(250.dp, 110.dp)
private val SIZE_LARGE = DpSize(250.dp, 200.dp)

private const val COLUMNS = 7
private val CELL_SIZE = 12.dp
private val CELL_GAP = 3.dp

/**
 * Widget 1 -- heatmap konsistensi habit (gabungan semua habit aktif), 30
 * hari terakhir. Migrasi dari RemoteViews placeholder (checkpoint 4a) ke
 * Jetpack Glance beneran. Data dari snapshot JSON yang ditulis JS
 * (`src/widgets/syncWidgetSnapshot.ts`, checkpoint 4b) -- widget ini gak
 * pernah baca SQLite langsung.
 */
class HeatmapWidget : GlanceAppWidget() {
  override val sizeMode = SizeMode.Responsive(setOf(SIZE_SMALL, SIZE_MEDIUM, SIZE_LARGE))

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    // Baca & parse data SEBELUM provideContent -- composable-nya sendiri
    // cuma pure render, gak ada I/O di dalamnya.
    val snapshot = WidgetSnapshotReader.read(context)

    provideContent {
      HeatmapContent(snapshot)
    }
  }
}

@Composable
private fun HeatmapContent(snapshot: WidgetSnapshot) {
  val size = LocalSize.current
  val rows = when {
    size.height >= SIZE_LARGE.height -> 5
    size.width >= SIZE_MEDIUM.width -> 2
    else -> 1
  }
  val daysToShow = rows * COLUMNS
  val recentDays = snapshot.heatmap.takeLast(daysToShow)
  // Data belum genap 30 hari (mis. app baru diinstall) -- isi slot kosong
  // di DEPAN biar grid tetap rata kanan (hari ini selalu di pojok
  // kanan-bawah), bukan salah tampil.
  val leadingBlanks = daysToShow - recentDays.size
  val weeks = (List(leadingBlanks) { null } + recentDays).chunked(COLUMNS)

  Column(
    modifier = GlanceModifier
      .fillMaxSize()
      .background(ColorBackground)
      .cornerRadius(16.dp) // catatan: cuma jalan di Android 12+ (API 31+)
      .padding(10.dp),
    verticalAlignment = Alignment.Top,
  ) {
    Text(
      text = "Konsistensi Habit",
      style = TextStyle(
        fontSize = 11.sp,
        fontWeight = FontWeight.Bold,
        color = ColorTextSecondary,
      ),
      modifier = GlanceModifier.padding(bottom = 6.dp),
    )
    for (week in weeks) {
      Row {
        for ((index, day) in week.withIndex()) {
          HeatmapCell(ratio = day?.ratio)
          if (index != week.lastIndex) {
            Spacer(modifier = GlanceModifier.width(CELL_GAP))
          }
        }
      }
      Spacer(modifier = GlanceModifier.height(CELL_GAP))
    }
  }
}

@Composable
private fun HeatmapCell(ratio: Double?) {
  val color = when {
    ratio == null || ratio <= 0.0 -> ColorCellEmpty
    ratio <= 0.34 -> ColorCellLow
    ratio <= 0.67 -> ColorCellMid
    else -> ColorCellFull
  }
  Box(
    modifier = GlanceModifier
      .width(CELL_SIZE)
      .height(CELL_SIZE)
      .cornerRadius(3.dp)
      .background(color),
  ) {}
}
