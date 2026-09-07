# Lab 07 - three layout languages (not materials). Same live-session data, reorganised.
CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--ground:#0a0908;--panel:#15130f;--raised:#1c1915;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;
        --hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b;--warn:#e8b23a}
  .board{display:flex;gap:32px;align-items:flex-start;overflow-x:auto;padding-bottom:8px}
  .col{flex:none;width:402px;display:flex;flex-direction:column;gap:14px}
  .cap{display:flex;flex-direction:column;gap:5px;min-height:118px}
  .cap .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .cap .t{font-size:16px;font-weight:600;color:#f0efec}
  .cap .d{font-size:13px;line-height:1.6;color:#96938c}
  .cap .w{font-size:12px;line-height:1.6;color:#7d786e}
  .phone{width:402px;height:860px;border-radius:34px;overflow:hidden;position:relative;display:flex;
         flex-direction:column;background:var(--ground);border:1px solid rgba(255,255,255,0.08)}
  .dots{position:absolute;inset:0;pointer-events:none;z-index:0;
        background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:18px 18px}
  .bloom{position:absolute;border-radius:9999px;pointer-events:none;z-index:0;filter:blur(88px)}
  .sb{position:relative;z-index:2;height:56px;flex:none;display:flex;align-items:center;
      justify-content:space-between;padding:0 26px;font-size:15px;font-weight:600;color:var(--hi)}
  .sb i{width:22px;height:11px;border-radius:3px;border:1px solid var(--lo);display:block}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}

  /* ---------- D1 RACK ---------- */
  .rack{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;gap:2px;
        padding:0 12px;overflow:hidden}
  .rail{height:6px;flex:none;margin:0 12px;border-radius:3px;background:linear-gradient(#222019,#100e0b);
        box-shadow:inset 0 1px 0 rgba(255,255,255,0.10)}
  .mod{display:flex;background:#17150f;border-radius:3px;overflow:hidden;flex:none;
       box-shadow:inset 1px 1px 0 rgba(255,255,255,0.06), inset -1px -1px 0 rgba(0,0,0,0.55)}
  .modspine{width:26px;flex:none;background:#100e0a;display:flex;flex-direction:column;align-items:center;
            justify-content:space-between;padding:8px 0;border-right:1px solid rgba(0,0,0,0.6)}
  .led{width:6px;height:6px;border-radius:9999px;flex:none}
  .modname{writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;letter-spacing:0.20em;
           color:var(--dim);white-space:nowrap}
  .modbody{flex:1;min-width:0;padding:10px 12px;display:flex;flex-direction:column;gap:7px}
  .screw{width:5px;height:5px;border-radius:9999px;background:#2a2720;box-shadow:inset 0 1px 0 rgba(255,255,255,0.12)}

  /* ---------- D2 BENTO ---------- */
  .bento{position:relative;z-index:2;flex:1;min-height:0;padding:0 14px;
         display:grid;grid-template-columns:1fr 1fr;grid-auto-rows:min-content;gap:9px;align-content:start}
  .bt{background:var(--panel);border:1px solid rgba(255,255,255,0.075);border-radius:20px;padding:13px 14px;
      display:flex;flex-direction:column;gap:7px;min-width:0;overflow:hidden}
  .bt.hero{grid-column:span 2;background:rgba(255,255,255,0.07);
           backdrop-filter:blur(26px) saturate(180%);-webkit-backdrop-filter:blur(26px) saturate(180%);
           border:0.5px solid rgba(255,255,255,0.17);
           box-shadow:inset 0 1px 0 rgba(255,255,255,0.32), 0 8px 24px rgba(0,0,0,0.35)}
  .bt.wide{grid-column:span 2}

  /* ---------- D3 CLUSTER ---------- */
  .cluster{position:relative;z-index:2;flex:1;min-height:0;padding:0 16px;display:flex;
           flex-direction:column;align-items:center;gap:12px}
  .dial{position:relative;width:340px;height:340px;flex:none;display:flex;align-items:center;justify-content:center}
  .dialcore{position:absolute;display:flex;flex-direction:column;align-items:center;gap:1px}
  .sat{background:var(--panel);border:1px solid rgba(255,255,255,0.075);border-radius:16px;padding:10px 12px;
       display:flex;flex-direction:column;gap:5px;flex:1;min-width:0}

  .key{min-height:52px;display:flex;align-items:center;justify-content:center;font-size:15px;font-weight:600;
       background:var(--accent);color:#15130f;border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)}
  .keyG{min-height:52px;width:56px;flex:none;display:flex;align-items:center;justify-content:center;font-size:17px;
        background:rgba(255,255,255,0.10);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);
        border:0.5px solid rgba(255,255,255,0.18);border-radius:14px;color:var(--hi)}
  .bar{position:relative;z-index:3;flex:none;margin:8px 18px 30px;display:flex;gap:10px}
"""

def tape(n=44, major=5, idx=None, h='34%', cls='var(--off)'):
    out=[]
    for i in range(n):
        m = i % major == 0
        out.append('<span style="flex:1;border-left:1px solid %s;height:%s"></span>'
                   % ('var(--on)' if m else 'var(--off)', '100%' if m else h))
    return ''.join(out)

def radial_ticks():
    """Full radial tuner collar: 60 ticks over 300deg, major every 5, active arc lit."""
    import math
    out=[]
    for i in range(61):
        a = -240 + i * 5.0            # -240..60 deg
        major = i % 5 == 0
        active = i <= 38
        ln = 17 if major else 9
        col = ('var(--accent)' if i == 38 else ('var(--on)' if active else 'var(--off)'))
        w = 2 if (major or i == 38) else 1
        r0, r1 = 150, 150 - ln
        rad = math.radians(a)
        x1, y1 = 170 + r0*math.cos(rad), 170 + r0*math.sin(rad)
        x2, y2 = 170 + r1*math.cos(rad), 170 + r1*math.sin(rad)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%d"></line>'
                   % (x1, y1, x2, y2, col, w))
    return ''.join(out)

SETS = [('01','100.0','08','7.5','127'),('02','102.5','08','8.0','130'),('03','102.5','07','8.5','128')]

def settable(compact=False):
    return ''.join(
      '<div class="r" style="height:%dpx;font-size:11px">'
      '<span class="mono" style="width:24px;color:var(--dim)">%s</span><span class="sp"></span>'
      '<span class="mono" style="width:50px;text-align:right;color:var(--hi)">%s</span>'
      '<span class="mono" style="width:32px;text-align:right;color:var(--mid)">x %s</span>'
      '<span class="mono" style="width:38px;text-align:right;color:var(--lo)">%s</span>'
      '<span class="mono" style="width:44px;text-align:right;color:var(--accent)">%s</span></div>'
      % ((20 if compact else 23),) + s[0:1] + s[1:] and
      '<div class="r" style="height:%dpx;font-size:11px">'
      '<span class="mono" style="width:24px;color:var(--dim)">%s</span><span class="sp"></span>'
      '<span class="mono" style="width:50px;text-align:right;color:var(--hi)">%s</span>'
      '<span class="mono" style="width:32px;text-align:right;color:var(--mid)">x %s</span>'
      '<span class="mono" style="width:38px;text-align:right;color:var(--lo)">%s</span>'
      '<span class="mono" style="width:44px;text-align:right;color:var(--accent)">%s</span></div>'
      % ((20 if compact else 23),) + tuple(s) for s in SETS)

def segs(states):
    m={'d':'var(--pos)','c':'var(--accent)','o':'var(--off)'}
    return ''.join('<span style="flex:1;height:4px;border-radius:2px;background:%s"></span>' % m[x] for x in states)

# ---------------- D1 : RACK ----------------
def rack_mod(name, led, body, spine_extra=True):
    return ('<div class="mod"><div class="modspine">'
            '<span class="screw"></span>'
            '<span class="modname mono">%s</span>'
            '<span class="led" style="background:%s"></span></div>'
            '<div class="modbody">%s</div></div>' % (name, led, body))

D1 = '''<div class="phone">
  <div class="dots"></div>
  <div class="bloom" style="top:80px;left:-80px;width:300px;height:300px;background:rgba(217,201,168,0.18)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="rack">
    <div class="rail"></div>
''' + rack_mod('TRANSPORT', 'var(--live)',
    '<div class="r" style="gap:10px"><span class="mono" style="font-size:21px;font-weight:500;color:var(--hi)">00:31:17</span>'
    '<span class="sp"></span><span class="mono lbl">12 SETS</span><span class="mono lbl">3.7 T</span></div>'
    '<div class="r" style="gap:4px">' + segs('dddco') + '</div>'
) + rack_mod('LIFT', 'var(--accent)',
    '<div class="r" style="gap:8px"><span style="font-size:19px;font-weight:600;color:var(--hi)">Barbell Squat</span>'
    '<span class="sp"></span><span class="mono lbl">QUADS</span></div>'
    '<div class="r" style="gap:6px"><span class="mono lbl">SET 4 OF 5</span><span class="sp"></span>'
    '<span class="mono lbl" style="color:var(--pos)">e1RM 130</span></div>'
) + rack_mod('LOAD', 'var(--accent)',
    '<div class="r" style="gap:6px;align-items:baseline">'
    '<span class="mono" style="font-size:44px;font-weight:600;letter-spacing:-0.04em;color:var(--hi)">102.5</span>'
    '<span class="mono" style="font-size:13px;color:var(--mid)">KG</span><span class="sp"></span>'
    '<span class="mono" style="font-size:44px;font-weight:600;letter-spacing:-0.04em;color:var(--hi)">8</span>'
    '<span class="mono" style="font-size:13px;color:var(--mid)">REPS</span></div>'
    '<div style="position:relative;height:30px;display:flex;align-items:flex-end">' + tape(46) +
    '<span style="position:absolute;left:50%;top:0;bottom:0;border-left:2px solid var(--accent)"></span></div>'
) + rack_mod('RPE', 'var(--warn)',
    '<div class="r" style="gap:4px">' + ''.join(
      '<span style="flex:1;height:15px;border-radius:1px;background:%s"></span>'
      % ('var(--accent)' if i==7 else ('var(--on)' if i<7 else 'var(--off)')) for i in range(10)) +
    '<span class="mono" style="font-size:13px;color:var(--accent);margin-left:8px">8.0</span></div>'
    '<div class="r"><span class="mono lbl">RIR 2</span><span class="sp"></span>'
    '<span class="mono lbl">TARGET 7&ndash;8</span></div>'
) + rack_mod('LOG', 'var(--pos)',
    '<div class="r" style="height:15px"><span class="mono lbl" style="width:24px">SET</span><span class="sp"></span>'
    '<span class="mono lbl" style="width:50px;text-align:right">KG</span>'
    '<span class="mono lbl" style="width:32px;text-align:right">REP</span>'
    '<span class="mono lbl" style="width:38px;text-align:right">RPE</span>'
    '<span class="mono lbl" style="width:44px;text-align:right">e1RM</span></div>' +
    ''.join('<div class="r" style="height:19px;font-size:11px">'
      '<span class="mono" style="width:24px;color:var(--dim)">%s</span><span class="sp"></span>'
      '<span class="mono" style="width:50px;text-align:right;color:var(--hi)">%s</span>'
      '<span class="mono" style="width:32px;text-align:right;color:var(--mid)">%s</span>'
      '<span class="mono" style="width:38px;text-align:right;color:var(--lo)">%s</span>'
      '<span class="mono" style="width:44px;text-align:right;color:var(--accent)">%s</span></div>' % s for s in SETS)
) + rack_mod('PLATES', 'var(--on)',
    '<div class="r" style="gap:4px;align-items:flex-end">'
    '<span style="width:30px;height:14px;border-radius:1px;background:#2f6fb0"></span>'
    '<span style="width:30px;height:14px;border-radius:1px;background:#2f6fb0"></span>'
    '<span style="width:22px;height:14px;border-radius:1px;background:#3f7a52"></span>'
    '<span style="width:13px;height:14px;border-radius:1px;background:#d0cbc2"></span>'
    '<span class="sp"></span><span class="mono lbl">41.25 PER SIDE</span></div>'
) + rack_mod('REST', 'var(--live)',
    '<div class="r" style="gap:10px">'
    '<svg style="width:34px;height:34px;flex:none" viewBox="0 0 34 34">'
    '<circle cx="17" cy="17" r="14" fill="none" stroke="var(--off)" stroke-width="3"></circle>'
    '<circle cx="17" cy="17" r="14" fill="none" stroke="var(--live)" stroke-width="3" stroke-linecap="round" '
    'stroke-dasharray="88" stroke-dashoffset="32" transform="rotate(-90 17 17)"></circle></svg>'
    '<span class="mono" style="font-size:22px;font-weight:500;color:var(--hi)">01:12</span>'
    '<span class="sp"></span><span class="mono lbl">+30s</span><span class="mono lbl">SKIP</span></div>'
) + rack_mod('QUEUE', 'var(--off)',
    ''.join('<div class="r" style="gap:8px;height:20px">'
      '<span style="width:3px;height:12px;border-radius:1px;background:var(--off)"></span>'
      '<span style="flex:1;font-size:13px;color:var(--mid)">%s</span>'
      '<span class="mono lbl">%s</span>'
      '<span class="mono lbl" style="width:36px;text-align:right">%s</span></div>' % q
      for q in [('Romanian Deadlift','3 x 10','80'),('Leg Press','3 x 12','160'),('Leg Curl','3 x 15','45')])
) + '''
    <div class="rail"></div>
  </div>
  <div class="bar"><div class="keyG mono">&equiv;</div><div class="key" style="flex:1">Log set 4</div></div>
</div>'''

# ---------------- D2 : BENTO ----------------
D2 = '''<div class="phone">
  <div class="dots"></div>
  <div class="bloom" style="top:-40px;right:-70px;width:280px;height:280px;background:rgba(217,201,168,0.20)"></div>
  <div class="bloom" style="bottom:60px;left:-80px;width:260px;height:260px;background:rgba(140,224,127,0.11)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="bento">

    <div class="bt wide" style="background:none;border:none;padding:0 2px;gap:6px">
      <div class="r" style="gap:8px"><span style="width:7px;height:7px;border-radius:9999px;background:var(--live)"></span>
        <span class="mono lbl" style="color:var(--live)">LIVE &middot; LOWER A</span><span class="sp"></span>
        <span class="mono lbl">00:31:17</span></div>
      <div class="r" style="gap:8px"><span style="font-size:22px;font-weight:600;letter-spacing:-0.02em;color:var(--hi)">Barbell Squat</span>
        <span class="sp"></span><span class="mono lbl">SET 4/5</span></div>
      <div class="r" style="gap:4px">''' + segs('dddco') + '''</div>
    </div>

    <div class="bt hero" style="gap:10px">
      <div class="r" style="gap:6px;align-items:baseline">
        <span class="mono" style="font-size:52px;font-weight:600;letter-spacing:-0.04em;line-height:1;color:var(--hi)">102.5</span>
        <span class="mono" style="font-size:13px;color:var(--mid)">KG</span><span class="sp"></span>
        <span class="mono" style="font-size:52px;font-weight:600;letter-spacing:-0.04em;line-height:1;color:var(--hi)">8</span>
        <span class="mono" style="font-size:13px;color:var(--mid)">REPS</span></div>
      <div style="position:relative;height:34px;display:flex;align-items:flex-end">''' + tape(48) + '''
        <span style="position:absolute;left:50%;top:0;bottom:0;border-left:2px solid var(--accent)"></span></div>
      <div class="r"><span class="mono" style="font-size:11px;color:var(--dim)">95</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--accent)">102.5</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--dim)">110</span></div>
    </div>

    <div class="bt">
      <span class="mono lbl">RPE</span>
      <div class="r" style="gap:3px;height:26px">''' + ''.join(
        '<span style="flex:1;height:100%%;border-radius:1px;background:%s"></span>'
        % ('var(--accent)' if i==7 else ('var(--on)' if i<7 else 'var(--off)')) for i in range(10)) + '''</div>
      <div class="r"><span class="mono" style="font-size:19px;font-weight:500;color:var(--hi)">8.0</span>
        <span class="sp"></span><span class="mono lbl">RIR 2</span></div>
    </div>

    <div class="bt">
      <span class="mono lbl">REST</span>
      <div class="r" style="gap:9px">
        <svg style="width:40px;height:40px;flex:none" viewBox="0 0 40 40">
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--off)" stroke-width="3"></circle>
          <circle cx="20" cy="20" r="17" fill="none" stroke="var(--live)" stroke-width="3" stroke-linecap="round"
                  stroke-dasharray="107" stroke-dashoffset="39" transform="rotate(-90 20 20)"></circle></svg>
        <span class="mono" style="font-size:21px;font-weight:500;color:var(--hi)">01:12</span></div>
      <div class="r"><span class="mono lbl">+30s</span><span class="sp"></span><span class="mono lbl">SKIP</span></div>
    </div>

    <div class="bt">
      <span class="mono lbl">e1RM</span>
      <div class="r" style="gap:5px;align-items:baseline">
        <span class="mono" style="font-size:28px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">130</span>
        <span class="mono lbl">KG</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--pos)">+3</span></div>
      <div class="r" style="gap:2px;height:16px;align-items:flex-end">''' + ''.join(
        '<span style="flex:1;height:%d%%;background:%s"></span>' % (h, c) for h, c in
        [(38,'var(--off)'),(46,'var(--off)'),(42,'var(--off)'),(58,'var(--on)'),(54,'var(--on)'),
         (66,'var(--on)'),(62,'var(--on)'),(74,'var(--on)'),(80,'var(--accent)'),(100,'var(--pos)')]) + '''</div>
    </div>

    <div class="bt">
      <span class="mono lbl">SESSION</span>
      <div class="r" style="gap:5px;align-items:baseline">
        <span class="mono" style="font-size:28px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">3.7</span>
        <span class="mono lbl">TONNES</span></div>
      <div class="r" style="gap:4px">''' + segs('ddddo') + segs('ooo') + '''</div>
    </div>

    <div class="bt wide">
      <div class="r" style="height:15px"><span class="mono lbl" style="width:24px">SET</span><span class="sp"></span>
        <span class="mono lbl" style="width:50px;text-align:right">KG</span>
        <span class="mono lbl" style="width:32px;text-align:right">REP</span>
        <span class="mono lbl" style="width:38px;text-align:right">RPE</span>
        <span class="mono lbl" style="width:44px;text-align:right">e1RM</span></div>
      <div style="height:1px;background:rgba(255,255,255,0.08)"></div>''' + ''.join(
      '<div class="r" style="height:20px;font-size:11px">'
      '<span class="mono" style="width:24px;color:var(--dim)">%s</span><span class="sp"></span>'
      '<span class="mono" style="width:50px;text-align:right;color:var(--hi)">%s</span>'
      '<span class="mono" style="width:32px;text-align:right;color:var(--mid)">%s</span>'
      '<span class="mono" style="width:38px;text-align:right;color:var(--lo)">%s</span>'
      '<span class="mono" style="width:44px;text-align:right;color:var(--accent)">%s</span></div>' % s for s in SETS) + '''
    </div>

    <div class="bt wide" style="gap:6px">
      <div class="r"><span class="mono lbl">PER SIDE &middot; 20 KG BAR</span><span class="sp"></span>
        <span class="mono lbl">41.25 KG</span></div>
      <div class="r" style="gap:4px;align-items:flex-end">
        <span style="width:34px;height:15px;border-radius:2px;background:#2f6fb0"></span>
        <span style="width:34px;height:15px;border-radius:2px;background:#2f6fb0"></span>
        <span style="width:24px;height:15px;border-radius:2px;background:#3f7a52"></span>
        <span style="width:14px;height:15px;border-radius:2px;background:#d0cbc2"></span>
        <span class="sp"></span><span class="mono" style="font-size:11px;color:var(--dim)">+ COLLAR</span></div>
    </div>

  </div>
  <div class="bar"><div class="keyG mono">&equiv;</div><div class="key" style="flex:1">Log set 4</div></div>
</div>'''

# ---------------- D3 : CLUSTER ----------------
D3 = '''<div class="phone">
  <div class="dots"></div>
  <div class="bloom" style="top:110px;left:31px;width:340px;height:340px;background:rgba(217,201,168,0.17)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="cluster">

    <div class="r" style="width:100%;gap:8px;flex:none;height:34px">
      <span style="width:7px;height:7px;border-radius:9999px;background:var(--live)"></span>
      <span class="mono lbl" style="color:var(--live)">LIVE</span>
      <span style="font-size:15px;font-weight:600;color:var(--hi)">Barbell Squat</span>
      <span class="sp"></span><span class="mono lbl">00:31:17</span>
    </div>

    <div class="dial">
      <svg viewBox="0 0 340 340" style="width:340px;height:340px;position:absolute;left:0;top:0">
        <circle cx="170" cy="170" r="158" fill="none" stroke="rgba(255,255,255,0.06)" stroke-width="1"></circle>
        <circle cx="170" cy="170" r="122" fill="none" stroke="rgba(255,255,255,0.05)" stroke-width="1"></circle>
        ''' + radial_ticks() + '''
      </svg>
      <div class="dialcore">
        <span class="mono lbl">LOAD</span>
        <span class="mono" style="font-size:62px;font-weight:600;letter-spacing:-0.05em;line-height:1;color:var(--hi)">102.5</span>
        <span class="mono" style="font-size:13px;color:var(--mid)">KG &middot; SET 4 OF 5</span>
        <div class="r" style="gap:5px;width:150px;margin-top:10px">''' + segs('dddco') + '''</div>
        <div class="r" style="gap:6px;margin-top:12px;align-items:baseline">
          <span class="mono" style="font-size:34px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">8</span>
          <span class="mono lbl">REPS</span>
          <span style="width:1px;height:16px;background:rgba(255,255,255,0.12);margin:0 4px"></span>
          <span class="mono" style="font-size:34px;font-weight:600;letter-spacing:-0.03em;color:var(--accent)">8.0</span>
          <span class="mono lbl">RPE</span>
        </div>
      </div>
    </div>

    <div class="r" style="width:100%;gap:9px;flex:none">
      <div class="sat"><span class="mono lbl">REST</span>
        <span class="mono" style="font-size:21px;font-weight:500;color:var(--live)">01:12</span></div>
      <div class="sat"><span class="mono lbl">e1RM</span>
        <span class="mono" style="font-size:21px;font-weight:500;color:var(--hi)">130</span></div>
      <div class="sat"><span class="mono lbl">VOLUME</span>
        <span class="mono" style="font-size:21px;font-weight:500;color:var(--hi)">3.7&thinsp;T</span></div>
      <div class="sat"><span class="mono lbl">PLATES</span>
        <div class="r" style="gap:3px;align-items:flex-end;height:21px">
          <span style="width:14px;height:13px;border-radius:1px;background:#2f6fb0"></span>
          <span style="width:14px;height:13px;border-radius:1px;background:#2f6fb0"></span>
          <span style="width:11px;height:13px;border-radius:1px;background:#3f7a52"></span>
          <span style="width:7px;height:13px;border-radius:1px;background:#d0cbc2"></span></div></div>
    </div>

    <div style="width:100%;flex:none;padding:0 2px">
      <div class="r" style="height:16px"><span class="mono lbl" style="width:24px">SET</span><span class="sp"></span>
        <span class="mono lbl" style="width:50px;text-align:right">KG</span>
        <span class="mono lbl" style="width:32px;text-align:right">REP</span>
        <span class="mono lbl" style="width:38px;text-align:right">RPE</span>
        <span class="mono lbl" style="width:44px;text-align:right">e1RM</span></div>
      <div style="height:1px;background:rgba(255,255,255,0.08);margin:3px 0"></div>''' + ''.join(
      '<div class="r" style="height:21px;font-size:11px">'
      '<span class="mono" style="width:24px;color:var(--dim)">%s</span><span class="sp"></span>'
      '<span class="mono" style="width:50px;text-align:right;color:var(--hi)">%s</span>'
      '<span class="mono" style="width:32px;text-align:right;color:var(--mid)">%s</span>'
      '<span class="mono" style="width:38px;text-align:right;color:var(--lo)">%s</span>'
      '<span class="mono" style="width:44px;text-align:right;color:var(--accent)">%s</span></div>' % s for s in SETS) + '''
    </div>

    <div style="width:100%;flex:none;padding:0 2px;display:flex;flex-direction:column;gap:6px">
      <div class="r"><span class="mono lbl">SESSION &middot; PEAK HEIGHT IS LOAD, GAP IS REST</span><span class="sp"></span>
        <span class="mono lbl">31 MIN</span></div>
      <div class="r" style="height:38px;align-items:flex-end;gap:0">''' + ''.join(
        '<span style="width:%dpx;flex:none"></span><span style="width:3px;height:%d%%;flex:none;background:%s"></span>'
        % (g, h, c) for g, h, c in
        [(0,26,'var(--on)'),(7,34,'var(--on)'),(6,44,'var(--on)'),(11,72,'var(--pos)'),(13,76,'var(--pos)'),
         (12,78,'var(--pos)'),(14,80,'var(--accent)'),(13,0,'var(--off)')]) + '''
        <span class="sp"></span></div>
      <div class="r"><span class="mono" style="font-size:11px;color:var(--dim)">WARM-UP</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--dim)">WORKING</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--accent)">NOW</span></div>
    </div>

  </div>
  <div class="bar"><div class="keyG mono">&equiv;</div><div class="key" style="flex:1">Log set 4</div></div>
</div>'''

COLS = [
 ('D1','Rack','Every block is a self-contained module bolted into a rail: its own spine label, its own state LED, its own readout. Modules tile edge to edge instead of floating as cards.',
  'Strength: it is the only layout here that scales to nineteen screens without redesign &mdash; a screen is a list of modules, and a new metric is a new module, not a new layout. Risk: the spine costs 26pt of every row, and reads as an interface for an interface if overused.', D1),
 ('D2','Bento','Apple&rsquo;s own current language. A strict two-column grid, one hero tile spanning both, everything else a 1&times;1 or a 2&times;1. Hierarchy comes from tile span, not from colour.',
  'Strength: density-native by construction, and the one direction that composes with Liquid Glass without argument &mdash; this is what iOS 26 already does. Risk: at two columns a 1&times;1 tile is 186pt, which is tight for a mono numeral plus a tracked label plus a glyph.', D2),
 ('D3','Cluster','One dominant instrument and its satellites, borrowed from a car binnacle. The weight dial becomes a full radial tuner collar with the numerals living in its core.',
  'Strength: unbeatable for a single glance mid-set &mdash; the thing you need is the biggest thing on screen by a wide margin. Risk: it is sparse by construction. It works for the live screen and probably nowhere else; forcing history or planning into satellites would undo the hierarchy it depends on.', D3),
]

cols = ''.join(
  '<div class="col"><div class="cap"><span class="k mono">%s</span><span class="t">%s</span>'
  '<span class="d">%s</span><span class="w">%s</span></div>%s</div>' % c for c in COLS)

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
  <div style="display:flex;flex-direction:column;gap:36px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:900px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 07</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Three ways to organise it</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Lab 05 changed the material and held the layout. This holds the material &mdash; glass chrome, lit panels, gold&nbsp;/&nbsp;mint&nbsp;/&nbsp;orange &mdash; and changes <span style="color:#f0efec">how the screen is organised</span>. Same session, same numbers, three structures.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">These are not rivals to the instrument direction; they are containers for it. Research turned up rack-mount tiling as the strongest unexplored fit for density, and named bento as orthogonal rather than competing &mdash; it is what Apple already pairs with Liquid&nbsp;Glass. Cluster is included as the honest counter-argument: it is the best single-glance layout and the worst general one.</p>
    </div>
    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab07.html','w').write(HTML)
print('wrote lab07.html', len(HTML))
