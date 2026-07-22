-- 012_staff_attendance_deliveries.sql — daily-help attendance + gate deliveries.

-- Attendance marked by the guard for society staff / daily help.
create table if not exists staff_attendance (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  staff_id uuid not null references staff (id) on delete cascade,
  day date not null default current_date,
  status text not null default 'present',
  check_in timestamptz,
  check_out timestamptz,
  marked_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  unique (staff_id, day)
);

-- Parcels/couriers held at the gate for a flat.
create table if not exists deliveries (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  flat_id uuid references flats (id) on delete set null,
  courier text not null,
  description text,
  photo_url text,
  status text not null default 'at_gate',
  created_by uuid references profiles (id) on delete set null,
  collected_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_staff_attendance_day on staff_attendance (society_id, day);
create index if not exists idx_deliveries_flat on deliveries (society_id, flat_id, status);

alter table staff_attendance enable row level security;
alter table deliveries enable row level security;

-- Attendance: readable in society; guards/admins record it.
create policy staff_attendance_read on staff_attendance
  for select using (society_id = auth_society_id());
create policy staff_attendance_write on staff_attendance
  for all using (society_id = auth_society_id() and auth_role() in ('guard', 'admin'))
  with check (society_id = auth_society_id() and auth_role() in ('guard', 'admin'));

-- Deliveries: readable in society; guards/admins log + update them.
create policy deliveries_read on deliveries
  for select using (society_id = auth_society_id());
create policy deliveries_write on deliveries
  for all using (society_id = auth_society_id() and auth_role() in ('guard', 'admin'))
  with check (society_id = auth_society_id() and auth_role() in ('guard', 'admin'));

-- Realtime so residents see parcels appear/clear live.
alter table deliveries replica identity full;
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'deliveries'
  ) then
    alter publication supabase_realtime add table public.deliveries;
  end if;
end $$;

-- Notify the flat's residents when a parcel is logged at the gate.
create or replace function notify_delivery()
returns trigger language plpgsql security definer set search_path = public as $$
declare resident_ids uuid[];
begin
  if new.flat_id is null then
    return new;
  end if;
  select array_agg(id) into resident_ids
  from profiles where flat_id = new.flat_id and role = 'resident';
  perform app_notify(
    new.society_id, resident_ids,
    'Parcel at the gate',
    new.courier || ' delivery is waiting for collection.',
    jsonb_build_object('type', 'delivery')
  );
  return new;
end;
$$;

create or replace trigger on_delivery_logged
after insert on deliveries
for each row execute function notify_delivery();

