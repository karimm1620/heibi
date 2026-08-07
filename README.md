# heibi

**heibi** adalah aplikasi tabungan, habit tracker, dan perencana harian jadi satu — sederhana, minimalis, dan sepenuhnya offline. Gak perlu akun, gak ada iklan, semua data tersimpan langsung di perangkatmu.

Didesain dengan Material 3 Expressive (Material You) — warna aplikasi otomatis menyesuaikan dengan wallpaper Android kamu.

## Download

Download sekarang di **[GitHub Releases](../../releases)**.

> Jika muncul peringatan keamanan (Play Protect), pilih **"Install Anyway" / "Tetap Instal"** (ini normal karena aplikasi belum di-publish ke Google Play Store).

## Fitur

**Tabungan**
- Bikin goal tabungan sebanyak yang kamu mau — nama, target nominal, gambar/emoji
- Progres divisualisasikan lewat animasi jar (toples) yang terisi seiring tabungan bertambah
- Catat nabung & tarik kapan saja, lengkap riwayat transaksinya
- Widget home screen untuk pantau saldo goal tanpa buka app

**Habit tracker**
- Bikin kebiasaan harian atau di hari tertentu saja
- Lacak streak & lihat konsistensi lewat heatmap ala GitHub
- Reminder per-habit, jam bisa diatur sendiri (termasuk waktu custom, bukan cuma preset)
- Widget home screen untuk heatmap konsistensi harian

**Perencana harian**
- Catat tugas harian langsung di layar utama
- Semua habit & tugas hari ini terkumpul dalam satu tampilan "Hari ini"

**Lainnya**
- Fully offline, tanpa login/akun, tanpa tracking/analytics
- Export & import backup manual — kamu pegang kendali penuh atas data
- Dark mode mengikuti tema perangkat
- Undo setelah menghapus goal/habit/tugas

## Tech Stack

| Teknologi | Digunakan untuk |
| --------- | ---------------- |
| Expo (React Native) + Expo Router | Framework & navigasi |
| TypeScript | Bahasa pemrograman |
| expo-sqlite | Database lokal (source of truth) |
| Zustand | State management (reactive cache di atas SQLite) |
| expo-notifications | Reminder |
| @expo/ui | Native Material 3 time picker (Android) |
| @pchmn/expo-material3-theme | Dynamic color (Material You) |
| expo-image-picker | Memilih gambar goal |
| Local Expo Module (Kotlin, Jetpack Glance) | Home screen widget Android |
| Animated API | Animasi |

Android-only (fokus pengembangan saat ini). EAS Build untuk development/preview/production build.

## Struktur Project

```text
app/
  _layout.tsx
  onboarding.tsx
  (tabs)/
    _layout.tsx
    index.tsx        # Hari ini — habit & tugas harian
    goals.tsx         # Daftar goal tabungan
    history.tsx        # Riwayat transaksi
    settings.tsx       # Pengaturan & tentang
  goal/
    add.tsx
    [id].tsx
  habit/
    add.tsx
    [id].tsx

src/
  components/   # Komponen UI reusable
  hooks/        # Custom hooks (drag reorder, sheet motion, dll)
  store/        # Zustand stores
  db/           # SQLite client, schema, migrasi
  theme/        # Material 3 theming
  types/
  utils/
  widgets/      # Snapshot data untuk home screen widget

modules/
  expo-home-widgets/   # Local Expo module (Kotlin) untuk widget Android
```

## Development

```bash
npm install
npx expo start
```

Build development client / preview / production lewat EAS Build:

```bash
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform android
```

## Dukung Project Ini

Kalau heibi bermanfaat buat kamu, boleh banget traktir kopi lewat **[Saweria](https://saweria.co/immu)** ☕

## License

[MIT License](./LICENSE).
