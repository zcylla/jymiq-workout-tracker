import { useRef } from 'react';
import { Pressable, type ScrollView as RNScrollView, ScrollView, Text, View } from 'react-native';

import type { StripDay } from '@/lib/week';
import { color, radius, size, space, text, wash } from '@/theme';

const CELL_WIDTH = 46;
const BAR_MAX = 26;

/**
 * lab45 W3 — "the calendar and the graph are one element". Every cell reserves
 * a bar-height box, filled or stubbed, so the strip is a bar chart before it is
 * a set of dates.
 */
export function WeekStrip({
  days,
  maxVolumeKg,
  onPressDay,
}: {
  days: readonly StripDay[];
  /** The tallest bar in view. The fill is a RELATIVE scale, not an absolute one. */
  maxVolumeKg: number;
  onPressDay: (day: StripDay) => void;
}) {
  const scroll = useRef<RNScrollView>(null);

  return (
    <ScrollView
      ref={scroll}
      horizontal
      showsHorizontalScrollIndicator={false}
      // The strip ends on this week's Sunday, so the right-hand end always has
      // today in view — six cells at most, inside a 411pt screen. That makes
      // "scroll to the end" the whole of the scroll-to-today logic.
      onContentSizeChange={() => scroll.current?.scrollToEnd({ animated: false })}
      style={{ marginHorizontal: -space.pad }}
      contentContainerStyle={{ gap: 5, paddingHorizontal: space.pad }}
    >
      {days.map((day) => (
        <DayCell key={day.key} day={day} maxVolumeKg={maxVolumeKg} onPress={onPressDay} />
      ))}
    </ScrollView>
  );
}

function DayCell({
  day,
  maxVolumeKg,
  onPress,
}: {
  day: StripDay;
  maxVolumeKg: number;
  onPress: (day: StripDay) => void;
}) {
  const letterColor =
    day.state === 'today' ? color.accent : day.state === 'done' ? color.lo : color.dim;
  const dateColor =
    day.state === 'today' || day.state === 'done'
      ? color.hi
      : day.state === 'rest'
        ? color.lo
        : color.dim;

  const barColor =
    day.volumeKg > 0 ? (day.state === 'today' ? color.accent : color.done) : wash.track;
  const barHeight =
    day.volumeKg > 0 && maxVolumeKg > 0
      ? Math.max(4, Math.round(BAR_MAX * (day.volumeKg / maxVolumeKg)))
      : 4;

  const content = (
    <View
      style={{
        flex: 0,
        width: CELL_WIDTH,
        minHeight: size.hit,
        alignItems: 'center',
        gap: 6,
        paddingVertical: 7,
        borderRadius: radius.row,
        backgroundColor: day.state === 'today' ? wash.chip : undefined,
      }}
    >
      <Text style={[text.meta, { color: letterColor }]}>{day.letter}</Text>
      <Text style={[text.numSm, { color: dateColor }]}>{day.date}</Text>
      <View style={{ width: 14, height: BAR_MAX, justifyContent: 'flex-end' }}>
        <View
          style={{
            width: 14,
            height: barHeight,
            borderRadius: day.volumeKg > 0 ? 3 : 2,
            backgroundColor: barColor,
          }}
        />
      </View>
    </View>
  );

  if (day.sessionId === null) return content;

  return (
    <Pressable onPress={() => onPress(day)} accessibilityRole="button">
      {content}
    </Pressable>
  );
}
