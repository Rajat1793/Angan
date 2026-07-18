// Flats data access: society-scoped flat directory for pickers.
import { supabase } from './supabase';

export interface Flat {
  id: string;
  number: string;
  tower_id: string;
}

// List all flats in a society, ordered by their block/number label (e.g. A-101).
export async function listFlats(societyId: string): Promise<Flat[]> {
  const { data, error } = await supabase
    .from('flats')
    .select('id, number, tower_id')
    .eq('society_id', societyId)
    .order('number', { ascending: true });
  if (error) throw error;
  return (data ?? []) as Flat[];
}
