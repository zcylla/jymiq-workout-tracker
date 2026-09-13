"""Lab 47 — The design system, drawn.

Forty-six boards decided things and one file holds the decisions as prose
(../design-exploration.md §0) and one holds them as code (kit.py). Neither shows
you the system. This board does: the tokens as swatches, every primitive in every
state, the composition rules drawn rather than written, and the interaction model.

It is the reference sheet — the thing you open to see what the app is made of
before building a screen out of it, and the thing you update when a decision
changes. It is generated from kit.py and from the real values in
../../src/theme/tokens.ts and type.ts, so it cannot drift from either.

Screens live on Labs 33-37 and 43-46. This board holds no screens.
"""
import kit as K

# ---------------------------------------------------------------- helpers --

def sw(name, val, note='', ink=None):
    """A colour, its token name, its value, and what it is for."""
    # The outline is doing real work: ground and panel are near-black, and without
    # an edge the two darkest steps in the system are invisible on the page.
    chip = ('<span style="width:100%;height:44px;border-radius:9px;display:block;'
            'background:' + val + ';outline:1px solid rgba(255,255,255,0.13);'
            'outline-offset:-1px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.075),'
            'inset 0 -1px 0 rgba(0,0,0,0.28)">'
            + ('<span class="mono" style="font-size:11px;color:' + ink + ';padding:6px 0 0 8px;'
               'display:block">' + ink + '</span>' if ink else '')
            + '</span>')
    return ('<div class="swat">' + chip
            + '<span class="mono swn">' + name + '</span>'
            + '<span class="mono swv">' + val + '</span>'
            + ('<span class="swnote">' + note + '</span>' if note else '')
            + '</div>')


def spec(title, rule, body, span=1):
    """One specimen: what it is called, the rule that governs it, the thing itself."""
    return ('<div class="card" style="grid-column:span ' + str(span) + '">'
            '<div class="chead"><span class="mono ctitle">' + title + '</span>'
            '<span class="crule">' + rule + '</span></div>'
            '<div class="cbody">' + body + '</div></div>')


def section(label, gloss, body):
    return ('<div class="dsec"><div class="dhead">'
            '<span class="mono dlbl">' + label + '</span>'
            '<span class="rule"></span></div>'
            '<p class="dgloss">' + gloss + '</p>' + body + '</div>')


def grid(cards, min_w=300):
    return ('<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax('
            + str(min_w) + 'px,1fr))">' + ''.join(cards) + '</div>')


# ============================================================ 1 FOUNDATIONS ==

SURFACES = grid([
    spec('SURFACES', 'Three steps, and only three. A plate is an ~11% lift off the canvas '
                     '&mdash; Apple&rsquo;s own step from black. There is no fourth level; a thing '
                     'that needs to sit on a plate on a plate is a thing that needs rethinking.',
         '<div class="row3">'
         + sw('ground', K.GROUND, 'the canvas, and the app&rsquo;s only background')
         + sw('panel', K.PANEL, 'behind a tile that sits on a plate')
         + sw('raised', K.RAISED, 'every plate, every row plate, the chrome')
         + '</div>'
         '<div style="height:14px"></div>'
         '<div class="lit" style="background:' + K.RAISED + ';border-radius:14px;padding:15px">'
         '<span class="mono" style="font-size:11px;color:var(--lo);letter-spacing:0.14em">'
         'M4 &mdash; THE LIT EDGE</span>'
         '<div style="height:7px"></div>'
         '<span style="font-size:13px;line-height:1.6;color:var(--mid);display:block">'
         'inset 0 1px 0 rgba(255,255,255,.075) over inset 0 -1px 0 rgba(0,0,0,.28). One highlight '
         'along the top, one shadow along the bottom. It is what makes a flat fill read as a '
         'surface without a border.</span></div>', span=2),

    spec('STATE', 'Three hues, and each one means exactly one thing. None of them is decorative '
                  'and none of them is a second accent.',
         '<div class="row3">'
         + sw('accent', K.ACCENT, 'the current thing, and the primary action', ink=None)
         + sw('done', K.DONE, 'completed &mdash; a logged set, a finished day')
         + sw('live', K.LIVE, 'a session in progress, and a loss against a previous value')
         + '</div>'),

    spec('TEXT RAMP', 'Four steps. A screen picks by <em>rank</em>, never by taste: what you read '
                      'first is <code>hi</code>, what qualifies it is <code>mid</code>, what you '
                      'scan is <code>lo</code>, what is absent is <code>dim</code>.',
         '<div class="row4">'
         + sw('hi', K.HI, 'the value')
         + sw('mid', K.MID, 'prose, and a qualifier')
         + sw('lo', K.LO, 'labels and meta')
         + sw('dim', K.DIM, 'absent, or not a target')
         + '</div>'),

    spec('TICK RAMP', 'For the ring&rsquo;s ticks and a rail&rsquo;s dots &mdash; a series that '
                      'has to read as ordered without carrying a hue. Age buckets, never an '
                      'index ramp: with twenty rows an index ramp is <code>tick1</code> from the '
                      'fifth row down.',
         '<div class="row4">'
         + sw('tick3', K.TICK3, '3&ndash;6 days')
         + sw('tick2', K.TICK2, '7&ndash;12 days')
         + sw('tick1', K.TICK1, 'older')
         + sw('off', K.OFF, 'a cell with nothing in it')
         + '</div>'),

    spec('WASHES', 'A hue at low alpha used as a fill <em>behind</em> something. Never a step in '
                   'the text ramp &mdash; a wash is a ground, not an ink.',
         '<div class="wash">'
         + ''.join('<div class="wrow"><span class="wchip" style="background:' + v + '"></span>'
                   '<span class="mono wn">' + n + '</span>'
                   '<span class="mono wv">' + v + '</span></div>'
                   for n, v in [
                       ('field', 'rgba(255,255,255,0.05)'),
                       ('track', 'rgba(255,255,255,0.08)'),
                       ('off', 'rgba(255,255,255,0.10)'),
                       ('accent', 'rgba(228,198,140,0.13)'),
                       ('chip', 'rgba(228,198,140,0.15)'),
                       ('done', 'rgba(159,174,58,0.16)'),
                       ('live', 'rgba(223,84,65,0.14)'),
                       ('scrim', 'rgba(10,9,8,0.62)'),
                   ]) + '</div>'),

    spec('HAIRLINES', 'A hairline&rsquo;s contrast is <b style="color:#c9c3b6;font-weight:500">'
                      'relative to its surface</b>. 11% white reads on the canvas and washes out '
                      'on a plate, where it takes ~20%. Every hairline token carries both.',
         '<div class="hair">'
         + ''.join('<div class="hrow"><span class="mono hn">' + n + '</span>'
                   '<span class="hline" style="background:' + v + '"></span>'
                   '<span class="mono hv">' + v.replace('rgba(255,255,255,', '').replace(')', '')
                   + '</span></div>'
                   for n, v in [('onGround', 'rgba(255,255,255,0.11)'),
                                ('onPlate', 'rgba(255,255,255,0.20)'),
                                ('ruled', 'rgba(255,255,255,0.10)'),
                                ('inset', 'rgba(255,255,255,0.07)')])
         + '</div>'),
])

# The ramp as it is actually declared in src/theme/type.ts.
RAMP = [
    ('h1', 'Lower A', 30, 600, 'sans', '-0.03em', 'screen title'),
    ('h2', 'New records', 19, 600, 'sans', '-0.02em', 'a heading inside a screen'),
    ('rowTitle', 'Bench Press', 17, 500, 'sans', '', 'a row you touch'),
    ('field', 'Barbell', 17, 400, 'sans', '', 'a field&rsquo;s value'),
    ('lead', 'Lower B', 17, 400, 'sans', '', 'the one sentence that leads a screen'),
    ('rowName', 'Ab Wheel Rollout', 15, 400, 'sans', '', 'a row in a list'),
    ('body', 'The barbell back squat loads the whole lower body.', 15, 400, 'sans', '', 'prose'),
    ('prose', 'Nothing logged yet. Your best set appears here.', 13, 400, 'sans', '', 'quiet prose'),
    ('action', 'Start Lower A', 16, 600, 'sans', '', 'on an accent fill'),
    ('label', 'YOUR ROUTINES', 11, 500, 'mono', '0.14em', 'a ruled section label'),
    ('meta', '5 &times; 8 @ 100 KG', 11, 400, 'mono', '0.08em', 'the line under a row name'),
    ('pill', 'PR', 11, 400, 'mono', '0.10em', 'a pill, and an action-bar secondary'),
    ('tab', 'Session', 11, 400, 'mono', '0.05em', 'a tab label'),
    ('numSm', '127', 13, 400, 'mono', '', 'a number in a read-only table'),
    ('num', '105.0', 15, 500, 'mono', '-0.02em', 'a number in a row'),
    ('numRow', '8.6 T', 17, 600, 'mono', '-0.02em', 'a row&rsquo;s value'),
    ('numTile', '1.6 T', 22, 600, 'mono', '-0.02em', 'a stat tile'),
    ('numCore', '105', 54, 600, 'mono', '-0.05em', 'the live screen&rsquo;s load'),
]


def rampstep(name, sample, px, weight, fam, track, use):
    font = ("'Geist Mono',ui-monospace,monospace" if fam == 'mono'
            else 'Geist,ui-sans-serif,system-ui,sans-serif')
    meta = str(px) + ' &middot; ' + str(weight) + (' &middot; ' + track if track else '')
    return ('<div class="rstep">'
            '<div class="rmeta"><span class="mono rname">' + name + '</span>'
            '<span class="mono rnums">' + meta + '</span>'
            '<span class="ruse">' + use + '</span></div>'
            '<div class="rsample" style="font-family:' + font + ';font-size:' + str(px) + 'px;'
            'font-weight:' + str(weight) + ';letter-spacing:' + (track or 'normal')
            + ';color:var(--hi)">' + sample + '</div></div>')


TYPE = ('<div class="ramp">' + ''.join(rampstep(*r) for r in RAMP) + '</div>'
        + K.para('<b style="color:#c9c3b6;font-weight:500">Two traps live in this table.</b> '
                 'CSS letter-spacing is em and React Native&rsquo;s is points, so every step goes '
                 'through <code>ls(em, px)</code>. And RN Android&rsquo;s default line height runs '
                 '~8% taller than a browser&rsquo;s, so every step that lands in a row states its '
                 '<code>lineHeight</code> through <code>lh()</code> &mdash; without it a 53pt '
                 'board row measures 57.1 on the device and the error compounds down the screen.',
                 '#6f6c66'))


def bar(w, col, label):
    return ('<div class="sbar"><span style="display:block;height:10px;border-radius:3px;width:'
            + str(w) + 'px;background:' + col + '"></span>'
            '<span class="mono sblab">' + label + '</span></div>')


SPACING = grid([
    spec('THE SPACING LAW', 'Between-section space is <b style="color:#c9c3b6;font-weight:500">'
                            'at least 3&times;</b> within-section space. This is the whole '
                            'structure of every screen &mdash; grouping is done by air, not by '
                            'boxes.',
         bar(K.BETWEEN, K.ACCENT, 'between &middot; 46')
         + bar(K.WITHIN, K.TICK2, 'within &middot; 11')
         + bar(7, K.TICK1, 'row &middot; 7 &mdash; the gap that replaced every list hairline')
         + bar(K.PAD, K.TICK1, 'pad &middot; 22 &mdash; the screen&rsquo;s side margin')
         + K.para('<code>railAir</code> is <em>not</em> in this table. The 56pt figure was written '
                  'before any rail shipped and no board uses it: Today passes 22, routine detail '
                  'and the program strip 24, the PR timeline 26. <code>Rail</code> takes '
                  '<code>air</code> as a <b style="color:#c9c3b6;font-weight:500">required prop</b> '
                  '&mdash; no default can be right when three boards disagree.', '#6f6c66'),
         span=2),

    spec('RADII', 'Bigger surface, bigger radius. A row plate is 12, the plate that holds several '
                  'is 14, the chrome is 20, a sheet is 26.',
         '<div class="radgrid">'
         + ''.join('<div class="radcell"><span style="display:block;height:52px;background:'
                   + K.RAISED + ';border-radius:' + str(r) + 'px" class="lit"></span>'
                   '<span class="mono radn">' + n + '</span>'
                   '<span class="mono radv">' + str(r) + '</span></div>'
                   for n, r in [('pill', 5), ('cell', 8), ('chip', 11), ('row', 12),
                                ('tile', 12), ('plate', 14), ('bar', 20), ('sheet', 26)])
         + '</div>'),

    spec('TOUCH TARGETS', 'Every touchable is at least 44. A read-only table row is 34 &mdash; the '
                          'floor is for targets, and applying it to a log makes the log twice as '
                          'long for no reason. A control drawn smaller keeps its size and grows '
                          'its <code>hitSlop</code>.',
         '<div class="tt"><div class="ttrow" style="height:44px">'
         '<span class="mono ttl">44 &middot; hit</span>'
         '<span class="ttbar" style="background:rgba(228,198,140,0.20)"></span></div>'
         '<div class="ttrow" style="height:38px">'
         '<span class="mono ttl">38 &middot; sheetRow</span>'
         '<span class="ttbar" style="background:rgba(228,198,140,0.13)"></span></div>'
         '<div class="ttrow" style="height:34px">'
         '<span class="mono ttl">34 &middot; readRow</span>'
         '<span class="ttbar" style="background:rgba(255,255,255,0.07)"></span></div></div>'),
])

# ============================================================= 2 PRIMITIVES ==

def onground(body):
    return '<div class="stage">' + body + '</div>'


META = ('<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
        '5 &times; 8 @ 100 KG &middot; REST 3:00</span>')


def namemeta(name, meta=META):
    return ('<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
            '<span style="font-size:15px;color:var(--hi)">' + name + '</span>' + meta + '</div>')


def field(label, value, placeholder=False, chev=True):
    return ('<div style="display:flex;flex-direction:column;gap:6px;padding:7px 0">'
            '<span class="mono lbl">' + label + '</span>'
            '<div class="r" style="min-height:44px;gap:10px">'
            '<span style="font-size:17px;color:' + ('var(--dim)' if placeholder else 'var(--hi)')
            + '">' + value + '</span><span class="sp"></span>'
            + (K.CHEV if chev else '') + '</div></div>')


def chip(label, on=False):
    return ('<span style="font-size:11px;letter-spacing:0.06em;padding:8px 13px;border-radius:11px;'
            'font-family:\'Geist Mono\',ui-monospace,monospace;background:'
            + ('rgba(228,198,140,0.15);color:' + K.ACCENT if on
               else 'rgba(255,255,255,0.05);color:var(--lo)') + '">' + label + '</span>')


def toggle(label, meta, on):
    knob = ('<div style="width:44px;height:26px;border-radius:9999px;flex:none;padding:3px;'
            'display:flex;justify-content:' + ('flex-end' if on else 'flex-start')
            + ';background:' + ('var(--accent)' if on else 'rgba(255,255,255,0.10)') + '">'
            '<span style="width:20px;height:20px;border-radius:9999px;background:'
            + ('#15130f' if on else 'var(--lo)') + '"></span></div>')
    return ('<div class="lrow">'
            '<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
            '<span style="font-size:15px;color:var(--hi)">' + label + '</span>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
            + meta + '</span></div><span class="sp"></span>' + knob + '</div>')


PRIMITIVES = grid([
    spec('SECTION LABEL', 'A mono label on the canvas with a hairline running to the right edge, '
                          'and 46pt of air above it. This is the app&rsquo;s only heading. What '
                          'sits under it is plated <em>only</em> if it is one of the '
                          'screen&rsquo;s main components.',
         onground(K.sec('YOUR ROUTINES', '<span style="font-size:13px;color:var(--lo)">'
                        'the content, unplated</span>', first=True)
                  + K.sec('THIS MONTH', '<span style="font-size:13px;color:var(--lo)">'
                          'a second section, 46pt below</span>',
                          right='<span class="mono lbl">3 SESSIONS</span>'))),

    spec('LIST ROW', '44pt, no fill of its own. Name 15&ndash;17px, a mono meta line under it at '
                     '11px, the value right, a chevron if it navigates and a grip if it reorders. '
                     'Every list you can touch is this row.',
         onground(K.prows([
             K.lrow(namemeta('Bench Press')),
             K.lrow(namemeta('Back Squat'),
                    '<span class="num" style="font-size:17px;font-weight:600">8.6 T</span>'),
             K.lrow(namemeta('Romanian Deadlift'), grip=True, chev=False),
             K.lrow(namemeta('Arm Circles'), dim=True, chev=False),
         ]))),

    spec('ROW PLATE', 'The containment lands on the thing you touch: the row with an edge is the '
                      'row you press, and a 7pt gap replaces every hairline. Costs about 7pt a row '
                      'against one grouped plate, and buys an unambiguous target.',
         onground(K.prows([K.lrow(namemeta('Ab Wheel Rollout')),
                           K.lrow(namemeta('Active Hang'))]))),

    spec('FIELD', 'A mono label over a 17px value. 44pt, chevron if it opens a picker. '
                  '<b style="color:#c9c3b6;font-weight:500">No box and no underline</b> &mdash; a '
                  'field is type and space, and the row plate is the only edge it gets. The value '
                  'is sentence case; caps on both lines destroys the contrast that is the whole '
                  'component.',
         onground(K.prows([field('EQUIPMENT', 'Barbell'),
                           field('NAME', 'Pause Front Squat', placeholder=True, chev=False)]))),

    spec('CHIP', 'One component for filters and for multi-select. A filter strip bleeds past the '
                 '22pt margin so a cut chip reads as scrollable; a vocabulary you must see all of '
                 'wraps instead.',
         onground('<div class="wrapr">' + chip('ALL', True) + chip('BARBELL') + chip('DUMBBELL')
                  + chip('MACHINE') + chip('CABLE') + '</div>')),

    spec('PILL', 'A tiny mono badge that states a fact about the row it sits in. It never '
                 'navigates and it never has more than three characters worth saying.',
         onground('<div class="wrapr">' + K.pill('PR')
                  + K.pill('DONE', K.DONE, 'rgba(159,174,58,0.16)')
                  + K.pill('LIVE', K.LIVE, 'rgba(223,84,65,0.14)') + '</div>')),

    spec('TOGGLE', 'A switch that writes somewhere. A toggle with no column behind it is not '
                   'drawn at all &mdash; a persisted-looking switch that persists nothing is worse '
                   'than an absent one.',
         onground(K.prows([toggle('Track RPE', 'OFF BY DEFAULT &middot; SEE SETTINGS', False),
                           toggle('Count warm-ups', 'INTO SESSION VOLUME', True)]))),

    spec('STAT TILES', '<b style="color:#c9c3b6;font-weight:500">Two per row, never four across.</b> '
                       'Order inside a tile is label &rarr; number &rarr; visual, the number about '
                       '2&times; the label. A comparison attaches to the number it describes and '
                       'never gets its own tile. <code>tiles(tone=)</code> names the '
                       '<em>surface</em>, and the tile takes the other colour.',
         onground(K.panel(K.tiles([('EXERCISES', '4'), ('SETS', '14'),
                                   ('LAST TIME', '64 MIN'),
                                   ('LAST VOLUME', '8.6 T', K.delta('+4%'))], tone='raised'))),
         span=2),

    spec('THE ABSENT VALUE', 'An em dash is the empty state, and §0 draws an absent value '
                            '<b style="color:#c9c3b6;font-weight:500">dim</b>. The tile decides '
                            'that, not the caller &mdash; two callers had already disagreed about '
                            'the same value.',
         onground(K.panel(K.tiles([('TIME', '&mdash;'), ('VOLUME', '1.6 T')], tone='raised')))),

    spec('METER &amp; DELTA', 'A meter needs a denominator. A delta needs a previous value. '
                              'Without one, the number ships plain &mdash; a visual that '
                              'decorates is a visual that lies about having data behind it.',
         onground('<div class="stack">'
                  '<div class="r" style="gap:12px"><span class="mono lbl">WEEK</span>'
                  '<span class="sp"></span>' + K.meter(0.72) + '</div>'
                  '<div class="r" style="gap:12px"><span class="mono lbl">VS LAST</span>'
                  '<span class="sp"></span>' + K.delta('+4%') + '</div>'
                  '<div class="r" style="gap:12px"><span class="mono lbl">VS LAST</span>'
                  '<span class="sp"></span>' + K.delta('-12%', positive=False) + '</div>'
                  '<div class="r" style="gap:12px"><span class="mono lbl">6 WEEKS</span>'
                  '<span class="sp"></span>' + K.spark([4, 6, 5, 8, 7, 9]) + '</div></div>')),

    spec('RAIL', 'Chronological only &mdash; exercise history, a session list, the PR timeline. '
                 'The dots are cut free of the line so it reads as discrete events rather than a '
                 'continuous measure. A rail always means &ldquo;events in order&rdquo; and never '
                 'anything else. <code>air</code> is required.',
         onground(K.rail([
             (K.ACCENT, '<div class="r" style="gap:9px">'
                        '<span class="num" style="font-size:15px">Thu 4 Sep</span>' + K.pill('PR')
                        + '<span class="sp"></span><span class="mono" style="font-size:13px;'
                          'color:var(--mid)">8.6 T</span></div>'
                        '<span class="mono" style="font-size:11px;letter-spacing:0.07em;'
                        'color:var(--lo)">LOWER A &middot; 64 MIN &middot; 20 SETS</span>'),
             (K.TICK3, '<div class="r" style="gap:9px">'
                       '<span class="num" style="font-size:15px">Tue 2 Sep</span>'
                       '<span class="sp"></span><span class="mono" style="font-size:13px;'
                       'color:var(--mid)">7.4 T</span></div>'
                       '<span class="mono" style="font-size:11px;letter-spacing:0.07em;'
                       'color:var(--lo)">UPPER A &middot; 58 MIN &middot; 18 SETS</span>'),
             (K.TICK1, '<div class="r" style="gap:9px">'
                       '<span class="num" style="font-size:15px">Mon 1 Sep</span>'
                       '<span class="sp"></span><span class="mono" style="font-size:13px;'
                       'color:var(--mid)">8.1 T</span></div>'
                       '<span class="mono" style="font-size:11px;letter-spacing:0.07em;'
                       'color:var(--lo)">LOWER B &middot; 61 MIN &middot; 20 SETS</span>'),
         ], air=22))),

    spec('CHART', 'Never bare. y min and max anchored to the plot, first and last x labelled, the '
                  'latest mark in the accent with the rest de-emphasised, its value printed, and a '
                  'title that states the takeaway rather than the field name. '
                  '<b style="color:#c9c3b6;font-weight:500">Text never wears the series '
                  'colour</b> &mdash; labels and values stay in the text ramp.',
         onground('<span class="mono lbl">VOLUME BY WEEK &middot; UP 9% OVER SIX</span>'
                  '<div style="height:11px"></div>'
                  + K.chart([6.2, 6.8, 6.4, 7.5, 7.1, 8.6], 'JUL 28', 'SEP 1',
                            value='8.6 T', w=300, active=5)), span=2),

    spec('READ-ONLY TABLE', 'No plate, no rail, no row fill. The columns are the structure and '
                           'they are right-anchored as a group, so a column dropped on one '
                           'exercise cannot push the one above it out of line. 34pt rows.',
         onground('<div class="r" style="gap:10px;margin-bottom:4px">'
                  '<span class="mono lbl" style="width:26px">SET</span><span class="sp"></span>'
                  '<span class="mono lbl" style="width:54px;text-align:right">KG</span>'
                  '<span class="mono lbl" style="width:34px;text-align:right">REP</span>'
                  '<span class="mono lbl" style="width:46px;text-align:right">e1RM</span></div>'
                  + ''.join('<div class="r" style="gap:10px;height:34px">'
                            '<span class="mono" style="width:26px;font-size:11px;color:'
                            + (K.DIM if w == 'warm' else K.DONE) + '">' + i + '</span>'
                            '<span class="sp"></span>'
                            '<span class="mono" style="width:54px;text-align:right;font-size:13px;'
                            'color:var(--hi)">' + kg + '</span>'
                            '<span class="mono" style="width:34px;text-align:right;font-size:13px;'
                            'color:var(--mid)">' + rep + '</span>'
                            '<span class="mono" style="width:46px;text-align:right;font-size:13px;'
                            'color:var(--accent)">' + e + '</span></div>'
                            for i, kg, rep, e, w in [('01', '60.0', '&times;10', '&mdash;', 'warm'),
                                                     ('02', '100.0', '&times;8', '127', ''),
                                                     ('03', '105.0', '&times;8', '133', '')]))),

    spec('THE CHROME', 'Four labelled tabs and an inset circular start button, on one continuous '
                       'plane. <b style="color:#c9c3b6;font-weight:500">Glass on iOS, an opaque '
                       'raised plate on Android</b> &mdash; blur on Android was researched and '
                       'ruled out, so it is a platform switch and not a fallback.',
         '<div class="chrome">' + K.nav('today', surface='plate') + '</div>', span=2),

    spec('ACTION BAR', 'A pushed screen has no tab bar, so its primary action takes that plane '
                       '&mdash; same geometry as the bar it replaces. A secondary sits to its '
                       'left in mono caps. <b style="color:#c9c3b6;font-weight:500">A bar with no '
                       'handler behind it is not drawn</b>: an inert button is worse than an '
                       'absent one.',
         '<div class="chrome">' + K.actionbar('Start Lower A', 'EDIT') + '</div>', span=2),

    spec('ICONS', 'Hand-drawn, strokes only, round caps and joins, no fill, '
                  '<code>&lt;path&gt;</code> only. <code>assets/icons/ui/*.svg</code> is the '
                  'source of truth, and <code>react-native-nano-icons</code> compiles the folder '
                  'into a subsetted font at prebuild so a glyph is one native text draw rather '
                  'than an SVG subtree per row. The number in <code>ICON_SIZE</code> is the '
                  '<em>on-screen</em> stroke width, not the stroke value &mdash; a 16-box chevron '
                  'at 13pt carries 1.7 and a 22-box icon at 22pt carries 1.6, and both read the '
                  'same weight. <b style="color:#c9c3b6;font-weight:500">Adding one needs a '
                  'prebuild and a native rebuild</b>: codepoints are assigned alphabetically, so a '
                  'new icon renumbers every later one and the stale font on the device draws a '
                  'clock where a chart should be &mdash; silently, as the wrong glyph.',
         '<div class="icons">'
         + ''.join('<div class="icell">' + K.ico(n, 'var(--mid)', 1.6, 22)
                   + '<span class="mono icn">' + n + '</span></div>'
                   for n in sorted(K.ICONS))
         + ''.join('<div class="icell ighost"><span class="ino">&mdash;</span>'
                   '<span class="mono icn">' + n + '</span></div>'
                   for n in ['chev', 'down', 'start', 'up'])
         + '</div>'
         + K.para('The folder ships <b style="color:#c9c3b6;font-weight:500">14</b>; '
                  '<code>kit.ICONS</code> holds the ten drawn above. The four dashed ones are real '
                  'glyphs kit keeps outside that dict &mdash; <code>chev</code> is '
                  '<code>kit.CHEV</code>, and <code>up</code>, <code>down</code> and '
                  '<code>start</code> are drawn inline by the tape, the selector and the nav bar. '
                  '<code>pnpm check</code> runs <code>scripts/check-icons.mjs</code>, which fails '
                  'on an off-style or an undeclared icon.', '#6f6c66'), span=2),
])

# =================================================================== 3 RULES ==

RULES = grid([
    spec('CONTAINMENT &mdash; THE THREE LEVELS', 'A plate is <b style="color:#c9c3b6;'
         'font-weight:500">emphasis, not containment</b>. Two or three plated things per screen is '
         'the budget; past that the plates stop meaning anything.',
         '<div class="three">'
         '<div><span class="mono lvl">ROW PLATE</span>'
         '<span class="lvlnote">anything you touch</span>'
         + onground(K.prows([K.lrow(namemeta('Bench Press')), K.lrow(namemeta('Back Squat'))]))
         + '</div>'
         '<div><span class="mono lvl">ONE GROUPED PLATE</span>'
         '<span class="lvlnote">the screen&rsquo;s main component</span>'
         + onground(K.panel(K.tiles([('SETS', '14'), ('VOLUME', '8.6 T')], tone='raised')))
         + '</div>'
         '<div><span class="mono lvl">NOTHING AT ALL</span>'
         '<span class="lvlnote">tables, prose, charts, rails, the body map, the ring</span>'
         + onground('<span style="font-size:15px;line-height:1.55;color:var(--mid)">'
                    'The barbell back squat loads the whole lower body through a deep knee and hip '
                    'bend.</span>')
         + '</div></div>', span=3),

    spec('WHEN A NUMBER EARNS A VISUAL', 'A number gets a visual <b style="color:#c9c3b6;'
         'font-weight:500">only when there is something real to draw</b>. Otherwise it ships '
         'plain. Rings are out entirely without a goal denominator &mdash; a ring must not '
         'decorate. Bullet graphs are out: they need teaching.',
         '<div class="rulerows">'
         + ''.join('<div class="rulerow"><span class="mono rq">' + q + '</span>'
                   '<span class="ra">' + a + '</span>'
                   '<span class="sp"></span><span class="rv">' + v + '</span></div>'
                   for q, a, v in [
                       ('HAS A DENOMINATOR', 'a meter', K.meter(0.72, w=60)),
                       ('HAS A SERIES', 'a spark, or the labelled chart', K.spark([4, 6, 5, 8, 9],
                                                                                  w=60, h=20)),
                       ('HAS A PREVIOUS VALUE', 'a delta on the number it describes',
                        K.delta('+4%')),
                       ('HAS NONE OF THOSE', 'the number, plain',
                        '<span class="num" style="font-size:17px;font-weight:600">8.6 T</span>'),
                   ]) + '</div>', span=2),

    spec('A GUESS IS NOT A MEASUREMENT', 'A number the app guessed is never drawn like a number '
         'you lifted. Deload and readiness are <em>sentences</em>; the body map says FRESH or '
         'NEEDS REST, not a percentage. Where a computed figure must be a number it goes in '
         '<code>mid</code> with a <code>~</code>, never <code>hi</code>.',
         onground('<div class="stack">'
                  '<div class="r"><span class="mono lbl">YOU LIFTED</span><span class="sp"></span>'
                  '<span class="num" style="font-size:22px;font-weight:600">8.6 T</span></div>'
                  '<div class="r"><span class="mono lbl">THE APP GUESSED</span>'
                  '<span class="sp"></span>'
                  '<span class="mono" style="font-size:22px;font-weight:600;color:var(--mid)">'
                  '~48 M</span></div>'
                  '<div style="height:6px"></div>'
                  '<span style="font-size:15px;line-height:1.55;color:var(--mid)">'
                  'Three hard weeks in a row. Next week is a good place to back off.</span>'
                  '</div>')),

    spec('EMPTY STATES', 'A component that will fill in <b style="color:#c9c3b6;font-weight:500">'
         'stays visible and dim</b> rather than hidden &mdash; the layout a new user learns is the '
         'layout they keep. The empty state is a short sentence plus a set of actions. Never an '
         'apology, never an illustration.',
         onground(K.sec('YOUR NUMBERS',
                        '<span style="font-size:13px;line-height:1.6;color:var(--lo)">'
                        'Nothing logged yet. Your best set and estimated 1RM appear here after the '
                        'first session.</span>', first=True))),

    spec('TWO VOCABULARIES', 'The two axes of the live screen must look <em>different</em>. Two '
         'identical indicators at 90&deg; force the reader to decide which is which before reading '
         'either. Horizontal is a written line between two hairlines; vertical is a ladder of '
         'numbered ticks.',
         onground('<div class="stack">'
                  '<div class="r" style="gap:10px"><span class="hl"></span>'
                  '<span class="mono" style="font-size:11px;letter-spacing:0.14em;color:var(--lo)">'
                  'SET 4 OF 5</span><span class="hl"></span></div>'
                  '<div style="height:10px"></div>'
                  '<div class="ladder">'
                  + ''.join('<span class="lt" style="background:' + c + ';width:' + w + 'px">'
                            '</span>'
                            for c, w in [(K.DONE, '18'), (K.DONE, '18'), (K.ACCENT, '26'),
                                         (K.TICK1, '13'), (K.TICK1, '13')])
                  + '</div></div>')),
])

# ============================================================ 4 INTERACTION ==

def flow(steps):
    return ('<div class="flow">'
            + '<span class="fsep">&rarr;</span>'.join(
                '<span class="fstep">' + s + '</span>' for s in steps) + '</div>')


INTERACTION = grid([
    spec('THE LIVE SCREEN&rsquo;S GESTURES', 'Horizontal moves between <b style="color:#c9c3b6;'
         'font-weight:500">sets</b>, vertical between <b style="color:#c9c3b6;font-weight:500">'
         'exercises</b>. That is the whole navigation model of the screen you use most, and it is '
         'why the two indicators had to look different.',
         '<div class="gmap">'
         '<div class="gcell gtop">&uarr;<span>previous exercise</span></div>'
         '<div class="grow">'
         '<div class="gcell">&larr;<span>previous set</span></div>'
         '<div class="gcore"><span class="mono">LOAD</span><b>105</b>'
         '<span class="mono gsub">SET 4 OF 5</span></div>'
         '<div class="gcell">&rarr;<span>next set</span></div></div>'
         '<div class="gcell gtop">&darr;<span>next exercise</span></div></div>', span=2),

    spec('EVERY VALUE HAS TWO ROUTES IN', '<b style="color:#c9c3b6;font-weight:500">No value is '
         'reachable by only one route.</b> All three parameters use the same vertical tape; a '
         'long-press on any of them opens the keypad, and a Settings switch makes a single tap do '
         'it instead.',
         '<div class="stack">'
         + flow(['tap the ring', 'the tape', 'drag by detent'])
         + flow(['long-press', 'the keypad', 'type it'])
         + K.para('Load 20&ndash;140 by 2.5 &middot; reps 1&ndash;15 by 1 &middot; RPE 1&ndash;10 '
                  'by 1. Reference numerals appear <em>only</em> while editing load &mdash; they '
                  'mark the perimeter as live and cost 31pt of radius, so the ring is 330 at rest '
                  'and 290 whenever the tape is up.', '#6f6c66')
         + '</div>', span=2),

    spec('THE SHEETS', 'The SETS sheet is the <em>only</em> global view of the sets, and the '
         'secondary way to navigate between them. The exercises sheet is the same grammar one '
         'level up, and it opens from three places: the counter, the title, or the ladder. A row '
         'navigates, a grip reorders, a button at the foot adds. '
         '<b style="color:#c9c3b6;font-weight:500">There is no Edit-set button</b> &mdash; tapping '
         'a row goes there and you edit with the ring.',
         onground('<div class="grab"></div>'
                  + K.prows([K.lrow(namemeta('SET 3', '<span class="mono" style="font-size:11px;'
                                             'letter-spacing:0.08em;color:var(--lo)">'
                                             '105 KG &times; 8</span>'), grip=True),
                             K.lrow(namemeta('SET 4', '<span class="mono" style="font-size:11px;'
                                             'letter-spacing:0.08em;color:var(--lo)">'
                                             '105 KG &times; 8</span>'), grip=True)]))),

    spec('RPE IS UNSET, NOT 8', 'Most people do not know what RPE is and will never set it, so it '
         'must not arrive pre-filled with a value that then gets logged as if it were real. It '
         'ships hidden behind a switch, and an unset RPE logs as <code>null</code> &mdash; not as '
         'a number.',
         onground(K.prows([toggle('Track RPE', 'OFF BY DEFAULT', False)]))),

    spec('MOTION', 'Three durations and nothing else. Everything that moves picks one of them, so '
         'the app has a single tempo rather than a per-screen opinion.',
         '<div class="mrows">'
         + ''.join('<div class="mrow"><div class="mtop">'
                   '<span class="mono mn">' + n + '</span>'
                   '<span class="mbar" style="width:' + str(round(v / 380 * 148)) + 'px"></span>'
                   '<span class="mono mv">' + str(v) + 'ms</span></div>'
                   '<span class="muse">' + u + '</span></div>'
                   for n, v, u in [('fast', 140, 'a press, a toggle'),
                                   ('base', 240, 'a sheet, a section change'),
                                   ('slow', 380, 'the demo loop&rsquo;s frame swap')])
         + '</div>'),

    spec('WHAT IS DELIBERATELY ABSENT', 'Recorded so nobody re-adds it by accident. Each of these '
         'was drawn, argued, and cut.',
         '<div class="absent">'
         + ''.join('<div class="arow"><span class="mono an">' + n + '</span>'
                   '<span class="aw">' + w + '</span></div>'
                   for n, w in [
                       ('THE SET STRIP', 'Lab 29 proposed it; the sets live behind the SETS '
                                         'button and nowhere else.'),
                       ('THE RING&rsquo;S ARC AND KNOB', 'Lab 32 F3. Lines only &mdash; length '
                                                         'carries the fill, because a 1px hue '
                                                         'step is invisible at this scale.'),
                       ('BULLET GRAPHS', 'They need teaching. Nothing in this app needs teaching.'),
                       ('A RING WITHOUT A GOAL', 'Apple&rsquo;s rule: a ring must not decorate.'),
                       ('GLASS ON ANDROID', 'Researched and ruled out. An opaque raised plate '
                                            'instead &mdash; a platform switch, not a fallback.'),
                       ('EDITORIAL / SPACING-ALONE', 'Validated on the live screen, which has '
                                                     'almost no stacked text, and failed on the '
                                                     'sixteen screens that do.'),
                       ('A HISTORY LIST', 'The IA never had one. The calendar, the week strip, '
                                          'LAST THREE and the PR timeline all answer it, and all '
                                          'open the session detail.'),
                       ('DRAG-TO-REORDER GRIPS', 'The verbs are written and unused, so no grip is '
                                                 'drawn at all rather than drawn and inert.'),
                   ]) + '</div>', span=2),
])

# ==================================================================== page ==

EXTRA_CSS = """
  .ds{display:flex;flex-direction:column;gap:52px;max-width:1320px;padding-top:34px}
  .dsec{display:flex;flex-direction:column;gap:14px}
  .dhead{display:flex;align-items:center;gap:14px}
  .dlbl{font-size:11px;font-weight:600;letter-spacing:0.2em;color:#d9c9a8}
  .rule{flex:1;height:1px;background:rgba(255,255,255,0.11)}
  .dgloss{margin:0 0 6px;font-size:14px;line-height:1.7;color:#96938c;max-width:900px}
  .grid{display:grid;gap:11px;align-items:start}
  .card{background:#100f0d;border:1px solid rgba(255,255,255,0.07);border-radius:14px;
        padding:17px 18px 19px;display:flex;flex-direction:column;gap:13px;min-width:0}
  .chead{display:flex;flex-direction:column;gap:6px}
  .ctitle{font-size:11px;font-weight:600;letter-spacing:0.16em;color:#f0efec}
  .crule{font-size:13px;line-height:1.65;color:#8f8b83}
  .cbody{min-width:0}
  .stage{background:var(--ground);border-radius:11px;padding:14px 15px;
         background-image:radial-gradient(rgba(255,255,255,0.035) 1px,transparent 1px);
         background-size:18px 18px}
  .chrome{background:var(--ground);border-radius:11px;padding:10px 0 0;overflow:hidden}

  .row3{display:grid;grid-template-columns:repeat(3,1fr);gap:10px}
  .row4{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
  .swat{display:flex;flex-direction:column;gap:5px;min-width:0}
  .swn{font-size:11px;font-weight:500;color:var(--hi);letter-spacing:0.04em}
  .swv{font-size:11px;color:var(--dim)}
  .swnote{font-size:11px;line-height:1.5;color:#7d786e}

  .wash{display:flex;flex-direction:column;gap:7px}
  .wrow{display:flex;align-items:center;gap:10px}
  .wchip{width:34px;height:20px;border-radius:5px;flex:none;
         background-image:linear-gradient(45deg,#2a2720 25%,transparent 25%,transparent 75%,
         #2a2720 75%),linear-gradient(45deg,#2a2720 25%,transparent 25%,transparent 75%,#2a2720 75%);
         background-size:8px 8px;background-position:0 0,4px 4px}
  .wn{font-size:11px;color:var(--mid);width:56px;flex:none}
  .wv{font-size:11px;color:var(--dim)}

  .hair{display:flex;flex-direction:column;gap:11px}
  .hrow{display:flex;align-items:center;gap:11px}
  .hn{font-size:11px;color:var(--mid);width:66px;flex:none}
  .hline{flex:1;height:1px}
  .hv{font-size:11px;color:var(--dim);width:38px;text-align:right;flex:none}

  .ramp{display:flex;flex-direction:column;gap:0}
  .rstep{display:flex;align-items:baseline;gap:26px;padding:13px 0;
         border-bottom:1px solid rgba(255,255,255,0.06)}
  .rmeta{width:250px;flex:none;display:flex;flex-direction:column;gap:2px}
  .rname{font-size:11px;font-weight:600;letter-spacing:0.1em;color:#d9c9a8}
  .rnums{font-size:11px;color:var(--dim)}
  .ruse{font-size:11px;line-height:1.5;color:#7d786e}
  .rsample{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}

  .sbar{display:flex;align-items:center;gap:12px;padding:6px 0}
  .sblab{font-size:11px;color:var(--lo);letter-spacing:0.04em}
  .radgrid{display:grid;grid-template-columns:repeat(4,1fr);gap:9px}
  .radcell{display:flex;flex-direction:column;gap:5px}
  .radn{font-size:11px;color:var(--mid)}
  .radv{font-size:11px;color:var(--dim)}
  .tt{display:flex;flex-direction:column;gap:8px}
  .ttrow{display:flex;align-items:center;gap:11px}
  .ttl{font-size:11px;color:var(--lo);width:110px;flex:none}
  .ttbar{flex:1;height:100%;border-radius:7px}

  .stack{display:flex;flex-direction:column;gap:11px}
  .wrapr{display:flex;flex-wrap:wrap;gap:7px}
  .icons{display:grid;grid-template-columns:repeat(auto-fill,minmax(74px,1fr));gap:12px}
  .icell{display:flex;flex-direction:column;align-items:center;gap:7px;padding:11px 0;
         background:rgba(255,255,255,0.03);border-radius:9px}
  .icn{font-size:11px;color:var(--dim)}
  .ighost{opacity:0.5;border:1px dashed rgba(255,255,255,0.13);background:transparent}
  .ino{font-size:22px;line-height:22px;color:var(--dim)}

  .three{display:grid;grid-template-columns:repeat(3,1fr);gap:14px}
  .lvl{font-size:11px;font-weight:600;letter-spacing:0.14em;color:#d9c9a8;display:block;
       margin-bottom:3px}
  .lvlnote{font-size:11px;line-height:1.5;color:#7d786e;display:block;margin-bottom:10px}
  .rulerows{display:flex;flex-direction:column;gap:0}
  .rulerow{display:flex;align-items:center;gap:14px;padding:11px 0;
           border-bottom:1px solid rgba(255,255,255,0.06)}
  .rq{font-size:11px;letter-spacing:0.1em;color:var(--lo);width:172px;flex:none}
  .ra{font-size:13px;color:var(--mid)}
  .rv{flex:none}
  .hl{flex:1;height:1px;background:rgba(255,255,255,0.11)}
  .ladder{display:flex;flex-direction:column;gap:7px}
  .lt{height:3px;border-radius:2px;display:block}

  .gmap{display:flex;flex-direction:column;align-items:center;gap:9px;padding:6px 0}
  .grow{display:flex;align-items:center;gap:11px;width:100%;justify-content:center}
  .gcell{display:flex;flex-direction:column;align-items:center;gap:3px;font-size:16px;
         color:var(--lo);min-width:104px}
  .gcell span{font-size:11px;color:#7d786e;letter-spacing:0.03em}
  .gtop{min-width:0}
  .gcore{width:118px;height:118px;border-radius:9999px;display:flex;flex-direction:column;
         align-items:center;justify-content:center;gap:1px;
         border:1px solid rgba(228,198,140,0.30);background:rgba(228,198,140,0.05)}
  .gcore .mono{font-size:11px;letter-spacing:0.14em;color:var(--lo)}
  .gcore b{font-family:'Geist Mono',ui-monospace,monospace;font-size:34px;font-weight:600;
           color:var(--hi);letter-spacing:-0.03em}
  .gsub{font-size:11px;letter-spacing:0.1em;color:var(--dim)}

  .flow{display:flex;align-items:center;gap:9px;flex-wrap:wrap}
  .fstep{font-size:13px;color:var(--mid);background:rgba(255,255,255,0.05);
         padding:6px 11px;border-radius:8px}
  .fsep{font-size:13px;color:var(--dim)}
  .mrows{display:flex;flex-direction:column;gap:13px}
  .mrow{display:flex;flex-direction:column;gap:4px;min-width:0}
  .mtop{display:flex;align-items:center;gap:11px;min-width:0}
  .mn{font-size:11px;color:var(--mid);width:38px;flex:none}
  .mbar{height:6px;border-radius:3px;background:var(--accent);opacity:0.7;flex:none}
  .mv{font-size:11px;color:var(--dim);width:48px;flex:none;text-align:right}
  .muse{font-size:11px;line-height:1.45;color:#7d786e;padding-left:49px}
  .absent{display:flex;flex-direction:column;gap:0}
  .arow{display:flex;gap:16px;padding:10px 0;border-bottom:1px solid rgba(255,255,255,0.06)}
  .an{font-size:11px;letter-spacing:0.1em;color:#d9c9a8;width:230px;flex:none}
  .aw{font-size:13px;line-height:1.6;color:#8f8b83}
"""

BODY = ('<div class="ds">'
        + section('01 &nbsp; FOUNDATIONS',
                  'The tokens, and the two laws that shape every screen. These are the values in '
                  '<span style="color:#96938c">src/theme/tokens.ts</span>, which is the only file '
                  'in the app allowed a hex literal &mdash; screens import components, components '
                  'import the theme, and no screen sets a colour or a font size.',
                  SURFACES + '<div style="height:11px"></div>'
                  + '<div class="card">'
                    '<div class="chead"><span class="mono ctitle">THE TYPE RAMP</span>'
                    '<span class="crule">Geist and Geist Mono. Sans carries names and prose; mono '
                    'carries every number, every label and every unit &mdash; a number that '
                    'changes must not reflow the row beside it.</span></div>'
                    '<div class="cbody">' + TYPE + '</div></div>'
                  + '<div style="height:11px"></div>' + SPACING)
        + section('02 &nbsp; PRIMITIVES, IN EVERY STATE',
                  'One function per primitive in <span style="color:#96938c">kit.py</span>, one '
                  'component per primitive in <span style="color:#96938c">src/components/</span>. '
                  'A screen composes these and adds no style of its own &mdash; '
                  '<span style="color:#96938c">/dev/kitchen-sink</span> is this page running on '
                  'the device, and comparing the two is how a port gets checked.',
                  PRIMITIVES)
        + section('03 &nbsp; THE RULES, DRAWN',
                  'The decisions that are not visible in any single component, because they govern '
                  'how components are combined. These are the ones that get broken by accident.',
                  RULES)
        + section('04 &nbsp; INTERACTION AND MOTION',
                  'How the app behaves rather than how it looks. Mostly the live screen, because '
                  'it is the only screen with a gesture model &mdash; everywhere else, a row '
                  'navigates and a button acts.',
                  INTERACTION)
        + '</div>')

INTRO = (
  K.para('Forty-six boards decided things. <span style="color:#96938c">§0 of the handoff</span> '
         'holds those decisions as prose and <span style="color:#96938c">kit.py</span> holds them '
         'as code. Neither one lets you <em>see</em> the system.')
  + K.para('This board is the reference sheet: the tokens as swatches, every primitive in every '
           'state, the composition rules drawn rather than written, and the interaction model. '
           'Open it before building a screen, and amend it when a decision changes. '
           '<b style="color:#c9c3b6;font-weight:500">It holds no screens</b> &mdash; those are '
           'Labs 33&ndash;37 and 43&ndash;46. It holds what they are made of.', '#96938c')
  + K.para('Generated from <span style="color:#96938c">kit.py</span> and from the real values in '
           '<span style="color:#96938c">src/theme/tokens.ts</span> and '
           '<span style="color:#96938c">type.ts</span>, so it cannot drift from either. Edit the '
           'generator, never the HTML.', '#6f6c66'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">What is still provisional</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">The palette is V2, pending a look on real '
           'hardware.</b> It has now been on the device for several sessions and nothing has been '
           'reopened, but it was never formally signed off.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">The calendar&rsquo;s plate is undecided.</b> '
           'Its intensity fills were composited against a plate, so the ramp has to be recomputed '
           'before the calendar can move onto the canvas with everything else.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">K3 against K2 needs hardware and only '
           'hardware.</b> Lab 30 R4 settles the dial-over-ladder half with a mask. Whether a '
           'left-edge column fights the back gesture under a real thumb is unanswerable on a '
           'screenshot.')
  + K.para('<code>space.railAir</code> is still in the token file at 56 and is not in this board, '
           'because §0 retired it &mdash; <code>Rail</code> takes <code>air</code> as a required '
           'prop. The token is dead and should go.', '#6f6c66')
  + '</div>')

HTML = K.page(47, 'The design system', INTRO, [], BODY + CLOSING, EXTRA_CSS)
open('lab47.html', 'w').write(HTML)
print('wrote lab47.html', len(HTML))
