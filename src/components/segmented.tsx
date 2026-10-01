import { View } from 'react-native';

import { radius, size } from '@/theme';

import { EdgeChip } from './edge-chip';

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
      {options.map((o) => (
        <EdgeChip
          key={o.key}
          label={o.label}
          active={o.key === value}
          onPress={() => onChange(o.key)}
          height={size.hit}
          radius={radius.chip}
        />
      ))}
    </View>
  );
}
