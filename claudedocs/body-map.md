# Body map — the muscle fatigue figure

Companion to `design-exploration.md` (design state) and `build-log.md` (build state). **This file
is the spec for one feature that is not yet scheduled**: the front/back musculature figure on the
Strength tab (Lab 34 IA, Lab 35 B4). It is written so a later phase can build it without
re-deriving anything. Nothing here is on the device.

Written 2026-09-06 from a research pass and a browser proof of concept; the POC render is
`design-labs/bodymap-poc.html` — untracked like every lab render (`*.html` there is build output),
so it exists only on the machine that made it; the figures it renders are the vendored asset.

---

## 0. Decisions

| Question | Decision |
|---|---|
| **What it is** | A front and a back figure of the human musculature, each muscle group filled by a 0–1 **fatigue** value decayed from recent volume. Read-only. The screen is Lab 35 B4's layout with a real drawing in place of the plate grid. |
| **The drawing** | **Option A: the `@musclemap/assets` figure** (Jsplice/MuscleMap, MIT), vendored at `assets/bodymap/`. Chosen over react-native-body-highlighter (coarser muscle ids) and over the Wikimedia/OpenStax redraw (better anatomy, but CC BY-SA and unlabeled paths). The Lab 35 B4 plate grid is **dead** — the user's words: "looks like a kid's drawing". |
| **Renderer** | Skia. One `<Canvas>`, one `<Path>` per muscle surface built once with `Skia.Path.MakeFromSVGString`, fill set per muscle. Not `react-native-svg` (one host view per path; not installed), not `ImageSVG` (cannot recolour a single path), not a shader (nothing to gain at ~30 regions). Zero new dependencies. |
| **Colour** | Fill = OKLab lerp from `color.off` (fresh) to `color.live` (needs rest). **Never alpha over a hue** — Lab 35 recorded why: red at 0.26 alpha still reads as red on the dark ground, so a fresh chest looked tired. From `off` the neutral end is genuinely neutral. Interpolate in OKLab, not sRGB, so the midpoint does not go muddy. |
| **Containment** | None. §0 lists the body map under "nothing at all". The figures and the scale sit on the canvas; only the list under them is plated (Lab 42 P5). |
| **Model output rule** | The scale reads **FRESH → NEEDS REST**, not a percentage (§0 "Model output"). The actual numbers (sets in the last 7 days) live in the WORKED HARDEST list. |
| **Not in scope** | Female figure (asset has one; ship male only until a settings toggle exists). Tap-to-filter. 3D. Per-exercise activation view on the exercise detail screen — a cheap follow-on (§6), but not this feature. |

---

## 1. The asset

`assets/bodymap/` holds four files copied verbatim from `packages/assets` of
github.com/Jsplice/MuscleMap (MIT, licence file alongside). **Vendored on purpose**: the package was
two days old when researched; pin the copy, do not depend on npm.

- `male-front.ts`, `male-back.ts` — each exports a `BodyDiagram`: `viewBox "0 0 1024 1536"`,
  `centerX 512`, an `outline[]` (the silhouette, never coloured) and `muscles[]`.
- Each muscle entry has `group` (MuscleMap's enum), `side: 'LEFT' | 'CENTER'`, `d` (SVG path
  data) and usually an `id` like `LATISSIMUS_LEFT`. **Only the left side is authored; the right is
  a mirror across `centerX`** — `translate(1024, 0) scale(-1, 1)`, or in Skia
  `path.copy().transform(Matrix)` once at load. A few entries have no `id`; fall back to `group`.
- `surface-ids.ts` — the full id list and the group→ids table. `types.ts` — the shapes above.
  Both import `@musclemap/core` for a type; **strip that import** when converting (§3), the types
  are trivial.

**Known gaps in the art** (verified in the POC, not assumed):

- Front has no traced upper back (obviously) and **`BACK_UPPER` and `HIP_FLEXORS` are empty
  groups** upstream. Rhomboids, rear delts, lower back and lats exist only on the back figure.
- There is no `neck` surface. `neck` in our enum stays uncoloured on the figure and appears only
  in the list.
- MuscleMap's `ABDUCTOR` surface is the glute medius / upper hip region; we fold it into `glutes`.
  `OBLIQUE` and `CORE` both fold into `abs`.

### Mapping MuscleMap surfaces → `MUSCLES` (`src/data/schema.ts`)

Strip `_LEFT` / `_RIGHT` from the id first.

| MuscleMap key | ours | | MuscleMap key | ours |
|---|---|---|---|---|
| `CHEST` | `chest` | | `GLUTEUS`, `ABDUCTOR` | `glutes` |
| `SHOULDER_FRONT`, `SHOULDER_SIDE`, `SHOULDER_REAR` | `shoulders` | | `QUADRICEPS` | `quads` |
| `BICEPS` | `biceps` | | `HAMSTRINGS` | `hamstrings` |
| `TRICEPS` | `triceps` | | `ADDUCTOR` | `adductors` |
| `FOREARM` | `forearms` | | `CALVES` | `calves` |
| `CORE`, `OBLIQUE` | `abs` | | `LATISSIMUS` | `lats` |
| `TRAPEZIUS` | `traps` | | `RHOMBOID` | `back` |
| `LOWER_BACK` | `lower_back` | | *(none)* | `neck` |

`back` is thin on the figure (rhomboids only). That is a property of the art; do not invent a
surface for it.

---

## 2. The maths — `src/lib/fatigue.ts` (pure, tested)

`src/lib/**` is pure: no React, no SQLite, no Expo. This is the only tested layer, so the whole
model lives here and the screen only draws.

```ts
import type { Muscle } from '../data/schema';   // type-only import is fine; it is a string union

export interface MuscleSet {
  muscle: Muscle;
  role: 'prime' | 'assist';
  completedAt: number;   // epoch ms
}

export const FATIGUE_HALF_LIFE_H = 48;
export const ASSIST_WEIGHT = 0.5;
/** Weekly working sets at which the ramp clips to 1. One number for v1; per-muscle
 *  landmarks (RP's MEV/MRV) are a later refinement, not a v1 requirement. */
export const FATIGUE_FULL_SETS = 12;

/** 0..1 per muscle. A muscle with no sets in the window is 0 — genuinely fresh. */
export function fatigueByMuscle(sets: readonly MuscleSet[], now: number): Record<Muscle, number>;
```

Formula, per muscle: `Σ weight(role) · 2^(−hoursSince / 48)` over completed **working** sets
(warm-ups excluded, same rule as `volume.ts`), divided by `FATIGUE_FULL_SETS`, clamped to 1. A set
on a compound exercise counts once per muscle it lists, so a deadlift set adds 1.0 to hamstrings,
glutes and lower back and 0.5 to each assisting muscle.

Why this shape and not tonnage: tonnage makes quads always dominate (heavier loads), and the
board's list reads "18 SETS / 7 DAYS", so sets are what the user sees. The 48 h half-life is the
number Lab 03 settled and Lab 35 drew; the 7-day window is implied (a set 168 h old contributes
under 9%, and the query cuts there).

Tests to write first (`fatigue.test.ts`): no sets → all zeros; one prime set now → 1/12; the same
set 48 h ago → 1/24; assist halves; 12 prime sets now clips to exactly 1; warm-ups ignored.

Also in this file, because it is pure and the screen needs it:

```ts
/** A muscle's word on the scale. Thresholds are the ramp's quartiles. */
export function fatigueLabel(v: number): 'FRESH' | 'WORKED' | 'TIRED' | 'NEEDS REST';
```

---

## 3. The path module — `src/components/body-map/paths.ts` (generated)

Do not import the vendored `.ts` at runtime; it carries MuscleMap's enum and mirrors nothing.
Generate a flat module once with a script in `scripts/` (pattern: `build-seed.mjs`,
`check-icons.mjs`), run by hand and committed:

```ts
export const BODY_VIEWBOX = { w: 1024, h: 1536 } as const;
export const BODY: Record<'front' | 'back', {
  outline: string[];                              // path data, drawn first, never coloured
  surfaces: { muscle: Muscle; d: string }[];      // right side already mirrored into the d
}>;
```

Mirror at generation time, not at render: emit the right-side `d` by reflecting the left-side
coordinates (svgpath or a 40-line transform; verify by rendering both and diffing pixels — the
POC used an SVG `transform` attribute and that is the reference). Apply the §1 mapping there too,
so the component never sees a MuscleMap name. Keep `floatPrecision` at 1: the source is authored to
0.1 px in a 1024-wide box and Skia parses the string on every cold start.

---

## 4. The component — `src/components/body-map/body-map.tsx`

Two of these side by side (front, back), each ~160 pt wide on the board; height follows the
viewBox ratio (1.5). The canvas scales the 1024 × 1536 box to fit, `fit="contain"`.

```tsx
<BodyMap view="front" fatigue={fatigueByMuscle(...)} />
```

- Build every `SkPath` once with `useMemo` over `BODY[view]`. There are ~30 per view.
- Outline: fill `color.panel`, hairline stroke `hairline.onGround`, drawn under the surfaces. The
  POC's outline toggle showed "panel fill + hairline" reads best on the ground; "none" loses the
  hands and head.
- Surfaces: `<Path path={p} color={heat(fatigue[muscle])} />`. `heat` is `lerpOklab(color.off,
  color.live, v)`; put the OKLab lerp in `src/theme/` next to the tokens, it is colour maths and
  nothing else may hold a hex. **No animation in v1** — fatigue changes between screens, not
  within one. If a later screen animates it, the values become `fatigueSV` shared values per §0's
  naming rule and the fill takes a derived colour; do not reach for that now.
- Hit-testing is **out of scope** (§0), but the shape is trivial later: on tap, loop
  `path.contains(x, y)` over the surfaces of that view.
- Accessibility: the canvas is one native view. Give the pair a single `accessibilityLabel`
  ("Body map, front and back") and let the WORKED HARDEST list carry the data — that list is the
  accessible form of the figure, and it exists anyway.

Screen assembly (Lab 35 B4, unchanged apart from the drawing):

```
ScreenHeader  Body / FATIGUE
[front] [back]                      ← unplated, centred, 4pt gap
FRONT   BACK                        ← mono labels
scale bar: 5 steps off→live, FRESH … NEEDS REST
Section WORKED HARDEST              ← RowPlates: name + "18 SETS / 7 DAYS" + a 54pt meter
```

The list is the top four by fatigue, the meter is the same `heat(v)` on a `wash.track` track.

---

## 5. The query — `src/data/queries/fatigue.ts`

One query, joined at the muscle: `sets` (completedAt not null, kind ≠ 'warmup', completedAt ≥ now −
7 d) → `session_exercises` → `exercise_muscles` (muscle, role). Return `MuscleSet[]` and hand it to
`fatigueByMuscle`. Do not aggregate in SQL; the pure function is the tested one. `useLiveQuery` on
it, like the library screens. Nothing is stored — fatigue is derived and cheap (hundreds of rows).

---

## 6. Later, if wanted (not this phase)

- **Exercise activation view** on the exercise detail screen: the same component with
  `fatigue = {prime: 1, assist: 0.5}` from `exerciseMusclesQuery`, ramp end `color.accent`, plus a
  two-swatch key PRIME MOVER / ASSISTING. The POC's "activation" mode is this. It is one screen's
  worth of plumbing once §4 exists.
- **Per-muscle volume landmarks** replacing `FATIGUE_FULL_SETS` (RP's MEV/MRV per group).
- **Female figure**: `@musclemap/assets` ships `female-front/back`; a settings toggle.
- **Tap a muscle → library filtered by it.** `path.contains` per §4.
- **3D**: BodyParts3D (CC BY-SA 2.1 JP, per-muscle OBJ meshes) or Z-Anatomy (CC BY-SA 4.0, a
  Blender rebuild with far better shading). Both need decimation and a glTF export, then
  `react-native-filament` or `expo-gl`. Not cheap; only if the flat figure is ever felt to be the
  limit.

---

## 7. What the research ruled out, so it is not re-run

- **Ascend's muscle visualizer API**: paid, raster output, network per render, no offline.
- **react-native-body-highlighter** (MIT): finer curves, but delts are one surface and the back is
  only upper/lower — cannot draw lats vs traps.
- **giavinh79/react-body-highlighter, vulovix/body, etal/bodymap**: polygon or schematic region
  maps. The Lab 35 look again.
- **Wikimedia "Muscles front and back.svg"** (a vector redraw of OpenStax fig. 11.7): the best
  anatomy found, 176 paths, but CC BY-SA 4.0 and auto-generated ids — a relabel pass plus
  share-alike exposure. Keep in mind if Option A's art is ever felt to be the limit.
- **Bouglé plates** (CC BY-SA 3.0): engraving line art, a tracing base only.
- **wger's muscle overlays**: AGPL, per-file rasters. **Servier Medical Art**: no SVG.
  **OpenStax "1105" SVG**: a PNG in an SVG wrapper. **openclipart/freesvg**: nothing usable.
- **Alpha-over-hue ramps** and **sRGB interpolation**: see §0 "Colour".
