package expo.modules.dynamicmaterial3

import android.content.res.Resources
import android.os.Build
import androidx.annotation.RequiresApi
import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition

class ExpoDynamicMaterial3Module : Module() {
  override fun definition() = ModuleDefinition {
    Name("ExpoDynamicMaterial3")

    Function("getSystemTheme") {
      if (Build.VERSION.SDK_INT < Build.VERSION_CODES.S) {
        return@Function null
      }

      val resources = appContext.reactContext?.resources ?: return@Function null
      getSystemTheme(resources)
    }
  }

  @RequiresApi(Build.VERSION_CODES.S)
  private fun getSystemTheme(resources: Resources): Map<String, Map<String, String>> = mapOf(
    "light" to getLightScheme(resources),
    "dark" to getDarkScheme(resources),
  )

  @RequiresApi(Build.VERSION_CODES.S)
  private fun getLightScheme(resources: Resources): Map<String, String> = mapOf(
    "primary" to color(resources, android.R.color.system_accent1_600),
    "onPrimary" to color(resources, android.R.color.system_accent1_0),
    "primaryContainer" to color(resources, android.R.color.system_accent1_100),
    "onPrimaryContainer" to color(resources, android.R.color.system_accent1_900),
    "secondary" to color(resources, android.R.color.system_accent2_600),
    "onSecondary" to color(resources, android.R.color.system_accent2_0),
    "secondaryContainer" to color(resources, android.R.color.system_accent2_100),
    "onSecondaryContainer" to color(resources, android.R.color.system_accent2_900),
    "tertiary" to color(resources, android.R.color.system_accent3_600),
    "onTertiary" to color(resources, android.R.color.system_accent3_0),
    "tertiaryContainer" to color(resources, android.R.color.system_accent3_100),
    "onTertiaryContainer" to color(resources, android.R.color.system_accent3_900),
    "background" to color(resources, android.R.color.system_neutral1_10),
    "onBackground" to color(resources, android.R.color.system_neutral1_900),
    "surface" to color(resources, android.R.color.system_neutral1_10),
    "onSurface" to color(resources, android.R.color.system_neutral1_900),
    "surfaceVariant" to color(resources, android.R.color.system_neutral2_100),
    "onSurfaceVariant" to color(resources, android.R.color.system_neutral2_700),
    "outline" to color(resources, android.R.color.system_neutral2_500),
    "outlineVariant" to color(resources, android.R.color.system_neutral2_200),
    "inverseSurface" to color(resources, android.R.color.system_neutral1_800),
    "inverseOnSurface" to color(resources, android.R.color.system_neutral1_50),
    "inversePrimary" to color(resources, android.R.color.system_accent1_200),
  )

  @RequiresApi(Build.VERSION_CODES.S)
  private fun getDarkScheme(resources: Resources): Map<String, String> = mapOf(
    "primary" to color(resources, android.R.color.system_accent1_200),
    "onPrimary" to color(resources, android.R.color.system_accent1_800),
    "primaryContainer" to color(resources, android.R.color.system_accent1_700),
    "onPrimaryContainer" to color(resources, android.R.color.system_accent1_100),
    "secondary" to color(resources, android.R.color.system_accent2_200),
    "onSecondary" to color(resources, android.R.color.system_accent2_800),
    "secondaryContainer" to color(resources, android.R.color.system_accent2_700),
    "onSecondaryContainer" to color(resources, android.R.color.system_accent2_100),
    "tertiary" to color(resources, android.R.color.system_accent3_200),
    "onTertiary" to color(resources, android.R.color.system_accent3_800),
    "tertiaryContainer" to color(resources, android.R.color.system_accent3_700),
    "onTertiaryContainer" to color(resources, android.R.color.system_accent3_100),
    "background" to color(resources, android.R.color.system_neutral1_900),
    "onBackground" to color(resources, android.R.color.system_neutral1_100),
    "surface" to color(resources, android.R.color.system_neutral1_900),
    "onSurface" to color(resources, android.R.color.system_neutral1_100),
    "surfaceVariant" to color(resources, android.R.color.system_neutral2_700),
    "onSurfaceVariant" to color(resources, android.R.color.system_neutral2_200),
    "outline" to color(resources, android.R.color.system_neutral2_400),
    "outlineVariant" to color(resources, android.R.color.system_neutral2_700),
    "inverseSurface" to color(resources, android.R.color.system_neutral1_100),
    "inverseOnSurface" to color(resources, android.R.color.system_neutral1_800),
    "inversePrimary" to color(resources, android.R.color.system_accent1_600),
  )

  @RequiresApi(Build.VERSION_CODES.S)
  private fun color(resources: Resources, resourceId: Int): String {
    val value = resources.getColor(resourceId, null)
    return String.format("#%06X", 0xFFFFFF and value)
  }
}
