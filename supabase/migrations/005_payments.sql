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
