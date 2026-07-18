// FlatPicker: mandatory flat selector with a searchable full-screen modal.
// Shows every flat in the society (block+number, e.g. A-101) with a filter box.
import { Ionicons } from '@expo/vector-icons';
import { FlashList } from '@shopify/flash-list';
import { useMemo, useState } from 'react';
import { Modal, Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Input } from '@/components/ui';
import { useFlats } from '@/hooks/useFlats';

interface FlatPickerProps {
  societyId?: string | null;
  value: string;
  onChange: (flatId: string) => void;
  error?: string;
}

export function FlatPicker({ societyId, value, onChange, error }: FlatPickerProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const { data: flats, isLoading } = useFlats(societyId);

  const selected = useMemo(() => flats?.find((f) => f.id === value), [flats, value]);

  // Filter the flat list by its block/number label.
  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return flats ?? [];
    return (flats ?? []).filter((f) => f.number.toLowerCase().includes(q));
  }, [flats, query]);

  const pick = (flatId: string) => {
    onChange(flatId);
    setOpen(false);
    setQuery('');
  };

  return (
    <View className="gap-1">
      <Text className="text-sm font-medium text-foreground">Flat (destination)</Text>
      <Pressable
        onPress={() => setOpen(true)}
        className={`h-12 flex-row items-center justify-between rounded-xl border px-3 ${
          error ? 'border-red-500' : 'border-muted/20'
        }`}
      >
        <Text className={selected ? 'text-foreground' : 'text-foreground/40'}>
          {selected ? selected.number : 'Select flat (e.g. A-101)'}
        </Text>
        <Ionicons name="chevron-down" size={18} color="#6b7280" />
      </Pressable>
      {error ? <Text className="text-xs text-red-500">{error}</Text> : null}

      <Modal visible={open} animationType="slide" onRequestClose={() => setOpen(false)}>
        <SafeAreaView className="flex-1 bg-background">
          <View className="flex-row items-center justify-between px-5 pb-3 pt-2">
            <Text className="text-lg font-bold text-foreground">Select flat</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={12}>
              <Ionicons name="close" size={24} color="#6b7280" />
            </Pressable>
          </View>
          <View className="px-5 pb-2">
            <Input
              placeholder="Search flat number"
              autoFocus
              value={query}
              onChangeText={setQuery}
            />
          </View>
          {isLoading ? (
            <Text className="px-5 py-6 text-center text-foreground/50">Loading flats…</Text>
          ) : filtered.length === 0 ? (
            <Text className="px-5 py-6 text-center text-foreground/50">No matching flats</Text>
          ) : (
            <FlashList
              data={filtered}
              keyExtractor={(f) => f.id}
              contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 24 }}
              renderItem={({ item }) => {
                const active = item.id === value;
                return (
                  <Pressable
                    onPress={() => pick(item.id)}
                    className="flex-row items-center justify-between border-b border-muted/10 py-4"
                  >
                    <View className="flex-row items-center gap-3">
                      <Ionicons name="home-outline" size={18} color="#3E481D" />
                      <Text className="text-base font-medium text-foreground">{item.number}</Text>
                    </View>
                    {active ? (
                      <Ionicons name="checkmark-circle" size={20} color="#3E481D" />
                    ) : null}
                  </Pressable>
                );
              }}
            />
          )}
        </SafeAreaView>
      </Modal>
    </View>
  );
}
