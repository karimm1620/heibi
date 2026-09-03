package expo.modules.homewidgets.widgets

import android.content.Context
import android.content.Intent
import android.net.Uri

/** One route vocabulary for every widget action; Kotlin renderers never scatter raw routes. */
object WidgetDeepLinks {
  private const val SCHEME = "heibi"

  fun today(context: Context): Intent = route(context, "$SCHEME://")

  fun goal(context: Context, goalId: String): Intent =
    route(context, "$SCHEME://goal/${Uri.encode(goalId)}")

  fun goalProgress(context: Context, goalId: String): Intent =
    route(context, "$SCHEME://goal/${Uri.encode(goalId)}/progress")

  private fun route(context: Context, uri: String) =
    Intent(Intent.ACTION_VIEW, Uri.parse(uri)).apply {
      setPackage(context.packageName)
      flags = Intent.FLAG_ACTIVITY_NEW_TASK or Intent.FLAG_ACTIVITY_CLEAR_TOP
    }
}
