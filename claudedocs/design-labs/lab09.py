# Lab 09 - typography. Identical content, six pairings. Every face free for commercial use.

PAIRS = [
 ('A','Inter + JetBrains Mono', "Geist,ui-sans-serif,system-ui,sans-serif", "'Geist Mono',ui-monospace,monospace",
  'What labs 03&ndash;08 use now',
  'Both OFL. The safe answer, and that is the problem &mdash; Inter is the default face of every app shipped since 2020, so it contributes nothing to a distinct experience. Reads as unstyled rather than designed.',
  'DEFAULT-LOOKING'),
 ('B','Space Grotesk + Instrument Sans + JetBrains Mono', "'Space Grotesk',ui-sans-serif,sans-serif", "'Geist Mono',ui-monospace,monospace",
  'Research recommendation',
  'All three OFL, all three variable, all three have first-class @expo-google-fonts packages. Space Grotesk carries the headline geometry, Instrument Sans takes body and labels, JetBrains Mono every numeral. Three roles, three faces, no overlap.',
  'RECOMMENDED', "'Instrument Sans',ui-sans-serif,sans-serif"),
 ('C','Poppins', "Poppins,ui-sans-serif,sans-serif", "Poppins,ui-sans-serif,sans-serif",
  'What the champagne file uses',
  'One family for everything, OFL. Geometric and friendly, but it has no monospace companion and no true tabular figures &mdash; clocks and logged loads jitter as digits count. That is disqualifying for a screen whose content is numbers.',
  'NO TABULAR FIGURES'),
 ('D','Geist + Geist Mono', "Geist,ui-sans-serif,sans-serif", "'Geist Mono',ui-monospace,monospace",
  'Vercel superfamily',
  'Free, commercial use permitted, both variable. Sans and mono are drawn together so they lock up perfectly. The cost is that Geist sits very close to Inter &mdash; you get the coherence without much of the differentiation.',
  'COHERENT, CLOSE TO INTER'),
 ('E','Space Grotesk + Martian Mono', "'Space Grotesk',ui-sans-serif,sans-serif", "'Martian Mono',ui-monospace,monospace",
  'The loud option',
  'Both OFL. Martian Mono has wide counters and a strong technical character &mdash; it looks like instrument labelling rather than code. It is also wide, which costs real horizontal room in a set table at 402pt.',
  'WIDEST, MOST CHARACTER'),
 ('F','IBM Plex Sans + IBM Plex Mono', "'IBM Plex Sans',ui-sans-serif,sans-serif", "'IBM Plex Mono',ui-monospace,monospace",
  'The engineering classic',
  'OFL, drawn as one system for technical documentation. Tabular by default, genuinely neutral. Static weights only &mdash; no variable release &mdash; so you ship more font files, and the dotted zero is an OpenType alternate rather than the default.',
  'STATIC WEIGHTS ONLY'),
]

CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  :root{--panel:#15130f;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;--warn:#e8b23a;
        --hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b}
  .board{display:flex;gap:22px;align-items:flex-start;overflow-x:auto;padding-bottom:8px}
  .col{flex:none;width:322px;display:flex;flex-direction:column;gap:12px}
  .hd{display:flex;flex-direction:column;gap:5px;min-height:150px}
  .hd .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .hd .t{font-size:15px;font-weight:600;line-height:1.35;color:#f0efec}
  .hd .r{font-size:12px;letter-spacing:0.02em;color:#d9c9a8}
  .hd .d{font-size:12px;line-height:1.6;color:#8c8677}
  .verd{display:inline-block;align-self:flex-start;padding:2px 8px;border-radius:5px;font-size:11px;
        letter-spacing:0.10em;background:rgba(255,255,255,0.06);color:#a49f94}
  .verd.go{background:rgba(140,224,127,0.14);color:#8ce07f}
  .verd.no{background:rgba(255,92,26,0.13);color:#ff8a55}
  .spec{background:var(--panel);border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:16px;
        display:flex;flex-direction:column;gap:14px;overflow:hidden}
  .sec{display:flex;flex-direction:column;gap:7px}
  .cap{font-size:11px;letter-spacing:0.16em;color:#5f5b53}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}
  .rule{height:1px;background:rgba(255,255,255,0.07)}
  .tnum{font-variant-numeric:tabular-nums}
"""

def col(p):
    k, name, sans, mono, role, note, verd = p[0], p[1], p[2], p[3], p[4], p[5], p[6]
    body = p[7] if len(p) > 7 else sans
    vc = 'go' if verd == 'RECOMMENDED' else ('no' if verd in ('NO TABULAR FIGURES','DEFAULT-LOOKING') else '')
    S = 'style="font-family:%s"' % sans
    B = 'style="font-family:%s"' % body
    M = 'font-family:%s' % mono
    return f'''<div class="col">
  <div class="hd">
    <span class="k">{k}</span>
    <span class="t" {S}>{name}</span>
    <span class="r">{role}</span>
    <span class="d">{note}</span>
    <span class="verd {vc}" style="{M}">{verd}</span>
  </div>
  <div class="spec">

    <div class="sec">
      <span class="cap" style="{M}">HERO READOUT</span>
      <div class="r" style="gap:6px;align-items:baseline">
        <span style="{M};font-size:50px;font-weight:600;letter-spacing:-0.04em;line-height:1;color:var(--hi)" class="tnum">102.5</span>
        <span style="{M};font-size:13px;color:var(--mid)">KG</span>
        <span class="sp"></span>
        <span style="{M};font-size:50px;font-weight:600;letter-spacing:-0.04em;line-height:1;color:var(--hi)" class="tnum">8</span>
        <span style="{M};font-size:13px;color:var(--mid)">REPS</span>
      </div>
    </div>

    <div class="rule"></div>

    <div class="sec">
      <span class="cap" style="{M}">HEADING AND BODY</span>
      <span {S} style="font-size:22px;font-weight:600;letter-spacing:-0.02em;color:var(--hi)">Barbell Squat</span>
      <span {B} style="font-size:13px;line-height:1.6;color:var(--mid)">Fourth working set at RPE 8. Estimated one-rep max is 130&nbsp;kg, three above the last session.</span>
      <span style="{M};font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)">LIVE &middot; LOWER A &middot; W09 D3</span>
    </div>

    <div class="rule"></div>

    <div class="sec">
      <span class="cap" style="{M}">SET TABLE</span>
      <div class="r" style="height:16px">
        <span style="{M};font-size:11px;letter-spacing:0.14em;width:26px;color:var(--lo)">SET</span><span class="sp"></span>
        <span style="{M};font-size:11px;letter-spacing:0.14em;width:52px;text-align:right;color:var(--lo)">KG</span>
        <span style="{M};font-size:11px;letter-spacing:0.14em;width:34px;text-align:right;color:var(--lo)">REP</span>
        <span style="{M};font-size:11px;letter-spacing:0.14em;width:40px;text-align:right;color:var(--lo)">RPE</span>
      </div>''' + ''.join(f'''
      <div class="r" style="height:20px">
        <span class="tnum" style="{M};font-size:11px;width:26px;color:var(--dim)">{a}</span><span class="sp"></span>
        <span class="tnum" style="{M};font-size:11px;width:52px;text-align:right;color:var(--hi)">{b}</span>
        <span class="tnum" style="{M};font-size:11px;width:34px;text-align:right;color:var(--mid)">{c}</span>
        <span class="tnum" style="{M};font-size:11px;width:40px;text-align:right;color:var(--accent)">{d}</span>
      </div>''' for a, b, c, d in [('01','100.0','08','7.5'),('02','102.5','08','8.0'),('03','102.5','07','8.5')]) + f'''
    </div>

    <div class="rule"></div>

    <div class="sec">
      <span class="cap" style="{M}">FIGURES</span>
      <span class="tnum" style="{M};font-size:26px;font-weight:500;color:var(--mid);letter-spacing:0.02em">0123456789</span>
      <span style="{M};font-size:11px;color:var(--dim)">SLASHED ZERO &middot; TABULAR &middot; SAME ADVANCE</span>
    </div>

    <div class="sec">
      <span class="cap" style="{M}">JITTER TEST</span>
      <span class="tnum" style="{M};font-size:21px;font-weight:500;color:var(--hi);line-height:1.35">00:31:17<br>11:88:00</span>
      <span style="{M};font-size:11px;color:var(--dim)">COLONS MUST NOT MOVE BETWEEN ROWS</span>
    </div>

  </div>
</div>'''

cols = ''.join(col(p) for p in PAIRS)

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
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&family=Space+Grotesk:wght@400;500;600;700&family=Instrument+Sans:wght@400;500;600&family=Poppins:wght@300;400;500;600&family=Geist:wght@400;500;600&family=Geist+Mono:wght@400;500;600&family=Martian+Mono:wght@400;500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>''' + CSS + '''</style>
</helmet>

<div style="min-height:100vh;background:#0a0a0b;color:#f0efec;padding:48px 40px 96px">
  <div style="display:flex;flex-direction:column;gap:36px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:900px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 09</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Six typographic pairings</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Same six specimens in every column: hero readout, heading and body, set table, figure set, and a jitter test. Every face here is free for commercial use &mdash; Berkeley Mono, PP Neue Montreal and S&ouml;hne were all cut on licence cost, not on looks.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The jitter test is the one that decides it. Two rows of digits, same size, one above the other: if the colons drift horizontally, the face has no tabular figures and every clock and logged load in the app will twitch as it counts. That is the reason the champagne file&rsquo;s Poppins cannot survive contact with this screen.</p>
    </div>
    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab09.html','w').write(HTML)
print('wrote lab09.html', len(HTML))
