"""Lab 40 — Between P3 and P4.

P3 wins on legibility and is boring. P4 has the character and does not contain
anything. This board keeps P3's plate and puts P4's lines back — inside it,
where they organise rather than partition.

Also fixes the thing you spotted: the rail did not disappear in P3, it got
pushed below the fold. Plates cost about 30pt of height per section, which is a
real trade and is stated on the board rather than hidden.
"""
import kit as K

EXTRA = ""   # M4 now lives in kit.CSS

CSS = K.CSS + EXTRA

LIFTS = [
    ('01', 'Barbell Squat', '5 &times; 8', '102.5', '3:00'),
    ('02', 'Romanian Deadlift', '4 &times; 10', '80', '2:00'),
    ('03', 'Leg Press', '4 &times; 12', '160', '2:00'),
]


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
], air=22, on_plate=True)

# N3 as decided: two across, the comparison attached to its own number.
STATS = K.tiles([
    ('EXERCISES', '5'),
    ('SETS', '20'),
    ('EST. TIME', '62 M'),
    ('VOLUME', '8.4 T', K.delta('+4%'))], tone='raised')

HEAD = K.back_head('Lower A', 'ROUTINE', K.ico('dots', 'var(--mid)', 1.7))
BAR = K.actionbar('Start Lower A', 'EDIT')


def plate(body, cls='', pad=15):
    # class="" trips the pre-upload gate's no-doubled-quotes check
    cls = (' class="' + cls + '"') if cls.strip() else ''
    return ('<div' + cls + ' style="background:' + K.RAISED
            + ';border-radius:14px;padding:' + str(pad) + 'px;display:flex;'
              'flex-direction:column;gap:9px">' + body + '</div>')


def section(label, body, cls='', first=False, rule=False, pad=15):
    if label:
        line = ('<span style="flex:1;height:1px;background:rgba(255,255,255,0.10);'
                'margin-left:11px"></span>') if rule else ''
        head_ = ('<div class="r" style="padding:0 2px">'
                 '<span class="lbl">' + label + '</span>' + line + '</div>')
    else:
        head_ = ''
    style = ' style="padding-top:8px"' if first else ''
    return ('<div class="sec"' + style + '>' + head_ + plate(body, cls, pad) + '</div>')


def screen(cls='', rule=False):
    return K.phone(
        HEAD
        + section('', STATS, cls, first=True, pad=13)
        + section('EXERCISES', ROWS, cls + ' ins', rule=rule, pad=13)
        + section('LAST THREE', RAIL, cls, rule=rule),
        chrome=BAR)


M1 = screen()                       # plate + inset separators
M2 = screen(cls='lit')              # plate + lit edge
M3 = screen(cls='lit', rule=True)   # plate + lit edge + label rule
# M4 keeps every line: lit edge, inset separators, label rule, and the tiles
# themselves get an edge too.
M4 = K.phone(
    HEAD
    + section('', K.tiles([
        ('EXERCISES', '5'), ('SETS', '20'), ('EST. TIME', '62 M'),
        ('VOLUME', '8.4 T', K.delta('+4%'))], tone='raised'), 'lit', first=True, pad=13)
    + section('EXERCISES', ROWS, 'lit ins', rule=True, pad=13)
    + section('LAST THREE', RAIL, 'lit', rule=True),
    chrome=BAR)

COLS = [
 ('M1', 'Plate, with the lines put back inside', 'Separators where they organise',
  'P3&rsquo;s plate, plus a hairline between each row &mdash; inset to the text margin, not run to the plate edge.',
  'This is the single change that fixes &ldquo;boring&rdquo; most cheaply. P3 was a soft blob of rows with nothing marking where one ended; a list needs internal structure even when it already has a container. Inset rather than full-bleed is the whole trick &mdash; a full-width rule inside a plate turns it into a table, an inset one just divides items.',
  M1),
 ('M2', 'Lit plate', 'The reference&rsquo;s panel, finally',
  'No separators. Instead the plate gets a 0.5px line of light along its top edge and a shade along the bottom, so it reads as a surface catching light rather than a rectangle of a different colour.',
  'This is the <b>lit taupe panel</b> from the reference imagery you started with, and it has been missing since the editorial rule removed every edge. It costs one box-shadow, adds no clutter, and it is the difference between &ldquo;a lighter rectangle&rdquo; and &ldquo;a material&rdquo;. On its own it does not solve the list-has-no-structure problem though.',
  M2),
 ('M3', 'Lit plate, ruled label', 'Structure above, containment below',
  'M2 plus a hairline running from the section label out to the right edge, on the canvas above the plate.',
  'The rule outside the plate is doing P4&rsquo;s job without P4&rsquo;s cost: it marks the boundary at full width, where the eye is already going, but it is not repeated per item so it never becomes a grid. The label now reads as a heading rather than a floating caption.',
  M3),
 ('M4', 'All of it', 'The most P4 this can get and still contain things',
  'Lit edge, inset separators, ruled labels, and the stat tiles given their own edge.',
  'My pick, and I expected to prefer M3. Every line here is doing a different job at a different scale &mdash; the label rule marks the section, the lit edge marks the surface, the inset separators mark the items &mdash; so they add precision rather than noise. It is also the closest thing on this board to the instrument aesthetic the whole project started from. If it turns out to be a step too far, M1 is the fallback, not M2.',
  M4),
]

INTRO = (
  K.para('P3 wins on legibility and you are right that it is boring. The diagnosis is that '
         '<b style="color:#c9c3b6;font-weight:500">P3 removed every line and replaced them with '
         'nothing</b> &mdash; it contains content but does not organise it, so a section is one '
         'undifferentiated block. P4 had the opposite problem: lines everywhere and nothing '
         'contained.')
  + K.para('So the middle ground is not halfway between them. It is <b style="color:#c9c3b6;'
           'font-weight:500">P3&rsquo;s plate with P4&rsquo;s lines moved inside it</b>, where '
           'they divide items instead of partitioning the screen. All four below keep P3 exactly; '
           'only the lines change.', '#96938c')
  + K.para('Stat treatment is <b style="color:#c9c3b6;font-weight:500">N3</b> everywhere, as '
           'decided &mdash; two across, the comparison attached to the number it belongs to.',
           '#6f6c66'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">The rail did not disappear &mdash; it fell off the bottom</h2>'
  + K.para('You were right that it was gone and the cause is worth knowing, because it applies to '
           'every screen. <b style="color:#c9c3b6;font-weight:500">A plate costs about 30pt of '
           'height per section</b> &mdash; 15 top, 15 bottom &mdash; so three sections push '
           'roughly 90pt of content below the fold. In P3 that was exactly enough to take the '
           'rail with it. The routine screen here is trimmed to three exercises so the rail is '
           'visible in all four; on the real screen it is the price of containment and worth '
           'paying, but it is a price.')
  + K.para('A second, quieter bug came out of the same look: <b style="color:#c9c3b6;'
           'font-weight:500">a hairline&rsquo;s contrast is relative to what it sits on.</b> The '
           'rail&rsquo;s connecting line was 11% white, tuned against the near-black canvas. Moved '
           'onto a lifted plate it washes out. It now takes 20% when it is on a plate. Every '
           'hairline in the kit needs the same treatment &mdash; that is a systemic fix, not a '
           'one-off.', '#96938c')
  + '</div>'
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">The visuals rule, recorded</h2>'
  + K.para('Your combination of N3 and N4 is now the rule: <b style="color:#c9c3b6;'
           'font-weight:500">a number gets a visual only when the visual makes it faster to '
           'understand, and only when there is something real to draw.</b> A meter needs a '
           'denominator, a spark needs a series, a delta needs a previous value. Where none of '
           'those exists the number ships plain, and adding a graphic would be decoration '
           'pretending to be an instrument.')
  + K.para('With the Strong and Hevy split layered on top: the <em>recap</em> screens carry '
           'numbers and deltas; the <em>history and stats</em> screens carry the charts. A recap '
           'that looks like a dashboard is answering a question you have not asked yet.', '#6f6c66')
  + '</div>')

HTML = K.page(40, 'Between P3 and P4', INTRO, [('', '', COLS)], CLOSING, extra_css=EXTRA)
open('lab40.html', 'w').write(HTML)
print('wrote lab40.html', len(HTML))
