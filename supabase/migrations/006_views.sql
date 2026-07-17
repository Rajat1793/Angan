-- 006_views.sql — admin dashboard aggregates as a tenant-scoped RPC.

-- dashboard_stats: one row of headline metrics for the caller's society.
create or replace function dashboard_stats()
returns json
language sql
stable
security definer
set search_path = public
as $$
  select json_build_object(
    'residents', (
      select count(*) from profiles
      where society_id = auth_society_id() and role = 'resident'
    ),
    'open_complaints', (
      select count(*) from helpdesk_tickets
      where society_id = auth_society_id() and status in ('open', 'in_progress')
    ),
    'visitors_inside', (
      select count(*) from visitors
      where society_id = auth_society_id() and status = 'inside'
    ),
    'dues_collected', (
      select coalesce(sum(amount), 0) from payment_history
      where society_id = auth_society_id()
    )
  );
$$;
