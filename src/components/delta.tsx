import { Text, View } from 'react-native';

import { color, text } from '@/theme';

import { Icon } from './icon';

/** A signed change. The arrow is what makes it read without parsing the sign. */
export function Delta({ value, positive = true }: { value: string; positive?: boolean }) {
  const tone = positive ? color.done : color.live;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 3 }}>
      <Icon name={positive ? 'up' : 'down'} tone={tone} />
      <Text style={[text.numSm, { color: tone }]}>{value}</Text>
    </View>
  );
}
