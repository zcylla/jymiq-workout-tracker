import { View } from 'react-native';

import { color, type Ink, wash } from '@/theme';

export function Meter({
  value,
  width = 76,
  height = 6,
  tone = color.accent,
}: {
  /** 0..1. Clamped — a meter must never overflow its track. */
  value: number;
  /** A point width, or 'full' to fill the parent. */
  width?: number | 'full';
  height?: number;
  tone?: Ink;
}) {
  // NaN survives Math.min/max, and a `NaN%` width renders wrong rather than
  // throwing. An empty state divides by zero often enough to matter.
  const filled = Number.isFinite(value) ? Math.min(1, Math.max(0, value)) : 0;
  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: wash.track,
          overflow: 'hidden',
        },
        // kit emits width:100%, which is axis-independent. alignSelf:'stretch'
        // is not — in a row parent it stretches the wrong way and the meter
        // collapses, which is where StatTiles puts it.
        width === 'full' ? { width: '100%' } : { width, flexShrink: 0 },
      ]}
    >
      <View
        style={{
          height,
          width: `${filled * 100}%`,
          borderRadius: height / 2,
          backgroundColor: tone,
        }}
      />
    </View>
  );
}
