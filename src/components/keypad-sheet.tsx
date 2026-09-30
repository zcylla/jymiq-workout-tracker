import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useSettings } from '@/data/settings';
import { updateSet } from '@/data/mutations/sessions';
import { resolveKeypadValue } from '@/lib/keypad';
import { REPS_SCALE, RPE_SCALE, type Scale, targetLoadScale } from '@/lib/scale';
import { formatWeight, toKg, type Unit } from '@/lib/units';
import { color, hairline, lh, ls, mono, radius, sans, text, wash } from '@/theme';

import { key, pop } from './haptics';
import type { WorkoutParameter } from './param-selector';
import { Sheet } from './sheet';

type Patch = { weightKg: number } | { reps: number } | { rpe: number };

const CONFIG: Record<
  WorkoutParameter,
  { unit: string; label: string; patch: (v: number) => Patch }
> = {
  load: { unit: 'KG', label: 'LOAD', patch: (v) => ({ weightKg: v }) },
  reps: { unit: 'REPS', label: 'REPS', patch: (v) => ({ reps: v }) },
  rpe: { unit: 'RPE', label: 'RPE', patch: (v) => ({ rpe: v }) },
};

const ROWS = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['.', '0', '⌫'],
];

function wasText(parameter: WorkoutParameter, currentValue: number | null, unit: Unit): string {
  if (currentValue == null) return '—';
  return parameter === 'load' ? formatWeight(currentValue, unit) : String(currentValue);
}

type Props = {
  open: boolean;
  onClose: () => void;
  parameter: WorkoutParameter;
  setId: string;
  currentValue: number | null;
};

/**
 * Long-press on any `ParamSelector` cell opens this — the second route to a
 * value, alongside the ring/tape. Confirm clamps and snaps into the same
 * scale the tape uses, so it can never write something the tape couldn't.
 *
 * The caller keys this on `open`/`parameter` (see `live.tsx`) so a fresh open
 * always remounts with blank entry, rather than resetting state in an effect.
 */
export function KeypadSheet({ open, onClose, parameter, setId, currentValue }: Props) {
  const { weightUnit } = useSettings();
  const config = CONFIG[parameter];
  const scales: Record<WorkoutParameter, Scale> = {
    load: targetLoadScale(weightUnit),
    reps: REPS_SCALE,
    rpe: RPE_SCALE,
  };
  const scale = scales[parameter];
  return (
    <NumberSheet
      open={open}
      onClose={onClose}
      label={config.label}
      unit={parameter === 'load' ? weightUnit.toUpperCase() : config.unit}
      was={wasText(parameter, currentValue, weightUnit)}
      resolve={(entered) => resolveKeypadValue(entered, scale)}
      onConfirm={(value) =>
        updateSet(setId, config.patch(parameter === 'load' ? toKg(value, weightUnit) : value))
      }
    />
  );
}

type NumberSheetProps = {
  open: boolean;
  onClose: () => void;
  label: string;
  unit: string;
  was: string;
  /** What the digits typed so far come to, or null while they come to nothing. */
  resolve: (entered: string) => number | null;
  onConfirm: (value: number) => void;
  /** Given, the value is optional and this puts it back to unset. */
  onClear?: () => void;
};

/** The keypad on its own: the caller says how the digits resolve and where the value goes. */
export function NumberSheet({
  open,
  onClose,
  label,
  unit,
  was,
  resolve,
  onConfirm,
  onClear,
}: NumberSheetProps) {
  const [entered, setEntered] = useState('');

  const resolved = resolve(entered);

  const pressKey = (k: string) => {
    key();
    if (k === '⌫') {
      setEntered((e) => e.slice(0, -1));
      return;
    }
    if (k === '.') {
      setEntered((e) => (e.includes('.') ? e : `${e}.`));
      return;
    }
    setEntered((e) => (e.length >= 6 ? e : e + k));
  };

  const confirm = () => {
    if (resolved == null) return;
    pop();
    onConfirm(resolved);
    onClose();
  };

  return (
    <Sheet open={open} onClose={onClose}>
      <View style={{ gap: 12 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Text style={text.label}>{label}</Text>
          <View style={{ flex: 1 }} />
          <Text style={text.label}>{`WAS ${was}`}</Text>
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 8 }}>
          <Text
            style={{
              ...mono(600),
              fontSize: 42,
              letterSpacing: ls(-0.04, 42),
              color: color.hi,
            }}
          >
            {entered || '0'}
          </Text>
          <Text style={text.label}>{unit}</Text>
          <View style={{ width: 2, height: 34, borderRadius: 1, backgroundColor: color.accent }} />
        </View>

        <View style={{ gap: 8 }}>
          {ROWS.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', gap: 8 }}>
              {row.map((k) => (
                <Pressable
                  key={k}
                  onPress={() => pressKey(k)}
                  style={({ pressed }) => ({
                    flex: 1,
                    minHeight: 46,
                    alignItems: 'center',
                    justifyContent: 'center',
                    borderRadius: radius.row,
                    backgroundColor: wash.field,
                    opacity: pressed ? 0.7 : 1,
                  })}
                >
                  <Text style={{ ...mono(500), fontSize: 20, lineHeight: lh(20), color: color.hi }}>
                    {k}
                  </Text>
                </Pressable>
              ))}
            </View>
          ))}
        </View>

        <View style={{ flexDirection: 'row', gap: 8 }}>
          <Pressable
            onPress={onClose}
            style={({ pressed }) => ({
              flex: 1,
              minHeight: 46,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.row,
              borderCurve: 'continuous',
              backgroundColor: wash.field,
              borderWidth: 1,
              borderColor: hairline.onPlate,
              opacity: pressed ? 0.7 : 1,
            })}
          >
            <Text style={{ ...sans(500), fontSize: 14, color: color.hi }}>Cancel</Text>
          </Pressable>
          {onClear ? (
            <Pressable
              onPress={() => {
                pop();
                onClear();
                onClose();
              }}
              style={({ pressed }) => ({
                flex: 1,
                minHeight: 46,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.row,
                borderCurve: 'continuous',
                backgroundColor: wash.field,
                borderWidth: 1,
                borderColor: hairline.onPlate,
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Text style={{ ...sans(500), fontSize: 14, color: color.hi }}>Clear</Text>
            </Pressable>
          ) : null}
          <Pressable
            onPress={confirm}
            disabled={resolved == null}
            style={({ pressed }) => ({
              flex: 1.6,
              minHeight: 46,
              alignItems: 'center',
              justifyContent: 'center',
              borderRadius: radius.row,
              borderCurve: 'continuous',
              backgroundColor: color.accent,
              opacity: resolved == null ? 0.4 : pressed ? 0.85 : 1,
            })}
          >
            <Text style={{ ...sans(600), fontSize: 15, color: color.ink }}>
              {resolved == null ? `Set ${unit}` : `Set ${resolved} ${unit}`}
            </Text>
          </Pressable>
        </View>
      </View>
    </Sheet>
  );
}
