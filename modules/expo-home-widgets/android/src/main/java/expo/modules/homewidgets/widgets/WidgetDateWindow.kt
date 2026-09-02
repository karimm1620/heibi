package expo.modules.homewidgets.widgets

import java.text.SimpleDateFormat
import java.util.Calendar
import java.util.Locale

internal const val HEATMAP_DAY_SLOTS = 14

/**
 * Re-aligns a persisted snapshot to the current local calendar window every
 * time Glance redraws. This keeps the hourly widget update correct across a
 * midnight boundary even when the app has not reopened to rebuild JSON.
 */
internal fun alignWidgetDays(
  days: List<WidgetHabitDay>,
  referenceTimeMillis: Long = System.currentTimeMillis(),
): List<WidgetHabitDay> {
  val dayByKey = days.associateBy(WidgetHabitDay::dateKey)
  val calendar = Calendar.getInstance().apply {
    timeInMillis = referenceTimeMillis
    set(Calendar.HOUR_OF_DAY, 12)
    set(Calendar.MINUTE, 0)
    set(Calendar.SECOND, 0)
    set(Calendar.MILLISECOND, 0)
  }
  val formatter = SimpleDateFormat("yyyy-MM-dd", Locale.US)
  val newestToOldest = buildList {
    repeat(HEATMAP_DAY_SLOTS) {
      add(formatter.format(calendar.time))
      calendar.add(Calendar.DAY_OF_MONTH, -1)
    }
  }

  return newestToOldest.asReversed().map { dateKey ->
    dayByKey[dateKey] ?: WidgetHabitDay(dateKey = dateKey, done = false)
  }
}
