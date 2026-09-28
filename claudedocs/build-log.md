# Build log — where the implementation is

Companion to `design-exploration.md`, which holds the design state. **This file holds the build
state.** A new session should read `AGENTS.md`, then §0 of `design-exploration.md`, then this.

Last updated 2026-09-28 (end of day). **Phase 8's cloud backup shipped, and its first push was
verified on the device.** Changes are queued by SQLite triggers and only changed rows are pushed. The
first push landed all eleven synced tables, matching the phone row for row. See **"Cloud backup —
Phase 8"**. Not yet verified: an incremental push after an edit, and restore from the cloud.

Before that, the same day: **the body map shipped — Lab 35 B4.** It is the MuscleMap figure
drawn with Skia and coloured by recent load relative to the most-worked muscle, with no invented
threshold. **Every drawn screen is now built.** **The ground was flat, and the design's is not.** The owner
spotted it: every board draws a dot field and two blurred blooms under the content, and the app
had never built either. Both are now in `Screen` (see "The ground's field and blooms").
**Next: Phase 8, sync.**

Before that, the same day: **Today's empty state was checked on an emulator and then built —
Lab 43 T3.** The check showed that a fresh install's only way forward was MAKE A PROGRAM, which
needs a routine the user does not have yet. **The week strip no longer draws past its plate.** See
**"Today, empty — Lab 43 T3"**.

Before that, the same day: **Readiness shipped — Lab 37 D3.** It is an optional check-in
reached from Today, and the call it gives is a sentence built from the three answers plus facts from
the log. There are no invented thresholds. See **"Readiness — Lab 37 D3"**.

Before that, the same day: **Bodyweight shipped — Lab 37 D2** — the app's first schema
change since programs, its first Skia drawing, and a backup bug fixed on the way: **programs were
never in the backup file**. See **"Bodyweight — Lab 37 D2"**.

Before that, the same day: **both charts are on their screens** — exercise detail's e1RM
chart (Lab 35 B2′ / Lab 39 Q1) and Program detail's SESSIONS PER WEEK (Lab 34 A4). See **"The two
charts on their screens"**.

Before that, the same day: **the column chart and the Load tab root shipped.** The chart
primitive (`ColumnChart`, from `kit.chart()`) is on the device against Lab 34 A4 and Lab 39 Q1, and
Lab 37 D1 is now the real Load tab root — two tiles, weekly sets per muscle as zone bars, and a
deload sentence, with the calendar moved below it. On the way, **every reported tonnage and top set
now follows the weight unit** (it never had). See **"The column chart and the Load tab root"**.
**Start the next session at "Pick this up here"** immediately below.

Before that (2026-09-13): **Programs shipped** — Lab 34 A3 and A4 — see "Programs — Lab 34 A3 and
A4", and read "A hand-edited migration timestamp and a warm Metro" before touching
`drizzle/meta/_journal.json` again.

Before that, in the same session: export and restore both shipped — export is device-verified
at 1,223 rows, restore is pure and tested with the destructive path designed around a rollback
export taken before anything is written. The Strength and Load tab roots stopped being placeholders:
Strength got the record timeline (Lab 36 C4), Load got the month calendar (Lab 36 C1) — see
"Two tab roots got their screen". An Android emulator (`jymiq-a`) now exists alongside the physical
phone, for empty-state coverage the phone's real training data can never give. Before all of that,
`Lab 47 — The Design System` was published: the reference sheet the IA gap asked for. A
board-versus-device refinement pass followed it and shipped seven fixes, two of them criticals a
screenshot alone could not catch — see "The refinement pass". Before both, Phase 7 item 1 was
replanned through a four-voice review, then built: the Rail, routine detail's LAST THREE, and
session detail (C3). The history *list* was dropped — the IA never had one.

---

## Pick this up here

**State:** clean on `main` (local commits not pushed — push only when asked), `pnpm check` exit 0,
**182 tests**. Every tab root, the live session, routines, programs (with the A4 chart), library,
exercise detail (with the e1RM chart), bodyweight, readiness, session summary and detail, export,
restore, Settings and the body map are on the device and verified there. **Every drawn screen is
built.**

**Nothing is scheduled.** The open work is: verifying an incremental push and restore-from-cloud on the
device (see "Cloud backup — Phase 8"), the UI pass described under "Smaller things", and full
multi-device sync if it is ever wanted.

### What remains, in order

| # | What | Board | Blocked on |
|---|---|---|---|
| 1 | **Verify incremental push and restore-from-cloud** | "Cloud backup — Phase 8" | the owner making an edit; a second signed-in device or a wiped one |

**Correction to the previous handoff:** D1 was listed as blocked on the chart. It never was — Lab 37
records that the six-week volume chart was *cut* from Load to pay for the restyle. The chart
unblocks items 1 and 2 only.

### Smaller things, none of them blocking

- **The "missed" marker is not legible — this is for a future UI pass, not a fix to make now.** The
  owner could not tell what the outlined squares on the week strip and the calendar meant. They
  mean *scheduled by the running program and not logged*. The strip has no key at all, and the
  calendar's `MISSED` key draws a pill-shaped outline where the cells draw a rounded square. The
  owner's direction is **visual feedback over text**, as part of a broader UI refactor:
  - grey out the missed days;
  - mark each day the program assigns a workout to;
  - keep trained days painted as they are now.

  That touches §0's Calendar row ("missed carries a ring"), so it is a design decision to make with
  the owner, not a patch.

- **The readiness verdict has only been rendered by its tests**, not on the device. Verifying the
  screen would have meant writing a check-in the owner did not give, so the device pass stopped at
  two answers (nothing is saved until all three are set). The owner's first real check-in is the
  first render. Worth one look: the one-bad-answer lead is long, and Today shows it uppercased in
  the READINESS row's meta.
- **`check_ins` is not in the Supabase mirror** either — add it with the other three in Phase 8.

- **D2's RELATIVE STRENGTH is not built.** It needs strength-standard percentile tables, and finding
  those is a sourcing job, like the volume landmarks. Weigh-ins now exist for it to divide by.
- **A weigh-in cannot be edited or deleted.** Logging again the same day corrects that day, because
  each day's latest reading wins. A wrong reading from an earlier day stays until an edit exists.
- **`body_weights` is not in the Supabase mirror.** The mirror has eight tables and the local schema
  now has eleven. `programs` and `program_days` were never mirrored either. Phase 8 has to add all
  three with the same `user_id`/`deleted_at` treatment.

- **Exercise detail's YOUR NUMBERS tiles, REP MAXES and WHAT TO DO NEXT are not built** (Q1 draws
  them). Only the e1RM chart shipped. The "Nothing logged yet" sentence now shows only for a lift
  with no history, because once there is history it would be false. WHAT TO DO NEXT is model output:
  §0 makes it a sentence, never a number.

- **Today's SESSIONS tile ships without its meter** — no weekly target is stored. Needs a target in
  Settings first; §0 forbids a meter without a real denominator.
- **Settings deliberately omits half its board.** `solvePlates`, `warmupRamp` and `PLATE_COLORS` are
  pure, tested and have no caller. Do not ship their switches before something renders them.
- **Four mutations are written, tested and unused**: `addExerciseToSession` (wants a library picker
  mode), `reorderSets` / `reorderSessionExercises` (want the sheet grips), `updateRoutineExercise`
  (wants target editing in the routine editor).
- **Volume landmarks exist for five muscles only** (chest, back, quads, hamstrings, shoulders —
  `src/lib/landmarks.ts`, the board's numbers). The other eleven show a count and no bar, on purpose.
  Adding landmarks is a sourcing job, not a coding one — do not invent physiology.
- **Four lint warnings predate all current work** (`strength.tsx`, `history/[id].tsx` useMemo deps;
  `lib/pr.ts` duplicate import). `pnpm check` still exits 0. Fix them as their own commit if touched.
- **Phase 8 — sync.** Schema, RLS and auth in place and verified; nothing pushes or pulls a row.
  Start from "The Supabase mirror".
- **Still on Phase 7's list:** an error boundary and the Maestro flow over routine → session → summary.

### First commands

```bash
export JAVA_HOME=/usr/lib/jvm/java-21-openjdk ANDROID_HOME=$HOME/Android/Sdk
pnpm expo customize tsconfig.json       # FIRST on a fresh checkout: typed-route types are gitignored,
                                        # and without this `pnpm check` fails with route errors
pnpm check                              # expect exit 0, 152 tests, 4 pre-existing lint warnings
pnpm expo start --dev-client            # add -c after ANY config or drizzle-journal edit
adb reverse tcp:8081 tcp:8081           # re-run after every force-stop; it drops silently
adb shell am start -a android.intent.action.VIEW \
  -d "jymiq://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
adb shell am start -a android.intent.action.VIEW -d "jymiq:///dev/chart"   # once warm
adb exec-out screencap -p > shot.png
```

**If a screenshot comes back solid black** the phone is dozing or locked, not the app failing —
`adb shell dumpsys power | grep mWakefulness`. Never try to get past the lock; ask the owner.

### What is on the phone right now

302 exercises, 1 routine (**Lower A**), **4 sessions, 56 sets** — the fourth is a demo session run
on 28 Sep so the Load tab's zone bars had this-week data to render. **One program, "PPL 3-Day"**,
Lower A on Mon/Wed/Fri, running since 13 Sep. All of it is test data; rename, reschedule or delete
freely. Export before anything destructive; restoring the rollback file is the fastest undo.

**A missed day cannot appear until two days after a program is activated** — nothing before
`started_at` is ever missed, and today is never missed.

---

## The plan

The original plan file (`~/.claude/plans/start-by-making-a-rippling-fog.md`) **no longer exists** —
it was a local agent artifact and was never committed. Nothing depends on it any more: the phases
and what remains live in "Pick this up here" and "Next, in order" above, the data model is
`src/data/schema.ts`, and the stack rationale and risks are recorded where each was settled, in the
phase sections below.

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
| **7 — Closing the loop** | **Summary (C2), the Rail, routine detail's LAST THREE, session detail (C3), export, restore, Settings (D4) and Programs (A3/A4) are done and verified.** Only the error boundary and the Maestro flow are left. |

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

All four tabs now carry their screen: Today is Lab 45 W3 (see "Today, at last" below), Strength the
record timeline and Load the month calendar. `/library` is a stub whose only job is to prove a pushed
route loses the bar. The DEV links on Today survive behind `__DEV__` — they are the only route to the
Phase 1, 2 and 6 gates, and they are absent from a release build.

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

A physical device over USB is the primary path, and the only one that matches §0's measurements —
see "The Android emulator" below for the second path and what it is for. `android/` is generated by
prebuild and gitignored.

### The Android emulator

An AVD named **`jymiq-a`** now exists: 4.6 GB on disk, 1080x2400 @ 420 dpi, which is exactly the
physical Nothing Phone's 411 × 914 dp. Measured: boots headless in ~50 s, holds ~4.1 GB RAM, and an
x86_64 build takes ~2 m 20 s.

```bash
export ANDROID_HOME=$HOME/Android/Sdk JAVA_HOME=/usr/lib/jvm/java-21-openjdk
$ANDROID_HOME/emulator/emulator -avd jymiq-a -no-window -no-audio -no-boot-anim \
  -gpu swiftshader_indirect -port 5556 &
# wait for: adb -s emulator-5556 shell getprop sys.boot_completed  ->  1
cd android && ./gradlew assembleDebug -PreactNativeArchitectures=x86_64 && cd ..
adb -s emulator-5556 install -r android/app/build/outputs/apk/debug/app-debug.apk
adb -s emulator-5556 reverse tcp:8081 tcp:8081
adb -s emulator-5556 shell am start -a android.intent.action.VIEW \
  -d "jymiq://expo-development-client/?url=http%3A%2F%2Flocalhost%3A8081"
adb -s emulator-5556 exec-out screencap -p > shot.png
adb -s emulator-5556 emu kill    # when done — it holds 4 GB
```

**What it is for:** proving a screen boots, renders, navigates and does not crash — and **empty
states**, because the emulator's database is empty and the physical phone's is not. That empty-state
coverage is otherwise unobtainable without destroying real training data.

**What it is not: the design gate.** §0's measurements came from real hardware. Board-versus-physical-
device stays the check that matters.

More than one agent on emulators needs a git worktree, an `android/` build (~1.4 GB), an AVD clone
and a Metro port each; disk is fine but RAM is the ceiling at ~4.1 GB per emulator, and Gradle builds
must run serially. `adb emu kill` is asynchronous — the process persists for a few seconds after the
command returns.

**The ABI trap.** `pnpm expo run:android` narrows the APK to the connected device's ABI: an x86_64
APK will not run on the physical arm64 phone, and an arm64 APK will not run on the emulator. It fails
as `SoLoaderDSONotFoundError: couldn't find DSO to load: libreactnative.so`, which reads like a
corrupt install rather than a wrong-architecture build — see "Things that cost time once" for why
that error text is worth remembering on its own.

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

## Body map — Lab 35 B4

**Built to `claudedocs/body-map.md`, with two owner decisions that override it:**
- **Relative colouring, no threshold.** The spec's `FATIGUE_FULL_SETS = 12` ceiling and its
  quartile words were invented. What ships instead: each muscle's recent working sets are decayed
  on the research's 48 h half-life (assist sets count half), then coloured *relative to the
  most-worked muscle*. The scale reads **LESS WORKED → MOST WORKED**, a fact, rather than §0's
  FRESH → NEEDS REST, which is a readiness claim. This is the same call the owner made for
  Readiness.
- **The entry point is a BODY row at the top of the Strength root**, which pushes `/body`. Its meta
  names the hardest-worked muscle.

**The asset differed from the spec.** The spec says only the left side is authored and the right
must be mirrored. The vendored `male-front/back.ts` already carry both sides (`*_LEFT` and `*_RIGHT`
ids, all `side: "CENTER"`), symmetric about x=512 to within 12 units, so nothing is mirrored. The
group names also differ from the spec's table (`RHOMBOIDS`, `LATS`, `BACK_LOWER`, …). The mapping in
`scripts/build-bodymap.mjs` follows the real enum. To regenerate `src/components/body-map/paths.ts`,
run `node --experimental-strip-types scripts/build-bodymap.mjs`.

**Pieces.** The maths is in `src/lib/fatigue.ts` (tested). `heat()` lives in `src/theme/heat.ts`:
it interpolates from `color.off` to `color.live` in OKLab, and derives both ends from the tokens
rather than restating hex values. `fatigueSetsQuery` is `FROM sessions`. There is no schema change.

**One thing that reads oddly, left as is.** WORKED HARDEST is *ordered* by decayed load, which
counts assisting work and recency, but it *prints* prime-mover working sets. So "Shoulders · 2
SETS" can rank above "Chest · 3 SETS" when push-ups load the shoulders as an assist. Both
numbers are honest. Whether the list should sort by what it prints is a small call for the owner.

## The ground's field and blooms

**The first check was wrong, and it is recorded so it is not repeated.** Asked whether the
background matched the design, a pixel sample of the canvas returned `#0a0908`, which is §0's ground
exactly, and the answer given was "matches". It did not. The owner compared a board to the phone
and saw a plain black screen. `kit.phone()` draws **three layers above the ground on every board**:
- a `.field` dot grid: 1px dots at 4% white on an 18pt pitch, fixed to the frame;
- a gold bloom: `rgba(228,198,140,0.13)`, 300×280 at the top right, blurred 88;
- a green bloom: `rgba(159,174,58,0.07)`, 280×220 at the bottom left, blurred 88.

No board passes `bloom=False`, and nothing in the design docs drops them. §6 of
`design-exploration.md` says the panels' "lit" quality comes from the bloom. **A single pixel
sample checks a token, not a design: compare the whole frame.**

**What shipped.** `field` tokens were added to `tokens.ts`. `Backdrop`
(`src/components/backdrop.tsx`) is one Skia canvas behind the scroll view, with no pointer events.
It draws the dot grid as a single path of circles, built once per window size, and the two blooms
as `Oval`s with a `BlurMask` (CSS `blur()` and Skia's `blur` are both a Gaussian sigma). `Screen`
draws it, so every screen gets it, the live session included. Only `dev/fonts` and `dev/db` bypass
`Screen`. On the phone the top-right corner now samples `#161410` against `#0a0908` in the dark
corner.

## Today, empty — Lab 43 T3

**Checked on an emulator with an empty database, then built.** The fresh-install Today showed
"Nothing scheduled" with MAKE A PROGRAM as its only way forward, but a program needs a routine
and a fresh install has none. T3's three first steps did not exist, and SESSIONS `0` was drawn
bright where T3 draws it dim.

Now, when there are **no routines and no logged sessions**, Today leads with *Nothing logged yet.*
and a FIRST STEPS group:
- **Build a routine** goes to `/routine/new`.
- **Browse the library** goes to `/session/library`. Its meta uses the real count (302), not the
  board's 214.
- **Start an empty session** calls `startSession()` with no routine.

Once a routine exists, the "Nothing scheduled" card comes back. A zero SESSIONS tile is dim
everywhere, not only on a fresh install. READINESS stays, because it works without history. All
three routes were tapped through on the emulator, and the phone's normal Today is unchanged.

**The week strip drew past its plate.** `WeekStrip` hard-coded a `-space.pad` (22pt) bleed from
the days when it sat unplated on the canvas, but it lives in a plated Section with `pad={13}`. So
its scroll viewport overhung the plate by 9pt on each side, and scrolled cells drew over the
plate's edge. The bleed is now a required prop that Today sets from the same constant it gives
the Section.

**The `jymiq-a` AVD no longer exists.** Use **`Medium_Phone_API_36.1`**. It is also 1080×2400 at
420 dpi, so it matches the phone. It **must boot with `-no-snapshot`**: its saved snapshot fails
to load (`goldfish_pipe` state error), and the cold boot then hangs at about 0% CPU while adb
reports the device `offline` indefinitely. With `-no-snapshot` it boots in about 25 s. The x86_64
debug APK takes about 3 min to build.

## Readiness — Lab 37 D3

**Decided with the owner.**
- **It is optional, not a gate.** A READINESS row under Today's next-session card pushes
  `/check-in`. The row reads `3 TAPS · OPTIONAL`, or today's lead once answered. D3's action bar
  offers `Start <routine>`, using the same logic as Today's Start button, and `SKIP`, which goes
  back. Starting a session from Today is still one tap.
- **Answers are stored.** `check_ins` (`drizzle/0004_rare_warhawk.sql`, journal `when`
  1790632508687) holds one row per check-in, with enum text columns. Once all three answers are
  set the row is written, and later changes update that same row. It is backed up.
- **The model is facts plus a stated rule** (`src/lib/readiness.ts`, tested). The lead comes from
  the number of bad answers (POOR sleep, A LOT of soreness, LOW energy). 0 → *Train as planned.*
  1 → *…and ease off if the warm-ups feel slow.* 2 → *Go lighter today.* 3 → *Consider resting
  today.* The reason only repeats what the user said, plus which of the next routine's prime
  muscles were trained in the last 48 hours, with their working-set counts. It uses no decay
  maths, no thresholds, no kg amounts and no score.

**What the board was not followed on, and why.** D3's sample verdict prescribes "drop the top set
by 2.5 kg", and its caveat claims volume "decayed on a 48-hour half-life". Both would be invented:
the research names the ingredients but gives no rule. The caveat is rewritten to say what the call
actually uses. Lab 48's catalog note mentions a zone bar on this screen, but D3 as drawn has none,
and nothing here has a real range to draw.

**Verified on the device.** Migration 0004 applied under a cold Metro, and both journal
timestamps are recorded in `__drizzle_migrations`. The Today row, the screen, the scales'
selected state and the empty "Answer all three…" state were all checked. After two answers and a
SKIP, `check_ins` still had 0 rows.

## Bodyweight — Lab 37 D2

**Where it lives (decided with the owner):** Lab 34's IA puts bodyweight under Load, and it stays
there. It is a pushed `/bodyweight` screen, reached from one BODYWEIGHT row on the Load root above the
calendar. The owner asked why other apps keep it in Settings. The answer: apps keep a single
bodyweight *value* in Settings (an input to calculations), and the weigh-in *log with a trend*
somewhere of its own, which is what D2 is.

**Data.** `body_weights` (`drizzle/0003_conscious_ink.sql`, journal `when` 1790627049213, above
0002's 1789361811503) is append-only and stores kilograms. The migration was applied on the phone
under a cold `pnpm expo start -c`, following the trap below. `logBodyweight` refuses anything outside
20–350 kg. That check sits at the trust boundary, since one stray digit would wreck every average and
the chart's y range. The table is in export and restore.

**Maths — `src/lib/bodyweight.ts`, tested.** One value per local day, where the latest reading wins.
The 7-day average covers today and the six days before it. The 30-day change is today's 7-day average
minus the 7-day average as of 30 days ago, and it is null when either side is empty (§0: a delta
needs a previous value). BY MONTH compares each month with the previous month that has readings.

**Departures from the board:**
- **Changes are drawn neutral, not green/red.** The 30-day change and the month changes are plain
  `color.mid` text, not `Delta`. Whether gaining weight is good depends on a goal the app does not
  know.
- **BY MONTH rows are unplated.** They are read-only, and §0 puts read-only rows on the canvas; the
  board plates them.
- **RELATIVE STRENGTH is omitted** (see the smaller-things list).
- **The board draws no way to log a weigh-in.** A "Log weight" action bar opens a sheet with one
  decimal field, in the unit the owner chose.

**`TrendChart`** (`src/components/trend-chart.tsx`) is the first Skia drawing in `src/`. Skia had
been in the native build since day one, unused. Use **`Skia.PathBuilder`**: `SkPath.moveTo/lineTo/
close` are deprecated in the installed version and log a warning per call. It is verified against
D2's own fourteen readings on `/dev/chart`. **The phone's real data has no weigh-ins**, and none were
invented to test it: the owner's first real weigh-in is the first real render.

**`Sheet` had no keyboard handling.** This is the first sheet with a text field, and on edge-to-edge
Android the keyboard covered the sheet completely. `Sheet` is now a `KeyboardAvoidingView` with
`behavior="padding"`, so every future sheet with a field gets the fix too.

**Backups were missing programs.** `programs` and `program_days` were in neither the export nor
`KNOWN_TABLES`, so a restore deleted routines, which cascaded away every program day, and left the
program rows orphaned. Both tables are now exported and restored in FK order. Older files still
parse, because a missing table means no rows. `EXPORT_VERSION` stays at 1, since bumping it would
make older builds refuse new files for no reason.

## The two charts on their screens

**Exercise detail — Lab 35 B2′ / Lab 39 Q1.** `exerciseE1rmQuery` (`src/data/queries/exercises.ts`)
returns the best stored e1RM per logged session for one lift, newest ten, `FROM sessions` so that
finishing a session refreshes it. `e1rmTakeaway` (`src/lib/e1rm.ts`) writes the label, e.g.
`UP 18 KG OVER 10 SESSIONS`, `DOWN …` or `UNCHANGED …`. It works from the whole-number display
values, so the label agrees with the numbers the chart prints. Two departures from the board:
**the x labels are real dates** (`sessionDateLabel`: `TODAY` only if the latest session really
was today) rather than `10 AGO`/`TODAY`, and **a lift with one session gets a sentence, not a
single column** (§0: a spark needs a series). Verified on Ab Wheel Rollout with 4 sessions.

**Program detail — Lab 34 A4.** The board draws `WK 1…WK 8` with future weeks at zero, but nothing
stores a cycle length. Decided with the owner:
- **Only elapsed weeks are drawn**, from week 1 to the current week, capped to the latest 8.
- **A column counts trained days, not sessions**, so it can be compared with the `N of D` printed
  above it, where D is the number of scheduled weekdays. Two sessions on one day are one day.
- **Sessions from before `startedAt` are not counted**, even when they fall in week 1.
- **It draws only for a running program in week 2 or later.** One column is not a series, and a
  paused program's WEEK tile is already `—`.

`trainedDaysPerWeek` (`src/lib/program.ts`) is pure and tested. One caveat: `programs.startedAt` is
never reset and no pause history is stored, so weeks a program spent paused draw as zero.
Verified on PPL 3-Day in week 4: `1 of 3`, with three empty weeks that draw no column.

## The column chart and the Load tab root

### `ColumnChart` — `kit.chart()` as a component

`src/lib/chart.ts` (`chartGeometry`, tested) holds the height maths; `src/components/column-chart.tsx`
draws it. Verified on the device against both boards that call `kit.chart()`, rendered side by side
on `/dev/chart`: Lab 34 A4 (sessions per week, `2 of 6`, h 54) and Lab 39 Q1 (estimated 1RM).
It takes no plate and no title — the `Section` label above it carries the takeaway.

**Three departures from a literal port, each found on the device:**

1. **A zero draws no column.** `kit.chart()` floors every column at 12% of the span, so on A4 the
   five future weeks with zero sessions drew a ~13pt bar beside an axis labelled **0** — an empty
   week reading as a light one. Decided with the owner: an exact `0` returns height 0, every non-zero
   value keeps the floor and scale unchanged, so Q1 renders identically. `§0 — a visual only when
   there is something real to draw.`
2. **The y labels are top-aligned.** The board's `align-items:flex-end` bottom-aligns the label
   column against a column that also holds the baseline and the x labels, which put the min label
   *below* the baseline it names. Top-aligned, the labels span the plot alone.
3. **Columns are `flex: 1`, not measured.** Measuring the plot with `onLayout` gave one frame of
   zero-width columns; flex divides the width with no state.

### Lab 37 D1 — the Load tab root

`src/app/(tabs)/load.tsx`: two tiles (SETS, VOLUME with a delta against last week — **no delta when
last week was 0**), WEEKLY SETS PER MUSCLE as `ZoneBar` rows, a DELOAD sentence, then the unchanged
month calendar (now labelled with the month name, since the header says "Load"). Verified on the
device on an empty week and on a week with one logged session.

**Decisions, all deliberate:**

- **Counting:** a muscle's weekly sets are completed, non-warm-up sets on exercises where it is the
  **prime** mover. Assist does not count.
- **Landmarks exist for five muscles** — chest 8/14/20, back 10/18/25, quads 8/16/20, hamstrings
  6/14/18, shoulders 6/16/22 — the board's numbers, in `src/lib/landmarks.ts`. A trained muscle with
  no landmark gets its count and **no bar and no verdict**: there is no denominator to draw against,
  and inventing one would be inventing physiology.
- **Verdicts are words**: TOO FEW / GOOD / HARD / TOO MUCH, never MEV/MAV/MRV. The marker is always
  near-white; colour lives on the count.
- **The deload rule is the design research's, not invented**: *"deload when weekly sets approach
  RP's MRV and a stall coincides"*. Near the ceiling = a landmarked muscle past `high`; a stall = a
  lift trained this week whose newest best e1RM does not beat the best of its two previous sessions
  (needs three sessions with an e1RM; a set past 12 reps has none, so it is never judged).
  Fewer than three sessions ever → *Too early to call.* The board's "probably week 5" is dropped —
  it is a guess, and a guessed number must not look like a measured one.
- **The reason never claims more than the data.** The first build said *"your lifts are progressing"*
  on a week with no sets at all. It now names the lifts that are actually climbing, says when none has
  three sessions of history, and says *Nothing to call yet* when nothing was logged. Tested.

### Tonnage never followed the weight unit

`formatTonnage` took kg and only ever printed `T`/`KG`, so Today, the summary, routine detail's
LAST THREE, the session rows and the calendar total all ignored the setting — as did `SessionRow`'s
`TOP` weight, which printed raw kilograms. It now takes the unit (`820 LB` / `18.9 K LB`; `T` means a
tonne and is not reused), and every caller passes it. `SessionRow` takes `unit` as a prop, because
components never read `src/data`. Only the dev database screen still prints kg.

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

**"Pick this up here" at the top of this file is the short version, with the first commands.** This
section is the phase-by-phase history behind it.

**Phase 6 is closed. Phase 7 is all but closed** — only the error boundary and the Maestro flow are
left on its shipping list.

1. **Phase 7 item 1 — done.** The predicates, the history reads, the Rail, `routine/[id]`'s LAST
   THREE and session detail (C3) are all built and device-verified. The `/history` list is
   **dropped**, not deferred — the IA has no room for it. The screen index board it asked for was
   published as `Lab 48 — Every Screen`, and the refinement pass that followed shipped seven fixes
   (see "The refinement pass").
2. **Today, Lab 45 W3 — done, and its last gap is closed.** The week strip, the next-routine card and
   the recent rail are on the device. `lab45.py`'s W4 column flagged a nested-gesture risk in the
   strip — a horizontally scrolling row inside a vertically scrolling screen — and it did not
   materialise: the strip scrolls and its cells stay tappable, the same answer the live screen got.
   **"Next" now reads the running program's schedule** and the strip draws missed days (see
   "Programs"). What is still missing here is only the **meter on SESSIONS**, blocked on Settings
   storing a weekly target.
3. **Settings — done** (Lab 37 D4). Units, default rest and the account row are on the device; export
   and restore are wired from there. Half the board is deliberately absent — see "Half the board is
   missing, deliberately".
4. **Programs — done** (Lab 34 A3/A4). See "Programs — Lab 34 A3 and A4". This closed the missed
   state on both the calendar and the week strip, and replaced `pickNextRoutine` wholesale.
5. **The six screens that remain, and the chart primitive that unblocks three of them.** Listed with
   their blockers in "Pick this up here". The chart is the next thing to build.
6. **The rest of Phase 7's shipping list.** An error boundary and the Maestro flow over routine →
   session → summary. Empty states and JSON export/import shipped.
7. **Phase 8 — sync.** The Postgres mirror, its RLS and the auth flow are all in place and verified;
   nothing pushes or pulls a row yet. Start from "The Supabase mirror" below.

**The Load tab root is still a placeholder in disguise** — the month calendar is sitting in the slot
Lab 37 D1 (volume and deload) is drawn for. Strength's root is the record timeline and wants the body
map (`body-map.md`) eventually; both were flagged at review as reversible judgement calls rather than
settled design, and both are still open on that basis.

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

## There is no history list, and that is the design's answer

Worth stating plainly, because a plan was written to build one and four independent reviewers
rejected it before the IA was consulted at all.

`lab34.py:204-217` is the only place the information architecture was ever settled: *"One thing had
to be decided before anything could be drawn, and it had never been settled: where these screens
live. The navigation locked at four tabs, and sixteen screens do not divide into four by accident."*
Today is home/next/readiness/the week; **Session is everything you plan or start from** — routines,
programs, the library; Strength is per-*exercise* history, PRs, standards, the body map; Load is
volume, deload, bodyweight, calendar.

**A flat list of every past session is not among the sixteen.** It was never drawn and never given a
tab. The design's answer to "show me my past workouts" is five surfaces at different zoom levels,
all of which open the same session detail:

| Surface | Board | Answers | Where |
|---|---|---|---|
| Calendar | C1 | take me to a date | Load |
| Week strip | Lab 45 W3 | how was this week | Today |
| RECENT rail | Lab 45 W3 | the last few | Today |
| LAST THREE | Lab 34 A2 | the last few for *this routine* | pushed, **built** |
| PR timeline | C4 | records over time | Strength |

So the calendar is the index and history is the recent list. `Lab 46` was drawn anyway (the gate
ruling at the time was "keep it, but board it first") and settled on **H2** — month-ruled, no month
summary, because monthly tonnage only restates the session count beside it. It stands as the answer
*if* a list is ever wanted; nothing needs it today.

**Do not put review inside the Session tab.** That tab is forward-looking by definition. An earlier
plan proposed reaching history from it and it was wrong twice over — by §0's IA and by the design
review, independently.

### The gap this exposed — closed by Lab 47

There was no single page anywhere saying *these are the screens, this is where each lives, this is
what is built*. Forty-six experiment labs and no index, so the IA had to be read out of a paragraph
buried in one board's intro — which is exactly how the drift above happened.

**`Lab 47 — The Design System` is that page**, and it is published. Not a build ledger — a
reference sheet, the thing you open to see what the app is made of before building a screen out of
it: the tokens as swatches (surfaces, state hues, both ramps, washes, hairlines), the full type ramp
at real sizes, the spacing law and radii drawn, every primitive in every state, the composition
rules drawn rather than written (the three containment levels, when a number earns a visual, a guess
against a measurement, empty states, the two vocabularies), and the interaction model (the live
screen's gesture map, the two routes into every value, the sheets, motion). It closes with **what is
deliberately absent** — the set strip, the ring's arc, bullet graphs, glass on Android, a history
list — so nothing cut gets re-added by accident.

It is generated from `kit.py` and from the real values in `src/theme/tokens.ts` and `type.ts`, so it
cannot drift from either. It holds **no screens**; those are Labs 33–37 and 43–46.

**A first cut of Lab 47 was a screen index** — every screen as a card with its board, tab, route and
build status. That was built, published, and then replaced: useful, but it answered "what is built"
when the gap was "what are the decisions". If the index is ever wanted back it is in the git history
at `e7ddc0a`.

**Two things it surfaced.** Three tab roots have no board: Today has Lab 45 W3, but nothing draws
what Strength or Load *open on* — both exist only as their contents (C4, B4 and D1, D2, C1), and
that has to be answered before either tab can be built. And `space.railAir` is still in
`tokens.ts` at 56 although §0 retired it and `Rail` takes `air` as a required prop; the token is
dead and should go.

---

## The refinement pass — what a board-versus-device audit found

2026-09-13. Every built screen captured on the phone and compared against its board, then the
findings put through CEO, design and engineering review (two independent voices each). Seven fixes
shipped. **Two of the seven were criticals the screenshot audit missed**, which is the lesson: a
screenshot proves what a screen looks like, never what it does.

- **The exercise screen shipped two dead buttons.** `<ActionBar primary="Add to routine"
  secondary="LOG" />` with no handlers — both props are optional, so the Pressables took
  `onPress={undefined}`, animated on press, and did nothing. Nobody had tapped them. Removed rather
  than wired: the screen only ever receives an exercise `id`, no routine context reaches it, and
  `LOG` had no destination at all. Same rule as Lab 35 B3's two toggles.
- **The sign-in screen promised a backup that does not exist.** It read *"Signing in only adds
  backup and a second device."* There is no sync code — `supabase.ts` is imported by three files and
  every `.from()` in `src/data/` is Drizzle against local SQLite. The copy now says what signing in
  actually does. `supabase.ts`'s own docstring made the same overclaim and was corrected too.
- **Routine detail's headline was wrong by 6×.** `EST. TIME` and `VOLUME` were read from
  `sessions[0]` while `EXERCISES` and `SETS` described the plan, so the block showed `1.6 T` — an
  abandoned two-set session — for a routine whose plan is 10.5 T. The tiles are now `LAST TIME` and
  `LAST VOLUME`. **Computing the plan figures was considered and rejected**: planned tonnage is
  undefined for bodyweight, assisted and unilateral lifts and the schema cannot express the
  difference, and `sets × (work + rest)` is a guess. The labels were the bug; the data was fine.
- **94 of 302 exercises printed the same text twice.** exercises-dataset publishes `instructions.en`
  (a paragraph) and `instruction_steps.en` (that paragraph split on sentences) and the seed stored
  both, so the exercise screen showed the procedure as prose and again as a numbered HOW TO. Every
  row with both was verbatim identical — 94/94, not an edge case. `src/lib/prose.ts` compares on
  letters and digits alone and drops the paragraph when it only restates the cues;
  `build-seed.mjs` stops emitting it.
- **An absent tile value was bright on one screen and dim on another.** The summary already dimmed
  its em dash; routine detail did not, on one of two branches. `StatTiles` now decides, and the
  summary's ternary is gone — one place instead of three.
- Custom-exercise field values were upper-cased (`BARBELL`), which flattens the mono-caps-label over
  sentence-case-value contrast that is the whole Field component. Now `Barbell`.
- Session detail gave every un-lifted exercise a full 46pt section saying "No sets logged." three
  times over. One `NOT LIFTED` section names them instead.

### A migration that would have silently done nothing

The duplicate prose was first going to be fixed with a corrective `drizzle/0002` emitted by
`build-seed.mjs`. **That would have failed silently.** Drizzle decides whether a migration has run
by comparing the journal's `when` against the maximum `created_at` in `__drizzle_migrations`
(`sqlite-core/dialect.js:696`, `expo-sqlite/migrator.js:16` — `folderMillis` *is* `when`). The
journal's timestamps are **already out of order**: `0000` is `1788757349078` and `0001` is
`1788745400000`. `build-seed.mjs` pins `STAMP = 1788745400000`, so a 0002 reusing it would compare
`1788757349078 < 1788745400000` → false, write nothing, and throw nothing.

**If a data migration is ever needed, its `when` must be a fresh constant greater than every
existing entry, hard-coded and never re-derived from `STAMP`** — and it must be registered in both
`drizzle/meta/_journal.json` *and* `drizzle/migrations.js` (an `import m0002` plus the map key), or
startup fails with "Missing migration".

### Findings investigated and rejected

Recorded so they are not raised again. C3's first section has no air above it — **matches the
board**, measured 29 dp app against 34 dp board. C2's `-84.4%` delta has one decimal — the boards
use both `+4%` and `+4.9%`, so there is no convention to violate. B3's field plates look too tall —
63 dp app against the board's 76 dp. B2's bottom clearance looks generous — that is
`space.between + useActionBarHeight()` working, confirmed by scrolling to the CC BY-SA line.

One claim from review was checked and **found wrong**: that the summary screen also showed a bright
em dash. It did not; `summary/[id].tsx` already dimmed it. Only routine detail was affected.

### Left open by this pass

- **Export still does not exist, and all four review voices ranked it above this entire pass.** The
  phone is the only copy of every session. The sign-in copy no longer claims otherwise, which closes
  the false-safety half of the problem and none of the real one.
- **The orientation prose the board asks for exists in no data source.** Dropping the duplicate makes
  the exercise screen self-consistent; it does not write the "what this lift is and why" paragraph
  Lab 39 Q1 draws.
- **What "completed" means is unsettled.** An abandoned two-set session still drives a `-84.4%`
  delta on the summary and a LAST THREE row. Which metrics include partial work, and what a delta
  compares against, will compound as the Strength and Load tabs get built.
- **Summary's empty path**: an abandoned session renders `WHAT YOU LIFTED` as a label and a hairline
  over nothing.
- **Assisted Chin-up still types as ISOLATION.** One voice argued for reopening it, since `kind`
  drives default rest and whether e1RM means anything. Held for a data pass, not a screen pass.

---

## Export — shipped and device-verified

Both review voices ranked this above every remaining screen (see "Left open by this pass" above),
and it is what closed that gap.

`src/lib/export.ts` is pure and tested. `EXPORT_VERSION = 1` and `EXPORT_FORMAT = 'jymiq-export'`
identify the file; `buildExport(tables, {now, appVersion})` wraps every table in one envelope with a
`counts` map so a reader can sanity-check the payload without walking it, and `totalRows(envelope)`
reads that map back. `exportFileName(now)` gives `jymiq-2026-09-13-1042.json` — local time, minute
precision, so two exports on one day cannot collide.

`src/data/queries/export.ts` is the one impure half: `readAllTables()`, synchronous on purpose —
`expo-sqlite` reads sync, the whole database is a few hundred KB, and an async read would only add a
spinner to something that finishes inside the frame. The eight table names are the wire format: they
land in the file as keys, so renaming one is a version bump. Nothing is filtered — the 302 seeded
exercises go in too, even though a fresh install reseeds them identically, because a self-contained
file needs no reasoning about which slugs a future seed keeps.

The UI lives in `src/app/sign-in.tsx`, and renders on every branch of that screen including the one
where Supabase is not configured — which is precisely the build with the most to lose, since it has
no other copy of its data anywhere.

**Storage Access Framework, not a share sheet:** the user picks a real folder and the file stays
there. It needed no new native module — `expo-file-system` is already linked — so it shipped on a
Metro reload rather than a six-minute Gradle build.

**The SAF gotcha worth recording.** Android 11+ refuses a SAF directory grant on the root of shared
storage and on `Download`. A picker opened at the root greets you with "Can't use this folder" and no
obvious way forward. `Documents` is grantable, so the picker opens at
`saf.getUriForDirectoryInRoot('Documents')`. A bad initial URI is ignored by the picker rather than
failing, so that is safe even if the folder does not exist.

The chosen folder is remembered in `expo-sqlite/kv-store` under `export.directoryUri`, so the second
export is one tap. A grant can be revoked and a folder can be deleted, so a failure on the remembered
folder is expected rather than exceptional — the code falls back to asking again rather than
reporting an error.

**Proven on the physical device: 1,223 rows, 266 KB.**

**The remembered folder does not survive a cold start, and that is not a bug in this code.** The
grant is remembered — the URI is still in `kv-store` — but the first `createFileAsync` against it
after the app is force-stopped throws, the fallback fires and the picker reappears. So the first
export of a session costs the picker, "USE THIS FOLDER" and an "Allow Jymiq to access folder?"
dialog; every export after it in the same run is one tap. The fallback is what makes that a
three-tap annoyance rather than a failure, which is the argument for having written it that way.
What would close it is taking a persistable URI permission at grant time; `expo-file-system`'s
legacy SAF wrapper does not expose one.

---

## Restore — shipped this session

`src/lib/import.ts` is pure, 18 tests. `parseBackup(raw)` returns `{ok:true, backup}` or
`{ok:false, reason}`, and every `reason` is a sentence a person can act on. It refuses a file whose
`version` is *newer* than this app's — a file from a future version may carry a shape this reader has
never seen — but accepts an older one. It checks every table's row count against the envelope's own
`counts` map and refuses a mismatch as "truncated or damaged". `describeBackup(b)` renders
`"3 sessions · 42 sets · 1 routine · 18 records — exported 13 Sep 2026"` — deliberately not every
table, because reciting join rows ("841 exercise_muscles") makes the summary read like a schema dump
rather than an answer to "is this the right file".

`backupFiles(uris)` is new this session, pure, tested. Storage Access Framework hands back
percent-encoded document URIs
(`content://…/document/primary%3ADocuments%2Fjymiq-2026-09-13-1042.json`), so the display name has to
be decoded out of the tail. The filename stamp is year-month-day-hourminute, which sorts
lexicographically in chronological order, so newest-first needs no date parsing.

**No new dependency was added.** There is no `expo-document-picker` in this repo, and a file-open
picker was not worth one: restore lists the `jymiq-*.json` files already in the remembered export
folder via `StorageAccessFramework.readDirectoryAsync`, and you tap the one you want. The folder you
export into is the folder you restore from.

`src/data/queries/import.ts` — `restoreBackup(tables)` is the write path and the only impure half.
**Restore replaces; it does not merge.** Merging was rejected because the ids are identical on both
sides, so a merge is either a no-op or a silent pick-a-winner, and neither is something you can reason
about at the moment you most need to.

It runs as one `db.transaction`. Foreign keys are on and `exercise_muscles` has a composite primary
key, so a partial insert is a real failure mode. Deletes walk the table list backwards (children
first) and inserts walk it forwards; the order is `KNOWN_TABLES` itself, re-exported as
`RESTORE_ORDER`, because that list is already in dependency order and there must not be a second copy
of it to drift. Inserts are chunked at 60 rows — SQLite binds one variable per column and `sets` has
fifteen, so 60 rows is ~900 variables, under the 999-variable floor older builds compile with.
Exceeding it fails as "too many SQL variables" mid-transaction.

**The safety design, which is the point of the feature.** Restore is the one genuinely destructive
operation in this app. Three steps, and nothing is written before the third: (1) list the folder —
nothing read, nothing written; (2) tap a file, which reads and parses it and raises a confirm that
names what the file *holds* via `describeBackup`, rather than asking "are you sure" about a filename;
(3) on confirm, the current database is exported to a rollback file in the same folder first, and
only then is the transaction run. If the rollback export fails or is cancelled, nothing is deleted.
If the transaction throws, it rolls back and the database is untouched — the failure note says so.

**No migration was used, deliberately.** A Drizzle migration whose journal `when` is not greater than
every existing entry silently never runs — this trap is already recorded above, in "A migration that
would have silently done nothing"; cross-reference it rather than restating it in full.

**Verified on the physical device, as a round trip.** Baseline 302 exercises · 1 routine ·
3 sessions · 42 sets · 18 records. Export wrote `jymiq-2026-09-13-1913.json` at 1,223 rows; the
confirm read back "3 sessions · 42 sets · 1 routine · 18 records — exported 13 Sep 2026"; cancelling
it wrote nothing; replacing wrote 1,223 rows and a rollback file, `jymiq-2026-09-13-1914.json`,
alongside. The five counts after the restore are identical to the five before it, and both new tab
screens re-read the restored rows and render.

**And verified on `jymiq-a` from an empty database — the path a real recovery takes.** A fresh
install has the 302 seeded exercises and nothing else, so Records read "No records yet. Log a session
to set your first one." over two dim zero tiles, and the calendar drew the full month grid with today
ringed and "Nothing logged this month. Start a session and it lands here." under it. Both are what §0
asks for: a component that will fill in stays visible and dim rather than hidden. Restoring the
phone's own backup file on that device wrote the same 1,223 rows and the two screens then rendered
*identically to the phone* — same eighteen records in the same order, same filled 7 September, same
"Trained 1 of 30 · volume 22.6 T". Reproducing one device's database on another is the strongest
statement the round trip can make, and it is only reachable because the emulator's database starts
empty.

**One defect the round trip found, and a screenshot would not have.** The section's prose line is the
only feedback this screen gives, and it sat *under* the list of backup files. A list of two backups
is tall enough to push it off the bottom of the screen, so a cancelled restore said "Restore
cancelled. Nothing was written." into empty space below the fold — the one message whose whole job is
to reassure you that nothing happened. The line now renders above the list, which is fixed in place.

---

## Settings — Lab 37 D4, and smaller than the board

The gear in the Today header used to open sign-in. §0 says the gear **is** Settings, and now it is.
Storage was decided long ago (`expo-sqlite/kv-store`) and unwritten; `src/data/settings.ts` writes it.

**Read synchronously at launch, and that is the design.** `kv-store` has a sync API, and settings
decide how the first frame renders — a weight in kg or lb. An async read would make every screen
either flash the wrong unit or grow a loading state for a value already on disk. It is a module-level
store behind `useSyncExternalStore` rather than a provider, because mutations need it too:
`resolveRestSec` runs inside a database transaction, nowhere near React.

The defaults are today's hardcoded behaviour exactly, so opening Settings for the first time changes
nothing, and `coerceSettings` is tolerant per key — one unreadable value falls back alone rather than
resetting the other four or taking the app down.

### Half the board is missing, deliberately

The board draws DISTANCE and LANGUAGE rows, a PLATES section with a colour scheme and a plate-maths
switch, and a warm-up ramps toggle. None of them shipped, because none has anything to act on: no
screen renders a distance or a second language, and `solvePlates`, `warmupRamp` and `PLATE_COLORS`
are pure functions with tests and **no caller anywhere in the app**. A switch that toggles nothing is
worse than a missing switch, and this project has already shipped two buttons that rendered perfectly
and did nothing. They arrive with the features they configure.

What shipped is five controls that all do something: the weight unit, Track RPE, both rest defaults,
and Tap-opens-the-keypad. An ACCOUNT row was added that the board does not have, because the gear no
longer opens sign-in and export and restore had to stay reachable.

### The weight unit stops at the live screen, and that is a rule

Kilograms are what the database stores, always; pounds are a display transform. Every number the app
*reports* now follows the setting — history, summaries, records, routine targets, the sets table and
its column headers.

**The live screen stays kilograms whatever Settings says.** It is the instrument: the tape's scale is
§0's, 20–140 by 2.5, and those steps are the plates that go on the bar. A pounds scale needs
increments §0 has not decided, and converting only the readout would put 220.5 above a tape reading
100 — two units for one number, on the one screen where the number matters most. So the rule is: you
dial the kilograms you load, and you read your training back in your own unit. The keypad and the
sets sheet are part of that instrument and stay kg with it.

Two things the conversion turned up:

- **`formatPrValue` had no unit**, so the Records timeline still printed kilograms after the setting
  flipped — the feature looked wired and was not. It takes one now, and it must never convert
  `most_reps_at_weight`: four of the five categories are kilograms, one is a rep count, and running
  that through the weight transform turns 8 reps into 17.6.
- **Pounds now print to one decimal, kilograms to two.** 102.5 and 1.25 are real plates; 231.485… is
  a conversion artefact, and 231.49 claims a precision the number never had.

**Open: tonnage stays metric.** Session and week volume still read `22.6 T` in either unit. A tonne
is a metric unit and the boards print T; the honest alternative has not been drawn.

### Verified by tapping

Every control was exercised on the device. The unit flip reached the Records timeline (105 → 231.5),
Track RPE put the RPE parameter on the live screen, the rest picker wrote 4:00 and the toggles held.

**The rest default is wired but was not observable on this data, and that is correct behaviour rather
than a gap.** Rest resolves routine → exercise → settings, and every lift in the only routine on the
device pins its own `rest_sec`, so the routine wins and the setting never applies. The fallback is
covered by a unit test; the device could not show it without a routine that leaves rest unset.

---

## Today, at last — Lab 45 W3

The tab the app opens on stopped being a hardcoded NEXT card and a list of dev links. Three blocks,
and the two that needed new primitives are new.

**The next-routine card is Lab 44 U4** — the quiet raised plate with the accent spent on a full-width
Start inside it, rather than U3's filled accent slab. It keeps the card's text on the normal ramp,
never has to solve the contrast inversion, and leaves the tab bar's start button as the only other
accent fill on the screen.

**"Next" was a heuristic; it is the schedule now.** This shipped reading `pickNextRoutine` — the
routine trained least recently — as an explicit stand-in for a plan nothing stored. Programs store
one, so that function is **deleted rather than kept as a fallback**: two rules for what "next" means
is how the card ends up disagreeing with the strip beside it. The card reads
`nextScheduled(activeSchedule)`, its kicker says `TOMORROW · LAST RUN 6 DAYS AGO`, and with no
program running it says *Nothing scheduled* and offers MAKE A PROGRAM. See "Programs — Lab 34 A3
and A4".

**The week strip is `src/lib/week.ts` plus `src/components/week-strip.tsx`.** Three whole Monday-first
weeks ending on this Sunday — §0 bounds it to two weeks back, and whole weeks are what keep the
M T W T F S S rhythm legible once it moves. Scrolling is also why the date is on the cell at all: a
row of weekday letters cannot say *which* Tuesday. The strip bleeds past the 22pt margin through the
same `ChipStrip` pattern the library filters use, so a cell cut by the screen edge reads as "more
that way". Every cell reserves a 14 × 26 bar box: the fill is the graph, and a rest day keeps a 4px
stub so the row never has a hole in it. The scale is **relative to the days in view** (§0), which is
why the tonnage stays printed in the tile underneath.

Scrolling to today needed no offset arithmetic. The strip ends on this week's Sunday, so today is at
most six cells from the right-hand end and always inside a 411pt screen — `scrollToEnd` on the first
content-size change is the whole of it.

**The strip draws missed days**, on the same rule as the calendar — a past day the running program
put a routine on and you did not train rings its numeral; a day with no routine on it keeps its rest
treatment. With nothing running, every untrained past day is rest again. One predicate
(`isMissed` in `src/lib/program.ts`) serves the strip, the calendar and A3's own day strip.

**SESSIONS ships without a meter, on purpose.** Lab 45 draws it as 3-of-4 against a weekly target.
There is no weekly target stored anywhere, and §0 is explicit that a meter needs a real denominator —
so the tile ships plain rather than wearing a proportion of nothing. VOLUME keeps its delta, because
last week is a real previous value. Add the meter when Settings can store a target.

The DEV links did not survive into the design, but the gates behind them (`/dev/kitchen-sink`,
`/dev/gestures`, the type ramp) are the only record of Phases 1, 2 and 6 and nothing else links to
them. They are now wrapped in `__DEV__`: present in this build, absent from a release one.

### Four things the device said, and `pnpm check` did not

All four rendered perfectly and all four were wrong.

1. **The header read `TODAY` instead of `SUN 13 SEP`.** `sessionDateLabel` collapses the current day
   to the word "Today" — correct for a rail row, exactly wrong for a header whose whole job is to say
   which day it is. Split out `dateLabel`, which never returns a relative word.
2. **The rail printed `7364 MIN`.** `formatSessionDuration` has had a plausibility ceiling since the
   session-left-open bug; `formatMinutes` never did, so every caller had to remember to gate — and the
   new one did not. The guard is now `isPlausibleDuration`, a predicate both of them go through,
   rather than a `=== '—'` test on a formatted string.
3. **The week strip did not scroll.** It was built with the bleed margins but as a plain `View`, so
   twenty-one 46pt cells simply overflowed and clipped. A screenshot of the current week looks
   identical either way.
4. **Start would have thrown.** `startSession` refuses when a session is already in progress, and the
   new button called it bare — routine detail has always wrapped it in a try/catch and an Alert. An
   uncaught throw in an `onPress` is a red screen, and no test or typecheck sees it.

**Verified by tapping, not by looking.** A strip cell opens that day's session detail; the strip
scrolls back through the two earlier weeks and cuts the cell at the screen edge; Start created the
session with the plan already dialled in (`SET 1 OF 5`, 100 kg × 8 from last time) and handed over to
the live screen. The test session was then cleared by restoring the rollback file written earlier in
the session, which put the database back to 302 / 1 / 3 / 42 / 18 — the restore feature paying for
itself the same evening it shipped.

---

## Leaving a session, and the app's own dialog

### What happens when you walk away

Two exits have always existed — the back chevron and "Finish session" — and **both kept the
session**. `abandonSession` writes `status = 'abandoned'` with totals and stops; nothing in the app
deleted a session, anywhere. `isLoggedSession` treats abandoned as history, so a session started by
mistake and abandoned with nothing logged still appeared in the RECENT rail, still counted as a
trained day on the calendar and the week strip (`trainedDays` deliberately counts a session with no
volume — "it happened, so an empty cell would be a lie"), and still drove the summary delta. An
accidental Start was unrecoverable in-product: clearing one cost a database restore, which is exactly
how the first one got cleaned up.

The policy now, decided by the user:

- **Nothing logged → discarded, no question asked.** Every planned set exists as a row from the
  moment the session starts, so a session opened by mistake is indistinguishable from one you are
  three sets into until you read `completedAt`. With none of them logged there is nothing to keep,
  nothing to summarise and nothing to ask about.
- **One logged set or more → the user decides.** Both answers are defensible at that point, so the
  dialog offers Discard alongside Finish and names the count.

`discardSession` is the first and only thing in the app that deletes a session. One `delete` does it:
`session_exercises` cascades from `sessions`, `sets` from `session_exercises`, and
`personal_records.session_id` too — which is what makes discarding retract the records it set,
exactly as the append-only design intends. Only an `in_progress` session can be discarded; history is
not deletable from here.

`countLoggedSets` is deliberately **not** `countWorkingSets`: that one drops warm-ups because they
inflate a volume delta, and a session whose only logged set was a warm-up is still a session you did
something in. Confusing the two would silently delete it.

**One bug this shipped with for about ten minutes, caught on the device.** `useLiveQuery` hands back
an empty array while a query is in flight, which is indistinguishable from "nobody logged anything",
and the delete branch reads exactly that count. An early tap would have destroyed a real session's
work with no dialog. The zero branch is now gated on `updatedAt !== undefined` — the loading signal
AGENTS.md already documents, and which this codebase keeps walking into.

**A second one, same class.** `router.back()` after discarding strands you on the live screen's empty
state with a "GO_BACK was not handled" warning: every route into `/live` uses `replace`, so there is
nothing behind it. Three call sites and the two empty-state headers now `replace('/')` instead.

Verified on the device, all three branches, with the database returned to 302 / 1 / 3 / 42 / 18
afterwards: Finish with nothing logged returns to Today silently and leaves no row; Finish with one
set offers Finish / Discard / Not yet and names "1 logged set"; the back chevron offers Discard /
Keep going and says what will be deleted. Discard from either removed the session and its set.

### Loading is now in the type, because writing it down did not work

`useLiveQuery().data` is `[]` **both** while a query is in flight and when it genuinely matched
nothing; `updatedAt === undefined` is the only thing separating them. That is in `AGENTS.md`, and
writing it down has not been enough — `data ?? []` is shorter to type and reads as correct. An audit
found the same mistake in five places, three of them shipped:

1. **The live screen counted logged sets off an unloaded query** and would have deleted a session
   with work in it. Found and fixed within the hour, above.
2. **Today decided "No routines yet" from an unloaded list**, so the tab the app opens on flashed its
   empty state on every launch.
3. **Start refused with "Add an exercise first"** — on Today and on routine detail — for a routine
   whose lifts had simply not arrived yet. Not a flash: a wrong refusal of a valid action.
4. **The live screen accused a full session of being empty** for the frame before its exercises
   landed.

None fail as an error. They fail as plausible, confident, wrong answers, which no typecheck, lint or
test sees.

`src/data/live.ts` adds `useRows`, which returns **`null` until the query has answered** and an array
once it has. Anything that branches on the rows being empty now has to say what it does about `null`,
because `null` is not an array and `tsc` will not let it pretend otherwise. `useLiveQuery(...).data ??
[]` is still right where nothing branches — a list the screen only maps over should render empty for a
frame and then fill.

**No skeletons, deliberately.** SQLite reads here finish inside a frame or two, and §0 asks what an
element indicates: a placeholder that flashes for 16ms indicates nothing and is noise. The loading
state's job in this app is to stop the screen *asserting* something false, not to be drawn. A
component that will fill in stays visible and dim; a **claim** about the data waits for the data.

---

### `Alert.alert` is gone

The native dialog was the one surface in the app drawn by someone else: Material type, Material
spacing, a blue that is not in the palette, and — on the three destructive flows — no way to make
"Discard" look different from "Keep going". §0 says the accent must not appear twice at size and that
a lapse and a rest day must not look alike; a platform dialog can honour neither.

`src/components/dialog.tsx` is a provider plus a `useDialog()` hook, imperative on purpose: all
sixteen call sites fire from event handlers, and a declarative `<Dialog open={…}>` would have put a
piece of transient state in every screen that asks a question. It is built from vocabulary that
already exists — the sheet's scrim, a grouped plate, the row-plate idiom for anything you touch
(Lab 42), the text ramp, `chromeShadow` because a dialog is chrome. The one decision §0 has no word
for is which action is destructive; that is carried by `live`, the palette's red.

Actions stack full-width at 44pt rather than sitting in a row of text buttons, so two actions and
three read the same, and the order inverts from the platform's: **affirmative or destructive first,
cancel last**, because a vertical stack is read top-to-bottom.

**It is a real `Modal`, and only because of the back button.** As an absolutely-positioned overlay it
registered a `BackHandler` subscription, and the live screen's own handler has no dependency array —
so it re-subscribed on every render and became the most recent listener the moment a dialog opened.
Back then dismissed the dialog *and* fell through, which on the finish flow opened the discard
confirm behind it. Android routes back to the focused modal through `onRequestClose`, which is
deterministic; subscription order is not.

**Not yet drawn.** The dialog has no board. It should not get one alone — the next design pass is the
whole state vocabulary (loading, empty, error, success, warning) in one lab, and boarding the dialog
by itself means drawing it twice.

---

## Two tab roots got their screen

Lab 47 flagged that Strength and Load had no board for their tab *root* — both existed only as their
contents (see "Two things it surfaced" above). Both are built now, and both are a judgement call, not
a settled design: putting Records and the Calendar there is reversible and should be flagged as
unresolved rather than as closed.

**Strength tab = the record timeline, Lab 36 C4.** `src/app/(tabs)/strength.tsx` +
`src/data/queries/records.ts`. Every personal record in order, newest first, on the Rail — which §0
reserves for anything chronological. Two stat tiles above it (THIS MONTH, THIS YEAR). The rail dots
are **age buckets, not an index ramp**: 0–2 days accent, 3–6 tick3, 7–12 tick2, older tick1. With
twenty rows an index ramp is tick1 from the fifth row down and the dot stops carrying anything half a
screen in. `Rail` takes `air={26}`.

One trap caught in review and worth recording: the row type was first written as
`type Record = Awaited<...>`, which shadows TypeScript's built-in `Record<K, V>` utility inside that
file. It is named `PrRow` now and carries a comment saying why.

**Load tab = the month calendar, Lab 36 C1.** `src/app/(tabs)/load.tsx`, `src/components/calendar.tsx`,
`src/lib/calendar.ts` (pure: `monthGrid`, `trainedDays`), `src/data/queries/calendar.ts`. The grid,
the query range and the header title all come out of one `monthGrid()` call, so they cannot disagree
about which month it is. A month summary is one line of text under it, not a second chart competing
with the grid for the same attention. Tapping a trained day opens `/history/[sessionId]`.

**That departure is closed.** The calendar shipped with no missed state, because §0's
rest-versus-missed rule needs to know which days you were *supposed* to train and nothing stored a
plan by weekday. Programs store one now — see "Programs — Lab 34 A3 and A4" below — so a past day
the running program put a routine on, and you did not train, drops its rest plate and rings its
numeral.

---

## Programs — Lab 34 A3 and A4, and the three departures they close

Built and device-verified: a program is created, given a weekday schedule, activated and paused on
the phone, and the whole of it was driven by `adb shell input tap` with a screenshot after each step.

**What a program is: seven weekday slots, each a routine or rest.** `programs` (name, note, status,
`started_at`) and `program_days` (`program_id`, `weekday` 0–6 Monday-first, `routine_id`, composite
primary key). A weekday with no row *is* rest — absence is the rest state, so there is no nullable
routine column meaning two different things, and clearing a day is a delete.

**At most one program runs**, enforced by `idx_programs_one_active`, a partial unique index on
`status` — the same trick `idx_sessions_one_live` already uses for the live session. `activateProgram`
therefore pauses the incumbent and activates the new one **inside one transaction**: activating first
throws against that index and would leave the old program running while the screen had already moved
on.

**`started_at` is what keeps the missed state honest.** It is written on first activation and never
reset. Nothing earlier than the day a program started can be a lapse, so activating a program today
does not retroactively accuse you of missing every Monday since January. `isMissed` is one function
(`src/lib/program.ts`), and the calendar, Today's week strip and A3's own day strip all call it —
one rule, one place, three screens.

### The three departures, closed

- **The calendar and the week strip draw missed.** §0: rest is a plate, missed carries a ring. A past
  day the running program scheduled and you did not train drops its rest plate and rings its numeral;
  a day with no routine on it keeps the plate and stays rest. With no program running the schedule is
  empty and every untrained day is rest again, which is the honest answer rather than a fallback.
- **Today's card reads the schedule.** `pickNextRoutine` — "the routine trained least recently" — is
  **deleted**, not kept as a fallback. Two rules for what "next" means is how the card ends up
  disagreeing with the strip beside it. With nothing running the card says *Nothing scheduled* and
  offers MAKE A PROGRAM, which is an action, not an apology.

**One ring means one thing.** The calendar first drew missed as a ring around the whole cell, which
collided with the ring that means *today* — two rings, two meanings, one grid. The cell ring is now
today's alone and missed rings the numeral, which is also what §0 and Lab 45 actually say ("a ring
under the number") and what the week strip was already doing.

### What is not built, and why

- **No fixed cycle.** §0 calls a program "routines scheduled by weekday **or fixed cycle**". Only the
  weekday half is stored: a cycle needs a length, a start and a position, and none of those has a
  screen. The cost is visible on both boards — A3's `WEEK 3 / 8` pill loses its denominator and reads
  `WEEK 3`, and A4's two tiles ship plain, because §0 is explicit that a meter needs a real
  denominator. A3's `14 OF 48 SESSIONS DONE` is a cycle figure too; it reads `N OF 7 DAYS SCHEDULED`,
  which is a number the schedule already holds.
- **A4's SESSIONS PER WEEK chart.** `kit.chart()` has no React counterpart, and §0's chart rules are
  strict enough (y min and max anchored, first and last x labels, latest mark in the accent, its
  value printed, a title stating the takeaway) that this is the wrong screen to settle the primitive
  on. Lab 35 B2′ needs the same component and should be where it is designed. **Deferred, not
  dropped.**
- **The weekday rows carry no grip.** The board draws one, but seven weekdays do not reorder, so the
  grip would be a control that does nothing — the rule that already removed the exercise screen's two
  dead buttons and Lab 35 B3's two toggles. Tapping a row opens a routine picker as a chip row
  expanding inside the row's own plate, the idiom the custom-exercise form uses.
- **A4's action bar adapts rather than showing a dead Start.** `Start <routine>` + `PAUSE` when the
  program is running and today has a routine on it; `Pause program` when it is running and today is
  rest; `Activate program` when it is paused. Activating with nothing scheduled opens a dialog rather
  than silently doing nothing.

### Two defects only a tap found

Both passed format, typecheck, lint and 135 tests, and neither is visible in a screenshot of the
screen that has them.

- **The active program was not a target.** A3's NOT RUNNING rows navigated and the one you actually
  use did not, so the running program had no route to its own detail — which is where pause and the
  schedule live. The plate is the target now, with a chevron so it says so.
- **The Session tab root had two sections both labelled PLAN** — the header kicker and the section
  carrying Programs and Library. Split into `PROGRAMS` and `EXERCISES`.

### A hand-edited migration timestamp and a warm Metro

`drizzle/0002_programs.sql` is the first migration this project added by hand, and the trap recorded
under "A migration that would have silently done nothing" was avoided — and then a second one,
unrecorded, cost the session twenty minutes.

The journal's `when` was hand-set to a fresh constant above every existing entry. **Metro was already
running, warm, from before the edit**, and the bundle it served carried the *pre-edit* journal. So
the device ran the migration under drizzle-kit's original timestamp and recorded that in
`__drizzle_migrations`. Every launch after that compared the new journal value against the older
recorded one, decided 0002 was still pending, re-ran it, and failed with ``table `programs` already
exists`` — on a database where the tables were in fact correct and every row of real training data
was intact.

**The rule: a hand-edited `_journal.json` needs `pnpm expo start -c`, exactly like a babel or metro
config change.** The journal is a JSON import and a warm bundler will keep serving the old one. The
fix here was to pin the journal to the timestamp the device had actually recorded, which is still a
hard-coded constant greater than every earlier entry, so the original trap stays closed.

That failure was only diagnosable because the error screen now prints `error.cause`. Drizzle throws
`Failed to run the query '<the whole SQL>'` and puts the reason SQLite gave on `cause`, so the screen
used to say a migration failed without ever saying why. `src/app/_layout.tsx` prints both now.

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
- **Export and restore are done — see "Export" and "Restore" above.** Both CEO voices, independently,
  had argued that the real existential risk to this project was not a missing feature but **data
  loss**: there is no sync (Phase 8), so a wiped phone with no export ends the app and every session
  in it. That risk is closed for a phone the user still holds; it is not closed for a phone that is
  lost or destroyed before an export is taken, which is what Phase 8 sync is for.
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
- **Settings storage is written** — `expo-sqlite/kv-store` behind `src/data/settings.ts`
  (`useSettings()` in React, `getSettings()` outside it), read synchronously at launch. The weight
  unit reaches every reported number. What is still hardcoded is the plate palette, because
  `PLATE_COLORS` has no renderer — see "Half the board is missing, deliberately".
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

## Cloud backup — Phase 8

**Scope, decided with the owner:** cloud *backup and restore*, not multi-device sync. The phone stays
the source of truth. **Not pushing the whole database each time was the owner's requirement**, so
the design records changes as they happen.

**Local (migration 0005, `when` 1790638682525).**
- `sync_queue` holds at most one entry per row (unique on table and key, `INSERT OR REPLACE`), so the
  newest operation wins and every re-queue gets a fresh autoincrement id.
- 36 triggers (insert, update and delete on each of the 12 synced tables) fill it. Built-in
  exercises and their muscles are excluded, since every install already has them.
- The queue is bookkeeping and is **not** in export or restore. Existing data predates the triggers,
  so the very first push calls `enqueueEverything()` once.
- Cascade deletes fire the child triggers, so a deleted routine queues its children's deletes too.

**Push (`src/data/sync.ts`).** `pushNow()` is single-flight. It reads up to 500 queue entries,
`planPush` orders them (upserts parents first, deletes children first), rows are read fresh from
SQLite, upserted in chunks of 200 with `onConflict user_id,<key>`, and **only the entry ids it sent
are cleared**, so an edit made mid-push keeps its fresh-id entry. An error leaves the queue intact and
records `lastError`. It never throws. Deletes are hard deletes remotely; `deleted_at` stays null.
`syncSoon()` (a 3 s trailing debounce) runs when the app returns to the foreground, after a session is
finished, abandoned or discarded, and on sign-in.

**Pull and restore.** `pullAll()` pages each table (PostgREST caps at 1000 rows) and adds the local
**built-in exercises back in**, because `restoreBackup` replaces every table and the cloud holds no
built-ins. `restoreFromCloud` downloads first, then writes the rollback file, then restores, so a
failed download or a failed rollback changes nothing. It clears the queue afterwards, because the
restore's own trigger writes just re-queue rows that already match.

**Account screen.** A status line (`Backed up just now`, `N changes waiting`, or the last error), a
**Back up now** row and a **Restore from cloud** row. The old copy saying signing in backs nothing up
was replaced, and so were the two stale code comments that said the same.

**Verified on the phone, 2026-09-28:** migration 0005 applied and all 36 triggers exist. A real Google
sign-in completed (**the return leg is confirmed working**). The first push then wrote every row:
routines 1, routine_exercises 4, programs 1, program_days 3, sessions 4, session_exercises 16, sets
56, personal_records 18, body_weights 1, check_ins 1, custom exercises 0 — **every count identical to
the phone**, the queue left at 0, total lifted volume identical (33,080 kg), and the weigh-in and
check-in identical.

**Not verified.** (1) An *incremental* push: nothing was edited afterwards, so only the full first
push has been observed. (2) **Restore from cloud** — it is destructive, and the phone's real data is
the only copy of some state. The safe way to test it is a wiped phone or the emulator after signing in.

**Known limits.** One phone at a time: two phones pushing would overwrite each other's rows, and
nothing detects it. Pushes are per-row, so the remote can hold rows the phone deleted before its
triggers existed. Composite-key deletes (`program_days`, `exercise_muscles`) are one request per row.
**A 25 kg weigh-in from 2026-09-28 is in the phone's data and now the cloud.** There is no way to
delete or edit a weigh-in in the app (a "smaller thing" already listed), so it will skew the 7-day
average until there is.

## The Supabase mirror

> **A wrong project was built by mistake on 2026-09-28, and this is what happened.** The project for
> this app is **`apmzkqejwmhctaldbzgv`** and it never changed. Its paused URL failed to resolve, and a
> URL for a *different* app's project (`hrmxlijtdldcmljkhwhf`) was offered as its replacement and
> believed. The MCP was pointed at it, found it empty, and the full mirror was rebuilt there. **That
> was wrong, and it left 12 empty tables and two migrations on the other app's project** — see the
> cleanup SQL in the note below. **Lesson: when a project URL "changes", check the project ref against
> this file before trusting it.** The MCP's project ref lives in `.mcp.json`.
>
> **What is true on the real project.** It already held the original eight tables, with RLS and all
> five of their migrations, all empty. Only the four tables added locally since (`programs`,
> `program_days`, `body_weights`, `check_ins`) were missing, and they are now applied. The SQL is
> committed at `supabase/migrations/20260928000001_jymiq_mirror_new_tables.sql`. The original
> eight came from migrations applied straight to the database, never kept in the repo.
>
> **Verified on the real project.** RLS on with an owner policy each, `anon` refused, TRUNCATE
> revoked. A two-user probe (in a transaction that aborts, leaving nothing behind) confirmed: a user
> can write all four tables, a second active program is refused, another user sees none of those
> rows, attaching to another user's program is refused by the composite foreign key, deleting another
> user's weigh-in affects nothing, reassigning `user_id` is refused, and `anon` is refused. The only
> advisor warning is leaked-password protection, which is moot because sign-in is Google or magic link.
>
> **Google sign-in is already configured on the real project.** `/auth/v1/authorize?provider=google`
> answers `302` to `accounts.google.com` with `redirect_to=jymiq:///sign-in` intact, and the settings
> endpoint reports Google enabled. **The return leg has still never been completed on the phone.**
>
> The new `programs` unique index ignores tombstoned rows (`deleted_at is null`), so a deleted program
> cannot block a live one. The original `sessions_one_live_idx` does not.
>
> **Cleanup owed on `hrmxlijtdldcmljkhwhf` (another app's project; not touched since):** it now
> holds `exercises`, `exercise_muscles`, `routines`, `routine_exercises`, `programs`, `program_days`,
> `sessions`, `session_exercises`, `sets`, `personal_records`, `body_weights`, `check_ins`, all empty,
> plus the migrations `jymiq_mirror_tables` and `jymiq_mirror_rls`. Before dropping, check it holds
> nothing else you want in `public`.

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
- **A hand-edited `drizzle/meta/_journal.json` needs `pnpm expo start -c`.** A warm Metro serves the
  pre-edit journal, the device records *that* timestamp, and every later launch re-runs the migration
  and dies on ``table ... already exists``. See "A hand-edited migration timestamp and a warm Metro".
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
- **`pnpm expo run:android` narrows the APK to the connected device's ABI, and the failure lies
  about why.** An x86_64 build will not run on the physical arm64 phone, and an arm64 build will not
  run on the `jymiq-a` emulator — see "The Android emulator" above. It fails as
  `SoLoaderDSONotFoundError: couldn't find DSO to load: libreactnative.so`, which reads like a
  corrupt install rather than a wrong-architecture build; that misleading error is the whole reason
  this is worth writing down. Always build for the target you mean — the APK sitting at
  `android/app/build/outputs/apk/debug/app-debug.apk` is whatever the last build targeted, and its
  filename does not say which.
