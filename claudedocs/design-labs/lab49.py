"""Lab 49 — History replaces Strength.

The owner's brief: the Strength tab becomes History (calendar, the sessions done,
overall stats); body map and Records move out of Strength; and the app stops
explaining itself. Every screen here is names, numbers and 1-2 word labels.
Meaning is carried by fill, outline, texture and position.

The day-state set is the other half: trained / planned / missed / rest / today,
readable with no key. The encoding is one grammar for the week strip and the
calendar: solid = done, dashed = planned, hatched = missed, empty = rest.

Data is one invented September 2026, today = Tue 29. Program: Mon Lower A,
Tue Upper A, Thu Lower B, Fri Upper B. Missed: Thu 17, Fri 25.

New primitives (here, not in kit.py): cal_cell / month (state calendar),
strip_cell / strip (state week strip), ev (one-line session row), figure
(the MuscleMap body figure, simplified from src/components/body-map/paths.ts).
"""
import re

import kit as K
import lab35            # heat(): the body map's OFF -> LIVE ramp
import lab36            # pr_node(): the Records rail row
import lab37            # band_row(): the zone bar
import lab43 as L       # next_card(), V1_LIFTS
import lab44 as F       # INK on the accent fill

# ------------------------------------------------------------------ chrome ----
TABS = [('today', 'Today'), ('session', 'Session'), ('cal', 'History'), ('load', 'Load')]


def nav(active):
    """W2 with History in Strength's slot. kit.nav reads K.TABS at call time."""
    old, K.TABS = K.TABS, TABS
    try:
        return K.nav(active, 'raised')
    finally:
        K.TABS = old


def phone(scr, active='cal', **kw):
    return K.phone(scr, chrome=nav(active), **kw)


def btn(icon_html, flip=False):
    return ('<span style="width:44px;height:44px;flex:none;display:flex;align-items:center;'
            'justify-content:center' + (';transform:scaleX(-1)' if flip else '') + '">'
            + icon_html + '</span>')


PAGER = ('<div class="r">' + btn(K.ico('back', 'var(--mid)', 1.8))
         + btn(K.ico('back', 'var(--dim)', 1.8), flip=True) + '</div>')
CAL_BTN = btn(K.ico('cal', 'var(--mid)', 1.7))
DOWN = ('<span style="display:inline-flex;transform:rotate(90deg)">' + K.CHEV + '</span>')

# -------------------------------------------------------------------- data ----
TODAY = 29
WD = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
PLAN = {0: 'Lower A', 1: 'Upper A', 3: 'Lower B', 4: 'Upper B'}
# day -> (tonnes, minutes, pr)
DONE = {1: (7.0, 55, False), 3: (8.1, 61, False), 4: (6.6, 52, False), 7: (8.2, 63, False),
        8: (7.1, 56, True), 10: (7.8, 60, False), 11: (6.9, 54, False), 14: (8.4, 64, False),
        15: (7.3, 57, False), 18: (7.0, 55, False), 21: (8.6, 66, True), 22: (7.4, 58, False),
        24: (8.1, 62, True), 28: (8.8, 65, True)}


def wd(d):
    """September 2026 opens on a Tuesday, so d % 7 is the weekday with Monday 0."""
    return d % 7


def state(d, today=TODAY, plan=True):
    if d in DONE and d <= today:
        return 'today-done' if d == today else 'done'
    sched = plan and wd(d) in PLAN
    if d == today:
        return 'today-plan' if sched else 'today'
    if sched:
        return 'missed' if d < today else 'plan'
    return 'rest'


def step(t):
    return 3 if t >= 8.4 else 2 if t >= 7.4 else 1


SESSIONS = len(DONE)
TONNES = sum(v[0] for v in DONE.values())
WEEKS = [27.4, 28.1, 26.0, 28.9, 29.7, 30.0, 22.7, 24.1]      # W32..W39, complete weeks

# ------------------------------------------------------- the day-state set ----
# One grammar for both surfaces. Fill = it happened. Dashed = it is planned.
# Hatched = it was planned and did not happen ("greyed out"). Nothing = rest.
# Today is the only solid outline. Texture and line style survive greyscale
# and colour-blindness; the old ring was a grey outline told apart by nothing.
DASH = 'rgba(228,198,140,0.70)'
HATCH = ('repeating-linear-gradient(135deg,rgba(255,255,255,0.12) 0 1.5px,'
         'transparent 1.5px 5px)')
FILL = {1: 'rgba(228,198,140,0.16)', 2: 'rgba(228,198,140,0.38)', 3: 'rgba(228,198,140,0.75)'}
INK = {1: 'var(--mid)', 2: 'var(--hi)', 3: '#171208'}   # lab39's measured ink flip
REST_PLATE = 'rgba(255,255,255,0.035)'


def cal_cell(n, st, t=0.0, out=False, old=False):
    """One calendar day. `old` draws today's shipped encoding, for the rejected column."""
    bg, ink, extra, weight = 'transparent', 'var(--lo)', '', 400
    if st in ('done', 'today-done'):
        bg, ink, weight = FILL[step(t)], INK[step(t)], 600
    elif old:
        if st == 'missed':
            extra = 'border:1px solid var(--tick2);'
        else:
            bg = REST_PLATE
    elif st == 'plan':
        extra, ink = 'border:1.5px dashed ' + DASH + ';', 'var(--mid)'
    elif st == 'missed':
        bg, ink = HATCH, 'var(--lo)'
    elif st == 'today-plan':
        ink, weight = 'var(--accent)', 600
    if st.startswith('today'):
        extra += 'box-shadow:0 0 0 1.5px var(--accent);'
        if st == 'today':
            ink = 'var(--hi)'
    return ('<div style="aspect-ratio:1;display:flex;align-items:center;justify-content:center;'
            'border-radius:8px;background:' + bg + ';' + extra
            + ('opacity:0.35;' if out else '') + '">'
            '<span class="mono" style="font-size:13px;font-weight:' + str(weight)
            + ';color:' + ink + '">' + str(n) + '</span></div>')


def month(plan=True, today=TODAY, empty=False, gap=4):
    heads = ''.join('<div style="display:flex;justify-content:center;padding-bottom:3px">'
                    '<span class="mono lbl">' + d + '</span></div>' for d in 'MTWTFSS')
    lead = cal_cell(31, 'rest' if empty else 'done', 8.0, out=True)
    days = ''.join(cal_cell(d, 'rest' if empty and d != today else
                            ('today' if empty else state(d, today, plan)),
                            DONE.get(d, (0,))[0]) for d in range(1, 31))
    # Oct 1-4: Thu and Fri are planned; adjacent-month days are dimmed, not omitted.
    trail = ''.join(cal_cell(n, 'plan' if (plan and not empty and n in (1, 2)) else 'rest',
                             out=True) for n in (1, 2, 3, 4))
    return ('<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:' + str(gap)
            + 'px">' + heads + lead + days + trail + '</div>')


BAR = 26
TOP_T = max(v[0] for v in DONE.values())


def strip_cell(letter, date, st, t=0.0, w=46, bar=BAR, old=False):
    """One day on the Today strip (lab45 W3), in the same grammar as cal_cell."""
    bg, lc, dc = 'transparent', 'var(--lo)', 'var(--hi)'
    slot = 'width:14px;height:%dpx;border-radius:3px;' % min(18, bar - 6)
    if st in ('done', 'today-done'):
        h = max(4, round(bar * t / TOP_T))
        mark = ('<span style="width:14px;height:' + str(h) + 'px;border-radius:3px;background:'
                + (K.ACCENT if st == 'today-done' else K.DONE) + '"></span>')
    elif old or st in ('rest', 'today'):
        mark = '<span style="width:14px;height:4px;border-radius:2px;background:rgba(255,255,255,0.07)"></span>'
        if old and st == 'missed':
            dc = 'var(--lo)'
    elif st in ('plan', 'today-plan'):
        mark = '<span style="' + slot + 'border:1.5px dashed ' + DASH + '"></span>'
    else:                                                   # missed
        mark = '<span style="' + slot + 'background:' + HATCH + '"></span>'
        lc, dc = 'var(--dim)', 'var(--dim)'
    if st.startswith('today'):
        bg, lc = 'rgba(228,198,140,0.15)', K.ACCENT
    date_html = ('<span class="mono" style="font-size:13px;color:' + dc
                 + (';outline:1px solid var(--tick2);outline-offset:2px;border-radius:2px'
                    if old and st == 'missed' else '') + '">' + date + '</span>')
    return ('<div style="width:' + str(w) + 'px;flex:none;min-height:44px;display:flex;'
            'flex-direction:column;align-items:center;gap:6px;padding:7px 0;border-radius:10px;'
            'background:' + bg + '">'
            '<span class="mono" style="font-size:11px;letter-spacing:0.06em;color:' + lc + '">'
            + letter + '</span>' + date_html
            + '<span style="height:' + str(bar) + 'px;display:flex;align-items:flex-end">'
            + mark + '</span></div>')


def strip_days(first, last):
    """(letter, date, state, tonnes) from Sep `first` to `last` (>30 runs into October)."""
    out = []
    for d in range(first, last + 1):
        date = d if d <= 30 else d - 30
        st = state(d) if d <= 30 else ('plan' if wd(d) in PLAN else 'rest')
        out.append(('MTWTFSS'[wd(d)], str(date), st, DONE.get(d, (0,))[0]))
    return out


def strip(days, offset=0):
    return ('<div style="margin:0 -13px;padding:0 13px;overflow:hidden">'
            '<div class="r" style="gap:5px;align-items:stretch;transform:translateX(-'
            + str(offset) + 'px);width:max-content">'
            + ''.join(strip_cell(*d) for d in days) + '</div></div>')


# ------------------------------------------------------------ session rows ----
def tone(d):
    return K.ACCENT if d == max(DONE) else K.TICK2


def ev(d):
    """One session, one line: date, routine, PR, tonnes. Opens C3."""
    t, _, pr = DONE[d]
    return ('<div class="r" style="gap:10px">'
            '<span class="num" style="font-size:15px;width:58px;flex:none">' + WD[wd(d)] + ' '
            + str(d) + '</span>'
            '<span style="font-size:15px;color:var(--hi)">' + PLAN[wd(d)] + '</span>'
            + (K.pill('PR') if pr else '') + '<span class="sp"></span>'
            '<span class="mono" style="font-size:13px;color:var(--mid)">' + ('%.1f' % t)
            + ' T</span></div>')


def rail(days):
    return K.rail([(tone(d), ev(d)) for d in days], air=24)


SEPT = sorted(DONE, reverse=True)


# ------------------------------------------------------------------- stats ----
def num_row(label, value, right=''):
    return K.lrow('<span style="font-size:15px;color:var(--hi)">' + label + '</span>',
                  '<span class="num" style="font-size:15px;margin-right:10px">' + value
                  + '</span>' + right)


STATS3 = K.tiles([('SESSIONS', str(SESSIONS), '', K.HI, K.delta('+1')),
                  ('TONNES', '%.1f' % TONNES, '', K.HI, K.delta('+6%')),
                  ('PRS', '6', '', K.ACCENT, K.delta('+2'))], cols=3, tone='raised')

HERO = ('<div class="r" style="gap:12px;align-items:flex-end">'
        '<span class="num" style="font-size:52px;font-weight:600;line-height:0.9">'
        + str(SESSIONS) + '</span>'
        '<div style="display:flex;flex-direction:column;gap:4px;padding-bottom:3px">'
        '<span class="mono lbl">SESSIONS</span>' + K.delta('+1') + '</div>'
        '<span class="sp"></span>'
        '<div style="display:flex;flex-direction:column;gap:4px;align-items:flex-end;'
        'padding-bottom:3px"><span class="mono lbl">PRS</span>'
        '<span class="num" style="font-size:17px;font-weight:600;color:var(--accent)">6</span>'
        '</div></div>'
        '<div style="height:14px"></div><span class="mono lbl">TONNES / WEEK</span>'
        + K.chart(WEEKS, 'W32', 'W39', value='24.1 T', w=270, h=58))

RECORDS_ROW = num_row('Records', '41')

# --------------------------------------------------------- A · History root ----
HEAD_A = K.head('September', '2026', PAGER)

HA_BODY = (HEAD_A
           + K.psec('', STATS3, first=True, pad=13)
           + K.psec('', month(), pad=15)
           + K.psec('SESSIONS', rail(SEPT), plated=False)
           + K.psec('', K.prows([RECORDS_ROW]), plated=False))
HA = phone(HA_BODY)
HA2 = phone(HA_BODY, scroll=606)

HEAD_B = K.head('History', right=CAL_BTN)
HB = phone(HEAD_B
           + K.psec('', HERO, first=True, pad=15)
           + K.psec('SEPTEMBER', rail(SEPT[:7]), plated=False))

SHEET_B = ('<div class="scrim"></div><div class="sheet"><div class="grab"></div>'
           '<div class="r" style="padding:0 4px"><span class="h2">September</span>'
           '<span class="sp"></span>' + PAGER + '</div>'
           + month(gap=5) + '<div style="height:6px"></div></div>')
HB2 = phone(HEAD_B
            + K.psec('', HERO, first=True, pad=15)
            + K.psec('SEPTEMBER', rail(SEPT[:7]), plated=False), sheet=SHEET_B)

WEEK = strip_days(28, 34)
WEEK_PLATE = ('<div class="r" style="justify-content:space-between">'
              + ''.join(strip_cell(*d, w=42, bar=34) for d in WEEK) + '</div>'
              '<div class="r" style="justify-content:center;gap:8px;min-height:44px">'
              '<span class="mono lbl">MONTH</span>' + DOWN + '</div>'
              + K.tiles([('SESSIONS', '1', K.meter(1 / 4.0, w=44), K.HI),
                         ('TONNES', '8.8', K.delta('+4%'), K.HI)], tone='raised'))
HC = phone(K.head('This week', 'W40')
           + K.psec('', WEEK_PLATE, first=True, pad=13)
           + K.psec('W40', rail([28]), plated=False)
           + K.psec('W39', rail([24, 22, 21]), plated=False)
           + K.psec('W38', rail([18, 15]), plated=False))

# ------------------------------------------------------ B · stats treatment ----
def bare(html):
    """A component on the ground, outside a phone, for side-by-side comparison."""
    return ('<div style="width:402px;background:var(--ground);border-radius:24px;padding:22px;'
            'border:1px solid rgba(255,255,255,0.08)">' + html + '</div>')


B1 = bare(K.panel(STATS3, pad=13))
B2 = bare(K.panel(HERO, pad=15))

# ------------------------------------------------------------ C · Load root ----
FATIGUE = {'chest': 0.22, 'shoulders': 0.48, 'biceps': 0.35, 'triceps': 0.35,
           'forearms': 0.25, 'abs': 0.10, 'quads': 0.86, 'hamstrings': 0.72, 'calves': 0.30,
           'glutes': 0.68, 'adductors': 0.50, 'lats': 0.55, 'traps': 0.45, 'back': 0.50,
           'lower_back': 0.60}


def _simplify(d):
    """Keep each cubic's end point, round to whole units: a polyline in a 1024 box.

    At 150pt a segment is under 2pt long, so the curve is not missed; the path
    drops from 131 KB to 31 KB, which keeps the board under the 256 KiB read cap.
    """
    out, toks, i = [], re.findall(r'[MCZ]|-?\d+\.?\d*', d), 0
    while i < len(toks):
        t = toks[i]
        if t == 'M':
            out.append('M%d %d' % (round(float(toks[i + 1])), round(float(toks[i + 2]))))
            i += 3
        elif t == 'C':
            i += 1
            pts = []
            while i < len(toks) and toks[i] not in 'MCZ':
                pts.append(float(toks[i]))
                i += 1
            out.append('L' + ' '.join('%d %d' % (round(pts[j + 4]), round(pts[j + 5]))
                                      for j in range(0, len(pts), 6)))
        else:
            out.append('Z')
            i += 1
    return ''.join(out)


def _symbols():
    """The device's figure (MuscleMap, MIT), defined once and <use>d everywhere."""
    src = open('../../src/components/body-map/paths.ts').read()
    front, back = src.split('\n  back: {')
    syms = []
    for name, part in (('front', front), ('back', back)):
        outline = re.findall(r"'(M[^']*)'", part.split('surfaces:')[0])
        surf = re.findall(r"muscle: '(\w+)',\s*d: '([^']*)'", part)
        p = ''.join('<path d="' + _simplify(d) + '" fill="' + K.PANEL
                    + '" stroke="rgba(255,255,255,0.11)" stroke-width="1" '
                      'vector-effect="non-scaling-stroke"></path>' for d in outline)
        p += ''.join('<path d="' + _simplify(d) + '" fill="' + lab35.heat(FATIGUE.get(m, 0))
                     + '"></path>' for m, d in surf)
        syms.append('<symbol id="bm-' + name + '" viewBox="0 0 1024 1536">' + p + '</symbol>')
    return ('<svg width="0" height="0" style="position:absolute"><defs>' + ''.join(syms)
            + '</defs></svg>')


DEFS = _symbols()


def figure(view, w):
    return ('<svg viewBox="0 0 1024 1536" style="width:%dpx;height:%dpx;flex:none">'
            '<use href="#bm-%s"></use></svg>' % (w, round(w * 1.5), view))


SCALE = ('<div class="r" style="gap:8px"><span class="mono lbl">FRESH</span>'
         '<span class="r" style="flex:1;border-radius:3px;overflow:hidden">'
         + ''.join('<span style="flex:1;height:6px;background:' + lab35.heat(v) + '"></span>'
                   for v in (0, 0.25, 0.5, 0.75, 1)) + '</span>'
         '<span class="mono lbl">TIRED</span></div>')

BANDS = ''.join(lab37.band_row(*b) for b in lab37.BANDS[:4])
DELOAD = ('<div class="r" style="gap:10px">' + K.pill('NOT YET', 'var(--mid)',
                                                    'rgba(255,255,255,0.07)')
          + '<span class="mono" style="font-size:13px;color:var(--lo)">W5</span></div>')
HEAD_L = K.head('Load', 'THIS WEEK')
# Deload rides on the tiles' plate as one line: the week's numbers and the week's
# verdict are one component, and a section of its own cost 90pt for two words.
LOAD_TILES = (K.tiles([('SETS', '67', '', K.HI), ('VOLUME', '18.4 T', K.delta('+9%'), K.HI)],
                      tone='raised')
              + '<div class="r" style="gap:10px;padding:4px 2px 0"><span class="mono lbl">DELOAD'
                '</span><span class="sp"></span>' + DELOAD + '</div>')

PR_ROWS = [(K.ACCENT, lab36.pr_node('Mon 28', 'Barbell Squat', '1RM &middot; WAS 128', '130', '')),
           (K.TICK2, lab36.pr_node('Thu 24', 'Barbell Bench Press', 'HEAVIEST', '87.5 &times; 3', '')),
           (K.TICK2, lab36.pr_node('Mon 21', 'Romanian Deadlift', 'SESSION VOLUME', '3.1 T', ''))]
# pr_node joins kind and was with a middot; an empty `was` leaves a dangling one.
PR_RAIL = K.rail([(c, h.replace(' &middot; </span>', '</span>')) for c, h in PR_ROWS], air=22)

LA_BODY = (HEAD_L
           + K.psec('', '<div class="r" style="justify-content:center;gap:14px">'
                    + figure('front', 140) + figure('back', 140) + '</div>'
                    + '<div style="height:12px"></div>' + SCALE, first=True, plated=False)
           + K.psec('', LOAD_TILES, pad=13)
           + K.psec('SETS / MUSCLE', BANDS, plated=False)
           + K.psec('', K.prows([num_row('Bodyweight', '84.3')]), plated=False)
           + K.psec('RECORDS', PR_RAIL, plated=False,
                    right='<span class="r" style="gap:8px"><span class="num" '
                          'style="font-size:13px;color:var(--mid)">41</span>' + K.CHEV + '</span>'))
LA = phone(LA_BODY, active='load')
LA2 = phone(LA_BODY, active='load', scroll=483)

BODY_ROW = K.lrow('<span class="r" style="gap:10px">' + figure('front', 22) + figure('back', 22)
                  + '<span style="font-size:15px;color:var(--hi);margin-left:4px">Body</span>'
                    '</span>',
                  '<span class="r" style="gap:7px;margin-right:10px">'
                  '<span style="width:8px;height:8px;border-radius:2px;background:'
                  + lab35.heat(0.86) + '"></span><span class="mono" style="font-size:13px;'
                  'color:var(--mid)">QUADS</span></span>')
LB = phone(HEAD_L
           + K.psec('', LOAD_TILES, first=True, pad=13)
           + K.psec('SETS / MUSCLE', BANDS, plated=False)
           + K.psec('', K.prows([BODY_ROW, num_row('Bodyweight', '84.3'), RECORDS_ROW]),
                    plated=False),
           active='load')

# ------------------------------------------------------ D · the state set ----
STATES = [('TRAINED', 'done', 8.1), ('PLANNED', 'plan', 0), ('MISSED', 'missed', 0),
          ('REST', 'rest', 0), ('TODAY &middot; PLANNED', 'today-plan', 0),
          ('TODAY &middot; DONE', 'today-done', 8.8)]


def swatch(st, t, old, which):
    if which == 'strip':
        return strip_cell('T', '17', st, t, old=old)
    return ('<div style="width:44px">' + cal_cell(17, st, t, old=old) + '</div>')


def state_table():
    head = ('<div class="r" style="gap:8px;padding:0 0 10px">'
            '<span style="width:118px"></span>'
            '<span class="mono lbl" style="width:106px;text-align:center;color:var(--accent)">'
            'RECOMMENDED</span><span class="mono lbl" style="width:106px;text-align:center">'
            'REJECTED</span></div>')
    rows = ''.join(
        '<div class="r" style="gap:8px;padding:5px 0">'
        '<span class="mono lbl" style="width:118px">' + name + '</span>'
        + ''.join('<div class="r" style="gap:10px;width:106px;justify-content:center">'
                  + swatch(st, t, old, 'strip') + swatch(st, t, old, 'cal') + '</div>'
                  for old in (False, True)) + '</div>'
        for name, st, t in STATES)
    grey = ('<div style="height:18px"></div><span class="mono lbl">GREYSCALE</span>'
            '<div class="r" style="gap:6px;padding-top:8px;filter:grayscale(1)">'
            + ''.join(swatch(st, t, False, 'strip') for _, st, t in STATES) + '</div>'
            '<div class="r" style="gap:6px;padding-top:8px;filter:grayscale(1)">'
            + ''.join('<div style="width:46px;display:flex;justify-content:center">'
                      + swatch(st, t, False, 'cal') + '</div>' for _, st, t in STATES)
            + '</div>')
    return ('<div style="width:402px;background:' + K.RAISED + ';border-radius:24px;padding:20px 16px">'
            + head + rows + grey + '</div>')


def today_card():
    return (L.next_card('TODAY', 'Upper A', '5 LIFTS &middot; ~58 MIN', L.V1_LIFTS, cta='')
            + '<div style="height:11px"></div>'
            '<div class="r" style="min-height:50px;border-radius:14px;background:' + K.ACCENT
            + ';justify-content:center;box-shadow:inset 0 1px 0 rgba(255,255,255,0.45), '
              '0 8px 20px rgba(0,0,0,0.45)">'
            '<span style="font-size:16px;font-weight:600;color:' + F.INK + '">Start</span></div>')


TDAYS = strip_days(14, 34)
TODAY_PHONE = phone(
    K.head('Today', 'TUE 29 SEP', K.ico('gear', 'var(--lo)', 1.7))
    + K.psec('', today_card(), first=True, pad=15)
    + K.psec('THIS WEEK', strip(TDAYS, 11 * 51) + '<div style="height:11px"></div>'
             + K.tiles([('SESSIONS', '1', K.meter(1 / 4.0, w=44), K.HI),
                        ('VOLUME', '8.8 T', K.delta('+4%'), K.HI)], tone='raised'), pad=13)
    + K.psec('RECENT', rail([28]), plated=False),
    active='today')

# --------------------------------------------------------------- E · empty ----
EMPTY_STATS = K.tiles([('SESSIONS', '0', '', K.DIM), ('TONNES', '0', '', K.DIM),
                       ('PRS', '0', '', K.DIM)], cols=3, tone='raised')
PLUS = K.ico('plus', 'var(--accent)', 1.8, 18)
EMPTY = phone(
    HEAD_A
    + K.psec('', EMPTY_STATS, first=True, pad=13)
    + K.psec('', month(plan=False, empty=True), pad=15)
    + K.psec('SESSIONS', K.prows([
        K.lrow('<span style="font-size:15px;color:var(--hi)">New program</span>', PLUS,
               chev=False),
        K.lrow('<span style="font-size:15px;color:var(--hi)">Restore backup</span>')]),
        plated=False))

# ------------------------------------------------------------ the settings ----
# The audit agent's panel, folded in rather than redrawn. Its dots name
# var(--done), which kit's CSS never defines (kit calls it --pos), so they
# rendered transparent; fixed here on the way in.
try:
    import lab49_settings as S
    SETTINGS_COLS = [c[:5] + (c[5].replace('var(--done)', 'var(--pos)'),) for c in S.COLS]
except ImportError:
    SETTINGS_COLS = []


def col(k, t, s, html):
    return (k, t, s, '', '', html)


A_COLS = [
    col('H-A', 'Month page', 'The month is the period: pager, tiles, grid and list all move together.', HA),
    col('H-A&prime;', 'Month page, scrolled', 'One-line sessions, then Records as the last row.', HA2),
    col('H-B', 'Archive first', 'List on open; the calendar is a sheet behind the header icon.', HB),
    col('H-B&prime;', 'Archive, calendar open', 'Same grid, on the sheet; tap a day to open it.', HB2),
    col('H-C', 'Week first', 'Today&rsquo;s strip promoted: week-ruled runs match the program. Thin on a Tuesday.', HC),
]
B_COLS = [
    col('B1', 'Three tiles', 'Three numbers, three deltas vs last month. Used in H-A.', B1),
    col('B2', 'Hero and chart', 'One number big, the weekly shape under it. Used in H-B.', B2),
]
C_COLS = [
    col('L-A', 'Body as hero', 'The figure opens the tab; Records is a section at the foot.', LA),
    col('L-A&prime;', 'Body as hero, scrolled', 'What the hero pushes down: bars, deload, Records.', LA2),
    col('L-B', 'Body as a row', 'Numbers first; figure, bodyweight, Records as three one-line rows.', LB),
]
D_COLS = [
    col('D1', 'Five states, no key', 'Solid = done &middot; dashed = planned &middot; hatched = missed &middot; empty = rest &middot; ring = today.', state_table()),
    col('D2', 'On Today', 'W3 strip: missed Fri 25, today planned, Thu 1 and Fri 2 dashed ahead.', TODAY_PHONE),
]
E_COLS = [
    col('E', 'Fresh install', 'Tiles at zero, the grid, two actions. No sentence.', EMPTY),
]

INTRO = (DEFS + K.para(
    'Strength becomes <b style="color:#c9c3b6;font-weight:500">History</b>: calendar, sessions, '
    'stats. Body map and Records move out. Every screen is names, numbers and one-word labels.'))

S0 = [
    ('Information architecture', 'Strength &rarr; <b>History</b> (calendar, month stats, sessions, Records). Load gains the body map. Calendar leaves Load.'),
    ('Navigation', 'Tabs read Today &middot; Session &middot; History &middot; Load. History uses <code>cal.svg</code>; <code>strength.svg</code> retires.'),
    ('Calendar', '&ldquo;Rest is a plate, missed carries a ring&rdquo; &rarr; done = fill, planned = dashed, missed = hatched, rest = nothing, today = the only solid ring. No key. Month summary line &rarr; three tiles.'),
    ('The week strip', '&ldquo;Missed keeps the ring under its number&rdquo; &rarr; same grammar: dashed slot, hatched slot, stub.'),
    ('Rail pattern', 'Add &ldquo;History&rsquo;s month list&rdquo;. Session rows are one line.'),
    ('Stat blocks', '&ldquo;Two per row&rdquo; &rarr; three allowed when every value is 5 characters or fewer.'),
    ('Today', '&ldquo;The timeline lives on Strength&rdquo; &rarr; on History.'),
    ('Empty states', '&ldquo;A short sentence plus a set of actions&rdquo; &rarr; actions only.'),
    ('Model output', 'Deload is a pill (NOT YET / DELOAD) and a week, not a sentence.'),
    ('Lab 47 &middot; deliberately absent', 'Delete &ldquo;a history list&rdquo;.'),
    ('List row', 'Settings rows carry no meta (Lab 49 E1).'),
]

CLOSING = (
    '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
    'color:#f0efec">F &middot; Recommendation</h2>'
    + K.para('<b style="color:#c9c3b6;font-weight:500">Build H-A with B1 tiles, L-B, and D1.</b>')
    + K.para('One period on History, the month in view. The pager is the period switch, so no chips.')
    + K.para('The list is finite: a month is 10&ndash;20 one-line rows, which closes Lab 46&rsquo;s open question.')
    + K.para('Records stays chronological, so it goes to History as a row. Load keeps the present tense.')
    + K.para('One day grammar on both surfaces, and it survives greyscale.', '#96938c')
    + '<h2 style="margin:18px 0 0;font-size:17px;font-weight:600;color:#f0efec">&sect;0 rows to approve</h2>'
    + ''.join('<p style="margin:0;font-size:14px;line-height:1.6;color:#96938c">'
              '<b style="color:#c9c3b6;font-weight:500">' + k + '.</b> ' + v + '</p>' for k, v in S0)
    + '</div>')

BOARDS = [
    ('A &middot; History root', 'Three variants. Stats, calendar, sessions, and where Records lives.', A_COLS),
    ('B &middot; Stats header', 'Three tiles against one hero number and a chart.', B_COLS),
    ('C &middot; Load root', 'Load after taking the body map, with Records as a section or a row.', C_COLS),
    ('D &middot; Trained, planned, missed, rest, today', 'Recommended against what ships today, and greyscale.', D_COLS),
    ('E &middot; Empty History', 'A fresh install.', E_COLS),
]
if SETTINGS_COLS:
    BOARDS.append(('Settings, one line per row', 'Folded in from lab49_settings.py.', SETTINGS_COLS))

EXTRA_CSS = """
  .board{align-items:stretch}
  .cap{min-height:0;flex:1}
"""

HTML = K.page(49, 'History', INTRO, BOARDS, CLOSING, EXTRA_CSS)
open('lab49.html', 'w').write(HTML)
print('wrote lab49.html', len(HTML))
