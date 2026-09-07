"""Lab 31 — The ring edits.

Three requests, one board.

1. Set rows get a reorder handle, and exercises need reordering too.
2. The core type overflowed the ring at 300pt — the binding radius is the gold
   arc at r-22, not the tick ends, and nothing was deriving type size from r.
3. Remove "Edit set" from the sheet. The live screen edits load, reps and RPE
   directly, using the ring as the input: reference numerals around it, snap
   detents, drag the perimeter or a tape beside it, tap a parameter to select it.
"""
import math
import lab28 as L
import lab29 as N
import lab30 as P

EXTRA = P.EXTRA + """
  .lab{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  .par{display:flex;align-items:baseline;gap:5px;padding:2px 7px;border-radius:8px}
  .parOn{background:rgba(228,198,140,0.13)}
  .tape{position:absolute;right:0;top:0;bottom:0;width:52px;z-index:3;display:flex;
        flex-direction:column;align-items:flex-end;justify-content:center}
  .hand{width:16px;flex:none;display:flex;flex-direction:column;gap:3px;align-items:center}
  .hand span{width:13px;height:1.5px;border-radius:1px;background:var(--dim)}
  .sect{max-width:940px;display:flex;flex-direction:column;gap:12px;padding-top:26px}
"""

CSS = L.CSS + EXTRA

A0, A1 = -240.0, 60.0          # the scale sweeps 300 degrees, open at the bottom
GOLD, POS, LIVE = 'var(--accent)', 'var(--pos)', 'var(--live)'


def polar(cx, cy, r, a):
    rad = math.radians(a)
    return cx + r * math.cos(rad), cy + r * math.sin(rad)


def arcp(cx, cy, r, a0, a1):
    x0, y0 = polar(cx, cy, r, a0)
    x1, y1 = polar(cx, cy, r, a1)
    return ('M %.1f %.1f A %.1f %.1f 0 %d 1 %.1f %.1f'
            % (x0, y0, r, r, 1 if abs(a1 - a0) > 180 else 0, x1, y1))


class Scale:
    """A ring scale. `step` is the detent — every tick is a value you can
    actually select, which is why load moved from 2kg per tick to 2.5: plates
    come in 1.25s and 2.5s, so a 2kg tick was a weight you could never load."""

    def __init__(self, lo, hi, step, major, label, fmt=lambda v: '%g' % v):
        self.lo, self.hi, self.step, self.major, self.label = lo, hi, step, major, label
        self.fmt = fmt
        self.n = int(round((hi - lo) / step)) + 1

    def idx(self, v):
        return int(round((v - self.lo) / self.step))

    def angle(self, v):
        return A0 + (v - self.lo) / (self.hi - self.lo) * (A1 - A0)


LOAD = Scale(20, 140, 2.5, 4, 8, lambda v: '%g' % v)
REPS = Scale(1, 15, 1, 5, 5, lambda v: '%d' % v)
RPE = Scale(6, 10, 0.5, 2, 2, lambda v: ('%g' % v))


def ring(cx, cy, r, sc, val, mark=None, knob=False, dim=False, labels=True):
    """Ticks, numerals, lit arc and optionally the drag knob."""
    out = []
    cur, mk = sc.idx(val), (sc.idx(mark) if mark is not None else -1)
    for i in range(sc.n):
        a = A0 + i * (A1 - A0) / (sc.n - 1)
        major = i % sc.major == 0
        ln = 14 if major else 7
        if i == mk:       col, w = LIVE, 2
        elif i == cur:    col, w, ln = GOLD, 3, 19
        elif i < cur:     col, w = ('var(--tick3)' if major else 'var(--tick2)'), (2 if major else 1)
        else:             col, w = ('var(--tick1)' if major else '#3a352d'), 1
        x0, y0 = polar(cx, cy, r, a)
        x1, y1 = polar(cx, cy, r - ln, a)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%d" '
                   'stroke-linecap="round"></line>' % (x0, y0, x1, y1, col, w))
        if labels and i % sc.label == 0:
            lx, ly = polar(cx, cy, r + 19, a)
            out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="11" font-family="Geist Mono, '
                       'monospace" text-anchor="middle" dominant-baseline="central" '
                       'letter-spacing="0.06em">%s</text>'
                       % (lx, ly, 'var(--dim)' if dim else 'var(--lo)', sc.fmt(sc.lo + i * sc.step)))
    arc = ('<path d="%s" fill="none" stroke="%s" stroke-width="5" stroke-linecap="round" '
           'opacity="%s"></path>'
           % (arcp(cx, cy, r - 22, A0, sc.angle(val)), GOLD, '0.42' if dim else '0.85'))
    kn = ''
    if knob:
        kx, ky = polar(cx, cy, r - 22, sc.angle(val))
        kn = ('<circle cx="%.1f" cy="%.1f" r="11" fill="%s"></circle>'
              '<circle cx="%.1f" cy="%.1f" r="11" fill="none" stroke="rgba(10,9,8,0.55)" '
              'stroke-width="2"></circle>' % (kx, ky, GOLD, kx, ky))
    return arc + ''.join(out) + kn


# ---- the core, with every size derived from the radius --------------------
# The type is bound by the gold arc at r-22, not by where the ticks end. At
# r=124 the reps/RPE row was 158pt wide against a 142pt chord, so it crossed the
# arc. These ratios are taken from r=145, where the original sizes worked.
def core_sizes(r, editing):
    s = (r - 22) / 123.0
    # While editing there are three values inside instead of one, and the two
    # demoted ones sit lowest — the narrowest part of the chord. They have to be
    # smaller or they cross the arc, which is what E3/E4/E5 did on the first run.
    return dict(big=int(round(54 * s)), sub=max(11, int(round(13 * s))),
                small=max(11, int(round((18 if editing else 26) * s))),
                gap=int(round((9 if editing else 13) * s)))


PARAMS = {'load': ('LOAD', '102.5', 'KG &middot; 79% OF 1RM'),
          'reps': ('REPS', '8', 'REPETITIONS'),
          'rpe': ('RPE', '8.0', 'RIR 2 &middot; NEAR FAILURE')}
SHORT = {'load': ('102.5', 'KG'), 'reps': ('8', 'REPS'), 'rpe': ('8.0', 'RPE')}


def core(r, active='load', editing=False, chips=True):
    z = core_sizes(r, editing)
    name, val, sub = PARAMS[active]
    others = [k for k in ('load', 'reps', 'rpe') if k != active] if chips else []
    inner = []
    for k in others:
        v, u = SHORT[k]
        inner.append('<div class="par"><span class="lab" style="font-size:%dpx;font-weight:600;'
                     'letter-spacing:-0.03em;color:var(--mid)">%s</span>'
                     '<span class="lab" style="font-size:11px;letter-spacing:0.12em;'
                     'color:var(--lo)">%s</span></div>' % (z['small'], v, u))
    return ('<div class="core">'
      '<div class="par%s"><span class="mono lbl" style="color:%s">%s</span></div>'
      '<span class="mono" style="font-size:%dpx;font-weight:600;letter-spacing:-0.05em;'
      'line-height:1.02;color:var(--hi)">%s</span>'
      '<span class="mono" style="font-size:%dpx;color:var(--mid)">%s</span>'
      '<div class="r" style="gap:4px;margin-top:%dpx">%s</div></div>'
      % (' parOn' if editing else '', GOLD if editing else 'var(--lo)', name,
         z['big'], val, z['sub'], sub, z['gap'] if inner else 0, ''.join(inner)))


def dial(w, sc, val, active='load', mark=None, knob=False, editing=False, dim_labels=False,
         labels=True, chips=True):
    h = w
    cx = cy = w / 2.0
    # Reference numerals cost 31pt of radius from the outside, which is exactly
    # what pushed the core into the arc. So they only exist while editing —
    # which is the only time you need to read a value off the perimeter.
    r = w / 2.0 - (45 if labels else 26)
    return ('<div class="dial" style="width:%dpx;height:%dpx">'
            '<svg viewBox="0 0 %d %d" style="width:%dpx;height:%dpx;position:absolute;left:0;top:0">'
            '%s</svg>%s</div>'
            % (w, h, w, h, w, h, ring(cx, cy, r, sc, val, mark, knob, dim_labels, labels),
               core(r, active, editing, chips)))


def selector(active):
    """When the ring shrinks to make room for the tape there is no space left
    inside it for the other two parameters, so all three come out and become an
    explicit three-up selector. Arguably where they belonged anyway: it says
    what the tape is driving without you having to look at the ring."""
    out = []
    for k in ('load', 'reps', 'rpe'):
        on = k == active
        v, u = SHORT[k]
        out.append('<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;'
                   'padding:7px 0;border-radius:12px;%s">'
                   '<span class="mono" style="font-size:11px;letter-spacing:0.12em;color:%s">%s</span>'
                   '<span class="mono" style="font-size:20px;font-weight:600;letter-spacing:-0.03em;'
                   'color:%s">%s</span></div>'
                   % ('background:rgba(228,198,140,0.13)' if on else '',
                      GOLD if on else 'var(--lo)', u, 'var(--hi)' if on else 'var(--mid)', v))
    return '<div class="r" style="width:100%;flex:none;gap:6px;padding:0 4px">' + ''.join(out) + '</div>'


def tape(sc, val, unit):
    """Vertical detent tape. Fixed centre index, values scroll under it — the
    tuner-tape primitive from the research, units on the axis so it reads once
    labelled rather than needing teaching."""
    rows = []
    for d in range(-4, 5):
        v = val + d * sc.step
        if v < sc.lo or v > sc.hi:
            rows.append('<div style="height:31px"></div>')
            continue
        on = d == 0
        rows.append('<div class="r" style="height:31px;gap:7px;justify-content:flex-end">'
                    '<span class="lab" style="font-size:%dpx;font-weight:%d;color:%s">%s</span>'
                    '<span style="width:%dpx;height:%dpx;border-radius:1px;background:%s"></span>'
                    '</div>'
                    % (16 if on else 13, 600 if on else 400,
                       'var(--hi)' if on else ('var(--lo)' if d % 2 == 0 else 'var(--dim)'),
                       sc.fmt(v), 15 if on else (11 if d % 2 == 0 else 7),
                       2 if on else 1, GOLD if on else 'var(--tick2)'))
    return ('<div class="tape">'
            '<span class="mono lbl" style="margin-bottom:8px">%s</span>' % unit
            + ''.join(rows) + '</div>')


# ---- screens --------------------------------------------------------------
SUB = '<span class="mono lbl">EXERCISE 3 OF 6</span>'
HEAD = L.head(SUB)
TRIM = 'margin-bottom:-14px'


def wrap(inner, extra_style=''):
    return ('<div style="width:100%%;flex:none;display:flex;justify-content:center;position:relative;'
            '%s;%s">%s</div>' % (TRIM, extra_style, inner))


def screen(dialhtml, ladder_dim=False, tapehtml='', left='SETS', sheet='', below='',
           wrap_style=''):
    vert = L.V_ticks().replace('class="vcol" style="gap:11px"',
                               'class="vcol" style="gap:11px;left:10px'
                               + (';opacity:0.28' if ladder_dim else '') + '"')
    body = (HEAD + L.SETLINE + wrap(dialhtml + tapehtml, wrap_style) + below
            + N.prev() + L.actions() + L.sess())
    return N.phone(body, sheet, vert=vert, left=left)


E1 = screen(dial(330, LOAD, 102.5, 'load', mark=130.0, labels=False))
E2 = screen(dial(330, LOAD, 102.5, 'load', mark=130.0, knob=True, editing=True), ladder_dim=True)
E3 = screen(dial(290, LOAD, 102.5, 'load', mark=130.0, editing=True, chips=False),
            ladder_dim=True, tapehtml=tape(LOAD, 102.5, 'KG'), below=selector('load'),
            wrap_style='padding-right:62px')
E4 = screen(dial(330, REPS, 8, 'reps', knob=True, editing=True), ladder_dim=True)
E5 = screen(dial(330, RPE, 8.0, 'rpe', knob=True, editing=True), ladder_dim=True)

# ---- the two sheets -------------------------------------------------------
HANDLE = '<span class="hand"><span></span><span></span><span></span></span>'
CHEV = P.CHEV


def srow(idx, w, rep, rpe, e1, state):
    if state == 'cur':
        bg, c = 'background:rgba(228,198,140,0.10);border-radius:10px;padding:0 8px;', GOLD
        cols, ink = [w, '&times;' + rep, '&mdash;', '&mdash;'], [c, c, 'var(--dim)', 'var(--dim)']
    elif state == 'ahead':
        bg, c = 'opacity:0.5;padding:0 8px;', 'var(--dim)'
        cols = [w, '&times;' + rep, '&mdash;', '&mdash;']
        ink = ['var(--mid)', 'var(--mid)', 'var(--dim)', 'var(--dim)']
    else:
        bg, c = 'padding:0 8px;', POS
        cols, ink = [w, '&times;' + rep, rpe, e1], ['var(--hi)', 'var(--mid)', 'var(--mid)', GOLD]
    cells = ''.join('<span class="mono" style="width:%spx;text-align:right;color:%s">%s</span>'
                    % (wd, ic, v) for wd, v, ic in zip(['50', '30', '36', '44'], cols, ink))
    tail = ('<span class="jump">' + CHEV + '</span>' if state != 'cur'
            else '<span style="width:26px;flex:none"></span>')
    return ('<div class="r" style="height:38px;font-size:13px;gap:9px;%s">%s'
            '<span class="mono" style="width:22px;font-size:11px;color:%s">%s</span>'
            '<span class="sp"></span>%s%s</div>' % (bg, HANDLE, c, idx, cells, tail))


SETS_SHEET = (
  '<div class="scrim"></div><div class="sheet"><div class="grab"></div>'
  '<div class="r"><span class="mono lbl">SETS &middot; BARBELL SQUAT</span><span class="sp"></span>'
  '<span class="mono lbl">3 OF 5 DONE</span></div>'
  '<div style="height:1px;background:rgba(255,255,255,0.12)"></div>'
  '<div class="r" style="height:18px;gap:9px"><span style="width:16px;flex:none"></span>'
  '<span class="mono lbl" style="width:22px">SET</span><span class="sp"></span>'
  '<span class="mono lbl" style="width:50px;text-align:right">KG</span>'
  '<span class="mono lbl" style="width:30px;text-align:right">REP</span>'
  '<span class="mono lbl" style="width:36px;text-align:right">RPE</span>'
  '<span class="mono lbl" style="width:44px;text-align:right">e1RM</span>'
  '<span style="width:26px;flex:none"></span></div>'
  + srow('01', '100.0', '8', '7.0', '124', 'done')
  + srow('02', '102.5', '8', '7.5', '128', 'done')
  + srow('03', '102.5', '7', '8.0', '126', 'done')
  + srow('04', '102.5', '8', '', '', 'cur')
  + srow('05', '102.5', '8', '', '', 'ahead')
  + '<div class="r" style="margin-top:6px"><div style="flex:1;min-height:44px;display:flex;'
    'align-items:center;justify-content:center;border-radius:12px;background:rgba(255,255,255,0.06);'
    'border:1px solid rgba(255,255,255,0.10)"><span style="font-size:14px;color:var(--hi)">Add set'
    '</span></div></div></div>')

EXS = [('01', 'Back Extension', '3 SETS', 'done'), ('02', 'Romanian Deadlift', '4 SETS', 'done'),
       ('03', 'Barbell Squat', '3 OF 5', 'cur'), ('04', 'Leg Press', '4 SETS', 'ahead'),
       ('05', 'Seated Curl', '3 SETS', 'ahead'), ('06', 'Standing Calf', '4 SETS', 'ahead')]


def erow(idx, name, meta, state):
    if state == 'cur':
        bg, c, nc = 'background:rgba(228,198,140,0.10);border-radius:10px;padding:0 8px;', GOLD, GOLD
    elif state == 'done':
        bg, c, nc = 'padding:0 8px;', POS, 'var(--mid)'
    else:
        bg, c, nc = 'opacity:0.6;padding:0 8px;', 'var(--dim)', 'var(--mid)'
    return ('<div class="r" style="height:42px;gap:9px;%s">%s'
            '<span class="mono" style="width:22px;font-size:11px;color:%s">%s</span>'
            '<span style="font-size:14px;color:%s">%s</span><span class="sp"></span>'
            '<span class="mono lbl">%s</span>'
            '<span class="jump">%s</span></div>' % (bg, HANDLE, c, idx, nc, name, meta, CHEV))


EX_SHEET = (
  '<div class="scrim"></div><div class="sheet"><div class="grab"></div>'
  '<div class="r"><span class="mono lbl">EXERCISES &middot; LEGS A</span><span class="sp"></span>'
  '<span class="mono lbl">2 OF 6 DONE</span></div>'
  '<div style="height:1px;background:rgba(255,255,255,0.12)"></div>'
  + ''.join(erow(*e) for e in EXS)
  + '<div class="r" style="margin-top:6px"><div style="flex:1;min-height:44px;display:flex;'
    'align-items:center;justify-content:center;border-radius:12px;background:rgba(255,255,255,0.06);'
    'border:1px solid rgba(255,255,255,0.10)"><span style="font-size:14px;color:var(--hi)">'
    'Add exercise</span></div></div></div>')

E6 = screen(dial(330, LOAD, 102.5, 'load', mark=130.0, labels=False), sheet=SETS_SHEET)
E7 = screen(dial(330, LOAD, 102.5, 'load', mark=130.0, labels=False), sheet=EX_SHEET)

BOARD_A = [
 ('E1', 'Resting', 'Not editing, and this is most of the time',
  'No reference numerals here &mdash; they belong to edit mode. The tick pitch changes from 2&nbsp;kg to <b>2.5</b>, so every tick is now a weight you can actually load, and reps and RPE keep the size they had.',
  'This has to survive first, because the screen is read far more than it is edited. Numerals around the perimeter cost 31&nbsp;pt of radius, and that &mdash; not the smaller ring on its own &mdash; is what pushed the core into the arc. Leaving them out until you are editing gives the radius back and means the resting screen carries nothing you are not reading. Core type is now computed from the radius, bounded by the gold arc at r&minus;22 rather than by the ticks.',
  E1),
 ('E2', 'Editing load, perimeter drag', 'The finger follows the ring',
  'Tap <b>LOAD</b> and it lights; a knob appears on the arc and the current tick grows. Drag around the perimeter, snapping to every 2.5&nbsp;kg with a selection haptic. The exercise ladder dims because you are editing, not navigating.',
  'The most direct mapping and the most satisfying, but it has a real cost: a circular drag is imprecise near the top of the arc and it asks your thumb to travel a long way for a small change. Two-and-a-half kilos is about seven degrees here, so a fine adjustment is a few pixels of arc. Good for a big jump, poor for the last increment.',
  E2),
 ('E3', 'Editing load, tape beside it', 'A straight line instead of a curve',
  'Same selection, different input. The ring shrinks, a detent tape appears on the right, and the three parameters come out of the ring into an explicit selector beneath it. Drag the tape vertically against a fixed centre index; the ring stays the readout.',
  'Less charming and considerably more accurate. Vertical travel maps to one axis, so precision is even across the whole range, and the ring is freed to do what it is good at &mdash; showing proportion rather than accepting input. Pulling the parameters out was forced &mdash; a 290pt ring has no room for three values &mdash; but it improves it: the selector states plainly what the tape is driving, which the highlighted chip inside the ring only implied.',
  E3),
 ('E4', 'Editing reps', 'The ring becomes the parameter',
  'Select <b>REPS</b> and the scale re-labels to 1&ndash;15, one tick per rep, and the arc redraws to eight. Load and RPE demote to chips.',
  'This is the question worth deciding, not the drag style. If the ring re-scales it is one instrument doing three jobs and everything stays in one place &mdash; but you lose the load-in-range reading and the e1RM notch for as long as you are editing. Fifteen ticks around three hundred degrees is also visibly sparse; the ring is over-built for a scale this short.',
  E4),
 ('E5', 'Editing RPE', 'The shortest scale of the three',
  'Six to ten in half points. Nine ticks, five numerals, and the sub-line spells out what the number means rather than leaving RPE&nbsp;8 to be decoded.',
  'The sparseness problem from E4 is worse here &mdash; nine ticks is not a ring, it is a nine-position rotary switch drawn as one. Lab&nbsp;13 already killed a rotary detent for exactly this and replaced it with a segmented control. Worth asking whether RPE should stay out of the ring entirely and keep a five-wide segmented row instead.',
  E5),
]

BOARD_B = [
 ('E6', 'Sets, reorderable', 'Handle left, chevron right',
  'Three-line grip at the head of every row. <b>Edit set is gone</b> &mdash; tapping a row now takes you to that set and you edit it on the live screen with the ring, which is the same gesture whether the set is logged or current.',
  'One thing to watch: a row that both reorders and navigates has two hit regions, and iOS convention is that the handle owns a narrow strip and the rest of the row is the tap. That works, but drag-to-reorder in a list this short is a feature you will use rarely and discover slowly. Worth it mainly because it is free once the exercise list needs it.',
  E6),
 ('E7', 'Exercises, reorderable', 'Same sheet, one level up',
  'Opened by tapping <b>EXERCISE 3 OF 6</b> in the header, or the ladder. Same grip, same chevron, same structure &mdash; done exercises green, current gold, the rest dim, with sets remaining on the right.',
  'Deliberately the same component as the sets sheet rather than a new pattern. Two sheets, one grammar: a handle reorders, a row navigates, the button at the foot adds. It also gives the left-edge ladder a tap target, which the gesture-conflict mitigation wanted anyway &mdash; the swipe becomes an accelerator rather than the only route between exercises.',
  E7),
]


def render(rows):
    return ''.join(
      '<div class="col"><div class="cap"><span class="k">' + c[0] + '</span>'
      '<span class="t">' + c[1] + '</span><span class="s">' + c[2] + '</span>'
      '<span class="d">' + c[3] + '</span><span class="w">' + c[4] + '</span></div>'
      + c[5] + '</div>' for c in rows)


HTML = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet data-dc-atomics>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>''' + CSS + '''</style>
</helmet>

<div style="min-height:100vh;background:#0a0a0b;color:#f0efec;padding:48px 40px 96px">
  <div style="display:flex;flex-direction:column;gap:30px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:940px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 31</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">The ring edits</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Removing <span style="color:#f0efec">Edit set</span> only works if the live screen can change load, reps and RPE itself. So the ring stops being a readout and becomes the input: reference numerals outside the ticks, a detent on every tick, and the three parameters inside as tap targets that say which one you are holding.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">E1 is the resting state, which is what you see almost all of the time and therefore what has to be right first. E2 and E3 are two ways to move the value. E4 and E5 ask the question underneath both of them &mdash; whether the ring should <em>become</em> the parameter you are editing, or stay a load gauge while something else handles the other two.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Two fixes came in with it. The tick pitch moves from 2&nbsp;kg to <b style="color:#c9c3b6;font-weight:500">2.5</b>, so every tick is a weight that exists on a bar. And the core type is now computed from the radius: what was overflowing at 300pt is bounded by the gold arc at r&minus;22, not by the ticks, and the reps line was 158pt wide against a 142pt chord.</p>
    </div>
    <div class="board">''' + render(BOARD_A) + '''</div>

    <div class="sect">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">Reordering, both levels</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">A grip at the head of every set row, and the same sheet one level up for the exercises &mdash; opened from the header or the ladder. One grammar in both: the handle reorders, the row navigates, the button at the foot adds.</p>
    </div>
    <div class="board">''' + render(BOARD_B) + '''</div>

    <div class="sect">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">My read, and the part I would not build yet</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c"><b style="color:#c9c3b6;font-weight:500">E3 for the input, E1 as the resting state.</b> The perimeter drag in E2 is the better-looking idea and the worse control &mdash; 2.5&nbsp;kg is about seven degrees of arc, so the last increment is a few pixels and your thumb covers the numerals while it works. The tape gives even precision across the range, keeps the ring readable while you drag it, and the ring shrinking is itself the signal that you are in edit mode.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Both can ship &mdash; the tape as the control, the perimeter as an accelerator for a big jump &mdash; but only if the perimeter drag is never the <em>only</em> way to reach a value.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c"><b style="color:#c9c3b6;font-weight:500">RPE should probably not use the ring at all.</b> E5 is a nine-position switch drawn as a three-hundred-degree arc. Lab&nbsp;13 removed a rotary detent for that exact reason and put a segmented control in its place; nothing has changed since. A five-wide row of 6 / 7 / 8 / 9 / 10 with halves on a long press would be smaller, faster and honest about how few values there are.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Open: reps sits between the two. Fifteen ticks is sparse but not absurd, and reps and load are edited in the same breath, so keeping them on one instrument has real value. If E4 reads as too empty the fallback is the tape for both &mdash; same control, different scale &mdash; with the ring left permanently on load.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab31.html', 'w').write(HTML)
print('wrote lab31.html', len(HTML))
