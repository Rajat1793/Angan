// send-push-notification: Edge Function that fans out Expo push messages.
// Invoked by DB triggers (visitor pending, notice publish) with a service role.
import { createClient } from 'jsr:@supabase/supabase-js@2';

interface PushRequest {
  // Either target explicit user ids or an entire society's residents.
  userIds?: string[];
  societyId?: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
}

Deno.serve(async (req) => {
  try {
    const payload = (await req.json()) as PushRequest;

    // Service-role client bypasses RLS to read tokens across the tenant.
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // Resolve recipient push tokens either by ids or by society.
    let query = supabase.from('profiles').select('expo_push_token');
    if (payload.userIds?.length) {
      query = query.in('id', payload.userIds);
    } else if (payload.societyId) {
      query = query.eq('society_id', payload.societyId).eq('role', 'resident');
    }
    const { data, error } = await query;
    if (error) throw error;

    const messages = (data ?? [])
      .filter((r) => r.expo_push_token)
      .map((r) => ({
        to: r.expo_push_token,
        sound: 'default',
        title: payload.title,
        body: payload.body,
        data: payload.data ?? {},
      }));

    // Nothing to send is a valid no-op.
    if (messages.length === 0) {
      return new Response(JSON.stringify({ sent: 0 }), {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Hand the batch to Expo's push service.
    const res = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(messages),
    });
    const result = await res.json();

    return new Response(JSON.stringify({ sent: messages.length, result }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
});
