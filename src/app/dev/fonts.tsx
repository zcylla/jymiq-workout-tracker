import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { color, containment, mono, sans, space, text, type TextVariant } from '@/theme';

/**
 * Phase 1's verification gate, and nothing else.
 *
 * Three things fail silently on a device and are invisible in review: Android
 * falling back to the system font because the plugin's family string does not
 * match what styles request, iOS synthesising a fake bold, and em letter-spacing
 * copied across as points. All three are visible here in one screenshot.
 */
const SANS: (400 | 500 | 600 | 700)[] = [400, 500, 600, 700];
const MONO: (400 | 500 | 600)[] = [400, 500, 600];

const RAMP: TextVariant[] = [
  'h1',
  'h2',
  'rowTitle',
  'rowName',
  'lead',
  'body',
  'prose',
  'label',
  'meta',
  'num',
  'numSm',
  'numTile',
  'numCore',
];

export default function FontsScreen() {
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.ground }}
      contentContainerStyle={{
        paddingHorizontal: space.pad,
        paddingTop: insets.top + 10,
        paddingBottom: insets.bottom + 40,
        gap: space.between,
      }}
    >
      <View style={{ gap: space.within }}>
        <Text style={text.label}>GEIST · FOUR WEIGHTS</Text>
        {SANS.map((w) => (
          <Text key={w} style={[{ fontSize: 22, color: color.hi }, sans(w)]}>
            {w} Barbell Squat 102.5
          </Text>
        ))}
      </View>

      <View style={{ gap: space.within }}>
        <Text style={text.label}>GEIST MONO · THREE WEIGHTS · TABULAR</Text>
        {MONO.map((w) => (
          <Text key={w} style={[{ fontSize: 20, color: color.hi }, mono(w)]}>
            {w} 102.5 · 11 111 · 00:31:17
          </Text>
        ))}
      </View>

      <View style={{ gap: space.within }}>
        <Text style={text.label}>THE RAMP</Text>
        {RAMP.map((v) => (
          <View key={v} style={{ gap: 3 }}>
            <Text style={text.meta}>{v.toUpperCase()}</Text>
            <Text style={text[v]}>102.5 Barbell Squat</Text>
          </View>
        ))}
      </View>

      <View style={{ gap: space.within }}>
        <Text style={text.label}>CONTAINMENT · LIT EDGE ON ANDROID</Text>
        <View style={containment.groupedPlate}>
          <Text style={text.rowName}>groupedPlate — one hero per screen</Text>
        </View>
        <View style={{ gap: space.row }}>
          <View style={[containment.rowPlate, { paddingHorizontal: 14, paddingVertical: 13 }]}>
            <Text style={text.rowName}>rowPlate — you touch this row</Text>
          </View>
          <View style={[containment.rowPlate, { paddingHorizontal: 14, paddingVertical: 13 }]}>
            <Text style={text.rowName}>rowPlate — 7pt gap, no hairline</Text>
          </View>
        </View>
      </View>
    </ScrollView>
  );
}
