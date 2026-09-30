import { Canvas, DashPathEffect, Group, Path, rect, rrect, Skia } from '@shopify/react-native-skia';
import { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { type IntensityStep, type MonthCell, type TrainedDay } from '@/lib/calendar';
import { type DayMark, dayState } from '@/lib/day-state';
import { NO_SCHEDULE, type Schedule } from '@/lib/program';
import { color, dayMark, type Ink, radius, text } from '@/theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** The board's grid gap. Half of it either side of a cell is also its hit slop. */
const GAP = 4;

const DASH_WIDTH = 1.5;
const DASH = [4, 3];

/** Perpendicular 5pt between hatch lines is 7pt along the cell's edge at 45deg. */
const HATCH_STEP = 7;

/**
 * Three steps and no more, composited against the plate (`color.raised`) rather
 * than the canvas — moving the calendar off its plate means recomputing these
 * (§0 records that as the one open question on this component).
 *
 * Applied as an opacity on an accent fill instead of a pre-mixed colour: the
 * mixing is the point, and `tokens.ts` is the only file allowed a literal.
 */
const FILL: Record<IntensityStep, number> = { 1: 0.16, 2: 0.38, 3: 0.75 };

/**
 * The numeral never wears the accent on a filled cell; it flips to dark ink
 * only at the top step, where the fill is light enough to carry it. Measured on
 * the board: gold at 0.38 lands near 2.4:1 for dark ink, under the floor; at
 * 0.75 it lands near 7:1.
 */
const INK: Record<IntensityStep, Ink> = { 1: color.mid, 2: color.hi, 3: color.ink };

export type CalendarProps = {
  weeks: MonthCell[][];
  /** Keyed by `dayKey`. A day absent from the map was not trained. */
  trained: ReadonlyMap<string, TrainedDay>;
  todayKey: string;
  /** The running program. With nothing running, nothing is planned or missed. */
  schedule?: Schedule;
  onPressDay: (day: TrainedDay) => void;
};

/**
 * lab49.py's `month()`, with no key: solid is trained, dashed is planned,
 * hatched is missed, empty is rest, and the ring is today's alone.
 *
 * A day you trained is a target that opens that session; a day you did not is
 * not a target at all, rather than a target that does nothing. Adjacent-month
 * days are dimmed, never omitted — the grid is always whole weeks, and a
 * missing leading cell reads as a bug.
 *
 * The dashed and hatched cells are one Skia canvas behind the grid, not a
 * border per cell: a dashed border on a rounded View misdraws on Android. The
 * canvas only needs the grid's width, because a cell is (width - 6 gaps) / 7 and
 * square.
 */
export function Calendar({
  weeks,
  trained,
  todayKey,
  schedule = NO_SCHEDULE,
  onPressDay,
}: CalendarProps) {
  const [width, setWidth] = useState(0);
  const cell = (width - 6 * GAP) / 7;

  const rows = weeks.map((week) =>
    week.map((c, weekday) => {
      const day = c.adjacent ? undefined : trained.get(c.key);
      const state = c.adjacent
        ? { mark: 'rest' as DayMark, today: false }
        : dayState(schedule, c.key, weekday, day !== undefined, todayKey);
      return { cell: c, day, ...state };
    }),
  );

  const marks =
    width > 0 ? rows.flatMap((row, r) => row.flatMap((d, c) => markAt(d.mark, r, c, cell))) : [];

  return (
    <View style={{ gap: GAP }}>
      <View style={{ flexDirection: 'row', gap: GAP }}>
        {WEEKDAYS.map((d, i) => (
          // Two Tuesdays and two Saturdays share a letter, so the index is the key.
          <Text key={i} style={[text.label, { flex: 1, textAlign: 'center' }]}>
            {d}
          </Text>
        ))}
      </View>

      <View style={{ gap: GAP }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
        {marks.length ? (
          <Canvas style={[StyleSheet.absoluteFill, { pointerEvents: 'none' }]}>{marks}</Canvas>
        ) : null}
        {rows.map((row) => (
          <View key={row[0]?.cell.key} style={{ flexDirection: 'row', gap: GAP }}>
            {row.map((d) => (
              <DayCell
                key={d.cell.key}
                cell={d.cell}
                day={d.day}
                mark={d.mark}
                today={d.today}
                onPress={onPressDay}
              />
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

/** The canvas element for one cell, or nothing for a mark that is not drawn on it. */
function markAt(mark: DayMark, row: number, col: number, size: number) {
  if (mark !== 'planned' && mark !== 'missed') return [];
  const x = col * (size + GAP);
  const y = row * (size + GAP);
  const key = `${row}-${col}`;

  if (mark === 'planned') {
    // A stroke is centred on its path, so the path sits half a stroke inside the cell.
    const inset = DASH_WIDTH / 2;
    const path = Skia.PathBuilder.Make()
      .addRRect(
        rrect(
          rect(x + inset, y + inset, size - DASH_WIDTH, size - DASH_WIDTH),
          radius.cell - inset,
          radius.cell - inset,
        ),
      )
      .build();
    return [
      <Path key={key} path={path} style="stroke" strokeWidth={DASH_WIDTH} color={dayMark.dash}>
        <DashPathEffect intervals={DASH} />
      </Path>,
    ];
  }

  const lines = Skia.PathBuilder.Make();
  for (let t = -size; t < size; t += HATCH_STEP)
    lines.moveTo(x + t, y + size).lineTo(x + t + size, y);
  return [
    <Group key={key} clip={rrect(rect(x, y, size, size), radius.cell, radius.cell)}>
      <Path path={lines.build()} style="stroke" strokeWidth={1.5} color={dayMark.hatch} />
    </Group>,
  ];
}

function DayCell({
  cell,
  day,
  mark,
  today,
  onPress,
}: {
  cell: MonthCell;
  day: TrainedDay | undefined;
  mark: DayMark;
  today: boolean;
  onPress: (day: TrainedDay) => void;
}) {
  const ink: Ink = day
    ? INK[day.step]
    : today
      ? mark === 'planned'
        ? color.accent
        : color.hi
      : mark === 'planned'
        ? color.mid
        : color.lo;

  const face = (
    <View
      style={{
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.cell,
        borderCurve: 'continuous',
        opacity: cell.adjacent ? 0.4 : 1,
        boxShadow: today ? `0 0 0 1.5px ${color.accent}` : undefined,
      }}
    >
      {day ? (
        <View
          style={[
            StyleSheet.absoluteFill,
            { borderRadius: radius.cell, backgroundColor: color.accent, opacity: FILL[day.step] },
          ]}
        />
      ) : null}
      <Text style={[text.numSm, { color: ink }]}>{cell.day}</Text>
    </View>
  );

  if (!day) return <View style={{ flex: 1 }}>{face}</View>;

  return (
    <Pressable
      // The cell draws at ~43pt on a 402pt phone. It keeps its drawn size and
      // takes the gap as hit slop instead, which puts the target over 44 without
      // two neighbours overlapping.
      hitSlop={GAP / 2}
      onPress={() => onPress(day)}
      accessibilityRole="button"
      accessibilityLabel={`${cell.day}, ${day.count === 1 ? '1 session' : `${day.count} sessions`}`}
      style={({ pressed }) => [{ flex: 1 }, pressed && { opacity: 0.6 }]}
    >
      {face}
    </Pressable>
  );
}
