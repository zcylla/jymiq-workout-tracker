"""Lab 29 — Where the sets live, with the gestures.

Lab 24 recommended S3 (chip strip) + S1 (sheet). Lab 28 locked the horizontal
indicator to a written SET 4 OF 5 line. Nobody ever drew the two together, and
when you do they collide: the chip strip is *also* a horizontal set indicator.
This board draws the collision and three ways out.
"""
import lab28 as L

EXTRA = """
  .strip{display:flex;width:100%;flex:none;align-items:flex-end}
  .cell{flex:1;display:flex;flex-direction:column;align-items:center;gap:2px;
        padding-bottom:7px;position:relative}
  .mark{position:absolute;left:50%;bottom:0;width:26px;height:2px;margin-left:-13px;
        border-radius:9999px;background:var(--accent)}
  .chip{flex:1;border-radius:13px;padding:7px 4px;display:flex;flex-direction:column;
        align-items:center;gap:2px;background:var(--raised);border:1px solid rgba(255,255,255,0.09)}
  .chipOn{background:rgba(228,198,140,0.14);border-color:rgba(228,198,140,0.46)}
  .sheet{position:absolute;left:0;right:0;bottom:0;z-index:4;border-radius:26px 26px 0 0;
         padding:10px 18px 30px;background:rgba(28,25,20,0.86);
         backdrop-filter:blur(34px) saturate(180%);-webkit-backdrop-filter:blur(34px) saturate(180%);
         border-top:0.5px solid rgba(255,255,255,0.20);box-shadow:0 -18px 44px rgba(0,0,0,0.55);
         display:flex;flex-direction:column;gap:9px}
  .grab{width:38px;height:4px;border-radius:9999px;background:rgba(255,255,255,0.22);
        align-self:center;margin-bottom:5px}
  .scrim{position:absolute;inset:0;z-index:3;background:rgba(6,5,4,0.55)}
  .track{width:100%;flex:none;overflow:hidden;display:flex}
  .zone{position:absolute;z-index:4;border:1px dashed rgba(228,198,140,0.44);border-radius:18px;
        display:flex;align-items:flex-start;justify-content:flex-end;padding:6px 8px}
  .zone span{font-size:11px;letter-spacing:0.12em;color:rgba(228,198,140,0.72);
             font-family:'Geist Mono',ui-monospace,monospace}
"""

CSS = L.CSS + EXTRA

# 01-03 logged, 04 in progress, 05 planned. Reps drop on 03 because they do.
SETS = [('01', '100.0', '8', 'done'), ('02', '102.5', '8', 'done'),
        ('03', '102.5', '7', 'done'), ('04', '102.5', '8', 'cur'),
        ('05', '102.5', '8', 'ahead')]

INK = {
    'done':  ('var(--pos)', 'var(--mid)', 'var(--dim)', '15px', '500'),
    'cur':   ('var(--accent)', 'var(--hi)', 'var(--accent)', '19px', '600'),
    'ahead': ('var(--dim)', 'var(--dim)', 'var(--dim)', '15px', '500'),
}


def strip(mark_shift=0):
    """The editorial set strip — five columns of numerals, no boxes, no rules.

    Position in the row is the set number; the gold underline is where you are.
    Each column is a tap target (44pt touch region, drawn size unchanged), which
    is what turns the horizontal swipe into an accelerator rather than the only
    route.
    """
    out = []
    for i, (idx, w, rep, st) in enumerate(SETS):
        ic, vc, rc, fs, fw = INK[st]
        if st == 'ahead' and mark_shift:
            ic, vc, rc = 'var(--lo)', 'var(--lo)', 'var(--dim)'
        mark = ''
        if st == 'cur':
            mark = ('<span class="mark" style="margin-left:' + str(-13 + mark_shift) + 'px"></span>')
        out.append(
            '<div class="cell">'
            '<span class="mono" style="font-size:11px;letter-spacing:0.10em;color:' + ic + '">' + idx + '</span>'
            '<span class="mono" style="font-size:' + fs + ';font-weight:' + fw + ';letter-spacing:-0.02em;color:' + vc + '">' + w + '</span>'
            '<span class="mono" style="font-size:11px;color:' + rc + '">&times;' + rep + '</span>'
            + mark + '</div>')
    return '<div class="strip">' + ''.join(out) + '</div>'


def chips():
    """Lab 24's S3 as it was actually drawn — boxes."""
    out = []
    for idx, w, rep, st in SETS:
        ic, vc, rc, fs, fw = INK[st]
        cls = 'chip chipOn' if st == 'cur' else 'chip'
        op = ';opacity:0.5' if st == 'ahead' else ''
        out.append(
            '<div class="' + cls + '" style="min-width:0' + op + '">'
            '<span class="mono" style="font-size:11px;color:' + ic + '">' + idx + '</span>'
            '<span class="mono" style="font-size:13px;font-weight:500;color:' + vc + '">' + w + '</span>'
            '<span class="mono" style="font-size:11px;color:' + rc + '">&times;' + rep + '</span></div>')
    return '<div class="r" style="width:100%;gap:7px;flex:none">' + ''.join(out) + '</div>'


SHEET = (
    '<div class="scrim"></div>'
    '<div class="sheet"><div class="grab"></div>'
    '<div class="r"><span class="mono lbl">SETS &middot; BARBELL SQUAT</span><span class="sp"></span>'
    '<span class="mono lbl">3 OF 5 DONE</span></div>'
    '<div style="height:1px;background:rgba(255,255,255,0.12)"></div>'
    '<div class="r" style="height:18px"><span class="mono lbl" style="width:26px">SET</span><span class="sp"></span>'
    '<span class="mono lbl" style="width:54px;text-align:right">KG</span>'
    '<span class="mono lbl" style="width:34px;text-align:right">REP</span>'
    '<span class="mono lbl" style="width:40px;text-align:right">RPE</span>'
    '<span class="mono lbl" style="width:48px;text-align:right">e1RM</span></div>')


def sheet_row(idx, w, rep, rpe, e1, state):
    if state == 'cur':
        bg = 'background:rgba(228,198,140,0.10);border-radius:8px;padding:0 6px;'
        c = 'var(--accent)'
        cols = [w, '&times;' + rep, '&mdash;', '&mdash;']
        ink = [c, c, 'var(--dim)', 'var(--dim)']
    elif state == 'ahead':
        bg = 'opacity:0.45;padding:0 6px;'
        c = 'var(--dim)'
        cols = [w, '&times;' + rep, '&mdash;', '&mdash;']
        ink = ['var(--mid)', 'var(--mid)', 'var(--dim)', 'var(--dim)']
    else:
        bg = 'padding:0 6px;'
        c = 'var(--pos)'
        cols = [w, '&times;' + rep, rpe, e1]
        ink = ['var(--hi)', 'var(--mid)', 'var(--mid)', 'var(--accent)']
    cells = ''.join(
        '<span class="mono" style="width:' + wd + 'px;text-align:right;color:' + ic + '">' + v + '</span>'
        for wd, v, ic in zip(['54', '34', '40', '48'], cols, ink))
    return ('<div class="r" style="height:27px;font-size:13px;' + bg + '">'
            '<span class="mono" style="width:26px;font-size:11px;color:' + c + '">' + idx + '</span>'
            '<span class="sp"></span>' + cells + '</div>')


SHEET_FULL = (SHEET
    + sheet_row('01', '100.0', '8', '7.0', '124', 'done')
    + sheet_row('02', '102.5', '8', '7.5', '128', 'done')
    + sheet_row('03', '102.5', '7', '8.0', '126', 'done')
    + sheet_row('04', '102.5', '8', '', '', 'cur')
    + sheet_row('05', '102.5', '8', '', '', 'ahead')
    + '<div class="r" style="gap:8px;margin-top:6px">'
      '<div style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;'
      'border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10)">'
      '<span style="font-size:14px;color:var(--hi)">Add set</span></div>'
      '<div style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;'
      'border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10)">'
      '<span style="font-size:14px;color:var(--hi)">Edit set 03</span></div></div></div>')

SUB = '<span class="mono lbl">EXERCISE 3 OF 6</span>'


def prev():
    """Lab 28's LAST TIME row, de-carded.

    It had a raised fill and a 1px border, which is the thing Lab 27 outlawed.
    Hard to argue the set boxes have to go while leaving a box directly beneath
    them.
    """
    return ('<div class="r" style="width:100%;flex:none;gap:11px;padding:0 4px">'
            '<span class="mono lbl">LAST TIME</span>'
            '<span class="mono" style="font-size:15px;color:var(--mid)">100.0 &times; 8 @ 7.5</span>'
            '<span class="sp"></span>'
            '<span class="mono" style="font-size:14px;color:var(--pos)">+2.5</span></div>')


def swipe_track(size=336):
    """One dial sliding out, the next peeking in. The still of a horizontal swipe."""
    return ('<div class="track" style="height:' + str(size) + 'px">'
            '<div style="display:flex;gap:30px;transform:translateX(-70px);flex:none;'
            'margin-left:14px">'
            + '<div style="flex:none">' + L.dial(size) + '</div>'
            + '<div style="opacity:0.34;flex:none">' + L.dial(size) + '</div>'
            + '</div></div>')


def phone(body_children, extra='', vert=None, left='SETS'):
    vert = L.V_ticks() if vert is None else vert
    return ('<div class="phone"><div class="field"></div>'
      '<div class="bloom" style="top:80px;left:30px;width:342px;height:340px;background:rgba(228,198,140,0.15)"></div>'
      '<div class="bloom" style="bottom:60px;left:-50px;width:300px;height:220px;background:rgba(159,174,58,0.08)"></div>'
      + vert +
      '<div class="sb"><span class="mono">9:41</span><i></i></div>'
      '<div class="body">' + body_children + '</div>'
      + extra +
      '<div class="bar"><div class="keyG glass"><span class="mono" style="font-size:13px;letter-spacing:0.10em">'
      + left + '</span></div><div class="key">Log set 4</div></div></div>')


HEAD = L.head(SUB)
DIAL = L.dial(336)

M1 = phone(HEAD + L.SETLINE + DIAL + prev() + chips() + L.actions() + L.sess())
M2 = phone(HEAD + strip() + DIAL + prev() + L.actions() + L.sess())
M3 = phone(HEAD + L.SETLINE + DIAL + prev() + strip() + L.actions() + L.sess())
M4 = phone(HEAD + strip() + DIAL + prev() + L.actions() + L.sess(), SHEET_FULL)
M5 = phone(HEAD + strip(28) + swipe_track() + prev() + L.actions() + L.sess())

COLS = [
 ('M1', 'Both, as specified', 'Lab 24 and Lab 28 taken literally',
  'The written set line from Lab&nbsp;28 above the dial, S3&rsquo;s chip strip below it. This is exactly what the two boards asked for, put on one screen for the first time.',
  'It does not work, and it is worth seeing why rather than being told. There are now <em>two</em> horizontal set indicators forty pixels apart, both saying you are on four of five. And the boxes break the rule you settled in Lab&nbsp;27 &mdash; no cards, no borders, spacing carries the grouping. Five boxes in a row is the single most card-like thing on the screen.',
  M1),
 ('M2', 'The strip is the set line', 'One horizontal indicator, doing both jobs',
  'The boxes come off and the strip moves up into the slot the written line held. Five columns of numerals, spacing between them, a gold rule under the one you are on.',
  'This is the version I would build. It says <em>set four of five</em> by position rather than by sentence, and it also tells you what you lifted for the other four &mdash; which the written line never could. The columns are tap targets, so the horizontal swipe becomes an accelerator rather than the only way to move, which is the mitigation the gesture conflict needed. Vocabulary against the vertical axis still separates cleanly: a row of numerals is not a ladder of ticks.',
  M2),
 ('M3', 'The strip at the foot', 'The map below the instrument, not above it',
  'The written line stays where Lab&nbsp;28 put it and the strip drops below the dial, under LAST&nbsp;TIME. Nothing is removed; the screen just gets denser.',
  'The argument for it: what you lifted is history, and history reads downward. The argument against: you are back to two horizontal indicators, and the foot of the screen now carries four stacked rows &mdash; last time, the strip, four buttons, three session numbers &mdash; which is where the spacing law starts to strain. Worth seeing at full size before dismissing; it is the densest of the three and you have consistently wanted density.',
  M3),
 ('M4', 'The sheet, on top of M2', 'Reading is free, editing costs a tap',
  'The <b>SETS</b> key lifts the full table: RPE and e1RM per logged set, the current set highlighted, the planned one greyed, add and edit beneath.',
  'This is the other half of the Lab&nbsp;24 recommendation and it survives contact with the strip intact &mdash; because they answer different questions. The strip answers <em>what have I been lifting</em>, which you ask every ninety seconds. The sheet answers <em>what exactly did I do on set three and can I change it</em>, which you ask twice a session. Note the sheet is the only glass-on-glass surface here, and it is legitimate: the scrim underneath gives it something to be glass against.',
  M4),
 ('M5', 'Mid-swipe', 'What the gesture actually looks like',
  'A still of the horizontal drag: set four sliding out to the left, set five entering from the right at a third opacity, the gold rule already travelling toward the next column.',
  'Two things only show up once the screen moves. First, the strip animates <em>with</em> the gesture &mdash; the rule is a position on a track, so it can be dragged; a sentence has no in-between state, so the written line could only ever snap after the fact. Second, and less welcome: the dial is 342pt wide in a 370pt window, so as soon as it travels it runs straight over the numbered ticks on the left edge. Look at ticks one to three. That is not a drawing mistake, it is what will actually happen.',
  M5),
]

cols = ''.join(
  '<div class="col"><div class="cap"><span class="k">' + c[0] + '</span><span class="t">' + c[1] + '</span>'
  '<span class="s">' + c[2] + '</span><span class="d">' + c[3] + '</span>'
  '<span class="w">' + c[4] + '</span></div>' + c[5] + '</div>' for c in COLS)

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
  <div style="display:flex;flex-direction:column;gap:38px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:940px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 29</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Where the sets live, with the gestures</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Lab&nbsp;24 said the sets should live in a chip strip you can read for free plus a sheet you open to edit. Lab&nbsp;28 said the horizontal axis is a written line reading <span style="color:#f0efec">SET 4 OF 5</span>. Both are on record as settled and <span style="color:#f0efec">they have never been on the same screen</span>. Put them together and they contradict each other: a strip of five set values <em>is</em> a horizontal set indicator, so the screen ends up with two.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">M1 is the collision, drawn honestly rather than argued. M2, M3 and M4 are the ways out. M5 is the same screen in motion, which turns out to settle it.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Everything else is held fixed at the locked values: V2 palette, G1 glass on chrome only, Geist and Geist&nbsp;Mono, editorial with no rules, and K3&rsquo;s numbered ticks down the left edge for the vertical axis. The left-edge back-gesture question is still hardware-dependent and is not what this board is asking.</p>
    </div>
    <div class="board">''' + cols + '''</div>

    <div style="max-width:940px;padding-top:20px;display:flex;flex-direction:column;gap:14px">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">What changes if you take M2</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">The written set line from Lab&nbsp;28 is <b style="color:#c9c3b6;font-weight:500">retired</b>. That is a reversal of a decision recorded as fixed, so it should be a deliberate one. The reasoning is that the line was chosen when the only alternative was a row of dots &mdash; words beat dots because words carry a count. A strip of real set values beats words on the same grounds, one step further: it carries the count <em>and</em> the loads.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">The two-vocabularies rule from Lab&nbsp;28 still holds and is arguably stronger. Horizontal is a <b style="color:#c9c3b6;font-weight:500">row of measured values</b>; vertical is a <b style="color:#c9c3b6;font-weight:500">ladder of ordinal ticks</b>. Nothing about one resembles the other, and each is true to its axis: sets have loads worth reading, exercises have an order worth counting.</p>
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec;padding-top:8px">Something M5 settles that was filed as hardware-dependent</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Lab&nbsp;28 left K3 versus K2 open on the grounds that a left-edge indicator might fight the iOS back gesture, and that no screenshot could tell us. That is still true of the <em>thumb</em>. But M5 shows a second problem that a screenshot can settle: the dial is 342pt wide inside a 370pt window, so the moment it translates it <b style="color:#c9c3b6;font-weight:500">covers the left-edge ticks</b>. There is no shift small enough to feel like a swipe and large enough to clear a column that sits at x=12.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Three ways out, in order of how much they cost: shrink the dial to about 300pt and give the ladder a real gutter; move the ladder to the <em>right</em> edge, which is free of both system gestures and out of the travel path only if the dial moves the other way; or take K5&rsquo;s chevrons, which have no column to collide with. The first is the smallest change and the one I would try first &mdash; the dial at 300pt still dwarfs everything else on the screen.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Open, and genuinely open: the strip assumes five sets fits. At eight it will not &mdash; the columns fall below the 11px floor or the numerals truncate. The fallback is to show a window of five around the current set and let the strip scroll with the gesture, which is more code and one more thing that can feel wrong. Worth deciding now rather than discovering at eight sets.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab29.html', 'w').write(HTML)
print('wrote lab29.html', len(HTML))
