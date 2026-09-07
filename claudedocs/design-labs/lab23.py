import sys; sys.path.insert(0,'.')
import lab20

CSS = lab20.CSS + """
  .fab{border-radius:9999px;display:flex;align-items:center;justify-content:center;
       background:var(--accent);box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 26px rgba(0,0,0,0.50)}
  .tabi{flex:1;min-height:52px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:3px}
  .tabl{font-size:11px;letter-spacing:0.05em;font-family:'Geist Mono',ui-monospace,monospace}
"""
ico = lab20.ico
peek = lab20.peek

def plus(sz=24, sw=2.1, col='#15130f'):
    return ('<svg viewBox="0 0 24 24" style="width:%dpx;height:%dpx" fill="none" stroke="%s" stroke-width="%s" '
            'stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>' % (sz, sz, col, sw))

def tab(k, lab, on):
    c = 'var(--accent)' if on else 'var(--lo)'
    return ('<div class="tabi">%s<span class="tabl" style="color:%s">%s</span></div>'
            % (ico(k, c, 1.9 if on else 1.5), c, lab))

L = [('today','Today',True),('session','Session',False)]
R = [('strength','Strength',False),('load','Load',False)]

def W1():  # raised, breaks the top edge
    return ('<div class="navrow" style="position:relative">'
            '<div class="glass" style="flex:1;border-radius:26px;padding:4px;display:flex">'
            + ''.join(tab(*t) for t in L)
            + '<div style="width:74px;flex:none"></div>'
            + ''.join(tab(*t) for t in R) + '</div>'
            '<div class="fab" style="position:absolute;left:50%;bottom:16px;transform:translateX(-50%);'
            'width:62px;height:62px">' + plus() + '</div></div>')

def W2():  # inset, same plane
    return ('<div class="navrow">'
            '<div class="glass" style="flex:1;border-radius:26px;padding:4px;display:flex;align-items:center">'
            + ''.join(tab(*t) for t in L)
            + '<div style="width:66px;flex:none;display:flex;justify-content:center">'
              '<div class="fab" style="width:52px;height:52px">' + plus(22) + '</div></div>'
            + ''.join(tab(*t) for t in R) + '</div></div>')

def W3():  # detached, floating clear of the bar
    return ('<div class="navrow" style="position:relative">'
            '<div class="glass" style="flex:1;border-radius:26px;padding:4px;display:flex">'
            + ''.join(tab(*t) for t in L + R) + '</div>'
            '<div class="fab" style="position:absolute;right:0;bottom:74px;width:60px;height:60px">'
            + plus() + '</div></div>')

def W4():  # notched, the bar makes room for it
    notch = ('<div style="width:82px;flex:none;position:relative">'
             '<div style="position:absolute;left:50%;top:-12px;transform:translateX(-50%);width:74px;height:74px;'
             'border-radius:9999px;background:rgba(10,9,8,0.92)"></div>'
             '<div class="fab" style="position:absolute;left:50%;top:-4px;transform:translateX(-50%);'
             'width:58px;height:58px">' + plus(23) + '</div></div>')
    return ('<div class="navrow">'
            '<div class="glass" style="flex:1;border-radius:26px;padding:4px;display:flex;overflow:visible">'
            + ''.join(tab(*t) for t in L) + notch + ''.join(tab(*t) for t in R) + '</div></div>')

def W5():  # minimised on scroll, keeping the button
    return ('<div class="navrow" style="justify-content:center;gap:10px">'
            '<div class="glass" style="border-radius:9999px;padding:9px 18px;display:flex;align-items:center;gap:9px">'
            + ico('today','var(--accent)',1.9) +
            '<span style="font-size:14px;font-weight:600;color:var(--hi)">Today</span>'
            '<span style="width:1px;height:16px;background:rgba(255,255,255,0.20)"></span>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.10em;color:var(--lo)">3 MORE</span></div>'
            '<div class="fab" style="width:46px;height:46px">' + plus(20, 2.2) + '</div></div>')

def W6():  # live session, navigation replaced
    return ('<div class="navrow" style="flex-direction:column;gap:9px;align-items:stretch">'
            '<div class="glass" style="border-radius:20px;padding:10px 14px;display:flex;align-items:center;gap:10px">'
            '<span style="width:7px;height:7px;border-radius:9999px;background:var(--live)"></span>'
            '<span class="mono" style="font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--live)">'
            'LIVE &middot; LOWER A</span><span class="sp"></span>'
            '<span class="mono" style="font-size:13px;color:var(--mid)">00:31:17</span></div>'
            '<div class="r" style="gap:9px">'
            '<div class="glass" style="width:56px;min-height:56px;border-radius:20px;display:flex;align-items:center;'
            'justify-content:center"><span class="mono" style="font-size:15px;color:var(--hi)">SETS</span></div>'
            '<div style="flex:1;min-height:56px;display:flex;align-items:center;justify-content:center;'
            'border-radius:20px;background:var(--accent);box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), '
            '0 10px 26px rgba(0,0,0,0.45)">'
            '<span style="font-size:16px;font-weight:600;color:#15130f">Log set 4</span></div></div></div>')

CARDS = [
 ('W1','Raised','The button breaks the bar', W1(), '',
  'The circle overlaps the top edge, so it reads as sitting in front of the navigation rather than inside it. '
  'Unmistakable, and the most familiar version of this pattern &mdash; it is also the most Android-looking, because '
  'piercing a surface is a Material idea, not an iOS one.'),
 ('W2','Inset','Same plane, same height', W2(), 'win',
  'The circle lives inside the bar at the same height as the tabs, just round instead of square. Nothing pierces '
  'anything, so the glass stays one continuous surface &mdash; which is what iOS 26 wants. Quietest of the four and '
  'still the most prominent thing on the bar.'),
 ('W3','Detached','A separate object', W3(), '',
  'The button floats clear of the bar entirely, at the bottom right where a thumb already rests. Two objects instead '
  'of one, which is honest &mdash; navigation and action really are different things &mdash; but it stops reading as centred '
  'and gives up the symmetry you asked for.'),
 ('W4','Notched','The bar makes room', W4(), '',
  'A cutout in the glass with the circle nested into it. The most sculptural of the four and the most engineering: '
  'the notch has to be masked out of a live blur, which is not free at 120&nbsp;fps.'),
 ('W5','Minimised','Scrolled down', W5(), '',
  'The scroll-down state, with the start button surviving the collapse at a smaller size. Worth keeping &mdash; the one '
  'action you might want while scrolling a chart is starting the session.'),
 ('W6','Live session','Navigation stands down', W6(), 'win',
  'Once a set is running the four destinations go and the bar becomes one job. The left key is now labelled '
  '<b>SETS</b> rather than a nameless hamburger &mdash; you were right that it was doing nothing legible.'),
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
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 23</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Labels, and a button in the middle</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">N2&rsquo;s labels stay &mdash; you were right that an icon-only bar is a memory test you would eventually resent, and that is true whether one person uses the app or a million. So every variant here keeps <span style="color:#f0efec">icon and label on all four destinations</span>. The only thing changing is how the start button relates to the bar.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Four tabs plus a centre button also solves a problem the split bar had: with an even four there is no natural middle, so a centre element only works if it is <em>not</em> one of them. Making it the action rather than a fifth destination is what makes the symmetry legible instead of arbitrary.</p>
    </div>
    <div class="grid">''' + cards + '''</div>

    <div style="max-width:920px;padding-top:16px;display:flex;flex-direction:column;gap:10px">
      <h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">One caution, and it is a real one</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">A centre button that pierces or notches the bar (W1 and W4) is a <b style="color:#c9c3b6;font-weight:500">Material</b> idiom. iOS 26&rsquo;s Liquid Glass wants continuous surfaces that merge and separate, not surfaces that get punched through &mdash; and neither shape is available from the native tab bar, so both mean hand-building the whole bar on <span class="mono" style="font-size:13px;color:#8c8677">expo-router/ui</span>. W2 gets you the same prominence while staying on one glass plane, which is why it is marked. If you want the piercing look anyway, that is a legitimate choice &mdash; it just costs the native path.</p>
    </div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab23.html','w').write(HTML)
print('wrote lab23.html', len(HTML))
