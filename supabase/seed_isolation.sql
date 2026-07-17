-- seed_isolation.sql — optional 2nd society to prove tenant isolation (run after seed.sql).

insert into societies (id, name, address) values
  ('99999999-9999-9999-9999-999999999999', 'Riverside Court', '9 River Road');

insert into towers (id, society_id, name) values
  ('99999999-0000-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', 'Tower C');

insert into flats (id, society_id, tower_id, number) values
  ('99999999-1111-0000-0000-000000000001', '99999999-9999-9999-9999-999999999999', '99999999-0000-0000-0000-000000000001', 'C-101');

-- Second-society admin: used to verify RLS blocks cross-tenant reads.
insert into auth.users (
  instance_id, id, aud, role, email, encrypted_password,
  email_confirmed_at, raw_app_meta_data, raw_user_meta_data, created_at, updated_at
) values
  ('00000000-0000-0000-0000-000000000000', '99999999-2222-0000-0000-000000000001', 'authenticated', 'authenticated', 'admin2@angan.app', crypt('Demo@1234', gen_salt('bf')), now(), '{"provider":"email","providers":["email"]}', '{"full_name":"Bela Admin"}', now(), now());

update profiles
set society_id = '99999999-9999-9999-9999-999999999999', role = 'admin', full_name = 'Bela Admin'
where id = '99999999-2222-0000-0000-000000000001';

-- Expectation: admin2@angan.app sees only Riverside Court data, never Angan Greens.
