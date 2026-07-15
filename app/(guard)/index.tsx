// Guard gate: live pending/approved queue (realtime) + Register FAB.
import { FlashList } from '@shopify/flash-list';
import { router } from 'expo-router';
import { Pressable, Text } from 'react-native';

import { Empty, ErrorState, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { VisitorCard } from '@/components/visitor/VisitorCard';
import { useVisitors } from '@/hooks/useVisitors';

export default function GuardGate() {
  // Queue shows requests awaiting a decision or approved-but-not-entered.
  const { data, isLoading, isError, refetch } = useVisitors(['pending', 'approved']);

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
          renderItem={({ item }) => <VisitorCard visitor={item} />}
        />
      )}

      {/* Floating action button opens the registration route. */}
      <Pressable
        onPress={() => router.push('/(guard)/register')}
        className="absolute bottom-6 right-6 h-14 w-14 items-center justify-center rounded-full bg-primary shadow-lg"
      >
        <Text className="text-2xl font-bold text-background">+</Text>
      </Pressable>
    </ScreenScaffold>
  );
}
