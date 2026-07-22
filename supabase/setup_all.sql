-- Angan full setup: run once in the Supabase SQL Editor.
create extension if not exists pgcrypto;

-- ================= 001_schema =================
-- 001_schema.sql — Angan core schema; every tenant table carries society_id.

-- Enums used across the domain.
create type user_role as enum ('resident', 'guard', 'admin');
create type visitor_status as enum ('pending', 'approved', 'denied', 'inside', 'exited');
create type visitor_type as enum ('delivery', 'cab', 'guest', 'service');
create type ticket_status as enum ('open', 'in_progress', 'resolved', 'closed');
create type due_status as enum ('pending', 'paid', 'overdue');

-- Society: the isolation boundary for all data.
create table societies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  address text,
  created_at timestamptz not null default now()
);

-- Towers belong to a society.
create table towers (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  name text not null,
  created_at timestamptz not null default now()
);

-- Flats belong to a tower (and carry society_id for direct RLS checks).
create table flats (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  tower_id uuid not null references towers (id) on delete cascade,
  number text not null,
  created_at timestamptz not null default now()
);

-- Profiles extend auth.users; role + society_id drive RLS everywhere.
create table profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  society_id uuid references societies (id) on delete set null,
  flat_id uuid references flats (id) on delete set null,
  role user_role not null default 'resident',
  full_name text,
  phone text,
  expo_push_token text,
  created_at timestamptz not null default now()
);

-- Visitors: the gate loop's central table.
create table visitors (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  flat_id uuid references flats (id) on delete set null,
  name text not null,
  phone text,
  type visitor_type not null default 'guest',
  purpose text,
  vehicle text,
  photo_url text,
  status visitor_status not null default 'pending',
  otp text,
  pass_code text,
  entry_at timestamptz,
  exit_at timestamptz,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

-- Helpdesk tickets raised by residents.
create table helpdesk_tickets (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  raised_by uuid not null references profiles (id) on delete cascade,
  assigned_to uuid references profiles (id) on delete set null,
  title text not null,
  description text,
  photo_url text,
  status ticket_status not null default 'open',
  created_at timestamptz not null default now()
);

-- Threaded comments on a ticket.
create table ticket_comments (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  ticket_id uuid not null references helpdesk_tickets (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- Amenities and their bookable slots.
create table amenities (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  name text not null,
  description text,
  created_at timestamptz not null default now()
);

create table amenity_slots (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  amenity_id uuid not null references amenities (id) on delete cascade,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  capacity int not null default 1,
  created_at timestamptz not null default now()
);

create table bookings (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  slot_id uuid not null references amenity_slots (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- One booking per resident per slot prevents accidental doubles.
  unique (slot_id, profile_id)
);

-- Community: notices, polls, staff, notifications.
create table notices (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  title text not null,
  body text,
  category text default 'general',
  pinned boolean not null default false,
  created_at timestamptz not null default now()
);

create table polls (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  author_id uuid references profiles (id) on delete set null,
  question text not null,
  closes_at timestamptz,
  created_at timestamptz not null default now()
);

create table poll_options (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  poll_id uuid not null references polls (id) on delete cascade,
  label text not null
);

create table poll_votes (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  poll_id uuid not null references polls (id) on delete cascade,
  option_id uuid not null references poll_options (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  -- Enforce one vote per resident per poll.
  unique (poll_id, profile_id)
);

create table staff (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  name text not null,
  role text,
  phone text,
  created_at timestamptz not null default now()
);

create table notifications (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  body text,
  read boolean not null default false,
  created_at timestamptz not null default now()
);

-- Indexes on the isolation column + hot lookups.
create index idx_towers_society on towers (society_id);
create index idx_flats_society on flats (society_id);
create index idx_profiles_society on profiles (society_id);
create index idx_visitors_society_status on visitors (society_id, status);
create index idx_visitors_flat on visitors (flat_id);
create index idx_tickets_society_status on helpdesk_tickets (society_id, status);
create index idx_bookings_slot on bookings (slot_id);
create index idx_notices_society on notices (society_id, pinned, created_at desc);
create index idx_notifications_profile on notifications (profile_id, read);

-- ================= 002_rls =================
-- 002_rls.sql — Row Level Security; deny by default, society_id is the boundary.

-- SECURITY DEFINER helpers resolve the caller's society and role once.
create or replace function auth_society_id()
returns uuid
language sql
stable
security definer
set search_path = public
as $$
  select society_id from profiles where id = auth.uid();
$$;

create or replace function auth_role()
returns user_role
language sql
stable
security definer
set search_path = public
as $$
  select role from profiles where id = auth.uid();
$$;

-- Auto-create a profile row when a new auth user signs up.
create or replace function handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, role)
  values (new.id, new.raw_user_meta_data ->> 'full_name', 'resident');
  return new;
end;
$$;

create trigger on_auth_user_created
after insert on auth.users
for each row
execute function handle_new_user();

-- Enable RLS on every table (default-deny until policies grant access).
alter table societies enable row level security;
alter table towers enable row level security;
alter table flats enable row level security;
alter table profiles enable row level security;
alter table visitors enable row level security;
alter table helpdesk_tickets enable row level security;
alter table ticket_comments enable row level security;
alter table amenities enable row level security;
alter table amenity_slots enable row level security;
alter table bookings enable row level security;
alter table notices enable row level security;
alter table polls enable row level security;
alter table poll_options enable row level security;
alter table poll_votes enable row level security;
alter table staff enable row level security;
alter table notifications enable row level security;

-- Societies: members can read their own society; only admins can update it.
create policy society_read on societies
  for select using (id = auth_society_id());
create policy society_admin_write on societies
  for update using (id = auth_society_id() and auth_role() = 'admin');

-- Towers/flats: readable within society; writable by admins only.
create policy towers_read on towers
  for select using (society_id = auth_society_id());
create policy towers_admin on towers
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

create policy flats_read on flats
  for select using (society_id = auth_society_id());
create policy flats_admin on flats
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

-- Profiles: a user reads their own row; admins read the whole society.
create policy profiles_self_read on profiles
  for select using (id = auth.uid() or society_id = auth_society_id());
create policy profiles_self_update on profiles
  for update using (id = auth.uid());
create policy profiles_admin on profiles
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

-- Visitors: residents see their flat's rows; guards/admins see the society.
create policy visitors_read on visitors
  for select using (
    society_id = auth_society_id()
    and (
      auth_role() in ('guard', 'admin')
      or flat_id = (select flat_id from profiles where id = auth.uid())
    )
  );
-- Guards create and update visitor rows; residents update only their approvals.
create policy visitors_guard_write on visitors
  for insert with check (
    society_id = auth_society_id() and auth_role() in ('guard', 'resident')
  );
create policy visitors_update on visitors
  for update using (
    society_id = auth_society_id()
    and (
      auth_role() in ('guard', 'admin')
      or flat_id = (select flat_id from profiles where id = auth.uid())
    )
  );

-- Helpdesk: residents manage their own tickets; admins see all in society.
create policy tickets_read on helpdesk_tickets
  for select using (
    society_id = auth_society_id()
    and (raised_by = auth.uid() or auth_role() = 'admin')
  );
create policy tickets_insert on helpdesk_tickets
  for insert with check (society_id = auth_society_id() and raised_by = auth.uid());
create policy tickets_update on helpdesk_tickets
  for update using (
    society_id = auth_society_id()
    and (raised_by = auth.uid() or auth_role() = 'admin')
  );

create policy comments_read on ticket_comments
  for select using (society_id = auth_society_id());
create policy comments_insert on ticket_comments
  for insert with check (society_id = auth_society_id() and author_id = auth.uid());

-- Amenities/slots readable in society; admin-managed.
create policy amenities_read on amenities
  for select using (society_id = auth_society_id());
create policy amenities_admin on amenities
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

create policy slots_read on amenity_slots
  for select using (society_id = auth_society_id());
create policy slots_admin on amenity_slots
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

-- Bookings: a resident manages only their own bookings.
create policy bookings_read on bookings
  for select using (society_id = auth_society_id());
create policy bookings_write on bookings
  for insert with check (society_id = auth_society_id() and profile_id = auth.uid());
create policy bookings_delete on bookings
  for delete using (society_id = auth_society_id() and profile_id = auth.uid());

-- Community reads scoped to society; writes are admin-only where relevant.
create policy notices_read on notices
  for select using (society_id = auth_society_id());
create policy notices_admin on notices
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

create policy polls_read on polls
  for select using (society_id = auth_society_id());
create policy polls_admin on polls
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

create policy poll_options_read on poll_options
  for select using (society_id = auth_society_id());
create policy poll_options_admin on poll_options
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

-- Votes: a resident casts and reads within society; one vote enforced by schema.
create policy votes_read on poll_votes
  for select using (society_id = auth_society_id());
create policy votes_insert on poll_votes
  for insert with check (society_id = auth_society_id() and profile_id = auth.uid());

create policy staff_read on staff
  for select using (society_id = auth_society_id());
create policy staff_admin on staff
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

-- Notifications belong to a single recipient.
create policy notifications_read on notifications
  for select using (profile_id = auth.uid());
create policy notifications_update on notifications
  for update using (profile_id = auth.uid());

-- ================= 003_triggers =================
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
  fn_url text := current_setting('app.functions_url', true);
begin
  if new.status <> 'pending' then
    return new;
  end if;

  -- Skip push when the function URL isn't configured (e.g. fresh project).
  if fn_url is null or fn_url = '' then
    return new;
  end if;

  -- Residents of the destination flat receive the approval prompt.
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
declare
  fn_url text := current_setting('app.functions_url', true);
begin
  -- Skip push when the function URL isn't configured (e.g. fresh project).
  if fn_url is null or fn_url = '' then
    return new;
  end if;

  perform net.http_post(
    url := fn_url || '/send-push-notification',
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

-- ================= 004_rpc =================
-- 004_rpc.sql — server-side RPCs for pass verification and safe booking.

-- verify_pass: guard redeems a pre-approved guest pass by code or OTP (re-checks society).
create or replace function verify_pass(p_code text)
returns visitors
language plpgsql
security definer
set search_path = public
as $$
declare
  v visitors;
begin
  -- Match an approved, unused pass in the guard's own society.
  select * into v
  from visitors
  where society_id = auth_society_id()
    and status = 'approved'
    and (pass_code = p_code or otp = p_code);

  if not found then
    raise exception 'Invalid, expired, or already-used pass';
  end if;

  -- Redeem: flip to inside and stamp the entry time.
  update visitors
  set status = 'inside', entry_at = now()
  where id = v.id
  returning * into v;

  return v;
end;
$$;

-- book_slot: atomic booking that respects slot capacity (no double-booking).
create or replace function book_slot(p_slot_id uuid)
returns bookings
language plpgsql
security definer
set search_path = public
as $$
declare
  b bookings;
  s amenity_slots;
  taken int;
begin
  -- Lock the slot row so concurrent bookings serialize.
  select * into s from amenity_slots where id = p_slot_id for update;
  if not found then
    raise exception 'Slot not found';
  end if;
  if s.society_id <> auth_society_id() then
    raise exception 'Slot not in your society';
  end if;

  select count(*) into taken from bookings where slot_id = p_slot_id;
  if taken >= s.capacity then
    raise exception 'Slot is full';
  end if;

  insert into bookings (society_id, slot_id, profile_id)
  values (s.society_id, p_slot_id, auth.uid())
  returning * into b;
  return b;
end;
$$;

-- ================= 005_payments =================
-- 005_payments.sql — maintenance dues, payment history, and bulk generation.

create table maintenance_dues (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  flat_id uuid not null references flats (id) on delete cascade,
  profile_id uuid references profiles (id) on delete set null,
  period text not null, -- e.g. '2026-07'
  amount numeric(10, 2) not null,
  status due_status not null default 'pending',
  created_at timestamptz not null default now(),
  unique (flat_id, period)
);

create table payment_history (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  due_id uuid references maintenance_dues (id) on delete set null,
  profile_id uuid references profiles (id) on delete set null,
  amount numeric(10, 2) not null,
  razorpay_payment_id text,
  razorpay_order_id text,
  created_at timestamptz not null default now()
);

create index idx_dues_profile on maintenance_dues (profile_id, status);
create index idx_payments_society on payment_history (society_id);

alter table maintenance_dues enable row level security;
alter table payment_history enable row level security;

-- Residents see their own dues; admins see the whole society.
create policy dues_read on maintenance_dues
  for select using (
    society_id = auth_society_id()
    and (profile_id = auth.uid() or auth_role() = 'admin')
  );
create policy dues_admin on maintenance_dues
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

-- Payment history: resident sees own; admin sees society.
create policy payments_read on payment_history
  for select using (
    society_id = auth_society_id()
    and (profile_id = auth.uid() or auth_role() = 'admin')
  );
-- Rows are written by the verify Edge Function (service role bypasses RLS).

-- Admin bulk-generates dues for the current period for every occupied flat.
create or replace function generate_monthly_dues(p_period text, p_amount numeric)
returns int
language plpgsql
security definer
set search_path = public
as $$
declare
  inserted int;
begin
  if auth_role() <> 'admin' then
    raise exception 'Only admins can generate dues';
  end if;

  insert into maintenance_dues (society_id, flat_id, profile_id, period, amount)
  select auth_society_id(), p.flat_id, p.id, p_period, p_amount
  from profiles p
  where p.society_id = auth_society_id()
    and p.role = 'resident'
    and p.flat_id is not null
  on conflict (flat_id, period) do nothing;

  get diagnostics inserted = row_count;
  return inserted;
end;
$$;

-- ================= 006_views =================
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

-- ================= seed =================
-- seed.sql — richly populated demo data for Angan (>=10 rows per table).
-- Idempotent: clears prior demo data first, so it is safe to re-run.

-- Wipe previous demo state (auth cascade removes profiles; society cascade the rest).
delete from auth.users where email like '%@angan.app';
delete from societies;

-- Societies (10) -----------------------------------------------------------
insert into societies (id, name, address) values
  ('11111111-1111-1111-1111-111111111111', 'Angan Greens', '42 Palm Avenue'),
  ('11111111-0000-0000-0000-000000000002', 'Riverside Court', '9 River Road'),
  ('11111111-0000-0000-0000-000000000003', 'Hilltop Residency', '5 Ridge Lane'),
  ('11111111-0000-0000-0000-000000000004', 'Lake View Homes', '21 Marina Blvd'),
  ('11111111-0000-0000-0000-000000000005', 'Sunrise Enclave', '8 Dawn Street'),
  ('11111111-0000-0000-0000-000000000006', 'Maple Woods', '77 Maple Drive'),
  ('11111111-0000-0000-0000-000000000007', 'Orchid Towers', '3 Bloom Road'),
  ('11111111-0000-0000-0000-000000000008', 'Cedar Heights', '14 Cedar Court'),
  ('11111111-0000-0000-0000-000000000009', 'Willow Park', '60 Willow Way'),
  ('11111111-0000-0000-0000-000000000010', 'Emerald Bay', '2 Coral Street');

-- Towers (13): four in Angan Greens, one in each other society ---------------
insert into towers (id, society_id, name) values
  ('22222222-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Tower A'),
  ('22222222-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Tower B'),
  ('22222222-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Tower C'),
  ('22222222-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Tower D'),
  ('22222222-0000-0000-0000-000000000005', '11111111-0000-0000-0000-000000000002', 'Tower A'),
  ('22222222-0000-0000-0000-000000000006', '11111111-0000-0000-0000-000000000003', 'Tower A'),
  ('22222222-0000-0000-0000-000000000007', '11111111-0000-0000-0000-000000000004', 'Tower A'),
  ('22222222-0000-0000-0000-000000000008', '11111111-0000-0000-0000-000000000005', 'Tower A'),
  ('22222222-0000-0000-0000-000000000009', '11111111-0000-0000-0000-000000000006', 'Tower A'),
  ('22222222-0000-0000-0000-000000000010', '11111111-0000-0000-0000-000000000007', 'Tower A'),
  ('22222222-0000-0000-0000-000000000011', '11111111-0000-0000-0000-000000000008', 'Tower A'),
  ('22222222-0000-0000-0000-000000000012', '11111111-0000-0000-0000-000000000009', 'Tower A'),
  ('22222222-0000-0000-0000-000000000013', '11111111-0000-0000-0000-000000000010', 'Tower A');

-- Flats (12) in Angan Greens across its four towers -------------------------
insert into flats (id, society_id, tower_id, number) values
  ('33333333-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'A-101'),
  ('33333333-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'A-102'),
  ('33333333-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'A-201'),
  ('33333333-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'B-101'),
  ('33333333-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'B-102'),
  ('33333333-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'B-201'),
  ('33333333-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000003', 'C-101'),
  ('33333333-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000003', 'C-102'),
  ('33333333-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000003', 'C-201'),
  ('33333333-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000004', 'D-101'),
  ('33333333-0000-0000-0000-000000000011', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000004', 'D-102'),
  ('33333333-0000-0000-0000-000000000012', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000004', 'D-201');

-- Demo auth users (12): passwords all "Demo@1234". Token cols must be '' -----
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
  raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
  confirmation_token, recovery_token, email_change, email_change_token_new, reauthentication_token
)
select
  '00000000-0000-0000-0000-000000000000', u.id::uuid, 'authenticated', 'authenticated',
  u.email, crypt('Demo@1234', gen_salt('bf')), now(),
  '{"provider":"email","providers":["email"]}', jsonb_build_object('full_name', u.name),
  now(), now(), '', '', '', '', ''
from (values
  ('44444444-0000-0000-0000-000000000001', 'resident@angan.app', 'Riya Resident'),
  ('44444444-0000-0000-0000-000000000002', 'guard@angan.app', 'Gopal Guard'),
  ('44444444-0000-0000-0000-000000000003', 'admin@angan.app', 'Asha Admin'),
  ('44444444-0000-0000-0000-000000000004', 'resident2@angan.app', 'Vikram Rao'),
  ('44444444-0000-0000-0000-000000000005', 'resident3@angan.app', 'Neha Singh'),
  ('44444444-0000-0000-0000-000000000006', 'resident4@angan.app', 'Arjun Mehta'),
  ('44444444-0000-0000-0000-000000000007', 'resident5@angan.app', 'Priya Nair'),
  ('44444444-0000-0000-0000-000000000008', 'resident6@angan.app', 'Rohan Das'),
  ('44444444-0000-0000-0000-000000000009', 'resident7@angan.app', 'Sara Khan'),
  ('44444444-0000-0000-0000-000000000010', 'resident8@angan.app', 'Kabir Jain'),
  ('44444444-0000-0000-0000-000000000011', 'resident9@angan.app', 'Ananya Iyer'),
  ('44444444-0000-0000-0000-000000000012', 'resident10@angan.app', 'Dev Patel')
) as u(id, email, name);

-- Promote guard + admin (no flat) -------------------------------------------
update profiles set society_id = '11111111-1111-1111-1111-111111111111', role = 'guard', full_name = 'Gopal Guard'
  where id = '44444444-0000-0000-0000-000000000002';
update profiles set society_id = '11111111-1111-1111-1111-111111111111', role = 'admin', full_name = 'Asha Admin'
  where id = '44444444-0000-0000-0000-000000000003';

-- Assign the 10 residents to flats A-101 .. D-101 ---------------------------
update profiles p
set society_id = '11111111-1111-1111-1111-111111111111', role = 'resident',
    full_name = x.name, flat_id = x.flat::uuid, phone = x.phone
from (values
  ('44444444-0000-0000-0000-000000000001', 'Riya Resident', '33333333-0000-0000-0000-000000000001', '9800000101'),
  ('44444444-0000-0000-0000-000000000004', 'Vikram Rao',    '33333333-0000-0000-0000-000000000002', '9800000102'),
  ('44444444-0000-0000-0000-000000000005', 'Neha Singh',    '33333333-0000-0000-0000-000000000003', '9800000103'),
  ('44444444-0000-0000-0000-000000000006', 'Arjun Mehta',   '33333333-0000-0000-0000-000000000004', '9800000104'),
  ('44444444-0000-0000-0000-000000000007', 'Priya Nair',    '33333333-0000-0000-0000-000000000005', '9800000105'),
  ('44444444-0000-0000-0000-000000000008', 'Rohan Das',     '33333333-0000-0000-0000-000000000006', '9800000106'),
  ('44444444-0000-0000-0000-000000000009', 'Sara Khan',     '33333333-0000-0000-0000-000000000007', '9800000107'),
  ('44444444-0000-0000-0000-000000000010', 'Kabir Jain',    '33333333-0000-0000-0000-000000000008', '9800000108'),
  ('44444444-0000-0000-0000-000000000011', 'Ananya Iyer',   '33333333-0000-0000-0000-000000000009', '9800000109'),
  ('44444444-0000-0000-0000-000000000012', 'Dev Patel',     '33333333-0000-0000-0000-000000000010', '9800000110')
) as x(id, name, flat, phone)
where p.id = x.id::uuid;

-- Visitors (12) with a spread of statuses ------------------------------------
insert into visitors (society_id, flat_id, name, phone, type, purpose, status, created_by, entry_at, exit_at) values
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000001', 'Amazon Courier', '9811000001', 'delivery', 'Parcel delivery', 'pending', '44444444-0000-0000-0000-000000000002', null, null),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000002', 'Flipkart Courier', '9811000002', 'delivery', 'Parcel delivery', 'approved', '44444444-0000-0000-0000-000000000002', null, null),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000003', 'Ola Cab', '9811000003', 'cab', 'Pickup', 'inside', '44444444-0000-0000-0000-000000000002', now() - interval '30 min', null),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000004', 'Uber Cab', '9811000004', 'cab', 'Drop', 'exited', '44444444-0000-0000-0000-000000000002', now() - interval '3 hour', now() - interval '2 hour'),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000005', 'Rahul (Guest)', '9811000005', 'guest', 'Family visit', 'inside', '44444444-0000-0000-0000-000000000002', now() - interval '1 hour', null),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000006', 'Plumber Ramesh', '9811000006', 'service', 'Tap repair', 'exited', '44444444-0000-0000-0000-000000000002', now() - interval '5 hour', now() - interval '4 hour'),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000007', 'Swiggy Delivery', '9811000007', 'delivery', 'Food', 'denied', '44444444-0000-0000-0000-000000000002', null, null),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000008', 'Zomato Delivery', '9811000008', 'delivery', 'Food', 'pending', '44444444-0000-0000-0000-000000000002', null, null),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000009', 'Meera (Guest)', '9811000009', 'guest', 'Weekend visit', 'approved', '44444444-0000-0000-0000-000000000002', null, null),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000010', 'Electrician Suresh', '9811000010', 'service', 'Wiring check', 'inside', '44444444-0000-0000-0000-000000000002', now() - interval '20 min', null),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000001', 'BigBasket', '9811000011', 'delivery', 'Groceries', 'exited', '44444444-0000-0000-0000-000000000002', now() - interval '6 hour', now() - interval '5 hour'),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000002', 'Cousin Aditya', '9811000012', 'guest', 'Dinner', 'pending', '44444444-0000-0000-0000-000000000002', null, null);

-- Staff (10) ----------------------------------------------------------------
insert into staff (society_id, name, role, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Ramesh', 'Plumber', '9822000001'),
  ('11111111-1111-1111-1111-111111111111', 'Suresh', 'Electrician', '9822000002'),
  ('11111111-1111-1111-1111-111111111111', 'Mahesh', 'Carpenter', '9822000003'),
  ('11111111-1111-1111-1111-111111111111', 'Lakshmi', 'Housekeeping', '9822000004'),
  ('11111111-1111-1111-1111-111111111111', 'Ganesh', 'Gardener', '9822000005'),
  ('11111111-1111-1111-1111-111111111111', 'Farah', 'Facility Manager', '9822000006'),
  ('11111111-1111-1111-1111-111111111111', 'Imran', 'Security Supervisor', '9822000007'),
  ('11111111-1111-1111-1111-111111111111', 'Kavya', 'Accountant', '9822000008'),
  ('11111111-1111-1111-1111-111111111111', 'Naveen', 'Painter', '9822000009'),
  ('11111111-1111-1111-1111-111111111111', 'Divya', 'Front Desk', '9822000010');

-- Helpdesk tickets (10) ------------------------------------------------------
insert into helpdesk_tickets (id, society_id, raised_by, assigned_to, title, description, status) values
  ('77777777-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000003', 'Leaking tap in kitchen', 'Continuous drip since morning.', 'open'),
  ('77777777-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000003', 'Lift not working in Tower B', 'Stuck on 2nd floor.', 'in_progress'),
  ('77777777-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000005', null, 'Street light out', 'Near parking lot B.', 'open'),
  ('77777777-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000003', 'Garbage not collected', 'Missed pickup on Tuesday.', 'resolved'),
  ('77777777-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000007', null, 'Water pressure low', 'Weak flow on 2nd floor.', 'open'),
  ('77777777-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000008', '44444444-0000-0000-0000-000000000003', 'Intercom not working', 'No dial tone.', 'in_progress'),
  ('77777777-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000009', null, 'Parking dispute', 'Someone parked in my slot.', 'open'),
  ('77777777-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000010', '44444444-0000-0000-0000-000000000003', 'Pest control request', 'Ants in the kitchen.', 'closed'),
  ('77777777-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000011', null, 'Gym equipment broken', 'Treadmill belt torn.', 'open'),
  ('77777777-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000012', '44444444-0000-0000-0000-000000000003', 'Noise complaint', 'Loud music after 11pm.', 'resolved');

-- Ticket comments (10) -------------------------------------------------------
insert into ticket_comments (society_id, ticket_id, author_id, body) values
  ('11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000003', 'Assigned to plumber, will visit today.'),
  ('11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', 'Thank you, please come after 5pm.'),
  ('11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000003', 'Technician called, ETA 2 hours.'),
  ('11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000004', 'Still stuck, please hurry.'),
  ('11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000006', 'Collected now, thanks.'),
  ('11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000003', 'Ordered a replacement handset.'),
  ('11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000008', '44444444-0000-0000-0000-000000000010', 'Pest control done, issue closed.'),
  ('11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000010', '44444444-0000-0000-0000-000000000003', 'Spoke to the resident, resolved.'),
  ('11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000005', 'Still dark, please prioritize.'),
  ('11111111-1111-1111-1111-111111111111', '77777777-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000007', 'Happens every evening.');

-- Notices (10) --------------------------------------------------------------
insert into notices (society_id, author_id, title, body, category, pinned) values
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Water tank cleaning', 'Supply off Sunday 10am-1pm.', 'maintenance', true),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Diwali celebration', 'Cultural evening in the clubhouse on Nov 1.', 'events', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Fire drill', 'Mandatory fire drill on Saturday 9am.', 'safety', true),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Lift maintenance', 'Tower B lift under service on Friday.', 'maintenance', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'AGM notice', 'Annual general meeting on the 15th.', 'general', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Pest control', 'Common areas fogging on Wednesday.', 'maintenance', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'New gym timings', 'Gym now open 5am-11pm.', 'general', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Visitor parking', 'Please register visitor vehicles at the gate.', 'general', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Holi guidelines', 'Use only eco-friendly colours.', 'events', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Rainwater harvesting', 'New system commissioned this month.', 'general', false);

-- Polls (10) + two options each ---------------------------------------------
insert into polls (id, society_id, author_id, question, closes_at) values
  ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Preferred gym timing?', now() + interval '7 days'),
  ('55555555-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Repaint the lobby?', now() + interval '7 days'),
  ('55555555-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Add EV charging?', now() + interval '7 days'),
  ('55555555-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Weekend pool hours?', now() + interval '7 days'),
  ('55555555-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'New security vendor?', now() + interval '7 days'),
  ('55555555-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Community composting?', now() + interval '7 days'),
  ('55555555-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Festival budget increase?', now() + interval '7 days'),
  ('55555555-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Ban firecrackers?', now() + interval '7 days'),
  ('55555555-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Install solar panels?', now() + interval '7 days'),
  ('55555555-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Pet-friendly park zone?', now() + interval '7 days');

-- Two options per poll (20) via a cross of poll id and label -----------------
insert into poll_options (society_id, poll_id, label)
select '11111111-1111-1111-1111-111111111111', p.id, o.label
from polls p
cross join (values ('Yes'), ('No')) as o(label)
where p.society_id = '11111111-1111-1111-1111-111111111111';

-- Poll votes (10): every resident votes 'Yes' on the first poll -------------
insert into poll_votes (society_id, poll_id, option_id, profile_id)
select
  '11111111-1111-1111-1111-111111111111',
  '55555555-0000-0000-0000-000000000001',
  (select id from poll_options where poll_id = '55555555-0000-0000-0000-000000000001' and label = 'Yes' limit 1),
  r.id::uuid
from (values
  ('44444444-0000-0000-0000-000000000001'),
  ('44444444-0000-0000-0000-000000000004'),
  ('44444444-0000-0000-0000-000000000005'),
  ('44444444-0000-0000-0000-000000000006'),
  ('44444444-0000-0000-0000-000000000007'),
  ('44444444-0000-0000-0000-000000000008'),
  ('44444444-0000-0000-0000-000000000009'),
  ('44444444-0000-0000-0000-000000000010'),
  ('44444444-0000-0000-0000-000000000011'),
  ('44444444-0000-0000-0000-000000000012')
) as r(id);

-- Amenities (10) ------------------------------------------------------------
insert into amenities (id, society_id, name, description) values
  ('66666666-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Clubhouse', 'Community hall for events'),
  ('66666666-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Tennis Court', 'Floodlit court'),
  ('66666666-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', 'Swimming Pool', 'Semi-olympic pool'),
  ('66666666-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', 'Gymnasium', 'Fully equipped gym'),
  ('66666666-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', 'Badminton Court', 'Indoor court'),
  ('66666666-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', 'Party Lawn', 'Open-air lawn'),
  ('66666666-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', 'Kids Play Area', 'Outdoor play zone'),
  ('66666666-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', 'Squash Court', 'Air-conditioned court'),
  ('66666666-0000-0000-0000-000000000009', '11111111-1111-1111-1111-111111111111', 'Yoga Deck', 'Rooftop deck'),
  ('66666666-0000-0000-0000-000000000010', '11111111-1111-1111-1111-111111111111', 'Library', 'Quiet reading room');

-- Amenity slots (12) --------------------------------------------------------
insert into amenity_slots (id, society_id, amenity_id, starts_at, ends_at, capacity) values
  ('66666666-1111-1111-1111-000000000001', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000001', now() + interval '1 day', now() + interval '1 day 2 hour', 1),
  ('66666666-1111-1111-1111-000000000002', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000002', now() + interval '1 day', now() + interval '1 day 1 hour', 2),
  ('66666666-1111-1111-1111-000000000003', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000003', now() + interval '1 day', now() + interval '1 day 1 hour', 5),
  ('66666666-1111-1111-1111-000000000004', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000004', now() + interval '1 day', now() + interval '1 day 1 hour', 10),
  ('66666666-1111-1111-1111-000000000005', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000005', now() + interval '2 day', now() + interval '2 day 1 hour', 2),
  ('66666666-1111-1111-1111-000000000006', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000006', now() + interval '2 day', now() + interval '2 day 3 hour', 1),
  ('66666666-1111-1111-1111-000000000007', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000007', now() + interval '2 day', now() + interval '2 day 2 hour', 20),
  ('66666666-1111-1111-1111-000000000008', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000008', now() + interval '3 day', now() + interval '3 day 1 hour', 2),
  ('66666666-1111-1111-1111-000000000009', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000009', now() + interval '3 day', now() + interval '3 day 1 hour', 15),
  ('66666666-1111-1111-1111-000000000010', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000010', now() + interval '3 day', now() + interval '3 day 2 hour', 8),
  ('66666666-1111-1111-1111-000000000011', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000001', now() + interval '4 day', now() + interval '4 day 2 hour', 1),
  ('66666666-1111-1111-1111-000000000012', '11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000003', now() + interval '4 day', now() + interval '4 day 1 hour', 5);

-- Bookings (10): one resident per slot --------------------------------------
insert into bookings (society_id, slot_id, profile_id) values
  ('11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-000000000001', '44444444-0000-0000-0000-000000000001'),
  ('11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-000000000002', '44444444-0000-0000-0000-000000000004'),
  ('11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-000000000003', '44444444-0000-0000-0000-000000000005'),
  ('11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-000000000004', '44444444-0000-0000-0000-000000000006'),
  ('11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-000000000005', '44444444-0000-0000-0000-000000000007'),
  ('11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-000000000006', '44444444-0000-0000-0000-000000000008'),
  ('11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-000000000007', '44444444-0000-0000-0000-000000000009'),
  ('11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-000000000008', '44444444-0000-0000-0000-000000000010'),
  ('11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-000000000009', '44444444-0000-0000-0000-000000000011'),
  ('11111111-1111-1111-1111-111111111111', '66666666-1111-1111-1111-000000000010', '44444444-0000-0000-0000-000000000012');

-- Notifications (10) --------------------------------------------------------
insert into notifications (society_id, profile_id, title, body, read) values
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000001', 'Visitor at the gate', 'Amazon Courier is waiting.', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000004', 'New notice', 'Water tank cleaning on Sunday.', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000005', 'Ticket update', 'Your street light ticket is open.', true),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000006', 'Dues reminder', 'July maintenance is due.', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000007', 'Booking confirmed', 'Badminton court booked.', true),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000008', 'Visitor approved', 'Your guest was let in.', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000009', 'Poll open', 'Vote on gym timings.', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000010', 'Ticket closed', 'Pest control resolved.', true),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000011', 'New notice', 'Fire drill on Saturday.', false),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000012', 'Dues reminder', 'July maintenance is due.', false);

-- Maintenance dues (20): June (paid) + July (mixed) -------------------------
insert into maintenance_dues (id, society_id, flat_id, profile_id, period, amount, status) values
  ('88888888-0000-0000-0006-000000000001', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '2026-06', 2500, 'paid'),
  ('88888888-0000-0000-0006-000000000002', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000004', '2026-06', 2500, 'paid'),
  ('88888888-0000-0000-0006-000000000003', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000005', '2026-06', 2500, 'paid'),
  ('88888888-0000-0000-0006-000000000004', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000006', '2026-06', 2500, 'paid'),
  ('88888888-0000-0000-0006-000000000005', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000007', '2026-06', 2500, 'paid'),
  ('88888888-0000-0000-0006-000000000006', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000008', '2026-06', 2500, 'paid'),
  ('88888888-0000-0000-0006-000000000007', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000007', '44444444-0000-0000-0000-000000000009', '2026-06', 2500, 'paid'),
  ('88888888-0000-0000-0006-000000000008', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000008', '44444444-0000-0000-0000-000000000010', '2026-06', 2500, 'paid'),
  ('88888888-0000-0000-0006-000000000009', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000009', '44444444-0000-0000-0000-000000000011', '2026-06', 2500, 'paid'),
  ('88888888-0000-0000-0006-000000000010', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000010', '44444444-0000-0000-0000-000000000012', '2026-06', 2500, 'paid'),
  ('88888888-0000-0000-0007-000000000001', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000001', '44444444-0000-0000-0000-000000000001', '2026-07', 2500, 'pending'),
  ('88888888-0000-0000-0007-000000000002', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000002', '44444444-0000-0000-0000-000000000004', '2026-07', 2500, 'pending'),
  ('88888888-0000-0000-0007-000000000003', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000003', '44444444-0000-0000-0000-000000000005', '2026-07', 2500, 'paid'),
  ('88888888-0000-0000-0007-000000000004', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000004', '44444444-0000-0000-0000-000000000006', '2026-07', 2500, 'overdue'),
  ('88888888-0000-0000-0007-000000000005', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000005', '44444444-0000-0000-0000-000000000007', '2026-07', 2500, 'pending'),
  ('88888888-0000-0000-0007-000000000006', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000006', '44444444-0000-0000-0000-000000000008', '2026-07', 2500, 'overdue'),
  ('88888888-0000-0000-0007-000000000007', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000007', '44444444-0000-0000-0000-000000000009', '2026-07', 2500, 'pending'),
  ('88888888-0000-0000-0007-000000000008', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000008', '44444444-0000-0000-0000-000000000010', '2026-07', 2500, 'paid'),
  ('88888888-0000-0000-0007-000000000009', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000009', '44444444-0000-0000-0000-000000000011', '2026-07', 2500, 'pending'),
  ('88888888-0000-0000-0007-000000000010', '11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000010', '44444444-0000-0000-0000-000000000012', '2026-07', 2500, 'pending');

-- Payment history (10) for the June paid dues -------------------------------
insert into payment_history (society_id, due_id, profile_id, amount, razorpay_payment_id, razorpay_order_id)
select
  '11111111-1111-1111-1111-111111111111', d.id, d.profile_id, d.amount,
  'pay_demo' || right(d.id::text, 4), 'order_demo' || right(d.id::text, 4)
from maintenance_dues d
where d.society_id = '11111111-1111-1111-1111-111111111111' and d.period = '2026-06';


-- ============================================================
-- 007_realtime.sql
-- ============================================================
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


-- ============================================================
-- 008_visitor_entered_notification.sql
-- ============================================================
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


-- ============================================================
-- 009_notifications_all.sql
-- ============================================================
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


-- ============================================================
-- 010_community_posts.sql
-- ============================================================
-- 010_community_posts.sql
-- Resident community feed: posts anyone in the society can create, like, and
-- comment on. Plus realtime for the feed and admin ticket triage.

-- Posts authored by any society member.
create table if not exists posts (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

-- One like per member per post.
create table if not exists post_likes (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (post_id, profile_id)
);

-- Threaded comments on a post.
create table if not exists post_comments (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  post_id uuid not null references posts (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  body text not null,
  created_at timestamptz not null default now()
);

create index if not exists idx_posts_society on posts (society_id, created_at desc);
create index if not exists idx_post_likes_post on post_likes (post_id);
create index if not exists idx_post_comments_post on post_comments (post_id, created_at);

alter table posts enable row level security;
alter table post_likes enable row level security;
alter table post_comments enable row level security;

-- Posts: readable in-society; any member creates their own; author edits/deletes.
create policy posts_read on posts
  for select using (society_id = auth_society_id());
create policy posts_insert on posts
  for insert with check (society_id = auth_society_id() and author_id = auth.uid());
create policy posts_update on posts
  for update using (society_id = auth_society_id() and author_id = auth.uid());
create policy posts_delete on posts
  for delete using (society_id = auth_society_id() and author_id = auth.uid());

-- Likes: read in-society; a member toggles only their own like.
create policy post_likes_read on post_likes
  for select using (society_id = auth_society_id());
create policy post_likes_insert on post_likes
  for insert with check (society_id = auth_society_id() and profile_id = auth.uid());
create policy post_likes_delete on post_likes
  for delete using (society_id = auth_society_id() and profile_id = auth.uid());

-- Comments: read in-society; a member posts under their own id.
create policy post_comments_read on post_comments
  for select using (society_id = auth_society_id());
create policy post_comments_insert on post_comments
  for insert with check (society_id = auth_society_id() and author_id = auth.uid());

-- Realtime for the community feed + admin ticket triage.
alter table posts replica identity full;
alter table post_likes replica identity full;
alter table post_comments replica identity full;
alter table helpdesk_tickets replica identity full;

do $$
declare t text;
begin
  foreach t in array array['posts', 'post_likes', 'post_comments', 'helpdesk_tickets'] loop
    if not exists (
      select 1 from pg_publication_tables
      where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = t
    ) then
      execute format('alter publication supabase_realtime add table public.%I', t);
    end if;
  end loop;
end $$;


-- ============================================================
-- 011_post_notifications.sql
-- ============================================================
-- 011_post_notifications.sql
-- Notify a post's author when another member likes or comments on their post.
-- Reuses app_notify (009) so the author gets a bell entry + push, and the
-- notifications realtime channel updates their unread badge live.

create or replace function notify_post_like()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post_author uuid;
  liker_name text;
begin
  select author_id into post_author from posts where id = new.post_id;
  -- Skip if the post is gone or the author liked their own post.
  if post_author is null or post_author = new.profile_id then
    return new;
  end if;
  select full_name into liker_name from profiles where id = new.profile_id;
  perform app_notify(
    new.society_id, array[post_author],
    'New like',
    coalesce(liker_name, 'Someone') || ' liked your post.',
    jsonb_build_object('type', 'post_like', 'post_id', new.post_id)
  );
  return new;
end;
$$;

create or replace function notify_post_comment()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  post_author uuid;
  commenter_name text;
begin
  select author_id into post_author from posts where id = new.post_id;
  -- Skip if the post is gone or the author commented on their own post.
  if post_author is null or post_author = new.author_id then
    return new;
  end if;
  select full_name into commenter_name from profiles where id = new.author_id;
  perform app_notify(
    new.society_id, array[post_author],
    'New comment',
    coalesce(commenter_name, 'Someone') || ' commented on your post.',
    jsonb_build_object('type', 'post_comment', 'post_id', new.post_id)
  );
  return new;
end;
$$;

create or replace trigger on_post_like
after insert on post_likes
for each row execute function notify_post_like();

create or replace trigger on_post_comment
after insert on post_comments
for each row execute function notify_post_comment();


-- 012_staff_attendance_deliveries.sql
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



-- 013_sos_frequent_vehicles.sql
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
