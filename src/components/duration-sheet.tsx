import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { REST_SCALE, snapTo, stepBy } from '@/lib/scale';
import { formatRest } from '@/lib/time';
import { color, hairline, ls, mono, radius, sans, size, text, wash } from '@/theme';

import { Sheet } from './sheet';
import { Tape } from './tape';

const FINE = 15;

type Props = {
  open: boolean;
  title: string;
  value: number | null;
  onConfirm: (sec: number) => void;
  onClose: () => void;
  /** Given, the duration is optional and this puts it back to unset. */
  onClear?: () => void;
};

/**
 * A duration set the way a load is: the tuner tape over `REST_SCALE`, with the
 * mm:ss it lands on read out large. The step buttons are for the last few
 * seconds, which a thumb on a tape overshoots. Nothing is written until Set.
 */
export function DurationSheet({ open, title, value, onConfirm, onClose, onClear }: Props) {
  return (
    <Sheet open={open} onClose={onClose}>
      <Body title={title} value={value} onConfirm={onConfirm} onClose={onClose} onClear={onClear} />
    </Sheet>
  );
}

function Body({ title, value, onConfirm, onClose, onClear }: Omit<Props, 'open'>) {
  const [sec, setSec] = useState(() => snapTo(REST_SCALE, value ?? 90));

  return (
    <View style={{ gap: 12 }}>
      <Text style={text.label}>{title.toUpperCase()}</Text>

      <View style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View style={{ flex: 1, gap: 16 }}>
          <Text
            style={{ ...mono(600), fontSize: 42, letterSpacing: ls(-0.04, 42), color: color.hi }}
          >
            {formatRest(sec)}
          </Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Step
              label={`−${FINE} s`}
              onPress={() => setSec((s) => stepBy(REST_SCALE, s, -FINE))}
            />
            <Step label={`+${FINE} s`} onPress={() => setSec((s) => stepBy(REST_SCALE, s, FINE))} />
          </View>
        </View>
        <Tape scale={REST_SCALE} value={sec} unit="SEC" onDetent={setSec} />
      </View>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Action label="Cancel" onPress={onClose} />
        {onClear ? (
          <Action
            label="Default"
            onPress={() => {
              onClear();
              onClose();
            }}
          />
        ) : null}
        <Action
          label={`Set ${formatRest(sec)}`}
          primary
          onPress={() => {
            onConfirm(sec);
            onClose();
          }}
        />
      </View>
    </View>
  );
}

function Step({ label, onPress }: { label: string; onPress: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      style={({ pressed }) => ({
        flex: 1,
        minHeight: size.hit,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.row,
        borderCurve: 'continuous',
        backgroundColor: wash.field,
        opacity: pressed ? 0.7 : 1,
      })}
    >
      <Text style={{ ...mono(500), fontSize: 14, color: color.hi }}>{label}</Text>
    </Pressable>
  );
}

function Action({
  label,
  onPress,
  primary = false,
}: {
  label: string;
  onPress: () => void;
  primary?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        flex: primary ? 1.6 : 1,
        minHeight: 46,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: radius.row,
        borderCurve: 'continuous',
        backgroundColor: primary ? color.accent : wash.field,
        borderWidth: primary ? 0 : 1,
        borderColor: hairline.onPlate,
        opacity: pressed ? (primary ? 0.85 : 0.7) : 1,
      })}
    >
      <Text
        style={
          primary
            ? { ...sans(600), fontSize: 15, color: color.ink }
            : { ...sans(500), fontSize: 14, color: color.hi }
        }
      >
        {label}
      </Text>
    </Pressable>
  );
}
