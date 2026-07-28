package expo.modules.homewidgets.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.DpSize
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
import androidx.glance.layout.Spacer
import androidx.glance.layout.fillMaxSize
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
private val ColorProgressFilled = ColorProvider(R.color.widget_heatmap_cell_full)
private val ColorProgressEmpty = ColorProvider(R.color.widget_heatmap_cell_empty)

private val SIZE_SMALL = DpSize(140.dp, 90.dp)
private val SIZE_LARGE = DpSize(250.dp, 110.dp)

private const val PROGRESS_SEGMENTS = 10
private val SEGMENT_SIZE = 9.dp
private val SEGMENT_GAP = 2.dp

/**
 * Widget 2 -- saldo satu goal tabungan pilihan user (bukan auto-pilih,
 * dipilih lewat [GoalBalanceConfigActivity] pas widget ditambahin ke home
 * screen). Migrasi dari RemoteViews placeholder (checkpoint 4a) ke Jetpack
 * Glance. Data dari snapshot JSON, sama kayak Widget 1 -- gak baca SQLite
 * langsung.
 */
class GoalBalanceWidget : GlanceAppWidget() {
  override val stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition
  override val sizeMode = SizeMode.Responsive(setOf(SIZE_SMALL, SIZE_LARGE))

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
      .padding(12.dp),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    if (goal == null) {
      Text(
        text = "Widget belum di-setting. Tekan lama widget ini, pilih Edit buat pilih goal.",
        style = TextStyle(fontSize = 12.sp, color = ColorTextSecondary),
      )
      return@Column
    }

    Text(
      text = "${goal.emoji ?: "💰"}  ${goal.name}",
      style = TextStyle(fontSize = 13.sp, fontWeight = FontWeight.Bold, color = ColorTextPrimary),
    )
    Spacer(modifier = GlanceModifier.height(6.dp))
    Text(
      text = "${formatRupiah(goal.currentAmount)} / ${formatRupiah(goal.targetAmount)}",
      style = TextStyle(fontSize = 12.sp, color = ColorTextSecondary),
    )
    Spacer(modifier = GlanceModifier.height(8.dp))
    ProgressBar(progress = progressOf(goal))
  }
}

private fun progressOf(goal: WidgetGoal): Float {
  if (goal.targetAmount <= 0.0) return 0f
  return (goal.currentAmount / goal.targetAmount).toFloat().coerceIn(0f, 1f)
}

@Composable
private fun ProgressBar(progress: Float) {
  val filledSegments = (progress * PROGRESS_SEGMENTS).toInt().coerceIn(0, PROGRESS_SEGMENTS)
  Row {
    for (i in 0 until PROGRESS_SEGMENTS) {
      Box(
        modifier = GlanceModifier
          .width(SEGMENT_SIZE)
          .height(SEGMENT_SIZE)
          .cornerRadius(2.dp)
          .background(if (i < filledSegments) ColorProgressFilled else ColorProgressEmpty),
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
