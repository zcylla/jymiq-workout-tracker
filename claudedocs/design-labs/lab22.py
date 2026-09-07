import sys, colorsys; sys.path.insert(0,'.')
import lab05
from pal import ratio, hx

def hex_(h,s,l):
    r,g,b = colorsys.hls_to_rgb(h/360.0, l/100.0, s/100.0)
    return '#%02x%02x%02x' % tuple(round(v*255) for v in (r,g,b))

A0,A1 = (40,39,76),(40,84,68)
D0,D1 = (74,26,48),(62,74,43)
L0,L1 = (8,48,54),(6,94,59)

STEPS = [
 ('V0','As it is now','Champagne S39, dusty olive, oxblood.',
  'The baseline, unchanged. Everything to the right of this only turns one dial.'),
 ('V1','A quarter turn','Barely different, and that is the point.',
  'If the current palette already feels close, this is the smallest move that registers at all. Gold picks up warmth without changing character.'),
 ('V2','Halfway','The gold starts reading as gold.',
  'Around here the accent stops being parchment and becomes a metal. The olive loses its dust; the red stops apologising.'),
 ('V3','Three quarters','Confident.',
  'Probably the useful ceiling for a screen you look at mid-set. Still warm, still restrained, but nothing on it is muted any more.'),
 ('V4','Fully vivid','As far as this hue family goes.',
  'Maximum chroma while holding the hues. Reads energetic rather than premium &mdash; useful to see so you know where the edge is.'),
]

def pal(t):
    lerp = lambda a,b: tuple(a[k]+(b[k]-a[k])*t for k in range(3))
    A,D,L = lerp(A0,A1), lerp(D0,D1), lerp(L0,L1)
    return hex_(*A), hex_(*D), hex_(*L), A, D, L

base = lab05.SKIN_CSS['S1']
def skin(cls, a, d, l):
    body = base.replace('.S1 ', '.%s ' % cls)
    head, rest = body.split('}', 1)
    head = (head.replace('--accent:#d9c9a8;', '--accent:%s;' % a)
                .replace('--pos:#8ce07f;', '--pos:%s;' % d)
                .replace('--live:#ff5c1a;', '--live:%s;' % l))
    r,g,b = hx(a)
    plate = '--plate-r:#c0392b;--plate-y:#d4a017;--plate-w:#d0cbc2;--plate-b:#2f6fb0;--plate-g:#3f7a52;'
    return ('.%s{%s%s}%s\n.%s .b1{background:rgba(%d,%d,%d,0.20)}' % (cls, plate, head, rest, cls, r, g, b))

css = lab05.BASE_CSS + '\n'.join(
  skin(s[0], *pal(i/4.0)[:3]) for i, s in enumerate(STEPS)) + """
  .sw{display:flex;gap:8px;padding:10px 0 0}
  .sw div{flex:1;display:flex;flex-direction:column;gap:5px}
  .sw i{height:36px;border-radius:8px;display:block;border:1px solid rgba(255,255,255,0.14)}
  .sw b{font-size:11px;font-weight:400;letter-spacing:0.03em;color:#6f6c66;
        font-family:'Geist Mono',ui-monospace,monospace}
  .sw s{text-decoration:none;font-size:11px;color:#55524c;
        font-family:'Geist Mono',ui-monospace,monospace}
  .cr{display:flex;flex-wrap:wrap;gap:4px 12px;padding-top:9px;margin-top:9px;
      border-top:1px solid rgba(255,255,255,0.08);
      font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;color:#8ce07f}
"""

def col(i, st):
    cls, name, sub, note = st
    a,d,l,A,D,L = pal(i/4.0)
    sw = '<div class="sw">' + ''.join(
      '<div><i style="background:%s"></i><b>%s</b><s>S%02.0f</s></div>' % (c, n, S[1])
      for c, n, S in [(a,'accent',A),(d,'done',D),(l,'live',L)]) + '</div>'
    cr = ('<div class="cr">%s &nbsp;&middot;&nbsp; %s &nbsp;&middot;&nbsp; %s</div>'
          % tuple('%.1f:1' % ratio(c,'#15130f') for c in (a,d,l)))
    return ('<div class="col"><div class="cap" style="min-height:154px">'
            '<span class="k">%s</span><span class="t">%s</span>'
            '<span class="d" style="color:#d9c9a8">%s</span><span class="d">%s</span>%s%s</div>%s</div>'
            % (cls, name, sub, note, sw, cr, lab05.screen(cls)))

cols = ''.join(col(i, st) for i, st in enumerate(STEPS))

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
  <div style="display:flex;flex-direction:column;gap:34px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:920px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 22</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">One dial, five positions</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">You want the palette you already have, with more in it. So this changes exactly one thing: <span style="color:#f0efec">saturation</span>. Ground, panels, text ramp, tick ramp, layout and content are identical across all five. The hues barely move &mdash; gold stays at 40&deg;, the olive drifts twelve degrees toward its richer neighbours, the red stays red.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Live is red throughout, as you asked, running from the oxblood you found dull up to Gruvbox&rsquo;s bright red. Every step clears 4.5:1 against the panel &mdash; the numbers are under each column. My own read is that <span style="color:#96938c">V2 or V3</span> is where the gold stops being parchment and starts being metal, without tipping into the electric register you rejected twice.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The plate card is also fixed here: real loading (25&thinsp;+&thinsp;15&thinsp;+&thinsp;1.25), real geometry, competition colours as the default per your Lab&nbsp;17 call.</p>
    </div>
    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab22.html','w').write(HTML)
print('wrote lab22.html', len(HTML))
