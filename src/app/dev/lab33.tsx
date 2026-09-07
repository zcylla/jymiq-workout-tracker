import { View } from 'react-native';

import { LoadRing, ParamSelector, Screen, ScreenHeader, Section, Tape } from '@/components';
import { percentOf1RM } from '@/lib/e1rm';
import { LOAD_SCALE, REPS_SCALE, RPE_SCALE } from '@/lib/scale';
import { size } from '@/theme';

const LOAD = 102.5;
const REPS = 8;
const RPE = 8;
const ONE_RM = 130;
const CORE = {
  label: 'LOAD',
  value: String(LOAD),
  subline: `KG · ${percentOf1RM(LOAD, ONE_RM)}% OF 1RM`,
};

function EditState({
  active,
  scale,
  tapeValue,
  unit,
  numerals = false,
  gloss,
}: {
  active: 'load' | 'reps' | 'rpe';
  scale: typeof LOAD_SCALE;
  tapeValue: number;
  unit: string;
  numerals?: boolean;
  gloss?: string;
}) {
  return (
    <View style={{ gap: 8 }}>
      <View style={{ paddingRight: 62, alignItems: 'center' }}>
        <LoadRing
          size={size.ringEdit}
          scale={LOAD_SCALE}
          value={LOAD}
          mark={ONE_RM}
          showNumerals={numerals}
          core={{ ...CORE, editing: true }}
        />
        <View style={{ position: 'absolute', right: 0, top: -6 }}>
          <Tape scale={scale} value={tapeValue} unit={unit} />
        </View>
      </View>
      <ParamSelector
        active={active}
        values={{ load: LOAD, reps: REPS, rpe: RPE }}
        gloss={gloss}
        onSelect={() => {}}
      />
    </View>
  );
}

/** Lab 33's four settled dial states, retained as a device screenshot board. */
export default function Lab33Screen() {
  return (
    <Screen>
      <ScreenHeader title="Lab 33" kicker="DEV" />

      <Section first label="G1 · RESTING" plated={false}>
        <View style={{ alignItems: 'center' }}>
          <LoadRing
            size={size.ringRest}
            scale={LOAD_SCALE}
            value={LOAD}
            mark={ONE_RM}
            showNumerals={false}
            core={{
              ...CORE,
              chips: [
                { value: String(REPS), unit: 'REPS' },
                { value: String(RPE), unit: 'RPE' },
              ],
            }}
          />
        </View>
      </Section>

      <Section label="G2 · EDITING LOAD" plated={false}>
        <EditState active="load" scale={LOAD_SCALE} tapeValue={LOAD} unit="KG" numerals />
      </Section>

      <Section label="G3 · EDITING REPS" plated={false}>
        <EditState active="reps" scale={REPS_SCALE} tapeValue={REPS} unit="REPS" />
      </Section>

      <Section label="G4 · EDITING RPE" plated={false}>
        <EditState active="rpe" scale={RPE_SCALE} tapeValue={RPE} unit="RPE" gloss="RIR 2" />
      </Section>
    </Screen>
  );
}
