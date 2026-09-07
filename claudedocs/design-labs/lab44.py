"""Lab 44 — Today, with a face.

Lab 43's Today is correct and monotone. The note: it needs something to look at,
and the champagne file's filled card — a high-contrast slab of accent — was the
part of the first design that had presence.

The system already contains that move: the start button in the tab bar is an
accent fill with ink glyphs. Nothing new is being invented here, it is being
used at a larger size on the one element that deserves it.

Constraints this board is testing against, not ignoring:

  * On an accent fill the hue rules invert. Done-green and live-red both fall
    under 3:1 against #e4c68c, so state on accent is carried by ink and by
    position, never by a second hue.
  * A ring must have a denominator (Apple's rule, §0). Sessions-this-week
    against a weekly target is a real one; volume and set counts are not.
  * Two or three plated things per screen. An accent fill counts as one of them
    and spends more attention than a raised plate, so something else gives way.
"""
import kit as K
import lab43 as L

INK = '#15130f'
INK_SOFT = 'rgba(21,19,15,0.62)'
INK_LINE = 'rgba(21,19,15,0.18)'


# ------------------------------------------------------- the filled card ----
def accent_card(kicker, name, meta, lifts, cta='START'):
    """The champagne card. Accent fill, ink type, one hue and no second one."""
    return ('<div class="lit" style="background:' + K.ACCENT + ';border-radius:14px;'
            'padding:15px;display:flex;flex-direction:column;gap:9px">'
            '<div class="r" style="gap:10px">'
            '<span class="mono" style="font-size:11px;letter-spacing:0.14em;color:' + INK_SOFT
            + '">' + kicker + '</span><span class="sp"></span>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.12em;color:' + INK + '">'
            + cta + '</span>'
            '<svg viewBox="0 0 16 16" style="width:13px;height:13px;flex:none" fill="none" '
            'stroke="' + INK + '" stroke-width="1.9" stroke-linecap="round" '
            'stroke-linejoin="round"><path d="M6 3l5 5-5 5"></path></svg></div>'
            '<span style="font-size:28px;font-weight:600;letter-spacing:-0.03em;color:' + INK
            + ';line-height:1.05">' + name + '</span>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.07em;color:' + INK_SOFT
            + '">' + meta + '</span>'
            '<div style="height:1px;background:' + INK_LINE + ';margin:4px 0 2px"></div>'
            + ''.join('<div class="r" style="gap:9px">'
                      '<span class="mono" style="width:18px;font-size:11px;color:' + INK_SOFT
                      + '">' + i + '</span>'
                      '<span style="font-size:14px;color:' + INK + '">' + n + '</span>'
                      '<span class="sp"></span>'
                      '<span class="mono" style="font-size:11px;color:' + INK_SOFT + '">' + s
                      + '</span></div>' for i, n, s in L.V1_LIFTS) + '</div>')


# ----------------------------------------------------------- the graphic ----
# Volume per day this week, in tonnes. Zero days are rest days — drawn, not omitted,
# because the gaps are half of what a week's shape tells you.
DAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S']
VOL = [6.2, 5.1, 0, 7.1, 0, 0, 0]
TODAY_I = 3


def week_columns(vals=VOL, today=TODAY_I, h=46):
    top = max(vals) or 1
    cols = []
    for i, v in enumerate(vals):
        done = v > 0
        bh = max(3, round(h * v / top)) if done else 3
        c = (K.ACCENT if i == today else K.DONE) if done else 'rgba(255,255,255,0.07)'
        cols.append('<div style="flex:1;display:flex;flex-direction:column;align-items:center;'
                    'gap:6px">'
                    '<div style="width:100%%;height:%dpx;display:flex;align-items:flex-end;'
                    'justify-content:center">'
                    '<span style="width:100%%;height:%dpx;border-radius:3px;background:%s">'
                    '</span></div>'
                    '<span class="mono" style="font-size:11px;color:%s">%s</span></div>'
                    % (h, bh, c, 'var(--mid)' if i == today else 'var(--dim)', DAYS[i]))
    return ('<div class="r" style="width:100%;gap:5px;align-items:flex-end">'
            + ''.join(cols) + '</div>')


def week_block(target=4, done=3, volume='18.4 T', delta='+9%'):
    """One plate: the ring (a real denominator), the two numbers, the week's shape."""
    return ('<div class="r" style="gap:15px;align-items:center">'
            + K.ring(done / float(target), size=58, sw=5, label='%d/%d' % (done, target))
            + '<div style="flex:1;display:flex;flex-direction:column;gap:3px">'
              '<span class="mono lbl">SESSIONS THIS WEEK</span>'
              '<div class="r" style="gap:8px">'
              '<span class="num" style="font-size:22px;font-weight:600">' + volume + '</span>'
              + K.delta(delta) + '</div>'
              '<span class="mono" style="font-size:11px;letter-spacing:0.07em;color:var(--lo)">'
              'VOLUME &middot; ONE MORE TO TARGET</span></div></div>'
            '<div style="height:1px;background:rgba(255,255,255,0.07);margin:11px 0 12px"></div>'
            + week_columns())


HEAD = K.head('Today', 'THU 4 SEP', K.ico('gear', 'var(--lo)', 1.7))

# ---------------------------------------------------------------- U1 ctrl ----
U1 = K.phone(
    HEAD
    + K.psec('', L.next_card('LAST RUN 5 DAYS AGO', 'Lower B',
                             '5 LIFTS &middot; ~60 MIN &middot; 3 OF 4 THIS WEEK', L.V1_LIFTS,
                             cta='START'), first=True, pad=15)
    + K.psec('THIS WEEK', L.daystrip(L.V1_WEEK, names=False)
             + '<div style="height:4px"></div>' + L.TILES_FULL, pad=13)
    + K.psec('RECENT', L.RAIL, plated=False),
    active='today', surface='raised')

# ------------------------------------------------------ U2 the filled card ----
U2 = K.phone(
    HEAD
    + K.psec('', accent_card('LAST RUN 5 DAYS AGO', 'Lower B',
                             '5 LIFTS &middot; ~60 MIN &middot; ~102.5 TOP SET', L.V1_LIFTS),
             first=True, plated=False)
    + K.psec('THIS WEEK', L.daystrip(L.V1_WEEK, names=False)
             + '<div style="height:4px"></div>' + L.TILES_FULL, pad=13)
    + K.psec('RECENT', L.RAIL, plated=False),
    active='today', surface='raised')

# ------------------------------------------------- U3 filled card + graphic ----
U3 = K.phone(
    HEAD
    + K.psec('', accent_card('LAST RUN 5 DAYS AGO', 'Lower B',
                             '5 LIFTS &middot; ~60 MIN &middot; ~102.5 TOP SET', L.V1_LIFTS),
             first=True, plated=False)
    + K.psec('THIS WEEK', week_block(), pad=15)
    + K.psec('RECENT', K.rail(L.RAIL_EVENTS[:2], air=22), plated=False),
    active='today', surface='raised')

# ----------------------------------------------- U4 quiet card, loud button ----
def quiet_card():
    """The other way to buy presence: keep the plate, spend the accent on the
    action inside it. Cheaper, and it survives a bad screen-brightness moment."""
    return (L.next_card('LAST RUN 5 DAYS AGO', 'Lower B',
                        '5 LIFTS &middot; ~60 MIN &middot; ~102.5 TOP SET', L.V1_LIFTS, cta='')
            + '<div style="height:11px"></div>'
            '<div class="r" style="min-height:50px;border-radius:14px;background:' + K.ACCENT
            + ';justify-content:center;gap:9px;'
            'box-shadow:inset 0 1px 0 rgba(255,255,255,0.45), 0 8px 20px rgba(0,0,0,0.45)">'
            '<span style="font-size:16px;font-weight:600;color:' + INK + '">Start Lower B</span>'
            '</div>')


U4 = K.phone(
    HEAD
    + K.psec('', quiet_card(), first=True, pad=15)
    + K.psec('THIS WEEK', week_block(), pad=15)
    + K.psec('RECENT', K.rail(L.RAIL_EVENTS[:2], air=22), plated=False),
    active='today', surface='raised')

COLS = [
 ('U1', 'Lab 43, as it stands', 'The control',
  'The screen from Lab&nbsp;43, unchanged: raised plate, week strip, two tiles, rail.',
  'Correct and monotone, which is the note. Every surface on the screen is the same plate at the same lift, so nothing arrives first &mdash; the eye has to read to find the hierarchy instead of being handed it. Worth keeping in view: this is also the calmest of the four, and calm is what the app is otherwise made of.',
  U1),
 ('U2', 'The champagne card', 'The move from the first design',
  'The hero becomes a filled accent slab with ink type. Everything else is untouched, so the only variable is the card.',
  'This is the element you remembered, and the system already contains it &mdash; the start button in the tab bar is the same fill with the same ink. At card size it does what the tab button does at 52pt: it is unmistakably <em>the thing to press</em>. Two rules come with it. <b>The hue inverts on accent</b>: done-green and live-red both fall under 3:1 against this fill, so state is carried by ink and position, never by a second hue. And the accent must not appear twice at size &mdash; the tab bar&rsquo;s button is the only other fill on the screen and it is small enough to read as the same family rather than as competition.',
  U2),
 ('U3', 'Card, and something to look at', 'What the week actually did',
  'The two stat tiles are replaced by one block: a ring against your weekly session target, the volume with its comparison, and the week drawn as columns.',
  'The graphic earns its place three ways. The <b>ring has a real denominator</b> &mdash; sessions against a weekly target &mdash; which is the only condition under which §0 allows one at all; a ring for volume or set count would be a proportion of nothing. The <b>columns show shape</b>: which days you trained, how hard, and where the gaps are, which is the question you actually have on opening the app and the one a strip of dots cannot answer. And <b>today is the accent column</b>, so the screen tells you where you are without a label. Rest days are drawn as stubs rather than omitted, for the same reason the calendar dims adjacent months.',
  U3),
 ('U4', 'Quiet card, loud action', 'Presence without the slab',
  'The hero stays a raised plate; the accent goes on a full-width start button inside it. Same graphic block as U3.',
  'The honest alternative, and the cheaper one. It buys the same &ldquo;press this&rdquo; signal with a tenth of the surface, keeps the card&rsquo;s text on the normal ramp, and never has to solve the contrast inversion. What it loses is exactly what you asked for: the screen has a bright button on it rather than a bright <em>thing</em>. My read is <b>U3</b> if the fill still reads well at low brightness in a gym, <b>U4</b> if it does not &mdash; and that is a device question, not a board question.',
  U4),
]

INTRO = (
  K.para('The note on Lab&nbsp;43: the screen is monotone, and the champagne file&rsquo;s '
         'high-contrast card had presence this one does not.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">The move already exists in the system.</b> '
           'The tab bar&rsquo;s start button is an accent fill with ink glyphs; this is that, at '
           'card size, on the one element that deserves it. U2 is the card alone; U3 adds the '
           'graphic the screen was also missing; U4 is the quieter way to buy the same '
           'attention.', '#96938c')
  + K.para('All four are on the Android chrome, since that is what ships first.', '#6f6c66'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">What an accent fill costs</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">It spends the screen&rsquo;s whole attention '
           'budget.</b> A filled card is louder than three plates, so the plate count drops with '
           'it: U3 has the card, one plate and a rail, and that is the ceiling. Adding a fourth '
           'section would put the screen back where the density critique started.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">The hue inverts on it.</b> Done-green and '
           'live-red are both under 3:1 against <span style="color:#96938c">#e4c68c</span>. '
           'Anything stateful inside the card is ink plus a glyph or a position &mdash; never a '
           'second colour. This is the same rule the first design recorded, and it is the reason '
           'the card carries no PR pill.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Only one fill at size, per screen.</b> The '
           'tab bar&rsquo;s button is the exception that proves it: at 52pt it reads as the same '
           'family. A second card-sized fill anywhere would turn both into noise.', '#6f6c66')
  + K.para('The ring is worth stating separately: it is allowed here <em>only</em> because a '
           'weekly session target is a real denominator. The moment it is asked to show volume, '
           'sets or tonnage, it goes back to being decoration and the rule from §0 kills it.',
           '#6f6c66')
  + '</div>')

HTML = K.page(44, 'Today, with a face', INTRO, [('', '', COLS)], CLOSING)
open('lab44.html', 'w').write(HTML)
print('wrote lab44.html', len(HTML))
