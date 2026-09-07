import { Text, View } from 'react-native';

import { indexOf, valueAt, type Scale } from '@/lib/scale';
import { color, lh, mono, size, text } from '@/theme';

type Props = {
  scale: Scale;
  value: number;
  unit: string;
};

/** A fixed, nine-detent readout. Gesture ownership arrives with the live screen. */
export function Tape({ scale, value, unit }: Props) {
  const active = indexOf(scale, value);

  return (
    <View style={{ width: 62 }}>
      <Text style={[text.label, { marginBottom: 8, textAlign: 'right' }]}>{unit}</Text>
      {Array.from({ length: 9 }, (_, row) => {
        const distance = row - 4;
        const index = active + distance;
        if (index < 0 || index >= scale.n)
          return <View key={distance} style={{ height: size.tapeRow }} />;

        const isActive = distance === 0;
        const even = distance % 2 === 0;
        const tickWidth = isActive ? 15 : even ? 11 : 7;
        const tickHeight = isActive ? 2 : 1;

        return (
          <View
            key={distance}
            style={{
              height: size.tapeRow,
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'flex-end',
              gap: 7,
            }}
          >
            <Text
              style={{
                ...mono(isActive ? 600 : 400),
                fontSize: isActive ? 16 : 13,
                lineHeight: lh(isActive ? 16 : 13),
                color: isActive ? color.hi : even ? color.lo : color.dim,
              }}
            >
              {valueAt(scale, index)}
            </Text>
            <View
              style={{
                width: tickWidth,
                height: tickHeight,
                borderRadius: 1,
                backgroundColor: isActive ? color.accent : color.tick2,
              }}
            />
          </View>
        );
      })}
    </View>
  );
}
