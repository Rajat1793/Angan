// Auth helpers: thin wrappers over Supabase Auth for password + email OTP.
import { supabase } from './supabase';
import type { Profile } from './database.types';

// Email + password sign-in used by seeded demo accounts.
export async function signInWithPassword(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data;
}

// Passwordless email OTP: request a code, then verify it.
export async function requestEmailOtp(email: string) {
  const { error } = await supabase.auth.signInWithOtp({ email });
  if (error) throw error;
}

export async function verifyEmailOtp(email: string, token: string) {
  const { data, error } = await supabase.auth.verifyOtp({
    email,
    token,
    type: 'email',
  });
  if (error) throw error;
  return data;
}

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
}

// Fetch the caller's profile row (role + society drive routing/RLS).
export async function fetchProfile(userId: string): Promise<Profile | null> {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();
  if (error) throw error;
  return data as Profile;
}

// Complete onboarding by setting name + flat on the profile.
export async function completeOnboarding(
  userId: string,
  fullName: string,
  flatId: string,
) {
  const { error } = await supabase
    .from('profiles')
    .update({ full_name: fullName, flat_id: flatId })
    .eq('id', userId);
  if (error) throw error;
}
