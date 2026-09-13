# Build log — where the implementation is

Companion to `design-exploration.md`, which holds the design state. **This file holds the build
state.** A new session should read `AGENTS.md`, then §0 of `design-exploration.md`, then this.

Last updated 2026-09-12, Phase 7 item 1 replanned through a four-voice review that found two
live bugs in shipped code and one trap that would have shipped a third.

---

## The plan

`~/.claude/plans/start-by-making-a-rippling-fog.md` — approved, and still accurate. Phases, stack
rationale, data model, risks, and the verification checklist live there. The corrections applied
after the architecture review are appended at the end of it.

**Decisions that shape everything:** Android first (no iOS device to verify against), core loop
first (library → routines → live session → summary → history), e1RM and PR detection as the only
computed features in v1.

---

## Done

| Phase | State |
|---|---|
| **0 — Today's design** | Labs 43, 44, 45 built and uploaded. Today settled at **Lab 45 W3**. |
| **1 — Foundation** | Scaffold stripped, deps installed, build config written, Geist vendored, tokens and type ramp written. **Verified on device.** |
| **2 — The design system** | `kit.py` translated into `src/components/`. **Verified on device against Lab 34 A1.** |
| **3 — Data and maths** | `src/lib/**` (23 tests, green) and the drizzle schema; migrations generated and **verified running on device**. |
| **4 — The navigation shell** | Headless `expo-router/ui` tabs behind the W2 bar. **Verified on device**: tabs switch, a push loses the bar, live takes over, back returns to Today. |
| **5 — The real screens** | **Done.** Mutations, routine detail and the custom-exercise form are on the device and writing. |
| **5b — Supabase** | **Schema, RLS and the auth flow done.** Sync itself is Phase 8. |
| **6 — The live session** | **Done bar reordering.** Gate, data layer, core loop, both sheets and the keypad all run on the device. |
| **6b — Routines you can make** | **Done.** Creation, editing, the library as a picker, and START actually starting a session. |
| **7 — Closing the loop** | **The summary (C2) is done and verified on the device.** History, session detail, settings and export are not. |

### What Phase 5 settled

Everything in Phase 5 is on the device and verified there, not by type-check.

**`src/data/mutations/`** exists and is the only thing that writes. `createCustomExercise` and
`addExerciseToRoutine` / `updateRoutineExercise` / `removeRoutineExercise` are transactional because
they touch two tables each — the exercise plus its muscle links, the routine line plus the routine's
`updatedAt`. Foreign keys are on and `exercise_muscles` has a composite primary key, so a partial
insert is a real failure mode rather than a hypothetical one. `removeRoutineExercise` is a **hard
delete**: a routine line is a plan, and what was actually done lives in `session_exercises`, which
snapshots at session start and never points back.

**Routine detail** (`app/routine/[id].tsx`, Lab 34 A2) and **the custom-exercise form**
(`app/exercise/new.tsx`, Lab 35 B3) are built and screenshotted. `app/exercise/[id].tsx` was opened
for the first time and renders — description prose, the muscles plate with prime and assist, and the
empty YOUR NUMBERS sentence.

**The tab-bar bottom inset is confirmed on the device**: with the library filtered to CABLE and
flung to its end, the last row clears the bar by ~143dp, which is `space.between + useTabBarHeight()`.
The same hole existed on every screen carrying an `ActionBar` — content scrolled under it with no
padding — so `useActionBarHeight()` now mirrors `useTabBarHeight()` and the three ActionBar screens
pass it to `Screen`.

**Two departures from Lab 35 B3, both because the board drew a column that does not exist.** Its
"count toward leg volume" and "warm-up ramp" toggles have no home in `schema.ts`, so they are gone
rather than faked — a persisted-looking switch that writes nowhere is worse than an absent one. And
a TYPE field was added, because `kind` is NOT NULL and drives the default rest. The board's three
fields open pickers; those pickers are chip rows that expand **inside the field's own row plate**,
which keeps the whole form in the existing vocabulary rather than introducing a sheet.

**Routine creation has no screen yet** — it is Phase 6's. Until then `/dev/db` carries a "make a
demo routine" action that calls the real mutations, which is also the only exercise the transaction
path gets before the live session starts writing.

**A `StatTiles` bug that only a board comparison finds.** kit's `tiles(tone=...)` names *the surface
the tiles sit on* and fills each tile with the other colour. Ours always filled `raised`, so on
Lab 34 A2's raised plate the four tiles were exactly the plate colour and the block read as one card
with four numbers in it. The prop is now `surface`, and it inverts.

### The seeded library

**302 exercises, every one of them illustrated.** `drizzle/0001_seed_exercises.sql` and
`src/data/exercise-art.ts` are both generated by `scripts/build-seed.mjs` from
**`@bryllim/workout-guide`**, whose 302 exercises each ship three 512x512 PNG frames of the
movement.

**Why the library shrank from 1295 to 302.** The old spine was hasaneyldrm/exercises-dataset, whose
own media is (c) Gym visual and licensed per use, so the app shipped no pictures at all. Matching
workout-guide's art onto those 1295 rows put a picture on **7%** of them, because the two name
things differently ("Bench Press" against "Barbell Bench Press", of which that dataset has 32
variants). Seeding *from* the illustrated set instead puts one on all of them. The 993 rows lost are
mostly variants, stretches and camera-angle duplicates ("Barbell Full Squat (Side Pov)").

**What was traded away, and it is real.** workout-guide is an illustration library, not an exercise
database — its manifest has name, equipment, primary and secondary muscles, exercise type and the
frames, and **no instructional text anywhere**, on the site or in the package. Description and cues
are matched in from the two MIT *text* sources (exercises-dataset first, free-exercise-db second),
which lands **116 of 302 with cues (38%) and 94 with prose**. So the ragged edge moved from the
library list to the exercise screen. Matching is deliberately strict — a candidate is only accepted
when the extra words it carries cannot change which movement it is — because a wrong HOW TO on a
lift is worse than no HOW TO. Loosening it would raise the number and lower the trust.

**The art is not vendored.** 906 PNGs is 42 MB, and git keeps binaries forever, so the require map
points into `node_modules` through the package's `./assets/*` export. `pnpm install` is what fetches them.

**Licences, three of them, and they are not the same one:**

- **`@bryllim/workout-guide`** — code and manifest MIT, **artwork CC BY-SA 4.0**. The files are used
  exactly as published, so they are not *Adapted Material* and ShareAlike never reaches this app's
  own source. That is conditional on leaving them alone: **tint at render time, never resize,
  recolour or re-encode.** `ListRow` tints to `color.mid` and the demo block to `color.hi`. CC BY-SA
  wants credit wherever the work is distributed, and the app is where this app distributes it — the
  exercise screen carries `ILLUSTRATION BY BRYL LIM · CC BY-SA 4.0`.
- **hasaneyldrm/exercises-dataset** — the *data* is MIT and supplies description and cues. Its
  `images/` and `videos/` are (c) Gym visual; the script reads no media field from it.
- **yuhonas/free-exercise-db** — data is MIT and fills instruction gaps. **Do not use its images**:
  the maintainer disclaims knowing their origin and upstream admits scraping.

`kind` is still a judgement, not a fact: free-exercise-db's real `mechanic` is used for the rows that
match, and the rest fall back to the single-joint split on the prime mover. That heuristic gets some
wrong — an assisted chin-up whose primary muscle is Biceps comes out `isolation` — and it only
matters because it drives default rest and whether e1RM means anything.

Verified on device after a database wipe: the library header reads **302**, every row draws its
illustration, and the exercise screen loops the three frames.

### What is on the device right now

A dev build of `com.zcylla.jymiq` on a Nothing Phone (Android 15, API 35, gesture
navigation, 411 × 914 dp). It shows a placeholder Today screen with links to four dev screens:

- `/dev/fonts` — the type-ramp proof sheet. **This is Phase 1's gate**, and it passed: all seven
  Geist faces render with distinct weights, Geist Mono is tabular, and both containment levels show
  the M4 lit edge.
- `/dev/db` — row counts per table, proving migrations ran.
- `/dev/kitchen-sink` — every primitive in every state. **This is Phase 2's gate.**
- `/dev/lab34-a1` — the routines screen rebuilt from the primitives alone, for board comparison.

The four tabs are placeholders apart from Today's dev links. `/library` is a stub whose only job is
to prove a pushed route loses the bar; `/live` is a stub proving the takeover.

### Three risks closed by that build, not by argument

1. **Fonts map correctly on Android.** The `expo-font` config plugin's family + weight syntax works;
   PostScript names for the iOS branch were read out of the files' name tables rather than guessed.
2. **`boxShadow: inset` works on RN 0.86 / New Architecture Android.** The M4 lit edge is real, so
   no fallback of stacked hairline Views is needed.
3. **Drizzle's migration bundling works end to end** — `babel-plugin-inline-import` → Metro
   `sourceExts` → the generated journal → `useMigrations` gate. This was the chain with three silent
   failure modes.

---

## How to run it

The machine has the Android SDK, `adb`, Gradle and two JDKs, but **two environment facts break the
build if missed**:

```bash
# Gradle needs 21; the machine defaults to 11.
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk
export ANDROID_HOME=$HOME/Android/Sdk

pnpm expo run:android         # first run does a prebuild + full Gradle build (~6 min)
pnpm expo start --dev-client  # then just Metro
adb reverse tcp:8081 tcp:8081 # phone talks to Metro over USB, no WiFi needed
```

There is **no emulator package installed and no AVD** — a physical device over USB is the only path
today. `android/` is generated by prebuild and gitignored.

### Starting on a machine that has never built this

```bash
pnpm install                  # also fetches @bryllim/workout-guide's 36 MB of illustrations
cp .env.example .env          # then fill in the two EXPO_PUBLIC_SUPABASE_* values
pnpm expo run:android         # prebuild + Gradle, ~6 min
```

**The repo is on pnpm — it is pinned by `packageManager`, and two of pnpm's defaults break the
native build.** Both are handled by files
that are committed, so a fresh clone is fine — but if `node_modules` is ever installed with npm or
yarn, these are the failures to recognise:

- **`.npmrc` sets `node-linker=hoisted`, and it is load-bearing.** Skia resolves the project's
  `node_modules` by walking up from its own package directory; under pnpm's default isolated layout
  that lands in `.pnpm/@shopify+react-native-skia@…/node_modules` instead of the repo root, so
  CMake is handed a `PrebuiltDir` with an unexpanded `react-native-0*` glob in it and the build dies
  in `configureCMakeDebug`. `react-native-worklets` fails the same way one step earlier, with
  Gradle refusing a `projectDirectory` that does not exist.
- **`onlyBuiltDependencies` in `pnpm-workspace.yaml` is what lets Skia install its binaries.**
  pnpm 10 moved its settings out of `package.json`'s `pnpm` field and warns — quietly, in a line
  that scrolls past — that the old key is *ignored*. It sat ignored here for two days, which meant a
  fresh clone would have hit the Skia CMake failure below despite the trap being "fixed". pnpm 10
  blocks lifecycle scripts by default; Skia's `postinstall` is what copies `libskia.a` into
  `libs/android/`, and without it CMake fails with *"Skia prebuilt binaries not found"*. The
  allowlist covers `@shopify/react-native-skia`, `esbuild`, `lefthook` and `unrs-resolver`.
  Note `pnpm install` will not re-run a blocked script for an already-installed package — that
  needs `pnpm rebuild <pkg>`.

**`android/` must be regenerated after any change to how `node_modules` is laid out.** Prebuild
bakes absolute dependency paths into `settings.gradle`, so switching package manager or linker
leaves a tree full of stale `.pnpm/…` paths that Gradle reports as missing project directories.
`pnpm expo prebuild --platform android --clean` is the fix; `android/` is gitignored, so nothing is
lost.

`.env` is gitignored and holds `EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (the
publishable key, never `service_role`). Without it the app still runs — `supabase` is null and the
account screen says sync is not configured — so this only blocks sign-in.

**A phone that ran an older build must have its database wiped**, because the seed changed from 1295
rows to 302 and drizzle has already recorded migration 0001 as applied:

```bash
adb shell am force-stop com.zcylla.jymiq
adb shell run-as com.zcylla.jymiq rm -f files/SQLite/workout.db
adb shell run-as com.zcylla.jymiq rm -f files/SQLite/workout.db-shm
adb shell run-as com.zcylla.jymiq rm -f files/SQLite/workout.db-wal
pnpm expo start --dev-client -c
```

The `-shm` and `-wal` files must go too: leaving the WAL behind leaves the old tables. And `-c` is
not optional after a seed change — see the inline-import trap below.

Everyday checks:

```bash
pnpm check        # format && tsc --noEmit && expo lint && icon style check && node --test
pnpm db:gen       # regenerate migrations after editing src/data/schema.ts
```

---

## What Phase 2 settled

`src/components/` holds eleven primitives, each a port of a named `kit.py` function: `Screen`,
`ScreenHeader`, `Section`, `Plate`, `RowPlate`/`RowPlates`, `ListRow`, `StatTiles`, `Delta`,
`Meter`, `Pill`, `Icon`. Measured on the device against the Lab 34 A1 board: side margin 22.10pt,
row-plate gaps 7.2pt, section gaps 70.2–70.6pt against the board's 71.0, list rows 53.3pt against
53.0. `/dev/lab34-a1` reproduces the board with no style in the screen file.

**Two things that cost a device to find, not a type-check:**

1. **RN Android's default line height is ~8% taller than a browser's.** Geist gets `normal` ≈ 1.286em
   in a browser; RN derives its own from the font's ascent + descent and a 53pt board row measured
   57.1pt. That compounds down a screen and puts the 46/7 spacing law on a moving base. Every ramp
   step laid out in a row now states its `lineHeight` (the `lh()` helper in `type.ts`, next to
   `ls()` — the two are the same class of trap).
2. **`alignSelf` is cross-axis.** `Pill` used `alignSelf:'flex-start'` to stop stretching, which is
   right in a column and pins it to the top of a row. `Meter`'s `width="full"` had the same bug with
   `alignSelf:'stretch'`. In a row parent both do the wrong thing silently. Suspect any `alignSelf`
   in a component that can land in either axis.

**Icons** are hand-drawn (kit's `ICONS`), compiled to a subsetted font at prebuild by
`react-native-nano-icons`, so a glyph is one native text draw rather than a Skia canvas per row.
`scripts/check-icons.mjs` runs in `pnpm check` and fails the build on an off-style or undeclared
icon — see "Icons" in `AGENTS.md`. `gear` and `today` were redrawn: kit's gear was a hub plus
floating ticks and read as a sun, and its clock put an arc so close to the rim that the two blobbed
together.

---

## What Phase 4 settled

`src/app/(tabs)/_layout.tsx` runs the headless navigator; `src/components/tab-bar.tsx` draws it.
Measured against kit's `nav()`: bar margins 16.00pt, bar height 59.81 against 60, start button
52.19 x 51.81 against 52, and 30.10pt of air beneath it. Verified on device: the four tabs switch,
`/library` pushes over the bar and loses it, the start button opens `/live` as a takeover, and
Android back returns to Today (`backBehavior: 'firstRoute'`).

**Three things about `expo-router/ui` that are not guessable** — read
`node_modules/expo-router/build/ui/*` over any blog post, and note the published guide documents a
`reset` prop that does not exist in 57.0.19:

1. **The hidden `TabList` is load-bearing.** `Tabs` walks its children for *literal* `TabTrigger`
   elements inside a *literal* `TabList` — an identity check. Wrapping a declaration trigger in a
   component of ours registers nothing and says nothing. The triggers that *draw* the bar can live
   anywhere under `Tabs`, which is the whole trick.
2. **`style` on `Tabs` replaces rather than merges**, so `flex: 1` has to be restated or the
   navigator collapses. `TabList` merges correctly, which makes the inconsistency easy to miss.
3. **`asChild` goes through a Radix slot that merges style by object spread**, so a `style={[a, b]}`
   array on the child element is silently destroyed. Style the child from inside its own component.

Safe area is entirely ours — neither `Tabs` nor `TabSlot` touches insets. The bar and `TabSlot` are
flex siblings, so content stops above the bar rather than scrolling under it behind kit's fade;
that, and W5's minimise-on-scroll, are still open.

---

### What the session data layer settled

`src/data/queries/sessions.ts` and `src/data/mutations/sessions.ts` exist, and **the whole loop was
run on the device**, not type-checked: `/dev/db` grew a "run a demo session" action that snapshots
the demo routine, logs all fourteen of its planned sets and closes the session.

**The first run named eleven set records and four session records; an identical second run named
none.** That second result is the one worth having — it is the baseline read working. Three details
of it are worth recording because they are the behaviours that are easy to get wrong and hard to
notice:

- **The 40 x 14 exercise set a HEAVIEST but no BEST ESTIMATED 1RM.** `estimate1RM` returns null past
  twelve reps, and `detectSetPrs` skips that one category rather than failing the set. Visible in
  the output, which is the only way anyone would ever check it.
- **`most_reps_at_weight` fired zero times, on both runs.** No weight had been lifted before, so its
  guard held. Without that guard every unfamiliar load fires a record on the way up.
- **Each exercise fired its records once, on set one, not once per set.** Sets two to five of an
  identical prescription beat nothing, because the baseline is re-read inside the transaction and
  already contains set one.

**The baseline is read from the sets, not from `personal_records`.** It has to be:
`bestRepsAtWeight` decides whether a weight has *ever* been lifted, and the records table only knows
weights that once won something — reading it from there would fire a most-reps record on every new
load, which is exactly what the guard above exists to prevent. `heaviest`, `best_e1rm` and
`best_set_volume` count working and failure sets only, matching `detectSetPrs`; session volume
follows `totalVolume` and excludes warm-ups alone. Session volume's baseline excludes the session
being judged, or it beats itself; a *set's* baseline does not exclude its own session, because
105 after 100 is a heaviest-ever either way.

**Three decisions inside the mutations that are not obvious from the schema:**

1. **The set rows are created at session start, with the plan already dialled into
   `weightKg`/`reps`.** That is what makes the row the draft the schema comment describes — the tape
   writes to a row that already exists, so a force-stop mid-set loses nothing and needs no recovery
   code.
2. **Sets dialled but never logged survive `finishSession`.** They contribute nothing to either
   total (`totalVolume` and `countWorkingSets` both ignore a null `completedAt`), and deleting them
   would erase the difference between what was planned and what got done — the same fact
   `removedAt` keeps for a skipped exercise.
3. **`uncompleteSet` deletes the records that set set.** They were claims about a lift that is no
   longer logged. Because the table is append-only, whatever it beat simply becomes the newest
   surviving row again — no recomputation.

**Rest resolves routine → exercise → kind default** through `resolveRestSec` in `src/lib/rest.ts`,
which is where it can be tested and where Settings will take it over. `DEFAULT_REST_SEC` is
180 / 90. The test covers the case that would otherwise rot: **zero is a choice, not an absent
value**, so a routine resting 0s must not fall through to 180.

**What is deliberately not built:** pause/resume. `sessions.pausedMs` accumulates, but there is no
`pausedAt` column to accumulate *from*, and Lab 33's four states have no pause control. Either the
design wants one and the schema needs a column, or it does not — that is a design question, not an
oversight.

---

## The two sheets and the keypad

`src/components/sheet.tsx` is the shared shell; `sets-sheet.tsx`, `exercises-sheet.tsx` and
`keypad-sheet.tsx` sit on it, and `src/lib/keypad.ts` holds the one piece of pure logic
(`resolveKeypadValue`, tested). Driven on the device: a set row moved the cursor to SET 3 OF 5,
the exercises sheet opened from the title, and the keypad typed 110 through to the ring, the tape,
the selector and the e1RM notch.

### `@expo/ui`'s BottomSheet was tried and rejected — on the device, not on principle

It is a real dependency already, and it renders and lays out. But **no touch reaches any React
Native child inside it**: every set row and both footer buttons were completely inert. It also
measures its children against an unbounded width, so a row of fixed columns plus a flex spacer
collapsed ~100dp short of the right edge, and `width: '100%'` could not fix that — only an explicit
pixel width did.

None of that shows up in a type-check, a lint, or a screenshot of a closed sheet. The shell is now
a plain absolutely-positioned panel with our own scrim (`wash.scrim`), which is also one less
experimental native surface in the app.

**Android back is handled by the screen, not the sheet.** It has to close an open sheet *before* it
reaches the session-discard confirm, and one handler in `live.tsx` that knows about both beats two
that race on registration order.

### The grips are deliberately absent

The design gives every sheet row a drag-grip that reorders, and `reorderSets` /
`reorderSessionExercises` are written and unused. Drag-to-reorder was out of scope, so **no grip is
drawn at all** rather than drawn and inert — the same rule that removed two toggles from Lab 35 B3.
That is the one part of the sheets' grammar still missing.

### `Add exercise` is still missing from the sheet — but the picker now exists

This was blocked on the library having no selection mode. It has one now: `/session/library` takes
an optional `routineId`, and with it set the screen retitles to **ADD EXERCISE**, and a row calls
`addExerciseToRoutine` and pops instead of pushing the detail screen. Routine editing uses it.

The session half is the same pattern with a different verb — a `sessionId` param calling
`addExerciseToSession`, which is written and still unused. One param and one branch, not a screen.

---

## The live screen — the core loop, on the device

`src/app/live.tsx` reads the live session, drives Lab 33's instrument, writes every detent, logs a
set with its records named, advances and starts the rest clock. Verified by driving it on the phone,
not by type-check: tapping the ring opened the tape, a two-detent drag moved 100.0 → **105.0
exactly**, and logging it named **HEAVIEST 105 (was 100)**, **BEST ESTIMATED 1RM 133 (was 126.67)**
and **BEST SET VOLUME 840 (was 800)**, then advanced to SET 2 OF 5 with REST 2:57 running.

### The instruments

`src/components/load-ring.tsx`, `tape.tsx` and `param-selector.tsx`, with `src/app/dev/lab33.tsx`
rendering all four states for board comparison.

**The ring is Lab 32's `dial`, not Lab 31's.** Lab 31 still draws a gold arc and a drag knob; F3
killed both, and Lab 33 composes Lab 32. Reading the chain top-down ports the wrong one. Its
geometry: 300° sweep from −240° to +60° open at the bottom, `r = size/2 − (numerals ? 45 : 26)`,
tick length carrying the fill, a Gaussian swell over ±6 ticks for the cursor, and the core's type
scaled by `s = (r − 22) / 123` so it stays inside where the old arc sat.

**It draws with rotated Views, not Skia.** ~49 ticks, and the value moves per detent rather than per
frame, so a native view per tick is affordable and avoids a canvas. If a future perimeter drag makes
it stutter, the renderer swaps behind the same props.

**`ls()` and `lh()` are exported now.** They were module-private in `type.ts`, so no component could
obey AGENTS.md's "always go through `ls()`" rule and the first cut hand-computed `0.66`, `1.32` and a
bare `1.286`. These components size type off the ring radius, so they need both at runtime.

### Three device-only bugs, none of which any gate catches

1. **`useLiveQuery`'s second argument is a dependency list, and it defaults to `[]`.** A query built
   from a value that arrives after mount subscribes once with the value it had then and never
   re-runs. Every session-scoped query here starts with an empty id, so omitting the deps rendered
   *"This session has no exercises in it yet"* forever — **it fails as plausible data, not as an
   error**, which is the worst way for it to fail. Pass `[sessionId]`.
2. **The tape ran away.** Each detent writes through `onDetent`, so `value` comes back changed while
   the finger is still down; a `useEffect` re-seeded the drag origin from it, and the same
   `translationY` was then measured against a moved start. One detent of travel, two of movement,
   compounding for the length of the drag. The origin is captured once in `onBegin` and the resync
   is gated behind a `draggingSV` flag.
3. **The ring's chips were built as columns.** The board's `.par` is
   `display:flex; align-items:baseline; gap:5px; padding:2px 7px` — a *row*. As columns the resting
   state read `8 8` over `REPS RPE`, one garbled string. Only a screenshot finds this.

`src/lib/scale.ts` already carried `'worklet'` directives, so calling `indexOf`/`clampIndex`/
`valueAt` from the tape's gesture worklets is safe — Phase 2 anticipated it.

### What is deliberately not built yet

The sheets and the keypad were on this list and have since shipped — see above. What remains:

- **The horizontal set swipe.** The selector and the ladder already reach every value, and a
  half-built swipe in the contested edge band is worse than none — see the gesture gate above.
- **The ring's chips are not individually tappable.** At rest the whole dial is one target that
  opens the tape on load; the selector then reaches reps and RPE.
- **Pause.** Every other session verb is in the mutations layer; this one was never specified.
- **Where `Finish` goes.** `finishSession` runs and then `router.back()` — the summary screen it
  should land on is Phase 7, and until it exists a finished workout leaves no trace you can look
  at. This is the one place the core loop does not close.

---

## Phase 6's gate — the back-gesture conflict, measured

**Answered on the device, and the live screen's two axes both survive.** `/dev/gestures` is the
probe (`src/app/dev/gestures.tsx`): a full-bleed plane under a pan detector that logs where the app
first sees a touch, a K3 ladder at the true screen edge, and a `BackHandler` counter. Driven with
`adb shell input swipe` — which SystemUI's gesture monitor *does* observe, so the readings are real
rather than synthetic-only.

Nothing Phone, Android 15, gesture navigation, 411 x 914dp, **default back sensitivity**
(`settings get secure back_gesture_inset_scale_left` is `null`).

| Horizontal swipe starts at | What the app gets |
|---|---|
| **< 20dp from either edge** | **Nothing.** The gesture never arrives; a back event arrives instead. |
| **~20–25dp** | **Contested, and this is the dangerous one.** The pan begins, gets ~4dp of movement, then `CANCELLED` — and back fires anyway. A set half-swipes and springs back. |
| **≥ ~30dp** | Clean. Full translation delivered (137–143dp of a 152dp swipe, after slop). |

Symmetric to the pixel on both edges — the right edge cancelled at 386dp of 411, the left at 25dp.

**Three things that follow, and they settle K3.**

1. **Vertical is not contested anywhere.** A vertical drag started at **x = 11dp**, deep inside the
   dead band, was delivered in full (dy 174 of 190). The system claims *horizontal* movement from
   the edge and nothing else. So the exercise axis is free over the whole plane, ladder included.
2. **Taps in the dead band are delivered.** A tap at x = 4dp hit ladder tick 3 and logged
   `LADDER 3`. The system waits for horizontal movement before it commits, so it never takes a tap.
   **K3's tap route lives**, which is the half §0 filed as answerable only by hardware. What does
   *not* live is dragging a ladder tick sideways — do not give the ladder a horizontal drag.
3. **Back is offered to the app and is blockable.** `BackHandler` returning `true` held the screen
   through six back events. The "discard this session?" confirm is viable, and predictive back does
   not take it away.

**Two rules for the live screen, from the middle row of that table:**

- **The set swipe must treat a cancel as "snap back", never as "commit".** The contested band does
  not fail by dropping the gesture — it fails by delivering a few dp and then cancelling, which is
  exactly the shape of a real swipe that changed its mind.
- **20dp is the *default* band, not the floor.** Android's sensitivity slider scales the inset up to
  ~40dp, and it is the user's setting, not ours. Keep anything that must be draggable horizontally
  **≥ 40dp from both edges**, and never make a swipe the only route to a value — which §0 already
  requires ("no value is reachable by only one route") and the SETS sheet already provides.

There is no `setSystemGestureExclusionRects` binding anywhere in the tree, so widening the app's
claim would mean writing a native module. On these numbers it is not needed.

---

## Routines you can actually make

`app/routine/new.tsx` is two fields and a button: it creates the row and **replaces** straight into
`/routine/[id]/edit`, because a routine with no lifts is not a thing anyone wants to be left holding.
`app/routine/[id]/edit.tsx` renames, re-notes, adds through the library picker and removes with a
confirm. `updateRoutine` was the one mutation missing and is now written.

**START now starts.** Routine detail's primary action called `router.push('/live')` and left the
live screen to find a session that was never created. It calls `startSession({ routineId })` and
`replace`s, and it handles the two failures the mutations layer can throw at it: an empty routine
gets *"Add an exercise first"*, and a session already in progress gets *"Finish or discard it
before starting another"* rather than an unhandled throw.

**A lift's targets are still not editable.** Tapping a row in the edit screen removes it; there is
no way to change sets, reps, target load or rest from the app, so `updateRoutineExercise` is written
and unused — the same shape of hole as `reorderSets`. The seeded defaults are what every routine
runs with until that lands. It wants the sheet grammar rather than another screen.

`pnpm check` is green on all of it (27 tests). **It has not been driven on the device**, which by
this log's own standard means it is not verified — the three device-only bugs in the live screen
were all invisible to the same gate. Run the loop end to end on the phone before trusting it.

---

## The session summary — Lab 36 C2, and the loop is closed

`src/app/summary/[id].tsx`. Finish no longer calls `router.back()` into nothing; it writes the
session and `replace`s onto the recap, so the last thing a workout does is name what it earned.

**It is a pure read, because Phase 6 already paid for it.** `finishSession` writes
`totalVolumeKg`, `totalSets` and `durationSec` onto the session row inside the completion
transaction, and `completeSet` writes every set record into `personal_records` with its
`previousValue` and `sessionId`. So the screen needs no aggregation and no recomputation — four
`useLiveQuery` reads and two new queries (`sessionRecordsQuery`, `previousSessionVolumeQuery`).
That was not luck; it is the "written once, inside the completion transaction" comment on the
schema doing its job.

**`NOTES` is not drawn.** C2's action bar is `Done` + `NOTES` and there is no note editor, so the
same rule that removed the sheet grips removed this: a control with nowhere to go is omitted, never
drawn inert. `finishSession` already takes `opts.note`, and C3 has the NOTE section it belongs to.

**The ramp gained one step.** The board sets the PR value in 17px/600 mono inline, and the ramp had
15 (`num`) and 22 (`numTile`) and nothing between. Borrowing `numTile` put a stat-tile number inside
a list row, so `text.numRow` was added rather than a screen setting a `fontSize`.

### Three things only the device said

Driven on the phone by resuming the session that had been left in progress since 7 September and
finishing it. `pnpm check` was green before all three.

1. **A record's number was formatted in two places and neither agreed with the other.**
   `announce()` in `live.tsx` hand-rolled `Math.round(v * 100) / 100`, the recap re-implemented the
   rule with `formatTonnage` on volume, and the screen printed `105`, `133` and `840 KG` in one
   column — two bare numbers and one wearing a unit. There is now one `formatPrValue` in
   `src/lib/pr.ts`, which is the tested layer, and both callers go through it.
2. **`BEST ESTIMATED 1RM · WAS 126.67`.** `formatWeight` is a *load* formatter and 2dp is right for
   a load; an e1RM is an estimate, and two decimals on it read as a measurement. It rounds to the
   whole kilogram now. The board had this right — it shows `WAS 128` — and reading the board as
   "some number" rather than as an integer is what missed it.
3. **WHAT YOU LIFTED listed what was not lifted.** Every planned exercise rendered, so a session
   where one lift was done showed `Active Hang — 0 SETS` under a heading that says the opposite.
   Rows without a completed set are dropped.

None of the three is visible to a type-check, a lint or a test, and all three are legible in one
screenshot. That is now three sessions in a row where that has been true.

---

## Next, in order

**Phase 6 is closed.** Everything below is Phase 7 and after.

1. **History and session detail (C3) — replanned; see "What the review of Phase 7 item 1 found"
   below.** The order inside it is now: two shared predicates and the history reads, then the two
   shipped bugs, then the Rail, then `routine/[id]`'s LAST THREE, then C3, then the `lab46` board,
   then the `/history` list against it.
2. **Today, Lab 45 W3.** The landing tab is still a placeholder with a hardcoded NEXT card and a DEV
   links section. It needs the week strip and the recent-sessions rail. The rail arrives in step 1,
   so what is left here is the week strip — the largest unbuilt component after the ring, and
   `lab45.py`'s W4 column flags an unresolved nested-gesture risk in it.
3. **Settings.** Units, default rest, plate colours, export. Storage is decided
   (`expo-sqlite/kv-store`) and unwritten; the account row moves here and the Today gear stops
   pointing straight at `/sign-in`.
4. **The rest of Phase 7's shipping list.** Empty states, an error boundary, JSON export/import
   through the share sheet, and the Maestro flow over routine → session → summary.
5. **Phase 8 — sync.** The Postgres mirror, its RLS and the auth flow are all in place and verified;
   nothing pushes or pulls a row yet. Start from "The Supabase mirror" below.

**Load and Strength are still 16-line placeholders** and are not on this list, because neither has a
locked design — Load wants D1 and Strength wants the body map (`body-map.md`), both after-v1 in the
plan. They stay stubs through v1 on purpose.

---

## What the review of Phase 7 item 1 found

Phase 7's first item was planned, then run through CEO, design and engineering review with two
independent voices each (a Claude subagent with no prior context, and Codex). Six consensus tables,
nineteen dimensions, all confirmed. It is recorded here because most of what it found was **not**
about the plan.

### One bug on the device, one latent

1. **Latent: `finishSession`'s totals and the summary's exercise list disagree.** The totals query
   (`mutations/sessions.ts:421-424`) has no `removedAt` filter; `sessionExercisesQuery` does. So a
   skipped exercise that had sets logged before the skip would **count toward `totalVolumeKg` and be
   missing from WHAT YOU LIFTED**.
   **It is not reachable today, and the review overstated it as live.** `skipSessionExercise` and
   `unskipSessionExercise` are the only writers of `removedAt` and **neither has a UI caller** — the
   mutation is written and unused, so the column is always null in practice. The disagreement is
   real in the code and would have fired the instant skip was wired to the exercises sheet. Fixed
   before the trigger exists: `sessionLogExercisesQuery` keeps a skipped exercise that has at least
   one completed set, and the summary reads it. Checking reachability before believing a severity
   claim is the lesson.
2. **`routine/[id]`'s LAST THREE is a hardcoded lie.** The section renders the string "Nothing
   logged yet. Every session you run from this routine appears here." with **no query behind it**,
   unconditionally. Sessions have been run from that routine. Its EST. TIME and VOLUME tiles are
   hardcoded `'—'` on the same screen.

### The trap that would have shipped a third

**`startSession` pre-fills every set with the routine's targets** (`mutations/sessions.ts:112-113`
writes `weightKg: line.targetWeightKg, reps: line.targetReps` at creation), and `sessionSetsQuery`
has no `completedAt` filter. A routine planned 5×8 @ 102.5 where three sets were logged returns
**five fully-populated rows**. C3 built on that query renders plan as performance — beside a history
row that says `3 SETS`, because `sessions.totalSets` is `countWorkingSets`.

There is no shared definition anywhere of *"a set that happened"* or *"a session that counts"*:
`recentSessionsQuery` uses `ne(status,'in_progress')` while `previousSessionVolumeQuery` uses
`eq(status,'completed')`. Both go into `src/lib/` as tested predicates before any screen is built.
**Do not retrofit `sessionSetsQuery` itself** — the live screen depends on draft sets and on
excluding skipped exercises.

### Three findings that changed the design, not the code

- **`/history` had no board.** `lab36.py:151`, the round that defines rail scope, reads "session
  history *on a routine*", with "lists where order is arbitrary" under **Not a rail**. §0 line 40's
  generic "session list" is the earlier, looser phrasing. Ruling: the screen stays, and **`lab46.py`
  becomes a prerequisite** rather than a follow-up. Fix the objection, do not cut the feature.
- **C3 ships with no action bar.** The board draws `Repeat this session` + `EDIT`. `startSession`
  snapshots a *routine*, not a session, and `routine/[id]:114` already ships that button with the
  live-session, empty-routine and archived-routine guards. Same rule as the sheet grips and C2's
  NOTES.
- **`sessions.note` has no writer.** Both `finishSession` callers pass no opts, and C2's NOTES action
  was omitted when C2 shipped. C3's NOTE section can never render, so it is struck.

### §0 amendment, signed off

The spacing law said "Rail events get 56pt of clear air beneath" and `kit.py:20` set
`RAIL_AIR = 56`. **No board has ever used it** — Today passes 22, routine detail and the program
strip 24, the PR timeline 26, and the two earlier rails 22 and 26. The constant was dead from the
day it was written. `air` is now a **required** prop on `rail()`, the constant is deleted, and §0
records that the 56pt figure was written before any rail shipped.

**One review finding was wrong here and it is worth recording why.** The engineering phase reported
that `lab34.py:87` passes no `air`, so LAST THREE inherits 56. It does pass it — on the *closing*
line, `lab34.py:98`, because the call spans twelve lines. A single-line grep cannot see the
arguments of a multi-line call, and acting on that report without checking added a second `air`
argument to the same call, which would have raised a TypeError the next time anyone regenerated the
board. Every `K.rail(` audit in this repo has to match parentheses, not lines.

### Two of the review's own conclusions were overturned by later phases

Worth recording because it is the argument for running the phases in sequence rather than at once.
The CEO phase called `formatDuration` wrong for returning `1H 04` where a board draws `64 MIN`; the
design and engineering phases both showed the boards carry **two registers on purpose** —
`lab36.py:22` and `:78` draw `1H 04`, the rail meta lines draw `64 MIN`, so a second formatter is
needed and the existing test is correct. The design phase then specified `data === undefined` as the
loading branch; the engineering phase read the installed hook and showed it never fires.

---

## Open threads

- **Branching: settled.** Trunk commits on `main` are accepted for this solo app. Do not reach for
  branch-based tooling (`/review` and friends diff a branch against a base and will refuse); review
  the working diff or the last N commits instead. `origin` is now
  `git@github.com:zcylla/jymiq-workout-tracker.git`.
- **The session data layer is done, and the live screen now uses most of it.** Three verbs are
  still written and unused: `addExerciseToSession` (wants the library's `sessionId` picker mode),
  `reorderSets` / `reorderSessionExercises` (want the sheet grips), and `updateRoutineExercise`
  (wants target editing in the routine editor). Pause is not built — see above.
- **Export may outrank every remaining screen.** Both CEO voices, independently, argued that the
  real existential risk to this project is not a missing feature but **data loss**: there is no sync
  (Phase 8) and no export, so a wiped phone ends the app and every session in it. JSON export
  through the share sheet is XS-to-S and sits at item 4 behind three feature screens. Not decided —
  recorded so the next replanning session has to look at it.
- **A session left open runs forever — closed 2026-09-12.** The session resumed to test the summary
  had been in progress since 7 September and stored `122H 44`. `elapsedSec` is wall-clock by design
  and stays untouched (it drives the live header). What changed is the *persisted* policy:
  `resolveSessionDurationSec` keeps the wall clock when it is plausible, falls back to the span from
  the start to the **last completed set** when it is not, and writes **null** rather than a clamped
  number when even that is implausible — a missing duration is honest, an invented one is not.
  `formatSessionDuration` also renders anything past the ceiling as an em dash, so the rows already
  poisoned in the database read correctly without a migration. Verified on the device: that session's
  TIME tile now shows `—`. Still undesigned: whether a stale session should be auto-abandoned at all,
  which is a prompt-on-resume question, not a storage one.
- **Settings storage** is decided (`expo-sqlite/kv-store`) but not written. Everything the app
  needs from it today is hardcoded: kg, the seeded rest defaults, the plate palette.
- Still open on the design side and not blocking: the calendar's plate, the body map, the IA.
- **Supabase: schema, RLS and auth are done; sync is not.** Architecture unchanged and settled:
  **local-first** — SQLite is the source of truth so the app works in a basement gym, and Supabase is
  the sync/backup/multi-device layer. What exists now is in "The Supabase mirror" below. What does
  not exist is any code that pushes or pulls a row; that is Phase 8.
- **Demonstration media: settled, and it reshaped the library.** `@bryllim/workout-guide` is now the
  *spine* of the seed rather than art matched onto someone else's list, so coverage is 100% of 302
  rather than the ~23% this thread used to predict — see "The seeded library" for the trade that
  bought (1295 rows down to 302, and cues on 38% of them). Its PNGs are required out of
  `node_modules`, not vendored, and drawn with `expo-image` — no Skia, no SVG at runtime. **The
  CC BY-SA obligation is live and load-bearing: tint at render time, never resize, recolour or
  re-encode**, or the files become Adapted Material and ShareAlike reaches our own source.
  **Do not use free-exercise-db's images** — the maintainer disclaims knowing their origin and
  upstream admits scraping; its *text* is fine and is used for cues. Gym visual's media (in the
  dataset the cues come from) is licensed per use and was ruled too expensive.

---

## The Supabase mirror

Project `apmzkqejwmhctaldbzgv`, reached through the Supabase MCP. `.env` holds
`EXPO_PUBLIC_SUPABASE_URL` and `EXPO_PUBLIC_SUPABASE_KEY` (the publishable key — **never** the
`service_role` key, which would ship inside the bundle) and is gitignored.

**The schema** is `src/data/schema.ts` mirrored into `public`, applied as four migrations — the
first pair, then `jymiq_tenant_scoped_keys` / `jymiq_tenant_scoped_rls` rebuilding them after a
security review found two cross-tenant holes (below). Four deliberate differences from SQLite:

1. **`user_id uuid not null references auth.users(id) on delete cascade`** on all eight tables. It is
   the RLS subject; SQLite has one user and needs no such column.
2. **`deleted_at bigint`** on all eight. A row that is gone locally cannot be shown to a peer by its
   absence, only by a tombstone. Both columns are there now because retrofitting either means a
   migration against real data.
3. **Timestamps stay unix milliseconds (`bigint`)**, exactly as SQLite stores them, so a synced row
   is a copy rather than a conversion with a rounding bug in it. `deleted_at` uses the same clock.
4. **Every primary key is `(user_id, id)`, and every foreign key carries `user_id`.** SQLite keys on
   `id` alone, which is right for a database with one user in it and wrong here — see below.

**Built-in exercises are not mirrored.** All 1295 arrive identically from the local seed migration,
so syncing them would copy the same rows per user and collide on their shared slugs; only `is_custom`
rows live in Postgres. That is why `routine_exercises.exercise_id` and `session_exercises.exercise_id`
carry **no foreign key** — they legitimately name a built-in slug this database has never seen. Do
not "fix" that by adding the constraint.

**Two holes the first cut of this schema had, both fixed while the tables were still empty.** Both
are primary-key changes, so neither would have been cheap later — this is exactly the retrofit the
plan said to avoid.

1. **The keys were `id` alone, and `id` is a client-supplied string.** So all users shared one id
   namespace: whoever claimed an id owned it globally, and everyone else got a duplicate-key error
   on a row RLS was hiding from them — a denial of service, and an existence oracle for other
   people's ids. Keys are now `(user_id, id)`, so the namespace is per tenant.
2. **The foreign keys referenced `id` alone, and FK validation runs with RLS bypassed.** A signed-in
   user could insert a row they legitimately own whose *parent* id belongs to somebody else: RLS
   passes (the row is theirs), the FK passes (the parent exists). That is an existence oracle for
   any guessed id, and it grafts one user's rows into another's object graph, where the victim's
   delete cascades over them. Every FK now includes `user_id`, so a parent in another tenant simply
   is not there. Two of them need Postgres 15+'s `on delete set null (column_list)` — a bare
   `SET NULL` would try to null `user_id` as well, which is NOT NULL, and fail the cascade.

`user_id` also carries `default auth.uid()`, so a sync insert cannot omit it. `force row level
security` was considered and left off: `service_role` has `bypassrls` so it would not be constrained
either way, and all `force` adds is filtering the owner's own connection — which is the one used to
run migrations and to look at the data.

**RLS** is on for all eight tables, one policy each:

```sql
create policy T_owner on public.T for all to authenticated
  using ((select auth.uid()) = user_id) with check ((select auth.uid()) = user_id);
```

`for all` covers the four verbs in one policy; `with check` is what stops a signed-in user handing a
row to somebody else by rewriting `user_id`; `auth.uid()` is wrapped in a `select` so the planner
evaluates it once per statement rather than once per row. Every `user_id` and every foreign-key
column is indexed. SQLite's partial unique index for "at most one live session" is per-user here, or
the second person to start a workout is refused.

`anon` is revoked outright. RLS with no `anon` policy already stopped it reading anything, but
**TRUNCATE is the one statement RLS cannot gate**, and it was granted by default to the role whose
key ships inside the APK. `authenticated` loses TRUNCATE for the same reason.

Verified against the live database rather than assumed. With two throwaway users, one holding a
routine and a session: user A could claim an id B already used (per-tenant namespace, as intended),
A's attempt to attach its own `session_exercises` row to B's session was **refused by the composite
foreign key**, reassigning `user_id` was refused by `with check`, A saw one row in `routines` and
none of B's, deleting B's session affected zero rows, `anon` saw nothing, and the `user_id` default
resolved to `auth.uid()`. Both probe users were then deleted; cascade took their rows and the project
is back to zero. `get_advisors --type security` returns **no lints** — the two it did report were
`public.rls_auto_enable()`, the project's own event-trigger function, published at `/rest/v1/rpc` by
Postgres's default `EXECUTE to PUBLIC` grant. That grant is revoked; the event trigger fires as its
owner and never needed it.

**Auth is a real sign-in flow, not anonymous.** Google and email magic link, both on **PKCE** — an
implicit redirect carries the access and refresh tokens in the URL, and any app registered for
`jymiq://` would receive them; a PKCE code is worthless without the verifier in this app's storage.
`src/data/supabase.ts` holds the client (`expo-sqlite/kv-store` for the session, already a
dependency and AsyncStorage-shaped; `detectSessionInUrl` off, since there is no address bar;
`startAutoRefresh` driven off `AppState`, because Android suspends the refresh timer in the
background). `src/app/sign-in.tsx` is the screen, reached from the Today gear until Settings exists.
**Apple sign-in lands with the iOS build** — it is required once other social providers ship, and
there is no device to verify it on.

**The client is nullable on purpose.** With no env vars `supabase` is `null` and the screen says so;
the app must run with no account, no signal and no project, because SQLite is the source of truth.

**PKCE bounds token theft, not interception.** `jymiq://` is a plain custom scheme and a second app
can register it; it could swallow the redirect and leave the sign-in hanging at exactly the moment
the user expects a sign-in screen. It could not use the code, but closing that properly needs a
verified `https://` App Link and a domain to serve `assetlinks.json` from. Open, and not blocking.

### The dashboard side: done, and how it was checked

Neither step could be done through the MCP, and both are now configured by the owner:

1. **Authentication → Providers → Google** — a Google Cloud OAuth **Web** client whose authorised
   redirect URI is `https://apmzkqejwmhctaldbzgv.supabase.co/auth/v1/callback`. A Web client is all
   this needs: the browser hop means no Android client id and no SHA-1 fingerprint, and so no new
   dependency.
2. **Authentication → URL Configuration → Additional Redirect URLs** — `jymiq:///sign-in` (three
   slashes; see the deep-link trap below).

Verified without a device, which is as far as this can be taken without one:

```bash
curl -sS -o /dev/null -D - \
  "$EXPO_PUBLIC_SUPABASE_URL/auth/v1/authorize?provider=google&redirect_to=jymiq%3A%2F%2F%2Fsign-in"
```

now answers **302 to `accounts.google.com`** carrying `redirect_to=jymiq:///sign-in` intact, where
before it answered `{"code":400,…"Unsupported provider: provider is not enabled"}`. That proves the
provider is on *and* that the redirect passed the allow-list — a URL that is not on the list is
rejected at this step, so one call covers both.

**Still unverified, and it needs the phone: the return leg.** Nobody has completed a real Google
sign-in on the device, so the browser hop back into `jymiq:///sign-in`, the PKCE exchange in
`exchangeAuthCode`, and the signed-in state of the account screen are all untested against a live
code. The magic-link leg is in the same position. The pieces around them were checked — the deep
link routes, the root handler runs on an unmatched route, and a spent code is swallowed without an
error banner — but a real code has never been through them.

## Things that cost time once, recorded so they cost nothing again

- **Verifying a JS-only change needs no rebuild, and the whole loop can be driven from the shell.**
  `adb reverse tcp:8081 tcp:8081`, `pnpm expo start --dev-client`, then
  `adb shell am start -a android.intent.action.VIEW -d "jymiq://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"`
  to make the launcher load Metro rather than sit on its server list. From there
  `adb shell input tap X Y` plus `adb exec-out screencap -p > shot.png` drives and reads any screen,
  and once the bundle is warm a plain `jymiq://<route>` deep link jumps straight to it — which beats
  tapping through to a screen that is four navigations deep.
- **The database can be read off the phone**: `adb shell run-as com.zcylla.jymiq cat
  files/SQLite/workout.db` — but it is WAL, so `workout.db` alone is a 4 KB empty shell. Pull
  `workout.db-wal` and `workout.db-shm` beside it or every query answers "no such table". There is
  no `sqlite3` on the device; query the copy on the host.
- **Gradle wants JDK 21 and `ANDROID_HOME` set.** Two separate failed builds.
- **A pnpm install and a stale `android/` cost a build each** — see "Starting on a machine that has
  never built this" above for all three failure signatures.
- **`deps` is a commitlint *scope*, not a *type*.** `deps: add x` is rejected; it has to be
  `build(deps): add x`. Worse, `git commit … 2>&1 | tail -1` hides both the rejection and the exit
  code, so the commit silently does not happen and its files land in the next one. Two dependency
  commits were lost that way in one session. The types this repo uses are feat, fix, docs, build,
  refactor and chore.
- **`Linking.createURL()` is not the auth redirect you want.** In a dev client it splices Metro's
  host into the path and returns `jymiq://localhost:8081/sign-in`, which **expo-router does not
  match** — verified on the device, the magic link lands on Unmatched Route. A release build returns
  `jymiq:///sign-in`, which does match, so this only ever breaks where you test it. `authRedirectTo`
  is built from `Constants.expoConfig.scheme` with an empty authority instead, and
  `jymiq:///sign-in?code=…` was confirmed to route in the dev client.
- **A `jymiq://` link cannot cold-start a dev build.** With no bundle loaded, expo-dev-client's
  launcher takes the intent and shows its server list. Load the app from Metro first, *then* fire
  the link. Magic links can only be tested warm, or in a release build.
- **The dev-client bubble sits exactly where the screen headers put their right-hand action**, so
  `adb shell input tap` on a header icon opens the dev menu instead — and once that sheet is up it
  ignores synthetic input. Reach the screen by deep link rather than by tapping.
- **The auth code exchange belongs at the root, not on the sign-in screen.** A redirect arrives more
  than once (on Android `openAuthSessionAsync` resolves off the same Linking event `useLinkingURL`
  observes) and `useLinkingURL` keeps handing back the same URL for the life of the process. Since
  supabase-js deletes the PKCE verifier on its failure path as well as its success path, every later
  attempt fails with "code verifier could not be found" — printed over a sign-in that worked.
  `exchangeAuthCode` remembers spent codes; the root layout is where it runs, so a link that lands on
  a route the app cannot match is still exchanged.
- **`pnpm expo customize tsconfig.json`** regenerates typed-route types without starting Metro. New
  routes fail `tsc` until it runs (or Metro regenerates them).
- **Node's type stripping does not rewrite import specifiers**, so `src/lib/*` imports carry `.ts`
  extensions and `tsconfig` needs `allowImportingTsExtensions`. `scripts/check-icons.mjs` imports a
  `.ts` module for the same reason and runs under `--experimental-strip-types`.
- **Editing `assets/icons/ui/` needs a prebuild and a native rebuild**, not just a Metro reload —
  the plugin fingerprints the folder and the font is linked as a native asset.
- **A comment-only chunk in a drizzle migration crashes the app natively.** Drizzle splits a
  migration on its breakpoint marker and hands each chunk to expo-sqlite verbatim — no trimming, no
  empty filter. A chunk containing only comments prepares to a NULL `sqlite3_stmt`, and
  expo-sqlite then calls `clear_bindings` on it: **SIGSEGV in `exsqlite3_clear_bindings`, not a SQL
  error**. So a hand-written migration must never lead with the marker, and must never mention the
  marker inside a comment either — the split does not know it is prose. `scripts/build-seed.mjs`
  emits statements joined by the marker rather than prefixed with it.
- **Editing a `.sql` does not invalidate Metro's cache for the `.js` that inlines it.**
  `babel-plugin-inline-import` bakes the SQL into `drizzle/migrations.js` at transform time, and
  Metro caches that transform against the `.js` file's hash. Change the `.sql` and you keep
  shipping the old one, silently — which is how a migration bug that was already fixed kept
  crashing the device. `pnpm expo start -c` after any migration edit. Touching the `.js` is not
  enough.
- **The `%` trap in the board generators** is real and bit again: any literal `%` inside a
  `%`-formatted Python string must be `%%`.
- The plate solver must be **heaviest-first with backtracking**, not greedy and not
  fewest-plates — greedy strands weight, and fewest-plates gives 20 + 20 where a lifter loads
  25 + 15.
