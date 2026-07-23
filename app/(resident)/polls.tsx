// Resident polls: admin-posted polls; each resident votes once and sees results.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Card, Empty, ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { castVote, listPolls } from '@/lib/community';
import { useAuthStore } from '@/store/auth.store';

export default function Polls() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const polls = useQuery({
    queryKey: ['polls'],
    queryFn: () => listPolls(profile!.id),
    enabled: !!profile,
  });

  // Cast a vote then refresh tallies.
  const vote = async (pollId: string, optionId: string) => {
    if (!profile?.society_id) return;
    try {
      await castVote(profile.society_id, pollId, optionId, profile.id);
      queryClient.invalidateQueries({ queryKey: ['polls'] });
    } catch (e) {
      toast((e as Error).message ?? 'Already voted', 'info');
    }
  };

  if (polls.isLoading) return <Loading />;
  if (polls.isError) return <ErrorState onRetry={polls.refetch} />;

  return (
    <ScreenScaffold title="Polls" showBack>
      {(polls.data ?? []).length === 0 ? (
        <Empty icon="podium-outline" title="No active polls" hint="Your society admin will post polls here." />
      ) : (
        <ScrollView contentContainerClassName="gap-3 p-5">
          <Text className="text-sm text-foreground/50">
            Polls are posted by your society admin. Vote once — results update live for everyone.
          </Text>
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
                          <Text className="text-sm text-foreground/60">
                            {pct}% · {o.votes}
                          </Text>
                        ) : null}
                      </View>
                    </Pressable>
                  );
                })}
                <Text className="text-xs text-foreground/40">
                  {p.myOptionId
                    ? `${total} vote${total === 1 ? '' : 's'} · you voted`
                    : 'Tap an option to vote'}
                </Text>
              </Card>
            );
          })}
        </ScrollView>
      )}
    </ScreenScaffold>
  );
}
