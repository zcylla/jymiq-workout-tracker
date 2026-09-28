import { Text, View } from 'react-native';

import { lh, ls, mono, color, text, wash } from '@/theme';
import { type Landmark, barPct, verdict as verdictOf } from '@/lib/landmarks';

/**
 * kit's zone-bar row. The marker is always near-white, never tinted to the
 * verdict (§0: tinted, it vanished inside its own band). Without a landmark
 * there is no denominator, so the row is name and count only.
 */
export function ZoneBar({
  name,
  sets,
  landmark,
}: {
  name: string;
  sets: number;
  landmark?: Landmark | null;
}) {
  const v = landmark ? verdictOf(sets, landmark) : null;
  const tone = v ? color[v.tone] : color.hi;

  return (
    <View style={{ paddingVertical: 7, gap: 6 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={{ ...text.body, color: color.hi }}>{name}</Text>
        <View style={{ flex: 1 }} />
        <Text
          style={{
            ...mono(600),
            fontSize: 15,
            letterSpacing: ls(-0.02, 15),
            lineHeight: lh(15),
            color: tone,
          }}
        >
          {sets}
        </Text>
        {v ? <Text style={[text.label, { width: 64, textAlign: 'right' }]}>{v.word}</Text> : null}
      </View>
      {landmark ? (
        <View style={{ height: 8 }}>
          <View
            style={{
              flexDirection: 'row',
              height: 8,
              borderRadius: 4,
              overflow: 'hidden',
            }}
          >
            <View
              style={{
                width: `${barPct(landmark.low, landmark.cap)}%`,
                backgroundColor: wash.field,
              }}
            />
            <View
              style={{
                width: `${barPct(landmark.high, landmark.cap) - barPct(landmark.low, landmark.cap)}%`,
                backgroundColor: wash.done,
              }}
            />
            <View style={{ flex: 1, backgroundColor: wash.live }} />
          </View>
          <View
            style={{
              position: 'absolute',
              left: `${barPct(sets, landmark.cap)}%`,
              top: -3,
              bottom: -3,
              width: 2,
              marginLeft: -1,
              borderRadius: 1,
              backgroundColor: color.hi,
              boxShadow: `0 0 0 1.5px ${color.ground}`,
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
