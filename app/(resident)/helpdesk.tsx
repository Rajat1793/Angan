// Resident helpdesk: list existing tickets and raise a new one.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { router } from 'expo-router';
import { useState } from 'react';
import { FlatList, Pressable, Text, View } from 'react-native';

import { Badge, Button, Card, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import type { TicketStatus } from '@/lib/database.types';
import { createTicket, listTickets } from '@/lib/helpdesk';
import { useAuthStore } from '@/store/auth.store';

// Ticket status → badge tone for quick scanning.
const tone: Record<TicketStatus, 'warning' | 'info' | 'success' | 'neutral'> = {
  open: 'warning',
  in_progress: 'info',
  resolved: 'success',
  closed: 'neutral',
};

export default function Helpdesk() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const tickets = useQuery({ queryKey: ['tickets'], queryFn: listTickets });

  // Create a ticket (photo attachment omitted for brevity) and refresh.
  const submit = async () => {
    if (!profile?.society_id) return;
    if (title.trim().length < 2) return toast('Enter a title', 'info');
    setSaving(true);
    try {
      await createTicket(profile.society_id, profile.id, title.trim(), desc.trim(), null);
      setTitle('');
      setDesc('');
      queryClient.invalidateQueries({ queryKey: ['tickets'] });
      toast('Ticket raised', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Could not raise ticket', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold title="Helpdesk">
      <View className="gap-3 p-5">
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Description" value={desc} onChangeText={setDesc} multiline />
        <Button label="Raise ticket" loading={saving} onPress={submit} />
      </View>
      {tickets.isLoading ? (
        <Loading />
      ) : (
        <FlatList
          data={tickets.data ?? []}
          keyExtractor={(t) => t.id}
          contentContainerClassName="gap-3 px-5 pb-8"
          renderItem={({ item }) => (
            <Pressable onPress={() => router.push(`/(resident)/ticket/${item.id}`)}>
              <Card className="gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-base font-semibold text-foreground">{item.title}</Text>
                  <Badge label={item.status} tone={tone[item.status]} />
                </View>
                {item.description ? (
                  <Text className="text-sm text-foreground/60" numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}
              </Card>
            </Pressable>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
