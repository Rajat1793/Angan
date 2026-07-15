// Passes: resident pre-approval creation and guard verification.
import { supabase } from './supabase';
import type { Visitor } from './database.types';

// Generate a 6-digit OTP for manual entry by the guard.
function makeOtp(): string {
  return String(Math.floor(100000 + Math.random() * 900000));
}

// Generate an opaque pass code encoded into the QR.
function makePassCode(): string {
  return `ANG-${Math.random().toString(36).slice(2, 10).toUpperCase()}`;
}

// Resident pre-authorizes a guest: an approved visitor row with otp + pass.
export async function createPreApproval(
  name: string,
  societyId: string,
  flatId: string | null,
  createdBy: string,
): Promise<Visitor> {
  const { data, error } = await supabase
    .from('visitors')
    .insert({
      society_id: societyId,
      flat_id: flatId,
      name,
      type: 'guest',
      purpose: 'Pre-approved guest',
      status: 'approved',
      otp: makeOtp(),
      pass_code: makePassCode(),
      created_by: createdBy,
    })
    .select('*')
    .single();
  if (error) throw error;
  return data as Visitor;
}

// Guard verifies a scanned/entered code; RPC flips the pass to inside.
export async function verifyPass(code: string): Promise<Visitor> {
  const { data, error } = await supabase.rpc('verify_pass', { p_code: code });
  if (error) throw error;
  return data as Visitor;
}
