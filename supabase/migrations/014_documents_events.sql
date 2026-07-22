-- 014_documents_events.sql — society document vault + events with RSVP.
-- (The resident directory reads the existing profiles table; no new table.)

create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  title text not null,
  url text not null,
  category text default 'general',
  uploaded_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  created_by uuid references profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists event_rsvps (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  event_id uuid not null references events (id) on delete cascade,
  profile_id uuid not null references profiles (id) on delete cascade,
  status text not null default 'going',
  created_at timestamptz not null default now(),
  unique (event_id, profile_id)
);

create index if not exists idx_documents_society on documents (society_id, created_at desc);
create index if not exists idx_events_society on events (society_id, starts_at);
create index if not exists idx_event_rsvps_event on event_rsvps (event_id);

alter table documents enable row level security;
alter table events enable row level security;
alter table event_rsvps enable row level security;

-- Documents: readable in society; admin-managed.
create policy documents_read on documents
  for select using (society_id = auth_society_id());
create policy documents_admin on documents
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

-- Events: readable in society; admin-managed.
create policy events_read on events
  for select using (society_id = auth_society_id());
create policy events_admin on events
  for all using (society_id = auth_society_id() and auth_role() = 'admin')
  with check (society_id = auth_society_id() and auth_role() = 'admin');

-- RSVPs: readable in society; a resident manages their own.
create policy event_rsvps_read on event_rsvps
  for select using (society_id = auth_society_id());
create policy event_rsvps_write on event_rsvps
  for insert with check (society_id = auth_society_id() and profile_id = auth.uid());
create policy event_rsvps_update on event_rsvps
  for update using (society_id = auth_society_id() and profile_id = auth.uid());
create policy event_rsvps_delete on event_rsvps
  for delete using (society_id = auth_society_id() and profile_id = auth.uid());
