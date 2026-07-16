// Resident community: pinned notices feed + polls with one-tap voting.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, Button, Card, ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { castVote, listNotices, listPolls } from '@/lib/community';
import { useAuthStore } from '@/store/auth.store';

export default function Community() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);

  const notices = useQuery({ queryKey: ['notices'], queryFn: listNotices });
  const polls = useQuery({
    queryKey: ['polls'],
    queryFn: () => listPolls(profile!.id),
    enabled: !!profile,
  });

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

  if (notices.isLoading || polls.isLoading) return <Loading />;
  if (notices.isError) return <ErrorState onRetry={notices.refetch} />;

  return (
    <ScreenScaffold title="Community">
      <ScrollView contentContainerClassName="gap-6 p-5">
        {/* Help shortcut into the helpdesk flow. */}
        <Button
          label="Raise a helpdesk ticket"
          variant="outline"
          onPress={() => router.push('/(resident)/helpdesk')}
        />

        <View className="gap-3">
          <Text className="text-lg font-bold text-foreground">Notices</Text>
          {(notices.data ?? []).map((n) => (
            <Card key={n.id} className="gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-base font-semibold text-foreground">{n.title}</Text>
                {n.pinned ? <Badge label="Pinned" tone="info" /> : null}
              </View>
              {n.body ? (
                <Text className="text-sm text-foreground/70">{n.body}</Text>
              ) : null}
            </Card>
          ))}
        </View>

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
