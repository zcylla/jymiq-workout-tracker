import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { color, containment, type Ink, radius, space, text } from '@/theme';

import { glassStyle, useGlass } from './glass';
import { pop } from './haptics';
import { Icon, type IconName } from './icon';
import { AnimatedPressable, usePressFeel } from './press';
import { RestTimer } from './rest-timer';

/** A pop this late is a backgrounded app catching up, not the end of a rest. */
const LATE_MS = 1500;
/** Lab 28's `.body` runs 16pt from the edge, the action bar's margin, not the screen's 22. */
const BLEED = space.pad - 16;
/** The board's air between the three rows, measured off the Lab 48 crop; a short phone gives it to the ring. */
const ROW_GAP = 28;
const ROW_GAP_SHORT = 12;
/** Tall enough for the rest row's 44pt buttons and its line, so swapping it in moves nothing. */
const SLOT = 46;

type Props = {
  /** A short phone: the rows close up. */
  compact?: boolean;
  /** Null when this exercise has no previous session. */
  last: { value: string; delta: { text: string; sign: -1 | 0 | 1 } | null } | null;
  hasNote: boolean;
  onHistory: () => void;
  onStats: () => void;
  onNotes: () => void;
  onSwap: () => void;
  volume: string;
  sets: string;
  e1rm: string;
  restUntil: number | null;
  restLeftSec: number;
  onExtendRest: () => void;
  onSkipRest: () => void;
};

function Destination({
  icon,
  label,
  onPress,
  dot = false,
}: {
  icon: IconName;
  label: string;
  onPress: () => void;
  dot?: boolean;
}) {
  const press = usePressFeel();
  const { recipe } = useGlass('chrome');
  return (
    <AnimatedPressable
      onPress={onPress}
      {...press.handlers}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={[
        containment.rowPlate,
        {
          flex: 1,
          minHeight: 48,
          borderRadius: radius.plate,
          alignItems: 'center',
          justifyContent: 'center',
          gap: 3,
        },
        recipe && glassStyle(recipe, 0),
        press.style,
      ]}
    >
      <Icon name={icon} tone={color.mid} />
      <Text style={[text.meta, { color: color.mid }]}>{label}</Text>
      {dot ? (
        <View
          style={{
            position: 'absolute',
            top: 8,
            right: 10,
            width: 5,
            height: 5,
            borderRadius: radius.full,
            backgroundColor: color.accent,
          }}
        />
      ) : null}
    </AnimatedPressable>
  );
}

function Readout({ label, value, tone = color.mid }: { label: string; value: string; tone?: Ink }) {
  return (
    <View style={{ flex: 1, alignItems: 'center', gap: 3 }}>
      <Text style={[text.label, { color: color.dim }]}>{label}</Text>
      <Text style={[text.num, { color: tone }]}>{value}</Text>
    </View>
  );
}

/**
 * Lab 33 G1's lower half, from Lab 28/29: LAST TIME with this set's delta, the
 * four destinations, and the session readout. A running rest takes the
 * readout's slot rather than a row of its own, so nothing ever sits under the
 * action bar.
 */
export function LiveDeck({
  compact = false,
  last,
  hasNote,
  onHistory,
  onStats,
  onNotes,
  onSwap,
  volume,
  sets,
  e1rm,
  restUntil,
  restLeftSec,
  onExtendRest,
  onSkipRest,
}: Props) {
  // The pop lives here, not in the timer: the timer unmounts on the clock's next
  // tick, which can beat a timeout set for the same instant.
  useEffect(() => {
    if (restUntil == null) return;
    const wait = restUntil - Date.now();
    if (wait <= 0) return;
    const id = setTimeout(() => {
      if (Date.now() - restUntil < LATE_MS) pop();
    }, wait);
    return () => clearTimeout(id);
  }, [restUntil]);

  const deltaTone =
    last?.delta?.sign === 1 ? color.done : last?.delta?.sign === -1 ? color.live : color.lo;

  return (
    <View style={{ marginHorizontal: -BLEED, gap: compact ? ROW_GAP_SHORT : ROW_GAP }}>
      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: space.within,
          paddingHorizontal: 4,
        }}
      >
        <Text style={text.label}>LAST TIME</Text>
        <Text style={[text.num, { color: last ? color.mid : color.dim }]}>
          {last?.value ?? '—'}
        </Text>
        <View style={{ flex: 1 }} />
        {last?.delta ? (
          <Text style={[text.numSm, { color: deltaTone }]}>{last.delta.text}</Text>
        ) : null}
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Destination icon="hist" label="HISTORY" onPress={onHistory} />
        <Destination icon="stat" label="STATS" onPress={onStats} />
        <Destination icon="note" label="NOTES" onPress={onNotes} dot={hasNote} />
        <Destination icon="swap" label="SWAP" onPress={onSwap} />
      </View>

      <View style={{ minHeight: SLOT, flexDirection: 'row', alignItems: 'center' }}>
        {restUntil != null && restLeftSec > 0 ? (
          <RestTimer
            restUntil={restUntil}
            leftSec={restLeftSec}
            onExtend={onExtendRest}
            onSkip={onSkipRest}
          />
        ) : (
          <>
            <Readout label="VOLUME" value={volume} />
            <Readout label="SETS" value={sets} />
            <Readout label="e1RM" value={e1rm} tone={color.accent} />
          </>
        )}
      </View>
    </View>
  );
}
