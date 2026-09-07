# Lab 05 - one dense Live-session screen, five material languages, identical markup.
SKINS = [
 ('S1', 'Glass', 'Lab 03 as built. Liquid-glass chrome floating over solid lit panels, soft 18px radii, ambient bloom as the light source.'),
 ('S2', 'Milled', 'Nothing floats. Every surface is cut from one billet: raised pads, recessed pockets, engraved grooves, one light direction from top-left. Zero blur.'),
 ('S3', 'Blueprint', 'Stroke only. Panels are hairline rules with registration crops, fills become 45 hatch, the graticule is the background. Drafting, not product.'),
 ('S4', 'Phosphor', 'A lit readout behind glass. Scanline field, numerals and ticks carry their own bloom, panels are dark wells with a thin emissive rule.'),
 ('S5', 'Solid state', 'No material at all. Flat fills, 1px hairlines, 4px radii, no bloom, no grid, no gradient. The discipline test: does the layout hold with nothing to hide behind?'),
]

BASE_CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  .board{display:flex;gap:28px;align-items:flex-start;overflow-x:auto;padding-bottom:8px}
  .col{flex:none;width:402px;display:flex;flex-direction:column;gap:14px}
  .cap{display:flex;flex-direction:column;gap:5px;min-height:96px}
  .cap .k{font-size:11px;font-weight:600;letter-spacing:0.18em;color:#6f6c66}
  .cap .t{font-size:16px;font-weight:600;letter-spacing:-0.01em;color:#f0efec}
  .cap .d{font-size:13px;font-weight:400;line-height:1.6;color:#96938c}

  .phone{width:402px;height:860px;border-radius:34px;overflow:hidden;position:relative;display:flex;
         flex-direction:column;background:var(--ground);border:1px solid rgba(255,255,255,0.08)}
  .field{position:absolute;inset:0;pointer-events:none;z-index:0}
  .bloom{position:absolute;border-radius:9999px;pointer-events:none;z-index:0;filter:blur(84px)}
  .b1{top:96px;left:-76px;width:300px;height:300px;background:rgba(217,201,168,0.22)}
  .b2{bottom:40px;right:-90px;width:280px;height:280px;background:rgba(140,224,127,0.12)}

  .sb{position:relative;z-index:2;height:58px;flex:none;display:flex;align-items:center;justify-content:space-between;padding:0 26px}
  .sb .t{font-size:15px;font-weight:600;color:var(--hi)}
  .sb .i{width:22px;height:11px;border-radius:3px;border:1px solid var(--lo)}
  .body{position:relative;z-index:2;flex:1;min-height:0;padding:0 18px;display:flex;flex-direction:column;gap:9px}

  .lbl{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--lo)}
  .lblA{font-size:11px;font-weight:500;letter-spacing:0.14em;color:var(--accent)}
  .r{display:flex;align-items:center}
  .rb{display:flex;align-items:baseline}
  .sp{flex:1}
  .g4{gap:4px}.g6{gap:6px}.g8{gap:8px}.g10{gap:10px}.g14{gap:14px}
  .col2{display:flex;flex-direction:column}

  /* --- shared instrument geometry (skins repaint, never re-measure) --- */
  .seg{flex:1;height:4px;border-radius:1px}
  .tape{position:relative;height:38px;display:flex;align-items:flex-end;overflow:hidden}
  .tape .t{flex:1;border-left-width:1px;border-left-style:solid}
  .idx{position:absolute;left:50%;top:0;bottom:0;width:0;border-left:2px solid var(--accent);z-index:3}
  .rung{flex:1;height:16px;border-radius:2px}
  .ring{width:48px;height:48px;flex:none}
  .plate{border-radius:2px;flex:none}
  .qbar{width:3px;height:13px;border-radius:1px;flex:none}
  .divider{height:1px;margin:2px 0}

  .key{min-height:44px;display:flex;align-items:center;justify-content:center;padding:0 16px;
       font-size:15px;font-weight:600}
  .keyS{min-height:34px;min-width:56px;display:flex;align-items:center;justify-content:center;padding:0 12px;
        font-size:13px;font-weight:500}
  .bar{position:relative;z-index:3;flex:none;margin:10px 18px 30px;display:flex;gap:10px}
  .num{font-size:52px;font-weight:600;letter-spacing:-0.04em;line-height:0.95;color:var(--hi)}
  .num2{font-size:52px;font-weight:600;letter-spacing:-0.04em;line-height:0.95;color:var(--hi)}
  .unit{font-size:13px;color:var(--mid)}
  .tbl{display:flex;flex-direction:column}
  .tr{display:flex;align-items:center;height:23px;font-size:11px}
"""

# ---- per-skin CSS ------------------------------------------------------
SKIN_CSS = {}

SKIN_CSS['S1'] = """
  --ground:#0a0908; --panel:#15130f; --accent:#d9c9a8; --pos:#8ce07f; --live:#ff5c1a;
  --hi:#f6f3ec; --mid:#c9c3b6; --lo:#8c8677; --dim:#6f6a5e; --off:#2a2720; --on:#5c574b;
  --tick1:#5a5449; --tick2:#7d7666; --tick3:#a8a091;
}
.S1 .field{background-image:radial-gradient(rgba(255,255,255,0.045) 1px, transparent 1px);background-size:18px 18px}
.S1 .panel{background:#15130f;border:1px solid rgba(255,255,255,0.08);border-radius:18px;padding:13px 15px;
           display:flex;flex-direction:column;position:relative}
.S1 .hero{background:rgba(255,255,255,0.08);backdrop-filter:blur(28px) saturate(180%);-webkit-backdrop-filter:blur(28px) saturate(180%);
          border:0.5px solid rgba(255,255,255,0.18);border-radius:22px;
          box-shadow:inset 0 1px 0 rgba(255,255,255,0.35), inset 0 -1px 0 rgba(0,0,0,0.20), 0 8px 24px rgba(0,0,0,0.35)}
.S1 .chip{background:rgba(255,255,255,0.10);backdrop-filter:blur(20px) saturate(180%);-webkit-backdrop-filter:blur(20px) saturate(180%);
          border:0.5px solid rgba(255,255,255,0.18);border-radius:12px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.35);color:var(--hi)}
.S1 .key{background:var(--accent);color:#15130f;border-radius:14px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.5)}
.S1 .keyS{background:rgba(255,255,255,0.10);border:0.5px solid rgba(255,255,255,0.18);border-radius:10px;color:var(--hi)}
.S1 .divider{background:rgba(255,255,255,0.08)}
.S1 .seg,.S1 .rung,.S1 .plate,.S1 .qbar{border-radius:2px}
"""

SKIN_CSS['S2'] = """
  --ground:#121110; --panel:#17150f; --accent:#dccaa6; --pos:#8ce07f; --live:#ff5c1a;
  --hi:#f4f1ea; --mid:#c4bdb0; --lo:#8b857a; --dim:#6d685e; --off:#2b2823; --on:#5f594d;
  --tick1:#5d5649; --tick2:#807765; --tick3:#aaa290;
}
.S2 .field{background-image:repeating-linear-gradient(118deg, rgba(255,255,255,0.016) 0 1px, transparent 1px 4px)}
.S2 .bloom{opacity:0.30;filter:blur(110px)}
.S2 .panel{background:linear-gradient(#1b1813,#141210);border-radius:9px;padding:13px 15px;
           display:flex;flex-direction:column;position:relative;
           box-shadow:inset 1px 1px 0 rgba(255,255,255,0.085), inset -1px -1px 0 rgba(0,0,0,0.60), 0 2px 3px rgba(0,0,0,0.45)}
.S2 .hero{background:#0d0c0a;border-radius:9px;
          box-shadow:inset 2px 3px 6px rgba(0,0,0,0.85), inset -1px -1px 0 rgba(255,255,255,0.055)}
.S2 .chip{background:linear-gradient(#242019,#191611);border-radius:8px;color:var(--hi);
          box-shadow:inset 1px 1px 0 rgba(255,255,255,0.10), inset -1px -1px 0 rgba(0,0,0,0.6), 0 2px 2px rgba(0,0,0,0.5)}
.S2 .key{background:linear-gradient(#e9dcbe,#c6b491);color:#141210;border-radius:8px;
         box-shadow:inset 0 1px 0 rgba(255,255,255,0.75), inset 0 -1px 0 rgba(0,0,0,0.35), 0 2px 2px rgba(0,0,0,0.55)}
.S2 .keyS{background:linear-gradient(#242019,#191611);border-radius:7px;color:var(--hi);
          box-shadow:inset 1px 1px 0 rgba(255,255,255,0.10), inset -1px -1px 0 rgba(0,0,0,0.6)}
.S2 .divider{background:rgba(0,0,0,0.60);box-shadow:0 1px 0 rgba(255,255,255,0.06)}
.S2 .seg,.S2 .rung,.S2 .plate,.S2 .qbar{border-radius:1px;box-shadow:inset 0 1px 0 rgba(255,255,255,0.22)}
.S2 .tape{border-radius:4px;box-shadow:inset 0 2px 4px rgba(0,0,0,0.7)}
"""

SKIN_CSS['S3'] = """
  --ground:#07090a; --panel:transparent; --accent:#d9c9a8; --pos:#8ce07f; --live:#ff5c1a;
  --hi:#eef1f0; --mid:#b6bcbb; --lo:#7f8785; --dim:#636b69; --off:#232a2b; --on:#4d5654;
  --tick1:#4f5856; --tick2:#727c7a; --tick3:#9aa3a1;
}
.S3 .field{background-image:linear-gradient(rgba(255,255,255,0.028) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.028) 1px, transparent 1px),
                            linear-gradient(rgba(255,255,255,0.055) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255,255,255,0.055) 1px, transparent 1px);
           background-size:22px 22px, 22px 22px, 110px 110px, 110px 110px}
.S3 .bloom{opacity:0.16;filter:blur(120px)}
.S3 .panel{background:transparent;border:1px solid rgba(217,201,168,0.26);border-radius:2px;padding:13px 15px;
           display:flex;flex-direction:column;position:relative}
.S3 .panel::before,.S3 .panel::after{content:'';position:absolute;width:9px;height:9px;border-color:var(--accent);border-style:solid}
.S3 .panel::before{left:-1px;top:-1px;border-width:1px 0 0 1px}
.S3 .panel::after{right:-1px;bottom:-1px;border-width:0 1px 1px 0}
.S3 .hero{border-color:rgba(217,201,168,0.50)}
.S3 .chip{background:transparent;border:1px solid rgba(238,241,240,0.30);border-radius:2px;color:var(--hi)}
.S3 .key{background:transparent;border:1px solid var(--accent);border-radius:2px;color:var(--accent);
         box-shadow:inset 0 0 0 3px rgba(217,201,168,0.07)}
.S3 .keyS{background:transparent;border:1px solid rgba(238,241,240,0.30);border-radius:2px;color:var(--hi)}
.S3 .divider{background:rgba(217,201,168,0.20)}
.S3 .seg,.S3 .rung,.S3 .plate,.S3 .qbar{border-radius:0}
.S3 .fill{background-image:repeating-linear-gradient(45deg, currentColor 0 1px, transparent 1px 4px)}
"""

SKIN_CSS['S4'] = """
  --ground:#060807; --panel:#0b0f0c; --accent:#e8cf9a; --pos:#8ce07f; --live:#ff6a2a;
  --hi:#f2ead6; --mid:#c2c9b8; --lo:#8a9184; --dim:#6b7268; --off:#1c231d; --on:#4f5a4c;
  --tick1:#4c574a; --tick2:#6f7b6c; --tick3:#9aa596;
}
.S4 .field{background-image:repeating-linear-gradient(rgba(0,0,0,0.34) 0 1px, transparent 1px 3px),
                            radial-gradient(ellipse at 50% 42%, transparent 44%, rgba(0,0,0,0.55) 100%)}
.S4 .bloom{opacity:0.45;filter:blur(96px)}
.S4 .panel{background:rgba(9,13,10,0.76);border:1px solid rgba(140,224,127,0.16);border-radius:6px;padding:13px 15px;
           display:flex;flex-direction:column;position:relative;box-shadow:inset 0 0 22px rgba(0,0,0,0.6)}
.S4 .hero{border-color:rgba(232,207,154,0.34);box-shadow:inset 0 0 26px rgba(0,0,0,0.65), 0 0 22px rgba(232,207,154,0.09)}
.S4 .chip{background:rgba(232,207,154,0.10);border:1px solid rgba(232,207,154,0.34);border-radius:5px;color:var(--accent);
          text-shadow:0 0 9px rgba(232,207,154,0.8)}
.S4 .key{background:rgba(232,207,154,0.17);border:1px solid var(--accent);border-radius:6px;color:var(--accent);
         text-shadow:0 0 11px rgba(232,207,154,0.85);box-shadow:0 0 20px rgba(232,207,154,0.20), inset 0 0 14px rgba(232,207,154,0.10)}
.S4 .keyS{background:rgba(242,234,214,0.07);border:1px solid rgba(242,234,214,0.26);border-radius:5px;color:var(--hi)}
.S4 .divider{background:rgba(140,224,127,0.16)}
.S4 .num,.S4 .num2{text-shadow:0 0 20px currentColor, 0 0 5px rgba(255,255,255,0.35)}
.S4 .glow{text-shadow:0 0 10px currentColor}
.S4 .seg,.S4 .rung,.S4 .plate,.S4 .qbar{border-radius:0;box-shadow:0 0 7px currentColor}
"""

SKIN_CSS['S5'] = """
  --ground:#0d0d0c; --panel:#191917; --accent:#d9c9a8; --pos:#8ce07f; --live:#ff5c1a;
  --hi:#f6f4ef; --mid:#c7c3ba; --lo:#8e8a80; --dim:#6f6b62; --off:#2e2e2b; --on:#5f5c55;
  --tick1:#5f5c55; --tick2:#827e75; --tick3:#aaa69c;
}
.S5 .field{background:none}
.S5 .bloom{display:none}
.S5 .panel{background:#191917;border:none;border-radius:4px;padding:13px 15px;display:flex;flex-direction:column;position:relative}
.S5 .hero{background:#22221f;border-radius:4px}
.S5 .chip{background:#262623;border-radius:4px;color:var(--hi)}
.S5 .key{background:var(--accent);color:#0d0d0c;border-radius:4px}
.S5 .keyS{background:#262623;border-radius:4px;color:var(--hi)}
.S5 .divider{background:rgba(255,255,255,0.10)}
.S5 .seg,.S5 .rung,.S5 .plate,.S5 .qbar{border-radius:0}
"""

# ---- the one screen, written once --------------------------------------
def ticks():
    """Tuner tape: 1 tick per 0.5 kg from 95.0 to 110.0, major every 5 kg, centre index at 102.5.
    Three visible weights - half-kg, whole-kg, five-kg - all lifted so they read on glass."""
    out = []
    v = 95.0
    while v <= 110.0001:
        major = abs(v % 5.0) < 0.01
        whole = abs(v % 1.0) < 0.01
        if major:   h, c = '100%', 'var(--tick3)'
        elif whole: h, c = '62%',  'var(--tick2)'
        else:       h, c = '38%',  'var(--tick1)'
        out.append('<span class="t" style="height:%s;border-left-color:%s"></span>' % (h, c))
        v += 0.5
    return ''.join(out)

def setmeter():
    st = [('done','var(--pos)'),('done','var(--pos)'),('done','var(--pos)'),
          ('live','var(--accent)'),('todo','var(--off)')]
    return ''.join('<span class="seg" style="background:%s"></span>' % c for _, c in st)

def rpe():
    """RPE ladder, reverted to the original reading: one hue, opacity carries the level.
    Filled rungs step up in opacity toward the current value; the current rung is solid accent."""
    out = []
    for i in range(10):
        if i == 7:  style = 'background:var(--accent)'
        elif i < 7: style = 'background:var(--accent);opacity:%.2f' % (0.28 + 0.07 * i)
        else:       style = 'background:var(--off)'
        out.append('<span class="rung" style="%s"></span>' % style)
    return ''.join(out)

SETS = [('01','100.0','08','7.5','127'),('02','102.5','08','8.0','130'),('03','102.5','07','8.5','128')]
PLATES = [('25','var(--plate-r)','28px','56px'),('15','var(--plate-y)','18px','50px'),('1.25','var(--plate-w)','7px','20px')]
QUEUE = [('Romanian Deadlift','3 x 10','80'),('Leg Press','3 x 12','160'),('Leg Curl','3 x 15','45')]

def screen(sk):
    rows = ''.join(
      '<div class="tr"><span class="mono" style="width:26px;color:var(--dim)">%s</span>'
      '<span class="sp"></span>'
      '<span class="mono" style="width:52px;text-align:right;color:var(--hi)">%s</span>'
      '<span class="mono" style="width:34px;text-align:right;color:var(--mid)">x %s</span>'
      '<span class="mono" style="width:42px;text-align:right;color:var(--lo)">%s</span>'
      '<span class="mono" style="width:46px;text-align:right;color:var(--accent)">%s</span></div>' % s
      for s in SETS)
    plates = ''.join(
      '<span class="plate" style="width:%s;height:%s;background:%s"></span>' % (w, h, c)
      for _, c, w, h in PLATES)
    platelbl = ''.join(
      '<span class="mono" style="width:%s;text-align:center;font-size:11px;color:var(--dim)">%s</span>' % (w, n)
      for n, _, w, _h in PLATES)
    queue = ''.join(
      '<div class="r g8" style="height:21px"><span class="qbar" style="background:var(--off)"></span>'
      '<span style="flex:1;font-size:13px;color:var(--mid)">%s</span>'
      '<span class="mono" style="font-size:11px;color:var(--lo)">%s</span>'
      '<span class="mono" style="font-size:11px;width:38px;text-align:right;color:var(--dim)">%s</span></div>' % q
      for q in QUEUE)

    return f'''<div class="phone {sk}">
  <div class="field"></div><div class="bloom b1"></div><div class="bloom b2"></div>
  <div class="sb"><span class="t mono">9:41</span><span class="i"></span></div>
  <div class="body">

    <div class="r g10" style="flex:none;height:52px">
      <div class="chip" style="width:40px;height:40px;display:flex;align-items:center;justify-content:center;font-size:15px">&lt;</div>
      <div class="col2 g4" style="flex:1">
        <div class="r g6"><span class="qbar" style="width:5px;height:5px;border-radius:9999px;background:var(--live)"></span>
          <span class="mono lbl glow" style="color:var(--live)">LIVE &middot; LOWER A</span></div>
        <span class="mono" style="font-size:21px;font-weight:500;letter-spacing:-0.01em;color:var(--hi)">00:31:17</span>
      </div>
      <div class="col2 g4" style="align-items:flex-end">
        <span class="mono lbl">12 SETS</span><span class="mono lbl">3.7 T</span>
      </div>
    </div>

    <div class="col2 g6" style="flex:none">
      <div class="rb g8"><span style="font-size:22px;font-weight:600;letter-spacing:-0.02em;color:var(--hi)">Barbell Squat</span>
        <span class="sp"></span><span class="mono lbl">QUADS</span></div>
      <div class="r g4" style="height:4px">{setmeter()}</div>
    </div>

    <div class="panel hero g10" style="flex:none">
      <div class="rb g8">
        <span class="num mono">102.5</span><span class="unit mono">KG</span>
        <span class="sp"></span>
        <span class="num2 mono">8</span><span class="unit mono">REPS</span>
      </div>
      <div class="tape">{ticks()}<span class="idx"></span></div>
      <div class="r" style="justify-content:space-between">
        <span class="mono" style="font-size:11px;color:var(--tick2)">95</span>
        <span class="mono" style="font-size:11px;color:var(--tick2)">100</span>
        <span class="mono" style="font-size:11px;font-weight:500;color:var(--accent)">102.5</span>
        <span class="mono" style="font-size:11px;color:var(--tick2)">105</span>
        <span class="mono" style="font-size:11px;color:var(--tick2)">110</span>
      </div>
      <div class="divider"></div>
      <div class="r g8"><span class="mono lbl" style="width:30px">RPE</span>
        <div class="r g4" style="flex:1">{rpe()}</div>
        <span class="mono" style="font-size:13px;color:var(--accent)">8.0</span></div>
    </div>

    <div class="panel g6" style="flex:none">
      <div class="tr"><span class="mono lbl" style="width:26px">SET</span><span class="sp"></span>
        <span class="mono lbl" style="width:52px;text-align:right">KG</span>
        <span class="mono lbl" style="width:34px;text-align:right">REPS</span>
        <span class="mono lbl" style="width:42px;text-align:right">RPE</span>
        <span class="mono lbl" style="width:46px;text-align:right">e1RM</span></div>
      <div class="divider"></div>
      <div class="tbl">{rows}</div>
    </div>

    <div class="panel g8" style="flex:none">
      <div class="r"><span class="mono lbl">PER SIDE &middot; 20 KG BAR</span><span class="sp"></span>
        <span class="mono lbl">41.25 KG</span></div>
      <div class="r g4" style="align-items:flex-end;height:58px">{plates}<span class="sp"></span>
        <span class="mono" style="font-size:11px;color:var(--dim)">+ COLLAR</span></div>
      <div class="r g4">{platelbl}</div>
    </div>

    <div class="panel g6" style="flex:none">
      <div class="r g10">
        <svg class="ring" viewBox="0 0 48 48">
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--off)" stroke-width="3"></circle>
          <circle cx="24" cy="24" r="20" fill="none" stroke="var(--live)" stroke-width="3" stroke-linecap="round"
                  stroke-dasharray="126" stroke-dashoffset="46" transform="rotate(-90 24 24)"></circle>
        </svg>
        <div class="col2 g4" style="flex:1">
          <span class="mono lbl" style="color:var(--live)">REST</span>
          <span class="mono" style="font-size:24px;font-weight:500;color:var(--hi)">01:12</span>
        </div>
        <div class="keyS mono">+30s</div>
        <div class="keyS mono">SKIP</div>
      </div>
      <div class="divider"></div>
      <div class="col2">{queue}</div>
    </div>

  </div>
  <div class="bar">
    <div class="keyS chip" style="width:56px;min-height:52px;font-size:17px">&equiv;</div>
    <div class="key" style="flex:1;min-height:52px">Log set 4</div>
  </div>
</div>'''

# ---- assemble ----------------------------------------------------------
plate_vars = '--plate-b:#2f6fb0;--plate-g:#3f7a52;--plate-w:#d0cbc2;--plate-r:#c0392b;--plate-y:#d4a017;'
css = BASE_CSS + '\n'.join('.%s{%s%s' % (k, plate_vars, v) for k, v in SKIN_CSS.items())

cols = ''.join(
  '<div class="col"><div class="cap"><span class="k">%s</span><span class="t">%s</span>'
  '<span class="d">%s</span></div>%s</div>' % (k, name, desc, screen(k))
  for k, name, desc in SKINS)

HTML = '''<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet data-dc-atomics>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Geist:wght@400;500;600;700&family=Geist+Mono:wght@400;500;600&display=swap" rel="stylesheet">
<style>''' + css + '''</style>
</helmet>

<div style="min-height:100vh;background:#0a0a0b;color:#f0efec;padding:48px 40px 96px">
  <div style="display:flex;flex-direction:column;gap:40px">

    <div style="display:flex;flex-direction:column;gap:16px;max-width:900px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 05</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Five materials, one screen</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">One live-session screen written once. Every column renders the <span style="color:#f0efec">same markup at the same measurements</span> &mdash; only the surface language is swapped. Layout, content, hierarchy and hit areas are held constant so the material is the only thing you are judging.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Denser than Lab 03: the dead space above the action bar is now a plate breakdown and the up-next queue. Tuner tape is a real scale &mdash; one tick per 0.5&nbsp;kg from 95 to 110, major rule every 5&nbsp;kg, index locked to 102.5.</p>
    </div>

    <div class="board">''' + cols + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab05.html','w').write(HTML)
print('wrote lab05.html', len(HTML), 'bytes')
