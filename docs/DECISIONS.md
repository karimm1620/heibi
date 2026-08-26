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
