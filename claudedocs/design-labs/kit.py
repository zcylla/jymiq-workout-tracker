"""kit.py — the settled design system, as primitives.

Everything in §0 of ../design-exploration.md, in one place. Labs 34+ build every
screen out of these, so the sixteen remaining screens inherit the locked
decisions rather than re-deriving them, and implementation has one file to read.

Nothing live-session-specific lives here. The ring, the tape and the set line
are in lab31/lab32; they belong to one screen.
"""

# ---------------------------------------------------------------- tokens ----
# Palette V2 (Lab 22). Provisional pending a look on real hardware.
GROUND, PANEL, RAISED = '#0a0908', '#15130f', '#221f19'
ACCENT, DONE, LIVE = '#e4c68c', '#9fae3a', '#df5441'
HI, MID, LO, DIM = '#f6f3ec', '#c9c3b6', '#8c8677', '#6f6a5e'
TICK1, TICK2, TICK3, OFF = '#5a5449', '#7d7666', '#a8a091', '#2a2720'

# Spacing law: between-section >= 3x within-section.
BETWEEN, WITHIN = 46, 11
PAD = 22               # screen side margin

FRAME_W, FRAME_H = 402, 860
SB_H = 54              # status bar; screen top padding must clear 62 total
NAV_RESERVE = 92       # nav bar plus its bottom inset

CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;
       -webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--ground:#0a0908;--panel:#15130f;--raised:#221f19;--accent:#e4c68c;--pos:#9fae3a;
        --live:#df5441;--hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;
        --tick1:#5a5449;--tick2:#7d7666;--tick3:#a8a091}

  .board{display:flex;gap:30px;align-items:flex-start;overflow-x:auto;padding-bottom:8px}
  .col{flex:none;width:402px;display:flex;flex-direction:column;gap:14px}
  .cap{display:flex;flex-direction:column;gap:5px;min-height:188px}
  .cap .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .cap .t{font-size:16px;font-weight:600;color:#f0efec}
  .cap .s{font-size:13px;color:#e4c68c}
  .cap .d{font-size:13px;line-height:1.6;color:#96938c}
  .cap .w{font-size:12px;line-height:1.6;color:#7d786e}
  .sect{max-width:940px;display:flex;flex-direction:column;gap:12px;padding-top:26px}

  .phone{width:402px;height:860px;border-radius:34px;overflow:hidden;position:relative;
         display:flex;flex-direction:column;background:var(--ground);
         border:1px solid rgba(255,255,255,0.08)}
  .field{position:absolute;inset:0;pointer-events:none;z-index:0;
         background-image:radial-gradient(rgba(255,255,255,0.04) 1px,transparent 1px);
         background-size:18px 18px}
  .bloom{position:absolute;border-radius:9999px;pointer-events:none;z-index:0;filter:blur(88px)}
  .sb{position:relative;z-index:2;height:54px;flex:none;display:flex;align-items:center;
      justify-content:space-between;padding:0 26px;font-size:15px;font-weight:600;color:var(--hi)}
  .sb i{width:22px;height:11px;border-radius:3px;border:1px solid var(--lo);display:block}

  /* Content scrolls; it runs under the nav behind a fade rather than stopping short. */
  .scr{position:relative;z-index:2;flex:1;min-height:0;overflow:hidden;padding:0 22px;
       display:flex;flex-direction:column}
  .fade{position:absolute;left:0;right:0;bottom:86px;height:74px;z-index:2;pointer-events:none;
        background:linear-gradient(to top,var(--ground) 18%,transparent)}

  /* Editorial: no cards, no borders, no dividers. Spacing carries the grouping. */
  .sec{padding:46px 0 0;display:flex;flex-direction:column;gap:11px}
  .sec:first-child{padding-top:8px}
  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo);
       font-family:'Geist Mono',ui-monospace,monospace}
  .h1{font-size:30px;font-weight:600;letter-spacing:-0.03em;color:var(--hi);line-height:1.1}
  .h2{font-size:19px;font-weight:600;letter-spacing:-0.02em;color:var(--hi)}
  .r{display:flex;align-items:center}
  .sp{flex:1}
  .lrow{display:flex;align-items:center;gap:12px;padding:7px 0;min-height:44px}
  .num{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums;
       letter-spacing:-0.02em;color:var(--hi)}

  /* M4 (Lab 40), the settled plate treatment. These two rules are what psec()
     and panel() emit classes for, so they live here rather than in one board. */
  .lit{box-shadow:inset 0 1px 0 rgba(255,255,255,0.075),
                  inset 0 -1px 0 rgba(0,0,0,0.28)}
  .ins > .lrow + .lrow{border-top:1px solid rgba(255,255,255,0.07)}
  .ins > .lrow{padding-left:0}

  .glass{background:rgba(255,255,255,0.09);backdrop-filter:blur(30px) saturate(180%);
         -webkit-backdrop-filter:blur(30px) saturate(180%);
         border:0.5px solid rgba(255,255,255,0.19);
         box-shadow:inset 0 1px 0 rgba(255,255,255,0.36), 0 10px 28px rgba(0,0,0,0.42)}

  .navrow{position:relative;z-index:3;flex:none;margin:0 16px 30px;display:flex;align-items:center}
  .fab{border-radius:9999px;display:flex;align-items:center;justify-content:center;
       background:var(--accent);
       box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 26px rgba(0,0,0,0.50)}
  .tabi{flex:1;min-height:52px;display:flex;flex-direction:column;align-items:center;
        justify-content:center;gap:3px}
  .tabl{font-size:11px;letter-spacing:0.05em;font-family:'Geist Mono',ui-monospace,monospace}

  /* Rail — chronological only. Dots cut free of the line. */
  .rail{display:flex;flex-direction:column}
  .rnode{display:flex;gap:14px}
  .rgut{width:11px;flex:none;display:flex;flex-direction:column;align-items:center}
  .rdot{width:7px;height:7px;border-radius:9999px;flex:none;margin-top:5px}
  .rseg{flex:1;width:1px;background:rgba(255,255,255,0.11);margin:6px 0}
  /* A hairline's contrast is relative to what it sits on. 11% white reads on the
     near-black canvas and washes out on a lifted plate, so the rail gets a
     surface-aware variant rather than one fixed alpha. */
  .onplate .rseg{background:rgba(255,255,255,0.20)}
  .rbody{flex:1;min-width:0;padding:0 0 56px;display:flex;flex-direction:column;gap:8px}

  .pill{font-size:11px;letter-spacing:0.10em;padding:2px 7px;border-radius:5px;
        font-family:'Geist Mono',ui-monospace,monospace}
  .hand{width:16px;flex:none;display:flex;flex-direction:column;gap:3px;align-items:center}
  .hand span{width:13px;height:1.5px;border-radius:1px;background:var(--dim)}
  .sheet{position:absolute;left:0;right:0;bottom:0;z-index:4;border-radius:26px 26px 0 0;
         padding:10px 18px 30px;background:rgba(28,25,20,0.86);
         backdrop-filter:blur(34px) saturate(180%);-webkit-backdrop-filter:blur(34px) saturate(180%);
         border-top:0.5px solid rgba(255,255,255,0.20);box-shadow:0 -18px 44px rgba(0,0,0,0.55);
         display:flex;flex-direction:column;gap:9px}
  .grab{width:38px;height:4px;border-radius:9999px;background:rgba(255,255,255,0.22);
        align-self:center;margin-bottom:5px}
  .scrim{position:absolute;inset:0;z-index:3;background:rgba(6,5,4,0.55)}
"""

# ------------------------------------------------------------- fragments ----
ICONS = {
 'today': '<circle cx="11" cy="11" r="8"></circle><path d="M11 5.4 A5.6 5.6 0 0 1 16.6 11"></path>',
 'session': '<path d="M3 11h16"></path><rect x="4.5" y="7" width="3.2" height="8" rx="1"></rect>'
            '<rect x="14.3" y="7" width="3.2" height="8" rx="1"></rect>',
 'strength': '<path d="M3 16 L8 11 L12 13.5 L19 6"></path><path d="M19 10.5 V6 h-4.5"></path>',
 'load': '<path d="M4 17V11"></path><path d="M8.6 17V7"></path><path d="M13.3 17V13"></path>'
         '<path d="M18 17V9"></path>',
 'search': '<circle cx="10" cy="10" r="6"></circle><path d="M14.5 14.5L19 19"></path>',
 'gear': '<circle cx="11" cy="11" r="3"></circle><path d="M11 2v2M11 18v2M2 11h2M18 11h2'
         'M4.6 4.6l1.5 1.5M15.9 15.9l1.5 1.5M17.4 4.6l-1.5 1.5M6.1 15.9l-1.5 1.5"></path>',
 'back': '<path d="M13 4L6 11l7 7"></path>',
 'plus': '<path d="M11 4v14M4 11h14"></path>',
 'cal': '<rect x="3.5" y="5" width="15" height="14" rx="2"></rect><path d="M3.5 9.5h15M7.5 3v4M14.5 3v4"></path>',
 'dots': '<circle cx="11" cy="4.5" r="1.3"></circle><circle cx="11" cy="11" r="1.3"></circle>'
         '<circle cx="11" cy="17.5" r="1.3"></circle>',
}


def ico(kind, col='var(--lo)', sw=1.6, sz=22):
    return ('<svg viewBox="0 0 22 22" style="width:%dpx;height:%dpx;flex:none" fill="none" '
            'stroke="%s" stroke-width="%s" stroke-linecap="round" stroke-linejoin="round">%s</svg>'
            % (sz, sz, col, sw, ICONS[kind]))


CHEV = ('<svg viewBox="0 0 16 16" style="width:13px;height:13px;flex:none" fill="none" '
        'stroke="var(--lo)" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'
        '<path d="M6 3l5 5-5 5"></path></svg>')
GRIP = '<span class="hand"><span></span><span></span><span></span></span>'

TABS = [('today', 'Today'), ('session', 'Session'), ('strength', 'Strength'), ('load', 'Load')]


def nav(active='today', surface='glass'):
    """W2 (Lab 23) — four labelled tabs, inset circular start button, one plane.

    `surface` is the chrome material. Glass is the iOS 26 original; Android has
    no equivalent (expo-glass-effect degrades to a plain View off iOS), so the
    bar there is an opaque plate carrying the same M4 lit edge, with a heavier
    drop shadow doing the separating that blur did.
    """
    def tab(k, lab):
        on = k == active
        c = 'var(--accent)' if on else 'var(--lo)'
        return ('<div class="tabi">%s<span class="tabl" style="color:%s">%s</span></div>'
                % (ico(k, c, 1.9 if on else 1.5), c, lab))
    plus = ('<svg viewBox="0 0 24 24" style="width:22px;height:22px" fill="none" stroke="#15130f" '
            'stroke-width="2.1" stroke-linecap="round"><path d="M12 5v14M5 12h14"></path></svg>')
    if surface == 'glass':
        shell = ('<div class="glass" style="flex:1;border-radius:26px;padding:4px;display:flex;'
                 'align-items:center">')
    else:
        shell = ('<div style="flex:1;border-radius:26px;padding:4px;display:flex;'
                 'align-items:center;background:' + (RAISED if surface == 'raised' else PANEL)
                 + ';box-shadow:inset 0 1px 0 rgba(255,255,255,0.075),'
                   'inset 0 -1px 0 rgba(0,0,0,0.28), 0 12px 30px rgba(0,0,0,0.62)">')
    return ('<div class="navrow">' + shell
            + ''.join(tab(*t) for t in TABS[:2])
            + '<div style="width:66px;flex:none;display:flex;justify-content:center">'
              '<div class="fab" style="width:52px;height:52px">' + plus + '</div></div>'
            + ''.join(tab(*t) for t in TABS[2:]) + '</div></div>')


def phone(scr, active='today', sheet='', bloom=True, chrome=None, scroll=0, surface='glass'):
    """One 402x860 device. `chrome` replaces the nav (a pushed screen has none).

    `scroll` shows the screen already scrolled by that many points, which is the
    only way to review the lower half of a screen that is genuinely longer than
    the frame.
    """
    if scroll:
        scr = '<div style="margin-top:-%dpx">%s</div>' % (scroll, scr)
    blooms = ('<div class="bloom" style="top:40px;right:-40px;width:300px;height:280px;'
              'background:rgba(228,198,140,0.13)"></div>'
              '<div class="bloom" style="bottom:120px;left:-60px;width:280px;height:220px;'
              'background:rgba(159,174,58,0.07)"></div>') if bloom else ''
    return ('<div class="phone"><div class="field"></div>' + blooms
            + '<div class="sb"><span class="mono">9:41</span><i></i></div>'
            + '<div class="scr">' + scr + '</div>'
            + '<div class="fade"></div>'
            + (nav(active, surface) if chrome is None else chrome)
            + sheet + '</div>')


def actionbar(primary, secondary=''):
    """A pushed screen has no tab bar, so its primary action takes that plane."""
    sec_ = ('<div class="glass" style="min-height:56px;flex:none;padding:0 18px;display:flex;'
            'align-items:center;justify-content:center;border-radius:20px">'
            '<span class="mono" style="font-size:13px;letter-spacing:0.10em;color:var(--hi)">'
            + secondary + '</span></div>') if secondary else ''
    return ('<div class="navrow" style="gap:9px">' + sec_
            + '<div style="flex:1;min-height:56px;display:flex;align-items:center;'
              'justify-content:center;background:var(--accent);color:#15130f;border-radius:20px;'
              'font-size:16px;font-weight:600;'
              'box-shadow:inset 0 1px 0 rgba(255,255,255,0.55), 0 10px 26px rgba(0,0,0,0.45)">'
            + primary + '</div></div>')


def head(title, kicker='', right=''):
    """Screen header. Editorial — the title carries it, nothing is ruled off."""
    k = ('<span class="lbl">' + kicker + '</span>') if kicker else ''
    r = ('<span class="sp"></span>' + right) if right else ''
    return ('<div style="padding:10px 0 2px;display:flex;flex-direction:column;gap:5px">' + k
            + '<div class="r" style="gap:10px"><span class="h1">' + title + '</span>' + r
            + '</div></div>')


def back_head(title, kicker='', right=''):
    """A pushed screen: back affordance, no tab bar."""
    r = ('<span class="sp"></span>' + right) if right else ''
    k = ('<span class="lbl">' + kicker + '</span>') if kicker else ''
    return ('<div style="padding:6px 0 2px;display:flex;flex-direction:column;gap:9px">'
            '<div class="r" style="gap:10px;min-height:44px">' + ico('back', 'var(--mid)', 1.8)
            + r + '</div>'
            '<div style="display:flex;flex-direction:column;gap:5px">' + k
            + '<span class="h1">' + title + '</span></div></div>')


def sec(label, body, first=False, right=''):
    r = ('<span class="sp"></span>' + right) if right else ''
    head_ = ('<div class="r"><span class="lbl">' + label + '</span>' + r + '</div>') if label else ''
    style = ' style="padding-top:8px"' if first else ''
    return '<div class="sec"' + style + '>' + head_ + body + '</div>' 


def rail(events, air, on_plate=False):
    """Chronological only — exercise history, session list, PR timeline.

    Dots cut free of the line: the segment stops short of the dot above and
    below it, which is what makes a rail read as discrete events rather than a
    continuous measure.
    """
    out = []
    for i, (dot, body) in enumerate(events):
        last = i == len(events) - 1
        pad = 0 if last else air
        out.append('<div class="rnode"><div class="rgut">'
                   '<span class="rdot" style="background:' + dot + '"></span>'
                   + ('' if last else '<span class="rseg"></span>') + '</div>'
                   '<div class="rbody" style="padding-bottom:' + str(pad) + 'px">' + body
                   + '</div></div>')
    return ('<div class="rail' + (' onplate' if on_plate else '') + '">'
            + ''.join(out) + '</div>')


def pill(text, col=ACCENT, bg=None):
    bg = bg or 'rgba(228,198,140,0.13)'
    return ('<span class="pill" style="color:' + col + ';background:' + bg + '">' + text + '</span>')


def lrow(left, right='', grip=False, chev=True, dim=False):
    """A list row. No border, no fill — 44pt tall so the touch target is real."""
    return ('<div class="lrow"' + (' style="opacity:0.55"' if dim else '') + '>'
            + (GRIP if grip else '') + left + '<span class="sp"></span>' + right
            + (CHEV if chev else '') + '</div>')


def prow(html, pad=14, tone=None, gap=7):
    """One row on its own plate (Lab 42, P2/P5 — chosen round nineteen).

    The containment lands on the thing you touch: the row with an edge is the
    row you press, and the gap between rows replaces every hairline. Costs about
    7pt a row against a grouped plate.
    """
    return ('<div class="lit" style="background:%s;border-radius:12px;padding:0 %dpx;'
            'margin-bottom:%dpx">%s</div>' % (tone or RAISED, pad, gap, html))


def prows(rows, pad=14, tone=None, gap=7):
    """A list as row plates. Put it in `psec(..., plated=False)` — the rows are
    the plates, so the section must not be one as well."""
    return ('<div style="display:flex;flex-direction:column;margin-bottom:-%dpx">' % gap
            + ''.join(prow(r, pad, tone, gap) for r in rows) + '</div>')


def bars(values, active=-1, h=54, w=None, col=ACCENT, base=True):
    """Column chart with a baseline. Lab 27 replaced a bare sparkline with this:
    a line in the middle of nowhere has no ground to be read against."""
    n = len(values)
    top = max(values) or 1
    gap = 4
    cw = w or 8
    cols = []
    for i, v in enumerate(values):
        bh = max(2, round(h * v / top))
        c = col if i == active else 'var(--tick1)'
        cols.append('<span style="width:%dpx;height:%dpx;border-radius:2px;background:%s"></span>'
                    % (cw, bh, c))
    line = ('<span style="height:1px;background:rgba(255,255,255,0.13);margin-top:5px"></span>'
            if base else '')
    return ('<div style="display:flex;flex-direction:column">'
            '<div style="display:flex;align-items:flex-end;gap:%dpx;height:%dpx">%s</div>%s</div>'
            % (gap, h, ''.join(cols), line))


def chart(vals, xfirst, xlast, value=None, w=316, h=76, col=None, fmt='%g', active=-1):
    """A column chart that is never bare (Lab 39).

    Minimum for a chart that is the only view of its data: y min and max
    anchored to the plot, first and last x labels, the latest column in the
    accent with the rest de-emphasised, and its value printed. The section
    label carries the takeaway. Text never wears the series colour.
    """
    col = col or ACCENT
    lo, hi = min(vals), max(vals)
    n = len(vals)
    cw = (w - (n - 1) * 5) / n
    span = (hi - lo) or 1
    cols = ''.join(
        '<span style="width:%.1fpx;height:%.1fpx;border-radius:2px;background:%s"></span>'
        % (cw, 8 + (h - 8) * (v - lo + span * 0.12) / (span * 1.12),
           col if i == active % n else 'rgba(255,255,255,0.16)')
        for i, v in enumerate(vals))
    top = ('<div class="r" style="justify-content:flex-end;padding-bottom:3px">'
           '<span class="num" style="font-size:13px;color:var(--hi)">'
           + (value if value is not None else fmt % vals[active]) + '</span></div>')
    return (top
            + '<div class="r" style="gap:9px;align-items:flex-end">'
              '<div style="display:flex;flex-direction:column;justify-content:space-between;'
              'height:%dpx;padding-bottom:1px">'
              '<span class="mono lbl">%s</span><span class="mono lbl">%s</span></div>'
              '<div style="flex:1;display:flex;flex-direction:column;gap:4px">'
              '<div style="display:flex;align-items:flex-end;gap:5px;height:%dpx">%s</div>'
              '<div style="height:1px;background:rgba(255,255,255,0.15)"></div>'
              '<div class="r"><span class="mono lbl">%s</span><span class="sp"></span>'
              '<span class="mono lbl">%s</span></div></div></div>'
              % (h, fmt % hi, fmt % lo, h, cols, xfirst, xlast))


def panel(body, tone='raised', pad=15, radius=14, cls='lit'):
    """A flat, opaque, lighter plate. NOT a card and NOT glass.

    Apple's insetGrouped stacks TWO signals — a discrete lightness jump
    (#000 -> #1C1C1E, ~11%) AND a real gap. It never relies on spacing alone,
    which is the mechanism the editorial rule was missing. Opaque hex rather
    than a white overlay: a translucent wash on a near-black ground starts
    reading as cheap frosted glass, and glass is reserved for the tab bar.

    `cls` carries the lit edge by default (Lab 40, M4).
    """
    bg = {'panel': PANEL, 'raised': RAISED}[tone]
    c = (' class="' + cls + '"') if cls.strip() else ''   # class="" trips the gate
    return ('<div' + c + ' style="background:%s;border-radius:%dpx;padding:%dpx;'
            'display:flex;flex-direction:column;gap:9px">%s</div>'
            % (bg, radius, pad, body))


def psec(label, body, tone='raised', first=False, right='', pad=15, rule=True,
         plated=True, inset=False):
    """A section, settled at Lab 40's M4.

    Label outside the plate on the canvas with a hairline running to the right
    edge; content on a lit plate; inset separators between rows.

    `plated=False` puts the content straight on the canvas. Use it for anything
    that already carries its own structure — the rail has a spine, a calendar has
    a grid, a chart has a frame. Plating those is containment twice, and it costs
    the rail the open air the pattern was built around.
    """
    if label:
        line = ('<span style="flex:1;height:1px;background:rgba(255,255,255,0.10);'
                'margin-left:11px"></span>') if rule else ''
        r = ('<span class="sp"></span>' + right) if right else ''
        head_ = ('<div class="r" style="padding:0 2px">'
                 '<span class="lbl">' + label + '</span>' + line + r + '</div>')
    else:
        head_ = ''
    style = ' style="padding-top:8px"' if first else ''
    if plated:
        content = panel(body, tone, pad, cls='lit' + (' ins' if inset else ''))
    else:
        content = body
    return '<div class="sec"' + style + '>' + head_ + content + '</div>' 


def tiles(items, cols=2, tone='panel'):
    """Stat tiles, two per row by default.

    Four bare numerals across a 356pt row measured as too dense to parse, and the
    KPI-tile research says four only works when each tile is wide enough to also
    carry a micro-visual — which on a phone forces two. Order within a tile is
    label, number, then the visual.
    """
    # Order inside a tile is label, number, then the visual — the KPI-tile
    # research is consistent on it, and the number must dominate the label by
    # roughly 2x for the tile to scan rather than read.
    cells = []
    for it in items:
        label, value = it[0], it[1]
        right = it[2] if len(it) > 2 else ''
        col = it[3] if len(it) > 3 else HI
        below = it[4] if len(it) > 4 else ''
        cells.append('<div style="display:flex;flex-direction:column;gap:5px;'
                     'padding:11px 12px;background:%s;border-radius:12px">'
                     '<span class="mono lbl">%s</span>'
                     '<div class="r" style="gap:8px">'
                     '<span class="num" style="font-size:22px;font-weight:600;color:%s">%s</span>'
                     '<span class="sp"></span>%s</div>%s</div>'
                     % (RAISED if tone == 'panel' else PANEL, label, col, value, right,
                        ('<div class="r" style="padding-top:2px">' + below + '</div>')
                        if below else ''))
    return ('<div style="display:grid;grid-template-columns:repeat(%d,1fr);gap:7px">%s</div>'
            % (cols, ''.join(cells)))


# ------------------------------------------------- micro-visuals (round 14) ----
# Each of these replaces a number with something readable in about a second.
# They exist because four bare numerals in a row measured as too dense to parse.

def ring(pct, size=44, sw=4, col=None, label=''):
    """A single proportion. Beats a bar when the value is a share of a known
    whole; decoration when it is not."""
    col = col or ACCENT
    r = (size - sw) / 2.0
    c = 2 * 3.14159265 * r
    return ('<svg viewBox="0 0 %d %d" style="width:%dpx;height:%dpx;flex:none">'
            '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="rgba(255,255,255,0.09)" '
            'stroke-width="%d"></circle>'
            '<circle cx="%.1f" cy="%.1f" r="%.1f" fill="none" stroke="%s" stroke-width="%d" '
            'stroke-linecap="round" stroke-dasharray="%.1f %.1f" '
            'transform="rotate(-90 %.1f %.1f)"></circle>%s</svg>'
            % (size, size, size, size, size/2.0, size/2.0, r, sw,
               size/2.0, size/2.0, r, col, sw, c * min(1.0, pct), c, size/2.0, size/2.0,
               ('<text x="%.1f" y="%.1f" text-anchor="middle" dominant-baseline="central" '
                'font-size="11" font-family="Geist Mono, monospace" fill="%s">%s</text>'
                % (size/2.0, size/2.0, MID, label)) if label else ''))


def spark(vals, w=76, h=24, col=None, dot=True):
    """w=None stretches to the container. The viewBox stays numeric and the
    element scales — passing a sentinel like 999 renders a literal 999px box."""
    """A tiny line WITH a baseline. Never ship one without the baseline — a bare
    sparkline was rejected in round seven as 'a random line in the middle of
    nowhere', and the ground is what fixed it."""
    col = col or ACCENT
    _full = w is None
    w = w or 160
    lo, hi = min(vals), max(vals)
    rng = (hi - lo) or 1
    n = len(vals)
    pts = [(w * i / (n - 1), h - 2 - (h - 6) * (v - lo) / rng) for i, v in enumerate(vals)]
    line = ' '.join('%.1f,%.1f' % p for p in pts)
    end = ('<circle cx="%.1f" cy="%.1f" r="2.4" fill="%s"></circle>' % (pts[-1][0]-1, pts[-1][1], col)
           ) if dot else ''
    box = 'width:100%%;height:%dpx' % h if _full else 'width:%dpx;height:%dpx;flex:none' % (w, h)
    return ('<svg viewBox="0 0 %d %d" preserveAspectRatio="none" style="%s">'
            '<line x1="0" y1="%d" x2="%d" y2="%d" stroke="rgba(255,255,255,0.11)" '
            'stroke-width="1"></line>'
            '<polyline points="%s" fill="none" stroke="%s" stroke-width="1.8" '
            'stroke-linecap="round" stroke-linejoin="round" vector-effect="non-scaling-stroke">'
            '</polyline>%s</svg>'
            % (w, h, box, h-1, w, h-1, line, col, end))


def delta(value, positive=True, size=13):
    """A signed change with an arrow. The arrow is what makes it read without
    parsing the sign."""
    col = DONE if positive else LIVE
    arrow = ('<svg viewBox="0 0 10 10" style="width:9px;height:9px;flex:none" fill="none" '
             'stroke="%s" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">'
             '<path d="M5 %s L5 %s M2 %s L5 %s L8 %s"></path></svg>'
             % (col, '8.5' if positive else '1.5', '1.5' if positive else '8.5',
                '4.5' if positive else '5.5', '1.5' if positive else '8.5',
                '4.5' if positive else '5.5'))
    return ('<span class="r" style="gap:3px">' + arrow
            + '<span class="mono" style="font-size:%dpx;color:%s">%s</span></span>'
            % (size, col, value))


def meter(pct, w=76, h=6, col=None, track='rgba(255,255,255,0.08)'):
    """A share of a known whole, horizontally. Cheaper than a ring and reads the
    same; use the ring only where the circle itself means something."""
    col = col or ACCENT
    # Single % — this string is concatenated, not %-formatted. `%` binds tighter
    # than `+`, so a %% here would survive into the output verbatim.
    wid = 'width:100%' if w is None else 'width:%dpx;flex:none' % w
    return ('<span style="' + wid + ';height:%dpx;border-radius:%dpx;background:%s;'
            'display:block;overflow:hidden"><span style="display:block;height:%dpx;width:%.0f%%;'
            'border-radius:%dpx;background:%s"></span></span>'
            % (h, h // 2, track, h, min(100.0, pct * 100), h // 2, col))


HELMET = '''<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
'''

FONTS = ('<link rel="preconnect" href="https://fonts.googleapis.com">\n'
         '<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>\n'
         '<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700'
         '&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">')


def page(n, title, intro, boards, closing='', extra_css=''):
    """Wrap a board in the standard lab page."""
    body = ''
    for heading, blurb, cols in boards:
        if heading:
            body += ('<div class="sect"><h2 style="margin:0;font-size:20px;font-weight:600;'
                     'letter-spacing:-0.02em;color:#f0efec">' + heading + '</h2>'
                     '<p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">' + blurb
                     + '</p></div>')
        body += '<div class="board">' + render(cols) + '</div>'
    return ('<!DOCTYPE html>\n<html>\n<head>\n' + HELMET + '</head>\n<body>\n<x-dc>\n'
            '<helmet data-dc-atomics>\n' + FONTS + '\n<style>' + CSS + extra_css
            + '</style>\n</helmet>\n\n'
            '<div style="min-height:100vh;background:#0a0a0b;color:#f0efec;padding:48px 40px 96px">'
            '<div style="display:flex;flex-direction:column;gap:30px">'
            '<div style="display:flex;flex-direction:column;gap:16px;max-width:940px">'
            '<span style="font-size:11px;font-weight:600;letter-spacing:0.2em;'
            'text-transform:uppercase;color:#d9c9a8">Design lab ' + str(n) + '</span>'
            '<h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;'
            'letter-spacing:-0.03em;color:#f0efec">' + title + '</h1>' + intro + '</div>'
            + body + closing + '</div></div>\n</x-dc>\n</body>\n</html>\n')


def render(cols):
    return ''.join(
      '<div class="col"><div class="cap"><span class="k">' + c[0] + '</span>'
      '<span class="t">' + c[1] + '</span><span class="s">' + c[2] + '</span>'
      '<span class="d">' + c[3] + '</span><span class="w">' + c[4] + '</span></div>'
      + c[5] + '</div>' for c in cols)


def para(text, col='#96938c'):
    return ('<p style="margin:0;font-size:14px;line-height:1.7;color:' + col + '">' + text + '</p>')
