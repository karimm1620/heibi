# heibi Theme + UX + Widget Overhaul — TODO

Codex should update this file as work progresses.

## Baseline

- [x] Fresh clone `karimm1620/heibi` (clean local clone for verification; remote SHA checked read-only).
- [x] Confirm current `main` HEAD (`33ceb2f3bf49beda735402eb2bd03f4309455d88`).
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

Checkpoint 0 is complete. `heibi-checkpoint-0-audit.patch` passed
`git apply --check` and post-apply TypeScript, root ESLint, and all 80 Jest
tests in a separate clean clone. The next implementation checkpoint is
Checkpoint 1, but D-014 requires user direction before any Convx/GPL renderer
adoption in Checkpoint 4.

## Checkpoint 1 — Theme foundation

- [ ] Add `VisualTheme` type.
- [ ] Default to `material3`.
- [ ] Add persistent `visual_theme` setting.
- [ ] Hydrate theme safely for existing users.
- [ ] Add setter.
- [ ] Add automated tests.
- [ ] Refactor semantic theme contract.
- [ ] Keep system light/dark.
- [ ] Add theme selector to Settings.
- [ ] Verify live switching without restart.
- [ ] Validate checkpoint.
- [ ] Generate patch.
- [ ] Verify patch in fresh clone.

## Checkpoint 2 — Shared primitives

- [ ] Define semantic surface abstraction.
- [ ] Decide `GlassCard` migration/compat strategy.
- [ ] Refine shared button.
- [ ] Refine shared chip.
- [ ] Refine FAB.
- [ ] Refine rows.
- [ ] Refine dividers/outlines.
- [ ] Refine press feedback.
- [ ] Refine selected state.
- [ ] Refine alert/snackbar surfaces.
- [ ] Validate checkpoint.

## Checkpoint 3 — M3 Expressive

- [ ] Refine dynamic-color mapping.
- [ ] Refine typography hierarchy.
- [ ] Refine spacing/density.
- [ ] Add cookie/scalloped shape utility.
- [ ] Add wave shape utility.
- [ ] Add expressive selected-state shape.
- [ ] Avoid heavy graphics dependency.
- [ ] Review one reference screen.
- [ ] Visual anti-slop review.
- [ ] Validate checkpoint.

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
