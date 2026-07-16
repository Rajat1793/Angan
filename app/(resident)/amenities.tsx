// Resident amenities: browse slots, book (capacity-safe), or cancel.
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ScrollView, Text, View } from 'react-native';

import { Button, Card, ErrorState, Loading, useToast } from '@/components/ui';
import { ScreenScaffold } from '@/components/shared/ScreenScaffold';
import { bookSlot, cancelBooking, listAmenities } from '@/lib/amenities';
import { useAuthStore } from '@/store/auth.store';

export default function Amenities() {
  const profile = useAuthStore((s) => s.profile);
  const queryClient = useQueryClient();
  const toast = useToast((s) => s.show);

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
      toast('Booked', 'success');
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
          <Card key={a.id} className="gap-3">
            <View>
              <Text className="text-base font-semibold text-foreground">{a.name}</Text>
              {a.description ? (
                <Text className="text-sm text-foreground/60">{a.description}</Text>
              ) : null}
            </View>
            {a.slots.map((s) => {
              const full = s.booked >= s.capacity;
              return (
                <View
                  key={s.id}
                  className="flex-row items-center justify-between rounded-xl border border-muted/20 p-3"
                >
                  <View>
                    <Text className="text-sm text-foreground">
                      {new Date(s.starts_at).toLocaleString()}
                    </Text>
                    <Text className="text-xs text-foreground/50">
                      {s.booked}/{s.capacity} booked
                    </Text>
                  </View>
                  {s.mine ? (
                    <Button label="Cancel" variant="outline" onPress={() => cancel(s.id)} />
                  ) : (
                    <Button
                      label={full ? 'Full' : 'Book'}
                      disabled={full}
                      onPress={() => book(s.id)}
                    />
                  )}
                </View>
              );
            })}
          </Card>
        ))}
      </ScrollView>
    </ScreenScaffold>
  );
}
