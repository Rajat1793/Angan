-- 008_visitor_entered_notification.sql
-- Notify the visitor's resident(s) when a guard marks the visitor as entered.
-- Mirrors notify_visitor_pending (003_triggers.sql) but fires on the
-- transition into 'inside' instead of on insert.

create or replace function notify_visitor_entered()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  resident_ids uuid[];
  fn_url text := current_setting('app.functions_url', true);
begin
  -- Only fire on the transition into 'inside' (guard marked entry).
  if new.status <> 'inside' or old.status = 'inside' then
    return new;
  end if;

  -- Skip push when the function URL isn't configured (e.g. fresh project).
  if fn_url is null or fn_url = '' then
    return new;
  end if;

  -- Residents of the destination flat get the entry alert.
  select array_agg(id) into resident_ids
  from profiles
  where flat_id = new.flat_id and role = 'resident';

  perform net.http_post(
    url := fn_url || '/send-push-notification',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.service_key', true)
    ),
    body := jsonb_build_object(
      'userIds', resident_ids,
      'title', 'Visitor entered',
      'body', new.name || ' has entered the premises.',
      'data', jsonb_build_object('type', 'visitor_entered')
    )
  );
  return new;
end;
$$;

create or replace trigger on_visitor_entered
after update on visitors
for each row
execute function notify_visitor_entered();
