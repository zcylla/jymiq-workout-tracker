"""Lab 30 — The sets go behind the button.

Lab 29's answer was the set strip. The call was to remove it: the SETS button is
the only global view of the sets, and a secondary way to navigate to them. That
is cleaner, and it has three consequences worth drawing rather than assuming.
"""
import lab28 as L
import lab29 as N

EXTRA = N.EXTRA + """
  .row{width:100%;flex:none;display:flex;align-items:center;gap:11px;padding:0 4px}
  .jump{width:26px;height:26px;flex:none;display:flex;align-items:center;justify-content:center;
        border-radius:8px}
  /* The dial always ends up travelling the full width, so no gutter is wide
     enough on its own. The ladder is chrome: it sits on top and the dial slides
     under a fade, the way content passes under an iOS bar. */
  /* Masked, not painted over. A gradient rectangle sits visibly on top of the
     dot field and the bloom; a mask just stops the dial existing there. */
  .track{-webkit-mask-image:linear-gradient(to right,transparent 4px,#000 62px);
         mask-image:linear-gradient(to right,transparent 4px,#000 62px)}
  .vcol{z-index:4}
"""

CSS = L.CSS + EXTRA


def dial(w=342, size=352, num=58):
    """Lab 28's dial, with the width unpinned so the ring can be given a gutter."""
    a_load = L.A0 + L.I_LOAD * (L.A1 - L.A0) / (L.N - 1)
    cx, cy, r = w / 2.0, size / 2.0 - 6, min(w, size) / 2.0 - 26
    return ('<div class="dial" style="width:' + str(w) + 'px;height:' + str(size) + 'px">'
      '<svg viewBox="0 0 ' + str(w) + ' ' + str(size) + '" style="width:' + str(w) + 'px;height:'
      + str(size) + 'px;position:absolute;left:0;top:0">'
      '<path d="' + L.arcp(cx, cy, r - 22, L.A0, a_load) + '" fill="none" stroke="var(--accent)" '
      'stroke-width="5" stroke-linecap="round" opacity="0.85"></path>'
      + L.ring(cx, cy, r, 15, 7) + '</svg>'
      '<div class="core">'
      '<span class="mono lbl">LOAD</span>'
      '<span class="mono" style="font-size:' + str(num) + 'px;font-weight:600;letter-spacing:-0.05em;'
      'line-height:1;color:var(--hi)">102.5</span>'
      '<span class="mono" style="font-size:13px;color:var(--mid)">KG &middot; 79% OF 1RM</span>'
      '<div class="r" style="gap:6px;margin-top:14px;align-items:baseline">'
      '<span class="mono" style="font-size:30px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">8</span>'
      '<span class="mono lbl">REPS</span>'
      '<span style="width:1px;height:15px;background:rgba(255,255,255,0.14);margin:0 4px"></span>'
      '<span class="mono" style="font-size:30px;font-weight:600;letter-spacing:-0.03em;color:var(--accent)">8.0</span>'
      '<span class="mono lbl">RPE</span></div></div></div>')


def centred(inner):
    """A fixed-width dial centred in the 370pt body column."""
    # the ring's arc opens at the bottom, so the dial box carries ~54pt of empty
    # space below the last tick. Trim it or the gap under the ring reads 29pt
    # larger than the gap above it.
    return ('<div style="width:100%;flex:none;display:flex;justify-content:center;'
            'margin-bottom:-28px">' + inner + '</div>')


def slide(w, size, shift):
    """Current dial travelling left, next one entering. The still of a swipe."""
    return ('<div class="track" style="height:' + str(size) + 'px;margin-bottom:-28px">'
            '<div style="display:flex;gap:30px;flex:none;margin-left:' + str(int((370 - w) / 2)) + 'px;'
            'transform:translateX(' + str(shift) + 'px)">'
            '<div style="flex:none">' + dial(w, size) + '</div>'
            '<div style="opacity:0.34;flex:none">' + dial(w, size) + '</div></div></div>')


CHEV = ('<svg viewBox="0 0 16 16" style="width:13px;height:13px" fill="none" stroke="var(--lo)" '
        'stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round"><path d="M6 3l5 5-5 5">'
        '</path></svg>')


def sheet_row(idx, w, rep, rpe, e1, state, jump=False):
    """Sheet row. With the strip gone the sheet is also how you move between sets,
    so every row that is not the current one gets a chevron and a real hit area."""
    if state == 'cur':
        bg = 'background:rgba(228,198,140,0.10);border-radius:10px;padding:0 8px;'
        c, ink = 'var(--accent)', ['var(--accent)', 'var(--accent)', 'var(--dim)', 'var(--dim)']
        cols = [w, '&times;' + rep, '&mdash;', '&mdash;']
    elif state == 'ahead':
        bg = 'opacity:0.5;padding:0 8px;'
        c, ink = 'var(--dim)', ['var(--mid)', 'var(--mid)', 'var(--dim)', 'var(--dim)']
        cols = [w, '&times;' + rep, '&mdash;', '&mdash;']
    else:
        bg = 'padding:0 8px;'
        c, ink = 'var(--pos)', ['var(--hi)', 'var(--mid)', 'var(--mid)', 'var(--accent)']
        cols = [w, '&times;' + rep, rpe, e1]
    cells = ''.join(
        '<span class="mono" style="width:' + wd + 'px;text-align:right;color:' + ic + '">' + v + '</span>'
        for wd, v, ic in zip(['52', '32', '38', '46'], cols, ink))
    tail = ('<span class="jump">' + CHEV + '</span>' if jump else
            '<span style="width:26px;flex:none"></span>')
    return ('<div class="r" style="height:38px;font-size:13px;gap:10px;' + bg + '">'
            '<span class="mono" style="width:24px;font-size:11px;color:' + c + '">' + idx + '</span>'
            '<span class="sp"></span>' + cells + tail + '</div>')


def sheet(nav=False):
    head = (
      '<div class="scrim"></div>'
      '<div class="sheet"><div class="grab"></div>'
      '<div class="r"><span class="mono lbl">SETS &middot; BARBELL SQUAT</span><span class="sp"></span>'
      '<span class="mono lbl">3 OF 5 DONE</span></div>'
      '<div style="height:1px;background:rgba(255,255,255,0.12)"></div>'
      '<div class="r" style="height:18px;gap:10px"><span class="mono lbl" style="width:24px">SET</span>'
      '<span class="sp"></span>'
      '<span class="mono lbl" style="width:52px;text-align:right">KG</span>'
      '<span class="mono lbl" style="width:32px;text-align:right">REP</span>'
      '<span class="mono lbl" style="width:38px;text-align:right">RPE</span>'
      '<span class="mono lbl" style="width:46px;text-align:right">e1RM</span>'
      '<span style="width:26px;flex:none"></span></div>')
    rows = (sheet_row('01', '100.0', '8', '7.0', '124', 'done', nav)
            + sheet_row('02', '102.5', '8', '7.5', '128', 'done', nav)
            + sheet_row('03', '102.5', '7', '8.0', '126', 'done', nav)
            + sheet_row('04', '102.5', '8', '', '', 'cur')
            + sheet_row('05', '102.5', '8', '', '', 'ahead', nav))
    foot = ('<div class="r" style="gap:8px;margin-top:6px">'
      '<div style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;'
      'border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10)">'
      '<span style="font-size:14px;color:var(--hi)">Add set</span></div>'
      '<div style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;'
      'border-radius:12px;background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10)">'
      '<span style="font-size:14px;color:var(--hi)">Edit set 03</span></div></div></div>')
    return head + rows + foot


SUB = '<span class="mono lbl">EXERCISE 3 OF 6</span>'
HEAD = L.head(SUB)


def ladder(left=12):
    """K3, with the gutter as a parameter — that is the whole question in R2."""
    return L.V_ticks().replace('class="vcol" style="gap:11px"',
                               'class="vcol" style="gap:11px;left:' + str(left) + 'px"')


R1 = N.phone(HEAD + L.SETLINE + centred(dial(342, 352)) + N.prev() + L.actions() + L.sess())
R2 = N.phone(HEAD + L.SETLINE + centred(dial(300, 312, 52)) + N.prev() + L.actions() + L.sess(),
             vert=ladder(10))
R3 = N.phone(HEAD + L.SETLINE + centred(dial(300, 312, 52)) + N.prev() + L.actions() + L.sess(),
             sheet(nav=True), vert=ladder(10))
R4 = N.phone(HEAD + L.SETLINE + slide(300, 312, -108) + N.prev() + L.actions() + L.sess(),
             vert=ladder(10))

COLS = [
 ('R1', 'The screen, strip removed', 'Your call, drawn straight',
  'Nothing where the strip was. The written <b>SET 4 OF 5</b> line comes back to carry the horizontal axis, LAST&nbsp;TIME keeps the border removed in Lab&nbsp;29, and the fifty-six points the strip was using go into air.',
  'It is cleaner, and the reason is worth naming: the strip was the only element on the screen that showed you something you were not currently doing. Everything left is the set in front of you. That is a real principle and it is the one the research called progressive disclosure by state &mdash; density is only earned when all of it is relevant right now.',
  R1),
 ('R2', 'Dial down to 300', 'The gutter the ladder never had',
  'Same screen, ring shrunk from 342 to 300 points wide and the numbered ticks pulled to x=10. The load numeral drops 58 to 52; nothing else moves.',
  'With the strip gone the swipe has no visible track left, so the dial sliding <em>is</em> the feedback &mdash; which makes Lab&nbsp;29&rsquo;s collision worse, not better. Standing still there were eighteen points between the ladder and the outermost tick; there are now forty-one. That fixes the resting screen. It does <em>not</em> fix the moving one, and R4 is where I found that out.',
  R2),
 ('R3', 'The sheet, doing two jobs', 'Reading the sets, and going to one',
  'Every row that is not the current set gains a chevron and a 38pt hit area. Tapping row 02 closes the sheet and takes you to set two; the current row has no chevron because there is nowhere to go.',
  'This is the part your call actually changes. In Lab&nbsp;29 the sheet only had to answer <em>what did I do</em>, because the strip handled <em>take me there</em>. Now it is both, and a table that is also a menu has to look like one &mdash; hence the chevrons. Worth checking you agree: without them the rows read as data and nobody discovers the navigation.',
  R3),
 ('R4', 'Mid-swipe at 300', 'The collision, gone',
  'Set four travelling out, set five entering at a third opacity, and the left sixty points of the dial masked away so the ladder has clear ground under it.',
  'I drew this expecting R2&rsquo;s smaller dial to solve it and it does not. Forty-one points of gutter buys the first forty-nine points of travel; after that the dial is over the ladder again, and a paged swipe eventually travels the whole width. No dial small enough to feel like this screen is small enough to clear a fixed left column. What actually works is treating the ladder as chrome: it stays on top and the dial is <em>masked out</em> beneath it, the way content passes under an iOS bar. One line of CSS, one line of Reanimated. The alternative &mdash; a painted gradient &mdash; reads as a visible rectangle sitting on the dot field, which I tried first.',
  R4),
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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 30</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">The sets go behind the button</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Strip gone. The <span style="color:#f0efec">SETS</span> button is the only global view of the sets and the secondary way to move between them. Lab&nbsp;28&rsquo;s written set line comes back to carry the horizontal axis on its own, which restores the two-vocabularies pairing exactly as it was: a sentence across, a ladder down.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Three things follow from the removal and none of them are free. The sheet inherits a job it did not have. The swipe loses its only visible track, so the dial&rsquo;s slide becomes the entire feedback. And that makes the dial-over-ladder collision from Lab&nbsp;29 more important rather than less, because there is nothing else left to read during the travel.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">R1 is your call drawn straight. R2 gives the ring a gutter. R3 is the sheet doing both jobs. R4 checks the swipe again &mdash; and overturns what Lab&nbsp;29 concluded about how to fix it.</p>
    </div>
    <div class="board">''' + cols + '''</div>

    <div style="max-width:940px;padding-top:20px;display:flex;flex-direction:column;gap:14px">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">What you give up, stated plainly</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">One thing genuinely goes away: <b style="color:#c9c3b6;font-weight:500">what you lifted on the previous sets of this exercise is now a tap away rather than free.</b> LAST&nbsp;TIME still covers the same set in your last session, which is the number you asked for and the one that matters most mid-set. But &ldquo;did I do 102.5 or 100 on set two, twenty minutes ago&rdquo; now costs opening the sheet.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Whether that is a real loss depends on something only you know: how often you actually forget what you just lifted. On a straight-sets squat where every set is the same load, never &mdash; the strip was showing you five copies of one number. On a top-set-then-backoff or a session where you are autoregulating down, more often. If it turns out to matter, the smallest fix is not the strip coming back; it is one line under LAST&nbsp;TIME reading what the previous set of <em>this</em> exercise was.</p>
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec;padding-top:8px">Correcting Lab 29</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Lab&nbsp;29 said the dial-over-ladder collision could be solved by shrinking the dial to about 300 points. <b style="color:#c9c3b6;font-weight:500">That was wrong</b> and R4 is the proof: a gutter only postpones the overlap, and a paged swipe travels the full screen width regardless of how wide the dial is. The fix is z-order and a mask, not geometry. R2&rsquo;s smaller dial is still worth keeping &mdash; it fixes the resting screen, where eighteen points of clearance was genuinely tight &mdash; but it is a separate improvement, not the answer to that problem.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Still open from Lab&nbsp;29 and unaffected by any of this: whether a left-edge ladder fights the iOS back gesture under a real thumb. The mask buys the ladder clear ground from the dial, not from the system.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab30.html', 'w').write(HTML)
print('wrote lab30.html', len(HTML))
