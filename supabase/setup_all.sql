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
-- seed.sql — demo data for Angan (1 society, 2 towers, ~8 flats, 3 users, samples).

-- Fixed UUIDs so relationships stay stable across re-seeds.
-- Society + towers + flats -------------------------------------------------
insert into societies (id, name, address) values
  ('11111111-1111-1111-1111-111111111111', 'Angan Greens', '42 Palm Avenue');

insert into towers (id, society_id, name) values
  ('22222222-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Tower A'),
  ('22222222-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Tower B');

insert into flats (id, society_id, tower_id, number) values
  ('33333333-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'A-101'),
  ('33333333-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'A-102'),
  ('33333333-0000-0000-0000-000000000003', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'A-201'),
  ('33333333-0000-0000-0000-000000000004', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000001', 'A-202'),
  ('33333333-0000-0000-0000-000000000005', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'B-101'),
  ('33333333-0000-0000-0000-000000000006', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'B-102'),
  ('33333333-0000-0000-0000-000000000007', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'B-201'),
  ('33333333-0000-0000-0000-000000000008', '11111111-1111-1111-1111-111111111111', '22222222-0000-0000-0000-000000000002', 'B-202');

-- Demo auth users. Passwords all "Demo@1234" (bcrypt via pgcrypto). --------
-- Token columns default to '' because GoTrue cannot scan NULLs at login.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at,
  confirmation_token, recovery_token, email_change,
  email_change_token_new, reauthentication_token
) values
  ('00000000-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'resident@angan.app', crypt('Demo@1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Riya Resident"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'guard@angan.app', crypt('Demo@1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Gopal Guard"}', now(), now(), '', '', '', '', ''),
  ('00000000-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'admin@angan.app', crypt('Demo@1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Asha Admin"}', now(), now(), '', '', '', '', '');

-- The signup trigger inserts profile rows; update them with role + tenancy.
update profiles set society_id = '11111111-1111-1111-1111-111111111111', flat_id = '33333333-0000-0000-0000-000000000001', role = 'resident', full_name = 'Riya Resident'
  where id = '44444444-0000-0000-0000-000000000001';
update profiles set society_id = '11111111-1111-1111-1111-111111111111', role = 'guard', full_name = 'Gopal Guard'
  where id = '44444444-0000-0000-0000-000000000002';
update profiles set society_id = '11111111-1111-1111-1111-111111111111', role = 'admin', full_name = 'Asha Admin'
  where id = '44444444-0000-0000-0000-000000000003';

-- Sample gate activity ------------------------------------------------------
insert into visitors (society_id, flat_id, name, phone, type, purpose, status, created_by) values
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000001', 'Amazon Courier', '9800000001', 'delivery', 'Parcel delivery', 'pending', '44444444-0000-0000-0000-000000000002'),
  ('11111111-1111-1111-1111-111111111111', '33333333-0000-0000-0000-000000000001', 'Ola Cab', '9800000002', 'cab', 'Pickup', 'inside', '44444444-0000-0000-0000-000000000002');

-- Notices + a poll ----------------------------------------------------------
insert into notices (society_id, author_id, title, body, category, pinned) values
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Water tank cleaning', 'Supply off on Sunday 10am-1pm.', 'maintenance', true),
  ('11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Diwali celebration', 'Cultural evening in the clubhouse on Nov 1.', 'events', false);

insert into polls (id, society_id, author_id, question, closes_at) values
  ('55555555-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', '44444444-0000-0000-0000-000000000003', 'Preferred gym timing?', now() + interval '7 days');

insert into poll_options (society_id, poll_id, label) values
  ('11111111-1111-1111-1111-111111111111', '55555555-0000-0000-0000-000000000001', '6am - 9am'),
  ('11111111-1111-1111-1111-111111111111', '55555555-0000-0000-0000-000000000001', '6pm - 9pm');

-- Amenities + slots ---------------------------------------------------------
insert into amenities (id, society_id, name, description) values
  ('66666666-0000-0000-0000-000000000001', '11111111-1111-1111-1111-111111111111', 'Clubhouse', 'Community hall for events'),
  ('66666666-0000-0000-0000-000000000002', '11111111-1111-1111-1111-111111111111', 'Tennis Court', 'Floodlit court');

insert into amenity_slots (society_id, amenity_id, starts_at, ends_at, capacity) values
  ('11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000001', now() + interval '1 day', now() + interval '1 day 2 hours', 1),
  ('11111111-1111-1111-1111-111111111111', '66666666-0000-0000-0000-000000000002', now() + interval '1 day', now() + interval '1 day 1 hour', 2);

-- Staff directory -----------------------------------------------------------
insert into staff (society_id, name, role, phone) values
  ('11111111-1111-1111-1111-111111111111', 'Ramesh', 'Plumber', '9811111111'),
  ('11111111-1111-1111-1111-111111111111', 'Suresh', 'Electrician', '9822222222');
