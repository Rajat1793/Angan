// Guard visitors tab: status-filtered list with nested segment tabs.
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { RefreshControl, Text, View } from 'react-native';

import { Button, Empty, ErrorState, FAB, Loading, Segmented, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { VisitorCard } from '@/components/visitor/VisitorCard';
import { VisitorDetailSheet } from '@/components/visitor/VisitorDetailSheet';
import { useVisitors } from '@/hooks/useVisitors';
import type { Visitor, VisitorStatus } from '@/lib/database.types';
import { markEntry, markExit } from '@/lib/visitors';
import { router } from 'expo-router';
import { ACCENTS } from '@/lib/accents';

// Every status the guard can browse; drives the single underlying query.
const ALL_STATUSES: VisitorStatus[] = ['pending', 'approved', 'inside', 'exited', 'denied'];

// Nested filter tabs shown above the list.
const SEGMENTS: { key: string; label: string; match: (s: VisitorStatus) => boolean }[] = [
  { key: 'all', label: 'All', match: () => true },
  { key: 'pending', label: 'Pending', match: (s) => s === 'pending' },
  { key: 'approved', label: 'Approved', match: (s) => s === 'approved' },
  { key: 'inside', label: 'Inside', match: (s) => s === 'inside' },
  { key: 'exited', label: 'Exited', match: (s) => s === 'exited' },
  { key: 'denied', label: 'Denied', match: (s) => s === 'denied' },
];

export default function GuardVisitors() {
  const { data, isLoading, isError, refetch, isRefetching } = useVisitors(ALL_STATUSES);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selected, setSelected] = useState<Visitor | null>(null);
  const [segment, setSegment] = useState('all');

  // Close the detail sheet whenever this tab loses focus.
  useFocusEffect(useCallback(() => () => sheetRef.current?.dismiss(), []));

  // Open the detail sheet for a tapped visitor.
  const openDetail = (visitor: Visitor) => {
    setSelected(visitor);
    sheetRef.current?.present();
  };

  const active = SEGMENTS.find((s) => s.key === segment) ?? SEGMENTS[0];
  const filtered = useMemo(
    () => (data ?? []).filter((v) => active.match(v.status)),
    [data, active],
  );

  // Approved visitors can be marked entered.
  const enter = async (id: string) => {
    try {
      await markEntry(id);
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast('Marked entry', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  // Inside visitors can be marked exited.
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
    <ScreenScaffold title="Visitors" rightIcon="refresh" onRightPress={() => refetch()}>
      <View className="flex-1">
        {/* Nested status filter tabs. */}
        <View className="border-b border-muted/10">
          <Segmented
            value={segment}
            onChange={setSegment}
            options={SEGMENTS.map((s) => ({
              key: s.key,
              label: s.label,
              count: (data ?? []).filter((v) => s.match(v.status)).length,
            }))}
          />
        </View>

        {/* Filtered visitor list. */}
        <View className="flex-1">
          {isLoading ? (
            <Loading />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <Empty icon="people-outline" title="No visitors" hint="Nothing matches this filter yet." />
          ) : (
            <FlashList
              data={filtered}
              keyExtractor={(v) => v.id}
              contentContainerStyle={{ padding: 16, paddingBottom: 96 }}
              refreshControl={
                <RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor="#3E481D" />
              }
              ItemSeparatorComponent={() => <Text className="h-3" />}
              renderItem={({ item }) => (
                <VisitorCard visitor={item} onPress={() => openDetail(item)}>
                  {item.status === 'approved' ? (
                    <Button label="Mark entry" onPress={() => enter(item.id)} />
                  ) : item.status === 'inside' ? (
                    <Button label="Mark exit" variant="outline" onPress={() => exit(item.id)} />
                  ) : item.status === 'pending' ? (
                    <Text className="text-xs text-foreground/50">Waiting for resident…</Text>
                  ) : null}
                </VisitorCard>
              )}
            />
          )}
        </View>
      </View>

      <FAB
        icon="person-add"
        label="Register"
        color={ACCENTS.blue}
        onPress={() => router.push('/(guard)/register')}
      />

      <VisitorDetailSheet ref={sheetRef} visitor={selected} />
    </ScreenScaffold>
  );
}
