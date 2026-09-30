import { useRef } from 'react';
import { Pressable, type ScrollView as RNScrollView, ScrollView, Text, View } from 'react-native';

import type { StripDay } from '@/lib/week';
import { color, radius, size, text, wash } from '@/theme';

import { DayMarkGlyph } from './day-mark';

const CELL_WIDTH = 46;
const BAR_MAX = 26;
const MARK_HEIGHT = 18;

/**
 * lab45 W3 — "the calendar and the graph are one element" — in Lab 49's day-state
 * grammar, with no key. Every cell reserves a bar-height box, so the strip is a
 * bar chart before it is a set of dates.
 */
export function WeekStrip({
  days,
  maxVolumeKg,
  onPressDay,
  bleed,
}: {
  days: readonly StripDay[];
  /** The tallest bar in view. The fill is a RELATIVE scale, not an absolute one. */
  maxVolumeKg: number;
  onPressDay: (day: StripDay) => void;
  /** The padding of whatever holds the strip. It scrolls out to that edge and no
   *  further — past it, cells draw over the plate's own border. */
  bleed: number;
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
      style={{ marginHorizontal: -bleed }}
      contentContainerStyle={{ gap: 5, paddingHorizontal: bleed }}
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
  const { mark, today } = day;
  const letterColor = today ? color.accent : mark === 'missed' ? color.dim : color.lo;
  const dateColor = mark === 'missed' ? color.dim : color.hi;

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
        backgroundColor: today ? wash.chip : undefined,
        boxShadow: today ? `0 0 0 1.5px ${color.accent}` : undefined,
      }}
    >
      <Text style={[text.meta, { color: letterColor }]}>{day.letter}</Text>
      <Text style={[text.numSm, { color: dateColor }]}>{day.date}</Text>
      {/* The mark is the calendar's grammar in one 14pt slot:
          solid bar is trained, dashed is planned, hatched is missed, a stub is rest. */}
      <View style={{ width: 14, height: BAR_MAX, justifyContent: 'flex-end' }}>
        {mark === 'planned' || mark === 'missed' ? (
          <DayMarkGlyph mark={mark} width={14} height={MARK_HEIGHT} corner={3} />
        ) : (
          <View
            style={{
              width: 14,
              height: mark === 'done' ? barHeight : 4,
              borderRadius: mark === 'done' ? 3 : 2,
              backgroundColor: mark === 'done' ? (today ? color.accent : color.done) : wash.track,
            }}
          />
        )}
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
