"""Lab 41 — What gets a plate.

M4 is settled. The remaining question is which content goes on it, and the
answer turns out to be a rule rather than a list:

    A plate contains things that have no boundary of their own.

A list of rows has none — it needs one. A rail already has a spine, a calendar
already has a grid, a chart already has a frame. Plating those is containment
twice, and it costs the rail exactly the open air the pattern was built around.
"""
import kit as K

LIFTS = [('01', 'Barbell Squat', '5 &times; 8', '102.5', '3:00'),
         ('02', 'Romanian Deadlift', '4 &times; 10', '80', '2:00'),
         ('03', 'Leg Press', '4 &times; 12', '160', '2:00')]


def lift_row(idx, name, sets, kg, rest):
    return ('<div class="lrow" style="gap:11px">' + K.GRIP
            + '<span class="mono" style="width:20px;flex:none;font-size:11px;color:var(--dim)">'
            + idx + '</span>'
            '<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
            '<span style="font-size:15px;color:var(--hi)">' + name + '</span>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.07em;color:var(--lo)">'
            + sets + ' @ ' + kg + ' KG &middot; REST ' + rest + '</span></div>'
            '<span class="sp"></span>' + K.CHEV + '</div>')


ROWS = ''.join(lift_row(*l) for l in LIFTS)


def rail(on_plate):
    return K.rail([
        (K.ACCENT, '<div class="r" style="gap:9px"><span class="num" style="font-size:15px">'
                   'Tue 2 Sep</span>' + K.pill('PR') + '<span class="sp"></span>'
                   '<span class="mono" style="font-size:13px;color:var(--mid)">8.6 T</span></div>'
                   '<span class="mono" style="font-size:11px;color:var(--lo)">64 MIN &middot; '
                   '20 SETS</span>'),
        (K.TICK2, '<div class="r" style="gap:9px"><span class="num" style="font-size:15px">'
                  'Tue 26 Aug</span><span class="sp"></span>'
                  '<span class="mono" style="font-size:13px;color:var(--mid)">8.2 T</span></div>'
                  '<span class="mono" style="font-size:11px;color:var(--lo)">61 MIN &middot; '
                  '20 SETS</span>'),
        (K.TICK1, '<div class="r" style="gap:9px"><span class="num" style="font-size:15px;'
                  'color:var(--mid)">Fri 22 Aug</span><span class="sp"></span>'
                  '<span class="mono" style="font-size:13px;color:var(--mid)">7.9 T</span></div>'
                  '<span class="mono" style="font-size:11px;color:var(--lo)">58 MIN &middot; '
                  '18 SETS</span>'),
    ], air=24, on_plate=on_plate)


STATS = K.tiles([('EXERCISES', '5'), ('SETS', '20'), ('EST. TIME', '62 M'),
                 ('VOLUME', '8.4 T', K.delta('+4%'))], tone='raised')

HEAD = K.back_head('Lower A', 'ROUTINE', K.ico('dots', 'var(--mid)', 1.7))
BAR = K.actionbar('Start Lower A', 'EDIT')


def routine(rail_plated):
    return K.phone(
        HEAD
        + K.psec('', STATS, first=True, pad=13)
        + K.psec('EXERCISES', ROWS, inset=True, pad=13)
        + K.psec('LAST THREE', rail(rail_plated), plated=rail_plated),
        chrome=BAR)


S1 = routine(True)
S2 = routine(False)

# ---- S3: the rule applied to a screen with a chart on it --------------------
E1RM = [112, 116, 114, 119, 121, 124, 122, 126, 128, 130]


PBS = ''.join(
    '<div class="lrow"><span style="font-size:15px;color:var(--hi)">' + n + '</span>'
    '<span class="sp"></span>'
    '<span class="num" style="font-size:15px">' + v + '</span>'
    '<span class="mono lbl" style="width:54px;text-align:right">' + d + '</span></div>'
    for n, v, d in [('Heaviest', '105 &times; 3', '19 AUG'), ('Best e1RM', '130', '2 SEP'),
                    ('Best set volume', '820 KG', '2 SEP')])

S3 = K.phone(
    K.back_head('Barbell Squat', 'BARBELL &middot; COMPOUND', K.ico('dots', 'var(--mid)', 1.7))
    + K.psec('', K.tiles([
        ('BEST e1RM', '130', K.delta('+2'), K.ACCENT), ('TOP SET', '102.5', '', K.HI),
        ('SESSIONS', '34', '', K.HI),
        ('FREQUENCY', '1.4', '<span class="mono lbl">/ WK</span>', K.HI)],
        tone='raised'), first=True, pad=13)
    # The chart already has a frame: a baseline, two axis labels and a bounded
    # plot. A plate around it is a second box around a box.
    + K.psec('ESTIMATED 1RM &middot; UP 18 KG OVER 10 SESSIONS', K.chart(E1RM, '10 AGO', 'TODAY'),
             plated=False)
    + K.psec('PERSONAL BESTS', PBS, inset=True, pad=13),
    chrome=K.actionbar('Add to routine', 'LOG'))

COLS = [
 ('S1', 'Rail on a plate', 'M4 applied everywhere, without thinking',
  'The settled treatment on all three sections, including the rail.',
  'The redundancy you spotted. The rail is <em>already</em> a containment device &mdash; a spine down the left with dots cut free of it and 24pt of air beneath each event. Putting a box around that says the same thing twice, and the second saying is louder. It also flattens the air: the rail was designed to sit in open space, and a plate crops that space to fifteen points of padding.',
  S1),
 ('S2', 'Rail on the canvas', 'The rule, stated',
  'Identical screen. Stats and the exercise list keep their plates; the rail sits straight on the ground with only its ruled label above it.',
  'My pick, and it generalises: <b>a plate contains things that have no boundary of their own.</b> A list of rows has none, so it needs one. A rail has a spine. The section still reads as a section because the ruled label is doing that job &mdash; which is the argument for M3&rsquo;s rule that only became obvious once something needed to work without a plate underneath it.',
  S2),
 ('S3', 'The rule on a different screen', 'Charts have frames too',
  'Exercise detail. Tiles plated, personal bests plated with inset separators, and the chart on the canvas.',
  'A chart is bounded by its own baseline and axis labels; a plate around it is a box around a box, and it steals width from the plot for nothing. The same test settles the rest of the app: <b>plate</b> the lists, tiles, fields, toggles and prose; <b>do not plate</b> the rail, charts, the body map, or the live screen&rsquo;s ring. One caveat worth carrying &mdash; the calendar grid <em>looks</em> like it has its own structure, but its intensity fills were mixed against the plate. Taking the plate away changes what they composite over and the whole ramp needs recomputing, so it stays plated until someone does that arithmetic.',
  S3),
]

INTRO = (
  K.para('M4 is settled and is now the default in <span style="color:#96938c">kit.py</span>: lit '
         'plate, ruled section label, inset separators between rows.')
  + K.para('Your rail question turns out to be a rule rather than an exception. <b '
           'style="color:#c9c3b6;font-weight:500">A plate contains things that have no boundary of '
           'their own.</b> A list of rows has none &mdash; that is exactly why spacing alone '
           'failed on it. A rail has a spine, a chart has a baseline and axes, an instrument has '
           'its own geometry. Wrapping those in a plate is containment twice, and the louder of '
           'the two wins.', '#96938c'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">The plating rule, for the restyle pass</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">Plate:</b> list rows, stat tiles, fields and '
           'toggles, prose blocks, sheets. Anything that is a set of similar items with no inherent '
           'edge.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Do not plate:</b> the rail, charts, the body '
           'map, the live screen&rsquo;s ring and tape. Anything that already draws its own '
           'boundary.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Undecided:</b> the calendar. It has a grid, '
           'so the rule says canvas &mdash; but its three intensity fills were composited against '
           'the plate, and moving it changes what they sit on. Recompute the ramp before moving '
           'it, or leave it plated.', '#6f6c66')
  + K.para('The section label with its rule is what carries a section when there is no plate under '
           'it, which is why M3&rsquo;s rule stopped being decoration the moment anything needed '
           'to work unplated.', '#6f6c66')
  + '</div>')

HTML = K.page(41, 'What gets a plate', INTRO, [('', '', COLS)], CLOSING)
open('lab41.html', 'w').write(HTML)
print('wrote lab41.html', len(HTML))
