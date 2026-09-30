# Text audit

Read-only, code-based audit for text density. No device attached, no source file touched. Rows are quoted from the source; `file:line` is the first line containing the string. Screens under `src/app/dev/**` are excluded.

Classification key: **KEEP** essential label/number/name/safety. **CUT** adds nothing. **VISUAL** replace by colour, shape, icon, number or position (the note says what). **SHORTEN** keep but reduce to 3 words or fewer (the note gives the replacement).

## 1. Summary

| Measure | Count |
|---|---|
| Audited strings (rows below, screens + shared components + lib builders) | 254 |
| Sentence-length strings, >= 5 words (audited rows whose string has 5 or more words) | **118** |
| Mechanical cross-check: string literals and JSX text >= 5 words under `src/app`, `src/components`, `src/lib` (regex scan, comments stripped) | 115 (128 raw hits less 13 code / SVG-path / dev-error false positives) |
| Prose-style usages in `src/app` + `src/components` (`text.prose` 38, `text.lead` 7, `text.body` 11) | **56** |
| Of which `text.prose` alone (all sentence style; two are name lists) | 38 |
| Static `kicker=` props that repeat the title, the tab or the section label | 18 (PLAN x6, SYNC x3, PROGRAM x2, one each ROUTINE, TREND, STRENGTH, FATIGUE, CUSTOM, CHECK-IN · 3 TAPS, APP) |
| Mono meta lines classed CUT or SHORTEN (rows in section 2) | 31 |
| `show({...})` dialogs / of which message >= 5 words | 22 / 14 |
| Classification of every row | CUT 89 · SHORTEN 76 · VISUAL 34 · KEEP 55 |

### Eight worst screens, by non-numeric words in audited strings

Words counted from the strings in the table of each screen in section 2 (dynamic parts counted as one token; dynamic sentences use one representative example; shared-component rows are added to the screen that renders them, `src/lib` builders are not, since the screen table already quotes their output). Sorted descending.

| # | Screen | Words | Sentences >= 5 words | CUT | SHORTEN | VISUAL |
|---|---|---|---|---|---|---|
| 1 | `sign-in.tsx` | 319 | 24 | 13 | 18 | 3 |
| 2 | `check-in.tsx` | 143 | 7 | 3 | 3 | 5 |
| 3 | `(tabs)/index.tsx` | 131 | 9 | 9 | 6 | 4 |
| 4 | `live.tsx` | 98 | 8 | 5 | 6 | 2 |
| 5 | `program/[id].tsx` | 92 | 7 | 5 | 5 | 1 |
| 6 | `settings.tsx` | 74 | 6 | 7 | 4 | 0 |
| 7 | `(tabs)/load.tsx` | 71 | 6 | 3 | 2 | 4 |
| 8 | `(tabs)/session/programs.tsx` | 61 | 6 | 4 | 2 | 0 |

### Single most impactful cuts

1. **Every empty-state sentence** (about two dozen strings, listed in section 3 row 6). §0 says an empty component stays *visible and dim*; the sentence is the redundant half. Delete text, keep the dim frame and the one action.
2. **18 static kickers** repeat the title, the tab or the section label ("PLAN" x6, "SYNC" x3, "PROGRAM" x2, "TREND", "FATIGUE", "CUSTOM", "STRENGTH", "APP"). One line of mono label each, zero information.
3. **Check-in footnote** (43 words) and **Account "WHY" / "One phone at a time" / idle export line** (26 + 15 + 21 words): explanation of a design decision or a feature to the user.
4. **Meta lines under settings, account, program and session-tab rows** ("SENDS ONLY WHAT CHANGED", "THE SAME, FOR A LIFT THAT NEEDS LESS", "routines on weekdays"): mono helper lines describing the next screen or restating a switch position. Settings is now a one-line-row rule (section 5).
5. **Dialogs that guard against a state the UI could show** (3x "Add an exercise first", 5x "A session is already running", "Nothing is scheduled", "Finish this session?"): disable/dim the button, or turn Start into Resume, and delete 10 dialogs.

## 2. Per-screen table

Ordered as the app: root, secondary screens, then tabs. Every non-dev file under `src/app` has a heading.

### `_layout.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 59 | "DATABASE" | `text.label` | **CUT** | The lead below already says it. |
| 60 | "The database could not be migrated." | `text.lead` | **SHORTEN** | "Database error" |
| 64 | "{SQLite reason}\n\n{drizzle message}" | `text.prose` | **KEEP** | Diagnostic; the only screen that cannot recover. |

### `sign-in.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 363 | "Account · SYNC" | `text.label` | **CUT** | Kicker "SYNC" repeated in the SYNC section label below it. |
| 366 | "Sync is not configured on this build. Your workouts are on this phone and nowhere else." | `text.prose` | **CUT** | A build-config fact the user cannot act on. Hide SYNC entirely. |
| 173 | "SYNC" | `Section label` | **KEEP** |  |
| 175 | "Backed up 5 min ago · 2 changes waiting (describeSync)" | `text.prose` | **VISUAL** | Status dot (green synced / gold pending / red failed) + "5 MIN" + pending count as a number. Builder: src/lib/sync.ts describeSync. |
| 180 | "SENDS ONLY WHAT CHANGED" | `text.meta` | **CUT** | Implementation detail. |
| 180 | "Working…" | `text.rowTitle` | **KEEP** |  |
| 183 | "REPLACES EVERYTHING ON THIS PHONE (x2: cloud restore, file restore)" | `text.meta` | **VISUAL** | Red row name; the confirm dialog carries the words. Drop the meta. |
| 187 | "One phone at a time: a second phone that backs up here would overwrite this phone's copy." | `text.prose` | **SHORTEN** | Real risk. "ONE PHONE ONLY" once, as meta on Back up now, or inside the restore dialog. |
| 157 | "Replace everything?" | `dialog.title` | **SHORTEN** | "Replace all data?" |
| 159 | "Everything on this phone is deleted and replaced with your cloud copy. Your current database is written to a rollback file first." | `dialog.message` | **SHORTEN** | Data loss: keep, cut to "Phone data replaced by cloud copy. Rollback file saved first." |
| 266 | "{describeBackup}\n\nEverything on this phone is deleted and replaced with this file. Your current database is written to the same folder as a rollback file first." | `dialog.message` | **SHORTEN** | Keep the tally line (it identifies the file); cut the rest to "Rollback file saved first." |
| 140 | "Restored 1,234 rows from the cloud. Your previous database is in {rollbackName}." | `text.prose` | **SHORTEN** | "1,234 rows · rollback {name}" — the file name is the one useful fact. |
| 139 | "Restore cancelled — {reason}." | `text.prose` | **CUT** | The user cancelled; clear the note. |
| 166 | "Restore cancelled. Nothing was written. (x3)" | `text.prose` | **CUT** | As above. |
| 147 | "Restore failed. Your data is untouched." | `text.prose` | **SHORTEN** | "Restore failed" (the dialog beside it already shows the error); keep "untouched" as green tick if wanted. |
| 305 | "Restore failed. Nothing was written — your data is untouched." | `text.prose` | **SHORTEN** | "Restore failed" |
| 293 | "Restore cancelled — no rollback file, so nothing was written." | `text.prose` | **SHORTEN** | "No rollback file — cancelled" |
| 297 | "Restored 1,234 rows. Your previous database is in {rollback.name}." | `text.prose` | **SHORTEN** | "1,234 rows · rollback {name}" |
| 312 | "YOUR DATA" | `Section label` | **KEEP** |  |
| 317 | "EVERY SESSION, SET AND ROUTINE, AS JSON" | `text.meta` | **CUT** |  |
| 323 | "PICK A FILE BELOW" | `text.meta` | **CUT** | The list appears below the row. |
| 332 | "Pick a folder and the whole database is written there as one file. This phone is the only copy until you do." | `text.prose` | **CUT** | 21-word idle placeholder for a status line; make the idle state empty. |
| 209 | "Wrote jymiq-2026-09-13.json — 1,234 rows." | `text.prose` | **SHORTEN** | "1,234 rows saved" |
| 210 | "Export cancelled. Nothing was written." | `text.prose` | **CUT** |  |
| 219 | "Export failed. Nothing was written." | `text.prose` | **SHORTEN** | "Export failed" |
| 236 | "No Jymiq backups in that folder." | `text.prose` | **SHORTEN** | "No backups here" |
| 338 | "TAP TO SEE WHAT IS IN IT" | `text.meta` | **CUT** | File rows navigate; the chevron says so. Show the exported date as the meta. |
| 239 | "Could not read that folder / Could not read that file" | `dialog.title` | **SHORTEN** | "Unreadable folder" / "Unreadable file" |
| 259 | "This file is not a Jymiq backup. / This file is not valid JSON. / This backup has no tables in it. / This backup does not say what version it is. / Table "x" says N rows but has M — the file is truncated or damaged. / made by a newer version ... (src/lib/import.ts)" | `text.prose` | **SHORTEN** | Collapse to one string: "Not a valid backup." Diagnostics to console. |
| 452 | "OR BY EMAIL" | `Section label` | **SHORTEN** | "OR" |
| 447 | "OPENS A BROWSER, RETURNS HERE" | `text.meta` | **CUT** |  |
| 466 | "WHY" | `Section label` | **CUT** |  |
| 469 | "Signing in backs your workouts up to your account, sending only what changed. This phone stays the source of truth and everything works without an account." | `text.prose` | **CUT** | 26 words selling the feature on the screen you only reach by choosing it. |
| 398 | "Enter an email address first." | `text.prose` | **VISUAL** | Red field border. |
| 403 | "Link sent to {address}. Open it on this phone." | `text.prose` | **SHORTEN** | "Link sent" + check-mark. |
| 391 | "Google did not return a sign-in code." | `text.prose` | **SHORTEN** | "Sign-in failed" |
| 475 | "Send magic link" | `text.action` | **SHORTEN** | "Send link" |

### `settings.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 55 | "KILOGRAMS ARE ALWAYS WHAT IS STORED" | `text.meta` | **CUT** | Implementation detail from AGENTS.md leaking into the UI. Lab 49: one-line row. |
| 70 | "ON — LOGS UNSET UNLESS YOU DIAL IT / OFF — SET IT ONLY IF YOU USE IT" | `text.meta` | **CUT** | The switch position says ON/OFF. Lab 49: one-line row. |
| 79 | "Default rest · compound" | `text.rowTitle` | **SHORTEN** | "Rest · compound" |
| 80 | "WHEN THE ROUTINE AND THE EXERCISE SAY NOTHING" | `text.meta` | **CUT** | Lab 49: one-line row. |
| 87 | "THE SAME, FOR A LIFT THAT NEEDS LESS" | `text.meta` | **CUT** | Lab 49: one-line row. |
| 86 | "Default rest · isolation" | `text.rowTitle` | **SHORTEN** | "Rest · isolation" |
| 93 | "Tap opens the keypad" | `text.rowName` | **SHORTEN** | "Tap opens keypad" |
| 94 | "OTHERWISE LONG-PRESS · TAP ARMS THE TAPE" | `text.meta` | **CUT** | Lab 49: one-line row. |
| 105 | "Account and your data" | `text.rowTitle` | **SHORTEN** | "Account" |
| 105 | "SYNC, EXPORT AND RESTORE" | `text.meta` | **CUT** | Lab 49: one-line row; show a status dot as the value instead. |
| 109 | "Your workouts are on this phone. Export is the only copy that leaves it." | `text.prose` | **CUT** | Also untrue once cloud backup is on. |

### `live.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 233 | "No session · LIVE · NOTHING RUNNING" | `text.label` | **CUT** | Unreachable in normal use; redirect to Today instead of drawing a screen. |
| 235 | "Start a routine and it takes over this screen." | `text.prose` | **CUT** | Explains the navigation model to nobody. |
| 250 | "EMPTY SESSION / This session has no exercises in it yet." | `text.prose` | **VISUAL** | Open the exercises sheet on its "+" row automatically. |
| 315 | "EXERCISE 2 OF 5" | `text.label` | **KEEP** | Numbers; the K3 ladder is the visual twin. |
| 329 | "SET 4 OF 5" | `text.label` | **KEEP** | §0: written, fixed. |
| 281 | "KG · 79% OF 1RM" | `mono 13` | **SHORTEN** | "KG · 79%" — the mark on the ring is the 1RM; the % has no key today (Legibility). |
| 374 | "RIR 2" | `text.label` | **CUT** | A second acronym to explain the first. RPE stays; RIR goes. |
| 392 | "LAST TIME" | `Section label` | **KEEP** | The number under it is the point. |
| 394 | "80 kg × 8 @ RPE 7" | `text.body` | **KEEP** | Numbers. (lower-case "kg" is hard-coded.) |
| 400 | "SESSION" | `Section label` | **CUT** | A running clock needs no label. |
| 408 | "REST 1:23" | `text.num` | **KEEP** | Accent; tap to clear. |
| 417 | "Finish session" | `text.body` | **SHORTEN** | "Finish" |
| 461 | "Log set" | `text.action` | **KEEP** |  |
| 166 | "Discard this session?" | `dialog.title` | **SHORTEN** | "Discard session?" |
| 167 | "{tally} will be deleted, along with any records from this session. This cannot be undone." | `dialog.message` | **SHORTEN** | Data loss, keep, but: "Deletes 4 sets and any records." (red Discard button already says "cannot undo".) |
| 177 | "Keep going" | `text.rowName` | **SHORTEN** | "Keep" |
| 184 | "Finish this session? / {tally}." | `dialog.title` | **CUT** | Two taps (Finish then confirm) to say "4 logged sets". The summary screen already shows SETS; finish directly and keep discard on the summary. |
| 203 | "Not yet" | `text.rowName` | **SHORTEN** | "Back" |
| 300 | "Logged / HEAVIEST 100 \n WAS 95 \n\n BEST ESTIMATED 1RM 120 ..." | `dialog.message` | **VISUAL** | A modal in the middle of a set. Flash the Log button gold and slide a PR pill with the value above the ring; the record list stays on the summary. |

### `check-in.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 143 | "CHECK-IN · 3 TAPS" | `text.label` | **CUT** | Three scales are visible; the title is the screen. |
| 142 | "How are you today?" | `text.h1` | **SHORTEN** | "Check-in" |
| 39 | "SLEEP: POOR / OK / GOOD" | `text.pill` | **KEEP** | Tint the selected cell (red/grey/green) so the answer is a colour before it is a word. |
| 46 | "SORENESS: NONE / SOME / A LOT" | `text.pill` | **KEEP** | As above. |
| 49 | "ENERGY: LOW / OK / GOOD" | `text.pill` | **KEEP** | As above. |
| 176 | "WHAT THAT MEANS" | `Section label` | **CUT** | The verdict needs no introduction. |
| 179 | "Train as planned. / Train as planned, and ease off if the warm-ups feel slow. / Go lighter today. / Consider resting today." | `text.lead` | **VISUAL** | One-word state on a 4-step coloured chip: GO (done green) / EASY (gold) / LIGHT (orange) / REST (live red). Sentence is by design (§0); see section 3. |
| 180 | "You said sleep was poor and energy is low. Quads, glutes and hamstrings were trained yesterday — 12, 8 and 6 working sets." | `text.prose` | **VISUAL** | The "You said" half echoes the three scales just tapped: CUT. The muscle half becomes body-map-heat chips ("QUADS 12 · 1D") reusing HeatMeter. |
| 183 | "Answer all three and the call appears here." | `text.prose` | **VISUAL** | Dim chip slot with three empty pips that fill as you tap. |
| 187 | "THIS IS A GUESS, NOT A MEASUREMENT" | `Section label` | **SHORTEN** | "GUESS" as a small pill beside the verdict chip. |
| 189 | "Three taps and which of today's muscles you trained in the last two days. No wearable, no HRV, no sleep tracking — so it is worth exactly what you put into it, and it is written as a sentence rather than a score for that reason." | `text.prose` | **CUT** | 43 words justifying a design decision to the user. The largest single text block in the app. The GUESS pill and the chip style (not drawn like a lifted number) carry §0. |
| 198 | "Start {routine name}" | `text.action` | **SHORTEN** | "Start" |
| 200 | "SKIP" | `text.label` | **KEEP** |  |
| 122 | "Add an exercise first / A routine needs at least one lift before it can start." | `dialog.title` | **VISUAL** | See Today: disable Start instead of a dialog. |
| 132 | "A session is already running / Finish or discard it before starting another." | `dialog.title` | **VISUAL** | See Today: Resume. |

### `bodyweight.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 99 | "TREND" | `text.label` | **CUT** |  |
| 106 | "LATEST / 7-DAY AVG" | `text.label` | **KEEP** |  |
| 116 | "−0.4 KG · 30 DAYS" | `text.numSm` | **KEEP** | Numbers. |
| 124 | "LAST 14 DAYS · KG" | `Section label` | **KEEP** |  |
| 130 | "Log a weigh-in and the trend starts here." | `text.prose` | **CUT** | The Log weight button is on screen; show a dim empty chart frame. |
| 131 | "The line draws from the second weigh-in in the last 14 days." | `text.prose` | **VISUAL** | Draw the single point on the dim chart; the missing line explains itself. |
| 153 | "12 WEIGH-INS" | `text.meta` | **SHORTEN** | "12" |
| 91 | "Enter a weight between 20 and 350 kg." | `text.prose` | **VISUAL** | Red field border on invalid; range as field hint "20–350". |
| 170 | "WEIGHT · KG" | `text.label` | **KEEP** |  |
| 166 | "Log weight" | `text.action` | **KEEP** |  |

### `body.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 30 | "FATIGUE" | `text.label` | **CUT** | The figure is the screen. |
| 37 | "FRONT / BACK" | `text.label` | **KEEP** |  |
| 52 | "LESS WORKED / MOST WORKED" | `text.label` | **SHORTEN** | "LESS" / "MORE" (this is the legend; keep it). |
| 58 | "WORKED HARDEST" | `Section label` | **KEEP** |  |
| 65 | "{n} SETS / 7 DAYS" | `text.meta` | **SHORTEN** | "{n}" — the heat meter is the comparison; "7 DAYS" once in the label. |
| 73 | "Nothing trained in the last 7 days." | `text.prose` | **CUT** | The map draws cold; no text needed. |

### `summary/[id].tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 121 | "SESSION COMPLETE · TUE 2 SEP" | `text.label` | **SHORTEN** | "TUE 2 SEP" |
| 88 | "TIME / VOLUME / SETS / RECORDS" | `text.label` | **KEEP** |  |
| 132 | "NEW RECORDS" | `Section label` | **SHORTEN** | "RECORDS" (or none: gold PR pills say it) |
| 153 | "WHAT YOU LIFTED" | `Section label` | **SHORTEN** | "LIFTS" |
| 160 | "5 SETS · TOP 100 × 5 · 2.1 T" | `text.meta` | **KEEP** | Numbers. |
| 187 | "BEST ESTIMATED 1RM · WAS 110" | `text.meta` | **SHORTEN** | See the `lib/pr.ts` PR_LABELS row in the shared table. |

### `history/[id].tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 93 | "No sets logged in this session." | `text.prose` | **CUT** |  |
| 111 | "NOT LIFTED" | `Section label` | **SHORTEN** | "SKIPPED" |
| 164 | "SET / KG / REP / RPE / e1RM (table header)" | `text.label` | **KEEP** | e1RM is jargon; see Legibility. |
| 87 | "{skipped lift names}" | `text.prose` | **KEEP** | Names. |

### `exercise/new.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 74 | "New exercise · CUSTOM" | `text.label` | **CUT** |  |
| 83 | "NAME / EQUIPMENT / TYPE / DEFAULT REST" | `text.label` | **KEEP** |  |
| 120 | "MUSCLES WORKED" | `Section label` | **SHORTEN** | "MUSCLES" |
| 137 | "TRACKING" | `Section label` | **CUT** | A section for one switch. |
| 142 | "OFF BY DEFAULT · SEE SETTINGS" | `text.meta` | **CUT** | The switch shows OFF. |
| 151 | "Create exercise" | `text.action` | **SHORTEN** | "Create" |

### `exercise/[id].tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 73 | "{exercise.description} (seed text, sentences)" | `text.body` | **CUT** | HOW TO cues carry the same information; the illustration and muscle chips carry the rest. |
| 80 | "MUSCLES" | `Section label` | **KEEP** |  |
| 81 | "CHEST · TRICEPS · SHOULDERS (prime) / {assist} (secondary)" | `text.body` | **VISUAL** | Highlight the same muscles on the body-map figure (already drawn). |
| 87 | "HOW TO {01…n cue sentences}" | `text.body` | **KEEP** | Instruction text the user came for. Optional: collapse to first two. |
| 100 | "YOUR NUMBERS / Nothing logged yet. Your best set and estimated 1RM appear here after the first session." | `text.prose` | **CUT** | 15 words; show a dim empty chart frame. |
| 109 | "One session logged. The trend draws from the second." | `text.prose` | **VISUAL** | Draw the one column; the absence of a second column is the message. |
| 114 | "ESTIMATED 1RM · UP 5 KG OVER 6 SESSIONS" | `Section label` | **SHORTEN** | "1RM +5 KG" — §0 wants a takeaway in the title; the shorter form keeps it. Builder: src/lib/e1rm.ts e1rmTakeaway. |
| 130 | "ILLUSTRATION BY BRYL LIM · CC BY-SA 4.0" | `text.meta` | **KEEP** | Licence requirement. Could live once under Settings instead of on every exercise. |

### `routine/new.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 30 | "New routine · PLAN" | `text.label` | **CUT** | "PLAN" kicker appears 6 times (5 screens) and says nothing. |
| 37 | "Optional" | `placeholder` | **CUT** | A NOTE field is obviously optional. Empty placeholder (also on routine edit, program/new). |
| 43 | "Create routine" | `text.action` | **SHORTEN** | "Create" |

### `routine/[id].tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 162 | "ROUTINE" | `text.label` | **CUT** |  |
| 128 | "LAST TIME (a duration) / LAST VOLUME" | `text.label` | **SHORTEN** | "TIME" / "VOLUME" — tiles reading LAST TIME 52 MIN read as a date. See Legibility. |
| 189 | "No lifts yet. Add them from the library, or copy them from another routine." | `text.prose` | **CUT** | There is no copy-from-another-routine feature in the app (verified: no such route). Replace with an "Add exercise" row. |
| 198 | "No sessions from this routine yet." | `text.prose` | **CUT** |  |
| 203 | "Start {routine name}" | `text.action` | **SHORTEN** | "Start" |
| 223 | "5 × 8 @ 102.5 KG · REST 3:00" | `text.meta` | **KEEP** | Numbers. |
| 98 | "Add an exercise first / A routine needs at least one lift ..." | `dialog.title` | **VISUAL** | Disable Start. |
| 108 | "A session is already running / Finish or discard it ..." | `dialog.title` | **VISUAL** | Resume. |

### `routine/[id]/edit.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 41 | "Edit routine · PLAN" | `text.label` | **CUT** |  |
| 64 | "Remove {lift}?" | `dialog.title` | **VISUAL** | No confirm: remove on tap with an undo snackbar (data is not lost, the exercise stays in the library). |
| 65 | "It stays in your exercise library." | `dialog.message` | **CUT** |  |
| 95 | "REMOVE" | `text.label` | **VISUAL** | A red minus glyph. Label repeated on every row. |
| 104 | "search the library" | `text.meta` | **CUT** | Lower-case, breaking the meta style; "Add exercise" plus a plus icon. |
| 108 | "Tap an exercise to remove it from this routine." | `text.prose` | **CUT** | Every row already says REMOVE. |
| 113 | "Save routine" | `text.action` | **SHORTEN** | "Save" |

### `program/new.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 36 | "New program · PLAN" | `text.label` | **CUT** |  |
| 53 | "A program puts your routines on weekdays. It starts paused; fill the week, then activate it." | `text.prose` | **CUT** | The next screen is that week. |
| 59 | "Create program" | `text.action` | **SHORTEN** | "Create" |

### `program/[id].tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 125 | "WEEK / DAYS A WEEK" | `text.label` | **SHORTEN** | "WEEK" / "DAYS" |
| 173 | "SESSIONS PER WEEK · WEEK 3 IS UNDER WAY" | `Section label` | **SHORTEN** | "PER WEEK" — the last column is the current week (accent). |
| 165 | "RUNNING" | `Pill` | **KEEP** |  |
| 219 | "No routines yet. Make one on the Session tab and it lands here." | `text.prose` | **CUT** | A "+ ROUTINE" chip that routes to /routine/new. |
| 232 | "THE ROUTINES ON IT STAY" | `text.meta` | **CUT** | Said again in the delete dialog. |
| 232 | "DELETE" | `text.label` | **CUT** | Repeats the title "Delete program". |
| 237 | "Put a routine on at least one weekday, then activate it. Until a program is running, every untrained day is rest rather than missed." | `text.prose` | **CUT** | 24 words; the schedule with all-Rest days and a disabled Activate says the first half. |
| 238 | "Only one program runs at a time. Activating this one pauses whichever was running." | `text.prose` | **CUT** | The ACTIVE plate on the Programs list already shows one. |
| 143 | "Delete {program}?" | `dialog.title` | **KEEP** |  |
| 144 | "The routines on it stay. Only the weekday plan goes." | `dialog.message` | **SHORTEN** | "Routines stay." |
| 260 | "Nothing is scheduled / Put a routine on at least one weekday first." | `dialog.title` | **VISUAL** | Disable Activate while the schedule is empty. |
| 247 | "Start {routine}" | `text.action` | **SHORTEN** | "Start" |
| 253 | "Pause program / Activate program" | `text.action` | **SHORTEN** | "Pause" / "Activate" |

### `(tabs)/_layout.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 32 | "Today" | `text.tab` | **KEEP** | §0: labelled navigation is a hard requirement. |
| 35 | "Session" | `text.tab` | **KEEP** | §0: labelled navigation is a hard requirement. |
| 42 | "Strength" | `text.tab` | **KEEP** | §0: labelled navigation is a hard requirement. |
| 45 | "Load" | `text.tab` | **KEEP** | §0: labelled navigation is a hard requirement. |

### `(tabs)/index.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 172 | "Nothing scheduled" | `text.lead` | **VISUAL** | Draw the NextCard dim: three grey placeholder lift lines and a dim Start, with one accent MAKE A PROGRAM. §0: "a component that will fill in stays visible and dim". |
| 174 | "A program puts your routines on weekdays, and this card then says which one is next." | `text.prose` | **CUT** | Explains a feature the dim card and the button already imply. |
| 195 | "TODAY · LAST RUN 3 DAYS AGO" | `text.label` | **SHORTEN** | "TODAY · 3D" (NEVER RUN -> "NEW"); "LAST RUN" is implied. |
| 244 | "Start {routine name}" | `text.action` | **SHORTEN** | "Start" — the card directly above names the routine. |
| 216 | "Add an exercise first" | `dialog.title` | **VISUAL** | Disable the Start plate (dim, no press) while the routine has 0 lifts; no dialog. Repeated in check-in, routine/[id]. |
| 217 | "A routine needs at least one lift before it can start." | `dialog.message` | **CUT** | Goes away with the dimmed Start. |
| 228 | "A session is already running" | `dialog.title` | **VISUAL** | When a session is running, every Start becomes a green "Resume" that routes to /live. Repeated 5x (Today x2, check-in, routine/[id], program/[id]). |
| 229 | "Finish or discard it before starting another." | `dialog.message` | **CUT** | Goes away with Resume. |
| 274 | "Nothing logged yet." | `text.lead` | **CUT** | The FIRST STEPS label and three action rows say it. |
| 276 | "The week strip, your records and the recent list fill in as you train. Start with a routine or just open a session and log as you go." | `text.prose` | **CUT** | The largest empty-state block in the app; the empty week strip and rail below it are the demonstration (§0 keeps them dim). |
| 283 | "Build a routine" | `text.rowTitle` | **KEEP** |  |
| 283 | "PICK LIFTS, SETS AND REST" | `text.meta` | **CUT** | Describes the next screen. |
| 287 | "Browse the library" | `text.rowTitle` | **KEEP** |  |
| 288 | "{n} EXERCISES, OR ADD YOUR OWN" | `text.meta` | **SHORTEN** | "{n}" — plus icon on the row. |
| 292 | "Start an empty session" | `text.rowTitle` | **SHORTEN** | "Empty session" |
| 292 | "DECIDE AS YOU GO" | `text.meta` | **CUT** | Synonym of the title. |
| 317 | "3 TAPS · OPTIONAL" | `text.meta` | **SHORTEN** | "OPTIONAL" — or nothing: a row with no state reads as optional. |
| 315 | "TRAIN AS PLANNED, AND EASE OFF IF THE WARM-UPS FEEL SLOW" | `text.meta` | **VISUAL** | The readiness verdict pasted into a meta slot: 12 words at 11pt. Replace with a 4-step coloured pip + 1 word (GO / EASY / LIGHT / REST). See "Sentences by design". |
| 323 | "How are you today?" | `text.rowTitle` | **SHORTEN** | "Check-in" |
| 397 | "Nothing logged yet. Your first session lands here." | `text.prose` | **CUT** | Repeats FirstSteps ("Nothing logged yet.") on the same screen on a fresh install. |
| 320 | "READINESS" | `Section label` | **CUT** | Label + row title + kicker say the same thing three times. |

### `(tabs)/load.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 145 | "THIS WEEK" | `text.label` | **KEEP** | Scopes the tiles. |
| 164 | "WEEKLY SETS PER MUSCLE" | `Section label` | **SHORTEN** | "SETS / MUSCLE" |
| 172 | "No sets logged this week yet." | `text.prose` | **CUT** | Show the muscle rows dim at 0 (§0), or nothing. |
| 179 | "Not yet. / Deload next week. / Too early to call. / Nothing to call yet." | `text.lead` | **VISUAL** | One state pill: DELOAD (red) / HOLD (grey); "Too early" = dim pill. Sentence is by design (§0) — see section 3. |
| 180 | "Volume is in the hard range for chest and back, and bench and squat stopped climbing." | `text.prose` | **VISUAL** | Repeats the ZoneBar HARD/TOO MUCH rows directly above. Replace with chips of the stalled lifts only (name + flat-line glyph). |
| 185 | "BODYWEIGHT" | `Section label` | **CUT** | Row title directly under it is "Bodyweight". |
| 105 | "NOT LOGGED YET" | `text.meta` | **SHORTEN** | "—" |
| 104 | "78.5 KG · 2 DAYS AGO" | `text.meta` | **KEEP** | Numbers. |
| 207 | "Nothing logged this month. Start a session and it lands here." | `text.prose` | **CUT** | The dim calendar is the empty state. |
| 211 | "Trained" | `text.body` | **VISUAL** | Calendar glyph before "12 of 30". |
| 216 | "volume" | `text.body` | **VISUAL** | Barbell/weight glyph before the tonnage. |

### `(tabs)/strength.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 74 | "Records · STRENGTH" | `text.label` | **CUT** | Tab name repeated as a kicker. |
| 60 | "{MUSCLE} WORKED HARDEST" | `text.meta` | **SHORTEN** | "{MUSCLE}" plus a heat swatch (HeatMeter). |
| 60 | "NOTHING IN 7 DAYS" | `text.meta` | **SHORTEN** | "—" |
| 63 | "THIS MONTH / THIS YEAR" | `text.label` | **KEEP** |  |
| 92 | "No records yet. Log a session to set your first one." | `text.prose` | **CUT** | Empty rail; label TIMELINE is enough. |
| 112 | "BEST ESTIMATED 1RM · WAS 110" | `text.meta` | **SHORTEN** | "1RM · WAS 110" — see the `lib/pr.ts` PR_LABELS row in the shared table. |

### `(tabs)/session/_layout.tsx`

No fixed copy of its own (layout only).

### `(tabs)/session/index.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 30 | "Routines · PLAN" | `text.label` | **CUT** |  |
| 43 | "YOUR ROUTINES" | `Section label` | **CUT** | Title says Routines. |
| 56 | "No routines yet. Build one from the library, or start from a template." | `text.prose` | **CUT** | There are no templates. Show one "+ Build a routine" row. |
| 61 | "PROGRAMS" | `Section label` | **CUT** | Row title beneath is "Programs". |
| 65 | "routines on weekdays" | `text.meta` | **CUT** | Lower-case, breaking meta style. |
| 71 | "EXERCISES" | `Section label` | **CUT** | Row title beneath is "Library". |
| 75 | "every exercise, searchable" | `text.meta` | **CUT** |  |

### `(tabs)/session/programs.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 68 | "Programs · PLAN" | `text.label` | **CUT** |  |
| 94 | "BY WEEKDAY · 4 OF 7 DAYS SCHEDULED" | `text.meta` | **SHORTEN** | "4 / 7" — weekday is the only kind of program there is. |
| 101 | "NEXT UP" | `Section label` | **KEEP** |  |
| 142 | "BY WEEKDAY · NEVER RUN / BY WEEKDAY · PAUSED" | `text.meta` | **SHORTEN** | "NEW" / "PAUSED" |
| 133 | "Every program you have is the one that is running." | `text.prose` | **CUT** |  |
| 134 | "No programs yet. A program puts your routines on weekdays, which is what tells a rest day apart from a day you missed." | `text.prose` | **CUT** | 23 words; a "+ New program" row is the empty state. |
| 149 | "name it, then fill the week" | `text.meta` | **CUT** |  |
| 126 | "NOT RUNNING / YOUR PROGRAMS" | `Section label` | **KEEP** |  |

### `(tabs)/session/library.tsx`

| Line | String | Style | Class | Replacement / why |
|---|---|---|---|---|
| 66 | "Add exercise / Library · ROUTINE / EXERCISES" | `text.label` | **CUT** | Kicker ("EXERCISES") repeats the title. |
| 76 | "Search 1300 exercises" | `placeholder` | **KEEP** | Number. |
| 30 | "ALL / BARBELL / DUMBBELL / MACHINE / CABLE / BODYWEIGHT" | `text.label` | **KEEP** |  |
| 94 | "Nothing matches. Clear the filter, or add it as a custom exercise." | `text.prose` | **CUT** | An empty list plus a "+ Add custom" row. |
| 112 | "BARBELL · COMPOUND" | `text.meta` | **SHORTEN** | Drop kind: "compound/isolation" is jargon and unfilterable. |

### Shared components and sentence builders

These render on the screens listed in the last column. Strings here are reached through the screen tables above where the row exists; this is the place to change them once.

| File:line | String | Style | Class | Replacement / why | Rendered on |
|---|---|---|---|---|---|
| `components/calendar.tsx:175` | "LIGHT [3 swatches] HARD [ring] MISSED" | `text.label` | **KEEP** | The only key in the app for a mark; see Legibility (it is missing on the week strip and hidden when no program runs). | (tabs)/load |
| `components/week-strip.tsx:64` | "(no key)" | `-` | **VISUAL** | See Legibility. | (tabs)/index |
| `components/program-week.tsx:56` | "{routine name} / Rest at 13pt prose, 2 lines" | `text.prose` | **SHORTEN** | Routine initial or 3-letter code; rest = a dot. | (tabs)/session/programs |
| `components/zone-bar.tsx:39` | "TOO FEW / GOOD / HARD / TOO MUCH" | `text.label` | **KEEP** | §0-mandated words. "HARD" reads as "difficult", not "high" (Legibility). | (tabs)/load |
| `components/sets-sheet.tsx:138` | "SETS · BENCH PRESS   3 OF 5 DONE" | `text.label` | **SHORTEN** | "BENCH PRESS   3/5" | live |
| `components/sets-sheet.tsx:163` | "SET · KG · REP · RPE · e1RM" | `text.label` | **KEEP** | Column heads. | live |
| `components/sets-sheet.tsx:192` | "Add set" | `sans 14` | **SHORTEN** | "+ Set" / plus glyph. | live |
| `components/exercises-sheet.tsx:100` | "EXERCISES · UPPER A   2 OF 5 DONE" | `text.label` | **SHORTEN** | "UPPER A   2/5" | live |
| `components/exercises-sheet.tsx:44` | "DONE / {n} LEFT" | `text.label` | **VISUAL** | Green index + fill already say done; show "{n}" only. | live |
| `components/keypad-sheet.tsx:82` | "LOAD   WAS 80   KG   Cancel" | `text.label` | **KEEP** | Numbers and buttons. | live |
| `components/param-selector.tsx:21` | "KG / REPS / RPE (selector cells)" | `text.label` | **KEEP** |  | live |
| `components/dialog.tsx:140` | "{message} in text.body 15pt" | `text.body` | **SHORTEN** | Convention: message <= 6 words, or none. 14 of the dialog messages audited are >= 5 words. | * |
| `components/session-row.tsx:42` | "{n} SETS · TOP 100 × 5 · NAME" | `text.meta` | **KEEP** | Numbers. | (tabs)/index, routine/[id] |
| `lib/readiness.ts:34` | "Train as planned. / Train as planned, and ease off if the warm-ups feel slow. / Go lighter today. / Consider resting today." | `text.lead` | **VISUAL** | See section 3. 4 states -> chip + 1 word. | check-in, (tabs)/index |
| `lib/readiness.ts:90` | "You said sleep was poor, soreness is high and energy is low." | `text.prose` | **CUT** | Echo of the scales. | check-in |
| `lib/readiness.ts:62` | "Quads, glutes and hamstrings were trained yesterday — 12, 8 and 6 working sets." | `text.prose` | **VISUAL** | Heat chips with days-ago. | check-in |
| `lib/readiness.ts:95` | "Nothing Upper A works was trained in the last two days." | `text.prose` | **VISUAL** | A green "FRESH" chip (the body map already says FRESH/NEEDS REST). | check-in |
| `lib/readiness.ts:98` | "Nothing you said points the other way." | `text.prose` | **CUT** |  | check-in |
| `lib/deload.ts:73` | "Volume is in the hard range for chest and back, and bench and squat stopped climbing." | `text.prose` | **VISUAL** | See section 3. | (tabs)/load |
| `lib/deload.ts:82` | "Volume is in the hard range for X, but Y keeps climbing. Deload when both are true. (and 2 variants)" | `text.prose` | **CUT** | Teaches the rule; drop "Deload when both are true". | (tabs)/load |
| `lib/deload.ts:97` | "Volume is within range and squat keeps climbing." | `text.prose` | **CUT** | ZoneBars show "GOOD". | (tabs)/load |
| `lib/deload.ts:60` | "A deload call needs a few sessions of history to compare against." | `text.prose` | **CUT** | "Too early" chip is enough. | (tabs)/load |
| `lib/deload.ts:108` | "No sets logged this week. The call updates as soon as one is." | `text.prose` | **CUT** |  | (tabs)/load |
| `lib/deload.ts:103` | "Volume is within range. No lift has three sessions of history to judge yet." | `text.prose` | **CUT** |  | (tabs)/load |
| `lib/next.ts:23` | "NEVER RUN / LAST RUN TODAY / LAST RUN YESTERDAY / LAST RUN 3 DAYS AGO" | `text.label` | **SHORTEN** | "NEW" / "TODAY" / "1D" / "3D" | (tabs)/index |
| `lib/next.ts:17` | "TODAY / TOMORROW / TUE 2 SEP" | `text.label` | **KEEP** |  | (tabs)/index, (tabs)/session/programs |
| `lib/sync.ts:126` | "Not backed up yet. / Backed up 5 min ago · 2 changes waiting / Last backup failed — {error}" | `text.prose` | **VISUAL** | Dot + relative time + count. | sign-in |
| `lib/import.ts:131` | "3 sessions · 42 sets · 1 routine · 18 records — exported 13 Sep 2026" | `text.prose` | **KEEP** | Identifies the file in a data-loss dialog. | sign-in |
| `lib/e1rm.ts:42` | "UP 5 KG OVER 6 SESSIONS / DOWN 3 KG OVER 4 SESSIONS / UNCHANGED OVER 6 SESSIONS" | `Section label` | **SHORTEN** | "+5 KG" / "−3 KG" / "FLAT" | exercise/[id] |
| `lib/landmarks.ts:28` | "TOO FEW / GOOD / HARD / TOO MUCH" | `text.label` | **KEEP** | §0. | (tabs)/load |
| `lib/pr.ts:125` | "HEAVIEST / BEST ESTIMATED 1RM / MOST REPS AT {w} / BEST SET VOLUME / BEST SESSION VOLUME" | `text.meta` | **SHORTEN** | "WEIGHT" / "1RM" / "REPS @ 80" / "SET VOL" / "SESSION VOL"; gold PR pill + value already says record. | (tabs)/strength, summary/[id], live |
| `lib/time.ts:78` | "52 MIN" | `text.label` | **KEEP** |  | * |
| `app/(tabs)/load.tsx:225` | "TODAY / 1 DAY AGO / 2 DAYS AGO" | `text.meta` | **SHORTEN** | "TODAY" / "1D" / "2D" | (tabs)/load |

## 3. Sentences by design

Places where `claudedocs/design-exploration.md` makes a sentence the intended answer. The owner decides whether to overturn each. §4 of the same file records that the owner "rejects anything that has to be decoded" and prefers "the quietest option that still says something", which argues for overturning most.

| # | §0 rule (quoted) | Builder location | Current output | Overturn? sketch |
|---|---|---|---|---|
| 1 | "Model output ... Deload and readiness are sentences; the body map says FRESH/NEEDS REST, not a percentage." (§0 Model output row, design-exploration.md:51) | `src/lib/readiness.ts:34` `LEADS`, `:77` `readinessCall`; shown at `check-in.tsx:179-180`, and pasted into a meta slot at `(tabs)/index.tsx:308-316` | "Train as planned." / "...ease off if the warm-ups feel slow." / "Go lighter today." / "Consider resting today." + a reason sentence | Body map already proves the alternative: FRESH/NEEDS REST words on a heat colour. A 4-step chip (GO / EASY / LIGHT / REST) keeps §0's "not drawn like a number you lifted" (a word on a chip, not a score) with 1 word instead of 12. |
| 2 | Same row, deload half | `src/lib/deload.ts:52` `deloadCall` (7 outcomes); shown at `(tabs)/load.tsx:179-180` | "Deload next week." / "Not yet." + "Volume is in the hard range for chest and back, and bench stopped climbing." | lab37.py D1 caption: "The deload answer is prose because the honest version has two conditions in it"; design-exploration.md:996 lists the deload call as plain text. The two conditions are already drawn: ZoneBar HARD/TOO MUCH rows directly above, and the stalled lifts. Chip DELOAD/HOLD plus stalled-lift chips shows both. |
| 3 | "The readiness caveat is the one prose block left off a plate" (design-exploration.md:977) | `check-in.tsx:187-193` (section label + 43-word paragraph) | "THIS IS A GUESS, NOT A MEASUREMENT ..." | The caveat is required; the paragraph is not. A "GUESS" pill beside the verdict chip. |
| 4 | "Charts ... a title that states the takeaway." (§0 Charts row) | `src/lib/e1rm.ts:38` `e1rmTakeaway`; shown at `exercise/[id].tsx:114`; bodyweight tile `bodyweight.tsx:116` | "ESTIMATED 1RM · UP 5 KG OVER 6 SESSIONS" | Keep the takeaway, drop the clause: "1RM +5 KG". |
| 5 | "Month summary is one line of text, not a second chart." (§0 Calendar row) | `(tabs)/load.tsx:206-219` | "Trained 12 of 30 \| volume 45 T" | Already numbers; only the two words "Trained"/"volume" are text. Swap for glyphs. |
| 6 | "The empty state is a short sentence plus a set of actions — never an apology, never an illustration." (§0 Empty states row) | `(tabs)/index.tsx:172-175, 274-278, 397`; `session/index.tsx:55`, `programs.tsx:131`, `library.tsx:93`, `strength.tsx:92`, `load.tsx:172,206`, `body.tsx:73`, `history/[id].tsx:93`, `routine/[id].tsx:188,198`, `bodyweight.tsx:128`, `exercise/[id].tsx:101,109` | about two dozen different empty sentences | The same row also says "A component that will fill in stays visible and dim". The sentence is the half that can go; the actions stay. This is the largest overturn by volume. |
| 7 | "Set indicator: Written: `SET 4 OF 5`" (§0) | `live.tsx:328-330` | "SET 4 OF 5" | 4 words, all numbers or structure. Keep. |
| 8 | "Zone bar ... number carries the verdict, words not acronyms" (§0) and Lab 13 "with a sentence saying what to do" (design-exploration.md:320) | `src/lib/landmarks.ts:33-36` `verdict` -> `components/zone-bar.tsx:39` | TOO FEW / GOOD / HARD / TOO MUCH | Four one-word verdicts. Keep. The "sentence saying what to do" clause of Lab 13 is what `deloadCall` implements (row 2). |
| 9 | "Today ... A quiet raised card carrying the next routine, its first three lifts and a full-width accent Start" (§0 Today row) | `(tabs)/index.tsx:194-206` | "TODAY · LAST RUN 3 DAYS AGO", routine name, "5 LIFTS · 15 SETS", three lift names | This is the "what to do next" answer. It is names and numbers, not a sentence: keep; shorten the due line only. |
| 10 | Data-loss dialogs (not §0, but safety) | `live.tsx:166`, `sign-in.tsx:157, 264` | "Everything on this phone is deleted and replaced ..." | Keep the dialog, cut to one clause + a red Replace button. |

## 4. Legibility problems

Marks the user must decode with no key on the screen. §4 of design-exploration.md: the owner "rejects anything that has to be decoded ... the single most load-bearing constraint in this document" and "asks what does this indicate? of anything decorative".

| # | Mark | Where | Problem | Fix |
|---|---|---|---|---|
| 1 | **Missed-day ring** (grey `tick2` outline round the date) | `components/week-strip.tsx:102` (Today); `components/calendar.tsx:141` (Load) | Week strip has **no key at all**. The calendar key always shows LIGHT/HARD but adds its MISSED entry only when a program schedule exists (`calendar.tsx:87`), and that swatch is an empty pill outline (15 x 11) while the mark is a ring round a numeral; the ring colour `tick2` is close to the rest plate on a dark ground. A ring is also the calendar's **today** mark (accent `boxShadow`), so two ring meanings share the grid. | Make missed a filled red-tint dot under the numeral (or a small ✕), and today a filled accent pill. Keep the key row, always, and draw the swatch as the real mark. Week strip: add the same one-line key under the strip (`REST · MISSED · TODAY`), or drop missed there. |
| 2 | **Rest vs future vs adjacent-month** | `calendar.tsx:117-118`, `week-strip.tsx:59-67` | Rest = faint plate; adjacent-month days = 0.4 opacity; ahead/rest strip cells differ only by grey step (`lo` vs `dim`). Three grey levels with no legend. | One dim style for "nothing here"; show the schedule (routine initial) on scheduled future days instead of a fourth grey. |
| 3 | **Calendar intensity** LIGHT ... HARD | `calendar.tsx:172-205` | Key exists. But intensity is *relative volume* (`lib/calendar.ts` steps) and the key does not say relative to what; "HARD" (effort) is not "heavy" (volume). | Label "LESS ... MORE" like the body-map legend (`body.tsx:61-64`). |
| 4 | **Week strip bar height** | `week-strip.tsx:70-73` | A bar per day; the tallest bar is "best day in view" (relative). Green vs gold for today. No key; the volume number for the bar is not shown per cell (only the two-week totals under it). | Print the tonnage on the tallest bar, or drop the height and use the three calendar steps. |
| 5 | **Rail dot colour** (gold / 3 greys by recency) | `lib/time.ts:103-108` `sessionDotTone`; `components/rail.tsx` | Colour encodes age (<=2, <=6, <=12, 13+ days) and the comment above the function says the boards use two variants of the rule and the code implements one. No legend; the date is already in the row. | Drop the encoding (all one grey, newest gold) or label it. |
| 6 | **K3 exercise ladder** (numbers down the left edge: green done, gold current, grey ahead) | `live.tsx:437-458` | §0 accepts it; nothing on screen says it is tappable or what green means. Colour-only state on a 11pt numeral. | Keep, but make the current one a filled tick; done = check glyph. |
| 7 | **Ring "mark" (1RM) and "79% OF 1RM"** | `components/load-ring.tsx:73`, `live.tsx:281` | A mark on the dial with no label; the percentage under the load is the only explanation and it says "OF 1RM" without saying which lift or that it is estimated. | Label the mark "1RM" only while editing load (numerals already appear then); drop the subline. |
| 8 | **e1RM / RPE / RIR / REP** | `history/[id].tsx` table head, `sets-sheet.tsx:163`, `param-selector.tsx:20`, `live.tsx:374` gloss | Four gym acronyms as column heads. `RIR` is introduced by a gloss under RPE only when RPE is selected. `e1RM` is the last column, in the accent, never explained. | Replace "e1RM" with "1RM" and a tilde on values (`~120`), or drop the column from the history table. |
| 9 | **Zone bar boundaries** | `components/zone-bar.tsx` | Three zones tinted (grey / green / red) and a white marker, boundaries unlabeled. The verdict word is at the right, 64pt wide. Users cannot tell which side of "GOOD" they are heading toward. | Add low/high sets as tiny ticks (e.g. `8  14`) under the bar only for the top row, or nothing. |
| 10 | **Tile labels "LAST TIME" / "LAST VOLUME"** | `routine/[id].tsx:127-137` | "LAST TIME 52 MIN" reads as a date. | "TIME" / "VOLUME" with the delta or a rail dot. |
| 11 | **Pill "WEEK 3" beside the program name** | `programs.tsx:90` | Reads as the calendar week of the year. | "W3" or a progress like "3 / 8" if the program has a length; else drop. |
| 12 | **Body map heat / HeatMeter** | `body.tsx:59-65` | Has a LESS/MOST WORKED gradient key. This is the good example: one legend, one gradient. | Copy this pattern for 1-5. |

## 5. Settings, one line per row (Lab 49 request)

Owner rule added mid-audit: every Settings row is one line, label left, value right, chevron if it navigates; no helper text. Panel drawn in `claudedocs/design-labs/lab49_settings.py` (exports `COLS`, two columns E1 and E2; `python3 lab49_settings.py` writes a preview; it passes `gate.py` READY when built next to `kit.py`). Uses only `kit.lrow`, `kit.prows`, `kit.psec` and `kit.phone`.

| Row (as redrawn) | Value cell | Chevron? | Exists in app? |
|---|---|---|---|
| Weight | KG (tap cycles kg/lb) | no | yes |
| Distance | CM | yes | board only (nothing renders a distance) |
| Language | EN | yes | board only |
| Track RPE | switch | no | yes |
| Rest · compound / Rest · isolation | 3:00 / 1:30 | yes | yes |
| Warm-up ramps | switch | no | board only (`warmupRamp` has no caller) |
| Tap opens keypad | switch | no | yes |
| Colours (plate) | COMPETITION | yes | board only (`PLATE_COLORS` has no caller) |
| Plate maths | switch | no | board only (`solvePlates` has no caller) |
| Account | status dot | yes | yes |
| Back up now | dot + "5 MIN" | no | yes (in sign-in) |
| Restore from cloud | red name | yes | yes (in sign-in) |
| Export everything | - | yes | yes (in sign-in) |

**Does kit's list-row spec need a single-line variant? No new variant is needed; it needs a rule and two helpers.**
- The app's `ListRow` (`src/components/list-row.tsx`) already renders one line when `meta` is omitted; `meta` is an optional prop. `Toggle` (`src/components/toggle.tsx`) likewise treats `meta` as optional. The two-line shape is a *usage*, not a component.
- `kit.lrow(left, right)` takes free markup, so the name-plus-mono-meta pair is built by callers (`lab37.srow`/`stoggle` at `lab37.py:171-190`, where `stoggle` still takes a `meta`).
- The one real two-line piece is `ListRow`'s `valueLabel` + `value` stack (label over value, right-aligned); Settings should not use it.
- Recommendation: promote `lab49_settings.srow` (name, value, chevron, optional status dot) and `stoggle` (name, switch, **no** meta parameter) into `kit.py`; document in §0 List row: "Settings rows: no meta line"; in the app, drop `meta` from every `ListRow`/`Toggle` in `settings.tsx` and use a status dot as `right` on Account.
- The live app already omits five of the board rows because nothing consumes them (`settings.tsx` header comment); the redraw keeps them so the owner sees the intended length. Drop them from the panel if only shipping rows matter.

