import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import {
  Calendar,
  ColumnChart,
  Icon,
  ListRow,
  Pill,
  Rail,
  type RailItem,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  useTabBarHeight,
} from '@/components';
import { useRows } from '@/data/live';
import { sessionsInRangeQuery } from '@/data/queries/calendar';
import { loggedSessionIdsQuery } from '@/data/queries/load';
import { recordsQuery } from '@/data/queries/records';
import { sessionsWithRecordsQuery } from '@/data/queries/sessions';
import { useActiveSchedule } from '@/data/schedule';
import { useSettings } from '@/data/settings';
import { monthGrid, trainedDays, weekVolumes } from '@/lib/calendar';
import { dayLabel } from '@/lib/time';
import { formatTonnage, formatTonnageAxis } from '@/lib/volume';
import { color, size, text } from '@/theme';

/**
 * Lab 49 H-A with B2: the month is the period. The pager, the count, the chart,
 * the grid and the list all move together, and there is no other period.
 *
 * Every number waits for its query. `useRows` is null until a query has
 * answered, and an unloaded month is not an empty one — the grid draws bare
 * numerals for a frame (which is what rest looks like) and the count reads a
 * dash, rather than either claiming a month with nothing in it.
 */
export default function HistoryScreen() {
  const tabBar = useTabBarHeight();
  const { weightUnit } = useSettings();

  const now = useMemo(() => nowMs(), []);
  const [back, setBack] = useState(0);
  const grid = useMemo(() => {
    const today = new Date(now);
    return monthGrid(new Date(today.getFullYear(), today.getMonth() - back, 1), now);
  }, [now, back]);

  const active = useActiveSchedule();
  const all = useRows(
    useMemo(() => sessionsInRangeQuery(grid.gridFrom, grid.gridTo), [grid.gridFrom, grid.gridTo]),
    [grid.gridFrom, grid.gridTo],
  );
  const logged = useRows(
    useMemo(() => loggedSessionIdsQuery(), []),
    [],
  );
  const records = useRows(
    useMemo(() => recordsQuery(), []),
    [],
  );

  // The query reaches into the neighbouring months so a week at the edge of the
  // grid totals whole; everything else is the month itself.
  const month = useMemo(
    () =>
      (all ?? [])
        .filter((s) => s.startedAt >= grid.from && s.startedAt < grid.to)
        .sort((a, b) => b.startedAt - a.startedAt),
    [all, grid.from, grid.to],
  );
  const trained = useMemo(() => trainedDays(month), [month]);
  const weeks = useMemo(() => weekVolumes(grid, trainedDays(all ?? [])), [grid, all]);

  const ids = useMemo(() => month.map((s) => s.id), [month]);
  const recorded = useRows(
    useMemo(() => sessionsWithRecordsQuery(ids), [ids]),
    [ids],
  );
  const recordedIds = useMemo(() => new Set((recorded ?? []).map((r) => r.sessionId)), [recorded]);

  const fresh = logged?.length === 0;
  const items: RailItem[] = month.map((s, i) => ({
    tone: i === 0 && back === 0 ? 'accent' : 'tick2',
    body: (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
        <Text style={[text.num, { width: 64 }]}>{dayLabel(s.startedAt)}</Text>
        <Text style={[text.rowName, { flexShrink: 1 }]} numberOfLines={1}>
          {s.name}
        </Text>
        {recordedIds.has(s.id) ? <Pill label="PR" /> : null}
        <View style={{ flex: 1 }} />
        {s.totalVolumeKg != null ? (
          <Text style={text.numSm}>{formatTonnage(s.totalVolumeKg, weightUnit)}</Text>
        ) : null}
      </View>
    ),
    onPress: () => router.push(`/history/${s.id}`),
  }));

  return (
    <Screen bottomInset={tabBar}>
      <ScreenHeader
        title={grid.title}
        kicker={String(grid.year)}
        right={
          <View style={{ flexDirection: 'row' }}>
            <Pager label="Previous month" onPress={() => setBack(back + 1)} />
            <Pager
              label="Next month"
              next
              disabled={back === 0}
              onPress={() => setBack(back - 1)}
            />
          </View>
        }
      />

      <Section first pad={15}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
          <Text
            style={[text.numCore, { color: month.length ? color.hi : color.lo }]}
            accessibilityLabel={all === null ? undefined : `${month.length} sessions`}
          >
            {all === null ? '—' : month.length}
          </Text>
          <View style={{ paddingBottom: 6 }}>
            <Text style={text.label}>SESSIONS</Text>
          </View>
        </View>
        {month.length && weeks.length ? (
          <View style={{ gap: 6, paddingTop: 5 }}>
            <Text style={text.label}>{weightUnit === 'kg' ? 'TONNES / WEEK' : 'LB / WEEK'}</Text>
            <ColumnChart
              values={weeks.map((w) => w.volumeKg)}
              xFirst={weeks[0]?.label ?? ''}
              xLast={weeks[weeks.length - 1]?.label ?? ''}
              value={formatTonnage(weeks[weeks.length - 1]?.volumeKg ?? 0, weightUnit)}
              format={(v) =>
                formatTonnageAxis(v, Math.max(...weeks.map((w) => w.volumeKg)), weightUnit)
              }
              h={58}
            />
          </View>
        ) : null}
      </Section>

      <Section pad={15}>
        <Calendar
          weeks={grid.weeks}
          trained={trained}
          todayKey={grid.todayKey}
          schedule={active?.schedule}
          onPressDay={(day) => router.push(`/history/${day.sessionId}`)}
        />
      </Section>

      {fresh ? (
        <Section label="SESSIONS" plated={false}>
          <RowPlates>
            {active?.program ? null : (
              <RowPlate onPress={() => router.push('/program/new')}>
                <ListRow
                  title="New program"
                  right={<Icon name="plus" tone={color.accent} />}
                  chevron={false}
                />
              </RowPlate>
            )}
            <RowPlate onPress={() => router.push('/sign-in')}>
              <ListRow title="Restore backup" />
            </RowPlate>
          </RowPlates>
        </Section>
      ) : items.length ? (
        <Section label="SESSIONS" plated={false}>
          <Rail items={items} air={24} />
        </Section>
      ) : null}

      {logged === null || fresh ? null : (
        <Section plated={false}>
          <RowPlates>
            <RowPlate onPress={() => router.push('/records')}>
              <ListRow
                title="Records"
                right={
                  records ? (
                    <Text style={[text.num, { marginRight: 10 }]}>{records.length}</Text>
                  ) : undefined
                }
              />
            </RowPlate>
          </RowPlates>
        </Section>
      )}
    </Screen>
  );
}

/** One arrow of the month pager: a 44pt target around a 22pt glyph. */
function Pager({
  label,
  next = false,
  disabled = false,
  onPress,
}: {
  label: string;
  next?: boolean;
  disabled?: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ disabled }}
      style={{
        width: size.hit,
        height: size.hit,
        alignItems: 'center',
        justifyContent: 'center',
        transform: next ? [{ scaleX: -1 }] : undefined,
      }}
    >
      <Icon name="back" tone={disabled ? color.dim : color.mid} />
    </Pressable>
  );
}

function nowMs(): number {
  return Date.now();
}
