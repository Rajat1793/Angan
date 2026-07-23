// Notifications: the bell feed shared by every role; marks all read on open.
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect } from 'react';
import { Text, View } from 'react-native';

import { Empty, ErrorState, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { markAllNotificationsRead } from '@/lib/notifications';

// Relative-ish timestamp for the feed.
const fmt = (t: string) => new Date(t).toLocaleString();

export default function NotificationsScreen() {
  const { data, isLoading, isError, refetch } = useNotificationsList();
  const queryClient = useQueryClient();

  // Clear the unread badge as soon as the feed is opened.
  useEffect(() => {
    (async () => {
      try {
        await markAllNotificationsRead();
        queryClient.invalidateQueries({ queryKey: ['notifications'] });
      } catch {
        // Non-fatal; the list still renders.
      }
    })();
  }, [queryClient]);

  return (
    <ScreenScaffold title="Notifications" rightIcon="close" onRightPress={() => router.back()}>
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <Empty icon="notifications-outline" title="No notifications" hint="Activity alerts will appear here." />
      ) : (
        <FlashList
          data={data}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <View
              className={`flex-row gap-3 rounded-2xl border border-muted/10 p-4 ${
                item.read ? 'bg-background' : 'bg-primary/5'
              }`}
            >
              <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                <Ionicons name="notifications" size={18} color="#3E481D" />
              </View>
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="flex-1 text-sm font-semibold text-foreground">{item.title}</Text>
                  {!item.read ? <View className="h-2 w-2 rounded-full bg-red-500" /> : null}
                </View>
                {item.body ? (
                  <Text className="mt-0.5 text-sm text-foreground/70">{item.body}</Text>
                ) : null}
                <Text className="mt-1 text-xs text-foreground/40">{fmt(item.created_at)}</Text>
              </View>
            </View>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
