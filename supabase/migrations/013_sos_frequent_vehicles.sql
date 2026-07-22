-- 013_sos_frequent_vehicles.sql — emergency SOS, frequent visitors, vehicles.

-- Emergency alerts raised by residents; guards/admins respond.
create table if not exists sos_alerts (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  flat_id uuid references flats (id) on delete set null,
  message text,
  status text not null default 'active',
  created_at timestamptz not null default now(),
  resolved_at timestamptz,
  resolved_by uuid references profiles (id) on delete set null
);

-- Saved frequent visitors a resident can re-invite quickly.
create table if not exists frequent_visitors (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  flat_id uuid references flats (id) on delete set null,
  created_by uuid not null references profiles (id) on delete cascade,
  name text not null,
  phone text,
  type text not null default 'guest',
  created_at timestamptz not null default now()
);

-- Vehicles registered to a flat.
create table if not exists vehicles (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  flat_id uuid references flats (id) on delete set null,
  profile_id uuid not null references profiles (id) on delete cascade,
  number text not null,
  kind text not null default 'car',
  make text,
  created_at timestamptz not null default now()
);

create index if not exists idx_sos_society_status on sos_alerts (society_id, status);
create index if not exists idx_frequent_flat on frequent_visitors (flat_id);
create index if not exists idx_vehicles_flat on vehicles (society_id, flat_id);

alter table sos_alerts enable row level security;
alter table frequent_visitors enable row level security;
alter table vehicles enable row level security;

-- SOS: residents raise their own; everyone in society reads; guard/admin resolve.
create policy sos_read on sos_alerts
  for select using (society_id = auth_society_id());
create policy sos_insert on sos_alerts
  for insert with check (society_id = auth_society_id() and profile_id = auth.uid());
create policy sos_update on sos_alerts
  for update using (
    society_id = auth_society_id()
    and (profile_id = auth.uid() or auth_role() in ('guard', 'admin'))
  );

-- Frequent visitors: a resident manages their own saved contacts.
create policy frequent_read on frequent_visitors
  for select using (society_id = auth_society_id());
create policy frequent_write on frequent_visitors
  for insert with check (society_id = auth_society_id() and created_by = auth.uid());
create policy frequent_delete on frequent_visitors
  for delete using (society_id = auth_society_id() and created_by = auth.uid());

-- Vehicles: readable in society (guard lookup); owner manages their own.
create policy vehicles_read on vehicles
  for select using (society_id = auth_society_id());
create policy vehicles_write on vehicles
  for insert with check (society_id = auth_society_id() and profile_id = auth.uid());
create policy vehicles_delete on vehicles
  for delete using (society_id = auth_society_id() and profile_id = auth.uid());

-- Realtime so guards see SOS alerts instantly.
alter table sos_alerts replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'sos_alerts'
  ) then
    alter publication supabase_realtime add table public.sos_alerts;
  end if;
end $$;

-- Push every guard + admin in the society when an SOS is raised.
create or replace function notify_sos()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  responder_ids uuid[];
  raiser text;
begin
  select array_agg(id) into responder_ids
  from profiles where society_id = new.society_id and role in ('guard', 'admin');
  select full_name into raiser from profiles where id = new.profile_id;
  perform app_notify(
    new.society_id, responder_ids,
    'SOS emergency',
    coalesce(raiser, 'A resident') || ' raised an emergency alert.',
    jsonb_build_object('type', 'sos')
  );
  return new;
end;
$$;

create or replace trigger on_sos_raised
after insert on sos_alerts
for each row execute function notify_sos();
