begin;
select plan(5);

select tests.create_user('ann@test.local', 'ann');
select tests.create_user('demo@test.local', 'demo');
update public.profiles set is_demo = true where id = tests.uid('demo');

select tests.act_as(tests.uid('ann'));
select throws_ok($$ select public.undo_check_in() $$, 'P0001', 'not_checked_in',
  'nothing to undo before checking in');

select public.check_in();
select lives_ok($$ select public.undo_check_in() $$, 'can undo a fresh check-in');
select is((select count(*)::int from public.check_ins), 0, 'undo removes today''s check-in');

select public.check_in();
reset role;
update public.check_ins set created_at = now() - interval '11 minutes' where user_id = tests.uid('ann');
select tests.act_as(tests.uid('ann'));
select throws_ok($$ select public.undo_check_in() $$, 'P0001', 'undo_expired',
  'undo only works within 10 minutes');

reset role;
select tests.act_as(tests.uid('demo'));
select throws_ok($$ select public.undo_check_in() $$, 'P0001', 'demo_read_only', 'demo cannot undo');

select * from finish();
rollback;
