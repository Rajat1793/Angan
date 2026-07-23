// Resident deliveries: parcels held at the gate for my flat.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Text, View } from 'react-native';

import { Badge, Card, Empty, ErrorState, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useRealtime } from '@/hooks/useRealtime';
import { listDeliveries } from '@/lib/deliveries';
import { useAuthStore } from '@/store/auth.store';

export default function ResidentDeliveries() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const deliveries = useQuery({ queryKey: ['deliveries'], queryFn: listDeliveries });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['deliveries'] });
  }, [queryClient]);
  useRealtime('deliveries', profile?.society_id, invalidate);

  // Only my flat's parcels.
  const mine = useMemo(
    () => (deliveries.data ?? []).filter((d) => d.flat_id === profile?.flat_id),
    [deliveries.data, profile?.flat_id],
  );

  if (deliveries.isLoading) return <Loading />;
  if (deliveries.isError) return <ErrorState onRetry={deliveries.refetch} />;

  return (
    <ScreenScaffold title="Deliveries" showBack>
      {mine.length === 0 ? (
        <Empty icon="cube-outline" title="No parcels" hint="Parcels held at the gate will show here." />
      ) : (
        <FlashList
          data={mine}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <Card className="gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">{item.courier}</Text>
                <Badge
                  label={item.status === 'collected' ? 'Collected' : 'At gate'}
                  tone={item.status === 'collected' ? 'neutral' : 'warning'}
                />
              </View>
              {item.description ? (
                <Text className="text-xs text-foreground/60">{item.description}</Text>
              ) : null}
              <Text className="text-xs text-foreground/40">
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </Card>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
