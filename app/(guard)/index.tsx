// Guard gate: live pending/approved queue (realtime) + Register FAB.
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { Button, Empty, ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { VisitorCard } from '@/components/visitor/VisitorCard';
import { useVisitors } from '@/hooks/useVisitors';
import { markEntry } from '@/lib/visitors';

export default function GuardGate() {
  // Queue shows requests awaiting a decision or approved-but-not-entered.
  const { data, isLoading, isError, refetch } = useVisitors(['pending', 'approved']);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);

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

  return (
    <ScreenScaffold title="Gate">
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <Empty title="Queue is clear" hint="Register a visitor to start the flow." />
      ) : (
        <FlashList
          data={data}
          keyExtractor={(v) => v.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <Text className="h-3" />}
          renderItem={({ item }) => (
            <VisitorCard visitor={item}>
              {item.status === 'approved' ? (
                <Button label="Mark entry" onPress={() => enter(item.id)} />
              ) : (
                <Text className="text-xs text-foreground/50">Waiting for resident…</Text>
              )}
            </VisitorCard>
          )}
        />
      )}

      {/* Floating action button opens the registration route. */}
      <Pressable
        onPress={() => router.push('/(guard)/register')}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
      >
        <Text className="text-2xl font-bold text-background">+</Text>
      </Pressable>

      {/* Secondary action to verify a pre-approved guest pass. */}
      <Pressable
        onPress={() => router.push('/(guard)/verify')}
        className="absolute bottom-6 left-6 h-14 items-center justify-center rounded-full bg-muted/10 px-5"
      >
        <Text className="text-sm font-semibold text-foreground">Verify pass</Text>
      </Pressable>
    </ScreenScaffold>
  );
}
