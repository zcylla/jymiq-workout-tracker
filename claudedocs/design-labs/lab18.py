import sys; sys.path.insert(0,'.')
from pal import ratio
import colorsys
def hx(h): return tuple(int(h[i:i+2],16) for i in (1,3,5))
def hue(h):
    r,g,b=[v/255 for v in hx(h)]
    return round(colorsys.rgb_to_hls(r,g,b)[0]*360)
def mix(a,b,t):
    A,B=hx(a),hx(b)
    return '#%02x%02x%02x' % tuple(round(A[i]+(B[i]-A[i])*t) for i in range(3))

# territory, name, ground, panel, accent, done, live, character, source
P = [
 ('Warm earth','Terracotta Adobe','#221812','#3a2a1f','#cc8355','#b8bb26','#fc614e',
  'A sun-baked clay wall with Gruvbox olive dropped into it.','Gruvbox'),
 ('Warm earth','Sandstone Canyon','#1c1512','#2f241c','#d99a4e','#6db86d','#e86165',
  'Dry desert ochre, cooler and lighter than Adobe.','Radix'),
 ('Cool steel','Gunmetal Carbon','#14181c','#232830','#488bff','#42be65','#fa515a',
  'IBM&rsquo;s own enterprise dark theme. Machined, clinical, not boutique.','IBM Carbon'),
 ('Cool steel','Slate Foundry','#16191d','#262b31','#9db4c9','#3ddc97','#ff5557',
  'Desaturated blue-grey. The accent is almost a neutral.','IBM Carbon'),
 ('Deep green','Forest and Brass','#10201a','#1c322a','#c9a24a','#64a270','#ea6e72',
  'A pine-black room with brass fittings. Gold survives, the ground does not.','Radix'),
 ('Deep green','Botanical Jade','#0d1a15','#182920','#2dd4a7','#8fbf5e','#f2555a',
  'Inverts the usual assumption: jade is the accent, plain green is merely done.','Radix'),
 ('Monochrome','Achromatic Crimson','#121212','#1e1e1e','#e5e5e5','#6e8d72','#ff3b30',
  'Pure greyscale, one loaded red. Colour appears only when something is wrong.','Apple HIG'),
 ('Monochrome','Monochrome Amber','#141414','#202020','#e8b34f','#7a8c71','#e75459',
  'Greyscale with amber as the single warm intrusion.','Apple HIG'),
 ('Violet','Aubergine Nights','#1a1023','#2b1b3d','#a78bfa','#34d399','#f87171',
  'Unapologetically purple. Tailwind v4 tokens, verbatim.','Tailwind v4'),
 ('Violet','Plum Radix','#17121b','#2a1f30','#c96fd6','#5fb87a','#e85a5e',
  'Deeper magenta-plum. More nightclub than gym, and it knows it.','Radix'),
 ('Ice','Arctic Ice','#0a1418','#16262c','#22d3ee','#4ade80','#f87171',
  'The coldest palette here, and the furthest thing from champagne on the page.','Tailwind v4'),
 ('Ice','Nord Frost','#2e3440','#3b4252','#88c0d0','#a3be8c','#daa08e',
  'Nord exactly. The lightest ground of the twenty, which changes everything.','Nord'),
 ('Brutalist','Concrete Red','#000000','#1a1a1a','#ffffff','#00c853','#ff1744',
  'True black, white, and a red with no manners. Three colours, no softness.','Material'),
 ('Brutalist','Stark iOS','#0d0d0d','#1c1c1c','#ffd60a','#30d158','#ff453a',
  'Apple&rsquo;s dark system colours, unedited. High voltage but disciplined.','Apple HIG'),
 ('Heritage','Varsity Heritage','#1b1815','#2a251f','#c9972d','#709665','#db6a5f',
  'An old letterman jacket. Mustard, faded olive, brick.','Radix'),
 ('Heritage','Retro Track','#191512','#2b2420','#cf7442','#869158','#d9730d',
  'Seventies track jacket. Included as a warning &mdash; see the hue note.','Radix'),
 ('Midnight','Midnight Navy','#0b1220','#16233a','#4f8ef7','#34d399','#fb4934',
  'Clean cobalt on navy, with the Gruvbox red kept intact.','Gruvbox'),
 ('Midnight','Tokyo Night','#1a1b26','#24283b','#7aa2f7','#9ece6a','#f7768e',
  'The theme, exactly. Softer coral-red than Gruvbox.','Tokyo Night'),
 ('Copper','Copper Patina','#14201c','#1f2f29','#c58359','#33d17a','#ed695c',
  'Oxidised-teal ground under a warm copper accent. Verdigris undertone.','Radix'),
 ('Copper','Bronze Age','#1c1712','#2e251c','#b8834a','#6fae5c','#db6c65',
  'Warmer and browner than Patina. An antique medal, not machinery.','Radix'),
]
TOP5 = {'Arctic Ice','Aubergine Nights','Concrete Red','Botanical Jade','Gunmetal Carbon'}

CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;max-width:1420px}
  .card{display:flex;flex-direction:column;gap:9px}
  .top{display:flex;flex-direction:column;gap:3px}
  .top .terr{font-size:11px;letter-spacing:0.18em;color:#5f5b53;
             font-family:'Geist Mono',ui-monospace,monospace}
  .top .nm{font-size:15px;font-weight:600;color:#f0efec}
  .top .ch{font-size:12px;line-height:1.55;color:#8c8677;min-height:38px}
  .pick{display:inline-block;align-self:flex-start;padding:1px 7px;border-radius:5px;font-size:11px;
        letter-spacing:0.10em;background:rgba(140,224,127,0.15);color:#8ce07f;
        font-family:'Geist Mono',ui-monospace,monospace}
  .vig{border-radius:18px;overflow:hidden;position:relative;padding:14px;display:flex;
       flex-direction:column;gap:10px;min-height:236px}
  .vig .dots{position:absolute;inset:0;pointer-events:none;
             background-image:radial-gradient(rgba(255,255,255,0.05) 1px,transparent 1px);background-size:16px 16px}
  .pn{position:relative;z-index:1;border-radius:13px;padding:11px 12px;display:flex;flex-direction:column;gap:8px}
  .lb{font-size:11px;font-weight:500;letter-spacing:0.14em}
  .r{display:flex;align-items:center}
  .sp{flex:1}
  .sw{display:flex;gap:5px}
  .sw i{flex:1;height:22px;border-radius:5px;display:block;border:1px solid rgba(255,255,255,0.13)}
  .num{display:flex;flex-wrap:wrap;gap:3px 10px;font-family:'Geist Mono',ui-monospace,monospace;font-size:11px}
"""

def vig(g,p,a,d,l,name):
    hi   = mix(p,'#ffffff',0.90)
    mid  = mix(p,'#ffffff',0.62)
    lo   = mix(p,'#ffffff',0.38)
    off  = mix(p,'#ffffff',0.10)
    ink  = '#0d0d0d' if ratio(a,'#0d0d0d') > ratio(a,'#f6f3ec') else '#f6f3ec'
    segs = ''.join('<span style="flex:1;height:4px;border-radius:2px;background:%s"></span>'
                   % (d if i<3 else (a if i==3 else off)) for i in range(5))
    rungs = ''.join('<span style="flex:1;height:13px;border-radius:2px;background:%s%s"></span>'
                    % ((a, ';opacity:%.2f' % (0.30+0.09*i)) if i<7 else (off,'')) for i in range(10))
    return ('<div class="vig" style="background:%s;border:1px solid rgba(255,255,255,0.09)">'
      '<div class="dots"></div>'
      '<div class="r" style="position:relative;z-index:1;gap:7px">'
      '<span style="width:7px;height:7px;border-radius:9999px;background:%s"></span>'
      '<span class="mono lb" style="color:%s">LIVE</span><span class="sp"></span>'
      '<span class="mono lb" style="color:%s">00:31:17</span></div>'
      '<div class="r" style="position:relative;z-index:1;gap:4px">%s</div>'
      '<div class="pn" style="background:%s;border:1px solid rgba(255,255,255,0.08)">'
        '<div class="r" style="gap:5px;align-items:baseline">'
        '<span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.04em;line-height:1;color:%s">102.5</span>'
        '<span class="mono" style="font-size:11px;color:%s">KG</span><span class="sp"></span>'
        '<span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.04em;line-height:1;color:%s">8</span>'
        '<span class="mono" style="font-size:11px;color:%s">REPS</span></div>'
        '<div class="r" style="gap:3px">%s</div></div>'
      '<div class="r" style="position:relative;z-index:1;gap:9px">'
        '<svg viewBox="0 0 34 34" style="width:34px;height:34px;flex:none">'
        '<circle cx="17" cy="17" r="14" fill="none" stroke="%s" stroke-width="3"></circle>'
        '<circle cx="17" cy="17" r="14" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round" '
        'stroke-dasharray="88" stroke-dashoffset="32" transform="rotate(-90 17 17)"></circle></svg>'
        '<span class="mono" style="font-size:17px;font-weight:500;color:%s">01:12</span><span class="sp"></span>'
        '<div style="min-height:34px;padding:0 16px;display:flex;align-items:center;border-radius:11px;'
        'background:%s"><span style="font-size:13px;font-weight:600;color:%s">Log set</span></div></div>'
      '</div>' % (g, l, l, lo, segs, p, hi, mid, hi, mid, rungs, off, l, hi, a, ink))

def card(t,name,g,p,a,d,l,ch,src):
    ra,rd,rl = ratio(a,p), ratio(d,p), ratio(l,p)
    dh = abs(hue(l)-hue(a)); dh = min(dh, 360-dh)
    col = lambda v: '#8ce07f' if v>=4.5 else '#ff8a55'
    nums = ('<div class="num">'
            '<span style="color:%s">acc %.1f</span><span style="color:%s">done %.1f</span>'
            '<span style="color:%s">live %.1f</span>'
            '<span style="color:%s">&Delta;H %d&deg;</span>'
            '<span style="color:#55524c">%s</span></div>'
            % (col(ra),ra,col(rd),rd,col(rl),rl,
               '#8ce07f' if dh>=15 else '#e8b23a', dh, src))
    sw = '<div class="sw">' + ''.join('<i style="background:%s"></i>' % c for c in (g,p,a,d,l)) + '</div>'
    pick = '<span class="pick">WORTH A LOOK</span>' if name in TOP5 else ''
    return ('<div class="card"><div class="top"><span class="terr">%s</span><span class="nm">%s</span>'
            '<span class="ch">%s</span>%s</div>%s%s%s</div>'
            % (t.upper(), name, ch, pick, vig(g,p,a,d,l,name), sw, nums))

cards = ''.join(card(*x) for x in P)

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
  <div style="display:flex;flex-direction:column;gap:34px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:920px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 18</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Twenty worlds</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Not variations &mdash; ten different territories, two each. Every one of them moves the <span style="color:#f0efec">ground and the panel too</span>, not just the accent, because that is what actually changes the feel of a screen. Identical content in each vignette, so the only variable is colour.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Every value comes from a published system &mdash; Gruvbox, Radix, Tailwind&nbsp;v4, IBM&nbsp;Carbon, Nord, Tokyo&nbsp;Night, Material, Apple&rsquo;s own dark system colours &mdash; with the source on each card. Around fourteen needed a small lightness lift to clear 4.5:1 against their own panel; hue and saturation were held. All twenty pass now, and <span style="color:#96938c">live is red in eighteen of them</span>, as you asked.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Two things worth knowing before you look. <span style="color:#96938c">Retro Track</span> is a deliberate cautionary entry: its live sits 9&deg; from its accent, which is exactly the trap champagne-and-amber fell into &mdash; leave red for live and hue collision with a warm accent becomes very hard to avoid. And the competitive check came back pointed: Strava ships <span class="mono" style="font-size:13px;color:#8c8677">#FC4C02</span> and Whoop runs red on near-black, so the shipping field skews stark and red-forward, not warm and gilded.</p>
    </div>
    <div class="grid">''' + cards + '''</div>

    <div style="max-width:920px;padding-top:20px;display:flex;flex-direction:column;gap:10px">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">Five to actually consider</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Chosen for distance from where you already are, not for how safe they look. <b style="color:#c9c3b6;font-weight:500">Arctic Ice</b> is the furthest thing on the page from champagne on near-black and still clears everything. <b style="color:#c9c3b6;font-weight:500">Aubergine Nights</b> is a hue you have never mentioned in either direction. <b style="color:#c9c3b6;font-weight:500">Concrete Red</b> is the most extreme departure and, awkwardly, the closest to what the category actually ships. <b style="color:#c9c3b6;font-weight:500">Botanical Jade</b> keeps green but promotes it from state to identity. <b style="color:#c9c3b6;font-weight:500">Gunmetal Carbon</b> is the only one that reads as instrument panel rather than app.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Tell me which two or three are worth seeing properly and I will build them out at full screen size, the way Lab&nbsp;14 was.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab18.html','w').write(HTML)
print('wrote lab18.html', len(HTML))
