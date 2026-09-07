#!/usr/bin/env python3
"""Regenerate assets/icons/ui/ from lucide-static.

The icon set is Lucide, re-stroked to the boards' ratio. This script is the
mapping: kit's icon names on the left, the Lucide file and the stroke width on
the right. Run it after changing either, then `npx expo prebuild` to rebuild the
font (react-native-nano-icons fingerprints the folder).

The stroke is baked into the glyph, so it is set per icon to land on kit's
ON-SCREEN weight at the size that icon is actually drawn:

    22pt icons   kit 1.6/22   -> 1.6pt  -> 24-box stroke 1.745
    back  (22pt) kit 1.8/22   -> 1.8pt  -> 1.96
    chev  (13pt) kit 1.7/16   -> 1.38pt -> 2.55
    up/down (9pt) kit 1.8/10  -> 1.62pt -> 4.32
"""
import pathlib
import re
import sys

ICONS = {
    'today': ('clock', 1.745),
    'session': ('dumbbell', 1.745),
    'strength': ('trending-up', 1.745),
    'load': ('chart-column', 1.745),
    'search': ('search', 1.745),
    'gear': ('settings', 1.745),
    'plus': ('plus', 1.745),
    'cal': ('calendar', 1.745),
    'dots': ('ellipsis-vertical', 1.745),
    'back': ('chevron-left', 1.96),
    'chev': ('chevron-right', 2.55),
    'up': ('arrow-up', 4.32),
    'down': ('arrow-down', 4.32),
}

root = pathlib.Path(__file__).resolve().parent.parent
src = root / 'node_modules/lucide-static/icons'
out = root / 'assets/icons/ui'


def main() -> int:
    missing = [f for f, _ in ICONS.values() if not (src / f'{f}.svg').exists()]
    if missing:
        print(f'not in lucide-static: {missing}', file=sys.stderr)
        return 1

    out.mkdir(parents=True, exist_ok=True)
    for stale in out.glob('*.svg'):
        if stale.stem not in ICONS:
            stale.unlink()

    for name, (fname, stroke) in ICONS.items():
        svg = (src / f'{fname}.svg').read_text()
        svg = re.sub(r'stroke-width="[^"]*"', f'stroke-width="{stroke}"', svg)
        # picosvg splits layers by colour, and currentColor is not one.
        svg = svg.replace('stroke="currentColor"', 'stroke="#000000"')
        svg = re.sub(r'\s*class="[^"]*"', '', svg)
        (out / f'{name}.svg').write_text(svg)
        print(f'{name:9s} <- {fname:18s} stroke {stroke}')
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
