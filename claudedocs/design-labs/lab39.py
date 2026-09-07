"""Lab 39 — Applied. The exercise screen and the calendar.

The two screens named directly, rebuilt on Lab 38's containment, plus the chart
labelling fix. The exercise screen also gains everything it was missing:
demonstration, description, muscles, cues.
"""
import kit as K

# =========================================================== Q1 exercise ======
# 3-frame line art, the shape the CC BY-SA sets ship in. Drawn here as a
# schematic figure so the board shows the treatment, not the final asset.
def slot(label):
    """An asset placeholder, not a drawing.

    The first pass hand-drew stick figures and they were clumsy. Drawing bad art
    to stand in for good art misrepresents the design — the real assets are the
    CC BY-SA line-art set, three frames per exercise, and the only thing this
    board needs to decide is how much room they get and where they sit.
    """
    return ('<div style="flex:1;min-width:0;display:flex;flex-direction:column;gap:7px;'
            'align-items:center">'
            '<div style="width:100%;aspect-ratio:3/4;border-radius:10px;'
            'background:rgba(255,255,255,0.035);'
            'border:1px dashed rgba(255,255,255,0.16);display:flex;align-items:center;'
            'justify-content:center">'
            '<svg viewBox="0 0 24 24" style="width:22px;height:22px" fill="none" '
            'stroke="rgba(255,255,255,0.26)" stroke-width="1.5" stroke-linecap="round" '
            'stroke-linejoin="round">'
            '<rect x="3" y="4" width="18" height="16" rx="2"></rect>'
            '<circle cx="8.5" cy="9.5" r="1.6"></circle>'
            '<path d="M21 15l-5-5-6.5 6.5L7 14l-4 4"></path></svg></div>'
            '<span class="mono lbl">' + label + '</span></div>')


DEMO = ('<div class="r" style="gap:9px;align-items:stretch;padding:2px 0">'
        + ''.join(slot(n) for n in ['SET UP', 'DESCEND', 'BOTTOM'])
        + '</div>')

MUSCLES = [('Quadriceps', True), ('Glutes', True), ('Hamstrings', False),
           ('Spinal erectors', False), ('Adductors', False)]

MUSCLE_BLOCK = ('<div class="r" style="gap:7px;flex-wrap:wrap">' + ''.join(
    '<div style="flex:none;padding:7px 11px;border-radius:10px;background:%s">'
    '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:%s">%s</span></div>'
    % ('rgba(228,198,140,0.16)' if p else 'rgba(255,255,255,0.06)',
       'var(--accent)' if p else 'var(--lo)', n.upper())
    for n, p in MUSCLES)
    + '</div>'
    '<div class="r" style="gap:14px;padding-top:3px">'
    '<span class="r" style="gap:6px"><span style="width:9px;height:9px;border-radius:3px;'
    'background:rgba(228,198,140,0.55)"></span>'
    '<span class="mono lbl">PRIME MOVER</span></span>'
    '<span class="r" style="gap:6px"><span style="width:9px;height:9px;border-radius:3px;'
    'background:rgba(255,255,255,0.14)"></span>'
    '<span class="mono lbl">ASSISTS</span></span></div>')

CUES = ''.join(
    '<div class="r" style="gap:11px;align-items:flex-start;padding:5px 0">'
    '<span class="mono" style="width:16px;flex:none;font-size:11px;color:var(--accent);'
    'padding-top:2px">' + str(i + 1) + '</span>'
    '<span style="font-size:14px;line-height:1.5;color:var(--mid)">' + t + '</span></div>'
    for i, t in enumerate([
        'Bar on the rear delts, not the neck. Squeeze the shoulder blades to build the shelf.',
        'Break at the hips and knees together. Knees track over the middle toes.',
        'Descend until the hip crease passes the top of the knee, then drive the floor away.']))

MISTAKES = ''.join(
    '<div class="r" style="gap:11px;align-items:flex-start;padding:5px 0">'
    '<span style="width:16px;flex:none;padding-top:3px">'
    '<span style="display:block;width:9px;height:9px;border-radius:9999px;'
    'background:rgba(223,84,65,0.75)"></span></span>'
    '<span style="font-size:14px;line-height:1.5;color:var(--mid)">' + t + '</span></div>'
    for t in ['Knees collapsing inward under load — widen the stance or drop the weight.',
              'Heels lifting. Usually ankle mobility, not effort.'])

# --- the chart, with the labelling the last one was missing -------------------
E1RM = [112, 116, 114, 119, 121, 124, 122, 126, 128, 130]


# Read-only rows are 34pt, not 44 — the hit-area floor is for targets, and a
# rep-max table is a table.
REP_MAXES = ''.join(
    '<div class="lrow" style="min-height:34px;padding:4px 0">'
    '<span style="font-size:15px;color:var(--mid)">' + n + '</span><span class="sp"></span>'
    '<span class="num" style="font-size:15px">' + v + '</span>'
    '<span class="mono lbl" style="width:58px;text-align:right">' + d + '</span></div>'
    for n, v, d in [('1RM', '130', 'EST'), ('3RM', '120', 'EST'),
                    ('5RM', '112', '2 SEP'), ('8RM', '105', '19 AUG')])

# A model output is a sentence, never a number drawn like one you lifted.
NEXT = ('<div style="display:flex;flex-direction:column;gap:8px">'
        '<span style="font-size:17px;line-height:1.45;color:var(--hi)">Add 2.5&nbsp;kg next '
        'session.</span>'
        '<span style="font-size:13px;line-height:1.6;color:var(--lo)">Three sessions in a row at '
        'RPE&nbsp;8 or below, and estimated 1RM has climbed every time. Nothing here looks like a '
        'stall.</span></div>')


def q1(scroll=0):
  return K.phone(
    K.back_head('Barbell Squat', 'BARBELL &middot; COMPOUND', K.ico('dots', 'var(--mid)', 1.7))
    + K.psec('', DEMO
             + '<div class="r" style="justify-content:center;gap:7px;padding-top:2px">'
               '<span class="mono lbl">TAP TO PLAY &middot; 3-FRAME LOOP</span></div>',
             tone='raised', first=True)
    + K.psec('', '<span style="font-size:15px;line-height:1.55;color:var(--mid)">The barbell back '
             'squat loads the whole lower body through a deep knee and hip bend. It is the '
             'reference lift for leg strength and the one most programmes build around.</span>',
             plated=False)
    + K.psec('MUSCLES', MUSCLE_BLOCK, tone='raised')
    + K.psec('HOW TO', CUES, plated=False)
    + K.psec('COMMON MISTAKES', MISTAKES, plated=False)
    + K.psec('YOUR NUMBERS', K.tiles([
        ('BEST e1RM', '130', K.delta('+2'), K.ACCENT),
        ('TOP SET', '102.5', '', K.HI),
        ('SESSIONS', '34', '<span class="mono lbl">/ 12 WK</span>', K.HI),
        ('FREQUENCY', '1.4', '<span class="mono lbl">/ WK</span>', K.HI)],
        tone='raised'), tone='raised')
    # The chart has a baseline and two axes of its own, so it sits on the canvas.
    + K.psec('ESTIMATED 1RM &middot; UP 18 KG OVER 10 SESSIONS',
             K.chart(E1RM, '10 AGO', 'TODAY', w=316), plated=False)
    + K.psec('REP MAXES', REP_MAXES, plated=False)
    + K.psec('WHAT TO DO NEXT', NEXT, plated=False),
    chrome=K.actionbar('Add to routine', 'LOG'), scroll=scroll)


Q1 = q1()

# =========================================================== Q2 calendar ======
# September 2026 starts on a Tuesday. Adjacent-month days are DIMMED, not
# omitted — an omitted leading cell reads as a bug, which is what the first
# version did.
LEAD = [31]                      # Mon 31 Aug
SEPT = [0, 2, 3, 0, 2, 1, 0,     # 9 = planned but missed
        0, 3, 2, 9, 3, 2, 0,
        0, 2, 3, 0, 2, 0, 1,
        0, 3, 2, 0, 3, 0, 0,
        0, 2]
TRAIL = [1, 2, 3, 4]             # Thu-Sun 1-4 Oct
TODAY_I = 5   # today is a rest day; a day cannot be today AND missed

# Three steps and no more. Composited against the PLATE (#221f19), not the
# canvas. The ink flips only at the top step and the threshold is measured: gold
# at 0.38 lands near #6d6045 where dark ink is ~2.4:1, under the floor; at 0.75
# it lands near #b39a6e where dark ink is ~7:1.
FILL = {1: 'rgba(228,198,140,0.16)', 2: 'rgba(228,198,140,0.38)', 3: 'rgba(228,198,140,0.75)'}
INK = {1: 'var(--mid)', 2: 'var(--hi)', 3: '#171208'}
REST = 'rgba(255,255,255,0.035)'


def cell(n, v, today=False, out=False):
    """v: 0 rest, 1-3 trained, 9 planned and missed.

    Rest and missed must not look the same. A planned rest day is a decision; a
    missed session is a lapse, and the first version drew both as the same faint
    plate — the mistake Duolingo avoids with a freeze icon versus a blank.
    """
    mark = ''
    if out:
        bg, ink = 'transparent', 'var(--dim)'
        style = 'opacity:0.4'
    elif v == 9:
        bg, ink, style = REST, 'var(--lo)', ''
        mark = ('<span style="position:absolute;bottom:5px;left:50%;margin-left:-2.5px;'
                'width:5px;height:5px;border-radius:9999px;'
                'border:1px solid rgba(223,84,65,0.85)"></span>')
    elif v == 0:
        bg, ink, style = REST, 'var(--dim)', ''
    else:
        bg, ink, style = FILL[v], INK[v], ''
    ring = 'box-shadow:0 0 0 1.5px var(--accent);' if today else ''
    return ('<div style="position:relative;aspect-ratio:1;display:flex;align-items:center;'
            'justify-content:center;border-radius:8px;background:' + bg + ';' + ring + style + '">'
            '<span class="mono" style="font-size:11px;'
            + ('font-weight:600;' if v not in (0, 9) and not out else '')
            + 'color:' + ink + '">' + str(n) + '</span>' + mark + '</div>')


def month():
    heads = ''.join('<div style="display:flex;align-items:center;justify-content:center;'
                    'padding-bottom:3px">'
                    '<span class="mono lbl" style="font-size:11px">' + d + '</span></div>'
                    for d in ['M', 'T', 'W', 'T', 'F', 'S', 'S'])
    grid = (''.join(cell(n, 0, out=True) for n in LEAD)
            + ''.join(cell(i + 1, v, today=(i == TODAY_I)) for i, v in enumerate(SEPT))
            + ''.join(cell(n, 0, out=True) for n in TRAIL))
    key = ('<div class="r" style="gap:6px;padding-top:11px;flex-wrap:wrap">'
           '<span class="mono lbl">LIGHT</span>'
           + ''.join('<span style="width:15px;height:9px;border-radius:2px;background:'
                     + FILL[v] + '"></span>' for v in (1, 2, 3))
           + '<span class="mono lbl">HARD</span>'
             '<span class="sp"></span>'
             '<span class="r" style="gap:5px"><span style="width:9px;height:9px;'
             'border-radius:9999px;border:1px solid rgba(223,84,65,0.85)"></span>'
             '<span class="mono lbl">MISSED</span></span>'
             '<span class="r" style="gap:5px;margin-left:11px"><span style="width:10px;'
             'height:10px;border-radius:3px;background:' + REST + '"></span>'
             '<span class="mono lbl">REST</span></span></div>')
    return ('<div style="display:grid;grid-template-columns:repeat(7,1fr);gap:4px">'
            + heads + grid + '</div>' + key)


WEEKS = [('WEEK 36', '4 SESSIONS', '18.4', 0.83), ('WEEK 35', '5 SESSIONS', '22.1', 1.0),
         ('WEEK 34', '3 SESSIONS', '13.8', 0.62)]

Q2 = K.phone(
    K.head('September', 'CALENDAR', K.ico('cal', 'var(--lo)', 1.7))
    + K.psec('', month()
             # Summary as one line of text, not a second chart competing with the
             # grid for the same attention.
             + '<div class="r" style="gap:8px;padding-top:12px">'
               '<span style="font-size:15px;color:var(--mid)">Trained</span>'
               '<span class="num" style="font-size:15px;color:var(--hi)">12 of 30</span>'
               '<span style="width:1px;height:13px;background:rgba(255,255,255,0.16)"></span>'
               '<span style="font-size:15px;color:var(--mid)">streak</span>'
               '<span class="num" style="font-size:15px;color:var(--accent)">3 weeks</span>'
               '</div>',
             tone='raised', first=True)
    + K.psec('', K.tiles([
        ('SESSIONS', '12', K.delta('+1'), K.HI),
        ('VOLUME', '54.3 T', K.delta('+6%'), K.HI),
        ('TIME', '11H 20', '', K.HI),
        ('MISSED', '1', '', K.LIVE)], tone='raised'), tone='raised')
    + K.psec('VOLUME BY WEEK &middot; TONNES', ''.join(
        '<div class="r" style="gap:11px;height:36px">'
        '<span class="mono lbl" style="width:62px">' + w + '</span>'
        + K.meter(p, w=None, h=7) +
        '<span class="num" style="font-size:13px;width:38px;text-align:right;'
        'white-space:nowrap">' + v + '</span></div>'
        for w, sN, v, p in WEEKS), tone='raised'),
    active='load')

COLS = [
 ('Q1', 'Exercise', 'Everything it was missing, in the order apps actually use',
  'Demonstration first, then what it is, then muscles, then how to do it, then your numbers. Line-art figures at three phases, tappable to loop.',
  'The order is the finding. Strong, Hevy, Fitbod, JEFIT, Boostcamp and Caliber all put instruction <em>above</em> statistics; the old screen opened with four numbers, which answers a question you only have after you already know the lift. <b>Prime movers are gold, assisting muscles are grey</b>, with the key written out &mdash; a distinction every one of those apps makes and the old chip row did not.',
  Q1),
 ('Q2', 'Calendar', 'Rebuilt against what the good ones do',
  'Adjacent-month days dimmed rather than omitted, a missed session marked with a ring instead of looking like rest, three intensity steps with a key, and the month summarised in one line of text.',
  'Three real bugs, all named by the research. <b>A rest day and a missed session looked identical</b> &mdash; both a faint plate &mdash; which is the mistake Duolingo avoids by giving a freeze its own icon: one is a decision, the other is a lapse, and collapsing them makes the streak mean nothing. <b>The leading and trailing days were omitted entirely</b>, which reads as a bug rather than as a month boundary; every polished calendar dims them instead. And the numeral never wears the accent on a filled cell &mdash; it flips to dark ink only at the top step, where the fill is light enough to carry it. Three steps is also the ceiling: past four, adjacent alpha values stop being distinguishable at this cell size.',
  Q2),
]

INTRO = (
  K.para('The two screens you named, rebuilt on Lab&nbsp;38&rsquo;s P3 containment and N4 stat '
         'treatment, plus the chart-labelling fix.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">The imagery conflict resolves cleanly.</b> '
           'Photography has been out since the first round, but an exercise demonstration is '
           'content rather than decoration, and there is an open line-art set that fits: the '
           'Everkinetic-derived <span style="color:#96938c">workout-guide</span> package &mdash; '
           'SVG, 302 exercises, three consistent frames each, CC&nbsp;BY-SA&nbsp;4.0, free with '
           'attribution. Three frames is exactly enough for a start-mid-end loop, and an animation '
           'meta-analysis found a medium advantage over static images specifically for procedural '
           'learning, which is what a lift is. The figures on Q1 are drawn here to show the '
           'treatment; the real assets would replace them.', '#96938c')
  + K.para('Everything photographic is ruled out on the same grounds it always was &mdash; '
           'free-exercise-db and wger&rsquo;s bulk images are gym photos, and ExRx and MuscleWiki '
           'are paid. So this is not a compromise so much as the only free option that was ever '
           'going to fit the identity.', '#6f6c66'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">The chart, and the rule I had broken</h2>'
  + K.para('The 1RM chart was not the wrong chart type. Columns are right for ten discrete '
           'sessions &mdash; a 1RM only exists <em>at</em> a session, and a line between them would '
           'imply a rate of change across whatever gap separates them. What was missing was every '
           'orientation cue: <b style="color:#c9c3b6;font-weight:500">y minimum and maximum '
           'anchored to the chart, first and last x labels, the latest column in the accent with '
           'the other nine de-emphasised, and its value printed above it.</b> All of that fits '
           'inside the space the chart already occupied, and the floating &ldquo;RANGE '
           '112&ndash;130&rdquo; caption disappears because the axis now says it.')
  + K.para('The title changed too: <em>Estimated 1RM</em> became <em>Estimated 1RM &middot; up 18 '
           'kg over 10 sessions</em>. Naming the takeaway rather than the field is the practitioner '
           'convention, and here it also makes the chart a confirmation rather than a puzzle.',
           '#96938c')
  + K.para('<b style="color:#c9c3b6;font-weight:500">The rule I had broken:</b> text never wears '
           'the series colour. The old chart put the range caption in gold, the same gold as the '
           'bars. Labels, ticks and values stay in the text ramp; only the mark carries the '
           'accent. It is also a contrast fix &mdash; gold at small sizes on near-black is exactly '
           'the combination that fails 4.5:1, which is the same complaint you had about the '
           'calendar.', '#6f6c66')
  + '</div>')

HTML = K.page(39, 'Applied', INTRO, [('', '', COLS)], CLOSING)
open('lab39.html', 'w').write(HTML)
print('wrote lab39.html', len(HTML))
