// Resident directory: searchable list of neighbours, grouped by tower.
import { useQuery } from '@tanstack/react-query';
import { useMemo, useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Linking, Pressable, SectionList, Text, View } from 'react-native';

import { Avatar, Badge, Card, Empty, ErrorState, Input, ListSkeleton } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { listDirectory, type DirectoryEntry } from '@/lib/society';

// Derive a tower/section label from a flat number like "A-101" → "Tower A".
function towerOf(flat: string | null) {
  if (!flat) return 'Others';
  const block = flat.split('-')[0]?.trim().toUpperCase();
  return block ? `Tower ${block}` : 'Others';
}

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

  // Group entries by tower, sort sections and members alphabetically.
  const sections = useMemo(() => {
    const map = new Map<string, DirectoryEntry[]>();
    for (const r of filtered) {
      const key = towerOf(r.flat);
      const list = map.get(key) ?? [];
      list.push(r);
      map.set(key, list);
    }
    return Array.from(map.entries())
      .map(([title, data]) => ({
        title,
        data: data.sort((a, b) => (a.full_name ?? '').localeCompare(b.full_name ?? '')),
      }))
      .sort((a, b) => {
        if (a.title === 'Others') return 1;
        if (b.title === 'Others') return -1;
        return a.title.localeCompare(b.title);
      });
  }, [filtered]);

  if (dir.isLoading)
    return (
      <ScreenScaffold title="Directory" showBack>
        <ListSkeleton />
      </ScreenScaffold>
    );
  if (dir.isError) return <ErrorState onRetry={dir.refetch} />;

  return (
    <ScreenScaffold title="Directory" showBack>
      <View className="px-4 pt-3">
        <Input placeholder="Search name or flat" value={query} onChangeText={setQuery} />
      </View>
      {filtered.length === 0 ? (
        <Empty icon="search-outline" title="No matches" hint="Try a different name or flat." />
      ) : (
        <SectionList
          sections={sections}
          keyExtractor={(r) => r.id}
          contentContainerStyle={{ padding: 16 }}
          stickySectionHeadersEnabled={false}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderSectionHeader={({ section }) => (
            <Text className="mb-2 mt-4 text-xs font-semibold uppercase tracking-wide text-foreground/50">
              {section.title} · {section.data.length}
            </Text>
          )}
          renderItem={({ item }) => (
            <Card className="flex-row items-center justify-between">
              <View className="flex-1 flex-row items-center gap-3">
                <Avatar name={item.full_name} size={40} />
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
