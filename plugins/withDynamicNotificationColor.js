const { withDangerousMod } = require("@expo/config-plugins");
const fs = require("fs");
const path = require("path");

/**
 * Checkpoint <next>: warna aksen notifikasi ngikutin Material You dinamis
 * (wallpaper-driven), bukan hex statis. `expo-notifications`'s plugin cuma
 * bisa nulis 1 nilai hex tetap ke `values/colors.xml` (dicek langsung dari
 * source `withNotificationsAndroid.js` -- `Colors.setColorItem` nulis
 * whatever string dikasih TANPA validasi format, jadi resource reference
 * kayak `@android:color/...` juga valid ditulis situ, tapi TETAP butuh
 * folder resource TERKUALIFIKASI terpisah biar bisa fallback aman di
 * Android <12 yang gak punya resource dinamis ini).
 *
 * 3 lapis resource, Android pilih otomatis sesuai versi+tema device:
 * - `values/colors.xml` (default, ditulis expo-notifications sendiri):
 *   hex statis `#A985E0` -- fallback WAJIB buat Android <12 (API <31)
 *   yang gak punya `system_accent1_*` sama sekali.
 * - `values-v31/colors.xml` (Android 12+, tema TERANG): reference ke
 *   `@android:color/system_accent1_600` -- tone medium-gelap, kontras
 *   pas di notification tray terang.
 * - `values-night-v31/colors.xml` (Android 12+, tema GELAP): reference
 *   ke `@android:color/system_accent1_200` -- tone lebih terang, kontras
 *   pas di notification tray gelap. Konvensi index 600/200 ini SAMA
 *   persis kayak yang dipakai Material Components sendiri buat resolve
 *   `colorPrimary` di `ThemeOverlay.Material3.DynamicColors.Light/Dark`
 *   -- bukan angka asal, ngikutin pattern resmi Google.
 *
 * Checkpoint <next> (FIX): nama folder pertama (`values-v31-night`) SALAH
 * -- build gagal ("Invalid resource directory name"). Root cause: Android
 * qualifier resource itu WAJIB urutan tertentu, night mode (posisi ~12 di
 * tabel resmi) harus di SEBELUM platform version (`-vXX`, WAJIB paling
 * akhir kalau dipakai). Urutan bener: `values-night-v31`, BUKAN
 * `values-v31-night`. Dikonfirmasi ulang dari dokumentasi resmi Android
 * ("App resources overview") + contoh nyata project lain yang commit
 * folder `values-night-v31` persis buat alasan yang sama.
 */
module.exports = function withDynamicNotificationColor(config) {
  return withDangerousMod(config, [
    "android",
    async (config) => {
      const resDir = path.join(
        config.modRequest.platformProjectRoot,
        "app/src/main/res",
      );

      const variants = [
        { dir: "values-v31", tone: "system_accent1_600" },
        { dir: "values-night-v31", tone: "system_accent1_200" },
      ];

      for (const { dir, tone } of variants) {
        const targetDir = path.join(resDir, dir);
        fs.mkdirSync(targetDir, { recursive: true });
        const xml =
          '<?xml version="1.0" encoding="utf-8"?>\n' +
          "<resources>\n" +
          `  <color name="notification_icon_color">@android:color/${tone}</color>\n` +
          "</resources>\n";
        fs.writeFileSync(path.join(targetDir, "colors.xml"), xml, "utf-8");
      }

      return config;
    },
  ]);
};
