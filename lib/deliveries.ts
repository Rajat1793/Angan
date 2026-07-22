// Deliveries data: gate parcels with per-flat scoping and a collect action.
import { supabase } from './supabase';

export interface Delivery {
  id: string;
  flat_id: string | null;
  courier: string;
  description: string | null;
  status: 'at_gate' | 'collected';
  created_at: string;
  collected_at: string | null;
}

// Deliveries visible to the caller (RLS scopes to the society).
export async function listDeliveries(): Promise<Delivery[]> {
  const { data, error } = await supabase
    .from('deliveries')
    .select('id, flat_id, courier, description, status, created_at, collected_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Delivery[];
}

// Guard logs a parcel held at the gate for a flat.
export async function logDelivery(
  societyId: string,
  flatId: string,
  courier: string,
  description: string,
  createdBy: string,
) {
  const { error } = await supabase.from('deliveries').insert({
    society_id: societyId,
    flat_id: flatId,
    courier,
    description: description || null,
    created_by: createdBy,
  });
  if (error) throw error;
}

// Mark a parcel as collected.
export async function markCollected(id: string) {
  const { error } = await supabase
    .from('deliveries')
    .update({ status: 'collected', collected_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}
