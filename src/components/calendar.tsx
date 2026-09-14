import { Pressable, StyleSheet, Text, View } from 'react-native';

import type { IntensityStep, MonthCell, TrainedDay } from '@/lib/calendar';
import { NO_SCHEDULE, type Schedule, isMissed } from '@/lib/program';
import { color, type Ink, radius, text, wash } from '@/theme';

const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** The board's grid gap. Half of it either side of a cell is also its hit slop. */
const GAP = 4;

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
  /** The running program. With nothing running, nothing is missed. */
  schedule?: Schedule;
  onPressDay: (day: TrainedDay) => void;
};

/**
 * lab39.py's `month()`. A day you trained is a target that opens that session;
 * a day you did not is not a target at all, rather than a target that does
 * nothing. Adjacent-month days are dimmed, never omitted — the grid is always
 * whole weeks, and a missing leading cell reads as a bug.
 */
export function Calendar({
  weeks,
  trained,
  todayKey,
  schedule = NO_SCHEDULE,
  onPressDay,
}: CalendarProps) {
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

      {weeks.map((week) => (
        <View key={week[0]?.key} style={{ flexDirection: 'row', gap: GAP }}>
          {/* The cell's position in its week IS the Monday-first weekday index,
              which is what the schedule is keyed by. */}
          {week.map((cell, weekday) => {
            const day = cell.adjacent ? undefined : trained.get(cell.key);
            return (
              <DayCell
                key={cell.key}
                cell={cell}
                day={day}
                today={cell.key === todayKey}
                missed={
                  !cell.adjacent &&
                  isMissed(schedule, cell.key, weekday, day !== undefined, todayKey)
                }
                onPress={onPressDay}
              />
            );
          })}
        </View>
      ))}

      <Key missed={schedule.days.size > 0} />
    </View>
  );
}

function DayCell({
  cell,
  day,
  today,
  missed,
  onPress,
}: {
  cell: MonthCell;
  day: TrainedDay | undefined;
  today: boolean;
  /** A past day the running program had a routine on, and you did not train. */
  missed: boolean;
  onPress: (day: TrainedDay) => void;
}) {
  const face = (
    <View
      style={{
        aspectRatio: 1,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.cell,
        borderCurve: 'continuous',
        // A rest day is a plate; an adjacent day is nothing at all but its
        // numeral; a missed day drops the plate and rings its numeral instead,
        // which is §0's rule and the only way the two stay different things.
        backgroundColor: cell.adjacent || day || missed ? undefined : wash.field,
        opacity: cell.adjacent ? 0.4 : 1,
        // The cell ring means today and only today. Missed rings the numeral —
        // the same device the week strip uses — so one grid never carries two
        // rings that mean different things.
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
      <View
        style={{
          minWidth: 24,
          alignItems: 'center',
          paddingHorizontal: 4,
          paddingVertical: 1,
          borderRadius: radius.pill,
          borderWidth: 1,
          borderColor: missed ? color.tick2 : 'transparent',
        }}
      >
        <Text style={[text.numSm, { color: day ? INK[day.step] : missed ? color.lo : color.dim }]}>
          {cell.day}
        </Text>
      </View>
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

/** The ramp, written out. Three steps is a thing to read, not a thing to learn.
 *  The ring joins it only while a program is running, because that is the only
 *  time a cell can carry one. */
function Key({ missed }: { missed: boolean }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingTop: 7 }}>
      <Text style={text.label}>LIGHT</Text>
      {([1, 2, 3] as const).map((step) => (
        <View
          key={step}
          style={{
            width: 15,
            height: 9,
            borderRadius: radius.pill,
            backgroundColor: color.accent,
            opacity: FILL[step],
          }}
        />
      ))}
      <Text style={text.label}>HARD</Text>
      {missed ? (
        <>
          <View
            style={{
              width: 15,
              height: 11,
              marginLeft: 5,
              borderRadius: radius.pill,
              borderWidth: 1,
              borderColor: color.tick2,
            }}
          />
          <Text style={text.label}>MISSED</Text>
        </>
      ) : null}
    </View>
  );
}
