import { FlashList } from '@shopify/flash-list';
import { useLiveQuery } from 'drizzle-orm/expo-sqlite';
import { router } from 'expo-router';
import { useMemo, useState } from 'react';
import { Pressable, Text, View } from 'react-native';
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
import { exerciseListQuery } from '@/data/queries/exercises';
import type { Equipment } from '@/data/schema';
import { color, space, text } from '@/theme';

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
 */
export default function LibraryScreen() {
  const insets = useSafeAreaInsets();
  const tabBar = useTabBarHeight();
  const [search, setSearch] = useState('');
  const [equipment, setEquipment] = useState<Equipment | null>(null);

  const query = useMemo(() => exerciseListQuery({ search, equipment }), [search, equipment]);
  const { data: rows } = useLiveQuery(query, [search, equipment]);

  return (
    <FlashList
      data={rows ?? []}
      keyExtractor={(item) => item.id}
      contentContainerStyle={{
        paddingHorizontal: space.pad,
        paddingTop: insets.top,
        paddingBottom: space.between + tabBar,
      }}
      ItemSeparatorComponent={() => <View style={{ height: space.row }} />}
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      style={{ backgroundColor: color.ground }}
      ListHeaderComponent={
        <View style={{ gap: space.within, paddingBottom: space.within }}>
          <ScreenHeader
            title="Library"
            kicker="EXERCISES"
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
        <Text style={text.prose}>
          Nothing matches. Clear the filter, or add it as a custom exercise.
        </Text>
      }
      renderItem={({ item }) => (
        <RowPlate onPress={() => router.push(`/exercise/${item.id}`)}>
          <ListRow
            quiet
            art={exerciseStill(item.id)}
            title={item.name}
            meta={`${item.equipment.toUpperCase()} · ${item.kind.toUpperCase()}`}
          />
        </RowPlate>
      )}
    />
  );
}
