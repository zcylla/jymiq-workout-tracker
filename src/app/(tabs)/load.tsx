import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Calendar, Screen, ScreenHeader, Section, useTabBarHeight } from '@/components';
import { sessionsInRangeQuery } from '@/data/queries/calendar';
import { useActiveSchedule } from '@/data/schedule';
import { monthGrid, type TrainedDay, trainedDays } from '@/lib/calendar';
import { formatTonnage } from '@/lib/volume';
import { color, hairline, text } from '@/theme';

/**
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

  const openDay = (day: TrainedDay) => router.push(`/history/${day.sessionId}`);

  return (
    <Screen bottomInset={tabBar}>
      <ScreenHeader title={grid.title} kicker="CALENDAR" />

      <Section first>
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
            <Text style={[text.num, { color: color.accent }]}>{formatTonnage(volumeKg)}</Text>
          </View>
        )}
      </Section>
    </Screen>
  );
}
