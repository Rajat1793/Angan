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
