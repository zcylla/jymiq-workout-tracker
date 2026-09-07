"""Lab 42 — One plate per row.

M4 groups a list onto one plate and divides it with inset separators. The other
reading is that each row is its own plate and the gap between them is the
separator — no rules at all, and the containment lands on the thing you actually
touch.

Same rows, same data, same screens; only the containment changes. The rows come
from Labs 34 and 37 by import, so nothing here is a redrawn approximation of the
screens it is being compared against.
"""
import kit as K
import lab34
import lab35
import lab37


prow, prows = K.prow, K.prows      # promoted into kit.py, round nineteen

# ---------------------------------------------------- P1/P2 the same screen --
ROUTINES = [lab34.routine_row(*r) for r in lab34.ROUTINES_IN]
OFF = [lab34.routine_row(*r) for r in lab34.ROUTINES_OFF]
TEMPLATES = [lab34.template_row(*t) for t in lab34.TEMPLATES]

HEAD = K.head('Routines', 'PLAN', K.ico('search', 'var(--lo)', 1.7))

P1 = K.phone(
    HEAD
    + K.psec('IN PROGRAM &middot; PPL 6-DAY', ''.join(ROUTINES), inset=True, pad=13)
    + K.psec('STANDALONE', ''.join(OFF), inset=True, pad=13)
    + K.psec('START FROM A TEMPLATE', ''.join(TEMPLATES), inset=True, pad=13),
    active='session')

P2 = K.phone(
    HEAD
    + K.psec('IN PROGRAM &middot; PPL 6-DAY', prows(ROUTINES), plated=False)
    + K.psec('STANDALONE', prows(OFF), plated=False)
    + K.psec('START FROM A TEMPLATE', prows(TEMPLATES), plated=False),
    active='session')

# ------------------------------------------------ P3 rows that are controls --
UNITS = [lab37.srow('Weight', 'KG'), lab37.srow('Distance', 'CM'),
         lab37.srow('Language', 'EN')]
TRAINING = [lab37.stoggle('Track RPE', False, 'OFF &mdash; SET IT ONLY IF YOU USE IT'),
            lab37.srow('Default rest &middot; compound', '3:00'),
            lab37.srow('Default rest &middot; isolation', '1:30'),
            lab37.stoggle('Warm-up ramps', True, '40 / 60 / 75 / 85 %'),
            lab37.stoggle('Tap opens the keypad', False,
                          'OTHERWISE LONG-PRESS &middot; TAP ARMS THE TAPE')]

P3 = K.phone(
    K.back_head('Settings')
    + K.psec('UNITS', prows(UNITS), first=True, plated=False)
    + K.psec('TRAINING', prows(TRAINING), plated=False)
    + K.psec('PLATES', prows([lab37.srow('Colour scheme', 'COMPETITION'),
                              lab37.stoggle('Show plate maths', True,
                                            'PER SIDE, ON THE LIVE SCREEN')]), plated=False),
    chrome='')

# ------------------------------------------------------- P4 a dense list ----
LIB = [lab35.ex_row(*e) for e in lab35.EXERCISES]

P4 = K.phone(
    K.head('Library', 'EXERCISES')
    + K.psec('', lab35.SEARCH
             + '<div class="r" style="gap:6px;padding:4px 22px 0;margin:0 -22px;overflow-x:auto">'
             + ''.join(lab35.filt(*f) for f in lab35.FILTERS) + '</div>',
             first=True, plated=False)
    + K.psec('IN YOUR ROUTINES &middot; 18', prows(LIB[:3]), plated=False)
    + K.psec('EVERYTHING ELSE &middot; 196', prows(LIB[3:]), plated=False),
    active='session')

# ------------------------------------------------- P5 the mixed prescription --
# One plated hero, row plates for the list, prose plain.
P5 = K.phone(
    K.back_head('Lower A', 'ROUTINE', K.ico('dots', 'var(--mid)', 1.7))
    + K.psec('', K.tiles([('EXERCISES', '5'), ('SETS', '20'),
                          ('EST. TIME', '62 M'), ('VOLUME', '8.4 T', K.delta('+4%'))],
                         tone='raised'), first=True, pad=13)
    + K.psec('EXERCISES', prows([lab34.lift_row(*l) for l in lab34.LIFTS]), plated=False)
    + K.psec('NOTE', '<span style="font-size:15px;line-height:1.55;color:var(--mid)">Squat felt '
             'heavy off the ramp last time. Start the top set at 100 and go up if it moves.</span>',
             plated=False),
    chrome=K.actionbar('Start Lower A', 'EDIT'))

# ------------------------------------------- P6/P7 the set log without a plate --
# Sets within an exercise are events in order — which is the rail's definition,
# and the rail was reserved for exactly that. A set log on a plate is the third
# containment device on a screen that is mostly numbers.
def set_line(i, kg, rep_, rpe, e1):
    cells = ''.join('<span class="mono" style="width:%spx;text-align:right;color:%s">%s</span>'
                    % (w, c, v)
                    for w, v, c in zip(['54', '34', '34', '46'],
                                       [kg, '&times;' + rep_, rpe, e1],
                                       ['var(--hi)', 'var(--mid)', 'var(--mid)', 'var(--accent)']))
    return ('<div class="r" style="font-size:13px;gap:10px;min-height:20px">'
            '<span class="mono" style="width:26px;font-size:11px;color:var(--lo)">' + i + '</span>'
            '<span class="sp"></span>' + cells + '</div>')


def set_rail(rows, top=None):
    """The rail at set scale: 12pt of air rather than 56, dots on the tick ramp
    with the top set in the accent. Same pattern, one size down.

    Below about 12pt the connecting segment is too short to read and the pattern
    collapses into a column of dots — which is a legitimate look, but it is not
    the rail any more.
    """
    events = [(K.ACCENT if (top is not None and i == top) else K.TICK2, set_line(*r))
              for i, r in enumerate(rows)]
    return K.rail(events, air=12)


SQUAT = [('01', '95.0', '8', '7', '119'), ('02', '100.0', '8', '7', '125'),
         ('03', '102.5', '8', '8', '128'), ('04', '102.5', '8', '8', '128'),
         ('05', '102.5', '7', '9', '126')]
RDL = [('01', '70.0', '10', '6', '93'), ('02', '80.0', '10', '7', '107'),
       ('03', '80.0', '10', '8', '107')]
PRESS = [('01', '140.0', '12', '7', '196'), ('02', '160.0', '12', '8', '224'),
         ('03', '160.0', '10', '8', '213')]

COL_HDR = ('<div class="r" style="height:18px;gap:10px;padding-left:25px">'
           '<span class="mono lbl" style="width:26px">SET</span><span class="sp"></span>'
           + ''.join('<span class="mono lbl" style="width:' + w + 'px;text-align:right">' + n
                     + '</span>'
                     for w, n in zip(['54', '34', '34', '46'], ['KG', 'REP', 'RPE', 'e1RM']))
           + '</div>')

DETAIL_HEAD = K.back_head('Tue 2 Sep', 'LOWER A &middot; 1H 04', K.ico('dots', 'var(--mid)', 1.7))
NOTE = ('<span style="font-size:15px;line-height:1.55;color:var(--mid)">Knees felt good after the '
        'ramp. Third squat set moved faster than the second &mdash; try 105 next time.</span>')

P6 = K.phone(
    DETAIL_HEAD
    + K.psec('BARBELL SQUAT', COL_HDR + set_rail(SQUAT, top=2), first=True, plated=False)
    + K.psec('ROMANIAN DEADLIFT', COL_HDR + set_rail(RDL, top=1), plated=False)
    + K.psec('LEG PRESS', COL_HDR + set_rail(PRESS, top=1), plated=False)
    + K.psec('NOTE', NOTE, plated=False),
    chrome=K.actionbar('Repeat this session', 'EDIT'))

# P7: no containment at all — the same rows as P6 with the gutter removed, so
# the only difference between the two columns is the rail itself.
def set_lines(rows):
    return ('<div style="display:flex;flex-direction:column;gap:12px">'
            + ''.join(set_line(*r) for r in rows) + '</div>')


PLAIN_HDR = COL_HDR.replace('padding-left:25px', 'padding-left:0')
P7 = K.phone(
    DETAIL_HEAD
    + K.psec('BARBELL SQUAT', PLAIN_HDR + set_lines(SQUAT), first=True, plated=False)
    + K.psec('ROMANIAN DEADLIFT', PLAIN_HDR + set_lines(RDL), plated=False)
    + K.psec('LEG PRESS', PLAIN_HDR + set_lines(PRESS), plated=False)
    + K.psec('NOTE', NOTE, plated=False),
    chrome=K.actionbar('Repeat this session', 'EDIT'))

COLS = [
 ('P1', 'Grouped plate', 'M4 as it stands',
  'One plate per section, inset separators between the rows inside it. The control column &mdash; this is what all sixteen screens ship today.',
  'The plate is the section and the separators are the rows. It reads as one object, which is right when the section <em>is</em> one object: a set log, a rep-max table, a form. On a list of things you tap individually it is arguably one object too many &mdash; the boundary you can see and the boundary you touch are different shapes.',
  P1),
 ('P2', 'One plate per row', 'The same screen, containment moved down a level',
  'Identical rows and identical sections; each row carries its own plate and a 7pt gap does the dividing. No rules anywhere on the screen.',
  'The boundary now matches the target: the thing with an edge is the thing you press, which is the strongest argument for it. It costs about <b>7pt per row</b> in gaps, so a six-row list loses roughly one row above the fold. The risk is repetition &mdash; ten identical capsules down a screen start to read as a texture rather than as ten things.',
  P2),
 ('P3', 'Rows that are controls', 'Where row plates should be strongest',
  'Settings: fields that open a picker and switches that flip. Every row does something different when you touch it.',
  'This is the case where the argument is cleanest, and worth deciding on its own. A separator says <em>these belong to one list</em>; a plate says <em>this is a control</em>. Settings rows are not really a list &mdash; they are a stack of unrelated controls that happen to be adjacent, which is exactly what the grouped plate over-claims.',
  P3),
 ('P4', 'A dense list', 'Where it is most likely to fall over',
  'Six library rows, which is the shortest a library list ever is. This is the stress test rather than the showcase.',
  'Six is fine and twenty may not be. Watch for two failures: the gaps flattening into stripes so no row stands out, and the section label losing its grip because the rows below it already look like separate sections. If P4 reads worse than P2, the answer is probably <b>row plates for short lists of controls, grouped plates for long lists of records</b>.',
  P4),
 ('P5', 'The mixed prescription', 'Plate as emphasis, not as default',
  'Your rule applied to a whole screen: the summary tiles are a plated hero, the exercises are row plates, and the note is plain text under a ruled label.',
  '<b>Chosen.</b> This is the rule now. <b>A plate is a highlight</b>, so the number of plated things per screen has to stay small or the highlight means nothing &mdash; and prose is never one of them, because a paragraph on a lifted surface reads as important without being important. The ruled section label is what carries anything unplated, which is the job it has had since Lab&nbsp;40.',
  P5),
 ('P6', 'The set log on a rail', 'Sets are events in order',
  'C3 with the plate removed and the rail brought down to set scale: 8pt of air instead of 56, dots on the tick ramp with the top set in the accent. The columns and their header are unchanged.',
  'You are right that this is the pattern the log wants. The rail was reserved for <em>anything chronological</em> and five sets of a squat are as chronological as five sessions &mdash; the only difference is scale. It also removes the third containment device from a screen that is already a header, a section label and a grid of numbers. The dot earns its place by carrying which set was the top one, which the plate version had no way to say.',
  P6),
 ('P7', 'The set log with nothing', 'The control for P6',
  'The same rows as P6 with the gutter removed &mdash; identical type, identical spacing, no plate and no rail. The ruled section label is the only structure on the screen.',
  '<b>Chosen.</b> Worth seeing next to P6 before crediting the rail for the improvement. A table of mono figures is self-aligning &mdash; the columns <em>are</em> the structure &mdash; so it is possible that nothing was needed here and the rail is decoration with a good excuse. If P7 reads as well as P6, take P7: it is fewer marks for the same reading. If it reads as a floating slab of digits, the rail is doing real work.',
  P7),
]

INTRO = (
  K.para('<b style="color:#e4c68c;font-weight:500">Settled:</b> P5 is the rule and P7 is the set '
         'log. Row plates for anything you touch, one plated hero per screen, nothing at all for '
         'read-only tables, prose, charts and rails. Labs 34&ndash;37 and 39 are built that way '
         'now; this board is the argument that got there.')
  + K.para('Two notes from the restyle review, both about the same thing: <b style="color:#c9c3b6;'
         'font-weight:500">a plate should mark what matters, not contain everything.</b>')
  + K.para('First, the plate is off the prose. The exercise description, the how-to, the common '
           'mistakes, the deload call, the readiness verdict and the session note are all plain '
           'text under a ruled label now, on Labs 35&ndash;37 and 39. A paragraph is not a '
           'component, and putting it on the same surface as the instruments says it is one.',
           '#96938c')
  + K.para('Second, this board: <b style="color:#c9c3b6;font-weight:500">the plate moved down a '
           'level.</b> Instead of one plate per section with rules inside it, each row gets its '
           'own and the gap between them does the dividing. P1 is the control and P2 is the same '
           'screen; P3 and P4 are the two cases that decide it; P5 is the whole rule on one '
           'screen.', '#96938c')
  + K.para('P6 and P7 answer the third note: the set log is chronological, so it should probably '
           'be a rail rather than a plate &mdash; and P7 checks whether it needs anything at all.',
           '#6f6c66'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">What each answer costs</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">Row plates cost about 7pt a row</b> and '
           'delete every hairline on the screen. On a four-row section that is nothing; on a '
           'twenty-row library it is three rows of scroll and a lot of repeated geometry.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Grouped plates cost a hairline</b> and claim '
           'that the rows belong together. That claim is true of a set log and a rep-max table, '
           'and false of a settings screen.')
  + K.para('The split I would take from this board, if P3 and P4 land the way I expect: <b '
           'style="color:#c9c3b6;font-weight:500">row plates where each row is a control</b> '
           '(settings, toggles, fields, reorderable lists), <b style="color:#c9c3b6;'
           'font-weight:500">grouped plates where the rows are one record</b> (set logs, rep '
           'maxes, PR lists), <b style="color:#c9c3b6;font-weight:500">no plate at all for prose, '
           'charts, rails and instruments</b>. Say which of the five reads best and it becomes the '
           'rule.', '#6f6c66')
  + '</div>')

HTML = K.page(42, 'One plate per row', INTRO, [('', '', COLS)], CLOSING)
open('lab42.html', 'w').write(HTML)
print('wrote lab42.html', len(HTML))
