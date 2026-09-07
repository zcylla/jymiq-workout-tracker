import math

LO, HI, N = 20.0, 140.0, 61
STEP = (HI - LO) / (N - 1)
LOAD, E1RM = 102.5, 130.0
idx = lambda kg: int(round((kg - LO) / STEP))
I_LOAD, I_E1RM = idx(LOAD), idx(E1RM)
A0, A1 = -240.0, 60.0
SETS = [('01','100.0','8','7.5','127'),('02','102.5','8','8.0','130'),('03','102.5','7','8.5','128')]
TOTAL, DONE = 5, 3

CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--ground:#0a0908;--panel:#15130f;--raised:#221f19;--accent:#e4c68c;--pos:#9fae3a;--live:#df5441;
        --hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b;
        --tick1:#5a5449;--tick2:#7d7666;--tick3:#a8a091}
  .board{display:flex;gap:30px;align-items:flex-start;overflow-x:auto;padding-bottom:8px}
  .col{flex:none;width:402px;display:flex;flex-direction:column;gap:14px}
  .cap{display:flex;flex-direction:column;gap:5px;min-height:172px}
  .cap .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .cap .t{font-size:16px;font-weight:600;color:#f0efec}
  .cap .s{font-size:13px;color:#d9c9a8}
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
  .body{position:relative;z-index:2;flex:1;min-height:0;padding:0 16px;display:flex;
        flex-direction:column;align-items:center;gap:10px}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}
  .dial{position:relative;width:342px;height:296px;flex:none;display:flex;align-items:center;justify-content:center}
  .core{position:absolute;display:flex;flex-direction:column;align-items:center;gap:1px}
  .sat{flex:1;min-width:0;border-radius:16px;padding:9px 11px;display:flex;flex-direction:column;gap:4px;
       background:var(--raised);border:1px solid rgba(255,255,255,0.10);
       box-shadow:inset 0 1px 0 rgba(255,255,255,0.09), 0 6px 16px rgba(0,0,0,0.42)}
  .key{min-height:56px;flex:1;display:flex;align-items:center;justify-content:center;font-size:16px;
       font-weight:600;background:var(--accent);color:#15130f;border-radius:20px;
       box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 26px rgba(0,0,0,0.45)}
  .keyG{min-height:56px;flex:none;padding:0 16px;display:flex;align-items:center;justify-content:center;
        border-radius:20px;color:var(--hi);background:rgba(255,255,255,0.09);
        backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);
        border:0.5px solid rgba(255,255,255,0.19);box-shadow:inset 0 1px 0 rgba(255,255,255,0.34)}
  .bar{position:relative;z-index:3;flex:none;margin:6px 16px 30px;display:flex;gap:9px}
  .chip{flex:none;border-radius:13px;padding:7px 11px;display:flex;flex-direction:column;gap:2px;
        background:var(--raised);border:1px solid rgba(255,255,255,0.09)}
  .chipOn{background:rgba(228,198,140,0.14);border-color:rgba(228,198,140,0.46)}
  .sheet{position:absolute;left:0;right:0;bottom:0;z-index:4;border-radius:26px 26px 0 0;padding:10px 18px 30px;
         background:rgba(28,25,20,0.86);backdrop-filter:blur(34px) saturate(180%);
         -webkit-backdrop-filter:blur(34px) saturate(180%);border-top:0.5px solid rgba(255,255,255,0.20);
         box-shadow:0 -18px 44px rgba(0,0,0,0.55);display:flex;flex-direction:column;gap:9px}
  .grab{width:38px;height:4px;border-radius:9999px;background:rgba(255,255,255,0.22);align-self:center;margin-bottom:5px}
  .scrim{position:absolute;inset:0;z-index:3;background:rgba(6,5,4,0.55)}
  .rail{position:absolute;right:9px;top:110px;bottom:120px;width:30px;z-index:3;display:flex;
        flex-direction:column;align-items:center;justify-content:center;gap:9px}
  .node{width:30px;display:flex;flex-direction:column;align-items:center;gap:3px}
"""

def ring(cx, cy, r, lm, ln):
    out = []
    for i in range(N):
        a = A0 + i * (A1 - A0) / (N - 1)
        major = i % 5 == 0
        L = lm if major else ln
        if i == I_E1RM:  col, w = 'var(--live)', 2
        elif i == I_LOAD: col, w = 'var(--accent)', 3
        elif i < I_LOAD:  col, w = ('var(--tick3)' if major else 'var(--tick2)'), (2 if major else 1)
        else:             col, w = ('var(--tick1)' if major else '#3a352d'), 1
        if i in (I_LOAD, I_E1RM): L = lm * 1.4
        rad = math.radians(a)
        out.append('<line x1="%.1f" y1="%.1f" x2="%.1f" y2="%.1f" stroke="%s" stroke-width="%d" '
                   'stroke-linecap="round"></line>'
                   % (cx+r*math.cos(rad), cy+r*math.sin(rad),
                      cx+(r-L)*math.cos(rad), cy+(r-L)*math.sin(rad), col, w))
    return ''.join(out)

def arcp(cx, cy, r, a0, a1):
    x0,y0 = cx+r*math.cos(math.radians(a0)), cy+r*math.sin(math.radians(a0))
    x1,y1 = cx+r*math.cos(math.radians(a1)), cy+r*math.sin(math.radians(a1))
    return 'M %.1f %.1f A %.1f %.1f 0 %d 1 %.1f %.1f' % (x0,y0,r,r,1 if abs(a1-a0)>180 else 0,x1,y1)

def header():
    """H4, with the rules given a job: they are the set meter. Left is done, right is left to do."""
    return ('<div style="width:100%%;flex:none;display:flex;flex-direction:column;align-items:center;gap:8px;'
            'padding:2px 0">'
            '<span style="font-size:23px;font-weight:600;letter-spacing:-0.025em;color:var(--hi)">Barbell Squat</span>'
            '<div class="r" style="gap:10px;width:250px">'
            '<div class="r" style="flex:%d;gap:3px">%s</div>'
            '<span class="mono" style="font-size:11px;font-weight:500;letter-spacing:0.16em;color:var(--pos)">'
            'SET %d / %d</span>'
            '<div class="r" style="flex:%d;gap:3px">%s</div></div>'
            '<span class="mono" style="font-size:13px;letter-spacing:0.10em;color:var(--lo)">00:31:17</span>'
            '</div>'
            % (DONE, ''.join('<span style="flex:1;height:3px;border-radius:9999px;background:var(--pos)"></span>'
                             for _ in range(DONE)),
               DONE+1, TOTAL,
               TOTAL-DONE, ''.join('<span style="flex:1;height:3px;border-radius:9999px;background:%s"></span>'
                                   % ('var(--accent)' if i == 0 else 'var(--off)') for i in range(TOTAL-DONE))))

def dial(core_extra=''):
    a_load = A0 + I_LOAD * (A1 - A0) / (N - 1)
    return ('<div class="dial">'
      '<svg viewBox="0 0 342 296" style="width:342px;height:296px;position:absolute;left:0;top:0">'
      '<path d="%s" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" opacity="0.85"></path>'
      '%s</svg>'
      '<div class="core">'
      '<span class="mono lbl">LOAD</span>'
      '<span class="mono" style="font-size:56px;font-weight:600;letter-spacing:-0.05em;line-height:1;'
      'color:var(--hi)">102.5</span>'
      '<span class="mono" style="font-size:13px;color:var(--mid)">KG &middot; 79%% OF 1RM</span>'
      '<div class="r" style="gap:6px;margin-top:14px;align-items:baseline">'
      '<span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">8</span>'
      '<span class="mono lbl">REPS</span>'
      '<span style="width:1px;height:15px;background:rgba(255,255,255,0.14);margin:0 4px"></span>'
      '<span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.03em;color:var(--accent)">8.0</span>'
      '<span class="mono lbl">RPE</span></div>%s</div></div>'
      % (arcp(171,148,118,A0,a_load), ring(171,148,140,15,7), core_extra))

def sats():
    cells = [('e1RM','130'),('VOLUME','3.7&thinsp;T'),('REST','2:30')]
    return ('<div class="r" style="width:100%;gap:8px;flex:none">' + ''.join(
      '<div class="sat"><span class="mono lbl">%s</span>'
      '<span class="mono" style="font-size:20px;font-weight:500;color:var(--hi)">%s</span></div>' % c
      for c in cells) + '</div>')

def table(compact=False):
    h = 20 if compact else 23
    return ''.join(
      '<div class="r" style="height:%dpx;font-size:11px">'
      '<span class="mono" style="width:24px;color:var(--dim)">%s</span><span class="sp"></span>'
      '<span class="mono" style="width:50px;text-align:right;color:var(--hi)">%s</span>'
      '<span class="mono" style="width:30px;text-align:right;color:var(--mid)">x%s</span>'
      '<span class="mono" style="width:38px;text-align:right;color:var(--lo)">%s</span>'
      '<span class="mono" style="width:44px;text-align:right;color:var(--accent)">%s</span></div>'
      % ((h,) + s) for s in SETS)

def phone(inner, extra='', action='Log set 4', left='SETS'):
    return ('<div class="phone"><div class="field"></div>'
      '<div class="bloom" style="top:90px;left:30px;width:342px;height:330px;background:rgba(228,198,140,0.15)"></div>'
      '<div class="bloom" style="bottom:80px;left:-50px;width:300px;height:220px;background:rgba(159,174,58,0.09)"></div>'
      '<div class="sb"><span class="mono">9:41</span><i></i></div>'
      '<div class="body">' + header() + inner + '</div>'
      + extra +
      '<div class="bar"><div class="keyG"><span class="mono" style="font-size:13px;letter-spacing:0.10em">%s</span></div>'
      '<div class="key">%s</div></div></div>' % (left, action))

# ---------------- S1 sheet ----------------
S1 = phone(dial() + sats())
S1open = phone(dial() + sats(),
  '<div class="scrim"></div>'
  '<div class="sheet"><div class="grab"></div>'
  '<div class="r"><span class="mono lbl">SETS &middot; BARBELL SQUAT</span><span class="sp"></span>'
  '<span class="mono lbl">3 OF 5 DONE</span></div>'
  '<div style="height:1px;background:rgba(255,255,255,0.12)"></div>'
  '<div class="r" style="height:17px"><span class="mono lbl" style="width:24px">SET</span><span class="sp"></span>'
  '<span class="mono lbl" style="width:50px;text-align:right">KG</span>'
  '<span class="mono lbl" style="width:30px;text-align:right">REP</span>'
  '<span class="mono lbl" style="width:38px;text-align:right">RPE</span>'
  '<span class="mono lbl" style="width:44px;text-align:right">e1RM</span></div>'
  + table() +
  '<div class="r" style="height:26px;font-size:11px;background:rgba(228,198,140,0.10);border-radius:8px;'
  'padding:0 6px;margin-top:2px">'
  '<span class="mono" style="width:24px;color:var(--accent)">04</span><span class="sp"></span>'
  '<span class="mono" style="width:50px;text-align:right;color:var(--accent)">102.5</span>'
  '<span class="mono" style="width:30px;text-align:right;color:var(--accent)">x8</span>'
  '<span class="mono" style="width:38px;text-align:right;color:var(--dim)">&mdash;</span>'
  '<span class="mono" style="width:44px;text-align:right;color:var(--dim)">&mdash;</span></div>'
  '<div class="r" style="height:23px;font-size:11px;opacity:0.45">'
  '<span class="mono" style="width:24px;color:var(--dim)">05</span><span class="sp"></span>'
  '<span class="mono" style="width:50px;text-align:right;color:var(--mid)">102.5</span>'
  '<span class="mono" style="width:30px;text-align:right;color:var(--mid)">x8</span></div>'
  '<div class="r" style="gap:8px;margin-top:6px">'
  '<div style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;'
  'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10)">'
  '<span style="font-size:14px;color:var(--hi)">Add set</span></div>'
  '<div style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;border-radius:12px;'
  'background:rgba(255,255,255,0.06);border:1px solid rgba(255,255,255,0.10)">'
  '<span style="font-size:14px;color:var(--hi)">Edit last</span></div></div></div>')

# ---------------- S2 rail ----------------
def rail():
    out = []
    for i in range(TOTAL):
        if i < DONE:   c, h, t = 'var(--pos)', 26, 'var(--pos)'
        elif i == DONE: c, h, t = 'var(--accent)', 34, 'var(--accent)'
        else:          c, h, t = 'var(--off)', 20, 'var(--dim)'
        out.append('<div class="node"><span style="width:3px;height:%dpx;border-radius:9999px;background:%s"></span>'
                   '<span class="mono" style="font-size:11px;color:%s">%d</span></div>' % (h, c, t, i+1))
    return '<div class="rail">' + ''.join(out) + '</div>'
S2 = phone(dial() + sats(), rail())

# ---------------- S3 chip strip ----------------
def chips():
    out = []
    for i, s in enumerate(SETS):
        out.append('<div class="chip"><span class="mono" style="font-size:11px;color:var(--dim)">%s</span>'
                   '<span class="mono" style="font-size:13px;color:var(--mid)">%s&times;%s</span></div>'
                   % (s[0], s[1], s[2]))
    out.append('<div class="chip chipOn"><span class="mono" style="font-size:11px;color:var(--accent)">04</span>'
               '<span class="mono" style="font-size:13px;font-weight:500;color:var(--accent)">102.5&times;8</span></div>')
    out.append('<div class="chip" style="opacity:0.45"><span class="mono" style="font-size:11px;color:var(--dim)">05</span>'
               '<span class="mono" style="font-size:13px;color:var(--dim)">102.5&times;8</span></div>')
    return ('<div class="r" style="width:100%;gap:7px;flex:none;overflow:hidden">' + ''.join(out) + '</div>')
S3 = phone(dial() + sats() + chips())

# ---------------- S4 peek line ----------------
S4 = phone(dial() + sats() +
  '<div style="width:100%;flex:none;border-radius:16px;padding:11px 14px;background:var(--raised);'
  'border:1px solid rgba(255,255,255,0.10);display:flex;align-items:center;gap:10px">'
  '<span class="mono lbl">3 LOGGED</span>'
  '<span style="width:1px;height:14px;background:rgba(255,255,255,0.14)"></span>'
  '<span class="mono" style="font-size:13px;color:var(--mid)">BEST 102.5 &times; 8</span>'
  '<span class="sp"></span>'
  '<span class="mono" style="font-size:15px;color:var(--dim)">&#9662;</span></div>')
S4open = phone(dial() + sats() +
  '<div style="width:100%;flex:none;border-radius:16px;padding:11px 14px;background:var(--raised);'
  'border:1px solid rgba(255,255,255,0.10);display:flex;flex-direction:column;gap:6px">'
  '<div class="r" style="gap:10px"><span class="mono lbl">3 LOGGED</span>'
  '<span style="width:1px;height:14px;background:rgba(255,255,255,0.14)"></span>'
  '<span class="mono" style="font-size:13px;color:var(--mid)">BEST 102.5 &times; 8</span>'
  '<span class="sp"></span><span class="mono" style="font-size:15px;color:var(--accent)">&#9652;</span></div>'
  '<div style="height:1px;background:rgba(255,255,255,0.10)"></div>' + table(True) + '</div>')

# ---------------- S5 ring collar ----------------
def collar():
    seg = []
    span = (A1 - A0)
    for i in range(TOTAL):
        a0 = A0 + span * i / TOTAL + 2
        a1 = A0 + span * (i+1) / TOTAL - 2
        c = 'var(--pos)' if i < DONE else ('var(--accent)' if i == DONE else 'var(--off)')
        seg.append('<path d="%s" fill="none" stroke="%s" stroke-width="5" stroke-linecap="round"></path>'
                   % (arcp(171, 148, 162, a0, a1), c))
    return ''.join(seg)
def dial_collar():
    a_load = A0 + I_LOAD * (A1 - A0) / (N - 1)
    return ('<div class="dial" style="height:320px">'
      '<svg viewBox="0 0 342 320" style="width:342px;height:320px;position:absolute;left:0;top:0">'
      '%s<path d="%s" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" opacity="0.85"></path>'
      '%s</svg>'
      '<div class="core">'
      '<span class="mono lbl">LOAD</span>'
      '<span class="mono" style="font-size:56px;font-weight:600;letter-spacing:-0.05em;line-height:1;color:var(--hi)">102.5</span>'
      '<span class="mono" style="font-size:13px;color:var(--mid)">KG &middot; SET 4 OF 5</span>'
      '<div class="r" style="gap:6px;margin-top:14px;align-items:baseline">'
      '<span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">8</span>'
      '<span class="mono lbl">REPS</span>'
      '<span style="width:1px;height:15px;background:rgba(255,255,255,0.14);margin:0 4px"></span>'
      '<span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.03em;color:var(--accent)">8.0</span>'
      '<span class="mono lbl">RPE</span></div></div></div>'
      % (collar(), arcp(171,148,118,A0,a_load), ring(171,148,140,15,7)))
S5 = phone(dial_collar() + sats())

# ---------------- S6 paged ----------------
S6 = phone(dial() + sats() +
  '<div class="r" style="width:100%;gap:6px;flex:none;justify-content:center;padding-top:2px">'
  '<span style="width:18px;height:3px;border-radius:9999px;background:var(--accent)"></span>'
  '<span style="width:6px;height:3px;border-radius:9999px;background:var(--off)"></span>'
  '<span style="width:6px;height:3px;border-radius:9999px;background:var(--off)"></span></div>'
  '<span class="mono" style="font-size:11px;letter-spacing:0.14em;color:var(--dim)">SWIPE FOR SETS &middot; HISTORY</span>')

COLS = [
 ('S1','Sheet','The bottom-left key opens it',
  'The screen carries nothing but the current set. The key you did not recognise becomes a labelled <b>SETS</b> button, and it lifts a sheet with the full list, the next two sets greyed ahead, and add / edit under them.',
  'Best of the six for editing, worst for glancing &mdash; seeing what you lifted last set costs a tap. Right answer if sets are something you occasionally <em>manage</em> rather than constantly <em>check</em>.', S1),
 ('S2','Edge rail','One node per set, always there',
  'A 30pt strip down the right edge. Filled nodes are done, the tall one is current, dim ones are ahead. Tap a node to open that set.',
  'Costs almost nothing and is always visible, but it only tells you <em>how many</em>, never what you lifted. Also sits under the right thumb, which is either convenient or an accident waiting to happen.', S2),
 ('S3','Chip strip','Every set, one line',
  'A horizontal row of small chips above the action bar. Logged sets show their load and reps; the current one is highlighted; the next is dimmed ahead. Scrolls sideways once there are more than five.',
  'The best glance-to-information ratio here &mdash; you can read the whole session without tapping anything. Costs about 44pt of height permanently, and long sessions push older sets off-screen.', S3),
 ('S4','Peek line','One line that expands',
  'A single summary line: how many logged, and the best set. Tap and it pushes down into the full table in place; tap again and it folds away.',
  'Smallest permanent footprint that still says something useful. The expand is cheap and reversible, and nothing overlays the screen &mdash; but the expanded state pushes the action bar down, which is a real cost mid-set.', S4),
 ('S5','Ring collar','The sets live on the dial',
  'An outer collar on the ring, one segment per set, filled as you complete them. No separate control anywhere &mdash; the instrument you are already looking at carries the progress.',
  'Most elegant and least informative. It answers &ldquo;how far through am I&rdquo; perfectly and nothing else, so it probably needs one of the others alongside it rather than instead of them.', S5),
 ('S6','Paged','Swipe the dial sideways',
  'The dial area is page one of three; sets are page two, exercise history page three. Dots underneath, nothing else.',
  'Zero permanent chrome, and the cleanest screen of the six. Also the least discoverable &mdash; a swipe target with no affordance beyond three dots is exactly the kind of thing you have to be told about once.', S6),
]

cols = ''.join(
  '<div class="col"><div class="cap"><span class="k">%s</span><span class="t">%s</span>'
  '<span class="s">%s</span><span class="d">%s</span><span class="w">%s</span></div>%s</div>' % c for c in COLS)

second = ''.join(
  '<div class="col"><div class="cap" style="min-height:0"><span class="k">%s</span>'
  '<span class="t">%s</span></div>%s</div>' % c
  for c in [('S1 &middot; OPEN','Sheet lifted', S1open), ('S4 &middot; OPEN','Line expanded', S4open)])

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
    <div style="display:flex;flex-direction:column;gap:16px;max-width:940px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 24</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Where the sets go</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Three things are gone from every screen here: the plate card, the SET&nbsp;4/5 tile, and the set table. That frees roughly <span style="color:#f0efec">260 points of vertical space</span>, and the question is what deserves to come back into it. Six answers, ordered from most explicit to most invisible.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The header is H4 with the rules given a job, as you asked. They are now the <span style="color:#96938c">set meter</span>: filled segments on the left are sets you have logged, the bright one on the right is the set you are on, the dim ones after it are still ahead. So the line means something without needing a label, and the count in the middle only confirms what the shape already said.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The bottom-left key is labelled <span class="mono" style="font-size:13px;color:#8c8677">SETS</span> throughout. You were right that a nameless hamburger there was doing nothing legible &mdash; in five of these six it is the way into set management, and in the sixth it is the only way.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Palette is V2 from Lab&nbsp;22, so you can see the more saturated gold in a real screen while you judge the layouts.</p>
    </div>
    <div class="board">''' + cols + '''</div>

    <div style="display:flex;flex-direction:column;gap:12px;max-width:940px;padding-top:16px">
      <h2 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">The two that open</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">S1 overlays and dims what is behind it, so nothing moves &mdash; the dial stays exactly where your eye left it. S4 pushes the layout down instead, which keeps everything on one plane but moves the Log button, and moving the primary action mid-set is the kind of thing that gets noticed at rep eight.</p>
    </div>
    <div class="board">''' + second + '''</div>

    <div style="max-width:940px;padding-top:20px;display:flex;flex-direction:column;gap:10px">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">What I would actually do</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">These are not mutually exclusive, and the strongest combination is probably <b style="color:#c9c3b6;font-weight:500">S3 plus S1</b>: the chip strip for reading, the sheet for editing. Reading what you just lifted happens constantly and should cost nothing; changing a logged set happens rarely and can afford a tap. Trying to serve both with one control is what produced the table that was taking up half the screen.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">S5&rsquo;s collar is worth keeping regardless of which you pick &mdash; it costs no space at all and it is the only one that reads without moving your eyes off the load.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab24.html','w').write(HTML)
print('wrote lab24.html', len(HTML))
