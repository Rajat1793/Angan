// Resident vehicles: register vehicles for the flat (guards can look them up).
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, Empty, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { addVehicle, listVehicles, removeVehicle } from '@/lib/services';
import { useAuthStore } from '@/store/auth.store';

const KINDS = ['car', 'bike', 'other'];

export default function Vehicles() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [number, setNumber] = useState('');
  const [make, setMake] = useState('');
  const [kind, setKind] = useState('car');
  const [saving, setSaving] = useState(false);

  const vehicles = useQuery({ queryKey: ['vehicles'], queryFn: listVehicles });

  const add = async () => {
    if (!profile?.society_id) return;
    if (number.trim().length < 3) return toast('Enter the vehicle number', 'info');
    setSaving(true);
    try {
      await addVehicle(profile.society_id, profile.flat_id, profile.id, number.trim().toUpperCase(), kind, make.trim());
      setNumber('');
      setMake('');
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
      toast('Vehicle added', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await removeVehicle(id);
      queryClient.invalidateQueries({ queryKey: ['vehicles'] });
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  return (
    <ScreenScaffold title="My vehicles" showBack>
      <ScrollView contentContainerClassName="gap-3 p-5">
        <Input label="Vehicle number" placeholder="MH12AB1234" value={number} onChangeText={setNumber} autoCapitalize="characters" />
        <Input label="Make / model (optional)" value={make} onChangeText={setMake} />
        <View className="flex-row gap-2">
          {KINDS.map((k) => (
            <Pressable
              key={k}
              onPress={() => setKind(k)}
              className={`rounded-full px-4 py-2 ${kind === k ? 'bg-primary' : 'bg-muted/10'}`}
            >
              <Text className={`text-sm capitalize ${kind === k ? 'text-background' : 'text-foreground'}`}>{k}</Text>
            </Pressable>
          ))}
        </View>
        <Button label="Add vehicle" loading={saving} onPress={add} />

        {vehicles.isLoading ? (
          <Loading />
        ) : (vehicles.data ?? []).length === 0 ? (
          <Empty title="No vehicles" hint="Add your car or bike above." />
        ) : (
          (vehicles.data ?? []).map((v) => (
            <Card key={v.id} className="flex-row items-center justify-between">
              <View className="flex-row items-center gap-3">
                <Ionicons name={v.kind === 'bike' ? 'bicycle' : 'car-sport'} size={20} color="#3E481D" />
                <View>
                  <Text className="text-base font-semibold text-foreground">{v.number}</Text>
                  {v.make ? <Text className="text-xs text-foreground/50">{v.make}</Text> : null}
                </View>
              </View>
              <Pressable onPress={() => remove(v.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}
