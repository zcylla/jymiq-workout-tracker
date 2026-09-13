"""Lab 48 — Every screen, in one place.

The app, laid out. Every screen that has been drawn, grouped by the tab it lives
in, each on the settled design system, each captioned with the decisions inside
it and whether it is on the phone today.

This is the design file. Lab 47 is the system it is built from; the earlier labs
are the arguments that got there and are not state. Nothing here is redrawn —
every phone is imported from the board that settled it, so a screen cannot say
one thing on its own board and another here.

Not drawn anywhere, and so not on this page: sign-in, routine create and routine
edit. All three are built and none was ever boarded.
"""
import lab33
import lab34
import lab35
import lab36
import lab37
import lab43
import lab45
import lab46
import kit as K

def state(word, note, col):
    """The build state on its own line — it is a different kind of fact from the
    prose above it, and run together with it the two stop being readable."""
    return ('<span style="display:block;margin-top:9px;font-family:\'Geist Mono\',ui-monospace,'
            'monospace;font-size:11px;letter-spacing:0.1em;color:' + col + '">' + word
            + '<span style="color:#6f6c66;letter-spacing:0.02em"> &middot; ' + note
            + '</span></span>')


BUILT = state('BUILT', 'on the phone and verified there', '#9fae3a')
SHELL = state('SHELL', 'a placeholder stands where this goes', '#e4c68c')
DRAWN = state('DRAWN', 'boarded, not built', '#7d7666')
RULED = state('RULED OUT', 'boarded, then decided against', '#6f6a5e')


# --------------------------------------------------------------------- Today --
TODAY = [
 ('LAB 45 W3', 'Today', 'Today &middot; /',
  'The next routine on a quiet raised card carrying its first three lifts and a full-width accent '
  'Start. Under it the week strip &mdash; a scrollable row of day cells bounded to two weeks back, '
  'bleeding past the 22pt margin so a cut cell reads as scrollable, each cell weekday &middot; date '
  '&middot; a bar as tall as that day&rsquo;s volume. The calendar and the graph are one element. '
  'Under that the recent-sessions rail.',
  'No separate records section: the rail&rsquo;s PR pill already says it and the timeline lives on '
  'Strength. Rest and future days are <em>not targets at all</em> rather than targets that do '
  'nothing.' + SHELL,
  lab45.W3),

 ('LAB 43 T3', 'Today, empty', 'Today &middot; a fresh install',
  'What the app opens on before anything has been logged. Every component that will fill in stays '
  'visible and dim rather than hidden.',
  'The empty state is a short sentence plus a set of actions &mdash; never an apology, never an '
  'illustration. The layout a new user learns is the layout they keep.' + SHELL,
  lab43.T3),

 ('LAB 37 D3', 'Readiness', 'Today &middot; pushed',
  'Three taps, and honesty about what they buy. The output is a sentence and a zone bar, not a '
  'score.',
  'A number the app guessed is never drawn like a number you lifted. The zone marker stays '
  'near-white &mdash; tinting it to the verdict makes it vanish inside its own band. '
  '&sect;0 puts readiness on Today; Lab 37 drew it beside the Load screens.' + DRAWN,
  lab37.D3),
]

# ------------------------------------------------------------------- Session --
SESSION = [
 ('LAB 34 A1', 'Routines', 'Session &middot; /session',
  'The tab root, and the list grouped by whether a routine is in play. Every row is 44pt on its own '
  '12pt plate with a 7pt gap and no hairline anywhere.',
  'Name at 15&ndash;17px, a mono meta line under it at 11px, the value right, a chevron because it '
  'navigates. This row is every list you can touch in the app.' + BUILT,
  lab34.A1),

 ('LAB 34 A2', 'Routine detail', 'Session &middot; /routine/[id]',
  'The unit of planning and its history: four stat tiles on one grouped plate, the lifts as row '
  'plates, and the LAST THREE rail into past sessions. A pushed screen, so the tab bar is gone and '
  'the primary action takes that plane.',
  'Two tiles per row, never four across; a comparison attaches to the number it describes. The rail '
  'takes no plate &mdash; it has a spine of its own and a plate around it is containment twice. '
  '<b style="color:#c9c3b6;font-weight:500">Built, but not as drawn:</b> the tiles now read LAST '
  'TIME and LAST VOLUME, because the board&rsquo;s EST. TIME and VOLUME are plan figures and the '
  'app was showing one past session under them.' + BUILT,
  lab34.A2),

 ('LAB 34 A3', 'Programs', 'Session &middot; pushed',
  'One program is running and the rest are not. The active one gets a week counter and a seven-day '
  'strip showing which routine falls where, today lit and completed days in the done green.',
  'The day strip is the screen&rsquo;s one plated hero and it earns it &mdash; a program <em>is</em> '
  'a weekly shape, so showing the shape is showing the thing. Paused and never-run stay in one '
  'section: the distinction is in the meta line, not the structure.' + DRAWN,
  lab34.A3),

 ('LAB 34 A4', 'Program detail', 'Session &middot; pushed',
  'Two tiles, a labelled column chart, then the seven weekdays with grips so the schedule reorders '
  'the way everything else does.',
  'Two tiles rather than four, because the chart already says how many sessions are done and how '
  'many are left &mdash; a tile repeating the chart is the redundancy that gets spotted every time. '
  'The chart sits on the canvas: a baseline and two axes are already a frame.' + DRAWN,
  lab34.A4),

 ('LAB 35 B1', 'Exercise library', 'Session &middot; /session/library',
  'The densest list in the app &mdash; 302 exercises, every one illustrated, searchable and filtered '
  'by equipment. Doubles as the picker: handed a routine or a session it retitles and its rows add '
  'instead of pushing.',
  'The filter strip bleeds past the 22pt margin so a cut chip reads as scrollable. Illustrations are '
  'CC BY-SA and are tinted at render time, never resized or re-encoded &mdash; the moment they are '
  'altered they become Adapted Material and ShareAlike reaches our own source.' + BUILT,
  lab35.B1),

 ('LAB 35 B2', 'Exercise detail', 'Session &middot; /exercise/[id]',
  'Demonstration and instruction above statistics, which is the order every reference app uses. The '
  'three frames are a movement, not three pictures, so the block loops them.',
  'The demo is one of this screen&rsquo;s two plated components; the prose, the cues and the numbers '
  'take nothing. <b style="color:#c9c3b6;font-weight:500">Built, with the description block '
  'suppressed:</b> the seed stored the same text as prose and as cues on all 94 rows that have both, '
  'so the paragraph only restated the HOW TO.' + BUILT,
  lab35.B2),

 ('LAB 35 B2&prime;', 'Exercise detail, scrolled', 'Session &middot; below the fold',
  'The half of B2 that a single frame cannot show: rep maxes, the estimated-1RM chart, and what to '
  'do next.',
  'The chart is never bare &mdash; y minimum and maximum anchored to the plot, first and last x '
  'labelled, the latest mark in the accent with everything else de-emphasised, its value printed, '
  'and a title that states the takeaway rather than the field name.' + DRAWN,
  lab35.B2B),

 ('LAB 35 B3', 'Custom exercise', 'Session &middot; /exercise/new',
  'A form that does not look like one: a mono label over a 17px value, 44pt, no box and no '
  'underline. The row plate is the only edge a field gets, and a picker expands inside the '
  'field&rsquo;s own plate rather than opening a sheet.',
  '<b style="color:#c9c3b6;font-weight:500">Two departures, both because the board drew a column '
  'that does not exist:</b> its &ldquo;count toward leg volume&rdquo; and &ldquo;warm-up ramp&rdquo; '
  'toggles have no home in the schema and are gone rather than faked, and a TYPE field was added '
  'because <code>kind</code> is NOT NULL and drives the default rest.' + BUILT,
  lab35.B3),
]

# ------------------------------------------------------------------ Strength --
STRENGTH = [
 ('LAB 36 C4', 'Records', 'Strength &middot; the PR timeline',
  'What the rail was reserved for. Every personal record in order, each with the lift, what kind of '
  'record it is, the value and what it beat.',
  'The dots are <em>age buckets</em> and not an index ramp: 0&ndash;2 days accent, 3&ndash;6 tick3, '
  '7&ndash;12 tick2, older tick1. With twenty rows an index ramp is tick1 from the fifth row down '
  'and the dot stops carrying anything half a screen in.' + DRAWN,
  lab36.C4),

 ('LAB 35 B4', 'Body map', 'Strength &middot; pushed',
  'The only screen that needs a drawing: front and back, each muscle tinted by how recently it was '
  'worked and how hard.',
  'The map says FRESH or NEEDS REST, never a percentage &mdash; per-muscle fatigue is model output '
  'and model output is words. <b style="color:#c9c3b6;font-weight:500">The least resolved drawing '
  'in the set;</b> its spec is <code>claudedocs/body-map.md</code>.' + DRAWN,
  lab35.B4),
]

# ---------------------------------------------------------------------- Load --
LOAD = [
 ('LAB 36 C1', 'Calendar', 'Load &middot; the index into history',
  'The one review screen that is not a rail, and the answer to &ldquo;take me to March&rdquo;. Three '
  'intensity steps, no more.',
  'Adjacent-month days are dimmed, not omitted. Rest and missed must look different &mdash; rest is '
  'a plate, missed carries a ring under the number. The numeral never wears the accent on a filled '
  'cell; it flips to dark ink only at the top step. <b style="color:#c9c3b6;font-weight:500">Open: '
  'whether it sits on a plate</b> &mdash; its fills were composited against one, so the ramp needs '
  'recomputing before it moves to the canvas.' + DRAWN,
  lab36.C1),

 ('LAB 37 D1', 'Volume and deload', 'Load &middot; the tab root',
  'Model output drawn as a range and not a number. Weekly volume against the landmarks, and a '
  'deload call.',
  'Zones are tinted and the marker stays near-white; the number carries the verdict and the verdict '
  'is words, not acronyms. Deload is a sentence, because a number the app guessed must not look like '
  'a number you lifted.' + DRAWN,
  lab37.D1),

 ('LAB 37 D2', 'Bodyweight', 'Load &middot; pushed',
  'The one line chart in the app &mdash; a slow trend where every other series is a column chart.',
  'It earns the line because bodyweight is continuous and a workout is not. Everything else in the '
  'app that plots over time is <code>kit.chart()</code>, which is columns on a baseline.' + DRAWN,
  lab37.D2),
]

# ------------------------------------------------------- Takeover and pushed --
LIVE = [
 ('LAB 33 G1', 'Live &middot; resting', 'Takeover &middot; /live',
  'What the screen is almost all of the time. The ring reads LOAD and never re-scales; the ladder '
  'down the left edge is the exercise position; the set line is written between two hairlines.',
  'A takeover: no tab bar, no back. <b style="color:#c9c3b6;font-weight:500">Two vocabularies</b> '
  '&mdash; horizontal moves between sets and vertical between exercises, so the two indicators are '
  'deliberately unalike. Two identical indicators at 90&deg; force the reader to work out which is '
  'which before reading either.' + BUILT,
  lab33.G1),

 ('LAB 33 G2', 'Live &middot; editing load', 'Takeover &middot; the tape',
  'The tape drives and the ring reads. Reference numerals appear only while editing load: they mark '
  'the perimeter as live and cost 31pt of radius, so the ring drops from 330 to 290.',
  'Lines only &mdash; no arc, no knob. Fill and cursor both: ticks below the value are longer and '
  'lighter, and the lines swell into the current value over &plusmn;6 ticks. Length carries the '
  'fill, because a 1px hue step is invisible at this scale.' + BUILT,
  lab33.G2),

 ('LAB 33 G3', 'Live &middot; editing reps', 'Takeover &middot; the same tape',
  'All three parameters use the same vertical tape. The ring does not follow &mdash; it is the load '
  'gauge in every state and it never becomes a reps gauge.',
  'Load 20&ndash;140 by 2.5, reps 1&ndash;15 by 1, RPE 1&ndash;10 by 1. Long-press any parameter for '
  'the keypad, so no value is reachable by only one route.' + BUILT,
  lab33.G3),

 ('LAB 33 G4', 'Live &middot; resting after a set', 'Takeover &middot; the rest clock',
  'The set is logged, any records it set are named, and the rest clock runs.',
  'Records are named at the moment they happen rather than saved for the summary &mdash; it is the '
  'one moment the number means something.' + BUILT,
  lab33.G4),

 ('LAB 36 C2', 'Session summary', 'Pushed &middot; /summary/[id]',
  'The screen you see once, immediately after finishing. Four tiles, the records the session set, '
  'and what you actually lifted.',
  'Recap screens carry numbers and deltas; history and stats screens carry the charts. An absent '
  'duration renders as an em dash and dim rather than as a zero &mdash; a missing number is honest, '
  'an invented one is not.' + BUILT,
  lab36.C2),

 ('LAB 36 C3', 'Session detail', 'Pushed &middot; /history/[id]',
  'The same log read back later, set by set. Read-only, so no plate, no rail and no row fill: the '
  'columns are the structure and the rows are 34pt, not 44.',
  'Columns are right-anchored as a group, so a column dropped on one exercise cannot push the one '
  'above it out of line. Reached from LAST THREE today, and from the calendar, the week strip and '
  'the PR timeline once those exist. <b style="color:#c9c3b6;font-weight:500">Built without the '
  'board&rsquo;s action bar and NOTE section</b> &mdash; repeating a session is a feature, and '
  'nothing anywhere can write a note yet.' + BUILT,
  lab36.C3),

 ('LAB 37 D4', 'Settings', 'Pushed &middot; the Today gear',
  'Where the parameters that were argued about live: units, rest defaults per exercise type, the '
  'plate palette, language.',
  '<b style="color:#c9c3b6;font-weight:500">Settings is not a tab</b> &mdash; it is a gear in the '
  'Today header, because you open it twice a year. Storage is decided (<code>expo-sqlite/kv-store'
  '</code>) and unwritten, so every one of these is hardcoded today.' + DRAWN,
  lab37.D4),
]

# ------------------------------------------------------------ Drawn, not built --
CUT = [
 ('LAB 46 H2', 'History', 'nowhere &mdash; and that is the decision',
  'A flat archive of every session, ruled by month. Drawn, settled on H2, and then not built.',
  '<b style="color:#c9c3b6;font-weight:500">The IA never had a history list.</b> Four things already '
  'answer &ldquo;show me my past workouts&rdquo; &mdash; the calendar, the week strip, LAST THREE '
  'and the PR timeline &mdash; and every one of them opens C3. Kept on this page because a board '
  'that resolved to &ldquo;do not build this&rdquo; is a result, and deleting it invites the same '
  'plan to be written a third time.' + RULED,
  lab46.H2),
]

INTRO = (
  K.para('Every screen that has been drawn, in one place, grouped by the tab it lives in. '
         '<b style="color:#c9c3b6;font-weight:500">This is the design file</b> &mdash; the thing to '
         'open when the question is &ldquo;what does the app look like&rdquo; rather than &ldquo;'
         'what is it made of&rdquo;.')
  + K.para('Every phone here is imported from the board that settled it, not redrawn, so a screen '
           'cannot say one thing on its own board and something else here. The caption under each '
           'one carries the decisions inside it and whether it is on the device today &mdash; and '
           'where the build deliberately departed from the drawing, it says so and why.',
           '#96938c')
  + K.para('<span style="color:#96938c">Lab 47</span> is the system these are built from: the '
           'tokens, every primitive in every state, and the composition rules. The labs before that '
           'are the arguments that got here and are not state. '
           '<b style="color:#c9c3b6;font-weight:500">Three built screens are missing from this page '
           'because they were never drawn:</b> sign-in, routine create and routine edit.',
           '#6f6c66'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">Where the map has holes</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">Three tab roots have no board.</b> Today has '
           'Lab 45 W3. Strength and Load have a sentence each in &sect;0 saying what they carry, and '
           'they appear on this page only as their <em>contents</em> &mdash; C4 and B4, D1 and D2 '
           'and C1. Nothing anywhere draws what you see when you tap those two tabs, and that has to '
           'be answered before either can be built.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Three built screens were never drawn.</b> '
           'Sign-in, routine create and routine edit were built out of the vocabulary on this page '
           'without a board of their own. They work, and they are the three places where the '
           'implementation is the only record of the design.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Four screens on this page are drawn against '
           'data the app cannot produce yet.</b> B2&prime;&rsquo;s rep maxes and 1RM chart, '
           'C4&rsquo;s timeline, D1&rsquo;s landmarks and D2&rsquo;s trend all need history the '
           'database has but nothing computes. They are designs, not specifications of something '
           'nearly done.')
  + K.para('Updating this page is updating the board a screen comes from and re-running '
           '<code>python3 lab48.py</code>. It imports rather than copies, so there is no second '
           'place for a screen to drift.', '#6f6c66')
  + '</div>')

BOARDS = [
    ('Today', 'Home, what is next, and how you are. The tab the app opens on.', TODAY),
    ('Session', 'Everything you plan or start from: routines, programs, the exercise library.',
     SESSION),
    ('Strength', 'What you can lift and where it went.', STRENGTH),
    ('Load', 'Volume, and the body carrying it.', LOAD),
    ('Outside the tabs', 'One takeover, three pushes and a gear. The live screen has no tab bar and '
                         'no back; a pushed screen loses the bar and gives that plane to its '
                         'primary action.', LIVE),
    ('Drawn, and deliberately not built', 'One board resolved to &ldquo;do not build this&rdquo;. '
                                          'That is a result, and it belongs on the map.', CUT),
]

# Captions vary a lot in length here, and a ragged row of phones is harder to
# compare than a straight one. Stretch the columns and let the caption take the
# slack, so every phone starts on the same line.
EXTRA_CSS = '''
  .board{align-items:stretch}
  .cap{min-height:0;flex:1}
'''

HTML = K.page(48, 'Every screen', INTRO, BOARDS, CLOSING, EXTRA_CSS)
open('lab48.html', 'w').write(HTML)
print('wrote lab48.html', len(HTML), '—', sum(len(b[2]) for b in BOARDS), 'screens')
