import { Fragment } from 'react';
import { Text, View } from 'react-native';

import { indexOf, valueAt, type Scale } from '@/lib/scale';
import { color, type Ink, lh, ls, mono, radius, text, wash } from '@/theme';

const A0 = -240;
const A1 = 60;

type RingChip = {
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
  size: 330 | 290;
  scale: Scale;
  value: number;
  /** The e1RM notch. Omit when one is not available. */
  mark: number | null;
  showNumerals: boolean;
  core: LoadRingCore;
};

const polar = (center: number, radius: number, angle: number) => {
  const radians = (angle * Math.PI) / 180;
  return [center + radius * Math.cos(radians), center + radius * Math.sin(radians)] as const;
};

/**
 * The live-session load dial. Its fill is conveyed by tick length, rather than
 * a colour gradient, so the cursor stays legible on the small edit dial.
 */
export function LoadRing({ size, scale, value, mark, showNumerals, core }: Props) {
  const center = size / 2;
  const ringRadius = size / 2 - (showNumerals ? 45 : 26);
  const cursor = indexOf(scale, value);
  const markIndex = mark === null ? null : indexOf(scale, mark);
  const s = (ringRadius - 22) / 123;
  const big = Math.round(54 * s);
  const sub = Math.max(11, Math.round(13 * s));
  const small = Math.max(11, Math.round((core.editing ? 18 : 26) * s));
  const gap = Math.round((core.editing ? 9 : 13) * s);

  return (
    <View style={{ width: size, height: size }}>
      {Array.from({ length: scale.n }, (_, i) => {
        const angle = A0 + (i * (A1 - A0)) / (scale.n - 1);
        const major = i % scale.major === 0;
        const lit = i < cursor;
        let length = lit ? (major ? 16 : 10) : major ? 10 : 5;
        let outRadius = 0;
        let width = lit ? (major ? 2 : 1.4) : 1;
        let tickColor: Ink = lit ? (major ? color.tick3 : color.tick2) : color.off;
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

        const [outerX, outerY] = polar(center, ringRadius + outRadius, angle);
        const [innerX, innerY] = polar(center, ringRadius - length, angle);
        const tickLength = length + outRadius;
        const midX = (outerX + innerX) / 2;
        const midY = (outerY + innerY) / 2;

        return (
          <Fragment key={i}>
            <View
              pointerEvents="none"
              style={{
                position: 'absolute',
                left: midX - tickLength / 2,
                top: midY - width / 2,
                width: tickLength,
                height: width,
                borderRadius: width / 2,
                backgroundColor: tickColor,
                transform: [{ rotate: `${angle}deg` }],
              }}
            />
            {showNumerals && i % scale.label === 0 ? (
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

      <View
        pointerEvents="none"
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          bottom: 0,
          left: 0,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 1,
        }}
      >
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
        <Text
          style={{
            ...mono(600),
            fontSize: big,
            lineHeight: Math.round(big * 1.02),
            letterSpacing: ls(-0.05, big),
            color: color.hi,
          }}
        >
          {core.value}
        </Text>
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
        {core.chips?.length ? (
          <View style={{ flexDirection: 'row', gap: 4, marginTop: gap }}>
            {core.chips.map((chip) => (
              <View
                key={`${chip.value}-${chip.unit}`}
                style={{
                  flexDirection: 'row',
                  alignItems: 'baseline',
                  gap: 5,
                  paddingVertical: 2,
                  paddingHorizontal: 7,
                  borderRadius: radius.cell,
                  borderCurve: 'continuous',
                }}
              >
                <Text
                  style={{
                    ...mono(600),
                    fontSize: small,
                    lineHeight: Math.round(small * 1.02),
                    letterSpacing: ls(-0.03, small),
                    color: color.mid,
                  }}
                >
                  {chip.value}
                </Text>
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
              </View>
            ))}
          </View>
        ) : null}
      </View>
    </View>
  );
}
