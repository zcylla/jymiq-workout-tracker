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
  const filled = Math.min(1, Math.max(0, value));
  return (
    <View
      style={[
        {
          height,
          borderRadius: height / 2,
          backgroundColor: wash.track,
          overflow: 'hidden',
        },
        width === 'full' ? { alignSelf: 'stretch' } : { width, flexShrink: 0 },
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
