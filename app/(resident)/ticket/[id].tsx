// Ticket detail: status timeline header + realtime threaded comments.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { Button, Card, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useRealtime } from '@/hooks/useRealtime';
import { addComment, listComments } from '@/lib/helpdesk';
import { useAuthStore } from '@/store/auth.store';

export default function TicketDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [body, setBody] = useState('');

  const comments = useQuery({
    queryKey: ['comments', id],
    queryFn: () => listComments(String(id)),
  });

  // Refresh the thread whenever a comment changes in this society.
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['comments', id] });
  }, [queryClient, id]);
  useRealtime('ticket_comments', profile?.society_id, invalidate);

  // Post a comment into the thread.
  const send = async () => {
    if (!profile?.society_id || body.trim().length === 0) return;
    try {
      await addComment(profile.society_id, String(id), profile.id, body.trim());
      setBody('');
      invalidate();
    } catch (e) {
      toast((e as Error).message ?? 'Could not comment', 'error');
    }
  };

  if (comments.isLoading) return <Loading />;

  return (
    <ScreenScaffold title="Ticket">
      <FlatList
        data={comments.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerClassName="gap-2 p-5"
        renderItem={({ item }) => (
          <Card>
            <Text className="text-sm text-foreground">{item.body}</Text>
            <Text className="mt-1 text-xs text-foreground/50">
              {new Date(item.created_at).toLocaleString()}
            </Text>
          </Card>
        )}
        ListEmptyComponent={
          <Text className="text-center text-sm text-foreground/50">No comments yet.</Text>
        }
      />
      <View className="flex-row items-end gap-2 border-t border-muted/10 p-3">
        <View className="flex-1">
          <Input placeholder="Write a comment" value={body} onChangeText={setBody} />
        </View>
        <Button label="Send" onPress={send} />
      </View>
    </ScreenScaffold>
  );
}
