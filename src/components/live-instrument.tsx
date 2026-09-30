import { useState } from 'react';
import { Pressable, View } from 'react-native';

import { LOAD_SCALE, REPS_SCALE, RPE_SCALE } from '@/lib/scale';
import { formatWeight } from '@/lib/units';
import { percentOf1RM } from '@/lib/e1rm';
import { size } from '@/theme';

import { LoadRing } from './load-ring';
import { ParamSelector, type WorkoutParameter } from './param-selector';
import { Tape } from './tape';

const TAPE_GUTTER = 62;
/** The selector row under the ring while editing, and the gap above it. */
const SELECTOR = 64;
/** The tape's unit label and its margin, above the rows. */
const TAPE_HEAD = 22;

/** The most tape rows, odd and at most nine, that fit in `height`. */
function tapeRows(height: number) {
  const fit = Math.floor((height - TAPE_HEAD) / size.tapeRow);
  return Math.max(3, Math.min(9, fit % 2 === 0 ? fit - 1 : fit));
}

/** The scale, unit and column each parameter drives. Load never leaves the ring. */
const TAPES = {
  load: { scale: LOAD_SCALE, unit: 'KG' },
  reps: { scale: REPS_SCALE, unit: 'REPS' },
  rpe: { scale: RPE_SCALE, unit: 'RPE' },
} as const;

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
  /** Bumped on every logged set. */
  pulse: number;
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
  pulse,
}: Props) {
  const params: WorkoutParameter[] = showRpe ? ['load', 'reps', 'rpe'] : ['load', 'reps'];
  const rpeText = rpe == null ? '—' : String(rpe);

  // The ring is the load gauge in every state and never re-scales — what you
  // are editing is said by the selector, not by the middle of the dial.
  const core = {
    label: 'LOAD',
    value: formatWeight(load),
    subline: oneRm ? `KG · ${percentOf1RM(load, oneRm)}%` : 'KG',
    editing: editing !== null,
    chips: editing
      ? undefined
      : [
          { value: String(reps), unit: 'REPS' },
          ...(showRpe ? [{ value: rpeText, unit: 'RPE' }] : []),
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
          <Pressable
            onPress={() => onEdit('load')}
            disabled={editing !== null && editing !== 'load'}
            accessibilityRole="button"
            accessibilityLabel="Edit load"
          >
            <LoadRing
              size={ring}
              scale={LOAD_SCALE}
              value={load}
              mark={oneRm}
              // The numerals mean the perimeter is live, which is only true of load.
              showNumerals={editing === 'load'}
              core={core}
              pulse={pulse}
            />
          </Pressable>
          {editing ? (
            <View style={{ position: 'absolute', right: 0, top: -6 }}>
              <Tape
                key={editing}
                scale={TAPES[editing].scale}
                value={editing === 'load' ? load : editing === 'reps' ? reps : (rpe ?? 5)}
                unit={TAPES[editing].unit}
                onDetent={onDetent}
                rows={tapeRows(ring + 6)}
              />
            </View>
          ) : null}
        </View>
      ) : null}

      {editing ? (
        <ParamSelector
          active={editing}
          parameters={params}
          values={{ load: formatWeight(load), reps: String(reps), rpe: rpeText }}
          onSelect={onSelect}
          onLongPress={onLongPress}
        />
      ) : null}
    </View>
  );
}
