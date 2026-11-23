-- Test helpers. Lives in the `tests` schema of the LOCAL database only;
-- `supabase test db` runs files in name order, so this file runs first.
begin;
select plan(1);

create schema if not exists tests;
grant usage on schema tests to anon, authenticated;

create or replace function tests.create_user(p_email text, p_username text, p_tz text default 'UTC')
returns uuid language plpgsql security definer set search_path = public, extensions as $$
declare uid uuid := gen_random_uuid();
begin
  insert into auth.users (id, instance_id, aud, role, email, encrypted_password,
    raw_user_meta_data, raw_app_meta_data, created_at, updated_at, email_confirmed_at)
  values (uid, '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated',
    p_email, crypt('password123', gen_salt('bf')),
    jsonb_build_object('username', p_username, 'display_name', p_username, 'timezone', p_tz),
    '{}'::jsonb, now(), now(), now());
  return uid;
end $$;

create or replace function tests.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims',
    json_build_object('sub', uid, 'role', 'authenticated')::text, true);
end $$;

create or replace function tests.act_as_anon() returns void language plpgsql as $$
begin
  perform set_config('request.jwt.claims', json_build_object('role', 'anon')::text, true);
  perform set_config('role', 'anon', true);
end $$;

create or replace function tests.uid(p_username text) returns uuid
language sql security definer set search_path = public as $$
  select id from auth.users where raw_user_meta_data->>'username' = p_username
$$;

grant execute on all functions in schema tests to anon, authenticated;

select pass('helpers installed');
select * from finish();
commit;
