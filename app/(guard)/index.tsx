// Guard dashboard: overview stats, quick actions, and a recent visitor queue.
import type { BottomSheetModal } from '@gorhom/bottom-sheet';
import { useQueryClient } from '@tanstack/react-query';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useMemo, useRef, useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import {
  Button,
  Empty,
  ErrorState,
  ListRow,
  Loading,
  SectionHeader,
  StatStrip,
  useToast,
} from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { VisitorCard } from '@/components/visitor/VisitorCard';
import { VisitorDetailSheet } from '@/components/visitor/VisitorDetailSheet';
import { useAuth } from '@/hooks/useAuth';
import { useVisitors } from '@/hooks/useVisitors';
import type { Visitor } from '@/lib/database.types';
import { markEntry } from '@/lib/visitors';

export default function GuardDashboard() {
  const { profile } = useAuth();
  // One query drives both the overview counts and the recent queue.
  const { data, isLoading, isError, refetch } = useVisitors([
    'pending',
    'approved',
    'inside',
    'exited',
  ]);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const sheetRef = useRef<BottomSheetModal>(null);
  const [selected, setSelected] = useState<Visitor | null>(null);

  // Close the detail sheet whenever this tab loses focus.
  useFocusEffect(useCallback(() => () => sheetRef.current?.dismiss(), []));

  // Derive headline counts and the pending/approved queue from one dataset.
  const { visitors, entered, exited, queue } = useMemo(() => {
    const all = data ?? [];
    return {
      visitors: all.length,
      entered: all.filter((v) => v.status === 'inside' || v.status === 'exited').length,
      exited: all.filter((v) => v.status === 'exited').length,
      queue: all.filter((v) => v.status === 'pending' || v.status === 'approved'),
    };
  }, [data]);

  const openDetail = (visitor: Visitor) => {
    setSelected(visitor);
    sheetRef.current?.present();
  };

  // Only approved visitors can be marked as entered.
  const enter = async (id: string) => {
    try {
      await markEntry(id);
      queryClient.invalidateQueries({ queryKey: ['visitors'] });
      toast('Marked entry', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  if (isLoading) return <Loading />;
  if (isError) return <ErrorState onRetry={refetch} />;

  return (
    <ScreenScaffold
      title="Guard Dashboard"
      subtitle={`Hi, ${profile?.full_name?.split(' ')[0] ?? 'Guard'} 👋`}
      rightIcon="notifications-outline"
    >
      <ScrollView contentContainerClassName="gap-6 p-5" showsVerticalScrollIndicator={false}>
        <StatStrip
          title="Today's overview"
          stats={[
            { label: 'Visitors', value: String(visitors).padStart(2, '0') },
            { label: 'Entered', value: String(entered).padStart(2, '0') },
            { label: 'Exited', value: String(exited).padStart(2, '0') },
          ]}
        />

        <View className="gap-3">
          <SectionHeader title="Quick actions" />
          <ListRow
            icon="person-add"
            title="Register visitor"
            subtitle="Add a new visitor at the gate"
            onPress={() => router.push('/(guard)/register')}
          />
          <ListRow
            icon="qr-code"
            title="Verify pass"
            subtitle="Scan QR or enter OTP"
            onPress={() => router.push('/(guard)/verify')}
          />
          <ListRow
            icon="people"
            title="Visitors inside"
            subtitle="See who is currently inside"
            badge={entered - exited > 0 ? entered - exited : undefined}
            onPress={() => router.push('/(guard)/visitors')}
          />
          <ListRow
            icon="time"
            title="Entry / exit log"
            subtitle="View visitor history"
            onPress={() => router.push('/(guard)/history')}
          />
        </View>

        <View className="gap-3">
          <SectionHeader title="Recent visitors" />
          {queue.length === 0 ? (
            <Empty title="Queue is clear" hint="Register a visitor to start the flow." />
          ) : (
            queue.map((item) => (
              <VisitorCard key={item.id} visitor={item} onPress={() => openDetail(item)}>
                {item.status === 'approved' ? (
                  <Button label="Mark entry" onPress={() => enter(item.id)} />
                ) : (
                  <Text className="text-xs text-foreground/50">Waiting for resident…</Text>
                )}
              </VisitorCard>
            ))
          )}
        </View>
      </ScrollView>

      <VisitorDetailSheet ref={sheetRef} visitor={selected} />
    </ScreenScaffold>
  );
}
