import { Icon, ListRow, RowPlate, RowPlates, Screen, ScreenHeader, Section } from '@/components';

/**
 * Lab 34 A1, rebuilt from the primitives alone. This file is the proof that the
 * component set can carry a real screen: it holds data and composition and not
 * one style.
 *
 * Rows are not pressable yet — there is nowhere to push to until Phase 5.
 */
const IN_PROGRAM = [
  { name: 'Lower A', meta: '5 lifts · ~62 min', last: 'Tue' },
  { name: 'Upper A', meta: '6 lifts · ~58 min', last: 'Mon' },
  { name: 'Lower B', meta: '5 lifts · ~60 min', last: 'Fri' },
  { name: 'Upper B', meta: '6 lifts · ~55 min', last: 'Thu' },
];

const STANDALONE = [{ name: 'Deload Full Body', meta: '4 lifts · ~35 min', last: '12 Aug' }];

const TEMPLATES = [
  { name: 'Starting Strength', meta: '3 LIFTS · LINEAR' },
  { name: '5/3/1 Boring But Big', meta: '2 LIFTS + ACCESSORIES' },
];

export default function Lab34A1Screen() {
  return (
    <Screen>
      <ScreenHeader title="Routines" kicker="PLAN" right={<Icon name="search" />} />

      <Section label="IN PROGRAM · PPL 6-DAY" plated={false}>
        <RowPlates>
          {IN_PROGRAM.map((r) => (
            <RowPlate key={r.name}>
              <ListRow title={r.name} meta={r.meta} valueLabel="LAST" value={r.last} />
            </RowPlate>
          ))}
        </RowPlates>
      </Section>

      <Section label="STANDALONE" plated={false}>
        <RowPlates>
          {STANDALONE.map((r) => (
            <RowPlate key={r.name}>
              <ListRow title={r.name} meta={r.meta} valueLabel="LAST" value={r.last} />
            </RowPlate>
          ))}
        </RowPlates>
      </Section>

      <Section label="START FROM A TEMPLATE" plated={false}>
        <RowPlates>
          {TEMPLATES.map((t) => (
            <RowPlate key={t.name}>
              <ListRow quiet title={t.name} meta={t.meta} valueLabel="COPY" />
            </RowPlate>
          ))}
        </RowPlates>
      </Section>
    </Screen>
  );
}
