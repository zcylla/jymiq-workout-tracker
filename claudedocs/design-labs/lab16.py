CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--panel:#15130f;--raised:#221f19;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;--warn:#e8b23a;
        --hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b;
        --tick1:#5a5449;--tick2:#7d7666;--tick3:#a8a091}
  .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;max-width:1420px}
  .colhd{display:flex;flex-direction:column;gap:6px;padding-bottom:4px}
  .colhd .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .colhd .t{font-size:19px;font-weight:600;letter-spacing:-0.02em;color:#f0efec}
  .colhd .d{font-size:12px;line-height:1.6;color:#8c8677}
  .rowhd{grid-column:1 / -1;display:flex;align-items:baseline;gap:12px;padding-top:14px}
  .rowhd h3{margin:0;font-size:15px;font-weight:600;color:#f0efec}
  .rowhd span{font-size:12px;color:#6f6c66}
  .rowhd .line{flex:1;height:1px;background:rgba(255,255,255,0.08)}
  .cell{min-height:172px;display:flex;flex-direction:column;justify-content:center}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}

  /* ---- T1 precise: hairlines, square terminals, everything on a grid ---- */
  .T1{background:#121110;border:1px solid rgba(255,255,255,0.07);border-radius:2px;padding:18px}
  .T1 .bar{height:6px;background:rgba(255,255,255,0.05)}
  .T1 .fill{height:100%;display:block}
  .T1 .rule{height:1px;background:rgba(255,255,255,0.07)}
  .T1 .gl{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.07)}

  /* ---- T2 soft: rounded, generous, fewer rules ---- */
  .T2{background:var(--raised);border:1px solid rgba(255,255,255,0.09);border-radius:22px;padding:20px;
      box-shadow:inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 22px rgba(0,0,0,0.40)}
  .T2 .bar{height:10px;border-radius:6px;background:rgba(255,255,255,0.07)}
  .T2 .fill{height:100%;border-radius:6px;display:block}

  /* ---- T3 editorial: type does the work, rules instead of boxes ---- */
  .T3{background:none;border:none;border-top:1px solid rgba(255,255,255,0.16);border-radius:0;padding:20px 4px 4px}
  .T3 .bar{height:2px;background:rgba(255,255,255,0.09)}
  .T3 .fill{height:100%;display:block}
  .T3 .rule{height:1px;background:rgba(255,255,255,0.08)}
"""

FAT = [('Chest',78,'var(--pos)'),('Back',88,'var(--pos)'),('Quads',36,'var(--live)'),
       ('Hams',59,'var(--warn)'),('Shldr',92,'var(--pos)'),('Arms',70,'var(--pos)')]
RAMP = [(True,'40','41 x5'),(True,'60','61 x3'),(True,'75','78 x2'),(False,'85','88 x1'),(False,'100','102.5')]
SPARK = ('M4 50 L18 47 L32 48 L46 43 L60 44 L74 38 L88 39 L102 33 L116 34 L130 27 L144 28 L158 21 L172 18')

# ================= 1 · FATIGUE =================
def fat_T1():
    return ('<div class="r"><span class="mono lbl">READY TO TRAIN</span><span class="sp"></span>'
      '<span class="mono" style="font-size:11px;color:var(--live)">QUADS 36</span></div>'
      '<div style="height:11px"></div>'
      + ''.join(
        '<div class="r" style="gap:0;height:24px">'
        '<span class="mono" style="width:58px;font-size:11px;letter-spacing:0.06em;color:var(--lo)">%s</span>'
        '<div style="flex:1;position:relative"><div class="bar"><span class="fill" style="width:%d%%;background:%s"></span></div>'
        '<span class="gl" style="left:25%%"></span><span class="gl" style="left:50%%"></span>'
        '<span class="gl" style="left:75%%"></span></div>'
        '<span class="mono" style="width:40px;text-align:right;font-size:11px;color:var(--mid)">%d</span></div>'
        % (n.upper(), v, c, v) for n, v, c in FAT))
def fat_T2():
    return ('<div class="r"><span style="font-size:15px;font-weight:600;color:var(--hi)">Ready to train</span>'
      '<span class="sp"></span><span class="mono" style="font-size:11px;color:var(--live)">Quads need a day</span></div>'
      '<div style="height:13px"></div>'
      + ''.join(
        '<div class="r" style="gap:12px;height:30px">'
        '<span style="width:54px;font-size:13px;color:var(--mid)">%s</span>'
        '<div class="bar" style="flex:1"><span class="fill" style="width:%d%%;background:%s"></span></div>'
        '<span class="mono" style="width:36px;text-align:right;font-size:13px;color:var(--hi)">%d</span></div>'
        % (n, v, c, v) for n, v, c in FAT))
def fat_T3():
    return ('<span class="mono lbl">READY TO TRAIN</span><div style="height:12px"></div>'
      + ''.join(
        '<div style="padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.06)">'
        '<div class="r" style="gap:10px">'
        '<span style="flex:1;font-size:14px;color:var(--hi)">%s</span>'
        '<span class="mono" style="font-size:17px;font-weight:500;color:%s">%d</span>'
        '<span class="mono" style="font-size:11px;color:var(--dim)">%%</span></div>'
        '<div class="bar" style="margin-top:5px"><span class="fill" style="width:%d%%;background:%s"></span></div></div>'
        % (n, c, v, v, c) for n, v, c in FAT))

# ================= 2 · BODYWEIGHT =================
def spark(w=176, h=58, stroke='var(--accent)', sw=2, dot=True):
    return ('<svg viewBox="0 0 180 62" style="width:100%%;height:%dpx">'
            '<path d="%s" fill="none" stroke="%s" stroke-width="%s" stroke-linejoin="round" '
            'stroke-linecap="round"></path>%s</svg>'
            % (h, SPARK, stroke, sw, '<circle cx="172" cy="18" r="3.5" fill="%s"></circle>' % stroke if dot else ''))
def bw_T1():
    return ('<div class="r"><span class="mono lbl">BODYWEIGHT</span><span class="sp"></span>'
      '<span class="mono" style="font-size:11px;color:var(--dim)">12 WK</span></div>'
      '<div style="height:10px"></div><div class="rule"></div><div style="height:12px"></div>'
      '<div class="r" style="gap:4px;align-items:baseline">'
      '<span class="mono" style="font-size:40px;font-weight:600;letter-spacing:-0.04em;line-height:1;color:var(--hi)">81.0</span>'
      '<span class="mono" style="font-size:12px;color:var(--lo)">KG</span><span class="sp"></span>'
      '<span class="mono" style="font-size:12px;color:var(--pos)">+0.4 / WK</span></div>'
      '<div style="height:8px"></div>' + spark(h=54, sw=1.5) +
      '<div class="rule"></div>')
def bw_T2():
    return ('<span style="font-size:15px;font-weight:600;color:var(--hi)">Bodyweight</span>'
      '<div style="height:10px"></div>'
      '<div class="r" style="gap:8px;align-items:baseline">'
      '<span class="mono" style="font-size:44px;font-weight:600;letter-spacing:-0.04em;line-height:1;color:var(--hi)">81.0</span>'
      '<span style="font-size:14px;color:var(--mid)">kg</span></div>'
      '<div class="r" style="gap:6px;margin-top:7px">'
      '<span style="width:0;height:0;border-bottom:6px solid var(--pos);border-left:4px solid transparent;'
      'border-right:4px solid transparent"></span>'
      '<span style="font-size:13px;color:var(--pos)">Up 0.4 kg a week</span></div>'
      '<div style="height:6px"></div>' + spark(h=56, sw=2.5))
def bw_T3():
    return ('<div class="r" style="align-items:flex-end;gap:16px">'
      '<div style="flex:none">'
      '<span class="mono lbl">BODYWEIGHT</span>'
      '<div class="r" style="gap:5px;align-items:baseline;margin-top:4px">'
      '<span class="mono" style="font-size:52px;font-weight:600;letter-spacing:-0.05em;line-height:0.95;color:var(--hi)">81.0</span>'
      '<span class="mono" style="font-size:13px;color:var(--lo)">KG</span></div></div>'
      '<div style="flex:1;min-width:0;padding-bottom:6px">' + spark(h=48, sw=1.5, dot=True) + '</div></div>'
      '<div style="height:9px"></div><div class="rule"></div><div style="height:8px"></div>'
      '<div class="r"><span class="mono" style="font-size:12px;color:var(--pos)">&uarr; 0.4 KG PER WEEK</span>'
      '<span class="sp"></span><span class="mono" style="font-size:12px;color:var(--dim)">LAST 12 WEEKS</span></div>')

# ================= 3 · VOLUME ZONES =================
ZONES = [('Too few',30,'rgba(255,255,255,0.07)','var(--dim)'),('Good',25,'rgba(140,224,127,0.32)','var(--pos)'),
         ('Hard',27,'rgba(232,178,58,0.32)','var(--warn)'),('Too much',18,'rgba(255,92,26,0.34)','var(--live)')]
def zn_T1():
    return ('<div class="r"><span class="mono lbl">CHEST &middot; SETS THIS WEEK</span><span class="sp"></span>'
      '<span class="mono" style="font-size:15px;font-weight:500;color:var(--warn)">18</span></div>'
      '<div style="height:12px"></div>'
      '<div style="position:relative;height:14px;display:flex">'
      + ''.join('<span style="width:%d%%;background:%s;border-right:1px solid #121110"></span>' % (w, c)
                for _, w, c, _ in ZONES)
      + '<span style="position:absolute;left:60%;top:-5px;bottom:-5px;width:2px;background:var(--hi)"></span></div>'
      '<div style="height:7px"></div>'
      '<div class="r" style="font-size:11px">'
      + ''.join('<span class="mono" style="width:%d%%;color:%s">%s</span>' % (w, t, n.upper())
                for n, w, _, t in ZONES) + '</div>')
def zn_T2():
    return ('<span style="font-size:15px;font-weight:600;color:var(--hi)">Chest volume</span>'
      '<div style="height:4px"></div>'
      '<span style="font-size:13px;color:var(--mid)">18 sets this week &mdash; in the hard range</span>'
      '<div style="height:14px"></div>'
      '<div style="position:relative;height:16px;display:flex;gap:3px">'
      + ''.join('<span style="width:%d%%;background:%s;border-radius:8px"></span>' % (w, c) for _, w, c, _ in ZONES)
      + '<span style="position:absolute;left:60%;top:-6px;bottom:-6px;width:4px;border-radius:2px;'
        'background:var(--hi);box-shadow:0 0 0 3px #221f19"></span></div>'
      '<div style="height:9px"></div>'
      '<div class="r"><span style="font-size:12px;color:var(--pos)">Good from 9</span><span class="sp"></span>'
      '<span style="font-size:12px;color:var(--live)">Deload at 22</span></div>')
def zn_T3():
    return ('<div class="r" style="align-items:baseline;gap:8px">'
      '<span class="mono" style="font-size:40px;font-weight:600;letter-spacing:-0.04em;line-height:1;color:var(--hi)">18</span>'
      '<span style="font-size:14px;color:var(--mid)">chest sets this week</span></div>'
      '<div style="height:12px"></div>'
      '<div style="position:relative;height:3px;display:flex">'
      + ''.join('<span style="width:%d%%;background:%s"></span>' % (w, c.replace('0.07','0.10').replace('0.32','0.62').replace('0.34','0.7'))
                for _, w, c, _ in ZONES)
      + '<span style="position:absolute;left:60%;top:-7px;bottom:-7px;width:1px;background:var(--hi)"></span></div>'
      '<div style="height:8px"></div><div class="rule"></div><div style="height:8px"></div>'
      '<span style="font-size:13px;line-height:1.6;color:var(--mid)">You are in the '
      '<span style="color:var(--warn)">hard</span> range. Two more sets and you deload.</span>')

# ================= 4 · WARM-UP =================
def wu_T1():
    return ('<div class="r"><span class="mono lbl">WARM-UP RAMP</span><span class="sp"></span>'
      '<span class="mono" style="font-size:11px;color:var(--dim)">OF 102.5 KG</span></div>'
      '<div style="height:12px"></div>'
      '<div class="r" style="gap:1px">'
      + ''.join('<div style="flex:1;min-height:52px;display:flex;flex-direction:column;align-items:center;'
                'justify-content:center;gap:3px;background:%s;border:1px solid %s">'
                '<span class="mono" style="font-size:14px;font-weight:500;color:%s">%s</span>'
                '<span class="mono" style="font-size:11px;color:%s">%s</span></div>'
                % (('rgba(217,201,168,0.13)' if a else 'rgba(255,255,255,0.03)'),
                   ('rgba(217,201,168,0.55)' if a else 'rgba(255,255,255,0.08)'),
                   ('var(--accent)' if a else 'var(--dim)'), p + '%',
                   ('var(--mid)' if a else 'var(--dim)'), l) for a, p, l in RAMP) + '</div>')
def wu_T2():
    return ('<span style="font-size:15px;font-weight:600;color:var(--hi)">Warm-up ramp</span>'
      '<div style="height:12px"></div>'
      '<div class="r" style="gap:7px">'
      + ''.join('<div style="flex:1;min-height:56px;display:flex;flex-direction:column;align-items:center;'
                'justify-content:center;gap:2px;border-radius:14px;background:%s;border:1px solid %s">'
                '<span style="font-size:15px;font-weight:600;color:%s">%s</span>'
                '<span class="mono" style="font-size:11px;color:%s">%s</span></div>'
                % (('rgba(217,201,168,0.15)' if a else 'rgba(255,255,255,0.045)'),
                   ('rgba(217,201,168,0.45)' if a else 'rgba(255,255,255,0.07)'),
                   ('var(--accent)' if a else 'var(--dim)'), p + '%',
                   ('var(--mid)' if a else 'var(--dim)'), l) for a, p, l in RAMP) + '</div>')
def wu_T3():
    return ('<span class="mono lbl">WARM-UP RAMP</span><div style="height:10px"></div>'
      + ''.join('<div class="r" style="gap:12px;padding:7px 0;border-bottom:1px solid rgba(255,255,255,0.06)">'
                '<span style="width:4px;height:16px;background:%s"></span>'
                '<span class="mono" style="width:44px;font-size:15px;font-weight:500;color:%s">%s</span>'
                '<span class="mono" style="flex:1;font-size:14px;color:%s">%s</span>'
                '<span class="mono" style="font-size:11px;color:var(--dim)">%s</span></div>'
                % (('var(--accent)' if a else 'var(--off)'), ('var(--accent)' if a else 'var(--dim)'), p + '%',
                   ('var(--hi)' if a else 'var(--dim)'), l, 'SET %d' % (i + 1))
                for i, (a, p, l) in enumerate(RAMP)))

ROWS = [
 ('Muscle fatigue', 'six values, one glance', [fat_T1, fat_T2, fat_T3]),
 ('Bodyweight trend', 'one number, one direction, one line', [bw_T1, bw_T2, bw_T3]),
 ('Volume zones', 'where you sit against a real limit', [zn_T1, zn_T2, zn_T3]),
 ('Warm-up ramp', 'a fixed set of choices', [wu_T1, wu_T2, wu_T3]),
]

HEADS = [
 ('T1','Precise','Hairlines, square terminals, 2px radii, everything locked to a grid. Quarter-marks sit behind every bar so a length is readable as a value, not just a length. Labels are tracked mono caps. This is the instrument reading of the brief.'),
 ('T2','Soft','Generous radii, thicker bars, sentence-case labels, real shadow under a raised plate. Numbers get larger and rules disappear. The friendliest of the three and the furthest from a cockpit.'),
 ('T3','Editorial','Almost no chrome. A hairline above, hairlines between rows, and typographic hierarchy doing all the grouping. Bars shrink to 2px because the numeral is the content and the bar is only a footnote to it.'),
]

cells = ''
for name, sub, fns in ROWS:
    cells += ('<div class="rowhd"><h3>%s</h3><span>%s</span><span class="line"></span></div>' % (name, sub))
    for i, fn in enumerate(fns):
        cells += '<div class="cell T%d">%s</div>' % (i + 1, fn())

heads = ''.join('<div class="colhd"><span class="k">%s</span><span class="t">%s</span>'
                '<span class="d">%s</span></div>' % h for h in HEADS)

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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 16</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Readable, and then some</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">The Lab 13 instruments were correct and plain. These are the same four, held to the same rule &mdash; <span style="color:#f0efec">nothing here needs explaining</span> &mdash; drawn three ways. Not one of them encodes anything you have to learn.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Read down a column to judge a style, across a row to compare treatments of one instrument. They can also be mixed: precise suits anything read mid-set, editorial suits anything read on the sofa afterwards.</p>
    </div>
    <div class="grid">''' + heads + cells + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab16.html','w').write(HTML)
print('wrote lab16.html', len(HTML))
