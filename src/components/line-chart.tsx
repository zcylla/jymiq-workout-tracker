import {
  Canvas,
  DashPathEffect,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';

import { lineGeometry } from '@/lib/line-chart';
import { color, hairline, text, trend as fill } from '@/theme';

const HEIGHT = 96;
const DOT = 2.5;
const PEAK = 4.5;

/**
 * A line over evenly spaced slots: fill under it, a dot per point, the peak
 * lifted out, a dashed fit, and the data's own range named top and bottom. The
 * maths is `lineGeometry`; this draws it in one canvas. No plate: the Section
 * label carries it. Text never wears the series colour.
 */
export function LineChart({
  points,
  slots,
  trend,
  xLabels,
  format,
}: {
  points: { slot: number; value: number }[];
  slots: number;
  trend: { slope: number; intercept: number } | null;
  xLabels: string[];
  format: (v: number) => string;
}) {
  const [width, setWidth] = useState(0);

  const drawn = useMemo(() => {
    if (width <= 0 || !points.length) return null;
    const g = lineGeometry(points, slots, width, HEIGHT, trend);

    const dots = Skia.PathBuilder.Make();
    g.points.forEach((p, i) => {
      if (i !== g.peak) dots.addCircle(p.x, p.y, DOT);
    });
    const peak = Skia.PathBuilder.Make().addCircle(g.points[g.peak].x, g.points[g.peak].y, PEAK);

    const base = Skia.PathBuilder.Make()
      .moveTo(0, HEIGHT - 0.5)
      .lineTo(width, HEIGHT - 0.5)
      .build();

    let line = null;
    let area = null;
    if (g.points.length > 1) {
      const l = Skia.PathBuilder.Make().moveTo(g.points[0].x, g.points[0].y);
      const a = Skia.PathBuilder.Make().moveTo(g.points[0].x, HEIGHT);
      for (const p of g.points) {
        l.lineTo(p.x, p.y);
        a.lineTo(p.x, p.y);
      }
      a.lineTo(g.points[g.points.length - 1].x, HEIGHT).close();
      line = l.build();
      area = a.build();
    }

    const fit = g.trend
      ? Skia.PathBuilder.Make()
          .moveTo(g.trend.x1, g.trend.y1)
          .lineTo(g.trend.x2, g.trend.y2)
          .build()
      : null;

    return { g, dots: dots.build(), peak: peak.build(), base, line, area, fit };
  }, [points, slots, trend, width]);

  return (
    <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start' }}>
      <View style={{ height: HEIGHT, justifyContent: drawn?.g.flat ? 'center' : 'space-between' }}>
        <Text style={text.label}>{drawn ? format(drawn.g.hi) : ''}</Text>
        {drawn && !drawn.g.flat ? <Text style={text.label}>{format(drawn.g.lo)}</Text> : null}
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <View onLayout={(e) => setWidth(e.nativeEvent.layout.width)} style={{ height: HEIGHT }}>
          {drawn ? (
            <Canvas style={{ width, height: HEIGHT }}>
              {drawn.area ? (
                <Path path={drawn.area}>
                  <LinearGradient
                    start={vec(0, 0)}
                    end={vec(0, HEIGHT)}
                    colors={[fill.fillTop, fill.fillBottom]}
                  />
                </Path>
              ) : null}
              <Path path={drawn.base} style="stroke" strokeWidth={1} color={hairline.baseline} />
              {drawn.fit ? (
                <Path path={drawn.fit} style="stroke" strokeWidth={1.5} color={color.mid}>
                  <DashPathEffect intervals={[4, 4]} />
                </Path>
              ) : null}
              {drawn.line ? (
                <Path
                  path={drawn.line}
                  style="stroke"
                  strokeWidth={2}
                  strokeCap="round"
                  strokeJoin="round"
                  color={color.accent}
                />
              ) : null}
              <Path path={drawn.dots} color={color.accent} />
              <Path path={drawn.peak} color={color.hi} />
            </Canvas>
          ) : points.length === 0 ? (
            <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
              <Text style={[text.num, { color: color.lo }]}>—</Text>
            </View>
          ) : null}
        </View>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: xLabels.length === 1 ? 'flex-end' : 'space-between',
          }}
        >
          {xLabels.map((l) => (
            <Text key={l} style={text.label}>
              {l}
            </Text>
          ))}
        </View>
      </View>
    </View>
  );
}
