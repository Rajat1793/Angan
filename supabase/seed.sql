-- seed.sql — demo data for Angan. Idempotent-ish: safe to run on a fresh db.
-- Creates 1 society, 2 towers, ~8 flats, 3 demo users, and sample content.

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
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data,
  created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000001', 'authenticated', 'authenticated', 'resident@angan.app', crypt('Demo@1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Riya Resident"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000002', 'authenticated', 'authenticated', 'guard@angan.app', crypt('Demo@1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Gopal Guard"}', now(), now()),
  ('00000000-0000-0000-0000-000000000000', '44444444-0000-0000-0000-000000000003', 'authenticated', 'authenticated', 'admin@angan.app', crypt('Demo@1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Asha Admin"}', now(), now());

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
