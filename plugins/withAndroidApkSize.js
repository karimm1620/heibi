const { withGradleProperties } = require("@expo/config-plugins");

/**
 * Checkpoint <next>: config plugin custom, BUKAN expo-build-properties.
 *
 * `expo-build-properties`'s `android.buildArchs` KONFIRMASI RUSAK khusus di
 * EAS Build cloud -- 2 laporan GitHub terpisah (expo/expo#38225, Juli 2025;
 * expo/eas-cli#3189, September 2025, disertai bukti `zipinfo` nunjukin 4
 * ABI tetep kebawa walau udah di-restrict) yang MASIH TERBUKA per Agustus
 * 2026, gak ada tanda udah di-fix. Daripada gantungin ke plugin yang
 * kebukti gak reliable buat use-case ini, plugin ini manipulasi
 * `android/gradle.properties` LANGSUNG lewat `withGradleProperties` (mod
 * level rendah yang sama yang dipakai expo-build-properties di baliknya)
 * -- lebih predictable karena gak lewat lapisan tambahan yang lagi bug.
 *
 * 3 perubahan:
 * 1. `reactNativeArchitectures`: drop x86/x86_64 (CUMA buat emulator, GAK
 *    ADA HP asli yang pakai) -- sisain armeabi-v7a+arm64-v8a (aman, nutup
 *    HP lama 32-bit sampai yang paling baru). ~Separuh native .so
 *    architecture ke-drop, tanpa resiko device compatibility.
 * 2. `android.enableMinifyInReleaseBuilds`: ProGuard/R8 shrink kode --
 *    DEFAULT-nya `false` (dicek langsung dari app/build.gradle), artinya
 *    release build SEKARANG ship kode gak ke-strip sama sekali. Rule
 *    reanimated udah ada di proguard-rules.pro, library modern lain
 *    biasanya bawa consumer-rules sendiri di AAR-nya (auto-merge, gak
 *    perlu manual). TETAP WAJIB full test build release sebelum rilis --
 *    minifikasi bisa motong sesuatu yang gak ke-cover consumer-rules,
 *    bug-nya sering silent/gak keliatan langsung.
 * 3. `android.enableShrinkResourcesInReleaseBuilds`: buang resource
 *    (drawable/layout/string) yang gak dipakai kode manapun -- butuh
 *    minify nyala bareng (Android Gradle Plugin requirement).
 */
module.exports = function withAndroidApkSize(config) {
  return withGradleProperties(config, (config) => {
    const setProp = (key, value) => {
      const existing = config.modResults.find(
        (item) => item.type === "property" && item.key === key,
      );
      if (existing) {
        existing.value = value;
      } else {
        config.modResults.push({ type: "property", key, value });
      }
    };

    setProp("reactNativeArchitectures", "armeabi-v7a,arm64-v8a");
    setProp("android.enableMinifyInReleaseBuilds", "true");
    setProp("android.enableShrinkResourcesInReleaseBuilds", "true");

    return config;
  });
};
