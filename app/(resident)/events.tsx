// Resident events: upcoming community events with one-tap RSVP.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { RefreshControl, Text, View } from 'react-native';

import { Button, Card, Empty, ErrorState, ListSkeleton, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { listEvents, toggleRsvp } from '@/lib/society';
import { useAuthStore } from '@/store/auth.store';

export default function Events() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);

  const events = useQuery({
    queryKey: ['events'],
    queryFn: () => listEvents(profile!.id),
    enabled: !!profile,
  });

  const rsvp = async (eventId: string, rsvped: boolean) => {
    if (!profile?.society_id) return;
    try {
      await toggleRsvp(profile.society_id, eventId, profile.id, rsvped);
      queryClient.invalidateQueries({ queryKey: ['events'] });
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  if (events.isLoading)
    return (
      <ScreenScaffold title="Events" showBack>
        <ListSkeleton />
      </ScreenScaffold>
    );
  if (events.isError) return <ErrorState onRetry={events.refetch} />;

  return (
    <ScreenScaffold title="Events" showBack>
      {(events.data ?? []).length === 0 ? (
        <Empty icon="calendar-outline" title="No events" hint="Upcoming community events will show here." />
      ) : (
        <FlashList
          data={events.data ?? []}
          keyExtractor={(e) => e.id}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={
            <RefreshControl refreshing={events.isRefetching} onRefresh={events.refetch} tintColor="#3E481D" />
          }
          ItemSeparatorComponent={() => <View className="h-3" />}
          renderItem={({ item }) => (
            <Card className="gap-2">
              <Text className="text-base font-semibold text-foreground">{item.title}</Text>
              {item.description ? (
                <Text className="text-sm text-foreground/70">{item.description}</Text>
              ) : null}
              <View className="flex-row items-center gap-3">
                <View className="flex-row items-center gap-1">
                  <Ionicons name="time-outline" size={14} color="#6b7280" />
                  <Text className="text-xs text-foreground/50">
                    {new Date(item.starts_at).toLocaleString()}
                  </Text>
                </View>
                {item.location ? (
                  <View className="flex-row items-center gap-1">
                    <Ionicons name="location-outline" size={14} color="#6b7280" />
                    <Text className="text-xs text-foreground/50">{item.location}</Text>
                  </View>
                ) : null}
              </View>
              <View className="flex-row items-center justify-between">
                <Text className="text-xs text-foreground/50">{item.going} going</Text>
                <Button
                  label={item.rsvped ? 'Going ✓' : 'RSVP'}
                  variant={item.rsvped ? 'outline' : 'primary'}
                  onPress={() => rsvp(item.id, item.rsvped)}
                />
              </View>
            </Card>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
