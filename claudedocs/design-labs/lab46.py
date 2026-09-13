"""Lab 46 — History. The one screen Lab 36 never drew.

Lab 36 boarded the calendar, the recap, the set log and the PR timeline, and its
closing scoped the rail to "PR timeline, session history *on a routine*, upcoming
sessions in a program". A flat list of every session you have ever done was never
drawn, and a plan to build it was rejected in review for exactly that reason.

The objection was not "nobody wants an archive". It was that a twenty-row rail is
a different object from the three-row previews the pattern was designed around:
at 22pt of air per event it is roughly 1,200pt of ungrouped scroll with no date
anchoring, no separators and nothing sticky to tell you where you are. This board
is the answer to that, or the proof that there isn't one.
"""
import kit as K

# Two months of training, newest first. (date, routine, tonnes, minutes, sets, pr)
SESSIONS = [
    ('Thu 4 Sep', 'Lower A', '8.6 T', '64 MIN', '20 SETS', True),
    ('Tue 2 Sep', 'Upper A', '7.4 T', '58 MIN', '18 SETS', False),
    ('Mon 1 Sep', 'Lower B', '8.1 T', '61 MIN', '20 SETS', True),
    ('Fri 29 Aug', 'Upper B', '6.9 T', '55 MIN', '17 SETS', False),
    ('Thu 28 Aug', 'Lower A', '8.2 T', '63 MIN', '20 SETS', False),
    ('Tue 26 Aug', 'Upper A', '7.1 T', '57 MIN', '18 SETS', True),
    ('Mon 25 Aug', 'Lower B', '7.8 T', '60 MIN', '19 SETS', False),
    ('Fri 22 Aug', 'Upper B', '6.6 T', '54 MIN', '17 SETS', False),
    ('Wed 20 Aug', 'Lower A', '2.1 T', '18 MIN', '5 SETS', False),   # ended early
    ('Mon 18 Aug', 'Upper A', '7.0 T', '56 MIN', '18 SETS', False),
]
AUG_START = 3   # index into SESSIONS where August begins

MONTHS = [
    ('SEPTEMBER', '3 SESSIONS &middot; 24.1 T', SESSIONS[:3]),
    ('AUGUST', '7 SESSIONS &middot; 45.7 T', SESSIONS[3:]),
]


def event(date, routine, tonnes, minutes, sets, pr, ended_early=False):
    """One session, in the rail-row grammar Lab 43 settled: a bright line you
    read and a mono line you scan."""
    head = ('<div class="r" style="gap:9px">'
            '<span class="num" style="font-size:15px">' + date + '</span>'
            + (K.pill('PR') if pr else '')
            + '<span class="sp"></span>'
            '<span class="mono" style="font-size:13px;color:var(--mid)">' + tonnes + '</span></div>')
    # An ended-early session says so in words. It is not dimmed: the weight was
    # really lifted, and fading it would be the app disowning work you did.
    meta = routine.upper() + (' &middot; ENDED EARLY' if ended_early else '')
    body = ('<span class="mono" style="font-size:11px;letter-spacing:0.07em;color:var(--lo)">'
            + meta + ' &middot; ' + minutes + ' &middot; ' + sets + '</span>')
    return head + body


def tone_for(i):
    """Age buckets, not an index ramp (Lab 36 C4: 0-2d accent, 3-6d TICK3,
    7-12d TICK2, older TICK1). With twenty rows an index ramp is TICK1 from the
    fifth row down, and the dot stops carrying anything half a screen in."""
    return [K.ACCENT, K.ACCENT, K.TICK3, K.TICK3, K.TICK2, K.TICK2,
            K.TICK2, K.TICK1, K.TICK1, K.TICK1][i]


def events(rows, offset=0):
    return [(tone_for(i + offset),
             event(*r, ended_early=(r[0] == 'Wed 20 Aug'))) for i, r in enumerate(rows)]


HEAD = K.head('History', 'EVERY SESSION')

# ------------------------------------------------------------------- H1 flat --
# The version the plan proposed, drawn honestly so the problem is visible rather
# than argued about.
H1 = K.phone(
    HEAD + K.psec('', K.rail(events(SESSIONS), air=22), first=True, plated=False),
    active='session')

# --------------------------------------------------------------- H2 by month --
H2 = K.phone(
    HEAD
    + ''.join(K.psec(name, K.rail(events(rows, 0 if i == 0 else AUG_START), air=22),
                     first=(i == 0), plated=False)
              for i, (name, _, rows) in enumerate(MONTHS)),
    active='session')

# ------------------------------------------------- H3 by month, with the sum --
H3 = K.phone(
    HEAD
    + ''.join(K.psec(name, K.rail(events(rows, 0 if i == 0 else AUG_START), air=22),
                     first=(i == 0), plated=False,
                     right='<span class="mono lbl">' + summary + '</span>')
              for i, (name, summary, rows) in enumerate(MONTHS)),
    active='session')

COLS = [
 ('H1', 'Flat, as proposed', 'Twenty rows and no landmarks',
  'One rail, newest first, exactly as the implementation plan described it. Ten events shown; a real archive is twenty and then a hundred.',
  'Drawn so the objection is visible rather than asserted. <b style="color:#c9c3b6;font-weight:500">The rail is doing a job it was never given.</b> Lab&nbsp;27 reserved it for &ldquo;discrete events worth reading one at a time&rdquo;, and Lab&nbsp;36&rsquo;s closing narrowed that to a routine&rsquo;s history, a program&rsquo;s upcoming days, and the PR timeline &mdash; every one of them short, and every one of them anchored to something. Cut free of a context the spine has nothing to say: it connects the fourth Tuesday in August to the third with a line, which implies a sequence that matters, and it does not. Scroll two screens and there is no month, no year, no way back to a date you half-remember.',
  H1),
 ('H2', 'Ruled by month', 'The label that already does this job',
  'The same rail, broken at the month boundary, each run under the ruled section label the rest of the app already uses for wayfinding.',
  '<b style="color:#c9c3b6;font-weight:500">Chosen.</b> The fix was already in the kit. A ruled label is how every other screen says <em>this is a different kind of thing</em>, and a month is exactly that &mdash; so history stops being one long list and becomes a short rail per month, which is the length the pattern was drawn for. <b style="color:#c9c3b6;font-weight:500">Each run is now three to five events</b>, the same order as LAST&nbsp;THREE and RECENT. The spine gets its context back: within September the line means &ldquo;these are consecutive sessions&rdquo;, and the break between months means the gap is real &mdash; and nothing is added to the label to pay for it.',
  H2),
 ('H3', 'Ruled by month, summed', 'One line of text, not a second chart',
  'H2 with the month&rsquo;s totals on the label line, using <code>psec</code>&rsquo;s existing right slot.',
  '<b style="color:#c9c3b6;font-weight:500">Proposed and rejected.</b> The argument for it was that &sect;0 already ruled this shape in for the calendar &mdash; &ldquo;month summary is one line of text, not a second chart&rdquo; &mdash; so the same sentence would answer the same question here, at no new component and no vertical space. <b style="color:#c9c3b6;font-weight:500">The argument against it is better: monthly tonnage is not information most people act on.</b> Session tonnage earns its place because it is one workout you can still remember; summed over a month it is a number that goes up when you train more and down when you train less, which the count of sessions beside it already says. A figure that restates its neighbour is noise on a label that exists to help you skip. Note the 20&nbsp;Aug row, which survives into H2: an abandoned session keeps its tonnage and says <span style="color:#c9c3b6">ENDED EARLY</span> in words rather than being greyed &mdash; the weight was really lifted, and fading it would be the app disowning work you did.',
  H3),
]

INTRO = (
  K.para('The screen Lab&nbsp;36 skipped, drawn now because a plan to build it was rejected for '
         'not having a board.')
  + K.para('The rejection was narrow and worth restating: nobody argued against an archive. The '
           'argument was that <b style="color:#c9c3b6;font-weight:500">twenty rows is a different '
           'object from three</b>, and that every rail in the design system so far has been a '
           'short preview pinned to a context &mdash; a routine, a program, a records page. Cut '
           'that context away and the spine connects events that have nothing to do with each '
           'other. So the question this board has to answer is not &ldquo;what does history look '
           'like&rdquo; but <em>what gives a long chronological list somewhere to stand</em>.',
           '#96938c'))

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">What this settles</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">H2. The month is the container, the ruled '
           'label is how it is drawn, and the label carries nothing but the month.</b> That keeps every rail in the app between two and five '
           'events, which is the only length the pattern has ever been drawn at, and it means '
           'history needs no new primitive &mdash; <code>psec</code> and <code>rail</code> compose '
           'into it.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Lab&nbsp;36&rsquo;s closing gets one clause '
           'added:</b> the rail also applies to a global session list <em>when it is grouped</em>. '
           'Ungrouped, H1 stands as the counter-example &mdash; it is the one rail in this project '
           'that reads as a continuous measure, which is the exact failure the dots were cut free '
           'of the line to avoid.')
  + K.para('Still open, and deliberately not drawn: what happens below the fold at a hundred '
           'sessions. Month runs make the scroll legible but they do not make it finite. The '
           'calendar (C1) is the screen that answers &ldquo;take me to March&rdquo;, and it already '
           'exists on Load &mdash; so the honest answer may be that history is the recent list and '
           'the calendar is the index, not that this screen grows a jump control.', '#6f6c66')
  + '</div>')

HTML = K.page(46, 'History', INTRO, [('', '', COLS)], CLOSING)
open('lab46.html', 'w').write(HTML)
print('wrote lab46.html', len(HTML))
