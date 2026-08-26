// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*'],
  },
  {
    // Checkpoint 15: react-hooks/immutability (React Compiler) false-positive
    // -- shared value Reanimated yang di-reset di useEffect (buat sinkronin
    // ulang abis commit state React) DAN di-drive live di gesture worklet
    // (Gesture.Pan onUpdate/onEnd) ke-flag "cannot be modified", walau
    // mutasinya kejadian di context yang beda-beda (worklet UI-thread vs
    // effect callback JS-thread), bukan pas render. Shared value Reanimated
    // BUKAN React state -- kompiler-nya kebablasan nganggep dia kudu
    // immutable kayak props/state biasa begitu ke-refer di SATU useEffect
    // manapun. Kasus yang sama persis udah ketemu di project Mimo juga.
    // Di-scope CUMA ke file yang genuinely butuh pola ini (gesture-driven
    // shared value + reset via effect), BUKAN didisable global -- kalau
    // nemu file lain yang kena ini juga, tambahin ke `files` di sini,
    // jangan taro rule override baru yang berbeda.
    files: [
      'src/components/DragReorderRow.tsx',
      'src/components/WeekCalendarStrip.tsx',
      'src/hooks/useDragReorder.ts',
    ],
    rules: {
      'react-hooks/immutability': 'off',
    },
  },
]);
