// Admin complaints tab: triage helpdesk tickets and advance their status.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { FlatList, Text, View } from 'react-native';

import { Badge, Button, Card, Empty, ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import type { TicketStatus } from '@/lib/database.types';
import { listTickets, updateTicketStatus } from '@/lib/helpdesk';

const tone: Record<TicketStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral',
};

// The next status in the simple triage timeline.
const nextStatus: Record<TicketStatus, TicketStatus | null> = {
  open: 'in_progress',
  in_progress: 'resolved',
  resolved: 'closed',
  closed: null,
};

export default function AdminComplaints() {
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const tickets = useQuery({ queryKey: ['tickets'], queryFn: listTickets });

  // Advance a ticket to its next status.
  const advance = async (id: string, status: TicketStatus) => {
    try {
      await updateTicketStatus(id, status);
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  if (tickets.isLoading) return <Loading />;
  if (tickets.isError) return <ErrorState onRetry={tickets.refetch} />;

  return (
    <ScreenScaffold title="Complaints">
      {(tickets.data ?? []).length === 0 ? (
        <Empty title="No complaints" hint="Tickets to triage will appear here." />
      ) : (
        <FlatList
          data={tickets.data ?? []}
          keyExtractor={(t) => t.id}
          contentContainerClassName="gap-3 p-5"
          renderItem={({ item }) => {
            const next = nextStatus[item.status];
            return (
              <Card className="gap-2">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-foreground">{item.title}</Text>
                  <Badge label={item.status} tone={tone[item.status]} />
                </View>
                {item.description ? (
                  <Text className="text-sm text-foreground/60">{item.description}</Text>
                ) : null}
                {next ? (
                  <Button
                    label={`Move to ${next.replace('_', ' ')}`}
                    variant="outline"
                    onPress={() => advance(item.id, next)}
                  />
                ) : null}
              </Card>
            );
          }}
        />
      )}
    </ScreenScaffold>
  );
}
