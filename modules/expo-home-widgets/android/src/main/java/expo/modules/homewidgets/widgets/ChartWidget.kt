package expo.modules.homewidgets.widgets

import android.content.Context
import android.graphics.Bitmap
import android.graphics.Canvas
import android.graphics.Paint
import android.graphics.Path
import androidx.compose.runtime.Composable
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.core.content.ContextCompat
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
import androidx.glance.Image
import androidx.glance.ImageProvider
import androidx.glance.layout.ContentScale
import expo.modules.homewidgets.R
import kotlin.math.max

class ChartWidget : GlanceAppWidget() {
  override val stateDefinition: GlanceStateDefinition<*> = PreferencesGlanceStateDefinition
  override val sizeMode = SizeMode.Exact

  override suspend fun provideGlance(context: Context, id: GlanceId) {
    provideContent {
      val preferences = currentState<Preferences>()
      val snapshot = WidgetSnapshotReader.parse(
        preferences[WidgetSnapshotJsonKey] ?: WidgetSnapshotReader.readJson(context),
      )
      val goalId = preferences[SelectedGoalIdKey]
      val goal = snapshot.goals.firstOrNull { it.id == goalId }
      ChartWidgetContent(context, goal, snapshot.transactions)
    }
  }
}

@Composable
private fun ChartWidgetContent(context: Context, goal: WidgetGoal?, transactions: List<WidgetTransaction>) {
  val size = LocalSize.current
  val compact = size.width < 260.dp
  val background = ColorProvider(R.color.widget_background)
  val primary = ColorProvider(R.color.widget_text_primary)
  val secondary = ColorProvider(R.color.widget_text_secondary)

  Column(
    modifier = GlanceModifier.fillMaxSize().background(background).cornerRadius(22.dp)
      .then(if (goal != null) GlanceModifier.clickable(actionStartActivity(WidgetDeepLinks.goalProgress(context, goal.id))) else GlanceModifier)
      .padding(if (compact) 12.dp else 16.dp),
  ) {
    if (goal == null) {
      Text("Pilih goal dari Edit widget.", style = TextStyle(fontSize = 12.sp, color = secondary))
      return@Column
    }

    val balances = buildWidgetBalances(goal, transactions)
    val related = transactions.filter { it.goalId == goal.id }
    val deposits = related.filter { it.type == "deposit" }.sumOf { it.amount }
    val withdrawals = related.filter { it.type == "withdrawal" }.sumOf { it.amount }
    val trendBitmap = drawTrendBitmap(context, balances, size.width.value.toInt().coerceIn(160, 440), if (compact) 52 else 64)

    Row(modifier = GlanceModifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
      Column(modifier = GlanceModifier.defaultWeight()) {
        Text("ALIRAN TABUNGAN", style = TextStyle(fontSize = 10.sp, fontWeight = FontWeight.Bold, color = secondary))
        Text(formatWidgetRupiah(goal.currentAmount), maxLines = 1, style = TextStyle(fontSize = if (compact) 18.sp else 22.sp, fontWeight = FontWeight.Bold, color = primary))
      }
      Text(goal.name, maxLines = 1, style = TextStyle(fontSize = 11.sp, color = secondary), modifier = GlanceModifier.width(if (compact) 72.dp else 112.dp))
    }
    Spacer(GlanceModifier.height(6.dp))
    Image(provider = ImageProvider(trendBitmap), contentDescription = "Grafik saldo berjalan ${goal.name}", contentScale = ContentScale.FillBounds, modifier = GlanceModifier.fillMaxWidth().height(if (compact) 52.dp else 64.dp))
    Spacer(GlanceModifier.height(6.dp))
    Row(modifier = GlanceModifier.fillMaxWidth()) {
      Text("Masuk ${formatWidgetRupiah(deposits)}", style = TextStyle(fontSize = 9.sp, color = ColorProvider(R.color.widget_deposit)))
      Spacer(GlanceModifier.defaultWeight())
      Text("Keluar ${formatWidgetRupiah(withdrawals)}", style = TextStyle(fontSize = 9.sp, color = ColorProvider(R.color.widget_withdraw)))
    }
  }
}

internal fun buildWidgetBalances(goal: WidgetGoal, transactions: List<WidgetTransaction>): List<Double> {
  val ordered = transactions.filter { it.goalId == goal.id }.sortedWith(compareBy<WidgetTransaction> { it.createdAt }.thenBy { it.id })
  val net = ordered.sumOf { if (it.type == "deposit") it.amount else -it.amount }
  var balance = max(0.0, goal.currentAmount - net)
  return buildList {
    add(balance)
    ordered.forEach {
      balance = max(0.0, balance + if (it.type == "deposit") it.amount else -it.amount)
      add(balance)
    }
    if (isNotEmpty()) this[lastIndex] = max(0.0, goal.currentAmount)
  }
}

private fun drawTrendBitmap(context: Context, values: List<Double>, widthDp: Int, heightDp: Int): Bitmap {
  val density = context.resources.displayMetrics.density
  // Keep the RemoteViews bitmap comfortably bounded on high-density launchers;
  // Glance scales it to the exact widget bounds and no polling/frame loop exists.
  val width = (widthDp * density).toInt().coerceIn(2, 720)
  val height = (heightDp * density).toInt().coerceIn(2, 160)
  val bitmap = Bitmap.createBitmap(width, height, Bitmap.Config.ARGB_8888)
  val canvas = Canvas(bitmap)
  val linePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = ContextCompat.getColor(context, R.color.widget_chart_line)
    style = Paint.Style.STROKE
    strokeWidth = 3f * density
    strokeCap = Paint.Cap.ROUND
    strokeJoin = Paint.Join.ROUND
  }
  val baselinePaint = Paint(Paint.ANTI_ALIAS_FLAG).apply {
    color = ContextCompat.getColor(context, R.color.widget_chart_grid)
    strokeWidth = density
  }
  val padding = 4f * density
  canvas.drawLine(padding, height - padding, width - padding, height - padding, baselinePaint)
  val sampled = if (values.size <= 24) values else values.filterIndexed { index, _ -> index == 0 || index == values.lastIndex || index % max(1, values.size / 22) == 0 }
  val minValue = sampled.minOrNull() ?: 0.0
  val maxValue = sampled.maxOrNull() ?: 1.0
  val span = max(1.0, maxValue - minValue)
  val path = Path()
  sampled.forEachIndexed { index, value ->
    val x = padding + (if (sampled.size == 1) 0f else index.toFloat() / (sampled.size - 1)) * (width - padding * 2)
    val y = height - padding - (((value - minValue) / span).toFloat() * (height - padding * 2))
    if (index == 0) path.moveTo(x, y) else path.lineTo(x, y)
  }
  canvas.drawPath(path, linePaint)
  return bitmap
}
