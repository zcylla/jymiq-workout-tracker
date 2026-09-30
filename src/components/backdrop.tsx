import { BlurStyle, PaintStyle, type SkCanvas, Skia } from '@shopify/react-native-skia';
import { Image, type ImageRef } from 'expo-image';
import { useEffect, useState } from 'react';
import { PixelRatio, StyleSheet, useWindowDimensions, View } from 'react-native';

import { useGlassTrial } from '@/data/glass-trial';
import type { Background } from '@/lib/glass-trial';
import { backgrounds, field } from '@/theme';

function drawField(canvas: SkCanvas, width: number, height: number, background: Background) {
  if (background === 'dots') {
    const dot = Skia.Paint();
    dot.setAntiAlias(true);
    dot.setColor(Skia.Color(field.dot));
    const dots = Skia.PathBuilder.Make();
    const half = field.pitch / 2;
    for (let y = half; y < height; y += field.pitch) {
      for (let x = half; x < width; x += field.pitch) dots.addCircle(x, y, 1);
    }
    canvas.drawPath(dots.build(), dot);
  } else if (background === 'grid' || background === 'hatch') {
    const { line, pitch } = backgrounds[background];
    const paint = Skia.Paint();
    paint.setAntiAlias(true);
    paint.setStyle(PaintStyle.Stroke);
    paint.setStrokeWidth(0.5);
    paint.setColor(Skia.Color(line));
    const lines = Skia.PathBuilder.Make();
    if (background === 'grid') {
      for (let x = pitch / 2; x < width; x += pitch) lines.moveTo(x, 0).lineTo(x, height);
      for (let y = pitch / 2; y < height; y += pitch) lines.moveTo(0, y).lineTo(width, y);
    } else {
      for (let x = -height; x < width; x += pitch) lines.moveTo(x, 0).lineTo(x + height, height);
    }
    canvas.drawPath(lines.build(), paint);
  }

  const bloom = Skia.Paint();
  bloom.setAntiAlias(true);
  if (background === 'mesh') {
    const [gold, olive, copper] = backgrounds.mesh.blooms;
    bloom.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, backgrounds.mesh.blur, true));
    bloom.setColor(Skia.Color(gold));
    canvas.drawOval(Skia.XYWHRect(width - 260, 20, 340, 320), bloom);
    bloom.setColor(Skia.Color(olive));
    canvas.drawOval(Skia.XYWHRect(-100, height * 0.38, 320, 300), bloom);
    bloom.setColor(Skia.Color(copper));
    canvas.drawOval(Skia.XYWHRect(width - 220, height * 0.68, 320, 300), bloom);
    return;
  }
  bloom.setColor(Skia.Color(field.bloom));
  bloom.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, field.bloomBlur, true));
  canvas.drawOval(Skia.XYWHRect(width + 40 - 300, 40, 300, 280), bloom);
  canvas.drawOval(Skia.XYWHRect(-60, height - 120 - 220, 280, 220), bloom);

  if (background === 'orbs') {
    const { colors, radius, blur } = backgrounds.orbs;
    const spots = [
      [0.22, 0.24],
      [0.8, 0.4],
      [0.25, 0.6],
      [0.78, 0.8],
    ];
    bloom.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, blur, true));
    spots.forEach(([fx, fy], i) => {
      bloom.setColor(Skia.Color(colors[i]));
      canvas.drawCircle(width * fx, height * fy, radius, bloom);
    });
  }
}

/**
 * The field is drawn once per window size into an off-screen surface and shared
 * as one decoded bitmap: every screen used to mount its own full-screen Skia
 * canvas, and the tabs and stacked screens all stay mounted.
 */
const pending = new Map<string, Promise<ImageRef>>();
const ready = new Map<string, ImageRef>();

function fieldImage(width: number, height: number, background: Background) {
  const scale = PixelRatio.get();
  const key = `${background}:${width}x${height}@${scale}`;
  let image = pending.get(key);
  if (!image) {
    const surface = Skia.Surface.Make(Math.round(width * scale), Math.round(height * scale));
    if (!surface) return { key, image: Promise.reject(new Error('no surface')) };
    const canvas = surface.getCanvas();
    canvas.scale(scale, scale);

    drawField(canvas, width, height, background);

    surface.flush();
    const png = surface.makeImageSnapshot().encodeToBase64();
    image = Image.loadAsync(`data:image/png;base64,${png}`).then((ref) => {
      ready.set(key, ref);
      return ref;
    });
    pending.set(key, image);
  }
  return { key, image };
}

/**
 * kit `phone()`'s `.field` and `.bloom`: the dot grid, and two blooms anchored
 * to the top right and bottom left, fixed behind the scrolling content. Until
 * the bitmap exists (the first screen of a launch) it is the plain ground.
 */
export function Backdrop() {
  const { width, height } = useWindowDimensions();
  const { background } = useGlassTrial();
  const [shown, setShown] = useState<{ key: string; ref: ImageRef } | null>(null);
  const key = `${background}:${width}x${height}@${PixelRatio.get()}`;
  const cached = ready.get(key);
  const image = cached ?? (shown?.key === key ? shown.ref : null);

  useEffect(() => {
    if (cached) return;
    let live = true;
    const next = fieldImage(width, height, background);
    next.image.then(
      (ref) => live && setShown({ key: next.key, ref }),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [width, height, background, cached]);

  if (!image) return null;
  // Drawn at the window's size from the top left and clipped, as the canvas was:
  // a screen's box is shorter than the window, and the field is not scaled into it.
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <Image source={image} style={{ width, height }} transition={0} />
    </View>
  );
}
