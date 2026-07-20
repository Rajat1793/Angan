// Resident notices: full society notice list (tap to open a notice).
import { useQuery } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, Card, Empty, ErrorState, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { listNotices } from '@/lib/community';

export default function Notices() {
  const notices = useQuery({ queryKey: ['notices'], queryFn: listNotices });

  if (notices.isLoading) return <Loading />;
  if (notices.isError) return <ErrorState onRetry={notices.refetch} />;

  return (
    <ScreenScaffold title="Notices" showBack>
      {(notices.data ?? []).length === 0 ? (
        <Empty title="No notices" hint="Society announcements will appear here." />
      ) : (
        <ScrollView contentContainerClassName="gap-3 p-5">
          {(notices.data ?? []).map((n) => (
            <Pressable key={n.id} onPress={() => router.push(`/(resident)/notice/${n.id}`)}>
              <Card className="gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-base font-semibold text-foreground">{n.title}</Text>
                  {n.pinned ? <Badge label="Pinned" tone="info" /> : null}
                </View>
                {n.body ? (
                  <Text className="text-sm text-foreground/70" numberOfLines={2}>
                    {n.body}
                  </Text>
                ) : null}
                <Text className="text-xs font-medium text-primary">Tap to read →</Text>
              </Card>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </ScreenScaffold>
  );
}
