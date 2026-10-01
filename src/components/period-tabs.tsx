import { View } from 'react-native';

import { radius, size } from '@/theme';

import { EdgeChip } from './edge-chip';

const HEIGHT = 32;

export function PeriodTabs<T extends string>({
  options,
  value,
  onChange,
}: {
  options: readonly { key: T; label: string }[];
  value: T;
  onChange: (key: T) => void;
}) {
  return (
    <View
      style={{
        flexDirection: 'row',
        gap: 6,
        height: size.hit,
        marginVertical: -(size.hit - HEIGHT) / 2,
        alignItems: 'center',
        overflow: 'visible',
      }}
    >
      {options.map((option) => (
        <EdgeChip
          key={option.key}
          label={option.label}
          active={option.key === value}
          onPress={() => onChange(option.key)}
          height={HEIGHT}
          radius={radius.row}
          minWidth={size.hit}
          hitSlop={{ top: (size.hit - HEIGHT) / 2, bottom: (size.hit - HEIGHT) / 2 }}
        />
      ))}
    </View>
  );
}
