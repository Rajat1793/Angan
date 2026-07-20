// Post detail: the post + realtime comment thread with a composer.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useLocalSearchParams } from 'expo-router';
import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { Button, Card, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useRealtime } from '@/hooks/useRealtime';
import { addPostComment, getPost, listPostComments, togglePostLike } from '@/lib/community';
import { useAuthStore } from '@/store/auth.store';

const timeLabel = (iso: string) => new Date(iso).toLocaleString();

export default function PostDetail() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [body, setBody] = useState('');

  const post = useQuery({
    queryKey: ['post', id],
    queryFn: () => getPost(String(id), profile!.id),
    enabled: !!profile,
  });
  const comments = useQuery({
    queryKey: ['post-comments', id],
    queryFn: () => listPostComments(String(id)),
  });

  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['post-comments', id] });
    queryClient.invalidateQueries({ queryKey: ['post', id] });
  }, [queryClient, id]);
  useRealtime('post_comments', profile?.society_id, invalidate);
  useRealtime('post_likes', profile?.society_id, invalidate);

  const send = async () => {
    if (!profile?.society_id || body.trim().length === 0) return;
    try {
      await addPostComment(profile.society_id, String(id), profile.id, body.trim());
      setBody('');
      invalidate();
    } catch (e) {
      toast((e as Error).message ?? 'Could not comment', 'error');
    }
  };

  const like = async () => {
    if (!profile?.society_id || !post.data) return;
    try {
      await togglePostLike(profile.society_id, String(id), profile.id, post.data.liked_by_me);
      invalidate();
    } catch (e) {
      toast((e as Error).message ?? 'Could not like', 'error');
    }
  };

  if (post.isLoading || comments.isLoading) return <Loading />;

  const p = post.data;
  return (
    <ScreenScaffold title="Post" showBack>
      <FlatList
        data={comments.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerClassName="gap-2 p-5"
        ListHeaderComponent={
          p ? (
            <Card className="mb-2 gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">
                  {p.author_name ?? 'Member'}
                </Text>
                <Text className="text-xs text-foreground/40">{timeLabel(p.created_at)}</Text>
              </View>
              <Text className="text-base text-foreground/90">{p.body}</Text>
              <View className="flex-row items-center gap-2 pt-1">
                <Button
                  label={`${p.liked_by_me ? 'Liked' : 'Like'} · ${p.likes}`}
                  variant="outline"
                  onPress={like}
                />
              </View>
            </Card>
          ) : null
        }
        renderItem={({ item }) => (
          <Card>
            <Text className="mb-1 text-xs font-semibold text-primary">
              {item.author_name ?? 'Member'}
            </Text>
            <Text className="text-sm text-foreground">{item.body}</Text>
            <Text className="mt-1 text-xs text-foreground/50">{timeLabel(item.created_at)}</Text>
          </Card>
        )}
        ListEmptyComponent={
          <Text className="text-center text-sm text-foreground/50">No comments yet.</Text>
        }
      />
      <View className="flex-row items-end gap-2 border-t border-muted/10 p-3">
        <View className="flex-1">
          <Input placeholder="Add a comment" value={body} onChangeText={setBody} />
        </View>
        <Button label="Send" onPress={send} />
      </View>
    </ScreenScaffold>
  );
}
