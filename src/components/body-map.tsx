import { Canvas, Group, Path, Skia } from '@shopify/react-native-skia';
import { useMemo } from 'react';
import { View } from 'react-native';

import { color, hairline, heat } from '@/theme';

import { BODY, BODY_VIEWBOX } from './body-map/paths';

/**
 * Lab 35 B4's figure. Every path is parsed once; the drawing is
 * `heat(relative)` per muscle, neutral where a muscle has no load. No
 * animation: the values change between screens, not within one.
 */
export function BodyMap({
  view,
  relative,
  width,
}: {
  view: 'front' | 'back';
  relative: Map<string, number>;
  width: number;
}) {
  const paths = useMemo(() => {
    const parse = (d: string) => Skia.Path.MakeFromSVGString(d);
    return {
      outline: BODY[view].outline.map(parse),
      surfaces: BODY[view].surfaces.map((s) => ({ muscle: s.muscle, path: parse(s.d) })),
    };
  }, [view]);

  const scale = width / BODY_VIEWBOX.w;
  const height = BODY_VIEWBOX.h * scale;

  return (
    <View accessibilityLabel={`Body map, ${view}`} style={{ width, height }}>
      <Canvas style={{ width, height }}>
        <Group transform={[{ scale }]}>
          {paths.outline.map((p, i) =>
            p ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
              <Group key={i}>
                <Path path={p} color={color.panel} />
                <Path path={p} style="stroke" strokeWidth={1 / scale} color={hairline.onGround} />
              </Group>
            ) : null,
          )}
          {paths.surfaces.map((s, i) =>
            s.path ? (
              // biome-ignore lint/suspicious/noArrayIndexKey: static, never reordered
              <Path key={i} path={s.path} color={heat(relative.get(s.muscle) ?? 0)} />
            ) : null,
          )}
        </Group>
      </Canvas>
    </View>
  );
}
