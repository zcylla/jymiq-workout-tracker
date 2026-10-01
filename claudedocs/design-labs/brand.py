"""Regenerate the selected A1.4a brand assets and an external review sheet.

Run from any directory with Python 3, Pillow and /usr/bin/rsvg-convert.
The profile geometry is copied from the owner's logo exploration.
"""

import io
import math
import subprocess
from pathlib import Path
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[2]
BRAND = ROOT / 'assets/brand'
IMAGES = ROOT / 'assets/images'
REVIEW = Path('/tmp/claude-1000/-home-inowu-Desktop-Projects-personal-jymiq-workout-tracker/f3aac079-a4dd-41ec-b0c0-439b8167f523/scratchpad/brand-check.png')
NOTIFICATION_REVIEW = REVIEW.with_name('notif-check.png')
GROUND = '#0a0908'
GOLD = '#e4c68c'
WHITE = '#f6f3ec'
COLOURS = {'h': WHITE, 'a': GOLD, 'm': '#a8a091', 't2': '#7d7666', 'd': '#5a5449'}
CONFIG = dict(count=48, cursor=33, rim=45, gain=2.2, width_floor=1.15,
              centre=3.5, weight=1.2)
SMALL = CONFIG | dict(count=28, cursor=19, weight=1.65, width_floor=1.8,
                      gold_zone=2, sigma=2, centre=1.5, cursor_gain=1.1)

def point(radius, angle):
    a = math.radians(angle)
    return 50 + radius * math.cos(a), 50 + radius * math.sin(a)


def line(start, end, role, width):
    return (f'<path stroke="{COLOURS[role]}" stroke-width="{width:.6f}" '
            f'd="M{start[0]:.6f} {start[1]:.6f}L{end[0]:.6f} {end[1]:.6f}"/>')


def profile(count=49, cursor=33, rim=45, closed=False, major=True,
            gain=1, swell_gain=None, width_floor=0, colour='app', centre=0,
            gap=60, major_every=4, weight=1, ramp='app', gold_zone=3,
            sigma=3, bulge_gain=1, cursor_gain=1, cursor_white=False,
            major_gain=1, centre_gold=False):
    swell_gain = gain if swell_gain is None else swell_gain
    ticks, paths = [], []
    step = 360 / count if closed else (360-gap) / (count - 1)
    start = -90 if closed else -270+gap/2
    scale = rim / 139
    for i in range(count):
        angle = start + i * step
        lit, big = i < cursor, major and i % major_every == 0
        base_length = (16 if big else 10) if lit else (10 if big else 5)
        base_width = (2 if big else 1.4) if lit else 1
        distance = abs(i - cursor)
        if closed:
            distance = min(distance, count - distance)
        swell = math.exp(-(distance / sigma) ** 2) if distance <= max(6, 2*sigma) else 0
        if big:
            base_length *= major_gain
            base_width *= major_gain
        length = base_length * scale * gain + 15 * scale * swell_gain * swell
        bulge = 5 * scale * swell_gain * swell * bulge_gain
        width = max(base_width * scale * gain, (1 + 2.2 * swell) * scale * gain, width_floor)
        role = ('m' if big else 't2') if lit else 'd'
        if ramp == 'lift':
            role = ('m' if big else 'm') if lit else 't2'
        if ramp == 'majors' and big and not lit:
            role = 'm'
        if colour == 'gold' and lit:
            role = 'a'
        if distance <= gold_zone:
            role = 'a'
        if i == cursor:
            width = max(3 * scale * gain, width_floor) * cursor_gain
            length = max(length, 26 * scale * swell_gain)
            bulge = max(bulge, 6 * scale * swell_gain * bulge_gain)
            role = 'h' if cursor_white or colour == 'gold' else 'a'
        width *= weight
        outer, inner = rim + bulge, rim - length
        a, b = point(outer, angle), point(inner, angle)
        paths.append(line(a, b, role, width))
        ticks.append(dict(i=i, angle=angle, outer=outer, inner=inner, width=width,
                          swell=swell, lit=lit, major=big, start=a, end=b))
    if centre:
        paths.append(line((50, 50), (50, 50), 'a' if centre_gold else 'h', centre * 2))
    return ''.join(paths), ticks


WORD = '<g transform="translate(0 72)"><path fill="none" stroke="#f6f3ec" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M22-40V6C22 18 16 24 5 24"/><circle fill="#e4c68c" cx="22" cy="-60" r="5.5"/><g transform="translate(-9 0)"><path fill="none" stroke="#f6f3ec" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M50-40L65.3 0M78-40L59 20"/><path fill="none" stroke="#f6f3ec" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M96-40V0M96-22A10 17 0 0 1 116-22V0M116-22A10 17 0 0 1 136-22V0"/><path fill="none" stroke="#f6f3ec" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M156-40V0"/><circle fill="#e4c68c" cx="156" cy="-60" r="5.5"/><circle fill="none" stroke="#f6f3ec" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" cx="196" cy="-20" r="20"/><path fill="none" stroke="#f6f3ec" stroke-width="8" stroke-linecap="round" stroke-linejoin="round" d="M216-40V24"/></g></g>'


def svg(body, box='0 0 100 100'):
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{box}" '
            f'fill="none" stroke-linecap="round" stroke-linejoin="round">{body}</svg>\n')


def background():
    dots = ''.join(f'<circle cx="{x}" cy="{y}" r=".55" fill="{WHITE}" fill-opacity=".07"/>'
                   for y in range(1, 101, 7) for x in range(1, 101, 7))
    return (f'<defs><radialGradient id="bloom" cx="50%" cy="40%" r="62%">'
            f'<stop offset="0" stop-color="{GOLD}" stop-opacity=".16"/>'
            f'<stop offset="1" stop-color="{GOLD}" stop-opacity="0"/>'
            f'</radialGradient></defs><rect width="100" height="100" fill="{GROUND}"/>'
            + dots + '<rect width="100" height="100" fill="url(#bloom)"/>')


def transformed(mark, scale):
    return f'<g transform="translate(50 50) scale({scale:.12f}) translate(-50 -50)">{mark}</g>'


def monochrome(mark, colour=WHITE, ahead_opacity='.55'):
    for role, source_colour in COLOURS.items():
        opacity = ahead_opacity if role == 'd' else '1'
        mark = mark.replace(f'stroke="{source_colour}"', f'stroke="{colour}" stroke-opacity="{opacity}"')
    return mark


def render(source, size):
    result = subprocess.run(['/usr/bin/rsvg-convert', '-w', str(size), '-h', str(size)],
                            input=source.encode(), stdout=subprocess.PIPE, check=True)
    return Image.open(io.BytesIO(result.stdout)).convert('RGBA')


def radial_check(name):
    im = Image.open(IMAGES / name).convert('RGBA')
    alpha = im.getchannel('A')
    centre = im.width / 2
    distances = [(math.hypot(x + .5 - centre, y + .5 - centre), a)
                 for y in range(im.height) for x in range(im.width)
                 if (a := alpha.getpixel((x, y))) > 0]
    any_radius = max(d for d, a in distances)
    opaque_radius = max(d for d, a in distances if a == 255)
    limit = im.width * 33 / 108
    assert any_radius + math.sqrt(.5) <= limit
    print(f'{name}: opaque radius={opaque_radius:.6f}px; nonzero-alpha radius={any_radius:.6f}px; '
          f'pixel-corner bound={any_radius + math.sqrt(.5):.6f}px; safe radius={limit:.6f}px; '
          f'alpha bounds={alpha.getbbox()}')


def review_sheet():
    sheet = Image.new('RGB', (1440, 1460), GROUND)
    draw = ImageDraw.Draw(sheet)
    draw.text((24, 14), 'Jymiq / A1.4a Full presence / generated asset review', fill=WHITE)
    names = ['icon.png', 'android-icon-background.png', 'android-icon-foreground.png',
             'android-icon-monochrome.png', 'splash-icon.png', 'favicon.png']
    for i, name in enumerate(names):
        x, y = 24 + (i % 3) * 472, 52 + (i // 3) * 292
        draw.text((x, y), name, fill=WHITE)
        im = Image.open(IMAGES / name).convert('RGBA').resize((220, 220), Image.Resampling.LANCZOS)
        for j, bg in enumerate([GROUND, WHITE]):
            panel = Image.new('RGBA', (220, 220), bg)
            panel.alpha_composite(im)
            sheet.paste(panel.convert('RGB'), (x + j * 228, y + 24))
            draw.text((x + j * 228, y + 250), 'dark' if j == 0 else 'light', fill=WHITE)
    bg = Image.open(IMAGES / 'android-icon-background.png').convert('RGBA')
    fg = Image.open(IMAGES / 'android-icon-foreground.png').convert('RGBA')
    composite = Image.alpha_composite(bg, fg).resize((220, 220), Image.Resampling.LANCZOS)
    for i, shape in enumerate(['circle', 'squircle', 'rounded square']):
        mask = Image.new('L', (880, 880), 0)
        md = ImageDraw.Draw(mask)
        if shape == 'circle':
            md.ellipse((0, 0, 879, 879), fill=255)
        elif shape == 'rounded square':
            md.rounded_rectangle((0, 0, 879, 879), radius=176, fill=255)
        else:
            pts = []
            for n in range(720):
                a = n * math.tau / 720
                c, s = math.cos(a), math.sin(a)
                pts.append((439.5 + 439.5 * math.copysign(abs(c)**.5, c),
                            439.5 + 439.5 * math.copysign(abs(s)**.5, s)))
            md.polygon(pts, fill=255)
        panel = Image.new('RGB', (220, 220), WHITE)
        panel.paste(composite, (0, 0), mask.resize((220, 220), Image.Resampling.LANCZOS))
        sheet.paste(panel, (24 + i * 472, 684))
        draw.text((24 + i * 472, 656), 'Adaptive composite / ' + shape, fill=WHITE)
    mono = Image.open(IMAGES / 'android-icon-monochrome.png').convert('RGBA')
    mono = mono.resize((48, 48), Image.Resampling.LANCZOS)
    draw.text((24, 942), 'Themed alpha at 48px / gold and white', fill=WHITE)
    for i, colour in enumerate([GOLD, '#ffffff']):
        tint = Image.new('RGBA', (48, 48), colour)
        tint.putalpha(mono.getchannel('A'))
        sheet.paste(tint, (24 + i * 92, 970), tint)
        sheet.paste(tint.resize((192, 192), Image.Resampling.NEAREST),
                    (240 + i * 220, 970), tint.resize((192, 192), Image.Resampling.NEAREST))
    fav = Image.open(IMAGES / 'favicon.png').convert('RGB')
    draw.text((740, 942), 'Favicon / 28 ticks / 1:1 and 8x', fill=WHITE)
    sheet.paste(fav, (740, 970))
    sheet.paste(fav.resize((384, 384), Image.Resampling.NEAREST), (820, 970))
    draw.text((24, 1220), 'Splash / actual 76px image width on app ground', fill=WHITE)
    splash = Image.open(IMAGES / 'splash-icon.png').convert('RGBA').resize((76, 76), Image.Resampling.LANCZOS)
    sheet.paste(splash, (24, 1252), splash)
    draw.text((140, 1280), 'No device or native build verification', fill=WHITE)
    REVIEW.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(REVIEW)


def notification_review_sheet():
    icon = Image.open(IMAGES / 'notification-icon.png').convert('RGBA')
    sheet = Image.new('RGB', (1280, 1170), GROUND)
    draw = ImageDraw.Draw(sheet)
    draw.text((24, 16), 'Jymiq / notification alpha / 28 ticks / ahead opacity 80%', fill=WHITE)
    for column, (bg, colour, label) in enumerate([
            (GROUND, GOLD, 'gold on dark'), (GROUND, '#ffffff', 'white on dark'),
            (WHITE, GOLD, 'gold on light'), (WHITE, '#ffffff', 'white on light')]):
        x = 24 + column * 312
        draw.text((x, 48), label, fill=WHITE)
        for row, size in enumerate([96, 72, 48]):
            y = 76 + row * 112
            tint = Image.new('RGBA', (size, size), colour)
            tint.putalpha(icon.getchannel('A').resize((size, size), Image.Resampling.LANCZOS))
            panel = Image.new('RGBA', (112, 104), bg)
            panel.alpha_composite(tint, ((112-size)//2, (104-size)//2))
            sheet.paste(panel.convert('RGB'), (x, y))
            draw.text((x + 124, y + 42), f'{size}px', fill=WHITE)
    draw.text((24, 422), '72px / 8x nearest-neighbour / gold and white on dark', fill=WHITE)
    for column, colour in enumerate([GOLD, '#ffffff']):
        tint = Image.new('RGBA', (72, 72), colour)
        tint.putalpha(icon.getchannel('A').resize((72, 72), Image.Resampling.LANCZOS))
        zoom = tint.resize((576, 576), Image.Resampling.NEAREST)
        sheet.paste(zoom, (24 + column * 624, 450), zoom)
    draw.text((24, 1050), 'Mock status bar / 24dp at xxhdpi (3x) / white', fill=WHITE)
    clock = Image.new('RGBA', (30, 12), (255, 255, 255, 0))
    ImageDraw.Draw(clock).text((0, 0), '9:41', fill=WHITE)
    clock = clock.resize((90, 36), Image.Resampling.NEAREST)
    sheet.paste(clock, (24, 1104), clock)
    tint = Image.new('RGBA', (72, 72), '#ffffff')
    tint.putalpha(icon.getchannel('A').resize((72, 72), Image.Resampling.LANCZOS))
    sheet.paste(tint, (138, 1086), tint)
    NOTIFICATION_REVIEW.parent.mkdir(parents=True, exist_ok=True)
    sheet.save(NOTIFICATION_REVIEW)


def main():
    BRAND.mkdir(parents=True, exist_ok=True)
    mark, ticks = profile(**CONFIG)
    small, small_ticks = profile(**SMALL)
    mono = monochrome(mark)
    small_extent = max(abs(p[axis] - 50) + t['width']/2
                       for t in small_ticks for p in (t['start'], t['end']) for axis in (0, 1))
    notification_scale = (96/2 - 2) / (small_extent * 96/100)
    notification = svg(transformed(monochrome(small, '#ffffff', '.8'), notification_scale))
    bg = background()
    sources = {'jymiq-mark.svg': svg(mark), 'jymiq-mark-mono.svg': svg(mono),
               'jymiq-mark-small.svg': svg(small),
               'jymiq-notification.svg': notification,
               'jymiq-icon.svg': svg(bg + transformed(mark, .78)),
               'jymiq-wordmark.svg': svg(WORD, '0 0 215 102')}
    for name, source in sources.items():
        (BRAND / name).write_text(source)
    radius = max(max(abs(t['outer']), abs(t['inner'])) + t['width']/2 for t in ticks)
    extent = max(abs(p[axis] - 50) + t['width']/2
                 for t in ticks for p in (t['start'], t['end']) for axis in (0, 1))
    safe_scale = (1024 * 33 / 108 - 2) / (radius * 1024 / 100)
    print(f'Geometry: radial extent={radius:.9f}; symmetric box half-extent={extent:.9f}; '
          f'adaptive scale={safe_scale:.12f}; 2px raster margin')
    outputs = {'icon.png': render(sources['jymiq-icon.svg'], 1024).convert('RGB'),
               'android-icon-background.png': render(svg(bg), 1024).convert('RGB'),
               'android-icon-foreground.png': render(svg(transformed(mark, safe_scale)), 1024),
               'android-icon-monochrome.png': render(svg(transformed(mono, safe_scale)), 1024),
               'splash-icon.png': render(svg(mark, f'{50-extent/.88:.12f} {50-extent/.88:.12f} '
                                            f'{2*extent/.88:.12f} {2*extent/.88:.12f}'), 512),
               'favicon.png': render(svg(bg + transformed(small, .78)), 48).convert('RGB'),
               'notification-icon.png': render(notification, 96)}
    for name in ['android-icon-monochrome.png', 'notification-icon.png']:
        themed = outputs[name]
        white = Image.new('RGBA', themed.size, '#ffffff')
        white.putalpha(themed.getchannel('A'))
        outputs[name] = white
    for name, im in outputs.items():
        im.save(IMAGES / name)
    radial_check('android-icon-foreground.png')
    radial_check('android-icon-monochrome.png')
    review_sheet()
    notification_review_sheet()
    print(f'Review: {REVIEW}')
    print(f'Notification review: {NOTIFICATION_REVIEW}')


if __name__ == '__main__':
    main()
