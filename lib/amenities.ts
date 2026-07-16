// Amenities data: list amenities with slots, book atomically, cancel.
import { supabase } from './supabase';

export interface Slot {
  id: string;
  starts_at: string;
  ends_at: string;
  capacity: number;
  booked: number;
  mine: boolean;
}
export interface AmenityWithSlots {
  id: string;
  name: string;
  description: string | null;
  slots: Slot[];
}

// Fetch amenities joined with their slots, annotated with booking counts.
export async function listAmenities(userId: string): Promise<AmenityWithSlots[]> {
  const { data: amenities, error } = await supabase
    .from('amenities')
    .select('id, name, description, amenity_slots(id, starts_at, ends_at, capacity)')
    .order('name');
  if (error) throw error;

  const { data: bookings } = await supabase
    .from('bookings')
    .select('slot_id, profile_id');

  return (amenities ?? []).map((a: any) => ({
    id: a.id,
    name: a.name,
    description: a.description,
    slots: (a.amenity_slots ?? []).map((s: any) => {
      const slotBookings = (bookings ?? []).filter((b) => b.slot_id === s.id);
      return {
        id: s.id,
        starts_at: s.starts_at,
        ends_at: s.ends_at,
        capacity: s.capacity,
        booked: slotBookings.length,
        mine: slotBookings.some((b) => b.profile_id === userId),
      };
    }),
  }));
}

// Book via RPC so capacity is checked under a row lock (no double-booking).
export async function bookSlot(slotId: string) {
  const { error } = await supabase.rpc('book_slot', { p_slot_id: slotId });
  if (error) throw error;
}

// Cancel frees the slot; RLS ensures only the owner can delete.
export async function cancelBooking(slotId: string, userId: string) {
  const { error } = await supabase
    .from('bookings')
    .delete()
    .eq('slot_id', slotId)
    .eq('profile_id', userId);
  if (error) throw error;
}
