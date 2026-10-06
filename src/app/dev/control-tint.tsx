import { BlurTargetView } from 'expo-blur';
import { router } from 'expo-router';
import { useContext, useRef, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import {
  Icon,
  type IconName,
  ListRow,
  RowPlates,
  Screen,
  ScreenHeader,
  Section,
  Toggle,
} from '@/components';
import { BlurTargetContext, GlassUnder } from '@/components/glass';
import {
  chromeGlass,
  color,
  controlBlurRecipes,
  type ControlBlurRecipe,
  controlRecipes,
  type ControlRecipe,
  radius,
  size,
  space,
  text,
  wash,
} from '@/theme';

const CURRENT: ControlRecipe = {
  label: 'CURRENT',
  note: 'Opaque chrome tint, sheen, bevel and drop shadow.',
  fill: {
    ...chromeGlass.fill,
    boxShadow: `${chromeGlass.fill.boxShadow}, ${chromeGlass.drop}`,
  },
  pressedOpacity: 0.7,
};

const DESTINATIONS: { icon: IconName; label: string }[] = [
  { icon: 'hist', label: 'HISTORY' },
  { icon: 'stat', label: 'STATS' },
  { icon: 'note', label: 'NOTES' },
  { icon: 'swap', label: 'SWAP' },
];

type BlurChoice = keyof typeof controlBlurRecipes | 'all';

export default function ControlTintScreen() {
  return (
    <Screen>
      <ScreenHeader title="Control tint" kicker="DEV" onBack={() => router.back()} />
      <ControlSample recipe={CURRENT} first />
      {Object.entries(controlRecipes).map(([key, recipe]) => (
        <ControlSample key={key} recipe={recipe} />
      ))}
      <BlurSamples />
    </Screen>
  );
}

function BlurSamples() {
  const target = useContext(BlurTargetContext);
  const [choice, setChoice] = useState<BlurChoice>('flatBlur20');

  return (
    <Section label="WITH BLUR" plated={false}>
      <Text style={text.meta}>
        NOTE · Blur on small controls costs frames: earlier scrolling measured ~7–8% janky frames
        with two blurred cards vs ~2% unblurred. Reserve blur for a few buttons and the tab bar; use
        the unblurred sibling for long row lists.
      </Text>
      {!target ? (
        <Text style={text.meta}>
          {"Blur needs the glass trial's cards scope: apply preset A in /dev/glass"}
        </Text>
      ) : null}
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 6 }}>
          {[
            ...Object.entries(controlBlurRecipes).map(([key, recipe]) => ({
              key: key as BlurChoice,
              label: recipe.label,
            })),
            { key: 'all' as const, label: 'ALL' },
          ].map(({ key, label }) => (
            <Pressable
              key={key}
              accessibilityRole="button"
              accessibilityState={{ selected: choice === key }}
              onPress={() => setChoice(key)}
              style={{
                minWidth: size.hit,
                minHeight: size.hit,
                paddingHorizontal: 14,
                alignItems: 'center',
                justifyContent: 'center',
                borderRadius: radius.chip,
                borderCurve: 'continuous',
                backgroundColor: choice === key ? wash.chip : wash.field,
              }}
            >
              <Text style={[text.pill, { color: choice === key ? color.accent : color.lo }]}>
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
      </ScrollView>
      {Object.entries(controlBlurRecipes)
        .filter(([key]) => choice === 'all' || choice === key)
        .map(([key, recipe], index) => (
          <ControlSample key={key} recipe={recipe} first={index === 0} />
        ))}
    </Section>
  );
}

function ControlSample({
  recipe,
  first = false,
}: {
  recipe: ControlRecipe | ControlBlurRecipe;
  first?: boolean;
}) {
  const [trackRpe, setTrackRpe] = useState(true);
  const fill = 'blur' in recipe ? undefined : recipe.fill;
  const rowStyle = {
    borderRadius: radius.row,
    borderCurve: 'continuous',
    paddingHorizontal: 14,
    minHeight: size.hit,
  } as const;

  return (
    <Section first={first} label={recipe.label} plated={false}>
      <Text style={text.body}>{recipe.note}</Text>

      <View
        style={[
          controlRecipes.cardMatch.fill,
          {
            borderRadius: radius.plate,
            borderCurve: 'continuous',
            padding: 15,
            gap: space.within,
          },
        ]}
      >
        <Text style={text.label}>FROST CARD REFERENCE</Text>
        <Text style={text.body}>Push A · 5 lifts · 18 sets</Text>
      </View>

      <RowPlates>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            rowStyle,
            fill,
            { opacity: pressed ? recipe.pressedOpacity : 1 },
          ]}
        >
          <ControlBlurUnder recipe={recipe} cornerRadius={radius.row} />
          <ListRow quiet title="Check-in" />
        </Pressable>
        <View style={[rowStyle, fill]}>
          <ControlBlurUnder recipe={recipe} cornerRadius={radius.row} />
          <Toggle label="Track RPE" on={trackRpe} onToggle={setTrackRpe} />
        </View>
        <Pressable
          accessibilityRole="button"
          style={({ pressed }) => [
            rowStyle,
            fill,
            { opacity: pressed ? recipe.pressedOpacity : 1 },
          ]}
        >
          <ControlBlurUnder recipe={recipe} cornerRadius={radius.row} />
          <ListRow quiet title="Weight" value="KG" chevron={false} />
        </Pressable>
      </RowPlates>

      <View style={{ flexDirection: 'row', gap: 8 }}>
        {DESTINATIONS.map(({ icon, label }) => (
          <Pressable
            key={label}
            accessibilityRole="button"
            accessibilityLabel={label === 'NOTES' ? 'Notes, pressed preview' : label}
            style={({ pressed }) => [
              {
                flex: 1,
                minHeight: 48,
                borderRadius: radius.plate,
                borderCurve: 'continuous',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 3,
              },
              fill,
              { opacity: pressed || label === 'NOTES' ? recipe.pressedOpacity : 1 },
            ]}
          >
            <ControlBlurUnder recipe={recipe} cornerRadius={radius.plate} />
            <Icon name={icon} tone={color.mid} />
            <Text style={[text.meta, { color: color.mid }]}>{label}</Text>
          </Pressable>
        ))}
      </View>
      <Text style={text.meta}>NOTES SHOWN PRESSED</Text>

      <Pressable
        accessibilityRole="button"
        style={({ pressed }) => [
          {
            minHeight: 48,
            borderRadius: radius.plate,
            borderCurve: 'continuous',
            alignItems: 'center',
            justifyContent: 'center',
          },
          fill,
          { opacity: pressed ? recipe.pressedOpacity : 1 },
        ]}
      >
        <ControlBlurUnder recipe={recipe} cornerRadius={radius.plate} />
        <Text style={[text.pill, { color: color.hi }]}>Secondary action</Text>
      </Pressable>
      {'blur' in recipe ? <BrightBackdropSample recipe={recipe} /> : null}
    </Section>
  );
}

function ControlBlurUnder({
  recipe,
  cornerRadius,
}: {
  recipe: ControlRecipe | ControlBlurRecipe;
  cornerRadius: number;
}) {
  const target = useContext(BlurTargetContext);
  if (!('blur' in recipe)) return null;
  return target ? (
    <GlassUnder
      recipe={{ ...recipe, tile: recipe.fill }}
      blur={recipe.blur}
      target={target}
      radius={cornerRadius}
    />
  ) : (
    <View
      pointerEvents="none"
      style={[
        StyleSheet.absoluteFill,
        { borderRadius: cornerRadius, borderCurve: 'continuous', overflow: 'hidden' },
        recipe.fill,
      ]}
    />
  );
}

function BrightBackdropSample({ recipe }: { recipe: ControlBlurRecipe }) {
  const targetRef = useRef<View>(null);

  return (
    <View style={{ gap: space.within }}>
      <Text style={text.meta}>ON BRIGHT BACKDROP</Text>
      <View
        style={{
          borderRadius: radius.plate,
          borderCurve: 'continuous',
          overflow: 'hidden',
          padding: 15,
        }}
      >
        <BlurTargetView
          ref={targetRef}
          pointerEvents="none"
          style={[StyleSheet.absoluteFill, { backgroundColor: color.ground }]}
        >
          <View
            style={{
              position: 'absolute',
              left: '15%',
              top: 0,
              bottom: 0,
              width: 28,
              backgroundColor: color.accent,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: '20%',
              top: 0,
              bottom: 0,
              width: 36,
              backgroundColor: color.live,
            }}
          />
          <View
            style={{
              position: 'absolute',
              right: 0,
              top: 28,
              width: '50%',
              height: 12,
              backgroundColor: color.done,
            }}
          />
        </BlurTargetView>
        <BlurTargetContext.Provider value={targetRef}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="Check-in on bright backdrop"
            style={({ pressed }) => ({
              minHeight: size.hit,
              borderRadius: radius.row,
              borderCurve: 'continuous',
              paddingHorizontal: 14,
              opacity: pressed ? recipe.pressedOpacity : 1,
            })}
          >
            <ControlBlurUnder recipe={recipe} cornerRadius={radius.row} />
            <ListRow quiet title="Check-in" />
          </Pressable>
        </BlurTargetContext.Provider>
      </View>
    </View>
  );
}
