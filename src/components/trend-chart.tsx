import {
  Canvas,
  Circle,
  DashPathEffect,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { type DailyWeight, trendGeometry } from '@/lib/bodyweight';
import { color, hairline, text, trend } from '@/theme';

const HEIGHT = 88;
const DOT = 3.5;
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];

/**
 * Lab 37 D2's line chart. No plate: the Section label carries it. The maths is
 * `trendGeometry`; this only draws it. Its text never wears the series colour.
 */
export function TrendChart({ days, now }: { days: DailyWeight[]; now: number }) {
  const [width, setWidth] = useState(0);

  const drawn = useMemo(() => {
    if (width <= 0) return null;
    const { points, meanY, windowStart } = trendGeometry(days, now, width, HEIGHT);
    if (points.length < 2) return null;

    const line = Skia.PathBuilder.Make().moveTo(points[0].x, points[0].y);
    for (const p of points.slice(1)) line.lineTo(p.x, p.y);

    const area = Skia.PathBuilder.Make().moveTo(points[0].x, HEIGHT);
    for (const p of points) area.lineTo(p.x, p.y);
    area.lineTo(points[points.length - 1].x, HEIGHT).close();

    const mean = Skia.PathBuilder.Make().moveTo(0, meanY).lineTo(width, meanY).build();
    const base = Skia.PathBuilder.Make()
      .moveTo(0, HEIGHT - 0.5)
      .lineTo(width, HEIGHT - 0.5)
      .build();

    return {
      line: line.build(),
      area: area.build(),
      mean,
      base,
      last: points[points.length - 1],
      windowStart,
    };
  }, [days, now, width]);

  const start = new Date(drawn?.windowStart ?? now);

  return (
    <View>
      <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
        {drawn ? (
          <Canvas style={{ width, height: HEIGHT }}>
            <Path path={drawn.area}>
              <LinearGradient
                start={vec(0, 0)}
                end={vec(0, HEIGHT)}
                colors={[trend.fillTop, trend.fillBottom]}
              />
            </Path>
            <Path path={drawn.mean} style="stroke" strokeWidth={1} color={hairline.baseline}>
              <DashPathEffect intervals={[3, 4]} />
            </Path>
            <Path
              path={drawn.line}
              style="stroke"
              strokeWidth={2}
              strokeCap="round"
              strokeJoin="round"
              color={color.accent}
            />
            <Path path={drawn.base} style="stroke" strokeWidth={1} color={hairline.baseline} />
            <Circle
              cx={Math.min(drawn.last.x, width - DOT)}
              cy={drawn.last.y}
              r={DOT}
              color={color.accent}
            />
          </Canvas>
        ) : null}
      </View>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingTop: 6 }}>
        <Text style={text.label}>{`${start.getDate()} ${MONTHS[start.getMonth()]}`}</Text>
        <Text style={text.label}>DASHED = 14-DAY MEAN</Text>
        <Text style={text.label}>TODAY</Text>
      </View>
    </View>
  );
}
