begin;
select plan(6);

select tests.create_user('me@test.local', 'me');
select tests.create_user('pal@test.local', 'pal');
select tests.create_user('lazy@test.local', 'lazy');
select tests.create_user('stranger@test.local', 'stranger');
select tests.create_user('blocked@test.local', 'blocked');
select tests.create_user('banned@test.local', 'banned');

select tests.act_as(tests.uid('me'));
select public.create_group('Grace Fellowship', '', '', 'public', null);
create temp table g on commit drop as select id from public.groups where name = 'Grace Fellowship';
grant select on g to authenticated;
reset role;
insert into public.group_members (group_id, user_id, role, banned)
select (select id from g), tests.uid(u), 'member', u = 'banned'
from unnest(array['pal', 'lazy', 'blocked', 'banned']) as u;

-- everyone except 'lazy' read today (in their own timezone)
insert into public.check_ins (user_id, local_date)
select tests.uid(u), public.user_today(tests.uid(u))
from unnest(array['me', 'pal', 'stranger', 'blocked', 'banned']) as u;
insert into public.blocks values (tests.uid('me'), tests.uid('blocked'));

select tests.act_as(tests.uid('me'));
create temp table seen on commit drop as select username from public.friends_read_today();

select ok(exists (select 1 from seen where username = 't_pal'), 'a group friend who read today is listed');
select ok(not exists (select 1 from seen where username = 't_lazy'), 'a friend who has not read is not listed');
select ok(not exists (select 1 from seen where username = 't_stranger'), 'people outside my groups are not listed');
select ok(not exists (select 1 from seen where username = 't_blocked'), 'people I blocked are not listed');
select ok(not exists (select 1 from seen where username = 't_banned'), 'members banned from the group are not listed');
select ok(not exists (select 1 from seen where username = 't_me'), 'I am not listed');

select * from finish();
rollback;
