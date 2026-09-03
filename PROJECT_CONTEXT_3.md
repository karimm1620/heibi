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

### Checkpoint 4 Liquid feasibility gate (2026-08-27)

Checkpoint 4 starts from merged `main` commit
`0712e074d9efed758900981e75d2d52cf2469943` in an isolated worktree. Research
confirms that a faithful Android optical treatment is not a small JavaScript
styling change:

- Apple reserves Liquid Glass for a functional control/navigation layer and
  defines it through context-adaptive lensing, tint, contrast, shadow, and
  interaction response—not blur alone.
- Convx records Compose `GraphicsLayer` backdrops, applies `RenderEffect` blur
  on API 31+, and adds AGSL/`RuntimeShader` lens refraction on API 33+. It uses
  a translucent tint below API 31 and on low-RAM devices.
- Convx has a project floor of API 26 and a GPL-3.0 integration. It remains
  concept evidence only; no source was copied into heibi.
- heibi's existing Reanimated, Gesture Handler, SVG, Expo Modules, New
  Architecture, and AppWidget Compose/Glance code do not provide arbitrary
  React Native backdrop sampling or refraction.
- `expo-glass-effect` is not available on Android. `expo-blur` is blur-only,
  requires a new native dependency, is efficient only on API 31+, and does not
  satisfy the optical definition by itself.

The bounded POC therefore implements only an explicitly declared
`tonal-fallback` capability: one semantic `LiquidMaterialSurface`, one
accessible selected control, and one unlinked development route. It introduces
no dependency, native/config change, backdrop capture, shader, blur, or
refraction; it keeps API 24 support and uses the existing Android shadow
compatibility resolver. Production screens and navigation are unchanged.

D-023 records the significant trade-off. The recommended future optical path,
if the user authorizes it, is an original Android Expo native view with tonal
API 24–30/low-RAM fallback, blur-only API 31–32, and optional refraction on
API 33+, gated by release-device performance and APK measurements. Checkpoint
5 must not start until the user records whether to ship the tonal material or
open that separate native renderer investigation.

### Checkpoint 4 original optical renderer investigation (2026-08-27)

The user explicitly authorized the separate original renderer investigation,
not production adoption. The isolated POC now adds one Android-only local Expo
`GroupView` backed by platform `View`/`Canvas` APIs:

- API 24–30, low-RAM, disabled, missing-module, capture-failure, and
  blur-failure paths keep the existing React Native `LiquidMaterialSurface`
  tonal fallback.
- API 31–32 uses one cached `RenderEffect` blur pass over a bitmap bounded to
  the material host.
- API 33+ adds an independently authored restrained `RuntimeShader` lens over
  the same bounded source and degrades to blur if the shader fails.
- the host captures only its immediate parent and excludes itself plus its
  React accessibility descendants. It is a view-hierarchy POC, not a claim of
  arbitrary window or `SurfaceView` capture.
- capture is dirty-event driven: attach, size/layout, focus return, explicit
  refresh, or touch-down. Touch move updates native shader uniforms only while
  a finger is active. There is no idle frame loop, per-frame JS state, or
  repeated backdrop capture during a gesture.
- reduced motion disables touch-following refraction while retaining the
  static material; detach/Expo view destruction recycles the bitmap and clears
  cached effects.

No third-party renderer dependency, Compose UI integration, config plugin, iOS
code/configuration, production navigation change, or screen migration is
included. Expo Doctor did require SDK 57 patch alignment in `package.json` and
`package-lock.json`, including Expo `~57.0.17`, React Native `0.86.3`, and their
compatible Expo/Jest patch releases. Those updates were made through
`npx expo install`; they are compatibility maintenance, not an optical-renderer
runtime dependency. Convx remains GPL-3.0 research evidence only; the Kotlin
renderer and AGSL program are independently authored.

`npx expo prebuild --clean --platform android` completes, leaves iOS absent,
and Expo autolinking resolves `expo-liquid-glass` to
`expo.modules.liquidglass.ExpoLiquidGlassModule`; all 14 generated Android XML
files parse successfully. `npx expo-doctor` passes 21/21 checks.

A contained local JDK/SDK/Gradle attempt progressed through Expo and React
Native settings-plugin compilation but did not complete Android project
configuration. The final offline failure was
`Could not download builder-8.5.0.jar (com.android.tools.build:builder:8.5.0):
No cached version available for offline mode`; the preceding bounded online
attempt stalled during dependency resolution and was stopped. Per the
project's established EAS workflow, no more local toolchain work belongs in
this checkpoint. Local native compilation and release APK size/delta are
unavailable, and the 5.1 MB Expo/Hermes export bundle is not an APK.

Physical-device frame/jank/memory/CPU/GPU, idle, interaction, thermal, battery,
capture stability, and visual-fidelity evidence are also unavailable. An EAS
Development/Preview build, artifact measurement, and physical API 31 and API
33+ QA are mandatory next validation steps before production adoption. Until
that release-device evidence is acceptable, D-024 keeps Checkpoint 5 and
production adoption blocked.

The final isolated patch passes `git apply --check` against base
`0712e074d9efed758900981e75d2d52cf2469943`. A separate cold fresh-clone
dependency install did not complete under the available network: the first
attempt exhausted `/tmp` quota and the disk-backed retry was stopped after
prolonged incomplete registry transfers. Its missing project-local `.bin/tsc`
means fresh-clone command validation is not established; the unrelated npm
`tsc` fallback is not a heibi source failure. Authoritative-worktree validation
remains the applicable local evidence.

### Checkpoint 4 native RenderEffect compile correction (2026-09-01)

The first EAS Development Android build reached
`:expo-liquid-glass:compileDebugKotlin` and disproved the earlier static-only
native validation: `Paint.setRenderEffect` does not exist. Android applies a
`RenderEffect` to a `View` or `RenderNode`, not to `Paint`.

The focused correction keeps the bounded architecture and replaces the invalid
paint calls with one reusable API-31 `RenderNode`. The captured bitmap—or the
API-33 original `RuntimeShader` material—is recorded into the node only when
the captured content, size/tier, shader inputs, or touch response changes. The
cached blur is installed with `RenderNode.setRenderEffect`, and the bounded node
is drawn through the destination hardware `Canvas`. API 24–30 still never enter
the optical helpers; API 31–32 retain bounded blur; API 33+ retain original AGSL
refraction with shader-to-blur-to-tonal degradation.

Detach/destruction now clears the node effect and discards its display list in
addition to recycling the capture bitmap and releasing shader/effect
references. Bitmap release also discards any display list that could reference
the old bitmap. No dependency, iOS file, production navigation/screen change,
continuous idle redraw, JS per-frame loop, or gesture-time recapture was added.

Jest now statically rejects `Paint.setRenderEffect` and asserts the bounded
`RenderNode` recording/effect/draw/cleanup pipeline. A full Gradle native compile
is intentionally not added to the ordinary CI job because Android SDK/Gradle
setup would materially expand its cost and duration; the user's EAS
Development/Preview build remains the required native compile gate. The fix
must not be merged or considered native-compile verified until that EAS build
passes.

### Checkpoint 4 EAS and API-36 runtime evidence (2026-09-01)

The focused RenderNode correction was squash-merged through PR #12 at
`4ce2cf8a76cf164582e4c343255abbde65e6c702` after the required external native
validation completed:

- an EAS Development Android build completed successfully and
  `:expo-liquid-glass:compileDebugKotlin` passed;
- a Poco X7 Pro running Android 16 / API 36 reported the renderer tier as
  `optical` on the development feasibility screen;
- the initial capture count was 1, then selection interactions advanced the
  count through 4 and 7 while Hari ini / Minggu / Bulan continued to work;
- the renderer did not fall back to tonal and showed no crash, black frame, or
  obvious corrupt output;
- background/foreground lifecycle, repeated screen entry, and basic interaction
  remained stable and smooth, apart from minor development-build lag.

This is real API-33+ optical execution and basic stability evidence on API 36.
It is not API 31–32 device evidence, API 24–30 physical fallback evidence,
exhaustive frame/GPU/thermal/battery profiling, or release APK size evidence.
The historical APK baseline remains approximately 65 MB; the 90 MB warning and
100 MB hard limit remain binding.

The user separately authorized selective production adoption for Checkpoint 5
navigation. This does not authorize optical content cards, screen migration,
Checkpoint 6, or a general claim that the renderer is production-ready across
all supported Android tiers.

### Checkpoint 5 theme-aware bottom navigation (2026-09-01)

Checkpoint 5 starts from the authoritative PR #12 squash commit above and was
squash-merged through PR #13 at
`ab80ed3ad1cd6d9d5feea4b92a3e8484ad5e2194`. The
navigation architecture now has one routing/haptic dispatcher with separate
Material and Liquid presentations:

- Material keeps an opaque semantic surface, restrained asymmetric selected
  geometry, dynamic color, Android ripple, and 48dp-or-larger destinations.
- Liquid uses one 72dp-high navigation-bounded optical `GroupView`, inset 8dp
  from the horizontal edges. The native host owns all tab descendants and is
  the final overlay child required by the bounded parent-capture contract.
- one semantic selected wash moves within that shared Liquid plane through a
  Reanimated UI-thread spring. It is not a second optical host and it does not
  recapture the backdrop during animation.
- selecting a different destination performs one selection haptic at commit;
  pressing the current destination does not navigate, animate, or vibrate
  again. Expo Router remains the routing owner and tab scene animation is
  explicitly `none`.
- reduced motion makes indicator placement immediate and disables the native
  touch-following refraction through the existing renderer contract. Static
  optical material may remain.
- one safe-area-aware layout resolver now owns navigation, screen padding, FAB,
  and UndoSnackbar offsets, so theme selection does not change their geometry.

Liquid uses one native optical host because a moving or per-tab host would
either capture the wrong transformed backdrop or multiply bitmap/RenderNode
ownership. The host captures on its existing native triggers. During a normal
tab change, navigation disables the generic touch-following native lens and
uses `refreshKey` once after the selected route changes. Press opacity and the
indicator spring provide the interaction response without a pre-action capture
or gesture-frame capture. There is no idle loop or JavaScript per-frame state
update.

No dependency, graphics runtime, config plugin, iOS file, production screen
redesign, or Checkpoint 6 work is added. The existing native host gains one
generic `interactionEnabled` prop so navigation can retain static optics without
touch-down capture; its renderer architecture and tier gates are unchanged.
API 24–30, low-RAM, missing-module, and failure cases retain the tonal material;
API 31–32 retain bounded RenderNode blur; API 33+ retain original AGSL with blur
then tonal degradation.
EAS/device validation of the production navigation composition remains required
after review, including capture counts, visual contrast, haptic timing, and
performance on the API-36 device. API 31–32, release metrics, and artifact size
remain unmeasured.

Final local validation passes TypeScript, root ESLint, 14 Jest suites / 121
tests, Android Expo export, clean Android prebuild, local-module autolinking,
New Architecture inspection, 14/14 generated Android XML parses, diff checks,
and fresh-base patch application plus TypeScript/lint/test validation. Expo
Doctor remains 20/21 solely because of the pre-existing SDK 57 patch drift;
Checkpoint 5 changes no dependencies. Local Kotlin/Gradle compilation is not
available, so the new native prop and production navigation composition still
require EAS Development/Preview compilation and physical-device QA before
merge.

Final user physical-device QA accepted the Checkpoint 5 production navigation
as functionally safe and usable. The Material presentation is accepted but the
user prefers the earlier clear rounded-pill selected treatment; the Liquid
presentation is accepted but its bounded backdrop reads too static between
route refreshes. Both are explicitly deferred as Checkpoint 6 visual/runtime
refinements and do not invalidate the dispatcher, centralized routing/haptics,
shared layout metrics, single-host Liquid architecture, or Checkpoint 5 merge.
This QA adds no API 31–32, physical API 24–30, release-size, thermal/battery, or
formal frame-time evidence. The repository and PR contain no separate archived
EAS compile log for the Checkpoint 5 `interactionEnabled` addition, so that
compile result is not claimed independently from the accepted device runtime.

### Checkpoint 6 transient UI and navigation refinements (2026-09-01)

Checkpoint 6 starts from the exact PR #13 squash commit above on
`feat/checkpoint-6-transient-ui`. Its official scope is shared bottom-sheet and
transient-surface behavior before Checkpoint 7 screen migration. Two accepted
Checkpoint 5 follow-ups are carried into the same branch: restore a restrained
rounded Material selected-navigation pill without changing the dispatcher or
layout architecture, and investigate bounded contextual Liquid backdrop
refresh because the user found route-only capture visually too static.

The Liquid investigation must keep one bounded optical host, zero recurring
idle capture, no JavaScript frame loop, and the existing API/failure tiers. A
small generic renderer capability may be shared with transient control
surfaces if its dirty-event ownership and cleanup remain explicit. Permanent
high-frequency capture, multiple navigation hosts, whole-screen capture, new
graphics runtimes, and general glassmorphism remain outside authorization.

The stale navigation backdrop came from a narrow invalidation contract rather
than RenderEffect or AGSL: the registered pre-draw listener captured only when
`capturePending` was set, while production navigation disabled touch capture
and ancestor scrolling/layout did not set that flag. The native host now adds
view-tree scroll and global-layout dirty observers. Requests share the existing
bounded capture path, coalesce while pending, and are limited to roughly 30fps
during active changes. A single trailing dirty request preserves the final
settled frame; it is removed together with all observers on detach/destruction.
There is no Choreographer loop, JavaScript frame callback, or recurring idle
capture. The selected-indicator transform does not scroll or lay out the host,
so its spring does not cause backdrop capture. Paint-only animations that do
not scroll or lay out remain an explicit-refresh limitation.

The transient-UI audit found two custom production bottom sheets: day history
and goal deposit/withdraw. Both duplicated a core-Animated/PanResponder motion
hook. `AppAlert` remains the centralized dialog, and the add/edit route modals
remain route-owned rather than being reclassified as sheets. The already
installed `@expo/ui` 57.0.14 community bottom sheet is now the shared Android
contract for the two sheets. Its native Material 3 modal owns system back,
scrim blocking/dismissal, swipe dismissal, two-state partial/full detents,
scroll handoff, and IME behavior; the manual JS motion hook is removed.

Material sheets use an opaque semantic container. Liquid sheets use the
existing reduced-motion-aware tonal Liquid surface. This is intentional: the
native sheet lives in a separate dialog window, while the optical renderer can
capture only its immediate parent in one window. Cross-window optical capture
would require a materially heavier renderer and is not adopted or faked. The
native Material 3 scrim remains full-screen depth separation without full-screen
blur. A shared 48dp close action and modal accessibility boundary remain in
React, and successful deposit/withdraw actions emit one light haptic; rejected
actions and detent movement do not vibrate.

Checkpoint 6 adds no dependency or iOS change. Final local gates pass
TypeScript, ESLint, 16 Jest suites / 132 tests, Android Expo export, clean
Android prebuild, local-module autolinking, New Architecture inspection, and
14/14 generated Android XML parses. Expo Doctor remains 20/21 only for the
pre-existing SDK 57 patch drift (`expo`, `expo-constants`, and `expo-font`).
Local Kotlin/Gradle compilation was not performed; EAS Development/Preview and
physical-device QA remain required for the native observer lifecycle, live
navigation freshness, both API 31–32 and API 33+ optical tiers, sheet behavior,
visual quality, and performance. Checkpoint 7 has not started.

Final Checkpoint 6 validation is now complete for the unchanged production
source in PR #14. The EAS Android build succeeds. User physical-device QA
passes the Material rounded pill, navigation behavior, FAB/snackbar geometry,
Liquid live backdrop response while scrolling, settled post-scroll backdrop,
visible idle behavior, rapid tab switching, and artifact/flicker checks.
History and goal deposit/withdraw sheets pass in both themes with Android back,
scrim, swipe dismissal, scroll handoff, keyboard/IME, reduced motion, and
TalkBack. No crash, noticeable lag, or noticeable heat/battery issue was
observed, and the user accepts Checkpoint 6 for squash merge.

This is strong qualitative device evidence only. It is not formal frame-time,
GPU, CPU, memory, battery-discharge, or thermal instrumentation. Release APK
size and physical API 24–30/API 31–32 evidence remain unavailable. The final
follow-up commit changes only these source-of-truth documents; EAS/native and
device evidence applies to the unchanged implementation commit
`8da3269ef897d99f1e7b9fb63cffdba4743967b3`. PR #14 was subsequently
squash-merged as `09e8c48259f45a9e420fd5a163f182da8d811c04` after the
documentation-only follow-up CI passed. Checkpoint 7 starts from that exact
commit on `feat/checkpoint-7-screens` in an isolated worktree. Its authorized
foundation work is limited to Expo SDK 57-compatible patch alignment and a
shared Android press-feedback correction before the documented screen
migration. Checkpoint 8 has not started.

Checkpoint 7 completes that authorized scope locally. Expo's SDK 57 resolver
aligned `expo` 57.0.17→57.0.19, `@expo/ui` 57.0.14→57.0.15, and compatible
patches for dev client, image, image picker, linking, notifications, Router,
and sharing. The existing `expo-constants ~57.0.8` and `expo-font ~57.0.1`
manifest ranges remain valid while the lockfile resolves 57.0.17 and 57.0.3.
React 19.2.3, React Native 0.86.3, Gesture Handler 2.32.0, Reanimated 4.5.1,
and Worklets 0.10.1 do not change. `expo install --check` is clean and Expo
Doctor returns 21/21 without exclusions.

The Android flash audit found fragmented feedback ownership: controls used
different direct ripple colors, Material navigation used a foreground,
borderless ripple across the full destination, and several controls layered a
native ripple with a separate pressed opacity or scale. The shared contract now
uses a semantic 12% background ripple for Material, with `borderless` and
`foreground` both false and each Pressable clipped to its intended geometry.
Liquid controls use their restrained opacity state instead. Disabled controls
produce neither ripple nor pressed flash. The accepted Liquid navigation file,
single optical host, `interactionEnabled={false}`, contextual capture, spring,
haptic gate, and zero-idle-refresh contract are unchanged.

The screen migration introduces shared semantic headings, tonal grouped forms,
a day-grouped financial History timeline with native day-detail sheet access,
clear add/edit route titles, large-text-safe empty states, localized
celebration/snackbar copy, and stronger modal semantics. Today retains classic
RNGH Swipeable compatibility plus the UI-thread drag controller; Goals retains
manual-order-safe drag and extracted filter/sort presentation. Habit detail's
optional pinch dismissal moves from a core-Animated JS listener to Gesture
Handler/Reanimated and sends only the final committed action to React.

Local validation passes TypeScript, warning-free ESLint, 18 Jest suites / 145
tests, Expo Doctor 21/21, Android export, clean Android prebuild, module
resolution, New Architecture inspection, and 14/14 XML parses. Local native
Kotlin/Gradle compilation is not claimed. Dependency patch changes require a
new EAS Development/Preview build and physical-device QA for ripple geometry,
both themes, large text/TalkBack, swipe/reorder/pinch, keyboard forms, and the
unchanged Liquid navigation before the Checkpoint 7 PR can merge. Release APK
size and physical API 24–30/API 31–32 evidence remain unavailable.

The isolated Checkpoint 7 patch applies cleanly to exact base
`09e8c48259f45a9e420fd5a163f182da8d811c04`. Its disk-backed verification
checkout completed a cold `npm ci`, TypeScript, warning-free ESLint, and all
18 Jest suites / 145 tests. This verifies patch reproducibility for the
JavaScript/TypeScript gates; it is not Android native compilation evidence.

Final Checkpoint 7 EAS Android compilation succeeds, and the user accepts the
checkpoint after physical-device QA. The corrected semantic ripple eliminates
the reported flash. Liquid navigation passes live blur, settled capture, idle,
rapid-tab, flicker/artifact, and perceived-performance checks. Today swipe and
all exercised reorder directions/drop cases pass without jumping or vanishing;
Goals filter/sort, reorder, and transaction sheets pass. Habit/goal add, edit,
detail, keyboard/IME, navigation actions, Settings theme/language/reminders and
persistence, History grouping/day detail, TalkBack, large text, and reduced
motion pass. No crash, noticeable lag, or noticeable heat/battery issue was
observed. This remains qualitative evidence rather than formal frame-time,
GPU/CPU/memory, thermal, or battery instrumentation.

One accepted non-blocking visual issue remains: in Liquid light mode the
navigation-wide material reads as a dense charcoal slab even though live
capture and idle behavior are correct. By explicit user decision, Checkpoint 7
is not reopened; Checkpoint 8 must audit the optical fallback, tint, adaptive
contrast, edge, selected-indicator, and text/icon color ownership and establish
a light-specific contextual material while retaining the accepted dark mode,
one-host capture, API tiers, and zero-idle contract. Release APK size and
physical API 24–30/API 31–32 Liquid evidence remain unavailable.

The final PR review found one independent gesture-finalization defect: a
cancelled habit-detail pinch could retain its partial scale because only a
successful `onEnd` reset it. The follow-up adds an `onFinalize` cancellation
reset on the UI runtime plus a source-contract guard. This is a scoped
JavaScript gesture-lifecycle correction; the preceding EAS/device evidence
applies to the otherwise unchanged Checkpoint 7 implementation and is not
misrepresented as testing the cancellation path.

PR #15 was squash-merged after its final source and documentation CI passed as
`17a8dacd9518590e8dfe5f0fb313ec94085e7810`. The successful EAS build and user
physical-device QA accept Checkpoint 7: the ripple flash is gone; Liquid live,
settled, idle, rapid-tab, artifact, and perceived-performance checks pass;
Today swipe/reorder, Goals filters/reorder/transactions, all habit/goal forms
and IME, Settings persistence, History grouping/day detail, TalkBack, large
text, and reduced motion pass. No crash, noticeable lag, or noticeable
heat/battery issue was observed. This remains qualitative evidence, not formal
frame/GPU/CPU/memory, battery, or thermal instrumentation. Release APK size and
physical API 24–30/API 31–32 Liquid evidence remain unavailable.

Checkpoint 8 starts from that exact squash commit on
`feat/checkpoint-8-widget-fixes` in an isolated worktree. Its first correction
resolves the accepted non-blocking light Liquid navigation issue. The root
cause was color composition, not capture: an alpha-bearing primary-container
role received a second appended alpha, yielding an invalid color that left the
native charcoal default in place; the same role was too dense for a light
fallback. Navigation now opts into a neutral semantic light optical material
with valid tint composition and light-specific bounded adaptive contrast.
Dark mode, selected accent, the single bounded host, contextual/coalesced live
capture, trailing settled capture, zero recurring idle work, API tiers, and
failure fallback remain unchanged. The native module adds only a material flag,
so EAS compilation and physical light/dark QA are still required.

The widget investigation confirms the JavaScript builder and native parser
share the expected schema: up to eight active habits, ordered by `sortOrder`,
with color, streak, and exactly 14 local calendar days oldest to newest. The
data defect was asynchronous write ordering: debounced calls were not
serialized, so an older native update could finish after a newer mutation. A
pure coordinator now serializes writes and coalesces in-flight changes into one
latest-state follow-up. Final review found that advancing only the native day
cells at midnight could desynchronize them from the JS-derived `currentStreak`.
CP8 therefore keeps all date-derived values on the same snapshot timestamp;
the next centralized app/store synchronization advances cells and streak
together.

The widest-layout issue came from assigning every day cell `defaultWeight()`:
the same 14 cells collapsed behind fixed chrome at minimum width and stretched
without bounds at wide sizes. The renderer now uses deterministic compact,
medium, and wide classes with bounded square cells, adaptive name/streak chrome,
and height-derived one-to-eight row capacity. The provider resize range stays
180–450dp wide and 70–500dp tall; comments and description now correctly say
14 calendar days rather than rows or 30 days. No dependency or Checkpoint 9
variant is added.

Checkpoint 8 local validation passes TypeScript, warning-free ESLint, 22 Jest
suites / 159 tests, Expo Doctor 21/21, Android export, and clean Android
prebuild. Expo autolinking resolves `expo-home-widgets`, `expo-liquid-glass`,
and `@expo/ui`; New Architecture remains enabled; all 21 generated/module
Android XML files parse; no iOS or package/lockfile drift exists. Local
Kotlin/Gradle compilation and physical launcher testing are unavailable.

The user reviews the resulting physical screenshots and accepts CP8 for squash
merge while deliberately replacing its presentation direction in CP9. The
screenshots show that the invalid charcoal light-navbar failure is gone, but
light Liquid navigation is now too faint and dark Liquid navigation still has
a green Material-You cast. The current heatmap remains visually awkward despite
its corrected data and sizing infrastructure. These are CP9 design findings,
not reasons to discard serialized snapshot writes, the safe parser, the one-host
Liquid capture lifecycle, or the API/failure tiers.

Checkpoint 9 is expanded into the final major product/design checkpoint. It
must deliver exactly four widget concepts (redesigned heatmap, simple tracker,
saving, and chart), final neutral Liquid navbar tuning, Liquid-inspired tonal
native sheets, the deposit/withdraw horizontal-shift fix, a transaction-derived
savings chart and full progress route, History-to-goal navigation, a modern
savings progress visual, and redesigned onboarding. The local reference images
are evidence only and must not ship. CP10 remains testing, release size,
performance, polish, small fixes, and final QA. No CP8 EAS result, release APK,
formal performance/battery/thermal result, or physical API 24–30/API 31–32
Liquid evidence is invented by this handoff.

### Checkpoint 9 widget suite and final product redesign (2026-09-02)

PR #16 was finalized with the CP8 snapshot-timestamp review correction and
squash-merged at `4df624a0e66c16a76d56a12bca91d426378319fd`. Checkpoint 9 starts from
that exact `origin/main` commit on `feat/checkpoint-9-widget-suite` in
`/home/immz/heibi-checkpoint-9-widget-suite`. The local visual references were
inspected as composition/bug evidence only and are not part of the workspace or
delivery patch.

Checkpoint 9 replaces the rejected widget presentation while retaining CP8's
serialized/coalesced latest-state write pipeline. Snapshot v2 adds goal
creation timestamps, `dueToday`, and a bounded newest-first transaction stream;
the native parser remains defensive. Exactly four Glance providers consume it:
redesigned 14-day heatmap, today's completion tracker, selected-goal saving
progress, and selected-goal balance chart. The chart uses a small Android
Canvas bitmap rather than a new chart/runtime dependency. One native route
object owns widget actions. EAS native compilation and physical launcher
resize/tap/data-refresh validation remain required.

Liquid's visual problem was color ownership, not capture. Wallpaper-derived
`primaryContainer` flowed through `surfaceInteractive` into navigation and
native-dialog sheet chrome, creating the dark green cast and weak light
boundary. Renderer-specific neutral light/dark roles now own navigation
fallback/tint/edge and Liquid sheet tone. Material dynamic color and the
selected accent remain intact. Navigation source/native capture lifecycle is
unchanged: one bounded host, `interactionEnabled=false`, coalesced contextual
refresh, one settled capture, no idle/JS frame loop, and unchanged tonal/blur/
AGSL/failure tiers. The native renderer Kotlin source is unchanged.

The goal transaction sheet's horizontal defect came from the SDK 57 community
sheet dynamic-size host measuring Heibi's unconstrained RN content at intrinsic
width. The shared host/surface now establishes `width: 100%`; native Compose
dialog, Android back, scrim, swipe, scrolling, and IME ownership stay intact.
Liquid sheets remain neutral tonal surfaces because cross-window optical
capture is still not claimed.

Savings now derives an accessible chronological running-balance line from real
transactions (deposit positive, withdrawal negative) with deterministic
same-time ordering and persisted current balance as the final authority. Goal
detail uses a compact progress/chart card that opens nested
`goal/[id]/progress`; the route is not a tab. History transactions open an
existing related goal and safely remain non-navigable after deletion. The old
looping decorative bottle is replaced by a static abstract reserve vessel.
Onboarding retains its four-step language, persistence, permission, and
reduced-motion flow but gains a clearer Heibi story composition and hierarchy.

Local validation passes Expo Doctor 21/21, TypeScript, warning-free ESLint,
23 Jest suites / 169 tests, Android export, and clean Android prebuild. Expo
autolinking resolves both local modules and `@expo/ui`; New Architecture stays
enabled; all 26 generated/module XML files parse; no package/config/iOS change
exists. The final patch also applies cleanly to a disk-backed checkout at the
exact CP9 base; a cold `npm ci` followed by Expo Doctor 21/21, TypeScript,
warning-free ESLint, and 23 Jest suites / 169 tests passes there. EAS
compilation and physical device/launcher QA remain pending. Release APK
size, formal performance/battery/thermal instrumentation, and physical Liquid
API 24–30/API 31–32 evidence remain unavailable. Checkpoint 10 has not started.

## Repository

- Repo: `karimm1620/heibi`
- Android package: `com.immz.heibi`
- Android only.
- Expo SDK 57.
- React Native 0.86.3 after Expo SDK 57 patch alignment.
- React 19.2.3.
- New Architecture enabled.
- App version at handoff: `2.5.5`.
- `app.json` and `package.json` versions must remain synchronized when version changes are made.
- EAS manages `versionCode`.

## Binding dependency and native-integration policy

- Install or update Expo and React Native packages with
  `npx expo install <package>`.
- Run `npx expo-doctor` after every dependency addition or update.
- Android-native dependencies and custom Android modules are allowed when
  technically justified; Android-only does not mean JavaScript-only.
- Before adopting native code, evaluate APK size, Android API requirements and
  fallback behavior, New Architecture compatibility, Expo
  prebuild/autolinking/config-plugin requirements, release performance,
  maintenance/ownership cost, and licensing/distribution obligations.
- Native/config/plugin changes, including dependencies that alter native
  autolinking or generated projects, require `npx expo prebuild --clean` and
  inspection of the generated Android output.
- Do not add iOS implementation, configuration, or fallback work.
- Heavy dependencies are allowed only with technical justification. Meaningful
  APK, performance, or architecture trade-offs still require stopping for the
  significant-finding gate before adoption.
- The user-measured APK baseline remains approximately 65 MB. Warn at 90 MB;
  100 MB is a hard limit and blocker.

## Existing validation baseline

The project has an automated Jest suite and CI.

Mandatory local validation order:

1. `npx tsc --noEmit`
2. `npx eslint .`
3. `npx jest`
4. `npx expo export --platform android`
5. `git apply --check` in a separate fresh clone.
6. Apply the patch in that verification clone and rerun typecheck/lint/Jest.
7. Native/config/plugin changes, including dependencies that affect native
   autolinking or generated projects, require `npx expo prebuild --clean`.

Dependency additions or updates also require `npx expo-doctor` and a cold
install test in a fresh clone with npm cache explicitly cleared. Native,
config, or plugin changes require generated Android output inspection after
prebuild; a successful prebuild command alone is insufficient.

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

Every heavy native/rendering dependency must be technically justified and have
its projected or measured size evaluated before adoption. Heavy dependencies
are not categorically forbidden, but meaningful APK, performance, or
architecture trade-offs trigger the stop gate.

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
