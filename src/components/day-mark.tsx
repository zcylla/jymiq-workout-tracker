import { Canvas, DashPathEffect, Group, Path, rect, rrect, Skia } from '@shopify/react-native-skia';

import type { DayMark } from '@/lib/day-state';
import { dayMark } from '@/theme';

const STROKE = 1.5;
const DASH = [3, 2];
const HATCH_STEP = 5;

/**
 * The dashed (planned) and hatched (missed) marks of the day-state grammar, in a
 * box of their own — `calendar.tsx` draws the same two on one canvas behind its
 * grid, which a scrolling strip cannot do. Every other mark is a plain View.
 *
 * A dashed border on a rounded View misdraws on Android, which is why this is Skia.
 */
export function DayMarkGlyph({
  mark,
  width,
  height,
  corner,
}: {
  mark: DayMark;
  width: number;
  height: number;
  corner: number;
}) {
  if (mark === 'planned') {
    const inset = STROKE / 2;
    const path = Skia.PathBuilder.Make()
      .addRRect(
        rrect(rect(inset, inset, width - STROKE, height - STROKE), corner - inset, corner - inset),
      )
      .build();
    return (
      <Canvas style={{ width, height }}>
        <Path path={path} style="stroke" strokeWidth={STROKE} color={dayMark.dash}>
          <DashPathEffect intervals={DASH} />
        </Path>
      </Canvas>
    );
  }

  if (mark === 'missed') {
    const lines = Skia.PathBuilder.Make();
    for (let t = -height; t < width; t += HATCH_STEP) lines.moveTo(t, height).lineTo(t + height, 0);
    return (
      <Canvas style={{ width, height }}>
        <Group clip={rrect(rect(0, 0, width, height), corner, corner)}>
          <Path path={lines.build()} style="stroke" strokeWidth={STROKE} color={dayMark.hatch} />
        </Group>
      </Canvas>
    );
  }

  return null;
}
