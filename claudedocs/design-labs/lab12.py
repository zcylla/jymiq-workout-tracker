import math

CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--ground:#0a0908;--panel:#15130f;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;
        --hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b}
  .board{display:flex;gap:30px;align-items:flex-start;overflow-x:auto;padding-bottom:8px}
  .col{flex:none;width:402px;display:flex;flex-direction:column;gap:14px}
  .cap{display:flex;flex-direction:column;gap:5px;min-height:132px}
  .cap .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .cap .t{font-size:16px;font-weight:600;color:#f0efec}
  .cap .d{font-size:13px;line-height:1.6;color:#96938c}
  .cap .w{font-size:12px;line-height:1.6;color:#7d786e}

  .phone{width:402px;height:860px;border-radius:34px;overflow:hidden;position:relative;display:flex;
         flex-direction:column;background:var(--ground);border:1px solid rgba(255,255,255,0.08)}
  .field{position:absolute;inset:0;pointer-events:none;z-index:0;
         background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:18px 18px}
  .bloom{position:absolute;border-radius:9999px;pointer-events:none;z-index:0;filter:blur(88px)}
  .sb{position:relative;z-index:2;height:56px;flex:none;display:flex;align-items:center;
      justify-content:space-between;padding:0 26px;font-size:15px;font-weight:600;color:var(--hi)}
  .sb i{width:22px;height:11px;border-radius:3px;border:1px solid var(--lo);display:block}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}
  .body{position:relative;z-index:2;flex:1;min-height:0;padding:0 16px;display:flex;
        flex-direction:column;align-items:center;gap:11px}
  .dial{position:relative;width:342px;height:326px;flex:none;display:flex;align-items:center;justify-content:center}
  .core{position:absolute;display:flex;flex-direction:column;align-items:center;gap:1px}

  /* --- the three satellite treatments --- */
  .satrow{display:flex;width:100%;flex:none}
  .glass{background:rgba(255,255,255,0.08);backdrop-filter:blur(28px) saturate(180%);
         -webkit-backdrop-filter:blur(28px) saturate(180%);border:0.5px solid rgba(255,255,255,0.18);
         box-shadow:inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.20),
                    0 8px 24px rgba(0,0,0,0.35)}
  .V1 .satrow{gap:8px}
  .V1 .sat{flex:1;min-width:0;border-radius:16px;padding:9px 11px;display:flex;flex-direction:column;gap:4px}
  .V2 .satrow{gap:0;border-radius:18px;overflow:hidden}
  .V2 .sat{flex:1;min-width:0;padding:10px 11px;display:flex;flex-direction:column;gap:4px;
           border-right:1px solid rgba(255,255,255,0.14)}
  .V2 .sat:last-child{border-right:none}
  .V3 .satrow{gap:8px}
  .V3 .sat{flex:1;min-width:0;border-radius:16px;padding:9px 11px;display:flex;flex-direction:column;gap:4px;
           background:#221f19;border:1px solid rgba(255,255,255,0.10);
           box-shadow:inset 0 1px 0 rgba(255,255,255,0.09), 0 6px 16px rgba(0,0,0,0.42)}

  .tblwrap{width:100%;flex:none;border-radius:18px;padding:12px 14px;display:flex;flex-direction:column;gap:4px}
  .V3 .tblwrap{background:#1b1813;border:1px solid rgba(255,255,255,0.08);
               box-shadow:inset 0 1px 0 rgba(255,255,255,0.07)}
  .key{min-height:52px;flex:1;display:flex;align-items:center;justify-content:center;font-size:15px;
       font-weight:600;background:var(--accent);color:#15130f;border-radius:14px;
       box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)}
  .keyG{min-height:52px;width:56px;flex:none;display:flex;align-items:center;justify-content:center;
        font-size:17px;border-radius:14px;color:var(--hi)}
  .bar{position:relative;z-index:3;flex:none;margin:8px 16px 30px;display:flex;gap:10px}
"""

def radial():
    out=[]
    for i in range(61):
        a = -240 + i*5.0
        major, active = i % 5 == 0, i <= 38
        ln = 17 if major else 9
        col = 'var(--accent)' if i==38 else ('var(--on)' if active else 'var(--off)')
        w = 2 if (major or i==38) else 1
        rad = math.radians(a)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%d"></line>'
                   % (171+150*math.cos(rad), 163+150*math.sin(rad),
                      171+(150-ln)*math.cos(rad), 163+(150-ln)*math.sin(rad), col, w))
    return ''.join(out)

SETS=[('01','100.0','08','7.5','127'),('02','102.5','08','8.0','130'),('03','102.5','07','8.5','128')]

def screen(v):
    g = ' glass' if v in ('V1','V2') else ''
    sats = ''.join(
      '<div class="sat%s"><span class="mono lbl">%s</span>%s</div>' % (g if v=='V1' else '', n, inner)
      for n, inner in [
        ('REST','<span class="mono" style="font-size:20px;font-weight:500;color:var(--live)">01:12</span>'),
        ('e1RM','<span class="mono" style="font-size:20px;font-weight:500;color:var(--hi)">130</span>'),
        ('VOLUME','<span class="mono" style="font-size:20px;font-weight:500;color:var(--hi)">3.7&thinsp;T</span>'),
        ('PLATES','<div class="r" style="gap:3px;align-items:flex-end;height:20px">'
                  '<span style="width:14px;height:13px;border-radius:1px;background:#2f6fb0"></span>'
                  '<span style="width:14px;height:13px;border-radius:1px;background:#2f6fb0"></span>'
                  '<span style="width:11px;height:13px;border-radius:1px;background:#3f7a52"></span>'
                  '<span style="width:7px;height:13px;border-radius:1px;background:#d0cbc2"></span></div>')])
    menu = ('<div class="keyG" style="background:#221f19;border:1px solid rgba(255,255,255,0.10)">'
            '<span class="mono">&equiv;</span></div>') if v == 'V3' else (
           '<div class="keyG glass"><span class="mono">&equiv;</span></div>')
    wave = ''.join(
      '<span style="width:%dpx;flex:none"></span>'
      '<span style="width:4px;flex:none;height:%d%%;border-radius:1px;background:%s"></span>' % (gp, h, c)
      for gp, h, c in [(0,24,'var(--on)'),(11,32,'var(--on)'),(10,42,'var(--on)'),(18,70,'var(--pos)'),
                       (22,74,'var(--pos)'),(21,76,'var(--pos)'),(24,84,'var(--accent)')])
    rows = ''.join(
      '<div class="r" style="height:21px;font-size:11px">'
      '<span class="mono" style="width:24px;color:var(--dim)">%s</span><span class="sp"></span>'
      '<span class="mono" style="width:50px;text-align:right;color:var(--hi)">%s</span>'
      '<span class="mono" style="width:32px;text-align:right;color:var(--mid)">%s</span>'
      '<span class="mono" style="width:38px;text-align:right;color:var(--lo)">%s</span>'
      '<span class="mono" style="width:44px;text-align:right;color:var(--accent)">%s</span></div>' % s for s in SETS)
    return f'''<div class="phone {v}">
  <div class="field"></div>
  <div class="bloom" style="top:96px;left:30px;width:342px;height:342px;background:rgba(217,201,168,0.17)"></div>
  <div class="bloom" style="bottom:96px;left:-40px;width:300px;height:220px;background:rgba(140,224,127,0.13)"></div>
  <div class="bloom" style="bottom:60px;right:-60px;width:280px;height:220px;background:rgba(255,92,26,0.10)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="body">

    <div class="r" style="width:100%;gap:8px;flex:none;height:30px">
      <span style="width:7px;height:7px;border-radius:9999px;background:var(--live)"></span>
      <span class="mono lbl" style="color:var(--live)">LIVE</span>
      <span style="font-size:15px;font-weight:600;color:var(--hi)">Barbell Squat</span>
      <span class="sp"></span><span class="mono lbl">00:31:17</span>
    </div>

    <div class="dial">
      <svg viewBox="0 0 342 326" style="width:342px;height:326px;position:absolute;left:0;top:0">
        <circle cx="171" cy="163" r="158" fill="none" stroke="rgba(255,255,255,0.055)" stroke-width="1"></circle>
        <circle cx="171" cy="163" r="121" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"></circle>
        {radial()}
      </svg>
      <div class="core">
        <span class="mono lbl">LOAD</span>
        <span class="mono" style="font-size:62px;font-weight:600;letter-spacing:-0.05em;line-height:1;color:var(--hi)">102.5</span>
        <span class="mono" style="font-size:13px;color:var(--mid)">KG &middot; SET 4 OF 5</span>
        <div class="r" style="gap:5px;width:150px;margin-top:9px">
          <span style="flex:1;height:4px;border-radius:2px;background:var(--pos)"></span>
          <span style="flex:1;height:4px;border-radius:2px;background:var(--pos)"></span>
          <span style="flex:1;height:4px;border-radius:2px;background:var(--pos)"></span>
          <span style="flex:1;height:4px;border-radius:2px;background:var(--accent)"></span>
          <span style="flex:1;height:4px;border-radius:2px;background:var(--off)"></span></div>
        <div class="r" style="gap:6px;margin-top:11px;align-items:baseline">
          <span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">8</span>
          <span class="mono lbl">REPS</span>
          <span style="width:1px;height:15px;background:rgba(255,255,255,0.14);margin:0 4px"></span>
          <span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.03em;color:var(--accent)">8.0</span>
          <span class="mono lbl">RPE</span></div>
      </div>
    </div>

    <div class="satrow{g if v == 'V2' else ''}">{sats}</div>

    <div class="tblwrap{g}">
      <div class="r" style="height:16px"><span class="mono lbl" style="width:24px">SET</span><span class="sp"></span>
        <span class="mono lbl" style="width:50px;text-align:right">KG</span>
        <span class="mono lbl" style="width:32px;text-align:right">REP</span>
        <span class="mono lbl" style="width:38px;text-align:right">RPE</span>
        <span class="mono lbl" style="width:44px;text-align:right">e1RM</span></div>
      <div style="height:1px;background:rgba(255,255,255,0.12)"></div>
      {rows}
    </div>

    <div class="tblwrap{g}" style="gap:7px">
      <div class="r"><span class="mono lbl">SESSION</span><span class="sp"></span>
        <span class="mono lbl">GAP IS REAL REST</span></div>
      <div class="r" style="height:44px;align-items:flex-end;position:relative">{wave}
        <span class="sp"></span></div>
      <div class="r"><span class="mono" style="font-size:11px;color:var(--dim)">WARM-UP</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--pos)">WORKING</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--accent)">NOW &middot; 31:17</span></div>
    </div>

  </div>
  <div class="bar">{menu}
    <div class="key">Log set 4</div></div>
</div>'''

COLS = [
 ('V1','Separate glass chips','Four independent floating surfaces',
  'Each satellite is its own piece of glass with its own edge and its own shadow. Closest to how iOS treats a row of controls.',
  'Reads clearly, but four separate shadows under one row is four separate objects &mdash; the eye counts them before it reads them.'),
 ('V2','One merged glass bar','A single surface, divided from within',
  'The four cells share one sheet of glass; hairlines divide them instead of gaps. This is what GlassContainer produces natively when adjacent glass falls inside its spacing threshold.',
  'One object instead of four. It also costs one blurred surface instead of four, which matters at 120&nbsp;fps.'),
 ('V3','Lit panels, no blur','Elevation by lightness',
  'No glass at all. The cards are simply a lighter tone than the ground with a top highlight and a real shadow underneath.',
  'The dense-dark-dashboard convention: on a dark screen, foreground is signalled by a lighter plate, not by a border or a blur. Cheapest of the three by a wide margin, and it never fights the dial for attention.'),
]

cols = ''.join(
  '<div class="col"><div class="cap"><span class="k">%s</span><span class="t">%s</span>'
  '<span class="d" style="color:#d9c9a8">%s</span><span class="d">%s</span>'
  '<span class="w">%s</span></div>%s</div>' % (c[0], c[1], c[2], c[3], c[4], screen(c[0])) for c in COLS)

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
  <div style="display:flex;flex-direction:column;gap:40px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:900px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 12</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Cluster, with the cards fixed</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">You were right that the satellite cards were disappearing into the ground. Three ways to give them a surface &mdash; two of them glass, one of them deliberately not. The dial, the numerals and the set table are identical in all three.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Two blooms were also added low in the screen, behind where the cards sit. Glass over a flat dark ground renders as almost nothing; it needs light behind it to bend. That is the same lesson as G6 in Lab&nbsp;11, applied here.</p>
    </div>
    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab12.html','w').write(HTML)
print('wrote lab12.html', len(HTML))
