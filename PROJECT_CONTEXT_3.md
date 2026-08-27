# heibi — Project Context 3

This document supersedes `PROJECT_CONTEXT_2.md` as the working source of truth for the next large UI/theme/widget update. Older context files remain useful for historical decisions.

## Current baseline

Expected latest merged `main` at handoff:

- commit: `33ceb2f3bf49beda735402eb2bd03f4309455d88`
- merge message: `Feat/develop (#7)`
- includes:
  - GitHub Actions CI.
  - UI-thread drag reorder migration.

If `main` is newer, trust the repository and update this document.

### Checkpoint 0 repository audit correction (2026-08-26)

Remote `main` was verified at the expected SHA above. The implementation at
that SHA is nevertheless more advanced than the short handoff summary implies:

- Material You dynamic color, an M3 token/type scale, Roboto Flex, and a
  Material navigation bar already exist.
- `@expo/ui` is installed and currently supplies the Android date-time picker.
- the local widget module already renders a 14-day habit strip and goal-balance
  widget with Jetpack Glance.
- there is still no persisted `material3 | liquid` selection or semantic
  dual-theme adapter.

The implementation is authoritative. The overhaul plan must build on these
pieces rather than recreate them. Detailed evidence and remaining gaps are in
`docs/CHECKPOINT_0_AUDIT.md` and `docs/DECISIONS.md`.

### Checkpoint 1 semantic foundation (2026-08-26)

Checkpoint 1 starts from merged `main` commit
`7be9526d3dd3dc0edb6ba778ed9345087453d391` and adds the persisted semantic
theme foundation without a native dependency or database schema migration:

- `VisualTheme` supports `material3 | liquid` with a safe Material 3 fallback.
- `visual_theme` uses the existing SQLite settings table.
- `useTheme()` centralizes semantic color, typography, shape, motion, and
  effect adapters while retaining raw M3 as temporary component compatibility.
- Settings exposes an accessible live selector with compact previews.
- Convx remains concept-only; no backdrop/blur/refraction renderer is claimed.

### Checkpoint 2 shared primitives (2026-08-26)

Checkpoint 2 starts from merged `main` commit
`ae7451cdad257e0270b33edb2390149355f3a173` and adds the shared component
architecture without dependencies or native/config changes:

- `AppSurface` owns opaque semantic content surfaces; `GlassCard` remains a
  compatibility wrapper for incremental migration.
- `AppButton`, `AppListRow`, and `AppDivider` standardize accessible Android
  targets, variants, selected/disabled state, and theme-aware feedback.
- shared chips, FAB, empty state, alerts, snackbar, reminder time choices, and
  repeated form/backup actions consume the semantic contracts.
- Material uses restrained ripple feedback; Liquid uses opacity and a subtle
  reduced-motion-aware FAB scale. No optical renderer is claimed.
- full screen redesign, native-control migration, navigation, and sheets stay
  in their planned later checkpoints.

### Checkpoint 3 Material 3 Expressive foundation (2026-08-26)

Checkpoint 3 builds on local Checkpoint 2 commit
`237b51f635728e7a0fcb5eb6314525132e664015` and remains dependency/native free:

- the Material adapter uses the M3 surface-container ladder for neutral depth,
  secondary roles for selection, and tertiary roles for rare expressive focus.
- semantic typography now has clearer display/title/section/amount hierarchy,
  including tabular financial numerals, while representative density moves to
  16dp screen/card padding.
- original, tested SVG cookie and wave geometry provides a reusable expressive
  vocabulary without copying Material path data or adding a graphics runtime.
- selected chips/list rows use one asymmetric semantic shape; Liquid keeps its
  existing pill contract and receives no optical implementation in this work.
- Settings and Goals are representative validation surfaces only. Full screen,
  navigation, and Liquid migrations remain in their planned checkpoints.

## Repository

- Repo: `karimm1620/heibi`
- Android package: `com.immz.heibi`
- Android only.
- Expo SDK 57.
- React Native 0.86.2.
- React 19.2.3.
- New Architecture enabled.
- App version at handoff: `2.5.5`.
- `app.json` and `package.json` versions must remain synchronized when version changes are made.
- EAS manages `versionCode`.

## Existing validation baseline

The project has an automated Jest suite and CI.

Mandatory local validation order:

1. `npx tsc --noEmit`
2. `npx eslint .`
3. `npx jest`
4. `npx expo export --platform android`
5. `git apply --check` in a separate fresh clone.
6. Apply the patch in that verification clone and rerun typecheck/lint/Jest.
7. Native/config/dependency changes also require `npx expo prebuild --clean`.

Dependency changes also require a cold install test in a fresh clone with npm cache explicitly cleared.

## Completed: CI

GitHub Actions is already present.

Do not redesign CI as part of the visual update unless a concrete need appears.

## Completed: drag reorder

The previous PanResponder/core Animated drag implementation was replaced with a UI-thread approach using Gesture Handler + Reanimated.

The current implementation introduced a shared drag controller and `DragReorderRow`.

Goals and Today now use this mechanism.

Do not regress this back to:

- `PanResponder`.
- React `setState` on every gesture frame.
- moving the dragged item to the end of JSX render order just to win Android stacking.
- JS-thread-driven finger tracking.

## Current theme architecture

At this handoff, the theme system is still fundamentally Material 3-centric.

Important existing pieces include:

- `src/theme/useTheme.ts`
- `src/theme/colors.ts`
- `src/theme/material3/colors.ts`
- `src/theme/material3/tokens.ts`
- `src/theme/material3/typography.ts`

`useTheme()` currently:

- follows Android system light/dark.
- obtains a Material 3 palette.
- maps Material 3 colors into app theme colors.
- builds Material 3 typography.
- exposes the Material 3 scheme.

There is not yet a persisted `material3 | liquid` visual-theme selection.

## Current settings architecture

`src/store/useSettingsStore.ts` already persists settings through the generic SQLite `settings` table.

Existing settings include:

- reminders.
- onboarding completion.
- language.

The visual theme should use the same persistence model unless audit findings show a better reason not to.

Existing users must default to Material 3 rather than being unexpectedly migrated into Liquid.

## Current bottom navigation architecture

`app/(tabs)/_layout.tsx` uses `FloatingTabBar`.

At this handoff, `FloatingTabBar` simply delegates to `MaterialNavigationBar`.

The theme update should evolve this into a deliberate theme-aware bottom-navigation abstraction without duplicating tab logic across screens.

FAB and UndoSnackbar offsets currently depend on tab-bar height/margin constants, so theme-specific navigation geometry must not cause layout jumps or incorrect offsets.

## Existing native/widget architecture

heibi already contains a local Expo module:

- `modules/expo-home-widgets`

Widget snapshot logic exists in:

- `src/widgets/buildWidgetSnapshot.ts`
- `src/widgets/syncWidgetSnapshot.ts`

This means custom Android-native work is already part of the project's architecture, but native changes still require strict prebuild and generated-file inspection.

## Existing widget issues reported by user

- In-app heatmap is working.
- Widget heatmap is not reflecting the expected behavior/data.
- The wide heatmap widget appears to show only a short span (reported around 5 units) instead of the intended longer view (user expects approximately 14). The implementation must be inspected before deciding whether this means days, columns, or another dimension.
- More widget variants are wanted:
  - simple tracker.
  - new savings widget.

## New product scope

### 1. Material 3 Expressive refresh

The current UI should be refined so it no longer feels like generic/AI-generated Material UI.

Desired direction:

- Material 3 Expressive.
- Pixel-like warmth and playfulness.
- cookie/scalloped shapes.
- wave motifs.
- dynamic color.
- simple daily usability.
- less generic nested-card styling.

### 2. Liquid Glass theme

Add a second visual theme inspired by Apple's Liquid Glass design principles.

Important definition:

Liquid Glass means:

- context.
- optical response.
- fluidity.
- adaptivity.
- interactive material behavior.

It does **not** mean generic blur/glassmorphism.

Apple docs are reference only; app remains Android-only.

A custom Android Expo module may be considered after a feasibility/size/performance investigation.

Reference Android project supplied by user:

- `https://github.com/cosmictaserdev-creator/Convx.git`

### 3. Navigation / sheets / motion / haptics

- Material bottom nav uses a Material surface.
- Liquid bottom nav gets a liquid-material treatment.
- Liquid selected navigation state may use a controlled spring/bounce.
- Tab content must remain fast and stable.
- Bottom sheets need a mature interaction model.
- Haptics must be intentional.
- App should feel smooth on real Android hardware.

### 4. APK budget

User-measured APK baseline: approximately **65 MB**.

Hard requirement:

- below 100 MB.

Project policy for this update:

- 90 MB = early warning.
- 100 MB or more = blocker; stop and report.

Every heavy native/rendering dependency must justify its size before adoption.

## Still deferred

Predictive Android back gesture remains deferred from previous context.

Do not change the existing decision without first re-checking the current React Native Screens / Expo Router situation and treating it as a separate decision.

## Delivery preference

Large work is split into small, reviewable checkpoints.

Primary delivery format remains:

- `.patch` in git diff format.

Do not push directly on behalf of the user.

## Communication preference

- technical.
- concise.
- Indonesian/English can mix naturally.
- meaningful trade-offs must be surfaced before implementation.
- do not hide limitations.
