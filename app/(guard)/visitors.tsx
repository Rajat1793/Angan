// Guard visitors tab: status-filtered list with nested segment tabs.
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Empty, ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { VisitorCard } from '@/components/visitor/VisitorCard';
import { VisitorDetailSheet } from '@/components/visitor/VisitorDetailSheet';
import { useVisitors } from '@/hooks/useVisitors';
import type { Visitor, VisitorStatus } from '@/lib/database.types';
import { markEntry, markExit } from '@/lib/visitors';

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
  const { data, isLoading, isError, refetch } = useVisitors(ALL_STATUSES);
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
    <ScreenScaffold title="Visitors">
      <View className="flex-1">
        {/* Nested status filter tabs. */}
        <View className="border-b border-muted/10">
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerClassName="gap-2 px-4 py-3"
          >
            {SEGMENTS.map((s) => {
              const on = s.key === segment;
              const count = (data ?? []).filter((v) => s.match(v.status)).length;
              return (
                <Pressable
                  key={s.key}
                  onPress={() => setSegment(s.key)}
                  className={`flex-row items-center gap-1.5 rounded-full px-4 py-2 ${
                    on ? 'bg-primary' : 'bg-muted/10'
                  }`}
                >
                  <Text className={`text-sm font-medium ${on ? 'text-background' : 'text-foreground'}`}>
                    {s.label}
                  </Text>
                  <View
                    className={`h-5 min-w-5 items-center justify-center rounded-full px-1 ${
                      on ? 'bg-background/25' : 'bg-muted/20'
                    }`}
                  >
                    <Text className={`text-xs font-bold ${on ? 'text-background' : 'text-foreground/60'}`}>
                      {count}
                    </Text>
                  </View>
                </Pressable>
              );
            })}
          </ScrollView>
        </View>

        {/* Filtered visitor list. */}
        <View className="flex-1">
          {isLoading ? (
            <Loading />
          ) : isError ? (
            <ErrorState onRetry={refetch} />
          ) : filtered.length === 0 ? (
            <Empty title="No visitors" hint="Nothing matches this filter yet." />
          ) : (
            <FlashList
              data={filtered}
              keyExtractor={(v) => v.id}
              contentContainerStyle={{ padding: 16 }}
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

      <VisitorDetailSheet ref={sheetRef} visitor={selected} />
    </ScreenScaffold>
  );
}
