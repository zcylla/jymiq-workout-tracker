import { useState } from 'react';
import { Pressable, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { useSharedValue } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

import { useSettings } from '@/data/settings';
import { loadScale, REPS_SCALE, RPE_SCALE } from '@/lib/scale';
import { formatWeight, toDisplay, toKg } from '@/lib/units';
import { percentOf1RM } from '@/lib/e1rm';
import { size } from '@/theme';
import { disabledControl } from '@/theme/tokens';

import { gestureStart } from './haptics';
import { LoadRing } from './load-ring';
import { ParamSelector, type WorkoutParameter } from './param-selector';
import { Tape } from './tape';

const TAPE_GUTTER = 62;
/** The selector row under the ring while editing, and the gap above it. */
const SELECTOR = 64;
/** The tape's unit label and its margin, above the rows. */
const TAPE_HEAD = 22;
/** The exercise ladder's hold: press this long, then slide to scrub the held number. */
const HOLD_MS = 350;

/** The most tape rows, odd and at most nine, that fit in `height`. */
function tapeRows(height: number) {
  const fit = Math.floor((height - TAPE_HEAD) / size.tapeRow);
  return Math.max(3, Math.min(9, fit % 2 === 0 ? fit - 1 : fit));
}

type Props = {
  editing: WorkoutParameter | null;
  load: number;
  reps: number;
  rpe: number | null;
  oneRm: number | null;
  showRpe: boolean;
  onEdit: (parameter: WorkoutParameter) => void;
  onDetent: (value: number) => void;
  onSelect: (parameter: WorkoutParameter) => void;
  onLongPress: (parameter: WorkoutParameter) => void;
  onType: (parameter: WorkoutParameter) => void;
};

export function LiveInstrument({
  editing,
  load,
  reps,
  rpe,
  oneRm,
  showRpe,
  onEdit,
  onDetent,
  onSelect,
  onLongPress,
  onType,
}: Props) {
  const { weightIncrementKg, weightUnit } = useSettings();
  const unitLabel = weightUnit.toUpperCase();
  const displayLoad = toDisplay(load, weightUnit);
  const units = { load: unitLabel, reps: 'REPS', rpe: 'RPE' };
  const scales = {
    load: loadScale(weightIncrementKg, weightUnit),
    reps: REPS_SCALE,
    rpe: RPE_SCALE,
  };
  const params: WorkoutParameter[] = showRpe ? ['load', 'reps', 'rpe'] : ['load', 'reps'];
  const rpeText = rpe == null ? '—' : String(rpe);

  /** The held finger's vertical travel while scrubbing; the open tape follows it. */
  const scrubSV = useSharedValue<number | null>(null);
  const [scrubbing, setScrubbing] = useState<WorkoutParameter | null>(null);
  // A held chip stays mounted (and lit) until release, or its gesture would unmount under the finger.
  const holdingChip = scrubbing === 'reps' || scrubbing === 'rpe';
  const ringOff = editing !== null && editing !== 'load' && !holdingChip;

  const beginScrub = (parameter: WorkoutParameter) => {
    gestureStart();
    setScrubbing(parameter);
    if (editing !== parameter) onEdit(parameter);
  };
  const scrub = (parameter: WorkoutParameter) =>
    Gesture.Pan()
      .activateAfterLongPress(HOLD_MS)
      .maxPointers(1)
      .shouldCancelWhenOutside(false)
      .onStart(() => {
        scrubSV.set(0);
        scheduleOnRN(beginScrub, parameter);
      })
      .onUpdate((event) => {
        scrubSV.set(event.translationY);
      })
      .onFinalize(() => {
        if (scrubSV.get() == null) return;
        scrubSV.set(null);
        scheduleOnRN(setScrubbing, null);
      });
  const repsScrub = scrub('reps');
  const rpeScrub = scrub('rpe');
  const loadScrub = scrub('load')
    .enabled(!ringOff)
    .requireExternalGestureToFail(repsScrub, rpeScrub);

  // The ring is the load gauge in every state and never re-scales — what you
  // are editing is said by the selector, not by the middle of the dial.
  const core = {
    label: 'LOAD',
    value: formatWeight(load, weightUnit),
    subline: oneRm ? `${unitLabel} · ${percentOf1RM(load, oneRm)}%` : unitLabel,
    editing: editing !== null,
    chips:
      editing && !holdingChip
        ? undefined
        : [
            {
              value: String(reps),
              unit: 'REPS',
              onPress: () => onEdit('reps'),
              gesture: repsScrub,
            },
            ...(showRpe
              ? [{ value: rpeText, unit: 'RPE', onPress: () => onEdit('rpe'), gesture: rpeScrub }]
              : []),
          ],
  };

  // The ring takes what the screen leaves it: its drawn size where there is
  // room, less on a short phone, so the deck below never gets pushed under the bar.
  const [box, setBox] = useState({ w: 0, h: 0 });
  const room = box.h - (editing ? SELECTOR : 0);
  const ring = Math.max(
    0,
    Math.floor(
      Math.min(editing ? size.ringEdit : size.ringRest, room, box.w - (editing ? TAPE_GUTTER : 0)),
    ),
  );

  return (
    <View
      style={{ flex: 1, justifyContent: 'center', gap: 8 }}
      onLayout={(e) => setBox({ w: e.nativeEvent.layout.width, h: e.nativeEvent.layout.height })}
    >
      {ring > 0 ? (
        <View style={{ paddingRight: editing ? TAPE_GUTTER : 0, alignItems: 'center' }}>
          <GestureDetector gesture={loadScrub}>
            <Pressable
              onPress={() => onEdit('load')}
              disabled={ringOff}
              accessibilityRole="button"
              accessibilityLabel="Edit load"
              accessibilityState={{ disabled: ringOff }}
              style={{ opacity: ringOff ? disabledControl.contentOpacity : 1 }}
            >
              <LoadRing
                size={ring}
                scale={scales.load}
                value={displayLoad}
                mark={oneRm == null ? null : toDisplay(oneRm, weightUnit)}
                // The numerals mean the perimeter is live, which is only true of load.
                showNumerals={editing === 'load'}
                core={core}
              />
            </Pressable>
          </GestureDetector>
          {editing ? (
            <View style={{ position: 'absolute', right: 0, top: -6 }}>
              <Tape
                key={`${editing}-${weightUnit}`}
                scale={scales[editing]}
                value={editing === 'load' ? displayLoad : editing === 'reps' ? reps : (rpe ?? 5)}
                unit={units[editing]}
                onDetent={(value) => onDetent(editing === 'load' ? toKg(value, weightUnit) : value)}
                rows={tapeRows(ring + 6)}
                scrubSV={scrubSV}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {editing ? (
        <ParamSelector
          active={editing}
          weightUnit={weightUnit}
          parameters={params}
          values={{ load: formatWeight(load, weightUnit), reps: String(reps), rpe: rpeText }}
          onSelect={onSelect}
          onLongPress={onLongPress}
          onType={onType}
        />
      ) : null}
    </View>
  );
}
