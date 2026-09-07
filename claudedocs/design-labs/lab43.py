"""Lab 43 — Today, and the Android chrome.

Two things implementation needs that no board has drawn.

1. **Today.** The landing screen is the one screen never redrawn in the settled
   style — it only ever existed in the champagne file and Lab 03. It is also the
   screen seen most often, and the only one whose empty state matters, because it
   is what a fresh install opens on.

2. **The tab bar on Android.** The build is Android first. `expo-glass-effect` is
   iOS 26 only and degrades to a plain View everywhere else, so the "one
   continuous glass plane" has no Android equivalent and needs a decision rather
   than a fallback nobody looked at.

T1 is the screen as designed. T2 is the same screen with only what v1 can
actually fill. T3 is the empty state. T4 is the chrome.
"""
import kit as K

WEEK = [('MON', 'Lower A', 'done'), ('TUE', 'Upper A', 'done'), ('WED', 'Rest', 'rest'),
        ('THU', 'Lower B', 'today'), ('FRI', 'Upper B', 'next'), ('SAT', 'Arms', 'next'),
        ('SUN', 'Rest', 'rest')]


def daystrip(days=WEEK, names=True):
    out = []
    for d, r, st in days:
        if st == 'done':    dc, rc, bg = K.DONE, 'var(--mid)', 'transparent'
        elif st == 'today': dc, rc, bg = K.ACCENT, 'var(--hi)', 'rgba(228,198,140,0.13)'
        elif st == 'rest':  dc, rc, bg = 'var(--dim)', 'var(--dim)', 'transparent'
        else:               dc, rc, bg = 'var(--lo)', 'var(--mid)', 'transparent'
        label = ('<span style="font-size:11px;color:' + rc + ';text-align:center;line-height:1.3">'
                 + r + '</span>') if names else (
                 '<span style="width:7px;height:7px;border-radius:9999px;background:'
                 + (K.DONE if st == 'done' else
                    K.ACCENT if st == 'today' else 'rgba(255,255,255,0.10)') + '"></span>')
        out.append('<div style="flex:1;min-width:0;display:flex;flex-direction:column;'
                   'align-items:center;gap:7px;padding:8px 0;border-radius:10px;background:'
                   + bg + '">'
                   '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:'
                   + dc + '">' + d + '</span>' + label + '</div>')
    return '<div class="r" style="width:100%;gap:2px;align-items:stretch">' + ''.join(out) + '</div>'


# ---------------------------------------------------------------- the hero --
def next_card(kicker, name, meta, lifts, cta='TAP TO OPEN'):
    """The one plated hero. A screen gets two or three plated things; on Today
    this is the first, because it answers the only question the screen is for."""
    return ('<div class="r" style="gap:10px"><span class="lbl">' + kicker + '</span>'
            '<span class="sp"></span><span class="mono lbl">' + cta + '</span>' + K.CHEV + '</div>'
            '<div class="r" style="gap:10px;padding-top:2px">'
            '<span class="h1" style="font-size:26px">' + name + '</span></div>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.07em;color:var(--lo)">'
            + meta + '</span>'
            '<div style="display:flex;flex-direction:column;gap:5px;padding-top:9px">'
            + ''.join('<div class="r" style="gap:9px">'
                      '<span class="mono" style="width:18px;font-size:11px;color:var(--dim)">'
                      + i + '</span>'
                      '<span style="font-size:14px;color:var(--mid)">' + n + '</span>'
                      '<span class="sp"></span>'
                      '<span class="mono" style="font-size:11px;color:var(--lo)">' + s + '</span>'
                      '</div>' for i, n, s in lifts) + '</div>')


LIFTS = [('01', 'Barbell Squat', '5 &times; 8 @ 102.5'),
         ('02', 'Romanian Deadlift', '4 &times; 10 @ 80'),
         ('03', 'Leg Press', '4 &times; 12 @ 160')]

TILES_FULL = K.tiles([('SESSIONS', '3', K.meter(3 / 4.0, w=44), K.HI),
                      ('VOLUME', '18.4 T', K.delta('+9%'), K.HI)], tone='raised')

RAIL_EVENTS = [
    (K.ACCENT, '<div class="r" style="gap:9px"><span class="num" style="font-size:15px">'
               'Tue 2 Sep</span>' + K.pill('PR') + '<span class="sp"></span>'
               '<span class="mono" style="font-size:13px;color:var(--mid)">8.6 T</span></div>'
               '<span class="mono" style="font-size:11px;color:var(--lo)">LOWER A &middot; '
               '64 MIN &middot; 20 SETS</span>'),
    (K.TICK2, '<div class="r" style="gap:9px"><span class="num" style="font-size:15px">'
              'Mon 1 Sep</span><span class="sp"></span>'
              '<span class="mono" style="font-size:13px;color:var(--mid)">7.4 T</span></div>'
              '<span class="mono" style="font-size:11px;color:var(--lo)">UPPER A &middot; '
              '58 MIN &middot; 18 SETS</span>'),
    (K.TICK1, '<div class="r" style="gap:9px"><span class="num" style="font-size:15px;'
              'color:var(--mid)">Fri 29 Aug</span><span class="sp"></span>'
              '<span class="mono" style="font-size:13px;color:var(--mid)">8.1 T</span></div>'
              '<span class="mono" style="font-size:11px;color:var(--lo)">LOWER B &middot; '
              '61 MIN &middot; 20 SETS</span>'),
]

RAIL = K.rail(RAIL_EVENTS, air=22)


def pr_row(name, kind, value, when):
    return ('<div class="lrow" style="gap:11px">' + K.pill('PR')
            + '<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
              '<span style="font-size:15px;color:var(--hi)">' + name + '</span>'
              '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
            + kind + '</span></div><span class="sp"></span>'
              '<span class="num" style="font-size:15px;color:var(--accent)">' + value + '</span>'
              '<span class="mono lbl" style="width:48px;text-align:right">' + when + '</span>'
              '</div>')


PRS = K.prows([pr_row('Barbell Squat', 'BEST ESTIMATED 1RM &middot; WAS 128', '130', '2 SEP'),
               pr_row('Bench Press', 'HEAVIEST &middot; WAS 85 &times; 3', '87.5', '1 SEP')])

HEAD = K.head('Today', 'THU 4 SEP', K.ico('gear', 'var(--lo)', 1.7))

# ------------------------------------------------------- T1 as designed ----
T1 = K.phone(
    HEAD
    + K.psec('', next_card('NEXT UP &middot; PPL 6-DAY', 'Lower B',
                           '5 LIFTS &middot; ~60 MIN &middot; LAST DONE FRI 29 AUG', LIFTS),
             first=True, pad=15)
    + K.psec('THIS WEEK', daystrip() + '<div style="height:4px"></div>' + TILES_FULL, pad=13)
    + K.psec('RECENT', RAIL, plated=False),
    active='today')

# ------------------------------------------------------------ T2 what v1 has --
# No programs in v1, so there is no "next session" to compute. The hero becomes
# the thing you actually do: pick up the routine you ran least recently.
V1_LIFTS = [('01', 'Barbell Squat', '5 &times; 8 @ 102.5'),
            ('02', 'Romanian Deadlift', '4 &times; 10 @ 80'),
            ('03', 'Leg Press', '4 &times; 12 @ 160')]

V1_WEEK = [(d, r, ('done' if st == 'done' else 'today' if st == 'today' else 'rest'))
           for d, r, st in WEEK]

T2 = K.phone(
    HEAD
    + K.psec('', next_card('LAST RUN 5 DAYS AGO', 'Lower B',
                           '5 LIFTS &middot; ~60 MIN &middot; 3 OF 4 THIS WEEK', V1_LIFTS,
                           cta='START'), first=True, pad=15)
    + K.psec('THIS WEEK', daystrip(V1_WEEK, names=False)
             + '<div style="height:4px"></div>' + TILES_FULL, pad=13)
    + K.psec('RECENT', RAIL, plated=False),
    active='today')

# ---------------------------------------------------------- T3 empty state --
EMPTY_ROWS = K.prows([
    K.lrow('<div style="display:flex;flex-direction:column;gap:3px">'
           '<span style="font-size:15px;color:var(--hi)">Build a routine</span>'
           '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
           'PICK LIFTS, SETS AND REST</span></div>'),
    K.lrow('<div style="display:flex;flex-direction:column;gap:3px">'
           '<span style="font-size:15px;color:var(--hi)">Browse the library</span>'
           '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
           '214 EXERCISES, OR ADD YOUR OWN</span></div>'),
    K.lrow('<div style="display:flex;flex-direction:column;gap:3px">'
           '<span style="font-size:15px;color:var(--hi)">Start an empty session</span>'
           '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
           'DECIDE AS YOU GO</span></div>'),
])

T3 = K.phone(
    K.head('Today', 'THU 4 SEP', K.ico('gear', 'var(--lo)', 1.7))
    + K.psec('', '<span style="font-size:17px;line-height:1.5;color:var(--hi)">Nothing logged '
             'yet.</span>'
             '<span style="font-size:14px;line-height:1.6;color:var(--lo)">The week strip, your '
             'records and the last-three list fill in as you train. Start with a routine or just '
             'open a session and log as you go.</span>',
             first=True, plated=False)
    + K.psec('FIRST STEPS', EMPTY_ROWS, plated=False)
    + K.psec('THIS WEEK', daystrip([(d, r, 'rest') for d, r, _ in WEEK], names=False)
             + '<div style="height:4px"></div>'
             + K.tiles([('SESSIONS', '0', '', K.LO), ('VOLUME', '&mdash;', '', K.LO)],
                       tone='raised'), pad=13),
    active='today')

# ------------------------------------------------------------- T4 chrome ----
T4 = K.phone(
    HEAD
    + K.psec('', next_card('LAST RUN 5 DAYS AGO', 'Lower B',
                           '5 LIFTS &middot; ~60 MIN &middot; 3 OF 4 THIS WEEK', V1_LIFTS,
                           cta='START'), first=True, pad=15)
    + K.psec('THIS WEEK', daystrip(V1_WEEK, names=False)
             + '<div style="height:4px"></div>' + TILES_FULL, pad=13)
    + K.psec('RECENT', RAIL, plated=False),
    active='today', surface='raised')


def bar_sample(label, note, surface):
    """One bar over the real field and bloom, so the material is judged against
    what actually sits behind it rather than against flat black."""
    return ('<div style="display:flex;flex-direction:column;gap:9px">'
            '<div class="r" style="gap:9px"><span class="lbl">' + label + '</span>'
            '<span style="flex:1;height:1px;background:rgba(255,255,255,0.10)"></span></div>'
            '<div style="position:relative;height:150px;border-radius:22px;overflow:hidden;'
            'background:var(--ground);border:1px solid rgba(255,255,255,0.08);'
            'display:flex;flex-direction:column;justify-content:flex-end">'
            '<div class="field"></div>'
            '<div class="bloom" style="top:-40px;right:-30px;width:240px;height:200px;'
            'background:rgba(228,198,140,0.16)"></div>'
            '<div style="position:relative;z-index:2;padding:0 22px 14px;display:flex;'
            'flex-direction:column;gap:7px">'
            '<div class="r" style="gap:9px">'
            '<span class="num" style="font-size:15px">Tue 2 Sep</span>'
            '<span class="sp"></span>'
            '<span class="mono" style="font-size:13px;color:var(--mid)">8.6 T</span></div>'
            '<div class="r" style="gap:9px">'
            '<span class="num" style="font-size:15px;color:var(--mid)">Mon 1 Sep</span>'
            '<span class="sp"></span>'
            '<span class="mono" style="font-size:13px;color:var(--mid)">7.4 T</span></div></div>'
            + K.nav('today', surface).replace('margin:0 16px 30px', 'margin:0 16px 14px')
            + '</div>'
            '<span class="mono" style="font-size:11px;line-height:1.6;color:#7d786e">' + note
            + '</span></div>')


CHROME = ('<div style="display:flex;flex-direction:column;gap:26px;width:402px">'
          + bar_sample('N1 &middot; iOS 26, GLASS', 'The original. Blur plus saturation over a '
                       'moving field. Not available on Android at all.', 'glass')
          + bar_sample('N2 &middot; ANDROID, RAISED PLATE', 'The plate colour, one step up from '
                       'the canvas, with the M4 lit edge and a heavier shadow doing the '
                       'separating that blur did. My pick.', 'raised')
          + bar_sample('N3 &middot; ANDROID, PANEL', 'The darker plate. Quieter and closer to the '
                       'ground, but the fade above it has less to work against.', 'panel')
          + '</div>')

COLS = [
 ('T1', 'Today, as designed', 'What the screen is for',
  'One plated hero answering &ldquo;what am I doing today&rdquo;, the week beneath it, the last two sessions on the rail, and any new records.',
  'The hero is the whole screen. Everything under it is confirmation, ordered by how often you would actually look: the next session every day, the week most days, the rail sometimes. <b>Two plated things</b> &mdash; the hero and the week block &mdash; and the rail on the canvas, because it has a spine of its own. A fourth section of new records was drawn and cut: the rail already carries a PR pill on the session that set one, so it said the same thing twice, and it was the section that fell off the bottom. The full timeline lives on Strength, which is where you go to <em>read</em> records rather than to be told there is one.',
  T1),
 ('T2', 'Today, on v1 data', 'The same screen without programs',
  'Identical layout. The hero becomes the routine you ran least recently rather than a scheduled session, the week strip loses its planned days, and everything else is unchanged.',
  'Worth drawing because v1 has no programs, so <em>next session</em> cannot be computed &mdash; and a hero that says &ldquo;nothing scheduled&rdquo; would waste the best space on the screen. Naming the last run and offering START keeps the same shape and the same tap. The strip drops routine names for dots, and <b>the dots read better than T1&rsquo;s names do</b>: seven routine names at 11px across 356pt is the densest text on either screen and the least useful &mdash; you know what your own program is. If the dots hold up on the device, T1 should take them too and the names should live on the Session tab.',
  T2),
 ('T3', 'The empty state', 'What a fresh install opens on',
  'No sessions, no routines, no records. A sentence saying so, three first steps as row plates, and the week strip still present but empty.',
  'This is the screen most apps get wrong and it is the first one anyone sees. Two rules: <b>never show a blank where a component will later be</b> &mdash; the strip stays, empty and dim, so its arrival is not a surprise &mdash; and <b>the empty state is a set of actions, not an apology</b>. Three routes out, in the order a new user would take them. No illustration: the identity has never carried one.',
  T3),
 ('T4', 'Today on Android', 'The same screen, no glass',
  'T2 with the opaque bar in place of the glass one. This is what the build actually ships first.',
  'The difference is smaller than expected, because the bar was already 92% opaque and the fade above it was doing most of the separating. What is lost is the saturation lift where the bloom passes behind the bar &mdash; visible on the comparison to the right, and only there.',
  T4),
 ('N', 'The chrome, compared', 'Glass versus two opaque plates',
  'The same bar over the same field and bloom, three ways. Judge the material here rather than on the screen, where the content dominates.',
  'The bar is the one place the design leaned on a platform feature that Android does not have. <b>N2 is my pick</b>: the raised plate is the same step the plates use, so the bar reads as part of the system rather than as a special case, and the lit edge is already the vocabulary. N3 is defensible but sits so close to the ground that the fade has nothing to resolve against. Blur is available on Android through <span style="color:#96938c">expo-blur</span>&rsquo;s Dimezis backend, at a real frame cost &mdash; worth trying only if N2 reads dead on the device.',
  CHROME),
]

INTRO = (
  K.para('Two gaps that block implementation, both drawn from <span style="color:#96938c">'
         'kit.py</span> like every other board.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Today has never been drawn in this style.</b> '
           'It existed in the champagne file and in Lab&nbsp;03, and every round since has been '
           'about other screens. It is the landing screen, so it is the one seen most, and it is '
           'the only screen whose <em>empty</em> state is what a fresh install opens on.',
           '#96938c')
  + K.para('<b style="color:#c9c3b6;font-weight:500">The build is Android first.</b> '
           '<span style="color:#96938c">expo-glass-effect</span> is iOS&nbsp;26 only and silently '
           'renders a plain view everywhere else, so the tab bar&rsquo;s glass plane needs an '
           'Android answer rather than an accidental one. Column N compares three.', '#96938c'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">What this settles for the build</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">Today is one hero and two confirmations.</b> '
           'The hero is the only thing that changes shape between v1 and later: a scheduled session '
           'once programs exist, the least-recently-run routine until then. The week block and the '
           'rail are the same component in both.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">A screen earns its sections by what it is '
           'asked.</b> The records section was cut here not for space but because the rail already '
           'answered it &mdash; and space is how that became obvious. When a section falls below '
           'the fold, check whether it is duplicating something above it before making room.',
           '#6f6c66')
  + K.para('<b style="color:#c9c3b6;font-weight:500">The empty state ships with the screen, not '
           'after it.</b> Components that will fill in stay visible and dim rather than being '
           'hidden, so the layout a new user learns is the layout they keep.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Android chrome is the raised plate</b>, with '
           'the same lit edge as everything else and a heavier shadow. The iOS glass version stays '
           'in the code behind a platform switch, unverified until there is a device to see it on.',
           '#6f6c66')
  + '</div>')

HTML = K.page(43, 'Today, and the Android chrome', INTRO, [('', '', COLS)], CLOSING)
open('lab43.html', 'w').write(HTML)
print('wrote lab43.html', len(HTML))
