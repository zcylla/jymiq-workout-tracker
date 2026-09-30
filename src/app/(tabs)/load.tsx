import { router } from 'expo-router';
import { useMemo } from 'react';
import { Pressable, Text, useWindowDimensions, View } from 'react-native';

import {
  BodyMap,
  Chevron,
  Delta,
  ListRow,
  Pill,
  Rail,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  StatTiles,
  useTabBarHeight,
  ZoneBar,
} from '@/components';
import { useRows } from '@/data/live';
import { fatigueSetsQuery } from '@/data/queries/fatigue';
import { bodyWeightsQuery } from '@/data/queries/bodyweight';
import {
  bestE1rmQuery,
  loggedSessionIdsQuery,
  primeSetsQuery,
  rangeSetsQuery,
} from '@/data/queries/load';
import { recordsQuery } from '@/data/queries/records';
import { useActiveSchedule } from '@/data/schedule';
import { useSettings } from '@/data/settings';
import { daysSince } from '@/lib/bodyweight';
import { deloadCall, type LiftHistory, liftsThisWeek } from '@/lib/deload';
import { loadByMuscle, relativeLoad, WINDOW_DAYS } from '@/lib/fatigue';
import { muscleRows } from '@/lib/landmarks';
import { formatPrValue } from '@/lib/pr';
import { programWeekNumber } from '@/lib/program';
import { sessionDateLabel, sessionDotTone } from '@/lib/time';
import { formatWeight } from '@/lib/units';
import { countWorkingSets, formatTonnage, totalVolume } from '@/lib/volume';
import { weekBounds } from '@/lib/week';
import { color, heat, space, text } from '@/theme';

const DAY = 86_400_000;
const FIGURE_GAP = 14;
const SCALE = [0, 0.25, 0.5, 0.75, 1];
const RECORDS_SHOWN = 3;
const DELOAD_TONE = { DELOAD: 'live', HOLD: 'accent', 'NOT YET': 'done' } as const;

/** Lab 49 L-A: the body opens the tab, then the week's numbers, sets per muscle and Records. */
export default function LoadScreen() {
  const tabBar = useTabBarHeight();
  const settings = useSettings();
  const active = useActiveSchedule();

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

  const now = useMemo(() => nowMs(), []);
  const fatigueSets = useRows(
    useMemo(() => fatigueSetsQuery(now - WINDOW_DAYS * DAY), [now]),
    [now],
  );
  const relative = useMemo(
    () => relativeLoad(loadByMuscle(fatigueSets ?? [], now)),
    [fatigueSets, now],
  );

  const records = useRows(
    useMemo(() => recordsQuery(), []),
    [],
  );

  const weighIns = useRows(
    useMemo(() => bodyWeightsQuery(), []),
    [],
  );
  const lastWeighIn = weighIns?.[weighIns.length - 1];
  const weighInMeta = lastWeighIn
    ? `${formatWeight(lastWeighIn.weightKg, unit)} ${unit.toUpperCase()} · ${ago(daysSince(lastWeighIn.measuredAt, nowMs()))}`
    : '—';

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
    if (!muscles || !e1rms || !someSessions) return undefined;
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

  const weekTag = active?.program ? programWeekNumber(active.program.startedAt) : null;

  return (
    <Screen bottomInset={tabBar}>
      <ScreenHeader title="Load" kicker="THIS WEEK" />

      <Section first plated={false}>
        <BodyHero relative={relative} />
      </Section>

      <Section pad={13}>
        <View style={{ gap: space.within }}>
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
          <View
            style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 2 }}
          >
            <Text style={text.label}>DELOAD</Text>
            <View style={{ flex: 1 }} />
            {call === undefined ? null : call === null ? (
              <Text style={[text.num, { color: color.lo }]}>—</Text>
            ) : (
              <>
                <Pill label={call} tone={DELOAD_TONE[call]} />
                {weekTag ? <Text style={[text.meta, { color: color.lo }]}>W{weekTag}</Text> : null}
              </>
            )}
          </View>
        </View>
      </Section>

      {muscles?.length ? (
        <Section label="SETS / MUSCLE" plated={false}>
          <View>
            {muscles.map((m) => (
              <ZoneBar key={m.muscle} name={m.name} sets={m.sets} landmark={m.landmark} />
            ))}
          </View>
        </Section>
      ) : null}

      <Section plated={false}>
        <RowPlates>
          <RowPlate onPress={() => router.push('/bodyweight')}>
            <ListRow title="Bodyweight" meta={weighInMeta} />
          </RowPlate>
        </RowPlates>
      </Section>

      <Section
        label="RECORDS"
        plated={false}
        right={
          <Pressable
            onPress={() => router.push('/records')}
            accessibilityRole="button"
            accessibilityLabel="Records"
            hitSlop={{ top: 14, bottom: 14, left: 14, right: 6 }}
            style={({ pressed }) => [
              { flexDirection: 'row', alignItems: 'center', gap: 8 },
              pressed && { opacity: 0.6 },
            ]}
          >
            {records ? (
              <Text style={[text.num, { color: color.mid }]}>{records.length}</Text>
            ) : null}
            <Chevron />
          </Pressable>
        }
      >
        {records?.length ? (
          <Rail
            air={22}
            items={records.slice(0, RECORDS_SHOWN).map((r) => ({
              tone: sessionDotTone(r.achievedAt),
              onPress: () => router.push('/records'),
              body: (
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
                  <Text style={text.num}>{sessionDateLabel(r.achievedAt)}</Text>
                  <Text style={[text.rowName, { flex: 1 }]} numberOfLines={1}>
                    {r.exerciseName}
                  </Text>
                  <Text style={[text.numRow, { color: color.accent }]}>
                    {formatPrValue(r.category, r.value, unit)}
                  </Text>
                </View>
              ),
            }))}
          />
        ) : null}
      </Section>
    </Screen>
  );
}

/** The full figure, front and back, coloured by the last week's load, over a FRESH to NEEDS REST key. */
function BodyHero({ relative }: { relative: Map<string, number> }) {
  const { width } = useWindowDimensions();
  const figure = Math.min(140, (width - 2 * space.pad - FIGURE_GAP) / 2);

  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: FIGURE_GAP }}>
        <BodyMap view="front" relative={relative} width={figure} />
        <BodyMap view="back" relative={relative} width={figure} />
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        <Text style={text.label}>FRESH</Text>
        <View
          style={{ flex: 1, flexDirection: 'row', height: 6, borderRadius: 3, overflow: 'hidden' }}
        >
          {SCALE.map((v) => (
            <View key={v} style={{ flex: 1, backgroundColor: heat(v) }} />
          ))}
        </View>
        <Text style={text.label}>NEEDS REST</Text>
      </View>
    </View>
  );
}

const ago = (days: number) => (days <= 0 ? 'TODAY' : `${days}D`);

function nowMs(): number {
  return Date.now();
}
