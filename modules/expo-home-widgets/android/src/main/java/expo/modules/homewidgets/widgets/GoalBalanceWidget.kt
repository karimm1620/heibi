package expo.modules.homewidgets.widgets

import android.content.Context
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.datastore.preferences.core.Preferences
import androidx.datastore.preferences.core.stringPreferencesKey
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

val SelectedGoalIdKey = stringPreferencesKey("selected_goal_id")

class GoalBalanceWidget : GlanceAppWidget() {
  override val stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition
  override val sizeMode = SizeMode.Exact

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    provideContent {
      val preferences = currentState<Preferences>()
      val snapshot = WidgetSnapshotReader.parse(
        preferences[WidgetSnapshotJsonKey] ?: WidgetSnapshotReader.readJson(context),
      )
      val goalId = preferences[SelectedGoalIdKey]
      SavingWidgetContent(context, snapshot.goals.firstOrNull { it.id == goalId })
    }
  }
}

@Composable
private fun SavingWidgetContent(context: Context, goal: WidgetGoal?) {
  val compact = LocalSize.current.width < 220.dp
  val background = ColorProvider(R.color.widget_background)
  val primary = ColorProvider(R.color.widget_text_primary)
  val secondary = ColorProvider(R.color.widget_text_secondary)
  val empty = ColorProvider(R.color.widget_heatmap_cell_empty)

  Column(
    modifier = GlanceModifier.fillMaxSize().background(background).cornerRadius(22.dp)
      .then(if (goal != null) GlanceModifier.clickable(actionStartActivity(WidgetDeepLinks.goal(context, goal.id))) else GlanceModifier)
      .padding(if (compact) 12.dp else 16.dp),
    verticalAlignment = Alignment.CenterVertically,
  ) {
    if (goal == null) {
      Text("Pilih goal dari Edit widget.", style = TextStyle(fontSize = 12.sp, color = secondary))
      return@Column
    }

    val progress = widgetGoalProgress(goal)
    val accent = ColorProvider(parseHexColor(goal.accentDeep))
    Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
      Column(modifier = GlanceModifier.defaultWeight()) {
        Text(goal.name, maxLines = 1, style = TextStyle(fontSize = 12.sp, fontWeight = FontWeight.Bold, color = primary))
        Spacer(GlanceModifier.height(4.dp))
        Text(formatWidgetRupiah(goal.currentAmount), maxLines = 1, style = TextStyle(fontSize = if (compact) 18.sp else 22.sp, fontWeight = FontWeight.Bold, color = primary))
        Text("dari ${formatWidgetRupiah(goal.targetAmount)}", maxLines = 1, style = TextStyle(fontSize = 10.sp, color = secondary))
      }
      Spacer(GlanceModifier.width(10.dp))
      Text("${(progress * 100).toInt()}%", style = TextStyle(fontSize = 18.sp, fontWeight = FontWeight.Bold, color = accent))
    }
    Spacer(GlanceModifier.height(10.dp))
    Row(GlanceModifier.fillMaxWidth()) {
      val filled = (progress * 12).toInt().coerceIn(0, 12)
      for (index in 0 until 12) {
        Box(GlanceModifier.defaultWeight().height(12.dp).cornerRadius(4.dp).background(if (index < filled) accent else empty)) {}
        if (index != 11) Spacer(GlanceModifier.width(2.dp))
      }
    }
  }
}

internal fun widgetGoalProgress(goal: WidgetGoal): Float =
  if (goal.targetAmount <= 0.0) 0f else (goal.currentAmount / goal.targetAmount).toFloat().coerceIn(0f, 1f)

internal fun formatWidgetRupiah(amount: Double): String {
  val rounded = amount.toLong().coerceAtLeast(0)
  return "Rp" + rounded.toString().reversed().chunked(3).joinToString(".").reversed()
}
