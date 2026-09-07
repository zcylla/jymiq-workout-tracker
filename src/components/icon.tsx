import { Canvas, Group, Path } from '@shopify/react-native-skia';
import { type JSX } from 'react';
import { StyleSheet, View } from 'react-native';

import { color, type Ink } from '@/theme';

/** `M{cx-r} {cy} a…` — two half-arcs, so the circle is exact rather than eyeballed. */
function circle(cx: number, cy: number, r: number): string {
  return `M${cx - r} ${cy} a${r} ${r} 0 1 0 ${2 * r} 0 a${r} ${r} 0 1 0 ${-2 * r} 0`;
}

function rect(x: number, y: number, w: number, h: number, r: number): string {
  return [
    `M${x + r} ${y}`,
    `h${w - 2 * r}`,
    `a${r} ${r} 0 0 1 ${r} ${r}`,
    `v${h - 2 * r}`,
    `a${r} ${r} 0 0 1 ${-r} ${r}`,
    `h${-(w - 2 * r)}`,
    `a${r} ${r} 0 0 1 ${-r} ${-r}`,
    `v${-(h - 2 * r)}`,
    `a${r} ${r} 0 0 1 ${r} ${-r}`,
    'z',
  ].join(' ');
}

const ICONS = {
  today: `${circle(11, 11, 8)} M11 5.4 A5.6 5.6 0 0 1 16.6 11`,
  session: `M3 11 h16 ${rect(4.5, 7, 3.2, 8, 1)} ${rect(14.3, 7, 3.2, 8, 1)}`,
  strength: 'M3 16 L8 11 L12 13.5 L19 6 M19 10.5 V6 h-4.5',
  load: 'M4 17 V11 M8.6 17 V7 M13.3 17 V13 M18 17 V9',
  search: `${circle(10, 10, 6)} M14.5 14.5 L19 19`,
  gear: `${circle(11, 11, 3)} M11 2 v2 M11 18 v2 M2 11 h2 M18 11 h2 M4.6 4.6 l1.5 1.5 M15.9 15.9 l1.5 1.5 M17.4 4.6 l-1.5 1.5 M6.1 15.9 l-1.5 1.5`,
  back: 'M13 4 L6 11 l7 7',
  plus: 'M11 4 v14 M4 11 h14',
  cal: `${rect(3.5, 5, 15, 14, 2)} M3.5 9.5 h15 M7.5 3 v4 M14.5 3 v4`,
  dots: `${circle(11, 4.5, 1.3)} ${circle(11, 11, 1.3)} ${circle(11, 17.5, 1.3)}`,
  chev: 'M6 3 l5 5 -5 5',
  up: 'M5 8.5 L5 1.5 M2 4.5 L5 1.5 L8 4.5',
  down: 'M5 1.5 L5 8.5 M2 5.5 L5 8.5 L8 5.5',
} as const;

export type IconName = keyof typeof ICONS;

/** Everything is authored in a 22-unit square except these three. */
const BOX: Partial<Record<IconName, number>> = { chev: 16, up: 10, down: 10 };

export function Icon({
  name,
  size = 22,
  tone = color.lo,
  weight = 1.6,
}: {
  name: IconName;
  size?: number;
  /** Ink, never a raw string — the compiler is what keeps hexes out of screens. */
  tone?: Ink;
  /** Stroke width in the icon's own box units, exactly as SVG stroke-width behaves under a viewBox. */
  weight?: number;
}): JSX.Element {
  const box = BOX[name] ?? 22;
  return (
    <Canvas style={{ width: size, height: size }}>
      {/* The scale is what makes `weight` a box unit: the stroke scales with the geometry, as under a viewBox. */}
      <Group transform={[{ scale: size / box }]}>
        <Path
          path={ICONS[name]}
          style="stroke"
          strokeWidth={weight}
          strokeCap="round"
          strokeJoin="round"
          color={tone}
        />
      </Group>
    </Canvas>
  );
}

export function Chevron({ tone = color.lo }: { tone?: Ink }): JSX.Element {
  return <Icon name="chev" size={13} tone={tone} weight={1.7} />;
}

const grip = StyleSheet.create({
  column: { width: 16, alignItems: 'center', gap: 3 },
  bar: { width: 13, height: 1.5, borderRadius: 1 },
});

export function Grip({ tone = color.dim }: { tone?: Ink }): JSX.Element {
  return (
    <View style={grip.column}>
      <View style={[grip.bar, { backgroundColor: tone }]} />
      <View style={[grip.bar, { backgroundColor: tone }]} />
      <View style={[grip.bar, { backgroundColor: tone }]} />
    </View>
  );
}
