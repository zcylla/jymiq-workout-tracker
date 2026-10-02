import { Pressable, Text, View } from 'react-native';

import { color, hairline, size, space, text } from '@/theme';

import { Icon } from './icon';

export function SetCounter({
  index,
  total,
  typeLabel,
  onSets,
  onType,
  compact,
}: {
  index: number;
  total: number;
  typeLabel: string;
  onSets: () => void;
  onType: () => void;
  compact: boolean;
}) {
  const tone = typeLabel === 'Working' ? color.lo : color.accent;
  return (
    <View style={{ alignItems: 'center', marginTop: compact ? 0 : space.within }}>
      <Pressable
        onPress={onSets}
        accessibilityRole="button"
        accessibilityLabel={`Set ${index} of ${total}. View sets`}
        style={{
          alignSelf: 'stretch',
          minHeight: size.hit,
          alignItems: 'center',
          justifyContent: 'center',
          borderTopWidth: compact ? 0 : 0.5,
          borderBottomWidth: compact ? 0 : 0.5,
          borderColor: hairline.onGround,
        }}
      >
        <Text style={text.label}>
          SET {index} OF {total}
        </Text>
      </Pressable>
      <Pressable
        onPress={onType}
        accessibilityRole="button"
        accessibilityLabel={`${typeLabel}. Change set type`}
        style={({ pressed }) => ({
          minHeight: size.hit,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'center',
          gap: space.row,
          paddingHorizontal: space.within,
          opacity: pressed ? 0.7 : 1,
        })}
      >
        <Text style={[text.label, { color: tone }]}>{typeLabel.toUpperCase()}</Text>
        <Icon name="down" tone={tone} />
      </Pressable>
    </View>
  );
}
