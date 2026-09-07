"""Lab 34 — Planning. Routines and programs.

First of four boards taking the locked system out to the sixteen screens that
have never been drawn in this direction. Everything is built from kit.py, so
nothing here re-derives a decision.
"""
import kit as K

# ------------------------------------------------------------- A1 routines --
ROUTINES_IN = [
    ('Lower A', '5 lifts', '~62 min', 'Tue'),
    ('Upper A', '6 lifts', '~58 min', 'Mon'),
    ('Lower B', '5 lifts', '~60 min', 'Fri'),
    ('Upper B', '6 lifts', '~55 min', 'Thu'),
]
ROUTINES_OFF = [
    ('Deload Full Body', '4 lifts', '~35 min', '12 Aug'),
]


def routine_row(name, lifts, mins, last, dim=False):
    left = ('<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
            '<span style="font-size:17px;font-weight:500;color:var(--hi)">' + name + '</span>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
            + lifts + ' &middot; ' + mins + '</span></div>')
    right = ('<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;'
             'margin-right:10px">'
             '<span class="mono lbl" style="font-size:11px">LAST</span>'
             '<span class="mono" style="font-size:13px;color:'
             + ('var(--dim)' if last == 'never' else 'var(--mid)') + '">' + last + '</span></div>')
    return K.lrow(left, right, dim=dim)


# Written in caps rather than .upper()'d — uppercasing a string containing an
# HTML entity turns &middot; into &MIDDOT;, which renders as literal text.
TEMPLATES = [('Starting Strength', '3 LIFTS &middot; LINEAR'),
             ('5/3/1 Boring But Big', '2 LIFTS + ACCESSORIES')]


def template_row(name, meta):
    return K.lrow(
        '<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
        '<span style="font-size:15px;color:var(--hi)">' + name + '</span>'
        '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
        + meta + '</span></div>',
        '<span class="mono lbl" style="margin-right:10px">COPY</span>')


A1 = K.phone(
    K.head('Routines', 'PLAN', K.ico('search', 'var(--lo)', 1.7))
    + K.psec('IN PROGRAM &middot; PPL 6-DAY',
             K.prows([routine_row(*r) for r in ROUTINES_IN]), plated=False)
    + K.psec('STANDALONE', K.prows([routine_row(*r) for r in ROUTINES_OFF]), plated=False)
    + K.psec('START FROM A TEMPLATE', K.prows([template_row(*t) for t in TEMPLATES]),
             plated=False),
    active='session')

# --------------------------------------------------------- A2 routine edit --
LIFTS = [
    ('01', 'Barbell Squat', '5 &times; 8', '102.5', '3:00'),
    ('02', 'Romanian Deadlift', '4 &times; 10', '80', '2:00'),
    ('03', 'Leg Press', '4 &times; 12', '160', '2:00'),
    ('04', 'Seated Curl', '3 &times; 12', '35', '1:30'),
]


def lift_row(idx, name, sets, kg, rest):
    left = ('<span class="mono" style="width:20px;flex:none;font-size:11px;color:var(--dim)">'
            + idx + '</span>'
            '<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
            '<span style="font-size:15px;color:var(--hi)">' + name + '</span>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.07em;color:var(--lo)">'
            + sets + ' @ ' + kg + ' KG &middot; REST ' + rest + '</span></div>')
    return K.lrow(left, '', grip=True)


# Two per row, never four (N3). The comparison rides the number it describes
# rather than taking a tile of its own.
STATS = K.tiles([('EXERCISES', '5'), ('SETS', '20'),
                 ('EST. TIME', '62 M'), ('VOLUME', '8.4 T', K.delta('+4%'))], tone='raised')

A2 = K.phone(
    K.back_head('Lower A', 'ROUTINE', K.ico('dots', 'var(--mid)', 1.7))
    + K.psec('', STATS, first=True, pad=13)
    + K.psec('EXERCISES', K.prows([lift_row(*l) for l in LIFTS]), plated=False)
    # The rail has a spine of its own; a plate around it is containment twice.
    + K.psec('LAST THREE', K.rail([
        (K.ACCENT, '<div class="r" style="gap:9px"><span class="num" style="font-size:15px">'
                   'Tue 2 Sep</span>' + K.pill('PR') + '<span class="sp"></span>'
                   '<span class="mono" style="font-size:13px;color:var(--mid)">8.6 T</span></div>'
                   '<span class="mono" style="font-size:11px;color:var(--lo)">64 MIN &middot; '
                   '20 SETS &middot; TOP 102.5 &times; 8</span>'),
        (K.TICK2, '<div class="r" style="gap:9px"><span class="num" style="font-size:15px">'
                  'Tue 26 Aug</span><span class="sp"></span>'
                  '<span class="mono" style="font-size:13px;color:var(--mid)">8.2 T</span></div>'
                  '<span class="mono" style="font-size:11px;color:var(--lo)">61 MIN &middot; '
                  '20 SETS &middot; TOP 100 &times; 8</span>'),
    ], air=24), plated=False),
    chrome=K.actionbar('Start Lower A', 'EDIT'))

# ------------------------------------------------------------- A3 programs --
DAYS = [('MON', 'Lower A', 'done'), ('TUE', 'Upper A', 'done'), ('WED', 'Rest', 'rest'),
        ('THU', 'Lower B', 'today'), ('FRI', 'Upper B', 'next'), ('SAT', 'Arms Only', 'next'),
        ('SUN', 'Rest', 'rest')]


def daystrip():
    out = []
    for d, r, st in DAYS:
        if st == 'done':    dc, rc, bg = K.DONE, 'var(--mid)', 'transparent'
        elif st == 'today': dc, rc, bg = K.ACCENT, 'var(--hi)', 'rgba(228,198,140,0.13)'
        elif st == 'rest':  dc, rc, bg = 'var(--dim)', 'var(--dim)', 'transparent'
        else:               dc, rc, bg = 'var(--lo)', 'var(--mid)', 'transparent'
        out.append('<div style="flex:1;min-width:0;display:flex;flex-direction:column;'
                   'align-items:center;gap:6px;padding:8px 0;border-radius:10px;background:' + bg + '">'
                   '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:' + dc + '">'
                   + d + '</span>'
                   '<span style="font-size:11px;color:' + rc + ';text-align:center;line-height:1.3">'
                   + r.replace(' ', '<br>') + '</span></div>')
    return '<div class="r" style="width:100%;gap:2px;align-items:stretch">' + ''.join(out) + '</div>'


A3 = K.phone(
    K.head('Programs', 'PLAN')
    + K.psec('ACTIVE',
        '<div style="display:flex;flex-direction:column;gap:14px">'
        '<div class="r" style="gap:10px"><span class="h2">PPL 6-Day</span>'
        + K.pill('WEEK 3 / 8') + '</div>'
        '<span class="mono" style="font-size:11px;letter-spacing:0.07em;color:var(--lo)">'
        'BY WEEKDAY &middot; 14 OF 48 SESSIONS DONE</span>'
        + daystrip() + '</div>', pad=13)
    + K.psec('NEXT UP', K.rail([
        (K.ACCENT,
         '<div class="r" style="gap:9px"><span class="num" style="font-size:15px">Today</span>'
         + K.pill('LOWER B') + '</div>'
         '<span class="mono" style="font-size:11px;color:var(--lo)">'
         '5 LIFTS &middot; ~60 MIN &middot; LAST DONE FRI 29 AUG</span>'),
        (K.TICK2,
         '<div class="r" style="gap:9px"><span class="num" style="font-size:15px;color:var(--mid)">'
         'Fri 5 Sep</span><span class="mono lbl">UPPER B</span></div>'
         '<span class="mono" style="font-size:11px;color:var(--lo)">6 LIFTS &middot; ~55 MIN</span>'),
        (K.TICK1,
         '<div class="r" style="gap:9px"><span class="num" style="font-size:15px;color:var(--mid)">'
         'Sat 6 Sep</span><span class="mono lbl">ARMS ONLY</span></div>'
         '<span class="mono" style="font-size:11px;color:var(--lo)">5 LIFTS &middot; ~28 MIN</span>'),
    ], air=24), plated=False)
    + K.psec('NOT RUNNING', K.prows([
        K.lrow('<div style="display:flex;flex-direction:column;gap:3px">'
               '<span style="font-size:17px;font-weight:500;color:var(--hi)">' + n + '</span>'
               '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
               + m + '</span></div>', dim=(n == 'Bodyweight Base'))
        for n, m in [('5/3/1 BBB', '4-WEEK CYCLE &middot; PAUSED WEEK 2'),
                     ('Bodyweight Base', 'FIXED CYCLE &middot; NEVER RUN')]]), plated=False),
    active='session')

# -------------------------------------------------------- A4 program edit --
WEEKS = [6, 6, 2, 0, 0, 0, 0, 0]

A4 = K.phone(
    K.back_head('PPL 6-Day', 'PROGRAM', K.ico('dots', 'var(--mid)', 1.7))
    + K.psec('', K.tiles([
        ('WEEK', '3 / 8', K.meter(3 / 8.0, w=44), K.ACCENT),
        ('SESSIONS', '14', '<span class="mono lbl">/ 48</span>', K.HI)],
        tone='raised'), first=True, pad=13)
    # A chart draws its own frame: baseline, two y labels, two x labels. The
    # label states the takeaway rather than the field name.
    + K.psec('SESSIONS PER WEEK &middot; WEEK 3 IS UNDER WAY',
             K.chart(WEEKS, 'WK 1', 'WK 8', value='2 of 6', active=2, w=316, h=54),
             plated=False)
    + K.psec('SCHEDULE', K.prows([
        K.lrow('<span class="mono" style="width:38px;flex:none;font-size:11px;letter-spacing:0.08em;'
               'color:' + ('var(--accent)' if st == 'today' else 'var(--lo)') + '">' + d + '</span>'
               '<span style="font-size:15px;color:'
               + ('var(--dim)' if r == 'Rest' else 'var(--hi)') + '">' + r + '</span>',
               K.pill('TODAY') if st == 'today' else '', grip=True)
        for d, r, st in DAYS]), plated=False),
    chrome=K.actionbar('Start Lower B &middot; today', 'PAUSE'))

# ------------------------------------------------------------------ board ---
COLS = [
 ('A1', 'Routines', 'The list, grouped by whether it is in play',
  'Routines in the active program first, standalone ones under them. Every row carries what it costs you &mdash; lifts and estimated minutes &mdash; and when you last did it, because that is what you pick on.',
  'Row plates (Lab&nbsp;42, P2). Each row carries its own lit plate and a 7pt gap does the dividing, so there is not a hairline on the screen: the boundary you can see is the boundary you press. The section is now only its ruled label, and the 46pt gap between sections is what still separates the groups. <b>Never</b> is written out rather than left blank: a blank reads as missing data, a word reads as a fact.',
  A1),
 ('A2', 'Routine detail', 'The unit of planning, and its history',
  'Two stat tiles per row, then the exercises as row plates with a grip each &mdash; the same reorder grammar as the live screen&rsquo;s sheets. The last three performances sit on the rail underneath, on the canvas.',
  'P5 from Lab&nbsp;42, which is now the rule: <b>one plated hero</b> (the tiles), <b>row plates</b> for the list you tap, and <b>nothing at all</b> for anything with its own geometry &mdash; the rail here, charts and prose elsewhere. Four numbers became <b>two per row</b>, and <em>vs last</em> rides the volume figure instead of taking a tile of its own. Three plated things on the screen, each of which means something different.',
  A2),
 ('A3', 'Programs', 'One is running; the rest are not',
  'The active program gets the week counter and a seven-day strip showing which routine falls where, with today lit and completed days in the done green. Everything else is a plain list.',
  'The day strip is the only instrument on the screen and it earns it &mdash; a program <em>is</em> a weekly shape, so showing the shape is showing the thing. It is the screen&rsquo;s one plated hero; the rail under it takes nothing and the two idle programs are row plates. Paused and never-run stay in one section rather than two: the distinction is in the meta line, not in the structure.',
  A3),
 ('A4', 'Program detail', 'The schedule, and how far in you are',
  'Two tiles, a labelled column chart, then the seven weekdays with grips so the schedule reorders the same way everything else does.',
  'The chart is never bare: y minimum and maximum anchored to the plot, first and last week labelled, the current week in the accent with everything else de-emphasised, its value printed above, and a label that states the takeaway rather than the field name. It sits on the canvas &mdash; a baseline and two axes are already a frame. Two tiles rather than four, because the chart already says how many sessions are done and how many are left; a tile repeating the chart is the redundancy that gets spotted every time.',
  A4),
]

INTRO = (
  K.para('Four boards take the locked system out to the sixteen screens that have never been drawn '
         'in this direction. This is the first: <span style="color:#f0efec">planning</span>. '
         'Everything is built from <span style="color:#96938c">kit.py</span>, which is §0 of the '
         'handoff document turned into primitives, so no screen here re-derives a decision.')
  + K.para('One thing had to be decided before anything could be drawn, and it had never been '
           'settled: <b style="color:#c9c3b6;font-weight:500">where these screens live</b>. The '
           'navigation locked at four tabs, and sixteen screens do not divide into four by '
           'accident. The arrangement below is what the tabs already imply.', '#96938c')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Today</b> &mdash; home, next session, '
           'readiness, the week so far. &nbsp;&middot;&nbsp; '
           '<b style="color:#c9c3b6;font-weight:500">Session</b> &mdash; everything you plan or '
           'start from: routines, programs, the exercise library. &nbsp;&middot;&nbsp; '
           '<b style="color:#c9c3b6;font-weight:500">Strength</b> &mdash; per-exercise history, '
           'PRs, standards, the body map. &nbsp;&middot;&nbsp; '
           '<b style="color:#c9c3b6;font-weight:500">Load</b> &mdash; volume, deload, bodyweight, '
           'calendar. &nbsp;&middot;&nbsp; '
           '<b style="color:#c9c3b6;font-weight:500">Settings</b> is not a tab &mdash; it is a '
           'gear in the Today header, because you open it twice a year.', '#6f6c66')
  + K.para('Detail screens push on top of their tab and lose the tab bar entirely, which frees '
           'that plane for the primary action. That is why A2 and A4 end in a button and A1 and '
           'A3 do not.', '#6f6c66'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">What these four establish for the next twelve</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">A list row is 44pt tall and carries its own '
           'plate</b>, with a 7pt gap instead of a separator. Name at 15&ndash;17px, a mono meta '
           'line under it at 11px, the value on the right, a chevron if it navigates and a grip if '
           'it reorders. Every list you can touch is this row.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">A section is a ruled mono label on the canvas '
           'and 46pt of air above it.</b> What sits under it is plated only if it is one of the '
           'screen&rsquo;s main components &mdash; a plate is emphasis, so two or three per screen '
           'is the budget. Where a screen needs a summary it is <b>two tiles per row</b>, label '
           'over number over visual, with any comparison attached to the number it describes.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">The rail means chronology and nothing else.</b> '
           'It appears on A2 and will appear on session history and the PR timeline. It will not '
           'appear anywhere a list would do.')
  + K.para('Content runs under the tab bar behind a fade rather than stopping short of it. The bar '
           'is glass over a moving field, which is the condition Liquid Glass actually needs &mdash; '
           'glass over a flat background reads as nothing.', '#6f6c66')
  + '</div>')

HTML = K.page(34, 'Planning', INTRO, [('', '', COLS)], CLOSING)
open('lab34.html', 'w').write(HTML)
print('wrote lab34.html', len(HTML))
