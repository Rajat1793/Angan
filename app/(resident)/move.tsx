// Resident move-in/out: request a move and track its approval status.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, Button, Card, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { createMoveRequest, listMoveRequests } from '@/lib/marketplace';
import { useAuthStore } from '@/store/auth.store';

const statusTone = (s: string) =>
  s === 'approved' ? 'success' : s === 'rejected' ? 'danger' : 'warning';

export default function Move() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [kind, setKind] = useState('move_out');
  const [date, setDate] = useState('');
  const [note, setNote] = useState('');
  const [saving, setSaving] = useState(false);

  const requests = useQuery({ queryKey: ['moves'], queryFn: listMoveRequests });

  const submit = async () => {
    if (!profile?.society_id) return;
    setSaving(true);
    try {
      await createMoveRequest(profile.society_id, profile.flat_id, profile.id, kind, date.trim(), note.trim());
      setDate('');
      setNote('');
      queryClient.invalidateQueries({ queryKey: ['moves'] });
      toast('Request submitted', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <ScreenScaffold title="Move in / out" showBack>
      <ScrollView contentContainerClassName="gap-3 p-5">
        <View className="flex-row gap-2">
          {[
            { k: 'move_in', label: 'Move in' },
            { k: 'move_out', label: 'Move out' },
          ].map((o) => (
            <Pressable
              key={o.k}
              onPress={() => setKind(o.k)}
              className={`rounded-full px-4 py-2 ${kind === o.k ? 'bg-primary' : 'bg-muted/10'}`}
            >
              <Text className={`text-sm ${kind === o.k ? 'text-background' : 'text-foreground'}`}>{o.label}</Text>
            </Pressable>
          ))}
        </View>
        <Input label="Move date" placeholder="2026-08-01" value={date} onChangeText={setDate} />
        <Input label="Note (optional)" value={note} onChangeText={setNote} multiline />
        <Button label="Submit request" loading={saving} onPress={submit} />

        {requests.isLoading ? (
          <Loading />
        ) : (
          (requests.data ?? []).map((r) => (
            <Card key={r.id} className="gap-1">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold capitalize text-foreground">
                  {r.kind.replace('_', ' ')}
                </Text>
                <Badge label={r.status} tone={statusTone(r.status) as any} />
              </View>
              {r.move_date ? (
                <Text className="text-xs text-foreground/50">Date: {r.move_date}</Text>
              ) : null}
              {r.note ? <Text className="text-xs text-foreground/60">{r.note}</Text> : null}
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}
