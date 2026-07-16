// verify-razorpay-payment: validates the payment signature server-side,
// then marks the due paid and writes payment history (service role).
import { createClient } from 'jsr:@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';

interface VerifyBody {
  dueId: string;
  orderId: string;
  paymentId: string;
  signature: string;
}

Deno.serve(async (req) => {
  try {
    const body = (await req.json()) as VerifyBody;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;

    // Recompute HMAC(order_id|payment_id) and compare to the client signature.
    const expected = createHmac('sha256', keySecret)
      .update(`${body.orderId}|${body.paymentId}`)
      .digest('hex');
    if (expected !== body.signature) {
      throw new Error('Signature verification failed');
    }

    // Service role writes the settlement atomically, bypassing RLS.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    const { data: due } = await supabase
      .from('maintenance_dues')
      .select('id, society_id, profile_id, amount')
      .eq('id', body.dueId)
      .single();
    if (!due) throw new Error('Due not found');

    await supabase
      .from('maintenance_dues')
      .update({ status: 'paid' })
      .eq('id', body.dueId);

    await supabase.from('payment_history').insert({
      society_id: due.society_id,
      due_id: due.id,
      profile_id: due.profile_id,
      amount: due.amount,
      razorpay_payment_id: body.paymentId,
      razorpay_order_id: body.orderId,
    });

    return new Response(JSON.stringify({ verified: true }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ verified: false, error: String(e) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
