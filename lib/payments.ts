// Payments data: dues + history queries and Razorpay order/verify calls.
import { supabase } from './supabase';
import type { DueStatus } from './database.types';

export interface Due {
  id: string;
  period: string;
  amount: number;
  status: DueStatus;
}
export interface PaymentRecord {
  id: string;
  amount: number;
  created_at: string;
  razorpay_payment_id: string | null;
}

// Resident's dues, newest period first.
export async function listDues(): Promise<Due[]> {
  const { data, error } = await supabase
    .from('maintenance_dues')
    .select('id, period, amount, status')
    .order('period', { ascending: false });
  if (error) throw error;
  return (data ?? []) as Due[];
}

// Resident's settled payments for the history list.
export async function listPaymentHistory(): Promise<PaymentRecord[]> {
  const { data, error } = await supabase
    .from('payment_history')
    .select('id, amount, created_at, razorpay_payment_id')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return (data ?? []) as PaymentRecord[];
}

// Ask the Edge Function to create a Razorpay order for a due.
export async function createOrder(dueId: string) {
  const { data, error } = await supabase.functions.invoke('create-razorpay-order', {
    body: { dueId },
  });
  if (error) throw error;
  return data as { order: { id: string; amount: number }; keyId: string };
}

// Verify the payment signature server-side after checkout completes.
export async function verifyPayment(payload: {
  dueId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}) {
  const { data, error } = await supabase.functions.invoke('verify-razorpay-payment', {
    body: payload,
  });
  if (error) throw error;
  return data as { verified: boolean };
}

// Admin triggers bulk dues generation for a period.
export async function generateDues(period: string, amount: number) {
  const { data, error } = await supabase.rpc('generate_monthly_dues', {
    p_period: period,
    p_amount: amount,
  });
  if (error) throw error;
  return data as number;
}
