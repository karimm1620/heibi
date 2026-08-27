# heibi Theme + UX + Widget Overhaul — TODO

Codex should update this file as work progresses.

## Baseline

- [x] Fresh clone `karimm1620/heibi` (clean local clone for verification; remote SHA checked read-only).
- [x] Confirm Checkpoint 1 base on current `main` (`7be9526d3dd3dc0edb6ba778ed9345087453d391`).
- [x] Run `git log --oneline -10`.
- [x] Confirm CI checkpoint is present.
- [x] Confirm UI-thread drag-reorder checkpoint is present.
- [x] Run baseline `tsc` (pass).
- [x] Run baseline ESLint (app scope pass; root-scope tooling issue fixed in Checkpoint 0).
- [x] Run baseline Jest (6 suites / 80 tests pass).
- [x] Run baseline Android Expo export (pass).
- [ ] Record reproducible APK size if release build is available.
  - Blocked on this host: no Java runtime / `JAVA_HOME`; do not substitute the 5.1 MB export bundle for APK size.

## Skills / references

- [x] Load `expo-overview`.
- [x] Load `expo-design-system`.
- [x] Load `expo-native-ui`.
- [x] Load `expo-ui`.
- [x] Load `expo-animation`.
- [x] Load `expo-router`.
- [x] Load `expo-module` before native custom module work.
- [x] Load `impeccable` or `taste-skill` if available (`impeccable` loaded; native audit playbook used).
- [x] Read M3 official docs.
- [x] Read Apple app-design/Liquid Glass official reference.
- [x] Inspect Convx Android implementation and license at the Checkpoint 0 high-level gate.

## Checkpoint 0 — Audit

- [x] Inventory current theme tokens.
- [x] Inventory hardcoded colors.
- [x] Inventory hardcoded radii/spacing.
- [x] Inventory core shared components.
- [x] Audit `GlassCard`.
- [x] Audit Material navigation bar.
- [x] Audit FAB/snackbar offset coupling.
- [x] Audit sheets/modals and SDK 57 `@expo/ui` opportunity.
- [x] Audit press states and haptics.
- [x] Audit settings persistence.
- [x] Audit widget snapshot pipeline.
- [x] Audit native home-widget module.
- [x] Document findings in `DECISIONS.md` and `CHECKPOINT_0_AUDIT.md`.

Checkpoint 0 is complete and merged through PR #8. D-014 now records the
user-approved concept-only Convx boundary: semantic work may proceed, but
renderer adoption still requires a new Checkpoint 4 decision.

## Checkpoint 1 — Theme foundation

- [x] Add `VisualTheme` type.
- [x] Default to `material3`.
- [x] Add persistent `visual_theme` setting.
- [x] Hydrate theme safely for existing users.
- [x] Add setter.
- [x] Add automated tests.
- [x] Refactor semantic theme contract.
- [x] Keep system light/dark.
- [x] Add theme selector to Settings.
- [x] Verify live switching without restart through the reactive store/adapter path.
- [x] Validate checkpoint (`tsc`, root ESLint, 88 Jest tests, Android export).
- [x] Generate patch (`heibi-checkpoint-1-semantic-theme.patch`).
- [x] Verify patch in fresh clone (`git apply --check`, TypeScript, root ESLint, 88 Jest tests).

## Checkpoint 2 — Shared primitives

- [x] Define semantic surface abstraction.
- [x] Decide `GlassCard` migration/compat strategy.
- [x] Refine shared button.
- [x] Refine shared chip.
- [x] Refine FAB.
- [x] Refine rows.
- [x] Refine dividers/outlines.
- [x] Refine press feedback.
- [x] Refine selected state.
- [x] Refine alert/snackbar surfaces.
- [x] Validate checkpoint (`tsc`, root ESLint, 88 Jest tests, Android export).

Checkpoint 2 adds semantic `AppSurface`, `AppButton`, `AppListRow`, and
`AppDivider` contracts, then moves the highest-drift shared interactions onto
them. `GlassCard` remains a compatibility wrapper; content surfaces stay
opaque/tonal in both themes. Native toggles/pickers and full screen styling
remain owned by their later checkpoints.

## Checkpoint 3 — M3 Expressive

- [x] Refine dynamic-color mapping.
- [x] Refine typography hierarchy.
- [x] Refine spacing/density.
- [x] Add cookie/scalloped shape utility.
- [x] Add wave shape utility.
- [x] Add expressive selected-state shape.
- [x] Avoid heavy graphics dependency (existing `react-native-svg` only).
- [x] Review representative Settings and Goals surfaces without full migration.
- [x] Visual anti-slop review (tonal hierarchy, selective motifs, no new gradients/glass/shadow stack).
- [x] Validate checkpoint (`tsc`, root ESLint, 91 Jest tests, Android export).

Checkpoint 3 keeps expressive geometry deliberately scarce: cookies appear in
the existing celebration and Material preview; waves appear in that preview
and the Goals summary. Settings groups use tonal surfaces without elevation,
while full screen migration and all Liquid implementation remain deferred.

## Checkpoint 4 — Liquid research + POC

- [ ] Determine what Liquid principles are implementable on Android.
- [ ] Inspect Convx rendering method.
- [ ] Check licensing.
- [ ] Identify minimum Android API implications.
- [ ] Identify fallback behavior.
- [ ] Prototype one liquid material surface.
- [ ] Prototype one interactive selected control.
- [ ] Measure release performance.
- [ ] Measure APK delta.
- [ ] Document trade-offs.
- [ ] Stop for user direction if trade-off is significant.

## Checkpoint 5 — Bottom navigation

- [ ] Create theme-aware navigation dispatcher/abstraction.
- [ ] Material nav uses semantic surface.
- [ ] Material selected state is expressive.
- [ ] Liquid nav uses selective liquid material.
- [ ] Liquid indicator has controlled direct-manipulation spring/bounce.
- [ ] No horizontal tab screen sliding.
- [ ] Correct haptic timing.
- [ ] Reduced-motion behavior.
- [ ] FAB offsets correct.
- [ ] UndoSnackbar offsets correct.
- [ ] Validate checkpoint.

## Checkpoint 6 — Bottom sheets / transient UI

- [ ] Audit `expo-ui` options.
- [ ] Establish shared sheet behavior.
- [ ] Correct scrim.
- [ ] Correct Android back dismissal.
- [ ] Correct scroll/gesture interaction.
- [ ] M3 sheet styling.
- [ ] Liquid sheet styling.
- [ ] Haptic detents/actions.
- [ ] Reduced motion.
- [ ] Validate checkpoint.

## Checkpoint 7 — Screens

### Settings

- [ ] Theme picker.
- [ ] Sections.
- [ ] controls.
- [ ] reminders.
- [ ] language.

### Today

- [ ] Header/calendar.
- [ ] habits.
- [ ] todos.
- [ ] swipe regression check.
- [ ] drag reorder regression check.

### Goals

- [ ] Summary.
- [ ] filters/sort.
- [ ] goal cards.
- [ ] drag reorder regression check.

### History

- [ ] Timeline/calendar hierarchy.
- [ ] day details.

### Detail/edit

- [ ] Habit add/edit.
- [ ] Habit detail.
- [ ] Goal add/edit.
- [ ] Goal detail.

### Secondary

- [ ] Onboarding.
- [ ] Empty state.
- [ ] celebration.
- [ ] alert.
- [ ] snackbar.
- [ ] miscellaneous shared UI.

## Checkpoint 8 — Widget fixes

- [ ] Reproduce widget heatmap data bug.
- [ ] Verify snapshot contains expected heatmap data.
- [ ] Verify sync occurs at all required mutation points.
- [ ] Verify native parser receives data.
- [ ] Verify native renderer uses correct data.
- [ ] Reproduce widest-layout short-span issue.
- [ ] Determine intended 14-unit axis semantics.
- [ ] Fix layout sizing/thresholds.
- [ ] Test launcher resize variants.
- [ ] Validate XML/resources.
- [ ] Prebuild clean.
- [ ] Validate checkpoint.

## Checkpoint 9 — Widget variants

- [ ] Simple tracker widget design.
- [ ] Simple tracker implementation.
- [ ] Simple tracker resize states.
- [ ] New savings widget design.
- [ ] Savings widget implementation.
- [ ] Savings widget resize states.
- [ ] Light/dark/dynamic-color check.
- [ ] Deep-link/action check.
- [ ] Validate checkpoint.

## Checkpoint 10 — Size/performance

- [ ] Build release APK.
- [ ] Record final APK size.
- [ ] Compare against ~65 MB user baseline.
- [ ] Confirm below 90 MB soft-warning threshold.
- [ ] Confirm below 100 MB hard limit.
- [ ] Test tab switching in release.
- [ ] Test Liquid material in release.
- [ ] Test bottom sheets in release.
- [ ] Test drag reorder in release.
- [ ] Test scrolling in release.
- [ ] Test theme switching in release.

## Final

- [ ] `npx tsc --noEmit`.
- [ ] `npx eslint .`.
- [ ] `npx jest`.
- [ ] `npx expo export --platform android`.
- [ ] Native prebuild checks green.
- [ ] Fresh-clone patch checks green.
- [ ] Core flows smoke tested.
- [ ] `DECISIONS.md` up to date.
- [ ] Known limitations listed.
- [ ] APK size listed.
- [ ] Final completion report.
