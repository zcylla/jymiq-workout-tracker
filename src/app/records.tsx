import { router } from 'expo-router';
import { useMemo } from 'react';
import { FlatList, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Screen, ScreenHeader } from '@/components';
import { RailRow } from '@/components/rail';
import { useRows } from '@/data/live';
import { recordsQuery } from '@/data/queries/records';
import { useSettings } from '@/data/settings';
import { formatPrValue, PR_LABELS, type PrCategory } from '@/lib/pr';
import { sessionDateLabel, sessionDotTone } from '@/lib/time';
import { formatWeight, type Unit } from '@/lib/units';
import { color, space, text } from '@/theme';

/** Shadowing the global `Record<K, V>` utility in this file would be a trap. */
type PrRow = Awaited<ReturnType<typeof recordsQuery>>[number];

/** Lab 36 C4, pushed from History and Load. */
export default function RecordsScreen() {
  const insets = useSafeAreaInsets();
  const records = useRows(
    useMemo(() => recordsQuery(), []),
    [],
  );
  return (
    <Screen scroll={false}>
      <ScreenHeader title="Records" onBack={() => router.back()} />

      <FlatList
        data={records}
        keyExtractor={(record) => record.id}
        renderItem={({ item, index }) => (
          <RailRow
            item={{ tone: sessionDotTone(item.achievedAt), body: <RecordRow record={item} /> }}
            last={index === (records?.length ?? 0) - 1}
            air={26}
          />
        )}
        initialNumToRender={14}
        windowSize={3}
        maxToRenderPerBatch={7}
        removeClippedSubviews
        style={{ flex: 1 }}
        contentContainerStyle={{ paddingTop: 8, paddingBottom: insets.bottom + space.between }}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={records === null ? null : <Text style={text.body}>No records yet</Text>}
      />
    </Screen>
  );
}

/** `kind === 'most_reps_at_weight'` names the weight it was set at; every other category's label is fixed. */
function categoryLabel(category: PrCategory, weightKg: number | null, unit: Unit): string {
  if (category === 'most_reps_at_weight' && weightKg != null) {
    return `${PR_LABELS[category]} ${formatWeight(weightKg, unit)}`;
  }
  return PR_LABELS[category];
}

/** lab36.py's `pr_node`: date + value, exercise name, mono `CATEGORY · WAS previous`. */
function RecordRow({ record }: { record: PrRow }) {
  const settings = useSettings();
  const meta = [categoryLabel(record.category, record.weightKg, settings.weightUnit)];
  if (record.previousValue != null) {
    meta.push(`WAS ${formatPrValue(record.category, record.previousValue, settings.weightUnit)}`);
  }

  return (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Text style={text.num}>{sessionDateLabel(record.achievedAt)}</Text>
        <View style={{ flex: 1 }} />
        <Text style={[text.numRow, { color: color.accent }]}>
          {formatPrValue(record.category, record.value, settings.weightUnit)}
        </Text>
      </View>
      <View style={{ gap: 2 }}>
        <Text style={text.rowName}>{record.exerciseName}</Text>
        <Text style={text.meta}>{meta.join(' · ')}</Text>
      </View>
    </>
  );
}
