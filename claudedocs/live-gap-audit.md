# Live session — designed vs built (gap audit, 2026-09-29)

Read-only audit. Source of truth: `design-exploration.md` §0, Lab 33 (the settled live screen),
Lab 47 §4 (interaction and motion), Lab 06 (motion), Labs 26–31 (the arguments Lab 33 composes).
Compared against `src/app/live.tsx` (459 lines), `src/components/**`, `src/data/mutations/sessions.ts`.

**The build log is wrong.** `build-log.md:25` says *"Every drawn screen is now built."* and
`lab48.py:292-326` stamps all four live states `BUILT · on the phone and verified there`. What is on
the phone is Lab 33's *instrument* (ring, tape, selector, keypad, ladder, set line). Lab 33 G1's
caption lists what the settled screen contains, and about half of it is not built:

> "Everything settled since Lab 28 is in this one frame: written set line, K3 ladder on the left,
> LAST TIME with no border, **four secondary destinations, session strip, SETS opening the sheet**.
> It is the version to build." — `lab33.py:93`

Lab 48 G1's own caption says *"horizontal moves between sets and vertical between exercises"*
(`lab48.py:296`), and no gesture does that. The build log knew. `build-log.md:873` lists *"The
horizontal set swipe"* as deliberately not built, and `:805-819` says grips and Add exercise are
missing. Lab 48 was never updated to match.

**One correction to the owner's report.** It is not quite true that nothing animates. Dialogs fade in
(`dialog.tsx:104-121`, Reanimated `FadeIn`/`FadeInDown`), stack pushes use native
`slide_from_right`, `/live` fades in (`_layout.tsx:80`), and the exercise demo swaps frames every
380 ms. Everything else is a hard cut: sheets, the ring, the tape, presses, toggles, tabs and the
ladder.

---

## 1. Gap table

Gap size: none / small (<½ day) / medium (½–2 days) / large (>2 days).

| Designed feature | Where designed | What the code does today | Gap | What is needed |
|---|---|---|---|---|
| **Swipe left/right = sets, up/down = exercises** | §0 `design-exploration.md:31` *"Gesture-navigated. Horizontal = sets, vertical = exercises."*; Lab 47 gesture map `lab47.py:549-560` (↑ previous exercise, ← previous set, → next set, ↓ next exercise); Lab 26 title `lab26.py:262` *"Swipe sideways for sets, up for exercises"*; mid-swipe stills Lab 29 M5 `lab29.py:156-163`, Lab 30 R4 (current dial travels left, next enters from the right) | Nothing. `live.tsx` has no `GestureDetector`. You move between sets through the SETS sheet (tap the set line) and between exercises through the ladder, the title or the sheet. The content sits in `Screen`'s `ScrollView` (`screen.tsx:28`), which would take any vertical drag. | **large** | **Direction, from the map and the stills:** a finger moving left gives the next set, right the previous set, up the next exercise, down the previous exercise (pager convention). **Region:** Lab 26 says to *"keep the swipe region to the dial and the area immediately around it"* (`lab26.py:272`). The ring is centred at 330pt on a 411dp phone, so it already sits about 40dp from each edge. **Masking:** the ladder is chrome and stays on top, and the dial is masked underneath it (`design-exploration.md:539-541`). Use an `overflow:'hidden'` clip that starts right of the ladder. `@react-native-masked-view` is not installed, and adding it would need a native rebuild. **Implementation:** one `Gesture.Pan()` with axis lock (`activeOffsetX([-12,12])` / `activeOffsetY([-12,12])`). The translate is a shared value on the UI thread. On release past 30% of the width or 500 pt/s, animate out with `withTiming(…, {duration: motion.base})`, write `setSessionCursor`, then slide the new content in. Below the threshold, or on **cancel**, animate back with `withSpring(0)`. Disable the pager while editing (the tape owns the vertical pan and the ladder dims to 0.28). The live screen must not scroll: Lab 26 says *"nothing scrolls"*, so add `scroll={false}` to `Screen`. **Files:** new `src/lib/live-nav.ts` (pure next/prev cursor, tested), new `src/components/live-pager.tsx`, `src/components/screen.tsx`, `live.tsx`. **Metro reload only** (gesture-handler 2.32 and Reanimated 4.5.1 are already native). |
| ↳ Android back-gesture findings | `dev/gestures.tsx`; results in `build-log.md:884-927` | Probe only | — | Measured on the Nothing Phone, Android 15, default sensitivity. A horizontal drag starting **<20dp** from either edge never reaches the app, and back fires instead. At **20–25dp** the pan begins, gets about 4dp, then is **CANCELLED** while back fires anyway. From **≥30dp** it is clean. **Vertical is never contested**, even at x=11dp. **Taps in the dead band are delivered**, so the ladder's tap route works. Back is offered to the app and can be blocked. The rules that follow (`:918-924`): **a cancel must snap back and never commit**, and anything that drags horizontally must start **≥40dp from both edges**, because the user's sensitivity slider can widen the band to about 40dp. There is no `setSystemGestureExclusionRects` binding and none is needed. `app.json` has `predictiveBackGestureEnabled: false`. **Never give the ladder a horizontal drag.** |
| **Exercise image on the live screen** | **Not drawn on any live board.** §0 puts the demonstration on the exercise screen only (`design-exploration.md:23`, "the exercise demo" as a grouped plate; Lab 35 B2). Lab 26 and Lab 28 draw a **HISTORY** destination on the live screen (`lab28.py:139`). | None. Art exists for 302 built-ins via `exerciseArt` / `exerciseStill` (`src/data/exercise-art.ts`, `require`d from `node_modules/@bryllim/workout-guide/assets/<slug>/frame-{1,2,3}.png`, keyed by the exercise's slug `id`). Custom exercises have none. It is used only in `library.tsx:111` and `exercise/[id].tsx:139`. | **small** to **medium** — **owner decision** | Three options, cheapest first. **(a)** Pass `art={exerciseStill(exerciseId)}` on the EXERCISES sheet rows. `ListRow` already takes `art` (`list-row.tsx:17`), and this matches the library row. **(b)** Have the HISTORY destination (below) push `/exercise/[id]`, which already loops the three-frame demo. **(c)** Put a still on the live screen itself, beside or behind the title. That needs a board: it spends the budget Lab 42 sets (*"two or three plated things per screen"*) on the one screen §0 calls *"mostly one big instrument"*. The recommendation is (a)+(b) now and (c) only if the owner draws it. Metro only (`expo-image` is already native). |
| **Replace (swap) an exercise** | Lab 26 `lab26.py:265` *"four secondary destinations: history, stats, notes, **swap exercise**"*; Lab 28 `actions()` `lab28.py:130-139`; composed into Lab 33 G1 (`lab33.py:65`, `L.actions()`) | Nothing. There is no SWAP control and no mutation. | **medium** | Add a new `replaceSessionExercise(sxId, exerciseId)` in `sessions.ts`. Open the library in a `replace=<sxId>` mode (`(tabs)/session/library.tsx` already has a `routineId` mode to copy). **Owner decision:** what happens when the exercise already has logged sets? The recommendation: with **no** logged sets, rewrite `exerciseId` in place and clear the planned load. With logged sets, `skipSessionExercise(old)` and insert the new one at the **same position**, so history keeps what was lifted. Metro only. |
| **Add an exercise** | §0 `:34` *"button at the foot adds"*; Lab 31 E7 `lab31.py:296-305` (`Add exercise` at the sheet foot) | Omitted. `exercises-sheet.tsx:82-85`: *"Add exercise is omitted rather than shipping a button that goes nowhere"*. `addExerciseToSession` is written and has **no caller**. | **small** | Give the library a `sessionId` mode that calls `addExerciseToSession` and then `router.back()` (one param and one branch, as `build-log.md:818-819` says). Add an `Add exercise` footer to `exercises-sheet.tsx`. After adding, set the cursor to the new exercise. Metro only. |
| **Delete an exercise / a set** | Lab 06 tile 07 *"Swipe to delete … Haptic at the threshold crossing … Siblings reflow themselves"* (`lab06.py:195-200`, drawn on a `Leg Press · 3 x 12` queue row); §1 *"exercise queue (reorder, swipe-delete)"* (`design-exploration.md:72`) | Nothing. `removeSet` and `skipSessionExercise` / `unskipSessionExercise` have **no caller**. | **medium** | Swipe left on a sheet row: `Gesture.Pan` past a threshold → `withTiming` slide-out → `skipSessionExercise(id)` (a soft delete, which the recap can state) or `removeSet(id)`. Under the threshold, `withSpring(0)`. Fire one `impactAsync(Medium)` at the crossing. Reflow the siblings with Reanimated `layout={LinearTransition}`. The row's drag starts well inside the 40dp rule. **Owner decision:** can a logged set be deleted, or only an unlogged one? `removeSet` hard-deletes, and PR rows cascade only through the session. Metro only. |
| **Reorder exercises and sets (grips)** | §0 `:33-34` *"Rows carry a reorder grip on the left … grip reorders, row navigates"*; Lab 31 E6/E7 (`lab31.py:231-305`, `HANDLE` on every row); Lab 47 sheets spec `lab47.py:575-587` | No grip is drawn (`build-log.md:805-810`). `reorderSets` and `reorderSessionExercises` have **no caller**. The only mention is a comment in `sets-sheet.tsx:125-126`. | **medium** | A drag handle on the grip strip only (Lab 31 says *"the handle owns a narrow strip and the rest of the row is the tap"*): `Gesture.Pan().activateAfterLongPress(…)` on the grip, a translateY shared value, and index swaps at half-row crossings with `LinearTransition`. Commit with `reorderSets(ids)` / `reorderSessionExercises(ids)` on release. Fire `performAndroidHapticsAsync(Drag_Start)` on pickup. Put it in a new `src/components/reorder-list.tsx` used by both sheets. Metro only. |
| **Haptics on weight/reps controls** | §6b `design-exploration.md:245` *"Haptic budget: selectionAsync for tuner detents (throttled on velocity), impactAsync(Rigid) for a logged set, notificationAsync(Success) reserved for a PR and nothing else."* Lab 06 tiles 02/05/06/07; Lab 31 E2 *"snapping to every 2.5 kg with a selection haptic"* | None. `expo-haptics` is imported nowhere. | **small** | New `src/components/haptics.ts` holding the platform switch. **For the owner's "pop like the Android back gesture":** on Android, expo-haptics' `selectionAsync`/`impactAsync` drive `Vibrator` waveforms, which feel buzzy. `performAndroidHapticsAsync(AndroidHaptics.X)` calls `View.performHapticFeedback`, the same system haptic family as system gestures (`node_modules/expo-haptics/.../HapticsModule.kt:44-48`). Map it this way: tape detent → `Segment_Tick` (or `Clock_Tick`; try both on the device), keypad key → `Keyboard_Tap`, long-press to keypad → `Long_Press`, log set → `Confirm`, PR → `Confirm` plus Android's strongest (iOS keeps `notificationAsync(Success)`), swipe-delete threshold / pager commit → `Gesture_End`, grip pickup → `Drag_Start`. **Wire-up points:** `tape.tsx:48-51` (call through `scheduleOnRN` from the worklet only when the index changes, which is already gated), `keypad-sheet.tsx:106`, `param-selector.tsx:44`, the log in `live.tsx:265-269`. **Metro only.** `expo-haptics` has been in `package.json` since the first native build (commit 7d6a620), and `android.permission.VIBRATE` is already in `AndroidManifest.xml`. Verify with one call before building on it. |
| **Centre `+` button** | §0 `:30` *"W2 — four labelled tabs, inset circular start button"*; Lab 23 `lab23.py:136` *"Making it the **action** rather than a fifth destination"*; W5 `:100` *"the one action you might want while scrolling a chart is starting the session"*; Lab 43 T3 `lab43.py:148-151` *"Start an empty session · DECIDE AS YOU GO"* | `(tabs)/_layout.tsx:39` calls `router.push('/live')` **unconditionally**. With no session running, `live.tsx:207-213` renders a `ScreenHeader` with an empty title and nothing else: **the empty screen the owner hit.** Today's `Empty session` row (`index.tsx:253-265`) does start a session, but that also lands on a near-empty `/live`, because an exercise-less session renders only the header (`live.tsx:215-224`), with no way to add a lift. | **small** (button) + **small** (live empty state) | **Design-consistent behaviour** (Lab 23: it is *the* start action): running → `push('/live')` (Resume). Not running → start the **next scheduled routine** if Today's card has one, otherwise `startSession()` empty. In every case `/live` must never be blank. An empty session renders §0's empty state, *"a set of actions and nothing else"*, which here is **Add exercise** (library in `sessionId` mode). **Owner decision:** should `+` start the scheduled routine, or always an empty session, or open a two-row chooser sheet (`Start <next>` / `Empty session`)? The recommendation is the chooser only if both exist, otherwise act directly. Extract Today's `startEmpty` / `press` into one `useStartSession()` hook in `src/data/running.ts`. Metro only. |
| **Rest duration entry** | Settings: Lab 37 D4 draws only rows `Default rest · compound 3:00` (`lab37.py:200-201`). **No picker is drawn anywhere.** §6 lists the *"tuner tape with fixed centre index (**any dialled value**)"* as an instrument primitive (`design-exploration.md:211`). §0 says *"No value is reachable by only one route."* | Settings uses a fixed list of seven values `REST_CHOICES = [60,90,120,150,180,240,300]` (`lib/settings.ts:39`, `settings.tsx:117-133`). The custom exercise form has its own fixed chip list `RESTS` (`exercise/new.tsx:31`). **Routine lift rest cannot be set at all**: `updateRoutineExercise` has no caller. The live session's rest cannot be adjusted either (see the next row). | **medium** — **owner decision on the range** | Reuse the **Tape** with a new `REST_SCALE` in `src/lib/scale.ts` (suggested 0:15–10:00 by 15 s; the owner picks the range and step), shown as `m:ss`. That is the same control the owner already uses for load and reps. Add a keypad route (`mm:ss`) to satisfy the two-routes rule; this means generalising `KeypadSheet`, which is currently hard-wired to `setId`/`updateSet`. Put it in a new `src/components/duration-sheet.tsx` used by Settings, `exercise/new.tsx` and (later) the routine editor. Metro only. |
| **Live rest timer: +30s / skip / countdown** | §1 `:72` *"auto rest timer with +30s/skip"*; Lab 06 tile 04 *"Rest countdown … Driven from a timestamp"* (`lab06.py:176-179`); tile 10 (fusing +30s/SKIP into one pill) was **cut** as motion, not as controls (`lab06.py:242`) | The text `REST 2:57` in the footer. Tapping it clears the rest (`live.tsx:373-377`). There is no +30s, no countdown ring and no notification when rest ends. | **medium** — **owner decision on placement** | **No settled board places rest on the live screen.** Lab 33 G1 has no rest element, and Lab 24's old strip had `REST 2:30`. Propose a `RestTimer` component: the countdown `withTiming(0,{duration: remainingMs, easing: Easing.linear})` recomputed from `restUntil` on foreground, with `+30s` and `Skip` as two 44pt targets. Add a new `extendRest(sessionId, sec)` mutation. An end-of-rest notification needs `expo-notifications` configured in `app.json` plus POST_NOTIFICATIONS, which means a **native rebuild**. It is undesigned, so it is optional. |
| **Four secondary destinations: HISTORY · STATS · NOTES · SWAP** | Lab 28 `lab28.py:130-139`, in Lab 33 G1 (`lab33.py:65,93`); Lab 26 `:265` | Missing. `session_exercises.note` exists in the schema and nothing writes it. | **medium** — **owner decision** | HISTORY and STATS would both land on `/exercise/[id]` (demo, e1RM chart, history). The owner should decide whether that is two buttons or one. NOTES needs a one-field sheet writing `sessionExercises.note` (new mutation). SWAP is the replace row above. **Icons:** the board's glyphs exist only as inline SVG in `lab28.py:131-134` and not in `assets/icons/ui/`. Adding them means re-stroking them to path-only, adding them to `ICON_SIZE`, `pnpm expo prebuild` and **a native rebuild**. Alternatively, ship mono text labels with no icon, which needs no rebuild. |
| **Session strip: VOLUME · SETS · e1RM** | Lab 28 `sess()` `lab28.py:141-147` (`VOLUME 3.7 T`, `SETS 12`, `e1RM 130` in accent), in Lab 33 G1 | Missing | **small** | Use `totalVolume` / `countLoggedSets` (`lib/volume.ts`) over `allSets`, and the best `e1rmKg` for the current exercise. Three centred mono cells, unplated. Metro only. |
| **SETS key in the action bar** | Lab 23 W6 `lab23.py:102-103` *"the bar becomes one job. The left key is now labelled SETS"*; Lab 28 `phone()` `lab28.py:156-157` (`SETS` + `Log set 4`) | `ActionBar primary="Log set"` with no secondary (`live.tsx:428`). SETS opens only from a tap on the set line. | **small** | `secondary="SETS" onSecondary={() => setSheet('sets')}`. Label the primary `Log set ${setIndex+1}`. Metro only. |
| **Ring chips (reps, RPE) are tappable** | Lab 33 G1 `lab33.py:92` *"reps and RPE sit under it as chips you can tap"* | The whole ring is one target that opens load (`build-log.md:875`) | **small** | Put a `Pressable` per chip in `load-ring.tsx` core → `setEditing('reps'|'rpe')`. |
| **Perimeter drag while editing load** | Lab 33 G2 `lab33.py:96` *"you can also throw it round the ring if you want to move a long way"*; Lab 32 F5 | Not built. The ring has no gesture. | **medium** | `Gesture.Pan` on the ring maps the angle to an index on the −240°…+60° sweep. Active only when `showNumerals`. Selection haptic per detent. Metro only. |
| **RIR gloss on the RPE cell** | Lab 33 G4 `lab33.py:104` *"with the RIR gloss in the selector cell so RPE 8 is never shown bare"* | `ParamSelector` supports `gloss` (`param-selector.tsx:10`), but `live.tsx:334-354` never passes it | **small** (one line) | `gloss={editing==='rpe' && set.rpe!=null ? \`RIR ${10-set.rpe}\` : undefined}` |
| **LAST TIME with delta, for *this* set** | Lab 26 `:265` *"what you lifted for this set last session, and the delta"*; Lab 29 `prev()` `lab29.py:149-153` (`+2.5` in done green) | Shows the last completed set of the exercise's latest other session (highest position, not the same set index) and **no delta** (`live.tsx:358-365`, `queries/sessions.ts:236-257`) | **small** | Match on `sets.position = current position` with a fallback to the last set, and render `Delta` (`components/delta.tsx`). |
| **Elapsed clock under the title** | Lab 28 `head()` `lab28.py:111-116` (`00:31:17` under the name) | The clock is in the bottom footer beside REST (`live.tsx:369-371`) | **small** | Move it. The footer then keeps rest and Finish. |
| **Ladder tick lines** | Lab 28 `V_ticks()` `lab28.py:177-186` (13/11/9pt rule + numeral; current gold, done green, ahead dim) | Numerals only (`live.tsx:404-425`) | **small** | Add a 1pt `View` rule per row. |
| **"No back" on the takeover** | Lab 48 G1 `lab48.py:295` *"A takeover: no tab bar, no back."* | A back chevron runs the discard flow (`live.tsx:284`) | **owner decision** | Keep it (it is the visible discard route) or remove it (hardware back still confirms). |
| **Where Finish lives** | **Not drawn** on Lab 33 | The text link `Finish` in the footer (`live.tsx:379-385`) | **owner decision** | Undesigned. Keep it until a board places it. |

**A bug found on the way (not a design gap, and it crashes):** `live.tsx:265` calls `completeSet`
without a guard. `completeSet` **throws** when `weightKg` or `reps` is null (`sessions.ts:209-211`).
Every set of an `addExerciseToSession` exercise, and every routine lift without targets, starts null.
Routine targets cannot be set in the UI at all. So `Log set` before dialling both reps and load
throws an uncaught error. Disable `Log set` until both are set, as the mutation's own comment asks.

---

## 2. Motion inventory

`grep -rn 'withTiming|withSpring|withDecay|withRepeat|withSequence|useAnimatedStyle|useDerivedValue|LayoutAnimation|entering=|layout=' src`
finds only two things: `dialog.tsx` (`FadeIn` / `FadeInDown`) and the tape's shared values, which
have no animation. Tokens exist and are unused outside the dialog: `motion = { fast: 140, base: 240, slow: 380 }`
(`tokens.ts:137`), and Lab 47 assigns them as *"fast · a press, a toggle / base · a sheet, a section
change / slow · the demo loop's frame swap"* (`lab47.py:595-606`).

Lab 06 drew twelve tiles; **08 and 10 were cut** (`lab06.py:242`, §8b `design-exploration.md:329`),
which leaves ten. Installed: Reanimated 4.5.1, worklets 0.10.1, **gesture-handler 2.32** (Lab 06's
text says 3.1.0, but `Gesture.Pan()` is the same API in 2.x), Skia 2.6.2, expo-haptics. None of these
needs a native rebuild.

| # | Interaction | Designed where | Implemented? | SDK 57 call to use | Effort |
|---|---|---|---|---|---|
| 01 | Rolling numeral (changed digit rolls) | `lab06.py:158-163` | No | Per-digit strip `translateY`, `withTiming(280–420, Easing.out(Easing.cubic))`, tabular Geist Mono. New `rolling-number.tsx`, used by the ring core and the session strip. | M |
| 02 | Tuner detent (decay, overshoot, settle) + tick haptic | `lab06.py:165-169` | **No.** The tape jumps one detent per React render; there is no inertia and no haptic (`tape.tsx:36-55`). | Drive a `offsetSV` from the pan; release: `withDecay({velocity, clamp})` → `withSpring(nearest, {damping:26, stiffness:220, mass:0.6})`; render rows from `useAnimatedStyle` translateY; `scheduleOnRN(onDetent)` only on index change; haptic per crossing, gated on velocity | M |
| 03 | Arc to target | `lab06.py:171-174` | No. The arc was killed by Lab 32 F3; the equivalent is the ring's tick fill easing to a new load. | Ring ticks as Skia paths or a `useDerivedValue` over value → `withTiming(600, Easing.bezier(0.16,1,0.3,1))`. The ring is rotated Views today (`build-log.md:842-844`), so this may be the trigger to move it to Skia. | L |
| 04 | Rest countdown (linear, hue across thresholds) | `lab06.py:176-179` | No (text only) | `withTiming(0,{duration: restUntil-now, easing: Easing.linear})` recomputed on AppState `active`; `interpolateColor` on the same driver | M |
| 05 | Set logged (one segment pops, <250 ms) + Rigid | `lab06.py:181-185` | No | `withSequence(withTiming(1.08,{duration:80}), withSpring(1,{damping:14}))` on the ladder tick / set line; the log haptic (`Confirm` on Android, `impactAsync(Rigid)` on iOS) | S |
| 06 | PR overdrive (sweep past ceiling, bloom, settle) + Success | `lab06.py:187-193` | No. A PR is a text dialog (`live.tsx:55-66`). | `withSpring` overshoot on the ring fill + Skia `BlurMask` bloom held ~600 ms; `notificationAsync(Success)`. **Open in §8 `:290`:** *"whether the PR overdrive is too much"*. | M |
| 07 | Swipe to delete (threshold haptic, siblings reflow) | `lab06.py:195-200` | No | `Gesture.Pan` → `withSpring(0)` / `withTiming` slide-out; `layout={LinearTransition}` on siblings; one haptic at the crossing | M |
| 08 | Logged set feeds the gauge (set → arc morph) | `lab06.py:202-216` | — | **Cut** (`lab06.py:242`, §8b `:329`). Do not build. | — |
| 09 | Waiting for signal (breathing outlines) | `lab06.py:218-220` | No. Screens render blank until `useLiveQuery` answers. | `withRepeat(withTiming(0.6,{duration:1200}),-1,true)` on opacity, staggered 120 ms | S |
| 10 | Rest controls fuse (glass merge) | `lab06.py:222-227` | — | **Cut**. It is iOS-glass-only anyway, and Android glass is ruled out (§8s). | — |
| 11 | Live pulse (`LIVE · LOWER A`) | `lab06.py:229-232` | No | `withRepeat(withTiming(2.4,{duration:2000, easing: Easing.out(Easing.exp)}),-1)` on scale + opacity. **No settled board places it.** A candidate is Today's card / the tab bar while a session runs. | S |
| 12 | Shift ladder (toward MRV, terminal cell flashes) | `lab06.py:234-239` | No | Superseded by the zone bars (§0 *Zone bar*, Lab 37 D1). Treat as dropped unless the owner reopens it. | — |
| — | **Sheet open/close** | Lab 47 *base 240 · a sheet* | **No.** `Sheet` returns `null` when closed (`sheet.tsx:41`), so it hard-cuts. | Keep the root mounted while exiting, or make the root an `Animated.View` (an `exiting` animation runs only on the top-most removed Animated node): scrim `FadeIn/FadeOut.duration(240)`, panel `SlideInDown/SlideOutDown.duration(240)`. Add pan-down-to-dismiss on the grab bar (`Gesture.Pan`, `withSpring`). Covers sets, exercises, keypad and the Settings rest sheet. | S–M |
| — | **Press states** | Lab 47 *fast 140 · a press, a toggle* | Instant opacity swaps (24 `pressed` sites in components) | Reanimated 4 CSS transitions: `transitionProperty: ['opacity','transform'], transitionDuration: 140` on an `Animated.View` wrapper in `RowPlate`, `ActionBar`, `TabItem`, `StartButton` | S |
| — | **Toggle** | Lab 47 *fast 140* | Hard flip via `justifyContent` (`toggle.tsx:45`), which is a layout change | Knob `translateX` with a 140 ms CSS transition (transform, never layout) | S |
| — | **Ring 330 ↔ 290 and ladder 1 ↔ 0.28 when entering edit** | Lab 33 two sizes; Lab 31 E2 the ladder dims | Jump cuts (`live.tsx:312, 401`) | `withTiming(base)` on a scale transform (not `size`, which is layout); opacity transition on the ladder | S |
| — | **Live pager slide** | Lab 29 M5, Lab 30 R4 | No | See the swipe row in §1 | (in the swipe task) |
| — | **Demo frame swap** | Lab 47 *slow 380* | Partly: a hard frame swap every 380 ms (`exercise/[id].tsx:133`) | Cross-fade two `expo-image` layers, or `Image transition={380}` | S |
| — | **Tab bar minimised on scroll (W5)** | §0 `:30` *"Plus W5 minimised-on-scroll"*; `lab23.py:99-101` | No | `useAnimatedScrollHandler` in `Screen` → a shared value collapses the bar (`translateY` / scale) | M |
| — | **Tab switch** | Not specified | Hard cut (headless `expo-router/ui` Tabs) | Leave it. Nothing is designed. | — |
| — | Dialog | Lab 47 base/fast | **Yes** (`dialog.tsx:104-121`) | — | done |
| — | Stack push / `/live` takeover | — | **Yes** (native `slide_from_right`, `fade`) | — | done |

---

## 3. Recommended build order

Every task below is Metro-reload only (`pnpm expo start -c` after anything touching babel or metro,
which none of these do), **except the two marked NATIVE.** Delegates must not commit; the parent
reviews the diff and runs `pnpm check`.

**How to split `live.tsx` so agents do not collide.** Do task **T0** first, alone. It extracts the
existing pieces without changing behaviour, so each later task owns one component file and adds at
most a few wiring lines to `live.tsx`. Import new components by path (`@/components/rest-timer`),
not through `components/index.ts`, so the barrel is not a shared hot file. Wave B tasks each add a
few lines to `live.tsx`, so run them **sequentially**, or in separate worktrees rebased in order.
Wave A tasks never touch `live.tsx` and can run in parallel.

**T0 — split `live.tsx`** (serial, first). `src/app/live.tsx` → keep queries, state and layout.
Extract `src/components/exercise-ladder.tsx` (lines 389-426), `src/components/live-footer.tsx`
(clock, rest, Finish; lines 367-386) and `src/components/live-instrument.tsx` (ring, tape and
selector; lines 303-356). Add `scroll?: boolean` to `src/components/screen.tsx` and pass `false`
from live. Also fix the null-load `Log set` crash here: disable the primary until load and reps are
set. Test: the device session looks and behaves the same.

**Wave A — parallel, no file overlap, none touches `live.tsx`:**

| Task | Files (exclusive) | Rebuild |
|---|---|---|
| **A1 Haptics** — the helper and every control that is not in `live.tsx` | new `src/components/haptics.ts`; `tape.tsx`, `keypad-sheet.tsx`, `param-selector.tsx`, `toggle.tsx` | Metro |
| **A2 Sheet motion** — enter/exit + drag-to-dismiss | `src/components/sheet.tsx` | Metro |
| **A3 Sheet rows** — grips (reorder), swipe-delete, `Add exercise` footer, exercise stills on rows | `sets-sheet.tsx`, `exercises-sheet.tsx`, new `reorder-list.tsx`, new `swipe-row.tsx` | Metro |
| **A4 Session mutations + library picker modes** — `replaceSessionExercise`, `extendRest`, `setSessionExerciseNote`; library `sessionId` (add) and `replace` modes | `src/data/mutations/sessions.ts`, `src/app/(tabs)/session/library.tsx` | Metro |
| **A5 Pure cursor maths** — next/prev set and exercise, clamping at the ends, skipping removed exercises; with tests | new `src/lib/live-nav.ts`, `src/lib/live-nav.test.ts` | none (`pnpm test`) |
| **A6 Rest duration entry** — `REST_SCALE`, a tape-based `DurationSheet`, Settings and custom exercise use it | `src/lib/scale.ts`, `src/lib/settings.ts` (drop `REST_CHOICES`), new `src/components/duration-sheet.tsx`, `src/app/settings.tsx`, `src/app/exercise/new.tsx` | Metro |
| **A7 Centre `+`** — shared `useStartSession()`; the `+` resumes, or starts next/empty | `src/data/running.ts`, `src/app/(tabs)/_layout.tsx`, `src/app/(tabs)/index.tsx` | Metro |
| **A8 Motion primitives** — `RollingNumber`, breathing `Waiting`, press/toggle transitions | new `rolling-number.tsx`, new `waiting.tsx`, `row-plate.tsx`, `action-bar.tsx`, `tab-bar.tsx` | Metro |

A1 and A6 both touch the keypad idea. A6 must **not** edit `keypad-sheet.tsx`. If the owner wants the
mm:ss keypad route, do it as a follow-up after A1 lands.

**Wave B — after T0 and the named Wave A tasks; sequential because each wires into `live.tsx`:**

| Task | Depends on | Files | Rebuild |
|---|---|---|---|
| **B1 Swipe pager** (4 directions, clip under the ladder, snap back on cancel, disabled while editing) | T0, A5 | new `src/components/live-pager.tsx`; `live.tsx` wraps `live-instrument` + set line | Metro |
| **B2 Empty session + Add/Replace entry points** (the empty state's `Add exercise`, SWAP) | T0, A3, A4, A7 | `live.tsx` | Metro |
| **B3 Rest timer** (countdown tile 04, +30s, Skip) | T0, A4 | new `src/components/rest-timer.tsx`, `live-footer.tsx` | Metro |
| **B4 Instrument polish** (tappable chips, RIR gloss, ring and ladder transitions, ladder tick rules, LAST TIME delta for the same set, set-logged pop, log/PR haptics, PR overdrive) | T0, A1 | `load-ring.tsx`, `exercise-ladder.tsx`, `live-instrument.tsx`, `src/data/queries/sessions.ts` | Metro |
| **B5 Secondary row + session strip + SETS key** | T0, A4 (notes, swap) | new `live-secondary.tsx`, new `session-strip.tsx`, `live.tsx`; **icons →** `assets/icons/ui/{hist,stat,note,swap}.svg`, `icon-sizes.ts` | **NATIVE** if icons are used (`pnpm expo prebuild` + `pnpm expo run:android`); Metro if text-only |
| **B6 Tuner inertia** (tile 02 decay and spring) | A1 | `tape.tsx` | Metro |
| **B7 (optional) Rest-end notification** | B3 | `app.json` plugin, new `src/data/rest-notify.ts` | **NATIVE** |

A later, independent task that is not live: **W5 minimised tab bar** (`screen.tsx` scroll handler,
`tab-bar.tsx`). It conflicts with A8 on `tab-bar.tsx` and T0 on `screen.tsx`, so run it after both.

---

## 4. Other screens with the same problem

- **Routine detail (Lab 34 A2, stamped BUILT):** the lift rows draw a **grip that does nothing**
  (`routine/[id].tsx:167`). There is no routine-exercise reorder mutation at all. That breaks Lab
  47's own rule: *"A bar with no handler behind it is not drawn: an inert button is worse than an
  absent one"* (`lab47.py:425-427`).
- **Routine targets cannot be set anywhere.** The board's lift meta *"3 × 8 @ 100 KG · REST 3:00"*
  (`lab34.py:67-74`) can only ever read `3 SETS`. `addExerciseToRoutine` defaults to 3 sets with null
  reps and weight, and `updateRoutineExercise` has no caller (`build-log.md:129-131`). Routine edit
  can only add and remove. This is also what feeds the null-load crash above.
- **Exercise library (Lab 35 B1, BUILT):** *"handed a routine **or a session** it retitles and its
  rows add"* (`lab48.py:189-191`). Only the routine half exists.
- **Today, empty (Lab 43 T3):** `Empty session` lands on a `/live` that shows only a header, with no
  way to add a lift (the same fix as B2). Lab 48 still stamps T3 `DRAWN` while `build-log.md:30`
  says it was built, so the caption is stale.
- **Navigation W5** (§0 `:30`, *"Plus W5 minimised-on-scroll"*) was never built, and Lab 48 does not
  mention it.
- **Settings (Lab 37 D4) and custom exercise (Lab 35 B3):** the fixed rest lists (A6).
- **Lab 48 is stale on IA:** it still shows the Strength tab with C4 as its root and C1 as the Load
  root. Lab 49 moved the calendar to History, put the body map at the root of Load and made `/records`
  a push. Re-run `lab48.py` once its captions are corrected.
- Honest already, no action needed: B2′ (YOUR NUMBERS / REP MAXES / WHAT TO DO NEXT are `DRAWN`
  and the build log says so), A4's missing grips (a documented departure), D2's relative strength.

### Decisions the owner has to make

1. Which way each swipe goes. The recommendation is pager convention (finger left → next set), taken
   from Lab 47's map and the Lab 29/30 stills. At the last set of an exercise, a swipe either clamps
   or rolls over to the next exercise; the recommendation is to clamp.
2. Exercise image: sheet stills + HISTORY → demo (no new board), or a still on the live screen
   (needs a board).
3. SWAP when sets are already logged: skip + insert at the same position, or overwrite.
4. Swipe-delete a *logged* set: allowed or not.
5. The `+` button: start the scheduled routine, an empty session, or a two-row chooser.
6. The rest scale's range and step, and where the rest timer sits on the live screen. No settled
   board places it.
7. HISTORY vs STATS: one destination or two, and whether the secondary row gets icons (native
   rebuild) or text labels.
8. The takeover's back chevron (Lab 48 says *"no back"*) and where `Finish` lives (undrawn).
9. Whether PR overdrive is "too much" (still open in §8 `:290`).
