// Resident services data: SOS alerts, frequent visitors, and vehicles.
import { supabase } from './supabase';

export interface SosAlert {
  id: string;
  message: string | null;
  status: 'active' | 'resolved';
  created_at: string;
}
export interface FrequentVisitor {
  id: string;
  name: string;
  phone: string | null;
  type: string;
}
export interface Vehicle {
  id: string;
  number: string;
  kind: string;
  make: string | null;
}

// ---- SOS ----
export async function raiseSos(
  societyId: string,
  profileId: string,
  flatId: string | null,
  message: string,
) {
  const { error } = await supabase.from('sos_alerts').insert({
    society_id: societyId,
    profile_id: profileId,
    flat_id: flatId,
    message: message || null,
  });
  if (error) throw error;
}

export async function listSos(): Promise<SosAlert[]> {
  const { data, error } = await supabase
    .from('sos_alerts')
    .select('id, message, status, created_at')
    .order('created_at', { ascending: false })
    .limit(50);
  if (error) throw error;
  return (data ?? []) as SosAlert[];
}

export async function resolveSos(id: string, resolvedBy: string) {
  const { error } = await supabase
    .from('sos_alerts')
    .update({ status: 'resolved', resolved_at: new Date().toISOString(), resolved_by: resolvedBy })
    .eq('id', id);
  if (error) throw error;
}

// ---- Frequent visitors ----
export async function listFrequent(): Promise<FrequentVisitor[]> {
  const { data, error } = await supabase
    .from('frequent_visitors')
    .select('id, name, phone, type')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as FrequentVisitor[];
}

export async function addFrequent(
  societyId: string,
  flatId: string | null,
  createdBy: string,
  name: string,
  phone: string,
  type: string,
) {
  const { error } = await supabase.from('frequent_visitors').insert({
    society_id: societyId,
    flat_id: flatId,
    created_by: createdBy,
    name,
    phone: phone || null,
    type,
  });
  if (error) throw error;
}

export async function removeFrequent(id: string) {
  const { error } = await supabase.from('frequent_visitors').delete().eq('id', id);
  if (error) throw error;
}

// ---- Vehicles ----
export async function listVehicles(): Promise<Vehicle[]> {
  const { data, error } = await supabase
    .from('vehicles')
    .select('id, number, kind, make')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Vehicle[];
}

export async function addVehicle(
  societyId: string,
  flatId: string | null,
  profileId: string,
  number: string,
  kind: string,
  make: string,
) {
  const { error } = await supabase.from('vehicles').insert({
    society_id: societyId,
    flat_id: flatId,
    profile_id: profileId,
    number,
    kind,
    make: make || null,
  });
  if (error) throw error;
}

export async function removeVehicle(id: string) {
  const { error } = await supabase.from('vehicles').delete().eq('id', id);
  if (error) throw error;
}
