// Resident community: social feed (post/like/comment) + notices + polls.
import { Ionicons } from '@expo/vector-icons';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback, useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, Button, Card, ErrorState, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useRealtime } from '@/hooks/useRealtime';
import {
  castVote,
  createPost,
  listNotices,
  listPolls,
  listPosts,
  togglePostLike,
  type Post,
} from '@/lib/community';
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
  const notices = useQuery({ queryKey: ['notices'], queryFn: listNotices });
  const polls = useQuery({
    queryKey: ['polls'],
    queryFn: () => listPolls(profile!.id),
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

  // Cast a vote then refresh poll tallies.
  const vote = async (pollId: string, optionId: string) => {
    if (!profile?.society_id) return;
    try {
      await castVote(profile.society_id, pollId, optionId, profile.id);
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    } catch (e) {
      toast((e as Error).message ?? 'Already voted', 'info');
    }
  };

  if (posts.isLoading || notices.isLoading || polls.isLoading) return <Loading />;
  if (notices.isError) return <ErrorState onRetry={notices.refetch} />;

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

        {/* Helpdesk shortcut. */}
        <Button
          label="Raise a helpdesk ticket"
          variant="outline"
          onPress={() => router.push('/(resident)/helpdesk')}
        />

        {/* Notices — tap to open. */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Notices</Text>
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
        </View>

        {/* Polls. */}
        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Polls</Text>
          {(polls.data ?? []).map((p) => {
            const total = p.options.reduce((sum, o) => sum + o.votes, 0);
            return (
              <Card key={p.id} className="gap-2">
                <Text className="text-base font-semibold text-foreground">{p.question}</Text>
                {p.options.map((o) => {
                  const pct = total ? Math.round((o.votes / total) * 100) : 0;
                  const chosen = p.myOptionId === o.id;
                  return (
                    <Pressable
                      key={o.id}
                      disabled={!!p.myOptionId}
                      onPress={() => vote(p.id, o.id)}
                      className={`rounded-xl border p-3 ${chosen ? 'border-primary bg-primary/10' : 'border-muted/20'}`}
                    >
                      <View className="flex-row justify-between">
                        <Text className="text-sm text-foreground">{o.label}</Text>
                        {p.myOptionId ? (
                          <Text className="text-sm text-foreground/60">{pct}%</Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
              </Card>
            );
          })}
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}
