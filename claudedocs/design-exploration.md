# Design exploration — handoff

Living state document for the workout-tracker UI exploration. **A new session should read this
file first, then `design-labs/kit.py`.** Last updated 2026-09-06 (round seventeen).

**Fastest path in:** read §0, then open `kit.py` — §0 is the decisions, `kit.py` is those decisions
already written as code. Labs 38–41 are the reasoning behind the current style; **Labs 34–37 are
the sixteen screens, now restyled onto it** (round seventeen). The restyle is done; the next job is
the user's review of it, and then implementation.

---

## 0. Start here — the locked design

Forty-one boards of exploration have converged. These are settled; build against them and only reopen one if the user does.

| | Decision |
|---|---|
| **Palette** | **V2** (Lab 22). accent `#e4c68c` · done `#9fae3a` · live `#df5441` · ground `#0a0908` · panel `#15130f` · raised `#221f19`. Text ramp `#f6f3ec` / `#c9c3b6` / `#8c8677` / `#6f6a5e`. Tick ramp `#5a5449` / `#7d7666` / `#a8a091`. Provisional pending a look on real hardware. |
| **Typeface** | **Geist + Geist Mono.** Both on the Google Fonts CDN (verified 200). No `@expo-google-fonts` package — self-host via `expo-font`. |
| **Material** | Glass, **G1 recipe**: `rgba(255,255,255,0.09)`, `blur(30px) saturate(180%)`, `0.5px solid rgba(255,255,255,0.19)`, inset top highlight `0.36`, drop `0 10px 28px rgba(0,0,0,0.42)`. Chrome only — anything holding a number stays solid. |
| **Style** | **Plate + lines — Lab 40 M4, settled.** Flat opaque `#221f19` plate (an ~11% lift, Apple's own step from a black canvas), 14pt radius, **lit edge** (`inset 0 1px 0 rgba(255,255,255,.075)` + `inset 0 -1px 0 rgba(0,0,0,.28)`), **section label outside the plate** with a hairline running to the right edge, **inset separators** between rows inside it, 46pt gap kept. Editorial-no-rules is dead — spacing alone was validated on the live screen, which has almost no stacked text, and failed on the sixteen that do. |
| **What gets a plate** | **A plate is emphasis, not containment** (Lab 42, P5 — settled round nineteen). Three levels: **row plates** — anything you touch carries its own 12pt-radius plate with a 7pt gap and no hairline anywhere (list rows, fields, toggles, settings, reorderable rows); **one grouped plate** for the screen's one or two *main components* (the summary tiles, the calendar, the program day strip, the exercise demo); **nothing at all** for read-only tables (the set log, rep maxes, relative strength, zone bars), prose of every kind, charts, rails, the body map, and the live screen's ring and tape. The ruled section label carries everything unplated. Two or three plated things per screen is the budget. **Undecided: the calendar** — its fills were composited against the plate, so recompute the ramp before moving it. |
| **Hairlines** | A hairline's contrast is **relative to its surface.** 11% white reads on the canvas and washes out on a plate; on a plate it takes ~20%. Every hairline token needs both values. |
| **Stat blocks** | **N3**: two per row, never four. Order inside a tile is label → number → visual, number ~2× the label. A comparison attaches to the number it describes — never its own tile. |
| **Visuals rule** | A number gets a visual **only when there is something real to draw**: a meter needs a denominator, a spark needs a series, a delta needs a previous value. Otherwise it ships plain. Recap screens carry numbers and deltas; history and stats screens carry the charts (the Strong/Hevy split). **Bullet graphs are out** (need teaching); **rings are out** without a goal denominator (Apple's rule: a ring must not decorate). |
| **Charts** | `kit.chart()` is the one column chart — never bare. Minimum: y min/max anchored to the chart, first and last x labels, latest mark in the accent with the rest de-emphasised, its value printed, and a title that states the takeaway. **Text never wears the series colour** — labels and values stay in the text ramp. A bare chart is acceptable only as a preview of a labelled one. |
| **Calendar** | Three intensity steps, no more. Adjacent-month days **dimmed, not omitted**. **Rest and missed must look different** — rest is a plate, missed carries a ring under the number. The numeral never wears the accent on a filled cell; it flips to dark ink only at the top step. Month summary is one line of text, not a second chart. |
| **Spacing law** | **Between-section space ≥ 3× within-section space.** Currently 46pt vs 7pt. Put this in the tokens; it is the whole structure. **Rail air is per-rail, not a law** (amended 2026-09-12): the 56pt figure was written before any rail shipped and no board uses it — Today passes 22, routine detail and the program strip 24, the PR timeline 26. `Rail` takes `air` as a **required** prop; there is no default, because no default can be right when three boards disagree. |
| **Navigation** | **W2** (Lab 23) — four labelled tabs, inset circular start button, one continuous plane. Plus **W5** minimised-on-scroll and **W6** live-session takeover. **The plane is glass on iOS and an opaque raised plate on Android** (Lab 43 N2). Blur on Android was researched and **ruled out** — see §8s. It is a platform switch, not a fallback. |
| **Live screen** | Gesture-navigated. Horizontal = sets, vertical = exercises. |
| **Set indicator** | **Written**: `SET 4 OF 5` between two hairlines. Lab 29's set strip was proposed and **rejected** — the sets live behind the SETS button and nowhere else. |
| **Sets view** | The **SETS sheet is the only global view of the sets**, and the secondary way to navigate between them. Rows carry a reorder grip on the left and a chevron on the right, 38pt hit area. **No Edit-set button** — tapping a row goes to that set and you edit it with the ring. |
| **Exercise view** | Same sheet one level up. Opens from **the exercise counter, the exercise title, or the ladder** — three routes. Same grammar: grip reorders, row navigates, button at the foot adds. |
| **Editing** | **All three parameters use the same vertical tape.** Load 20–140 by 2.5 · reps 1–15 by 1 · **RPE 1–10 by 1**. Long-press any parameter for the keypad, or a Settings switch makes a single tap open it. **No value is reachable by only one route.** Reference numerals appear **only while editing load** — they mark the perimeter as live and cost 31pt of radius. Two ring sizes only: 330 at rest, 290 whenever the tape is present. |
| **RPE default** | **Unset, not 8.** Most people do not know what RPE is and will never set it, so it must not arrive pre-filled with a value that then gets logged as if it were real. Treat the parameter as optional: ship it hidden behind a switch (Settings, or on the screen itself) and only show the selector cell when it is on. An unset RPE logs as null, not as a number. |
| **The ring** | **Lines only — no arc, no knob** (Lab 32, F3). Fill *and* cursor: ticks below the value are longer and lighter, and the lines swell into the current value over ±6 ticks. Length carries the fill, not colour — a 1px hue step is invisible at this scale. **It is always the load gauge and never re-scales**; the core reads LOAD in every state. |
| **Exercise indicator** | **K3** — a ladder of numbered ticks down the left edge. Completed green, current gold, ahead dim. |
| **Two vocabularies** | The two axes must look *different*. Two identical indicators at 90° force the reader to decide which is which before reading either. |
| **Rail pattern** | Reserved for anything chronological — exercise history, session list, PR timeline. Dots cut free of the line (segments stop short). A rail always means "events in order" and nothing else. |
| **Plate colours** | Default **A** (competition coding: 25 red, 15 yellow, 1.25 chrome), user-configurable in Settings. Geometry is real — height is diameter, width is thickness. |
| **Instruments** | Nothing that needs teaching. See the three-tier rule in §8b. |
| **Today** | **Settled at Lab 45 W3.** A quiet raised card carrying the next routine, its first three lifts and a full-width accent **Start** button; under it the week block; under that the recent-sessions rail. **No separate records section** — the rail's PR pill already says it, and the timeline lives on Strength. |
| **The week strip** | A **horizontally scrollable row of day cells, bounded to two weeks back**, bleeding past the 22pt margin so a cut cell reads as scrollable. Each cell is weekday letter · date · **a bar as tall as that day's volume** — the calendar and the graph are one element. Scrolling is what forces the date onto the cell: letters cannot say *which* Tuesday. A cell is a 46 × 44pt target that opens that day's session; **rest and future days are not targets at all** rather than targets that do nothing. Rest, missed and ahead stay three different things (missed keeps the ring under its number). The fill is a *relative* scale — tallest bar is the best day in view — so the tonnage stays printed underneath. |
| **Empty states** | A component that will fill in stays visible and dim rather than hidden, so the layout a new user learns is the layout they keep. The empty state is a short sentence plus a set of actions — never an apology, never an illustration. |
| **Information architecture** | Four tabs carry sixteen screens (Lab 34). **Today** home/next/readiness · **Session** routines, programs, library · **Strength** exercise history, PRs, standards, body map · **Load** volume, deload, bodyweight, calendar. **Settings is not a tab** — a gear in the Today header. Detail screens push on top of their tab, lose the tab bar, and the primary action takes that plane. |
| **List row** | 44pt, no fill, **inset separators between rows inside a plate** (they start at the text margin — a full-bleed rule inside a plate makes it a table). Name 15–17px, mono meta line 11px under it, value right, chevron if it navigates, grip if it reorders. **A read-only table row is 34pt** — the hit-area floor is for targets. |
| **Field** | Mono label over a 17px value, 44pt, chevron if it opens a picker. No box, no underline. |
| **Chip** | One component for filters and multi-select. Strips bleed past the 22pt margin so a cut chip reads as scrollable. |
| **Zone bar** | For model output measured against thresholds. Zones tinted, **marker always near-white** (tinting it to the verdict makes it vanish inside its own band), number carries the verdict, words not acronyms. |
| **Model output** | A number the app guessed is never drawn like a number you lifted. Deload and readiness are sentences; the body map says FRESH/NEEDS REST, not a percentage. |

### Where to pick it up

1. **Implementation is the next job** (see §8o for the order). The design side has no open work that is not waiting on hardware or on a look.
2. **The screens are done and need the user's eye, not more work.** All sixteen screens on Labs 34–37 are on M4, uploaded, gate-clean and fold-checked (§8m). The open questions for that review are named there: the calendar's plate, the body map, and the IA.
3. **The live screen is finished.** Lab 33 is the four-state reference. Note it is the one screen the critique does *not* hit — it is mostly one big instrument, not stacked text.
4. **K3 vs K2 still needs hardware, and only hardware.** Lab 30 R4 settles the dial-over-ladder half with a mask; whether a left-edge column fights the iOS back gesture under a real thumb is unchanged and unanswerable on a screenshot. The ladder now has a tap target (it opens the exercise sheet), so a failure here is recoverable rather than fatal.
5. **All nineteen screens are drawn.** Labs 34–37 cover the sixteen that were missing. Open on those: the **body map** (Lab 35 B4) is the least resolved drawing in the set, and the **IA** in Lab 34 was decided rather than agreed — reopen it if the tab split is wrong.
6. **Implementation is next.** `/design implement`, tokens through `expo:expo-design-system`, never porting the mockup HTML. Start from `claudedocs/design-labs/kit.py` — it is §0 turned into primitives and maps almost one-to-one onto a token file plus a component set.

---

## 1. What the app is

A personal strength-training tracker. Expo SDK 57 / RN 0.86 / expo-router. Not a mass-market product — one user, so polish and personality are worth more than broad accessibility compliance.

**Existing feature set** (all designed, none implemented yet):

- **Logging** — live session with running clock, exercise queue (reorder, swipe-delete), set rail, per-set weight × reps, auto rest timer with +30s/skip, plate calculator, lock screen, quick-repeat of last set, session summary
- **Planning** — routines (exercise + sets/reps/weight/rest), programs (routines scheduled by weekday or fixed cycle), exercise library with search / muscle / kind filters, custom exercises
- **Reviewing** — weekly volume vs last week, day strip, 3-day and 6-week charts, month calendar heatmap, per-exercise history and PR trends, front/back muscle map, per-session detail log
- **Settings** — kg/lb, cm/in, en/es, rest defaults per exercise type

**Agreed new capability** (designed in Lab 03, not yet in the champagne file): estimated 1RM, RPE/RIR, PR detection, plateau flags, progression suggestions, phone-only readiness, per-muscle fatigue decay, volume landmarks + deload, bodyweight trend, relative-strength standards, warm-up ramps.

---

## 2. Where the design lives

Claude Design project **`85c2eefb-a239-4501-83a0-a24a4ccd7cae`** ("Workout Session Tracker App", owner Christian Rivera). Access via the `DesignSync` tool; needs `/design-login` once per session.

| File | Status |
|---|---|
| `Workout Session Champagne.dc.html` | **The reference implementation.** 19 screens, fully interactive, audited and fixed. The density and completeness bar. |
| `Lab 01 — Four Aesthetics.dc.html` | 4 aesthetics, one screen, identical content and accent |
| `Lab 02 — Glass & Geometry.dc.html` | 3 blur strategies + 3 geometry flavours |
| `Lab 03 — Instrument At Full Density.dc.html` | **Current direction.** 4 screens at full density incl. the new capabilities |
| `Lab 04 — Palette.dc.html` | Gold vs orange+mint vs mint, on identical Lab 03 markup |
| `Lab 05 — Five Materials.dc.html` | One live-session screen, five surface languages, identical markup |
| `Lab 06 — Motion.dc.html` | Twelve micro-interactions, **running live**, each with its real Reanimated call |
| `Lab 07 — Three More Directions.dc.html` | Rack / bento / cluster — layout languages, not materials |
| `Lab 08 — Primitive Catalog.dc.html` | Twelve new instruments + six killed + four gaps |
| `Lab 09 — Type & Numerals.dc.html` | Six typographic pairings against a jitter test |
| `Lab 10 — Palette II.dc.html` | Gold fixed; six alternatives for the two *state* hues |
| `Lab 11 — Six Ways To Be Glass.dc.html` | Six glass recipes, plus the all-glass failure and the rich-field proof |
| `Lab 12 — Cluster Refined.dc.html` | Cluster with the satellite cards given real material, three ways |
| `Lab 13 — Legibility.dc.html` | Six Lab 08 instruments reworked, as-drawn vs readable, plus the tiering rule |
| `Lab 14 — Palette III.dc.html` | Olive held, chroma raised. Six pairings sourced from published palettes |
| `Lab 15 — One Ring Two Jobs.dc.html` | Cluster on V3 lit panels; ring anatomy + lifting + resting states |
| `Lab 16 — Readable And Then Some.dc.html` | Four readable instruments × three style treatments |
| `Lab 17 — The Plate Card.dc.html` | Five treatments of the plate readout |
| `Lab 18 — Twenty Worlds.dc.html` | 20 palettes across 10 territories, sourced and measured |
| `Lab 19 — Header Layouts.dc.html` | Four cluster-header arrangements, lifting and resting |
| `Lab 20 — Navigation.dc.html` | Six bottom-bar patterns incl. the live-session state |
| `Lab 21 — Editorial Screens.dc.html` | T3 with rounded caps, two full screens + the new nav |
| `Lab 22 — Palette IV Saturation.dc.html` | The current palette, five saturation positions |
| `Lab 23 — Navbar With Centre Button.dc.html` | Labelled tabs + a centre start button, four ways |
| `Lab 24 — Where The Sets Go.dc.html` | **Six set-management approaches for the live screen** |
| `Lab 25 — Five Style Treatments.dc.html` | Precise, Soft, Editorial and two editorial variants, full screens |
| `Lab 26 — Gesture Live Screen.dc.html` | Swipe-navigated live screen, five indicator treatments |
| `Lab 27 — Rules Off Rail On.dc.html` | Main screen with no rules; the rail as the chronological pattern |
| `Lab 28 — Two Axes Two Vocabularies.dc.html` | Written set line fixed; five vertical languages. K3 preferred |
| `Lab 29 — Sets And Gestures.dc.html` | Lab 24's sets and Lab 28's gestures on one screen for the first time. Set strip proposed — **rejected** |
| `Lab 30 — Sets Behind The Button.dc.html` | Strip removed; sheet does reading *and* navigation; dial down to 300pt; the swipe masked under the ladder |
| `Lab 31 — The Ring Edits.dc.html` | The ring as the input for load / reps / RPE, two drag models; reorder grips on both sheets |
| `Lab 32 — Lines Only.dc.html` | Arc and knob removed; three tick treatments; tape / perimeter / keypad |
| `Lab 33 — The Live Screen Settled.dc.html` | **The live screen, finished.** Four states, every decision applied |
| `Lab 34 — Planning.dc.html` | Routines, routine detail, programs, program detail. Opens with the IA |
| `Lab 35 — Library And Anatomy.dc.html` | Exercise library, exercise detail, custom exercise, body map |
| `Lab 36 — Review.dc.html` | Calendar, session summary, session detail, PR timeline |
| `Lab 37 — Load And Settings.dc.html` | Volume/deload, bodyweight, readiness, Settings |
| `Lab 38 — Reading At A Glance.dc.html` | **Proposals for the reopened style rule.** Four containment treatments + four stat-density treatments |
| `Lab 39 — Applied.dc.html` | Exercise screen (demo, description, muscles, cues) and calendar, rebuilt on Lab 38 |
| `Lab 40 — Between P3 And P4.dc.html` | Four line treatments on the settled plate. **M4 chosen** |
| `Lab 41 — What Gets A Plate.dc.html` | The plating rule: containment only for content with no boundary of its own |
| `Lab 42 — One Plate Per Row.dc.html` | **Current containment rule.** P5 (row plates + one plated hero + plain prose) and P7 (set log with no containment) chosen |
| `Lab 43 — Today And The Android Chrome.dc.html` | **The last screen, and the platform switch.** Today as designed, on v1 data, and empty; the tab bar as glass vs two opaque plates |
| `Lab 44 — Today With A Face.dc.html` | **Open.** The champagne card returns: filled accent hero, a week ring against a real target, and the quieter alternative |
| `Lab 45 — The Week You Can Scroll.dc.html` | **Today, settled at W3.** The strip scrolls, so the date arrives; the fill is the graph |
| `Lab 46 — History.dc.html` | **H2, and then not built.** A flat archive, ruled by month. The IA has no history list — kept as the answer if one is ever wanted |
| `Lab 47 — The Design System.dc.html` | **The reference sheet.** The tokens as swatches, every primitive in every state, the composition rules drawn rather than written, and the interaction model. Generated from `kit.py` and the real values in `src/theme/`, so it cannot drift. Holds no screens — open it before building one |
| `Lab 48 — Every Screen.dc.html` | **The design file.** All 24 drawn screens in one place, grouped by tab, each captioned with the decisions inside it and its build state. Imports every phone from the board that settled it rather than redrawing, so no screen can drift |

**Read these five first.** Lab 22 (palette), Lab 23 (navigation), Lab 33 (live screen), Lab 40 (plate treatment), Lab 42 (containment). Everything before them is the reasoning that got there; those four are the state.
| `Workout Session A Telemetry / B Ledger / C Focus / D Editorial` | Earlier round. **Superseded** — user found them over-simplified. Keep for reference, don't build on. |
| `Workout Session Player / Lab / Lab v2 / GymSync / Home Sample / Color Palettes / Background Studio` | Older skins, pre-audit. Ignore. |
| `ios-frame.jsx`, `support.js` | Claude Design starter scaffolding, marked `@ds-adherence-ignore`. Not app code. |

Reference imagery the user supplied: `~/Images/gymsync/` (14 webp). GymSync/Velex concept — warm taupe lit panels on near-black, tick rails, arc gauges, orange + mint, thin numerals with small units. **Tablet-density; does not transfer 1:1 to a 402pt phone.**

---

## 3. Chronology

1. **Audit of the champagne design** — 13 findings, all applied and verified (see §5).
2. **Four alternative directions** (Telemetry / Ledger / Focus / Editorial) built off a shared minimal core. **User rejected all four**: over-simplified, stripped information the champagne design had. Editorial "doesn't make sense for a workout app"; Focus "way too minimalistic". Telemetry closest but still short.
3. **Research** (4 parallel Sonnet agents) — iOS 26 Liquid Glass, instrument-UI pattern catalogue, strength/readiness feature research, ready-made assets + 2026 trends. Findings in §6.
4. **Labs 01–03** — visual samplers answering the user's style questions with pictures instead of prose, ending in a full-density direction.

---

## 4. What the user actually wants

Their words, condensed:

- Premium, modern, minimalistic, fluid, **nice to look at** — but with a real, intuitive, information-dense UI
- **Telemetry direction is closest**; champagne is closer than any of the four alternatives
- Minimal, linear, **perfect geometric** styles as in the reference images
- **Blur** for a distinct modern feel — explicitly willing to trade accessibility for the look ("this is mostly a personal app")
- A UI that feels like **a unique experience**, not a template
- Explore freely; their instructions are "suggestions and personal preferences rather than hard requirements"

Answered in the question rounds: instrument vocabulary + geometric hardware feel + lit taupe panels matter most; **no photography**; explore both champagne-gold and reference orange+mint; all four new-capability groups are wanted.

**Taste learned across twenty-eight boards** — worth reading before proposing anything:

- Rejects **muted and dusty** (sage, oxblood, dull olive) *and* **electric** (lime, signal orange). The landing zone is saturated but warm.
- Rejects anything that has to be **decoded**. This overrode their own earlier "favour looks over accessibility" instruction, and it is the single most load-bearing constraint in this document.
- Wants **labels on navigation** even for an app only they will use — "I'd eventually get tired of having to click each option to remember what they are."
- Notices **asymmetry, redundancy and dead space** immediately, and is right every time. Three separate boards were fixed on those grounds.
- Reliably prefers the **quietest option that still says something** — editorial over soft, inset over raised, written over drawn.
- Asks "what does this indicate?" of anything decorative. If an element cannot answer, it does not survive.

---

## 5. Hard-won constraints — do not relearn these

**The 256 KiB read cap.** `DesignSync.get_file` truncates at exactly 262,144 bytes and sets `truncated: true`. The champagne file is larger. Editing a truncated read and uploading it **destroys the tail of the file** — this happened once and cost a recovery cycle. Either check the `truncated` flag every time, or have the user download the file and work from disk. **Keep new files under ~250 KB so they stay readable.**

**Pre-upload gate.** Never upload without: ends with `</html>`; `</script></x-dc></body></html>` all present; JS block tokenizes with zero unterminated strings; braces/parens/brackets balanced; tags and divs balanced; no `""`; no attribute value containing a newline; line count within a hair of the input. A green check you have not tried to make fail is worth nothing — regression-test the checker against known-bad input.

**Layout overflow.** Phone content width is 402pt. A checker (`check_layout.py`, rebuild if lost) parses the template, walks every screen and compares each flex row's min-content width against available width. Two real overflows were shipped before this existed. Must model: `flex-wrap`, mutually-exclusive `sc-if` branches, `max-width`, and text as wrappable (min-content = longest word).

**Device geometry** from `ios-frame.jsx`: frame 402 × 874, status bar occupies 0–62px, home indicator 34px at the bottom. Screen top padding must be ≥ 62 (use 70); bottom ≥ 34 (use 44); tab bar bottom inset 40.

**The champagne design's own rules** (recorded in repo `DESIGN.md`): 44pt minimum hit areas — visually-small controls keep their drawn size and expand only their touch region; 11px type floor; weight 300 reserved for ≥22px; 4/8 spacing grid; four radii; blur on chrome only; `plate-*` colours are the sole exception to the no-extra-hue rule.

**dc file format.** `<script type="text/x-dc" data-dc-script data-props="...">` containing `class Component extends DCLogic` with a `renderVals()` returning the object bound to `{{ }}`. Template uses `<sc-if value="{{ bool }}">`, `<sc-for list="{{ arr }}" as="x" hint-placeholder-count="N">`, `onClick="{{ fn }}"`, `style-active="..."`. Style-bound values must be CSS strings, not booleans.

---

## 6. Research findings that shape the design

**Liquid Glass (iOS 26).** Glass is the *control layer floating above content* — tab bars, toolbars, sheets, buttons — never the content itself. Two named anti-patterns: **glass-on-glass** (blur compounds into noise) and **"ghost glass"** (glass over a flat background reads as nothing — it needs rich, varied content behind it). Since photography is ruled out, **the data field itself must be the background**: dot grid, chart, tick rail behind; glass chrome floating over. `expo-glass-effect` is already a dependency; `GlassView` takes `glassEffectStyle` (`regular` / `clear`), `tintColor`, `isInteractive`; `GlassContainer` has `spacing` for merging adjacent glass. Known bug: `opacity: 0` on a `GlassView` or any ancestor kills the render — animate via `glassEffectStyle.animate`.

CSS approximation used in the labs:
```css
background: rgba(255,255,255,0.08);
backdrop-filter: blur(24px) saturate(180%);
border: 0.5px solid rgba(255,255,255,0.18);
box-shadow: inset 0 1px 0 rgba(255,255,255,0.35),
            inset 0 -1px 0 rgba(0,0,0,0.20),
            0 8px 24px rgba(0,0,0,0.35);
```
Chrome bumps to blur 36px / alpha 0.13. Shipping comparables: Gentler Streak, **Reps & Sets 26** (direct analog).

**Instrument vocabulary — five primitives cover the app.** Tick rail (any series), tuner tape with fixed centre index (any dialled value), arc (anything measured against a target), segmented meter (anything counted), band chart (anything with thresholds). Plus: contributors list, coach card, countdown ring with numeral core, barcode trend strip, radial tick collar.

Three traps, all named in research: tablet-density transplant (cap at one hero gauge + one supporting strip per screen); **decorative ticks with no bound data** (every tick must map to a real unit, unfilled ticks visibly dimmer); low-contrast microtype (reserve mono/dot-matrix for numerals ≥16px, humanist sans for captions).

**Feature computation.** e1RM Epley `w × (1 + reps/30)`, Brzycki `w × 36/(37 − reps)`; agree under ~6 reps, diverge above; unreliable past 10–12 reps, meaningless on isolation work. RIR = 10 − RPE. Hevy detects PRs in five categories (heaviest weight, best e1RM, most reps at weight, best set volume, best session volume) with a live in-workout banner. Plateau heuristic: no e1RM/volume increase across 2–3 sessions at equal-or-lower RPE. Progression by training age: <6mo linear, 6mo–2yr double progression, 2yr+ autoregulated. Readiness without a wearable: 3-tap subjective check-in + per-muscle fatigue decayed from recent volume (~48h half-life); deload when weekly sets approach RP's MRV *and* a stall coincides. Bodyweight needs 7-day smoothing. Relative strength = lift ÷ bodyweight against percentile tables. Warm-up ramp ≈ 40% ×5, 60% ×3, 75% ×2, 85% ×1. **Bar velocity is camera-CV only — do not fake it from tempo; hide the feature rather than approximate.**

**Assets worth pulling in.** Victory Native XL or react-native-graph (Skia charts), reanimated-arc (radial gauges), Legend List (variable-height lists), Phosphor Thin or Lucide (technical icons), JetBrains Mono (tabular figures by default) paired with Space Grotesk or PP Neue Montreal. No existing Figma kit combines dark-instrument + glass + fitness — this has to be drawn.

---

## 6b. Research round two (2026-09-05, four parallel Sonnet agents)

### Adjacent visual languages

| Direction | Density verdict | Glass | Where it belongs |
|---|---|---|---|
| Etched / milled | Good for heroes, muddy across many small tiles | Fights it — use as a contrast pair | 2–3 hero panels per screen, not uniformly |
| Blueprint / drafting | Grid logic is dense; drafting callouts are sparse per instance | Partial — technical paper *under* glass chrome | Structural grid everywhere, dimension lines 1–2 per screen |
| CRT / phosphor | Trap if applied broadly | Strong — glow and glass are both "light behaves physically" | **Live state only.** Not the default numeral treatment |
| Bento | Density-native by construction | Strong — Apple's own current combination | It is the *container*, orthogonal to the material question |
| Instrument cluster | Sparse by construction | Bezel yes, gauge face no | The live screen and nowhere else |
| Vector outline | Fails outright | n/a | **Dropped.** No credible shipping precedent as a finished dark identity |

Three unlisted directions the research surfaced. **Rack-mount / Eurorack** is the strongest — a patchbay of many small self-contained modules is structurally closer to "a screen of many stat modules" than anything originally proposed, and it is the only layout that scales to 19 screens without redesign. **Cartography / nautical chart** — good for progress-over-time, but see the kill list below. **ATC / radar scope** — high density, real risk of reading as a costume.

Named precedents worth studying: Palantir Blueprint.js (dense dark data UI), Teenage Engineering, Porsche Taycan HMI (orange-on-true-black for dark-adapted vision), Panic Playdate (the disciplined version of dot-matrix), NI Kontakt 7 (the audio-plugin vocabulary), Garmin G1000 glass cockpit.

### Motion, verified against SDK 57

Expo SDK 57 pins: **Reanimated 4.5.1** (worklet runtime split out into `react-native-worklets` 0.10.1; Babel plugin moved to `react-native-worklets/plugin`), **Gesture Handler ~3.1.0**, **Skia 2.6.2** bundled (2.11.2 is latest on npm), **expo-haptics ~57.0.1**.

- **Shared element transitions are not usable.** Reanimated's are behind `ENABLE_SHARED_ELEMENT_TRANSITIONS` and marked experimental. expo-router's Apple Zoom (`<Link.AppleZoom>`) is alpha, iOS 18+, Stack-only, and does not work with Tabs or Drawers. Build the set→arc morph by hand: `measure()` the source, stash the frame, animate a positioned clone, cross-fade at ~70%.
- **Variable-font weight animation is out.** `fontVariationSettings` exists but RN font changes force a native remeasure — it is not a compositor-level animation and not a worklet target. Ship 2–3 discrete weights and cross-fade, or fake it with letter-spacing + scale. **This kills the idea recorded in §8.4.**
- **`GlassContainer`'s `spacing` prop is the native merge/separate primitive** — the Liquid Glass "morph together" behaviour is free, don't reimplement it. The `opacity: 0` caveat is confirmed and documented; the fix is `GlassEffectStyleConfig {animate: true, animationDuration}`, never `useAnimatedStyle({opacity})`.
- **Haptic budget**: `selectionAsync` for tuner detents (throttled on velocity), `impactAsync(Rigid)` for a logged set, `notificationAsync(Success)` reserved for a PR and nothing else.
- **Performance**: transform and opacity only, never layout. Practical ceiling is ~2–4 concurrently *animating* glass surfaces at 120 fps; static glass is far cheaper. Batch gauges into one Skia `Canvas` rather than one per gauge. A single `runOnJS` in a hot path is how 120 fps silently becomes 60.

### Libraries and assets

**Use:** `@shopify/react-native-skia` as the canvas foundation for everything custom-drawn · `victory-native` (XL) 42.0.1 for genuine chart types · `phosphor-react-native` 3.0.6 (Thin/Light is exactly the hairline look) + `expo-symbols` 57.0.2 for iOS chrome + `lucide-react-native` for gaps · JetBrains Mono / Space Grotesk / Instrument Sans, all via `@expo-google-fonts/*` · texture (grain, scanlines, dot grid) as **SkSL fragment shaders inside Skia**, no bitmaps, no SVG filters.

**Build, do not install:** arc gauges, odometers, segmented meters, countdown rings. Confirmed absence — every RN package for these was last published 2022–2024 and predates New Architecture. Each is well under 100 lines on Skia.

**The one defensible new dependency** is `react-native-legend-ruler-picker` 1.0.2 for the tuner tape, and only after a New-Arch smoke test of `@legendapp/list`.

**Avoid:** `react-native-gifted-charts` (SVG, not Skia — two rendering paradigms in one UI), `react-native-svg-charts` (unmaintained since 2020), `react-native-ticker`, `react-native-gauge`, `react-native-odometer`, `react-native-circular-progress-indicator` (all stale). Berkeley Mono, PP Neue Montreal and Söhne are all **paid** — cut on licence, not looks.

**Closest shipping precedent:** Gentler Streak's iOS 26 update (Liquid Glass chrome over dark instrument tiles) and Whoop's colour-zoned recovery arc.

### Hierarchy in dense dark dashboards

Four principles, drawn from Bloomberg, Grafana, glass cockpits and Rams/Teenage Engineering:

1. **One hero instrument per screen** is allowed to be the loudest thing; everything else is structurally smaller and dimmer, not merely conventionally so.
2. **Progressive disclosure by state.** A screen mid-set should suppress the instruments irrelevant to the current set and re-expose them at rest. Density is only acceptable when all of it is relevant *right now*. This is the single biggest lever against noise across 19 screens.
3. **Elevation by lightness, not borders.** On dark, borders read as clutter; a lighter plate is how you group.
4. **Position is a silent second axis.** Keep canonical slots (hero top, trend below, secondary row bottom) fixed across screens even when the instrument in the slot changes.

---

## 7. Current direction — *superseded, see §0*

### Historical: Lab 03

**Glass chrome floating over an instrument field, hard-edged readouts inside soft containers.** Material recommendation from Lab 02 is **B + G3**: glass on floating chrome and one hero surface per screen; solid lit panels wherever a number must be read; strict instruments inside soft glass shells.

Palette as drawn: ground `#0a0908`, solid panel `#15130f`, glass `rgba(255,255,255,0.08)`, text `#f6f3ec` / `#c9c3b6` / `#a49f94`, mono labels, champagne `#d9c9a8`, mint `#8ce07f`, signal orange `#ff5c1a`.

Four screens: **Today** (readiness arc + contributors, volume tick rail, day strip, next session with lift list, PR ticker) · **Live session** (segmented set meter, tuner-tape weight entry, RPE collar, logged-set table with live e1RM, rest ring, glass action bar) · **Strength** (e1RM arc, 24-session barcode trend, rep-max table, strength-standard percentile, progression suggestion) · **Load** (volume landmarks band chart, deload call, fatigue decay, bodyweight trend).

One knowingly-accepted contrast miss: `#6f6a5e` axis gradation labels at 3.44:1. Kept because dim-vs-active ticks are the instrument reading, and the user deprioritised accessibility here. Everything else clears AA.

---

## 8. Open decisions — *superseded, see §0*

1. **Lab 03 lands** — user confirmed 2026-09-05: "really close to what I'm looking for." Remaining question is which of the Lab 05 material and Lab 07 layout variants to fold in before scaling to 19 screens.
2. **Palette** — **board built (Lab 04)**, decision open. Finding: the app needs three distinguishable accent states (current / done / live), and only the gold palette supplies them. Orange-as-hero collapses *current* into *live* — the set meter's active segment and the LIVE dot become the same hue. Mint-as-hero collapses *current* into *done*. Contrast against each column's own panel: gold 11.37:1, orange 5.60:1, mint 10.77:1 — all pass, so this is a semantics call, not a contrast one. The warm-taupe panel hex barely reads at phone size; the "lit panel" quality comes from the ambient bloom, which is palette-independent. **Recommendation: keep gold, take the reference's lighting rather than its hue.**
3. **Typeface** — **board built (Lab 09)**, decision open. Poppins is disqualified: no tabular figures, so clocks and logged loads jitter as they count — visible in the jitter test. Inter is disqualified on character, not craft. Recommendation is **Space Grotesk + Instrument Sans + JetBrains Mono**: three roles, three faces, all OFL, all variable, all with `@expo-google-fonts` packages. Martian Mono is the loud alternative and costs real width in a set table.
4. **Motion** — **twelve interactions designed and running in Lab 06**, each with its verified SDK 57 call. Open: whether the PR overdrive is too much, and whether the set→arc morph is worth the hand-built cost given no stable native primitive. Variable-font weight shift is **cut** — not achievable on RN.
5. **Material** — Lab 05. Solid-state (no material at all) held up better than expected and is the honest discipline check; milled is the most distinctive and the most expensive to keep consistent; blueprint and phosphor are best scoped narrowly rather than adopted whole.
6. **Layout** — Lab 07. Rack scales best to 19 screens; bento is the safest and most iOS-native; cluster is the best live screen and the worst general one.
7. **Primitives** — Lab 08 adds twelve. The highest-value one is exceedance bands, because RP volume landmarks currently have no instrument at all and the bands cost no new geometry.
5. **Then implementation** — `/design implement`, tokens through `expo:expo-design-system`, never porting the mockup HTML.

---

## 8b. Decision log — rounds three to seven

*Superseded by §0 where they conflict. Kept for the reasoning, which is the part worth not relearning.*

### Round three

Direct feedback on Labs 04–09. **These are settled unless the user reopens them.**

- **Palette.** Gold accent confirmed — that was the part of palette A they liked. **Lime and signal orange are both rejected.** Everything else in the palette is fine. Lab 10 explores six replacements for the two state hues with gold held fixed; each candidate was lifted in lightness until it cleared 4.5:1 on the panel, hue and saturation held.
- **Material.** **Glass only.** Milled, blueprint, phosphor and solid-state are all rejected — "don't really fit my taste or the look I'm trying to achieve." Further exploration must stay inside glass; Lab 11 does that.
- **Motion.** All twelve approved. Tiles 08 (set→arc) and 10 (glass merge) were unclear — 08 "looks broken." Both rebuilt in real app context in Lab 06. **Tile 08 is now explicitly flagged as the most expensive and most skippable of the twelve.**
- **Layout.** **Cluster (D3) preferred.** Requested: the satellite cards below the dial need a more distinctive background or blur, because they were vanishing into the dark ground. Lab 12 answers this three ways.
- **Legibility — the most important note.** Several Lab 08 instruments required looking twice: *"when using non conventional data representation figures the app becomes hard to use or look at for users."* This **overrides** the earlier "favour looks over accessibility" instruction and is now a hard constraint. Lab 13 reworks six of the twelve and sets the rule.
- **Typography.** **Geist + Geist Mono (option D) preferred over Space Grotesk + Instrument Sans (option B)** — closer to Poppins, and the user prefers both the titles and the numerals. This overrides the research recommendation. Geist is free, commercial use permitted, both faces variable, both have true tabular figures. Self-host via `expo-font`; there is no `@expo-google-fonts` package for Geist, unlike option B.

### The legibility rule (from Lab 13)

Instrument styling is a **surface** treatment — hairlines, ticks, mono numerals, dim-versus-lit. It is **not** a licence to invent a new encoding for a number. Where a bar chart is the honest answer, draw a bar chart and make it beautiful. Three tiers:

| Tier | Meaning | Members |
|---|---|---|
| **Reads with no explanation** | Ship anywhere | Progress ladder, RPE bar chart, ring row, line chart with flags, plate strip, segmented set meter |
| **Reads once labelled** | The label is part of the instrument, never ship bare | Zone bands (words, not acronyms), comparison cap (legend), tuner tape (units on axis), delta bracket (signed value always visible) |
| **Needs teaching — changed** | Reworked in Lab 13 | Inverted capacity meter → flipped · vertical altitude tape → number+arrow+sparkline · gap-encoded waveform → labelled list · vernier dual scale → plates only · rotary detent → segmented control · barcode strip → line chart |

Also settled in Lab 13: **MEV/MAV/MRV are jargon.** The bands stay, the acronyms go — "Too few / Good / Hard / Too much", with a sentence saying what to do.

---

### Round four

- **Motion.** Tiles 08 (set→arc) and 10 (glass merge) **cut** — "unnecessary… too much movement and distraction." Ten remain. Lab 06 regenerated.
- **Palette.** Direction is **palette 3's olive**, but "too muted or dull… more livid, darker or slightly more vibrant with the same shade." Also liked P5's amber for *live* and P4's teal for *done* "kind of." Lab 14 answers with values lifted from Gruvbox, IBM Carbon, Radix, Tailwind and Open Color rather than invented.
- **Glass.** **G1 confirmed.** No further material exploration needed.
- **Layout.** **V3 (lit panels, no blur)** over the glass variants — "too much glass in a single screen and I'm not sure how it would impact performance." That instinct is correct: the practical ceiling is 2–4 concurrently animating glass surfaces.
- **Legibility.** Lab 13 approved. Asked for the same rules with more aesthetic ambition → Lab 16.

### Fixes applied to the base screen (`lab05.py`, so every board inherits them)

1. **Tuner tape gradations were invisible.** Now three tick weights on a dedicated `--tick1/2/3` ramp (`#5a5449` / `#7d7666` / `#a8a091`) instead of two on `--off`/`--on`. Half-kilo, whole-kilo and five-kilo now read as three different things.
2. **The weight card carried no palette colour.** The RPE ladder is now **zoned** — green submaximal, gold target band, orange near failure, unfilled rungs at 20% — so colour enters the hero card as a *reading* rather than as decoration. Axis numerals moved from `--dim` to `--tick2`.

### The amber warning (Lab 14)

Champagne gold is **hue 40°**. The amber from palette 5 (`#c9922e`) is **hue 39°**. They are the same hue; only lightness (76 vs 48) and saturation (39 vs 63) separate them. Workable but fragile — any later softening collapses the distinction. The ambers in Q1 (`#d97706`, 32°) and Q2 (`#d65d0e`, 24°) buy a real hue buffer. **If Q3 is chosen, live must stay below 55% lightness and above 55% saturation, permanently.**

### The ring, answered (Lab 15)

The Lab 12 collar indicated nothing — a fair criticism. It now carries a fixed **20–140 kg scale**, one tick per 2 kg, major rule every 10, arc lit up to today's load, with a red notch at the estimated 1RM. So a glance gives the number *and* where it sits in your range; a near-full ring means you are near your ceiling.

**The user's rest-timer idea is built and it works.** During rest the same ring depletes in the live colour and the numerals become the countdown, with +30s and Skip beneath them. The two states never coexist, so there is nothing to disambiguate — and the dedicated rest card disappears, buying back a full card of vertical space.

---

### Round five

- **Plate card**, not the hero card, was what "doesn't use palette colours" meant. Correct — it wore blue/green/white from nowhere. Lab 17 gives five treatments. **It also had a real arithmetic bug**: it showed 20+20+10+2.5 = 52.5 kg per side under a label reading 41.25. Correct loading for 102.5 on a 20 kg bar is **25 + 15 + 1.25**. Fixed, and plate geometry is now real — height is diameter, width is thickness, both to scale, so the sizes do the identifying and colour becomes optional.
- **RPE ladder reverted** to one hue with opacity carrying the level. The zoned version was not wanted.
- **Palette.** Q1 closest, but live must be **red, not orange**; done slightly darker. Also asked to leave the comfort zone entirely → Lab 18, 20 palettes across 10 territories.
- **Header.** Vertical, centred above the ring. Lab 19 — H2/H3 confirm the instinct: the ring, load numeral and reps already share one centreline, and the left-aligned header was the only thing breaking it.
- **Style.** T3 editorial with rounded caps at the same thickness, seen in a real screen → Lab 21.
- **Navigation** disliked. See below.

### Why the nav bar grated (Lab 20)

Not taste. **A segmented control is the component iOS reserves for filtering content within a screen** — Health uses one for Summary/Sharing. Using it for top-level destinations is a documented mismatch: it reads as a filter and behaves as a tab bar. Recommendation is **N4, the split action bar** — four destinations in a glass dock plus the primary action as a separate solid capsule on the same plane. Not a Material centre FAB; wrong idiom for iOS, and there is no natural middle in an even four.

**Every fitness app checked** — Strong, Hevy, Fitbod, Nike Training Club, Peloton, Ladder, Strava — replaces navigation entirely during an active set. None keep four-way nav live. Build the live screen as a separate route outside the tab group, not a hidden tab bar.

**Implementation fork.** `NativeTabs` (SDK 57) gives real Liquid Glass, the float and minimise-on-scroll for free, but locks you to Apple's bar shape — N4's asymmetry is impossible. `expo-router/ui` (`Tabs` / `TabList` / `TabTrigger asChild`) is headless: it owns routing, you draw the bar with `GlassView` / `GlassContainer`. **N4 and N6 require the second route.**

Caution: Apple's `tabViewBottomAccessory` / `bottomAccessory` is for *global* state only — a "workout in progress" chip. Not the Log-set button; it persists across all tabs and will look wrong on the other three.

### Palette findings (Lab 18)

Twenty palettes, ten territories, every value from a published system (Gruvbox, Radix, Tailwind v4, IBM Carbon, Nord, Tokyo Night, Material, Apple HIG). ~14 needed a small lightness lift to clear 4.5:1 against their own panel; hue and saturation held. **Live is red in 18 of 20.**

- **Retro Track is a deliberate cautionary entry** — its live sits 9° from its accent, the same trap champagne-and-amber fell into. Once live leaves red, hue collision with a warm accent is very hard to avoid.
- **Competitive check:** Strava ships `#FC4C02`; Whoop runs red on near-black. The shipping field skews stark and red-forward, not warm and gilded.
- Five worth seeing at full size: **Arctic Ice** (furthest from champagne), **Aubergine Nights** (untested hue), **Concrete Red** (most extreme, and closest to what the category ships), **Botanical Jade** (green promoted from state to identity), **Gunmetal Carbon** (reads as instrument panel, not app).

---

### Round six

- **Plate card: default to A (competition colours), user-configurable in Settings.** Both A and B liked; not an either/or. Record as a real setting, not a design choice to resolve.
- **Palette:** none of the twenty. Wants the *current* palette with more saturation → Lab 22, five positions on one dial. Live stays red. My read is V2–V3.
- **Header:** H4's flanking rules must mean something, otherwise H2. **Resolved** — they are now the set meter: filled segments left are logged sets, the bright one is current, dim ones ahead. The count in the middle only confirms the shape.
- **Plate card removed from the live screen** — broken, and not worth the space. Plate readout survives as a feature, not as a permanent card.
- **The bottom-left key is now labelled `SETS`.** The user did not know what the hamburger did, which is the answer.
- **Navigation: N2's labels stay.** Icon-only is "a memory test I'd eventually resent" — true regardless of user count. Explore a centre circular start button → Lab 23. Keep the minimised and live-session states.
- **Style: E3 editorial confirmed**, with more variants requested → Lab 25.

### The live screen's set problem (Lab 24)

Removing the plate card, the SET 4/5 tile and the set table frees **~260pt of vertical space**. Six approaches, most explicit to most invisible: sheet · edge rail · chip strip · peek line · ring collar · paged.

**Recommendation: S3 + S1.** Chip strip for reading, sheet for editing. Reading what you just lifted happens constantly and should cost nothing; changing a logged set happens rarely and can afford a tap. Trying to serve both with one control is what produced the table that ate half the screen. S5's collar costs no space and is worth keeping regardless.

Open: this is the ergonomics-critical screen and the user flagged it as needing its own iteration cycle. Lab 24 is round one, not a conclusion.

### Navigation, refined (Lab 23)

Four labelled tabs plus a centre action solves the problem the split bar had: with an even four there is no natural middle, so a centre element only works if it is **not** one of them. **W2 (inset) is recommended** — same prominence, one continuous glass plane.

⚠️ **W1 (raised) and W4 (notched) are Material idioms.** iOS 26 Liquid Glass wants surfaces that merge and separate, not surfaces punched through. Neither shape is available from `NativeTabs`; both force hand-building on `expo-router/ui`. Legitimate choice, but it costs the native path.

---

### Round seven — see §0 for the settled table

These are settled. Build against them unless the user reopens one.

| | Decision |
|---|---|
| **Palette** | **V2 from Lab 22.** accent `#e4c68c` · done `#9fae3a` · live `#df5441` · ground `#0a0908` · panel `#15130f`. Provisional pending a look on a real device, but treat as locked. |
| **Material** | Glass, G1 recipe (Lab 11). |
| **Navigation** | **W2** — four labelled tabs, inset circular start button, one continuous glass plane. Plus **W5** (minimised on scroll) and **W6** (live session replaces navigation). |
| **Type** | Geist + Geist Mono. Self-host via `expo-font`; no `@expo-google-fonts` package. |
| **Style** | **Editorial with no rules** (Lab 27 E6): larger numerals, no row borders, no section rules, spacing carries all grouping. |
| **Rail pattern** | Reserved for **anything chronological** — exercise history, session list, PR timeline. Dots cut free of the line (segments stop 6pt short). A rail always means "events in order" and never anything else. |
| **Plate colours** | Default **A** (competition coding), user-configurable in Settings. Not an either/or. |
| **Live screen** | Gesture-navigated: horizontal = sets, vertical = exercises. |
| **Set indicator** | **Written** (G3): `SET 4 OF 5` flanked by two hairlines. Fixed; does not change per variant. |
| **Two axes, two vocabularies** | The horizontal and vertical indicators must use **visually different languages**. Two identical indicators at 90° force the reader to work out which is which before reading either. |
| **Spacing ratio** | Where space is the only separator: **between-section space ≥ 3× within-section space.** On the main screen that is 34pt vs 7pt. Below that ratio it reads as a rhythm error, not a boundary. |
| **Rail spacing** | Each event gets **40pt of clear air beneath it**. The dot gap alone separates the *line* but not the *content* — rows still run together without it. |

### The live screen, across Labs 24 / 26 / 28

**Interaction model:** left/right between sets, up/down between exercises.

**The asymmetry is fixed at the root.** It came from splitting the meter into *done left / ahead right*, which can never balance on an odd count. Every indicator is now a **centred row of N equal cells** with the current one marked — symmetric for any N.

**The freed space now does two jobs.** A `LAST TIME` line under the dial (what you lifted for this set last session, plus the delta) — the one number you want mid-set and never had. Under it, four secondary destinations: history, stats, notes, swap. A session strip closes the screen out. Nothing scrolls; all five variants fill 860pt exactly.

⚠️ **Gesture conflict, unresolved.** A horizontal swipe on the left edge is the iOS back gesture; a vertical swipe near the bottom is the home gesture. Both will fight this. Mitigations: confine the swipe region to the dial and its surround rather than the whole screen, and give every gesture a tappable equivalent (the dots must be tap targets, not decoration). **G5 (peeking neighbours) is the safest** — the peeked neighbours are themselves tap targets, so the gesture is an accelerator rather than the only route.

**Round three (Lab 28)** locked the horizontal indicator to G3's written form and varied only the vertical language: dots · a single continuous bar · numbered ticks · abbreviated exercise names · chevrons only.

⚠️ **Still open and hardware-dependent:** all five put the vertical indicator on the **left edge**, which is where iOS reads a horizontal drag as the back gesture. Not resolvable on a screenshot — it needs a device and a real thumb. If it fights, K5 survives best: chevrons are decoration that can move anywhere, a column is not.

Recommendation is **K2** — words counting sets against a continuous bar measuring session progress. Widest available gap in vocabulary, and true to the data: sets are discrete and countable, a session is a distance you move through.

---

### Round seven

- **Typography was never actually applied.** Every board up to Lab 26 was still running Inter + JetBrains Mono despite Geist being chosen back in Lab 09. Fixed across all 24 generators. Verify the font is right on any new board.
- **K3 preferred over K4** — abbreviations "could potentially be confusing or not mean anything"; numbers cannot be misread. Completed ticks now take the palette's done green rather than a neutral grey, so the axis carries state as well as position.
- **Secondary buttons read as disabled.** They had a flat 4.5% white fill; now the full glass recipe with the ink lifted a step.
- **`ELAPSED` removed from the bottom strip** — already in the header. A number shown twice on one screen is a number you stop trusting.
- **Spacing increased again**, both places. Sections 34pt → 46pt; rail events 40pt → 56pt.
- **The sparkline was replaced.** "A random line in the middle of nowhere" — correct: a bare sparkline has no ground to be read against. The e1RM history is now a column chart with a baseline and a stated range; the bodyweight trend keeps its line but gains a baseline, a mid rule and a fill.

---

## 8c. Round eight — Lab 29, sets and gestures on one screen

**Awaiting the user. Nothing here is settled.**

Lab 24 recommended S3 + S1 (chip strip to read, sheet to edit). Lab 28 locked the horizontal
indicator to a written `SET 4 OF 5`. Both were recorded as settled and **they had never been
drawn on the same screen**. They contradict each other: a strip of five set values *is* a
horizontal set indicator, so the screen ends up with two of them forty pixels apart.

Five variants. **M2 is the recommendation.**

| | |
|---|---|
| **M1** | Both, exactly as the two boards specified. Drawn to show the collision rather than argue it. Also demonstrates the second problem: five boxes in a row is the most card-like object on a screen where Lab 27 outlawed cards. |
| **M2** | **The set strip replaces the written line.** Five columns of real values (`01 100.0 ×8` … ), no boxes, no rules, a 26pt gold rule under the current column. Says *set four of five* by position and also says what you lifted for the other four. |
| **M3** | Written line kept; strip moves below the dial under LAST TIME. Densest option, but back to two horizontal indicators and four stacked rows at the foot. |
| **M4** | M2 with the SETS sheet open — RPE and e1RM per logged set, add / edit. Reading is free, editing costs a tap; the Lab 24 split survives intact. |
| **M5** | Mid-swipe. Set four sliding out, set five entering at a third opacity, the gold rule already travelling. |

**Why the strip beats the written line.** The written line won in Lab 28 because the only
alternative on the table was a row of dots, and words carry a count where dots do not. A strip
of real set values carries the count *and* the loads — same argument, one step further. It also
gives the horizontal gesture the tap targets the conflict mitigation asked for, and it is the
only version that can animate *with* a drag: a rule on a track has in-between states, a sentence
does not.

**Two-vocabularies still holds, and more strongly.** Horizontal is a row of *measured values*;
vertical is a ladder of *ordinal ticks*. Each is true to its axis.

**Two changes made without asking, both flagged on the board.** The `LAST TIME` row lost its
raised fill and 1px border — it was a card, sitting directly under an argument that the set boxes
had to go for being cards. And the dial dropped 352 → 336pt to make room.

### What M5 settles that was filed as hardware-dependent

The dial is 342pt wide inside a 370pt window, so **the moment it translates it covers the
left-edge ticks**. There is no shift small enough to read as a swipe and large enough to clear a
column sitting at x=12. That half of K3-vs-K2 no longer needs a device. Three ways out, cheapest
first: shrink the dial to ~300pt and give the ladder a real gutter; move the ladder to the right
edge; or fall back to K5's chevrons, which have no column to collide with.

### Open

The strip assumes five sets fit. At eight the columns fall below the 11px floor or the numerals
truncate. Fallback is a five-wide window around the current set that scrolls with the gesture —
more code, and one more thing that can feel wrong. Worth deciding before it is discovered at
eight sets.

---

## 8d. Round nine — Lab 30, the sets go behind the button

**User's call: remove the set strip entirely.** The SETS button is the only global view of the
sets and the secondary way to navigate between them. Lab 28's written `SET 4 OF 5` line therefore
stays, and the two-vocabularies pairing is restored exactly as it was — a sentence across, a
ladder down.

| | |
|---|---|
| **R1** | The call drawn straight. Strip gone, written line back, the 56pt goes into air. |
| **R2** | Dial 342 → 300pt wide, ladder pulled to x=10. Clearance from the outermost tick goes 18pt → 41pt. |
| **R3** | The sheet doing both jobs: every non-current row gets a bare chevron and a 38pt hit area. |
| **R4** | Mid-swipe, with the dial masked out under the ladder. |

**Three consequences of the removal, none free.** The sheet inherits a job it did not have, so a
table that is also a menu has to look like one. The swipe loses its only visible track, so the
dial's slide becomes the entire feedback. And what you lifted on *earlier sets of this exercise*
is now a tap away rather than free — `LAST TIME` still covers the same set in the last session,
which is the number that matters mid-set, but "did I do 102.5 or 100 on set two" costs opening
the sheet. On straight sets that is nothing; on a top-set-and-backoff it is real. **If it turns
out to matter, the fix is not the strip coming back — it is one line under `LAST TIME` giving the
previous set of this exercise.**

**Also fixed here:** the dial box carries ~54pt of empty space below the last tick because the
ring's arc opens at the bottom. Untrimmed, the gap under the ring read 29pt larger than the gap
above it. Every variant now pulls it back with `margin-bottom: -28px`.

### Lab 29's collision fix was wrong

Lab 29 concluded the dial-over-ladder overlap could be solved by shrinking the dial to ~300pt.
**It cannot.** A 41pt gutter buys the first 49pt of travel; a paged swipe eventually crosses the
whole screen width, so no dial narrow enough to still be this screen is narrow enough to clear a
fixed left column.

The fix is z-order plus a mask: the ladder is chrome, it stays on top, and the dial is *masked
out* beneath it the way content passes under an iOS bar —
`mask-image: linear-gradient(to right, transparent 4px, #000 62px)` on the travelling track. A
painted gradient was tried first and reads as a visible rectangle sitting on the dot field.
R2's smaller dial is still worth keeping, but as a fix for the *resting* screen, not this.

---

## 8e. Round ten — Lab 31, the ring as the input

Removing `Edit set` only works if the live screen can change the numbers itself, so the ring stops
being a readout and becomes the control.

| | |
|---|---|
| **E1** | Resting. No reference numerals — they belong to edit mode. |
| **E2** | Editing load by dragging the ring's perimeter; knob on the arc, ladder dimmed. |
| **E3** | Editing load with a detent tape to the right; ring shrinks, parameters come out into a three-up selector beneath it. |
| **E4** | Editing reps — the ring re-scales to 1–15. |
| **E5** | Editing RPE — 6–10 in half points. |
| **E6** | Sets sheet with reorder grips, Edit-set removed. |
| **E7** | Exercise sheet — same component, one level up. |

**Recommendation: E3 for the input, E1 as the resting state.** The perimeter drag is the better
idea and the worse control — 2.5 kg is about seven degrees of arc, so the final increment is a few
pixels and your thumb covers the numerals while it works. Both can ship if the perimeter is never
the *only* route to a value.

**RPE should probably leave the ring.** E5 is a nine-position switch drawn as a 300° arc. Lab 13
already killed a rotary detent for exactly that and replaced it with a segmented control.

### Two geometry findings

**Reference numerals cost 31pt of radius**, and that — not the smaller ring — is what pushed the
core type into the arc. They now exist only while editing, which is the only time you read a value
off the perimeter. Core type is computed from the radius; the binding radius is the **gold arc at
r−22**, not where the ticks end.

**Load ticks moved from 2 kg to 2.5.** A 2 kg tick was a weight you could never load — plates come
in 1.25s and 2.5s. Every tick is now a detent you can actually select.

### `check_geom.js`

The ring-fit bug shipped twice. `claudedocs/design-labs/check_geom.js` is the browser-side check
that catches it, plus body and sheet overflow — paste it as the `browser_evaluate` function body
against a served board. It returns `[]` when clean. This is the replacement for the lost
`check_layout.py` and it should be run on every new board.

---

## 8f. Round eleven — Lab 32, lines only

**User's call: the tape is the control; drop the solid arc and the knob from the perimeter.** The
ring becomes a clock face of lines and the lines carry the value.

Worth recording *why* that is a bigger removal than it looks: **the arc was the proportion
reading** — how far into your range this weight sits. Without it the ticks have to say both where
you are and how far along you are.

| | |
|---|---|
| **F1** | Fill only — lit below the value, dark above. Proportion, no pointer. |
| **F2** | Cursor only — the lines swell into the value over ±6 ticks. Pointer, no proportion. |
| **F3** | **Both.** Recommended — the two do different jobs and neither is a copy of the other, which is the test the arc failed. |
| **F4** | Editing with the tape, ring reduced to lines. |
| **F5** | Perimeter mid-drag, no knob — the swell is the thumb position. |
| **F6** | Keypad, from a long press on any parameter. |

**Length carries the fill, not colour.** The first render used a hue step between lit and unlit
ticks and it was invisible — it had only ever read because the gold arc sat on top saying the same
thing. Lit ticks are now 16/10pt long against 10/5pt, plus the colour step.

### Three inputs, and why the keypad is not just a preference

Tape by default, perimeter for a long throw, keypad on a long press (or a single tap, via a
Settings switch). **None of them may be the only route to a value** — that is the rule the
perimeter broke when it had a knob implying a precision it did not have.

The keypad also fixes something a detent scale genuinely cannot: **2.5 kg steps cannot express
101.25**, which is a real weight on a bar with fractional plates. Typed entry is the only input
that reaches values off the detent.

---

## 8g. Round twelve — Lab 33, the live screen settled

**F3 confirmed. RPE leaves the ring for a 9-cell row; reps stays off the ring too.** Four states,
every decision from Labs 24–32 applied. Nothing on this board is a question.

**The consequence nobody had drawn.** Once the tape is the control and the ring is the readout,
**the ring never needs to re-scale** — it stays the load gauge in all four states. When the ring
was the input it had to become whatever you were editing, which cost the load-in-range reading
every time you touched reps. Now the core reads `LOAD` in every frame, and what you are editing is
said by the selector and the control. This also removes the inconsistency of reps re-shaping the
dial while RPE did not.

| | |
|---|---|
| **G1** | Resting. No numerals, load hero, reps/RPE as chips. |
| **G2** | Editing load — tape, ring 290, numerals on. |
| **G3** | Editing reps — tape re-scaled 1–15, **ring unchanged**, numerals off. |
| **G4** | Editing RPE — 9-cell row, ring 272. |

**The ring yields whatever the active control needs.** The tape wants width (290); the RPE row
wants height (272). At 330 with the row, the between-section gaps measured 10pt against the 21pt
floor the 3× spacing law sets — measured, not guessed.

**Reference numerals mean the perimeter is live.** They appear only while editing load, which is
the only state the perimeter drag applies to.

### The RPE row was cut — all three parameters share the tape

Lab 33 first gave RPE its own nine-cell segmented row (6–10 in halves). **That was wrong on two
counts**, and the user caught it:

- It spent a **third control on the parameter you set least often**, which is the worst place to
  introduce a new pattern.
- A fixed row must fit every value on screen at once. That constraint is what forced the range to
  6–10 and the cells to **38 × 44** — under the 44pt hit-area floor.

**On a tape the range is free.** RPE now runs **1–10 in whole points** on the same control as load
and reps, which costs nothing and picks up warm-up sets — genuinely RPE 3–5, and previously
unrepresentable. Whole points because RIR = 10 − RPE maps cleanly to integers, and half-point
precision on a subjective scale is mostly false precision.

Consequences: G4 is now structurally identical to G3, the ring has **two sizes rather than three**
(330 at rest, 290 with the tape), the hit-area miss is gone, and one component leaves the design
system. The RIR gloss stays in the selector's active cell (`RPE · RIR 2`) so RPE 8 is never bare.

---

## 8h. Round thirteen — Labs 34–37, the remaining sixteen screens

All sixteen undrawn screens, built entirely from **`kit.py`** — §0 turned into primitives, so no
screen re-derives a decision. Four boards of four.

| Board | Screens |
|---|---|
| **34 Planning** | Routines · Routine detail · Programs · Program detail |
| **35 Library and anatomy** | Exercise library · Exercise detail · Custom exercise · Body map |
| **36 Review** | Calendar · Session summary · Session detail · PR timeline |
| **37 Load and settings** | Load/deload · Bodyweight · Readiness · Settings |

### The IA, decided rather than agreed

Nothing had ever said where these screens live, and sixteen do not divide into four tabs by
accident. The split recorded in §0 is what the locked navigation already implies — but it was
**my call, not the user's**, and it is the most reopenable thing on these four boards.

### Three patterns added, both directions of one rule changed

Added, all forced by screens the live session never had to be: **field** (label over value, no
box), **chip** (filters and multi-select, one component), **zone bar** (a value against
thresholds). All three are in `kit.py`.

**Relaxed:** a read-only table row is 34pt, not 44 — the hit-area floor is for targets, and
applying it to a set log adds 50pt of air for nothing.

**Tightened:** the rail is explicitly *not* for the calendar. A month is a shape, not a sequence;
straightening it into a line loses the gaps and streaks that are the only reason to look.

### Four things that went wrong and what fixed them

- **Body map, first pass:** red at varying alpha made every muscle read as red — a fresh chest at
  0.26 alpha is still red on a dark ground. The ramp now interpolates from `--off`, so fresh
  muscles are genuinely neutral.
- **Body map, second pass:** arms overlapped the chest. Plates are now on an explicit grid with a
  2pt gap between neighbours, which is also what stops it reading as a doll. **Still the least
  resolved drawing in the set.**
- **Zone bar:** the marker was tinted to the verdict colour and vanished inside its own band. The
  marker is now always near-white; the number carries the verdict.
- **`.upper()` on a string containing an HTML entity** turns `&middot;` into `&MIDDOT;`, which
  renders as literal text. Write caps literally.

### Density, again

Six of the sixteen screens under-filled on the first build — one by 257pt. Density remains the
recurring failure mode of this project, and the check that catches it is measuring the **last
child's bottom against the scroll box**, not `scrollHeight` (which equals `clientHeight` when a
flex column under-fills, so it reports nothing).

---

## 8i. Round fourteen — the critique of Labs 34–37

**The most important feedback in this document since the legibility rule.** It reverses a decision
locked since Lab 27 and it is not a taste note — it is the user looking at sixteen finished screens
and finding them unreadable at a glance.

### What was said

1. **Four numbers in one row is too dense.** It is not immediately distinguishable what each number
   means, and the plain style gives no help. Suggested directions: a maximum of **two columns per
   row**; **cards or another containment pattern**; or **render numbers graphically**.
2. **The Lab 35 B2 column chart has no axis legend** — not obvious what it represents. The Lab 37
   D2 bodyweight line chart *is* liked (fill, dashed mean, baseline, three labels).
3. **Too much text overall.** The average user will not stop for more than a couple of seconds to
   decode a screen. Numbers should be carried by *visual aids*, not by text describing them.
4. **Spacing alone does not distinguish sections.** Especially with heavy text. The screens read
   *too plain*.
5. **The calendar is too plain** and the colour-on-text combination is disliked.
6. **The body map is disliked** — deferred to implementation, not urgent.
7. **The exercise detail screen should carry real content**: an image, a description, muscles
   trained, useful statistics, and instructions or recommendations for performing the lift.

### Why this matters more than it looks

The editorial no-rules style is load-bearing for **every screen except the live session** — and the
live session is exactly the screen the critique does not hit, because it is one large instrument
rather than stacked text. That is the tell: **spacing-only worked on the one screen that had almost
no text to separate, and failed on the sixteen that do.** It was validated on the wrong sample.

### The tension to resolve, not paper over

The user has previously and firmly rejected: cards (round four, "too much glass in a single
screen"), and anything requiring decoding (round three, the legibility rule — the hardest
constraint in this document). They have also asked for density and rejected minimalism twice. So
the answer is not "add cards everywhere" and not "remove information". It has to be **containment
that is quieter than a card and louder than nothing**, plus **graphics that replace text rather
than adding to it**.

⚠️ **One direct conflict to settle:** the identity has excluded **photography** since the first
round, but an exercise image is now wanted. Line art, silhouettes or anatomical diagrams are the
reading that keeps both — a demonstration figure is *content*, not decoration. Confirm before
building.

---

## 8j. Round fourteen, answered — Labs 38 and 39

Four parallel Sonnet agents. The findings mattered more than usual, so they are recorded rather
than summarised away.

### Containment (Lab 38, P1–P4)

**Every reference that solves this stacks two signals — a tonal lift AND a gap. None uses spacing
alone.** Apple's insetGrouped: `#000000` canvas → `#1C1C1E` section surface (an ~11% lightness
step), 10pt radius, ~35pt between sections. Linear — near-black, no cards, heavy text, the closest
precedent that exists — states it directly: *the dark canvas is the whitespace; sections separate
by lifting onto a surface, not by gaps.* IBM Carbon lightens per layer because shadows do not read
on dark.

- Floor to register a surface on OLED: **~4–6% lightness delta**; **8–11%** to read confidently
  through auto-dim and daylight. Our `#15130f` is ~7% (P2, marginal); `#221f19` is ~11% and closest
  to Apple's own number (P3, recommended).
- **Use a flat opaque hex, not a white overlay.** A translucent wash on near-black starts reading
  as cheap frosted glass, and glass is reserved for the tab bar.
- **The section label stays outside the plate.** That is what stops a plate reading as a card.
- Hairlines: translucent and low-contrast only, and only as *section* boundaries. Repeated
  full-bleed rules down a text-heavy screen read as a spreadsheet grid (P4).
- Left-edge spines: good for one or two callouts, bad as the default — they mark a start edge and
  never tell the eye where a block ends.

### Stat density (Lab 38, N1–N4)

- Tile order is **label → number → micro-visual → delta**, with the number ~2× the label.
- **Four per row only works when each tile can also carry a micro-visual** (~200–280pt each), which
  on a phone forces two. Four bare numerals is the one configuration with neither room nor a
  pre-attentive cue.
- **Deltas are the best-evidenced and cheapest win.** Arrow direction and colour are both
  pre-attentive. Folding `VS LAST` into the number it describes removes a tile *and* adds meaning.
- **Bullet graphs are out** — their own proponents say audiences must be taught to read them, which
  is the round-three legibility rule. Lab 37 D1's volume bars survive only because every one is
  labelled TOO FEW / GOOD / HARD / TOO MUCH.
- **Rings are out for most stats.** Apple's rule is that a ring shows progress toward a goal and
  must not decorate. Sets, volume and counts have no ceiling — a ring there is a proportion of
  nothing. Meters and sparks are earned only where a denominator or a real series exists.
- Strong and Hevy both keep the post-session recap as numbers plus small comparisons and push
  sparklines to a separate stats screen. Recap answers *how did that go*; stats answers *how is it
  going*.

### Charts (Lab 39)

**The chart type was not the problem.** Columns are correct for ten discrete sessions — a 1RM only
exists *at* a session, and a line would imply a rate of change across the gap. What was missing:

- y minimum and maximum **anchored to the chart**, replacing the floating "RANGE 112–130" caption
- first and last x labels
- the latest column in the accent, the other nine de-emphasised, its value printed above it
- a title that states the takeaway, not the field name

All of it fits inside the space the chart already occupied. **The rule I had broken: text never
wears the series colour.** The old caption was gold, the same gold as the bars — a legibility
problem and a 4.5:1 contrast risk, which is the same failure as the calendar.

Apple's own distinction is worth keeping: a bare unlabelled chart is only acceptable as a
*preview of a labelled one one tap away*. If it is the only view, it needs the labels.

### Exercise screen (Lab 39 Q1)

**The imagery conflict resolves.** Photography stays out; a demonstration is content, not
decoration. The Everkinetic-derived **workout-guide** package is SVG line art, 302 exercises, three
consistent frames each, CC BY-SA 4.0, free with attribution — the only free source that fits the
identity. Everything photographic (free-exercise-db, wger bulk images) is out on the same grounds
it always was; ExRx and MuscleWiki are paid. Three frames is exactly a start-mid-end loop, and an
animation meta-analysis found a medium advantage over static images for *procedural* learning.

**Order is the finding.** Strong, Hevy, Fitbod, JEFIT, Boostcamp and Caliber all put demonstration
and instruction *above* statistics. The old screen opened with four numbers, which answers a
question you only have once you already know the lift.

Also: prime movers vs assisting muscles as a real distinction with a written key; 3 short cues plus
a separate common-mistakes list (health-messaging research says 1–3 sentences, not paragraphs); and
**frequency** is the most valuable statistic that was missing.

### Still open

The **body map** is disliked and deferred to implementation by the user's own call. **Time under
tension** is the one worthwhile statistic that would need a new data input (tempo logging) rather
than a new view.

---

## 8k. Round fifteen — P3 wins, and is boring

**Settled:** containment is **P3** (flat `#221f19` plate, label outside). Stat density is **N3**
(two per row, comparison attached to its number), with **N4's rule layered on**: a visual only
where it genuinely speeds understanding and only where there is something real to draw — plus the
Strong/Hevy split, recap gets numbers, stats screens get charts.

**Open:** P3 is boring. Lab 40 puts P4's lines back *inside* the plate, where they organise rather
than partition. M1 inset separators · M2 lit edge · M3 + ruled label · M4 all three. My read is
**M4**, with **M1** as the fallback if it is a step too far.

**M2 is worth noting on its own**: a 0.5px lit top edge is the *lit taupe panel* from the original
reference imagery, and it had been missing since the editorial rule removed every edge. It is the
difference between "a lighter rectangle" and "a material".

### The rail did not disappear — it fell off the bottom

Two real findings from that one observation:

- **A plate costs ~30pt of height per section.** Three sections push ~90pt below the fold, which
  was exactly enough to take the rail with it. Containment is worth the price but it *is* a price,
  and every screen restyled from Labs 34–37 will lose about that much above the fold.
- **A hairline's contrast is relative to its surface.** The rail's connecting line was 11% white,
  tuned against the near-black canvas; on a lifted plate it washes out. It now takes 20% on a
  plate. This is systemic — every hairline token needs both values.

### Calendar research (Lab 39 Q2)

Three bugs in the first version, all named by precedent:

- **Rest and missed looked identical** — both a faint plate. Duolingo gives a freeze its own icon
  precisely because one is a decision and the other is a lapse; collapsing them makes the streak
  meaningless. Missed now carries a ring under the number (Whoop's dot-under-number pattern, which
  is the only secondary-dimension encoding that survives a single-accent palette).
- **Adjacent-month days were omitted**, which reads as a bug. Every polished calendar dims them.
- **Three steps is the ceiling.** Past four, adjacent alpha values stop being distinguishable at
  this cell size. GitHub stops at four and makes step zero a *neutral*, not a low alpha of the same
  hue.

Also confirmed: today (ring) and has-data (fill) must stay orthogonal channels — Apple's
`UICalendarView` enforces this structurally by making decoration a separate object from selection.
And the month summary belongs in one line of text, not a second chart competing with the grid.

### The exercise art

The hand-drawn stick figures were clumsy and are replaced with **honest asset placeholders**.
Drawing bad art to stand in for good art misrepresents the design; the only thing the board needed
to decide was how much room the demonstration gets and where it sits.

---

## 8l. Round sixteen — M4, and what gets a plate

**M4 chosen** and made the default in `kit.py`. `psec()` now emits the lit plate, the ruled label
and inset separators; there is nothing to re-derive.

**The rail question generalised into the rule this whole restyle was missing:**

> **A plate contains things that have no boundary of their own.**

A list of rows has none — which is precisely why spacing alone failed on it. A rail has a spine, a
chart has a baseline and axes, an instrument has its own geometry. Wrapping those in a plate is
containment twice, and the louder of the two wins. Plating the rail also crops the open air the
pattern was built around down to 15pt of padding.

This is also what retrospectively justifies M3's ruled label: it stopped being decoration the
moment anything needed to read as a section *without* a plate under it.

**Carried forward, unresolved:** the calendar. By the rule it should sit on the canvas, but its
three intensity fills were mixed against `#221f19`. Moving it changes what they composite over and
the whole ramp needs recomputing against `#0a0908` — including the ink-flip threshold. Do the
arithmetic or leave it plated; do not just delete the plate.


---

## 8m. Round seventeen — the restyle, done

All sixteen screens on Labs 34–37 are now on M4. Nothing in §0 was reopened; this was applying it.

### What the pass actually was

`K.sec` → `K.psec` per section, four-up stat rows → `K.tiles` two-up, bare charts → `K.chart`,
and every rail, chart and figure moved off its plate. Where it changed a *decision* rather than a
treatment, it is listed below.

### Three things were deduplicated rather than restyled

- **The exercise detail screen** existed twice: Lab 35 B2 (old, four numbers on top) and Lab 39 Q1
  (rebuilt after round fourteen, demonstration first). Lab 35 now imports Q1. Q1 gained the two
  sections B2 had that it lacked — a **rep-max table** (34pt read-only rows) and the
  **progression sentence**.
- **The calendar** existed twice for the same reason: Lab 36 C1 (old) and Lab 39 Q2 (rebuilt with
  rest-vs-missed, dimmed adjacent days, three steps). Lab 36 now imports Q2.
- **`labelled_columns`** existed in Labs 39 and 41. It is now `kit.chart(vals, xfirst, xlast,
  value=, active=)` and is the only column chart in the system.

### Two bugs found on the way

- **M4 was never actually rendering except on Lab 40.** `panel()` and `psec()` emit `class="lit"`
  and `class="ins"`, but those two rules lived in `lab40.py`'s `EXTRA`, so Labs 38, 39 and 41 drew
  plates with no lit edge and no inset separators. The CSS is now in `kit.CSS` where the functions
  that depend on it live. *A primitive whose styling lives in one caller is not a primitive.*
- **`check_geom.js` could not see the fold.** It checked `scrollHeight`, which equals
  `clientHeight` on an under-filling flex column and therefore reported nothing — the exact failure
  round thirteen described. It now measures the **last child's bottom against the scroll box** and
  reports both directions.

### The fold, measured

Content running past the bottom of the frame is correct — it is what says the screen scrolls, and
the pre-restyle boards did it by up to 106pt. The failure is a *section that starts below the
fold*. After trimming, no screen has one except the exercise detail screen, which is 1364pt of
content in an 806pt frame by design; Lab 35 shows it twice, the second scrolled 1180pt, so its
tail is reviewable. `kit.phone(scroll=N)` is that one-line addition.

### What was cut to pay the ~30pt-per-section price

Six cuts, each either a duplicate of something on another screen or the fourth item in a list of
four: a template row and a standalone routine (A1), one lift (A2), **per-muscle volume off the
session recap** (C2 — a recap answers *how did that go*, a stats screen answers *how is it going*),
**the six-week volume chart off Load** (D1 — the calendar already carries it), and the one-switch
INPUT section folded into TRAINING (D4).

### Two rulings the pass had to make

- **Stat tiles keep their own cells inside a plated section**, as Labs 39 and 41 already shipped
  them: the tile is a darker well on a lifted plate, not a plate on a plate.
- **The readiness caveat is the one prose block left off a plate** (D3). It is a footnote about the
  answer above it; the same surface would give it the same weight.

### Still open, for the review

The **calendar's plate** (its gold fills were mixed against `#221f19`; moving it to the canvas
means recomputing the ramp and the ink-flip threshold), the **body map**, and the **IA**, which was
decided rather than agreed.


---

## 8n. Round eighteen — the plate is emphasis, and Lab 42

Two notes on the restyle, both the same correction: **I was using the plate as a container when it
is a highlight.**

### Applied immediately

**Prose is never plated.** The exercise description, how-to, common mistakes, the deload call, the
readiness verdict and the session note are all plain text under their ruled label now (Labs 35, 36,
37, 39). A paragraph is not a component; putting it on the same lifted surface as the instruments
claims it is one, and a screen where everything is raised has raised nothing.

This changes §0's plating rule from *what has no boundary* to *what deserves emphasis* — rule (a)
still says what **can** take a plate, rule (b) now says how many things **should**.

### Open — Lab 42

The other half of the note is that a list might want **one plate per row** rather than one plate
with inset separators. Seven columns, all built by importing the real rows from Labs 34, 35 and 37
so nothing is a redrawn approximation:

| | |
|---|---|
| P1 / P2 | The same routines screen, grouped plate vs row plates |
| P3 | Settings — rows that are *controls*, where row plates should be strongest |
| P4 | The library — a dense list, where they are most likely to read as stripes |
| P5 | The mixed prescription: plated hero, row plates for the list, prose plain |
| P6 / P7 | The set log as a **rail** vs with no containment at all |

Measured: row plates cost about **7pt per row** and delete every hairline. My read is the split —
row plates where each row is a control, grouped plates where the rows are one record (a set log, a
rep-max table, a PR list) — but this is a look-at-it decision, not an argument.

### The set log

Your instinct is right and it is the pattern's own definition: the rail was reserved for *anything
chronological*, and five sets of a squat are as chronological as five sessions — only the scale
differs. At set scale it runs **12pt of air instead of 56**, dots on the tick ramp, the top set in
the accent, which also gives the log a reading the plate version could not carry. Below ~12pt the
connecting segment is too short to see and the pattern collapses into a column of dots.

P7 is the control worth taking seriously: a table of mono figures is self-aligning, so it is
possible nothing was needed there and the rail is decoration with a good excuse. P6 and P7 differ
in exactly one thing — same rows, same spacing, gutter removed.


---

## 8o. Round nineteen — P5 and P7, applied

**Chosen:** P5 (row plates, one plated hero, prose plain) and P7 (the set log takes no containment
at all). Both are applied across Labs 34–37 and 39 and uploaded; `kit.prow()` / `kit.prows()` are
the row plate, promoted out of Lab 42.

### The three levels, and how to tell which one applies

| Level | Test | Where |
|---|---|---|
| **Row plate** | *You touch this row.* | Routines, library, exercises in a routine, schedule days, settings rows, fields, toggles, the readiness scales, months |
| **One grouped plate** | *This is the screen's main component.* | Summary tiles, calendar grid, program day strip, exercise demonstration |
| **Nothing** | *It already has structure, or it is words.* | Set log, rep maxes, relative strength, zone bars, what-you-lifted, every chart, every rail, all prose |

The read-only test is the useful one, and it is what P7 settles: **a table of mono figures is
self-aligning, so the columns are the structure.** The plate was a box around something that
already had one, and the rail — tried in Lab 42 P6 — turned out to be decoration with a good
excuse. Two containment devices were removed from the set log, not swapped.

### What it cost

Row plates run ~7pt a row against a grouped plate, but the sections lost their 13pt of plate
padding, so it is close to a wash: every screen still fits, no section starts below the fold, and
one library row was added back because the screen had room again.

### Lab 41 is left as it was

It argues the grouped plate, and rewriting the board would erase the argument that produced the
rule. Read it as reasoning, not as state — §0 is the state.

---

## 8p. Implementation — the order

Design has no open work that is not waiting on hardware or on the user's eye, so this is next.

1. **Tokens first**, straight out of `kit.py`: palette V2, the text and tick ramps, the spacing law
   (46 / 11 / 56), radii, the three containment levels. Through `expo:expo-design-system`.
2. **Fonts**: Geist + Geist Mono self-hosted via `expo-font` — there is no `@expo-google-fonts`
   package for Geist.
3. **The primitives**, in the order the screens need them: `psec` (ruled label), `prow`, `lrow`,
   `tiles`, `delta` / `meter` / `spark`, `chart`, `rail`, `chip`, `field`, `toggle`, `actionbar`.
   Each maps one-to-one onto a component; `kit.py` is the spec.
4. **Navigation**: W2 on `expo-router/ui` — `NativeTabs` cannot make the inset centre button. The
   live session is a **separate route outside the tab group**, not a hidden tab bar.
5. **The live screen** (Lab 33), because it is the one with real interaction: gestures, the tape,
   the ring, haptics. Everything else is layout by comparison.
6. **The other sixteen**, Lab 34 → 37 order.

Never port the mockup HTML. Skia for anything custom-drawn; no chart library that is not Skia.


---

## 8q. Round twenty — Lab 43, and the start of the build

The implementation plan is agreed: **Android first** (there is no iOS device), **core loop first**
(library → routines → live session → summary → history), **e1RM and PR detection only** among the
computed features, everything else deferred. Lab 43 was the one design prerequisite.

### Today

Never drawn in this style — it only ever existed in the champagne file and Lab 03, and it is the
screen seen most. Settled: **one plated hero and two confirmations.** The hero answers *what am I
doing today* and is the only part that changes between v1 and later; the week block and the rail
are the same component in both.

**A section was cut for the right reason.** A fourth section of new records fell below the fold, and
the fix was not to make room: the rail already carries a PR pill on the session that set one, so it
was saying the same thing twice. When something falls off the bottom, check whether it duplicates
something above it before trimming elsewhere. The full timeline stays on Strength (Lab 36 C4), which
is where you go to *read* records rather than to be told there is one.

**The week strip takes dots, not routine names.** Seven names at 11px across 356pt is the densest
text on the screen and the least useful — you already know your own program.

### The empty state

Drawn, because it is what a fresh install opens on and it is the screen most apps get wrong. Two
rules, now general: **a component that will fill in stays visible and dim rather than hidden** (so
the layout a new user learns is the layout they keep), and **the empty state is a set of actions,
not an apology**. No illustration — the identity has never carried one.

### The chrome, on Android

`expo-glass-effect` is iOS 26 only and silently renders a plain view everywhere else, so the tab
bar's glass plane needed an answer rather than an accident. **N2 chosen: the raised plate**
(`#221f19`) with the same M4 lit edge as every other plate and a heavier drop shadow doing the
separating that blur did. It reads as part of the system rather than as a special case; N3 (the
darker panel) sits so close to the ground that the fade above it has nothing to resolve against.
`kit.nav(active, surface)` now carries the switch.

The difference on the screen itself turned out to be small: the bar was already 92% opaque and the
fade was doing most of the work. What is lost is the saturation lift where the bloom passes behind
the bar.

---

## 9. Known defects in Lab 03

Surfaced while building Lab 04; not yet fixed:

- **Today** overflows its 860px frame — the PR ticker is clipped behind the tab bar.
- **Live session** has ~150px of dead space between the rest ring and the action bar.

Both are layout, not palette, so Lab 04 reproduces them faithfully. Fix when Lab 03 is scaled to the full 19 screens.

---

## 10. Tooling

**All generators now live in the repo at `claudedocs/design-labs/`** — they used to be scratchpad-only and would not have survived a session. See the README there for how to regenerate, which labs import which, and the two traps that have already cost time (Python `%` formatting against CSS percentages; the 256 KiB read cap).

The `.dc.html` files in the design project are build output. **Edit the generator, never the HTML.**

`check_layout.py` from §5 is still **lost**, but `check_geom.js` now covers what it was for: it
measures every screen's last child against the scroll box, so under-fill *and* content pushed off
the bottom both show up. Run it on every board — `gate.py` cannot see either.

Boards are viewed with `python3 -m http.server` plus a headless screenshot — `file://` is blocked by the browser tooling.

---

## 11. Working agreements

- The user prefers subagents on cheaper models (Sonnet) for research; reserve the main model for design work. Four parallel research agents worked well.
- Show, don't describe: when offering style options, **build visual samples** rather than asking the user to choose from prose. They asked for this explicitly.
- Density is the recurring failure mode. When in doubt, add information rather than remove it — the champagne file is the floor, not the ceiling.
- State findings honestly, including contrast numbers and what was traded away.

---

## 8r. Round twenty-one — the card with a face, and the build's first gate

**The note on Lab 43:** Today is monotone, and the champagne file's high-contrast card had presence
this one does not. Lab 44 answers it. The move is not new — the tab bar's start button is already an
accent fill with ink glyphs — it is that, at card size, on the one element that earns it.

Four columns: U1 the control, U2 the card alone, U3 the card plus a week block (ring against the
weekly session target, volume with its comparison, the week as columns), U4 the quieter version
where the plate stays and only the action is filled. **Open for the user's pick.**

Three rules that come with an accent fill, and are now part of §0 if U2/U3 lands:

- **The hue inverts on it.** Done-green and live-red are both under 3:1 against `#e4c68c`, so state
  inside the card is ink plus position, never a second colour. That is why the card carries no PR
  pill.
- **Only one fill at card size per screen.** The tab bar's button is the exception that proves it:
  at 52pt it reads as the same family rather than as competition.
- **A fill spends the whole attention budget.** Plate count drops with it — U3 is the card, one
  plate and a rail, and that is the ceiling.
- The **ring is allowed only because a weekly session target is a real denominator**. Asked to show
  volume, sets or tonnage it goes back to being decoration and §0 kills it.

### The build, first gate passed

Phase 1 ran on a real device (Nothing Phone, Android 15, gesture navigation — which is the
configuration the live-screen swipe question needs). Three things that fail silently were checked
rather than assumed:

- **Geist renders on Android at all seven faces**, weights distinct, Geist Mono tabular. The
  config-plugin family mapping is correct; PostScript names were read out of the files' name tables
  rather than guessed.
- **`boxShadow: inset` works on RN 0.86 / New Architecture Android**, so the M4 lit edge is real on
  the plate and the row plate. This was the fallback-needed risk; no fallback needed.
- The em-to-point letter-spacing conversion reads correctly on hardware.

Local blockers worth recording: Gradle needs **JDK 21** (the machine defaults to 11) and
**`ANDROID_HOME`** must be set for `expo run:android`.

---

## 8s. Round twenty-two — Today settles, and Android glass is ruled out

### Today, settled

**Lab 45 W3.** The user's pick from Lab 44 was U4 — the quiet raised card with a full-width accent
action rather than a fully filled card — keeping the calendar-style strip. Lab 45 took that and
answered the two things the strip had never had to do.

**Scrolling forces the date onto the cell.** A row of weekday letters stops identifying a day the
moment there is more than one Tuesday in range. M/T/W keeps the rhythm; the number carries the
identity.

**The fill is the graph.** Each cell's mark is a bar as tall as that day's volume, so the strip is
the calendar *and* the thing to look at — one element doing both jobs, rather than a chart section
added to a screen that was already full. It reads as shape first and resolves into a chart on the
second look, which is the right order for something seen daily.

Bounded to **two weeks back** — further is the calendar's job, and a strip that scrolls forever is a
calendar with worse ergonomics. A cut cell at the margin says "more that way", the same affordance
the library chip strip uses. **Rest and future days are not targets**: a dead press is worse than an
obvious non-target.

### Android glass: ruled out, with numbers

The question was whether iOS 26's glass chrome can be replicated on Android at all. It can be, and
it should not be.

- **`expo-blur`'s `blurMethod: 'dimezisBlurView'`** (renamed from `experimentalBlurMethod` in SDK 57)
  wraps Dimezis BlurView, which on API 31+ re-captures the target's RenderNode and applies
  `RenderEffect.createBlurEffect` **every time that node invalidates** — i.e. every frame of a
  scroll. It is not a live framebuffer sample like `UIVisualEffectView`.
- **The cost is continuous and large.** The closest published benchmark (Haze, same technique,
  measured on a Pixel 6) is **+29%** frame duration for a static blurred surface, **+45%** for
  multiple sources, and **+98% for moving content behind the surface** — 6.6ms to 13.1ms. That is
  inside a 60Hz budget and *over* it at 90 or 120Hz, on a flagship, before any mid-range GPU.
  Nobody publishes numbers for the budget Adreno/Mali tier, which is its own answer.
- **Two known breakages in exactly our stack.** `BlurTargetView` cannot cross a `Modal` boundary, so
  bottom-sheet blur is broken unless sheets are rendered in-tree; and there is an unresolved
  Android + expo-router + Reanimated + dimezisBlurView bug causing transparency glitches and
  freezes.
- **Skia cannot substitute.** `BackdropFilter` blurs content drawn earlier *inside the same Canvas*,
  not native views underneath it — confirmed by the maintainers. Snapshot-and-blur is a one-shot
  technique, not a scroll-safe one.
- **Android's own answer is not blur.** Material 3 specifies a flat tonal elevated surface for
  navigation chrome, and Google's system-level blur in Android 16 shipped with a switch to turn it
  off.

**Verdict: the opaque raised plate is not a compromise, it is the platform's design.** What would
reopen it: sheets rendered in-tree, a validated Reanimated-compatible library, and a backdrop with
genuinely dynamic high-contrast content — none of which is true here, since the ground is near-black
with already-soft blooms behind it.
