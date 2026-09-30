import { useEffect } from 'react';
import { Text, View, type ViewStyle } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withTiming,
} from 'react-native-reanimated';

import { chartGeometry } from '@/lib/chart';
import { color, hairline, lh, ls, mono, motion, text, wash } from '@/theme';

const GAP = 5;
const STAGGER = 30;

/** Grows from the baseline on mount; `delay` staggers the columns, the latest last. */
function Bar({ delay, style }: { delay: number; style: ViewStyle }) {
  const growSV = useSharedValue(0);
  useEffect(() => {
    growSV.set(
      withDelay(delay, withTiming(1, { duration: motion.base, easing: Easing.out(Easing.cubic) })),
    );
  }, [delay, growSV]);
  const grow = useAnimatedStyle(() => ({ transform: [{ scaleY: growSV.get() }] }));
  return <Animated.View style={[style, { transformOrigin: 'bottom' }, grow]} />;
}

const drop = (v: number) => String(Number(v.toPrecision(6)));

const printed = {
  ...mono(500),
  fontSize: 13,
  letterSpacing: ls(-0.02, 13),
  lineHeight: lh(13),
  color: color.hi,
};

/** kit `chart()`: never bare, no plate, no title — wrap it in an unplated Section. */
export function ColumnChart({
  values,
  xFirst,
  xLast,
  value,
  h = 76,
  active = -1,
  format = drop,
}: {
  values: number[];
  xFirst: string;
  xLast: string;
  /** Overrides the printed value, which defaults to the active column's. */
  value?: string;
  h?: number;
  active?: number;
  format?: (v: number) => string;
}) {
  const { columns, lo, hi, activeIndex } = chartGeometry(values, h, active);
  const n = columns.length;

  return (
    <View>
      <View style={{ alignItems: 'flex-end', paddingBottom: 3 }}>
        <Text style={printed}>{value ?? (n > 0 ? format(values[activeIndex]) : '')}</Text>
      </View>
      {/* Top-aligned, so the y column spans the plot alone. Bottom-aligned, it
          also spans the baseline and the x labels, and the min label lands below
          the baseline it is supposed to name. */}
      <View style={{ flexDirection: 'row', gap: 9, alignItems: 'flex-start' }}>
        <View style={{ height: h, justifyContent: 'space-between', paddingBottom: 1 }}>
          <Text style={text.label}>{n > 0 ? format(hi) : ''}</Text>
          <Text style={text.label}>{n > 0 ? format(lo) : ''}</Text>
        </View>
        <View style={{ flex: 1, gap: 4 }}>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: GAP, height: h }}>
            {columns.map((c, i) => (
              <Bar
                // biome-ignore lint/suspicious/noArrayIndexKey: columns are positional
                key={i}
                delay={i * Math.min(STAGGER, Math.floor(300 / n))}
                style={{
                  flex: 1,
                  height: c.height,
                  borderRadius: 2,
                  backgroundColor: c.active ? color.accent : wash.column,
                }}
              />
            ))}
          </View>
          <View style={{ height: 1, backgroundColor: hairline.baseline }} />
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={text.label}>{xFirst}</Text>
            <Text style={text.label}>{xLast}</Text>
          </View>
        </View>
      </View>
    </View>
  );
}
