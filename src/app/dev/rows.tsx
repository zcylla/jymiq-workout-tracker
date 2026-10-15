import { router } from 'expo-router';
import { type ReactNode, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';

import {
  Icon,
  ListRow,
  Plate,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
} from '@/components';
import { AnimatedPressable, usePressFeel } from '@/components/press';
import { color, radius, type RowLook, rowLooks, size, space, text, wash } from '@/theme';

type Choice = 'HEAD' | keyof typeof rowLooks;

const CHOICES: readonly Choice[] = ['HEAD', 'A', 'B', 'C', 'D', 'E'];

export default function RowsScreen() {
  const [choice, setChoice] = useState<Choice>('A');
  const [trackRpe, setTrackRpe] = useState(true);
  const [pounds, setPounds] = useState(false);
  const [lastTap, setLastTap] = useState('Hold a row to judge its press feel');
  const look: RowLook | undefined = choice === 'HEAD' ? undefined : rowLooks[choice];

  return (
    <Screen>
      <Pressable
        onPress={() => router.back()}
        accessibilityRole="button"
        accessibilityLabel="Back"
        style={({ pressed }) => [styles.back, { opacity: pressed ? 0.7 : 1 }]}
      >
        <Icon name="back" tone={color.mid} />
        <Text style={text.meta}>BACK</Text>
      </Pressable>
      <ScreenHeader title="Row visibility" kicker="DEV · ZERO BLUR" />

      <View style={styles.picker}>
        {CHOICES.map((key) => (
          <Pressable
            key={key}
            onPress={() => setChoice(key)}
            accessibilityRole="button"
            accessibilityState={{ selected: choice === key }}
            style={({ pressed }) => [
              styles.choice,
              { backgroundColor: choice === key ? wash.chip : wash.field },
              { opacity: pressed ? 0.7 : 1 },
            ]}
          >
            <Text style={[text.pill, { color: choice === key ? color.accent : color.mid }]}>
              {key === 'HEAD' ? 'Current look (HEAD)' : `${key} · ${rowLooks[key].label}`}
            </Text>
          </Pressable>
        ))}
      </View>
      <View style={styles.caption}>
        <Text style={text.meta} numberOfLines={1}>
          {look?.note ?? 'Existing tinted RowPlate · unchanged.'}
        </Text>
        <Text style={text.meta}>BlurViews mounted · 0</Text>
      </View>

      <Section
        first
        label={look ? `${choice} · ${look.label}` : 'CURRENT LOOK (HEAD)'}
        plated={false}
      >
        <RowPlates tinted>
          <SampleRow
            look={look}
            onPress={() => {
              setPounds((value) => !value);
              setLastTap('Weight unit changed · local preview only');
            }}
          >
            <ListRow quiet title="Weight unit" value={pounds ? 'LB' : 'KG'} />
          </SampleRow>
          <SampleRow
            look={look}
            checked={trackRpe}
            onPress={() => {
              setTrackRpe((value) => !value);
              setLastTap('Track RPE toggled · local preview only');
            }}
          >
            <ListRow
              quiet
              title="Track RPE"
              chevron={false}
              right={<StaticToggle on={trackRpe} />}
            />
          </SampleRow>
          <SampleRow look={look} onPress={() => setLastTap('Push A pressed')}>
            <ListRow title="Push A" meta="5 exercises · 18 sets · 52 min" />
          </SampleRow>
          <SampleRow
            look={look}
            selected
            onPress={() => setLastTap('Push B · selected row pressed')}
          >
            <ListRow
              title="Push B"
              right={<Text style={[text.pill, { color: color.accent }]}>SELECTED</Text>}
              chevron={false}
            />
          </SampleRow>
          <SampleRow disabled look={look} onPress={() => setLastTap('Disabled row pressed')}>
            <ListRow quiet title="Cloud backup" value="OFFLINE" />
          </SampleRow>
          <SampleRow
            destructive
            look={look}
            onPress={() => setLastTap('Delete preview · nothing deleted')}
          >
            <ListRow quiet danger={look !== undefined} title="Delete routine" chevron={false} />
          </SampleRow>
        </RowPlates>
        <Text style={text.meta} accessibilityLiveRegion="polite">
          {lastTap}
        </Text>
      </Section>

      {look ? (
        <Section label="HEAD REFERENCE" plated={false}>
          <RowPlates tinted>
            <RowPlate onPress={() => setLastTap('HEAD reference pressed')}>
              <ListRow quiet title="Weight unit" value={pounds ? 'LB' : 'KG'} />
            </RowPlate>
          </RowPlates>
        </Section>
      ) : null}

      <Section label="GROUPED PLATE" plated={false}>
        {look ? (
          <View style={[styles.group, look.fill]}>
            <Material look={look} cornerRadius={radius.plate} />
            <GroupContent />
          </View>
        ) : (
          <Plate>
            <GroupContent />
          </Plate>
        )}
      </Section>
    </Screen>
  );
}

type SampleRowProps = {
  children: ReactNode;
  look?: RowLook;
  onPress: () => void;
  selected?: boolean;
  disabled?: boolean;
  destructive?: boolean;
  checked?: boolean;
};

function SampleRow(props: SampleRowProps) {
  if (!props.look) {
    return (
      <RowPlate
        onPress={props.onPress}
        selected={props.selected}
        disabled={props.disabled}
        tone={props.destructive ? 'destructive' : 'raised'}
      >
        {props.children}
      </RowPlate>
    );
  }
  return <RecipeRow {...props} look={props.look} />;
}

function RecipeRow({
  children,
  look,
  onPress,
  selected = false,
  disabled = false,
  destructive = false,
  checked,
}: SampleRowProps & { look: RowLook }) {
  const press = usePressFeel(0.3, disabled);

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={checked === undefined ? 'button' : 'switch'}
      accessibilityState={{ disabled, selected, checked }}
      {...press.handlers}
      style={[
        styles.row,
        look.fill,
        destructive && look.destructive,
        disabled && look.disabled,
        press.style,
      ]}
    >
      {!disabled && !destructive ? <Material look={look} cornerRadius={radius.row} /> : null}
      {selected && !disabled ? (
        <View pointerEvents="none" style={[styles.rowOverlay, look.selected]} />
      ) : null}
      <View style={disabled ? { opacity: look.disabledContentOpacity } : undefined}>
        {children}
      </View>
    </AnimatedPressable>
  );
}

function Material({ look, cornerRadius }: { look: RowLook; cornerRadius: number }) {
  if (!look.material) return null;
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: cornerRadius, borderCurve: 'continuous', overflow: 'hidden' },
      ]}
    >
      {look.material.map((layer, index) => (
        <View key={index} style={[StyleSheet.absoluteFill, layer]} />
      ))}
    </View>
  );
}

function StaticToggle({ on }: { on: boolean }) {
  return (
    <View
      style={[
        styles.track,
        {
          backgroundColor: on ? color.accent : wash.off,
          alignItems: on ? 'flex-end' : 'flex-start',
        },
      ]}
    >
      <View style={[styles.knob, { backgroundColor: on ? color.ink : color.lo }]} />
    </View>
  );
}

function GroupContent() {
  return (
    <View style={{ gap: space.within }}>
      <Text style={text.label}>LAST SESSION · PUSH A</Text>
      <View style={styles.summary}>
        <Text style={text.num}>6,240 kg</Text>
        <Text style={text.meta}>18 sets · 52 min</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  back: {
    minHeight: size.hit,
    minWidth: size.hit,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.within,
  },
  picker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: space.row,
    paddingTop: space.within,
  },
  choice: {
    flexBasis: '47%',
    flexGrow: 1,
    minHeight: size.hit,
    minWidth: size.hit,
    paddingHorizontal: space.within,
    paddingVertical: space.row,
    justifyContent: 'center',
    borderRadius: radius.chip,
    borderCurve: 'continuous',
  },
  caption: { gap: space.row, paddingVertical: space.within },
  row: {
    minHeight: size.hit,
    paddingHorizontal: 14,
    borderRadius: radius.row,
    borderCurve: 'continuous',
  },
  rowOverlay: {
    ...StyleSheet.absoluteFill,
    borderRadius: radius.row,
    borderCurve: 'continuous',
  },
  group: {
    padding: 15,
    borderRadius: radius.plate,
    borderCurve: 'continuous',
  },
  track: { width: 44, height: 26, borderRadius: radius.full, padding: 3 },
  knob: { width: 20, height: 20, borderRadius: radius.full },
  summary: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: space.within,
  },
});
