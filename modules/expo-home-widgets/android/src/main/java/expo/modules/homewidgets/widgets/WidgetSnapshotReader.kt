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
)

data class WidgetHeatmapDay(
  val dateKey: String,
  val ratio: Double,
)

data class WidgetSnapshot(
  val generatedAt: Long,
  val goals: List<WidgetGoal>,
  val heatmap: List<WidgetHeatmapDay>,
)

/**
 * Baca & parse [WidgetUpdater.SNAPSHOT_FILE_NAME] yang ditulis JS-side
 * (lihat `src/widgets/syncWidgetSnapshot.ts`, checkpoint 4b). Pakai
 * `org.json` bawaan Android -- gak nambah dependency buat parsing JSON
 * yang strukturnya sesimpel ini.
 */
object WidgetSnapshotReader {
  private val EMPTY = WidgetSnapshot(generatedAt = 0L, goals = emptyList(), heatmap = emptyList())

  fun read(context: Context): WidgetSnapshot {
    val file = File(context.filesDir, WidgetUpdater.SNAPSHOT_FILE_NAME)
    if (!file.exists()) return EMPTY

    return try {
      val json = JSONObject(file.readText())
      WidgetSnapshot(
        generatedAt = json.optLong("generatedAt", 0L),
        goals = parseGoals(json.optJSONArray("goals")),
        heatmap = parseHeatmap(json.optJSONArray("heatmap")),
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
      )
    }
  }

  private fun parseHeatmap(array: JSONArray?): List<WidgetHeatmapDay> {
    if (array == null) return emptyList()
    return (0 until array.length()).mapNotNull { i ->
      val obj = array.optJSONObject(i) ?: return@mapNotNull null
      WidgetHeatmapDay(
        dateKey = obj.optString("dateKey"),
        ratio = obj.optDouble("ratio", 0.0),
      )
    }
  }
}
