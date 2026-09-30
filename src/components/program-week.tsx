import { Text, View } from 'react-native';

import type { ProgramWeekDay } from '@/lib/program';
import { color, radius, text, wash } from '@/theme';

/**
 * Lab 34 A3's seven-day strip — the screen's one plated hero, and the only
 * instrument on it. A program *is* a weekly shape, so drawing the shape is
 * drawing the thing.
 *
 * Seven fixed cells, never scrolled: a week has seven days and all of them fit,
 * which is what separates this from Today's strip (three weeks, scrollable, and
 * therefore carrying dates).
 */
export function ProgramWeek({ days }: { days: readonly ProgramWeekDay<{ name: string }>[] }) {
  return (
    <View style={{ flexDirection: 'row', gap: 2, alignItems: 'stretch' }}>
      {days.map((day) => (
        <DayCell key={day.weekday} day={day} />
      ))}
    </View>
  );
}

/** One word gives its first three letters, more give their initials. */
function code(name: string): string {
  const words = name.trim().split(/\s+/);
  return (
    words.length === 1
      ? words[0].slice(0, 3)
      : words
          .map((w) => w[0])
          .join('')
          .slice(0, 3)
  ).toUpperCase();
}

function DayCell({ day }: { day: ProgramWeekDay<{ name: string }> }) {
  const labelColor =
    day.state === 'done'
      ? color.done
      : day.state === 'today'
        ? color.accent
        : day.state === 'rest'
          ? color.dim
          : color.lo;

  const nameColor = day.state === 'today' ? color.hi : day.state === 'rest' ? color.dim : color.mid;

  return (
    <View
      style={{
        flex: 1,
        minWidth: 0,
        alignItems: 'center',
        gap: 6,
        paddingVertical: 8,
        borderRadius: radius.row,
        borderCurve: 'continuous',
        backgroundColor: day.state === 'today' ? wash.accent : undefined,
        // §0: rest and missed must look different. The ring is the same device
        // the calendar and the week strip use for the same fact.
        borderWidth: 1,
        borderColor: day.state === 'missed' ? color.tick2 : 'transparent',
      }}
    >
      <Text style={[text.meta, { color: labelColor }]}>{day.label}</Text>
      <Text style={[text.label, { color: nameColor, textAlign: 'center' }]} numberOfLines={1}>
        {day.routine ? code(day.routine.name) : '·'}
      </Text>
    </View>
  );
}
