import { Pressable, Text, View } from 'react-native';

import { color, radius, size, text, wash } from '@/theme';

import { pop } from './haptics';

/**
 * One choice out of a few, filtering the content beneath it. Drawn like a Chip
 * but full width, so every segment clears the 44pt touch floor on both axes.
 */
export function Segmented<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View style={{ flexDirection: 'row', gap: 6 }}>
      {options.map((o) => {
        const on = o.key === value;
        return (
          <Pressable
            key={o.key}
            onPress={() => {
              if (!on) pop();
              onChange(o.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: on }}
            style={{
              flex: 1,
              minHeight: size.hit,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.chip,
              borderCurve: 'continuous',
              backgroundColor: on ? wash.chip : wash.field,
            }}
          >
            <Text style={[text.pill, { color: on ? color.accent : color.lo }]}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}
