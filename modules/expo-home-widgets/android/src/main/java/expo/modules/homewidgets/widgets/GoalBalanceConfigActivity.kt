package expo.modules.homewidgets.widgets

import android.app.Activity
import android.appwidget.AppWidgetManager
import android.content.Intent
import android.graphics.Color
import android.os.Bundle
import android.view.Gravity
import android.view.View
import android.widget.LinearLayout
import android.widget.ScrollView
import android.widget.TextView
import androidx.glance.appwidget.GlanceAppWidgetManager
import androidx.glance.appwidget.state.updateAppWidgetState
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.launch

/**
 * Dibuka OTOMATIS sama Android pas Widget 2 di-drop ke home screen (lewat
 * `android:configure` di goal_balance_widget_info.xml). Tugasnya cuma satu:
 * user pilih goal, kita simpen pilihannya per-appWidgetId, trigger update,
 * lalu WAJIB balikin RESULT_OK -- kalau enggak, Android batalin pemasangan
 * widget-nya (lihat dokumentasi resmi "Enable users to configure app
 * widgets").
 *
 * Pakai View biasa (bukan Compose) buat layar sesimpel ini -- gak nambah
 * dependency Compose UI/activity-compose yang butuh versi presisi lagi.
 */
class GoalBalanceConfigActivity : Activity() {
  private var appWidgetId = AppWidgetManager.INVALID_APPWIDGET_ID

  override fun onCreate(savedInstanceState: Bundle?) {
    super.onCreate(savedInstanceState)
    setResult(RESULT_CANCELED)

    appWidgetId = intent?.extras?.getInt(
      AppWidgetManager.EXTRA_APPWIDGET_ID,
      AppWidgetManager.INVALID_APPWIDGET_ID,
    ) ?: AppWidgetManager.INVALID_APPWIDGET_ID

    if (appWidgetId == AppWidgetManager.INVALID_APPWIDGET_ID) {
      finish()
      return
    }

    setContentView(buildPickerView())
  }

  private fun buildPickerView(): View {
    val isNight = (resources.configuration.uiMode and
      android.content.res.Configuration.UI_MODE_NIGHT_MASK) ==
      android.content.res.Configuration.UI_MODE_NIGHT_YES
    val bgColor = if (isNight) Color.parseColor("#17151F") else Color.parseColor("#F6F4FB")
    val textColor = if (isNight) Color.parseColor("#F6F4FB") else Color.parseColor("#17151F")
    val secondaryColor = if (isNight) Color.parseColor("#A6A3AD") else Color.parseColor("#6B6875")
    val dp8 = (8 * resources.displayMetrics.density).toInt()
    val dp24 = (24 * resources.displayMetrics.density).toInt()

    val snapshot = WidgetSnapshotReader.read(this)

    val container = LinearLayout(this).apply {
      orientation = LinearLayout.VERTICAL
      setBackgroundColor(bgColor)
      setPadding(dp24, dp24, dp24, dp24)
    }

    container.addView(
      TextView(this).apply {
        text = "Pilih goal buat widget ini"
        textSize = 18f
        setTextColor(textColor)
        setPadding(0, 0, 0, dp24)
      },
    )

    if (snapshot.goals.isEmpty()) {
      container.addView(
        TextView(this).apply {
          text = "Belum ada goal tabungan. Buka app dulu buat bikin goal, baru pasang widget ini."
          textSize = 14f
          setTextColor(secondaryColor)
        },
      )
    } else {
      for (goal in snapshot.goals) {
        container.addView(
          TextView(this).apply {
            text = "${goal.emoji ?: "💰"}  ${goal.name}"
            textSize = 16f
            setTextColor(textColor)
            gravity = Gravity.CENTER_VERTICAL
            setPadding(0, dp8 * 2, 0, dp8 * 2)
            isClickable = true
            isFocusable = true
            setOnClickListener { onGoalSelected(goal.id) }
          },
        )
      }
    }

    return ScrollView(this).apply { addView(container) }
  }

  private fun onGoalSelected(goalId: String) {
    CoroutineScope(Dispatchers.Main).launch {
      val glanceId = GlanceAppWidgetManager(this@GoalBalanceConfigActivity).getGlanceIdBy(appWidgetId)

      updateAppWidgetState(
        this@GoalBalanceConfigActivity,
        androidx.glance.state.PreferencesGlanceStateDefinition,
        glanceId,
      ) { prefs ->
        prefs.toMutablePreferences().apply { this[SelectedGoalIdKey] = goalId }
      }

      // Sistem GAK ngirim broadcast update pas configuration activity
      // dibuka -- ini tanggung jawab activity buat trigger update pertama.
      GoalBalanceWidget().update(this@GoalBalanceConfigActivity, glanceId)

      val resultValue = Intent().putExtra(AppWidgetManager.EXTRA_APPWIDGET_ID, appWidgetId)
      setResult(RESULT_OK, resultValue)
      finish()
    }
  }
}
