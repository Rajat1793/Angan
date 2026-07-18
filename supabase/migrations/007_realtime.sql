-- 007_realtime.sql — enable Supabase Realtime for the tables the app subscribes to.
-- Without adding a table to the supabase_realtime publication, Postgres never
-- broadcasts row changes, so the guard app never hears a resident's approval.

-- Ensure the default Realtime publication exists (it does on hosted Supabase).
do $$
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    create publication supabase_realtime;
  end if;
end $$;

-- REPLICA IDENTITY FULL ships every column in change payloads so the
-- `society_id=eq.…` subscription filter matches on UPDATE and DELETE too.
alter table public.visitors replica identity full;
alter table public.ticket_comments replica identity full;

-- Add the subscribed tables to the publication (idempotent).
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'visitors'
  ) then
    alter publication supabase_realtime add table public.visitors;
  end if;

  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'ticket_comments'
  ) then
    alter publication supabase_realtime add table public.ticket_comments;
  end if;
end $$;
