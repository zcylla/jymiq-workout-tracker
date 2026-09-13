"""Lab 47 — The screens. Forty-six boards of exploration, and no index to them.

Every other lab argues one question. This one argues nothing: it is the map.
Until now the information architecture lived in three paragraphs of Lab 34's
intro, the build state lived in build-log.md, and nothing anywhere joined a
screen to the board that drew it and the route that runs it. A plan was written
for a screen the IA never had, which is what a missing index costs.

So this board is a table, not a mockup. One card per screen: the board that
settled it, the tab it lives in, the route, and whether it is on the phone.
"""
import kit as K

# ---------------------------------------------------------------- statuses --
# Four states on one axis. A screen built without a board is still BUILT; the
# missing board shows in its reference, not in a second status vocabulary.
BUILT = ('BUILT', K.DONE, 'rgba(159,174,58,0.13)')
SHELL = ('SHELL', K.ACCENT, 'rgba(228,198,140,0.13)')
DRAWN = ('DRAWN', K.TICK2, 'rgba(255,255,255,0.06)')
RULED = ('RULED OUT', K.DIM, 'rgba(255,255,255,0.04)')

# --------------------------------------------------------------- the table --
# (board ref, name, route, status, what it is)
GROUPS = [
 ('TODAY', 'Home, what is next, how you are', [
  ('LAB 45 W3', 'Today', '/', SHELL,
   'The next-routine card, the week strip and the recent rail. What runs today is a shell with dev links, because W3 needs primitives Phase&nbsp;2 did not build.'),
  ('LAB 37 D3', 'Readiness', '&mdash;', DRAWN,
   'Three taps and a sentence. Boarded on Lab&nbsp;37 beside the Load screens; &sect;0&rsquo;s IA puts it here, on Today.'),
  ('NO BOARD', 'Sign in', '/sign-in', BUILT,
   'Google and email magic link, both on PKCE. Reached from the Today gear until Settings exists.'),
 ]),
 ('SESSION', 'Everything you plan or start from', [
  ('LAB 34 A1', 'Routines', '/session', BUILT,
   'The tab root. The list, grouped by whether it is in play.'),
  ('LAB 34 A2', 'Routine detail', '/routine/[id]', BUILT,
   'Pushed. The unit of planning, its stats, and the LAST&nbsp;THREE rail into past sessions.'),
  ('NO BOARD', 'Routine create', '/routine/new', BUILT,
   'Pushed. Never boarded &mdash; built out of A2&rsquo;s vocabulary plus the library in picker mode.'),
  ('NO BOARD', 'Routine edit', '/routine/[id]/edit', BUILT,
   'Pushed. The same form as create, over an existing routine.'),
  ('LAB 34 A3', 'Programs', '&mdash;', DRAWN,
   'Routines scheduled by weekday or fixed cycle. One runs; the rest are a plain list.'),
  ('LAB 34 A4', 'Program detail', '&mdash;', DRAWN,
   'Pushed. Two tiles, a labelled column chart and the seven weekdays with grips.'),
  ('LAB 35 B1', 'Exercise library', '/session/library', BUILT,
   'The densest list in the app, 302 rows, every one illustrated. Doubles as the picker when handed a routine or a session.'),
  ('LAB 35 B2', 'Exercise detail', '/exercise/[id]', BUILT,
   'Pushed. The demo loop, the prose, the muscles plate and YOUR&nbsp;NUMBERS. Strength&rsquo;s per-exercise history opens this same screen.'),
  ('LAB 35 B3', 'Custom exercise', '/exercise/new', BUILT,
   'Pushed. A form without looking like one. Two of the board&rsquo;s toggles are gone &mdash; they had no column to write to.'),
 ]),
 ('STRENGTH', 'What you can lift, and where it went', [
  ('NO BOARD', 'Strength', '/strength', SHELL,
   'The tab root. &sect;0 gives it per-exercise history, PRs, standards and the body map; no board draws the root itself, so what it opens on is still undecided.'),
  ('LAB 36 C4', 'Records', '&mdash;', DRAWN,
   'The PR timeline &mdash; what the rail was reserved for. Its dots are age buckets, not an index ramp.'),
  ('LAB 35 B4', 'Body map', '&mdash;', DRAWN,
   'The only screen that needs a drawing, and the least resolved in the set. Spec at claudedocs/body-map.md.'),
 ]),
 ('LOAD', 'Volume, and the body carrying it', [
  ('NO BOARD', 'Load', '/load', SHELL,
   'The tab root. &sect;0 gives it volume, deload, bodyweight and the calendar; like Strength, nothing draws the root.'),
  ('LAB 37 D1', 'Volume and deload', '&mdash;', DRAWN,
   'Model output drawn as a range and not a number. Deload is a sentence.'),
  ('LAB 37 D2', 'Bodyweight', '&mdash;', DRAWN,
   'The one line chart in the app.'),
  ('LAB 36 C1', 'Calendar', '&mdash;', DRAWN,
   'The one review screen that is not a rail, and the answer to &ldquo;take me to March&rdquo;. Whether it sits on a plate is still open.'),
 ]),
 ('OUTSIDE THE TABS', 'A takeover, two pushes and a gear', [
  ('LAB 33', 'Live session', '/live', BUILT,
   'A takeover &mdash; no tab bar, no back. The ring, the tape, the ladder, both sheets and the keypad.'),
  ('LAB 36 C2', 'Session summary', '/summary/[id]', BUILT,
   'Pushed. The screen you see once, immediately after finishing.'),
  ('LAB 36 C3', 'Session detail', '/history/[id]', BUILT,
   'Pushed. The same log read back later, set by set. Reached from LAST&nbsp;THREE today, and from the calendar, the week strip and the PR timeline once those exist.'),
  ('LAB 37 D4', 'Settings', '&mdash;', DRAWN,
   'Not a tab &mdash; the gear in the Today header, because you open it twice a year. Storage is decided and unwritten, so every parameter is hardcoded.'),
 ]),
 ('DRAWN AND NOT A SCREEN', 'The board that resolved to nothing', [
  ('LAB 46 H2', 'History', '&mdash;', RULED,
   'A flat archive of every session. Boarded, settled on H2, and then <b style="color:#c9c3b6;font-weight:500">not built</b>: the IA has no history list. Four things already answer &ldquo;show me my past workouts&rdquo; &mdash; the calendar, the week strip, LAST&nbsp;THREE and the PR timeline &mdash; and every one of them opens C3.'),
 ]),
]

ORDER = [BUILT[0], SHELL[0], DRAWN[0], RULED[0]]


def tally(cards):
    """Counted in the fixed status order, never by size — a tally that reorders
    itself between groups is one you have to read rather than scan."""
    n = {}
    for c in cards:
        n[c[3][0]] = n.get(c[3][0], 0) + 1
    return n


ALL = [c for _, _, cards in GROUPS for c in cards]
TALLY = tally(ALL)
TOTAL = len(ALL)


def card(ref, name, route, status, blurb):
    label, col, bg = status
    return ('<div class="card lit">'
            '<div class="r" style="gap:10px">'
            '<span class="mono cref">' + ref + '</span><span class="sp"></span>'
            + K.pill(label, col, bg) + '</div>'
            '<span class="cname">' + name + '</span>'
            '<span class="mono croute">' + route + '</span>'
            '<span class="cblurb">' + blurb + '</span></div>')


def group(label, gloss, cards):
    counts = tally(cards)
    line = ' &middot; '.join('%d %s' % (counts[k], k) for k in ORDER if k in counts)
    return ('<div class="grp"><span class="lbl">' + label + '</span>'
            '<span class="gloss">' + gloss + '</span>'
            '<span class="rule"></span>'
            '<span class="mono lbl">' + line + '</span></div>'
            '<div class="cards">' + ''.join(card(*c) for c in cards) + '</div>')


INDEX = ('<div class="idx">'
         + ''.join('<div class="gsec">' + group(*g) + '</div>' for g in GROUPS)
         + '</div>')

EXTRA_CSS = """
  .idx{display:flex;flex-direction:column;gap:38px;max-width:1260px;padding-top:34px}
  .gsec{display:flex;flex-direction:column;gap:13px}
  .grp{display:flex;align-items:center;gap:14px}
  .gloss{font-size:13px;color:#6f6c66}
  .rule{flex:1;height:1px;background:rgba(255,255,255,0.11)}
  .cards{display:grid;grid-template-columns:repeat(auto-fill,minmax(296px,1fr));gap:9px}
  .card{background:var(--raised);border-radius:14px;padding:14px 15px;
        display:flex;flex-direction:column;gap:7px}
  .cref{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .cname{font-size:17px;font-weight:600;letter-spacing:-0.01em;color:var(--hi)}
  .croute{font-size:11px;letter-spacing:0.02em;color:var(--dim)}
  .cblurb{font-size:13px;line-height:1.6;color:#96938c}
  .key{display:flex;flex-wrap:wrap;gap:10px 20px;padding-top:6px}
  .keyi{display:flex;align-items:center;gap:9px;font-size:13px;color:#96938c}
"""

KEY = ('<div class="key">'
       + ''.join('<span class="keyi">' + K.pill(s[0], s[1], s[2]) + t + '</span>' for s, t in [
           (BUILT, 'on the phone and verified there'),
           (SHELL, 'a placeholder stands where the screen goes'),
           (DRAWN, 'a board settled it; nothing is built'),
           (RULED, 'boarded, then decided against'),
       ]) + '</div>')

INTRO = (
  K.para('<b style="color:#c9c3b6;font-weight:500">%d screens.</b> %d are on the phone, %d are a '
         'placeholder standing in for one, %d are drawn and unbuilt, and %d was drawn and then '
         'ruled out. This board is the only place all of that is written down together.'
         % (TOTAL, TALLY.get(BUILT[0], 0), TALLY.get(SHELL[0], 0),
            TALLY.get(DRAWN[0], 0), TALLY.get(RULED[0], 0)))
  + K.para('It exists because the information architecture was living in Lab&nbsp;34&rsquo;s intro '
           'and the build state was living in <span style="color:#96938c">build-log.md</span>, and '
           'nothing joined them. <b style="color:#c9c3b6;font-weight:500">An implementation plan '
           'was written for a screen the IA never had</b> &mdash; that is the cost, and it is why '
           'the last group on this page exists rather than being quietly deleted. A board that '
           'resolved to &ldquo;do not build this&rdquo; is a result, and the index has to carry it '
           'or the same plan gets written again.', '#96938c')
  + K.para('Four tabs, and a screen is either a tab root or pushed on top of one. A pushed screen '
           'loses the tab bar, which frees that plane for its primary action &mdash; so the route '
           'under each name is also a statement about what chrome it has. Settings is not a tab; '
           'it is the gear in the Today header.', '#6f6c66')
  + KEY)

CLOSING = (
  '<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;letter-spacing:-0.02em;'
  'color:#f0efec">How to keep this true</h2>'
  + K.para('<b style="color:#c9c3b6;font-weight:500">The table at the top of '
           '<span style="color:#96938c">lab47.py</span> is the source.</b> A screen changing state '
           'is one tuple edited, <code>python3 lab47.py</code>, <code>python3 gate.py '
           'lab47.html</code>, publish. The counts in the intro and every group&rsquo;s tally are '
           'computed from that table, so they cannot drift out of step with the cards the way a '
           'hand-written summary would.')
  + K.para('<b style="color:#c9c3b6;font-weight:500">Three roots have no board</b>, and that is a '
           'real gap rather than a bookkeeping one. Today has Lab&nbsp;45 W3, but Strength and Load '
           'have only a sentence each in &sect;0 saying what they carry. Both are drawn as their '
           '<em>contents</em> &mdash; C4, B4, D1, D2, C1 &mdash; and not one board says what you '
           'see when you tap the tab. That question has to be answered before either tab can be '
           'built, and answering it may well be the next board.')
  + K.para('Not on this page, deliberately: the tab bar itself (Lab&nbsp;43 N2, built, chrome and '
           'not a screen), the two sheets and the keypad (Lab&nbsp;30&ndash;32, built, parts of the '
           'live screen), and <code>/dev/*</code> &mdash; the fonts sheet, the kitchen sink, the '
           'database counts and the two board-comparison screens. Those last are build gates, and '
           'they ship in the dev build only.', '#6f6c66')
  + '</div>')

HTML = K.page(47, 'The screens', INTRO, [], INDEX + CLOSING, EXTRA_CSS)
open('lab47.html', 'w').write(HTML)
print('wrote lab47.html', len(HTML), '—', TOTAL, 'screens', TALLY)
