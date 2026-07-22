// Marketplace + move-request data.
import { supabase } from './supabase';

export interface Listing {
  id: string;
  title: string;
  description: string | null;
  price: number | null;
  category: string;
  status: string;
  author_id: string;
  author_name: string | null;
  created_at: string;
}
export interface MoveRequest {
  id: string;
  kind: string;
  move_date: string | null;
  note: string | null;
  status: string;
  created_at: string;
}

// ---- Marketplace ----
export async function listListings(): Promise<Listing[]> {
  const { data, error } = await supabase
    .from('listings')
    .select('id, title, description, price, category, status, author_id, created_at, author:profiles(full_name)')
    .eq('status', 'active')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []).map((l: any) => ({
    id: l.id,
    title: l.title,
    description: l.description,
    price: l.price,
    category: l.category,
    status: l.status,
    author_id: l.author_id,
    author_name: l.author?.full_name ?? null,
    created_at: l.created_at,
  }));
}

export async function createListing(
  societyId: string,
  authorId: string,
  title: string,
  description: string,
  price: number | null,
  category: string,
) {
  const { error } = await supabase.from('listings').insert({
    society_id: societyId,
    author_id: authorId,
    title,
    description: description || null,
    price,
    category,
  });
  if (error) throw error;
}

export async function markListingSold(id: string) {
  const { error } = await supabase.from('listings').update({ status: 'sold' }).eq('id', id);
  if (error) throw error;
}

// ---- Move requests ----
export async function listMoveRequests(): Promise<MoveRequest[]> {
  const { data, error } = await supabase
    .from('move_requests')
    .select('id, kind, move_date, note, status, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as MoveRequest[];
}

export async function createMoveRequest(
  societyId: string,
  flatId: string | null,
  profileId: string,
  kind: string,
  moveDate: string,
  note: string,
) {
  const { error } = await supabase.from('move_requests').insert({
    society_id: societyId,
    flat_id: flatId,
    profile_id: profileId,
    kind,
    move_date: moveDate || null,
    note: note || null,
  });
  if (error) throw error;
}

export async function setMoveStatus(id: string, status: string) {
  const { error } = await supabase.from('move_requests').update({ status }).eq('id', id);
  if (error) throw error;
}
