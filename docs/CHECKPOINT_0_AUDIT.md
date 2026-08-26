# heibi — Checkpoint 0 Audit

Audit date: 2026-08-26
Audited remote `main`: `33ceb2f3bf49beda735402eb2bd03f4309455d88`

This is a source and architecture audit. It intentionally does not redesign
screens or claim device-level visual/performance verification.

## Baseline

- Expo `~57.0.14`, React Native `0.86.2`, React `19.2.3`.
- Android-only Expo prebuild project with a local Kotlin Expo module.
- New Architecture is enabled in generated Android configuration.
- App version is synchronized at `2.5.5` in `package.json` and `app.json`.
- CI and the Gesture Handler + Reanimated drag-reorder checkpoint are present.
- The working tree contained user-owned untracked instructions, docs, and
  local skills before this audit; they were preserved.

Baseline validation before the audit edit:

| Check | Result |
|---|---|
| `npx tsc --noEmit` | pass |
| `npx eslint .` | fail: local `.agents` tooling and generated `.expo` files were inside the lint scope |
| `npx eslint app src modules plugins` | pass |
| `npx jest` | pass: 6 suites, 80 tests |
| `npx expo export --platform android` | pass: 5.1 MB Hermes bundle; this is not an APK-size measurement |
| release APK | unavailable: this host has no Java runtime or `JAVA_HOME` |

The checkpoint patch excludes `.agents`, `.codex`, and generated `.expo`
content from ESLint so the mandated root command measures application code.

## Audit health score

| Dimension | Score | Key finding |
|---|---:|---|
| Accessibility | 3/4 | Labels and states are common, but several compact controls do not prove a 48 dp target and nav motion ignores reduced motion. |
| Performance | 2/4 | Drag reorder is UI-thread driven, but growing Today/Goals lists use `ScrollView`, and custom sheet/swipe paths retain JS/core-Animated work. |
| Appearance and theming | 2/4 | M3 dynamic color and type tokens exist; a semantic dual-theme contract and persisted visual-theme choice do not. |
| Android conformance | 3/4 | Insets, system Back for modals, Material roles, and Android-native widgets are present; custom sheet behavior and some 40–44 dp controls remain. |
| Adaptivity | 1/4 | The app is portrait-locked and has no window-size-class/tablet/foldable strategy. |
| **Total** | **11/20** | **Acceptable; foundation is usable but the overhaul is still material.** |

No P0 issue was found. Device screenshots, TalkBack traversal, large-font
layouts, launcher widget resize behavior, and release frame timing were not
available on this host, so those remain unverified rather than passed.

## Theme and token inventory

Current flow:

```text
Android light/dark
  -> @pchmn/expo-material3-theme
    -> mapMaterial3ToThemeColors
      -> AppTheme colors + 7 semantic typography aliases + M3 scheme
        -> components/screens
```

Existing sources of truth:

- `src/theme/useTheme.ts`: current theme hook and `AppTheme` contract.
- `src/theme/colors.ts`: app color aliases, fixed financial/accent colors,
  spacing, legacy radius scale, and opacity helpers.
- `src/theme/material3/colors.ts`: Material You fallback seed and color-role
  mapping.
- `src/theme/material3/tokens.ts`: M3 shapes, elevation, and motion.
- `src/theme/material3/typography.ts`: Roboto Flex and the M3 type scale.

The current `AppTheme` is M3-specific because it exposes `material3` directly.
There is no `VisualTheme`, no Liquid adapter, and no visual-theme persistence.
Checkpoint 1 should introduce a shared semantic contract above both visual
languages while retaining explicit access to M3 roles inside the adapter.

Candidate drift scan across 12,933 TypeScript/TSX source lines:

| Category | Candidates outside `src/theme` | Rate per 100 lines | Interpretation |
|---|---:|---:|---|
| raw color syntax | 20 | 0.2 | mostly intentional picker/accent colors and fixed white foregrounds; centralize semantics, do not mechanically replace |
| raw `fontSize` | 21 | 0.2 | isolated legacy/type-role escapes, worst in calendar, goal/jar, and top-bar UI |
| raw spacing declarations | 19 | 0.1 | low numerical drift; component structure is the larger issue |
| all `borderRadius` declarations | 56 | 0.4 | mostly token-backed; remaining literal heatmap/circle geometry needs classification |
| legacy shadow/elevation outside theme | 2 | <0.1 | Today and active drag-row elevation; the central M3 helper also emits legacy shadow props |

These are candidates, not automatic defects. Habit picker colors, data-driven
habit colors, cell radii, and optical nudges are legitimate local values.

## Shared component map

| Role | Current implementation | Audit result |
|---|---|---|
| surface/card | `GlassCard` | It is an opaque M3 tonal/elevated surface despite its name. Keep as a compatibility wrapper over a future semantic surface or migrate incrementally. |
| chip | `Chip` plus multiple screen-local chips | Shared chip has selected semantics; reminder/language/filter chips still drift in contracts and touch treatment. |
| button | screen-local implementations | No shared variant/size/state contract; Settings, alerts, onboarding, and forms duplicate button structure. |
| FAB | `Fab` | Geometry and route logic are centralized; motion uses core `Animated` and lacks reduced-motion handling. |
| navigation | `FloatingTabBar` -> `MaterialNavigationBar` | One routing implementation and stable 80 dp geometry. Theme dispatch does not exist yet. |
| alert | `AppAlert` | Centralized visual alert, but actions lack explicit accessibility roles/states and use core `Animated`. |
| snackbar | `UndoSnackbar` | Centralized and reduced-motion aware; offset is coupled to FAB and tab constants. |
| sheet | `DayHistorySheet` and goal detail + `useSheetMotion` | Custom `Modal` + `PanResponder` + core `Animated`; migrate only after the SDK 57 `@expo/ui` behavior is proven against needed content/gesture semantics. |
| empty/loading | `EmptyState`, local activity indicators | Empty state is shared; no unified loading shell. |

Priority extraction is semantic surface, then button/row contracts, then
selected/press state. Avoid a repository-wide rename-only conversion.

## Navigation, motion, and interaction

Positive findings:

- peer tabs switch immediately; no whole-screen horizontal tab animation.
- FAB and snackbar derive from shared tab-bar geometry.
- drag reorder uses Gesture Handler, Reanimated shared values, UI-thread
  transforms, velocity-aware springs, and commits React/SQLite only at the
  gesture boundary.
- reduced motion is observed by root navigation, sheets, alerts, snackbar,
  calendar motion, onboarding, and celebrations.

Remaining issues:

- Material navigation creates one core `Animated.Value` per tab and springs on
  every selection; it has no reduced-motion branch.
- `useSheetMotion` is finger-driven through `PanResponder` and mutates a core
  `Animated.Value` during the gesture. This does not regress drag reorder, but
  it is not the target sheet architecture.
- `SwipeableRow` intentionally uses the classic RNGH `Swipeable` because the
  installed SDK-compatible Reanimated implementation has an Android action
  hit-testing regression recorded in source comments. Do not replace it
  without reproducing the upstream fix on the installed SDK.
- Today and Goals render user-growing collections inside `ScrollView`; this is
  a future virtualization/performance concern, not a proven crash.

## Accessibility and adaptivity

Positive findings:

- most pressables expose roles, labels, and selected/checked state.
- drag handles expose an adjustable role and descriptive labels.
- alerts/success overlays use semantic announcements where implemented.
- safe-area insets are handled for tab chrome and full-screen content.

Verified gaps:

- 36 dp calendar/color controls with 4 dp hit slop yield 44 dp, below the
  Android 48 dp target.
- language chips, About rows, and some text-only actions do not enforce a
  minimum 48 dp target.
- AppAlert action pressables do not explicitly expose button roles/labels.
- portrait orientation is locked and no width-class adaptation exists.

## Settings persistence

The generic SQLite `settings(key, value)` table is suitable for the visual
theme and requires no schema migration. The setting still needs strict value
validation: malformed JSON or an unknown string must fall back to `material3`
instead of being cast blindly. The existing hydrate flow can load the theme in
parallel with reminder, onboarding, and language settings.

Required Checkpoint 1 tests:

- absent key -> `material3`;
- valid persisted `liquid` hydrates;
- malformed/unknown stored value -> `material3`;
- setter persists before updating in-memory state;
- live semantic adapter changes without restarting or forking screens.

## Widget pipeline

Verified path:

```text
Zustand stores after SQLite-backed hydration/mutation
  -> buildWidgetSnapshot
    -> debounced syncWidgetSnapshot
      -> HomeWidgets Expo module
        -> widget_snapshot.json
          -> WidgetSnapshotReader
            -> HeatmapWidget + GoalBalanceWidget (Jetpack Glance)
```

Repository facts that supersede the unchecked plan:

- the snapshot already sends exactly 14 days per active habit;
- the native heatmap distributes those 14 cells horizontally with Glance
  weights;
- up to 8 habit rows are sent, while visible row count is height-dependent;
- horizontal and vertical resize are enabled and explicit maximum resize
  bounds exist;
- a goal-balance savings widget already exists.

Therefore the reported “about 14 units” must be reproduced on a launcher
before changing dimensions. The likely axes must not be conflated: 14 is the
horizontal day count, while vertical rows are habits. Also verify date rollover
while the app stays closed: hourly widget redraw currently reuses the last JSON
snapshot and does not rebuild its date window. Snapshot generation currently
has no focused Jest coverage.

Checkpoint 9 must clarify whether “new savings widget” means a new variant or
an overhaul of the existing GoalBalance widget.

## `@expo/ui` audit

`@expo/ui` is already installed and used for the Android date-time picker.
Expo SDK 57 also provides a universal `BottomSheet` backed by Compose
`ModalBottomSheet`. On Android its supported resting states are effectively
half/full; arbitrary fraction/height points snap to those states. This is a
strong candidate for Checkpoint 6, but must first prove:

- scrolling content and IME behavior;
- Android Back and scrim dismissal;
- coexistence with horizontal swipe and reorder gestures;
- theming limits for both visual languages.

Reference: https://docs.expo.dev/versions/v57.0.0/sdk/ui/universal/bottomsheet/

## Material and Liquid research

Material 3 official guidance describes color, typography, and shape as the
theme subsystems and includes Material You dynamic color. The existing M3
foundation aligns structurally, but component/state centralization is still
incomplete.

Reference: https://developer.android.com/develop/ui/compose/designsystems/material3

Apple's official material guidance says Liquid Glass belongs mainly in a
distinct functional layer for controls/navigation, should not fill the content
layer, and should be used sparingly with legibility adaptation. This supports
heibi's selective navigation/chrome direction; it is design reference only.

References:

- https://developer.apple.com/design/human-interface-guidelines/materials
- https://developer.apple.com/documentation/technologyoverviews/liquid-glass

Convx high-level findings:

- it is a native Jetpack Compose app with project minimum Android API 26;
- its Liquid effect captures pixels into a shared backdrop and samples,
  blurs, and refracts them from source-vendored Compose drawing code;
- the project is GPL-3.0, while heibi is MIT.

Reference: https://github.com/cosmictaserdev-creator/Convx

Do not copy Convx source into heibi or treat its Android 8 floor as proof that
the same renderer is acceptable here. The future feasibility spike must choose
between an original minimal renderer, a separately licensed dependency, or a
tonal/no-blur fallback and then measure release performance, API coverage, and
APK delta.

## Prioritized findings

1. **P1 — semantic theme architecture:** add validated persistence and a shared
   theme adapter before screen redesign. Suggested command: `$impeccable harden`.
2. **P1 — Liquid licensing/native trade-off:** do not adopt Convx code; obtain
   user direction at the Checkpoint 4 research gate. Suggested command:
   `$impeccable shape`.
3. **P2 — shared component drift:** introduce semantic surface/button/row/state
   contracts incrementally. Suggested command: `$impeccable polish` after each
   migrated checkpoint.
4. **P2 — custom sheet path:** evaluate SDK 57 `@expo/ui` BottomSheet before
   maintaining a finger-driven JS implementation. Suggested command:
   `$impeccable optimize`.
5. **P2 — touch/adaptivity gaps:** normalize 48 dp targets and decide supported
   device classes before claiming tablet/foldable support. Suggested command:
   `$impeccable adapt`.

Re-run the native audit after each screen/motion migration so scores reflect
device evidence rather than source assumptions.
