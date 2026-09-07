# Lab 06 - motion. Every tile animates live. Specs are the real Reanimated 4.5.1 calls.

CSS = """
  *{box-sizing:border-box}
  body{margin:0;background:#0a0a0b;font-family:Geist,ui-sans-serif,system-ui,sans-serif;-webkit-font-smoothing:antialiased}
  ::-webkit-scrollbar{width:0;height:0}
  .mono{font-family:'Geist Mono',ui-monospace,monospace;font-variant-numeric:tabular-nums}
  :root{--ground:#0a0908;--panel:#15130f;--accent:#d9c9a8;--pos:#8ce07f;--live:#ff5c1a;
        --hi:#f6f3ec;--mid:#c9c3b6;--lo:#8c8677;--dim:#6f6a5e;--off:#2a2720;--on:#5c574b;--warn:#e8b23a}

  .grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:20px;max-width:1560px}
  .tile{background:var(--panel);border:1px solid rgba(255,255,255,0.08);border-radius:18px;
        padding:16px;display:flex;flex-direction:column;gap:12px;overflow:hidden}
  .th{display:flex;flex-direction:column;gap:4px}
  .th .n{font-size:11px;font-weight:600;letter-spacing:0.16em;color:var(--dim)}
  .th .t{font-size:15px;font-weight:600;color:var(--hi)}
  .th .d{font-size:12px;line-height:1.55;color:#8c8677}
  .stage{height:132px;border-radius:12px;background:#100e0b;border:1px solid rgba(255,255,255,0.05);
         display:flex;align-items:center;justify-content:center;position:relative;overflow:hidden;padding:12px}
  .spec{font-size:11px;line-height:1.6;color:#7d786e;border-top:1px solid rgba(255,255,255,0.07);padding-top:9px;
        word-break:break-word}
  .spec b{color:var(--accent);font-weight:500}
  .hap{display:inline-block;padding:1px 6px;border-radius:4px;background:rgba(255,92,26,0.14);
       color:#ff8a55;font-size:11px;letter-spacing:0.08em}

  /* 1 odometer */
  .odo{display:flex;align-items:baseline;gap:3px}
  .digit{width:26px;height:46px;overflow:hidden;position:relative}
  .strip{position:absolute;left:0;top:0;display:flex;flex-direction:column;font-size:38px;font-weight:600;
         color:var(--hi);line-height:46px;text-align:center;width:26px}
  .d1 .strip{animation:roll1 3.6s cubic-bezier(0.16,1,0.3,1) infinite}
  .d2 .strip{animation:roll2 3.6s cubic-bezier(0.16,1,0.3,1) infinite}
  @keyframes roll1{0%,22%{transform:translateY(0)}42%,100%{transform:translateY(-46px)}}
  @keyframes roll2{0%,22%{transform:translateY(-92px)}42%,100%{transform:translateY(-230px)}}

  /* 2 tuner detent */
  .tapewrap{width:100%;position:relative;height:56px;overflow:hidden}
  .taperun{position:absolute;left:0;top:0;height:44px;display:flex;align-items:flex-end;width:1400px;
           animation:detent 3.4s cubic-bezier(0.34,1.56,0.64,1) infinite}
  @keyframes detent{0%,12%{transform:translateX(-300px)}55%,100%{transform:translateX(-420px)}}
  .taperun i{width:11px;flex:none;border-left:1px solid var(--off);height:34%}
  .taperun i.m{border-left-color:var(--on);height:100%}
  .cidx{position:absolute;left:50%;top:0;bottom:12px;width:0;border-left:2px solid var(--accent);z-index:2}
  .tick-hap{position:absolute;left:50%;bottom:0;transform:translateX(-50%);animation:hapflash 3.4s linear infinite}
  @keyframes hapflash{0%,54%{opacity:0}56%{opacity:1}72%,100%{opacity:0}}

  /* 3 arc fill  4 rest ring  6 PR */
  .arc{width:104px;height:104px}
  .arcfill{stroke-dasharray:283;animation:arcgo 3.4s cubic-bezier(0.16,1,0.3,1) infinite}
  @keyframes arcgo{0%,8%{stroke-dashoffset:283}60%,100%{stroke-dashoffset:74}}
  .restfill{stroke-dasharray:283;animation:restgo 5s linear infinite, resthue 5s linear infinite}
  @keyframes restgo{0%{stroke-dashoffset:0}100%{stroke-dashoffset:283}}
  @keyframes resthue{0%,45%{stroke:#8ce07f}70%{stroke:#e8b23a}90%,100%{stroke:#ff5c1a}}
  .prfill{stroke-dasharray:283;animation:prgo 4s cubic-bezier(0.22,1.2,0.36,1) infinite}
  @keyframes prgo{0%,10%{stroke-dashoffset:118}44%{stroke-dashoffset:-16}56%,100%{stroke-dashoffset:0}}
  .prglow{animation:prglow 4s ease-out infinite}
  @keyframes prglow{0%,38%{opacity:0}50%{opacity:0.85}100%{opacity:0.22}}
  .arcnum{position:absolute;font-size:22px;font-weight:600;color:var(--hi)}

  /* 5 set complete */
  .segs{display:flex;gap:5px;width:100%}
  .segs span{flex:1;height:6px;border-radius:2px;background:var(--off)}
  .segs span.done{background:var(--pos)}
  .segs span.pop{background:var(--pos);animation:pop 2.6s cubic-bezier(0.34,1.56,0.64,1) infinite;transform-origin:center}
  @keyframes pop{0%,40%{background:var(--off);transform:scaleY(1)}50%{background:var(--pos);transform:scaleY(2.1)}
                 62%,100%{background:var(--pos);transform:scaleY(1)}}

  /* 7 swipe */
  .swipe{width:100%;position:relative;height:52px;border-radius:10px;overflow:hidden;background:#3a1109}
  .swipe .del{position:absolute;right:14px;top:0;bottom:0;display:flex;align-items:center;
              font-size:11px;letter-spacing:0.14em;color:#ff8a55}
  .swipe .card{position:absolute;inset:0;background:#1d1a15;border-radius:10px;display:flex;align-items:center;
               padding:0 14px;gap:8px;animation:swipe 4s cubic-bezier(0.33,1,0.68,1) infinite}
  @keyframes swipe{0%,12%{transform:translateX(0)}38%{transform:translateX(-96px)}
                   48%{transform:translateX(-108px)}58%{transform:translateX(-402px)}100%{transform:translateX(-402px)}}

  /* 8 morph, in context */
  .m8{position:absolute;inset:0;padding:10px 12px}
  .m8row{position:absolute;left:12px;right:12px;bottom:12px;height:26px;border-radius:6px;background:#1d1a15;
         display:flex;align-items:center;gap:8px;padding:0 9px;font-size:11px}
  .m8ghost{position:absolute;left:12px;bottom:12px;width:132px;height:26px;border-radius:6px;
           background:var(--accent);opacity:0;animation:m8g 4.4s cubic-bezier(0.16,1,0.3,1) infinite}
  @keyframes m8g{0%,16%{opacity:0;transform:translate(0,0) scale(1)}
                 22%{opacity:0.9;transform:translate(0,0) scale(1)}
                 58%{opacity:0.12;transform:translate(24px,-74px) scale(0.34,1.9)}
                 100%{opacity:0;transform:translate(24px,-74px) scale(0.34,1.9)}}
  .m8arc{position:absolute;left:50%;top:6px;transform:translateX(-50%);width:78px;height:78px}
  .m8sweep{stroke-dasharray:220;animation:m8s 4.4s cubic-bezier(0.16,1,0.3,1) infinite}
  @keyframes m8s{0%,44%{stroke-dashoffset:92}72%,100%{stroke-dashoffset:52}}
  .m8num{position:absolute;left:0;right:0;top:32px;text-align:center;font-size:19px;font-weight:600;color:var(--hi)}
  .m8a{animation:m8fa 4.4s steps(1,end) infinite}
  .m8b{animation:m8fb 4.4s steps(1,end) infinite}
  @keyframes m8fa{0%,52%{opacity:1}53%,100%{opacity:0}}
  @keyframes m8fb{0%,52%{opacity:0}53%,100%{opacity:1}}

  /* 10 glass merge, in context */
  .m10{position:absolute;inset:0;display:flex;align-items:center;justify-content:center}
  .pill{position:absolute;height:40px;border-radius:12px;display:flex;align-items:center;justify-content:center;
        font-size:11px;letter-spacing:0.10em;color:var(--hi);
        background:rgba(255,255,255,0.11);border:0.5px solid rgba(255,255,255,0.22);
        box-shadow:inset 0 1px 0 rgba(255,255,255,0.34)}
  .pA{width:74px;left:24px;animation:pA 4s cubic-bezier(0.5,0,0.2,1) infinite}
  .pB{width:74px;right:24px;animation:pB 4s cubic-bezier(0.5,0,0.2,1) infinite}
  .pM{width:180px;animation:pM 4s cubic-bezier(0.5,0,0.2,1) infinite;opacity:0}
  @keyframes pA{0%,18%{transform:translateX(0);opacity:1}44%{transform:translateX(30px);opacity:0}
                62%{transform:translateX(30px);opacity:0}86%,100%{transform:translateX(0);opacity:1}}
  @keyframes pB{0%,18%{transform:translateX(0);opacity:1}44%{transform:translateX(-30px);opacity:0}
                62%{transform:translateX(-30px);opacity:0}86%,100%{transform:translateX(0);opacity:1}}
  @keyframes pM{0%,26%{opacity:0;transform:scaleX(0.72)}46%,60%{opacity:1;transform:scaleX(1)}
                80%,100%{opacity:0;transform:scaleX(0.72)}}

  /* 9 skeleton */
  .sk{width:100%;display:flex;flex-direction:column;gap:9px}
  .skl{height:8px;border-radius:2px;border:1px solid var(--on);animation:skp 2.4s ease-in-out infinite}
  .skl:nth-child(2){animation-delay:0.12s}.skl:nth-child(3){animation-delay:0.24s}
  .skl:nth-child(4){animation-delay:0.36s}
  @keyframes skp{0%,100%{opacity:0.26}50%{opacity:0.62}}

  /* 10 glass merge */
  .goo{width:100%;height:96px;position:relative;filter:blur(7px) contrast(22)}
  .goo b{position:absolute;top:26px;height:44px;border-radius:9999px;background:#cfc2a4;display:block}
  .goo .g1{left:16px;width:60px;animation:m1 3.6s ease-in-out infinite}
  .goo .g2{left:132px;width:60px;animation:m2 3.6s ease-in-out infinite}
  @keyframes m1{0%,100%{transform:translateX(0)}50%{transform:translateX(46px)}}
  @keyframes m2{0%,100%{transform:translateX(0)}50%{transform:translateX(-46px)}}

  /* 11 live pulse */
  .pulse{width:11px;height:11px;border-radius:9999px;background:var(--live);position:relative}
  .pulse::after{content:'';position:absolute;inset:-4px;border-radius:9999px;border:1px solid var(--live);
                animation:pu 2s cubic-bezier(0.16,1,0.3,1) infinite}
  @keyframes pu{0%{transform:scale(0.7);opacity:0.9}100%{transform:scale(2.4);opacity:0}}

  /* 12 shift ladder */
  .lad{display:flex;gap:5px;width:100%}
  .lad span{flex:1;height:22px;border-radius:2px;background:var(--off)}
  .lad span.l{animation:lad 3.4s steps(1,end) infinite}
  .lad span:nth-child(1){animation-delay:0.0s}.lad span:nth-child(2){animation-delay:0.22s}
  .lad span:nth-child(3){animation-delay:0.44s}.lad span:nth-child(4){animation-delay:0.66s}
  .lad span:nth-child(5){animation-delay:0.88s}.lad span:nth-child(6){animation-delay:1.10s}
  @keyframes lad{0%{background:var(--off)}12%,72%{background:var(--cur)}86%,100%{background:var(--off)}}
  .lad span.term{animation:term 3.4s ease-out infinite;animation-delay:1.32s}
  @keyframes term{0%,38%{background:var(--off);box-shadow:none}
                  44%{background:var(--live);box-shadow:0 0 16px var(--live)}
                  56%{background:#3a1109;box-shadow:none}
                  64%{background:var(--live);box-shadow:0 0 16px var(--live)}
                  78%,100%{background:var(--off);box-shadow:none}}
"""

def arc(cls, color, off, extra=''):
    return ('<svg class="arc" viewBox="0 0 104 104">'
            '<circle cx="52" cy="52" r="45" fill="none" stroke="var(--off)" stroke-width="6"></circle>'
            '%s'
            '<circle %scx="52" cy="52" r="45" fill="none" stroke="%s" stroke-width="6" '
            'stroke-linecap="round" stroke-dashoffset="%s" transform="rotate(-90 52 52)"></circle></svg>'
            % (extra, ('class="%s" % cls' if False else ('class="' + cls + '" ' if cls else '')), color, off))

TILES = [
 ('01','Rolling numeral','A changed digit rolls; unchanged digits hold still. Static jump-cuts read as unresponsive when numbers are the content.',
  '<div class="odo mono"><span class="digit d1"><span class="strip">1<br>1</span></span>'
  '<span class="digit"><span class="strip">0</span></span>'
  '<span class="digit d2"><span class="strip">0<br>1<br>2<br>3<br>4<br>5</span></span>'
  '<span style="font-size:13px;color:var(--mid)" class="mono">KG</span></div>',
  'Per-digit <b>translateY</b> strip, only changed digits animate. <b>withTiming(280&ndash;420ms, Easing.out(cubic))</b>, duration scaled by magnitude of change. Needs tabular figures or the width jitters. No RN package worth taking &mdash; ~50 lines.'),

 ('02','Tuner detent','Release, decay, then spring past the target and settle back. Underdamped on purpose: that overshoot is what makes it feel mechanical.',
  '<div class="tapewrap"><div class="taperun">' + ''.join(
      ('<i class="m"></i>' if i % 10 == 0 else '<i></i>') for i in range(120)) +
  '</div><span class="cidx"></span><span class="tick-hap"><span class="hap mono">selectionAsync</span></span></div>',
  '<b>Gesture.Pan</b> &rarr; <b>withDecay({velocity, clamp})</b> &rarr; <b>withSpring(nearestTick, {damping:26, stiffness:220, mass:0.6})</b>. Fire <b>Haptics.selectionAsync()</b> per tick crossed, gated on velocity so it does not machine-gun.'),

 ('03','Arc to target','Fast out of the gate, slow into position. Reads as settling into a value, not counting up to it.',
  '<div style="position:relative;display:flex;align-items:center;justify-content:center">' +
  arc('arcfill', 'var(--accent)', '283') + '<span class="arcnum mono">74</span></div>',
  'Skia arc <b>sweepAngle</b> off a SharedValue via <b>useDerivedValue</b> &mdash; canvas only, zero React re-render. <b>withTiming(600ms, Easing.bezier(0.16,1,0.3,1))</b>.'),

 ('04','Rest countdown','Linear sweep, hue crossing two real thresholds. Driven from a timestamp, not accumulated ticks, so backgrounding cannot drift it.',
  '<div style="position:relative;display:flex;align-items:center;justify-content:center">' +
  arc('restfill', 'var(--pos)', '0') + '<span class="arcnum mono">1:12</span></div>',
  '<b>withTiming(0, {duration: remainingMs, easing: Easing.linear})</b> recomputed from <b>Date.now()</b> on every foreground. Colour via <b>interpolateColor</b> on the same driver &mdash; one animation, not two.'),

 ('05','Set logged','Fires on every set, so it must never feel like it blocks input. Under 250ms, one segment only.',
  '<div class="segs"><span class="done"></span><span class="done"></span><span class="done"></span>'
  '<span class="pop"></span><span></span></div>'
  '<span class="hap mono" style="position:absolute;bottom:14px">impactAsync&nbsp;Rigid</span>',
  '<b>withSequence(withTiming(1.08,{duration:80}), withSpring(1,{damping:14}))</b> on scale. <b>Haptics.impactAsync(ImpactFeedbackStyle.Rigid)</b>. Total budget 250ms.'),

 ('06','PR overdrive','No confetti. The gauge you were already reading sweeps past its own ceiling and blooms, then settles. Same vocabulary, turned up.',
  '<div style="position:relative;display:flex;align-items:center;justify-content:center">' +
  arc('prfill', 'var(--accent)', '118',
      '<circle class="prglow" cx="52" cy="52" r="45" fill="none" stroke="var(--accent)" stroke-width="13" '
      'opacity="0" style="filter:blur(9px)"></circle>') +
  '<span class="arcnum mono">PR</span></div>',
  'Overshoot past 100% with <b>withSpring</b>, hold a Skia <b>BlurMask</b> bloom ~600ms, settle. <b>Haptics.notificationAsync(Success)</b> &mdash; the one place in the app that haptic is earned.'),

 ('07','Swipe to delete','Haptic at the threshold crossing, not on every pixel of the drag. Siblings reflow themselves.',
  '<div class="swipe"><span class="del mono">DELETE</span>'
  '<div class="card"><span class="mono" style="font-size:11px;color:var(--dim)">04</span>'
  '<span style="font-size:13px;color:var(--mid)">Leg Press</span>'
  '<span style="flex:1"></span><span class="mono" style="font-size:11px;color:var(--lo)">3 x 12</span></div></div>',
  '<b>Gesture.Pan</b> + Reanimated <b>Layout</b> on siblings for the collapse. Under threshold &rarr; <b>withSpring</b> back to 0. Past it &rarr; <b>withTiming</b> slide-out. <b>impactAsync(Medium)</b> once, at the crossing.'),

 ('08','Logged set feeds the gauge','You tap Log. The row you just wrote lifts off the table, travels into the e1RM arc, and the arc takes the new value. It answers &ldquo;where did that number go&rdquo; without a screen change.',
  '<div class="m8">'
  '<svg class="m8arc" viewBox="0 0 78 78">'
  '<circle cx="39" cy="39" r="35" fill="none" stroke="var(--off)" stroke-width="5"></circle>'
  '<circle class="m8sweep" cx="39" cy="39" r="35" fill="none" stroke="var(--accent)" stroke-width="5" '
  'stroke-linecap="round" stroke-dashoffset="92" transform="rotate(-90 39 39)"></circle></svg>'
  '<span class="m8num mono"><span class="m8a">127</span>'
  '<span class="m8b" style="position:absolute;left:0;right:0;color:var(--accent)">130</span></span>'
  '<span class="mono" style="position:absolute;left:0;right:0;top:56px;text-align:center;font-size:11px;'
  'letter-spacing:0.14em;color:var(--dim)">e1RM</span>'
  '<div class="m8row mono"><span style="color:var(--dim)">04</span>'
  '<span style="color:var(--hi)">102.5</span><span style="color:var(--mid)">x 8</span>'
  '<span style="flex:1"></span><span style="color:var(--accent)">130</span></div>'
  '<div class="m8ghost"></div></div>',
  'The most expensive of the twelve and the easiest to cut. Measure the row with <b>measure()</b>, animate a positioned clone <b>withTiming(380ms, Easing.out(exp))</b>, cross-fade into the arc at ~70%. There is no native primitive to lean on &mdash; expo-router&rsquo;s zoom is alpha and Stack-only, Reanimated&rsquo;s shared elements are behind an experimental flag. <b>Skip it if it does not earn the code.</b>'),

 ('09','Waiting for signal','No shimmer sweep &mdash; shimmer reads as a generic app. Dim outlines breathing reads as an instrument with no input yet, and costs one opacity animation.',
  '<div class="sk"><span class="skl"></span><span class="skl"></span><span class="skl"></span><span class="skl"></span></div>',
  '<b>withRepeat(withTiming(0.6, {duration:1200}), -1, true)</b> on stroke opacity, staggered ~120ms per row. Cheaper than a moving gradient mask and on-vocabulary.'),

 ('10','Rest controls fuse','Where you would actually see it: rest starts, so <span style="color:#c9c3b6">+30s</span> and <span style="color:#c9c3b6">SKIP</span> slide together and become one countdown pill. Rest ends and it splits back into two buttons.',
  '<div class="m10">'
  '<div class="pill pA mono">+30s</div>'
  '<div class="pill pB mono">SKIP</div>'
  '<div class="pill pM mono">REST &middot; 01:12</div></div>',
  'Put both controls in a <b>GlassContainer</b> and animate the gap; when it drops under the container&rsquo;s <b>spacing</b> threshold iOS merges the shapes itself &mdash; the fusing is native, you only move the controls. Never fade a GlassView with opacity:0 (it kills the render); use <b>GlassEffectStyleConfig {animate:true, animationDuration}</b>.'),

 ('11','Live','A single ring leaving the dot. One element, one meaning, no accompanying sound or haptic &mdash; it runs for the whole session.',
  '<div style="display:flex;align-items:center;gap:10px"><span class="pulse"></span>'
  '<span class="mono" style="font-size:11px;letter-spacing:0.14em;color:var(--live)">LIVE &middot; LOWER A</span></div>',
  '<b>withRepeat(withTiming(2.4, {duration:2000, easing: Easing.out(exp)}), -1)</b> on scale, opacity to 0 in parallel. Transform and opacity only &mdash; it must never touch layout.'),

 ('12','Shift ladder','Approaching a real limit, one cell per real unit. The last cell is qualitatively different, not just more of the same colour.',
  '<div class="lad" style="--cur:var(--pos)">'
  '<span class="l"></span><span class="l" style="--cur:var(--pos)"></span>'
  '<span class="l" style="--cur:#b8d96a"></span><span class="l" style="--cur:var(--warn)"></span>'
  '<span class="l" style="--cur:#f0862c"></span><span class="term"></span></div>',
  'From the RP volume model: one cell per working set toward MRV. Unlit cells stay visibly dimmed. Terminal cell gets a flash the others never get &mdash; breach reads as a different kind of event, not a fuller bar.'),
]

# cut: 08 (set to arc) and 10 (glass merge) - both judged unnecessary movement.
TILES = [t for t in TILES if t[0] not in ('08','10')]
TILES = [('%02d' % (i+1),) + t[1:] for i, t in enumerate(TILES)]

tiles = ''.join(
  '<div class="tile"><div class="th"><span class="n mono">%s</span><span class="t">%s</span>'
  '<span class="d">%s</span></div><div class="stage">%s</div>'
  '<div class="spec mono">%s</div></div>' % t for t in TILES)

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
<style>''' + CSS + '''</style>
</helmet>

<div style="min-height:100vh;background:#0a0a0b;color:#f0efec;padding:48px 40px 96px">
  <div style="display:flex;flex-direction:column;gap:36px">
    <div style="display:flex;flex-direction:column;gap:16px;max-width:900px">
      <span style="font-size:11px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:#d9c9a8">Design lab 06</span>
      <h1 style="margin:0;font-size:40px;font-weight:600;line-height:1.1;letter-spacing:-0.03em;color:#f0efec">Motion</h1>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#96938c">Every tile is <span style="color:#f0efec">running</span>, not a diagram of running. The spec under each one is the actual call to write against the versions Expo SDK&nbsp;57 pins: Reanimated 4.5.1, Worklets 0.10.1, Gesture&nbsp;Handler 3.1.0, Skia 2.6.2, expo-haptics 57.0.1.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66">Three rules underneath all of it. Transform and opacity only &mdash; never layout. Anything per-frame stays on the UI thread; one <span style="color:#96938c">runOnJS</span> in a hot path is how 120&nbsp;fps quietly becomes 60. And haptics are a budget, not a garnish: selection for detents, impact for a logged set, notification reserved for a PR.</p>
      <p style="margin:0;font-size:14px;line-height:1.7;color:#6f6c66"><span style="color:#a8705f">Cut since the last pass:</span> the logged-set-into-gauge morph and the glass merge. Both were movement for its own sake &mdash; the progress bar already says a set landed, and fusing the rest controls added distraction without adding information. Ten left, and every one of them is doing a job.</p>
    </div>
    <div class="grid">''' + tiles + '''</div>
  </div>
</div>
</x-dc>
</body>
</html>
'''
open('lab06.html','w').write(HTML)
print('wrote lab06.html', len(HTML))
