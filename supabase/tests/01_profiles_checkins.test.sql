begin;
select plan(13);

select tests.create_user('ann@test.local', 'ann', 'UTC');
select tests.create_user('ben@test.local', 'ben', 'Pacific/Auckland');
select tests.create_user('adm@test.local', 'adm', 'UTC');
select tests.create_user('demo@test.local', 'demo', 'UTC');
update public.profiles set is_site_admin = true where id = tests.uid('adm');
update public.profiles set is_demo = true where id = tests.uid('demo');
delete from public.reading_schedule;

-- signup trigger
select results_eq(
  $$ select username, timezone, weekly_goal from public.profiles where id = tests.uid('ben') $$,
  $$ values ('ben'::text, 'Pacific/Auckland'::text, 3) $$,
  'signup trigger creates profile from metadata');
select is((select goal from public.goal_history where user_id = tests.uid('ben')), 3,
  'signup trigger creates goal_history row with goal 3');

-- check-in idempotent and works with no schedule row
select tests.act_as(tests.uid('ann'));
select lives_ok($$ select public.check_in() $$, 'check-in works with no schedule for today');
select public.check_in();
select is((select count(*)::int from public.check_ins), 1, 'second check-in same day is a no-op');

-- timezone: Auckland user's check-in is dated in Auckland
reset role;
select tests.act_as(tests.uid('ben'));
select is(public.check_in(), (now() at time zone 'Pacific/Auckland')::date,
  'check-in uses the user''s local date');

-- privacy of check-ins
select is((select count(*)::int from public.check_ins where user_id = tests.uid('ann')), 0,
  'cannot see another user''s check-ins');

-- privilege escalation
select throws_ok($$ update public.profiles set is_site_admin = true where id = auth.uid() $$,
  '42501', null, 'cannot make yourself site admin');
select lives_ok($$ update public.profiles set display_name = 'Benjamin' where id = auth.uid() $$,
  'can edit own display name');

-- schedule writes
select throws_ok($$ insert into public.reading_schedule(day, book, chapter, label)
  values ('2030-01-01', 'John', 1, 'John 1') $$, '42501', null, 'non-admin cannot edit schedule');
reset role;
select tests.act_as(tests.uid('adm'));
select lives_ok($$ insert into public.reading_schedule(day, book, chapter, label)
  values ('2030-01-01', 'John', 1, 'John 1') $$, 'site admin can edit schedule');

-- demo read-only
reset role;
select tests.act_as(tests.uid('demo'));
select throws_ok($$ select public.check_in() $$, 'P0001', 'demo_read_only', 'demo cannot check in');

-- weekly goal
reset role;
select tests.act_as(tests.uid('ann'));
select public.set_weekly_goal(5);
select is((select weekly_goal from public.profiles where id = auth.uid()), 5, 'set_weekly_goal updates profile');

-- anon
reset role;
select tests.act_as_anon();
select is((select count(*)::int from public.profiles), 0, 'anon cannot read profiles');

select * from finish();
rollback;
