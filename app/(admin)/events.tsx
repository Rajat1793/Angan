// Admin events: create community events and see RSVPs.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { createEvent, listEvents } from '@/lib/society';
import { useAuthStore } from '@/store/auth.store';

export default function AdminEvents() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [title, setTitle] = useState('');
  const [desc, setDesc] = useState('');
  const [location, setLocation] = useState('');
  const [saving, setSaving] = useState(false);

  const events = useQuery({
    queryKey: ['events'],
    queryFn: () => listEvents(profile!.id),
    enabled: !!profile,
  });

  const create = async () => {
    if (!profile?.society_id) return;
    if (title.trim().length < 2) return toast('Enter a title', 'info');
    setSaving(true);
    try {
      // Default to 7 days out at 6pm for the demo.
      const when = new Date();
      when.setDate(when.getDate() + 7);
      when.setHours(18, 0, 0, 0);
      await createEvent(profile.society_id, profile.id, title.trim(), desc.trim(), location.trim(), when.toISOString());
      setTitle('');
      setDesc('');
      setLocation('');
      queryClient.invalidateQueries({ queryKey: ['events'] });
      toast('Event created', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold title="Events" showBack>
      <ScrollView contentContainerClassName="gap-3 p-5">
        <Input label="Title" value={title} onChangeText={setTitle} />
        <Input label="Description" value={desc} onChangeText={setDesc} multiline />
        <Input label="Location" value={location} onChangeText={setLocation} />
        <Button label="Create event (7 days out)" loading={saving} onPress={create} />

        {events.isLoading ? (
          <Loading />
        ) : (
          (events.data ?? []).map((e) => (
            <Card key={e.id} className="gap-1">
              <Text className="text-base font-semibold text-foreground">{e.title}</Text>
              <Text className="text-xs text-foreground/50">
                {new Date(e.starts_at).toLocaleString()} · {e.going} going
              </Text>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}
