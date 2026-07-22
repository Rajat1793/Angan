// Resident directory: searchable list of neighbours & committee members.
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, Text, View } from 'react-native';

import { Badge, Card, Empty, ErrorState, Input, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { listDirectory } from '@/lib/society';

export default function Directory() {
  const [query, setQuery] = useState('');
  const dir = useQuery({ queryKey: ['directory'], queryFn: listDirectory });

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const rows = dir.data ?? [];
    if (!q) return rows;
    return rows.filter(
      (r) =>
        (r.full_name ?? '').toLowerCase().includes(q) ||
        (r.flat ?? '').toLowerCase().includes(q),
    );
  }, [dir.data, query]);

  if (dir.isLoading) return <Loading />;
  if (dir.isError) return <ErrorState onRetry={dir.refetch} />;

  return (
    <ScreenScaffold title="Directory" showBack>
      <View className="px-4 pt-3">
        <Input placeholder="Search name or flat" value={query} onChangeText={setQuery} />
      </View>
      {filtered.length === 0 ? (
        <Empty title="No matches" hint="Try a different name or flat." />
      ) : (
        <FlashList
          data={filtered}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <Card className="flex-row items-center justify-between">
              <View className="flex-1">
                <View className="flex-row items-center gap-2">
                  <Text className="text-base font-semibold text-foreground">
                    {item.full_name ?? 'Resident'}
                  </Text>
                  {item.role !== 'resident' ? (
                    <Badge label={item.role} tone="info" />
                  ) : null}
                </View>
                <Text className="text-xs text-foreground/50">
                  {item.flat ? `Flat ${item.flat}` : 'No flat'}
                </Text>
              </View>
              {item.phone ? (
                <Pressable onPress={() => Linking.openURL(`tel:${item.phone}`)} hitSlop={8}>
                  <Ionicons name="call" size={20} color="#3E481D" />
                </Pressable>
              ) : null}
            </Card>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
