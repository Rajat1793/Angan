-- 003_triggers.sql — server-driven push on gate + notice events via pg_net.

-- pg_net ships with Supabase; enable it for outbound HTTP from Postgres.
create extension if not exists pg_net;

-- App settings hold the function URL + service key (set via `alter database`).
-- select set_config('app.functions_url', 'https://<ref>.functions.supabase.co', false);

-- Notify the visitor's resident when a pending request is created.
create or replace function notify_visitor_pending()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resident_ids uuid[];
begin
  if new.status <> 'pending' then
    return new;
  end if;

  -- Residents of the destination flat receive the approval prompt.
  select array_agg(id) into resident_ids
  from profiles
  where flat_id = new.flat_id and role = 'resident';

  perform net.http_post(
    url := current_setting('app.functions_url', true) || '/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_key', true)
    ),
    body := jsonb_build_object(
      'userIds', resident_ids,
      'title', 'Visitor at the gate',
      'body', new.name || ' — ' || coalesce(new.purpose, new.type::text),
      'data', jsonb_build_object('screen', 'approvals')
    )
  );
  return new;
end;
$$;

create trigger on_visitor_pending
after insert on visitors
for each row
execute function notify_visitor_pending();

-- Push a published notice to every resident in the society.
create or replace function notify_notice_published()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform net.http_post(
    url := current_setting('app.functions_url', true) || '/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_key', true)
    ),
    body := jsonb_build_object(
      'societyId', new.society_id,
      'title', 'New notice: ' || new.title,
      'body', coalesce(new.body, ''),
      'data', jsonb_build_object('screen', 'community')
    )
  );
  return new;
end;
$$;

create trigger on_notice_published
after insert on notices
for each row
execute function notify_notice_published();
