// Resident amenities: pick a time slot, then book (capacity-safe) or cancel.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { Button, Card, ErrorState, Loading, useSuccess, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { bookSlot, cancelBooking, listAmenities, type AmenityWithSlots } from '@/lib/amenities';
import { useAuthStore } from '@/store/auth.store';

// Compact "Mon, 2:00 PM" style label for a slot.
const slotLabel = (iso: string) =>
  new Date(iso).toLocaleString(undefined, {
    weekday: 'short',
    hour: 'numeric',
    minute: '2-digit',
  });

// One amenity with selectable time-slot chips + a book action.
function AmenityCard({
  amenity,
  onBook,
  onCancel,
}: {
  amenity: AmenityWithSlots;
  onBook: (slotId: string) => void;
  onCancel: (slotId: string) => void;
}) {
  const [selected, setSelected] = useState<string | null>(null);
  const mine = amenity.slots.find((s) => s.mine);

  return (
    <Card className="gap-3">
      <View>
        <Text className="text-base font-semibold text-foreground">{amenity.name}</Text>
        {amenity.description ? (
          <Text className="text-sm text-foreground/60">{amenity.description}</Text>
        ) : null}
      </View>

      {mine ? (
        <View className="flex-row items-center justify-between rounded-xl border border-primary/30 bg-primary/5 p-3">
          <View>
            <Text className="text-sm font-medium text-foreground">Booked</Text>
            <Text className="text-xs text-foreground/50">{slotLabel(mine.starts_at)}</Text>
          </View>
          <Button label="Cancel" variant="outline" onPress={() => onCancel(mine.id)} />
        </View>
      ) : amenity.slots.length === 0 ? (
        <Text className="text-sm text-foreground/50">No slots available.</Text>
      ) : (
        <>
          <Text className="text-xs font-medium uppercase tracking-wide text-foreground/40">
            Select a time slot
          </Text>
          <View className="flex-row flex-wrap gap-2">
            {amenity.slots.map((s) => {
              const full = s.booked >= s.capacity;
              const sel = selected === s.id;
              return (
                <Pressable
                  key={s.id}
                  disabled={full}
                  onPress={() => setSelected(s.id)}
                  className={`rounded-xl border px-3 py-2 ${
                    sel
                      ? 'border-primary bg-primary/10'
                      : full
                        ? 'border-muted/10 opacity-40'
                        : 'border-muted/20'
                  }`}
                >
                  <Text className="text-sm font-medium text-foreground">
                    {slotLabel(s.starts_at)}
                  </Text>
                  <Text className="text-xs text-foreground/50">
                    {s.booked}/{s.capacity}
                    {full ? ' · full' : ''}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Button
            label="Book selected slot"
            disabled={!selected}
            onPress={() => selected && onBook(selected)}
          />
        </>
      )}
    </Card>
  );
}

export default function Amenities() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);
  const celebrate = useSuccess((s) => s.celebrate);

  const amenities = useQuery({
    queryKey: ['amenities'],
    queryFn: () => listAmenities(profile!.id),
    enabled: !!profile,
  });

  // Book a slot; server enforces capacity so races can't overbook.
  const book = async (slotId: string) => {
    try {
      await bookSlot(slotId);
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      celebrate('Slot booked');
    } catch (e) {
      toast((e as Error).message ?? 'Slot is full', 'error');
    }
  };

  // Cancel my booking and free the slot.
  const cancel = async (slotId: string) => {
    if (!profile) return;
    try {
      await cancelBooking(slotId, profile.id);
      queryClient.invalidateQueries({ queryKey: ['amenities'] });
      toast('Cancelled', 'info');
    } catch (e) {
      toast((e as Error).message ?? 'Could not cancel', 'error');
    }
  };

  if (amenities.isLoading) return <Loading />;
  if (amenities.isError) return <ErrorState onRetry={amenities.refetch} />;

  return (
    <ScreenScaffold title="Amenities">
      <ScrollView contentContainerClassName="gap-4 p-5">
        {(amenities.data ?? []).map((a) => (
          <AmenityCard key={a.id} amenity={a} onBook={book} onCancel={cancel} />
        ))}
      </ScrollView>
    </ScreenScaffold>
  );
}
