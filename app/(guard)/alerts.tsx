// Guard alerts tab: live emergency SOS alerts to acknowledge/resolve.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { useCallback } from 'react';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Empty, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useRealtime } from '@/hooks/useRealtime';
import { listSos, resolveSos } from '@/lib/services';
import { useAuthStore } from '@/store/auth.store';

export default function GuardAlerts() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);

  const alerts = useQuery({ queryKey: ['sos'], queryFn: listSos });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['sos'] });
  }, [queryClient]);
  useRealtime('sos_alerts', profile?.society_id, invalidate);

  const resolve = async (id: string) => {
    if (!profile) return;
    try {
      await resolveSos(id, profile.id);
      invalidate();
      toast('Marked resolved', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  if (alerts.isLoading) return <Loading />;

  return (
    <ScreenScaffold title="Alerts" subtitle="Emergency SOS" rightIcon="refresh" onRightPress={() => invalidate()}>
      {(alerts.data ?? []).length === 0 ? (
        <Empty icon="warning-outline" title="No alerts" hint="Emergency SOS alerts will show here." />
      ) : (
        <FlashList
          data={alerts.data ?? []}
          keyExtractor={(a) => a.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <Card className={`gap-2 ${item.status === 'active' ? 'border border-red-500/40' : ''}`}>
              <View className="flex-row items-center justify-between">
                <Text className="flex-1 text-sm font-semibold text-foreground">
                  {item.message || 'Emergency alert'}
                </Text>
                <Badge
                  label={item.status === 'active' ? 'Active' : 'Resolved'}
                  tone={item.status === 'active' ? 'danger' : 'success'}
                />
              </View>
              <Text className="text-xs text-foreground/50">
                {new Date(item.created_at).toLocaleString()}
              </Text>
              {item.status === 'active' ? (
                <Button label="Mark resolved" variant="outline" onPress={() => resolve(item.id)} />
              ) : null}
            </Card>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
