import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo } from 'react';
import { Text, View } from 'react-native';

import { Calendar, Screen, ScreenHeader, Section, useTabBarHeight } from '@/components';
import { sessionsInRangeQuery } from '@/data/queries/calendar';
import { monthGrid, type TrainedDay, trainedDays } from '@/lib/calendar';
import { formatTonnage } from '@/lib/volume';
import { color, hairline, text } from '@/theme';

/**
 * Lab 39 Q2 — the calendar, and so far the whole Load tab. §0's IA gives Load
 * "volume, deload, bodyweight, calendar", but no board draws the tab root, and
 * the calendar is the only one of the four with both data and a board today.
 *
 * One departure from §0, forced by the schema: **there is no missed state.**
 * The board draws rest and missed differently — rest a plate, missed a ring
 * under the number — and that distinction is right, but it needs to know which
 * days you were *supposed* to train. Programs (Lab 34 A3/A4) are boarded and
 * unbuilt, and nothing in `src/data/schema.ts` stores a plan-by-weekday, so
 * every untrained day is drawn as rest. Inventing a schedule to colour a cell
 * would be the app asserting a lapse it cannot know about. What unblocks it: a
 * program table that resolves a weekday (or a cycle position) to a routine, at
 * which point a past day with a scheduled routine and no session is missed and
 * takes the ring.
 */
export default function LoadScreen() {
  const tabBar = useTabBarHeight();

  // One month, computed once: the grid, the query range and the title all come
  // out of the same call, so they cannot disagree about which month this is.
  const grid = useMemo(() => monthGrid(), []);

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
