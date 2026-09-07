import sys; sys.path.insert(0,'.')
import lab15

COLS = [
 ('H1','Row','As built in Lab 15',
  'State, name and clock share one 30pt line. Compact and conventional &mdash; it is what a navigation bar looks like.',
  'The name competes with the clock for the same horizontal band, so neither gets to be the biggest thing. It also puts the exercise you are actually doing in the smallest type on the screen.', 'row'),
 ('H2','Stacked','Your suggestion, plainly',
  'The three pieces go vertical and centre on the dial&rsquo;s axis. State on top as a small tracked label, name below it, elapsed time under that.',
  'Everything now sits on one centreline with the ring and the numerals &mdash; the eye travels straight down without stepping sideways. Costs about 20pt more height than the row.', 'stack'),
 ('H3','Stacked, weighted','The same idea, given hierarchy',
  'State becomes a bordered pill so it reads as a status rather than a caption; the exercise name steps up to 24px; and the clock is set large in mono so it reads as an instrument rather than as metadata.',
  'The most confident of the four. It is also the tallest, which matters because the ring below it is already 330pt.', 'stackbig'),
 ('H4','Rule','Typographic',
  'The name leads alone. State drops into a rule beneath it &mdash; a coloured segment on the left, the word in the middle, a dim segment on the right &mdash; so the colour does the state and the word only confirms it.',
  'Quietest and the most editorial. The clock has to move up into the status bar row, which is a real tradeoff: it stops being glanceable mid-set.', 'rule'),
]

cols = ''.join(
  '<div class="col"><div class="cap"><span class="k">%s</span><span class="t">%s</span>'
  '<span class="d" style="color:#d9c9a8">%s</span><span class="d">%s</span>'
  '<span class="w">%s</span></div>%s</div>' % (c[0], c[1], c[2], c[3], c[4], lab15.screen(False, c[5]))
  for c in COLS)

rest = ''.join(
  '<div class="col"><div class="cap" style="min-height:0"><span class="k">%s &middot; RESTING</span></div>%s</div>'
  % (c[0], lab15.screen(True, c[5])) for c in COLS)

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
<style>''' + lab15.CSS + '''</style>
</helmet>

<div style="min-height:100vh;background:#0a0a0b;color:#f0efec;padding:48px 40px 96px">
  <div style="display:flex;flex-direction:column;gap:40px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:920px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 19</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Four ways to say where you are</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">State, exercise name and elapsed time. Everything below the header is identical in all four &mdash; same ring, same cards, same table &mdash; so the only thing being judged is <span style="color:#f0efec">the top 60 points of the screen</span>.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Your instinct about centring them was right for a reason worth naming: the ring, the load numeral and the reps all already sit on one vertical centreline. A left-aligned header is the only thing on the screen breaking that axis, which is why it reads as slightly bolted-on.</p>
    </div>
    <div class="board">''' + cols + '''</div>

    <div style="display:flex;flex-direction:column;gap:14px;max-width:920px;padding-top:20px">
      <h2 style="margin:0;font-size:22px;font-weight:600;letter-spacing:-0.02em;color:#f0efec">The same four, resting</h2>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Worth checking, because the header is where the state change announces itself &mdash; and in H3 and H4 the colour swing is doing noticeably more work than in H1.</p>
    </div>
    <div class="board">''' + rest + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab19.html','w').write(HTML)
print('wrote lab19.html', len(HTML))
