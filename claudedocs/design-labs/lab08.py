import math
CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--panel:#15130f;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;--warn:#e8b23a;
        --hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b}
  .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;max-width:1420px}
  .card{background:var(--panel);border:1px solid rgba(255,255,255,0.08);border-radius:20px;padding:18px;
        display:flex;flex-direction:column;gap:13px;overflow:hidden}
  .hd{display:flex;flex-direction:column;gap:4px}
  .hd .n{font-size:11px;font-weight:600;letter-spacing:0.18em;color:var(--dim)}
  .hd .t{font-size:16px;font-weight:600;color:var(--hi)}
  .hd .s{font-size:12px;letter-spacing:0.02em;color:var(--accent)}
  .stage{border-radius:12px;background:#100e0b;border:1px solid rgba(255,255,255,0.05);
         padding:16px 14px;display:flex;flex-direction:column;gap:9px;justify-content:center;min-height:150px}
  .meta{display:flex;flex-direction:column;gap:7px;font-size:12px;line-height:1.55;color:#8c8677;
        border-top:1px solid rgba(255,255,255,0.07);padding-top:11px}
  .meta b{color:var(--mid);font-weight:500}
  .meta .v{font-size:11px;letter-spacing:0.06em;color:var(--pos)}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}
  .kill{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:14px;max-width:1420px}
  .kc{border:1px dashed rgba(255,92,26,0.28);border-radius:14px;padding:14px 16px;display:flex;
      flex-direction:column;gap:5px;background:rgba(255,92,26,0.035)}
  .kc .t{font-size:13px;font-weight:600;color:#e8b7a2}
  .kc .d{font-size:12px;line-height:1.55;color:#8c8677}
"""

def rail(n, major, filled_to, w='100%'):
    out=[]
    for i in range(n):
        m = i % major == 0
        c = 'var(--on)' if (m and i<=filled_to) else ('var(--accent)' if i==filled_to else
            ('#3a362c' if i<=filled_to else 'var(--off)'))
        out.append('<span style="flex:1;border-left:%dpx solid %s;height:%s"></span>'
                   % (2 if i==filled_to else 1, c, '100%' if m or i==filled_to else '46%'))
    return '<div style="display:flex;align-items:flex-end;height:26px;width:%s">%s</div>' % (w, ''.join(out))

# ---------- 01 exceedance bands ----------
P01 = ('<div class="r"><span class="mono lbl">WEEKLY SETS &middot; CHEST</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--warn)">18 &middot; ABOVE MAV</span></div>'
 '<div style="position:relative;height:34px">'
 '<div style="position:absolute;inset:0 0 8px 0;display:flex;border-radius:3px;overflow:hidden">'
 '<span style="width:30%;background:rgba(255,255,255,0.05)"></span>'
 '<span style="width:25%;background:rgba(140,224,127,0.16)"></span>'
 '<span style="width:27%;background:rgba(232,178,58,0.16)"></span>'
 '<span style="width:18%;background:rgba(255,92,26,0.18)"></span></div>'
 '<div style="position:absolute;left:0;right:0;top:0;bottom:8px;display:flex;align-items:flex-end">'
 + ''.join('<span style="flex:1;border-left:1px solid %s;height:%s"></span>'
           % ('rgba(255,255,255,0.22)' if i%5==0 else 'rgba(255,255,255,0.09)', '100%' if i%5==0 else '38%')
           for i in range(31)) + '</div>'
 '<span style="position:absolute;left:60%;top:-3px;bottom:5px;width:0;border-left:2px solid var(--hi)"></span>'
 '</div>'
 '<div class="r" style="font-size:11px">'
 '<span class="mono" style="width:30%;color:var(--dim)">0</span>'
 '<span class="mono" style="width:25%;color:var(--pos)">MEV 9</span>'
 '<span class="mono" style="width:27%;color:var(--warn)">MAV 16</span>'
 '<span class="mono" style="flex:1;color:var(--live)">MRV 22</span></div>')

# ---------- 02 shift ladder ----------
P02 = ('<div class="r"><span class="mono lbl">SETS TO MRV &middot; QUADS</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--warn)">2 REMAINING</span></div>'
 '<div class="r" style="gap:5px;height:30px">' + ''.join(
   '<span style="flex:1;height:100%%;border-radius:2px;background:%s"></span>' % c for c in
   ['var(--pos)','var(--pos)','#b8d96a','var(--warn)','#f0862c','var(--off)','var(--off)']) +
 '<span style="flex:1;height:100%;border-radius:2px;background:#3a1109;border:1px solid var(--live)"></span></div>'
 '<div class="r"><span class="mono" style="font-size:11px;color:var(--dim)">16</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--live)">22 &middot; DELOAD</span></div>')

# ---------- 03 gain reduction ----------
def gr(name, pct, col):
    return ('<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">'
            '<div style="width:100%%;height:82px;border-radius:2px;position:relative;overflow:hidden;'
            'background:rgba(140,224,127,0.13)">'
            '<span style="position:absolute;left:0;right:0;top:0;height:%d%%;background:%s"></span>'
            '<span style="position:absolute;left:0;right:0;top:0;height:2px;background:var(--mid)"></span>'
            '<span style="position:absolute;left:0;right:0;top:%d%%;height:1px;background:rgba(255,255,255,0.30)"></span>'
            '</div>'
            '<span class="mono" style="font-size:11px;color:var(--lo)">%s</span></div>' % (pct, col, pct, name))

P03 = ('<div class="r"><span class="mono lbl">CAPACITY</span><span class="sp"></span><span class="mono" style="font-size:11px;color:var(--dim)">CEILING AT TOP &middot; 48H HALF-LIFE</span></div>'
 '<div class="r" style="gap:7px;align-items:flex-end">'
 + gr('CHST', 22, 'rgba(255,92,26,0.42)') + gr('BACK', 12, 'rgba(232,178,58,0.40)')
 + gr('QUAD', 64, 'rgba(255,92,26,0.62)') + gr('HAM', 41, 'rgba(232,178,58,0.48)')
 + gr('SHLD', 8, 'rgba(140,224,127,0.35)') + gr('ARM', 30, 'rgba(232,178,58,0.42)') + '</div>')

# ---------- 04 dimension line ----------
P04 = ('<div style="position:relative;height:96px">'
 '<span style="position:absolute;left:14px;bottom:16px;width:9px;height:9px;border-radius:9999px;'
 'background:var(--on)"></span>'
 '<span style="position:absolute;right:14px;top:12px;width:9px;height:9px;border-radius:9999px;'
 'background:var(--accent)"></span>'
 '<span style="position:absolute;left:18px;bottom:20px;right:18px;top:16px;border-top:1px solid rgba(255,255,255,0.10);'
 'transform-origin:left;display:block"></span>'
 '<span style="position:absolute;left:18px;bottom:26px;height:44px;border-left:1px dashed rgba(217,201,168,0.38)"></span>'
 '<span style="position:absolute;right:18px;top:22px;height:44px;border-left:1px dashed rgba(217,201,168,0.38)"></span>'
 '<span style="position:absolute;left:18px;right:18px;top:44px;border-top:1px solid var(--accent)"></span>'
 '<span style="position:absolute;left:18px;top:38px;height:13px;border-left:1px solid var(--accent)"></span>'
 '<span style="position:absolute;right:18px;top:38px;height:13px;border-left:1px solid var(--accent)"></span>'
 '<span class="mono" style="position:absolute;left:50%;top:31px;transform:translateX(-50%);'
 'background:#100e0b;padding:0 8px;font-size:13px;color:var(--accent)">+7.5 KG</span>'
 '<span class="mono" style="position:absolute;left:10px;bottom:0;font-size:11px;color:var(--dim)">W01 &middot; 122.5</span>'
 '<span class="mono" style="position:absolute;right:10px;top:0;font-size:11px;color:var(--mid)">W06 &middot; 130.0</span>'
 '</div>')

# ---------- 05 altitude tape + trend vector ----------
def vtape():
    rows=[]
    for i in range(13):
        v = 84.0 - i*0.5
        major = abs(v*2 % 2) < 0.01
        rows.append('<div style="display:flex;align-items:center;gap:6px;height:13px">'
          '<span style="width:%dpx;height:1px;background:%s"></span>'
          '<span class="mono" style="font-size:11px;color:%s">%s</span></div>'
          % (13 if major else 7, 'var(--on)' if major else 'var(--off)',
             'var(--lo)' if major else 'transparent', ('%.1f' % v) if major else '.'))
    return ''.join(rows)
P05 = ('<div class="r" style="gap:14px;align-items:stretch">'
 '<div style="flex:none;display:flex;flex-direction:column;justify-content:center;position:relative">'
 + vtape() +
 '<span style="position:absolute;left:-4px;right:-46px;top:50%;height:22px;transform:translateY(-50%);'
 'border:1px solid var(--accent);border-radius:3px;background:rgba(217,201,168,0.10)"></span>'
 '<span class="mono" style="position:absolute;left:26px;top:50%;transform:translateY(-50%);'
 'font-size:15px;font-weight:500;color:var(--hi);z-index:2">81.0</span></div>'
 '<div style="flex:1;display:flex;flex-direction:column;justify-content:center;gap:8px;padding-left:44px">'
 '<div class="r" style="gap:8px"><span style="width:44px;height:2px;background:var(--pos)"></span>'
 '<span style="width:0;height:0;border-left:6px solid var(--pos);border-top:4px solid transparent;'
 'border-bottom:4px solid transparent"></span>'
 '<span class="mono" style="font-size:11px;color:var(--pos)">+0.4 / WK</span></div>'
 '<span class="mono lbl">7-DAY SMOOTHED</span>'
 '<span class="mono" style="font-size:11px;color:var(--dim)">PROJECTED 82.6 IN 4 WK</span></div></div>')

# ---------- 06 RPE histogram ----------
P06 = ('<div class="r"><span class="mono lbl">SET RPE DISTRIBUTION &middot; THIS WEEK</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--mid)">n = 42</span></div>'
 '<div class="r" style="gap:5px;height:78px;align-items:flex-end">' + ''.join(
   '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px;height:100%%;'
   'justify-content:flex-end"><span style="width:100%%;height:%d%%;border-radius:2px;background:%s"></span></div>'
   % (h, c) for h, c in [(6,'var(--off)'),(10,'var(--off)'),(18,'var(--on)'),(34,'var(--on)'),
                         (62,'var(--accent)'),(100,'var(--accent)'),(74,'var(--warn)'),(28,'var(--live)')]) + '</div>'
 '<div class="r" style="gap:5px">' + ''.join(
   '<span class="mono" style="flex:1;text-align:center;font-size:11px;color:%s">%s</span>'
   % ('var(--accent)' if v in ('8','9') else 'var(--dim)', v)
   for v in ['5','6','6.5','7','7.5','8','8.5','9']) + '</div>')

# ---------- 07 engine cluster strip ----------
def minarc(pct, col, name, val):
    off = 126 - int(126 * pct / 100)
    return ('<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:5px">'
            '<div style="position:relative;width:44px;height:44px">'
            '<svg viewBox="0 0 44 44" style="width:44px;height:44px">'
            '<circle cx="22" cy="22" r="20" fill="none" stroke="var(--off)" stroke-width="3"></circle>'
            '<circle cx="22" cy="22" r="20" fill="none" stroke="%s" stroke-width="3" stroke-linecap="round" '
            'stroke-dasharray="126" stroke-dashoffset="%d" transform="rotate(-90 22 22)"></circle></svg>'
            '<span class="mono" style="position:absolute;inset:0;display:flex;align-items:center;'
            'justify-content:center;font-size:11px;color:var(--mid)">%s</span></div>'
            '<span class="mono" style="font-size:11px;color:var(--lo)">%s</span></div>' % (col, off, val, name))
P07 = ('<div class="r"><span class="mono lbl">WEEKLY SETS VS TARGET</span></div>'
 '<div class="r" style="gap:6px">'
 + minarc(78,'var(--pos)','CHST','14') + minarc(94,'var(--warn)','BACK','17')
 + minarc(100,'var(--live)','QUAD','22') + minarc(52,'var(--pos)','HAM','9')
 + minarc(66,'var(--pos)','SHLD','12') + minarc(38,'var(--on)','ARM','7') + '</div>')

# ---------- 08 chart recorder + flags ----------
def recorder():
    pts=[(0,40),(1,44),(2,42),(3,49),(4,47),(5,53),(6,51),(7,58),(8,55),(9,62),(10,60),(11,59),
         (12,66),(13,64),(14,70),(15,68),(16,67),(17,73),(18,71),(19,78),(20,76),(21,80),(22,79),(23,86)]
    W,H = 340, 84
    d = ' '.join('%s%.1f,%.1f' % ('M' if i==0 else 'L', 10+p[0]*(W-20)/23.0, H-4-p[1]*(H-14)/90.0)
                 for i,p in enumerate(pts))
    flags = ''.join(
      '<line x1="%.1f" y1="4" x2="%.1f" y2="%.1f" stroke="rgba(217,201,168,0.34)" stroke-width="1" '
      'stroke-dasharray="2 3"></line>'
      '<circle cx="%.1f" cy="%.1f" r="3" fill="var(--accent)"></circle>'
      % (10+i*(W-20)/23.0, 10+i*(W-20)/23.0, H-4-v*(H-14)/90.0, 10+i*(W-20)/23.0, H-4-v*(H-14)/90.0)
      for i, v in [(9,62),(15,68),(23,86)])
    grid = ''.join('<line x1="10" y1="%.1f" x2="%d" y2="%.1f" stroke="rgba(255,255,255,0.055)" '
                   'stroke-width="1"></line>' % (H-4-g*(H-14)/90.0, W-10, H-4-g*(H-14)/90.0)
                   for g in (0,30,60,90))
    return ('<svg viewBox="0 0 %d %d" style="width:100%%;height:%dpx">%s'
            '<path d="%s" fill="none" stroke="var(--accent)" stroke-width="1.6" '
            'stroke-linejoin="round"></path>%s</svg>' % (W,H,H,grid,d,flags))
P08 = ('<div class="r"><span class="mono lbl">e1RM &middot; 24 SESSIONS</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--accent)">3 PR</span></div>'
 + recorder() +
 '<div class="r"><span class="mono" style="font-size:11px;color:var(--dim)">S01</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--dim)">EQUAL WIDTH PER SESSION, NOT PER DAY</span>'
 '<span class="sp"></span><span class="mono" style="font-size:11px;color:var(--accent)">S24</span></div>')

# ---------- 09 spectrum bars + comparison cap ----------
def specbar(name, now, prev):
    return ('<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:6px">'
            '<div style="width:100%%;height:82px;position:relative;display:flex;align-items:flex-end">'
            '<span style="width:100%%;height:%d%%;border-radius:2px 2px 0 0;background:var(--accent);opacity:0.80"></span>'
            '<span style="position:absolute;left:-3px;right:-3px;bottom:%d%%;height:2px;background:var(--hi);'
            'box-shadow:0 0 0 1px rgba(16,14,11,0.9)"></span>'
            '</div><span class="mono" style="font-size:11px;color:var(--lo)">%s</span></div>' % (now, prev, name))

P09 = ('<div class="r"><span class="mono lbl">TONNAGE BY GROUP</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--mid)">&mdash;&mdash; LAST WEEK</span></div>'
 '<div class="r" style="gap:8px;align-items:flex-end">'
 + specbar('CHST',62,72) + specbar('BACK',88,74) + specbar('QUAD',100,86)
 + specbar('HAM',44,52) + specbar('SHLD',56,50) + specbar('ARM',34,38) + '</div>')

# ---------- 10 session waveform ----------
P10 = ('<div class="r"><span class="mono lbl">SESSION TIMELINE</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--dim)">GAP = REAL REST</span></div>'
 '<div class="r" style="height:70px;align-items:flex-end;position:relative">' + ''.join(
   '<span style="width:%dpx;flex:none"></span><span style="width:4px;flex:none;height:%d%%;background:%s;'
   'border-radius:1px"></span>' % (g,h,c) for g,h,c in
   [(0,24,'var(--on)'),(9,32,'var(--on)'),(8,42,'var(--on)'),(15,70,'var(--pos)'),(19,74,'var(--pos)'),
    (18,76,'var(--pos)'),(20,80,'var(--accent)')]) +
 '<span style="position:absolute;left:141px;top:0;bottom:0;border-left:1px solid var(--accent);opacity:0.5"></span>'
 '<span class="sp"></span></div>'
 '<div class="r"><span class="mono" style="font-size:11px;color:var(--dim)">WARM-UP</span>'
 '<span class="sp"></span><span class="mono" style="font-size:11px;color:var(--pos)">WORKING</span>'
 '<span class="sp"></span><span class="mono" style="font-size:11px;color:var(--accent)">NOW &middot; 31:17</span></div>')

# ---------- 11 plate caliper ----------
P11 = ('<div class="r"><span class="mono lbl">TARGET 102.5 &middot; 20 KG BAR</span><span class="sp"></span>'
 '<span class="mono" style="font-size:11px;color:var(--accent)">41.25 PER SIDE</span></div>'
 + rail(41, 4, 33) +
 '<div class="r" style="font-size:11px"><span class="mono" style="flex:1;color:var(--dim)">60</span>'
 '<span class="mono" style="flex:1;text-align:center;color:var(--dim)">80</span>'
 '<span class="mono" style="flex:1;text-align:right;color:var(--accent)">102.5</span></div>'
 '<div style="height:1px;background:rgba(255,255,255,0.08);margin:2px 0"></div>'
 '<div class="r" style="gap:3px;align-items:flex-end">'
 + ''.join('<div style="width:%dpx;display:flex;flex-direction:column;align-items:center;gap:4px">'
           '<span style="width:100%%;height:%dpx;border-radius:2px;background:%s"></span>'
           '<span class="mono" style="font-size:11px;color:var(--dim)">%s</span></div>' % (w,h,c,n)
           for w,h,c,n in [(38,26,'#2f6fb0','20'),(38,26,'#2f6fb0','20'),(26,20,'#3f7a52','10'),
                           (14,14,'#d0cbc2','1.25')])
 + '<span class="sp"></span><span class="mono" style="font-size:11px;color:var(--dim)">+ COLLAR 2.5</span></div>')

# ---------- 12 rotary detent ----------
def detent():
    out=[]
    for i in range(5):
        a = -215 + i * 47.5
        act = i <= 2
        rad = math.radians(a)
        r0, r1 = 52, 40
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%d" '
                   'stroke-linecap="round"></line>'
                   % (60+r0*math.cos(rad), 60+r0*math.sin(rad), 60+r1*math.cos(rad), 60+r1*math.sin(rad),
                      'var(--accent)' if i==2 else ('var(--on)' if act else 'var(--off)'), 3 if i==2 else 2))
    return ''.join(out)
P12 = ('<div class="r" style="gap:16px">'
 '<div style="position:relative;width:120px;height:120px;flex:none">'
 '<svg viewBox="0 0 120 120" style="width:120px;height:120px">'
 '<path d="M 23 103 A 52 52 0 1 1 97 103" fill="none" stroke="var(--off)" stroke-width="4" '
 'stroke-linecap="round"></path>'
 '<path d="M 23 103 A 52 52 0 0 1 24 26" fill="none" stroke="var(--accent)" stroke-width="4" '
 'stroke-linecap="round"></path>' + detent() + '</svg>'
 '<div style="position:absolute;inset:0;display:flex;flex-direction:column;align-items:center;'
 'justify-content:center;gap:1px">'
 '<span class="mono" style="font-size:26px;font-weight:600;color:var(--hi)">75</span>'
 '<span class="mono" style="font-size:11px;color:var(--dim)">PERCENT</span></div></div>'
 '<div style="flex:1;display:flex;flex-direction:column;gap:6px">'
 '<span class="mono lbl">WARM-UP RAMP</span>'
 + ''.join('<div class="r" style="gap:8px;height:20px">'
   '<span style="width:3px;height:12px;background:%s"></span>'
   '<span class="mono" style="font-size:11px;width:34px;color:%s">%s</span>'
   '<span class="mono" style="font-size:11px;flex:1;color:%s">%s</span></div>'
   % (('var(--accent)' if a else 'var(--off)'), ('var(--hi)' if a else 'var(--dim)'), p,
      ('var(--mid)' if a else 'var(--dim)'), l)
   for a,p,l in [(True,'40%','41.0 x 5'),(True,'60%','61.5 x 3'),(True,'75%','77.5 x 2'),
                 (False,'85%','87.5 x 1'),(False,'100%','102.5 working')])
 + '</div></div>')

CARDS = [
 ('01','Exceedance bands','Aviation airspeed tape &middot; automotive redline', P01,
  'Fixed real thresholds painted <b>behind</b> a rail you already draw. Only the marker moves; the bands never recompute.',
  'Weekly sets against RP volume landmarks. MEV, MAV, MRV as boundaries, deload zone above MRV.',
  'Any rail width. Zero new geometry.', 'HIGHEST VALUE &mdash; the RP landmarks currently have no instrument at all'),

 ('02','Shift ladder','Automotive shift lights', P02,
  'One discrete cell per real unit. The terminal cell is styled unlike every other cell, so a breach reads as a different <b>kind</b> of event, not a fuller bar.',
  'Sets remaining before MRV, or RIR countdown inside a set.',
  'Works at 4pt cell width. Fits inline beside a set row.', 'KEEP &mdash; tiny footprint, high urgency signal'),

 ('03','Capacity removed','Audio compressor gain-reduction meter', P03,
  'Deflects <b>down from a ceiling</b> instead of rising from zero. Full capacity is the resting state; fatigue eats into it and recovers back up.',
  'Per-muscle fatigue on the 48h decay curve. Honest to what fatigue actually is.',
  '6&ndash;10pt per strip. Six groups fit 402pt with labels.', 'KEEP &mdash; better semantic model than a rising fatigue bar'),

 ('04','Dimension line','Drafting &middot; CAD', P04,
  'Extension ticks drop from exactly two points, a connector spans them, the signed value sits at the midpoint. Unambiguous about <b>which</b> two things are being compared.',
  'Any delta the app currently states in text: e1RM since last PR, bodyweight since check-in, volume vs last week.',
  '60&ndash;80pt inline. It annotates other charts; it is never standalone.', 'KEEP as a cross-cutting technique'),

 ('05','Trend tape','Aviation altitude tape with trend vector', P05,
  'A scrolling scale with the current value pinned in a fixed centre window, plus a vector projecting where it is heading at the current rate.',
  'Bodyweight on 7-day smoothing, or e1RM across sessions. Value, trajectory and rate in one column.',
  '~30pt wide plus label gutter, 120pt tall. Side column, not full width.', 'KEEP &mdash; encodes direction, which the tuner tape does not'),

 ('06','RPE histogram','Automotive eco-driving histogram', P06,
  'Discrete integer bins, no smoothing. A distribution has a <b>shape</b>, and an average hides it.',
  'Set RPE across a week. Tightly clustered versus scattered is the signal for a plateau or deload call.',
  '6&ndash;9 bins at ~16pt each. Comfortable at 402pt.', 'KEEP &mdash; the shape is currently invisible'),

 ('07','Cluster strip','Aviation engine monitor row', P07,
  'Identical small format repeated, so the eye scans for the <b>outlier</b> instead of reading each value. Format discipline is the whole mechanic.',
  'Six muscle groups at a glance, or a session summary strip.',
  '32&times;44pt per cell minimum. Exactly six fit 402pt.', 'KEEP &mdash; the right answer to six numbers, one glance'),

 ('08','Chart recorder','Lab chart recorder with event flags', P08,
  'Continuous trace plus discrete labelled events at their exact x-position. Equal width per session, <b>not</b> per calendar day &mdash; training days are not uniform.',
  'The 6-week / 24-session history, with PRs flagged on the line.',
  '~280pt minimum for 24 points to separate. Below that, aggregate weekly.', 'KEEP &mdash; the only real fit for the history data'),

 ('09','Comparison cap','Audio spectrum analyser peak-hold', P09,
  'Bar is now; the floating cap is the prior period. Opacity says &ldquo;past&rdquo;, position says how far you have moved.',
  'Muscle-group tonnage this week against last.',
  '~40pt per bar with a label. Six groups fit.', 'KEEP as a variant of the segmented meter, not a new primitive'),

 ('10','Session waveform','DAW waveform overview with playhead', P10,
  'Peak height is load, and the <b>gap between peaks is real elapsed rest</b>. Compress the spacing and you have silently dropped half the information.',
  'Within-session set sequence, warm-up ramp as a rising staircase into the working plateau.',
  '300pt+ for true time-proportional spacing. Say so if you downgrade it.', 'KEEP with the spacing caveat stated'),

 ('11','Plate caliper','Vernier caliper dual scale', P11,
  'A coarse scale (bar weight) read against a fine one (the actual plates). Borrows the dual-scale idea, not the sliding mechanism.',
  'Turns a target load into what to physically put on the bar.',
  '~200pt strip under any weight readout.', 'KEEP &mdash; narrow, single-purpose, genuinely useful'),

 ('12','Detent selector','Audio hardware click-stop knob', P12,
  'Fixed stops mean only these values exist. A free slider would falsely imply infinite precision on a value that is inherently a small set.',
  'Warm-up ramp percentages. This is an <b>input</b>, not a readout &mdash; a different category from the eleven above.',
  '48pt diameter minimum for the touch target.', 'KEEP &mdash; the only input control in the set'),
]

cards = ''.join(
  '<div class="card"><div class="hd"><span class="n mono">%s</span><span class="t">%s</span>'
  '<span class="s mono">%s</span></div><div class="stage">%s</div>'
  '<div class="meta"><span>%s</span><span><b>Carries:</b> %s</span>'
  '<span><b>Floor:</b> %s</span><span class="v mono">%s</span></div></div>' % c for c in CARDS)

KILLED = [
 ('Attitude indicator','Needs two genuinely orthogonal axes of real data. Nothing here is two-axis &mdash; bilateral left/right asymmetry is not tracked. Drawing it would fabricate the second axis.'),
 ('Compass rose / HSI','No bearing data exists in a strength tracker. Nothing to encode.'),
 ('Goniometer / correlation meter','Needs two continuously correlated live signals. No pair of values in the model behaves that way.'),
 ('Nixie and segment tubes','The tube shape and flicker carry zero information beyond an ordinary digit. Pure costume.'),
 ('EQ curve across muscles','Muscle groups are not a continuous ordered domain. A smooth curve between them asserts a relationship that does not exist. Use the cluster strip.'),
 ('Contour lines on the body map','Would interpolate fatigue between muscles that were never measured, inventing a continuous field from six discrete readings. A flat heat-fill is the honest version.'),
]
killed = ''.join('<div class="kc"><span class="t">%s</span><span class="d">%s</span></div>' % k for k in KILLED)

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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 08</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Twelve more instruments</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Five primitives will not fill nineteen dense screens. These twelve come out of aviation, audio, automotive, lab equipment and drafting, and each one is here because it <span style="color:#f0efec">encodes something the current five cannot</span>. Ordered by information value per square point.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Every tick maps to a real unit and every unfilled tick is visibly dimmer &mdash; that rule is what kept the six at the bottom of this page out of the catalogue. The most useful entry is the first one: RP volume landmarks currently have no instrument anywhere in the app, and exceedance bands cost no new geometry at all.</p>
    </div>
    <div class="grid">''' + cards + '''</div>

    <div style="display:flex;flex-direction:column;gap:16px;max-width:900px;padding-top:16px">
      <h2 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">Cut, and why</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">These all look right and would photograph well. Each one fails the same test: it needs data the app does not have, so drawing it would mean inventing the data to fit the picture.</p>
    </div>
    <div class="kill">''' + killed + '''</div>

    <div style="max-width:900px;padding-top:16px;display:flex;flex-direction:column;gap:10px">
      <h2 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">Still unrepresented</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Four things in the data model have no honest instrument yet, here or in the original five. <b style="color:#c9c3b6;font-weight:500">Relative-strength percentile</b> &mdash; one number against a population, and a distribution strip would fabricate curve data the app does not hold locally. <b style="color:#c9c3b6;font-weight:500">Readiness composition</b> &mdash; nothing shows <em>why</em> today&rsquo;s score is what it is. <b style="color:#c9c3b6;font-weight:500">The warm-up ramp as a sequence</b> &mdash; the detent picks the percentages, but the progressive loading across sets needs the waveform extended. <b style="color:#c9c3b6;font-weight:500">Plateau flag</b> &mdash; a boolean, not a quantity; forcing it into an instrument would be decoration. It belongs in a status system, outside instrument territory entirely.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab08.html','w').write(HTML)
print('wrote lab08.html', len(HTML))
