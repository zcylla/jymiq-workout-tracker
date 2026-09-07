"""Lab 38 — Reading at a glance.

Two failures, answered separately.

1. Spacing alone does not separate sections. Four containment treatments of one
   screen, everything else held fixed.
2. Four numerals in a row is too dense to parse. Four treatments of one stat
   block, containment held fixed.

Research is doing the arguing where it can: Apple's insetGrouped, Linear and IBM
Carbon all independently landed on TWO signals — a tonal lift plus a gap — and
none of them relies on spacing on its own.
"""
import kit as K

LIFTS = [
    ('01', 'Barbell Squat', '5 &times; 8', '102.5', '3:00'),
    ('02', 'Romanian Deadlift', '4 &times; 10', '80', '2:00'),
    ('03', 'Leg Press', '4 &times; 12', '160', '2:00'),
    ('04', 'Seated Curl', '3 &times; 12', '35', '1:30'),
]


def lift_row(idx, name, sets, kg, rest, last=False):
    return ('<div class="r" style="gap:11px;min-height:44px">' + K.GRIP
            + '<span class="mono" style="width:20px;flex:none;font-size:11px;color:var(--dim)">'
            + idx + '</span>'
            '<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
            '<span style="font-size:15px;color:var(--hi)">' + name + '</span>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.07em;color:var(--lo)">'
            + sets + ' @ ' + kg + ' KG &middot; REST ' + rest + '</span></div>'
            '<span class="sp"></span>' + K.CHEV + '</div>')


# Held constant across all four separation variants: two per row, not four.
STATS = [('EXERCISES', '5'), ('SETS', '20'), ('EST. TIME', '62 MIN'), ('VOLUME', '8.4 T')]

RAIL = K.rail([
    (K.ACCENT, '<div class="r" style="gap:9px"><span class="num" style="font-size:15px">'
               'Tue 2 Sep</span>' + K.pill('PR') + '<span class="sp"></span>'
               '<span class="mono" style="font-size:13px;color:var(--mid)">8.6 T</span></div>'
               '<span class="mono" style="font-size:11px;color:var(--lo)">64 MIN &middot; 20 SETS'
               '</span>'),
    (K.TICK2, '<div class="r" style="gap:9px"><span class="num" style="font-size:15px">'
              'Tue 26 Aug</span><span class="sp"></span>'
              '<span class="mono" style="font-size:13px;color:var(--mid)">8.2 T</span></div>'
              '<span class="mono" style="font-size:11px;color:var(--lo)">61 MIN &middot; 20 SETS'
              '</span>'),
], air=26)

HEAD = K.back_head('Lower A', 'ROUTINE', K.ico('dots', 'var(--mid)', 1.7))
BAR = K.actionbar('Start Lower A', 'EDIT')


def plain_tiles(tone):
    return K.tiles([(n, v) for n, v in STATS], tone=tone)


# ---- P1 spacing only, as shipped -------------------------------------------
P1 = K.phone(
    HEAD
    + K.sec('', K.tiles([(n, v) for n, v in STATS], tone='raised'), first=True)
    + K.sec('EXERCISES', ''.join(lift_row(*l) for l in LIFTS))
    + K.sec('LAST THREE', RAIL),
    chrome=BAR)

# ---- P2 whisper lift --------------------------------------------------------
P2 = K.phone(
    HEAD
    + K.psec('', plain_tiles('raised'), tone='panel', first=True, pad=13)
    + K.psec('EXERCISES', ''.join(lift_row(*l) for l in LIFTS), tone='panel')
    + K.psec('LAST THREE', RAIL, tone='panel'),
    chrome=BAR)

# ---- P3 confident lift ------------------------------------------------------
P3 = K.phone(
    HEAD
    + K.psec('', K.tiles([(n, v) for n, v in STATS], tone='raised'), tone='raised', first=True,
             pad=13)
    + K.psec('EXERCISES', ''.join(lift_row(*l) for l in LIFTS), tone='raised')
    + K.psec('LAST THREE', RAIL, tone='raised'),
    chrome=BAR)


# ---- P4 hairlines, no plate -------------------------------------------------
def hsec(label, body, first=False):
    rule = ('<div style="height:1px;background:rgba(255,255,255,0.13);margin:0 -22px 4px">'
            '</div>') if not first else ''
    head_ = ('<div class="r" style="padding-bottom:2px"><span class="lbl">' + label
             + '</span></div>') if label else ''
    style = ' style="padding-top:8px"' if first else ' style="padding-top:30px"'
    return '<div class="sec"' + style + '>' + rule + head_ + body + '</div>'


P4 = K.phone(
    HEAD
    + hsec('', K.tiles([(n, v) for n, v in STATS], tone='raised'), first=True)
    + hsec('EXERCISES', ''.join(lift_row(*l) for l in LIFTS))
    + hsec('LAST THREE', RAIL),
    chrome=BAR)

BOARD_A = [
 ('P1', 'Spacing only', 'The control &mdash; what is shipped',
  'Exactly Lab&nbsp;34&rsquo;s routine screen, except the four numbers are already 2&nbsp;&times;&nbsp;2 rather than four across, so the two questions do not contaminate each other.',
  'Reading it next to the other three is the point. On its own it looked fine; against a lifted plate the sections stop being sections and become one continuous column of text. That is the failure you described, and it is much easier to see in a row of four than in isolation.',
  P1),
 ('P2', 'Whisper lift', 'One flat plate, the smaller step',
  'Each section on a <b>#15130f</b> plate, 14pt radius, section label left outside on the canvas. The 46pt gaps stay exactly as they were.',
  'Two signals instead of one, which is what every reference that solves this does. The label staying <em>outside</em> the plate is what stops it reading as a card &mdash; a card has its title inside it. This is about a 7% lightness step; the research put the floor for reading reliably on OLED at 4&ndash;6%, so this is only just clear of it and may vanish in daylight.',
  P2),
 ('P3', 'Confident lift', 'The same thing, at Apple&rsquo;s step size',
  'Identical to P2 with the plate at <b>#221f19</b> instead. That is an 11% step, which is what Apple actually uses between a black canvas and a grouped-list surface.',
  'My pick. Apple&rsquo;s real jump from #000000 to #1C1C1E is 11%, not 7, and their reason is exactly ours &mdash; on a near-black ground there is very little headroom, so a timid step gets eaten by OLED black-crush and screen brightness. The tiles inside drop to the darker tone so the nesting still reads.',
  P3),
 ('P4', 'Hairlines, no plate', 'The cheapest possible fix',
  'No plates at all. A single full-bleed hairline at the top of each section, at 13% white, plus the existing gap.',
  'Worth seeing because it is one CSS property and it does technically work. But it is the treatment the research warned about specifically: repeated full-bleed rules down a long text-heavy screen start reading as a spreadsheet grid, and here they add a signal without containing anything &mdash; the eye still has nothing telling it where a section <em>ends</em>.',
  P4),
]

INTRO = (
  K.para('You are right, and the diagnosis is worth stating because it explains why it took '
         'sixteen screens to show up. <b style="color:#c9c3b6;font-weight:500">Spacing-only was '
         'validated on the wrong sample.</b> It was settled in Lab&nbsp;27 on the main screen and '
         'held through Lab&nbsp;33 on the live screen &mdash; both of which are one large '
         'instrument with almost no stacked text. Put it on sixteen screens that are mostly lists '
         'and prose and it has nothing to do.')
  + K.para('Every reference that solves this solves it the same way, and none of them uses one '
           'signal. Apple&rsquo;s grouped lists stack a <em>tonal lift</em> and a <em>gap</em>: '
           '#000000 canvas, #1C1C1E section surface, 10pt radius, ~35pt between. Linear &mdash; '
           'near-black, no cards, heavy text, the closest precedent there is &mdash; puts it '
           'plainly: the dark canvas is the whitespace, and sections separate by lifting onto a '
           'surface, not by gaps. IBM Carbon does the same because shadows do not read on dark.',
           '#96938c')
  + K.para('So the fix is not cards. It is the mechanism <em>underneath</em> cards: a flat, '
           'opaque, slightly lighter plate, with the section label left outside it on the canvas. '
           'No stroke, no shadow, no blur. Opaque rather than a white wash on purpose &mdash; a '
           'translucent overlay on near-black starts reading as cheap frosted glass, and glass is '
           'reserved for the tab bar.', '#6f6c66'))

# ============================================================ board B: numbers
SUM_HEAD = K.back_head('Lower A', 'SESSION COMPLETE &middot; TODAY')

PRS = ('<div style="display:flex;flex-direction:column;gap:11px">' + ''.join(
    '<div class="r" style="gap:10px">' + K.pill('PR')
    + '<div style="display:flex;flex-direction:column;gap:2px;min-width:0">'
      '<span style="font-size:15px;color:var(--hi)">' + n + '</span>'
      '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">' + m
    + '</span></div><span class="sp"></span>'
      '<span class="num" style="font-size:17px;font-weight:600;color:var(--accent)">' + v
    + '</span></div>'
    for n, m, v in [('Barbell Squat', 'BEST ESTIMATED 1RM &middot; WAS 128', '130'),
                    ('Barbell Squat', 'BEST SET VOLUME &middot; WAS 800 KG', '820')]) + '</div>')

LIFTED = ''.join(
    '<div class="r" style="gap:11px;min-height:40px">'
    '<span class="mono" style="width:20px;flex:none;font-size:11px;color:var(--dim)">' + i
    + '</span>'
    '<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
    '<span style="font-size:15px;color:var(--hi)">' + n + '</span>'
    '<span class="mono" style="font-size:11px;letter-spacing:0.07em;color:var(--lo)">' + m
    + '</span></div></div>'
    for i, n, m in [('01', 'Barbell Squat', '5 SETS &middot; TOP 102.5 &times; 8'),
                    ('02', 'Romanian Deadlift', '4 SETS &middot; TOP 80 &times; 10'),
                    ('03', 'Leg Press', '4 SETS &middot; TOP 160 &times; 12'),
                    ('04', 'Seated Curl', '3 SETS &middot; TOP 35 &times; 12'),
                    ('05', 'Standing Calf', '4 SETS &middot; TOP 90 &times; 15')])

VOL6 = [7.9, 8.1, 7.8, 8.2, 8.2, 8.6]


def sum_screen(stats_block):
    return K.phone(
        SUM_HEAD
        + K.psec('', stats_block, tone='raised', first=True, pad=13)
        + K.psec('NEW RECORDS', PRS, tone='raised')
        + K.psec('WHAT YOU LIFTED', LIFTED, tone='raised'),
        chrome=K.actionbar('Done', 'NOTES'))


# N1 — four across, plain. The control.
N1_BLOCK = ('<div class="r" style="width:100%">' + ''.join(
    '<div style="flex:1;display:flex;flex-direction:column;gap:3px">'
    '<span class="mono lbl">' + n + '</span>'
    '<span class="num" style="font-size:17px;font-weight:600;color:' + c + '">' + v
    + '</span></div>'
    for n, v, c in [('TIME', '1H 04', 'var(--hi)'), ('VOLUME', '8.6 T', 'var(--hi)'),
                    ('SETS', '20', 'var(--hi)'), ('VS LAST', '+4.9%', 'var(--pos)')]) + '</div>')
N1 = sum_screen(N1_BLOCK)

# N2 — two across, plain.
N2 = sum_screen(K.tiles([('TIME', '1H 04'), ('VOLUME', '8.6 T'),
                         ('SETS', '20'), ('VS LAST', '+4.9%', '', K.DONE)], tone='raised'))

# N3 — two across, with the comparison folded into the number it belongs to.
N3 = sum_screen(K.tiles([
    ('TIME', '1H 04'),
    ('VOLUME', '8.6 T', K.delta('+4.9%')),
    ('SETS', '20', K.delta('+2')),
    ('RECORDS', '2', '', K.ACCENT)], tone='raised'))

# N4 — a visual only where the data earns one.
N4 = sum_screen(K.tiles([
    ('TIME', '64 M', '<span class="mono lbl">/ 62</span>', K.HI, K.meter(64 / 62.0, w=None)),
    ('VOLUME', '8.6 T', K.delta('+4.9%'), K.HI, K.spark(VOL6, w=None, h=20)),
    ('SETS', '20', '<span class="mono lbl">/ 20</span>', K.HI, K.meter(1.0, w=None, col=K.DONE)),
    # no denominator and no series, so no visual — a meter here would be
    # a proportion of nothing, which is what Apple's ring rule forbids.
    ('RECORDS', '2', '', K.ACCENT)], tone='raised'))

BOARD_B = [
 ('N1', 'Four across', 'The control &mdash; what is shipped',
  'Four label-and-number pairs on one 356pt row. Note the fourth: <b>VS&nbsp;LAST +4.9%</b> is a whole slot spent on a comparison that belongs to the number two slots to its left.',
  'The KPI-tile research is blunt about why this fails: four per row only works when each tile is wide enough to also carry a micro-visual, which needs roughly 200&ndash;280pt each. On a phone that arithmetic forces two. Four bare numerals is the one configuration with neither room nor a pre-attentive cue &mdash; nothing to catch the eye, so all four have to be read.',
  N1),
 ('N2', 'Two across', 'The same numbers, half the density',
  'Identical content, 2&nbsp;&times;&nbsp;2, each on its own tile at the darker tone so the nesting reads inside the lifted section.',
  'Most of the win is here and it costs one extra row of height. The number is now roughly twice the label rather than 1.5&nbsp;&times;, which is the ratio the tile research says makes a stat scan instead of read. <b>VS&nbsp;LAST is still wrong</b> though &mdash; it is a comparison floating free of the thing it compares.',
  N2),
 ('N3', 'The comparison goes home', 'Arrow and delta, attached to their own number',
  'VS&nbsp;LAST is gone as a tile. Volume carries its own <span style="color:#9fae3a">+4.9%</span> with an arrow; sets carries <span style="color:#9fae3a">+2</span>. The freed slot shows the record count instead.',
  'This is the best-evidenced change on the board and the cheapest. Arrow direction and colour are both pre-attentive, so a delta reads before you have parsed the digits, and it needs no legend or learning. It also removes a tile rather than adding one &mdash; the screen carries more meaning and less text at the same time.',
  N3),
 ('N4', 'Visuals, but only where earned', 'A meter needs a denominator',
  'Time and sets get a meter because the routine has a <em>planned</em> 62 minutes and 20 sets to measure against. Volume gets a six-session spark because it is a real series. Records gets nothing, because a count of two has neither.',
  'My pick, with a caveat. Apple&rsquo;s own guidance for rings is that they represent progress toward a goal and <b>must not be used for decoration</b>, and the same logic governs meters and sparks: without a denominator or a series there is nothing to draw. The caveat is that this only works because the routine screen already knows the plan. Where a stat has no target, N3&rsquo;s treatment is the right answer and adding a visual would be a lie drawn as an instrument.',
  N4),
]

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">Two things the research ruled out</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">Bullet graphs are out</b> &mdash; the '
           'value-against-qualitative-bands bar. It is the obvious answer for &ldquo;show a number '
           'against a range&rdquo; and its own proponents say audiences have to be <em>taught</em> '
           'to read it before it lands. That is precisely the constraint you set in round three, '
           'and it is the single hardest rule in this document. It does mean the volume-landmark '
           'bars on Lab&nbsp;37 D1 are on notice: they survive only because every one of them has '
           'TOO&nbsp;FEW / GOOD / HARD / TOO&nbsp;MUCH written next to it, which is the '
           '&ldquo;reads once labelled&rdquo; tier from Lab&nbsp;13.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Rings are out for most stats.</b> They are '
           'the most attractive option and the easiest to over-use. Apple&rsquo;s rule is that a '
           'ring shows progress toward a goal; Whoop&rsquo;s arcs all encode a 0&ndash;100 scale. '
           'Sets, volume and exercise counts have no ceiling in the data, so a ring around them '
           'would be drawing a proportion of nothing.')
  + K.para('What shipping trackers actually do is worth knowing: Strong and Hevy both keep the '
           'post-session recap as numbers with small comparisons, and push sparklines and trend '
           'charts to a separate stats screen. The recap answers <em>how did that go</em>; the '
           'stats screen answers <em>how is it going</em>. Mixing them is what makes a recap feel '
           'like a dashboard.', '#6f6c66')
  + '</div>')

HTML = K.page(38, 'Reading at a glance', INTRO,
              [('', '', BOARD_A),
               ('The other half: four numerals in a row',
                'Containment is held fixed at P3 across all four of these, so only the stat block '
                'moves. Same screen, same data, four densities.', BOARD_B)], CLOSING)
open('lab38.html', 'w').write(HTML)
print('wrote lab38.html', len(HTML))
