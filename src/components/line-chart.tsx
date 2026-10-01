import {
  Canvas,
  DashPathEffect,
  Group,
  LinearGradient,
  Path,
  Skia,
  vec,
} from '@shopify/react-native-skia';
import { useEffect, useMemo, useState } from 'react';
import { Text, TextInput, type TextInputProps, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  type SharedValue,
  useAnimatedProps,
  useAnimatedReaction,
  useAnimatedStyle,
  useDerivedValue,
  useSharedValue,
} from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { axisLabel, type Bucket, type Granularity, type Metric } from '@/lib/exercise-progress';
import {
  chartWindow,
  type ChartWindow,
  INSET,
  lineGeometry,
  selectionAt,
  panWindow,
  tooltipPosition,
  visibleSlots,
  windowGeometry,
  zoomWindow,
} from '@/lib/line-chart';
import { progressTooltip } from '@/lib/progress-tooltip';
import type { Unit } from '@/lib/units';
import { color, controlEdgeDense, hairline, radius, space, text, trend as fill } from '@/theme';

const HEIGHT = 96;
const DOT = 2.5;
const PEAK = 4.5;

type Inspection = {
  starts: number[];
  buckets: readonly Bucket[];
  metric: Metric;
  granularity: Granularity;
  unit: Unit;
};

type Props = {
  points: { slot: number; value: number }[];
  slots: number;
  trend: { slope: number; intercept: number } | null;
  xLabels: string[];
  format: (v: number) => string;
  inspection?: Inspection;
};

export function LineChart(props: Props) {
  return props.inspection ? (
    <InteractiveChart
      key={`${props.inspection.metric}-${props.inspection.granularity}`}
      {...props}
      inspection={props.inspection}
    />
  ) : (
    <StaticChart {...props} />
  );
}

function StaticChart({ points, slots, trend, xLabels, format }: Props) {
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
                <Path
                  path={drawn.fit}
                  style="stroke"
                  strokeWidth={1.5}
                  color={color.mid}
                  opacity={0.5}
                >
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

const AnimatedInput = Animated.createAnimatedComponent(TextInput);
const CARD_WIDTH = 212;
const CARD_HEIGHT = 68;

function AxisText({
  labelSV,
  align = 'left',
  width,
}: {
  labelSV: SharedValue<string>;
  align?: 'left' | 'right' | 'center';
  width?: number;
}) {
  const props = useAnimatedProps<TextInputProps & { text: string }>(() => ({
    text: labelSV.get(),
    defaultValue: labelSV.get(),
  }));
  return (
    <AnimatedInput
      editable={false}
      pointerEvents="none"
      underlineColorAndroid={fill.fillBottom}
      animatedProps={props}
      style={[
        text.label,
        {
          padding: 0,
          height: text.label.lineHeight,
          width,
          flex: width === undefined ? 1 : undefined,
          textAlign: align,
        },
      ]}
    />
  );
}

function InteractiveChart({
  points,
  slots,
  format,
  inspection,
}: Props & { inspection: Inspection }) {
  const [width, setWidth] = useState(0);
  const [selected, setSelected] = useState(-1);
  const windowSV = useSharedValue<ChartWindow>(chartWindow(slots, 1, 0));
  const initialSV = useSharedValue<ChartWindow>(chartWindow(slots, 1, 0));
  const focalSV = useSharedValue(0);
  const selectedSV = useSharedValue(-1);
  useEffect(() => {
    windowSV.set(chartWindow(slots, 1, 0));
    selectedSV.set(-1);
  }, [points, slots, windowSV, selectedSV]);
  const dates = useMemo(
    () => inspection.starts.map((start) => axisLabel(start, inspection.granularity)),
    [inspection.starts, inspection.granularity],
  );
  const labels = useMemo(
    () => Object.fromEntries(points.map((p) => [p.value, format(p.value)])),
    [points, format],
  );
  const axisWidth =
    Math.max(1, ...Object.values(labels).map((label) => label.length)) *
    (text.label.fontSize * 0.6 + text.label.letterSpacing);
  const geometrySV = useDerivedValue(() => windowGeometry(points, windowSV.get(), width, HEIGHT));
  const pathsSV = useDerivedValue(() => {
    const g = geometrySV.get().geometry;
    const line = Skia.PathBuilder.Make();
    const area = Skia.PathBuilder.Make();
    const dots = Skia.PathBuilder.Make();
    const peak = Skia.PathBuilder.Make();
    const fit = Skia.PathBuilder.Make();
    if (g.points.length > 1) {
      line.moveTo(g.points[0].x, g.points[0].y);
      area.moveTo(g.points[0].x, HEIGHT);
      for (const p of g.points) {
        line.lineTo(p.x, p.y);
        area.lineTo(p.x, p.y);
      }
      area.lineTo(g.points[g.points.length - 1].x, HEIGHT).close();
    }
    for (let i = 0; i < g.points.length; i++) {
      const p = g.points[i];
      if (i === g.peak) peak.addCircle(p.x, p.y, PEAK);
      else dots.addCircle(p.x, p.y, DOT);
    }
    if (g.trend) fit.moveTo(g.trend.x1, g.trend.y1).lineTo(g.trend.x2, g.trend.y2);
    return {
      line: line.build(),
      area: area.build(),
      dots: dots.build(),
      peak: peak.build(),
      fit: fit.build(),
    };
  });
  const lineSV = useDerivedValue(() => pathsSV.get().line);
  const areaSV = useDerivedValue(() => pathsSV.get().area);
  const dotsSV = useDerivedValue(() => pathsSV.get().dots);
  const peakSV = useDerivedValue(() => pathsSV.get().peak);
  const fitSV = useDerivedValue(() => pathsSV.get().fit);
  const highSV = useDerivedValue(() =>
    geometrySV.get().points.length ? labels[geometrySV.get().geometry.hi] : '',
  );
  const lowSV = useDerivedValue(() =>
    geometrySV.get().geometry.flat ? '' : labels[geometrySV.get().geometry.lo],
  );
  const firstSV = useDerivedValue(() => {
    if (!points.length) return '';
    const { first, last } = visibleSlots(windowSV.get(), slots);
    return first === last ? '' : (dates[first] ?? '');
  });
  const middleSV = useDerivedValue(() => {
    if (!points.length) return '';
    const { first, last } = visibleSlots(windowSV.get(), slots);
    const mid = Math.floor((first + last) / 2);
    return mid === first || mid === last ? '' : (dates[mid] ?? '');
  });
  const lastSV = useDerivedValue(() => {
    if (!points.length) return '';
    return dates[visibleSlots(windowSV.get(), slots).last] ?? '';
  });
  const selectionSV = useDerivedValue(() => {
    const source = points[selectedSV.get()];
    const visible = geometrySV.get();
    const index = source ? visible.points.findIndex((p) => p.slot === source.slot) : -1;
    return index < 0 ? null : visible.geometry.points[index];
  });
  const ringSV = useDerivedValue(() => {
    const path = Skia.PathBuilder.Make();
    const point = selectionSV.get();
    if (point) path.addCircle(point.x, point.y, 6);
    return path.build();
  });
  const guideSV = useDerivedValue(() => {
    const path = Skia.PathBuilder.Make();
    const point = selectionSV.get();
    if (point) path.moveTo(point.x, INSET).lineTo(point.x, HEIGHT - INSET);
    return path.build();
  });
  useAnimatedReaction(
    () => selectedSV.get(),
    (next, previous) => {
      if (next !== previous) scheduleOnRN(setSelected, next);
    },
  );
  const cardWidth = Math.min(CARD_WIDTH, width);
  const tooltipStyle = useAnimatedStyle(() => {
    const p = selectionSV.get();
    const position = p
      ? tooltipPosition(p.x, p.y, width, HEIGHT, cardWidth, CARD_HEIGHT)
      : { left: 0, top: 0 };
    return {
      opacity: p ? 1 : 0,
      transform: [{ translateX: position.left }, { translateY: position.top }],
    };
  });
  const emptyStyle = useAnimatedStyle(() => ({ opacity: geometrySV.get().points.length ? 0 : 1 }));
  const highStyle = useAnimatedStyle(() => ({
    transform: [
      { translateY: geometrySV.get().geometry.flat ? (HEIGHT - text.label.lineHeight) / 2 : 0 },
    ],
  }));

  const pinch = Gesture.Pinch()
    .enabled(slots > 4 && width > 0)
    .onStart((e) => {
      initialSV.set(windowSV.get());
      focalSV.set(e.focalX);
      selectedSV.set(-1);
    })
    .onUpdate((e) => {
      windowSV.set(zoomWindow(slots, initialSV.get(), e.scale, focalSV.get(), e.focalX, width));
    });
  const pan = Gesture.Pan()
    .enabled(slots > 4 && width > 0)
    .maxPointers(1)
    .activeOffsetX([-10, 10])
    .failOffsetY([-10, 10])
    .onTouchesDown((_e, manager) => {
      if (windowSV.get().count >= slots) manager.fail();
    })
    .onStart(() => {
      initialSV.set(windowSV.get());
      selectedSV.set(-1);
    })
    .onUpdate((e) => {
      windowSV.set(panWindow(slots, initialSV.get(), e.translationX, width));
    });
  const reset = Gesture.Tap()
    .numberOfTaps(2)
    .maxDelay(220)
    .maxDistance(8)
    .onEnd((_e, success) => {
      if (success) {
        windowSV.set(chartWindow(slots, 1, 0));
        selectedSV.set(-1);
      }
    });
  const tap = Gesture.Tap()
    .maxDistance(8)
    .onEnd((e, success) => {
      if (!success) return;
      selectedSV.set(selectionAt(points, windowSV.get(), selectedSV.get(), e.x, width));
    });
  const gesture = Gesture.Race(pinch, pan, Gesture.Exclusive(reset, tap));
  const bucket =
    selected < 0
      ? undefined
      : inspection.buckets.find((b) => b.start === inspection.starts[points[selected]?.slot]);
  const content = bucket
    ? progressTooltip(bucket, inspection.metric, inspection.granularity, inspection.unit)
    : null;

  return (
    <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start' }}>
      <View style={{ width: axisWidth, height: HEIGHT, justifyContent: 'space-between' }}>
        <Animated.View style={highStyle}>
          <AxisText labelSV={highSV} width={axisWidth} />
        </Animated.View>
        <AxisText labelSV={lowSV} width={axisWidth} />
      </View>
      <View style={{ flex: 1, gap: 4 }}>
        <GestureDetector gesture={gesture}>
          <View
            collapsable={false}
            onLayout={(e) => setWidth(e.nativeEvent.layout.width)}
            style={{ height: HEIGHT }}
          >
            {width > 0 ? (
              <Canvas style={{ width, height: HEIGHT }}>
                <Group clip={{ x: 0, y: 0, width, height: HEIGHT }}>
                  <Path path={areaSV}>
                    <LinearGradient
                      start={vec(0, 0)}
                      end={vec(0, HEIGHT)}
                      colors={[fill.fillTop, fill.fillBottom]}
                    />
                  </Path>
                  <Path
                    path={`M0 ${HEIGHT - 0.5} L${width} ${HEIGHT - 0.5}`}
                    style="stroke"
                    strokeWidth={1}
                    color={hairline.baseline}
                  />
                  <Path
                    path={fitSV}
                    style="stroke"
                    strokeWidth={1.5}
                    color={color.mid}
                    opacity={0.5}
                  >
                    <DashPathEffect intervals={[4, 4]} />
                  </Path>
                  <Path
                    path={guideSV}
                    style="stroke"
                    strokeWidth={1}
                    color={color.lo}
                    opacity={0.5}
                  />
                  <Path
                    path={lineSV}
                    style="stroke"
                    strokeWidth={2}
                    strokeCap="round"
                    strokeJoin="round"
                    color={color.accent}
                  />
                  <Path path={dotsSV} color={color.accent} />
                  <Path path={peakSV} color={color.hi} />
                  <Path path={ringSV} style="stroke" strokeWidth={1.5} color={color.hi} />
                </Group>
              </Canvas>
            ) : null}
            <Animated.View
              pointerEvents="none"
              style={[
                { position: 'absolute', inset: 0, alignItems: 'center', justifyContent: 'center' },
                emptyStyle,
              ]}
            >
              <Text style={[text.num, { color: color.lo }]}>—</Text>
            </Animated.View>
            {content ? (
              <Animated.View
                pointerEvents="none"
                style={[
                  {
                    position: 'absolute',
                    width: cardWidth,
                    height: CARD_HEIGHT,
                    paddingHorizontal: space.row,
                    paddingVertical: space.row,
                    gap: 4,
                    borderRadius: radius.row,
                    borderCurve: 'continuous',
                    ...controlEdgeDense,
                  },
                  tooltipStyle,
                ]}
              >
                <Text numberOfLines={1} style={[text.meta, { color: color.hi }]}>
                  {content.heading}
                </Text>
                {content.lines.map((line) => (
                  <Text key={line} numberOfLines={1} style={text.meta}>
                    {line}
                  </Text>
                ))}
              </Animated.View>
            ) : null}
          </View>
        </GestureDetector>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <AxisText labelSV={firstSV} />
          <AxisText labelSV={middleSV} align="center" />
          <AxisText labelSV={lastSV} align="right" />
        </View>
      </View>
    </View>
  );
}
