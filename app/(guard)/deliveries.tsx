// Guard deliveries: log a parcel held at the gate and mark parcels collected.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { FlashList } from '@shopify/flash-list';
import { Text, View } from 'react-native';

import { Badge, Button, Card, Empty, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { FlatPicker } from '@/components/visitor/FlatPicker';
import { listDeliveries, logDelivery, markCollected } from '@/lib/deliveries';
import { useAuthStore } from '@/store/auth.store';

export default function Deliveries() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [flatId, setFlatId] = useState('');
  const [courier, setCourier] = useState('');
  const [desc, setDesc] = useState('');
  const [saving, setSaving] = useState(false);

  const deliveries = useQuery({ queryKey: ['deliveries'], queryFn: listDeliveries });

  const submit = async () => {
    if (!profile?.society_id) return;
    if (!flatId) return toast('Select a flat', 'info');
    if (courier.trim().length < 2) return toast('Enter the courier', 'info');
    setSaving(true);
    try {
      await logDelivery(profile.society_id, flatId, courier.trim(), desc.trim(), profile.id);
      setCourier('');
      setDesc('');
      setFlatId('');
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast('Parcel logged', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const collect = async (id: string) => {
    try {
      await markCollected(id);
      queryClient.invalidateQueries({ queryKey: ['deliveries'] });
      toast('Marked collected', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  return (
    <ScreenScaffold title="Deliveries" subtitle="Parcels at the gate" showBack>
      <View className="gap-3 p-5">
        <FlatPicker societyId={profile?.society_id} value={flatId} onChange={setFlatId} />
        <Input label="Courier" placeholder="Amazon, Flipkart…" value={courier} onChangeText={setCourier} />
        <Input label="Note (optional)" value={desc} onChangeText={setDesc} />
        <Button label="Log parcel" loading={saving} onPress={submit} />
      </View>
      {deliveries.isLoading ? (
        <Loading />
      ) : (deliveries.data ?? []).length === 0 ? (
        <Empty title="No parcels" hint="Logged parcels will appear here." />
      ) : (
        <FlashList
          data={deliveries.data ?? []}
          keyExtractor={(d) => d.id}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View className="h-2" />}
          renderItem={({ item }) => (
            <Card className="gap-2">
              <View className="flex-row items-center justify-between">
                <Text className="text-sm font-semibold text-foreground">{item.courier}</Text>
                <Badge
                  label={item.status === 'collected' ? 'Collected' : 'At gate'}
                  tone={item.status === 'collected' ? 'neutral' : 'warning'}
                />
              </View>
              {item.description ? (
                <Text className="text-xs text-foreground/60">{item.description}</Text>
              ) : null}
              {item.status === 'at_gate' ? (
                <Button label="Mark collected" variant="outline" onPress={() => collect(item.id)} />
              ) : null}
            </Card>
          )}
        />
      )}
    </ScreenScaffold>
  );
}
