import sys; sys.path.insert(0,'.')
import lab08

CSS = lab08.CSS + """
  .pair{display:flex;flex-direction:column;gap:10px}
  .tag{font-size:11px;letter-spacing:0.16em;font-family:'Geist Mono',ui-monospace,monospace}
  .tag.b{color:#a8705f}
  .tag.a{color:#8ce07f}
  .stage.dim{opacity:0.52;border-style:dashed}
  .why{font-size:12px;line-height:1.6;color:#8c8677;border-top:1px solid rgba(255,255,255,0.07);padding-top:11px}
  .why b{color:#c9c3b6;font-weight:500}
  .grid3{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;max-width:1420px}
  .tier{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;max-width:1420px}
  .tc{border-radius:14px;padding:15px 17px;display:flex;flex-direction:column;gap:8px}
  .tc h3{margin:0;font-size:14px;font-weight:600;color:#f0efec}
  .tc p{margin:0;font-size:12px;line-height:1.6;color:#8c8677}
  .tc ul{margin:0;padding-left:17px;font-size:12px;line-height:1.75;color:#c9c3b6}
  .t1{background:rgba(140,224,127,0.07);border:1px solid rgba(140,224,127,0.22)}
  .t2{background:rgba(217,201,168,0.06);border:1px solid rgba(217,201,168,0.22)}
  .t3{background:rgba(255,92,26,0.05);border:1px solid rgba(255,92,26,0.22)}
"""

# ---------- AFTER versions ----------

A_CAP = ('<div class="r"><span class="mono lbl">READY TO TRAIN</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--warn)">QUADS NEED A DAY</span></div>'
 + ''.join(
   '<div class="r" style="gap:10px;height:22px">'
   '<span class="mono" style="width:52px;font-size:11px;color:var(--lo)">%s</span>'
   '<div style="flex:1;height:7px;border-radius:4px;background:rgba(255,255,255,0.07);overflow:hidden">'
   '<span style="display:block;width:%d%%;height:100%%;border-radius:4px;background:%s"></span></div>'
   '<span class="mono" style="width:34px;text-align:right;font-size:11px;color:var(--mid)">%d%%</span></div>'
   % (n, v, c, v) for n, v, c in
   [('Chest',78,'var(--pos)'),('Back',88,'var(--pos)'),('Quads',36,'var(--live)'),
    ('Hams',59,'var(--warn)'),('Shldr',92,'var(--pos)'),('Arms',70,'var(--pos)')]))

A_TREND = ('<div class="r" style="gap:12px">'
 '<div style="display:flex;flex-direction:column;gap:3px">'
 '<span class="mono lbl">BODYWEIGHT</span>'
 '<div class="r" style="gap:6px;align-items:baseline">'
 '<span class="mono" style="font-size:34px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">81.0</span>'
 '<span class="mono" style="font-size:13px;color:var(--mid)">kg</span></div>'
 '<div class="r" style="gap:5px"><span style="width:0;height:0;border-bottom:6px solid var(--pos);'
 'border-left:4px solid transparent;border-right:4px solid transparent"></span>'
 '<span class="mono" style="font-size:11px;color:var(--pos)">+0.4 kg per week</span></div></div>'
 '<div style="flex:1;min-width:0">'
 '<svg viewBox="0 0 180 62" style="width:100%;height:62px">'
 '<path d="M4 50 L18 47 L32 48 L46 43 L60 44 L74 38 L88 39 L102 33 L116 34 L130 27 L144 28 L158 21 L172 18" '
 'fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>'
 '<circle cx="172" cy="18" r="3.5" fill="var(--accent)"></circle></svg>'
 '<span class="mono" style="font-size:11px;color:var(--dim)">Last 12 weeks</span></div></div>')

A_TIME = ('<div class="r"><span class="mono lbl">THIS SESSION</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--dim)">31 min</span></div>'
 + ''.join(
   '<div class="r" style="gap:9px;height:23px">'
   '<span style="width:3px;height:14px;border-radius:1px;background:%s"></span>'
   '<span style="width:52px;font-size:12px;color:%s">%s</span>'
   '<span class="mono" style="flex:1;font-size:12px;color:var(--mid)">%s</span>'
   '<span class="mono" style="font-size:11px;color:var(--dim)">%s rest</span></div>'
   % (c, tc, lab, val, rest) for c, tc, lab, val, rest in
   [('var(--on)','var(--dim)','Warm-up','60.0 x 5','1:00'),
    ('var(--on)','var(--dim)','Warm-up','80.0 x 3','1:00'),
    ('var(--pos)','var(--mid)','Set 1','100.0 x 8','2:30'),
    ('var(--pos)','var(--mid)','Set 2','102.5 x 8','2:30'),
    ('var(--pos)','var(--mid)','Set 3','102.5 x 7','2:30'),
    ('var(--accent)','var(--hi)','Set 4','102.5 &mdash;','now')]))

A_PLATE = ('<div class="r"><span class="mono lbl">LOAD EACH SIDE</span><span class="sp"></span>'
 '<span class="mono" style="font-size:13px;color:var(--accent)">102.5 kg total</span></div>'
 '<div class="r" style="gap:5px;align-items:flex-end;height:44px">'
 + ''.join('<div style="width:%dpx;display:flex;flex-direction:column;align-items:center;gap:5px">'
           '<span style="width:100%%;height:%dpx;border-radius:2px;background:%s"></span>'
           '<span class="mono" style="font-size:11px;color:var(--mid)">%s</span></div>' % (w,h,c,n)
           for w,h,c,n in [(40,32,'#2f6fb0','20'),(40,32,'#2f6fb0','20'),
                           (28,25,'#3f7a52','10'),(15,17,'#d0cbc2','1.25')])
 + '<span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--dim);padding-bottom:18px">20 kg bar<br>+ collars</span></div>')

A_BANDS = ('<div class="r"><span class="mono lbl">CHEST &middot; SETS THIS WEEK</span><span class="sp"></span>'
 '<span class="mono" style="font-size:13px;color:var(--warn)">18</span></div>'
 '<div style="position:relative;height:16px;border-radius:4px;overflow:hidden;display:flex">'
 '<span style="width:30%;background:rgba(255,255,255,0.06)"></span>'
 '<span style="width:25%;background:rgba(140,224,127,0.30)"></span>'
 '<span style="width:27%;background:rgba(232,178,58,0.30)"></span>'
 '<span style="width:18%;background:rgba(255,92,26,0.32)"></span>'
 '<span style="position:absolute;left:60%;top:-2px;bottom:-2px;width:3px;background:var(--hi);'
 'border-radius:2px;box-shadow:0 0 0 2px rgba(16,14,11,0.85)"></span></div>'
 '<div class="r" style="font-size:11px">'
 '<span style="width:30%;color:var(--dim)">Too few</span>'
 '<span style="width:25%;color:var(--pos)">Good</span>'
 '<span style="width:27%;color:var(--warn)">Hard</span>'
 '<span style="flex:1;color:var(--live)">Too much</span></div>'
 '<span class="mono" style="font-size:11px;color:var(--dim)">You are in the hard range. Two more sets and you deload.</span>')

A_RAMP = ('<div class="r"><span class="mono lbl">WARM-UP RAMP</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--dim)">TAP TO CHANGE</span></div>'
 '<div class="r" style="gap:6px">'
 + ''.join('<div style="flex:1;min-height:44px;border-radius:10px;display:flex;flex-direction:column;'
           'align-items:center;justify-content:center;gap:2px;background:%s;border:1px solid %s">'
           '<span class="mono" style="font-size:13px;font-weight:500;color:%s">%s</span>'
           '<span class="mono" style="font-size:11px;color:%s">%s</span></div>'
           % (('rgba(217,201,168,0.16)' if a else 'rgba(255,255,255,0.04)'),
              ('var(--accent)' if a else 'rgba(255,255,255,0.09)'),
              ('var(--accent)' if a else 'var(--dim)'), p,
              ('var(--mid)' if a else 'var(--dim)'), l)
           for a,p,l in [(True,'40%','41 x5'),(True,'60%','61 x3'),(True,'75%','78 x2'),
                         (False,'85%','88 x1'),(False,'100%','102.5')])
 + '</div>')

PAIRS = [
 ('01','Muscle fatigue','Capacity removed &rarr; capacity remaining', lab08.P03, A_CAP,
  'The compressor metaphor is elegant and almost nobody reads it. A bar that grows <b>downward from a ceiling</b> asks you to invert the usual mapping before you can use it. '
  'Flipped: a normal left-to-right bar, more is better, plain names, a percentage you can say out loud. Same data, same decay model, zero learning.'),

 ('02','Bodyweight trend','Aviation tape &rarr; number, arrow, sparkline', lab08.P05, A_TREND,
  'A vertical scrolling tape with a fixed centre window is genuinely excellent &mdash; in a cockpit, where you read it every day. In an app you open twice a week it is a puzzle. '
  'Replaced with the three things everyone already reads: <b>the number, the direction, the line</b>. The trend vector survives as an arrow.'),

 ('03','Session history','Waveform &rarr; a list that says the rest', lab08.P10, A_TIME,
  'The waveform encodes rest duration in the <b>gap between bars</b>, which is clever and completely undiscoverable &mdash; nothing on screen tells you the gaps mean anything. '
  'If a rule has to be taught, write it down instead: the ramp reads as a ramp, and the rest is a number in a column.'),

 ('04','Plate loading','Dual scale &rarr; just the plates', lab08.P11, A_PLATE,
  'The plate strip was already the readable half; the vernier rail above it was the half that made you stop and work out what you were looking at. '
  'Dropping the rail loses nothing &mdash; the plates <b>are</b> the answer, drawn at their real relative sizes in their real competition colours.'),

 ('05','Volume landmarks','MEV/MAV/MRV &rarr; words', lab08.P01, A_BANDS,
  'The instrument was fine. The <b>labels</b> were the problem: MEV, MAV and MRV are Renaissance Periodization jargon, and an axis of acronyms is not a readable axis. '
  'Same bands, same marker, plain English, and a sentence underneath saying what to do about it.'),

 ('06','Warm-up ramp','Detent knob &rarr; segmented control', lab08.P12, A_RAMP,
  'A click-stop knob is the honest metaphor for a fixed set of values, and it is the wrong control for a thumb. '
  'A row of tappable cells says the same thing &mdash; only these five values exist &mdash; while being a native, 44pt, obvious tap target.'),
]

cards = ''.join(
  '<div class="card"><div class="hd"><span class="n mono">%s</span><span class="t">%s</span>'
  '<span class="s mono">%s</span></div>'
  '<div class="pair"><span class="tag b">AS DRAWN IN LAB 08</span><div class="stage dim">%s</div></div>'
  '<div class="pair"><span class="tag a">READABLE</span><div class="stage">%s</div></div>'
  '<div class="why">%s</div></div>' % c for c in PAIRS)

TIERS = ('<div class="tc t1"><h3>Reads with no explanation</h3>'
 '<p>Shapes people already meet every day. Ship these anywhere, at any size.</p>'
 '<ul><li>Progress ladder filling green to red</li><li>Bar chart of RPE counts</li>'
 '<li>Ring gauges in a row</li><li>Line chart with flagged points</li>'
 '<li>Plate strip</li><li>Segmented set meter</li></ul></div>'
 '<div class="tc t2"><h3>Reads once it is labelled</h3>'
 '<p>Fine to use, but the label is not optional &mdash; it is part of the instrument. Never ship these bare.</p>'
 '<ul><li>Zone bands, with words not acronyms</li><li>Comparison cap, with a legend saying &ldquo;last week&rdquo;</li>'
 '<li>Tuner tape, with its units on the axis</li><li>Delta bracket, with the signed value always visible</li></ul></div>'
 '<div class="tc t3"><h3>Needs teaching &mdash; changed or cut</h3>'
 '<p>Every one of these required you to stop and decode it. That is a defect, not a style.</p>'
 '<ul><li>Inverted capacity meter &rarr; flipped</li><li>Vertical altitude tape &rarr; replaced</li>'
 '<li>Gap-encoded waveform &rarr; replaced</li><li>Vernier dual scale &rarr; simplified</li>'
 '<li>Rotary detent &rarr; segmented control</li><li>Barcode trend strip &rarr; use the line chart</li></ul></div>')

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
  <div style="display:flex;flex-direction:column;gap:36px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:900px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 13</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">If you had to think, it failed</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">You said some of Lab 08 made you look twice before you understood it. That is the right call and it beats the aesthetic argument &mdash; an instrument you have to decode is <span style="color:#f0efec">slower than the plain chart it replaced</span>, and mid-set is the worst possible moment to be decoding anything.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Six of the twelve are reworked below, each shown as drawn and then as it should be. In every case the underlying data and the instrument look are kept &mdash; what changes is that the reading no longer has to be learned. The tiering underneath is the rule going forward.</p>
    </div>
    <div class="grid3">''' + cards + '''</div>

    <div style="max-width:900px;padding-top:20px;display:flex;flex-direction:column;gap:12px">
      <h2 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">The rule from here on</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Instrument styling is a <b style="color:#c9c3b6;font-weight:500">surface</b> treatment &mdash; hairlines, ticks, mono numerals, dim-versus-lit. It is not a licence to invent a new way of encoding a number. Where a bar chart is the honest answer, draw a bar chart and make it beautiful.</p>
    </div>
    <div class="tier">''' + TIERS + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab13.html','w').write(HTML)
print('wrote lab13.html', len(HTML))
