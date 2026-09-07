import sys, re; sys.path.insert(0, '.')
import lab05
from pal import ratio, hx

# gold accent is fixed. only the two STATE hues move.
PALS = [
 ('P1','Current','Lime + signal orange','#8ce07f','#ff5c1a',
  'What labs 03 to 09 use. Both state hues are high-chroma and sit outside the warm family everything else lives in.'),
 ('P2','Sage + terracotta','Muted, both warm-leaning','#7d9471','#c4633f',
  'The closest to the champagne family. Neither hue announces itself; the green reads as settled rather than electric, and the terracotta is a fired clay rather than a warning light.'),
 ('P3','Olive + oxblood','Deep and editorial','#8a9a5b','#c56050',
  'The most restrained pair. Olive carries a faint yellow that ties directly into the gold. Oxblood is the least alarming red here, which is a risk as much as a feature.'),
 ('P4','Teal + rust','The only cool positive','#5f9e94','#c3623e',
  'Teal is the one candidate that steps outside the warm family on purpose, which buys the widest separation between done and live. Rust keeps the alert side earthy.'),
 ('P5','Eucalyptus + amber','Softest of the six','#9db89a','#c9922e',
  'Everything low-chroma. Reads calm and expensive, but amber sits close enough to the gold accent that live and current can blur at a glance. Watch that on the set meter.'),
 ('P6','Pine + crimson','Deepest, widest gap','#598967','#ca5d5d',
  'The most contrast between the two states. Pine had to be lifted from a true forest green to clear 4.5:1 on the panel; below that it disappears against the ground.'),
]

# rebuild the S1 glass skin under one class per palette
base_skin = lab05.SKIN_CSS['S1']
plate_vars = '--plate-b:#2f6fb0;--plate-g:#3f7a52;--plate-w:#d0cbc2;'

def skin(cls, pos, live):
    body = base_skin.replace('.S1 ', '.%s ' % cls)
    head, rest = body.split('}', 1)
    head = head.replace('--pos:#8ce07f;', '--pos:%s;' % pos).replace('--live:#ff5c1a;', '--live:%s;' % live)
    r, g, b = hx(pos)
    extra = ('\n.%s .b2{background:rgba(%d,%d,%d,0.12)}' % (cls, r, g, b))
    return '.%s{%s%s}%s%s' % (cls, plate_vars, head, rest, extra)

css = lab05.BASE_CSS + '\n'.join(skin(p[0], p[3], p[4]) for p in PALS) + """
  .sw{display:flex;gap:9px;padding:10px 0 2px}
  .sw div{display:flex;flex-direction:column;gap:5px;align-items:flex-start}
  .sw i{width:32px;height:32px;border-radius:9px;display:block;border:1px solid rgba(255,255,255,0.14)}
  .sw span{font-size:11px;letter-spacing:0.04em;color:#6f6c66;font-family:'Geist Mono',ui-monospace,monospace}
  .cr{display:flex;flex-wrap:wrap;gap:5px 13px;padding-top:9px;border-top:1px solid rgba(255,255,255,0.08);
      font-family:'Geist Mono',ui-monospace,monospace;font-size:11px}
"""

def col(p):
    cls, name, sub, pos, live, note = p
    rp, rl = ratio(pos, '#15130f'), ratio(live, '#15130f')
    sw = ('<div class="sw">'
      + ''.join('<div><i style="background:%s"></i><span>%s</span></div>' % (c, n)
                for c, n in [('#d9c9a8','accent'), (pos,'done'), (live,'live')])
      + '</div>')
    cr = ('<div class="cr">'
      '<span style="color:%s">done %.2f:1</span>'
      '<span style="color:%s">live %.2f:1</span>'
      '<span style="color:#6f6c66">accent 11.37:1</span></div>'
      % ('#8ce07f' if rp >= 4.5 else '#ff8a55', rp, '#8ce07f' if rl >= 4.5 else '#ff8a55', rl))
    return ('<div class="col"><div class="cap" style="min-height:150px">'
            '<span class="k">%s</span><span class="t">%s</span>'
            '<span class="d">%s</span><span class="d" style="color:#7d786e">%s</span>%s%s</div>%s</div>'
            % (cls.replace('P', 'PALETTE '), name, sub, note, sw, cr, lab05.screen(cls)))

cols = ''.join(col(p) for p in PALS)

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
<style>''' + css + '''</style>
</helmet>

<div style="min-height:100vh;background:#0a0a0b;color:#f0efec;padding:48px 40px 96px">
  <div style="display:flex;flex-direction:column;gap:40px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:900px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 10</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">The other two hues</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Champagne gold is fixed &mdash; it was the part of palette A you liked, so it does not move. Ground, panels, the text ramp and the tick ramp are all identical too. The <span style="color:#f0efec">only</span> variables are the two state hues: what <em>done</em> looks like, and what <em>live</em> looks like.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Every candidate was pushed up in lightness until it cleared 4.5:1 against the panel, hue and saturation held. Pine and oxblood needed it; the rest passed as drawn. The plate chips stay blue, green and white throughout &mdash; those reproduce competition plate colour-coding, so they are referential and sit outside the palette entirely.</p>
    </div>
    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab10.html','w').write(HTML)
print('wrote lab10.html', len(HTML))
