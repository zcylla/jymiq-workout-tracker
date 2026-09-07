"""Lab 36 — Review. Calendar, session summary, session detail, PRs.

Three of these four are chronological, so this is where the rail pattern earns
the exclusivity it was given. The calendar is the exception and says why.
"""
import kit as K
import lab39            # the calendar is defined once, there

# -------------------------------------------------------------- C1 calendar --
# Round fifteen found three bugs in the first calendar and Lab 39 fixed them all:
# rest and missed no longer look alike, adjacent-month days are dimmed rather
# than omitted, three intensity steps with the numeral flipping to dark ink only
# at the top one. It stays plated — the fills were mixed against #221f19 and
# moving it to the canvas means recomputing the whole ramp.
C1 = lab39.Q2

# --------------------------------------------------------------- C2 summary --
C2 = K.phone(
    K.back_head('Lower A', 'SESSION COMPLETE &middot; TODAY')
    # VS LAST was its own tile and is now the delta on the number it describes:
    # one tile fewer and one more thing said.
    + K.psec('', K.tiles([('TIME', '1H 04', '', K.HI),
                          ('VOLUME', '8.6 T', K.delta('+4.9%'), K.HI),
                          ('SETS', '20', '', K.HI),
                          ('RECORDS', '2', '', K.ACCENT)], tone='raised'), first=True, pad=13)
    + K.psec('NEW RECORDS',
        '<div style="display:flex;flex-direction:column;gap:11px">'
        + ''.join(
            '<div class="r" style="gap:10px">' + K.pill('PR')
            + '<div style="display:flex;flex-direction:column;gap:2px;min-width:0">'
              '<span style="font-size:15px;color:var(--hi)">' + n + '</span>'
              '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
            + m + '</span></div><span class="sp"></span>'
              '<span class="num" style="font-size:17px;font-weight:600;color:var(--accent)">'
            + v + '</span></div>'
            for n, m, v in [('Barbell Squat', 'BEST ESTIMATED 1RM &middot; WAS 128', '130'),
                            ('Barbell Squat', 'BEST SET VOLUME &middot; WAS 800 KG', '820')])
        + '</div>', pad=13)
    + K.psec('WHAT YOU LIFTED', ''.join(
        K.lrow('<span class="mono" style="width:20px;flex:none;font-size:11px;color:var(--dim)">'
               + i + '</span>'
               '<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
               '<span style="font-size:15px;color:var(--hi)">' + n + '</span>'
               '<span class="mono" style="font-size:11px;letter-spacing:0.07em;color:var(--lo)">'
               + m + '</span></div>', chev=False)
        for i, n, m in [('01', 'Barbell Squat', '5 SETS &middot; TOP 102.5 &times; 8 &middot; 2.9 T'),
                        ('02', 'Romanian Deadlift', '4 SETS &middot; TOP 80 &times; 10 &middot; 2.4 T'),
                        ('03', 'Leg Press', '4 SETS &middot; TOP 160 &times; 12 &middot; 2.1 T'),
                        ('04', 'Seated Curl', '3 SETS &middot; TOP 35 &times; 12 &middot; 0.7 T'),
                        ('05', 'Standing Calf',
                         '4 SETS &middot; TOP 90 &times; 15 &middot; 0.5 T')]), plated=False),
    chrome=K.actionbar('Done', 'NOTES'))

# ---------------------------------------------------------------- C3 detail --
SET_ROWS = [('01', '95.0', '8', '7', '119'), ('02', '100.0', '8', '7', '125'),
            ('03', '102.5', '8', '8', '128'), ('04', '102.5', '8', '8', '128'),
            ('05', '102.5', '7', '9', '126')]


def set_row(i, kg, rep, rpe, e1):
    cells = ''.join('<span class="mono" style="width:' + w + 'px;text-align:right;color:' + c
                    + '">' + v + '</span>'
                    for w, v, c in zip(['54', '34', '34', '46'], [kg, '&times;' + rep, rpe, e1],
                                       ['var(--hi)', 'var(--mid)', 'var(--mid)', 'var(--accent)']))
    return ('<div class="r" style="height:34px;font-size:13px;gap:10px">'
            '<span class="mono" style="width:26px;font-size:11px;color:var(--pos)">' + i + '</span>'
            '<span class="sp"></span>' + cells + '</div>')


HDR = ('<div class="r" style="height:18px;gap:10px">'
       '<span class="mono lbl" style="width:26px">SET</span><span class="sp"></span>'
       + ''.join('<span class="mono lbl" style="width:' + w + 'px;text-align:right">' + n
                 + '</span>'
                 for w, n in zip(['54', '34', '34', '46'], ['KG', 'REP', 'RPE', 'e1RM']))
       + '</div>')

C3 = K.phone(
    K.back_head('Tue 2 Sep', 'LOWER A &middot; 1H 04', K.ico('dots', 'var(--mid)', 1.7))
    + K.psec('BARBELL SQUAT', HDR + ''.join(set_row(*r) for r in SET_ROWS),
             first=True, plated=False)
    + K.psec('ROMANIAN DEADLIFT', HDR + ''.join(set_row(*r) for r in
            [('01', '70.0', '10', '6', '93'), ('02', '80.0', '10', '7', '107'),
             ('03', '80.0', '10', '8', '107')]), plated=False)
    + K.psec('NOTE',
        '<span style="font-size:15px;line-height:1.55;color:var(--mid)">Knees felt good after the '
        'ramp. Third squat set moved faster than the second &mdash; try 105 next time.</span>',
             plated=False),
    chrome=K.actionbar('Repeat this session', 'EDIT'))

# ------------------------------------------------------------------ C4 PRs --
PR_EVENTS = [
    (K.ACCENT, 'Today', 'Barbell Squat', 'BEST ESTIMATED 1RM', '130', 'WAS 128 &middot; 2 WEEKS'),
    (K.ACCENT, 'Tue 2 Sep', 'Barbell Squat', 'BEST SET VOLUME', '820 KG', 'WAS 800 KG'),
    (K.TICK3, 'Mon 1 Sep', 'Barbell Bench Press', 'HEAVIEST', '87.5 &times; 3', 'WAS 85 &times; 3'),
    (K.TICK2, 'Thu 28 Aug', 'Lat Pulldown', 'MOST REPS AT 68', '11', 'WAS 9'),
    (K.TICK2, 'Tue 26 Aug', 'Romanian Deadlift', 'BEST SESSION VOLUME', '3.1 T', 'WAS 2.9 T'),
    (K.TICK1, 'Fri 22 Aug', 'Barbell Squat', 'HEAVIEST', '105 &times; 3', 'WAS 102.5 &times; 3'),
]


def pr_node(date, ex, kind, val, was):
    return ('<div class="r" style="gap:9px"><span class="num" style="font-size:15px">' + date
            + '</span><span class="sp"></span>'
            '<span class="num" style="font-size:17px;font-weight:600;color:var(--accent)">' + val
            + '</span></div>'
            '<div style="display:flex;flex-direction:column;gap:2px">'
            '<span style="font-size:15px;color:var(--hi)">' + ex + '</span>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
            + kind + ' &middot; ' + was + '</span></div>')


C4 = K.phone(
    K.head('Records', 'STRENGTH')
    + K.psec('', K.tiles([('THIS MONTH', '6', K.delta('+2'), K.ACCENT),
                          ('THIS YEAR', '41', '', K.HI)], tone='raised'), first=True, pad=13)
    + K.psec('TIMELINE', K.rail([(d, pr_node(dt, ex, k, v, w))
                                 for d, dt, ex, k, v, w in PR_EVENTS], air=26), plated=False),
    active='strength')

COLS = [
 ('C1', 'Calendar', 'The one review screen that is not a rail',
  'Lab&nbsp;39&rsquo;s rebuilt calendar, imported: adjacent-month days dimmed rather than omitted, a missed session ringed so it cannot be mistaken for a rest day, three intensity steps, and the month summarised in one line of text.',
  'A calendar is chronological but it is not a <em>sequence</em> &mdash; it is a shape, and the shape is the point: gaps, streaks, and which days of the week you actually train. That is why the rail is wrong here and a grid is right. <b>It is also the one open question in the plating rule.</b> By the rule a grid draws its own boundary and belongs on the canvas &mdash; but the three intensity fills are translucent gold mixed against <span style="color:#96938c">#221f19</span>, and the ink-flip threshold was computed there. Moving it changes what every cell composites over, so it stays plated until someone redoes the arithmetic.',
  C1),
 ('C2', 'Session summary', 'The screen you see once, immediately after',
  'Four tiles two-up with the comparison folded into the number it describes, the PRs written out in full, then what you lifted per exercise.',
  'Every number here is a comparison, because that is the only question you have thirty seconds after racking the bar. <em>VS LAST</em> was a tile of its own and is now the delta on the volume figure: one tile fewer and one more thing said. <b>PRs are named, not counted</b> &mdash; &ldquo;best estimated 1RM, was 128&rdquo; tells you something; &ldquo;2 PRs&rdquo; tells you nothing. Volume-by-muscle has left this screen &mdash; a recap answers <em>how did that go</em> and a stats screen answers <em>how is it going</em>, which is the split Strong and Hevy both keep. Two plated things here and no more: the tiles and the records. What you lifted is read-only, so it takes nothing.',
  C2),
 ('C3', 'Session detail', 'The log, read back later',
  'Every set of every exercise with weight, reps, RPE and the estimated 1RM it implies. No plate, no rail, no rules: a ruled label per exercise and the columns. The note is plain text at the foot.',
  'Lab&nbsp;42 P7, chosen: <b>the set log takes no containment at all.</b> A table of mono figures is self-aligning &mdash; the columns <em>are</em> the structure &mdash; so the plate was a box drawn around something that already had one, and the rail turned out to be decoration with a good excuse. The ruled label carries each exercise. Rows are 34pt rather than 44 because nothing in this table is tappable, and the typeface was chosen for tabular figures back in Lab&nbsp;09 precisely so this screen could work with nothing else holding it.',
  C3),
 ('C4', 'Records', 'What the rail was reserved for',
  'Four summary numbers, then every PR in order with the value it beat.',
  'A PR timeline is the purest case of the rail: discrete events, in order, each one worth reading on its own &mdash; and it stays on the canvas, because a spine down the left <em>is</em> its boundary and plating it would crop the air the pattern was built around. Two tiles above it rather than four. Older records fade down the tick ramp rather than the text ramp, so age reads as distance rather than as unimportance.',
  C4),
]

INTRO = (
  K.para('Calendar, session summary, session detail and the PR timeline. Third of four boards.')
  + K.para('Three of these are chronological, which makes this the board where the <b '
           'style="color:#c9c3b6;font-weight:500">rail earns the exclusivity it was given</b> back '
           'in Lab&nbsp;27 &mdash; and where the one exception has to justify itself. The calendar '
           'is chronological and still does not get a rail, because a month is a <em>shape</em> '
           'rather than a sequence: what you want from it is gaps and streaks and which weekdays '
           'you actually train, none of which survives being straightened into a line.', '#96938c'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">Where the rail applies, finally</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">Rail:</b> PR timeline, session history on a '
           'routine, upcoming sessions in a program. Discrete events worth reading one at a time.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Not a rail:</b> the calendar (a shape, not a '
           'sequence), the set log (a table &mdash; the rows are one event, not many), the '
           'library and routine lists (order is arbitrary).')
  + K.para('One new rule came out of C3: <b style="color:#c9c3b6;font-weight:500">a row that does '
           'nothing is 34pt, not 44.</b> The hit-area floor applies to targets; applying it to a '
           'read-only table would add ten points of air per row and make a five-set log fifty '
           'points taller for nothing.', '#6f6c66')
  + '</div>')

HTML = K.page(36, 'Review', INTRO, [('', '', COLS)], CLOSING)
open('lab36.html', 'w').write(HTML)
print('wrote lab36.html', len(HTML))
