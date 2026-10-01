import { Pressable, Text, View } from 'react-native';

import { color, radius, size, text } from '@/theme';

import { pop } from './haptics';

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
      {options.map((option) => {
        const active = option.key === value;
        return (
          <Pressable
            key={option.key}
            hitSlop={{ top: (size.hit - HEIGHT) / 2, bottom: (size.hit - HEIGHT) / 2 }}
            onPress={() => {
              if (!active) pop();
              onChange(option.key);
            }}
            accessibilityRole="button"
            accessibilityState={{ selected: active }}
            style={{
              flex: 1,
              minWidth: size.hit,
              height: HEIGHT,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.row,
              boxShadow: active ? `0 0 0 1.5px ${color.accent}` : undefined,
            }}
          >
            <Text
              numberOfLines={1}
              style={[text.pill, { color: active ? color.accent : color.lo }]}
            >
              {option.label}
            </Text>
          </Pressable>
        );
      })}
    </View>
  );
}
