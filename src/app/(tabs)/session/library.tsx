import { FlashList } from '@shopify/flash-list';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import {
  Chip,
  ChipStrip,
  Icon,
  ListRow,
  RowPlate,
  ScreenHeader,
  SearchField,
  Section,
  useTabBarHeight,
} from '@/components';
import { exerciseStillFor } from '@/data/exercise-image';
import { addExerciseToRoutine } from '@/data/mutations/routines';
import { addExerciseToSession, replaceSessionExercise } from '@/data/mutations/sessions';
import { exerciseListQuery, recentExercisesQuery } from '@/data/queries/exercises';
import type { Equipment } from '@/data/schema';
import { color, space } from '@/theme';

const FILTERS: { label: string; value: Equipment | null }[] = [
  { label: 'ALL', value: null },
  { label: 'BARBELL', value: 'barbell' },
  { label: 'DUMBBELL', value: 'dumbbell' },
  { label: 'MACHINE', value: 'machine' },
  { label: 'CABLE', value: 'cable' },
  { label: 'BODYWEIGHT', value: 'bodyweight' },
];

type Row = Awaited<ReturnType<typeof exerciseListQuery>>[number];
type Item = { key: string; label: string } | { key: string; row: Row };

const LABEL_GAP = space.within - space.row;

/**
 * Lab 35 B1. FlashList is the scroller rather than `Screen`: the library is
 * ~1300 rows, and a virtualised list cannot live inside a ScrollView.
 *
 * The board's per-row BEST is a session-derived number, so it is absent until
 * Phase 6 writes sessions — not faked, and not a permanently empty column.
 *
 * It is also the exercise picker. `routineId` adds to a routine, `sessionId` adds to the
 * live session, and `replace` (a session-exercise id) swaps that lift for the tapped one.
 * The lifts you last performed open the list as RECENT, in picker mode too, until a search
 * or a filter narrows it. `tabbed` is false when the picker is pushed over /live, where there is no tab bar.
 */
export function ExercisePicker({ tabbed }: { tabbed: boolean }) {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBarHeight();
  const { routineId, sessionId, replace } = useLocalSearchParams<{
    routineId?: string;
    sessionId?: string;
    replace?: string;
  }>();
  const picking = Boolean(routineId || sessionId || replace);
  const [search, setSearch] = useState('');
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  const query = useMemo(() => exerciseListQuery({ search, equipment }), [search, equipment]);
  const { data: rows, updatedAt } = useLiveQuery(query, [search, equipment]);
  const { data: recentRows } = useLiveQuery(
    useMemo(() => recentExercisesQuery(), []),
    [],
  );

  const items = useMemo<Item[]>(() => {
    const all = (rows ?? []).map((row) => ({ key: row.id, row }));
    if (search.trim() || equipment || !recentRows?.length) return all;
    return [
      { key: 'label:recent', label: 'RECENT' },
      ...recentRows.map((row) => ({ key: `recent:${row.id}`, row })),
      { key: 'label:all', label: 'ALL' },
      ...all,
    ];
  }, [rows, recentRows, search, equipment]);

  return (
    <FlashList
      data={items}
      keyExtractor={(item) => item.key}
      getItemType={(item) => ('row' in item ? 'row' : 'label')}
      contentContainerStyle={{
        paddingHorizontal: space.pad,
        paddingTop: insets.top,
        paddingBottom: space.between + (tabbed ? tabBar : insets.bottom),
      }}
      ItemSeparatorComponent={() => <View style={{ height: space.row }} />}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: color.ground }}
      ListHeaderComponent={
        <View style={{ gap: space.within, paddingBottom: space.within }}>
          <ScreenHeader
            title={replace ? 'Replace exercise' : picking ? 'Add exercise' : 'Library'}
            onBack={() => router.back()}
            right={
              <Pressable onPress={() => router.push('/exercise/new')} hitSlop={12}>
                <Icon name="plus" />
              </Pressable>
            }
          />
          <SearchField
            placeholder={`Search ${rows?.length ?? 0} exercises`}
            value={search}
            onChangeText={setSearch}
          />
          <ChipStrip>
            {FILTERS.map((f) => (
              <Chip
                key={f.label}
                label={f.label}
                on={equipment === f.value}
                onPress={() => setEquipment(f.value)}
              />
            ))}
          </ChipStrip>
        </View>
      }
      ListEmptyComponent={
        updatedAt === undefined ? null : (
          <RowPlate tinted onPress={() => router.push('/exercise/new')}>
            <ListRow title="Add custom exercise" />
          </RowPlate>
        )
      }
      renderItem={({ item }) =>
        'label' in item ? (
          <View style={{ paddingBottom: LABEL_GAP }}>
            <Section label={item.label} plated={false} first={item.key === 'label:recent'}>
              {null}
            </Section>
          </View>
        ) : (
          <RowPlate
            tinted
            onPress={() => {
              if (replace) {
                replaceSessionExercise(replace, item.row.id);
                router.back();
                return;
              }
              if (sessionId) {
                addExerciseToSession(sessionId, item.row.id);
                router.back();
                return;
              }
              if (routineId) {
                addExerciseToRoutine({ routineId, exerciseId: item.row.id });
                router.back();
                return;
              }
              router.push(`/exercise/${item.row.id}`);
            }}
          >
            <ListRow
              quiet
              art={exerciseStillFor(item.row.id, item.row.name)}
              title={item.row.name}
              meta={item.row.equipment.toUpperCase()}
            />
          </RowPlate>
        )
      }
    />
  );
}

export default function LibraryScreen() {
  return <ExercisePicker tabbed />;
}
