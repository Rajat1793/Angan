// Directory, documents, and events data for the society.
import { supabase } from './supabase';

export interface DirectoryEntry {
  id: string;
  full_name: string | null;
  role: string;
  phone: string | null;
  flat: string | null;
}
export interface SocietyDocument {
  id: string;
  title: string;
  url: string;
  category: string | null;
  created_at: string;
}
export interface SocietyEvent {
  id: string;
  title: string;
  description: string | null;
  location: string | null;
  starts_at: string;
  going: number;
  rsvped: boolean;
}

// ---- Directory (reads profiles) ----
export async function listDirectory(): Promise<DirectoryEntry[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id, full_name, role, phone, flat:flats(number)')
    .order('full_name');
  if (error) throw error;
  return (data ?? []).map((p: any) => ({
    id: p.id,
    full_name: p.full_name,
    role: p.role,
    phone: p.phone,
    flat: p.flat?.number ?? null,
  }));
}

// ---- Documents ----
export async function listDocuments(): Promise<SocietyDocument[]> {
  const { data, error } = await supabase
    .from('documents')
    .select('id, title, url, category, created_at')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as SocietyDocument[];
}

export async function addDocument(
  societyId: string,
  uploadedBy: string,
  title: string,
  url: string,
  category: string,
) {
  const { error } = await supabase
    .from('documents')
    .insert({ society_id: societyId, uploaded_by: uploadedBy, title, url, category });
  if (error) throw error;
}

// ---- Events ----
export async function listEvents(userId: string): Promise<SocietyEvent[]> {
  const { data, error } = await supabase
    .from('events')
    .select('id, title, description, location, starts_at, event_rsvps(profile_id)')
    .order('starts_at', { ascending: true });
  if (error) throw error;
  return (data ?? []).map((e: any) => ({
    id: e.id,
    title: e.title,
    description: e.description,
    location: e.location,
    starts_at: e.starts_at,
    going: (e.event_rsvps ?? []).length,
    rsvped: (e.event_rsvps ?? []).some((r: any) => r.profile_id === userId),
  }));
}

export async function createEvent(
  societyId: string,
  createdBy: string,
  title: string,
  description: string,
  location: string,
  startsAt: string,
) {
  const { error } = await supabase.from('events').insert({
    society_id: societyId,
    created_by: createdBy,
    title,
    description: description || null,
    location: location || null,
    starts_at: startsAt,
  });
  if (error) throw error;
}

export async function toggleRsvp(
  societyId: string,
  eventId: string,
  userId: string,
  rsvped: boolean,
) {
  if (rsvped) {
    const { error } = await supabase
      .from('event_rsvps')
      .delete()
      .eq('event_id', eventId)
      .eq('profile_id', userId);
    if (error) throw error;
  } else {
    const { error } = await supabase
      .from('event_rsvps')
      .insert({ society_id: societyId, event_id: eventId, profile_id: userId });
    if (error) throw error;
  }
}
