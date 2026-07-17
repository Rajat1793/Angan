// Admin data: dashboard metrics, resident directory, and complaint triage.
import { supabase } from './supabase';
import type { Profile } from './database.types';

export interface DashboardStats {
  residents: number;
  open_complaints: number;
  visitors_inside: number;
  dues_collected: number;
}

// Headline metrics for the admin dashboard (society-scoped RPC).
export async function getDashboardStats(): Promise<DashboardStats> {
  const { data, error } = await supabase.rpc('dashboard_stats');
  if (error) throw error;
  return data as DashboardStats;
}

// Residents in the admin's society (RLS returns only same-society rows).
export async function listResidents(): Promise<Profile[]> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('role', 'resident')
    .order('full_name');
  if (error) throw error;
  return (data ?? []) as Profile[];
}

// Staff directory used for complaint assignment.
export async function listStaff() {
  const { data, error } = await supabase
    .from('staff')
    .select('id, name, role')
    .order('name');
  if (error) throw error;
  return data ?? [];
}
