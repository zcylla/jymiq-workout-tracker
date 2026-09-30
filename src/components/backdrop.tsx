import { BlurStyle, Skia } from '@shopify/react-native-skia';
import { Image, type ImageRef } from 'expo-image';
import { useEffect, useState } from 'react';
import { PixelRatio, StyleSheet, useWindowDimensions, View } from 'react-native';

import { field } from '@/theme';

/**
 * The field is drawn once per window size into an off-screen surface and shared
 * as one decoded bitmap: every screen used to mount its own full-screen Skia
 * canvas, and the tabs and stacked screens all stay mounted.
 */
const pending = new Map<string, Promise<ImageRef>>();
const ready = new Map<string, ImageRef>();

function fieldImage(width: number, height: number) {
  const scale = PixelRatio.get();
  const key = `${width}x${height}@${scale}`;
  let image = pending.get(key);
  if (!image) {
    const surface = Skia.Surface.Make(Math.round(width * scale), Math.round(height * scale));
    if (!surface) return { key, image: Promise.reject(new Error('no surface')) };
    const canvas = surface.getCanvas();
    canvas.scale(scale, scale);

    const dot = Skia.Paint();
    dot.setAntiAlias(true);
    dot.setColor(Skia.Color(field.dot));
    const dots = Skia.PathBuilder.Make();
    const half = field.pitch / 2;
    for (let y = half; y < height; y += field.pitch) {
      for (let x = half; x < width; x += field.pitch) dots.addCircle(x, y, 1);
    }
    canvas.drawPath(dots.build(), dot);

    const bloom = Skia.Paint();
    bloom.setAntiAlias(true);
    bloom.setColor(Skia.Color(field.bloom));
    bloom.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, field.bloomBlur, true));
    canvas.drawOval(Skia.XYWHRect(width + 40 - 300, 40, 300, 280), bloom);
    canvas.drawOval(Skia.XYWHRect(-60, height - 120 - 220, 280, 220), bloom);

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
  const [shown, setShown] = useState<{ key: string; ref: ImageRef } | null>(null);
  const key = `${width}x${height}@${PixelRatio.get()}`;
  const cached = ready.get(key);
  const image = cached ?? (shown?.key === key ? shown.ref : null);

  useEffect(() => {
    if (cached) return;
    let live = true;
    const next = fieldImage(width, height);
    next.image.then(
      (ref) => live && setShown({ key: next.key, ref }),
      () => {},
    );
    return () => {
      live = false;
    };
  }, [width, height, cached]);

  if (!image) return null;
  // Drawn at the window's size from the top left and clipped, as the canvas was:
  // a screen's box is shorter than the window, and the field is not scaled into it.
  return (
    <View style={[StyleSheet.absoluteFill, { overflow: 'hidden' }]} pointerEvents="none">
      <Image source={image} style={{ width, height }} transition={0} />
    </View>
  );
}
