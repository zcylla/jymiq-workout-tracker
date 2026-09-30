import { Fragment, useEffect } from 'react';
import { Pressable, Text, View, type ViewStyle } from 'react-native';
import Animated, {
  type CSSTransitionProperties,
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
  withTiming,
} from 'react-native-reanimated';

import { indexOf, valueAt, type Scale } from '@/lib/scale';
import { color, type Ink, lh, ls, mono, radius, text, wash } from '@/theme';

import { RollingNumber } from './rolling-number';

const A0 = -240;
const A1 = 60;
/** Every tick is drawn at this box and scaled to its length and weight, so a
 *  change of value is a transform transition rather than a relayout. */
const TICK_BOX = 40;
const TICK_THICK = 3;
const NUMERALS_MIN = 220;
const CHIPS_MIN = 80;
const SUBLINE_MIN = 50;
const LABEL_MIN = 30;
const TICK_TRANSITION: CSSTransitionProperties<ViewStyle> = {
  transitionProperty: ['transform', 'backgroundColor'],
  transitionDuration: 200,
};

type RingChip = {
  onPress?: () => void;
  value: string;
  unit: string;
};

export type LoadRingCore = {
  label: string;
  value: string;
  subline: string;
  editing?: boolean;
  chips?: RingChip[];
};

type Props = {
  /** 330 at rest and 290 while editing (Lab 33); a short screen passes less. */
  size: number;
  scale: Scale;
  value: number;
  /** The e1RM notch. Omit when one is not available. */
  mark: number | null;
  showNumerals: boolean;
  core: LoadRingCore;
  /** Bumped when a set is logged: the core pops once. */
  pulse?: number;
};

const polar = (center: number, radius: number, angle: number) => {
  const radians = (angle * Math.PI) / 180;
  return [center + radius * Math.cos(radians), center + radius * Math.sin(radians)] as const;
};

/**
 * The live-session load dial. Its fill is conveyed by tick length, rather than
 * a colour gradient, so the cursor stays legible on the small edit dial.
 */
export function LoadRing({ size, scale, value, mark, showNumerals, core, pulse = 0 }: Props) {
  const popSV = useSharedValue(1);

  // Lab 06 tile 05: under 250ms, one element, never in the way of the next input.
  useEffect(() => {
    if (pulse === 0) return;
    popSV.set(withSequence(withTiming(1.08, { duration: 80 }), withSpring(1, { damping: 14 })));
  }, [pulse, popSV]);

  const popStyle = useAnimatedStyle(() => ({ transform: [{ scale: popSV.get() }] }));

  // A short screen hands this less than 290: the numerals need 19pt of radius
  // they no longer have, and the core sheds its lines rather than run into the ticks.
  const numerals = showNumerals && size >= NUMERALS_MIN;
  const center = size / 2;
  const ringRadius = size / 2 - (numerals ? 45 : 26);
  const cursor = indexOf(scale, value);
  const markIndex = mark === null ? null : indexOf(scale, mark);
  const s = Math.max(0, (ringRadius - 22) / 123);
  const big = Math.max(16, Math.round(54 * s));
  const sub = Math.max(11, Math.round(13 * s));
  const small = Math.max(11, Math.round((core.editing ? 18 : 26) * s));
  const gap = Math.round((core.editing ? 9 : 13) * s);
  /** The clear diameter inside the longest lit tick. */
  const clear = 2 * (ringRadius - 32);
  const chips = clear >= CHIPS_MIN ? core.chips : undefined;
  const subline = clear >= SUBLINE_MIN;
  const label = clear >= LABEL_MIN;

  return (
    <View style={{ width: size, height: size }}>
      {Array.from({ length: scale.n }, (_, i) => {
        const angle = A0 + (i * (A1 - A0)) / (scale.n - 1);
        const major = i % scale.major === 0;
        const lit = i < cursor;
        let length = lit ? (major ? 16 : 10) : major ? 10 : 5;
        let outRadius = 0;
        let width = lit ? (major ? 2 : 1.4) : 1;
        let tickColor: Ink = lit ? (major ? color.tick3 : color.tick2) : color.tick1;
        const distance = Math.abs(i - cursor);

        if (distance <= 6) {
          const swell = Math.exp(-((distance / 3) ** 2));
          length += 15 * swell;
          outRadius = 5 * swell;
          width = Math.max(width, 1 + 2.2 * swell);
          if (distance <= 3) tickColor = color.accent;
        }

        if (i === markIndex) {
          tickColor = color.live;
          width = 2.4;
          length = 13;
          outRadius = 0;
        }

        if (i === cursor) {
          tickColor = color.accent;
          width = 3;
          length = Math.max(length, 26);
          outRadius = Math.max(outRadius, 6);
        }

        return (
          <Fragment key={i}>
            <Animated.View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: center - TICK_BOX / 2,
                top: center - TICK_THICK / 2,
                width: TICK_BOX,
                height: TICK_THICK,
                borderRadius: TICK_THICK / 2,
                backgroundColor: tickColor,
                transform: [
                  { rotate: `${angle}deg` },
                  { translateX: ringRadius + (outRadius - length) / 2 },
                  { scaleX: (length + outRadius) / TICK_BOX },
                  { scaleY: width / TICK_THICK },
                ],
                ...TICK_TRANSITION,
              }}
            />
            {numerals && i % scale.label === 0 ? (
              <Text
                style={{
                  ...mono(400),
                  position: 'absolute',
                  left: polar(center, ringRadius + 19, angle)[0] - 20,
                  top: polar(center, ringRadius + 19, angle)[1] - 7,
                  width: 40,
                  fontSize: 11,
                  lineHeight: lh(11),
                  letterSpacing: ls(0.06, 11),
                  textAlign: 'center',
                  color: color.lo,
                }}
              >
                {valueAt(scale, i)}
              </Text>
            ) : null}
          </Fragment>
        );
      })}

      <Animated.View
        pointerEvents="box-none"
        style={[
          {
            position: 'absolute',
            top: 0,
            right: 0,
            bottom: 0,
            left: 0,
            alignItems: 'center',
            justifyContent: 'center',
            gap: 1,
          },
          popStyle,
        ]}
      >
        {label ? (
          <View
            style={{
              paddingVertical: 2,
              paddingHorizontal: 7,
              borderRadius: radius.cell,
              borderCurve: 'continuous',
              backgroundColor: core.editing ? wash.accent : undefined,
            }}
          >
            <Text style={[text.label, { color: core.editing ? color.accent : color.lo }]}>
              {core.label}
            </Text>
          </View>
        ) : null}
        <RollingNumber
          value={core.value}
          style={{
            ...mono(600),
            fontSize: big,
            lineHeight: Math.round(big * 1.02),
            letterSpacing: ls(-0.05, big),
            color: color.hi,
          }}
        />
        {subline ? (
          <Text
            style={{
              ...mono(400),
              fontSize: sub,
              lineHeight: lh(sub),
              color: color.mid,
            }}
          >
            {core.subline}
          </Text>
        ) : null}
        {chips?.length ? (
          <View style={{ flexDirection: 'row', gap: 4, marginTop: gap }}>
            {chips.map((chip) => (
              <Pressable
                key={chip.unit}
                accessibilityRole="button"
                accessibilityLabel={`Edit ${chip.unit.toLowerCase()}`}
                hitSlop={{ top: 10, bottom: 10 }}
                onPress={(event) => {
                  event.stopPropagation();
                  chip.onPress?.();
                }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 5,
                  minWidth: 44,
                  minHeight: 44,
                  paddingVertical: 2,
                  paddingHorizontal: 7,
                  borderRadius: radius.cell,
                  borderCurve: 'continuous',
                }}
              >
                <RollingNumber
                  value={chip.value}
                  style={{
                    ...mono(600),
                    fontSize: small,
                    lineHeight: Math.round(small * 1.02),
                    letterSpacing: ls(-0.03, small),
                    color: color.mid,
                  }}
                />
                <Text
                  style={{
                    ...mono(400),
                    fontSize: 11,
                    lineHeight: lh(11),
                    letterSpacing: ls(0.12, 11),
                    color: color.lo,
                  }}
                >
                  {chip.unit}
                </Text>
              </Pressable>
            ))}
          </View>
        ) : null}
      </Animated.View>
    </View>
  );
}
