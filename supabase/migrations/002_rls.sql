-- 002_rls.sql — Row Level Security. Deny by default; society_id is the boundary.
-- Role is read from profiles (server-side), never trusted from the client.

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
