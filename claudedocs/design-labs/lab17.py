# Lab 17 - the plate card. Five treatments of one readout.
# Loading is 102.5 kg on a 20 kg bar = 41.25 per side = 25 + 15 + 1.25.
# Geometry is real: height is plate diameter, width is plate thickness.
PLATES = [  # kg, diameter mm, thickness mm, IWF colour
 ('25',   450, 67, '#c0392b'),
 ('15',   400, 43, '#d4a017'),
 ('1.25', 160, 16, '#c9c4bb'),
]
H = lambda d: round(d * 0.1244)
W = lambda t: max(7, round(t * 0.42))

CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--panel:#15130f;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;
        --hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b;
        --tick1:#5a5449;--tick2:#7d7666;--tick3:#a8a091}
  .grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:24px;max-width:960px}
  .wrap{display:flex;flex-direction:column;gap:12px}
  .hd{display:flex;flex-direction:column;gap:4px}
  .hd .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .hd .t{font-size:16px;font-weight:600;color:#f0efec}
  .hd .s{font-size:12px;color:#d9c9a8}
  .ctx{width:402px;padding:16px;border-radius:26px;background:#0a0908;border:1px solid rgba(255,255,255,0.07);
       background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:18px 18px}
  .card{background:var(--panel);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:13px 15px;
        display:flex;flex-direction:column;gap:9px}
  .why{font-size:12px;line-height:1.6;color:#8c8677;max-width:402px}
  .why b{color:#c9c3b6;font-weight:500}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}
  .stack{display:flex;align-items:center;gap:3px}
  .plate{border-radius:2px;flex:none}
  .barline{height:5px;border-radius:2px;background:linear-gradient(#a8a091,#6f6a5e);flex:none}
  .sleeve{height:9px;border-radius:2px;background:linear-gradient(#8c8677,#4a4638);flex:none}
"""

def head(sub='41.25 KG'):
    return ('<div class="r"><span class="mono lbl">PER SIDE &middot; 20 KG BAR</span><span class="sp"></span>'
            '<span class="mono lbl">%s</span></div>' % sub)

# A - competition colours, as drawn
def A():
    chips = ''.join('<span class="plate" style="width:%dpx;height:%dpx;background:%s"></span>'
                    % (W(t), H(d), c) for _, d, t, c in PLATES)
    nums = ''.join('<span class="mono" style="width:%dpx;text-align:center;font-size:11px;color:var(--dim)">%s</span>'
                   % (W(t), n) for n, d, t, _ in PLATES)
    return ('<div class="card">' + head() +
            '<div class="stack" style="align-items:flex-end;height:58px">' + chips +
            '<span class="sp"></span><span class="mono" style="font-size:11px;color:var(--dim)">+ COLLAR</span></div>'
            '<div class="stack">' + nums + '</div></div>')

# B - one hue, weight by opacity
def B():
    ops = [1.0, 0.62, 0.34]
    chips = ''.join('<span class="plate" style="width:%dpx;height:%dpx;background:var(--accent);opacity:%.2f"></span>'
                    % (W(t), H(d), o) for (_, d, t, _), o in zip(PLATES, ops))
    nums = ''.join('<span class="mono" style="width:%dpx;text-align:center;font-size:11px;color:var(--dim)">%s</span>'
                   % (W(t), n) for n, d, t, _ in PLATES)
    return ('<div class="card">' + head() +
            '<div class="stack" style="align-items:flex-end;height:58px">' + chips +
            '<span class="sp"></span><span class="mono" style="font-size:11px;color:var(--dim)">+ COLLAR</span></div>'
            '<div class="stack">' + nums + '</div></div>')

# C - neutral ramp, accent only on the first plate you load
def C():
    cols = ['var(--accent)', 'var(--tick3)', 'var(--tick1)']
    chips = ''.join('<span class="plate" style="width:%dpx;height:%dpx;background:%s"></span>'
                    % (W(t), H(d), c) for (_, d, t, _), c in zip(PLATES, cols))
    nums = ''.join('<span class="mono" style="width:%dpx;text-align:center;font-size:11px;color:var(--dim)">%s</span>'
                   % (W(t), n) for n, d, t, _ in PLATES)
    return ('<div class="card">' + head() +
            '<div class="stack" style="align-items:flex-end;height:58px">' + chips +
            '<span class="sp"></span><span class="mono" style="font-size:11px;color:var(--dim)">+ COLLAR</span></div>'
            '<div class="stack">' + nums + '</div></div>')

# D - outlined, numeral inside the plate
def D():
    chips = ''.join('<span class="plate" style="width:%dpx;height:%dpx;background:rgba(217,201,168,0.09);'
                    'border:1px solid var(--accent);display:flex;align-items:center;justify-content:center">'
                    '<span class="mono" style="font-size:11px;color:var(--accent);'
                    'writing-mode:vertical-rl;letter-spacing:0.04em">%s</span></span>'
                    % (max(18, W(t)), H(d), n) for n, d, t, _ in PLATES)
    return ('<div class="card">' + head() +
            '<div class="stack" style="align-items:flex-end;height:58px;gap:5px">' + chips +
            '<span class="sp"></span><span class="mono" style="font-size:11px;color:var(--dim)">+ COLLAR 2.5</span></div></div>')

# E - the actual bar
def E():
    left = ''.join('<span class="plate" style="width:%dpx;height:%dpx;background:var(--accent);opacity:%.2f"></span>'
                   % (W(t), H(d), o) for (_, d, t, _), o in zip(reversed(PLATES), [0.34, 0.62, 1.0]))
    right = ''.join('<span class="plate" style="width:%dpx;height:%dpx;background:var(--accent);opacity:%.2f"></span>'
                    % (W(t), H(d), o) for (_, d, t, _), o in zip(PLATES, [1.0, 0.62, 0.34]))
    nums = ''.join('<span class="mono" style="width:%dpx;text-align:center;font-size:11px;color:var(--dim)">%s</span>'
                   % (W(t), n) for n, d, t, _ in PLATES)
    return ('<div class="card">' + head('102.5 KG TOTAL') +
            '<div class="stack" style="align-items:center;height:58px;gap:2px;justify-content:center">'
            '<span class="sleeve" style="width:12px"></span>' + left +
            '<span class="barline" style="flex:1"></span>' + right +
            '<span class="sleeve" style="width:12px"></span></div>'
            '<div class="r"><span class="sp"></span><div class="stack" style="gap:3px">' + nums +
            '</div><span style="width:14px"></span></div></div>')

CARDS = [
 ('A','Competition colours','As drawn today',
  A(), 'The real IWF coding &mdash; 25 red, 15 yellow, 1.25 chrome. Every lifter already reads these without thinking, '
       'so it is the only version that carries information the numbers do not. The cost is that it drags three hues '
       'into a palette built around one, and on this screen those hues have no relationship to anything else.'),
 ('B','One hue, opacity for weight','Palette-pure',
  B(), 'Champagne at three strengths. Nothing off-palette, and the plate <b>sizes</b> still do the identifying &mdash; '
       'the geometry is real, so a 25 and a 1.25 are unmistakable without colour. This is the same trick the RPE ladder uses.'),
 ('C','Neutral, accent on the first plate','Loading order',
  C(), 'A neutral ramp with the accent reserved for the heaviest plate &mdash; the one you load first. '
       'Reads as a sequence rather than a set, which is closer to what you actually do at the rack.'),
 ('D','Outlined, numeral inside','Most instrument',
  D(), 'No fills at all. Each plate is a hairline rectangle at its real proportions with its own weight set inside it. '
       'Driest of the five and the most consistent with the tick rails everywhere else, but the smallest plate gets tight.'),
 ('E','Draw the bar','Literal',
  E(), 'The whole barbell, both sides, sleeves included. It is the only version where the readout looks like the thing '
       'it describes, and total-vs-per-side stops being ambiguous. Costs the most horizontal room of the five.'),
]

cards = ''.join(
  '<div class="wrap"><div class="hd"><span class="k">%s</span><span class="t">%s</span>'
  '<span class="s">%s</span></div><div class="ctx">%s</div><span class="why">%s</span></div>' % c
  for c in CARDS)

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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 17</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">The plate card</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Now I understand which card you meant. You are right that it is the one thing on the screen wearing colours from nowhere &mdash; blue, green and white, none of which appear anywhere else in the app.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">It also had a real bug: it showed 20&thinsp;+&thinsp;20&thinsp;+&thinsp;10&thinsp;+&thinsp;2.5, which is 52.5&thinsp;kg per side, under a label reading 41.25. Fixed everywhere &mdash; 102.5 on a 20&thinsp;kg bar is <span style="color:#96938c">25&thinsp;+&thinsp;15&thinsp;+&thinsp;1.25</span> per side. The plate geometry is now real too: height is the plate&rsquo;s diameter, width is its thickness, both to scale. That matters, because once the sizes are honest they do the identifying and the colour becomes optional.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The RPE ladder is also reverted &mdash; back to one hue with opacity carrying the level, as it was.</p>
    </div>
    <div class="grid">''' + cards + '''</div>

    <div style="max-width:920px;padding-top:12px;display:flex;flex-direction:column;gap:10px">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">The one argument for keeping A</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Competition plate colours are not decoration &mdash; they are a real code that lifters read across a gym floor, and A is the only option that carries something the numerals do not. If you keep it, the honest framing is the same one the design already uses for it: these are <b style="color:#c9c3b6;font-weight:500">referential</b> colours depicting physical objects, deliberately outside the palette, and they may never be used for UI state. If that exemption feels like special pleading, take B &mdash; the real geometry means nothing is actually lost.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab17.html','w').write(HTML)
print('wrote lab17.html', len(HTML))
