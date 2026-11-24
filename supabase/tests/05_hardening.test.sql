begin;
select plan(13);

-- Internal helpers are not callable by clients (they take a uid and would leak other users' data).
select ok(not has_function_privilege('anon', 'public.is_active_member(uuid,uuid)', 'execute'), 'anon cannot call is_active_member');
select ok(not has_function_privilege('authenticated', 'public.is_active_member(uuid,uuid)', 'execute'), 'users cannot call is_active_member');
select ok(not has_function_privilege('authenticated', 'public.group_role(uuid,uuid)', 'execute'), 'users cannot call group_role');
select ok(not has_function_privilege('authenticated', 'public.assert_can_participate(uuid,uuid,text)', 'execute'), 'users cannot call assert_can_participate');
select ok(not has_function_privilege('anon', 'public.username_of(uuid)', 'execute'), 'anon cannot call username_of');
select ok(not has_function_privilege('anon', 'public.user_today(uuid)', 'execute'), 'anon cannot call user_today');
select ok(has_function_privilege('authenticated', 'public.check_in()', 'execute'), 'RPCs stay callable');

select tests.create_user('own@test.local', 'own');
select tests.create_user('mem@test.local', 'mem');
select tests.create_user('demo@test.local', 'demo');
update public.profiles set is_demo = true where id = tests.uid('demo');
update public.profiles set created_at = now() - interval '10 days';

select tests.act_as(tests.uid('own'));
select public.create_group('Grace Fellowship', '', '', 'private', null);
create temp table ids on commit drop as
  select (select id from public.groups where name = 'Grace Fellowship') as priv,
         public.create_invite((select id from public.groups where name = 'Grace Fellowship')) as code;
grant select on ids to authenticated;
reset role;
select tests.act_as(tests.uid('mem'));
select public.redeem_invite((select code from ids));
reset role;
update public.group_members set joined_at = now() - interval '10 days';
select tests.act_as(tests.uid('mem'));
select public.create_general_post((select priv from ids), 'T', 'original text');
create temp table p on commit drop as select id from public.feed_posts where body = 'original text';
grant select on p to authenticated;
select public.add_comment((select id from p), 'original comment');
create temp table c on commit drop as select id from public.feed_comments where body = 'original comment';
grant select on c to authenticated;

-- Group pages still work for members (RLS policies use caller-only helpers now).
select is((select count(*)::int from public.groups where id = (select priv from ids)), 1, 'member still sees private group');

-- Removed content can't be read back through a report.
reset role;
select tests.act_as(tests.uid('own'));
select public.remove_post((select id from p), 'x');
reset role;
select tests.act_as(tests.uid('mem'));
select throws_ok($$ select public.report_content((select id from p), null, 'other', '') $$, 'P0001', 'forbidden',
  'cannot report (and so snapshot) a removed post');
reset role;
select tests.act_as(tests.uid('own'));
select public.create_general_post((select priv from ids), 'T2', 'fine post');
reset role;
select tests.act_as(tests.uid('mem'));
select public.report_content((select id from public.feed_posts where body = 'fine post'), null, 'spam', '');
select is((select count(*)::int from public.reports), 0, 'reporters cannot read report rows (snapshots)');

-- Muted / banned users cannot edit their old content.
reset role;
update public.group_members set muted_until = now() + interval '1 day' where user_id = tests.uid('mem');
select tests.act_as(tests.uid('mem'));
select throws_ok($$ select public.edit_comment((select id from c), 'edited while muted') $$, 'P0001', 'muted',
  'muted member cannot edit comments');
reset role;
update public.group_members set muted_until = null, banned = true where user_id = tests.uid('mem');
update public.posts set removed_at = null where id = (select id from p);
select tests.act_as(tests.uid('mem'));
select throws_ok($$ select public.edit_post((select id from p), 'T', 'EDITED AFTER BAN', '', '') $$, 'P0001', 'banned',
  'banned member cannot edit posts');

-- The shared demo account's password and email can't be changed.
reset role;
select throws_ok($$ update auth.users set encrypted_password = 'x' where id = tests.uid('demo') $$, 'P0001', 'demo_read_only',
  'demo password cannot be changed');

select * from finish();
rollback;
