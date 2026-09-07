import sys; sys.path.insert(0,'.')
import lab05

VARS = ('--ground:#0a0908;--panel:#15130f;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;'
        '--hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b;'
        '--plate-b:#2f6fb0;--plate-g:#3f7a52;--plate-w:#d0cbc2;')

DOTS = ('background-image:radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px);'
        'background-size:18px 18px')

# a genuinely busy field: dot grid + a tick rail + a soft band chart, so blur has something to refract
RICH = ("""
.G6 .field{__DOTS__}
.G6 .field::before{content:'';position:absolute;left:0;right:0;top:150px;height:220px;
  background:repeating-linear-gradient(90deg, rgba(255,255,255,0.11) 0 1px, transparent 1px 9px)}
.G6 .field::after{content:'';position:absolute;left:0;right:0;top:390px;height:260px;
  background:
    linear-gradient(90deg, rgba(217,201,168,0.13), rgba(140,224,127,0.10) 46%, rgba(255,92,26,0.11)),
    repeating-linear-gradient(90deg, rgba(255,255,255,0.07) 0 1px, transparent 1px 15px);
  clip-path:polygon(0% 78%,7% 62%,14% 70%,21% 44%,28% 55%,35% 30%,42% 41%,49% 22%,
                    56% 34%,63% 16%,70% 27%,77% 12%,84% 24%,92% 8%,100% 18%,100% 100%,0% 100%)}
""")

SKINS = {

'G1': """
.G1 .field{__DOTS__}
.G1 .panel{background:#15130f;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:13px 15px;
           display:flex;flex-direction:column;position:relative}
.G1 .hero{background:rgba(255,255,255,0.08);backdrop-filter:blur(28px) saturate(180%);
          -webkit-backdrop-filter:blur(28px) saturate(180%);
          border:0.5px solid rgba(255,255,255,0.18);border-radius:22px;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.35)}
.G1 .chip{background:rgba(255,255,255,0.10);backdrop-filter:blur(20px) saturate(180%);
          -webkit-backdrop-filter:blur(20px) saturate(180%);
          border:0.5px solid rgba(255,255,255,0.18);border-radius:12px;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.35);color:var(--hi)}
.G1 .key{background:var(--accent);color:#15130f;border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)}
.G1 .keyS{background:rgba(255,255,255,0.10);border:0.5px solid rgba(255,255,255,0.18);border-radius:10px;color:var(--hi)}
.G1 .divider{background:rgba(255,255,255,0.08)}
.G1 .seg,.G1 .rung,.G1 .plate,.G1 .qbar{border-radius:2px}
""",

'G2': """
.G2 .field{__DOTS__}
.G2 .panel{background:#15130f;border:1px solid rgba(255,255,255,0.07);border-radius:18px;padding:13px 15px;
           display:flex;flex-direction:column;position:relative}
.G2 .hero{background:rgba(255,255,255,0.035);backdrop-filter:blur(12px) saturate(140%);
          -webkit-backdrop-filter:blur(12px) saturate(140%);
          border:0.5px solid rgba(255,255,255,0.10);border-top-color:rgba(255,255,255,0.42);border-radius:22px;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.16)}
.G2 .chip{background:rgba(255,255,255,0.05);backdrop-filter:blur(10px);-webkit-backdrop-filter:blur(10px);
          border:0.5px solid rgba(255,255,255,0.12);border-top-color:rgba(255,255,255,0.38);
          border-radius:12px;color:var(--hi)}
.G2 .key{background:var(--accent);color:#15130f;border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)}
.G2 .keyS{background:rgba(255,255,255,0.05);border:0.5px solid rgba(255,255,255,0.12);border-radius:10px;color:var(--hi)}
.G2 .divider{background:rgba(255,255,255,0.07)}
.G2 .seg,.G2 .rung,.G2 .plate,.G2 .qbar{border-radius:2px}
""",

'G3': """
.G3 .field{__DOTS__}
.G3 .panel{background:#15130f;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:13px 15px;
           display:flex;flex-direction:column;position:relative}
.G3 .hero{background:rgba(255,255,255,0.105);backdrop-filter:blur(46px) saturate(210%) brightness(1.08);
          -webkit-backdrop-filter:blur(46px) saturate(210%) brightness(1.08);
          border:1px solid rgba(255,255,255,0.22);border-radius:26px;
          box-shadow:inset 0 2px 0 rgba(255,255,255,0.46), inset 0 0 0 1px rgba(255,255,255,0.07),
                     inset 0 -3px 6px rgba(0,0,0,0.34), 0 16px 44px rgba(0,0,0,0.52)}
.G3 .chip{background:rgba(255,255,255,0.13);backdrop-filter:blur(36px) saturate(200%);
          -webkit-backdrop-filter:blur(36px) saturate(200%);
          border:1px solid rgba(255,255,255,0.22);border-radius:14px;
          box-shadow:inset 0 2px 0 rgba(255,255,255,0.44), 0 6px 18px rgba(0,0,0,0.45);color:var(--hi)}
.G3 .key{background:var(--accent);color:#15130f;border-radius:16px;
         box-shadow:inset 0 2px 0 rgba(255,255,255,0.62), 0 6px 18px rgba(0,0,0,0.45)}
.G3 .keyS{background:rgba(255,255,255,0.13);border:1px solid rgba(255,255,255,0.22);border-radius:12px;color:var(--hi)}
.G3 .divider{background:rgba(255,255,255,0.10)}
.G3 .seg,.G3 .rung,.G3 .plate,.G3 .qbar{border-radius:2px}
""",

'G4': """
.G4 .field{__DOTS__}
.G4 .panel{background:#15130f;border:1px solid rgba(217,201,168,0.10);border-radius:18px;padding:13px 15px;
           display:flex;flex-direction:column;position:relative}
.G4 .hero{background:rgba(217,201,168,0.10);backdrop-filter:blur(30px) saturate(190%);
          -webkit-backdrop-filter:blur(30px) saturate(190%);
          border:0.5px solid rgba(217,201,168,0.30);border-radius:22px;
          box-shadow:inset 0 1px 0 rgba(247,238,219,0.40), inset 0 -1px 0 rgba(0,0,0,0.22),
                     0 8px 26px rgba(0,0,0,0.38)}
.G4 .chip{background:rgba(217,201,168,0.13);backdrop-filter:blur(22px) saturate(190%);
          -webkit-backdrop-filter:blur(22px) saturate(190%);
          border:0.5px solid rgba(217,201,168,0.30);border-radius:12px;
          box-shadow:inset 0 1px 0 rgba(247,238,219,0.40);color:var(--hi)}
.G4 .key{background:var(--accent);color:#15130f;border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)}
.G4 .keyS{background:rgba(217,201,168,0.13);border:0.5px solid rgba(217,201,168,0.30);border-radius:10px;color:var(--hi)}
.G4 .divider{background:rgba(217,201,168,0.16)}
.G4 .seg,.G4 .rung,.G4 .plate,.G4 .qbar{border-radius:2px}
""",

'G5': """
.G5 .field{__DOTS__}
.G5 .panel{background:rgba(255,255,255,0.055);backdrop-filter:blur(22px) saturate(170%);
           -webkit-backdrop-filter:blur(22px) saturate(170%);
           border:0.5px solid rgba(255,255,255,0.14);border-radius:18px;padding:13px 15px;
           display:flex;flex-direction:column;position:relative;
           box-shadow:inset 0 1px 0 rgba(255,255,255,0.26), 0 6px 18px rgba(0,0,0,0.30)}
.G5 .hero{background:rgba(255,255,255,0.09);backdrop-filter:blur(30px) saturate(185%);
          -webkit-backdrop-filter:blur(30px) saturate(185%);
          border:0.5px solid rgba(255,255,255,0.20);border-radius:22px;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.38), 0 10px 28px rgba(0,0,0,0.38)}
.G5 .chip{background:rgba(255,255,255,0.12);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
          border:0.5px solid rgba(255,255,255,0.20);border-radius:12px;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.35);color:var(--hi)}
.G5 .key{background:var(--accent);color:#15130f;border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)}
.G5 .keyS{background:rgba(255,255,255,0.12);border:0.5px solid rgba(255,255,255,0.20);border-radius:10px;color:var(--hi)}
.G5 .divider{background:rgba(255,255,255,0.12)}
.G5 .seg,.G5 .rung,.G5 .plate,.G5 .qbar{border-radius:2px}
""",

'G6': RICH + """
.G6 .panel{background:rgba(16,14,11,0.80);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
           border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:13px 15px;
           display:flex;flex-direction:column;position:relative}
.G6 .hero{background:rgba(255,255,255,0.08);backdrop-filter:blur(28px) saturate(180%);
          -webkit-backdrop-filter:blur(28px) saturate(180%);
          border:0.5px solid rgba(255,255,255,0.18);border-radius:22px;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.35)}
.G6 .chip{background:rgba(255,255,255,0.10);backdrop-filter:blur(20px) saturate(180%);
          -webkit-backdrop-filter:blur(20px) saturate(180%);
          border:0.5px solid rgba(255,255,255,0.18);border-radius:12px;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.35);color:var(--hi)}
.G6 .key{background:var(--accent);color:#15130f;border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)}
.G6 .keyS{background:rgba(255,255,255,0.10);border:0.5px solid rgba(255,255,255,0.18);border-radius:10px;color:var(--hi)}
.G6 .divider{background:rgba(255,255,255,0.08)}
.G6 .seg,.G6 .rung,.G6 .plate,.G6 .qbar{border-radius:2px}
""",
}

COLS = [
 ('G1','Regular','The Lab 05 recipe, unchanged',
  'Blur 28, white at 8%, a half-pixel hairline and a bright inset top edge. Glass on the hero and the chrome; every panel that holds a number stays solid.',
  'This is the baseline. Everything to its right is one variable moved.'),
 ('G2','Clear','Thinner, more transparent',
  'Blur drops to 12 and the fill to 3.5%. Almost all of the definition moves into a single bright top edge, so the glass reads as an edge catching light rather than as a sheet.',
  'The lightest touch here. It nearly disappears over a flat ground &mdash; which is exactly the ghost-glass failure, and why G6 exists.'),
 ('G3','Thick','Deeper lensing, heavier shadow',
  'Blur 46 with a brightness lift, a full-pixel border, a double inset ring, and a 44px drop shadow. Apple&rsquo;s own note: when glass gets bigger it should read as thicker material, not the same sheet scaled up.',
  'The most physical of the six. Also the most expensive &mdash; budget two to four of these animating at once, not more.'),
 ('G4','Tinted','Champagne glass instead of neutral',
  'Same geometry as G1, but the fill and both edges take the accent hue rather than white. The highlight warms to a cream.',
  'Ties the chrome into the palette instead of floating above it. The risk is that tinted glass and the gold accent start competing for the same job.'),
 ('G5','All glass','Every panel floats',
  'The strategy inverted: the solid lit panels become glass too, so nothing on the screen is opaque.',
  'Included so the failure is visible rather than described. Blur compounds, the numerals lose their ground, and the hero stops being distinguishable from the rows beneath it. This is the named glass-on-glass anti-pattern.'),
 ('G6','Over a real field','G1 glass, richer background',
  'Identical glass to G1. The only change is behind it: a tick rail and a band chart are drawn into the field, so the blur has something to actually bend.',
  'Glass needs varied content behind it or it renders as nothing. Since photography is ruled out, the data itself has to be the background &mdash; this is the strongest argument for keeping the instrument field.'),
]

css = lab05.BASE_CSS + '\n'.join(
    ('.%s{%s}\n' % (k, VARS)) + v.replace('__DOTS__', DOTS) for k, v in SKINS.items())

cols = ''.join(
  '<div class="col"><div class="cap" style="min-height:170px">'
  '<span class="k">%s</span><span class="t">%s</span>'
  '<span class="d" style="color:#d9c9a8">%s</span>'
  '<span class="d">%s</span><span class="d" style="color:#7d786e">%s</span></div>%s</div>'
  % (c[0], c[1], c[2], c[3], c[4], lab05.screen(c[0])) for c in COLS)

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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 11</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Six ways to be glass</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Glass was the only material that landed, so this stays inside it. Same screen, same palette, same layout &mdash; six recipes for the same idea, from nearly invisible to genuinely thick.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Two columns are here as arguments rather than options. <span style="color:#96938c">G5</span> makes every panel glass so the compounding failure is visible instead of theoretical. <span style="color:#96938c">G6</span> keeps the G1 recipe and only enriches what sits behind it &mdash; compare it against G1 and G2 to see how much of glass is actually the background doing the work.</p>
    </div>
    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab11.html','w').write(HTML)
print('wrote lab11.html', len(HTML))
