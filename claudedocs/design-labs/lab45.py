"""Lab 45 — The week you can scroll.

Your pick from Lab 44: U4's quiet card with the accent action, keeping the
calendar-style strip from U1/U2 rather than the ring-and-columns block. Plus two
things the strip has never had to do: scroll back a week or two, and open the
session for a day you tap.

Both change the cell. A strip of weekday letters cannot say *which* Tuesday once
it scrolls, so the date arrives with the scrolling; and a cell you can press has
to be a 44pt target and has to say when there is nothing behind it.

W3 is the one that also answers "give me something to look at": the same
calendar, with each day's volume as the fill. One element, both jobs.
"""
import kit as K
import lab43 as L
import lab44 as F

CELL = 46
GAP = 5

# (weekday, date, state, volume in tonnes). Two weeks and a bit, ending today.
DAYS = [
    ('M', '18', 'done', 6.0), ('T', '19', 'done', 4.8), ('W', '20', 'rest', 0),
    ('T', '21', 'done', 7.4), ('F', '22', 'done', 8.1), ('S', '23', 'rest', 0),
    ('S', '24', 'rest', 0),
    ('M', '25', 'done', 6.4), ('T', '26', 'done', 5.2), ('W', '27', 'rest', 0),
    ('T', '28', 'missed', 0), ('F', '29', 'done', 8.1), ('S', '30', 'rest', 0),
    ('S', '31', 'rest', 0),
    ('M', '1', 'done', 6.2), ('T', '2', 'done', 5.1), ('W', '3', 'rest', 0),
    ('T', '4', 'today', 0), ('F', '5', 'ahead', 0), ('S', '6', 'ahead', 0),
    ('S', '7', 'ahead', 0),
]
TOP = max(d[3] for d in DAYS) or 1


def cell(day, date, state, vol, fill=False):
    """One day. 44pt+ tall because a day with a session behind it is a target.

    Rest and missed must not look alike (the calendar rule): rest is simply
    quiet, a missed session carries a ring under the number.
    """
    if state == 'today':
        bg, dc, nc = 'rgba(228,198,140,0.15)', K.ACCENT, 'var(--hi)'
    elif state == 'done':
        bg, dc, nc = 'transparent', 'var(--lo)', 'var(--hi)'
    elif state == 'ahead':
        bg, dc, nc = 'transparent', 'var(--dim)', 'var(--dim)'
    else:
        bg, dc, nc = 'transparent', 'var(--dim)', 'var(--lo)'

    if fill and vol > 0:
        h = max(4, round(26 * vol / TOP))
        mark = ('<span style="width:14px;height:26px;display:flex;align-items:flex-end">'
                '<span style="width:14px;height:%dpx;border-radius:3px;background:%s"></span>'
                '</span>' % (h, K.ACCENT if state == 'today' else K.DONE))
    elif fill:
        mark = ('<span style="width:14px;height:26px;display:flex;align-items:flex-end">'
                '<span style="width:14px;height:4px;border-radius:2px;background:%s"></span>'
                '</span>' % ('rgba(223,84,65,0.55)' if state == 'missed'
                             else 'rgba(255,255,255,0.07)'))
    elif state == 'missed':
        mark = ('<span style="width:9px;height:9px;border-radius:9999px;'
                'border:1px solid rgba(223,84,65,0.85)"></span>')
    elif state in ('done', 'today'):
        mark = ('<span style="width:7px;height:7px;border-radius:9999px;background:%s"></span>'
                % (K.ACCENT if state == 'today' else K.DONE))
    else:
        mark = ('<span style="width:7px;height:7px;border-radius:9999px;'
                'background:rgba(255,255,255,0.10)"></span>')

    return ('<div style="width:%dpx;flex:none;min-height:44px;display:flex;'
            'flex-direction:column;align-items:center;gap:6px;padding:7px 0;'
            'border-radius:10px;background:%s">'
            '<span class="mono" style="font-size:11px;letter-spacing:0.06em;color:%s">%s</span>'
            '<span class="mono" style="font-size:13px;color:%s">%s</span>%s</div>'
            % (CELL, bg, dc, day, nc, date, mark))


def strip(days, fill=False, offset=0, dates=True):
    """The row inside its clip. `offset` shifts it left, which is what a scroll
    looks like frozen on a board."""
    cells = ''.join(cell(*d, fill=fill) for d in days)
    return ('<div style="margin:0 -22px;padding:0 22px;overflow:hidden">'
            '<div class="r" style="gap:%dpx;align-items:stretch;'
            'transform:translateX(-%dpx);width:max-content">%s</div></div>'
            % (GAP, offset, cells))


THIS_WEEK = DAYS[14:]
LAST_TWO = DAYS

TILES = K.tiles([('SESSIONS', '3', K.meter(3 / 4.0, w=44), K.HI),
                 ('VOLUME', '18.4 T', K.delta('+9%'), K.HI)], tone='raised')

HEAD = K.head('Today', 'THU 4 SEP', K.ico('gear', 'var(--lo)', 1.7))

def screen(strip_html):
    return K.phone(
        HEAD
        + K.psec('', F.quiet_card(), first=True, pad=15)
        + K.psec('THIS WEEK', strip_html
                 + '<div style="height:11px"></div>' + TILES, pad=13)
        + K.psec('RECENT', K.rail(L.RAIL_EVENTS[:2], air=22), plated=False),
        active='today', surface='raised')


W1 = K.phone(
    HEAD
    + K.psec('', F.quiet_card(), first=True, pad=15)
    + K.psec('THIS WEEK', L.daystrip(L.V1_WEEK, names=False)
             + '<div style="height:4px"></div>' + TILES, pad=13)
    + K.psec('RECENT', K.rail(L.RAIL_EVENTS[:2], air=22), plated=False),
    active='today', surface='raised')

ROW_W = len(DAYS) * CELL + (len(DAYS) - 1) * GAP
TODAY_OFFSET = ROW_W - 380

W2 = screen(strip(LAST_TWO, fill=False, offset=TODAY_OFFSET))
W3 = screen(strip(LAST_TWO, fill=True, offset=TODAY_OFFSET))
W4 = screen(strip(LAST_TWO, fill=True, offset=TODAY_OFFSET - 7 * (CELL + GAP)))

COLS = [
 ('W1', 'Your pick, as it stands', 'U4 plus the U1 strip',
  'The quiet card with the accent action, and the seven-day dot strip from Lab&nbsp;44 U1/U2 under it. Nothing scrolls and nothing is tappable yet.',
  'This is the combination you asked for, drawn before anything is added to it. Worth having in view because it is the least the screen can be: everything to the right of this column is a cell that has to earn its extra weight.',
  W1),
 ('W2', 'The strip scrolls', 'And so the date arrives',
  'The same strip, now two weeks deep and scrolled to today. The previous week is cut by the left margin rather than stopping at it.',
  '<b>Scrolling forces the date onto the cell.</b> A row of weekday letters cannot say <em>which</em> Tuesday the moment it moves, so M/T/W keeps the rhythm and the number carries the identity. The cut cell at the left edge is the same affordance the library filter strip uses &mdash; a cell cut by the screen edge reads as &ldquo;more that way&rdquo;, a cell cut by a padding box reads as a bug &mdash; which is why the strip bleeds past the 22pt margin and the plate does not. <b>Two weeks is the limit</b>: further back is the calendar&rsquo;s job, and a strip that scrolls forever is a calendar with worse ergonomics.',
  W2),
 ('W3', 'The fill is the graph', 'One element, both jobs',
  'Identical cells, except the dot becomes a bar as tall as that day&rsquo;s volume. Today is the accent; rest days keep a stub so the row never has a hole in it.',
  '<b>My pick, and the answer to the other half of your note.</b> The screen wanted something to look at; this is a bar chart that was already on the screen as a calendar. It reads as shape first &mdash; which days, how hard, where the gaps are &mdash; and only resolves into a chart when you look twice, which is the right order for something you see every day. It also stays honest under the §0 rule: the bars are not the only view of the number, the tonnage is printed under them, so the chart is a preview rather than a claim.',
  W3),
 ('W4', 'Scrolled back a week', 'What a past week looks like',
  'W3 dragged right by roughly one week. Today has left the viewport; the missed Thursday and the two heavy days of the previous week are in it.',
  'The state worth checking before building it, because two things could go wrong and one does. <b>Today leaving the screen is fine</b> &mdash; the header already says the date, and the accent cell returns the moment you let go if the strip snaps back. <b>The missed day reads correctly</b>: a ring under the number, not a faint plate, so a lapse cannot be mistaken for a rest day. What still needs a device: whether a 46pt cell inside a horizontally scrolling row inside a vertically scrolling screen fights the gesture, which is the same class of problem as the live screen and gets the same answer &mdash; the cells stay tappable, so the scroll is an accelerator rather than the only route.',
  W4),
]

INTRO = (
  K.para('Your pick: <b style="color:#c9c3b6;font-weight:500">U4&rsquo;s quiet card with the accent '
         'action</b>, keeping the calendar-style strip rather than the ring and columns. Plus two '
         'requests that change what a cell is: the strip scrolls back a week or two, and a day '
         'opens its session.')
  + K.para('Both have consequences worth drawing before building. <b style="color:#c9c3b6;'
           'font-weight:500">Scrolling forces the date onto the cell</b> &mdash; weekday letters '
           'stop identifying a day the moment there is more than one of it. <b '
           'style="color:#c9c3b6;font-weight:500">Tapping forces a 44pt target</b> and an honest '
           'empty state for a day with nothing behind it.', '#96938c')
  + K.para('W3 folds in the other half of the note: the cell&rsquo;s mark becomes that day&rsquo;s '
           'volume, so the calendar <em>is</em> the graph and the screen gains something to look '
           'at without gaining a section.', '#96938c'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">What this settles for the build</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">The strip is a horizontal scroll of day cells, '
           'bounded to two weeks back.</b> It bleeds past the screen margin so a cut cell says '
           'there is more; it snaps to today on open; and the tab target is the cell, 46 &times; '
           '44pt, not the mark inside it.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">A tap opens that day&rsquo;s session.</b> A '
           'day with two sessions opens the later one; a rest or future day is not a target at all '
           'rather than a target that does nothing &mdash; a dead press is worse than an obvious '
           'non-target.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Rest, missed and empty stay three different '
           'things.</b> Rest is quiet, missed carries the ring under its number, and days ahead of '
           'today are dimmed rather than absent. That is the calendar rule from Lab&nbsp;39, and '
           'the strip inherits it rather than inventing a second vocabulary.', '#6f6c66')
  + K.para('One consequence to accept: the fill in W3 is a <em>relative</em> scale &mdash; the '
           'tallest bar is the best day in view, not a fixed tonnage. That is right for a shape '
           'and wrong for a measurement, which is why the number stays printed underneath.',
           '#6f6c66')
  + '</div>')

HTML = K.page(45, 'The week you can scroll', INTRO, [('', '', COLS)], CLOSING)
open('lab45.html', 'w').write(HTML)
print('wrote lab45.html', len(HTML))
