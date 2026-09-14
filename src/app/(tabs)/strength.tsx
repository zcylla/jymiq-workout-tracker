import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import {
  Rail,
  type RailItem,
  Screen,
  ScreenHeader,
  Section,
  StatTiles,
  type Tile,
} from '@/components';
import { recordsQuery } from '@/data/queries/records';
import { useSettings } from '@/data/settings';
import { PR_LABELS, type PrCategory, formatPrValue } from '@/lib/pr';
import { sessionDateLabel, sessionDotTone } from '@/lib/time';
import { formatWeight, type Unit } from '@/lib/units';
import { color, text } from '@/theme';

/** Shadowing the global `Record<K, V>` utility in this file would be a trap. */
type PrRow = Awaited<ReturnType<typeof recordsQuery>>[number];

/** Lab 36 C4. This is a tab root (Strength), so no back affordance. */
export default function StrengthScreen() {
  const { data, updatedAt } = useLiveQuery(
    useMemo(() => recordsQuery(), []),
    [],
  );
  const records = data ?? [];
  const loading = updatedAt === undefined;

  const { monthCount, yearCount } = useMemo(() => {
    const now = new Date();
    let month = 0;
    let year = 0;
    for (const r of records) {
      const d = new Date(r.achievedAt);
      if (d.getFullYear() === now.getFullYear()) {
        year += 1;
        if (d.getMonth() === now.getMonth()) month += 1;
      }
    }
    return { monthCount: month, yearCount: year };
  }, [records]);

  const tiles: Tile[] = [
    { label: 'THIS MONTH', value: loading ? '—' : String(monthCount) },
    { label: 'THIS YEAR', value: loading ? '—' : String(yearCount) },
  ];

  const railItems: RailItem[] = records.map((r) => ({
    tone: sessionDotTone(r.achievedAt),
    body: <RecordRow record={r} />,
  }));

  return (
    <Screen>
      <ScreenHeader title="Records" kicker="STRENGTH" />

      <Section first pad={13}>
        <StatTiles items={tiles} surface="raised" />
      </Section>

      <Section label="TIMELINE" plated={false}>
        {records.length ? (
          <Rail items={railItems} air={26} />
        ) : loading ? null : (
          <Text style={text.prose}>No records yet. Log a session to set your first one.</Text>
        )}
      </Section>
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
