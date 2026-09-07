CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--ground:#0a0908;--panel:#15130f;--raised:#221f19;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;
        --warn:#e8b23a;--hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b;
        --tick1:#5a5449;--tick2:#7d7666;--tick3:#a8a091}
  .board{display:flex;gap:32px;align-items:flex-start;overflow-x:auto;padding-bottom:8px}
  .col{flex:none;width:402px;display:flex;flex-direction:column;gap:14px}
  .cap{display:flex;flex-direction:column;gap:5px;min-height:96px}
  .cap .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .cap .t{font-size:16px;font-weight:600;color:#f0efec}
  .cap .d{font-size:13px;line-height:1.6;color:#96938c}
  .phone{width:402px;height:860px;border-radius:34px;overflow:hidden;position:relative;display:flex;
         flex-direction:column;background:var(--ground);border:1px solid rgba(255,255,255,0.08)}
  .field{position:absolute;inset:0;pointer-events:none;z-index:0;
         background-image:radial-gradient(rgba(255,255,255,0.035) 1px,transparent 1px);background-size:18px 18px}
  .bloom{position:absolute;border-radius:9999px;pointer-events:none;z-index:0;filter:blur(88px)}
  .sb{position:relative;z-index:2;height:56px;flex:none;display:flex;align-items:center;
      justify-content:space-between;padding:0 26px;font-size:15px;font-weight:600;color:var(--hi)}
  .sb i{width:22px;height:11px;border-radius:3px;border:1px solid var(--lo);display:block}
  .body{position:relative;z-index:2;flex:1;min-height:0;padding:0 22px;display:flex;flex-direction:column;gap:0;overflow:hidden}
  .scrim{position:absolute;left:0;right:0;bottom:86px;height:70px;z-index:2;pointer-events:none;background:linear-gradient(rgba(10,9,8,0), rgba(10,9,8,0.94))}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}

  /* --- editorial, rounded --- */
  .sec{padding:11px 0;border-top:1px solid rgba(255,255,255,0.10);display:flex;flex-direction:column;gap:9px}
  .sec:first-child{border-top:none;padding-top:6px}
  .hair{height:1px;background:rgba(255,255,255,0.07)}
  .bar{height:3px;border-radius:9999px;background:rgba(255,255,255,0.08);overflow:hidden}
  .bar span{display:block;height:100%;border-radius:9999px}
  .row{display:flex;flex-direction:column;gap:4px;padding:4px 0;border-bottom:1px solid rgba(255,255,255,0.055)}
  .row:last-child{border-bottom:none}

  .glass{background:rgba(255,255,255,0.09);backdrop-filter:blur(30px) saturate(180%);
         -webkit-backdrop-filter:blur(30px) saturate(180%);border:0.5px solid rgba(255,255,255,0.19);
         box-shadow:inset 0 1px 0 rgba(255,255,255,0.36), 0 10px 28px rgba(0,0,0,0.42)}
  .nav{position:relative;z-index:3;flex:none;margin:0 16px 30px;display:flex;gap:9px;align-items:center}
"""

def ico(kind, col, sw=1.6):
    P = {'today':'<circle cx="11" cy="11" r="8"></circle><path d="M11 5.4 A5.6 5.6 0 0 1 16.6 11"></path>',
         'session':'<path d="M3 11h16"></path><rect x="4.5" y="7" width="3.2" height="8" rx="1"></rect>'
                   '<rect x="14.3" y="7" width="3.2" height="8" rx="1"></rect>',
         'strength':'<path d="M3 16 L8 11 L12 13.5 L19 6"></path><path d="M19 10.5 V6 h-4.5"></path>',
         'load':'<path d="M4 17V11"></path><path d="M8.6 17V7"></path><path d="M13.3 17V13"></path>'
                '<path d="M18 17V9"></path>'}[kind]
    return ('<svg viewBox="0 0 22 22" style="width:22px;height:22px;flex:none" fill="none" stroke="%s" '
            'stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</svg>' % (col, sw, P))

def nav(active, action):
    items = ''.join(
      '<div style="flex:1;min-height:52px;display:flex;align-items:center;justify-content:center">%s</div>'
      % ico(k, 'var(--accent)' if k == active else 'var(--lo)', 1.9 if k == active else 1.5)
      for k in ('today','session','strength','load'))
    return ('<div class="nav"><div class="glass" style="flex:1;border-radius:22px;padding:2px;display:flex">'
            + items + '</div>'
            '<div style="min-height:56px;padding:0 22px;display:flex;align-items:center;border-radius:22px;'
            'background:var(--accent);box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 26px rgba(0,0,0,0.45)">'
            '<span style="font-size:15px;font-weight:600;color:#15130f">%s</span></div></div>' % action)

def big(v, unit, col='var(--hi)', size=44):
    return ('<div class="r" style="gap:5px;align-items:baseline">'
            '<span class="mono" style="font-size:%dpx;font-weight:600;letter-spacing:-0.045em;line-height:0.95;'
            'color:%s">%s</span><span class="mono" style="font-size:12px;color:var(--lo)">%s</span></div>'
            % (size, col, v, unit))

FAT = [('Chest',78,'var(--pos)'),('Back',88,'var(--pos)'),('Quads',36,'var(--live)'),
       ('Hams',59,'var(--warn)'),('Shldr',92,'var(--pos)'),('Arms',70,'var(--pos)')]
def fatrows():
    return ''.join(
      '<div class="row"><div class="r" style="gap:10px">'
      '<span style="flex:1;font-size:14px;color:var(--hi)">%s</span>'
      '<span class="mono" style="font-size:16px;font-weight:500;color:%s">%d</span>'
      '<span class="mono" style="font-size:11px;color:var(--dim)">%%</span></div>'
      '<div class="bar"><span style="width:%d%%;background:%s"></span></div></div>' % (n, c, v, v, c)
      for n, v, c in FAT)

ZONES = [('Too few',30,'rgba(255,255,255,0.10)'),('Good',25,'rgba(140,224,127,0.62)'),
         ('Hard',27,'rgba(232,178,58,0.62)'),('Too much',18,'rgba(255,92,26,0.70)')]
def zonebar(mark=60):
    return ('<div style="position:relative;height:3px;display:flex;gap:2px">'
            + ''.join('<span style="width:%d%%;background:%s;border-radius:9999px"></span>' % (w, c)
                      for _, w, c in ZONES)
            + '<span style="position:absolute;left:%d%%;top:-7px;bottom:-7px;width:2px;border-radius:9999px;'
              'background:var(--hi)"></span></div>' % mark)

SPARK = ('M4 50 L18 47 L32 48 L46 43 L60 44 L74 38 L88 39 L102 33 L116 34 L130 27 L144 28 L158 21 L172 18')
def spark(h=52, col='var(--accent)'):
    return ('<svg viewBox="0 0 180 62" style="width:100%%;height:%dpx"><path d="%s" fill="none" stroke="%s" '
            'stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>'
            '<circle cx="172" cy="18" r="3.5" fill="%s"></circle></svg>' % (h, SPARK, col, col))

TODAY = '''<div class="phone">
  <div class="field"></div>
  <div class="bloom" style="top:-50px;right:-70px;width:300px;height:300px;background:rgba(217,201,168,0.16)"></div>
  <div class="bloom" style="bottom:120px;left:-80px;width:280px;height:240px;background:rgba(140,224,127,0.09)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="body">

    <div class="sec">
      <span class="mono lbl">WED 26 FEB &middot; W09 D3</span>
      <span style="font-size:26px;font-weight:600;letter-spacing:-0.025em;color:var(--hi)">Good morning, Alex</span>
    </div>

    <div class="sec">
      <div class="r"><span class="mono lbl">READINESS</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--pos)">TRAIN AS PLANNED</span></div>
      <div class="r" style="align-items:flex-end;gap:14px">
        <div style="flex:none">''' + big('82', '/ 100', 'var(--hi)', 46) + '''</div>
        <div style="flex:1;min-width:0;padding-bottom:8px">
          <div class="bar"><span style="width:82%;background:var(--pos)"></span></div></div></div>
    </div>

    <div class="sec">
      <span class="mono lbl">READY TO TRAIN</span>
      ''' + fatrows() + '''
    </div>

    <div class="sec">
      <div class="r"><span class="mono lbl">VOLUME &middot; CHEST</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--warn)">18 SETS</span></div>
      ''' + zonebar() + '''
      <div class="r" style="font-size:11px">
        <span class="mono" style="width:30%;color:var(--dim)">Too few</span>
        <span class="mono" style="width:25%;color:var(--pos)">Good</span>
        <span class="mono" style="width:27%;color:var(--warn)">Hard</span>
        <span class="mono" style="flex:1;color:var(--live)">Too much</span></div>
    </div>

    <div class="sec">
      <div class="r" style="align-items:flex-end;gap:16px">
        <div style="flex:none">
          <span class="mono lbl">BODYWEIGHT</span>
          ''' + big('81.0', 'KG', 'var(--hi)', 40) + '''
        </div>
        <div style="flex:1;min-width:0;padding-bottom:4px">''' + spark(46) + '''</div></div>
      <div class="hair"></div>
      <div class="r"><span class="mono" style="font-size:11px;color:var(--pos)">&uarr; 0.4 KG PER WEEK</span>
        <span class="sp"></span><span class="mono" style="font-size:11px;color:var(--dim)">LAST 12 WEEKS</span></div>
    </div>

  </div>
  <div class="scrim"></div>
  ''' + nav('today', 'Start') + '''
</div>'''

RAMP = [(True,'40','41 x 5','SET 1'),(True,'60','61 x 3','SET 2'),(True,'75','78 x 2','SET 3'),
        (False,'85','88 x 1','SET 4'),(False,'100','102.5','WORKING')]
LOAD = '''<div class="phone">
  <div class="field"></div>
  <div class="bloom" style="top:60px;left:-70px;width:300px;height:280px;background:rgba(217,201,168,0.14)"></div>
  <div class="bloom" style="bottom:140px;right:-70px;width:280px;height:240px;background:rgba(255,92,26,0.09)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="body">

    <div class="sec">
      <span class="mono lbl">THIS WEEK</span>
      <div class="r" style="align-items:flex-end;gap:16px">
        <div style="flex:none">''' + big('6.20', 'TONNES', 'var(--hi)', 44) + '''</div>
        <div style="flex:1;min-width:0;padding-bottom:6px">''' + spark(46, 'var(--accent)') + '''</div></div>
      <div class="hair"></div>
      <div class="r"><span class="mono" style="font-size:11px;color:var(--pos)">&uarr; 12% ON LAST WEEK</span>
        <span class="sp"></span><span class="mono" style="font-size:11px;color:var(--dim)">TARGET 7.00</span></div>
    </div>

    <div class="sec">
      <span class="mono lbl">SETS AGAINST YOUR LIMITS</span>''' + ''.join(
      '<div class="row"><div class="r" style="gap:10px">'
      '<span style="flex:1;font-size:14px;color:var(--hi)">%s</span>'
      '<span class="mono" style="font-size:16px;font-weight:500;color:%s">%d</span></div>%s</div>'
      % (n, c, v, zonebar(m)) for n, v, c, m in
      [('Chest',18,'var(--warn)',60),('Back',22,'var(--live)',82),('Quads',14,'var(--pos)',44),
       ('Hams',9,'var(--pos)',30),('Shoulders',12,'var(--pos)',38)]) + '''
    </div>

    <div class="sec">
      <div class="r"><span class="mono lbl">DELOAD</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--live)">BACK IS OVER</span></div>
      <span style="font-size:14px;line-height:1.6;color:var(--mid)">Back has crossed its ceiling for a second
        week while estimated max has not moved. Drop to <span style="color:var(--hi)">12 sets</span> next week.</span>
    </div>

    <div class="sec">
      <span class="mono lbl">WARM-UP RAMP &middot; 102.5 KG</span>''' + ''.join(
      '<div class="r" style="gap:12px;padding:6px 0;border-bottom:1px solid rgba(255,255,255,0.055)">'
      '<span style="width:4px;height:16px;border-radius:9999px;background:%s"></span>'
      '<span class="mono" style="width:44px;font-size:15px;font-weight:500;color:%s">%s%%</span>'
      '<span class="mono" style="flex:1;font-size:14px;color:%s">%s</span>'
      '<span class="mono" style="font-size:11px;color:var(--dim)">%s</span></div>'
      % (('var(--accent)' if a else 'var(--off)'), ('var(--accent)' if a else 'var(--dim)'), p,
         ('var(--hi)' if a else 'var(--dim)'), l, tag) for a, p, l, tag in RAMP) + '''
    </div>

  </div>
  <div class="scrim"></div>
  ''' + nav('load', 'Start') + '''
</div>'''

COLS = [
 ('01','Today','Editorial, rounded',
  'Everything you liked about T3 &mdash; a hairline above each section, type doing the grouping, no boxes anywhere &mdash; with every bar cap rounded and the thickness held at 3px.'),
 ('02','Load','The same rules, denser',
  'Five zone bars stacked, a written deload call, and the warm-up ramp as a list. Nothing is boxed and nothing needs explaining.'),
]
cols = ''.join(
  '<div class="col"><div class="cap"><span class="k">%s</span><span class="t">%s</span>'
  '<span class="d" style="color:#d9c9a8">%s</span><span class="d">%s</span></div>%s</div>'
  % (c[0], c[1], c[2], c[3], scr) for c, scr in zip(COLS, [TODAY, LOAD]))

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
    <div style="display:flex;flex-direction:column;gap:16px;max-width:920px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 21</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Editorial, in a real screen</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">T3 with the change you asked for: <span style="color:#f0efec">rounded caps at the same thickness</span>. Two whole screens rather than specimens, because a style that reads well in a swatch can fall apart once six of them stack.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The thing worth noticing is what is missing. There are no cards on either screen &mdash; no panels, no borders, no rounded containers at all. Sections are separated by a single hairline and by the type itself, which is what makes the numerals feel large without actually being large. The Lab&nbsp;20 split action bar is fitted at the bottom so you can see the two decisions together.</p>
    </div>
    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab21.html','w').write(HTML)
print('wrote lab21.html', len(HTML))
