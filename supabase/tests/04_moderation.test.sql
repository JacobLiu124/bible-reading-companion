begin;
select plan(17);

select tests.create_user('own@test.local', 'own');
select tests.create_user('mem@test.local', 'mem');
select tests.create_user('adm@test.local', 'adm');
select tests.create_user('oth@test.local', 'oth');
update public.profiles set is_site_admin = true where id = tests.uid('adm');
update public.profiles set created_at = now() - interval '10 days';
delete from public.reading_schedule;

select tests.act_as(tests.uid('own'));
select public.create_group('Grace Fellowship', '', '', 'private', null);
select public.create_group('Open Psalms', '', '', 'public', null);
create temp table ids on commit drop as
  select (select id from public.groups where name = 'Grace Fellowship') as priv,
         (select id from public.groups where name = 'Open Psalms') as pub,
         public.create_invite((select id from public.groups where name = 'Grace Fellowship')) as code;
grant select on ids to authenticated;
reset role;
select tests.act_as(tests.uid('oth'));
select public.create_group('Other Group', '', '', 'public', null);
reset role;
select tests.act_as(tests.uid('mem'));
select public.redeem_invite((select code from ids));
select public.join_public_group((select pub from ids));
reset role;
update public.group_members set joined_at = now() - interval '10 days';
select tests.act_as(tests.uid('mem'));
select public.create_general_post((select pub from ids), 'Hello', 'spam spam spam');
select public.create_general_post((select priv from ids), 'Private', 'private words');
create temp table posts_ on commit drop as
  select (select id from public.feed_posts where body = 'spam spam spam') as pub_post,
         (select id from public.feed_posts where body = 'private words') as priv_post;
grant select on posts_ to authenticated;
select lives_ok($$ select public.report_content((select pub_post from posts_), null, 'spam', 'obvious spam') $$,
  'members can report a post');

-- group owner removes a post: text hidden from members, kept for moderators
reset role;
select tests.act_as(tests.uid('own'));
select is((select count(*)::int from public.reports where status = 'open'), 1, 'group owner sees the report');
select public.remove_post((select pub_post from posts_), 'spam');
select is((select body from public.feed_posts where id = (select pub_post from posts_)), 'spam spam spam',
  'moderator still sees removed text');
reset role;
select tests.act_as(tests.uid('mem'));
select is((select body from public.feed_posts where id = (select pub_post from posts_)), null,
  'members see removed post without its text');
select is((select removed from public.feed_posts where id = (select pub_post from posts_)), true,
  'members see that it was removed');

-- other group's owner cannot moderate here
reset role;
select tests.act_as(tests.uid('oth'));
select throws_ok($$ select public.mute_user((select pub from ids), tests.uid('mem'), 1) $$, 'P0001', 'forbidden',
  'owner of another group cannot moderate this one');

-- site admin: public yes, private no
reset role;
select tests.act_as(tests.uid('adm'));
select lives_ok($$ select public.mute_user((select pub from ids), tests.uid('mem'), 1) $$,
  'site admin can moderate a public group');
select throws_ok($$ select public.remove_post((select priv_post from posts_), 'x') $$, 'P0001', 'forbidden',
  'site admin cannot moderate a private group');
select throws_ok($$ select public.mute_user((select pub from ids), tests.uid('mem'), 3) $$, 'P0001', 'invalid_duration',
  'mute must be 1 or 7 days');

-- warnings
select public.warn_user((select pub from ids), tests.uid('mem'), 'Please keep it on topic.');
reset role;
select tests.act_as(tests.uid('mem'));
select is((select message from public.notices where acknowledged_at is null), 'A moderator of Open Psalms sent you a warning: Please keep it on topic.',
  'warned user sees the notice');
select public.acknowledge_notice((select id from public.notices limit 1));
select is((select count(*)::int from public.notices where acknowledged_at is null), 0, 'notice can be acknowledged');
reset role;
select tests.act_as(tests.uid('oth'));
select is((select count(*)::int from public.notices), 0, 'other users cannot see the notice');

-- global ban
reset role;
insert into public.reading_schedule values (public.user_today(tests.uid('mem')), 'John', 1, 'John 1');
select tests.act_as(tests.uid('adm'));
select public.ban_user(null, tests.uid('mem'), 'abuse');
reset role;
select tests.act_as(tests.uid('mem'));
select public.check_in();
select throws_ok($$ select public.create_reading_post('{}', true, 'hi', null, null) $$, 'P0001', 'banned',
  'globally banned user cannot post to the global thread');
select lives_ok($$ select public.create_reading_post(array[(select priv from ids)], false, 'hi', null, null) $$,
  'globally banned user can still post in their groups');

-- site admin deletes a public group
reset role;
select tests.act_as(tests.uid('adm'));
select public.delete_group((select pub from ids), 'spam group');
reset role;
select is((select count(*)::int from public.groups where id = (select pub from ids)), 0, 'site admin deleted the public group');

-- account deletion keeps moderation history, hands over ownership
select tests.act_as(tests.uid('own'));
select public.delete_my_account();
reset role;
select is((select count(*)::int from public.moderation_actions
           where target_username = 't_mem' and actor_id is null and actor_username = 't_own'), 1,
  'moderation log survives the moderator deleting their account');
select is((select role from public.group_members where group_id = (select priv from ids)
           and user_id = tests.uid('mem')), 'owner',
  'ownership passes to the next member when the owner deletes their account');

select * from finish();
rollback;
