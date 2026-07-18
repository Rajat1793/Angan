// Guard history tab: exited/denied visitors with a name/phone search filter.
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Text, View } from 'react-native';

import { Empty, ErrorState, Input, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { VisitorCard } from '@/components/visitor/VisitorCard';
import { VisitorDetailSheet } from '@/components/visitor/VisitorDetailSheet';
import { useVisitors } from '@/hooks/useVisitors';
import type { Visitor } from '@/lib/database.types';

export default function GuardHistory() {
  const { data, isLoading, isError, refetch } = useVisitors(['exited', 'denied']);
  const [query, setQuery] = useState('');
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selected, setSelected] = useState<Visitor | null>(null);

  // Close the detail sheet whenever this tab loses focus.
  useFocusEffect(useCallback(() => () => sheetRef.current?.dismiss(), []));

  // Open the detail sheet for a tapped visitor.
  const openDetail = (visitor: Visitor) => {
    setSelected(visitor);
    sheetRef.current?.present();
  };

  // Client-side filter over the fetched page by name or phone.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return data ?? [];
    return (data ?? []).filter(
      (v) => v.name.toLowerCase().includes(q) || (v.phone ?? '').includes(q),
    );
  }, [data, query]);

  return (
    <ScreenScaffold title="History">
      <View className="px-4 pt-3">
        <Input placeholder="Search name or phone" value={query} onChangeText={setQuery} />
      </View>
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : filtered.length === 0 ? (
        <Empty title="No history yet" hint="Past visitors will be listed here." />
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <Text className="h-3" />}
          renderItem={({ item }) => (
            <VisitorCard visitor={item} onPress={() => openDetail(item)} />
          )}
        />
      )}

      <VisitorDetailSheet ref={sheetRef} visitor={selected} />
    </ScreenScaffold>
  );
}
