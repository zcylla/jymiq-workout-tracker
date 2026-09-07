// Geometry check for a rendered board. Paste as the function body of
// browser_evaluate after serving the page. Returns [] when the board is clean.
//
// Catches the three things gate.py cannot see, because they are layout, not markup:
//   1. Core type crossing the ring's gold arc. The binding radius is r-22, NOT
//      where the ticks end — this shipped twice before the check existed.
//   2. A phone body taller than its 860pt frame.
//   3. A sheet taller than its own box.
//
// Assumes lab31's dial(): r = w/2 - (45 with reference numerals, else 26).
() => {
  const bad = [];
  document.querySelectorAll('.col').forEach(col => {
    const k = col.querySelector('.cap .k')?.textContent ?? '?';
    const d = col.querySelector('.dial');
    if (d) {
      const db = d.getBoundingClientRect();
      const w = db.width, cy = db.top + w / 2;
      const rArc = w / 2 - (col.querySelector('.dial svg text') ? 45 : 26) - 22;
      col.querySelectorAll('.core > *').forEach(el => {
        const b = el.getBoundingClientRect();
        const dy = Math.max(Math.abs(b.top - cy), Math.abs(b.bottom - cy));
        const chord = Math.sqrt(Math.max(0, rArc * rArc - dy * dy));
        if (b.width / 2 > chord - 2)
          bad.push(`${k} core "${el.textContent.trim().slice(0, 16)}" ` +
                   `half=${Math.round(b.width / 2)} chord=${Math.round(chord)}`);
      });
    }
    // Fill. A flex column that under-fills reports scrollHeight === clientHeight,
    // so scrollHeight sees nothing — measure the last child's bottom against the
    // scroll box instead. Six of the sixteen screens under-filled on their first
    // build, one by 257pt, and this is the only check that catches it.
    col.querySelectorAll('.scr').forEach(scr => {
      const kids = scr.children;
      if (!kids.length) return;
      const box = scr.getBoundingClientRect();
      const end = kids[kids.length - 1].getBoundingClientRect().bottom;
      const slack = Math.round(box.bottom - end);
      if (slack > 60) bad.push(`${k} under-fills by ${slack}`);
      if (slack < -8) bad.push(`${k} overflows by ${-slack}`);
    });

    const body = col.querySelector('.body');
    if (body && body.scrollHeight > body.clientHeight)
      bad.push(`${k} body overflows by ${body.scrollHeight - body.clientHeight}`);
    const sheet = col.querySelector('.sheet');
    if (sheet && sheet.scrollHeight > sheet.clientHeight + 1)
      bad.push(`${k} sheet overflows`);
  });
  // Anything inside a phone wider than its own box, except deliberate clipping.
  document.querySelectorAll('.phone *').forEach(el => {
    if (el.scrollWidth > el.clientWidth + 1 && el.clientWidth > 0 &&
        !el.classList.contains('track'))
      bad.push(`wide: ${el.className || el.tagName} ${el.clientWidth}/${el.scrollWidth}`);
  });
  return [...new Set(bad)];
}
