"""Lab 48 — Every screen, in one place.

The app, laid out. Every screen that has been drawn, grouped by the tab it lives
in, each on the settled design system, each captioned with the decisions inside
it and whether it is on the phone today.

This is the design file. Lab 47 is the system it is built from; the earlier labs
are the arguments that got there and are not state. Nothing here is redrawn —
every phone is imported from the board that settled it, so a screen cannot say
one thing on its own board and another here.

Not drawn anywhere, and so not on this page: sign-in (now Account), routine create,
routine edit and program create. All four are built and none was ever boarded.

Lab 49 replaced Strength with History and put the body map on Load; the captions
follow it, and its own boards are not imported here.
"""
import re

import lab28
import lab32
import lab33
import lab34
import lab35
import lab36
import lab37
import lab43
import lab45
import lab46
import kit as K

def scoped(css, under='.live'):
    """Rewrite a stylesheet so every rule only applies inside `under`.

    The live screen is the one board that never moved onto kit.py — Lab 33 builds
    its own page out of `lab28.CSS + lab32.EXTRA`, and that stylesheet redefines
    `.board`, `.col`, `.cap`, `.chip` and `.phone`. Pasted in raw it renders the
    ring and the tape correctly and destroys the gallery around them, so it gets
    scoped to the wrapper instead. Neither sheet has an at-rule, which is what
    makes a prefixer this simple safe.
    """
    out = []
    for rule in re.finditer(r"([^{}]+)\{([^}]*)\}", css):
        sels, body = rule.group(1).strip(), rule.group(2).strip()
        if not body:
            continue
        keep = []
        for sel in (x.strip() for x in sels.split(",")):
            if not sel:
                continue
            if sel.startswith(":root"):
                keep.append(under)          # the custom properties, on the wrapper
            elif sel == "body" or sel.startswith("body"):
                continue                    # kit already owns the page background
            else:
                keep.append(under + " " + sel)
        if keep:
            out.append(",".join(keep) + "{" + body + "}")
    return "\n".join(out)


def live(phone):
    """A Lab 33 phone, in the only place its stylesheet is allowed to reach."""
    return '<div class="live">' + phone + '</div>'


def state(word, note, col):
    """The build state on its own line — it is a different kind of fact from the
    prose above it, and run together with it the two stop being readable."""
    return ('<span style="display:block;margin-top:9px;font-family:\'Geist Mono\',ui-monospace,'
            'monospace;font-size:11px;letter-spacing:0.1em;color:' + col + '">' + word
            + '<span style="color:#6f6c66;letter-spacing:0.02em"> &middot; ' + note
            + '</span></span>')


BUILT = state('BUILT', 'on the phone and verified there', '#9fae3a')
DRAWN = state('DRAWN', 'boarded, not built', '#7d7666')
RULED = state('RULED OUT', 'boarded, then decided against', '#6f6a5e')


def B(t):
    """A bold lead-in inside a caption."""
    return '<b style="color:#c9c3b6;font-weight:500">' + t + '</b>'


# --------------------------------------------------------------------- Today --
TODAY = [
 ('LAB 45 W3', 'Today', 'Today &middot; /',
  'The next routine on a quiet raised card carrying its first three lifts and a full-width accent '
  'Start. Under it the week strip &mdash; a scrollable row of day cells bounded to two weeks back, '
  'bleeding past the 22pt margin so a cut cell reads as scrollable, each cell weekday &middot; date '
  '&middot; a bar as tall as that day&rsquo;s volume. The calendar and the graph are one element. '
  'Under that the recent-sessions rail.',
  'No separate records section: the rail&rsquo;s PR pill already says it and the timeline lives on '
  'History. Rest and future days are <em>not targets at all</em> rather than targets that do '
  'nothing. ' + B('Built, with four departures.') + ' ' + B('The day marks are Lab 49&rsquo;s, with '
  'no key:') + ' a trained day is a bar, a planned one a dashed outline, a missed one hatched, rest '
  'a stub, and today the only solid ring. The board draws the missed Thursday as a ring under its '
  'number. A day is planned or missed only while a program runs, and nothing before the day it was '
  'activated is ever missed. ' + B('SESSIONS has its meter,') + ' against the running '
  'program&rsquo;s planned days this week, else the weekly goal in Settings; with neither it is a '
  'plain number, because &sect;0 says a meter needs a real denominator. VOLUME keeps its delta '
  'against last week. ' + B('&ldquo;Next&rdquo; is the schedule:') + ' the least-recently-trained '
  'heuristic is deleted, because two rules for what &ldquo;next&rdquo; means is how the card ends '
  'up disagreeing with the strip beside it. With no program running the card offers MAKE A '
  'PROGRAM, and Start turns to Resume while a session runs. ' + B('The week is a glass card,') +
  ' and RECENT, two sessions, stays hidden until there is one to show.'
  + BUILT,
  lab45.W3),

 ('LAB 43 T3', 'Today, empty', 'Today &middot; a fresh install',
  'What the app opens on before anything has been logged. Every component that will fill in stays '
  'visible and dim rather than hidden.',
  'Lab 49 settled it further: the empty state is a set of actions and nothing else &mdash; no '
  'sentence, no apology, no illustration. ' + B('Built that way, not as drawn:') + ' three row '
  'plates &mdash; Build a routine, Browse the library, Empty session (Resume while one runs) &mdash; '
  'with the board&rsquo;s sentence and FIRST STEPS label gone, the week card still there with dim '
  'tiles, and RECENT hidden. The emulator proved the earlier version of this screen; this '
  'composition has not been seen on a device.' + DRAWN,
  lab43.T3),
]

# ------------------------------------------------------------------- Session --
SESSION = [
 ('LAB 34 A1', 'Routines', 'Session &middot; /session',
  'The tab root, and the list grouped by whether a routine is in play. Every row is 44pt on its own '
  '12pt plate with a 7pt gap and no hairline anywhere.',
  'Name at 15&ndash;17px, a mono meta line under it at 11px, the value right, a chevron because it '
  'navigates. This row is every list you can touch in the app. ' + B('Built as one line per row '
  '(Lab 49), not as drawn:') + ' no meta line, no LAST column, no IN PROGRAM or STANDALONE '
  'grouping and no template section. The rows are the routines, then Programs and Library rows; '
  '+ and search sit in the header.' + BUILT,
  lab34.A1),

 ('LAB 34 A2', 'Routine detail', 'Session &middot; /routine/[id]',
  'The unit of planning and its history: four stat tiles on one grouped plate, the lifts as row '
  'plates, and the LAST THREE rail into past sessions. A pushed screen, so the tab bar is gone and '
  'the primary action takes that plane.',
  'Two tiles per row, never four across; a comparison attaches to the number it describes. The rail '
  'takes no plate &mdash; it has a spine of its own and a plate around it is containment twice. '
  + B('Built, but not as drawn.') + ' The tiles read EXERCISES, SETS, TIME and VOLUME, but TIME and '
  'VOLUME are the last session&rsquo;s, not the plan&rsquo;s: the board&rsquo;s EST. TIME and '
  'VOLUME are plan figures the schema cannot compute. Each lift carries its exercise still and a '
  'grip that reorders the list, and EDIT opens the routine editor, where sets, reps, weight and '
  'rest are typed per lift.' + BUILT,
  lab34.A2),

 ('LAB 34 A3', 'Programs', 'Session &middot; /session/programs',
  'One program is running and the rest are not. The active one gets a week counter and a seven-day '
  'strip showing which routine falls where, today lit and completed days in the done green.',
  'The day strip is the screen&rsquo;s one plated hero and it earns it &mdash; a program <em>is</em> '
  'a weekly shape, so showing the shape is showing the thing. Paused and never-run stay in one '
  'section. ' + B('Built inside the Session tab so it keeps the tab bar, with departures, because '
  'the schema stores only half of what &sect;0 names.') + ' &sect;0 calls a program a routine '
  '&ldquo;scheduled by weekday <em>or fixed cycle</em>&rdquo;; only the weekday half is stored, '
  'because a cycle needs a length, a start and a position and none of those has a screen. So the '
  'board&rsquo;s WEEK 3 / 8 pill reads W3, with no fraction and no meter, and its 14 OF 48 SESSIONS '
  'DONE line is gone. Rows are one line (Lab 49): NEW or PAUSED stands where the meta line was, the '
  'strip names routines by two-letter codes, and NEXT UP gives the next three scheduled days. '
  'A missed day in the strip is still a ring; the calendar and Today&rsquo;s week strip now hatch '
  'it.' + BUILT,
  lab34.A3),

 ('LAB 34 A4', 'Program detail', 'Session &middot; /program/[id]',
  'Two tiles, a labelled column chart, then the seven weekdays with grips so the schedule reorders '
  'the way everything else does.',
  'Two tiles rather than four, because the chart already says how many sessions are done and how '
  'many are left &mdash; a tile repeating the chart is the redundancy that gets spotted every time. '
  'The chart sits on the canvas: a baseline and two axes are already a frame. '
  + B('Built at /program/[id], with three departures.') + ' The tiles lose their denominators for '
  'the same reason as A3 &mdash; no cycle length is stored &mdash; so they read WEEK and DAYS, '
  'both plain. ' + B('The chart is built,') + ' headed PER WEEK: trained days a week against the '
  'scheduled days, the last eight elapsed weeks only, from the second week of a running program, '
  'since no length is stored to draw the weeks ahead. ' + B('The weekday rows carry no grip:')
  + ' seven weekdays do not reorder, so a grip would be a control that does nothing. Tapping a row '
  'opens a routine picker as a chip row inside the row&rsquo;s own plate. The action bar adapts '
  'rather than showing a dead Start: Start &lt;routine&gt; / PAUSE when the program is running and '
  'today has a routine on it, Pause when it is running and today is rest, Activate when it is '
  'paused.' + BUILT,
  lab34.A4),

 ('LAB 35 B1', 'Exercise library', 'Session &middot; /session/library',
  'The densest list in the app &mdash; 302 exercises, every one illustrated, searchable and filtered '
  'by equipment. Doubles as the picker: handed a routine or a session it retitles and its rows add '
  'or swap instead of pushing.',
  'The filter strip bleeds past the 22pt margin so a cut chip reads as scrollable. Illustrations are '
  'CC BY-SA and are tinted at render time, never resized or re-encoded &mdash; the moment they are '
  'altered they become Adapted Material and ShareAlike reaches our own source. '
  + B('Built, with a RECENT group') + ' of the lifts last performed above ALL until a search or a '
  'filter narrows the list; rows carry the still, the name and the equipment.' + BUILT,
  lab35.B1),

 ('LAB 35 B2', 'Exercise detail', 'Session &middot; /exercise/[id]',
  'Demonstration and instruction above statistics, which is the order every reference app uses. The '
  'three frames are a movement, not three pictures, so the block loops them.',
  'The demo is one of this screen&rsquo;s two plated components; the prose, the cues and the numbers '
  'take nothing. ' + B('Built, with two departures:') + ' the description block is suppressed, '
  'because the seed stored the same text as prose and as cues on all 94 rows that have both and '
  'the paragraph only restated the HOW TO, and ' + B('COMMON MISTAKES is not built.') + ' YOUR '
  'NUMBERS &mdash; BEST e1RM, TOP SET, SESSIONS and FREQUENCY &mdash; is built. There is no action '
  'bar.' + BUILT,
  lab35.B2),

 ('LAB 35 B2&prime;', 'Exercise detail, scrolled', 'Session &middot; below the fold',
  'The half of B2 that a single frame cannot show: rep maxes, the estimated-1RM chart, and what to '
  'do next.',
  'The chart is never bare &mdash; y minimum and maximum anchored to the plot, first and last x '
  'labelled, its value printed, and a title that states the takeaway rather than the field name. '
  + B('Built, but not as drawn.') + ' The one column chart became PROGRESS: a line chart with a '
  'dashed trend and an UP, DOWN or FLAT flag, switched between 1RM, WEIGHT, VOLUME and REPS and '
  'between D, W, M and Y, with this-period-against-last tiles under it. REP MAXES is built for 1, '
  '3, 5 and 8RM, an estimate marked EST where no set reached it, and the page ends with a LOG of '
  'every set by session, on a rail. ' + B('WHAT TO DO NEXT is not built:') + ' it is model output, '
  'so &sect;0 makes it a sentence, and what it may say is undecided.' + BUILT,
  lab35.B2B),

 ('LAB 35 B3', 'Custom exercise', 'Session &middot; /exercise/new',
  'A form that does not look like one: a mono label over a 17px value, 44pt, no box and no '
  'underline. The row plate is the only edge a field gets, and a picker expands inside the '
  'field&rsquo;s own plate rather than opening a sheet.',
  B('Two departures, both because the board drew a column '
  'that does not exist:') + ' its &ldquo;count toward leg volume&rdquo; and &ldquo;warm-up ramp&rdquo; '
  'toggles have no home in the schema and are gone rather than faked, and a TYPE field was added '
  'because <code>kind</code> is NOT NULL and drives the default rest.' + BUILT,
  lab35.B3),
]

# ------------------------------------------------------------------- History --
HISTORY = [
 ('LAB 36 C1', 'Calendar', 'History &middot; the month page',
  'The one review screen that is not a rail, and the answer to &ldquo;take me to March&rdquo;. Three '
  'intensity steps, no more.',
  'Adjacent-month days are dimmed, not omitted. The numeral never wears the accent on a filled '
  'cell; it flips to dark ink only at the top step. ' + B('Built on History, not Load (Lab 49), and '
  'not as drawn.') + ' It sits on a month page: a header with &lsaquo; &rsaquo; arrows, a glass '
  'card with the session count, TIME and AVG tiles and a weekly volume chart, then the month&rsquo;s '
  'sessions one line each and a Records row. ' + B('The day marks are Lab 49&rsquo;s, with no '
  'key:') + ' trained is a fill, planned a dashed outline, missed hatched, rest empty, and today '
  'the only solid ring. The board&rsquo;s missed ring and MISSED key are superseded. Nothing is '
  'planned or missed unless a program runs, and nothing before its activation date is ever '
  'missed.' + BUILT,
  lab36.C1),
]

# ---------------------------------------------------------------------- Load --
LOAD = [
 ('LAB 35 B4', 'Body map', 'Load &middot; the tab root',
  'The only screen that needs a drawing: front and back, each muscle tinted by how recently it was '
  'worked and how hard.',
  'The verdict is words: the zone bar under the figures runs FRESH to NEEDS REST, because per-muscle '
  'fatigue is model output and &sect;0 says model output is a sentence. '
  + B('Built as the hero of Load (Lab 49), without the list.') + ' The two figures and the key '
  'are built, each muscle tinted by its last seven days of sets, decayed on a 48-hour half-life, '
  'against the most-worked muscle, so no threshold is invented. The WORKED HARDEST list is not '
  'built, and the open question of whether it may print percentages went with it. Its spec is '
  '<code>claudedocs/body-map.md</code>.' + BUILT,
  lab35.B4),

 ('LAB 37 D1', 'Volume and deload', 'Load &middot; under the body map',
  'Model output drawn as a range and not a number. Weekly volume against the landmarks, and a '
  'deload call.',
  'Zones are tinted and the marker stays near-white; the number carries the verdict and the verdict '
  'is words, not acronyms. ' + B('Built, but not as drawn.') + ' Load opens on the body map, then '
  'SETS and VOLUME with its delta, then the deload call as a chip &mdash; DELOAD, HOLD or NOT YET, '
  'with the program&rsquo;s week &mdash; rather than a sentence, then SETS / MUSCLE. ' +
  B('Landmarks exist for five muscles:') + ' chest, back, quads, hamstrings and shoulders. The '
  'rest show a count and no bar, because the ranges are a sourcing job and not a guess.' + BUILT,
  lab37.D1),

 ('LAB 37 D2', 'Bodyweight', 'Load &middot; pushed',
  'A slow trend, drawn as a line: bodyweight is continuous and a workout is not.',
  'Session totals stay columns on a baseline, which is <code>kit.chart()</code>; exercise progress '
  'now draws a line of its own. ' + B('Built, without RELATIVE STRENGTH:') + ' it needs '
  'strength-standard percentile tables, a sourcing job. LATEST and 7-DAY AVG, the 14-day trend and '
  'BY MONTH are built, under a Log weight action, with a READINGS list the board never drew &mdash; '
  'tap a reading to edit it, swipe to delete it.' + BUILT,
  lab37.D2),
]

# ------------------------------------------------------- Takeover and pushed --
LIVE = [
 ('LAB 33 G1', 'Live &middot; not editing', 'Takeover &middot; /live',
  'What the screen is almost all of the time. The ring reads LOAD and never re-scales; the ladder '
  'down the left edge is the exercise position; the set line is written between two hairlines.',
  'A takeover: no tab bar, and the back arrow leaves the session &mdash; it deletes one with nothing '
  'logged and asks first once a set is. ' + B('Two vocabularies') + ' &mdash; horizontal moves '
  'between sets and vertical between exercises, so the two indicators are deliberately unalike. '
  + B('Built as a swipe pager') + ' on those axes, clamped at the ends. Under the ring sit LAST '
  'TIME with its delta, the HISTORY, STATS, NOTES and SWAP buttons, and a readout that becomes the '
  'rest countdown, +30S and SKIP, after a set. Sheets list and reorder the exercises and sets. '
  + B('The live pulse indicator is not built;') + ' no board places it.' + BUILT,
  live(lab33.G1)),

 ('LAB 33 G2', 'Live &middot; editing load', 'Takeover &middot; the tape',
  'The tape drives and the ring reads. Reference numerals appear only while editing load: they mark '
  'the perimeter as live and cost 31pt of radius, so the ring drops from 330 to 290.',
  'Lines only &mdash; no arc, no knob. Fill and cursor both: ticks below the value are longer and '
  'lighter, and the lines swell into the current value over &plusmn;6 ticks. Length carries the '
  'fill, because a 1px hue step is invisible at this scale. The tape has inertia, and its step is '
  'a setting: 1.25, 2.5 or 5 kg. The live screen stays in kilograms whatever the display unit.'
  + BUILT,
  live(lab33.G2)),

 ('LAB 33 G3', 'Live &middot; editing reps', 'Takeover &middot; the same tape',
  'All three parameters use the same vertical tape. The ring does not follow &mdash; it is the load '
  'gauge in every state and it never becomes a reps gauge.',
  'Load 20&ndash;140 by the Settings step, reps 1&ndash;15 by 1, RPE 1&ndash;10 by 1. Long-press any '
  'parameter for the keypad, or turn on Tap opens keypad in Settings, and a TYPE button beside the '
  'selector opens it for a custom value, so no value is reachable by only one route.' + BUILT,
  live(lab33.G3)),

 ('LAB 33 G4', 'Live &middot; editing RPE', 'Takeover &middot; the same tape again',
  'One to ten in whole points, with the RIR gloss in the selector cell so RPE 8 is never shown '
  'bare. Structurally identical to G3, which is the point.',
  'It replaced a nine-cell segmented row, which lost twice over: a third control for the parameter '
  'you set least often is the wrong place to spend a new pattern, and a row has to fit every value '
  'on screen at once &mdash; which is what forced the range to six-to-ten and the cells under the '
  '44pt floor. ' + B('On a tape the range is free') + ', so warm-up sets at RPE 3&ndash;5 get a '
  'representation they never had. Whole points, because RIR is ten minus RPE and half a point on a '
  'subjective scale is false precision. ' + B('Built, but not as drawn:') + ' the cell reads RPE '
  'alone, with no RIR gloss. RPE appears only for a lift that tracks it or with Track RPE on in '
  'Settings, and it arrives unset, a dash, never pre-filled at 8.' + BUILT,
  live(lab33.G4)),

 ('LAB 36 C2', 'Session summary', 'Pushed &middot; /summary/[id]',
  'The screen you see once, immediately after finishing. Four tiles, the records the session set, '
  'and what you actually lifted.',
  'Recap screens carry numbers and deltas; history and stats screens carry the charts. An absent '
  'duration renders as an em dash and dim rather than as a zero &mdash; a missing number is honest, '
  'an invented one is not. ' + B('Built, with its own headings:') + ' RECORDS and LIFTS, each lift '
  'on its exercise still, and Done returns to Today. Volume reads kg or lb, never tonnes. '
  'A session finished with nothing logged never gets here: it is deleted.' + BUILT,
  lab36.C2),

 ('LAB 36 C3', 'Session detail', 'Pushed &middot; /history/[id]',
  'The same log read back later, set by set. Read-only, so no plate, no rail and no row fill: the '
  'columns are the structure and the rows are 34pt, not 44.',
  'Columns are right-anchored as a group, so a column dropped on one exercise cannot push the one '
  'above it out of line. Reached from LAST THREE, the week strip, the calendar and the month&rsquo;s '
  'session list. ' + B('Built with Perform again') + ' as its action, Resume while a session runs, '
  'in place of the board&rsquo;s Repeat this session and EDIT. ' + B('The NOTE section is not '
  'built:') + ' the live NOTES sheet writes notes, and nothing reads them back here. Lifts that '
  'were not performed sit under SKIPPED.' + BUILT,
  lab36.C3),

 ('LAB 36 C4', 'Records', 'Pushed &middot; /records',
  'What the rail was reserved for. Every personal record in order, each with the lift, what kind of '
  'record it is, the value and what it beat.',
  'The dots are <em>age buckets</em> and not an index ramp: 0&ndash;2 days accent, 3&ndash;6 tick3, '
  '7&ndash;12 tick2, older tick1. With twenty rows an index ramp is tick1 from the fifth row down '
  'and the dot stops carrying anything half a screen in. ' + B('Built as a pushed screen, reached '
  'from History&rsquo;s Records row and Load&rsquo;s RECORDS section (Lab 49).') + ' It was the '
  'Strength tab root until Strength became History, and its THIS MONTH and THIS YEAR tiles went '
  'with that, so the screen is the rail alone. ' + B('One thing the data says and the board '
  'does not:') + ' <code>best_session_volume</code> records are stored per-exercise, so a single '
  'session arrives here as three separate BEST SESSION VOLUME rows. That is a data-model question, '
  'not a screen bug.' + BUILT,
  lab36.C4),

 ('LAB 37 D3', 'Readiness', 'Pushed &middot; Settings &middot; /check-in',
  'Three taps, and honesty about what they buy. The output is a sentence and a zone bar, not a '
  'score.',
  'A number the app guessed is never drawn like a number you lifted. The zone marker stays '
  'near-white &mdash; tinting it to the verdict makes it vanish inside its own band. '
  + B('Built, and smaller than drawn.') + ' Lab 49 moved it from Today to Settings, the top row '
  'of TRAINING. The three scales save as soon as all three are set, and the call is a chip &mdash; '
  'GO, EASY, LIGHT or REST, one step per bad answer &mdash; not a sentence. WHAT THAT MEANS and '
  'the note that it is a guess are not built. The bar offers Start and SKIP, or Done when there is '
  'nothing to start.' + BUILT,
  lab37.D3),

 ('LAB 37 D4', 'Settings', 'Pushed &middot; the Today gear',
  'Where the parameters that were argued about live: units, rest defaults per exercise type, the '
  'plate palette, language.',
  B('Settings is not a tab') + ' &mdash; it is a gear in the Today header, because you open it '
  'twice a year. Values persist in <code>expo-sqlite/kv-store</code>. ' + B('Built, and smaller '
  'than the board on purpose, one line per row (Lab 49).') + ' UNITS keeps Weight. TRAINING has '
  'Check-in, Weekly goal, Track RPE, both rest defaults, Tap opens keypad, Weight increment, '
  'Default sets and Keep screen on. Distance, Language, Warm-up ramps and the whole PLATES section '
  'are absent: they configure something that does not exist yet &mdash; no screen renders a '
  'distance or a second language, and <code>solvePlates</code>, <code>warmupRamp</code> and '
  '<code>PLATE_COLORS</code> are pure functions with tests and no caller &mdash; and a switch that '
  'toggles nothing is worse than a missing switch. ' + B('An ACCOUNT row was added') + ', because '
  'the export, restore and cloud backup behind it had to stay reachable.' + BUILT,
  lab37.D4),
]

# ------------------------------------------------------------ Drawn, not built --
CUT = [
 ('LAB 46 H2', 'History, as an archive', 'superseded by Lab 49',
  'A flat archive of every session, ruled by month. Drawn, settled on H2, and then not built.',
  B('The IA had no history list, and Lab 49 reversed that.') + ' History is now a tab &mdash; a '
  'month page with the calendar and the month&rsquo;s sessions on it. H2&rsquo;s flat archive '
  'is still not built; the month page replaced it. Kept on this page because a board that was '
  'superseded is a result, and deleting it invites the same plan to be written a third '
  'time.' + RULED,
  lab46.H2),
]

INTRO = (
  K.para('Every screen that has been drawn, in one place, grouped by the tab it lives in &mdash; '
         'Today, Session, History and Load. '
         '<b style="color:#c9c3b6;font-weight:500">This is the design file</b> &mdash; the thing to '
         'open when the question is &ldquo;what does the app look like&rdquo; rather than &ldquo;'
         'what is it made of&rdquo;.')
  + K.para('Every phone here is imported from the board that settled it, not redrawn, so a screen '
           'cannot say one thing on its own board and something else here. The caption under each '
           'one carries the decisions inside it and whether it is on the device today &mdash; and '
           'where the build departed from the drawing, it says so and why. Volume reads '
           'kg or lb on every board, abbreviated k or mil from 100,000, never tonnes.',
           '#96938c')
  + K.para('<span style="color:#96938c">Lab 47</span> is the system these are built from: the '
           'tokens, every primitive in every state, and the composition rules. '
           '<span style="color:#96938c">Lab 49</span> replaced Strength with History and moved the '
           'body map onto Load; its own boards are not imported here, but the tab bar in every phone reads History. The labs before that are the '
           'arguments that got here and are not state. '
           '<b style="color:#c9c3b6;font-weight:500">Four built screens are missing from this page '
           'because they were never drawn:</b> sign-in, which is now Account and carries the cloud '
           'backup, routine create, routine edit and program create.',
           '#6f6c66'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">Where the map has holes</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">Two tab roots are not on this page.</b> '
           'Today has Lab 45 W3. History and Load were redrawn by Lab 49, which moved the calendar '
           'from Load to History and the body map from Strength to Load, and approved them in '
           'part. Those boards are not imported here, so this page shows only what sits inside '
           'those roots &mdash; C1, B4, D1 and D2 &mdash; and the roots themselves are as built, '
           'not as any board on this page draws them.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Four built screens were never drawn.</b> '
           'Sign-in and Account, routine create, routine edit and program create were built out of '
           'the vocabulary on this page without a board of their own. They work, and they are the '
           'places where the implementation is the only record of the design.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Some drawn things are still not built.</b> '
           'B2&prime;&rsquo;s WHAT TO DO NEXT and B2&rsquo;s COMMON MISTAKES, D1&rsquo;s landmarks '
           'for every muscle but five, D2&rsquo;s relative strength and the live pulse indicator '
           'are drawn against copy or data the app does not have yet. The rep maxes, the progress '
           'chart, the trend and the records timeline are no longer on that list: they read rows '
           'that already exist.')
  + K.para('Updating this page is updating the board a screen comes from and re-running '
           '<code>python3 lab48.py</code>. It imports rather than copies, so there is no second '
           'place for a screen to drift.', '#6f6c66')
  + '</div>')

BOARDS = [
    ('Today', 'Home and what is next. The tab the app opens on.', TODAY),
    ('Session', 'Everything you plan or start from: routines, programs, the exercise library.',
     SESSION),
    ('History', 'The month as a page &mdash; its calendar and every session in it. It replaced '
                'Strength in Lab 49.', HISTORY),
    ('Load', 'The body map first, then the week&rsquo;s volume, and the body carrying it.', LOAD),
    ('Outside the tabs', 'One takeover, four pushes and a gear. The live screen has no tab bar; a '
                         'pushed screen loses the bar and gives that plane to its primary '
                         'action.', LIVE),
    ('Drawn, and deliberately not built', 'One board was superseded. That is a result, and it '
                                          'belongs on the map.', CUT),
]

# Captions vary a lot in length here, and a ragged row of phones is harder to
# compare than a straight one. Stretch the columns and let the caption take the
# slack, so every phone starts on the same line.
EXTRA_CSS = """
  .board{align-items:stretch}
  .cap{min-height:0;flex:1}
""" + scoped(lab28.CSS + lab32.EXTRA)

HTML = K.page(48, 'Every screen', INTRO, BOARDS, CLOSING, EXTRA_CSS)
open('lab48.html', 'w').write(HTML)
print('wrote lab48.html', len(HTML), '—', sum(len(b[2]) for b in BOARDS), 'screens')
