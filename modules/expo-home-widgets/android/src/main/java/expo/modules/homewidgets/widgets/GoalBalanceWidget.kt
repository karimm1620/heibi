package expo.modules.homewidgets.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
import androidx.glance.GlanceId
import androidx.glance.GlanceModifier
import androidx.glance.appwidget.GlanceAppWidget
import androidx.glance.appwidget.SizeMode
import androidx.glance.appwidget.cornerRadius
import androidx.glance.appwidget.provideContent
import androidx.glance.background
import androidx.glance.currentState
import androidx.glance.layout.Alignment
import androidx.glance.layout.Box
import androidx.glance.layout.Column
import androidx.glance.layout.Row
import androidx.glance.layout.RowScope
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

/** Dipakai bareng [GoalBalanceConfigActivity] buat baca/nulis pilihan goal per-instance widget. */
val SelectedGoalIdKey = stringPreferencesKey("selected_goal_id")

private val ColorBackground = ColorProvider(R.color.widget_background)
private val ColorTextPrimary = ColorProvider(R.color.widget_text_primary)
private val ColorTextSecondary = ColorProvider(R.color.widget_text_secondary)
private val ColorProgressEmpty = ColorProvider(R.color.widget_heatmap_cell_empty)

private const val PROGRESS_SEGMENTS = 10
private val CONTAINER_PADDING = 12.dp
private val SEGMENT_HEIGHT = 14.dp
private val SEGMENT_GAP = 3.dp
private val PERCENT_TEXT_WIDTH = 34.dp
private val PERCENT_GAP = 8.dp

/**
 * Widget 2 -- saldo satu goal tabungan pilihan user, progress bar & aksen
 * warna pakai `accent` goal itu sendiri.
 *
 * Checkpoint 4g: progress bar sekarang pake `GlanceModifier.defaultWeight()`
 * (weight LinearLayout Android asli) buat ngisi sisa lebar row, gantiin
 * hitungan manual dari `LocalSize` (checkpoint 4f) yang ternyata masih
 * nyisain ruang kosong.
 */
class GoalBalanceWidget : GlanceAppWidget() {
  override val stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition
  override val sizeMode = SizeMode.Exact

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    val snapshot = WidgetSnapshotReader.read(context)

    provideContent {
      val prefs = currentState<Preferences>()
      val selectedGoalId = prefs[SelectedGoalIdKey]
      val goal = snapshot.goals.firstOrNull { it.id == selectedGoalId }

      GoalBalanceContent(goal)
    }
  }
}

@Composable
private fun GoalBalanceContent(goal: WidgetGoal?) {
  Column(
    modifier = GlanceModifier
      .fillMaxSize()
      .background(ColorBackground)
      .cornerRadius(16.dp)
      .padding(CONTAINER_PADDING),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    if (goal == null) {
      Text(
        text = "Widget belum di-setting. Tekan lama widget ini, pilih Edit buat pilih goal.",
        style = TextStyle(fontSize = 12.sp, color = ColorTextSecondary),
      )
      return@Column
    }

    val progress = progressOf(goal)
    val accentColor = ColorProvider(parseHexColor(goal.accentDeep))

    Text(
      text = "${goal.emoji ?: "💰"}  ${goal.name}",
      maxLines = 1,
      style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ColorTextPrimary),
    )
    Spacer(modifier = GlanceModifier.height(6.dp))
    Text(
      text = "${formatRupiah(goal.currentAmount)} / ${formatRupiah(goal.targetAmount)}",
      style = TextStyle(fontSize = 12.sp, color = ColorTextSecondary),
    )
    Spacer(modifier = GlanceModifier.height(8.dp))
    Row(
      modifier = GlanceModifier.fillMaxWidth(),
      verticalAlignment = Alignment.CenterVertically,
    ) {
      ProgressBar(progress = progress, filledColor = accentColor)
      Spacer(modifier = GlanceModifier.width(PERCENT_GAP))
      Text(
        text = "${(progress * 100).toInt()}%",
        style = TextStyle(fontSize = 11.sp, fontWeight = FontWeight.Bold, color = accentColor),
        modifier = GlanceModifier.width(PERCENT_TEXT_WIDTH),
      )
    }
  }
}

private fun progressOf(goal: WidgetGoal): Float {
  if (goal.targetAmount <= 0.0) return 0f
  return (goal.currentAmount / goal.targetAmount).toFloat().coerceIn(0f, 1f)
}

/**
 * Extension function `RowScope` (BUKAN fungsi biasa) -- `defaultWeight()`
 * di badan fungsi ini butuh RowScope si PEMANGGIL (Row di
 * GoalBalanceContent) supaya bar-nya bisa nyerap sisa lebar row itu. Kalau
 * ini fungsi biasa, `defaultWeight()` gak bakal ke-resolve sama sekali.
 */
@Composable
private fun RowScope.ProgressBar(progress: Float, filledColor: ColorProvider) {
  val filledSegments = (progress * PROGRESS_SEGMENTS).toInt().coerceIn(0, PROGRESS_SEGMENTS)
  Row(
    modifier = GlanceModifier.defaultWeight(),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    for (i in 0 until PROGRESS_SEGMENTS) {
      Box(
        modifier = GlanceModifier
          .defaultWeight()
          .height(SEGMENT_HEIGHT)
          .cornerRadius(4.dp)
          .background(if (i < filledSegments) filledColor else ColorProgressEmpty),
      ) {}
      if (i != PROGRESS_SEGMENTS - 1) {
        Spacer(modifier = GlanceModifier.width(SEGMENT_GAP))
      }
    }
  }
}

/** Manual thousand-grouping (bukan NumberFormat) biar gak gantung ke locale device. */
private fun formatRupiah(amount: Double): String {
  val rounded = amount.toLong().coerceAtLeast(0)
  val grouped = rounded.toString().reversed().chunked(3).joinToString(".").reversed()
  return "Rp$grouped"
}
