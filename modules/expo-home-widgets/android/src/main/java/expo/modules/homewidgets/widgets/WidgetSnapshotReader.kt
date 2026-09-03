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
  val createdAt: Long,
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
  val dueToday: Boolean,
  val days: List<WidgetHabitDay>,
)

data class WidgetTransaction(
  val id: String,
  val goalId: String,
  val type: String,
  val amount: Double,
  val createdAt: Long,
)

data class WidgetSnapshot(
  val version: Int,
  val generatedAt: Long,
  val goals: List<WidgetGoal>,
  val habits: List<WidgetHabitRow>,
  val transactions: List<WidgetTransaction>,
)

/**
 * Baca & parse [WidgetUpdater.SNAPSHOT_FILE_NAME] yang ditulis JS-side
 * (lihat `src/widgets/syncWidgetSnapshot.ts`, checkpoint 4b). Pakai
 * `org.json` bawaan Android -- gak nambah dependency buat parsing JSON
 * yang strukturnya sesimpel ini.
 */
object WidgetSnapshotReader {
  private val EMPTY = WidgetSnapshot(version = 2, generatedAt = 0L, goals = emptyList(), habits = emptyList(), transactions = emptyList())

  fun read(context: Context): WidgetSnapshot {
    return parse(readJson(context))
  }

  fun readJson(context: Context): String? {
    val file = File(context.filesDir, WidgetUpdater.SNAPSHOT_FILE_NAME)
    return file.takeIf { it.exists() }?.readText()
  }

  fun parse(snapshotJson: String?): WidgetSnapshot {
    if (snapshotJson.isNullOrBlank()) return EMPTY
    return try {
      val json = JSONObject(snapshotJson)
      WidgetSnapshot(
        version = json.optInt("version", 1),
        generatedAt = json.optLong("generatedAt", 0L),
        goals = parseGoals(json.optJSONArray("goals")),
        habits = parseHabits(json.optJSONArray("habits")),
        transactions = parseTransactions(json.optJSONArray("transactions")),
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
        createdAt = obj.optLong("createdAt", 0L),
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
        dueToday = obj.optBoolean("dueToday", true),
        days = parseDays(obj.optJSONArray("days")),
      )
    }
  }

  private fun parseTransactions(array: JSONArray?): List<WidgetTransaction> {
    if (array == null) return emptyList()
    return (0 until array.length()).mapNotNull { i ->
      val obj = array.optJSONObject(i) ?: return@mapNotNull null
      val type = obj.optString("type")
      if (type != "deposit" && type != "withdrawal") return@mapNotNull null
      WidgetTransaction(
        id = obj.optString("id"),
        goalId = obj.optString("goalId"),
        type = type,
        amount = obj.optDouble("amount", 0.0).coerceAtLeast(0.0),
        createdAt = obj.optLong("createdAt", 0L),
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
