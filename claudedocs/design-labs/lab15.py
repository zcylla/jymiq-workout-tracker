import math

# ring scale: 20 kg (empty bar) to 140 kg, 61 ticks at 2 kg each, major every 10 kg.
LO, HI, N = 20.0, 140.0, 61
STEP = (HI - LO) / (N - 1)
LOAD, E1RM = 102.5, 130.0
def idx(kg): return int(round((kg - LO) / STEP))
I_LOAD, I_E1RM = idx(LOAD), idx(E1RM)
SWEEP0, SWEEPN = -240.0, 60.0

CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--ground:#0a0908;--panel:#15130f;--raised:#221f19;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;
        --hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b;
        --tick1:#5a5449;--tick2:#7d7666;--tick3:#a8a091}
  .board{display:flex;gap:30px;align-items:flex-start;overflow-x:auto;padding-bottom:8px}
  .col{flex:none;display:flex;flex-direction:column;gap:14px}
  .cap{display:flex;flex-direction:column;gap:5px;min-height:126px;width:402px}
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
        flex-direction:column;align-items:center;gap:9px}
  .dial{position:relative;width:342px;height:300px;flex:none;display:flex;align-items:center;justify-content:center}
  .core{position:absolute;display:flex;flex-direction:column;align-items:center;gap:1px}
  .satrow{display:flex;width:100%;flex:none;gap:8px}
  .sat{flex:1;min-width:0;border-radius:16px;padding:9px 11px;display:flex;flex-direction:column;gap:4px;
       background:var(--raised);border:1px solid rgba(255,255,255,0.10);
       box-shadow:inset 0 1px 0 rgba(255,255,255,0.09), 0 6px 16px rgba(0,0,0,0.42)}
  .pane{width:100%;flex:none;border-radius:18px;padding:12px 14px;display:flex;flex-direction:column;gap:5px;
        background:#1b1813;border:1px solid rgba(255,255,255,0.08);
        box-shadow:inset 0 1px 0 rgba(255,255,255,0.07)}
  .key{min-height:52px;flex:1;display:flex;align-items:center;justify-content:center;font-size:15px;
       font-weight:600;background:var(--accent);color:#15130f;border-radius:14px;
       box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)}
  .keyO{min-height:52px;flex:1;display:flex;align-items:center;justify-content:center;font-size:15px;
        font-weight:600;background:var(--raised);color:var(--hi);border-radius:14px;
        border:1px solid rgba(255,255,255,0.12);box-shadow:inset 0 1px 0 rgba(255,255,255,0.09)}
  .keyG{min-height:52px;width:56px;flex:none;display:flex;align-items:center;justify-content:center;
        font-size:17px;border-radius:14px;color:var(--hi);background:var(--raised);
        border:1px solid rgba(255,255,255,0.10)}
  .bar{position:relative;z-index:3;flex:none;margin:8px 16px 30px;display:flex;gap:10px}
  .anat{width:520px;height:520px;position:relative;background:#100e0b;border-radius:22px;
        border:1px solid rgba(255,255,255,0.06)}
  .cal{position:absolute;font-size:12px;line-height:1.5;color:#c9c3b6;max-width:168px}
  .cal b{display:block;font-family:'Geist Mono',ui-monospace,monospace;font-size:11px;
         letter-spacing:0.14em;color:var(--accent);margin-bottom:3px}
"""

def ring(cx, cy, r, tick_len_major, tick_len_minor, resting=False, scale=1.0):
    out = []
    for i in range(N):
        a = SWEEP0 + i * (SWEEPN - SWEEP0) / (N - 1)
        major = i % 5 == 0
        ln = tick_len_major if major else tick_len_minor
        if resting:
            col, w = ('var(--tick1)' if major else '#3a352d'), 1
        elif i == I_E1RM:
            col, w = 'var(--live)', 2 * scale
        elif i == I_LOAD:
            col, w = 'var(--accent)', 3 * scale
        elif i < I_LOAD:
            col, w = ('var(--tick3)' if major else 'var(--tick2)'), (2 * scale if major else 1)
        else:
            col, w = ('var(--tick1)' if major else '#3a352d'), 1
        if i == I_LOAD or i == I_E1RM: ln = tick_len_major * 1.4
        rad = math.radians(a)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%.1f" '
                   'stroke-linecap="round"></line>'
                   % (cx + r * math.cos(rad), cy + r * math.sin(rad),
                      cx + (r - ln) * math.cos(rad), cy + (r - ln) * math.sin(rad), col, w))
    return ''.join(out)

def arcpath(cx, cy, r, a0, a1):
    x0, y0 = cx + r * math.cos(math.radians(a0)), cy + r * math.sin(math.radians(a0))
    x1, y1 = cx + r * math.cos(math.radians(a1)), cy + r * math.sin(math.radians(a1))
    large = 1 if abs(a1 - a0) > 180 else 0
    return 'M %.1f %.1f A %.1f %.1f 0 %d 1 %.1f %.1f' % (x0, y0, r, r, large, x1, y1)

SETS = [('01','100.0','08','7.5','127'),('02','102.5','08','8.0','130'),('03','102.5','07','8.5','128')]
def rows():
    return ''.join(
      '<div class="r" style="height:21px;font-size:11px">'
      '<span class="mono" style="width:24px;color:var(--dim)">%s</span><span class="sp"></span>'
      '<span class="mono" style="width:50px;text-align:right;color:var(--hi)">%s</span>'
      '<span class="mono" style="width:32px;text-align:right;color:var(--mid)">%s</span>'
      '<span class="mono" style="width:38px;text-align:right;color:var(--lo)">%s</span>'
      '<span class="mono" style="width:44px;text-align:right;color:var(--accent)">%s</span></div>' % s for s in SETS)

WAVE = ''.join(
  '<span style="width:%dpx;flex:none"></span>'
  '<span style="width:4px;flex:none;height:%d%%;border-radius:1px;background:%s"></span>' % (g, h, c)
  for g, h, c in [(0,24,'var(--on)'),(11,32,'var(--on)'),(10,42,'var(--on)'),(18,70,'var(--pos)'),
                  (22,74,'var(--pos)'),(21,76,'var(--pos)'),(24,84,'var(--accent)')])

def sats(resting):
    cells = [('e1RM','<span class="mono" style="font-size:20px;font-weight:500;color:var(--hi)">130</span>'),
             ('VOLUME','<span class="mono" style="font-size:20px;font-weight:500;color:var(--hi)">3.7&thinsp;T</span>'),
             ('SET','<span class="mono" style="font-size:20px;font-weight:500;color:var(--hi)">4 / 5</span>'),
             ('PLATES','<div class="r" style="gap:3px;align-items:flex-end;height:20px">'
                       '<span style="width:12px;height:19px;border-radius:1px;background:var(--accent)"></span>'
                       '<span style="width:8px;height:17px;border-radius:1px;background:var(--accent);opacity:0.62"></span>'
                       '<span style="width:4px;height:7px;border-radius:1px;background:var(--accent);opacity:0.34"></span>'
                       '<span class="mono" style="margin-left:5px;font-size:11px;color:var(--dim)">25/15/1.25</span></div>')]
    if resting:
        cells[2] = ('NEXT','<span class="mono" style="font-size:20px;font-weight:500;color:var(--accent)">102.5</span>')
    return ''.join('<div class="sat"><span class="mono lbl">%s</span>%s</div>' % c for c in cells)

def header(v, resting):
    tone   = 'var(--live)' if resting else 'var(--pos)'
    state  = 'RESTING' if resting else 'LIFTING'
    dot    = '<span style="width:7px;height:7px;border-radius:9999px;background:%s"></span>' % tone
    if v == 'row':
        return ('<div class="r" style="width:100%%;gap:8px;flex:none;height:30px">'
                + dot +
                '<span class="mono lbl" style="color:%s">%s</span>'
                '<span style="font-size:15px;font-weight:600;color:var(--hi)">Barbell Squat</span>'
                '<span class="sp"></span><span class="mono lbl">00:31:17</span></div>' % (tone, state))
    if v == 'stack':
        return ('<div style="width:100%%;flex:none;display:flex;flex-direction:column;align-items:center;gap:5px;'
                'padding:2px 0 4px">'
                '<div class="r" style="gap:7px">%s'
                '<span class="mono lbl" style="color:%s">%s</span></div>'
                '<span style="font-size:21px;font-weight:600;letter-spacing:-0.02em;color:var(--hi)">Barbell Squat</span>'
                '<span class="mono" style="font-size:13px;letter-spacing:0.10em;color:var(--lo)">00:31:17</span>'
                '</div>' % (dot, tone, state))
    if v == 'stackbig':
        return ('<div style="width:100%%;flex:none;display:flex;flex-direction:column;align-items:center;gap:3px;'
                'padding:0 0 2px">'
                '<div class="r" style="gap:7px;padding:4px 12px;border-radius:9999px;'
                'background:rgba(255,255,255,0.05);border:1px solid %s">%s'
                '<span class="mono" style="font-size:11px;font-weight:500;letter-spacing:0.16em;color:%s">%s</span></div>'
                '<span style="font-size:24px;font-weight:600;letter-spacing:-0.025em;color:var(--hi);'
                'margin-top:6px">Barbell Squat</span>'
                '<span class="mono" style="font-size:19px;font-weight:400;letter-spacing:0.06em;color:var(--mid)">00:31:17</span>'
                '</div>' % (('rgba(255,92,26,0.34)' if resting else 'rgba(140,224,127,0.30)'), dot, tone, state))
    # rule
    return ('<div style="width:100%%;flex:none;display:flex;flex-direction:column;align-items:center;gap:8px;'
            'padding:2px 0 2px">'
            '<span style="font-size:23px;font-weight:600;letter-spacing:-0.025em;color:var(--hi)">Barbell Squat</span>'
            '<div class="r" style="gap:10px;width:190px">'
            '<span style="flex:1;height:2px;border-radius:1px;background:%s"></span>'
            '<span class="mono" style="font-size:11px;font-weight:500;letter-spacing:0.16em;color:%s">%s</span>'
            '<span style="flex:1;height:2px;border-radius:1px;background:rgba(255,255,255,0.10)"></span></div>'
            '<span class="mono" style="font-size:13px;letter-spacing:0.10em;color:var(--lo)">00:31:17</span>'
            '</div>' % (tone, tone, state))


def screen(resting, head_v='row'):
    a_load = SWEEP0 + I_LOAD * (SWEEPN - SWEEP0) / (N - 1)
    countdown = ('<path d="%s" fill="none" stroke="var(--live)" stroke-width="7" stroke-linecap="round"></path>'
                 % arcpath(171, 150, 120, SWEEP0, SWEEP0 + (SWEEPN - SWEEP0) * 0.62)) if resting else (
                 '<path d="%s" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" '
                 'opacity="0.85"></path>' % arcpath(171, 150, 120, SWEEP0, a_load))
    if resting:
        core = ('<span class="mono lbl" style="color:var(--live)">REST</span>'
                '<span class="mono" style="font-size:56px;font-weight:600;letter-spacing:-0.05em;line-height:1;'
                'color:var(--hi)">1:12</span>'
                '<span class="mono" style="font-size:13px;color:var(--mid)">NEXT &middot; 102.5 KG x 8</span>'
                '<div class="r" style="gap:8px;margin-top:16px">'
                '<div style="min-height:40px;padding:0 18px;display:flex;align-items:center;border-radius:12px;'
                'background:var(--raised);border:1px solid rgba(255,255,255,0.12)">'
                '<span class="mono" style="font-size:13px;color:var(--hi)">+30s</span></div>'
                '<div style="min-height:40px;padding:0 18px;display:flex;align-items:center;border-radius:12px;'
                'background:var(--raised);border:1px solid rgba(255,255,255,0.12)">'
                '<span class="mono" style="font-size:13px;color:var(--hi)">SKIP</span></div></div>')
        action = '<div class="keyO">Skip rest</div>'
    else:
        core = ('<span class="mono lbl">LOAD</span>'
                '<span class="mono" style="font-size:56px;font-weight:600;letter-spacing:-0.05em;line-height:1;'
                'color:var(--hi)">102.5</span>'
                '<span class="mono" style="font-size:13px;color:var(--mid)">KG &middot; 79% OF 1RM</span>'
                '<div class="r" style="gap:6px;margin-top:18px;align-items:baseline">'
                '<span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">8</span>'
                '<span class="mono lbl">REPS</span>'
                '<span style="width:1px;height:15px;background:rgba(255,255,255,0.14);margin:0 4px"></span>'
                '<span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.03em;color:var(--accent)">8.0</span>'
                '<span class="mono lbl">RPE</span></div>')
        action = '<div class="key">Log set 4</div>'
    return f'''<div class="phone">
  <div class="field"></div>
  <div class="bloom" style="top:96px;left:30px;width:342px;height:342px;background:{'rgba(255,92,26,0.16)' if resting else 'rgba(217,201,168,0.17)'}"></div>
  <div class="bloom" style="bottom:80px;left:-50px;width:300px;height:220px;background:rgba(140,224,127,0.10)"></div>
  <div class="sb"><span class="mono">9:41</span><i></i></div>
  <div class="body">
    {header(head_v, resting)}

    <div class="dial">
      <svg viewBox="0 0 342 300" style="width:342px;height:300px;position:absolute;left:0;top:0">
        {countdown}
        {ring(171, 150, 142, 15, 7, resting)}
      </svg>
      <div class="core">{core}</div>
    </div>

    <div class="satrow">{sats(resting)}</div>

    <div class="pane">
      <div class="r" style="height:16px"><span class="mono lbl" style="width:24px">SET</span><span class="sp"></span>
        <span class="mono lbl" style="width:50px;text-align:right">KG</span>
        <span class="mono lbl" style="width:32px;text-align:right">REP</span>
        <span class="mono lbl" style="width:38px;text-align:right">RPE</span>
        <span class="mono lbl" style="width:44px;text-align:right">e1RM</span></div>
      <div style="height:1px;background:rgba(255,255,255,0.12)"></div>
      {rows()}
    </div>

    <div class="pane" style="gap:7px">
      <div class="r"><span class="mono lbl">SESSION</span><span class="sp"></span>
        <span class="mono lbl">GAP IS REAL REST</span></div>
      <div class="r" style="height:40px;align-items:flex-end">{WAVE}<span class="sp"></span></div>
      <div class="r"><span class="mono" style="font-size:11px;color:var(--dim)">WARM-UP</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--pos)">WORKING</span><span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--accent)">NOW</span></div>
    </div>
  </div>
  <div class="bar"><div class="keyG"><span class="mono">&equiv;</span></div>{action}</div>
</div>'''

# ---------------- anatomy ----------------
def anat():
    a_load = SWEEP0 + I_LOAD * (SWEEPN - SWEEP0) / (N - 1)
    a_e1rm = SWEEP0 + I_E1RM * (SWEEPN - SWEEP0) / (N - 1)
    def pt(a, r): return (260 + r*math.cos(math.radians(a)), 250 + r*math.sin(math.radians(a)))
    lx1, ly1 = pt(a_load, 232); lx2, ly2 = pt(a_load, 200)
    ex1, ey1 = pt(a_e1rm, 232); ex2, ey2 = pt(a_e1rm, 200)
    sx1, sy1 = pt(-150, 232);   sx2, sy2 = pt(-150, 198)
    ux1, uy1 = pt(20, 232);     ux2, uy2 = pt(20, 198)
    return ('<div class="anat">'
      '<svg viewBox="0 0 520 520" style="width:520px;height:520px;position:absolute;left:0;top:0">'
      + ('<path d="%s" fill="none" stroke="var(--accent)" stroke-width="4" stroke-linecap="round" opacity="0.5"></path>'
         % arcpath(260, 250, 205, SWEEP0, a_load))
      + ring(260, 250, 232, 24, 12, False, 1.3)
      + '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="rgba(217,201,168,0.5)" stroke-width="1"></line>' % (lx1,ly1,lx2,ly2)
      + '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="rgba(255,92,26,0.5)" stroke-width="1"></line>' % (ex1,ey1,ex2,ey2)
      + '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="rgba(255,255,255,0.24)" stroke-width="1"></line>' % (sx1,sy1,sx2,sy2)
      + '<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="rgba(255,255,255,0.24)" stroke-width="1"></line>' % (ux1,uy1,ux2,uy2)
      + '</svg>'
      '<div style="position:absolute;left:0;right:0;top:212px;text-align:center;display:flex;'
      'flex-direction:column;align-items:center;gap:2px">'
      '<span class="mono lbl">LOAD</span>'
      '<span class="mono" style="font-size:56px;font-weight:600;letter-spacing:-0.05em;line-height:1;color:var(--hi)">102.5</span>'
      '<span class="mono" style="font-size:13px;color:var(--mid)">KG &middot; 79% OF 1RM</span></div>'
      '<div class="cal" style="left:16px;top:14px;max-width:148px"><b>THE SCALE</b>One tick per 2&nbsp;kg, from the empty bar at 20 to 140. '
      'Major rule every 10&nbsp;kg. It is a fixed, real scale &mdash; not a percentage ring.</div>'
      '<div class="cal" style="right:16px;top:14px;text-align:right;max-width:148px"><b>LIT ARC</b>Everything at or below today&rsquo;s load. '
      'How far round it goes <em>is</em> how heavy this set is.</div>'
      '<div class="cal" style="left:16px;bottom:22px"><b>GOLD INDEX</b>The load on the bar right now. Drag the ring to change it.</div>'
      '<div class="cal" style="right:16px;bottom:22px;text-align:right"><b>RED NOTCH</b>Your estimated one-rep max, 130&nbsp;kg. '
      'The gap between gold and red is how much headroom is left.</div>'
      '</div>')

COLS = [
 ('ANATOMY','What the ring actually says','It is a weight scale, not decoration',
  'You asked what it indicates. As drawn in Lab 12 it did not indicate anything in particular, which is a fair criticism. Here it is given one job: a fixed 20&ndash;140&nbsp;kg scale with the arc lit up to today&rsquo;s load and a notch at your estimated max.',
  'So a glance tells you two things at once &mdash; the number, and where that number sits in your range. A near-full ring means you are near your ceiling. That is a reading you cannot get from a numeral alone.', anat()),
 ('LIFTING','Between sets','The ring is the weight scale', '', '', screen(False)),
 ('RESTING','Rest running','The same ring is the countdown',
  'Your idea, built. The dedicated rest card is gone; the ring itself depletes in the live colour, the numerals become the countdown, and the +30s and Skip controls sit under them where your thumb already is.',
  'One instrument doing two jobs at two different times &mdash; never both at once, so there is nothing to disambiguate. It also buys back a whole card of vertical space.', screen(True)),
]

cols = ''.join(
  '<div class="col"><div class="cap"><span class="k">%s</span><span class="t">%s</span>'
  '<span class="d" style="color:#d9c9a8">%s</span><span class="d">%s</span>'
  '<span class="w">%s</span></div>%s</div>' % c for c in COLS)

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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 15</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">One ring, two jobs</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Built on V3 &mdash; lit panels, no blur. Every card is a lighter plate than the ground with a top highlight and a real shadow. Nothing on this screen is blurred except the ambient light behind it, so there is <span style="color:#f0efec">no glass cost at all</span> outside the dial.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Your rest-timer idea turned out to be the answer to your own question. The ring had no job, which is why it read as decoration; giving it the weight scale answers &ldquo;what is it&rdquo;, and handing it the countdown during rest answers &ldquo;why keep it&rdquo;. The two states never overlap, so there is nothing to misread &mdash; and the dedicated rest card disappears entirely.</p>
    </div>
    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab15.html','w').write(HTML)
print('wrote lab15.html', len(HTML), '| load tick', I_LOAD, 'e1rm tick', I_E1RM)
