import sys; sys.path.insert(0,'.')
import lab05, colorsys
from pal import ratio, hx

def hsl(h):
    r,g,b=[v/255 for v in hx(h)]
    hh,ll,ss = colorsys.rgb_to_hls(r,g,b)
    return round(hh*360), round(ss*100), round(ll*100)

GOLD='#d9c9a8'
PALS = [
 ('Q1','Olive + amber','The direct upgrade','#98971a','#d97706',
  'Your olive, but with the dust taken out &mdash; Gruvbox&rsquo;s neutral green is the same hue at nearly three times the chroma. '
  'Paired with a clean modern amber that is deeper and further from the gold than the one in palette 5.'),
 ('Q2','Olive + burnt orange','Warmest of the six','#98971a','#d65d0e',
  'Same olive, and the alert side goes to a fired burnt orange rather than an amber. The furthest from gold of any live candidate here, '
  'so the three hues never argue &mdash; at the cost of sitting closest to the signal orange you already rejected.'),
 ('Q3','Olive + your amber','Palette 5&rsquo;s live, kept','#98971a','#c9922e',
  'The amber you picked out of palette 5, on the richer olive. Read the warning under this board before choosing it: '
  'this amber is 1.7&deg; from the gold in hue. Only lightness and chroma keep them apart.'),
 ('Q4','Forest + amber','Less olive, more green','#24a148','#d97706',
  'IBM Carbon&rsquo;s success green. Unambiguously a green rather than a khaki, crisper and more legible at small sizes, '
  'but it steps out of the moss family the gold sits so comfortably beside.'),
 ('Q5','Emerald + burnt orange','The premium read','#30a46c','#d65d0e',
  'Radix&rsquo;s forest emerald. The most contemporary-looking pair here and the least earthy &mdash; closer to a finance dashboard '
  'than to a gym. Included because it photographs extremely well against the gold.'),
 ('Q6','Chartreuse + brick','The loud one','#b8bb26','#fb4934',
  'Gruvbox&rsquo;s bright green and bright red. Genuinely vivid, highest contrast of the six, and the one to check hardest against '
  'your own veto &mdash; the green leans back toward the lime you rejected.'),
]

base = lab05.SKIN_CSS['S1']
plate = '--plate-b:#2f6fb0;--plate-g:#3f7a52;--plate-w:#d0cbc2;'
def skin(cls, pos, live):
    body = base.replace('.S1 ', '.%s ' % cls)
    head, rest = body.split('}', 1)
    head = head.replace('--pos:#8ce07f;', '--pos:%s;' % pos).replace('--live:#ff5c1a;', '--live:%s;' % live)
    r,g,b = hx(pos)
    return ('.%s{%s%s}%s\n.%s .b2{background:rgba(%d,%d,%d,0.13)}' % (cls, plate, head, rest, cls, r, g, b))

css = lab05.BASE_CSS + '\n'.join(skin(p[0], p[3], p[4]) for p in PALS) + """
  .sw{display:flex;gap:8px;padding:10px 0 0}
  .sw div{flex:1;display:flex;flex-direction:column;gap:5px}
  .sw i{height:34px;border-radius:8px;display:block;border:1px solid rgba(255,255,255,0.14)}
  .sw span{font-size:11px;letter-spacing:0.03em;color:#6f6c66;
           font-family:'Geist Mono',ui-monospace,monospace}
  .cr{display:flex;flex-wrap:wrap;gap:4px 12px;padding-top:9px;margin-top:9px;
      border-top:1px solid rgba(255,255,255,0.08);
      font-family:'Geist Mono',ui-monospace,monospace;font-size:11px}
  .warn{border:1px solid rgba(232,178,58,0.34);background:rgba(232,178,58,0.06);border-radius:14px;
        padding:16px 18px;display:flex;flex-direction:column;gap:8px;max-width:920px}
  .warn h3{margin:0;font-size:14px;font-weight:600;color:#e8b23a}
  .warn p{margin:0;font-size:13px;line-height:1.65;color:#a49f94}
  .warn b{color:#c9c3b6;font-weight:500}
"""

def col(p):
    cls, name, sub, pos, live, note = p
    hp, hl, hg = hsl(pos), hsl(live), hsl(GOLD)
    rp, rl = ratio(pos,'#15130f'), ratio(live,'#15130f')
    sw = '<div class="sw">' + ''.join(
      '<div><i style="background:%s"></i><span>%s</span><span style="color:#55524c">%s</span></div>'
      % (c, n, '%d&deg; %d%% %d%%' % hsl(c)) for c, n in
      [(GOLD,'accent'), (pos,'done'), (live,'live')]) + '</div>'
    cr = ('<div class="cr"><span style="color:%s">done %.2f:1</span>'
          '<span style="color:%s">live %.2f:1</span>'
          '<span style="color:%s">live vs gold &Delta;H %d&deg;</span></div>'
          % ('#8ce07f' if rp>=4.5 else '#ff8a55', rp,
             '#8ce07f' if rl>=4.5 else '#ff8a55', rl,
             '#8ce07f' if abs(hl[0]-hg[0])>=12 else '#e8b23a', abs(hl[0]-hg[0])))
    return ('<div class="col"><div class="cap" style="min-height:176px">'
            '<span class="k">%s</span><span class="t">%s</span><span class="d" style="color:#d9c9a8">%s</span>'
            '<span class="d">%s</span>%s%s</div>%s</div>'
            % (cls, name, sub, note, sw, cr, lab05.screen(cls)))

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
  <div style="display:flex;flex-direction:column;gap:32px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:920px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 14</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Same shade, more of it</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">You wanted palette 3&rsquo;s olive with the dullness taken out. That is a saturation move, not a hue move &mdash; so the hue is held and the chroma goes up. Every value here is lifted from a real published palette rather than invented: <span style="color:#f0efec">Gruvbox, IBM Carbon, Radix, Tailwind and Open Color</span>, with the source named on each column.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Two things also changed inside the screen. The <span style="color:#96938c">RPE ladder is now zoned</span> &mdash; green is submaximal, gold is the target band, orange is near failure &mdash; which is what finally puts palette colour into the weight card, and it earns its place because the colour <em>is</em> the reading. And the tuner tape now has three tick weights instead of two, so the half-kilo gradations are actually visible.</p>
    </div>

    <div class="warn">
      <h3>One honest caution about amber</h3>
      <p>Champagne gold sits at <b>hue 40&deg;</b>. The amber from palette 5 sits at <b>hue 39&deg;</b>. They are the same hue &mdash; the only reason they read as different colours is that gold is pale and washed (S39 L76) while the amber is mid-value and saturated (S63 L48). That works, but it is fragile: any later pass that lightens or softens the amber collapses the distinction, because there is no hue gap to fall back on. The ambers in Q1 and Q2 sit at <b>32&deg; and 24&deg;</b>, which buys a real buffer. If you take Q3, the rule is that live must stay below 55% lightness and above 55% saturation, permanently.</p>
    </div>

    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab14.html','w').write(HTML)
print('wrote lab14.html', len(HTML))
