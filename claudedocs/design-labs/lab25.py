BASE = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--ground:#0a0908;--panel:#15130f;--raised:#221f19;--accent:#e4c68c;--pos:#9fae3a;--live:#df5441;
        --warn:#e8b23a;--hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b}
  .board{display:flex;gap:30px;align-items:flex-start;overflow-x:auto;padding-bottom:8px}
  .col{flex:none;width:402px;display:flex;flex-direction:column;gap:14px}
  .cap{display:flex;flex-direction:column;gap:5px;min-height:150px}
  .cap .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .cap .t{font-size:16px;font-weight:600;color:#f0efec}
  .cap .s{font-size:13px;color:#d9c9a8}
  .cap .d{font-size:13px;line-height:1.6;color:#96938c}
  .cap .w{font-size:12px;line-height:1.6;color:#7d786e}
  .phone{width:402px;height:860px;border-radius:34px;overflow:hidden;position:relative;display:flex;
         flex-direction:column;background:var(--ground);border:1px solid rgba(255,255,255,0.08)}
  .field{position:absolute;inset:0;pointer-events:none;z-index:0;
         background-image:radial-gradient(rgba(255,255,255,0.035) 1px,transparent 1px);background-size:18px 18px}
  .bloom{position:absolute;border-radius:9999px;pointer-events:none;z-index:0;filter:blur(88px)}
  .sb{position:relative;z-index:2;height:56px;flex:none;display:flex;align-items:center;
      justify-content:space-between;padding:0 26px;font-size:15px;font-weight:600;color:var(--hi)}
  .sb i{width:22px;height:11px;border-radius:3px;border:1px solid var(--lo);display:block}
  .body{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;overflow:hidden}
  .scrim{position:absolute;left:0;right:0;bottom:86px;height:70px;z-index:2;pointer-events:none;
         background:linear-gradient(rgba(10,9,8,0), rgba(10,9,8,0.94))}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}
  .glass{background:rgba(255,255,255,0.09);backdrop-filter:blur(30px) saturate(180%);
         -webkit-backdrop-filter:blur(30px) saturate(180%);border:0.5px solid rgba(255,255,255,0.19);
         box-shadow:inset 0 1px 0 rgba(255,255,255,0.36), 0 10px 28px rgba(0,0,0,0.42)}
  .nav{position:relative;z-index:3;flex:none;margin:0 16px 30px;display:flex;gap:9px;align-items:center}
  .tabi{flex:1;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px}
  .tabl{font-size:11px;letter-spacing:0.05em;font-family:'Geist Mono',ui-monospace,monospace}
  .fab{border-radius:9999px;display:flex;align-items:center;justify-content:center;background:var(--accent);
       box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 26px rgba(0,0,0,0.50)}
"""

SKINS = {
# ---- E1 PRECISE : hairlines, square terminals, quarter marks, grid-locked ----
'E1': """
.E1 .body{padding:0 20px}
.E1 .sec{padding:13px 0;border-top:1px solid rgba(255,255,255,0.09);display:flex;flex-direction:column;gap:9px}
.E1 .sec:first-child{border-top:none;padding-top:6px}
.E1 .bar{height:6px;background:rgba(255,255,255,0.05);position:relative}
.E1 .bar span{display:block;height:100%;border-radius:0}
.E1 .gl{position:absolute;top:0;bottom:0;width:1px;background:rgba(255,255,255,0.10)}
.E1 .row{display:flex;align-items:center;gap:0;height:26px}
.E1 .nm{font-size:11px;letter-spacing:0.10em;font-family:'Geist Mono',ui-monospace,monospace;
        width:62px;color:var(--lo)}
.E1 .vl{width:42px;text-align:right;font-size:11px;font-family:'Geist Mono',ui-monospace,monospace}
.E1 .big{font-size:40px;font-weight:600;letter-spacing:-0.04em;line-height:1;
         font-family:'Geist Mono',ui-monospace,monospace}
""",
# ---- E2 SOFT : radii, thick bars, sentence case, raised plates ----
'E2': """
.E2 .body{padding:0 16px;gap:10px}
.E2 .sec{padding:15px 16px;border-radius:22px;background:var(--raised);border:1px solid rgba(255,255,255,0.09);
         box-shadow:inset 0 1px 0 rgba(255,255,255,0.08), 0 8px 22px rgba(0,0,0,0.40);
         display:flex;flex-direction:column;gap:10px;flex:none}
.E2 .bar{height:10px;border-radius:6px;background:rgba(255,255,255,0.07)}
.E2 .bar span{display:block;height:100%;border-radius:6px}
.E2 .row{display:flex;align-items:center;gap:12px;height:30px}
.E2 .nm{font-size:13px;width:58px;color:var(--mid)}
.E2 .vl{width:34px;text-align:right;font-size:13px;color:var(--hi);
        font-family:'Geist Mono',ui-monospace,monospace}
.E2 .big{font-size:42px;font-weight:600;letter-spacing:-0.04em;line-height:1;
         font-family:'Geist Mono',ui-monospace,monospace}
""",
# ---- E3 EDITORIAL : Lab 21, rounded caps ----
'E3': """
.E3 .body{padding:0 22px}
.E3 .sec{padding:12px 0;border-top:1px solid rgba(255,255,255,0.10);display:flex;flex-direction:column;gap:9px}
.E3 .sec:first-child{border-top:none;padding-top:6px}
.E3 .bar{height:3px;border-radius:9999px;background:rgba(255,255,255,0.08)}
.E3 .bar span{display:block;height:100%;border-radius:9999px}
.E3 .row{display:flex;flex-direction:column;gap:5px;padding:5px 0;
         border-bottom:1px solid rgba(255,255,255,0.055)}
.E3 .row:last-child{border-bottom:none}
.E3 .nm{flex:1;font-size:14px;color:var(--hi)}
.E3 .vl{font-size:16px;font-weight:500;font-family:'Geist Mono',ui-monospace,monospace}
.E3 .big{font-size:46px;font-weight:600;letter-spacing:-0.045em;line-height:0.95;
         font-family:'Geist Mono',ui-monospace,monospace}
""",
# ---- E4 EDITORIAL, LEFT RAIL : vertical rule replaces horizontal ones ----
'E4': """
.E4 .body{padding:0 20px 0 0}
.E4 .sec{padding:12px 0 12px 22px;margin-left:22px;border-left:1px solid rgba(255,255,255,0.11);
         display:flex;flex-direction:column;gap:9px;position:relative}
.E4 .sec::before{content:'';position:absolute;left:-3px;top:18px;width:5px;height:5px;border-radius:9999px;
                 background:var(--accent)}
.E4 .bar{height:3px;border-radius:9999px;background:rgba(255,255,255,0.08)}
.E4 .bar span{display:block;height:100%;border-radius:9999px}
.E4 .row{display:flex;flex-direction:column;gap:5px;padding:5px 0}
.E4 .nm{flex:1;font-size:14px;color:var(--hi)}
.E4 .vl{font-size:16px;font-weight:500;font-family:'Geist Mono',ui-monospace,monospace}
.E4 .big{font-size:48px;font-weight:600;letter-spacing:-0.05em;line-height:0.95;
         font-family:'Geist Mono',ui-monospace,monospace}
""",
# ---- E5 EDITORIAL, NUMERAL-LED : the value comes first, the label after ----
'E5': """
.E5 .body{padding:0 22px}
.E5 .sec{padding:14px 0;border-top:1px solid rgba(255,255,255,0.10);display:flex;flex-direction:column;gap:8px}
.E5 .sec:first-child{border-top:none;padding-top:6px}
.E5 .bar{height:2px;border-radius:9999px;background:rgba(255,255,255,0.07)}
.E5 .bar span{display:block;height:100%;border-radius:9999px}
.E5 .row{display:flex;align-items:baseline;gap:10px;padding:4px 0}
.E5 .nm{flex:1;font-size:13px;letter-spacing:0.02em;color:var(--lo);order:2}
.E5 .vl{font-size:22px;font-weight:600;letter-spacing:-0.03em;width:52px;order:1;
        font-family:'Geist Mono',ui-monospace,monospace}
.E5 .big{font-size:60px;font-weight:600;letter-spacing:-0.055em;line-height:0.9;
         font-family:'Geist Mono',ui-monospace,monospace}
""",
}

FAT = [('Chest',78,'var(--pos)'),('Back',88,'var(--pos)'),('Quads',36,'var(--live)'),
       ('Hams',59,'var(--warn)'),('Shldr',92,'var(--pos)'),('Arms',70,'var(--pos)')]
SPARK = 'M4 50 L18 47 L32 48 L46 43 L60 44 L74 38 L88 39 L102 33 L116 34 L130 27 L144 28 L158 21 L172 18'

def ico(kind, col, sw=1.6):
    P = {'today':'<circle cx="11" cy="11" r="8"></circle><path d="M11 5.4 A5.6 5.6 0 0 1 16.6 11"></path>',
         'session':'<path d="M3 11h16"></path><rect x="4.5" y="7" width="3.2" height="8" rx="1"></rect>'
                   '<rect x="14.3" y="7" width="3.2" height="8" rx="1"></rect>',
         'strength':'<path d="M3 16 L8 11 L12 13.5 L19 6"></path><path d="M19 10.5 V6 h-4.5"></path>',
         'load':'<path d="M4 17V11"></path><path d="M8.6 17V7"></path><path d="M13.3 17V13"></path>'
                '<path d="M18 17V9"></path>'}[kind]
    return ('<svg viewBox="0 0 22 22" style="width:22px;height:22px;flex:none" fill="none" stroke="%s" '
            'stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</svg>' % (col, sw, P))

def nav():
    tabs = lambda ts: ''.join(
      '<div class="tabi">%s<span class="tabl" style="color:%s">%s</span></div>'
      % (ico(k, 'var(--accent)' if on else 'var(--lo)', 1.9 if on else 1.5),
         'var(--accent)' if on else 'var(--lo)', lab) for k, lab, on in ts)
    return ('<div class="nav"><div class="glass" style="flex:1;border-radius:26px;padding:4px;display:flex;'
            'align-items:center">'
            + tabs([('today','Today',True),('session','Session',False)])
            + '<div style="width:66px;flex:none;display:flex;justify-content:center">'
              '<div class="fab" style="width:52px;height:52px">'
              '<svg viewBox="0 0 24 24" style="width:22px;height:22px" fill="none" stroke="#15130f" '
              'stroke-width="2.1" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg></div></div>'
            + tabs([('strength','Strength',False),('load','Load',False)]) + '</div></div>')

def quarter(sk):
    return ('<span class="gl" style="left:25%"></span><span class="gl" style="left:50%"></span>'
            '<span class="gl" style="left:75%"></span>') if sk == 'E1' else ''

def fatrows(sk):
    out = []
    for n, v, c in FAT:
        if sk in ('E1','E2'):
            out.append('<div class="row"><span class="nm">%s</span>'
                       '<div class="bar" style="flex:1;margin:0 10px">%s<span style="width:%d%%;background:%s"></span></div>'
                       '<span class="vl" style="color:%s">%d</span></div>'
                       % (n.upper() if sk == 'E1' else n, quarter(sk), v, c, c, v))
        else:
            out.append('<div class="row"><div class="r" style="gap:10px">'
                       '<span class="nm">%s</span><span class="vl" style="color:%s">%d</span>'
                       '<span class="mono" style="font-size:11px;color:var(--dim)">%%</span></div>'
                       '<div class="bar"><span style="width:%d%%;background:%s"></span></div></div>'
                       % (n, c, v, v, c))
    return ''.join(out)

ZONES = [('Too few',30,'rgba(255,255,255,0.10)'),('Good',25,'rgba(159,174,58,0.62)'),
         ('Hard',27,'rgba(232,178,58,0.62)'),('Too much',18,'rgba(223,84,65,0.70)')]
def zonebar(sk):
    rad = '0' if sk == 'E1' else ('6px' if sk == 'E2' else '9999px')
    h = '14px' if sk in ('E1','E2') else '3px'
    return ('<div style="position:relative;height:%s;display:flex;gap:%s">' % (h, '0' if sk=='E1' else '2px')
            + ''.join('<span style="width:%d%%;background:%s;border-radius:%s"></span>' % (w, c, rad)
                      for _, w, c in ZONES)
            + '<span style="position:absolute;left:60%%;top:-6px;bottom:-6px;width:2px;border-radius:%s;'
              'background:var(--hi)"></span></div>' % rad)

def screen(sk):
    heading = ('<span class="mono lbl">WED 26 FEB &middot; W09 D3</span>'
               '<span style="font-size:%dpx;font-weight:600;letter-spacing:-0.025em;color:var(--hi)">%s</span>'
               % (24 if sk != 'E5' else 27, 'Good morning, Alex'))
    return f'''<div class="phone {sk}">
  <div class="field"></div>
  <div class="bloom" style="top:-50px;right:-70px;width:300px;height:300px;background:rgba(228,198,140,0.15)"></div>
  <div class="bloom" style="bottom:130px;left:-80px;width:280px;height:240px;background:rgba(159,174,58,0.08)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="body">
    <div class="sec">{heading}</div>

    <div class="sec">
      <div class="r"><span class="mono lbl">READINESS</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--pos)">TRAIN AS PLANNED</span></div>
      <div class="r" style="align-items:flex-end;gap:14px">
        <div class="r" style="flex:none;gap:5px;align-items:baseline">
          <span class="big" style="color:var(--hi)">82</span>
          <span class="mono" style="font-size:12px;color:var(--lo)">/ 100</span></div>
        <div style="flex:1;min-width:0;padding-bottom:7px">
          <div class="bar">{quarter(sk)}<span style="width:82%;background:var(--pos)"></span></div></div></div>
    </div>

    <div class="sec">
      <span class="mono lbl">READY TO TRAIN</span>
      {fatrows(sk)}
    </div>

    <div class="sec">
      <div class="r"><span class="mono lbl">VOLUME &middot; CHEST</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--warn)">18 SETS</span></div>
      {zonebar(sk)}
      <div class="r" style="font-size:11px">
        <span class="mono" style="width:30%;color:var(--dim)">Too few</span>
        <span class="mono" style="width:25%;color:var(--pos)">Good</span>
        <span class="mono" style="width:27%;color:var(--warn)">Hard</span>
        <span class="mono" style="flex:1;color:var(--live)">Too much</span></div>
    </div>

    <div class="sec">
      <div class="r" style="align-items:flex-end;gap:16px">
        <div style="flex:none"><span class="mono lbl">BODYWEIGHT</span>
          <div class="r" style="gap:5px;align-items:baseline;margin-top:3px">
            <span class="big" style="color:var(--hi)">81.0</span>
            <span class="mono" style="font-size:12px;color:var(--lo)">KG</span></div></div>
        <div style="flex:1;min-width:0;padding-bottom:5px">
          <svg viewBox="0 0 180 62" style="width:100%;height:46px">
            <path d="{SPARK}" fill="none" stroke="var(--accent)" stroke-width="2"
                  stroke-linejoin="round" stroke-linecap="{'butt' if sk == 'E1' else 'round'}"></path>
            <circle cx="172" cy="18" r="3.5" fill="var(--accent)"></circle></svg></div></div>
    </div>
  </div>
  <div class="scrim"></div>
  {nav()}
</div>'''

COLS = [
 ('E1','Precise','Lab 16 T1, built out',
  'Hairlines, square bar terminals, zero radii, tracked mono labels, and quarter-marks sitting behind every bar so a length is readable as a value rather than just a length.',
  'The most instrument-like of the five and the least forgiving &mdash; with nothing rounded, any misalignment shows immediately. It also reads coldest, which may be right for a screen you check mid-set.'),
 ('E2','Soft','Lab 16 T2, built out',
  'Every section becomes a raised plate with a 22px radius and a real shadow. Bars thicken to 10px, labels go sentence case, hairlines disappear entirely.',
  'Warmest and most conventional. It is also the only one here where the cards compete with the content &mdash; six plates stacked is six objects before it is any information.'),
 ('E3','Editorial','Lab 21, unchanged',
  'Hairline above each section, type doing the grouping, rounded caps at 3px. No boxes anywhere.',
  'The one you picked. Holds up across six stacked sections, which is the real test &mdash; the hairlines never accumulate into clutter the way borders do.'),
 ('E4','Editorial, railed','A vertical rule instead of horizontal ones',
  'The same editorial rules, but sections hang off a single continuous line down the left with a small node marking each one. Nothing separates them horizontally at all.',
  'Reads as one continuous document rather than a stack of blocks, and the rail gives the eye somewhere to travel. Costs 22pt of width, and the nodes need to mean something or they are decoration.'),
 ('E5','Editorial, numeral-led','The value comes first',
  'Order inverted: the number leads each row and the label follows it, set smaller and dimmer. Bars drop to 2px because at this size the numeral is unambiguously the content.',
  'The most confident and the most opinionated. Excellent for a screen of six known metrics; poor the moment a label is one you do not already recognise.'),
]

css = BASE + '\n'.join(SKINS.values())
cols = ''.join(
  '<div class="col"><div class="cap"><span class="k">%s</span><span class="t">%s</span>'
  '<span class="s">%s</span><span class="d">%s</span><span class="w">%s</span></div>%s</div>'
  % (c[0], c[1], c[2], c[3], c[4], screen(c[0])) for c in COLS)

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
  <div style="display:flex;flex-direction:column;gap:36px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:920px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 25</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">The other two, and three more</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Precise and Soft built out as whole screens the way Editorial was, plus <span style="color:#f0efec">two further editorial variations</span>. Same content, same palette, same navigation in all five &mdash; only the drawing language moves.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Six sections is the real test. A style that looks composed as a single specimen can turn into noise once it repeats, and that is exactly what separates E2 from the rest here: stack six raised plates and you have counted six objects before you have read one number.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Palette is V2 from Lab&nbsp;22 and the bar is W2 from Lab&nbsp;23, so the decisions you have already made are all visible together.</p>
    </div>
    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab25.html','w').write(HTML)
print('wrote lab25.html', len(HTML))
