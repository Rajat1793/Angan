// Resident SOS: raise an emergency alert to guards/admin with one tap.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Badge, Card, Input, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { hapticWarning } from '@/lib/haptics';
import { listSos, raiseSos } from '@/lib/services';
import { useAuthStore } from '@/store/auth.store';

export default function Sos() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  const alerts = useQuery({ queryKey: ['sos'], queryFn: listSos });

  const trigger = async () => {
    if (!profile?.society_id) return;
    setSending(true);
    hapticWarning();
    try {
      await raiseSos(profile.society_id, profile.id, profile.flat_id, message.trim());
      setMessage('');
      queryClient.invalidateQueries({ queryKey: ['sos'] });
      toast('Emergency alert sent', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Could not send alert', 'error');
    } finally {
      setSending(false);
    }
  };

  return (
    <ScreenScaffold title="Emergency SOS" showBack>
      <ScrollView contentContainerClassName="gap-5 p-5">
        <Text className="text-sm text-foreground/60">
          Tap the button to instantly alert your society guards and admin. Add an optional note.
        </Text>
        <Input placeholder="What's the emergency? (optional)" value={message} onChangeText={setMessage} />
        <Pressable
          onPress={trigger}
          disabled={sending}
          className={`h-40 items-center justify-center rounded-full bg-red-600 ${sending ? 'opacity-60' : 'active:opacity-80'}`}
        >
          <Text className="text-2xl font-extrabold text-white">SOS</Text>
          <Text className="mt-1 text-xs font-medium text-white/80">Tap to alert</Text>
        </Pressable>

        <View className="gap-2">
          <Text className="text-base font-bold text-foreground">Recent alerts</Text>
          {(alerts.data ?? []).length === 0 ? (
            <Text className="text-sm text-foreground/50">No alerts raised.</Text>
          ) : (
            (alerts.data ?? []).map((a) => (
              <Card key={a.id} className="gap-1">
                <View className="flex-row items-center justify-between">
                  <Text className="text-sm font-medium text-foreground">
                    {a.message || 'Emergency alert'}
                  </Text>
                  <Badge
                    label={a.status === 'active' ? 'Active' : 'Resolved'}
                    tone={a.status === 'active' ? 'danger' : 'success'}
                  />
                </View>
                <Text className="text-xs text-foreground/50">
                  {new Date(a.created_at).toLocaleString()}
                </Text>
              </Card>
            ))
          )}
        </View>
      </ScrollView>
    </ScreenScaffold>
  );
}
