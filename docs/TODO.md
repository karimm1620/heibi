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

- [x] Determine what Liquid principles are implementable on Android.
- [x] Inspect Convx rendering method.
- [x] Check licensing.
- [x] Identify minimum Android API implications.
- [x] Identify fallback behavior.
- [x] Prototype one liquid material surface (dependency-free tonal fallback only).
- [x] Prototype one interactive selected control (unlinked development route only).
- [ ] Measure release performance on physical API 24, 31, and 33+ devices.
  - The fallback POC has no backdrop capture, shader, blur, or continuous frame
    loop. Static code review therefore finds no new rendering hot path, but a
    release-device frame trace was not available on this host.
- [ ] Measure an actual release APK delta.
  - Local measurement is unavailable. A contained toolchain attempt stopped at
    missing uncached Android Gradle Plugin artifact `builder-8.5.0.jar`; the
    5.1 MB Expo/Hermes export bundle is not an APK substitute. Measure the EAS
    Development/Preview artifact against the historical ~65 MB baseline.
- [x] Document trade-offs (D-023).
- [x] Stop for user direction because the optical renderer trade-off is significant.
- [x] Run Impeccable deterministic audit on the isolated POC (no findings).
- [x] Validate checkpoint (TypeScript, root ESLint, 103 Jest tests, Android export).

### Authorized original Android optical renderer investigation

- [x] Record the user's bounded authorization without authorizing production adoption.
- [x] Compare View/Canvas, Compose, Expo native view, existing React Native, and dependency options.
- [x] Select a dependency-free Android View/Canvas Expo `GroupView` architecture.
- [x] Keep the existing tonal `LiquidMaterialSurface` as the API 24–30 and failure fallback.
- [x] Implement one isolated reusable native optical host on the unlinked development route.
- [x] Bound backdrop capture to the material region and exclude the host/accessible descendants.
- [x] Implement API 31–32 cached `RenderEffect` blur tier.
- [x] Implement API 33+ independently authored restrained `RuntimeShader` tier.
- [x] Add low-RAM, disabled, missing-module, capture, hardware, blur, and shader fallbacks.
- [x] Keep touch-following response native-thread driven with no idle redraw loop.
- [x] Disable touch-following refraction under reduced motion.
- [x] Document bitmap/effect/shader cleanup and explicit invalidation triggers.
- [x] Add no third-party renderer dependency, config plugin, Compose UI integration, or iOS implementation/configuration.
- [x] Document the Convx GPL-3.0 research-only boundary and original shader provenance.
- [x] Run clean Android prebuild and confirm Expo autolinking discovers `expo-liquid-glass`.
- [x] Align Expo SDK 57 / React Native patch versions through `npx expo install` and pass Expo Doctor (21/21).
- [x] Compile the generated Android project through the established EAS Development/Preview workflow.
  - EAS Development completed and `:expo-liquid-glass:compileDebugKotlin`
    passed after the RenderNode correction. Local compilation remains
    unavailable and is not needed to reinterpret that external evidence.
- [ ] Measure release APK size and delta against the historical ~65 MB baseline.
- [ ] Measure API 31 and API 33+ release-device frame timing, jank, memory, CPU/GPU, idle, interaction, thermal, and battery behavior.
  - API 36 qualitative feasibility evidence is now available: optical tier,
    stable basic selection/lifecycle behavior, and no serious observed runtime
    regression on a Poco X7 Pro development build. This does not satisfy the
    exhaustive measurement item or supply API 31–32 evidence.
- [x] Run final authoritative-worktree Checkpoint 4 validation (TypeScript,
  root ESLint, 108 Jest tests, Android export, Expo Doctor 21/21, clean Android
  prebuild/module resolution, XML parsing, and diff checks).
- [x] Verify the isolated patch passes `git apply --check` against exact base
  `0712e074d9efed758900981e75d2d52cf2469943`.
- [ ] Complete cold fresh-clone command validation.
  - Environment/network incomplete, not a source failure: the `/tmp` install
    exhausted tmpfs quota; the disk-backed retry never created a usable local
    `.bin/tsc` and was stopped after prolonged incomplete registry transfers.
    Do not install the unrelated deprecated npm package named `tsc`.

### EAS native RenderEffect compile correction

- [x] Record the EAS `:expo-liquid-glass:compileDebugKotlin` failure caused by
  invalid `Paint.setRenderEffect` calls.
- [x] Replace paint-level effect configuration with one reusable bounded API-31
  `RenderNode` recording pipeline.
- [x] Preserve API 24–30 tonal, API 31–32 blur, API 33+ original AGSL, low-RAM,
  reduced-motion, and renderer-failure behavior.
- [x] Discard the node display list when its bitmap becomes invalid and clear
  node/effect/shader/bitmap resources on detach/destruction.
- [x] Add a cheap Jest source guard that rejects `Paint.setRenderEffect` and
  requires the RenderNode recording/effect/draw/cleanup operations.
- [x] Pass focused local TypeScript, ESLint, 110 Jest tests, Android export,
  clean Android prebuild, Expo module resolution, XML parsing, and diff checks.
- [x] Verify the focused patch applies to clean base `ed605760` and passes
  post-apply TypeScript, ESLint, and 110 Jest tests in a separate checkout.
- [ ] Return Expo Doctor to fully green in a separate dependency-alignment
  change if desired.
  - Current `main` passes 20/21 checks and reports only unrelated SDK 57 patch
    drift: `expo` 57.0.17 → ~57.0.18, `expo-constants` 57.0.15 → ~57.0.16,
    and `expo-font` 57.0.1 → ~57.0.2. This focused native fix adds or updates no
    dependency and does not widen its patch for those upgrades.
- [x] Re-run an EAS Development/Preview Android build and confirm
  `:expo-liquid-glass:compileDebugKotlin` passes.
  - The EAS Development Android build completed successfully; the corrected
    RenderNode/RenderEffect pipeline compiled natively.
- [x] Merge the focused correction only after successful EAS native compile.
  - PR #12 was squash-merged at
    `4ce2cf8a76cf164582e4c343255abbde65e6c702`.

### Final Checkpoint 4 runtime evidence and production decision

- [x] Validate API 33+ optical execution on a physical device.
  - Poco X7 Pro, Android 16 / API 36: `optical`, initial capture count 1,
    interaction counts 4 and 7, no tonal fallback, crash, black frame, obvious
    corruption, or lifecycle instability; only minor development-build lag.
- [x] Record the limits of that evidence.
  - API 31–32, physical API 24–30 fallback, exhaustive performance/thermal/
    battery traces, and release APK size remain unmeasured.
- [x] Record explicit user authorization for navigation-only production
  adoption in Checkpoint 5.

Checkpoint 4's bounded research, original renderer, EAS compile correction,
and API-36 feasibility validation are complete. The user resolved D-024's
Checkpoint 5 stop gate only for selective navigation adoption. The renderer is
not generally production-proven across all supported API tiers; artifact size,
API 31–32, and instrumented device performance remain open evidence.

## Checkpoint 5 — Bottom navigation

- [x] Create theme-aware navigation dispatcher/abstraction.
- [x] Material nav uses semantic surface.
- [x] Material selected state is expressive.
- [x] Liquid nav uses one selective navigation-bounded optical host.
- [x] Liquid indicator has controlled UI-thread spring/bounce.
- [x] No horizontal tab screen sliding (`animation: "none"`).
- [x] Correct haptic timing (one selection haptic only for a committed change).
- [x] Reduced-motion behavior (immediate indicator; native touch response disabled).
- [x] FAB offsets derive from shared safe-area navigation metrics.
- [x] UndoSnackbar offsets derive from the same metrics and FAB size.
- [x] Validate checkpoint.
  - Authoritative and fresh-base TypeScript, ESLint, and Jest gates pass; Jest
    reports 14 suites and 121 tests after the final review fixes.
  - Android Expo export, clean Android prebuild, local-module autolinking, New
    Architecture inspection, 14/14 generated XML parses, and diff checks pass.
  - Expo Doctor passes 20/21 checks; the only failure is the pre-existing SDK
    57 patch drift recorded above. Checkpoint 5 changes no dependencies.
  - Local Kotlin/Gradle compilation is unavailable. EAS Development/Preview
    native compilation and physical-device navigation QA remain required
    before merge.
  - Final user physical-device QA accepts the production navigation as
    functionally safe and usable. Material's selected geometry and Liquid
    backdrop freshness are non-blocking Checkpoint 6 refinements, not reasons
    to roll back the accepted dispatcher, layout, haptic, or renderer contract.
  - No API 31–32, physical API 24–30, release-size, thermal/battery, or formal
    frame-time evidence was added by this acceptance.
  - PR #13 was squash-merged at
    `ab80ed3ad1cd6d9d5feea4b92a3e8484ad5e2194` after its amended CI passed and
    the two review threads were resolved.

## Checkpoint 6 — Bottom sheets / transient UI

### Checkpoint 5 follow-up refinements

- [x] Restore/refine the Material selected-navigation pill without regressing
  the Checkpoint 5 dispatcher, routing, haptics, metrics, or accessibility.
- [x] Make Liquid navigation backdrop refresh contextual/live while preserving
  one bounded host and zero recurring idle capture.
- [x] Validate navigation regressions after both refinements.

- [x] Audit `expo-ui` options.
  - The already-installed SDK 57 community sheet supports arbitrary React
    Native descendants through its native Compose host, New Architecture,
    native back/scrim/swipe ownership, scroll handoff, and IME behavior. Android
    supports only partial/full states. No dependency or Expo Go/development
    build requirement changed.
  - Its separate dialog window cannot expose the activity backdrop to the
    current immediate-parent optical renderer. Liquid sheets therefore use the
    tonal fallback; a heavier cross-window renderer was not justified.
- [x] Establish shared sheet behavior.
- [x] Correct scrim.
  - The native Material 3 scrim blocks touch-through and owns permitted
    press-to-dismiss. Liquid does not blur the whole screen.
- [x] Correct Android back dismissal.
- [x] Correct scroll/gesture interaction.
  - Native sheet/scroll/IME arbitration replaces the deleted JS-thread
    `useSheetMotion` PanResponder implementation.
- [x] M3 sheet styling.
- [x] Liquid sheet styling.
  - Uses the established semantic tonal Liquid surface because optical capture
    cannot cross the native dialog window safely.
- [x] Haptic detents/actions.
  - One light haptic follows a committed deposit/withdraw action. Android's
    SDK 57 wrapper exposes no reliable detent-settle callback, so detent haptics
    are intentionally omitted rather than guessed or duplicated.
- [x] Reduced motion.
  - Native sheet motion follows Android animator settings; the tonal Liquid
    surface retains the existing reduced-motion contract and adds no JS motion.
- [x] Validate checkpoint.
  - TypeScript and ESLint pass; Jest passes 16 suites / 132 tests. Android Expo
    export, clean Android prebuild, `expo-liquid-glass` autolinking, New
    Architecture inspection, 14/14 Android XML parses, and diff checks pass.
  - Expo Doctor remains 20/21 solely for the pre-existing SDK 57 patch drift;
    Checkpoint 6 changes no dependency files.
  - Local Kotlin/Gradle compilation is unavailable and was not attempted. EAS
    Development/Preview and user physical-device validation subsequently pass
    for the unchanged Checkpoint 6 production source.
  - EAS Android native compilation completed successfully. On a physical
    device, the Material selected pill, navigation behavior, FAB/snackbar
    geometry, Liquid live blur during scroll, settled post-scroll backdrop,
    zero-visible-idle-refresh behavior, and rapid tab switching all pass with
    no visible artifact or flicker.
  - History and goal transaction sheets pass in Material and Liquid themes,
    including Android back, scrim, swipe dismissal, scroll handoff, keyboard/
    IME behavior, reduced motion, and TalkBack.
  - The user observed no crash, noticeable lag, or noticeable heat/battery
    issue and accepts Checkpoint 6. This is qualitative device evidence, not
    frame-time, GPU/CPU/memory, battery-discharge, or thermal instrumentation.
  - Release APK size, physical API 24–30 behavior, and physical API 31–32
    behavior remain unmeasured.

## Checkpoint 7 — Screens

### Checkpoint 7 foundation / regressions

- [x] Align Expo SDK 57 dependencies and return Expo Doctor to green.
- [x] Audit Android press/ripple feedback across shared controls and screens.
- [x] Eliminate Android ripple/press flash globally except Liquid bottom navigation.
- [x] Verify Material bottom navigation ripple remains correct.
- [x] Verify Liquid bottom navigation behavior/capture is unchanged.
- [x] Validate shared press feedback before full screen migration.
  - `npx expo install --fix` aligned only SDK 57-compatible patches; Expo
    Doctor now passes 21/21. React 19.2.3, React Native 0.86.3, Gesture
    Handler 2.32.0, Reanimated 4.5.1, and Worklets 0.10.1 remain unchanged.
  - Material controls share one clipped semantic background-ripple contract.
    Liquid controls use restrained opacity feedback, and the accepted Liquid
    bottom navigation remains unchanged and ripple-free.

### Settings

- [x] Theme picker.
- [x] Sections.
- [x] controls.
- [x] reminders.
- [x] language.

### Today

- [x] Header/calendar.
- [x] habits.
- [x] todos.
- [x] swipe regression check.
- [x] drag reorder regression check.

### Goals

- [x] Summary.
- [x] filters/sort.
- [x] goal cards.
- [x] drag reorder regression check.

### History

- [x] Timeline/calendar hierarchy.
- [x] day details.

### Detail/edit

- [x] Habit add/edit.
- [x] Habit detail.
- [x] Goal add/edit.
- [x] Goal detail.

### Secondary

- [x] Onboarding.
- [x] Empty state.
- [x] celebration.
- [x] alert.
- [x] snackbar.
- [x] miscellaneous shared UI.
- [x] Validate checkpoint locally.
  - TypeScript and ESLint pass without warnings; Jest passes 18 suites / 145
    tests. Expo Doctor passes 21/21 and Android Expo export succeeds.
  - Clean Android prebuild succeeds. `expo-liquid-glass` and `@expo/ui`
    resolve through Expo autolinking; Gesture Handler, Reanimated, and
    Worklets resolve through React Native autolinking; New Architecture stays
    enabled; 14/14 generated Android XML files parse; no iOS tree is generated.
  - Local Kotlin/Gradle compilation was not performed. Because native package
    patches changed, EAS Development/Preview compilation and physical-device
    screen/ripple/gesture QA remain required before merge.
  - The isolated Checkpoint 7 patch applies cleanly to exact base
    `09e8c48259f45a9e420fd5a163f182da8d811c04`. A disk-backed verification
    checkout completed a cold `npm ci`, TypeScript, warning-free ESLint, and
    all 18 Jest suites / 145 tests.
  - EAS Android succeeds. User physical-device QA confirms the ripple flash is
    eliminated; Liquid live blur, settling, idle behavior, rapid tab switching,
    and artifact/flicker behavior pass; Today swipe and upward/downward,
    middle, and quick-drop reorder pass without jumping or disappearing; Goals
    filter/sort, reorder, and deposit/withdraw pass; all habit/goal forms,
    keyboard/IME, back/save/cancel, Settings theme/language/reminders and
    persistence, History grouping/day detail, TalkBack, large text, and reduced
    motion pass.
  - No crash, noticeable lag, or noticeable heat/battery issue was observed.
    This is qualitative device evidence, not frame-time, GPU/CPU/memory,
    battery-discharge, or thermal instrumentation. Release APK size and physical
    API 24–30/API 31–32 Liquid evidence remain unavailable.
  - Checkpoint 7 is user accepted. A final review correction resets the
    UI-thread pinch scale after gesture cancellation; it changes JavaScript
    gesture finalization only and has focused source-contract coverage.

## Checkpoint 8 — Widget fixes

### Checkpoint 7 follow-up — Liquid navigation light mode

- [x] Reproduce overly dark Liquid navbar in light mode.
- [x] Audit fallback/tint/edge/adaptive-contrast color ownership.
- [x] Define separate light/dark optical material response without hardcoded
      fake glass.
- [x] Preserve live contextual capture and zero-idle work.
- [x] Preserve dark-mode Liquid navigation.
- [x] Review light/dark Liquid navigation using user-supplied physical-device
      screenshots.
  - Root cause: `surfaceInteractive` already carried an alpha channel, and the
    native wrapper appended another alpha when deriving the tint. The invalid
    ten-digit color could not be processed, so the native view retained its
    charcoal default. The primary-container-derived fallback was also too
    chromatic and dense for light navigation.
  - Navigation now selects an explicit renderer material tone. Light mode uses
    the semantic neutral glass tint for a bright fallback, a restrained valid
    optical tint, and a light-specific bounded adaptive-contrast response;
    dark/default materials retain the accepted dark treatment. The selected
    accent, one-host architecture, contextual observers, active coalescing,
    settled capture, zero-idle behavior, and API/failure tiers are unchanged.
  - Static/source tests cover both material configurations, theme ownership,
    `interactionEnabled={false}`, ripple exclusion, and the established native
    capture lifecycle. EAS compilation and physical light/dark visual QA remain
    required because the native module gained one material configuration prop.

- [x] Reproduce widget heatmap data bug.
- [x] Verify snapshot contains expected heatmap data.
- [x] Verify sync occurs at all required mutation points.
- [x] Verify native parser receives data.
- [x] Verify native renderer uses correct data.
- [x] Reproduce widest-layout short-span issue.
- [x] Determine intended 14-unit axis semantics.
- [x] Fix layout sizing/thresholds.
- [x] Test launcher resize variants with deterministic compact/medium/wide and
      short/tall layout contracts; physical launcher resize QA remains pending.
- [x] Validate XML/resources.
- [x] Prebuild clean.
- [x] Validate checkpoint locally.
  - The snapshot contract produces exactly 14 local calendar-day cells oldest
    to newest, preserves completion/color/streak data, filters archived habits,
    respects sort order, and caps rows at eight.
  - Widget writes are now debounced and serialized. A mutation arriving during
    an in-flight native update schedules one latest-state follow-up instead of
    allowing an older asynchronous write to finish last. Startup hydration and
    goals/habits/log subscriptions remain the central ownership points.
  - Native redraw consumes the persisted 14-day window without advancing only
    its cells. The next centralized app/store sync advances cells and streak
    together, preserving one timestamp for all date-derived values.
  - The 14 units are chronological calendar days, not habits, weeks, or
    width-dependent cells. Compact, medium, and wide layouts use bounded square
    cells instead of stretching every cell with weight; height still determines
    the visible habit-row count from one through eight.
  - TypeScript and warning-free ESLint pass; Jest passes 22 suites / 159 tests;
    Expo Doctor passes 21/21; Android export and clean prebuild pass. Both local
    Expo modules and `@expo/ui` resolve, New Architecture stays enabled, and all
    21 generated/module Android XML files parse. No dependency/config/iOS
    change was introduced. Local Kotlin/Gradle compilation is not claimed.
  - User-supplied screenshots confirm that the invalid-charcoal failure is
    corrected, but also show two design findings: light Liquid navigation is
    now too faint, and dark Liquid navigation still inherits a strong green
    Material-You cast. The user accepts CP8 for merge and explicitly moves
    final neutral-glass tuning to CP9.
  - A final review fix keeps heatmap cells and `currentStreak` on the same
    snapshot timestamp. Hourly native redraw no longer advances only the cells
    while leaving a stale streak; the next centralized app/store sync advances
    all date-derived values together.
  - The user also rejects further iteration on the current heatmap presentation.
    CP9 retains the corrected snapshot/sync/parser infrastructure but replaces
    the visual direction as part of an exactly four-widget suite.
  - EAS/native compilation and full physical launcher resize/data-refresh QA
    were not reported for the final CP8 source. Release APK size and physical
    API 24–30/API 31–32 Liquid evidence remain unavailable.

## Checkpoint 9 — Widget variants + final product redesign

### Widget suite

- [x] Replace current heatmap visual direction with redesigned heatmap widget.
- [x] Simple tracker widget design.
- [x] Simple tracker widget implementation.
- [x] Simple tracker resize states.
- [x] Saving widget redesign.
- [x] Saving widget implementation.
- [x] Saving widget resize states.
- [x] Chart widget design.
- [x] Chart widget implementation.
- [x] Chart widget resize states.
- [x] Widget light/dark behavior.
- [x] Widget dynamic-color strategy where appropriate.
  - Widgets use stable Heibi light/night resources; wallpaper dynamic color is
    intentionally not serialized into launcher state.
- [x] Widget deep-link/action behavior.
- [x] Validate shared snapshot/sync integrity.
  - Snapshot v2 retains deterministic habit/goal data and adds `dueToday` plus
    a newest-first bounded transaction stream. The existing 300ms debounce,
    serialized native writes, in-flight coalescing, startup hydration sync, and
    store subscriptions remain the only update ownership.

### Liquid refinement

- [x] Improve Liquid navbar light-mode visibility.
- [x] Remove dark-mode green Material-You cast.
- [x] Preserve accepted Liquid blur/capture architecture.
- [x] Refine Liquid bottom-sheet styling.
- [x] Validate Liquid navbar light/dark with static material contracts.
- [x] Validate Liquid bottom sheets with shared behavior/source contracts.
  - Final EAS/device light/dark visual validation remains a pre-merge gate.

### Savings experience

- [x] Fix deposit/withdraw horizontal screen shift.
- [x] Redesign top saving progress card.
- [x] Add saving flow line chart.
- [x] Add full saving progress screen.
- [x] Keep progress screen out of bottom navigation.
- [x] Navigate saving History rows to related goal.
- [x] Redesign saving jar/progress visual.
- [x] Validate deposit/withdraw source/behavior contracts.
  - Physical Material/Liquid/IME sheet validation remains required on EAS.

### Onboarding

- [x] Redesign onboarding visual hierarchy.
- [x] Validate Material onboarding contracts.
- [x] Validate Liquid onboarding contracts.
- [x] Validate accessibility and reduced motion contracts.

### Validation

- [x] Expo Doctor (21/21).
- [x] TypeScript.
- [x] ESLint (warning-free).
- [x] Jest (23 suites / 169 tests before final delivery verification).
- [x] Android export.
- [x] Clean Android prebuild.
- [x] XML/resources.
  - Expo autolinking resolves `expo-home-widgets`, `expo-liquid-glass`, and
    `@expo/ui`; New Architecture remains enabled. All 26 generated/module XML
    files parse, exactly four widget providers are declared, no iOS tree is
    generated, and package/config files remain unchanged.
- [x] Fresh-base patch verification.
  - The final patch applies cleanly to the exact CP9 base in a disk-backed
    checkout. Cold `npm ci`, Expo Doctor 21/21, TypeScript, warning-free
    ESLint, and 23 Jest suites / 169 tests pass after application.
- [x] Prepare EAS/device QA gate.
  - Local Kotlin/Gradle compilation is unavailable and not claimed. EAS must
    compile the new Glance providers and device QA must cover launcher resize,
    widget taps/refresh, Liquid light/dark/sheets, transaction sheet/IME,
    charts, History deep links, onboarding, TalkBack, and reduced motion.
- [x] Complete Checkpoint 9 EAS and physical-device QA.
  - EAS succeeds. Saving and Chart widgets pass rendering, resize, updates, and
    deep links. Simple Tracker passes its metric, initial render, resize, and
    tap. Savings, History-to-goal routing, onboarding, TalkBack, large text,
    reduced motion, dark Liquid navigation, and Liquid live/settled/idle
    behavior pass. No crash, noticeable lag, or noticeable heat/battery issue
    is observed; this is qualitative rather than instrumented evidence.
  - The user accepts CP9 and moves five defects to CP10: truncated Heatmap day
    presentation, stale installed Simple Tracker refresh, faint light Liquid
    navigation, a narrow left-aligned inner Liquid transaction surface, and an
    oversized Material navigation ripple.

## Checkpoint 10 — Size/performance

### Checkpoint 9 physical-QA follow-ups

- [x] Fix Heatmap 14-day cell presentation.
- [x] Fix Simple Tracker live refresh.
- [x] Improve Liquid light navbar visibility.
- [x] Fix Liquid transaction-sheet full-width layout.
- [x] Reduce and correctly bound Material navbar ripple/pressed feedback.
- [ ] Run a new EAS/device validation after fixes.
  - Glance rows support at most ten direct children. The old alternating 14
    cells plus 13 spacers was therefore truncated after five cells. Every
    habit now renders the same 14 chronological slots as a deterministic 7+7
    grid with no more than seven direct children per calendar row.
  - Widget snapshot data is now copied into observable per-instance Glance
    state before explicit installed-ID updates. This fixes active widget
    compositions that retained the snapshot captured by `provideGlance`;
    the persisted file remains the initial/configuration fallback. Updates
    remain subscription-driven, serialized, and polling-free.
  - Light Liquid navigation keeps the accepted capture pipeline but increases
    its neutral optical tint and gains a separate light-only neutral boundary.
    Accepted dark tones and zero-idle capture behavior are unchanged.
  - SDK 57 dynamic sheet sizing uses a match-content RN host. Percentage width
    had no numeric parent width at that measurement boundary; the shared root
    now receives the current window width from `useWindowDimensions`, while
    its Material/Liquid surfaces continue to fill that root.
  - Material navigation keeps its 64×32 selected pill and one native semantic
    response, but uses a 16dp-radius, 6%-opacity foreground ripple instead of
    the 32dp background ripple whose center was hidden by the pill and read as
    a large surrounding halo. Liquid navigation remains ripple-free.

- [x] Complete source-level performance/resource regression audit.
  - Liquid still has one bounded host, contextual/coalesced active capture,
    one cancellable settled capture, and no recurring idle/JavaScript frame
    loop. Widget writes remain bounded/serialized with no polling; the chart
    bitmap remains capped at 720×160px and transaction snapshots at 120 rows.
  - No dependency, package/config, iOS, or generated-artifact change is part
    of Checkpoint 10.

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

- [x] `npx tsc --noEmit`.
- [x] `npx eslint .`.
- [x] `npx jest --runInBand` (23 suites / 171 tests).
- [x] `npx expo export --platform android`.
- [x] Native prebuild checks green.
- [x] Fresh-clone patch checks green.
- [ ] Core flows smoke tested.
- [x] `DECISIONS.md` up to date.
- [x] Known limitations listed.
- [ ] APK size listed.
- [ ] Final completion report.
  - `npx expo install --check` reports dependencies current and Expo Doctor
    passes 21/21. Clean Android prebuild resolves both local Expo modules and
    `@expo/ui`; Gesture Handler, Reanimated, and Worklets resolve; New
    Architecture remains enabled; 26/26 generated/module XML files parse; no
    iOS tree is generated. Local Kotlin/Gradle compilation is unavailable and
    not claimed.
  - No APK/AAB artifact is accessible locally. The 5.2MB Expo/Hermes export is
    not an APK; exact bytes/MiB and comparison with the ~65MB baseline, 90MB
    warning, and 100MB limit remain a final EAS artifact gate.
  - The final patch applies to the exact CP10 base in a disk-backed checkout.
    A cold `npm ci`, Expo Doctor 21/21, TypeScript, warning-free ESLint, and all
    23 Jest suites / 171 tests pass after application.
