# heibi — Decision Log

Codex should append decisions here. Do not silently overwrite old decisions.

---

## D-001 — Android only

**Status:** accepted

heibi remains Android-only for this scope.

Apple design documentation may be studied, but no iOS implementation or fallback work should be produced.

---

## D-002 — Two visual themes, one product architecture

**Status:** accepted

Supported visual languages:

- Material 3 Expressive.
- Liquid Glass.

They share information architecture, data behavior, accessibility, and core components where possible.

Do not fork the entire UI into two independent screen trees.

---

## D-003 — Existing users default to Material 3

**Status:** accepted

When no `visual_theme` setting exists, use `material3`.

Reason:

- preserves current visual behavior.
- avoids surprising existing users after update.

---

## D-004 — Liquid Glass is not glassmorphism

**Status:** accepted

Generic frosted white translucent cards are explicitly not the target.

Liquid material must be selective and interaction/context aware.

---

## D-005 — Apple API is not the implementation target

**Status:** accepted

Apple documentation is a behavior/design reference only.

If the relevant Expo API is iOS-only, it is not usable for heibi.

Android-native implementation should be investigated.

---

## D-006 — Native Liquid implementation requires a research gate

**Status:** accepted

Before adopting a custom module or graphics library:

- research Convx.
- research platform APIs.
- evaluate performance.
- evaluate API compatibility.
- evaluate APK size.

Significant trade-off requires user direction before implementation.

---

## D-007 — APK budget

**Status:** accepted

User-reported baseline:

- ~65 MB APK.

Budget:

- 90 MB = early warning.
- 100 MB = hard blocker.

No heavy visual dependency should be added without size justification.

---

## D-008 — No tab screen slide

**Status:** accepted

Peer tabs should not use a hand-rolled horizontal page slide.

The requested "smooth/bounce" treatment applies to navigation chrome/selection material, not moving whole peer screens sideways.

---

## D-009 — Preserve UI-thread drag reorder

**Status:** accepted

The recently merged Gesture Handler + Reanimated drag implementation must not be replaced by PanResponder/JS-thread per-frame state updates.

---

## D-010 — Widgets prioritize correctness before new variants

**Status:** accepted

Order:

1. reproduce/fix heatmap data/layout.
2. verify resize/update behavior.
3. add tracker and savings variants.

---

## D-011 — Audited source supersedes the abbreviated handoff inventory

**Status:** accepted

Remote `main` was verified at
`33ceb2f3bf49beda735402eb2bd03f4309455d88`. At that exact SHA the source
already contains more overhaul work than the unchecked planning documents
listed:

- Material You palette mapping, M3 tokens/type scale, and Roboto Flex.
- an M3 navigation bar with centralized FAB/snackbar geometry.
- `@expo/ui` date-time picker usage.
- Jetpack Glance heatmap and goal-balance widgets.
- a 14-day widget habit window.

Do not recreate those foundations. The remaining first implementation
checkpoint is the persisted semantic `material3 | liquid` contract. See
`CHECKPOINT_0_AUDIT.md` for the full inventory.

---

## D-012 — Semantic theme adapter precedes component and screen redesign

**Status:** accepted

### Finding

`useTheme()` maps Material 3 directly into an app color/type object and also
exposes the raw M3 scheme. There is no visual-theme setting or Liquid adapter.
The generic SQLite settings table can persist this preference without a schema
migration.

### Decision

Checkpoint 1 will add a validated `VisualTheme` setting and a semantic adapter
above both visual languages. Unknown, absent, or malformed stored values fall
back to `material3`. Screen-level theme forks are not allowed for ordinary
color, type, shape, or state styling.

---

## D-013 — `GlassCard` is a compatibility name, not the Liquid foundation

**Status:** accepted

### Finding

`GlassCard` currently renders an opaque M3 tonal/elevated surface. Its name no
longer describes its implementation, but it is broadly reused.

### Decision

Checkpoint 2 should first place it over a semantic surface contract or migrate
call sites incrementally. Do not rename every use in one mechanical patch and
do not make every existing card translucent merely because the old name says
“Glass”.

---

## D-014 — Convx is concept evidence, not reusable MIT implementation code

**Status:** accepted

### Finding

Convx implements backdrop capture, blur, and refraction in source-vendored
Jetpack Compose code. Its repository is GPL-3.0 and declares Android API 26 as
its project floor. heibi is MIT and currently targets a broader generated
Android floor.

### Options

1. Copy/adapt Convx renderer source and change the distribution/licensing
   posture to satisfy GPL obligations.
2. Build a small original Android renderer inside heibi and independently
   prove API fallback, release performance, maintenance cost, and APK delta.
3. Use existing heibi/Android capabilities for a selective tonal/translucent
   Liquid-inspired treatment without real refraction.
4. Adopt a separately licensed renderer only after dependency, size, API, and
   release-performance review.

### Trade-offs

- APK: options 1, 2, and 4 need measurement; no estimate is yet trustworthy.
- performance: real backdrop sampling/blur/refraction adds GPU/rendering cost.
- Android compatibility: Convx's API 26 floor cannot silently narrow heibi's
  support.
- maintainability: a custom native renderer is a new long-lived subsystem.
- visual fidelity: option 3 is safest but cannot honestly claim real optical
  refraction.
- dependency/license risk: GPL source cannot be copied into an MIT-only
  distribution without resolving obligations.

### Recommendation

Proceed through the semantic M3/Liquid foundation without a renderer. At
Checkpoint 4, prototype option 2 or 3 first; keep Convx concept-only. Stop for
user direction before adopting GPL source, narrowing API support, or adding a
graphics dependency.

### User decision

On 2026-08-26 the user approved continuing with the recommendation after the
Checkpoint 0 report. This approval is intentionally narrow: Convx remains
concept-only, Checkpoint 1 may proceed without a renderer, and Checkpoint 4
must ask again before GPL source adoption, an Android API-floor change, a
graphics dependency, or a custom optical renderer.

---

## D-015 — Repository-local agent bundles are outside the app lint boundary

**Status:** accepted

### Finding

With the required project-local Impeccable installation present, the mandated
`npx eslint .` command traversed `.agents` and `.expo` and reported 137 errors
inside tool/generated files. The application scope (`app`, `src`, `modules`,
and `plugins`) was clean.

### Decision

ESLint ignores `.agents/**`, `.codex/**`, and `.expo/**`. These directories are
development inputs or generated state, not shipped application source. This
keeps the required root command meaningful without weakening rules for app
code.

---

## D-016 — Widget “14 units” means days horizontally until device evidence disproves it

**Status:** accepted

### Finding

The TypeScript snapshot already emits 14 ordered days per habit. The Glance
widget renders those days horizontally and chooses the number of habit rows
from available height. The existing goal-balance widget is already a savings
widget.

### Decision

Do not change the 14-day constant or resize dimensions from the report alone.
Checkpoint 8 must reproduce the launcher behavior and distinguish horizontal
days from vertical habit rows, then inspect snapshot freshness and date
rollover. Checkpoint 9 must clarify whether the requested savings widget is a
new variant or a redesign of GoalBalance.

---

## D-017 — Visual theme is a validated generic setting, not a schema migration

**Status:** accepted

### Finding

The existing `settings` table already persists arbitrary key/value data. A
theme preference does not require a new column, table, or migration. Missing,
malformed, or future values can occur on an older database or through a
hand-edited/imported backup.

### Decision

Persist JSON-encoded `material3 | liquid` under `visual_theme`. Missing,
malformed, unknown, or wrong-type values resolve to `material3` without
rewriting the database during hydration. The setter remains write-through:
SQLite succeeds before the in-memory theme changes.

This preserves existing users and avoids persisted-data migration risk. The
setting participates in the existing backup/restore path like other user
preferences.

---

## D-018 — Semantic adapters own theme branching; raw M3 is temporary compatibility

**Status:** accepted

### Finding

Many existing components still consume the raw Material 3 palette. Removing
that surface in Checkpoint 1 would turn a bounded foundation change into the
shared-component migration planned for Checkpoint 2.

### Decision

`useTheme()` now selects one centralized semantic contract containing colors,
typography, shapes, motion, and effects. Android dynamic color and system
light/dark feed both adapters. The raw `material3` scheme remains available as
a compatibility field until Checkpoint 2 migrates shared primitives.

The Liquid contract deliberately declares `backdropRenderer: "none"` and
keeps content surfaces opaque-tonal. It may express selective translucent
chrome intent, but it does not claim blur/refraction before the Checkpoint 4
feasibility gate.

---

## D-019 — AppSurface is the semantic content foundation; GlassCard is compatibility

**Status:** accepted

### Finding

`GlassCard` is used widely, but its name no longer describes the intended
architecture. Renaming every call site would create a large mechanical diff,
while making every card translucent would violate the selective Liquid
material direction.

### Decision

`AppSurface` owns semantic tone, shape, outline, and elevation variants.
`GlassCard` delegates to it and preserves its tint, radius, and M3 elevation
props for incremental migration. Both themes keep content surfaces opaque and
tonal. Any future backdrop/optical treatment must be a separate chrome-focused
primitive after the Checkpoint 4 evidence gate.

This adds no dependency, native code, renderer, or expected APK growth.

---

## D-020 — Shared interaction state lives in the semantic contract

**Status:** accepted

### Finding

Buttons, chips, FABs, and rows repeated raw Material colors, ripple alpha,
disabled opacity, and touch-target decisions. That made Liquid behavior drift
and left some fixed rows below the 48dp Android target.

### Decision

Theme adapters now provide disabled/pressed/ripple/scale and minimum-target
state tokens plus semantic shadows. Shared buttons, chips, the FAB, list rows,
alerts, snackbar, and common form actions consume those roles. Material uses
bounded Android ripple feedback; Liquid uses opacity and a restrained FAB
scale without claiming blur or refraction. Reduced motion disables the FAB
scale transition.

`@expo/ui` continues to own existing native date/time controls. Existing
screen-specific toggles and selectors are not wrapped or redesigned in this
checkpoint; those remain part of the screen and transient-UI checkpoints.

---

## D-021 — Material surface and accent roles keep dynamic color pairings intact

**Status:** accepted

### Finding

The first semantic mapping used a secondary accent container for both neutral
interactive surfaces and selected state, while the legacy `glassTintLight`
role added transparency to ordinary content. That flattened neutral hierarchy
and left the tertiary dynamic palette without a deliberate purpose.

### Decision

Material maps neutral hierarchy directly to the M3 surface-container ladder:
background uses `surface`, base content uses `surfaceContainerLowest`, elevated
content uses `surfaceContainerLow`, muted grouping uses `surfaceContainer`, and
high-emphasis neutral interaction uses `surfaceContainerHighest`. Selected
controls keep the secondary container pair; rare expressive highlights use the
tertiary container pair. Foreground colors always use the matching `on*` role.

The compatibility tint is now opaque. Fixed deposit/withdraw colors remain
unchanged because their financial meaning must not follow wallpaper color.

---

## D-022 — Expressive geometry is original SVG and remains selective

**Status:** accepted

### Finding

The app already had an original rounded-polygon badge implemented with
`react-native-svg`, but its geometry was private to one celebration. Adding a
second cookie implementation or Android graphics library would duplicate the
system and create unjustified APK/runtime cost.

### Decision

Checkpoint 3 promotes that original geometry into a tested `CookieShape` and
adds a tested `WaveShape` using the already-installed SVG runtime. Material
selected controls use a reusable asymmetric corner token; they do not morph or
animate because these controls are used frequently and Android ripple already
provides immediate feedback.

Cookie use is limited to the existing celebration and Material theme preview.
Wave use is limited to that preview and the representative Goals summary.
Ordinary cards remain rounded rectangles, and Settings groups use tonal depth
without shadows. No dependency, native code, copied Material path data, API
floor change, Liquid renderer, or expected APK growth is introduced.

---

## D-023 — Ship the tonal feasibility fallback; defer the optical renderer

**Status:** proposed — waiting for user direction

### Finding

Apple defines Liquid Glass as a distinct functional plane for controls and
navigation, not a decoration for the content layer. Its identity depends on
context-sensitive lensing, tint, contrast, shadow, and interaction light; blur
alone is not equivalent. This reinforces heibi's existing rule that ordinary
content remains opaque/tonal.

Convx implements the optical version in Jetpack Compose. A root
`LayerBackdrop` records the app content into Compose `GraphicsLayer` objects;
each material surface samples that layer, downsizes it when blur permits, and
chains saturation, `BlurEffect`, an AGSL lens `RuntimeShader`, highlight, tint,
and shadow. Its own gates and comments establish the real platform split:

- the app declares `minSdk = 26`, while heibi supports API 24;
- backdrop blur and the effect chain require `RenderEffect` on API 31+;
- lens/refraction requires `RuntimeShader`/AGSL on API 33+;
- below API 31, and on low-RAM devices, Convx uses a translucent tinted fill;
- it skips the lens on API 31–32, so those devices receive blur without
  refraction;
- full treatment records and processes offscreen layers per material surface;
  Convx documents severe frame/battery regressions when an infinite highlight
  or changing capture geometry invalidated that work each frame;
- Convx vendors a modified Apache-2.0 Kyant0/backdrop source tree, but the Convx
  repository and its integration code are GPL-3.0. No Convx code was copied.

heibi already has Reanimated 4, Gesture Handler, `react-native-svg`, New
Architecture support, Expo Modules autolinking, and one Android-only Kotlin
module. That is enough to build interaction and an original native view, but
none of those existing capabilities sample and refract arbitrary React Native
content. The installed Glance/Compose dependency is scoped to AppWidgets and
does not make a Compose renderer inside the React Native view tree free.

Official Expo options do not close the gap. `expo-glass-effect` is iOS-only.
`expo-blur` can target Android content, but its efficient path also begins at
API 31, its older fallback carries a documented performance penalty, and it
still supplies blur rather than optical refraction. A BlurView-only design is
therefore both visually insufficient and outside this checkpoint's dependency
boundary.

### Options

1. Keep the Checkpoint 4 dependency-free tonal material as the production
   fallback on API 24+ and ship Liquid-inspired interaction without claiming
   optical refraction.
2. Build an original Android-only Expo native view that captures a bounded
   backdrop and uses `RenderEffect` on API 31–32 plus AGSL/`RuntimeShader` on
   API 33+, falling back to the tonal POC on API 24–30 and low-RAM devices.
3. Add Compose UI and an independently authored backdrop renderer inside an
   Expo native view, retaining the same API/fallback gates.
4. Add `expo-blur` for API 31+ and keep the tonal fallback below API 31, while
   explicitly accepting that this is frosted blur rather than Liquid Glass.
5. Add a graphics runtime such as Skia and independently implement capture,
   refraction, accessibility, and fallbacks.
6. Copy or adapt Convx's integrated renderer and satisfy GPL-3.0 obligations
   for the distributed app.

### Trade-offs

| Approach | API/fallback | APK/dependency | Release performance | Complexity/maintenance | Expected fidelity |
| --- | --- | --- | --- | --- | --- |
| Tonal POC | API 24+; identical semantic fallback | no dependency/native/config delta | low; ordinary Views and bounded state transitions | low | low optical, medium behavioral |
| Original View/Canvas native renderer | API 31 blur, API 33 lens; API 24–30 tonal | native code; APK delta must be measured | medium/high; bounded capture invalidation and low-RAM gating required | high, long-lived Expo module | high only on API 33+ |
| Original Compose native renderer | same API split | Compose UI/native integration; APK delta unknown | medium/high plus RN/Compose interop | highest | high only on API 33+ |
| `expo-blur` | efficient API 31+; tonal or costly legacy path below | one native dependency; delta unknown | medium; no refraction | medium | low/medium |
| Skia/custom graphics runtime | renderer-specific | meaningful native dependency likely; measure first | medium/high | high | potentially high |
| Convx source | Convx floor API 26; same 31/33 optical split | large source/native posture unknown | known capture-chain risk | high plus GPL compliance | high |

The dependency-free POC adds one reusable `LiquidMaterialSurface`, one
accessible 48dp selected control, and an unlinked development-only route. It
uses a semantic translucent tone, one restrained edge highlight, native
API 24–27 elevation fallback, modern Android shadow, press light/scale, and
reduced-motion handling. A capability constant and test explicitly record
that it performs no backdrop capture, blur, or refraction. It is not a claim
that the optical problem is solved.

### Recommendation

Accept the tonal POC as heibi's mandatory API 24+/low-RAM fallback. Do not add
`expo-blur`, Compose UI, Skia, Convx source, or a custom optical native view in
this checkpoint. If higher fidelity is required, choose option 2 as a separate
Android-native renderer investigation with these gates before rollout:

1. original implementation only, with documented provenance;
2. API 24–30 and low-RAM tonal fallback; blur-only API 31–32; optional lens on
   API 33+;
3. bounded chrome targets only, never whole screens or content cards;
4. physical release-device frame, memory, thermal, and battery traces;
5. measured universal and per-ABI APK deltas;
6. reduced motion, contrast, and transparency accommodations;
7. no Checkpoint 5 navigation adoption until the renderer decision is
   accepted.

### User decision

On 2026-08-27 the user explicitly authorized option 2 as a separate,
independently authored Android-native renderer investigation. This authorizes
one isolated Checkpoint 4 prototype and its measurements; it does not authorize
production adoption, Checkpoint 5, navigation migration, screen migration,
replacement of the API 24+ tonal fallback, or use of Convx implementation or
shader source.

### Sources inspected

- Apple app design and Liquid Glass technology overview:
  `https://developer.apple.com/documentation/TechnologyOverviews/app-design-and-ui`
- Apple HIG Materials and WWDC25 “Meet Liquid Glass”:
  `https://developer.apple.com/design/human-interface-guidelines/materials`
  and `https://developer.apple.com/videos/play/wwdc2025/219/`
- Convx repository, `GlassEffect.kt`, and vendored backdrop implementation:
  `https://github.com/cosmictaserdev-creator/Convx`
- Android `RenderEffect`, `RuntimeShader`, AGSL, and `RenderNode` references:
  `https://developer.android.com/reference/android/graphics/RenderEffect`,
  `https://developer.android.com/reference/android/graphics/RuntimeShader`,
  `https://developer.android.com/develop/ui/views/graphics/agsl`, and
  `https://developer.android.com/reference/android/graphics/RenderNode`
- Expo native-view, GlassEffect, and BlurView documentation:
  `https://docs.expo.dev/modules/native-view-tutorial/`,
  `https://docs.expo.dev/versions/latest/sdk/glass-effect/`, and
  `https://docs.expo.dev/versions/latest/sdk/blur-view/`

---

## D-024 — Original optical POC uses a bounded Expo Android View/Canvas host

**Status:** accepted for the Checkpoint 4 experiment; production adoption blocked

### Finding

The authorized investigation still needs a real backdrop source. Applying
`RenderEffect` to an ordinary React Native view only filters that view's own
content; it does not automatically sample sibling content behind it. A viable
prototype therefore has to own both the capture boundary and the optical draw
lifecycle.

The implementation choices were compared against the existing Expo SDK 57,
React Native 0.86/New Architecture, minSdk 24, and Android-only constraints:

| Architecture | Backdrop integration | Dependency/APK posture | Lifecycle and maintenance | Decision |
| --- | --- | --- | --- | --- |
| Existing React Native/Reanimated | no arbitrary sibling backdrop sampling; JS cannot provide a native pixel source per frame safely | no dependency | easiest, but cannot meet the optical goal | rejected for optical rendering; retained for ordinary UI motion |
| Android View/Canvas in a local Expo view | bounded parent capture, platform `Canvas`, `RenderEffect`, and `RuntimeShader` fit the existing view hierarchy | no third-party dependency or native library | explicit attach/detach, bitmap, effect, touch, and child lifecycle in one class | selected for the POC |
| Jetpack Compose inside an Expo view | can host a renderer, but RN/Compose child and semantics interop adds another owner of layout and lifecycle | Compose UI integration and size must be measured | highest interop and maintenance cost; existing Glance is AppWidget-scoped | rejected for this smallest prototype |
| Third-party blur/graphics dependency | library-specific capture; blur alone does not provide restrained lensing | new native dependency and unknown APK delta | adds compatibility, license, upgrade, and ownership surface | not justified |

Expo Modules API is selected because its Android `ExpoView`/`GroupView`
integration supports the New Architecture and keeps the native view and its
React accessibility descendants in one host. No config plugin is required;
the existing `expo.autolinking.nativeModulesDir` discovers the Android-only
local module.

### Prototype architecture

The isolated `ExpoLiquidGlass` module exports one reusable Android group view.
It is mounted only by the unlinked development feasibility route and is never
used by production navigation or screens.

The host must be the final overlay child of a bounded immediate parent. On a
requested capture it draws that parent into a bitmap sized exactly to the
material bounds, translated to the host's window position. The host and all of
its React children suppress their own draw while capture is active, so the
bitmap contains the contextual content behind the material without recursive
glass or ghosted labels. This View-tree capture is intentionally a POC
constraint: `SurfaceView`/`TextureView` content and arbitrary sibling ordering
are not claimed to work.

The captured bitmap is rendered through a rounded clip, then receives semantic
tint, a small luminance-derived contrast correction, and one restrained edge
highlight. The tint comes from heibi's dynamic semantic theme. The edge is a
single light-to-transparent stroke, not a neon border or a second shadow/blur
pass.

Capability tiers are binding:

- API 24–30: do not mount the optical native view; use the existing
  `LiquidMaterialSurface` tonal fallback and make no blur/refraction claim.
- API 31–32: draw the bounded bitmap with one cached platform
  `RenderEffect.createBlurEffect` pass.
- API 33+: feed an independently authored, restrained lens shader from a
  bounded bitmap into `RuntimeShader`; retain the same cached blur pass.
- low-RAM, disabled renderer, missing module, capture failure, missing hardware
  acceleration, or blur failure: return to the existing tonal React Native
  fallback.
- API 33+ shader creation/draw failure: degrade to API 31-style blur; if blur
  also fails, degrade to tonal.
- unacceptable measured performance: the wrapper exposes a renderer-disable
  gate and maximum tier so future callers can force blur or tonal without a
  native-code change.

### Lifecycle and invalidation

There is no continuous redraw while idle.

Backdrop capture occurs on the next pre-draw only when marked dirty by:

- first attach;
- host size or layout change;
- window focus returning;
- an explicit `refreshKey`/imperative refresh;
- touch-down, to refresh context before interaction.

Touch move updates only the API 33 shader's touch uniforms and requests the
next native frame while a finger is active. It does not recapture the backdrop,
schedule JavaScript work, or update React state per frame. Touch up/cancel
resets the direct response in one native invalidation. Reduced motion keeps the
static optical material but disables touch-following refraction.

The bitmap, cached blur effect, and runtime shader are released on detach and
Expo `OnViewDestroys`. Geometry and effects are recreated only after relevant
size/radius/tier changes. The bitmap is bounded to the rendered host; the POC
does not allocate a full-screen capture and does not downsample or duplicate a
second blur/shadow pass.

### Dependency, API, and licensing review

- Renderer dependencies: none added. Android framework APIs and the
  already-present Expo Modules core are sufficient. Expo Doctor required
  patch-aligning the existing Expo SDK 57, React Native, Expo package, ESLint,
  and Jest package set through `npx expo install`; no new renderer/runtime
  package or native library was introduced.
- APK: no third-party native library contribution; Kotlin bytecode/resource
  delta still requires an actual release APK measurement.
- Android APIs: module floor remains API 24; guarded blur begins at API 31 and
  guarded AGSL begins at API 33.
- New Architecture: Expo Modules API supports it; autolinking resolves the new
  local module in the generated Android project.
- Prebuild/config: no config plugin and no iOS platform entry. Clean Android
  prebuild passed; Expo autolinking resolved `expo-liquid-glass` and its module
  classifier, generated Gradle retained New Architecture autolinking, and all
  14 generated Android XML files parsed successfully.
- Runtime: capture and rendering stay on the Android UI/render pipeline. The
  parent capture is synchronous and must remain bounded and selectively
  invalidated.
- Maintenance: one local module, one native host, one original shader, and one
  TypeScript wrapper; parent ordering and capture invalidation are explicit
  contracts future production work would have to own.
- Licensing: `HeibiLiquidShader.kt` states independent authorship. Convx remains
  GPL-3.0 research evidence only; no Convx source, shader, or derivative
  implementation material is included. Android/Expo APIs are used from their
  documented platform contracts.

### Measurement and stop-gate status

Static inspection proves only that idle work is event-driven and that no new
third-party/runtime dependency was added. It does not prove device frame time,
jank, GPU cost, thermal behavior, battery behavior, visual fidelity, or stable
capture across real navigation/scrolling.

Practical local validation passes TypeScript, root ESLint, 108 Jest tests,
Android Expo export, Expo Doctor (21/21), clean Android prebuild, Expo module
resolution, Android XML parsing, and whitespace checks. The exported 5.1 MB
Hermes bundle is not an APK and is not used as an APK-size proxy.

A contained local JDK/Android SDK/Gradle attempt was intentionally stopped. It
compiled the Expo/React Native settings-plugin stages but did not finish native
project configuration. The exact final offline failure was `Could not download
builder-8.5.0.jar (com.android.tools.build:builder:8.5.0): No cached version
available for offline mode`; a preceding bounded online attempt stalled during
dependency resolution. Local Gradle/native compilation and local release APK
measurement are therefore unavailable, not passed. The existing contained
toolchain files remain outside the project patch and are not production
dependencies.

No emulator or physical device was used. Device frame time, jank, memory,
CPU/GPU behavior, idle cost, interaction cost, thermal/battery behavior,
capture stability, and comparative visual fidelity are unavailable. Static
review only establishes the intended event-driven lifecycle; it cannot establish
production performance or visual quality. EAS Development/Preview native-build
validation, actual EAS artifact size, and physical API 31 and API 33+ QA remain
mandatory evidence. The historical APK baseline is approximately 65 MB, the
warning threshold is 90 MB, and 100 MB remains a hard blocker.

The isolated patch passes `git apply --check` on the exact authoritative base.
Cold fresh-clone dependency validation is environment/network incomplete: the
first install exhausted `/tmp` quota, and a disk-backed retry was bounded and
stopped before npm created a usable project-local TypeScript executable. The
subsequent npm fallback to the unrelated deprecated `tsc` package is not a
heibi TypeScript result. Fresh-clone command validation is therefore not
established and is reported separately from the green authoritative-worktree
checks.

### Recommendation

Keep this module and route as a Checkpoint 4 experiment only. Do not start
Checkpoint 5 or migrate any production surface. Production adoption should
remain blocked until API 31 and API 33+ release devices show stable capture,
acceptable frame/memory/thermal behavior, and a measured APK below the existing
90 MB warning and 100 MB hard limits. If the optical improvement is not clearly
better than the tonal fallback, delete or leave the native POC unused and ship
the tonal material instead.

### Sources inspected

- Android `RenderEffect` API:
  `https://developer.android.com/reference/android/graphics/RenderEffect`
- Android `RuntimeShader` and AGSL:
  `https://developer.android.com/reference/android/graphics/RuntimeShader` and
  `https://developer.android.com/develop/ui/views/graphics/agsl`
- Android low-RAM capability:
  `https://developer.android.com/reference/android/app/ActivityManager#isLowRamDevice()`
- Expo Modules native view and module API:
  `https://docs.expo.dev/modules/native-view-tutorial/` and
  `https://docs.expo.dev/modules/module-api/`

---

## D-025 — Apply bounded blur through RenderNode, never Paint

**Status:** accepted for EAS verification; merge blocked on native compile

### Finding

The first EAS Development Android build reached real Kotlin compilation and
failed `:expo-liquid-glass:compileDebugKotlin`. All three failures were
`Unresolved reference 'setRenderEffect'` because the prototype called
`Paint.setRenderEffect`. Android's supported effect owners are `View` and
`RenderNode`; `Paint` can hold the bitmap or `RuntimeShader`, but it cannot own a
`RenderEffect`.

Applying the blur with `View.setRenderEffect` would filter the entire Expo
group view, including React children and chrome drawn after the optical pass.
That is broader than the bounded captured material and would change the
prototype's accessibility/content behavior.

### Decision

Keep the View/Canvas capture architecture and use one reusable API-31
`RenderNode` for the optical pass:

1. retain the bounded captured bitmap owned by the native view;
2. record either the bitmap paint (API 31–32) or original RuntimeShader paint
   (API 33+) into the node's `RecordingCanvas`;
3. install the cached blur through `RenderNode.setRenderEffect`;
4. draw that node into the already rounded-clipped destination canvas;
5. re-record only after capture/bitmap, tier, size, shader-uniform, reduced
   motion, or touch-response invalidation;
6. clear the node effect and discard its display list on cleanup, and discard
   a recording before recycling its bitmap.

The node is stored as `Any` in the API-agnostic host and all `RenderNode` and
`RenderEffect` calls remain inside the API-31 helper. `RuntimeShader` remains
inside the API-33 helper. API 24–30 therefore retain the tonal path without
loading or invoking optical behavior.

### Regression protection and trade-offs

- no dependency, APK-library contribution, config plugin, or iOS work is added;
- the backdrop capture cadence and idle behavior are unchanged;
- API 33 touch moves re-record shader content only for the requested native
  interaction frame and do not recapture the backdrop or schedule JS work;
- a cheap Jest source guard rejects the exact invalid Paint API and requires
  RenderNode recording, effect application, drawing, and display-list cleanup;
- the existing JS/Expo CI cannot prove Kotlin compilation. Adding a full
  prebuild/Gradle Android compile job would materially expand CI setup, network,
  and execution cost, so it is deferred rather than silently imposed in this
  focused correction;
- Expo Doctor currently passes 20/21 checks and reports only pre-existing SDK
  57 patch drift for `expo`, `expo-constants`, and `expo-font`; this fix changes
  no dependency and keeps that separate from the RenderEffect correction;
- EAS Development/Preview remains the mandatory native compile gate, followed
  by the existing physical-device performance and APK measurement gates.

### Recommendation

Open the focused fix for review but do not merge it until the user confirms a
successful EAS Android native compile. Do not start Checkpoint 5.

### Validation outcome

The required EAS Development Android build completed successfully and
`:expo-liquid-glass:compileDebugKotlin` passed. PR #12 was subsequently
squash-merged at `4ce2cf8a76cf164582e4c343255abbde65e6c702`.

On a Poco X7 Pro running Android 16 / API 36, the feasibility screen reported
the `optical` tier, started at capture count 1, and advanced through 4 and 7
while switching Hari ini / Minggu / Bulan. There was no tonal fallback, crash,
black frame, obvious corrupt rendering, lifecycle failure, or serious runtime
regression; minor development-build lag was observed.

This outcome verifies native compilation and basic API-36 optical execution.
It does not verify API 31–32, physical API 24–30 fallback, exhaustive frame/GPU/
thermal/battery behavior, release APK size, or the production navigation
composition.

---

## D-026 — Adopt one bounded optical host for Liquid bottom navigation

**Status:** accepted for Checkpoint 5 navigation only

### Finding

The user authorized selective production use after the successful EAS compile
and API-36 feasibility test. The renderer's capture contract constrains the
safe navigation composition: the optical `GroupView` must be the final overlay
child of the parent that also contains the active screen, and it must own its
React descendants so icons and labels are excluded from backdrop capture.

A moving optical indicator would retain a bitmap from the wrong transformed
location during its spring. Four per-destination optical hosts would duplicate
bitmap, RenderNode, effect, event, and failure ownership. A single full-screen
or content-layer blur would violate the selective material definition.

### Decision

Use one theme-aware navigation dispatcher for labels, route events, selected
state, haptics, and safe-area inputs. It dispatches to:

1. an opaque semantic Material navigation bar with one restrained asymmetric
   selected shape and Android ripple; or
2. one 72dp-high, horizontally inset Liquid optical host containing all four
   destinations, with one semantic selected wash moving inside it.

The Liquid selected wash is an absolute, childless Reanimated layer. A bounded
UI-thread spring changes only its translation. It is not another native optical
surface, does not move tab scenes, does not call JavaScript per frame, and does
not invalidate backdrop capture during the animation. Reduced motion sets its
position immediately.

Expo Router continues to own route state and scene switching; tab scene
animation is explicitly `none`. The dispatcher emits `tabPress`, commits only
an unprevented destination change, fires one `selectionAsync` haptic at that
moment, and performs no haptic or indicator restart for the already-selected
destination.

One safe-area layout resolver owns navigation height, content padding, FAB
offset, snackbar offset, FAB size, and gaps. Material and Liquid therefore keep
identical overlay geometry even though their surface treatments differ.

### Renderer lifecycle and API behavior

- API 24–30: `OriginalLiquidGlassSurface` does not mount the optical native
  view; the existing tonal material owns the same navigation descendants.
- API 31–32: the single navigation-bounded capture uses cached RenderNode +
  RenderEffect blur.
- API 33+: the independently authored AGSL tier remains optional and degrades
  to blur, then tonal.
- low-RAM, missing-module, disabled, capture, hardware, or renderer failures:
  tonal fallback remains functional and accessible.
- production navigation disables the generic touch-following native lens.
  Press opacity and the selected-indicator spring provide interaction feedback,
  while `refreshKey` captures the newly selected screen context once after
  route state changes. The indicator spring never captures, and idle behavior
  remains event-free. The development feasibility control retains the native
  touch-following path for isolated renderer testing.
- the native host remains non-accessible decoration while its four React
  `tab` descendants preserve label, order, and selected state.

### Trade-offs and remaining gates

- dependency/APK: no package, graphics runtime, native library, config plugin,
  or iOS implementation is added. Actual release artifact size remains
  unmeasured against the historical ~65 MB baseline.
- performance: one navigation-bounded bitmap/RenderNode is the minimum host
  count compatible with contextual capture. Production selection requests one
  route-change refresh rather than the feasibility control's touch-down plus
  selection pattern; device QA must verify that lifecycle/layout do not add
  unstable capture bursts.
- compatibility: API-36 optical feasibility is proven, but API 31–32 and
  physical API 24–30 behavior remain unmeasured.
- maintainability: routing and layout metrics are centralized. The native host
  adds one generic interaction opt-out prop; capture, RenderNode, shader, and
  cleanup ownership remain unchanged.
- licensing: Convx remains GPL-3.0 research-only. No Convx code, shader, or
  derivative material is used.

### Validation evidence

Authoritative and fresh-base TypeScript, root ESLint, and Jest validation pass
(14 suites / 120 tests). Android Expo export, clean Android prebuild,
`expo-liquid-glass` autolinking, New Architecture inspection, 14/14 generated
XML parses, and diff checks pass. Expo Doctor remains 20/21 only because of the
pre-existing SDK 57 patch drift; no dependency file changed in this checkpoint.
Local Kotlin/Gradle compilation is unavailable. The `interactionEnabled` native
prop and production navigation composition therefore require EAS
Development/Preview compilation and physical-device UI/performance validation
before merge.

Final user physical-device QA accepts the Checkpoint 5 navigation as
functionally safe and usable. The user prefers the earlier rounded Material
selection pill and finds the Liquid backdrop too static between explicit route
refreshes. These are non-blocking Checkpoint 6 refinements; they do not reverse
this decision or authorize a different dispatcher, multiple optical hosts,
screen migration, or general glassmorphism. No separate archived EAS compile
log for the Checkpoint 5 `interactionEnabled` addition is present in the
repository/PR evidence, so this record does not invent one. API 31–32, physical
API 24–30, release-size, thermal/battery, and formal frame-time evidence remain
unavailable.

### User decision

On 2026-09-01 the user explicitly authorized navigation-only production
adoption for Checkpoint 5 after the EAS/API-36 evidence above. This is not a
general optical-surface rollout and does not authorize Checkpoint 6 or screen
migration.

---

## D-027 — Preserve Checkpoint 5 navigation architecture while refining its material response

**Status:** accepted and physically validated for Checkpoint 6

### Finding

Final physical-device QA accepted Checkpoint 5 navigation as functionally safe
and usable. The user nevertheless prefers the earlier clear Material selection
pill and reports that Liquid's route-triggered backdrop capture reads as a
static snapshot between explicit refreshes. Neither finding invalidates the
dispatcher, centralized event/haptic ownership, shared safe-area metrics,
single optical host, or immediate tab-scene switching.

### Decision

Checkpoint 6 may change the Material selected presentation back to a restrained
semantic rounded pill while preserving the Checkpoint 5 architecture. It must
also investigate the smallest generic native invalidation capability that can
refresh a bounded Liquid host while the backdrop is meaningfully changing and
stop deterministically once the scene is idle.

The renderer must keep one navigation-bounded host, no JavaScript frame loop,
no permanent native frame loop, no indicator-driven capture, the existing API
24–30 tonal / API 31–32 blur / API 33+ optical tiers, and the existing low-RAM
and failure degradation. Transient control surfaces may reuse the capability
only when invalidation ownership remains explicit.

### Trade-offs and gate

- no new graphics runtime or dependency is authorized by this decision;
- a permanent high-frequency capture loop, whole-screen capture, multiple
  navigation hosts, or materially heavier rendering architecture still
  triggers the significant-finding stop gate;
- the user acceptance adds no API 31–32, physical API 24–30, artifact-size,
  thermal/battery, or formal frame-time evidence;
- no general glassmorphism, content-card optical rollout, screen migration, or
  Checkpoint 7 work is authorized.

The static appearance was caused by invalidation ownership: pre-draw already
existed, but it captured only when `capturePending` was set. With production
touch capture disabled, route `refreshKey` changes were the only normal dirty
signal; ancestor scrolling and layout changes did not mark the backdrop dirty.

The accepted generic refinement registers one `OnScrollChangedListener` and
one `OnGlobalLayoutListener` beside the existing pre-draw listener. Both mark
the same bounded host dirty. Requests coalesce while a capture is pending and
are limited to one request per 32ms while the view tree changes. If the final
event lands inside that interval, one delayed trailing dirty request captures
the settled backdrop; it is not a recurring timer. Detach and Expo destruction
remove all three observers, cancel the trailing callback, reset scheduling
state, and release the bitmap, RenderNode, effects, and shader as before.

This model performs no recurring idle work, schedules no JavaScript frame
callback, and does not respond to the separate selected-indicator transform.
It covers ancestor scroll and layout mutation. Pure paint/transform animation
behind the host that produces neither signal still requires an explicit
`refreshKey`; supporting arbitrary animation would require a continuously
sampled or producer-coordinated contract and is not claimed.

The Material selected icon container returns to the earlier 64x32 semantic
rounded pill. Only its geometry changes; the Checkpoint 5 dispatcher, event
gate, ripple, accessibility, layout metrics, and no-scene-animation contract
remain intact.

Local source guards require observer registration, coalescing/throttling,
trailing-callback cancellation, and full listener cleanup, and reject a native
or JavaScript permanent frame loop. At implementation delivery, EAS/device
validation remained required because local static validation did not establish
capture cost, visual freshness, or native compilation.

The follow-up EAS Android build succeeds for the unchanged production source.
User physical-device QA strongly confirms live bounded blur while scrolling,
the final settled backdrop after scrolling, no visible recurring idle refresh,
rapid tab switching, and no artifact or flicker. The Material rounded pill,
navigation behavior, and FAB/snackbar geometry also pass. No crash,
noticeable lag, or noticeable heat/battery issue was observed. The user accepts
this model and the pill refinement.

This remains qualitative evidence. It adds no formal frame-time, GPU, CPU,
memory, battery-discharge, or thermal measurements; no release APK size; and
no physical API 24–30 or API 31–32 evidence. The API 24–30 tonal, API 31–32
bounded blur, API 33+ original AGSL, and low-RAM/failure degradation contracts
remain unchanged.

---

## D-028 — Use the installed native Expo UI sheet with a tonal Liquid dialog boundary

**Status:** accepted and physically validated for Checkpoint 6

### Finding

The production audit found two bottom sheets implemented with duplicated core
`Animated`, `PanResponder`, React Native `Modal`, manual scrims, and manual IME
translation: day history and goal deposit/withdraw. `AppAlert` is already a
shared dialog rather than a sheet; add/edit flows are route modals.

The installed `@expo/ui` 57.0.14 community bottom-sheet wrapper hosts arbitrary
React Native descendants in Android Material 3 `ModalBottomSheet`. It provides
native system-back and scrim dismissal, swipe gestures, partial/full states,
scroll arbitration, and keyboard behavior, and is already inside the project's
New Architecture/native dependency envelope. Android exposes two effective
detents, and several Gorhom-compatibility styling/keyboard props are native
no-ops. The wrapper exposes semantic container color but intentionally retains
the platform Material 3 scrim.

### Decision

One `AppBottomSheet` controls visibility, dismissal, theme surface, safe-area
padding, heading, 48dp close action, and modal accessibility semantics. Both
production sheets migrate to it and the manual `useSheetMotion` hook is
removed. The platform scrim blocks touch-through and owns press-to-dismiss;
system back dismisses the top native sheet before the activity route; the
native sheet arbitrates inner scrolling, drag, and IME rather than a JS-frame
gesture state machine.

Material uses an opaque dynamic semantic surface with the existing restrained
sheet radius. Liquid uses `LiquidMaterialSurface` as a tonal, highlighted
control plane. The optical `OriginalLiquidGlassSurface` is not mounted in the
sheet: Compose presents the sheet in a separate dialog window, but the current
renderer samples only its immediate parent in the same view hierarchy. A real
cross-window backdrop would require materially heavier capture architecture,
so faking or silently adopting it is rejected.

Native sheet motion follows Android's system animator setting. The tonal
Liquid child also follows the existing reduced-motion hook. A single light
haptic occurs after a deposit or withdrawal commits; rejected actions, drag
frames, and detent movement do not vibrate. The SDK 57 Android wrapper exposes
no reliable detent-settle callback, so no detent haptic is claimed.

### Consequences

- no dependency, graphics runtime, config plugin, or iOS change is added;
- Expo Go/development-build posture does not change because `@expo/ui` was
  already installed and used, while heibi's local optical module already makes
  EAS Development/Preview the authoritative native path;
- the platform Material 3 scrim is deliberate depth separation, not a custom
  arbitrary opacity or a full-screen Liquid blur;
- exact focus entry/restoration support and native sheet behavior require
  TalkBack/device QA; React descendants remain the accessibility source;
- EAS compilation and physical-device sheet, keyboard, back, scroll, and live
  Liquid validation were required before merge and are recorded below.

The follow-up EAS build succeeds, and user physical-device QA passes for the
History and goal deposit/withdraw sheets in both Material and Liquid themes,
including Android back, the native scrim, swipe dismissal, scroll handoff,
keyboard/IME behavior, reduced motion, and TalkBack. Liquid sheets remain
tonal: no cross-window optical renderer was introduced. The user accepts this
native-sheet architecture. The same qualitative evidence limits recorded in
D-027 apply.

---

## D-029 — Keep Checkpoint 7 dependency maintenance inside Expo SDK 57

**Status:** accepted and EAS validated for Checkpoint 7

### Finding

The pre-check reported eleven SDK-compatible patch drifts. The old notes named
only `expo`, `expo-constants`, and `expo-font`, but the current SDK 57 resolver
also expected patches for `@expo/ui`, dev client, image, image picker, linking,
notifications, Router, and sharing. No SDK major, React Native architecture,
graphics runtime, or new package was required.

### Decision

Use `npx expo install --fix` as the sole resolver and retain Expo SDK 57. The
manifest now selects `expo ~57.0.19`, `@expo/ui ~57.0.15`, dev client
`~57.0.18`, image `~57.0.4`, image picker `~57.0.15`, linking `~57.0.9`,
notifications `~57.0.16`, Router `~57.0.18`, and sharing `~57.0.17`. Existing
compatible ranges for constants and font remain, resolving 57.0.17 and 57.0.3
in the lockfile. React, React Native, Gesture Handler, Reanimated, and Worklets
remain unchanged.

`expo install --check` and Expo Doctor now pass, 21/21. Clean prebuild resolves
the local Liquid module and `@expo/ui`; React Native autolinking resolves
Gesture Handler, Reanimated, and Worklets; New Architecture remains enabled.
Because these are native package patches, local export/prebuild is not treated
as native compilation. EAS Development/Preview remains the compile gate and
device behavior must be rechecked before merge.

---

## D-030 — Centralize Android press feedback and migrate screens without broadening Liquid

**Status:** accepted and physically validated for Checkpoint 7

### Finding

Android press feedback was fragmented. Controls chose ad-hoc ripple colors;
some combined native ripple with pressed opacity/scale; the Material tab
destination used a foreground borderless ripple on a region larger than its
64×32 selected pill. This made full-surface light/dark flashes possible and
made disabled and theme-switched behavior inconsistent.

### Decision

One pure press-feedback contract now owns Android behavior. Material receives a
semantic 12% background ripple with `borderless: false` and `foreground:
false`; the calling Pressable clips it to the control's own rounded geometry.
Liquid receives no native ripple and keeps restrained opacity feedback.
Disabled controls receive neither active response. No timer, delayed reset,
new dependency, or JavaScript frame loop is used.

Material navigation retains its accepted 64×32 selected pill and uses a
rounded 48dp-or-larger destination ripple boundary. Liquid navigation is an
explicit exception: its file and accepted single-host optical/press-opacity
contract are unchanged and no `android_ripple` is introduced.

Checkpoint 7 screen composition stays semantic and restrained: shared headings
replace per-screen title drift; edit flows use two tonal groups rather than a
card per field; History groups transactions by local day and opens the existing
native day-detail sheet; empty, celebration, alert, and snackbar states improve
large-text, localization, and accessibility behavior. Today's Swipeable and
UI-thread reorder systems and Goals reorder persistence remain intact. Habit
detail pinch moves to Gesture Handler/Reanimated so updates stay on the UI
runtime and only a committed dismissal crosses to React.

This decision does not add optical content cards, new Liquid hosts, a renderer
change, widget work, or Checkpoint 8 scope. Static tests protect the Material
pill, Liquid ripple exclusion, no timer workaround, no horizontal tab scenes,
and gesture/reorder architecture. EAS and device QA remain required for actual
ripple appearance and interaction feel.

The final EAS Android build succeeds. User physical-device QA confirms the
ripple flash is gone and passes Liquid navigation behavior, Today swipe and
reorder, Goals reorder/filter/transactions, all habit/goal forms and IME,
Settings persistence, History grouping/day detail, TalkBack, large text, and
reduced motion. No crash, noticeable lag, or noticeable heat/battery issue was
observed. These are qualitative results, not formal performance, thermal, or
battery measurements. A final review correction restores pinch scale on
gesture cancellation through UI-runtime `onFinalize`; it does not change the
native package graph or the accepted architecture.

---

## D-031 — Accept Checkpoint 7 and defer the Liquid light-material correction

**Status:** accepted; Checkpoint 8 follow-up authorized

### Finding

Checkpoint 7 is functionally accepted after successful EAS and broad
physical-device QA. The only remaining visual issue is Liquid navigation in
light mode: the navigation-wide material reads as dense dark gray/charcoal even
over a light scene. Live contextual refresh, settled capture, idle behavior,
routing, spring, haptics, accessibility, and perceived performance all pass.

### Decision

The issue is non-blocking for the Checkpoint 7 merge and moves to Checkpoint 8.
Checkpoint 8 must audit fallback, tint, adaptive-contrast, edge, selected-state,
and icon/text color ownership and define distinct light/dark optical material
responses. It must preserve the accepted one bounded host,
`interactionEnabled={false}`, contextual dirty observers, bounded active
capture, trailing settled capture, zero recurring idle capture, independent
indicator spring, API tiers, and low-RAM/failure fallback.

This decision does not reopen Checkpoint 5/6 navigation architecture or
authorize multiple optical hosts, permanent frame capture, full-screen glass,
or Checkpoint 9 widget variants. Dark-mode Liquid navigation remains accepted.
Physical light/dark validation is required on the Checkpoint 8 build. Release
APK size and physical API 24–30/API 31–32 Liquid evidence remain outstanding.

---

## D-032 — Give navigation an explicit light/dark optical material contract

**Status:** accepted for Checkpoint 8 validation

### Finding

Liquid navigation reused the general `surfaceInteractive` role, which is an
alpha-bearing primary-container color. The native wrapper then appended a
second alpha while deriving its tint, producing an invalid ten-digit hex color.
When `processColor` rejected it, the Android view retained its default charcoal
tint. The same primary-container role was also too chromatic and dense to be a
good light navigation fallback. The capture, refresh, shader, and idle systems
were functioning correctly and are not the cause of the light-mode appearance.

### Decision

Add a renderer-level material-tone configuration and select `navigation` only
for the Liquid bottom bar. Light navigation uses the existing semantic neutral
glass tint as its fallback, a valid restrained translucent neutral tint, a
brighter edge, and a bounded light-specific adaptive-contrast response. The
semantic accent remains on the independently animated selected indicator
instead of tinting the whole optical host. Dark/default material keeps the
accepted dark response, with alpha replacement made valid rather than nested.

The native view receives one `lightMaterial` flag. It changes only adaptive
contrast and does not change backdrop capture, RenderNode/RenderEffect,
RuntimeShader, resource ownership, or invalidation. The navbar retains one
bounded host, `interactionEnabled={false}`, contextual dirty observers, the
approximately 30fps active cap, one cancellable settled capture, zero recurring
idle work, independent indicator motion, and the existing API and failure
tiers. No dependency, full-screen glass, extra host, or frame loop is added.

EAS native compilation and physical light/dark visual/contrast QA are required
before merge. Static validation cannot establish final optical appearance.

---

## D-033 — Serialize widget snapshots and bound the 14-day Glance layout

**Status:** accepted for Checkpoint 8 validation

### Finding

The JavaScript snapshot and native parser already agreed on the heatmap schema,
but debouncing did not serialize asynchronous native updates. A mutation during
an in-flight write could therefore allow an older snapshot to complete last.
The hourly widget redraw also reused the stored date array unchanged, leaving
the 14-day window stale across local midnight when the app remained closed.

The renderer represented all 14 days, but assigned every cell equal weight in
all remaining horizontal space. This made cells collapse at the 180dp minimum
after fixed chrome and stretch into meaningless bars at wide launcher sizes.
The provider comments also incorrectly described row count as day count.

### Decision

Keep the existing local Expo/Glance architecture and schema. A small pure
coordinator now debounces and serializes snapshot writes; requests received
during a write coalesce into one latest-state follow-up. Existing startup
hydration plus goals, habits, and habit-log subscriptions remain the central
mutation ownership. On every Glance redraw, native code aligns stored completion
values by date to exactly 14 current local calendar days, oldest to newest.

Glance uses deterministic compact, medium, and wide width classes with bounded
square cells and 1–2dp gaps. Name/streak chrome adapts by class, streak hides in
compact mode, and only the spacer before the streak may consume flexible width.
Height chooses one through eight habit rows. Provider min/max resize metadata is
retained because it covers the tested classes; its comments and description now
match the 14-day contract. No new widget variant or dependency is introduced.

Unit/source-contract tests cover snapshot data, ordering, filtering, sorting,
serialization, parser/renderer keys, 14-cell preservation, thresholds, and XML
metadata. EAS compilation and physical launcher resize/data-refresh QA remain
required; no local Kotlin/Gradle or launcher evidence is claimed.

---

# New decision template

Copy this section for future decisions.

## D-XXX — Title

**Status:** proposed | accepted | rejected | deferred

### Finding

What was discovered?

### Options

1. Option A
2. Option B
3. Option C

### Trade-offs

- APK:
- performance:
- Android compatibility:
- maintainability:
- visual fidelity:
- dependency risk:

### Recommendation

What should be done and why?

### User decision

Record the actual decision before implementing a significant trade-off.
