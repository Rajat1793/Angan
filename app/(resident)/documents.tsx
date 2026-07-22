// Resident documents: society files & receipts, tap to open.
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { Linking, Pressable, Text, View } from 'react-native';

import { Badge, Card, Empty, ErrorState, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { listDocuments } from '@/lib/society';

export default function Documents() {
  const docs = useQuery({ queryKey: ['documents'], queryFn: listDocuments });

  if (docs.isLoading) return <Loading />;
  if (docs.isError) return <ErrorState onRetry={docs.refetch} />;

  return (
    <ScreenScaffold title="Documents" showBack>
      {(docs.data ?? []).length === 0 ? (
        <Empty title="No documents" hint="Society files will appear here." />
      ) : (
        <FlashList
          data={docs.data ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <Pressable onPress={() => Linking.openURL(item.url)}>
              <Card className="flex-row items-center gap-3">
                <View className="h-10 w-10 items-center justify-center rounded-full bg-primary/10">
                  <Ionicons name="document-text" size={18} color="#3E481D" />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-semibold text-foreground">{item.title}</Text>
                  <Text className="text-xs text-foreground/40">
                    {new Date(item.created_at).toLocaleDateString()}
                  </Text>
                </View>
                {item.category ? <Badge label={item.category} tone="neutral" /> : null}
              </Card>
            </Pressable>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
