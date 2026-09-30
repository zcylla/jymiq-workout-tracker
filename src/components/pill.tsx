import { Text, View } from 'react-native';

import type { Readiness } from '@/lib/readiness';
import { color, radius, text, wash } from '@/theme';

const TONE = {
  accent: { fg: color.accent, bg: wash.accent },
  done: { fg: color.done, bg: wash.done },
  live: { fg: color.live, bg: wash.live },
  dim: { fg: color.dim, bg: wash.field },
} as const;

export type PillTone = keyof typeof TONE;

/**
 * The small tinted mono tag: "PR", "TODAY", "WEEK 3 / 8".
 *
 * The outer row is what keeps the tint block the size of its text. `alignSelf`
 * would do it in a column but pins the pill to the top of a row, which is where
 * it usually sits — beside a chevron, which is centred.
 */
export function Pill({ label, tone = 'accent' }: { label: string; tone?: PillTone }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center' }}>
      <View
        style={{
          paddingVertical: 2,
          paddingHorizontal: 7,
          borderRadius: radius.pill,
          backgroundColor: TONE[tone].bg,
        }}
      >
        <Text style={[text.pill, { color: TONE[tone].fg }]}>{label}</Text>
      </View>
    </View>
  );
}

/**
 * There is no orange in the palette, so LIGHT and REST share red and the word
 * carries the difference.
 */
const READINESS_TONE: Record<Readiness, PillTone> = {
  GO: 'done',
  EASY: 'accent',
  LIGHT: 'live',
  REST: 'live',
};

/** `null` is a check-in not taken yet: a dim slot rather than nothing (§0). */
export function ReadinessPill({ step }: { step: Readiness | null }) {
  return step ? <Pill label={step} tone={READINESS_TONE[step]} /> : <Pill label="—" tone="dim" />;
}
