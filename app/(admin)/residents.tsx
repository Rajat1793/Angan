// Admin residents tab: society resident directory (RLS-scoped).
import { useQuery } from '@tanstack/react-query';
import { FlatList, Text, View } from 'react-native';

import { Avatar, Card, Empty, ErrorState, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { listResidents } from '@/lib/admin';

export default function AdminResidents() {
  const residents = useQuery({ queryKey: ['residents'], queryFn: listResidents });

  if (residents.isLoading) return <Loading />;
  if (residents.isError) return <ErrorState onRetry={residents.refetch} />;

  return (
    <ScreenScaffold title="Residents">
      {(residents.data ?? []).length === 0 ? (
        <Empty title="No residents loaded" hint="Manage residents and flats here." />
      ) : (
        <FlatList
          data={residents.data ?? []}
          keyExtractor={(r) => r.id}
          contentContainerClassName="gap-3 p-5"
          renderItem={({ item }) => (
            <Card className="flex-row items-center gap-3">
              <Avatar name={item.full_name} size={40} />
              <View className="flex-1">
                <Text className="text-base font-semibold text-foreground">
                  {item.full_name ?? 'Unnamed'}
                </Text>
                <Text className="text-sm text-foreground/60">{item.phone ?? '—'}</Text>
              </View>
            </Card>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
