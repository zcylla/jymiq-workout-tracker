import { Pressable, Text, View } from 'react-native';

import { color, radius, size, text, wash } from '@/theme';

/**
 * kit's `scale3` — a mono label over N equal cells. Lives inside a `RowPlate`,
 * which already pads its sides, so this adds only the row's vertical air.
 */
export function Scale({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string }[];
  value: string | null;
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ gap: 8, paddingVertical: 7 }}>
      <Text style={text.label}>{label}</Text>
      <View style={{ flexDirection: 'row', gap: 5 }}>
        {options.map((o) => {
          const selected = o.value === value;
          return (
            <Pressable
              key={o.value}
              onPress={() => onChange(o.value)}
              accessibilityRole="radio"
              accessibilityState={{ selected }}
              style={{
                flex: 1,
                minHeight: size.hit,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.chip,
                borderCurve: 'continuous',
                backgroundColor: selected ? wash.chip : wash.field,
              }}
            >
              <Text style={[text.pill, { color: selected ? color.accent : color.lo }]}>
                {o.label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
