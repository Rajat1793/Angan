// create-razorpay-order: creates a test-mode order for a maintenance due.
// Razorpay key secret stays in Edge Function secrets, never on the client.
import { createClient } from 'jsr:@supabase/supabase-js@2';

Deno.serve(async (req) => {
  try {
    const { dueId } = (await req.json()) as { dueId: string };
    const authHeader = req.headers.get('Authorization') ?? '';

    // Client scoped to the caller so RLS confirms they own the due.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } },
    );

    const { data: due, error } = await supabase
      .from('maintenance_dues')
      .select('id, amount, status')
      .eq('id', dueId)
      .single();
    if (error || !due) throw new Error('Due not found');
    if (due.status === 'paid') throw new Error('Already paid');

    // Amount is in paise for Razorpay.
    const keyId = Deno.env.get('RAZORPAY_KEY_ID')!;
    const keySecret = Deno.env.get('RAZORPAY_KEY_SECRET')!;
    const orderRes = await fetch('https://api.razorpay.com/v1/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Basic ${btoa(`${keyId}:${keySecret}`)}`,
      },
      body: JSON.stringify({
        amount: Math.round(Number(due.amount) * 100),
        currency: 'INR',
        receipt: `due_${due.id}`,
      }),
    });
    const order = await orderRes.json();

    return new Response(JSON.stringify({ order, keyId }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
