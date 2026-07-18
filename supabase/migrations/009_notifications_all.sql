-- 009_notifications_all.sql
-- Route every activity through one helper that BOTH persists an in-app
-- notification (drives the bell + unread badge) AND fans out an Expo push.
-- Also enable Realtime on notifications so the bell updates live.

-- Shared helper: insert a notification row per recipient + push (if configured).
create or replace function app_notify(
  p_society uuid,
  p_profiles uuid[],
  p_title text,
  p_body text,
  p_data jsonb default '{}'::jsonb
) returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  fn_url text := current_setting('app.functions_url', true);
begin
  if p_profiles is null or array_length(p_profiles, 1) is null then
    return;
  end if;

  -- Persist an in-app notification for each recipient (bell feed).
  insert into notifications (society_id, profile_id, title, body)
  select p_society, pid, p_title, p_body
  from unnest(p_profiles) as pid
  where pid is not null;

  -- Fan out a push when the edge function is configured.
  if fn_url is not null and fn_url <> '' then
    perform net.http_post(
      url := fn_url || '/send-push-notification',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.service_key', true)
      ),
      body := jsonb_build_object(
        'userIds', p_profiles,
        'title', p_title,
        'body', p_body,
        'data', p_data
      )
    );
  end if;
end;
$$;

-- Visitor created (pending) → notify the destination flat's residents.
create or replace function notify_visitor_pending()
returns trigger language plpgsql security definer set search_path = public as $$
declare resident_ids uuid[];
begin
  if new.status <> 'pending' then
    return new;
  end if;
  select array_agg(id) into resident_ids
  from profiles where flat_id = new.flat_id and role = 'resident';
  perform app_notify(
    new.society_id, resident_ids,
    'Visitor at the gate',
    new.name || ' — ' || coalesce(new.purpose, new.type::text),
    jsonb_build_object('type', 'visitor_pending', 'screen', 'approvals')
  );
  return new;
end;
$$;

-- Visitor status change → tailored alert for approved/denied/inside/exited.
create or replace function notify_visitor_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  resident_ids uuid[];
  v_title text;
  v_body text;
begin
  if new.status = old.status then
    return new;
  end if;

  case new.status
    when 'approved' then v_title := 'Visitor approved'; v_body := new.name || ' was approved for entry.';
    when 'denied'   then v_title := 'Visitor denied';   v_body := new.name || ' was denied entry.';
    when 'inside'   then v_title := 'Visitor entered';  v_body := new.name || ' has entered the premises.';
    when 'exited'   then v_title := 'Visitor exited';   v_body := new.name || ' has left the premises.';
    else return new;
  end case;

  select array_agg(id) into resident_ids
  from profiles where flat_id = new.flat_id and role = 'resident';
  perform app_notify(
    new.society_id, resident_ids, v_title, v_body,
    jsonb_build_object('type', 'visitor_' || new.status)
  );
  return new;
end;
$$;

-- Notice published → notify every resident in the society.
create or replace function notify_notice_published()
returns trigger language plpgsql security definer set search_path = public as $$
declare resident_ids uuid[];
begin
  select array_agg(id) into resident_ids
  from profiles where society_id = new.society_id and role = 'resident';
  perform app_notify(
    new.society_id, resident_ids,
    'New notice: ' || new.title,
    coalesce(new.body, ''),
    jsonb_build_object('type', 'notice', 'screen', 'community')
  );
  return new;
end;
$$;

-- Replace the standalone entry trigger from 008 with the unified status one.
drop trigger if exists on_visitor_entered on visitors;
drop function if exists notify_visitor_entered();
create or replace trigger on_visitor_status
after update on visitors
for each row execute function notify_visitor_status();

-- Realtime on notifications so the bell + badge update instantly.
alter table public.notifications replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'notifications'
  ) then
    alter publication supabase_realtime add table public.notifications;
  end if;
end $$;
