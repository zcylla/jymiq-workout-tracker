import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { db } from '@/data/db';
import { exercises, personalRecords, routines, sessions, sets } from '@/data/schema';
import { color, containment, space, text } from '@/theme';

/** Row counts, so "did the migration run" has an answer on the device. */
export default function DbScreen() {
  const insets = useSafeAreaInsets();
  const counts = [
    ['EXERCISES', useLiveQuery(db.select().from(exercises)).data?.length],
    ['ROUTINES', useLiveQuery(db.select().from(routines)).data?.length],
    ['SESSIONS', useLiveQuery(db.select().from(sessions)).data?.length],
    ['SETS', useLiveQuery(db.select().from(sets)).data?.length],
    ['RECORDS', useLiveQuery(db.select().from(personalRecords)).data?.length],
  ] as const;

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: color.ground }}
      contentContainerStyle={{
        paddingHorizontal: space.pad,
        paddingTop: insets.top + 10,
        gap: space.within,
      }}
    >
      <Text style={text.label}>DATABASE</Text>
      <Text style={text.h1}>Tables</Text>
      <View style={{ gap: space.row, paddingTop: space.within }}>
        {counts.map(([name, n]) => (
          <View
            key={name}
            style={[
              containment.rowPlate,
              { paddingHorizontal: 14, paddingVertical: 13, flexDirection: 'row' },
            ]}
          >
            <Text style={text.rowName}>{name}</Text>
            <View style={{ flex: 1 }} />
            <Text style={text.num}>{n ?? '—'}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
