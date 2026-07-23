// Admin complaints tab: tap a ticket to view it fully, reply, and advance status.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useCallback } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Badge, Card, Empty, ErrorState, Loading } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { useRealtime } from '@/hooks/useRealtime';
import type { TicketStatus } from '@/lib/database.types';
import { listTickets } from '@/lib/helpdesk';
import { useAuthStore } from '@/store/auth.store';

const tone: Record<TicketStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral',
};

export default function AdminComplaints() {
  const societyId = useAuthStore((s) => s.profile?.society_id ?? null);
  const queryClient = useQueryClient();
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: listTickets });

  // Live-refresh when residents raise tickets or post messages.
  const invalidate = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: ['tickets'] });
  }, [queryClient]);
  useRealtime('helpdesk_tickets', societyId, invalidate);
  useRealtime('ticket_comments', societyId, invalidate);

  if (tickets.isLoading) return <Loading />;
  if (tickets.isError) return <ErrorState onRetry={tickets.refetch} />;

  return (
    <ScreenScaffold title="Complaints">
      {(tickets.data ?? []).length === 0 ? (
        <Empty icon="chatbox-ellipses-outline" title="No complaints" hint="Tickets to triage will appear here." />
      ) : (
        <FlatList
          data={tickets.data ?? []}
          keyExtractor={(t) => t.id}
          contentContainerClassName="gap-3 p-5"
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/(admin)/ticket/${item.id}`)}>
              <Card className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="flex-1 text-base font-semibold text-foreground">{item.title}</Text>
                  <Badge label={item.status} tone={tone[item.status]} />
                </View>
                {item.description ? (
                  <Text className="text-sm text-foreground/60" numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
                <Text className="text-xs font-medium text-primary">Tap to view & reply →</Text>
              </Card>
            </Pressable>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
