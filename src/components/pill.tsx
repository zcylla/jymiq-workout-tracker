import { Text, View } from 'react-native';

import { color, radius, text, wash } from '@/theme';

/**
 * The small tinted mono tag: "PR", "TODAY", "WEEK 3 / 8".
 *
 * The outer row is what keeps the tint block the size of its text. `alignSelf`
 * would do it in a column but pins the pill to the top of a row, which is where
 * it usually sits — beside a chevron, which is centred.
 */
export function Pill({
  label,
  tone = 'accent',
}: {
  label: string;
  tone?: 'accent' | 'done' | 'live';
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          paddingVertical: 2,
          paddingHorizontal: 7,
          borderRadius: radius.pill,
          backgroundColor: wash[tone],
        }}
      >
        <Text style={[text.pill, { color: color[tone] }]}>{label}</Text>
      </View>
    </View>
  );
}
