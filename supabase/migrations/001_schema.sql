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
