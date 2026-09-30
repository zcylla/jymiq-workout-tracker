import { BlurMask, Canvas, Oval, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { StyleSheet, useWindowDimensions } from 'react-native';

import { field } from '@/theme';

/**
 * kit `phone()`'s `.field` and `.bloom`: the dot grid and the two blooms,
 * fixed behind the scrolling content. Positions are the board's, anchored to
 * the same edges (top right and bottom left).
 */
export function Backdrop() {
  const { width, height } = useWindowDimensions();

  const dots = useMemo(() => {
    const b = Skia.PathBuilder.Make();
    const half = field.pitch / 2;
    for (let y = half; y < height; y += field.pitch) {
      for (let x = half; x < width; x += field.pitch) b.addCircle(x, y, 1);
    }
    return b.build();
  }, [width, height]);

  return (
    <Canvas style={StyleSheet.absoluteFill} pointerEvents="none">
      <Path path={dots} color={field.dot} />
      <Oval x={width + 40 - 300} y={40} width={300} height={280} color={field.bloom}>
        <BlurMask blur={field.bloomBlur} style="normal" />
      </Oval>
      <Oval x={-60} y={height - 120 - 220} width={280} height={220} color={field.bloom}>
        <BlurMask blur={field.bloomBlur} style="normal" />
      </Oval>
    </Canvas>
  );
}
