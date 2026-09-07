"""Lab 33 — The live screen, settled.

Every interaction decision is in. This is the reference the other sixteen
screens inherit from, and the thing implementation builds against.

Two consequences, neither of which had been drawn:

1. Once the tape is the control and the ring is the readout, the ring never
   needs to re-scale. It stays the load gauge in all four states.
2. All three parameters use that one tape. RPE had a nine-cell row for a while;
   a third control for the least-used parameter was the wrong trade, and the row
   was what forced RPE to 6-10 and to 38pt cells.
"""
import lab28 as L
import lab29 as N
import lab31 as R
import lab32 as Q

EXTRA = Q.EXTRA

CSS = L.CSS + EXTRA
GOLD = R.GOLD


# RPE on the same tape as load and reps. Whole points, 1 to 10.
#
# A fixed row had to fit every value on screen at once, which is what forced the
# range to 6-10 and the cells to 38pt. On a tape the range is free, so warm-up
# sets — genuinely RPE 3 to 5 — get a representation they never had. Whole
# points because RIR = 10 - RPE maps cleanly, and half-point precision on a
# subjective scale is mostly false precision.
RPE = R.Scale(1, 10, 1, 1, 1, lambda v: '%d' % v)

SHORT = dict(R.SHORT, rpe=('8', 'RPE'))


def selector(active, gloss=''):
    """R.selector, with room for a gloss on the active cell — RPE 8 should never
    be shown bare."""
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
                      GOLD if on else 'var(--lo)', (u + ' &middot; ' + gloss) if (on and gloss) else u,
                      'var(--hi)' if on else 'var(--mid)', v))
    return '<div class="r" style="width:100%;flex:none;gap:6px;padding:0 4px">' + ''.join(out) + '</div>' 


SUB = '<span class="mono lbl">EXERCISE 3 OF 6</span>'
HEAD = L.head(SUB)


def screen(dialhtml, ladder_dim=False, tapehtml='', below='', wrap_style=''):
    vert = L.V_ticks().replace('class="vcol" style="gap:11px"',
                               'class="vcol" style="gap:11px;left:10px'
                               + (';opacity:0.28' if ladder_dim else '') + '"')
    # RPE is whole points now, so a logged 7.5 is a value the app cannot produce.
    body = (HEAD + L.SETLINE + R.wrap(dialhtml + tapehtml, wrap_style) + below
            + N.prev().replace('@ 7.5', '@ 7') + L.actions() + L.sess())
    return N.phone(body, '', vert=vert, left='SETS')


# The core always reads LOAD, because the ring always reads load. What you are
# editing is said by the selector and by the tape, not by the centre of a dial
# that is showing something else.
def ring_dial(w, numerals, chips):
    return Q.dial(w, R.LOAD, 102.5, active='load', mark=130.0, mode='both',
                  editing=numerals, labels=numerals, chips=chips)


TAPE_WRAP = 'padding-right:62px'

G1 = screen(ring_dial(330, False, True))
G2 = screen(ring_dial(290, True, False), ladder_dim=True,
            tapehtml=R.tape(R.LOAD, 102.5, 'KG'), below=R.selector('load'),
            wrap_style=TAPE_WRAP)
G3 = screen(ring_dial(290, False, False), ladder_dim=True,
            tapehtml=R.tape(R.REPS, 8, 'REPS'), below=R.selector('reps'),
            wrap_style=TAPE_WRAP)
G4 = screen(ring_dial(290, False, False), ladder_dim=True,
            tapehtml=R.tape(RPE, 8, 'RPE'), below=selector('rpe', 'RIR 2'),
            wrap_style=TAPE_WRAP)

COLS = [
 ('G1', 'Resting', 'What the screen is almost all of the time',
  'F3&rsquo;s ring &mdash; fill and cursor, no arc, no knob, no reference numerals. Load is the hero, reps and RPE sit under it as chips you can tap. Nothing on screen is a control until you touch one.',
  'Everything settled since Lab&nbsp;28 is in this one frame: written set line, K3 ladder on the left, LAST&nbsp;TIME with no border, four secondary destinations, session strip, SETS opening the sheet. It is the version to build.',
  G1),
 ('G2', 'Editing load', 'Tape drives, ring reads',
  'The ring shrinks to make room for the tape and gains reference numerals, because while you are editing load the perimeter is live &mdash; you can also throw it round the ring if you want to move a long way.',
  'The numerals are the tell that the ring is accepting input. They appear in this state and no other, which is the only place the perimeter drag applies.',
  G2),
 ('G3', 'Editing reps', 'The ring does not follow',
  'Same tape, re-scaled to one through fifteen. <b>The ring stays on load</b> and keeps its numerals off, because it is not the thing you are changing.',
  'This is the part that changed once the tape won. When the ring was the input it had to become whatever you were editing, which cost you the load-in-range reading every time you touched reps. Now it never moves, so the one number the ring exists to show is on screen in all four states. The centre of the dial reads load in every frame on this board &mdash; that consistency is the point.',
  G3),
('G4', 'Editing RPE', 'The same tape again',
  'One to ten in whole points, with the RIR gloss in the selector cell so RPE&nbsp;8 is never shown bare. Structurally identical to G3 &mdash; which is the point.',
  'This replaced a nine-cell segmented row, and the row lost on two counts. It was a third control for the parameter you set least often, which is the wrong place to spend a new pattern. And a row has to fit every value on screen at once, which is what forced the range to six-to-ten and the cells to 38&nbsp;&times;&nbsp;44 &mdash; under the hit-area floor. <b>On a tape the range is free</b>, so one to ten costs nothing and warm-up sets, which genuinely sit at RPE 3 to 5, get a representation they never had. Whole points because RIR is ten minus RPE, so integers map cleanly, and half-point precision on a subjective scale is mostly false precision.',
  G4),
]

cols = ''.join(
  '<div class="col"><div class="cap"><span class="k">' + c[0] + '</span>'
  '<span class="t">' + c[1] + '</span><span class="s">' + c[2] + '</span>'
  '<span class="d">' + c[3] + '</span><span class="w">' + c[4] + '</span></div>'
  + c[5] + '</div>' for c in COLS)

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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 33</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">The live screen, settled</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Four states, every decision from Labs 24 through 32 applied. Nothing here is a question &mdash; this is the reference the remaining sixteen screens inherit from, and what implementation builds against.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Following the calls through produced two simplifications. Once the tape is the control and the ring is the readout, <span style="color:#f0efec">the ring never needs to re-scale</span> &mdash; it stays the load gauge in all four states, so the number it exists to show is never off screen. The core reads <span style="color:#96938c">LOAD</span> in every frame here; what you are editing is said by the selector and the control, not by the middle of a dial showing something else.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">And <span style="color:#f0efec">all three parameters use that one tape</span>. RPE briefly had a nine-cell row of its own; spending a third control on the parameter you set least often was the wrong trade, and it was the row that forced RPE to six-to-ten and to cells under the hit-area floor. A tape does not care how long the scale is, so RPE now runs one to ten and covers warm-up sets.</p>
    </div>
    <div class="board">''' + cols + '''</div>

    <div class="sect">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">The rules, stated for implementation</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c"><b style="color:#c9c3b6;font-weight:500">The ring is always the load gauge.</b> Fill and cursor, no arc, no knob. Length carries the fill, not colour. 2.5&nbsp;kg per tick, 20 to 140, red notch at the estimated 1RM.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c"><b style="color:#c9c3b6;font-weight:500">Reference numerals mean the perimeter is live.</b> They appear only while editing load, which is the only state the perimeter drag applies to. They cost 31pt of radius, which is why the ring shrinks to 290 whenever the tape is present &mdash; two ring sizes in the whole screen, 330 at rest and 290 while editing.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c"><b style="color:#c9c3b6;font-weight:500">All three parameters use the tape.</b> Load 20&ndash;140 by 2.5, reps 1&ndash;15 by 1, RPE 1&ndash;10 by 1. Long-press any of the three for the keypad, or make a single tap open it in Settings. No value is ever reachable by only one route.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Two sheets, one grammar: grip reorders, row navigates, the button at the foot adds. SETS from the button; EXERCISES from the counter, the title, or the ladder.</p>
    </div>

    <div class="sect">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">What is left</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c"><b style="color:#c9c3b6;font-weight:500">One thing still needs a device</b>, and only a device: whether the ladder on the left edge fights the iOS back gesture under a real thumb. Everything else about it is resolved &mdash; the dial slides under it behind a mask, and it has a tap target now that the exercise sheet opens from it.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c"><b style="color:#c9c3b6;font-weight:500">Sixteen screens have never been drawn in this direction.</b> Routines, programs, exercise library, body map, calendar, settings, session history and the rest. They are the bulk of the remaining design work and they now have a settled vocabulary to inherit, which is what these thirty-three boards were for.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab33.html', 'w').write(HTML)
print('wrote lab33.html', len(HTML))
