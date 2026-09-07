import { Text, View } from 'react-native';

import {
  Chevron,
  Delta,
  Grip,
  Icon,
  type IconName,
  ListRow,
  Meter,
  Pill,
  Plate,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  StatTiles,
} from '@/components';
import { color, space, text } from '@/theme';

/**
 * Every primitive in every state, for comparison against the boards on the
 * device. Dev-only: this is scaffolding for the eye, not a screen.
 */
const NAMES: IconName[] = [
  'today', 'session', 'strength', 'load', 'search',
  'gear', 'back', 'plus', 'cal', 'dots', 'chev', 'up', 'down',
];

export default function KitchenSinkScreen() {
  return (
    <Screen>
      <ScreenHeader title="Kitchen sink" kicker="DEV" right={<Icon name="gear" />} />

      <Section label="ICONS · 22PT · WEIGHT 1.6" plated={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 18 }}>
          {NAMES.map((n) => (
            <View key={n} style={{ alignItems: 'center', gap: 6, width: 62 }}>
              <Icon name={n} />
              <Text style={text.meta}>{n}</Text>
            </View>
          ))}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18, paddingTop: 6 }}>
          <Chevron />
          <Text style={text.meta}>chevron</Text>
          <Grip />
          <Text style={text.meta}>grip</Text>
          <Icon name="today" tone={color.accent} />
          <Icon name="today" tone={color.done} />
          <Icon name="today" tone={color.live} />
          <Icon name="today" tone={color.hi} size={30} />
        </View>
      </Section>

      <Section label="SECTION · PLATED, THE DEFAULT">
        <Text style={text.body}>
          Content on a lit plate, label outside it with a hairline to the right edge.
        </Text>
        <Text style={text.prose}>A second child, 9pt below the first.</Text>
      </Section>

      <Section label="SECTION · PANEL TONE" tone="panel">
        <Text style={text.body}>The darker plate, for a plate sitting on a plate.</Text>
      </Section>

      <Section label="SECTION · NO RULE" rule={false}>
        <Text style={text.body}>Label with no hairline running off it.</Text>
      </Section>

      <Section plated={false}>
        <Text style={text.prose}>
          Unlabelled and unplated: prose gets nothing at all, by rule.
        </Text>
      </Section>

      <Section label="ROW PLATES · 7PT GAP" plated={false}>
        <RowPlates>
          <RowPlate onPress={() => {}}>
            <ListRow title="Pressable row" meta="5 lifts · ~62 min" valueLabel="LAST" value="Tue" />
          </RowPlate>
          <RowPlate onPress={() => {}}>
            <ListRow title="Value with no label" value="102.5 kg" />
          </RowPlate>
          <RowPlate>
            <ListRow title="Never trained" valueLabel="LAST" value="never" valueDim />
          </RowPlate>
          <RowPlate>
            <ListRow quiet title="Quiet title, 15px" meta="2 LIFTS + ACCESSORIES" valueLabel="COPY" />
          </RowPlate>
          <RowPlate>
            <ListRow title="Reorderable" meta="drag me" grip right={<Pill label="TODAY" />} />
          </RowPlate>
          <RowPlate>
            <ListRow title="Out of the program" meta="not in play" dim />
          </RowPlate>
          <RowPlate tone="panel">
            <ListRow title="Panel tone" meta="a plate on a plate" />
          </RowPlate>
        </RowPlates>
      </Section>

      <Section label="READ-ONLY ROWS · 34PT, NO CHEVRON" plated={false}>
        <ListRow readOnly title="Set 1" value="102.5 × 8" />
        <ListRow readOnly title="Set 2" value="102.5 × 8" />
        <ListRow readOnly title="Set 3" value="102.5 × 7" />
      </Section>

      <Section label="STAT TILES · TWO PER ROW" plated={false}>
        <StatTiles
          items={[
            { label: 'SESSIONS', value: '3', visual: <Meter value={3 / 4} width={44} /> },
            { label: 'VOLUME', value: '14.2t', below: <Delta value="8%" /> },
            { label: 'PRS', value: '2', tone: 'accent' },
            { label: 'MISSED', value: '1', tone: 'live', below: <Delta value="1" positive={false} /> },
            { label: 'ODD ONE OUT', value: '—', tone: 'lo' },
          ]}
        />
      </Section>

      <Section label="STAT TILES · THREE ACROSS" plated={false}>
        <StatTiles
          columns={3}
          items={[
            { label: 'EXERCISES', value: '5' },
            { label: 'SETS', value: '20' },
            { label: 'TIME', value: '62m' },
          ]}
        />
      </Section>

      <Section label="DELTA, METER, PILL">
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 18 }}>
          <Delta value="8%" />
          <Delta value="2.5 kg" positive={false} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Meter value={0} />
          <Meter value={0.4} />
          <Meter value={1} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
          <Meter value={0.62} width={44} tone={color.done} />
          <Meter value={0.9} width={44} height={10} tone={color.live} />
        </View>
        <Meter value={0.75} width="full" />
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
          <Pill label="PR" />
          <Pill label="TODAY" tone="done" />
          <Pill label="MISSED" tone="live" />
          <Pill label="WEEK 3 / 8" />
        </View>
      </Section>

      <Section label="PLATE, BARE">
        <Text style={text.prose}>This section is itself a plate.</Text>
      </Section>

      <Section label="NESTED PLATE" plated={false}>
        <Plate>
          <Text style={text.body}>A grouped plate holding a panel-toned plate.</Text>
          <Plate tone="panel" pad={11}>
            <Text style={text.prose}>Two levels is already one too many. Budget is two or three plated things a screen.</Text>
          </Plate>
        </Plate>
      </Section>

      <Section label="THE TEXT RAMP" plated={false}>
        <View style={{ gap: space.within }}>
          <Text style={text.h2}>h2 — 102.5 Barbell Squat</Text>
          <Text style={text.rowTitle}>rowTitle</Text>
          <Text style={text.rowName}>rowName</Text>
          <Text style={text.lead}>lead — a sentence carrying a verdict.</Text>
          <Text style={text.body}>body</Text>
          <Text style={text.prose}>prose</Text>
          <Text style={text.label}>LABEL</Text>
          <Text style={text.meta}>meta · 11px</Text>
          <Text style={text.num}>num 102.5</Text>
          <Text style={text.numSm}>numSm 102.5</Text>
          <Text style={text.numTile}>numTile 102.5</Text>
        </View>
      </Section>
    </Screen>
  );
}
