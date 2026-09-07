import re

SRC = open('lab03.html').read().split('\n')
today   = '\n'.join(SRC[38:130])   # inner of screen 1's phone frame
session = '\n'.join(SRC[140:224])  # inner of screen 2's phone frame

# baseline (gold) token -> role
BASE = {
 'ground':'#0a0908','panel':'#15130f','accent':'#d9c9a8','positive':'#8ce07f','alert':'#ff5c1a',
 'tick_off':'#2a2720','tick_mid':'#4a4638','tick_on':'#5c574b','accent_dim':'#3a362c',
 'hi':'#f6f3ec','hi2':'#efe9dc','mid':'#c9c3b6','mid2':'#a49f94','lo':'#8c8677','lo2':'#6f6a5e','chrome':'#8e8a80',
}

PALETTES = [
 ('A · Champagne gold', 'Gold is the hero. Mint reads positive, orange reserved for live and alert. Three hues.', BASE),
 ('B · Reference orange', 'Signal orange is the hero and also the live state. Mint is the only second hue. Warm lit taupe panels.',
  dict(BASE, ground='#080706', panel='#1e1a16', accent='#ff5c1a', accent_dim='#4a2b18',
       tick_off='#332d26', tick_mid='#574e42', tick_on='#6b6153')),
 ('C · Mint instrument', 'Mint carries data and progress; orange is kept purely for live and alert. Gold gone. Warm lit taupe panels.',
  dict(BASE, ground='#080706', panel='#1e1a16', accent='#8ce07f', positive='#8ce07f', accent_dim='#1f3a1c',
       tick_off='#332d26', tick_mid='#574e42', tick_on='#6b6153')),
]

def hx(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
def lum(h):
    def c(v):
        v/=255
        return v/12.92 if v<=0.03928 else ((v+0.055)/1.055)**2.4
    r,g,b = hx(h); return 0.2126*c(r)+0.7152*c(g)+0.0722*c(b)
def ratio(a,b):
    la,lb = lum(a),lum(b); la,lb = max(la,lb),min(la,lb)
    return (la+0.05)/(lb+0.05)

def recolor(html, pal):
    # ambient bloom is lighting, not accent - keep it warm in every column
    amb = dict(pal, accent=BASE['accent'], positive=BASE['positive'])
    return '\n'.join(_sub(l, amb if 'filter:blur(' in l else pal) for l in html.split('\n'))

def _sub(html, pal):
    out = html
    # longest-first so no partial hex collisions; two-pass via sentinels
    for k in BASE:
        out = out.replace(BASE[k], '\x00%s\x00' % k)
        r,g,b = hx(BASE[k])
        out = re.sub(r'rgba\(%d,\s*%d,\s*%d,' % (r,g,b), '\x01%s\x01' % k, out)
    for k,v in pal.items():
        r,g,b = hx(v)
        out = out.replace('\x00%s\x00' % k, v).replace('\x01%s\x01' % k, 'rgba(%d,%d,%d,' % (r,g,b))
    return out

def swatches(pal):
    cells = ''.join(
      '<div style="display:flex;flex-direction:column;gap:5px;align-items:flex-start">'
      '<span style="width:34px;height:34px;border-radius:9px;background:%s;border:1px solid rgba(255,255,255,0.14)"></span>'
      '<span style="font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:11px;color:#6f6c66">%s</span></div>' % (pal[k], k)
      for k in ('ground','panel','accent','positive','alert'))
    return '<div style="display:flex;gap:12px;padding:12px 0 2px">%s</div>' % cells

cols = []
for name, blurb, pal in PALETTES:
    body = ''
    for label, screen in (('Today', today), ('Live session', session)):
        body += ('<div style="display:flex;flex-direction:column;gap:8px">'
                 '<span style="font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:11px;font-weight:500;'
                 'letter-spacing:0.16em;text-transform:uppercase;color:#6f6c66">%s</span>'
                 '<div style="width:402px;height:860px;border-radius:34px;overflow:hidden;background:%s;'
                 'border:1px solid rgba(255,255,255,0.08);display:flex;flex-direction:column;position:relative">%s</div></div>'
                 % (label, pal['ground'], recolor(screen, pal)))
    r_acc  = ratio(pal['accent'], pal['panel'])
    r_pos  = ratio(pal['positive'], pal['panel'])
    r_alert= ratio(pal['alert'], pal['panel'])
    r_tick = ratio(pal['tick_on'], pal['panel'])
    meter = ('<div style="display:flex;flex-wrap:wrap;gap:6px 14px;padding-top:10px;border-top:1px solid rgba(255,255,255,0.08)">'
      + ''.join('<span style="font-family:\'JetBrains Mono\',ui-monospace,monospace;font-size:11px;color:%s">%s %.2f:1</span>'
                % ('#8ce07f' if v>=4.5 else ('#d9c9a8' if v>=3 else '#ff5c1a'), n, v)
                for n,v in (('accent/panel',r_acc),('positive/panel',r_pos),('alert/panel',r_alert),('tick-on/panel',r_tick)))
      + '</div>')
    cols.append(
      '<div style="flex:none;display:flex;flex-direction:column;gap:18px;width:402px">'
      '<div style="display:flex;flex-direction:column;gap:6px">'
      '<span style="font-size:15px;font-weight:600;letter-spacing:-0.01em;color:#f0efec">%s</span>'
      '<span style="font-size:13px;font-weight:400;line-height:1.6;color:#96938c">%s</span>%s%s</div>%s</div>'
      % (name, blurb, swatches(pal), meter, body))

HEAD = '''<!DOCTYPE html>
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
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
  body{margin:0;background:#0a0a0b;font-family:Inter,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
</style>
</helmet>

<div style="min-height:100vh;background:#0a0a0b;color:#f0efec;padding:48px 40px 96px;box-sizing:border-box">
  <div style="max-width:1500px;margin:0 auto;display:flex;flex-direction:column;gap:40px">

    <div style="display:flex;flex-direction:column;gap:16px;max-width:880px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 04</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Palette, and nothing else</h1>
      <p style="margin:0;font-size:14px;font-weight:400;line-height:1.7;color:#96938c">Identical Lab 03 markup, identical content, identical layout. The <span style="color:#f0efec">only</span> variables are the accent hue, the panel treatment, and the tick ramp that follows from them. Two screens each, because the live screen is where an orange accent has to share the stage with an orange live state.</p>
      <p style="margin:0;font-size:14px;font-weight:400;line-height:1.7;color:#6f6c66">Contrast ratios are measured against that column's own panel, not assumed. Green ≥ 4.5:1, gold ≥ 3:1, orange below 3:1.</p>
    </div>

    <div style="display:flex;gap:32px;align-items:flex-start;overflow-x:auto;padding-bottom:8px">
'''

TAIL = '''
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''

open('lab04.html','w').write(HEAD + '\n'.join(cols) + TAIL)
print('wrote lab04.html')
for name,_,pal in PALETTES:
    print(' ', name, {k: round(ratio(pal[k], pal['panel']),2) for k in ('accent','positive','alert','tick_on','hi','lo2')})
