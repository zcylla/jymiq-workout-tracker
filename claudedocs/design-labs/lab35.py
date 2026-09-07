"""Lab 35 — Library and anatomy.

Exercise library, exercise detail, custom exercise, body map. The library is the
densest list in the app and the body map is the only screen that needs a drawing
rather than an instrument.
"""
import kit as K
import lab39            # the exercise screen is defined once, there

# --------------------------------------------------------------- B1 library --
FILTERS = [('ALL', True), ('BARBELL', False), ('DUMBBELL', False), ('MACHINE', False),
           ('BODYWEIGHT', False)]

EXERCISES = [
    ('Barbell Squat', 'QUADS &middot; GLUTES', 'BARBELL', '102.5', True),
    ('Barbell Bench Press', 'CHEST &middot; TRICEPS', 'BARBELL', '85', True),
    ('Romanian Deadlift', 'HAMS &middot; GLUTES', 'BARBELL', '80', True),
    ('Lat Pulldown', 'LATS &middot; BICEPS', 'MACHINE', '68', False),
    ('Leg Press', 'QUADS', 'MACHINE', '160', False),
    ('Seated Curl', 'BICEPS', 'DUMBBELL', '17.5', False),
    ('Standing Calf Raise', 'CALVES', 'MACHINE', '90', False),
]


def filt(label, on):
    return ('<div style="flex:none;padding:8px 13px;border-radius:11px;background:%s">'
            '<span class="mono" style="font-size:11px;letter-spacing:0.10em;color:%s">%s</span>'
            '</div>' % ('rgba(228,198,140,0.15)' if on else 'rgba(255,255,255,0.05)',
                        'var(--accent)' if on else 'var(--lo)', label))


def ex_row(name, muscles, kind, best, fav):
    star = ('<svg viewBox="0 0 16 16" style="width:12px;height:12px;flex:none" fill="var(--accent)">'
            '<path d="M8 1.5l1.9 3.9 4.3.6-3.1 3 .7 4.3L8 11.3 4.2 13.3l.7-4.3-3.1-3 4.3-.6z">'
            '</path></svg>') if fav else ''
    left = ('<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
            '<div class="r" style="gap:7px">' + star
            + '<span style="font-size:15px;color:var(--hi)">' + name + '</span></div>'
            '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
            + muscles + ' &middot; ' + kind + '</span></div>')
    right = ('<div style="display:flex;flex-direction:column;align-items:flex-end;gap:3px;'
             'margin-right:10px"><span class="mono lbl">BEST</span>'
             '<span class="num" style="font-size:13px;color:var(--mid)">' + best + '</span></div>')
    return K.lrow(left, right)


SEARCH = ('<div class="r" style="gap:10px;padding:11px 14px;border-radius:14px;'
          'background:rgba(255,255,255,0.05);min-height:44px">'
          + K.ico('search', 'var(--dim)', 1.7, 18)
          + '<span style="font-size:15px;color:var(--dim)">Search 214 exercises</span></div>')

B1 = K.phone(
    K.head('Library', 'EXERCISES')
    + K.psec('', SEARCH
            # bleeds past the 22pt margin: a chip cut by the screen edge reads as
            # "more to the right", a chip cut by a padding box reads as a bug.
            + '<div class="r" style="gap:6px;padding:4px 22px 0;margin:0 -22px;'
              'overflow-x:auto">'
            + ''.join(filt(*f) for f in FILTERS) + '</div>', first=True, plated=False)
    + K.psec('IN YOUR ROUTINES &middot; 18', K.prows([ex_row(*e) for e in EXERCISES[:3]]),
             plated=False)
    + K.psec('EVERYTHING ELSE &middot; 196', K.prows([ex_row(*e) for e in EXERCISES[3:]]),
             plated=False),
    active='session')

# ---------------------------------------------------------------- B2 detail --
# Round fourteen reopened this screen and Lab 39 answered it: demonstration and
# instruction above statistics, which is the order Strong, Hevy, Fitbod and JEFIT
# all use. Defining it twice is how two screens drift apart, so this is the one
# from Lab 39 verbatim.
B2 = lab39.q1()
B2B = lab39.q1(scroll=1180)     # the same screen, scrolled, so its tail is reviewable

# ---------------------------------------------------------------- B3 custom --
def field(label, value, placeholder=False):
    return ('<div style="display:flex;flex-direction:column;gap:6px;padding:7px 0">'
            '<span class="mono lbl">' + label + '</span>'
            '<div class="r" style="min-height:44px;gap:10px">'
            '<span style="font-size:17px;color:' + ('var(--dim)' if placeholder else 'var(--hi)')
            + '">' + value + '</span><span class="sp"></span>' + K.CHEV + '</div></div>')


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


MUSCLES = [('QUADS', True), ('GLUTES', True), ('HAMS', False), ('CALVES', False),
           ('CHEST', False), ('BACK', False), ('SHOULDERS', False), ('ARMS', False),
           ('CORE', False)]

B3 = K.phone(
    K.back_head('New exercise', 'CUSTOM')
    + K.psec('', K.prows([field('NAME', 'Pause Front Squat'),
                          field('EQUIPMENT', 'Barbell'),
                          field('DEFAULT REST', '3:00')]), first=True, plated=False)
    + K.psec('MUSCLES WORKED',
        '<div class="r" style="gap:6px;flex-wrap:wrap">' + ''.join(
            filt(m, on) for m, on in MUSCLES) + '</div>', plated=False)
    + K.psec('TRACKING', K.prows([
        toggle('Track RPE', 'OFF BY DEFAULT &middot; SEE SETTINGS', False),
        toggle('Count toward leg volume', 'FEEDS LOAD AND FATIGUE', True),
        toggle('Warm-up ramp', '40 / 60 / 75 / 85 %', True)]), plated=False),
    chrome=K.actionbar('Create exercise', 'CANCEL'))

# -------------------------------------------------------------- B4 body map --
# Fatigue by group, 0-1, decayed from recent volume (~48h half-life).
FATIGUE = {'chest': 0.22, 'delts': 0.48, 'arms': 0.35, 'abs': 0.10, 'quads': 0.86,
           'hams': 0.72, 'calves': 0.30, 'back': 0.55, 'glutes': 0.68}


def lerp_hex(a, b, t):
    a, b = a.lstrip('#'), b.lstrip('#')
    return '#%02x%02x%02x' % tuple(
        round(int(a[i:i+2], 16) + (int(b[i:i+2], 16) - int(a[i:i+2], 16)) * t) for i in (0, 2, 4))


def heat(v):
    """Neutral instrument grey to live red.

    The first pass used red at varying alpha, and every muscle read as red —
    a fresh chest at 0.26 alpha is still unmistakably red on a dark ground.
    Interpolating from --off means fresh muscles are genuinely neutral, so the
    ramp carries the reading instead of just the saturation.
    """
    return lerp_hex(K.OFF, K.LIVE, v)


def rr(x, y, w, h, r, key, F):
    return ('<rect x="%s" y="%s" width="%s" height="%s" rx="%s" fill="%s"></rect>'
            % (x, y, w, h, r, heat(F[key])))


def body(front=True):
    """Muscle groups as separated plates rather than a filled-in figure.

    Laid out on an explicit grid: shoulders span x 24-96, the centre line is 60,
    and every plate keeps a 2pt gap from its neighbour. The gaps are what make it
    read as a diagram — a continuous silhouette with colour poured in reads as a
    doll, and the first pass had the arms overlapping the chest.
    """
    F = FATIGUE
    p = ['<circle cx="60" cy="15" r="10" fill="none" stroke="rgba(255,255,255,0.22)" '
         'stroke-width="1"></circle>',
         '<rect x="55" y="25" width="10" height="7" rx="2" fill="rgba(255,255,255,0.10)"></rect>']
    # shoulders and arms are identical front and back
    p += [rr(24, 33, 16, 15, 7, 'delts', F), rr(80, 33, 16, 15, 7, 'delts', F),
          rr(22, 50, 14, 26, 6, 'arms', F), rr(84, 50, 14, 26, 6, 'arms', F),
          rr(20, 78, 13, 26, 5, 'arms', F), rr(87, 78, 13, 26, 5, 'arms', F)]
    if front:
        p += [rr(43, 34, 16, 20, 4, 'chest', F), rr(61, 34, 16, 20, 4, 'chest', F),
              rr(48, 56, 11, 38, 4, 'abs', F), rr(61, 56, 11, 38, 4, 'abs', F),
              rr(40, 58, 6, 34, 3, 'abs', F), rr(74, 58, 6, 34, 3, 'abs', F),
              rr(44, 98, 15, 46, 7, 'quads', F), rr(61, 98, 15, 46, 7, 'quads', F),
              rr(46, 148, 12, 34, 6, 'calves', F), rr(62, 148, 12, 34, 6, 'calves', F)]
    else:
        p += [rr(46, 32, 28, 12, 4, 'back', F),                       # traps
              rr(42, 46, 17, 34, 5, 'back', F), rr(61, 46, 17, 34, 5, 'back', F),   # lats
              rr(46, 82, 28, 12, 3, 'back', F),                       # lower back
              rr(44, 96, 32, 22, 8, 'glutes', F),
              rr(44, 121, 15, 38, 7, 'hams', F), rr(61, 121, 15, 38, 7, 'hams', F),
              rr(46, 162, 12, 28, 6, 'calves', F), rr(62, 162, 12, 28, 6, 'calves', F)]
    return '<svg viewBox="0 0 120 196" style="width:160px;height:261px">' + ''.join(p) + '</svg>'


def scale_row():
    steps = [0.0, 0.25, 0.5, 0.75, 1.0]
    sw = ''.join('<span style="flex:1;height:6px;background:%s"></span>' % heat(v) for v in steps)
    return ('<div style="display:flex;flex-direction:column;gap:6px">'
            '<div class="r" style="border-radius:3px;overflow:hidden">' + sw + '</div>'
            '<div class="r"><span class="mono lbl">FRESH</span><span class="sp"></span>'
            '<span class="mono lbl">NEEDS REST</span></div></div>')


GROUPS = [('Quads', 86, '18 SETS / 7 DAYS'), ('Hamstrings', 72, '12 SETS / 7 DAYS'),
          ('Glutes', 68, '14 SETS / 7 DAYS'), ('Back', 55, '16 SETS / 7 DAYS')]

B4 = K.phone(
    K.head('Body', 'FATIGUE')
    + K.psec('', '<div class="r" style="width:100%;justify-content:center;gap:4px">'
            + body(True) + body(False) + '</div>'
            + '<div class="r" style="width:100%;justify-content:center;gap:104px;padding-top:2px">'
              '<span class="mono lbl">FRONT</span><span class="mono lbl">BACK</span></div>'
            + '<div style="padding-top:14px">' + scale_row() + '</div>',
            first=True, plated=False)
    + K.psec('WORKED HARDEST', ''.join(
        K.lrow('<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
               '<span style="font-size:15px;color:var(--hi)">' + n + '</span>'
               '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
               + m + '</span></div>',
               '<div class="r" style="gap:10px;margin-right:10px">'
               '<span style="width:54px;height:5px;border-radius:3px;background:rgba(255,255,255,0.07);'
               'overflow:hidden;display:block"><span style="display:block;height:5px;width:'
               + str(v) + '%;background:' + K.LIVE + ';border-radius:3px"></span></span>'
               '<span class="num" style="font-size:13px;width:30px;text-align:right">' + str(v)
               + '%</span></div>', chev=False)
        for n, v, m in GROUPS), plated=False),
    active='strength')

COLS = [
 ('B1', 'Exercise library', 'The densest list in the app',
  'Search, a filter strip, then two groups &mdash; the eighteen you actually use, and the other one hundred and ninety-six. Every row carries the muscles, the equipment and your best.',
  'Splitting <em>yours</em> from <em>everything</em> is the whole design. A flat list of 214 sorted alphabetically would put Ab Wheel above Barbell Squat forever. The star is redundant with the grouping and stays anyway, because it is the affordance for changing the grouping. Restyled: every row is its own plate, while the search field and the chip strip stay on the canvas &mdash; both already draw their own edges, and plating the strip would kill the bleed that says it scrolls. This is the density case from Lab&nbsp;42 P4: seven rows hold up, and if a full library list starts reading as stripes this is the screen that will say so first.',
  B1),
 ('B2', 'Exercise detail', 'What this lift has done for you',
  'Demonstration, description, muscles, cues and common mistakes first; numbers, chart and rep maxes under them. This is Lab&nbsp;39&rsquo;s screen imported verbatim &mdash; defining it in two files is how two screens drift apart.',
  'The order is the finding: Strong, Hevy, Fitbod, JEFIT and Boostcamp all put demonstration and instruction above statistics, and the old version opened with four numbers &mdash; which answers a question you only have once you already know the lift. The chart carries its own y range, first and last x labels, the latest column in the accent with its value printed, and a label that states the takeaway; it sits on the canvas because a baseline and two axes are already a frame. <b>This screen is long and it should be</b> &mdash; roughly half of it is below the fold, which is what a reference screen looks like.',
  B2),
 ('B2\u2032', 'Exercise detail, scrolled', 'The half that is below the fold',
  'The same screen 1180pt down: your numbers, the labelled 1RM chart on the canvas, the rep-max table, and what to do next.',
  'Worth showing because the plating rule only becomes visible here &mdash; prose, tiles and the rep-max table are on plates, the chart is not, and the section labels are what carry the run of them. The screen is <b>1364pt of content in an 806pt frame</b>; that is a reference screen, not an overflow, and the tab bar is gone because it is pushed.',
  B2B),
 ('B3', 'Custom exercise', 'A form, without looking like one',
  'Label over value, 44pt tall, no boxes and no borders &mdash; each on its own plate, which is the boundary a borderless field cannot draw for itself. Muscles are the same chips as the library filters. Three toggles at the foot.',
  'This is where the row plate earns its keep hardest. A borderless field needs <em>something</em> to say where it starts and stops, and the row plate puts that edge exactly where the tap goes rather than around the group. The chip grid stays unplated: a chip is already a box. <b>Track RPE defaults to off</b> here, the same call as the live screen &mdash; most people do not know what RPE is and it should never arrive pre-filled.',
  B3),
 ('B4', 'Body map', 'The only screen that needs a drawing',
  'Front and back, muscle groups drawn as separated plates and shaded by fatigue decayed from recent volume on a 48-hour half-life. The figure and its scale sit on the canvas; only the list under them is plated.',
  'Two things went wrong before this worked, both worth recording. Red at varying opacity made every muscle read as red &mdash; a fresh chest at 0.26 alpha is still unmistakably red on a dark ground, so the ramp now interpolates from <b>--off</b> and fresh muscles are genuinely neutral. And the first figures had the arms overlapping the chest; the plates are now on an explicit grid with a 2pt gap between every neighbour, which is also what stops it reading as a doll. <b>This is the least resolved drawing on the four boards</b> &mdash; it is legible and on-palette, but it is closer to a diagram of a person than a good one, and it is the piece most likely to want another pass. The scale reads FRESH to NEEDS REST rather than a percentage because a fatigue number is a model output; the actual numbers live in the list.',
  B4),
]

INTRO = (
  K.para('The library, the exercise record, the custom-exercise form and the body map. Second of '
         'four boards; everything is built from <span style="color:#96938c">kit.py</span>.')
  + K.para('Restyled to M4, and the plating rule sorts these four cleanly: <b style="color:#c9c3b6;'
           'font-weight:500">plate</b> the lists, the fields and the toggles; <b '
           'style="color:#c9c3b6;font-weight:500">leave on the canvas</b> the search field, the '
           'chip strips, the chart and the body figure, all of which already draw their own '
           'edges &mdash; and, since Lab&nbsp;42, every list row carries its own plate rather '
           'than sharing one.', '#96938c')
  + K.para('The exercise screen is no longer defined here &mdash; it is Lab&nbsp;39&rsquo;s, '
           'imported. It was the one screen round fourteen reopened on content rather than '
           'treatment, and keeping a second copy in this file would have quietly forked it.',
           '#6f6c66'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">Two new patterns, and what they cost</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">A field is a label over a value.</b> Mono '
           'label at 11px, value at 17px, 44pt tall, chevron if it opens a picker. No box, no '
           'underline, no filled input &mdash; the row plate is the only boundary, and it is '
           'enough. It works because the label is always present; a floating-label input would '
           'need a box of its own to explain itself.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">A chip is a chip.</b> The library filters and '
           'the muscle selector are the same component at the same size; there is no reason for '
           'them to differ and one fewer thing to draw.')
  + K.para('The body map is the one place the palette gains a job it did not have: <b '
           'style="color:#c9c3b6;font-weight:500">live red now also means accumulated fatigue</b>. '
           'That is defensible &mdash; both readings are &ldquo;this is hot, pay attention&rdquo; '
           '&mdash; but it is worth naming rather than letting it happen quietly. If it turns out '
           'to fight the live-session red, the map is the one that should move.', '#6f6c66')
  + '</div>')

HTML = K.page(35, 'Library and anatomy', INTRO, [('', '', COLS)], CLOSING)
open('lab35.html', 'w').write(HTML)
print('wrote lab35.html', len(HTML))
