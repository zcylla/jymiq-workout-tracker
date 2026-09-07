"""Lab 37 — Load and settings.

Volume landmarks and deload, bodyweight trend, the readiness check-in, and
Settings. The last of the sixteen.

Two of these carry model output rather than measurement, which is the constraint
that shapes them: Lab 13 settled that the bands stay and the acronyms go, and a
number a model guessed must not be drawn like a number you lifted.
"""
import kit as K

# ------------------------------------------------------------------ D1 load --
# RP volume landmarks. The acronyms are jargon (Lab 13) — the words ship instead.
BANDS = [
    ('Chest', 12, 8, 14, 20),
    ('Back', 16, 10, 18, 25),
    ('Quads', 18, 8, 16, 20),
    ('Hamstrings', 12, 6, 14, 18),
    ('Shoulders', 9, 6, 16, 22),
]


def band_row(name, sets, low, high, cap):
    """Where you are against too-few / good / hard / too-much, drawn as one bar.

    The zones are the instrument; the number is the label. Colour only appears
    where the reading is actually a warning.
    """
    def x(v):
        return min(100.0, 100.0 * v / cap)
    if sets < low:      col, verdict = 'var(--tick2)', 'TOO FEW'
    elif sets <= high:  col, verdict = K.DONE, 'GOOD'
    elif sets < cap:    col, verdict = K.ACCENT, 'HARD'
    else:               col, verdict = K.LIVE, 'TOO MUCH'
    zones = ('<span style="position:absolute;left:0;top:0;bottom:0;width:%.1f%%;'
             'background:rgba(255,255,255,0.05)"></span>'
             '<span style="position:absolute;left:%.1f%%;top:0;bottom:0;width:%.1f%%;'
             'background:rgba(159,174,58,0.16)"></span>'
             '<span style="position:absolute;left:%.1f%%;top:0;bottom:0;right:0;'
             'background:rgba(223,84,65,0.14)"></span>'
             % (x(low), x(low), x(high) - x(low), x(high)))
    return ('<div style="display:flex;flex-direction:column;gap:6px;padding:7px 0">'
            '<div class="r" style="gap:10px">'
            '<span style="font-size:15px;color:var(--hi)">' + name + '</span>'
            '<span class="sp"></span>'
            '<span class="num" style="font-size:15px;font-weight:600;color:' + col + '">'
            + str(sets) + '</span>'
            '<span class="mono lbl" style="width:64px;text-align:right">' + verdict + '</span></div>'
            '<div style="position:relative;height:8px;border-radius:4px;overflow:hidden">' + zones
            # The marker is always near-white. Tinting it to match the verdict made
            # it vanish inside the band of the same colour — position is position,
            # the number carries the verdict.
            + '<span style="position:absolute;left:%.1f%%;top:-3px;bottom:-3px;width:2px;'
              'margin-left:-1px;border-radius:1px;background:var(--hi);'
              'box-shadow:0 0 0 1.5px rgba(10,9,8,0.55)"></span></div></div>' % x(sets))


D1 = K.phone(
    K.head('Load', 'THIS WEEK')
    + K.psec('', K.tiles([('SETS', '67', '', K.HI),
                          ('VOLUME', '18.4 T', K.delta('+9%'), K.HI)], tone='raised'),
             first=True, pad=13)
    + K.psec('WEEKLY SETS PER MUSCLE', ''.join(band_row(*b) for b in BANDS), plated=False)
    + K.psec('DELOAD',
        '<div style="display:flex;flex-direction:column;gap:8px">'
        '<span style="font-size:17px;line-height:1.45;color:var(--hi)">Not yet &mdash; probably '
        'week&nbsp;5.</span>'
        '<span style="font-size:13px;line-height:1.6;color:var(--lo)">Quads are near the top of '
        'their useful range and squat has climbed every session, so the volume is still doing '
        'something. Deload when both stop being true.</span></div>', plated=False),
    active='load')

# ------------------------------------------------------------ D2 bodyweight --
BW = [82.4, 82.9, 82.1, 82.6, 83.0, 82.7, 83.2, 83.4, 83.0, 83.6, 83.9, 83.5, 84.1, 84.3]


def trend(vals, w=356, h=88):
    lo, hi = min(vals) - 0.4, max(vals) + 0.4
    n = len(vals)
    pts = [(w * i / (n - 1), h - h * (v - lo) / (hi - lo)) for i, v in enumerate(vals)]
    line = ' '.join('%.1f,%.1f' % p for p in pts)
    area = 'M0,%.1f ' % h + ' '.join('L%.1f,%.1f' % p for p in pts) + ' L%.1f,%.1f Z' % (w, h)
    mid = h - h * (sum(vals) / n - lo) / (hi - lo)
    return ('<svg viewBox="0 0 %d %d" style="width:100%%;height:%dpx">'
            '<defs><linearGradient id="bwg" x1="0" y1="0" x2="0" y2="1">'
            '<stop offset="0" stop-color="#e4c68c" stop-opacity="0.26"></stop>'
            '<stop offset="1" stop-color="#e4c68c" stop-opacity="0"></stop>'
            '</linearGradient></defs>'
            '<path d="%s" fill="url(#bwg)"></path>'
            '<line x1="0" y1="%.1f" x2="%d" y2="%.1f" stroke="rgba(255,255,255,0.13)" '
            'stroke-width="1" stroke-dasharray="3 4"></line>'
            '<polyline points="%s" fill="none" stroke="#e4c68c" stroke-width="2" '
            'stroke-linecap="round" stroke-linejoin="round"></polyline>'
            '<line x1="0" y1="%d" x2="%d" y2="%d" stroke="rgba(255,255,255,0.13)" '
            'stroke-width="1"></line>'
            '<circle cx="%.1f" cy="%.1f" r="3.5" fill="#e4c68c"></circle></svg>'
            % (w, h, h, area, mid, w, mid, line, h, w, h, pts[-1][0] - 1, pts[-1][1]))


D2 = K.phone(
    K.head('Bodyweight', 'TREND')
    + K.psec('', K.tiles([('LATEST', '84.3', '', K.HI),
                          ('7-DAY AVG', '83.8', K.delta('+1.9'), K.ACCENT)], tone='raised'),
             first=True, pad=13)
    # Fill, baseline, dashed mean and three labels: this chart already draws its
    # own frame, and it is the one the user said worked.
    + K.psec('LAST 14 DAYS &middot; KG',
        trend(BW)
        + '<div class="r"><span class="mono lbl">21 AUG</span><span class="sp"></span>'
          '<span class="mono lbl">DASHED = 14-DAY MEAN</span><span class="sp"></span>'
          '<span class="mono lbl">TODAY</span></div>', plated=False)
    + K.psec('RELATIVE STRENGTH', ''.join(
        '<div class="r" style="gap:12px;height:34px">'
        '<span style="font-size:15px;color:var(--hi);width:92px">' + n + '</span>'
        '<span style="flex:1;height:5px;border-radius:3px;background:rgba(255,255,255,0.07);'
        'display:block;overflow:hidden"><span style="display:block;height:5px;border-radius:3px;'
        'width:' + str(p_) + '%;background:var(--accent)"></span></span>'
        '<span class="num" style="font-size:13px;width:38px;text-align:right">' + v + '</span>'
        '<span class="mono lbl" style="width:62px;text-align:right">' + t + '</span></div>'
        for n, p_, v, t in [('Squat', 78, '1.55', 'INTERM.'), ('Deadlift', 71, '1.90', 'INTERM.'),
                            ('Bench', 55, '1.04', 'NOVICE')]), plated=False)
    + K.psec('BY MONTH', K.prows([
        K.lrow('<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
               '<span style="font-size:15px;color:var(--hi)">' + m + '</span>'
               '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
               + n + ' WEIGH-INS</span></div>',
               '<div class="r" style="gap:12px;margin-right:10px">'
               '<span class="num" style="font-size:15px">' + a + '</span>'
               '<span class="mono" style="font-size:13px;width:44px;text-align:right;color:'
               + ('var(--pos)' if d.startswith('+') else 'var(--dim)') + '">' + d + '</span></div>',
               chev=False)
        for m, n, a, d in [('September', '4', '83.9', '+0.6'),
                           ('August', '28', '83.3', '+1.1')]]), plated=False),
    active='load')

# ------------------------------------------------------------- D3 readiness --
def scale3(label, value, options):
    cells = ''.join(
        '<div style="flex:1;min-height:44px;display:flex;align-items:center;justify-content:center;'
        'border-radius:11px;background:%s">'
        '<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:%s">%s</span></div>'
        % ('rgba(228,198,140,0.15)' if o == value else 'rgba(255,255,255,0.05)',
           'var(--accent)' if o == value else 'var(--lo)', o)
        for o in options)
    return ('<div style="display:flex;flex-direction:column;gap:8px;padding:7px 0">'
            '<span class="mono lbl">' + label + '</span>'
            '<div class="r" style="gap:5px">' + cells + '</div></div>')


D3 = K.phone(
    K.back_head('How are you today?', 'CHECK-IN &middot; 3 TAPS')
    + K.psec('', K.prows([scale3('SLEEP', 'OK', ['POOR', 'OK', 'GOOD']),
                          scale3('SORENESS', 'SOME', ['NONE', 'SOME', 'A LOT']),
                          scale3('ENERGY', 'GOOD', ['LOW', 'OK', 'GOOD'])]),
             first=True, plated=False)
    + K.psec('WHAT THAT MEANS',
        '<div style="display:flex;flex-direction:column;gap:8px">'
        '<span style="font-size:17px;line-height:1.45;color:var(--hi)">Train as planned.</span>'
        '<span style="font-size:13px;line-height:1.6;color:var(--lo)">Quads are still carrying '
        'Tuesday, so the first squat set will feel heavier than the number says. Drop the top set '
        'by 2.5&nbsp;kg if the warm-up ramp is slow &mdash; the rest of the session stands.</span>'
        '</div>', plated=False)
    + K.psec('THIS IS A GUESS, NOT A MEASUREMENT',
        '<span style="font-size:13px;line-height:1.6;color:var(--lo)">Three taps and your recent '
        'volume, decayed on a 48-hour half-life. No wearable, no HRV, no sleep tracking &mdash; so '
        'it is worth exactly what you put into it, and it is written as a sentence rather than a '
        'score for that reason.</span>', plated=False),
    chrome=K.actionbar('Start Lower B', 'SKIP'))

# -------------------------------------------------------------- D4 settings --
def srow(label, value, chev=True):
    return K.lrow('<span style="font-size:15px;color:var(--hi)">' + label + '</span>',
                  '<span class="mono" style="font-size:13px;color:var(--mid);margin-right:10px">'
                  + value + '</span>', chev=chev)


def stoggle(label, on, meta=''):
    knob = ('<div style="width:44px;height:26px;border-radius:9999px;flex:none;padding:3px;'
            'display:flex;justify-content:' + ('flex-end' if on else 'flex-start')
            + ';background:' + ('var(--accent)' if on else 'rgba(255,255,255,0.10)') + '">'
            '<span style="width:20px;height:20px;border-radius:9999px;background:'
            + ('#15130f' if on else 'var(--lo)') + '"></span></div>')
    sub = ('<span class="mono" style="font-size:11px;letter-spacing:0.08em;color:var(--lo)">'
           + meta + '</span>') if meta else ''
    return ('<div class="lrow">'
            '<div style="display:flex;flex-direction:column;gap:3px;min-width:0">'
            '<span style="font-size:15px;color:var(--hi)">' + label + '</span>' + sub
            + '</div><span class="sp"></span>' + knob + '</div>')


PLATES = [('25', '#c0392b'), ('20', '#2d6cb5'), ('15', '#d9a92b'), ('10', '#3f8f4f'),
          ('5', '#e8e6e1'), ('2.5', '#b3312a'), ('1.25', '#c9c8c4')]

D4 = K.phone(
    K.back_head('Settings')
    + K.psec('UNITS', K.prows([srow('Weight', 'KG'), srow('Distance', 'CM'),
                               srow('Language', 'EN')]), first=True, plated=False)
    + K.psec('TRAINING', K.prows([
        stoggle('Track RPE', False, 'OFF &mdash; SET IT ONLY IF YOU USE IT'),
        srow('Default rest &middot; compound', '3:00'),
        srow('Default rest &middot; isolation', '1:30'),
        stoggle('Warm-up ramps', True, '40 / 60 / 75 / 85 %'),
        stoggle('Tap opens the keypad', False,
                'OTHERWISE LONG-PRESS &middot; TAP ARMS THE TAPE')]), plated=False)
    + K.psec('PLATES',
        '<div class="r" style="gap:6px;padding:4px 0 10px;align-items:flex-end">' + ''.join(
            '<div style="display:flex;flex-direction:column;align-items:center;gap:5px">'
            '<span style="width:13px;height:' + str(int(20 + 26 * i / 6)) + 'px;border-radius:2px;'
            'background:' + c + '"></span>'
            '<span class="mono" style="font-size:11px;color:var(--lo)">' + w + '</span></div>'
            for i, (w, c) in enumerate(reversed(PLATES))) + '</div>'
        + K.prows([srow('Colour scheme', 'COMPETITION'),
                   stoggle('Show plate maths', True, 'PER SIDE, ON THE LIVE SCREEN')]),
             plated=False),
    chrome='')

COLS = [
 ('D1', 'Load', 'Model output, drawn as a range and not a number',
  'Two tiles, then weekly sets per muscle against the zones that matter &mdash; too few, good, hard, too much &mdash; with the verdict written next to the count, on the canvas. The deload call is plain prose.',
  'Lab&nbsp;13 settled this: <b>the bands stay, the acronyms go</b>. MEV, MAV and MRV are jargon and none of them survives contact with a person who has not read the literature. Colour appears only where the reading is a warning, so a screen of green-to-gold bars is quiet and one red one is not. The deload answer is prose because the honest version has two conditions in it, and two conditions do not fit in a gauge.',
  D1),
 ('D2', 'Bodyweight', 'The one line chart in the app',
  'Fourteen days with a fill, a baseline, and the 14-day mean as a dashed rule. Four numbers over it, relative strength under it.',
  'A line is right here and almost nowhere else, because bodyweight is genuinely continuous &mdash; the reading is the <em>slope</em>, not the values. This is the chart the critique singled out as working, and it is untouched: fill, baseline, dashed mean, three labels. It sits on the canvas for the same reason &mdash; it already has a frame. Daily weight is noisy, which is why the seven-day average is the one in the accent, now carrying the thirty-day change as its delta instead of a tile of its own.',
  D2),
 ('D3', 'Readiness', 'Three taps, and honesty about what they buy',
  'Sleep, soreness, energy. Then what to do, in a sentence, and a paragraph saying exactly how much the answer is worth.',
  'The research was explicit that phone-only readiness is three taps plus fatigue decayed from volume, and nothing more. Drawing that as a score out of a hundred would be a lie told with a gauge. So it is a sentence, and the caveat is <em>on the screen</em> rather than buried in a help page &mdash; the same instinct as writing FRESH and NEEDS REST on the body map instead of a percentage. The caveat is the one block deliberately left off a plate: it is a footnote about the answer above it, and giving it the same surface would give it the same weight.',
  D3),
 ('D4', 'Settings', 'Where the parameters you argued about live',
  'Units, training defaults with the input preference folded in, and plate colours drawn to real relative diameter. Every row is its own plate &mdash; the Lab&nbsp;42 P3 case, and the one where row plates argue best: settings rows are not a list, they are a stack of unrelated controls that happen to be adjacent.',
  '<b>Track RPE is off.</b> Most people do not know what RPE is and it must never arrive pre-filled with a number that then gets logged as if it were real. <b>Plate colours default to competition</b> and are configurable, which was round six&rsquo;s call &mdash; and the swatches are drawn to real relative diameter, so the setting shows you what it does. <b>Tap opens the keypad</b> is the switch Lab&nbsp;32 promised. Settings is not a tab; it is a gear in the Today header, because you open it twice a year.',
  D4),
]

INTRO = (
  K.para('Volume and deload, bodyweight, the readiness check-in, and Settings. The last four of '
         'sixteen.')
  + K.para('Two of these carry <b style="color:#c9c3b6;font-weight:500">model output rather than '
           'measurement</b>, and that is the constraint shaping both. A number the app guessed must '
           'not be drawn like a number you lifted &mdash; so the deload call and the readiness '
           'verdict are sentences, and the one place a percentage would have been easiest is the '
           'one place it would have been least honest.', '#96938c'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">Sixteen screens, and what held</h2>'
  + K.para('Everything on these four boards is built from <span style="color:#96938c">kit.py</span> '
           '&mdash; one palette, one type ramp, one glass recipe, one spacing law, one list row, '
           'one section, one rail. All sixteen are now on the settled M4 treatment: a ruled label '
           'on the canvas, a lit plate under the content, inset separators between rows &mdash; '
           'and nothing plated that already draws its own edge.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Containment now lands per row, not per '
           'section</b> (Lab 42, P5): a row you can touch carries its own plate, a read-only table '
           'carries nothing, and the section is just its ruled label. Grouped plates are left for '
           'the screen&rsquo;s one or two main components &mdash; the summary tiles, the calendar, '
           'the day strip.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">The restyle cost roughly 30pt a section</b>, '
           'which is about one section per screen pushed below the fold. Six screens lost content '
           'to pay for it: a template row, a standalone routine, two lifts, per-muscle volume off '
           'the recap, the six-week volume chart off Load, and the input section folded into '
           'training. Every cut was either a duplicate of something on another screen or the '
           'fourth item in a list of four.', '#6f6c66')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Three patterns were added</b>, all forced by '
           'screens the live session never had to be: a <em>field</em> (label over value, no box), '
           'a <em>chip</em> (filters and multi-select, one component), and a <em>zone bar</em> '
           '(where a value sits against thresholds, for the two screens carrying model output). '
           'Each is in kit.py.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">One rule was relaxed and one was tightened.</b> '
           'Relaxed: a read-only table row is 34pt, not 44 &mdash; the hit-area floor is for '
           'targets, and applying it to a set log adds fifty points of air for nothing. Tightened: '
           'the rail is now explicitly <em>not</em> for the calendar, because a month is a shape '
           'and straightening it into a line loses the only thing you wanted from it.', '#6f6c66')
  + K.para('The honest weak point is the body map on Lab&nbsp;35. It is legible and on-palette and '
           'it is still the least resolved drawing in the set.', '#6f6c66')
  + '</div>')

HTML = K.page(37, 'Load and settings', INTRO, [('', '', COLS)], CLOSING)
open('lab37.html', 'w').write(HTML)
print('wrote lab37.html', len(HTML))
