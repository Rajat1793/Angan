// Notifications: bell feed grouped by day with category icons/colours.
import { Ionicons } from '@expo/vector-icons';
import { useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useEffect, useMemo } from 'react';
import { SectionList, Text, View } from 'react-native';

import { Empty, ErrorState, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useNotificationsList } from '@/hooks/useNotificationsList';
import { ACCENTS, tint } from '@/lib/accents';
import { markAllNotificationsRead, type AppNotification } from '@/lib/notifications';

// Infer a category (icon + colour) from a notification's text.
function categoryOf(n: AppNotification): { icon: keyof typeof Ionicons.glyphMap; color: string } {
  const t = `${n.title} ${n.body ?? ''}`.toLowerCase();
  if (/(sos|emergency|panic|urgent)/.test(t)) return { icon: 'warning', color: ACCENTS.red };
  if (/(paid|payment|due|invoice|₹|receipt)/.test(t)) return { icon: 'card', color: ACCENTS.green };
  if (/(visitor|gate|guest|delivery|parcel|approv|entry|exit)/.test(t))
    return { icon: 'person', color: ACCENTS.blue };
  if (/(notice|announce|circular)/.test(t)) return { icon: 'megaphone', color: ACCENTS.amber };
  if (/(comment|liked|post|community|reply)/.test(t))
    return { icon: 'chatbubbles', color: ACCENTS.purple };
  if (/(poll|vote|event|amenit|book)/.test(t)) return { icon: 'calendar', color: ACCENTS.indigo };
  return { icon: 'notifications', color: ACCENTS.slate };
}

// Bucket a timestamp into Today / Yesterday / an absolute date label.
function dayLabel(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  const startOf = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
  const diff = Math.round((startOf(now) - startOf(d)) / 86400000);
  if (diff <= 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  return d.toLocaleDateString([], { day: 'numeric', month: 'short', year: 'numeric' });
}

const time = (t: string) =>
  new Date(t).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

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

  // Group notifications into day sections (input is already newest-first).
  const sections = useMemo(() => {
    const groups: { title: string; data: AppNotification[] }[] = [];
    for (const n of data ?? []) {
      const label = dayLabel(n.created_at);
      const last = groups[groups.length - 1];
      if (last && last.title === label) last.data.push(n);
      else groups.push({ title: label, data: [n] });
    }
    return groups;
  }, [data]);

  return (
    <ScreenScaffold title="Notifications" rightIcon="close" onRightPress={() => router.back()}>
      {isLoading ? (
        <Loading />
      ) : isError ? (
        <ErrorState onRetry={refetch} />
      ) : !data || data.length === 0 ? (
        <Empty icon="notifications-outline" title="No notifications" hint="Activity alerts will appear here." />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(n) => n.id}
          contentContainerStyle={{ padding: 16 }}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderSectionHeader={({ section }) => (
            <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
              {section.title}
            </Text>
          )}
          renderItem={({ item }) => {
            const cat = categoryOf(item);
            return (
              <View
                className={`flex-row gap-3 rounded-2xl border p-4 ${
                  item.read ? 'border-muted/10 bg-background' : 'border-primary/20 bg-primary/5'
                }`}
              >
                <View
                  className="h-10 w-10 items-center justify-center rounded-full"
                  style={{ backgroundColor: tint(cat.color) }}
                >
                  <Ionicons name={cat.icon} size={18} color={cat.color} />
                </View>
                <View className="flex-1">
                  <View className="flex-row items-center gap-2">
                    <Text className="flex-1 text-sm font-semibold text-foreground">{item.title}</Text>
                    {!item.read ? (
                      <View
                        className="h-2 w-2 rounded-full"
                        style={{ backgroundColor: cat.color }}
                      />
                    ) : null}
                  </View>
                  {item.body ? (
                    <Text className="mt-0.5 text-sm text-foreground/70">{item.body}</Text>
                  ) : null}
                  <Text className="mt-1 text-xs text-foreground/40">{time(item.created_at)}</Text>
                </View>
              </View>
            );
          }}
        />
      )}
    </ScreenScaffold>
  );
}
