<p align="center">
  <img src="./assets/images/android-icon-foreground.png" alt="Heibi" width="120" />
</p>

<h1 align="center">Heibi</h1>

<p align="center">
  Habit tracker, tabungan, dan perencana harian dalam satu aplikasi Android yang sederhana, personal, dan sepenuhnya offline.
</p>

<p align="center">
  <a href="../../releases"><strong>Download</strong></a>
  ·
  <a href="#fitur"><strong>Fitur</strong></a>
  ·
  <a href="#development"><strong>Development</strong></a>
</p>

<p align="center">
  <img alt="MIT License" src="https://img.shields.io/badge/License-MIT-2ea44f?style=flat-square" />
  <img alt="Expo SDK 57" src="https://img.shields.io/badge/Expo-SDK%2057-000020?style=flat-square&logo=expo" />
  <img alt="Android" src="https://img.shields.io/badge/Platform-Android-3DDC84?style=flat-square&logo=android&logoColor=white" />
  <img alt="Offline first" src="https://img.shields.io/badge/Data-Offline--first-555?style=flat-square" />
</p>

<p align="center">
  <img alt="Onboarding" height="340" src="./banner/onboarding.png" />
  <img alt="Habit" height="340" src="./banner/habit-screen.png" />
  <img alt="Calendar" height="340" src="./banner/calendar.png" />
  <img alt="Saving" height="340" src="./banner/saving-screen.png" />
  <img alt="History" height="340" src="./banner/history-screen.png" />
</p>

## Tentang Heibi

Heibi dibuat untuk membantu mengatur hal-hal kecil yang dilakukan setiap hari tanpa harus memisahkannya ke banyak aplikasi.

Kamu bisa melacak kebiasaan, mencatat tugas harian, dan mengelola goal tabungan dalam satu tempat. Tidak perlu membuat akun, tidak ada iklan, dan data utama tetap tersimpan secara lokal di perangkat.

Antarmukanya mengikuti arah **Material 3 Expressive** dengan dukungan **Material You dynamic color**, typography Roboto Flex, bentuk organik, motion, haptic feedback, serta komponen native Android ketika memang dibutuhkan.

## Fitur

### Habit tracker

- Habit harian maupun habit pada hari tertentu.
- Streak dan heatmap untuk melihat konsistensi.
- Reminder per habit dengan waktu yang bisa dikustomisasi.
- Swipe action untuk edit, arsip, dan hapus.
- Reorder habit langsung dari daftar.
- Haptic feedback dan motion yang tetap sederhana.
- Home screen widget untuk melihat konsistensi tanpa membuka aplikasi.

### Goal tabungan

- Buat banyak goal dengan nama, target nominal, gambar, atau emoji.
- Catat transaksi deposit dan withdraw.
- Riwayat transaksi untuk setiap goal.
- Visual progress lewat saving jar yang ikut terisi sesuai progres.
- Filter dan sorting goal.
- Home screen widget untuk melihat progres tabungan.

### Today

- Habit dan tugas hari ini dikumpulkan dalam satu layar.
- Tambah dan kelola tugas harian dengan cepat.
- Drag & drop untuk menyusun ulang item.
- Fokus ke aktivitas yang relevan untuk hari itu saja.

### History & data

- Riwayat aktivitas dan transaksi yang dikelompokkan berdasarkan hari.
- Penyimpanan lokal menggunakan SQLite sebagai source of truth.
- Export dan import backup manual.
- Undo untuk beberapa aksi destruktif seperti penghapusan item.
- Tidak membutuhkan akun atau koneksi internet untuk penggunaan utama.

### Personalization

- Bahasa Indonesia dan English.
- Light, dark, dan system theme.
- Material You dynamic color pada Android yang mendukungnya, dengan fallback palette untuk perangkat lain.
- Adaptive icon dan monochrome icon Android.
- Notification icon yang mengikuti kebutuhan sistem Android sambil mempertahankan accent Heibi.

## Prinsip desain

Heibi tidak mencoba menaruh efek visual di setiap permukaan. Material yang lebih ekspresif dipakai terutama pada navigation, controls, motion, shapes, dan interaction states, sementara konten utama tetap mudah dibaca.

Arah visual project menggabungkan:

- Material 3 Expressive.
- Material You / dynamic color.
- Contextual material treatment yang terinspirasi dari Liquid Glass, bukan glassmorphism pada seluruh kartu.
- Organic shapes seperti CookieShape dan WaveShape.
- Native-feeling interaction dengan touch target, haptic, motion, dan accessibility yang tetap diperhatikan.

## Tech stack

| Teknologi | Peran |
| --- | --- |
| Expo SDK 57 | Application framework dan native tooling |
| React Native 0.86 | Android UI runtime |
| Expo Router | File-based navigation |
| TypeScript | Type-safe application code |
| expo-sqlite | Local database / source of truth |
| Zustand | Reactive application state di atas SQLite |
| react-native-gesture-handler | Swipe dan gesture interactions |
| react-native-reanimated | Motion dan interaction animation |
| react-native-svg | Custom Material Expressive shapes |
| @pchmn/expo-material3-theme | Android Material You dynamic colors |
| expo-notifications | Local reminders dan notification handling |
| @expo/ui | Native Android UI ketika dibutuhkan |
| Jetpack Glance | Android home screen widgets melalui local Expo module |
| Roboto Flex | Application typography |
| Jest | Unit dan behavior tests |
| EAS Build | Development, preview, dan production Android builds |

Saat ini pengembangan dan validasi utama Heibi berfokus pada **Android**.

## Struktur project

```text
app/
├── _layout.tsx
├── onboarding.tsx
├── (tabs)/
│   ├── _layout.tsx
│   ├── index.tsx
│   ├── goals.tsx
│   ├── history.tsx
│   └── settings.tsx
├── goal/
│   ├── add.tsx
│   └── [id].tsx
└── habit/
    ├── add.tsx
    └── [id].tsx

src/
├── components/   # Reusable UI components
├── hooks/        # Gesture, reorder, motion, dan application hooks
├── store/        # Zustand stores
├── db/           # SQLite client, schema, dan migrations
├── theme/        # Colors, typography, shapes, motion, surfaces
├── i18n/         # Bahasa Indonesia dan English
├── types/
├── utils/
└── widgets/      # Data bridge untuk Android home screen widgets

modules/
└── expo-home-widgets/   # Local Expo module + Jetpack Glance

plugins/
├── withAndroidApkSize.js
└── withDynamicNotificationColor.js
```

## Development

### Requirements

- Node.js
- npm
- Expo / EAS CLI sesuai workflow yang digunakan
- Android device atau development environment yang kompatibel

Clone repository lalu install dependency:

```bash
git clone https://github.com/karimm1620/heibi.git
cd heibi
npm install
```

Untuk dependency Expo / React Native baru, gunakan Expo installer supaya versinya tetap sesuai dengan SDK:

```bash
npx expo install <package-name>
```

Setelah mengubah dependency atau native configuration, jalankan pemeriksaan kompatibilitas:

```bash
npx expo-doctor
```

Jalankan Metro development server:

```bash
npx expo start
```

Quality checks:

```bash
npm run lint
npm test
```

### EAS Build

```bash
eas build --profile development --platform android
eas build --profile preview --platform android
eas build --profile production --platform android
```

Development dan preview build menggunakan internal distribution, sedangkan production profile menggunakan auto-increment versioning.

## Download

Build publik tersedia melalui **[GitHub Releases](../../releases)**.

Heibi belum bergantung pada Google Play sebagai jalur distribusi utama, jadi Android dapat menampilkan peringatan saat memasang APK dari luar Play Store. Pastikan file yang kamu pasang berasal dari release repository ini.

## Privacy

Heibi dirancang offline-first dan penggunaan utamanya tidak membutuhkan login maupun akun cloud. Data aplikasi disimpan lokal di perangkat, sementara backup dilakukan secara manual oleh pengguna.

## Kontribusi

Heibi adalah project yang terus dikembangkan. Issue dan pull request boleh digunakan untuk melaporkan bug, mendiskusikan improvement, atau mengusulkan perubahan yang tetap selaras dengan arah project.

Sebelum mengirim perubahan besar, sebaiknya buka issue atau discussion context terlebih dahulu supaya implementasinya tidak bertabrakan dengan keputusan desain dan arsitektur yang sedang dipakai.

## Support

Kalau Heibi bermanfaat dan kamu ingin mendukung pengembangannya, kamu bisa traktir kopi lewat **[Saweria](https://saweria.co/immu)**.

## License

Heibi tersedia di bawah [MIT License](./LICENSE).

Copyright © 2026 Abdul Karim Sulaeman.
