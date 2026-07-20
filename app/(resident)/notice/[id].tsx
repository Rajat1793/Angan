// Notice detail: full society notice opened from the community feed.
import { useQuery } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { ScrollView, Text, View } from 'react-native';

import { Badge, ErrorState, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { getNotice } from '@/lib/community';

export default function NoticeDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const notice = useQuery({ queryKey: ['notice', id], queryFn: () => getNotice(String(id)) });

  if (notice.isLoading) return <Loading />;
  if (notice.isError) return <ErrorState onRetry={notice.refetch} />;

  const n = notice.data;
  return (
    <ScreenScaffold title="Notice">
      <ScrollView contentContainerClassName="gap-3 p-5">
        <View className="flex-row items-center gap-2">
          {n?.pinned ? <Badge label="Pinned" tone="info" /> : null}
          {n?.category ? <Badge label={n.category} tone="neutral" /> : null}
        </View>
        <Text className="text-2xl font-bold text-foreground">{n?.title}</Text>
        <Text className="text-xs text-foreground/40">
          {n ? new Date(n.created_at).toLocaleString() : ''}
        </Text>
        {n?.body ? (
          <Text className="mt-1 text-base leading-6 text-foreground/80">{n.body}</Text>
        ) : null}
      </ScrollView>
    </ScreenScaffold>
  );
}
