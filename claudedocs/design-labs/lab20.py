CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--ground:#0a0908;--panel:#15130f;--raised:#221f19;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;
        --hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b;
        --tick1:#5a5449;--tick2:#7d7666;--tick3:#a8a091}
  .grid{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:26px;max-width:1330px}
  .wrap{display:flex;flex-direction:column;gap:12px}
  .hd{display:flex;flex-direction:column;gap:4px;min-height:104px}
  .hd .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .hd .t{font-size:16px;font-weight:600;color:#f0efec}
  .hd .s{font-size:12px;color:#d9c9a8}
  .hd .d{font-size:12px;line-height:1.6;color:#8c8677}
  .bad .t{color:#e8b7a2}
  .win .s{color:#8ce07f}

  .stage{width:402px;height:290px;border-radius:0 0 34px 34px;border:1px solid rgba(255,255,255,0.08);
         border-top:none;position:relative;overflow:hidden;background:var(--ground);
         display:flex;flex-direction:column;justify-content:flex-end}
  .stage .fld{position:absolute;inset:0;pointer-events:none;
              background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);background-size:18px 18px}
  .stage .bloom{position:absolute;bottom:20px;left:-60px;width:280px;height:220px;border-radius:9999px;
                filter:blur(80px);background:rgba(217,201,168,0.13)}
  .peek{position:absolute;left:16px;right:16px;top:14px;display:flex;flex-direction:column;gap:8px;opacity:0.55}
  .peekcard{border-radius:16px;background:#1b1813;border:1px solid rgba(255,255,255,0.07);padding:11px 13px;
            display:flex;flex-direction:column;gap:6px}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .r{display:flex;align-items:center}
  .sp{flex:1}

  .glass{background:rgba(255,255,255,0.09);backdrop-filter:blur(30px) saturate(180%);
         -webkit-backdrop-filter:blur(30px) saturate(180%);border:0.5px solid rgba(255,255,255,0.19);
         box-shadow:inset 0 1px 0 rgba(255,255,255,0.36), inset 0 -1px 0 rgba(0,0,0,0.20),
                    0 10px 28px rgba(0,0,0,0.42)}
  .navrow{position:relative;z-index:2;margin:0 16px 30px;display:flex;gap:9px;align-items:center}
  .why{font-size:12px;line-height:1.6;color:#8c8677;max-width:402px}
  .why b{color:#c9c3b6;font-weight:500}
"""

def ico(kind, col, sw=1.6):
    P = {
     'today':'<circle cx="11" cy="11" r="8"></circle><path d="M11 5.4 A5.6 5.6 0 0 1 16.6 11"></path>',
     'session':'<path d="M3 11h16"></path><rect x="4.5" y="7" width="3.2" height="8" rx="1"></rect>'
               '<rect x="14.3" y="7" width="3.2" height="8" rx="1"></rect>',
     'strength':'<path d="M3 16 L8 11 L12 13.5 L19 6"></path><path d="M19 10.5 V6 h-4.5"></path>',
     'load':'<path d="M4 17V11"></path><path d="M8.6 17V7"></path><path d="M13.3 17V13"></path><path d="M18 17V9"></path>',
    }[kind]
    return ('<svg viewBox="0 0 22 22" style="width:22px;height:22px;flex:none" fill="none" stroke="%s" '
            'stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</svg>' % (col, sw, P))

TABS = [('today','Today'),('session','Session'),('strength','Strength'),('load','Load')]

def peek():
    return ('<div class="peek">'
      '<div class="peekcard"><div class="r"><span class="mono lbl">VOLUME / WEEK</span><span class="sp"></span>'
      '<span class="mono" style="font-size:11px;color:var(--pos)">+12%</span></div>'
      '<span class="mono" style="font-size:26px;font-weight:600;letter-spacing:-0.03em;color:var(--hi)">6.20 T</span></div>'
      '<div class="peekcard"><div class="r"><span class="mono lbl">NEXT &middot; LOWER A</span><span class="sp"></span>'
      '<span class="mono lbl">4 LIFTS</span></div>'
      '<span style="font-size:17px;font-weight:600;color:var(--hi)">Barbell Squat</span></div></div>')

# ---- N1 segmented pill, as today ----
def N1():
    items = ''.join(
      '<div style="flex:1;min-height:38px;display:flex;align-items:center;justify-content:center;'
      'border-radius:9999px;%s"><span style="font-size:13px;font-weight:%s;color:%s">%s</span></div>'
      % ('background:rgba(255,255,255,0.13)' if i == 0 else '', '600' if i == 0 else '500',
         'var(--hi)' if i == 0 else 'var(--lo)', lab)
      for i, (_, lab) in enumerate(TABS))
    return ('<div class="navrow"><div class="glass" style="flex:1;border-radius:9999px;padding:5px;display:flex;gap:2px">'
            + items + '</div></div>')

# ---- N2 glass tab bar, icon + micro label ----
def N2():
    items = ''.join(
      '<div style="flex:1;min-height:50px;display:flex;flex-direction:column;align-items:center;'
      'justify-content:center;gap:3px">%s'
      '<span class="mono" style="font-size:11px;letter-spacing:0.06em;color:%s">%s</span></div>'
      % (ico(k, 'var(--accent)' if i == 0 else 'var(--lo)', 1.9 if i == 0 else 1.5),
         'var(--accent)' if i == 0 else 'var(--lo)', lab)
      for i, (k, lab) in enumerate(TABS))
    return ('<div class="navrow"><div class="glass" style="flex:1;border-radius:26px;padding:4px;display:flex">'
            + items + '</div></div>')

# ---- N3 icon-only dock ----
def N3():
    items = ''.join(
      '<div style="flex:1;min-height:50px;display:flex;flex-direction:column;align-items:center;'
      'justify-content:center;gap:5px">%s'
      '<span style="width:4px;height:4px;border-radius:9999px;background:%s"></span></div>'
      % (ico(k, 'var(--accent)' if i == 0 else 'var(--lo)', 1.9 if i == 0 else 1.5),
         'var(--accent)' if i == 0 else 'transparent')
      for i, (k, _) in enumerate(TABS))
    return ('<div class="navrow"><div class="glass" style="flex:1;border-radius:24px;padding:3px;display:flex">'
            + items + '</div></div>')

# ---- N4 split action bar - the recommendation ----
def N4():
    items = ''.join(
      '<div style="flex:1;min-height:52px;display:flex;align-items:center;justify-content:center">%s</div>'
      % ico(k, 'var(--accent)' if i == 0 else 'var(--lo)', 1.9 if i == 0 else 1.5)
      for i, (k, _) in enumerate(TABS))
    return ('<div class="navrow">'
            '<div class="glass" style="flex:1;border-radius:22px;padding:2px;display:flex">' + items + '</div>'
            '<div style="min-height:56px;padding:0 22px;display:flex;align-items:center;border-radius:22px;'
            'background:var(--accent);box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 26px rgba(0,0,0,0.45)">'
            '<span style="font-size:15px;font-weight:600;color:#15130f">Start</span></div></div>')

# ---- N5 minimised on scroll ----
def N5():
    return ('<div class="navrow" style="justify-content:center">'
            '<div class="glass" style="border-radius:9999px;padding:9px 20px;display:flex;align-items:center;gap:9px">'
            + ico('today', 'var(--accent)', 1.9) +
            '<span style="font-size:14px;font-weight:600;color:var(--hi)">Today</span>'
            '<span style="width:1px;height:16px;background:rgba(255,255,255,0.20);margin:0 2px"></span>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.10em;color:var(--lo)">3 MORE</span></div></div>')

# ---- N6 live session: navigation is gone ----
def N6():
    return ('<div class="navrow" style="flex-direction:column;gap:9px;align-items:stretch">'
            '<div class="glass" style="border-radius:20px;padding:10px 14px;display:flex;align-items:center;gap:10px">'
            '<span style="width:7px;height:7px;border-radius:9999px;background:var(--live)"></span>'
            '<span class="mono" style="font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--live)">'
            'LIVE &middot; LOWER A</span><span class="sp"></span>'
            '<span class="mono" style="font-size:13px;color:var(--mid)">00:31:17</span></div>'
            '<div class="r" style="gap:9px">'
            '<div class="glass" style="width:56px;min-height:56px;border-radius:20px;display:flex;'
            'align-items:center;justify-content:center"><span class="mono" style="font-size:17px;color:var(--hi)">&equiv;</span></div>'
            '<div style="flex:1;min-height:56px;display:flex;align-items:center;justify-content:center;'
            'border-radius:20px;background:var(--accent);box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), '
            '0 10px 26px rgba(0,0,0,0.45)">'
            '<span style="font-size:16px;font-weight:600;color:#15130f">Log set 4</span></div></div></div>')

CARDS = [
 ('N1','Segmented pill','What is there now', N1(), 'bad',
  'Worth naming why this one grates. A segmented control is the component iOS reserves for <b>filtering content inside a screen</b> '
  '&mdash; Health uses one for Summary / Sharing. Using it to switch between top-level destinations is a documented anti-pattern: '
  'it looks like a filter and behaves like navigation, and that mismatch is legible even when you cannot name it.'),
 ('N2','Glass tab bar','The native answer', N2(), '',
  'Four icons with tracked mono labels on a floating glass slab. This is what iOS 26 does natively, and SDK 57 will hand you '
  'the material, the float and the shrink-on-scroll for free through Native Tabs. Safest possible choice. '
  'Also the one that looks the most like everyone else.'),
 ('N3','Icon dock','Quietest', N3(), '',
  'Labels drop, and a single dot marks the active destination. Calmest of the six and the most consistent with the '
  'hairline instrument language. The cost is real: infrequent destinations get slower to find, so the four glyphs have to be '
  'genuinely unambiguous.'),
 ('N4','Split action bar','Recommended', N4(), 'win',
  'Four destinations in a glass dock, and the primary action as a separate solid capsule beside it &mdash; same plane, '
  'different weight. It says what the screen is <b>for</b>, which a row of four equal tabs cannot. Not a Material centre FAB '
  'piercing the bar; that idiom is wrong for iOS and there is no natural middle in an even four.'),
 ('N5','Minimised','The scroll-down state', N5(), '',
  'iOS 26 tab bars collapse to the active tab while you scroll and expand again when you scroll back up. On the dense Strength '
  'and Load screens that buys back about 60pt of chart. Native Tabs gives this behaviour without custom code.'),
 ('N6','Live session','Navigation gets out of the way', N6(), 'win',
  'During a set the four destinations disappear entirely and the bar becomes one job. Every app checked &mdash; Strong, Hevy, '
  'Fitbod, Nike Training Club, Peloton, Ladder, Strava &mdash; does some version of this; not one keeps four-way navigation live '
  'during a set. Built as a separate route outside the tab group, not a hidden tab bar.'),
]

cards = ''.join(
  '<div class="wrap"><div class="hd %s"><span class="k">%s</span><span class="t">%s</span>'
  '<span class="s">%s</span></div>'
  '<div class="stage"><div class="fld"></div><div class="bloom"></div>%s%s</div>'
  '<span class="why">%s</span></div>'
  % (c[4], c[0], c[1], c[2], peek(), c[3], c[5]) for c in CARDS)

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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 20</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Navigation</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">There is a concrete reason the current bar bothers you, and it is not taste. <span style="color:#f0efec">A segmented control is the component iOS reserves for filtering content within a screen</span> &mdash; not for switching between top-level destinations. Using it as primary navigation is a documented mismatch: it reads as a filter and behaves as a tab bar.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Six alternatives below, each shown on the bottom third of a real screen rather than floating on a slide. The last two are states rather than styles &mdash; what the bar does when you scroll, and what it becomes once a set is running.</p>
    </div>
    <div class="grid">''' + cards + '''</div>

    <div style="max-width:920px;padding-top:16px;display:flex;flex-direction:column;gap:10px">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">What the platform gives you</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Two routes, and the choice decides how much you can bend the shape. <b style="color:#c9c3b6;font-weight:500">Native Tabs</b> in SDK&nbsp;57 hands you real Liquid&nbsp;Glass, the float, and minimise-on-scroll with no custom code &mdash; but you are locked to Apple&rsquo;s bar shape and its icon/label slots, so N4&rsquo;s asymmetry is out. <b style="color:#c9c3b6;font-weight:500">Router UI</b> (<span class="mono" style="font-size:13px;color:#8c8677">Tabs / TabList / TabTrigger asChild</span>) is headless: it owns the routing and you draw whatever you like with <span class="mono" style="font-size:13px;color:#8c8677">GlassView</span> and <span class="mono" style="font-size:13px;color:#8c8677">GlassContainer</span>. N4 and N6 need the second route.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">One caution worth recording: Apple&rsquo;s new bottom-accessory slot is explicitly for <em>global</em> state &mdash; a now-playing chip, or a &ldquo;workout in progress&rdquo; pill visible from every tab. It is not the place for the Log&nbsp;set button, and using it that way will look wrong on the other three tabs.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab20.html','w').write(HTML)
print('wrote lab20.html', len(HTML))
