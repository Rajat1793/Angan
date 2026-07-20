// TicketDetailView: full ticket header + status controls (admin) + realtime
// comment thread. Shared by the resident and admin ticket detail screens.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useState } from 'react';
import { FlatList, Text, View } from 'react-native';

import { Badge, Button, Card, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useRealtime } from '@/hooks/useRealtime';
import type { TicketStatus } from '@/lib/database.types';
import { addComment, getTicket, listComments, updateTicketStatus } from '@/lib/helpdesk';
import { useAuthStore } from '@/store/auth.store';

const tone: Record<TicketStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral',
};

const nextStatus: Record<TicketStatus, TicketStatus | null> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
  closed: null,
};

export function TicketDetailView({ id, canManage }: { id: string; canManage: boolean }) {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [body, setBody] = useState('');

  const ticket = useQuery({ queryKey: ['ticket', id], queryFn: () => getTicket(id) });
  const comments = useQuery({ queryKey: ['comments', id], queryFn: () => listComments(id) });

  // Refresh the thread whenever a comment changes in this society.
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['comments', id] });
  }, [queryClient, id]);
  useRealtime('ticket_comments', profile?.society_id, invalidate);

  const send = async () => {
    if (!profile?.society_id || body.trim().length === 0) return;
    try {
      await addComment(profile.society_id, id, profile.id, body.trim());
      setBody('');
      invalidate();
    } catch (e) {
      toast((e as Error).message ?? 'Could not send', 'error');
    }
  };

  // Admin advances the ticket along its status timeline.
  const advance = async (status: TicketStatus) => {
    try {
      await updateTicketStatus(id, status);
      queryClient.invalidateQueries({ queryKey: ['ticket', id] });
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast('Status updated', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  if (ticket.isLoading || comments.isLoading) return <Loading />;

  const t = ticket.data;
  const next = t ? nextStatus[t.status] : null;

  return (
    <ScreenScaffold title="Ticket">
      <FlatList
        data={comments.data ?? []}
        keyExtractor={(c) => c.id}
        contentContainerClassName="gap-2 p-5"
        ListHeaderComponent={
          t ? (
            <Card className="mb-2 gap-2">
              <View className="flex-row items-start justify-between gap-2">
                <Text className="flex-1 text-lg font-bold text-foreground">{t.title}</Text>
                <Badge label={t.status} tone={tone[t.status]} />
              </View>
              {t.description ? (
                <Text className="text-sm text-foreground/70">{t.description}</Text>
              ) : null}
              <Text className="text-xs text-foreground/40">
                Raised {new Date(t.created_at).toLocaleString()}
              </Text>
              {canManage && next ? (
                <Button
                  label={`Move to ${next.replace('_', ' ')}`}
                  variant="outline"
                  onPress={() => advance(next)}
                />
              ) : null}
            </Card>
          ) : null
        }
        renderItem={({ item }) => {
          const mine = item.author_id === profile?.id;
          return (
            <Card>
              <Text className="mb-1 text-xs font-semibold text-primary">
                {mine ? 'You' : item.author_name ?? 'Member'}
              </Text>
              <Text className="text-sm text-foreground">{item.body}</Text>
              <Text className="mt-1 text-xs text-foreground/50">
                {new Date(item.created_at).toLocaleString()}
              </Text>
            </Card>
          );
        }}
        ListEmptyComponent={
          <Text className="text-center text-sm text-foreground/50">No messages yet.</Text>
        }
      />
      <View className="flex-row items-end gap-2 border-t border-muted/10 p-3">
        <View className="flex-1">
          <Input
            placeholder={canManage ? 'Reply to the resident' : 'Write a message'}
            value={body}
            onChangeText={setBody}
          />
        </View>
        <Button label="Send" onPress={send} />
      </View>
    </ScreenScaffold>
  );
}
