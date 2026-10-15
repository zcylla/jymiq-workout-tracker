import { LinearGradient } from 'expo-linear-gradient';
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
import {
  color,
  radius,
  type RowIndicator,
  type RowLook,
  rowIndicators,
  rowLooks,
  size,
  space,
  text,
  wash,
} from '@/theme';

type Choice = 'HEAD' | keyof typeof rowLooks;
type IndicatorChoice = keyof typeof rowIndicators;

const CHOICES: readonly Choice[] = ['HEAD', 'F1', 'F2', 'F3', 'F4', 'F5'];
const INDICATORS: readonly IndicatorChoice[] = ['S1', 'S2', 'S3', 'S4', 'S5'];
const STRESS_ROWS = Array.from({ length: 30 }, (_, index) => index);
const INCREMENTS = [2.5, 5, 10, 20] as const;

export default function RowsScreen() {
  const [choice, setChoice] = useState<Choice>('F1');
  const [indicatorChoice, setIndicatorChoice] = useState<IndicatorChoice>('S1');
  const [stress, setStress] = useState(false);
  const [trackRpe, setTrackRpe] = useState(true);
  const [pounds, setPounds] = useState(false);
  const [increment, setIncrement] = useState<number>(5);
  const [lastTap, setLastTap] = useState('Hold a row to judge its press feel');
  const look: RowLook | undefined = choice === 'HEAD' ? undefined : rowLooks[choice];
  const indicator: RowIndicator = rowIndicators[indicatorChoice];
  const recipe = { look, indicator };

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
      <ScreenHeader title="Row visibility" kicker="DEV · ROW COMPARISON" />

      <View style={styles.controls}>
        <Text style={text.label}>LOOK</Text>
        <View style={styles.picker}>
          {CHOICES.map((key) => (
            <PickerChoice key={key} selected={choice === key} onPress={() => setChoice(key)}>
              {key === 'HEAD' ? 'Current look (HEAD)' : `${key} · ${rowLooks[key].label}`}
            </PickerChoice>
          ))}
        </View>
        <Text style={text.meta} numberOfLines={1}>
          {choice} · {look?.note ?? 'Shipping RowPlate · unchanged.'}
        </Text>
      </View>
      <View style={styles.controls}>
        <Text style={text.label}>SELECTED INDICATOR</Text>
        <View style={styles.picker}>
          {INDICATORS.map((key) => (
            <PickerChoice
              key={key}
              selected={indicatorChoice === key}
              onPress={() => setIndicatorChoice(key)}
            >
              {key} · {rowIndicators[key].label}
            </PickerChoice>
          ))}
        </View>
        <Text style={text.meta} numberOfLines={1}>
          {look ? `${indicatorChoice} · ${indicator.note}` : 'HEAD · shipping selection unchanged.'}
        </Text>
      </View>
      <View style={styles.stress}>
        <Text style={text.meta}>Stress:</Text>
        {[false, true].map((enabled) => (
          <PickerChoice
            key={String(enabled)}
            compact
            label={enabled ? 'Stress: 30 rows' : 'Stress: off'}
            selected={stress === enabled}
            onPress={() => setStress(enabled)}
          >
            {enabled ? '30 rows' : 'Off'}
          </PickerChoice>
        ))}
      </View>
      <View style={styles.caption}>
        <Text style={text.meta}>BlurViews mounted · 0</Text>
        <Text style={text.meta}>
          {stress ? '30 identical sample rows · scroll to compare' : '6 sample rows + option list'}
        </Text>
      </View>

      <Section first label="SAMPLE" plated={false}>
        <RowPlates tinted>
          {stress ? (
            STRESS_ROWS.map((index) => (
              <SampleRow
                key={index}
                {...recipe}
                onPress={() => setLastTap(`Sample ${index + 1} of 30 pressed`)}
              >
                <ListRow title="Push A" meta="5 exercises · 18 sets · 52 min" />
              </SampleRow>
            ))
          ) : (
            <>
              <SampleRow
                {...recipe}
                onPress={() => {
                  setPounds((value) => !value);
                  setLastTap('Weight unit changed · local preview only');
                }}
              >
                <ListRow quiet title="Weight unit" value={pounds ? 'LB' : 'KG'} />
              </SampleRow>
              <SampleRow
                {...recipe}
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
              <SampleRow {...recipe} onPress={() => setLastTap('Push A pressed')}>
                <ListRow title="Push A" meta="5 exercises · 18 sets · 52 min" />
              </SampleRow>
              <SampleRow
                {...recipe}
                selected
                onPress={() => setLastTap('Push B · selected row pressed')}
              >
                <SelectionContent
                  title="Push B"
                  selected
                  indicator={look ? indicator : undefined}
                />
              </SampleRow>
              <SampleRow disabled {...recipe} onPress={() => setLastTap('Disabled row pressed')}>
                <ListRow quiet title="Cloud backup" value="OFFLINE" />
              </SampleRow>
              <SampleRow
                destructive
                {...recipe}
                onPress={() => setLastTap('Delete preview · nothing deleted')}
              >
                <ListRow quiet danger={look !== undefined} title="Delete routine" chevron={false} />
              </SampleRow>
            </>
          )}
        </RowPlates>
        <Text style={text.meta} accessibilityLiveRegion="polite">
          {lastTap}
        </Text>
      </Section>

      {!stress ? (
        <>
          <Section label="OPTION LIST" plated={false}>
            <Text style={text.h2}>Weight increment</Text>
            <RowPlates tinted>
              {INCREMENTS.map((value) => (
                <SampleRow
                  key={value}
                  {...recipe}
                  selected={value === increment}
                  onPress={() => {
                    setIncrement(value);
                    setLastTap(`${value} LB increment · local preview only`);
                  }}
                >
                  <SelectionContent
                    title={`${value} LB`}
                    selected={value === increment}
                    indicator={look ? indicator : undefined}
                  />
                </SampleRow>
              ))}
            </RowPlates>
          </Section>
          {look ? (
            <Section label="Current look (HEAD)" plated={false}>
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
        </>
      ) : null}
    </Screen>
  );
}

function PickerChoice({
  children,
  selected,
  onPress,
  label,
  compact = false,
}: {
  children: ReactNode;
  selected: boolean;
  onPress: () => void;
  label?: string;
  compact?: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={label}
      accessibilityState={{ selected }}
      style={({ pressed }) => [
        styles.choice,
        compact && styles.stressChoice,
        { backgroundColor: selected ? wash.chip : wash.field, opacity: pressed ? 0.7 : 1 },
      ]}
    >
      <Text style={[text.pill, { color: selected ? color.accent : color.mid }]}>{children}</Text>
    </Pressable>
  );
}

type SampleRowProps = {
  children: ReactNode;
  look?: RowLook;
  indicator: RowIndicator;
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
  indicator,
  onPress,
  selected = false,
  disabled = false,
  destructive = false,
  checked,
}: SampleRowProps & { look: RowLook }) {
  const press = usePressFeel(0.3, disabled);
  const selection = selected && !disabled && !destructive;

  return (
    <AnimatedPressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole={checked === undefined ? 'button' : 'switch'}
      accessibilityState={{ disabled, selected: selection, checked }}
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
      {selection ? (
        <>
          <View pointerEvents="none" style={[styles.rowOverlay, indicator.overlay]} />
          {indicator.rim ? (
            <View pointerEvents="none" style={[styles.rowOverlay, indicator.rim]} />
          ) : null}
          {indicator.bar ? (
            <View pointerEvents="none" style={[styles.rowOverlay, styles.clip]}>
              <View style={[styles.sideBar, indicator.bar]} />
            </View>
          ) : null}
        </>
      ) : null}
      <View style={disabled ? { opacity: look.disabledContentOpacity } : undefined}>
        {children}
      </View>
    </AnimatedPressable>
  );
}

function Material({ look, cornerRadius }: { look: RowLook; cornerRadius: number }) {
  return (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: cornerRadius, borderCurve: 'continuous', overflow: 'hidden' },
      ]}
    >
      {look.sheen ? (
        <LinearGradient
          colors={look.sheen}
          locations={[0, 0.55]}
          start={{ x: 0.5, y: 0 }}
          end={{ x: 0.5, y: 1 }}
          style={StyleSheet.absoluteFill}
        />
      ) : null}
      <View
        style={[
          StyleSheet.absoluteFill,
          { borderRadius: cornerRadius, borderCurve: 'continuous' },
          look.rim,
        ]}
      />
    </View>
  );
}

function SelectionContent({
  title,
  selected,
  indicator,
}: {
  title: string;
  selected: boolean;
  indicator?: RowIndicator;
}) {
  return (
    <View style={styles.selectionContent}>
      <Text
        style={[
          text.rowTitle,
          styles.selectionTitle,
          selected && indicator?.accentTitle && styles.accent,
        ]}
        numberOfLines={1}
      >
        {title}
      </Text>
      {selected ? (
        <View style={styles.selectionMark}>
          <Text style={text.pill}>SELECTED</Text>
          {indicator?.check ? (
            <View accessible={false} style={styles.checkBox}>
              <View style={styles.check} />
            </View>
          ) : null}
        </View>
      ) : null}
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
  clip: { overflow: 'hidden' },
  controls: { gap: space.row, paddingTop: space.within },
  stress: { flexDirection: 'row', alignItems: 'center', gap: space.row, paddingTop: space.within },
  stressChoice: { flexBasis: 'auto', flexGrow: 0 },
  back: {
    minHeight: size.hit,
    minWidth: size.hit,
    alignSelf: 'flex-start',
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.within,
  },
  picker: { flexDirection: 'row', flexWrap: 'wrap', gap: space.row },
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
  rowOverlay: { ...StyleSheet.absoluteFill, borderRadius: radius.row, borderCurve: 'continuous' },
  sideBar: { position: 'absolute', left: 0, top: 0, bottom: 0 },
  group: { padding: 15, borderRadius: radius.plate, borderCurve: 'continuous' },
  selectionContent: {
    minHeight: size.hit,
    paddingVertical: space.row,
    flexDirection: 'row',
    alignItems: 'center',
    gap: space.within,
  },
  selectionTitle: { flex: 1 },
  selectionMark: { flexDirection: 'row', alignItems: 'center', gap: space.within },
  accent: { color: color.accent },
  checkBox: { width: 20, height: 20, alignItems: 'center', justifyContent: 'center' },
  check: {
    width: 7,
    height: 12,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: color.accent,
    transform: [{ rotate: '45deg' }],
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
