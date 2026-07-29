package expo.modules.homewidgets.widgets

import android.graphics.Color as AndroidColor
import androidx.compose.ui.graphics.Color

/** Fallback ke ungu brand kalau hex dari data somehow invalid/corrupt. */
fun parseHexColor(hex: String): Color {
  return try {
    Color(AndroidColor.parseColor(hex))
  } catch (e: IllegalArgumentException) {
    Color(0xFFA985E0)
  }
}
