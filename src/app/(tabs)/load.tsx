import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import {
  Delta,
  ListRow,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  StatTiles,
  useTabBarHeight,
  ZoneBar,
} from '@/components';
import { bodyWeightsQuery } from '@/data/queries/bodyweight';
import { useRows } from '@/data/live';
import {
  bestE1rmQuery,
  loggedSessionIdsQuery,
  primeSetsQuery,
  rangeSetsQuery,
} from '@/data/queries/load';
import { useSettings } from '@/data/settings';
import { daysSince } from '@/lib/bodyweight';
import { formatWeight } from '@/lib/units';
import { deloadCall, type LiftHistory, liftsThisWeek } from '@/lib/deload';
import { muscleRows } from '@/lib/landmarks';
import { countWorkingSets, formatTonnage, totalVolume } from '@/lib/volume';
import { weekBounds } from '@/lib/week';
import { text } from '@/theme';

/** Lab 37 D1: sets, volume, sets per muscle and the deload call, then the body map and Records. */
export default function LoadScreen() {
  const tabBar = useTabBarHeight();
  const settings = useSettings();

  const week = useMemo(() => weekBounds(), []);
  const unit = settings.weightUnit;
  const weekDeps = [week.lastFrom, week.thisFrom, week.to];

  const rangeSets = useRows(
    useMemo(() => rangeSetsQuery(week.lastFrom, week.to), [week.lastFrom, week.to]),
    weekDeps,
  );
  const primeSets = useRows(
    useMemo(() => primeSetsQuery(week.thisFrom, week.to), [week.thisFrom, week.to]),
    weekDeps,
  );
  const since = week.thisFrom - 12 * 7 * 86_400_000;
  const e1rms = useRows(
    useMemo(() => bestE1rmQuery(since), [since]),
    [since],
  );
  const someSessions = useRows(
    useMemo(() => loggedSessionIdsQuery(), []),
    [],
  );

  const weighIns = useRows(
    useMemo(() => bodyWeightsQuery(), []),
    [],
  );
  const lastWeighIn = weighIns?.[weighIns.length - 1];
  const weighInMeta = lastWeighIn
    ? `${formatWeight(lastWeighIn.weightKg, unit)} ${unit.toUpperCase()} · ${ago(daysSince(lastWeighIn.measuredAt, nowMs()))}`
    : 'NOT LOGGED YET';

  const totals = useMemo(() => {
    if (!rangeSets) return null;
    const mine = rangeSets.filter((s) => s.startedAt >= week.thisFrom);
    const prev = rangeSets.filter((s) => s.startedAt < week.thisFrom);
    return {
      sets: countWorkingSets(mine),
      volumeKg: totalVolume(mine),
      lastVolumeKg: totalVolume(prev),
    };
  }, [rangeSets, week.thisFrom]);

  const muscles = useMemo(() => (primeSets ? muscleRows(primeSets) : null), [primeSets]);

  const call = useMemo(() => {
    if (!muscles || !e1rms || !someSessions) return null;
    const byLift = new Map<string, LiftHistory>();
    for (const r of e1rms) {
      if (r.bestE1rmKg == null) continue;
      const h = byLift.get(r.exerciseId) ?? { name: r.name, sessions: [] };
      h.sessions.push({ sessionId: r.sessionId, at: r.at, bestE1rmKg: r.bestE1rmKg });
      byLift.set(r.exerciseId, h);
    }
    return deloadCall({
      totalSessions: someSessions.length,
      muscles,
      lifts: liftsThisWeek([...byLift.values()], week.thisFrom),
    });
  }, [muscles, e1rms, someSessions, week.thisFrom]);

  const change =
    totals && totals.lastVolumeKg > 0
      ? Math.round(((totals.volumeKg - totals.lastVolumeKg) / totals.lastVolumeKg) * 100)
      : null;

  return (
    <Screen bottomInset={tabBar}>
      <ScreenHeader title="Load" kicker="THIS WEEK" />

      <Section first>
        <StatTiles
          surface="raised"
          items={[
            { label: 'SETS', value: totals ? String(totals.sets) : '—' },
            {
              label: 'VOLUME',
              value: totals && totals.volumeKg > 0 ? formatTonnage(totals.volumeKg, unit) : '—',
              below:
                change === null ? undefined : (
                  <Delta value={`${change >= 0 ? '+' : ''}${change}%`} positive={change >= 0} />
                ),
            },
          ]}
        />
      </Section>

      <Section label="WEEKLY SETS PER MUSCLE" plated={false}>
        {muscles === null ? null : muscles.length ? (
          <View>
            {muscles.map((m) => (
              <ZoneBar key={m.muscle} name={m.name} sets={m.sets} landmark={m.landmark} />
            ))}
          </View>
        ) : (
          <Text style={text.prose}>No sets logged this week yet.</Text>
        )}
      </Section>

      <Section label="DELOAD" plated={false}>
        {call ? (
          <View style={{ gap: 8 }}>
            <Text style={text.lead}>{call.lead}</Text>
            <Text style={text.prose}>{call.reason}</Text>
          </View>
        ) : null}
      </Section>

      <Section label="BODYWEIGHT" plated={false}>
        <RowPlates>
          <RowPlate onPress={() => router.push('/bodyweight')}>
            <ListRow title="Bodyweight" meta={weighInMeta} />
          </RowPlate>
        </RowPlates>
      </Section>

      <Section plated={false}>
        <RowPlates>
          <RowPlate onPress={() => router.push('/body')}>
            <ListRow title="Body map" />
          </RowPlate>
          <RowPlate onPress={() => router.push('/records')}>
            <ListRow title="Records" />
          </RowPlate>
        </RowPlates>
      </Section>
    </Screen>
  );
}

const ago = (days: number) => (days <= 0 ? 'TODAY' : `${days} DAY${days === 1 ? '' : 'S'} AGO`);

function nowMs(): number {
  return Date.now();
}
