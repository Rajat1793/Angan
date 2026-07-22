// Admin move requests: approve or reject resident move-in/out requests.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Empty, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { listMoveRequests, setMoveStatus } from '@/lib/marketplace';

export default function AdminMoves() {
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const moves = useQuery({ queryKey: ['moves'], queryFn: listMoveRequests });

  const decide = async (id: string, status: string) => {
    try {
      await setMoveStatus(id, status);
      queryClient.invalidateQueries({ queryKey: ['moves'] });
      toast(`Marked ${status}`, 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  if (moves.isLoading) return <Loading />;

  return (
    <ScreenScaffold title="Move requests" showBack>
      {(moves.data ?? []).length === 0 ? (
        <Empty title="No requests" hint="Resident move requests will show here." />
      ) : (
        <FlashList
          data={moves.data ?? []}
          keyExtractor={(m) => m.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <Card className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold capitalize text-foreground">
                  {item.kind.replace('_', ' ')}
                </Text>
                <Badge
                  label={item.status}
                  tone={item.status === 'approved' ? 'success' : item.status === 'rejected' ? 'danger' : 'warning'}
                />
              </View>
              {item.move_date ? (
                <Text className="text-xs text-foreground/50">Date: {item.move_date}</Text>
              ) : null}
              {item.note ? <Text className="text-xs text-foreground/60">{item.note}</Text> : null}
              {item.status === 'pending' ? (
                <View className="flex-row gap-2">
                  <View className="flex-1">
                    <Button label="Approve" onPress={() => decide(item.id, 'approved')} />
                  </View>
                  <View className="flex-1">
                    <Button label="Reject" variant="outline" onPress={() => decide(item.id, 'rejected')} />
                  </View>
                </View>
              ) : null}
            </Card>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
