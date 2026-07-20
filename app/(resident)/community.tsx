// Resident community: social feed only (post / like / comment).
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, ErrorState, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useRealtime } from '@/hooks/useRealtime';
import { createPost, listPosts, togglePostLike, type Post } from '@/lib/community';
import { useAuthStore } from '@/store/auth.store';

const timeLabel = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });

export default function Community() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [postBody, setPostBody] = useState('');
  const [posting, setPosting] = useState(false);

  const posts = useQuery({
    queryKey: ['posts'],
    queryFn: () => listPosts(profile!.id),
    enabled: !!profile,
  });

  // Live-refresh the feed as members post, like, or comment.
  const invalidatePosts = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['posts'] });
  }, [queryClient]);
  useRealtime('posts', profile?.society_id, invalidatePosts);
  useRealtime('post_likes', profile?.society_id, invalidatePosts);
  useRealtime('post_comments', profile?.society_id, invalidatePosts);

  // Publish a new post to the society feed.
  const submitPost = async () => {
    if (!profile?.society_id || postBody.trim().length < 2) return;
    setPosting(true);
    try {
      await createPost(profile.society_id, profile.id, postBody.trim());
      setPostBody('');
      invalidatePosts();
      toast('Posted', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Could not post', 'error');
    } finally {
      setPosting(false);
    }
  };

  // Toggle a like optimistically-ish (refetch on settle).
  const like = async (post: Post) => {
    if (!profile?.society_id) return;
    try {
      await togglePostLike(profile.society_id, post.id, profile.id, post.liked_by_me);
      invalidatePosts();
    } catch (e) {
      toast((e as Error).message ?? 'Could not like', 'error');
    }
  };

  if (posts.isLoading) return <Loading />;
  if (posts.isError) return <ErrorState onRetry={posts.refetch} />;

  return (
    <ScreenScaffold title="Community">
      <ScrollView contentContainerClassName="gap-6 p-5">
        {/* Post composer. */}
        <Card className="gap-2">
          <Text className="text-base font-semibold text-foreground">Share with your community</Text>
          <Input
            placeholder="What's happening in the society?"
            value={postBody}
            onChangeText={setPostBody}
            multiline
          />
          <Button
            label="Post"
            loading={posting}
            disabled={postBody.trim().length < 2}
            onPress={submitPost}
          />
        </Card>

        {/* Social feed. */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Feed</Text>
          {(posts.data ?? []).length === 0 ? (
            <Text className="text-sm text-foreground/50">
              No posts yet — be the first to share something.
            </Text>
          ) : (
            (posts.data ?? []).map((p) => (
              <Card key={p.id} className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-semibold text-foreground">
                    {p.author_name ?? 'Member'}
                  </Text>
                  <Text className="text-xs text-foreground/40">{timeLabel(p.created_at)}</Text>
                </View>
                <Text className="text-sm text-foreground/80">{p.body}</Text>
                <View className="flex-row items-center gap-5 pt-1">
                  <Pressable onPress={() => like(p)} className="flex-row items-center gap-1.5">
                    <Ionicons
                      name={p.liked_by_me ? 'heart' : 'heart-outline'}
                      size={18}
                      color={p.liked_by_me ? '#ef4444' : '#6b7280'}
                    />
                    <Text className="text-sm text-foreground/60">{p.likes}</Text>
                  </Pressable>
                  <Pressable
                    onPress={() => router.push(`/(resident)/post/${p.id}`)}
                    className="flex-row items-center gap-1.5"
                  >
                    <Ionicons name="chatbubble-outline" size={18} color="#6b7280" />
                    <Text className="text-sm text-foreground/60">{p.comments}</Text>
                  </Pressable>
                </View>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}
