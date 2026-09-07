import { Link } from 'expo-router';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, space, text } from '@/theme';

/** Placeholder until the Today screen lands (Lab 43 T2). */
export default function TodayScreen() {
  const insets = useSafeAreaInsets();
  return (
    <View
      style={{
        flex: 1,
        backgroundColor: color.ground,
        paddingHorizontal: space.pad,
        paddingTop: insets.top + 10,
        gap: space.within,
      }}
    >
      <Text style={text.label}>THU 4 SEP</Text>
      <Text style={text.h1}>Today</Text>
      <Link href="/dev/fonts" style={{ marginTop: space.between }}>
        <Text style={text.body}>Type ramp proof sheet →</Text>
      </Link>
    </View>
  );
}
