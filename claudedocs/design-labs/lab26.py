import math

LO, HI, N = 20.0, 140.0, 61
STEP = (HI - LO) / (N - 1)
LOAD, E1RM = 102.5, 130.0
idx = lambda kg: int(round((kg - LO) / STEP))
I_LOAD, I_E1RM = idx(LOAD), idx(E1RM)
A0, A1 = -240.0, 60.0
SETS_TOTAL, SET_CUR = 5, 4      # 1-indexed current
EX_TOTAL, EX_CUR = 6, 3

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
  .cap{display:flex;flex-direction:column;gap:5px;min-height:186px}
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
  .body{position:relative;z-index:2;flex:1;min-height:0;display:flex;flex-direction:column;align-items:center;justify-content:space-between;padding-bottom:6px}
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
  .act{flex:1;min-height:46px;border-radius:14px;display:flex;flex-direction:column;align-items:center;
       justify-content:center;gap:3px;background:rgba(255,255,255,0.045);border:1px solid rgba(255,255,255,0.08)}
  .act span{font-size:11px;letter-spacing:0.08em;color:var(--lo);
            font-family:'Geist Mono',ui-monospace,monospace}
  .prev{width:100%;border-radius:16px;padding:10px 14px;background:var(--raised);
        border:1px solid rgba(255,255,255,0.09);display:flex;align-items:center;gap:10px}
  .peek{position:absolute;top:100px;bottom:230px;width:26px;z-index:1;border-radius:16px;
        background:rgba(255,255,255,0.035);border:1px solid rgba(255,255,255,0.07);
        display:flex;align-items:center;justify-content:center}
  .peek span{writing-mode:vertical-rl;transform:rotate(180deg);font-size:11px;letter-spacing:0.16em;
             color:var(--dim);font-family:'Geist Mono',ui-monospace,monospace}
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

def dial(size=330, collar=''):
    a_load = A0 + I_LOAD * (A1 - A0) / (N - 1)
    cx, cy, r = 342/2.0, size/2.0 - 6, size/2.0 - 26
    return ('<div class="dial" style="width:342px;height:%dpx">'
      '<svg viewBox="0 0 342 %d" style="width:342px;height:%dpx;position:absolute;left:0;top:0">%s'
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
      % (size, size, size, collar, arcp(cx,cy,r-22,A0,a_load), ring(cx,cy,r,15,7)))

def head():
    return ('<div style="width:100%%;flex:none;display:flex;flex-direction:column;align-items:center;gap:4px;'
            'padding:4px 0 2px">'
            '<span class="mono lbl">EXERCISE %d OF %d</span>'
            '<span style="font-size:23px;font-weight:600;letter-spacing:-0.025em;color:var(--hi)">Barbell Squat</span>'
            '<span class="mono" style="font-size:13px;letter-spacing:0.10em;color:var(--lo)">00:31:17</span>'
            '</div>' % (EX_CUR, EX_TOTAL))

def sess():
    return ('<div class="r" style="width:100%;flex:none;gap:0">'
      + ''.join('<div style="flex:1;display:flex;flex-direction:column;align-items:center;gap:3px">'
                '<span class="mono" style="font-size:11px;letter-spacing:0.14em;color:var(--dim)">%s</span>'
                '<span class="mono" style="font-size:15px;font-weight:500;color:%s">%s</span></div>'
                % (n, c, v) for n, v, c in
                [('ELAPSED','31:17','var(--mid)'),('VOLUME','3.7 T','var(--mid)'),
                 ('SETS','12','var(--mid)'),('e1RM','130','var(--accent)')]) + '</div>')

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
    cells = ''.join(
      '<div class="act"><svg viewBox="0 0 22 22" style="width:19px;height:19px" fill="none" '
      'stroke="var(--lo)" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">%s</svg>'
      '<span>%s</span></div>' % (P[k], lab)
      for k, lab in [('hist','HISTORY'),('stat','STATS'),('note','NOTES'),('swap','SWAP')])
    return '<div class="r" style="width:100%;gap:8px;flex:none">' + cells + '</div>'

def phone(inner, peeks='', pad='0 16px'):
    return ('<div class="phone"><div class="field"></div>'
      '<div class="bloom" style="top:80px;left:30px;width:342px;height:340px;background:rgba(228,198,140,0.15)"></div>'
      '<div class="bloom" style="bottom:60px;left:-50px;width:300px;height:220px;background:rgba(159,174,58,0.08)"></div>'
      + peeks +
      '<div class="sb"><span class="mono">9:41</span><i></i></div>'
      '<div class="body" style="padding:%s">%s</div>'
      '<div class="bar"><div class="keyG glass"><span class="mono" style="font-size:13px;letter-spacing:0.10em">'
      'SETS</span></div><div class="key">Log set 4</div></div></div>' % (pad, inner))

# ---------- indicators, all symmetric by construction ----------
def hdots(style='dot'):
    """Centred row: N equal cells, the current one marked. Symmetric for any N, odd or even."""
    out = []
    for i in range(1, SETS_TOTAL+1):
        done, cur = i < SET_CUR, i == SET_CUR
        if style == 'dot':
            sz = 9 if cur else 6
            c = 'var(--accent)' if cur else ('var(--pos)' if done else 'var(--off)')
            out.append('<span style="width:%dpx;height:%dpx;border-radius:9999px;background:%s"></span>' % (sz, sz, c))
        else:  # bar
            w = 30 if cur else 16
            c = 'var(--accent)' if cur else ('var(--pos)' if done else 'var(--off)')
            out.append('<span style="width:%dpx;height:4px;border-radius:9999px;background:%s"></span>' % (w, c))
    return ('<div class="r" style="gap:7px;justify-content:center;width:100%;flex:none;height:22px">'
            + ''.join(out) + '</div>')

def vdots(side='left', style='dot'):
    out = []
    for i in range(1, EX_TOTAL+1):
        done, cur = i < EX_CUR, i == EX_CUR
        if style == 'dot':
            sz = 8 if cur else 5
            c = 'var(--accent)' if cur else ('var(--pos)' if done else 'var(--off)')
            out.append('<span style="width:%dpx;height:%dpx;border-radius:9999px;background:%s"></span>' % (sz, sz, c))
        else:
            h = 26 if cur else 13
            c = 'var(--accent)' if cur else ('var(--pos)' if done else 'var(--off)')
            out.append('<span style="width:4px;height:%dpx;border-radius:9999px;background:%s"></span>' % (h, c))
    return ('<div style="position:absolute;%s:11px;top:50%%;transform:translateY(-50%%);z-index:3;'
            'display:flex;flex-direction:column;align-items:center;gap:7px">%s</div>'
            % (side, ''.join(out)))

# ================= G1 dots =================
G1 = phone(head() + hdots('dot') + dial(352) + prev() + actions() + sess(), vdots('left','dot'))

# ================= G2 segmented tape =================
G2 = phone(head() + hdots('bar') + dial(352) + prev() + actions() + sess(), vdots('right','bar'))

# ================= G3 numeric + hairline =================
G3num = ('<div class="r" style="gap:12px;justify-content:center;width:100%;flex:none;height:26px">'
  '<span style="flex:1;max-width:74px;height:1px;background:rgba(255,255,255,0.12)"></span>'
  '<span class="mono" style="font-size:11px;font-weight:500;letter-spacing:0.16em;color:var(--accent)">'
  'SET 4 OF 5</span>'
  '<span style="flex:1;max-width:74px;height:1px;background:rgba(255,255,255,0.12)"></span></div>')
G3 = phone(head() + G3num + dial(348) + prev() + actions() + sess(), vdots('left','bar'))

# ================= G4 the ring carries the sets =================
def collar():
    seg = []
    span = A1 - A0
    for i in range(SETS_TOTAL):
        a0 = A0 + span * i / SETS_TOTAL + 2.5
        a1 = A0 + span * (i+1) / SETS_TOTAL - 2.5
        c = ('var(--pos)' if i < SET_CUR-1 else ('var(--accent)' if i == SET_CUR-1 else 'var(--off)'))
        w = 6 if i == SET_CUR-1 else 4
        seg.append('<path d="%s" fill="none" stroke="%s" stroke-width="%d" stroke-linecap="round"></path>'
                   % (arcp(171, 368/2.0-6, 168, a0, a1), c, w))
    return ''.join(seg)
G4 = phone(head() + dial(368, collar()) + prev() + actions() + sess(), vdots('left','dot'))

# ================= G5 peeking neighbours =================
peeks = (vdots('left','dot')
  + '<div class="peek" style="left:-13px"><span>SET 3 &middot; 102.5</span></div>'
  + '<div class="peek" style="right:-13px"><span>SET 5 &middot; 102.5</span></div>')
G5 = phone(head() + hdots('dot') + dial(336) + prev() + actions() + sess(), peeks, '0 26px')

COLS = [
 ('G1','Dots','Centred dots both ways',
  'A centred row of dots for sets under the header, a centred column for exercises on the left edge. The current one grows; logged ones stay filled; ahead ones sit dim.',
  'Symmetry comes free: a centred row of N equal cells is symmetric whether N is four or five. The old header split it into done-on-the-left and ahead-on-the-right, which is exactly what made odd counts look wrong.', G1),
 ('G2','Segments','The same, as bars',
  'Dots become capsules and the current one stretches. Vertical column moves to the right edge, where the thumb already is.',
  'Reads more like an instrument and slightly less like a carousel. The right-edge column is closer to the thumb but also closer to the system back-swipe, which is worth testing on a real device before committing.', G2),
 ('G3','Written','Words, not shapes',
  'The set position is stated rather than drawn, flanked by two hairlines that are pure typography &mdash; they frame, they do not encode.',
  'Unambiguous and the least decorative. It gives up the at-a-glance shape though: you have to read it, which is one cognitive step more than counting dots.', G3),
 ('G4','On the ring','Sets live on the dial',
  'No separate indicator at all. An outer collar on the ring carries one segment per set, and the header only says which exercise you are on.',
  'Buys back about 22pt and keeps the eye in one place. It is also the only variant where the set position is not obviously swipeable &mdash; nothing about a ring says &ldquo;drag me sideways&rdquo;.', G4),
 ('G5','Peeking','You can see there is more',
  'The neighbouring sets are visible at both edges as thin slivers. The screen narrows by 20pt to make room.',
  'This is the honest answer to the discoverability problem: a gesture with no affordance has to be taught, but you cannot fail to notice something already poking into the screen. Costs the least explanation and the most width.', G5),
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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 26</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Swipe sideways for sets, up for exercises</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Two axes, both native to a phone. <span style="color:#f0efec">Left and right moves between sets; up and down moves between exercises.</span> Every variant here is the same interaction model with a different way of telling you where you are, and all five fill the screen exactly &mdash; no dead space, nothing scrolls.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The asymmetry you spotted is fixed at the root. It came from splitting the meter into <em>done on the left, ahead on the right</em>, which can never balance on an odd count. Every indicator here is instead a <span style="color:#96938c">centred row of N equal cells</span> with the current one marked, so it is symmetric whether you do four sets or five or nine.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">The freed space now does two jobs. A <span style="color:#96938c">last time</span> line sits under the dial &mdash; what you lifted for this set last session, and the delta &mdash; which is the one number you actually want mid-set and never had. Under that, four secondary destinations: history, stats, notes, swap exercise. And <span class="mono" style="font-size:13px;color:#8c8677">SETS</span> still opens the full sheet, so nothing is buried.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Palette is V2, locked.</p>
    </div>
    <div class="board">''' + cols + '''</div>

    <div style="max-width:940px;padding-top:20px;display:flex;flex-direction:column;gap:10px">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">The one real risk</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">A horizontal swipe on the left edge of an iOS screen is the system back gesture, and a vertical swipe near the bottom is the home gesture. Both will fight you. The practical answer is to keep the swipe region to the dial and the area immediately around it rather than the whole screen, and to make sure every gesture has a tappable equivalent &mdash; the dots should be tappable, not just decorative. <b style="color:#c9c3b6;font-weight:500">G5 is the safest of the five</b> precisely because the peeking neighbours are themselves tap targets, so the gesture is an accelerator rather than the only way through.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab26.html','w').write(HTML)
print('wrote lab26.html', len(HTML))
