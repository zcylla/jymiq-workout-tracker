"""Lab 32 — Lines only.

The tape wins as the control. The perimeter stays, but stripped: no gold arc, no
knob. The ring is a clock face of lines and the lines themselves carry the
value. Plus direct numeric entry, because a ring is the wrong tool when you
already know the number.
"""
import math
import lab28 as L
import lab29 as N
import lab30 as P
import lab31 as R

EXTRA = R.EXTRA + """
  .kbd{display:grid;grid-template-columns:repeat(3,1fr);gap:8px;width:100%}
  .kdy{min-height:52px;display:flex;align-items:center;justify-content:center;border-radius:14px;
       font-size:22px;font-weight:500;color:var(--hi);background:rgba(255,255,255,0.07);
       border:0.5px solid rgba(255,255,255,0.13);font-family:'Geist Mono',ui-monospace,monospace}
  .kdy.q{background:transparent;border-color:transparent;color:var(--lo);font-size:15px}
"""

CSS = L.CSS + EXTRA
GOLD = R.GOLD


def ring(cx, cy, r, sc, val, mark=None, mode='fill', labels=True, dim=False):
    """Ticks only — no arc, no knob.

    `mode` is how the lines say where you are:
      fill    every tick below the value is lit, above it is not. Keeps the
              proportion reading the arc used to give.
      cursor  no fill; the lines swell toward the value like a pointer built out
              of the scale itself. Position only, no proportion.
      both    fill plus the swell.
    """
    out = []
    cur = sc.idx(val)
    mk = sc.idx(mark) if mark is not None else -1
    for i in range(sc.n):
        a = R.A0 + i * (R.A1 - R.A0) / (sc.n - 1)
        major = i % sc.major == 0
        lit = i < cur
        # Length does the work, not colour. A 1px hue step between lit and unlit
        # is invisible at this scale — it only ever read because the gold arc was
        # sitting on top of it saying the same thing.
        if mode in ('fill', 'both'):
            ln = (16 if major else 10) if lit else (10 if major else 5)
            col = ('var(--tick3)' if major else 'var(--tick2)') if lit else 'var(--off)'
            w = (2 if major else 1.4) if lit else 1
        else:
            ln, w = (13 if major else 7), (2 if major else 1)
            col = 'var(--tick1)' if major else '#3a352d'
        out_r = 0
        if mode in ('cursor', 'both'):
            d = abs(i - cur)
            if d <= 6:
                swell = math.exp(-(d / 3.0) ** 2)
                ln += 15 * swell
                out_r = 5 * swell
                w = max(w, 1 + 2.2 * swell)
                if d <= 3:
                    col = GOLD
        if i == mk:
            col, w, ln, out_r = 'var(--live)', 2.4, 13, 0
        if i == cur:
            col, w, ln, out_r = GOLD, 3, max(ln, 26), max(out_r, 6)
        x0, y0 = R.polar(cx, cy, r + out_r, a)
        x1, y1 = R.polar(cx, cy, r - ln, a)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%.1f" '
                   'stroke-linecap="round"></line>' % (x0, y0, x1, y1, col, w))
        if labels and i % sc.label == 0:
            lx, ly = R.polar(cx, cy, r + 19, a)
            out.append('<text x="%.1f" y="%.1f" fill="%s" font-size="11" font-family="Geist Mono, '
                       'monospace" text-anchor="middle" dominant-baseline="central" '
                       'letter-spacing="0.06em">%s</text>'
                       % (lx, ly, 'var(--dim)' if dim else 'var(--lo)', sc.fmt(sc.lo + i * sc.step)))
    return ''.join(out)


def dial(w, sc, val, active='load', mark=None, mode='fill', editing=False, labels=True,
         chips=True):
    cx = cy = w / 2.0
    r = w / 2.0 - (45 if labels else 26)
    return ('<div class="dial" style="width:%dpx;height:%dpx">'
            '<svg viewBox="0 0 %d %d" style="width:%dpx;height:%dpx;position:absolute;left:0;top:0">'
            '%s</svg>%s</div>'
            % (w, w, w, w, w, w, ring(cx, cy, r, sc, val, mark, mode, labels),
               R.core(r, active, editing, chips)))


# ---- the numpad -----------------------------------------------------------
BKSP = ('<svg viewBox="0 0 24 24" style="width:22px;height:22px" fill="none" '
        'stroke="var(--mid)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M9 5h11v14H9L2 12z"></path><path d="M12 9.5l5 5M17 9.5l-5 5"></path></svg>')
KEYS = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '.', '0', BKSP]


def numpad(name, unit, val):
    keys = ''.join('<div class="kdy%s">%s</div>' % (' q' if k is BKSP else '', k)
                   for k in KEYS)
    return (
      '<div class="scrim"></div><div class="sheet" style="gap:12px">'
      '<div class="grab"></div>'
      '<div class="r"><span class="mono lbl">%s</span><span class="sp"></span>'
      '<span class="mono lbl">WAS 102.5</span></div>'
      '<div class="r" style="gap:8px;align-items:baseline;padding:2px 2px 4px">'
      '<span class="mono" style="font-size:42px;font-weight:600;letter-spacing:-0.04em;'
      'color:var(--hi)">%s</span>'
      '<span class="mono lbl" style="font-size:13px">%s</span>'
      '<span style="width:2px;height:34px;border-radius:1px;background:%s;margin-left:2px"></span>'
      '<span class="sp"></span></div>'
      '<div class="kbd">%s</div>'
      '<div class="r" style="gap:8px;margin-top:2px">'
      '<div style="flex:1;min-height:46px;display:flex;align-items:center;justify-content:center;'
      'border-radius:13px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10)">'
      '<span style="font-size:14px;color:var(--hi)">Cancel</span></div>'
      '<div style="flex:1.6;min-height:46px;display:flex;align-items:center;justify-content:center;'
      'border-radius:13px;background:var(--accent);box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)">'
      '<span style="font-size:15px;font-weight:600;color:#15130f">Set %s %s</span></div></div></div>'
      % (name, val, unit, GOLD, keys, val, unit))


SUB = '<span class="mono lbl">EXERCISE 3 OF 6</span>'
HEAD = L.head(SUB)


def screen(dialhtml, ladder_dim=False, tapehtml='', sheet='', below='', wrap_style=''):
    vert = L.V_ticks().replace('class="vcol" style="gap:11px"',
                               'class="vcol" style="gap:11px;left:10px'
                               + (';opacity:0.28' if ladder_dim else '') + '"')
    body = (HEAD + L.SETLINE + R.wrap(dialhtml + tapehtml, wrap_style) + below
            + N.prev() + L.actions() + L.sess())
    return N.phone(body, sheet, vert=vert, left='SETS')


F1 = screen(dial(330, R.LOAD, 102.5, mark=130.0, mode='fill', labels=False))
F2 = screen(dial(330, R.LOAD, 102.5, mark=130.0, mode='cursor', labels=False))
F3 = screen(dial(330, R.LOAD, 102.5, mark=130.0, mode='both', labels=False))
F4 = screen(dial(290, R.LOAD, 102.5, mark=130.0, mode='both', editing=True, chips=False),
            ladder_dim=True, tapehtml=R.tape(R.LOAD, 102.5, 'KG'), below=R.selector('load'),
            wrap_style='padding-right:62px')
F5 = screen(dial(330, R.LOAD, 110.0, mark=130.0, mode='both', editing=True), ladder_dim=True)
F6 = screen(dial(330, R.LOAD, 102.5, mark=130.0, mode='both', labels=False),
            sheet=numpad('LOAD', 'KG', '107.5'))

BOARD_A = [
 ('F1', 'Fill only', 'The arc, done with the lines it already had',
  'No gold arc and no knob. Everything below the current weight is lit, everything above it is not, and the current tick is longer and gold. The red notch is still the estimated 1RM.',
  'The quietest of the three and the closest to what you have been looking at, because the arc was always drawing the same information as the lit ticks &mdash; it was a second copy of the reading, laid over the first. Removing it loses nothing except the weight of the stroke, and the ring gets noticeably lighter for it.',
  F1),
 ('F2', 'Cursor only', 'A pointer built out of the scale',
  'No fill at all. The lines swell toward the current value and fall away over about five ticks either side, so the ring reads as a pointer made of the scale rather than a scale with a pointer on it.',
  'The most distinctive and the one that gives up the most. With no fill there is no proportion &mdash; you can see <em>where</em> you are on the dial but not <em>how far along</em> you are, which is the reading the ring existed for. It also gets ambiguous at the ends, where the swell has nowhere to fall away to.',
  F2),
 ('F3', 'Fill and cursor', 'Both readings, one instrument',
  'Lit below, dark above, and the lines swelling into the current value on top of it. The swell is what moves under your thumb; the fill is what tells you where that sits in your range.',
  'My pick. The two do different jobs and neither is a copy of the other, which is the test the arc failed. During a drag the swell travels and the fill boundary travels with it, so the whole ring reads as one moving thing rather than a dot sliding along a track. It is also the only one of the three that survives losing the numerals in the resting state.',
  F3),
]

BOARD_B = [
 ('F4', 'Editing, with the tape', 'The recommendation, redrawn',
  'E3 from the last board with the arc and knob taken out. Tape on the right, selector underneath, ring reduced to lines.',
  'The ring is now unambiguously a readout &mdash; nothing on it looks draggable, which is honest, because the thing you drag is the tape. The swell still tracks the tape so the two stay tied together, and the reference numerals come back because you are editing.',
  F4),
 ('F5', 'Perimeter drag, no knob', 'Kept as the accelerator',
  'Mid-drag at 110&nbsp;kg. There is no dot to follow &mdash; the swell of the lines is the thumb position, and the fill boundary moves with it.',
  'Better than the knob was, and it makes the perimeter honest about what it is good for: throwing the value a long way quickly. Without a dot there is nothing implying precision it does not have. It should never be the only route to a number, which is what F6 is for.',
  F5),
 ('F6', 'Type it', 'For when you already know the number',
  'Long-press any of the three parameters and the keypad comes up, pre-filled and selected. A setting makes it the default, so a single tap opens the pad instead of arming the tape.',
  'The fastest input of the four by a distance whenever you know the value, which on a programmed session is most of the time. It also fixes the one thing a detent scale genuinely cannot do &mdash; reach a weight the detents skip, like 101.25 on a bar with 0.625 fractionals. The pad shows what the value <b>was</b> beside what you are typing, so a mistyped jump is visible before you commit it. Discoverability is the weak point of a long press &mdash; the Settings switch that makes a single tap open the pad is the answer for that, not a coach mark.',
  F6),
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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 32</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Lines only</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">The arc and the dot are gone. You were right that they were the wrong parts &mdash; but worth saying why, because it is a bigger removal than it looks: <span style="color:#f0efec">the arc was the proportion reading</span>, the thing that told you at a glance how far into your range this weight sits. Take it out and the lines have to do that job as well as saying where you are.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">F1, F2 and F3 are three ways for the lines to carry both. They are drawn on the resting screen, without reference numerals, because that is the state that has to survive first.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Then the three controls, in the order you would reach for them: the tape as the default, the perimeter as the fast throw, and the keypad for when you already know the number.</p>
    </div>
    <div class="board">''' + render(BOARD_A) + '''</div>

    <div class="sect">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">Three ways in, one of them typed</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Tape by default. Perimeter for a long throw. Keypad on a long press, or on a single tap if you turn that on in Settings. None of them is the only route to a value, which is the rule the perimeter broke when it had a knob on it.</p>
    </div>
    <div class="board">''' + render(BOARD_B) + '''</div>

    <div class="sect">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">Small things settled</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c"><b style="color:#c9c3b6;font-weight:500">The exercise sheet opens from either the counter or the title.</b> Both lines in the header are one target &mdash; <span style="color:#96938c">EXERCISE 3 OF 6</span> and <span style="color:#96938c">Barbell Squat</span> together, plus the ladder on the left edge. Three routes to the same sheet, which is the right number for something the swipe is otherwise the only way to reach.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c"><b style="color:#c9c3b6;font-weight:500">The keypad earns its place beyond preference.</b> A detent scale can only reach values on the detent, so 2.5&nbsp;kg steps cannot express 101.25 &mdash; a real weight on a bar with fractional plates. Typed entry is the only input that can, so it is not purely an alternative for people who prefer numbers.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Still open, unchanged: whether reps and RPE re-scale the ring or stay off it. My read has not moved &mdash; RPE wants a segmented row of six to ten, not three hundred degrees of arc for nine values. Reps is genuinely borderline.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab32.html', 'w').write(HTML)
print('wrote lab32.html', len(HTML))
