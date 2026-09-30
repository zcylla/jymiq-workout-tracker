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
  useTabBarHeight,
} from '@/components';
import { exerciseStill } from '@/data/exercise-art';
import { addExerciseToRoutine } from '@/data/mutations/routines';
import { addExerciseToSession, replaceSessionExercise } from '@/data/mutations/sessions';
import { exerciseListQuery } from '@/data/queries/exercises';
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

/**
 * Lab 35 B1. FlashList is the scroller rather than `Screen`: the library is
 * ~1300 rows, and a virtualised list cannot live inside a ScrollView.
 *
 * The board's per-row BEST is a session-derived number, so it is absent until
 * Phase 6 writes sessions — not faked, and not a permanently empty column.
 *
 * It is also the exercise picker. `routineId` adds to a routine, `sessionId` adds to the
 * live session, and `replace` (a session-exercise id) swaps that lift for the tapped one.
 * `tabbed` is false when the picker is pushed over /live, where there is no tab bar.
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

  return (
    <FlashList
      data={rows ?? []}
      keyExtractor={(item) => item.id}
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
          <RowPlate onPress={() => router.push('/exercise/new')}>
            <ListRow title="Add custom exercise" />
          </RowPlate>
        )
      }
      renderItem={({ item }) => (
        <RowPlate
          onPress={() => {
            if (replace) {
              replaceSessionExercise(replace, item.id);
              router.back();
              return;
            }
            if (sessionId) {
              addExerciseToSession(sessionId, item.id);
              router.back();
              return;
            }
            if (routineId) {
              addExerciseToRoutine({ routineId, exerciseId: item.id });
              router.back();
              return;
            }
            router.push(`/exercise/${item.id}`);
          }}
        >
          <ListRow
            quiet
            art={exerciseStill(item.id)}
            title={item.name}
            meta={item.equipment.toUpperCase()}
          />
        </RowPlate>
      )}
    />
  );
}

export default function LibraryScreen() {
  return <ExercisePicker tabbed />;
}
