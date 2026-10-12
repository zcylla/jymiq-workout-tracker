import { Pressable, Text, View } from 'react-native';

import type { SetKind } from '@/lib/volume';
import { color, hairline, size, space, text } from '@/theme';

import { Icon } from './icon';
import { Pill } from './pill';

export function SetCounter({
  index,
  total,
  kind,
  typeLabel,
  onSets,
  onType,
  compact,
}: {
  index: number;
  total: number;
  kind: SetKind;
  typeLabel: string;
  onSets: () => void;
  onType: () => void;
  compact: boolean;
}) {
  const pillTone = kind === 'warmup' ? 'dim' : 'accent';
  const plain = kind === 'working';
  const ink = plain ? color.lo : color[pillTone];
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
        {plain ? (
          <Text style={[text.label, { color: ink }]}>{typeLabel.toUpperCase()}</Text>
        ) : (
          <Pill label={typeLabel.toUpperCase()} tone={pillTone} />
        )}
        <Icon name="down" tone={ink} />
      </Pressable>
    </View>
  );
}
