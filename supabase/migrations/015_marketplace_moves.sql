-- 015_marketplace_moves.sql — classifieds/marketplace + move-in/out requests.

create table if not exists listings (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  author_id uuid not null references profiles (id) on delete cascade,
  title text not null,
  description text,
  price numeric,
  category text default 'sell',
  status text not null default 'active',
  created_at timestamptz not null default now()
);

create table if not exists move_requests (
  id uuid primary key default gen_random_uuid(),
  society_id uuid not null references societies (id) on delete cascade,
  flat_id uuid references flats (id) on delete set null,
  profile_id uuid not null references profiles (id) on delete cascade,
  kind text not null default 'move_out',
  move_date date,
  note text,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create index if not exists idx_listings_society on listings (society_id, created_at desc);
create index if not exists idx_moves_society on move_requests (society_id, status);

alter table listings enable row level security;
alter table move_requests enable row level security;

-- Listings: readable in society; author manages their own.
create policy listings_read on listings
  for select using (society_id = auth_society_id());
create policy listings_insert on listings
  for insert with check (society_id = auth_society_id() and author_id = auth.uid());
create policy listings_update on listings
  for update using (society_id = auth_society_id() and author_id = auth.uid());
create policy listings_delete on listings
  for delete using (society_id = auth_society_id() and author_id = auth.uid());

-- Move requests: resident creates their own; admin sees + updates status.
create policy moves_read on move_requests
  for select using (
    society_id = auth_society_id()
    and (profile_id = auth.uid() or auth_role() = 'admin')
  );
create policy moves_insert on move_requests
  for insert with check (society_id = auth_society_id() and profile_id = auth.uid());
create policy moves_update on move_requests
  for update using (
    society_id = auth_society_id()
    and (profile_id = auth.uid() or auth_role() = 'admin')
  );
