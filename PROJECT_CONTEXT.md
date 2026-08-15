# PROJECT_CONTEXT.md — heibi

> Dokumen handoff antar sesi chat. **Upload file ini di awal sesi baru** biar
> Claude langsung punya konteks penuh — repo ini dikerjain lewat BEBERAPA
> sesi chat berbeda, jadi tanpa file ini ada resiko nyata 2 sesi kerja bareng
> tanpa saling tau (udah pernah kejadian — lihat catatan di bagian bawah).

## Ringkasan project

**heibi** — savings tracker + habit tracker + daily planner jadi satu app.
Android-only, fully offline, gak ada login/akun, semua data lokal (SQLite).
Didesain minimalis pakai Material 3 Expressive (Material You — warna app
nyesuaiin otomatis sama wallpaper device).

- Repo: `https://github.com/karimm1620/heibi` (dulu `tabungan-kertas`,
  di-rename Checkpoint 11)
- Package: `com.immz.heibi`
- Stack: Expo SDK 57, React Native 0.86.2, TypeScript, Expo Router, Zustand
  (reactive cache) + expo-sqlite (source of truth), react-native-screens,
  react-native-gesture-handler **v2.32 (bukan v3!** — lihat alasan di bagian
  technical lessons)
- **react-native-reanimated 4.5.1 + react-native-worklets 0.10.1 RESMI
  ditambahin di Checkpoint 14** — ini ngebalikin keputusan lama "no
  Reanimated". Scope-nya SENGAJA dibatasin ketat: cuma dipakai di
  `HabitCompleteToggle.tsx` & `CelebrationBurst.tsx` (animasi completion
  habit). Drag-reorder (`useDragReorder.ts`) & swipe action
  (`SwipeableRow.tsx`) TETAP PanResponder/Animated API classic, TIDAK
  dimigrasiin — jangan asumsiin "Reanimated udah ada jadi boleh dipake di
  mana aja", ini keputusan per-fitur bukan migrasi arsitektur penuh.
- Build: EAS Build. `eas build --profile development --platform android`
  buat dev client, `--profile preview` buat APK sideload testing,
  `--profile production` buat AAB Play Store (belum pernah dijalanin).
- Widget Android: local Expo module custom di `modules/expo-home-widgets/`
  (Kotlin, Jetpack Glance) — 2 widget (goal balance, habit heatmap).

## Status sekarang (per commit `478d14c "12 ripple drag fix and saweria"`)

Checkpoint "Production Quality" **sebagian besar udah kelar**:

- ✅ App icon baru (jar+checkmark, semua varian Android) — **TAPI lihat
  bagian "Next update" di bawah, mau di-redesign ULANG, icon ini mau dibuang**
- ✅ Signing config (otomatis lewat EAS, gak perlu setup manual)
- ✅ Store listing draft (judul/deskripsi/privacy policy/feature graphic) —
  belum di-submit ke Play Console (perlu akun Google Play Developer $25)
- ✅ Ripple "flash" bug di beberapa komponen — FIXED 2x lewat pendekatan
  beda (lihat technical lessons)
- ✅ Drag-reorder lag + "nyangkut" + lompat-posisi — FIXED
- ✅ GitHub card + Saweria donation card di Settings → Tentang
- ⏭️ ProGuard — **sengaja di-skip**, resiko crash widget custom lebih
  besar dari manfaatnya (app gak ada data sensitif yang perlu diobfuscate)
- ⏭️ Testing — user yang pegang sendiri

## Next update (BELUM DIKERJAIN — rencana ke depan)

Ini list yang dikasih user buat update berikutnya, urutan bebas:

1. Fix widget row lebar — cuma nampilin 5 row, harusnya 14
2. Fix widget kecil — cuma nampilin 5 row, harusnya 7
3. ~~UI update~~ — **SEBAGIAN KELAR di Checkpoint 16**: progress card
   "X dari Y selesai" di Today screen DIHAPUS (redundan visual sama
   kalender yang udah ada di atasnya). Kalau ada UI update lain yang
   kepikiran, ini item bisa dibuka lagi/ditambah.
4. Nambah language switch ke English — **DIMULAI Checkpoint 17**:
   fondasi i18n (`src/i18n/`, `useTranslation()` hook, custom bikinan
   sendiri BUKAN library kayak i18next — biar APK tetep ramping) +
   Settings screen (termasuk `ReminderCard.tsx`) UDAH full ditranslate +
   toggle bahasa udah bisa dipake. **Checkpoint 18: Today screen +
   kalender + history sheet JUGA UDAH full ditranslate** (`app/(tabs)
/index.tsx`, `WeekCalendarStrip.tsx`, `DayHistorySheet.tsx`,
   `HabitCompleteToggle.tsx`). **Checkpoint 19: SEMUA layar habit JUGA
   UDAH full ditranslate** (`app/habit/[id].tsx`, `app/habit/add.tsx`,
   `HabitColorPicker.tsx`, `HabitIconPicker.tsx`, `HabitHeatmap.tsx`).
   **Checkpoint 20: SEMUA layar goal/tabungan + tab bar label JUGA UDAH
   full ditranslate** (`app/goal/[id].tsx`, `app/goal/add.tsx`,
   `app/(tabs)/goals.tsx`, `GoalCard.tsx`, `TransactionRow.tsx`,
   `TabMeta.ts`, `MaterialNavigationBar.tsx`, FAB label di `app/(tabs)
/_layout.tsx`). **TERNYATA gak ada `app/(tabs)/target.tsx`** — tab
   "Target" itu cuma LABEL (dari `TAB_META`/`t.tabs.goals`), route-nya
   tetap `goals.tsx`, bukan file terpisah kayak dugaan checkpoint 19.
   **Checkpoint 22: `app/(tabs)/history.tsx` + notifikasi terjadwal JUGA
   UDAH full ditranslate** — lihat entry di bawah. **MIGRASI I18N INTI
   (semua layar + util JS) SEKARANG LENGKAP.** Satu-satunya yang MASIH
   di luar jangkauan:
   - Widget Android (Kotlin/Jetpack Glance, `modules/expo-home-widgets/`)
     — ini di LUAR jangkauan i18n JS, perlu string resource Android
     terpisah kalau mau ikut ditranslate (belum dikerjain, prioritas
     rendah — widget cuma nampilin angka/heatmap, minim teks)
5. ~~Evaluasi pindah ke `react-native-reanimated`~~ — **KEPUTUSAN UDAH
   DIAMBIL di Checkpoint 14**: user eksplisit minta Reanimated ditambahin
   (buat animasi completion habit, lihat item baru di "Brief history").
   Awalnya SCOPED (Checkpoint 14: cuma buat completion animation,
   `Swipeable` klasik + PanResponder drag-reorder disebut TETAP
   dipertahankan) — scope itu SEMPET DIPERLUAS di Checkpoint 16
   (`SwipeableRow.tsx` pindah ke `ReanimatedSwipeable`) — **TAPI
   DI-REVERT LAGI di Checkpoint 23**: ketauan `ReanimatedSwipeable` di
   GH `2.32.0` (versi yang kepasang SEKARANG) kena bug KONFIRMASI
   upstream (issue #3223 GH) — tombol aksi hasil swipe GAK BISA DI-TEKEN
   sama sekali di Android. Fix resminya (PR #4192) baru merged ke `main`
   16 Juni 2026, TAPI `2.32.0` di-publish 11 Juni 2026 (5 hari SEBELUM
   fix), dan belum ada `2.32.x` patch yang bawa fix itu balik — baru
   masuk di seri v3.x yang PROJECT INI SENGAJA GAK MAU BUMP (belum
   ke-test Expo buat SDK 57). **`SwipeableRow.tsx` SEKARANG BALIK ke
   `Swipeable` klasik lagi** (lihat lesson detail di bawah). Konsekuensi:
   warning deprecation di console balik lagi — COSMETIC doang, gak
   ngaruh ke user, prioritas jauh lebih rendah dari swipe action yang
   beneran jalan. **JANGAN migrasi ulang ke `ReanimatedSwipeable` tanpa
   ngecek changelog GH dulu apa bug #3223 udah kepatch di versi yang mau
   dipake.** PanResponder drag-reorder (`useDragReorder.ts`) MASIH belum
   disentuh — itu keputusan terpisah lagi kalau mau dimigrasiin juga.
6. Tambahain button kecil pilihan bahasa di onboarding biar user bisa langsung milih bahasa (english/indonesia) di awal pertama kali masuk aplikasi.
7. Kita bakal pakai predictive back gesture. supaya kerasa feel material android nya. Layaknya UI Google pixel.
8. Tambahin background di tanda panah kembali/back (tanya dulu ke user mana gambarnya).
9. Tambahin animasi tab bar kayak playstore. (Liat video yang user kirim, tanya dulu mana videonya). Sekalian fix ripple flash nya, masih kotak terang saat tab nya dipencet. 
10. Kita bakal bikin feel aplikasi ini kaya Material UI 3 expresive, layaknya UI Android 17 di Google Pixel. Dari font dan sebagainya. Layaknya aplikasi-aplikasi buatan google.
11. Bikin animasi swipeable kayak di aplikasi Gmail dan Google message, yang dimana kerasa smooth like a butter dan sticky nya enak banget. jangan lupa haptic nya.
12. Use Material-inspired interaction patterns where they improve native familiarity.
13. Buat list nomor 6 - 12. Masukin ke bagian UI update di (list nomor 3).
14. Improvement & scalability biar APK jalan mulus.
15. **Redesign icon app dari NOL** — user eksplisit bilang JANGAN pakai
    desain/warna icon yang sekarang (jar+checkmark lavender/mint), dan
    **JANGAN AI slop** — icon harus representasiin 3 pilar app ini (habits,
    todo, savings) dengan cara yang keliatan niat/dipikirin, bukan generik.
    Icon yang ada sekarang (dibikin Checkpoint 8, SVG vector manual, bukan
    AI-generated) mau DIBUANG TOTAL, bukan di-iterasi. nanti pakai icon-theme skill tapi user hanya punya gemini api key, tanya lagi.
16. Kurangin ukuran APK.

## Brief history (checkpoint-by-checkpoint)

_Sebelum PROJECT_CONTEXT.md ini dibikin (riwayat dari sesi-sesi sebelumnya):_
Migrasi AsyncStorage → expo-sqlite (source of truth, Zustand jadi reactive
cache doang), habit tracker penuh (streak, heatmap ala GitHub, swipe
actions, drag reorder, notifikasi per-habit), Home Screen Widget (Jetpack
Glance — heatmap konsistensi habit & saldo goal), Material 3 Expressive
redesign total (dynamic color dari wallpaper, typography, nav bar, FAB,
motion system — Android doang, iOS gak disentuh), upgrade SDK 54→57
bertahap.

_Checkpoint "Production Quality" (sesi-sesi berikutnya, bernomor):_

- **6** (beberapa sub-item, di-nomorin 6:1 sampai 6:6): fix background putih
  di card Habits & Tugas; fix ripple tab warna aneh pas transisi (root cause
  pertama — `borderless:true` di `android_ripple` MaterialNavigationBar);
  custom reminder time picker (pakai `@expo/ui/community/datetime-picker`,
  native M3 TimePickerDialog Android, BUKAN `@react-native-community
/datetimepicker`); predictive back gesture — **dimatiin** (`predictiveBack
GestureEnabled: false`) karena react-native-screens v4 gak support &
  beresiko break tombol back di Android 16 kalau dinyalain; standarisasi
  empty state (icon MCI + title + deskripsi 1 baris + CTA opsional); ganti
  semua emoji UI (kecuali EmojiPicker & konten `goal.emoji` pilihan user)
  jadi MaterialCommunityIcons.
- **7**: (nomor ini overlap sama poin di atas — lanjutan cleanup emoji→icon)
- **8**: App icon redesign — jar (toples savings) + garis pembatas cairan
  dibikin melengkung kayak checkmark, jadi 1 mark = savings + habits/
  productivity. **Dibikin manual pakai SVG vector (cairosvg), BUKAN AI image
  gen** (user gak punya API key SnapAI). Semua varian: icon, adaptive
  foreground/background/monochrome, notification icon (didesain ULANG
  terpisah jadi checkmark bold doang — versi jar+garis-tipis ilang kalau
  di-render di ukuran asli 24dp status bar), splash icon, favicon.
  **CATATAN: icon ini mau DIBUANG di update berikutnya (lihat "Next
  update"), user gak suka desain/warnanya.**
- **9**: Custom reminder time picker ditambahin juga ke Habit (sebelumnya
  cuma ada di Settings/goal). Fix `react-native-gesture-handler` yang gak
  sengaja ke-upgrade user sendiri ke v3 (`npx expo install`) — diturunin
  balik ke v2.32 karena `Swipeable` klasik dihapus total di v3 dan project
  ini sengaja gak pakai Reanimated.
- **10**: Lint cleanup penuh — 2 rule `react-hooks/refs` &
  `react-hooks/set-state-in-effect` yang sempet didowngrade ke "warn"
  (technical debt checkpoint SDK 56) dibenerin semua (38 kejadian di 13
  file) & di-restore ke `"error"` lagi di `eslint.config.js`.
- **11**: Rename app "tabungan-kertas" → "heibi" (cuma `expo.name`, `slug`
  & `package` SENGAJA gak diubah biar EAS project linking gak rusak). Hapus
  permission `RECORD_AUDIO` yang ternyata gak kepake sama sekali. Draft
  store listing lengkap (judul/deskripsi/privacy policy/feature graphic).
- **12** (dikerjain di SESI CHAT LAIN, bukan sesi yang nulis dokumen ini —
  makanya dokumen ini dibikin, biar gak kejadian lagi): Fix ripple flash di
  4 komponen (`MaterialNavigationBar.tsx`, `Fab.tsx`, `EmptyState.tsx`,
  `Chip.tsx`) pakai pendekatan ripple color alpha 0.12. Restructure BESAR
  `useDragReorder.ts` — root cause lag "nyangkut" ternyata `PanResponder
.create()` dipanggil ULANG tiap render (dipanggil langsung di body render
  tiap item list), bukan cuma buat item yang lagi di-drag — di-cache per
  key sekarang. Sekalian fix bug "item lompat posisi kalau kepencet tanpa
  gerak" — `draggingKey` (state yang mindahin item ke render-order paling
  akhir) ditunda sampai gerakan PERTAMA beneran kejadian di
  `onPanResponderMove`, bukan pas timer long-press doang nyala. GitHub card
  - Saweria donation card ditambahin di Settings.

- **14** (habit completion animation): Nambahin `react-native-reanimated`
  4.5.1 + `react-native-worklets` 0.10.1 (versi persis bundled Expo SDK 57) — SCOPED cuma buat animasi completion habit di Today screen, BUKAN
  migrasi arsitektur penuh (lihat catatan di "Ringkasan project" & lesson
  di bawah). 2 komponen baru: `CelebrationBurst.tsx` (burst radial 6 titik,
  beda dari `CelebrationOverlay.tsx` yang cuma nyala pas SEMUA item hari
  ini kelar — burst ini per-habit) dan `HabitCompleteToggle.tsx` (checkbox
  bulat: icon check pop-in spring, box bounce kecil, burst, haptic Success
  pas complete / Light pas uncomplete — reaktif ke transisi prop `done`,
  bukan ke event press-nya langsung). Dipicu dari kebutuhan yang sama kayak
  spec animasi Mimo, tapi diimplementasi terpisah & disesuaiin ke konvensi
  heibi sendiri (StyleSheet, bukan NativeWind; `useTheme()`/`material3`
  bukan Zustand settings store buat reduced motion — heibi baca
  `AccessibilityInfo` OS langsung lewat `useReducedMotion()` yang emang
  udah ada).

- **15** (kalender + history per tanggal): `WeekCalendarStrip.tsx` di atas
  progress card Today screen — strip 1 minggu (Sen-Min), swipe geser
  minggu pake `Gesture.Pan()` + Reanimated (3 minggu di-buffer sekaligus
  biar transisi nyambung, lihat lesson baru soal `react-hooks/immutability`
  di bawah), label bulan ngikutin hari Kamis minggu yang tampil, "hari ini"
  ditandain lingkaran accent M3 (`material3.primary`) permanen. Tap
  tanggal manapun buka `DayHistorySheet.tsx` (reuse `useSheetMotion` yang
  sama kayak dipake `goal/[id].tsx`) — isinya gabungan habit log + todo
  completed di tanggal itu, diurutin kronologis pake `completedAt` yang
  emang udah ada di DB (gak ada migrasi schema). Nambah 3 util baru di
  `utils/date.ts`: `addDays`, `startOfWeekMonday`, `formatTimeOfDay`.
  **Redesign `JarProgress.tsx` (toples nabung) SEMPET dieksplor pake
  react-native-svg, TAPI di-skip user sebelum ada kode yang kesentuh** —
  masih rounded-rectangle-fill yang lama, belum di-touch sama sekali.

- **16** (UI cleanup + swipeable migration): Progress card "X dari Y
  selesai" + `ProgressBar` di Today screen DIHAPUS (redundan visual sama
  kalender). `totalCount`/`doneCount`/`allDone` computation TETAP ada
  (masih dipakai buat trigger `CelebrationOverlay`), cuma bagian visualnya
  yang dicabut. `ProgressBar.tsx` (komponennya sendiri) SENGAJA gak
  dihapus dari repo, cuma importnya di Today screen — siapa tau kepake
  lagi (misal pas redesign Jar). `SwipeableRow.tsx` pindah dari
  `Swipeable` klasik ke `ReanimatedSwipeable` (import dari subpath
  `react-native-gesture-handler/ReanimatedSwipeable`, default export) —
  GH TETAP v2.32, gak ada version bump. **~~DI-REVERT lagi di Checkpoint
  23~~ karena ternyata kena bug upstream GH yang belum kepatch di 2.32.0
  — lihat entry Checkpoint 23 & lesson di bawah.**
- **17** (i18n foundation): `src/i18n/id.ts` (sumber kebenaran struktur,
  `as const` + `DeepStringify` mapped type buat widen literal jadi
  `string`) + `en.ts` (di-type paksa sama struktur, tsc error kalau ada
  key belum diterjemahin) + `src/i18n/index.ts` (`interpolate()` buat
  `{{placeholder}}`) + `useTranslation()` hook di `src/hooks/`. Custom
  bikinan sendiri, BUKAN i18next/library lain — pertimbangan APK size.
  `useSettingsStore` nambah field `language` (default `"id"`, tabel
  `settings` generic yang emang udah didesain buat diperluas, gak ada
  migrasi schema). Settings screen + `ReminderCard.tsx` full
  ditranslate + toggle bahasa (2 chip) ditambahin di section paling
  atas Settings. **Sisanya (~36 file lain) BELUM disentuh** — lihat
  checklist detail di "Next update" item 4.
- **18** (i18n Today screen): `app/(tabs)/index.tsx`, `WeekCalendarStrip
.tsx`, `DayHistorySheet.tsx`, `HabitCompleteToggle.tsx` full
  ditranslate. Nambah key baru di kamus: `today.*`, `habitToggle.*`,
  `calendar.*`, `dayHistory.*`, plus `common.delete`/`edit`/`archive`
  (dipake berkali-kali lintas file, jadi ditaro di `common` bukan
  diduplikasi per-namespace). `utils/date.ts`: `formatIndonesianDate()` +
  `INDONESIAN_MONTHS` (LAMA, Indonesia-only) DIHAPUS TOTAL — diganti
  `formatLongDate(date, language)` + `MONTHS_BY_LANGUAGE` +
  `WEEKDAYS_SHORT_BY_LANGUAGE` (keduanya `Record<Language, string[]>`).
  TAPI `WEEKDAY_LABELS_SHORT` (short, Indonesia-only) SENGAJA
  DIPERTAHANKAN gak dihapus — masih dipake `app/habit/[id].tsx` yang
  belum dimigrasi, hapus itu bakal break file itu.
- **19** (i18n layar habit): `app/habit/[id].tsx`, `app/habit/add.tsx`,
  `HabitColorPicker.tsx`, `HabitIconPicker.tsx`, `HabitHeatmap.tsx` full
  ditranslate. Nambah namespace `habitDetail.*` & `habitForm.*` di kamus
  (beberapa string DIREUSE dari `reminder.*` yang udah ada — misal
  "Atur sendiri"/"Buka Pengaturan" — bukan diduplikasi, TEKS-nya PERSIS
  sama). `app/habit/add.tsx` yang tadinya punya `WEEKDAY_LABELS` versi
  LOKAL sendiri (gak pernah import dari `utils/date.ts`) sekarang ikutan
  pake `WEEKDAYS_SHORT_BY_LANGUAGE` yang shared. `HabitHeatmap.tsx`
  (dipake di `habit/[id].tsx`) sekarang language-aware lewat parameter
  baru di `buildHeatmapWeeks(weeks, refDate, language)` — TAPI
  `buildHabitConsistencyHeatmap`/`buildHeatmapWeeks` TETAP default
  `language = "id"` karena `HabitConsistencyHeatmap.tsx` (dipake di tab
  History, BELUM dimigrasi) manggil TANPA argumen itu. Setelah checkpoint
  ini, `WEEKDAY_LABELS_SHORT` (versi lama, Indonesia-only) UDAH GAK ADA
  pemakainya sama sekali — DIHAPUS TOTAL dari `utils/date.ts` (beda dari
  checkpoint 18 yang SENGAJA mempertahankannya buat file ini persis).
- **20** (i18n layar goal + tab bar): `app/goal/[id].tsx`,
  `app/goal/add.tsx`, `app/(tabs)/goals.tsx`, `GoalCard.tsx`,
  `TransactionRow.tsx` full ditranslate. Nambah namespace
  `goalsList.*`/`goalCard.*`/`goalDetail.*`/`goalForm.*`/`transaction.*`
  di kamus. **Ketemu bonus scope yang gak kecatet sebelumnya**: label
  tab bar (Hari ini/Target/Histori/Pengaturan) ternyata hardcoded
  terpisah di `TabMeta.ts` (dipake `MaterialNavigationBar.tsx`), BUKAN
  dari `options={{title}}` di `_layout.tsx` (yang itu masih Inggris &
  gak kepake buat display, cuma metadata React Navigation) — nambah
  namespace `tabs.*`. `TabMeta.ts` di-strip field `label`-nya, sekarang
  cuma nyimpen icon; label di-lookup dari `t.tabs[route.name]` langsung
  di `MaterialNavigationBar.tsx`. Sekalian translate FAB accessibility
  label ("Tambah habit baru"/"Tambah goal tabungan baru") di
  `app/(tabs)/_layout.tsx`. `TransactionRow.tsx` (dirender juga di
  `history.tsx` yang BELUM dimigrasi) jadi language-aware lewat
  `useTranslation()` LANGSUNG di komponennya sendiri (bukan default
  parameter kayak util function) — karena dia komponen React beneran,
  otomatis reaktif ke bahasa aktif tanpa perlu "versi lama vs baru"
  kayak kasus util `buildHeatmapWeeks`. Nambah
  `formatTransactionTimestamp(epochMs, language)` di `utils/date.ts`
  (ganti `toLocaleDateString("id-ID", ...)` yang lama, konsisten sama
  alasan hindari Intl/ICU yang udah didokumentasiin).
- **21** (i18n modal title + onboarding): User laporan "Goal Baru"/"Habit
  Baru" gak keikut ke-translate pas buka modal tambah — ternyata itu
  bukan di `app/goal/add.tsx`/`app/habit/add.tsx` (yang udah dimigrasi
  Checkpoint 19-20), tapi di **`app/_layout.tsx`** (ROOT layout, beda
  dari `app/(tabs)/_layout.tsx`), di `<Stack.Screen name="goal/add"
options={{ title: ... }}>` — title header native Stack itu didefinisi
  SEKALI di layout, BUKAN dari dalam screen component-nya, jadi kelewat
  pas nyisir file yang "isinya" goal/habit form. Fix: `RootLayoutContent`
  (yang emang udah komponen function, punya akses hook) manggil
  `useTranslation()` juga, title-nya jadi `t.goalForm.screenTitle`/
  `t.habitForm.screenTitle`. **Note: title ini SAMA baik mode create
  maupun edit** (gak ada dynamic override lewat `setOptions`/nested
  `<Stack.Screen>` di dalem `goal/add.tsx`/`habit/add.tsx`) — itu quirk
  lama yang UDAH ADA dari sebelum i18n, BUKAN bug baru dari checkpoint
  ini, sengaja gak diubah (di luar scope). Sekalian nyisir SEMUA
  `title: "..."` string literal di `app/**/*.tsx` (`grep -rn 'title: "'`)
  buat nemuin kasus serupa yang mungkin keselip — ketemu 1 lagi:
  `app/onboarding.tsx` (4 step title/description + tombol), full
  ditranslate juga (namespace baru `onboarding.*`). Step data yang
  tadinya module-level constant (`FEATURE_STEPS`/`PERMISSION_STEP`)
  DIPINDAH ke dalam komponen (`useMemo` dengan dep `[t]`) karena butuh
  akses hook. `key={s.title}` diganti `key={s.id}` (id stabil per step,
  gak ikut berubah pas ganti bahasa — key yang nempel ke teks
  terjemahan itu rapuh). `(tabs)/_layout.tsx` juga punya beberapa
  `title: "Today"/"Goals"/dst` tapi itu VESTIGIAL (gak pernah
  ditampilkan, custom tab bar pake `TAB_META`/`t.tabs.*` dari checkpoint 20) — sengaja gak disentuh.
- **22** (i18n History tab + notifikasi — MIGRASI I18N INTI SELESAI):
  `app/(tabs)/history.tsx` + `HabitConsistencyHeatmap.tsx` full
  ditranslate (nambah namespace `history.*`), termasuk akhirnya
  ngirim argumen `language` eksplisit ke `buildHabitConsistencyHeatmap`
  (sebelumnya default `"id"` doang dari checkpoint 18-20). Notifikasi
  terjadwal (`src/utils/notifications.ts`) juga full ditranslate —
  `REMINDER_COPY` konstanta lama diganti fungsi `getReminderCopy(domain,
language)` yang narik dari kamus i18n; `scheduleReminder`/
  `scheduleHabitReminder` sekarang terima parameter `language` (default
  `"id"` buat backward-compat, walau SEKARANG UDAH GAK ADA caller yang
  masih ngandelin default itu — semua caller ke-update explicit passing
  language, termasuk 1 caller yang KELEWAT pas nyisir awal:
  `useHabitActions.ts` (`unarchiveWithReschedule`) — ketauan pas
  double-check `grep -rn` caller SETELAH patch pertama, bukan pas
  nulis awal. **PENTING soal notifikasi**: teks-nya "dibekukan" pas
  reminder DIJADWALIN, bukan real-time — kalau user ganti bahasa
  BELAKANGAN, notifikasi yang UDAH terjadwal sebelumnya TETEP pake teks
  bahasa lama sampe di-reschedule ulang (edit jam reminder, atau
  matiin-nyalain lagi). Ini keterbatasan inherent cara kerja scheduled
  notification OS, bukan bug yang perlu difix. **Setelah checkpoint
  ini, migrasi i18n inti (semua layar + util JS) LENGKAP** — sisa cuma
  widget Android (Kotlin/Jetpack Glance) yang di luar jangkauan i18n JS
  sepenuhnya, belum dikerjain, prioritas rendah.

- **23** (revert SwipeableRow ke Swipeable klasik — BUG FIX): User laporan
  tombol aksi hasil swipe (Edit/Arsip/Hapus di Habit, Hapus di Todo) GAK
  BISA DI-TEKEN di Android — nge-reveal tapi `onPress` gak pernah fire.
  Investigasi nemuin ini BUKAN bug di kode project, tapi bug KONFIRMASI
  di upstream `react-native-gesture-handler` (issue #3223, dikonfirmasi
  reproducible di Android): container aksi kiri/kanan `ReanimatedSwipeable`
  itu absolute-fill overlay yang di-animate ke `opacity: 0` pas hidden —
  TAPI di Android, View opacity-0 TETAP nerima sentuhan, jadi sisi yang
  HIDDEN nutupin z-order & nyegat tap yang seharusnya nyampe ke sisi
  keliatan (kejadian walau cuma 1 sisi yang dipake — sisi yang gak
  dipake tetep bikin container kosong yang nyegat, makanya Habit MAUPUN
  Todo sama-sama kena). Fix resminya (PR #4192) merged ke `main` GH 16
  Juni 2026 — TAPI `2.32.0` (versi yang kepasang, PERSIS yang di-bundle
  SDK 57) di-publish 11 Juni 2026, 5 HARI SEBELUM fix itu ada. Dicek ke
  npm registry (`npm view react-native-gesture-handler versions/time`):
  belum ada `2.32.x` patch yang bawa fix ini balik, baru masuk seri v3.x
  yang project ini sengaja gak mau bump (belum ke-test Expo buat SDK
  57). **Keputusan: `SwipeableRow.tsx` DI-REVERT balik ke `Swipeable`
  klasik** (yang emang gak kena bug ini — arsitektur action container-nya
  beda). Konsekuensi: warning deprecation console balik lagi — SENGAJA
  diterima, itu cosmetic doang (gak ngaruh ke user), jauh lebih ringan
  dari swipe action yang beneran gak jalan.

## Hard-won technical lessons

- **JANGAN migrasi ke API/library baru cuma buat nutup DEPRECATION
  WARNING doang, tanpa cek stabilitas versi yang bakal dipake** —
  `ReanimatedSwipeable` (Checkpoint 16) diambil buat nutup warning
  console dari `Swipeable` klasik yang deprecated, TAPI ternyata versi
  yang kepasang (`2.32.0`) punya bug fungsional beneran (tombol gak bisa
  ditekan di Android) yang FIX-nya baru ada di rilis SETELAHNYA. Warning
  deprecation itu COSMETIC (cuma keliatan developer di console/log, gak
  ngaruh ke pengalaman user) — jauh lebih ringan dari REGRESI FUNGSIONAL
  (fitur beneran rusak buat user). Prioritas yang bener: functional
  correctness dulu, baru cosmetic dev-experience. Kalau ke depan nemu
  warning deprecation serupa, JANGAN buru-buru migrasi API baru — cek
  dulu apa versi library yang kepasang SEKARANG (bukan versi terbaru di
  npm) beneran udah stabil buat API baru itu, idealnya cek GitHub issues
  resmi si library buat versi spesifik yang dipake, bukan cuma baca
  dokumentasi API-nya doang.
- **Cara ngecek "apa fix suatu bug library udah ke-publish di versi yang
  kepasang": `npm view <package> versions --json` (list semua versi) +
  `npm view <package> time --json` (tanggal publish tiap versi), terus
  bandingin tanggal publish versi yang kepasang vs tanggal PR fix-nya
  di-merge (dari GitHub, cari issue/PR number-nya)**. Kalau versi
  kepasang di-publish SEBELUM tanggal merge fix, fix itu BELUM ada di
  situ walau kelihatannya udah versi "terbaru yang stabil" — jangan
  asumsi cuma dari nomor versi mayor/minor doang.

- **Setelah migrasi util function ke parameter `language`, WAJIB
  `grep -rn` ULANG buat semua pemanggilnya SEBELUM nganggep checkpoint
  kelar** — checkpoint 22 hampir kelewat 1 caller (`useHabitActions.ts`
  manggil `scheduleHabitReminder` tanpa `language`) karena nyisir awal
  cuma berdasarkan "file mana yang keliatan relevan" (ReminderCard.tsx,
  habit/add.tsx), bukan systematic search ke SEMUA caller. Custom hook
  (`use*.ts` di `src/hooks/`) gampang kelewat karena bukan "layar" atau
  "komponen visual" yang keliatan jelas pas nyisir manual — tapi dia
  PUNYA akses `useTranslation()` (hooks bisa manggil hooks lain), jadi
  harus diperlakukan sama kayak komponen React biasa, bukan plain util.
  Pola yang benar: 1) migrasi util function-nya (tambah parameter
  `language`), 2) `grep -rn "namaFunction("` ke SELURUH codebase, 3) cek
  SATU-SATU tiap hasil match apakah caller-nya perlu diupdate juga.

- **Header title native (`Stack.Screen options.title`) hidup di LAYOUT,
  bukan di layar itu sendiri** — nyisir string buat i18n dengan cara buka
  "layar X" gak cukup kalau X presentation-nya modal/native-stack, karena
  title header-nya bisa didefinisikan sekali di parent layout
  (`app/_layout.tsx`), TERPISAH dari komponen screen (`app/goal/add.tsx`)
  yang isinya form doang. Kalau nyari string hardcoded yang "ilang" padahal
  udah nyisir layarnya, cek dulu SEMUA `_layout.tsx` di sepanjang path
  route-nya (`grep -rn 'title: "' app/`) sebelum nyerah/nganggep udah
  lengkap.

- **Komponen React vs plain util function butuh strategi BEDA pas migrasi
  i18n partial**: util function (`buildHeatmapWeeks`, `formatLongDate`,
  dst) gak punya akses hook, jadi butuh parameter `language` eksplisit +
  default `"id"` biar caller yang belum dimigrasi tetep jalan kayak
  sebelumnya (lihat lesson checkpoint 18). Komponen React (`TransactionRow
.tsx`, `GoalCard.tsx`) BEDA — dia bisa manggil `useTranslation()`
  LANGSUNG sendiri, otomatis dapet bahasa aktif TERKINI, gak butuh
  parameter/default sama sekali. Efeknya: begitu komponen kayak gini
  dimigrasi, dia langsung reaktif ke toggle bahasa DI MANA PUN dia
  dirender — termasuk di layar yang BELUM dimigrasi (`history.tsx`
  render `TransactionRow` yang udah bilingual, sementara teks lain di
  layar itu masih Indonesia doang). Ini BUKAN bug, cuma efek samping
  yang diharapkan dari migrasi bertahap — tapi kalau ketemu layar
  "campuran bahasa" kayak gini pas testing, cek dulu apa itu emang pola
  ini sebelum dianggep salah.

- **Migrasi i18n PARSIAL (per-checkpoint) butuh nge-jaga 2 versi data
  paralel buat sementara**: pas cuma SEBAGIAN file yang dimigrasiin ke
  i18n, konstanta kayak nama hari/bulan gak bisa langsung "diganti" jadi
  language-aware — file yang BELUM dimigrasi (`app/habit/[id].tsx`) masih
  manggil versi LAMA (`WEEKDAY_LABELS_SHORT`, Indonesia-only, hardcoded)
  dan HARUS TETAP ADA sampe file itu sendiri dimigrasiin, kalau enggak
  behavior-nya keubah gak sengaja padahal file itu belum "siap" ganti
  bahasa. Fix-nya: bikin versi BARU yang language-aware
  (`WEEKDAYS_SHORT_BY_LANGUAGE`) buat file yang UDAH dimigrasi, biarin
  versi LAMA tetep ada TERPISAH buat yang belum. Baru dihapus/disatuin
  kalau SEMUA pemakainya udah pindah. Cek dulu SEMUA caller (`grep -rn`)
  sebelum mutusin nge-delete vs nge-rename sebuah export util pas lagi
  migrasi partial kayak gini.

- **`as const` + type widening buat kamus i18n dual-bahasa**: `typeof id`
  (dari objek `as const`) infer LITERAL string type per leaf (misal
  `"Batal"` doang, bukan `string` general) — bikin `en.ts` (yang isinya
  string BEDA, "Cancel") gak lolos type check kalau langsung pake `typeof
id` sebagai type-nya. Fix: mapped type rekursif `DeepStringify<T>` yang
  ganti tiap leaf string jadi `string` generik, TAPI tetep pertahanin
  struktur/nesting key-nya. Ini yang bikin lupa nerjemahin 1 key ke-tangkep
  tsc (struktur dipaksa sama), sementara isinya bebas beda per bahasa.

- **`ReanimatedSwipeable` diimport dari SUBPATH, bukan named export dari
  root package**: `import ReanimatedSwipeable, { SwipeableMethods } from
"react-native-gesture-handler/ReanimatedSwipeable"` (default export,
  BUKAN `import { ReanimatedSwipeable } from "react-native-gesture-
handler"` — itu bakal gagal, gak ke-export dari index utama). Props API-
  nya (`renderLeftActions`/`renderRightActions`, `overshootLeft/Right`,
  `friction`, dst) sama persis kayak `Swipeable` klasik, TAPI callback
  render-nya sekarang terima `(progress: SharedValue<number>, translation:
SharedValue<number>, swipeableMethods: SwipeableMethods)` (Reanimated
  shared values, bukan `Animated.AnimatedInterpolation` dari core RN
  Animated) — aman diabaikan kalau emang gak butuh animasi progress-based
  (kayak dipake di project ini sekarang), tapi kalau nanti mau nambahin
  animasi fade/slide pas aksi ke-reveal, di sinilah tempatnya.

Kumpulan gotcha yang udah ketemu & harus diinget biar gak keulang:

- `--` di dalam komentar XML bikin parse Gradle gagal (ada script validasi
  `ET.parse()` + regex permanen buat ini).
- `ColorProvider(day:, night:)` gak ada di `glance-appwidget:1.1.1`; cuma
  `ColorProvider(Color)` dan `ColorProvider(resId:)` yang valid.
- `GlanceModifier.defaultWeight()` scoped ke `RowScope`, gak bisa dipanggil
  dari composable yang diekstrak kecuali dideklarasiin `fun RowScope
.FunctionName()`.
- `withExclusiveTransactionAsync` (BUKAN `withTransactionAsync`) wajib buat
  write SQLite konkuren yang aman di expo-sqlite.
- `LayoutAnimation.configureNext()` tiap index-crossing pas drag bikin lag
  parah; dihapus bikin reorder instant.
- Android `zIndex` gak reliable buat stacking item yang lagi di-drag;
  render item yang di-drag PALING TERAKHIR di JSX lebih reliable.
- Compose Compiler plugin classpath & versi harus PERSIS sama Kotlin
  version project (2.1.20 buat SDK 54 & 57, dicek dari `libs.versions.toml`).
- SDK 56 butuh migrasi `useFocusEffect` & `BottomTabBarProps` dari
  `@react-navigation/*` ke `expo-router` equivalent, `@react-navigation/*`
  dihapus total dari `package.json`.
- `fontFamily: "sans-serif-medium"` + `fontWeight` eksplisit bikin Android
  synthesize fake bold → text kepotong di container sempit (nav bar).
- **`useRef(...).current` buat `Animated.Value` kena lint
  `react-hooks/refs`** — ganti `useState(() => new Animated.Value(x))[0]`.
  Ini udah jadi KONVENSI TETAP di project ini, dipakai konsisten di semua
  komponen animasi baru.
- **`android_ripple={{ borderless: true, radius: N }}` di Pressable yang
  bounds-nya JAUH lebih gede dari radius-nya** (misal flex:1 tab item ~90px
  tinggi dikasih radius:32) bikin ripple/flash keliatan gak wajar, nongol
  di luar bentuk visual yang dimaksud — root cause PERTAMA dari bug "flash
  aneh pas nekan tombol". Fix pertama: `borderless: false`.
- **TAPI bug flash itu ternyata punya root cause KEDUA yang lebih luas**:
  `borderRadius` di style TANPA `overflow: "hidden"` bikin Android ripple
  clip ke bounding-box PERSEGI (bukan ke bentuk rounded-nya) — beberapa
  komponen (`Chip.tsx`, `Fab.tsx`, row Habit/Todo, `weekdayChip`) kena ini.
  **PENTING: 2 sesi chat beda-beda nemuin & mikirin root cause yang beda
  buat bug yang SAMA** (satu pendekatan `overflow:hidden`, satu lagi
  pendekatan ripple color alpha 0.12) — kemungkinan keduanya valid/saling
  melengkapi, tapi belum ke-cross-check. Kalau nemu bug flash serupa lagi,
  cek KEDUA kemungkinan ini.
- **Root cause drag-reorder lag/nyangkut**: `getHandlePanResponder(item)`
  dipanggil LANGSUNG di body render tiap item list (bukan di-memo) — pas
  drag aktif, `setOrder()` di `onPanResponderMove` trigger re-render list,
  yang manggil ulang `getHandlePanResponder` buat SEMUA item lagi (bukan
  cuma yang di-drag) → bikin `PanResponder.create()` BARU dari nol puluhan
  kali per detik. Fix: cache `PanResponder` per item key di dalam hook
  (`panResponderCacheRef`), baca `itemHeight`/`onReorderCommit`/
  `keyExtractor` TERBARU lewat ref (bukan closure langsung) biar cache gak
  perlu di-invalidate walau parent gak nge-`useCallback` callback-nya.
- **`cairosvg` (Python) butuh atribut `maskUnits`/`x`/`y`/`width`/`height`
  EKSPLISIT di elemen `<mask>`** — kalau gak, hasil masking BLANK TOTAL
  (bukan error, cuma silent fail). Ketemu pas bikin notification icon.
- Pola **"adjusting state during render"** (setState dipanggil LANGSUNG di
  body render, dijaga guard biar cuma jalan sekali per transisi) adalah
  cara resmi React buat ngehindarin `react-hooks/set-state-in-effect`
  tanpa kehilangan behavior — dipakai buat populate form edit mode
  (`goal/add.tsx`, `habit/add.tsx`) dan buat animasi masuk/keluar
  (`UndoSnackbar.tsx`, `useSheetMotion.ts`).
- Kadang linter false-positive nge-flag `useMemo`/`Animated.event` yang DI
  DALEMNYA ada ref, padahal ref itu cuma keakses di callback event beneran
  (bukan pas render/factory function jalan) — solusinya `eslint-disable`
  dengan komentar jelas KENAPA aman, bukan restructure paksa.
- **Expo SDK 57 masih bundle `react-native-gesture-handler` v2.32, BUKAN
  v3** — kalau `npx expo install`/`expo doctor` nge-bump ke v3, itu BUG,
  bukan upgrade yang bener. `Swipeable` klasik dihapus total di v3, cuma
  `ReanimatedSwipeable` yang sisa (butuh `react-native-reanimated` yang
  SENGAJA gak dipakai project ini).
- `@expo/ui` itu native module (Jetpack Compose beneran), BUKAN library JS
  — nambah dependency ini butuh REBUILD dev client (`eas build --profile
development`), gak cukup reload JS bundle doang.
- **Reanimated `useSharedValue().value = x` mutation AMAN dari
  `react-hooks/set-state-in-effect`** (bukan React state, gak nge-trigger
  re-render) — TAPI kalau di useEffect yang sama juga ada `setState` biasa
  (React) buat trigger sesuatu (misal token buat re-mount celebration
  effect), `setState` itu TETAP kena rule yang sama kayak Animated API
  classic. Fix-nya pola "adjusting state during render" yang SAMA persis
  kayak `UndoSnackbar.tsx` (`trackedDone` dibandingin ke prop tiap render,
  setState dipanggil LANGSUNG di body kalau beda) — bukan pindahin ke
  effect terpisah atau di-disable. Reanimated gak ngubah aturan lint ini
  sama sekali, cuma nambah kemungkinan orang lupa karena kelihatannya "kan
  udah di dalem effect yang sama".
- Expo SDK 57 punya known issue Android memory naik 25-30% gara-gara
  Hermes V1 + Reanimated (ke-trigger cuma dari IMPORT library-nya, dipake
  atau enggak). Workaround resminya "Worklets Bundle Mode" masih
  eksperimental (butuh `babel.config.js` + `metro.config.js` custom, ada
  known bug kalau dipadu resolver yang nge-remap `react-native`) — SENGAJA
  DISKIP di Checkpoint 14, belum di-enable. Kalau nanti crash/lag terkait
  memory Android muncul, ini kandidat pertama buat dicek.
- **`react-hooks/immutability` (React Compiler) false-positive KEDUA yang
  ketemu** (Checkpoint 15, `WeekCalendarStrip.tsx`): shared value
  Reanimated yang di-RESET di `useEffect` (buat sinkronin ulang abis
  commit state React, pola yang sama kayak di lesson `set-state-in-effect`
  atas) DAN di-drive live di gesture worklet (`Gesture.Pan().onUpdate`/
  `.onEnd`) ke-flag "cannot be modified" di KEDUA tempat — beda dari kasus
  `HabitCompleteToggle`/`CelebrationBurst` (Checkpoint 14) yang cuma
  mutasi 1 shared value di 1 useEffect doang, gak pernah kena ini. Ini
  BUKAN kasus yang bisa direstructure ke pola "adjusting state during
  render" (beda dari `set-state-in-effect` yang punya solusi restructure
  bersih) — kompiler-nya genuinely kebablasan nganggep SEMUA shared value
  yang nongol di useEffect manapun harus immutable selamanya, padahal
  Reanimated shared value bukan React state. Fix: `react-hooks/immutability:
"off"` di-scope KHUSUS ke file yang butuh (`eslint.config.js`, blok
  `files: [...]` terpisah dengan komentar jelas) — BUKAN disable global.
  Kalau nemu file lain yang kena pola sama (shared value di-reset via
  effect + di-drive di gesture worklet), tambahin nama filenya ke array
  `files` yang udah ada, jangan bikin override rule baru yang beda.

## Workflow conventions (WAJIB diikuti)

- **Selalu `git clone` fresh + `git log --oneline -10` sebelum bikin patch
  baru** — histori commit sering lebih maju dari yang keliatan, APALAGI
  sekarang udah kebukti ada RESIKO NYATA sesi chat lain push duluan tanpa
  sepengetahuan sesi ini (checkpoint 12 kejadian gini).
- Semua perubahan dikirim sebagai `.patch` file (git diff format,
  `git apply`-able), BUKAN full file content atau download per file.
  User lebih suka **1 patch gabungan** kalau ngerjain beberapa item
  sekaligus, kecuali diminta pisah.
- `package-lock.json` SERING punya noise (beda versi npm sandbox vs punya
  user — field kayak `"libc"` di optionalDependencies) — cek dulu isi
  diff-nya, exclude dari patch kalau emang cuma noise, instruksiin user
  `npm install` sendiri abis apply.
- Validasi WAJIB sebelum kasih patch: `npx tsc --noEmit` bersih, `npx
eslint .` (scan SELURUH project, bukan per file) 0 warning 0 error,
  `git apply --check` di clone fresh terpisah buat mastiin patch beneran
  applicable.
- Sandbox gak bisa akses `api.expo.dev` (Maven/expo-doctor beneran), jadi
  gak bisa jalanin `expo-doctor` atau Gradle asli — validasi cuma lewat
  tsc/eslint/JSON-parse/patch-apply-check.
- Kalau nemu resiko/temuan yang bisa ngubah arah keputusan signifikan
  (contoh: predictive back gesture ternyata bahaya, ProGuard beresiko
  crash widget, gesture-handler ke-upgrade gak sengaja) — **STOP dulu,
  jelasin temuannya, baru tanya arah yang dipilih** — jangan asal jalanin
  permintaan awal kalau ternyata ada konsekuensi besar yang belum
  kepertimbangin.

## Link penting

- Repo: `https://github.com/karimm1620/heibi`
- Donasi: `https://saweria.co/immu`
