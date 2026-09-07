CSS = """
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
  .cap .s{font-size:13px;color:#e4c68c}
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

  /* ---- E6 : editorial, no rules at all. spacing is the only separator ---- */
  .E6 .body{padding:0 22px}
  .E6 .sec{padding:46px 0 4px;display:flex;flex-direction:column;gap:11px}
  .E6 .sec:first-child{padding-top:8px}
  .E6 .bar{height:3px;border-radius:9999px;background:rgba(255,255,255,0.08)}
  .E6 .bar span{display:block;height:100%;border-radius:9999px}
  .E6 .row{display:flex;flex-direction:column;gap:6px;padding:7px 0}
  .E6 .nm{flex:1;font-size:14px;color:var(--hi)}
  .E6 .vl{font-size:17px;font-weight:500;font-family:'Geist Mono',ui-monospace,monospace}
  .E6 .big{font-size:48px;font-weight:600;letter-spacing:-0.05em;line-height:0.95;
           font-family:'Geist Mono',ui-monospace,monospace}

  /* ---- the rail, with the dots cut free of the line ---- */
  .rail{display:flex;flex-direction:column}
  .rw{display:flex;gap:16px;min-height:126px}
  .rgut{width:11px;flex:none;display:flex;flex-direction:column;align-items:center}
  .rline{width:1px;background:rgba(255,255,255,0.13)}
  .rline.top{flex:none;height:15px;margin-bottom:9px}
  .rline.bot{flex:1;margin-top:9px}
  .rdot{width:9px;height:9px;border-radius:9999px;flex:none;background:var(--off);
        box-shadow:0 0 0 3px var(--ground)}
  .rdot.on{background:var(--accent)}
  .rdot.pr{background:var(--pos)}
  .rbody{flex:1;min-width:0;padding:0 0 56px;display:flex;flex-direction:column;gap:8px}
  .pill{font-size:11px;letter-spacing:0.10em;padding:2px 7px;border-radius:5px;
        font-family:'Geist Mono',ui-monospace,monospace}
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

def nav(active='today'):
    tabs = lambda ts: ''.join(
      '<div class="tabi">%s<span class="tabl" style="color:%s">%s</span></div>'
      % (ico(k, 'var(--accent)' if k == active else 'var(--lo)', 1.9 if k == active else 1.5),
         'var(--accent)' if k == active else 'var(--lo)', lab) for k, lab in ts)
    return ('<div class="nav"><div class="glass" style="flex:1;border-radius:26px;padding:4px;display:flex;'
            'align-items:center">' + tabs([('today','Today'),('session','Session')])
            + '<div style="width:66px;flex:none;display:flex;justify-content:center">'
              '<div class="fab" style="width:52px;height:52px">'
              '<svg viewBox="0 0 24 24" style="width:22px;height:22px" fill="none" stroke="#15130f" '
              'stroke-width="2.1" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg></div></div>'
            + tabs([('strength','Strength'),('load','Load')]) + '</div></div>')

FAT = [('Chest',78,'var(--pos)'),('Back',88,'var(--pos)'),('Quads',36,'var(--live)'),
       ('Hams',59,'var(--warn)'),('Shldr',92,'var(--pos)'),('Arms',70,'var(--pos)')]
SPARK = 'M4 50 L18 47 L32 48 L46 43 L60 44 L74 38 L88 39 L102 33 L116 34 L130 27 L144 28 L158 21 L172 18'
ZONES = [(30,'rgba(255,255,255,0.10)'),(25,'rgba(159,174,58,0.62)'),
         (27,'rgba(232,178,58,0.62)'),(18,'rgba(223,84,65,0.70)')]

TODAY = '''<div class="phone E6">
  <div class="field"></div>
  <div class="bloom" style="top:-50px;right:-70px;width:300px;height:300px;background:rgba(228,198,140,0.15)"></div>
  <div class="bloom" style="bottom:130px;left:-80px;width:280px;height:240px;background:rgba(159,174,58,0.08)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="body">
    <div class="sec">
      <span class="mono lbl">WED 26 FEB &middot; W09 D3</span>
      <span style="font-size:25px;font-weight:600;letter-spacing:-0.025em;color:var(--hi)">Good morning, Alex</span>
    </div>

    <div class="sec">
      <div class="r"><span class="mono lbl">READINESS</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--pos)">TRAIN AS PLANNED</span></div>
      <div class="r" style="align-items:flex-end;gap:14px">
        <div class="r" style="flex:none;gap:5px;align-items:baseline">
          <span class="big" style="color:var(--hi)">82</span>
          <span class="mono" style="font-size:12px;color:var(--lo)">/ 100</span></div>
        <div style="flex:1;min-width:0;padding-bottom:8px">
          <div class="bar"><span style="width:82%;background:var(--pos)"></span></div></div></div>
    </div>

    <div class="sec">
      <span class="mono lbl">READY TO TRAIN</span>''' + ''.join(
      '<div class="row"><div class="r" style="gap:10px">'
      '<span class="nm">%s</span><span class="vl" style="color:%s">%d</span>'
      '<span class="mono" style="font-size:11px;color:var(--dim)">%%</span></div>'
      '<div class="bar"><span style="width:%d%%;background:%s"></span></div></div>' % (n, c, v, v, c)
      for n, v, c in FAT) + '''
    </div>

    <div class="sec">
      <div class="r"><span class="mono lbl">VOLUME &middot; CHEST</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--warn)">18 SETS</span></div>
      <div style="position:relative;height:3px;display:flex;gap:2px">''' + ''.join(
      '<span style="width:%d%%;background:%s;border-radius:9999px"></span>' % z for z in ZONES) + '''
        <span style="position:absolute;left:60%;top:-7px;bottom:-7px;width:2px;border-radius:9999px;background:var(--hi)"></span></div>
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
            <line x1="0" y1="56" x2="180" y2="56" stroke="rgba(255,255,255,0.16)" stroke-width="1"></line>
            <line x1="0" y1="30" x2="180" y2="30" stroke="rgba(255,255,255,0.06)" stroke-width="1"></line>
            <path d="''' + SPARK + ''' L172 56 L4 56 Z" fill="rgba(228,198,140,0.13)" stroke="none"></path>
            <path d="''' + SPARK + '''" fill="none" stroke="var(--accent)" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"></path>
            <circle cx="172" cy="18" r="3.5" fill="var(--accent)"></circle></svg></div></div>
    </div>
  </div>
  <div class="scrim"></div>
  ''' + nav('today') + '''
</div>'''

# ---------- rail-based history ----------
CHART = '''<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:5px"><div style="display:flex;gap:5px;align-items:flex-end;height:52px"><div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:5px;height:100%"><span style="width:100%;height:38%;border-radius:3px 3px 0 0;background:rgba(228,198,140,0.34)"></span></div><div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:5px;height:100%"><span style="width:100%;height:50%;border-radius:3px 3px 0 0;background:rgba(228,198,140,0.34)"></span></div><div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:5px;height:100%"><span style="width:100%;height:62%;border-radius:3px 3px 0 0;background:rgba(228,198,140,0.34)"></span></div><div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:5px;height:100%"><span style="width:100%;height:67%;border-radius:3px 3px 0 0;background:rgba(228,198,140,0.34)"></span></div><div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:5px;height:100%"><span style="width:100%;height:79%;border-radius:3px 3px 0 0;background:rgba(228,198,140,0.34)"></span></div><div style="flex:1;display:flex;flex-direction:column;justify-content:flex-end;gap:5px;height:100%"><span style="width:100%;height:92%;border-radius:3px 3px 0 0;background:var(--accent)"></span></div></div><div style="height:1px;background:rgba(255,255,255,0.16)"></div><div class="r"><span class="mono" style="font-size:11px;color:var(--dim)">6 SESSIONS</span><span class="sp"></span><span class="mono" style="font-size:11px;color:var(--dim)">108 &ndash; 132 KG</span></div></div>'''

HIST = [
 ('26 FEB','TODAY','102.5','8','8.0','130','on','+3 e1RM','var(--pos)'),
 ('22 FEB','4 DAYS AGO','100.0','8','7.5','127','pr','BEST SET VOLUME','var(--pos)'),
 ('18 FEB','8 DAYS AGO','100.0','7','8.0','124','','','' ),
 ('14 FEB','12 DAYS AGO','97.5','8','8.5','123','','','' ),
 ('10 FEB','16 DAYS AGO','97.5','7','8.0','120','pr','HEAVIEST WEIGHT','var(--accent)'),
 ('06 FEB','20 DAYS AGO','95.0','8','7.5','117','','','' ),
]
def rail_rows():
    out = []
    n = len(HIST)
    for i, (d, ago, kg, rep, rpe, e1, kind, badge, bc) in enumerate(HIST):
        dot = 'rdot on' if kind == 'on' else ('rdot pr' if kind == 'pr' else 'rdot')
        top = '<span class="rline top"%s></span>' % (' style="visibility:hidden"' if i == 0 else '')
        bot = '<span class="rline bot"%s></span>' % (' style="visibility:hidden"' if i == n-1 else '')
        pill = ('<span class="pill" style="background:rgba(255,255,255,0.06);color:%s">%s</span>' % (bc, badge)) if badge else ''
        out.append(
          '<div class="rw"><div class="rgut">%s<span class="%s"></span>%s</div>'
          '<div class="rbody">'
          '<div class="r" style="gap:9px"><span class="mono" style="font-size:11px;letter-spacing:0.14em;'
          'color:%s">%s</span><span class="mono" style="font-size:11px;color:var(--dim)">%s</span>'
          '<span class="sp"></span>%s</div>'
          '<div class="r" style="gap:6px;align-items:baseline">'
          '<span class="mono" style="font-size:26px;font-weight:600;letter-spacing:-0.035em;color:%s">%s</span>'
          '<span class="mono" style="font-size:12px;color:var(--lo)">KG</span>'
          '<span class="mono" style="font-size:18px;font-weight:500;color:var(--mid);margin-left:6px">&times;%s</span>'
          '<span class="sp"></span>'
          '<span class="mono" style="font-size:11px;color:var(--dim)">RPE %s</span>'
          '<span class="mono" style="font-size:13px;color:var(--accent);margin-left:9px">%s</span></div>'
          '</div></div>'
          % (top, dot, bot,
             'var(--accent)' if kind == 'on' else 'var(--lo)', d, ago, pill,
             'var(--hi)' if kind == 'on' else 'var(--mid)', kg, rep, rpe, e1))
    return ''.join(out)

HISTORY = '''<div class="phone">
  <div class="field"></div>
  <div class="bloom" style="top:-40px;left:-60px;width:280px;height:280px;background:rgba(228,198,140,0.12)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="body" style="padding:0 22px">
    <div style="padding:6px 0 4px;display:flex;flex-direction:column;gap:4px">
      <span class="mono lbl">HISTORY</span>
      <span style="font-size:25px;font-weight:600;letter-spacing:-0.025em;color:var(--hi)">Barbell Squat</span>
      <div class="r" style="gap:14px;padding-top:6px">
        <div><span class="mono lbl">e1RM</span>
          <div class="r" style="gap:4px;align-items:baseline">
            <span class="mono" style="font-size:30px;font-weight:600;letter-spacing:-0.04em;color:var(--hi)">130</span>
            <span class="mono" style="font-size:11px;color:var(--pos)">+13</span></div></div>
        ''' + CHART + '''</div>
    </div>
    <div class="rail" style="padding-top:18px">''' + rail_rows() + '''</div>
  </div>
  <div class="scrim"></div>
  ''' + nav('strength') + '''
</div>'''

# ---------- the same rail as a session list ----------
SESS = [('WED 26 FEB','Lower A','5 lifts &middot; 18 sets','3.7 T','on','LIVE','var(--live)'),
        ('MON 24 FEB','Upper B','6 lifts &middot; 21 sets','4.2 T','pr','2 PR','var(--pos)'),
        ('SAT 22 FEB','Lower B','5 lifts &middot; 17 sets','3.4 T','',''  ,''),
        ('THU 20 FEB','Upper A','6 lifts &middot; 20 sets','4.0 T','',''  ,''),
        ('TUE 18 FEB','Lower A','5 lifts &middot; 18 sets','3.6 T','pr','1 PR','var(--pos)'),
        ('SUN 16 FEB','Upper B','6 lifts &middot; 19 sets','3.9 T','',''  ,'')]
def sess_rows():
    out = []
    n = len(SESS)
    for i, (d, nm, meta, vol, kind, badge, bc) in enumerate(SESS):
        dot = 'rdot on' if kind == 'on' else ('rdot pr' if kind == 'pr' else 'rdot')
        top = '<span class="rline top"%s></span>' % (' style="visibility:hidden"' if i == 0 else '')
        bot = '<span class="rline bot"%s></span>' % (' style="visibility:hidden"' if i == n-1 else '')
        pill = ('<span class="pill" style="background:rgba(255,255,255,0.06);color:%s">%s</span>' % (bc, badge)) if badge else ''
        out.append(
          '<div class="rw" style="min-height:112px"><div class="rgut">%s<span class="%s"></span>%s</div>'
          '<div class="rbody">'
          '<div class="r" style="gap:9px"><span class="mono" style="font-size:11px;letter-spacing:0.14em;'
          'color:%s">%s</span><span class="sp"></span>%s</div>'
          '<div class="r" style="gap:8px;align-items:baseline">'
          '<span style="font-size:18px;font-weight:600;color:%s">%s</span><span class="sp"></span>'
          '<span class="mono" style="font-size:17px;font-weight:500;color:var(--accent)">%s</span></div>'
          '<span class="mono" style="font-size:11px;color:var(--dim)">%s</span>'
          '</div></div>'
          % (top, dot, bot, 'var(--accent)' if kind == 'on' else 'var(--lo)', d, pill,
             'var(--hi)' if kind == 'on' else 'var(--mid)', nm, vol, meta))
    return ''.join(out)

SESSIONS = '''<div class="phone">
  <div class="field"></div>
  <div class="bloom" style="top:-40px;right:-60px;width:280px;height:280px;background:rgba(159,174,58,0.10)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="body" style="padding:0 22px">
    <div style="padding:6px 0 10px;display:flex;flex-direction:column;gap:4px">
      <span class="mono lbl">FEBRUARY</span>
      <span style="font-size:25px;font-weight:600;letter-spacing:-0.025em;color:var(--hi)">18 sessions</span>
    </div>
    <div class="rail">''' + sess_rows() + '''</div>
  </div>
  <div class="scrim"></div>
  ''' + nav('session') + '''
</div>'''

COLS = [
 ('E6','Today, no rules','E4 with the rail taken out',
  'Everything you liked about E4 &mdash; the larger numerals, rows without bottom borders, generous vertical rhythm &mdash; and the vertical rule removed. Nothing separates the sections but space.',
  'Section gap is 46pt against 7pt inside a row &mdash; better than six to one. With no rules at all that ratio <em>is</em> the structure, so it is worth writing into the tokens rather than leaving to eyeballing later.', TODAY),
 ('R1','Exercise history','The rail, where it belongs',
  'Every session on one lift, hung off a continuous line. Dots are cut free of it as you asked &mdash; each segment stops 6pt short, so the dot floats in a gap instead of sitting on the wire.',
  'Each entry now has 56pt of clear space beneath it. The dot gap alone was not enough &mdash; it separated the <em>line</em> but not the <em>content</em>, so the rows still ran together. Gold marks today, green marks a PR.', HISTORY),
 ('R2','Session list','The same pattern, coarser',
  'The month of sessions rather than the history of one lift. Same rail, same disconnected dots, larger rows.',
  'Proof the pattern travels. It should be the standard for anything chronological in the app &mdash; exercise history, session list, PR timeline &mdash; so that a rail always means &ldquo;these are events in order&rdquo; and never anything else.', SESSIONS),
]

cols = ''.join(
  '<div class="col"><div class="cap"><span class="k">%s</span><span class="t">%s</span>'
  '<span class="s">%s</span><span class="d">%s</span><span class="w">%s</span></div>%s</div>' % c for c in COLS)

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
  <div style="display:flex;flex-direction:column;gap:38px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:920px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 27</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Rules off, rail on</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Two decisions, both yours. The main screen takes E4 <span style="color:#f0efec">without the rail</span> &mdash; larger numerals, no row borders, no section rules, spacing carrying all the grouping. And the rail moves to where you said it belonged: anything chronological.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The dots are now cut free of the line. Each segment stops 6pt short of its node, so the dot sits in a gap rather than on the wire. That is not only nicer &mdash; an unbroken line reads as one continuous thing, whereas a line broken at every node reads as <span style="color:#96938c">a sequence of discrete events</span>, which is what a history actually is.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Spacing is doubled from the last pass, in both places. On the main screen the gap between sections is now 46pt, which is the whole point &mdash; if space is the only separator then it has to be <span style="color:#96938c">unmistakably more</span> than the space inside a section, or the eye cannot tell where one ends. Same rule on the rail: each event now gets 56pt of clear air below it, so the nodes read as distinct entries rather than a continuous column.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The ratio to hold onto: <b style="color:#c9c3b6;font-weight:500">between-section space should be at least three times the within-section space</b>. Below that it reads as a rhythm error rather than a boundary.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The e1RM chart is also rebuilt. A bare sparkline floating in white space has no ground to be read against &mdash; it was a line going up, with no sense of <em>from where</em>. It is now a <span style="color:#96938c">column chart with a baseline and a stated range</span>, so each session is a discrete bar and the axis says what the height means. The bodyweight trend keeps its line but gains a baseline, a mid rule and a fill, for the same reason.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66"><b style="color:#c9c3b6;font-weight:500">Typeface is now Geist and Geist Mono</b>, as chosen in Lab&nbsp;09 &mdash; every board up to this point was still running Inter and JetBrains Mono. Palette V2, navigation W2.</p>
    </div>
    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab27.html','w').write(HTML)
print('wrote lab27.html', len(HTML))
