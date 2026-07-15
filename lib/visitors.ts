// Visitor data access: gate-loop mutations and society-scoped queries.
import { supabase } from './supabase';
import type { Visitor, VisitorStatus } from './database.types';
import type { VisitorInput } from './validation';

// Guard registers a walk-up visitor as a pending request.
export async function createVisitor(
  input: VisitorInput & { society_id: string; flat_id?: string | null; photo_url?: string | null },
  createdBy: string,
): Promise<Visitor> {
  const { data, error } = await supabase
    .from('visitors')
    .insert({
      society_id: input.society_id,
      flat_id: input.flat_id ?? null,
      name: input.name,
      phone: input.phone,
      type: input.type,
      purpose: input.purpose,
      vehicle: input.vehicle ?? null,
      photo_url: input.photo_url ?? null,
      status: 'pending',
      created_by: createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Visitor;
}

// Resident decision on a pending request.
export async function setVisitorDecision(id: string, approved: boolean) {
  const { error } = await supabase
    .from('visitors')
    .update({ status: approved ? 'approved' : 'denied' })
    .eq('id', id);
  if (error) throw error;
}

// Guard marks physical entry; stamps entry time and flips to inside.
export async function markEntry(id: string) {
  const { error } = await supabase
    .from('visitors')
    .update({ status: 'inside', entry_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// Guard marks exit; stamps exit time and flips to exited.
export async function markExit(id: string) {
  const { error } = await supabase
    .from('visitors')
    .update({ status: 'exited', exit_at: new Date().toISOString() })
    .eq('id', id);
  if (error) throw error;
}

// List visitors by status buckets (used by gate queue, inside, history).
export async function listVisitors(statuses: VisitorStatus[]): Promise<Visitor[]> {
  const { data, error } = await supabase
    .from('visitors')
    .select('*')
    .in('status', statuses)
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Visitor[];
}
