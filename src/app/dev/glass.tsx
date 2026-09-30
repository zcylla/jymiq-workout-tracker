import { router } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import {
  Chip,
  ChipStrip,
  ListRow,
  RowPlate,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  Segmented,
  StatTiles,
} from '@/components';
import { setGlassTrial, useGlassTrial } from '@/data/glass-trial';
import {
  BACKGROUNDS,
  BLUR_LEVELS,
  DEFAULT_TRIAL,
  GLASS_STYLES,
  PRESETS,
  SCOPES,
  type GlassTrial,
} from '@/lib/glass-trial';
import { color, size, space, text } from '@/theme';

const STYLE_OPTIONS = GLASS_STYLES.map((key) => ({ key, label: key.toUpperCase() }));
const BLUR_OPTIONS = BLUR_LEVELS.map((level) => ({ key: String(level), label: String(level) }));

const same = (a: GlassTrial, b: GlassTrial) =>
  a.style === b.style && a.blur === b.blur && a.background === b.background && a.scope === b.scope;

/**
 * The glass lab: every switch here changes the real app and is kept, so the
 * owner can leave and browse the real screens under the same trial.
 */
export default function GlassLabScreen() {
  const trial = useGlassTrial();

  return (
    <Screen>
      <ScreenHeader title="Glass lab" kicker="DEV" onBack={() => router.back()} />

      <Section first label="THIS WEEK" tone="glass" pad={13}>
        <StatTiles
          surface="raised"
          items={[
            { label: 'SESSIONS', value: '3' },
            { label: 'VOLUME', value: '12,400 KG' },
            { label: 'TOP SET', value: '140 KG', tone: 'accent' },
            { label: 'STREAK', value: '6' },
          ]}
        />
      </Section>

      <Section label="ROWS" plated={false}>
        <RowPlates>
          <RowPlate onPress={() => {}}>
            <ListRow title="Push A" meta="5 LIFTS · 18 SETS" />
          </RowPlate>
          <RowPlate onPress={() => {}}>
            <ListRow title="Pull A" meta="4 LIFTS · 15 SETS" />
          </RowPlate>
        </RowPlates>
      </Section>

      <Section label="A CARD">
        <Text style={text.body}>
          A grouped plate that is not a hero — glass under CARDS and ALL.
        </Text>
      </Section>

      <Section label="PRESETS" plated={false}>
        <ChipStrip>
          {PRESETS.map((p) => (
            <Chip
              key={p.label}
              label={p.label.toUpperCase()}
              on={same(p.trial, trial)}
              onPress={() => setGlassTrial(p.trial)}
            />
          ))}
        </ChipStrip>
      </Section>

      <Section label="STYLE" plated={false}>
        <Segmented
          options={STYLE_OPTIONS}
          value={trial.style}
          onChange={(style) => setGlassTrial({ style })}
        />
      </Section>

      <Section label="BLUR" plated={false}>
        <Segmented
          options={BLUR_OPTIONS}
          value={String(trial.blur)}
          onChange={(level) => setGlassTrial({ blur: Number(level) as GlassTrial['blur'] })}
        />
      </Section>

      <Section label="BACKGROUND" plated={false}>
        <ChipStrip>
          {BACKGROUNDS.map((background) => (
            <Chip
              key={background}
              label={background.toUpperCase()}
              on={trial.background === background}
              onPress={() => setGlassTrial({ background })}
            />
          ))}
        </ChipStrip>
      </Section>

      <Section label="SCOPE" plated={false}>
        <ChipStrip>
          {SCOPES.map((scope) => (
            <Chip
              key={scope}
              label={scope.toUpperCase()}
              on={trial.scope === scope}
              onPress={() => setGlassTrial({ scope })}
            />
          ))}
        </ChipStrip>
      </Section>

      <View style={{ paddingTop: space.between }}>
        <Pressable
          onPress={() => setGlassTrial(DEFAULT_TRIAL)}
          accessibilityRole="button"
          style={{ minHeight: size.hit, alignItems: 'center', justifyContent: 'center' }}
        >
          <Text style={[text.label, { color: color.accent }]}>RESET TO TODAY</Text>
        </Pressable>
      </View>
    </Screen>
  );
}
