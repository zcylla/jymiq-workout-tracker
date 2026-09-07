import math

LO, HI, N = 20.0, 140.0, 61
STEP = (HI - LO) / (N - 1)
LOAD, E1RM = 102.5, 130.0
idx = lambda kg: int(round((kg - LO) / STEP))
I_LOAD, I_E1RM = idx(LOAD), idx(E1RM)
A0, A1 = -240.0, 60.0
SETS_TOTAL, SET_CUR = 5, 4
EX_TOTAL, EX_CUR = 6, 3
EX_NAMES = ['SQT','RDL','LEG','CRL','CLF','ABS']

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
  .cap{display:flex;flex-direction:column;gap:5px;min-height:196px}
  .cap .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .cap .t{font-size:16px;font-weight:600;color:#f0efec}
  .cap .s{font-size:13px;color:#e4c68c}
  .cap .d{font-size:13px;line-height:1.6;color:#96938c}
  .cap .w{font-size:12px;line-height:1.6;color:#7d786e}
  .phone{width:402px;height:860px;border-radius:34px;overflow:hidden;position:relative;display:flex;
         flex-direction:column;background:var(--ground);border:1px solid rgba(255,255,255,0.08)}
  .field{position:absolute;inset:0;pointer-events:none;z-index:0;
         background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:18px 18px}
  .bloom{position:absolute;border-radius:9999px;pointer-events:none;z-index:0;filter:blur(88px)}
  .sb{position:relative;z-index:2;height:54px;flex:none;display:flex;align-items:center;
      justify-content:space-between;padding:0 26px;font-size:15px;font-weight:600;color:var(--hi)}
  .sb i{width:22px;height:11px;border-radius:3px;border:1px solid var(--lo);display:block}
  .body{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;
        align-items:center;justify-content:space-between;padding:0 16px 6px}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}
  .dial{position:relative;flex:none;display:flex;align-items:center;justify-content:center}
  .core{position:absolute;display:flex;flex-direction:column;align-items:center;gap:1px}
  .glass{background:rgba(255,255,255,0.09);backdrop-filter:blur(30px) saturate(180%);
         -webkit-backdrop-filter:blur(30px) saturate(180%);border:0.5px solid rgba(255,255,255,0.19);
         box-shadow:inset 0 1px 0 rgba(255,255,255,0.36), 0 10px 28px rgba(0,0,0,0.42)}
  .key{min-height:56px;flex:1;display:flex;align-items:center;justify-content:center;font-size:16px;
       font-weight:600;background:var(--accent);color:#15130f;border-radius:20px;
       box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 26px rgba(0,0,0,0.45)}
  .keyG{min-height:56px;flex:none;padding:0 17px;display:flex;align-items:center;justify-content:center;
        border-radius:20px;color:var(--hi)}
  .bar{position:relative;z-index:3;flex:none;margin:0 16px 30px;display:flex;gap:9px}
  .act{flex:1;min-height:48px;border-radius:15px;display:flex;flex-direction:column;align-items:center;
       justify-content:center;gap:3px;background:rgba(255,255,255,0.09);
       backdrop-filter:blur(30px) saturate(180%);-webkit-backdrop-filter:blur(30px) saturate(180%);
       border:0.5px solid rgba(255,255,255,0.19);
       box-shadow:inset 0 1px 0 rgba(255,255,255,0.34), 0 6px 18px rgba(0,0,0,0.34)}
  .act span{font-size:11px;letter-spacing:0.08em;color:var(--mid);
            font-family:'Geist Mono',ui-monospace,monospace}
  .prev{width:100%;border-radius:16px;padding:10px 14px;background:var(--raised);
        border:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;gap:10px}
  .setline{display:flex;align-items:center;gap:12px;justify-content:center;width:100%;flex:none;height:26px}
  .setline .hr{flex:1;max-width:78px;height:1px;background:rgba(255,255,255,0.13)}
  .vcol{position:absolute;left:12px;top:50%;transform:translateY(-50%);z-index:3;display:flex;
        flex-direction:column;align-items:center}
"""

def ring(cx, cy, r, lm, ln):
    out = []
    for i in range(N):
        a = A0 + i * (A1 - A0) / (N - 1)
        major = i % 5 == 0
        L = lm if major else ln
        if i == I_E1RM:   col, w = 'var(--live)', 2
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

def dial(size=352):
    a_load = A0 + I_LOAD * (A1 - A0) / (N - 1)
    cx, cy, r = 171.0, size/2.0 - 6, size/2.0 - 26
    return ('<div class="dial" style="width:342px;height:%dpx">'
      '<svg viewBox="0 0 342 %d" style="width:342px;height:%dpx;position:absolute;left:0;top:0">'
      '<path d="%s" fill="none" stroke="var(--accent)" stroke-width="5" stroke-linecap="round" opacity="0.85"></path>'
      '%s</svg>'
      '<div class="core">'
      '<span class="mono lbl">LOAD</span>'
      '<span class="mono" style="font-size:58px;font-weight:600;letter-spacing:-0.05em;line-height:1;'
      'color:var(--hi)">102.5</span>'
      '<span class="mono" style="font-size:13px;color:var(--mid)">KG &middot; 79%% OF 1RM</span>'
      '<div class="r" style="gap:6px;margin-top:14px;align-items:baseline">'
      '<span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">8</span>'
      '<span class="mono lbl">REPS</span>'
      '<span style="width:1px;height:15px;background:rgba(255,255,255,0.14);margin:0 4px"></span>'
      '<span class="mono" style="font-size:32px;font-weight:600;letter-spacing:-0.03em;color:var(--accent)">8.0</span>'
      '<span class="mono lbl">RPE</span></div></div></div>'
      % (size, size, size, arcp(cx,cy,r-22,A0,a_load), ring(cx,cy,r,15,7)))

def head(sub=''):
    return ('<div style="width:100%%;flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;'
            'padding:4px 0 2px">%s'
            '<span style="font-size:23px;font-weight:600;letter-spacing:-0.025em;color:var(--hi)">Barbell Squat</span>'
            '<span class="mono" style="font-size:13px;letter-spacing:0.10em;color:var(--lo)">00:31:17</span>'
            '</div>' % sub)

# the horizontal indicator is written, in every variant. it never changes.
SETLINE = ('<div class="setline"><span class="hr"></span>'
           '<span class="mono" style="font-size:11px;font-weight:500;letter-spacing:0.16em;color:var(--accent)">'
           'SET 4 OF 5</span><span class="hr"></span></div>')

def prev():
    return ('<div class="prev"><span class="mono lbl">LAST TIME</span>'
            '<span style="width:1px;height:14px;background:rgba(255,255,255,0.14)"></span>'
            '<span class="mono" style="font-size:14px;color:var(--mid)">100.0 &times; 8 @ 7.5</span>'
            '<span class="sp"></span>'
            '<span class="mono" style="font-size:13px;color:var(--pos)">+2.5</span></div>')

def actions():
    P = {'hist':'<path d="M4 11a8 8 0 1 0 2.3-5.6"></path><path d="M4 4v4h4"></path><path d="M11 7v4l3 2"></path>',
         'note':'<rect x="4" y="3" width="14" height="16" rx="2"></rect><path d="M8 8h6M8 12h6M8 16h3"></path>',
         'stat':'<path d="M4 17V11"></path><path d="M9 17V6"></path><path d="M14 17V13"></path><path d="M19 17V9"></path>',
         'swap':'<path d="M5 8h11l-3-3"></path><path d="M17 14H6l3 3"></path>'}
    return ('<div class="r" style="width:100%;gap:8px;flex:none">' + ''.join(
      '<div class="act"><svg viewBox="0 0 22 22" style="width:19px;height:19px" fill="none" '
      'stroke="var(--mid)" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">%s</svg>'
      '<span>%s</span></div>' % (P[k], lab)
      for k, lab in [('hist','HISTORY'),('stat','STATS'),('note','NOTES'),('swap','SWAP')]) + '</div>')

def sess():
    return ('<div class="r" style="width:100%;flex:none">' + ''.join(
      '<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">'
      '<span class="mono" style="font-size:11px;letter-spacing:0.14em;color:var(--dim)">%s</span>'
      '<span class="mono" style="font-size:15px;font-weight:500;color:%s">%s</span></div>' % (n, c, v)
      for n, v, c in [('VOLUME','3.7 T','var(--mid)'),('SETS','12','var(--mid)'),
                      ('e1RM','130','var(--accent)')]) + '</div>')

def phone(vert, sub='', size=352):
    return ('<div class="phone"><div class="field"></div>'
      '<div class="bloom" style="top:80px;left:30px;width:342px;height:340px;background:rgba(228,198,140,0.15)"></div>'
      '<div class="bloom" style="bottom:60px;left:-50px;width:300px;height:220px;background:rgba(159,174,58,0.08)"></div>'
      + vert +
      '<div class="sb"><span class="mono">9:41</span><i></i></div>'
      '<div class="body">' + head(sub) + SETLINE + dial(size) + prev() + actions() + sess() + '</div>'
      '<div class="bar"><div class="keyG glass"><span class="mono" style="font-size:13px;letter-spacing:0.10em">'
      'SETS</span></div><div class="key">Log set 4</div></div></div>')

# ---------- five different vertical languages ----------
def V_dots():
    return ('<div class="vcol" style="gap:8px">' + ''.join(
      '<span style="width:%dpx;height:%dpx;border-radius:9999px;background:%s"></span>'
      % ((8,8,'var(--accent)') if i == EX_CUR else ((5,5,'var(--pos)') if i < EX_CUR else (5,5,'var(--off)')))
      for i in range(1, EX_TOTAL+1)) + '</div>')

def V_bar():
    return ('<div class="vcol"><div style="width:4px;height:190px;border-radius:9999px;'
            'background:rgba(255,255,255,0.08);position:relative;overflow:hidden">'
            '<span style="position:absolute;left:0;right:0;top:0;height:%.0f%%;border-radius:9999px;'
            'background:var(--pos)"></span>'
            '<span style="position:absolute;left:0;right:0;top:%.0f%%;height:%.0f%%;border-radius:9999px;'
            'background:var(--accent)"></span></div>'
            '<span class="mono" style="margin-top:9px;font-size:11px;letter-spacing:0.10em;color:var(--accent)">'
            '%d/%d</span></div>'
            % (100.0*(EX_CUR-1)/EX_TOTAL, 100.0*(EX_CUR-1)/EX_TOTAL, 100.0/EX_TOTAL, EX_CUR, EX_TOTAL))

def V_ticks():
    rows = []
    for i in range(1, EX_TOTAL+1):
        if i == EX_CUR:  w, lc, tc = 13, 'var(--accent)', 'var(--accent)'
        elif i < EX_CUR: w, lc, tc = 11, 'var(--pos)',    'var(--pos)'
        else:            w, lc, tc = 9,  'var(--off)',    'var(--dim)'
        rows.append('<div class="r" style="gap:5px;flex-direction:row-reverse">'
                    '<span style="width:%dpx;height:1px;background:%s"></span>'
                    '<span class="mono" style="font-size:11px;color:%s">%d</span></div>' % (w, lc, tc, i))
    return '<div class="vcol" style="gap:11px">' + ''.join(rows) + '</div>'

def V_names():
    return ('<div class="vcol" style="gap:12px;left:9px">' + ''.join(
      '<span class="mono" style="font-size:11px;letter-spacing:0.10em;color:%s;%s">%s</span>'
      % ('var(--accent)' if i == EX_CUR-1 else ('var(--pos)' if i < EX_CUR-1 else 'var(--off)'),
         'font-weight:500' if i == EX_CUR-1 else '', n)
      for i, n in enumerate(EX_NAMES)) + '</div>')

def V_chev():
    ch = ('<svg viewBox="0 0 20 12" style="width:20px;height:12px" fill="none" stroke="var(--dim)" '
          'stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M3 %s L10 %s L17 %s"></path></svg>')
    return ('<div style="position:absolute;left:0;right:0;top:202px;z-index:3;display:flex;justify-content:center">'
            + (ch % ('8','3','8')) + '</div>'
            '<div style="position:absolute;left:0;right:0;bottom:236px;z-index:3;display:flex;justify-content:center">'
            + (ch % ('4','9','4')) + '</div>')

SUB = '<span class="mono lbl">EXERCISE %d OF %d</span>' % (EX_CUR, EX_TOTAL)

COLS = [
 ('K1','Written + dots','Shapes for one axis, words for the other',
  'The set line stays exactly as G3 &mdash; the words carry it. Exercises get a column of dots on the left edge, which is a shape rather than a sentence.',
  'The cleanest separation of the five: nothing about a row of words resembles a column of dots, so there is no chance of reading one as the other. Also the least informative vertically &mdash; six dots tell you position and nothing else.',
  phone(V_dots(), SUB)),
 ('K2','Written + a single bar','One continuous, one discrete',
  'The vertical axis becomes a single unbroken bar with a filled portion and a bright block for where you are. Not segmented &mdash; deliberately not, so it cannot be mistaken for a count.',
  'The strongest contrast in vocabulary: horizontal is <em>counted and named</em>, vertical is <em>measured</em>. A session reads as a distance you are moving through rather than a list you are ticking off, which is arguably truer.',
  phone(V_bar(), SUB)),
 ('K3','Written + numbered ticks','Both numeric, different shape',
  'A ladder of short rules down the left edge, each with its index beside it. Current one is longer and gold.',
  'Keeps the instrument language of the ring while staying unmistakably vertical, and numbers cannot be misread the way an abbreviation can. Completed rules are green, current is gold, ahead is dim &mdash; so it says position <em>and</em> state. The one residual risk: two numeric indicators on a screen means checking which number you are reading, which the differing shapes mostly but not entirely solve.',
  phone(V_ticks(), SUB)),
 ('K4','Written + names','The most useful vertical',
  'Abbreviated exercise names stacked down the edge, current one bright. You can see what is coming without swiping.',
  'The only variant where the vertical axis carries content rather than position. It is also the only one that will break: six three-letter codes fit, twelve will not, and abbreviations need to be unambiguous or they are worse than dots.',
  phone(V_names(), SUB)),
 ('K5','Written + chevrons','Almost nothing',
  'No persistent column at all. The count lives in the header, and two faint chevrons above and below the dial say the axis exists.',
  'Quietest by a distance and the closest to the paging idea you liked. The chevrons are affordance rather than indicator &mdash; they say <em>you can go this way</em>, not <em>you are here</em>, so the header has to carry the position on its own.',
  phone(V_chev(), SUB, 344)),
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
    <div style="display:flex;flex-direction:column;gap:16px;max-width:940px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 28</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Two axes, two vocabularies</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">You are right that using the same pattern for both axes is confusing, and the reason is worth stating: two identical indicators at ninety degrees to each other make you <span style="color:#f0efec">work out which is which</span> before you can read either. So G3&rsquo;s written set line is fixed in all five &mdash; it never changes &mdash; and only the vertical language moves.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Read across the top of each phone and the horizontal axis is always a sentence flanked by two hairlines. Read down the left edge and it is a different thing every time: shapes, a measure, a ladder, names, or nothing at all. The pairing is the design, not either half on its own.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Three fixes since the last pass. Completed exercises now take the palette&rsquo;s <span style="color:#9fae3a">done</span> green rather than a neutral grey, so the vertical axis carries state and not just position. The secondary buttons were reading as disabled &mdash; they now use the same glass recipe as the rest of the chrome, with the ink lifted a step. And <span style="color:#96938c">ELAPSED is gone from the bottom strip</span>: you were right that it was already in the header, and a number shown twice on one screen is a number you stop trusting.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66"><b style="color:#c9c3b6;font-weight:500">Typeface is now Geist and Geist Mono</b>, as chosen in Lab&nbsp;09 &mdash; every earlier board was still running Inter and JetBrains Mono, which was my oversight.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">My own read is <span style="color:#96938c">K2</span>. Words counting sets against a continuous bar measuring session progress is the widest gap in vocabulary available, and it happens to be true to the data &mdash; sets really are discrete and countable; a session really is a distance you move through.</p>
    </div>
    <div class="board">''' + cols + '''</div>

    <div style="max-width:940px;padding-top:20px;display:flex;flex-direction:column;gap:10px">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">Worth saying before you lock it</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">All five still put the vertical indicator on the <b style="color:#c9c3b6;font-weight:500">left edge</b>, which is where iOS reads a horizontal drag as the back gesture. That is a hardware question, not a drawing one &mdash; it needs a device and a real thumb before it is settled. If it turns out to fight, K5 survives it best, because chevrons are decoration you can move anywhere; a column is not.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab28.html','w').write(HTML)
print('wrote lab28.html', len(HTML))
