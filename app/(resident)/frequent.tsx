// Resident frequent visitors: save regulars to invite quickly later.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, Empty, Input, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { addFrequent, listFrequent, removeFrequent } from '@/lib/services';
import { useAuthStore } from '@/store/auth.store';

const TYPES = ['guest', 'delivery', 'cab', 'service'];

export default function Frequent() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [type, setType] = useState('guest');
  const [saving, setSaving] = useState(false);

  const list = useQuery({ queryKey: ['frequent'], queryFn: listFrequent });

  const add = async () => {
    if (!profile?.society_id) return;
    if (name.trim().length < 2) return toast('Enter a name', 'info');
    setSaving(true);
    try {
      await addFrequent(profile.society_id, profile.flat_id, profile.id, name.trim(), phone.trim(), type);
      setName('');
      setPhone('');
      queryClient.invalidateQueries({ queryKey: ['frequent'] });
      toast('Saved', 'success');
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: string) => {
    try {
      await removeFrequent(id);
      queryClient.invalidateQueries({ queryKey: ['frequent'] });
    } catch (e) {
      toast((e as Error).message ?? 'Failed', 'error');
    }
  };

  return (
    <ScreenScaffold title="Frequent visitors" showBack>
      <ScrollView contentContainerClassName="gap-3 p-5">
        <Input label="Name" value={name} onChangeText={setName} />
        <Input label="Phone (optional)" keyboardType="phone-pad" value={phone} onChangeText={setPhone} />
        <View className="flex-row flex-wrap gap-2">
          {TYPES.map((t) => (
            <Pressable
              key={t}
              onPress={() => setType(t)}
              className={`rounded-full px-4 py-2 ${type === t ? 'bg-primary' : 'bg-muted/10'}`}
            >
              <Text className={`text-sm capitalize ${type === t ? 'text-background' : 'text-foreground'}`}>{t}</Text>
            </Pressable>
          ))}
        </View>
        <Button label="Save visitor" loading={saving} onPress={add} />

        {list.isLoading ? (
          <Loading />
        ) : (list.data ?? []).length === 0 ? (
          <Empty icon="people-outline" title="No saved visitors" hint="Save regulars to invite them faster." />
        ) : (
          (list.data ?? []).map((f) => (
            <Card key={f.id} className="flex-row items-center justify-between">
              <View>
                <Text className="text-base font-semibold text-foreground">{f.name}</Text>
                <Text className="text-xs capitalize text-foreground/50">
                  {f.type}
                  {f.phone ? ` · ${f.phone}` : ''}
                </Text>
              </View>
              <Pressable onPress={() => remove(f.id)} hitSlop={8}>
                <Ionicons name="trash-outline" size={18} color="#ef4444" />
              </Pressable>
            </Card>
          ))
        )}
      </ScrollView>
    </ScreenScaffold>
  );
}
