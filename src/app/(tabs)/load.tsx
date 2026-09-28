import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import {
  Calendar,
  Delta,
  Screen,
  ScreenHeader,
  Section,
  StatTiles,
  useTabBarHeight,
  ZoneBar,
} from '@/components';
import { sessionsInRangeQuery } from '@/data/queries/calendar';
import { useRows } from '@/data/live';
import {
  bestE1rmQuery,
  loggedSessionIdsQuery,
  primeSetsQuery,
  rangeSetsQuery,
} from '@/data/queries/load';
import { useActiveSchedule } from '@/data/schedule';
import { useSettings } from '@/data/settings';
import { monthGrid, type TrainedDay, trainedDays } from '@/lib/calendar';
import { deloadCall, type LiftHistory, liftsThisWeek } from '@/lib/deload';
import { muscleRows } from '@/lib/landmarks';
import { countWorkingSets, formatTonnage, totalVolume } from '@/lib/volume';
import { weekBounds } from '@/lib/week';
import { color, hairline, text } from '@/theme';

/**
 * Lab 37 D1 on top — sets, volume, sets per muscle and the deload call — and
 * then the calendar below it.
 *
 * Lab 39 Q2 — the calendar, and so far the whole Load tab. §0's IA gives Load
 * "volume, deload, bodyweight, calendar", but no board draws the tab root, and
 * the calendar is the only one of the four with both data and a board today.
 *
 * **The missed state is live**, now that programs store a plan by weekday: a
 * past day the running program put a routine on, and you did not train, drops
 * its rest plate and takes a ring instead (§0). With nothing running the
 * schedule is empty and every untrained day is rest again, which is the honest
 * answer — the app cannot assert a lapse against a plan that does not exist.
 * Nothing before the day a program was activated is ever missed either.
 */
export default function LoadScreen() {
  const tabBar = useTabBarHeight();
  const settings = useSettings();

  // One month, computed once: the grid, the query range and the title all come
  // out of the same call, so they cannot disagree about which month this is.
  const grid = useMemo(() => monthGrid(), []);
  const active = useActiveSchedule();

  const { data, updatedAt } = useLiveQuery(
    useMemo(() => sessionsInRangeQuery(grid.from, grid.to), [grid.from, grid.to]),
    [grid.from, grid.to],
  );
  const loading = updatedAt === undefined;

  const trained = useMemo(() => trainedDays(data), [data]);
  const volumeKg = useMemo(() => {
    let sum = 0;
    for (const day of trained.values()) sum += day.volumeKg;
    return sum;
  }, [trained]);

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

  const openDay = (day: TrainedDay) => router.push(`/history/${day.sessionId}`);

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

      <Section label={grid.title.toUpperCase()}>
        <Calendar
          weeks={grid.weeks}
          trained={trained}
          todayKey={grid.todayKey}
          schedule={active?.schedule}
          onPressDay={openDay}
        />

        {/* One line of text, not a second chart competing with the grid for the
            same attention. A month with nothing in it keeps the grid — §0 draws
            a component that will fill in dim rather than hiding it. */}
        {loading ? null : trained.size === 0 ? (
          <Text style={text.prose}>
            Nothing logged this month. Start a session and it lands here.
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Text style={text.body}>Trained</Text>
            <Text style={text.num}>
              {trained.size} of {grid.days}
            </Text>
            <View style={{ width: 1, height: 13, backgroundColor: hairline.onPlate }} />
            <Text style={text.body}>volume</Text>
            <Text style={[text.num, { color: color.accent }]}>{formatTonnage(volumeKg, unit)}</Text>
          </View>
        )}
      </Section>
    </Screen>
  );
}
