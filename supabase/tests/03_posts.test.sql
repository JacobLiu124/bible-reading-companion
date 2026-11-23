begin;
select plan(19);

select tests.create_user('own@test.local', 'own');
select tests.create_user('mem@test.local', 'mem');
select tests.create_user('out@test.local', 'out');
select tests.create_user('new@test.local', 'newbie');
select tests.create_user('demo@test.local', 'demo');
update public.profiles set is_demo = true where id = tests.uid('demo');
-- accounts older than 48h unless a test says otherwise
update public.profiles set created_at = now() - interval '10 days';

delete from public.reading_schedule;

select tests.act_as(tests.uid('own'));
select public.create_group('Grace Fellowship', '', 'Be kind', 'private', null);
select public.create_group('Open Psalms', '', '', 'public', null);
create temp table ids on commit drop as
  select (select id from public.groups where name = 'Grace Fellowship') as priv,
         (select id from public.groups where name = 'Open Psalms') as pub,
         public.create_invite((select id from public.groups where name = 'Grace Fellowship')) as code;
grant select on ids to authenticated;
reset role;
-- everyone's memberships are old (no slow mode) unless a test says otherwise
select tests.act_as(tests.uid('mem'));
select public.redeem_invite((select code from ids));
select public.join_public_group((select pub from ids));
reset role;
update public.group_members set joined_at = now() - interval '10 days';

-- reading post rules
select tests.act_as(tests.uid('mem'));
select throws_ok($$ select public.create_reading_post(array[(select priv from ids)], false, 'hi', null, null) $$,
  'P0001', 'no_reading_today', 'no schedule today -> no_reading_today');
reset role;
insert into public.reading_schedule values (public.user_today(tests.uid('mem')), 'Psalms', 23, 'Psalm 23');
select tests.act_as(tests.uid('mem'));
select throws_ok($$ select public.create_reading_post(array[(select priv from ids)], false, 'hi', null, null) $$,
  'P0001', 'not_checked_in', 'reading post requires check-in');
select public.check_in();
select is((select count(*)::int from public.create_reading_post(
           array[(select priv from ids), (select pub from ids)], true, 'The Lord is my shepherd', 'Psalm 23:1', 'The Lord is my shepherd')),
  3, 'one reading post per destination');
select is((select reference from public.feed_posts where group_id is null and author_id = auth.uid() limit 1), 'Psalm 23',
  'reading post tagged with today''s chapter');
select public.add_comment((select id from public.feed_posts where group_id = (select priv from ids)), 'amen');
select is((select count(*)::int from public.feed_comments c join public.feed_posts p on p.id = c.post_id
           where p.group_id = (select pub from ids)), 0,
  'comments stay on their own destination');

-- general posts
select throws_ok($$ select public.create_general_post(null, 'x', 'y') $$, 'P0001', 'global_reading_only',
  'general posts cannot go to the global thread');
select lives_ok($$ select public.create_general_post((select priv from ids), 'Prayer request', 'Pray for my mum') $$,
  'member can make a general post');

-- direct writes are blocked
select throws_ok($$ insert into public.posts (kind, author_id, reading_date, reference, body)
                    values ('reading', auth.uid(), '2020-01-01', 'John 1', 'x') $$,
  '42501', null, 'cannot insert posts directly (e.g. back-dated global posts)');

-- outsiders
reset role;
select tests.act_as(tests.uid('out'));
select throws_ok($$ select public.create_general_post((select priv from ids), 't', 'b') $$, 'P0001', 'not_member',
  'non-member cannot post to private group');
select is((select count(*)::int from public.feed_posts where group_id = (select priv from ids)), 0,
  'non-member cannot read private posts');
select is((select count(*)::int from public.feed_posts where group_id = (select pub from ids)), 1,
  'non-member can read public group posts');

-- mute
reset role;
update public.group_members set muted_until = now() + interval '1 day'
  where user_id = tests.uid('mem') and group_id = (select priv from ids);
select tests.act_as(tests.uid('mem'));
select throws_ok($$ select public.create_general_post((select priv from ids), 't', 'b') $$, 'P0001', 'muted',
  'muted member cannot post');
reset role;
update public.group_members set muted_until = null;

-- slow mode
select tests.act_as(tests.uid('newbie'));
select public.join_public_group((select pub from ids));
select public.create_general_post((select pub from ids), 't', '1');
select public.create_general_post((select pub from ids), 't', '2');
select public.create_general_post((select pub from ids), 't', '3');
select throws_ok($$ select public.create_general_post((select pub from ids), 't', '4') $$, 'P0001', 'slow_mode',
  'newcomer limited to 3 posts per hour');
reset role;
update public.group_members set joined_at = now() - interval '3 days' where user_id = tests.uid('newbie');
select tests.act_as(tests.uid('newbie'));
select lives_ok($$ select public.create_general_post((select pub from ids), 't', '4') $$,
  'after 48h the limit no longer applies');

-- yesterday's global post: comments allowed
reset role;
insert into public.posts (kind, author_id, reading_date, reference, body, created_at)
  values ('reading', tests.uid('own'), current_date - 1, 'Psalm 22', 'old', now() - interval '1 day');
select tests.act_as(tests.uid('mem'));
select lives_ok($$ select public.add_comment((select id from public.feed_posts where reference = 'Psalm 22'), 'late thought') $$,
  'can comment on a past global thread');

-- reactions
select public.toggle_reaction((select id from public.feed_posts where reference = 'Psalm 22'));
select public.toggle_reaction((select id from public.feed_posts where reference = 'Psalm 22'));
select is((select reaction_count::int from public.feed_posts where reference = 'Psalm 22'), 0,
  'toggling a reaction twice removes it');

-- blocking hides content everywhere
reset role;
select tests.act_as(tests.uid('own'));
select public.block_user(tests.uid('mem'));
select is((select count(*)::int from public.feed_posts where author_id = tests.uid('mem')), 0,
  'blocked user''s posts hidden in groups and global');
select is((select count(*)::int from public.feed_comments where author_id = tests.uid('mem')), 0,
  'blocked user''s comments hidden');

-- demo
reset role;
select tests.act_as(tests.uid('demo'));
select throws_ok($$ select public.toggle_reaction((select id from public.feed_posts where reference = 'Psalm 22')) $$,
  'P0001', 'demo_read_only', 'demo cannot react');

select * from finish();
rollback;
