// Guard visitors-inside tab: realtime list with a Mark Exit action.
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useRef, useState } from 'react';
import { Text } from 'react-native';

import { Button, Empty, ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { VisitorCard } from '@/components/visitor/VisitorCard';
import { VisitorDetailSheet } from '@/components/visitor/VisitorDetailSheet';
import { useVisitors } from '@/hooks/useVisitors';
import type { Visitor } from '@/lib/database.types';
import { markExit } from '@/lib/visitors';

export default function GuardVisitors() {
  const { data, isLoading, isError, refetch } = useVisitors(['inside']);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selected, setSelected] = useState<Visitor | null>(null);

  // Close the detail sheet whenever this tab loses focus.
  useFocusEffect(useCallback(() => () => sheetRef.current?.dismiss(), []));

  // Open the detail sheet for a tapped visitor.
  const openDetail = (visitor: Visitor) => {
    setSelected(visitor);
    sheetRef.current?.present();
  };

  // Mark exit stamps exit time and moves the visitor to history.
  const exit = async (id: string) => {
    try {
      await markExit(id);
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast('Marked exit', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  return (
    <ScreenScaffold title="Inside">
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <Empty title="No visitors inside" hint="Marked entries will appear here." />
      ) : (
        <FlashList
          data={data}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <Text className="h-3" />}
          renderItem={({ item }) => (
            <VisitorCard visitor={item} onPress={() => openDetail(item)}>
              <Button label="Mark exit" variant="outline" onPress={() => exit(item.id)} />
            </VisitorCard>
          )}
        />
      )}

      <VisitorDetailSheet ref={sheetRef} visitor={selected} />
    </ScreenScaffold>
  );
}
