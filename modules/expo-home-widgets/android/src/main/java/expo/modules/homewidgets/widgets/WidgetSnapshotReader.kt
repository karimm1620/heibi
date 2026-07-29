package expo.modules.homewidgets.widgets

import android.content.Context
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

data class WidgetGoal(
  val id: String,
  val name: String,
  val emoji: String?,
  val currentAmount: Double,
  val targetAmount: Double,
  val accentBase: String,
  val accentDeep: String,
)

data class WidgetHabitDay(
  val dateKey: String,
  val done: Boolean,
)

data class WidgetHabitRow(
  val id: String,
  val name: String,
  val colorHex: String,
  val currentStreak: Int,
  val days: List<WidgetHabitDay>,
)

data class WidgetSnapshot(
  val generatedAt: Long,
  val goals: List<WidgetGoal>,
  val habits: List<WidgetHabitRow>,
)

/**
 * Baca & parse [WidgetUpdater.SNAPSHOT_FILE_NAME] yang ditulis JS-side
 * (lihat `src/widgets/syncWidgetSnapshot.ts`, checkpoint 4b). Pakai
 * `org.json` bawaan Android -- gak nambah dependency buat parsing JSON
 * yang strukturnya sesimpel ini.
 */
object WidgetSnapshotReader {
  private val EMPTY = WidgetSnapshot(generatedAt = 0L, goals = emptyList(), habits = emptyList())

  fun read(context: Context): WidgetSnapshot {
    val file = File(context.filesDir, WidgetUpdater.SNAPSHOT_FILE_NAME)
    if (!file.exists()) return EMPTY

    return try {
      val json = JSONObject(file.readText())
      WidgetSnapshot(
        generatedAt = json.optLong("generatedAt", 0L),
        goals = parseGoals(json.optJSONArray("goals")),
        habits = parseHabits(json.optJSONArray("habits")),
      )
    } catch (e: Exception) {
      // Snapshot rusak/gak lengkap -- widget nampilin state kosong yang
      // wajar (mis. abis widget baru dipasang sebelum app pernah dibuka),
      // bukan crash.
      EMPTY
    }
  }

  private fun parseGoals(array: JSONArray?): List<WidgetGoal> {
    if (array == null) return emptyList()
    return (0 until array.length()).mapNotNull { i ->
      val obj = array.optJSONObject(i) ?: return@mapNotNull null
      WidgetGoal(
        id = obj.optString("id"),
        name = obj.optString("name"),
        emoji = if (obj.has("emoji") && !obj.isNull("emoji")) obj.optString("emoji") else null,
        currentAmount = obj.optDouble("currentAmount", 0.0),
        targetAmount = obj.optDouble("targetAmount", 0.0),
        accentBase = obj.optString("accentBase", "#D9C9F2"),
        accentDeep = obj.optString("accentDeep", "#A985E0"),
      )
    }
  }

  private fun parseHabits(array: JSONArray?): List<WidgetHabitRow> {
    if (array == null) return emptyList()
    return (0 until array.length()).mapNotNull { i ->
      val obj = array.optJSONObject(i) ?: return@mapNotNull null
      WidgetHabitRow(
        id = obj.optString("id"),
        name = obj.optString("name"),
        colorHex = obj.optString("colorHex", "#A985E0"),
        currentStreak = obj.optInt("currentStreak", 0),
        days = parseDays(obj.optJSONArray("days")),
      )
    }
  }

  private fun parseDays(array: JSONArray?): List<WidgetHabitDay> {
    if (array == null) return emptyList()
    return (0 until array.length()).mapNotNull { i ->
      val obj = array.optJSONObject(i) ?: return@mapNotNull null
      WidgetHabitDay(
        dateKey = obj.optString("dateKey"),
        done = obj.optBoolean("done", false),
      )
    }
  }
}
