begin;
select plan(17);

select tests.create_user('own@test.local', 'own');
select tests.create_user('mem@test.local', 'mem');
select tests.create_user('out@test.local', 'out');
select tests.create_user('adm@test.local', 'adm');
select tests.create_user('demo@test.local', 'demo');
update public.profiles set is_site_admin = true where id = tests.uid('adm');
update public.profiles set is_demo = true where id = tests.uid('demo');

-- owner creates a private and a public group
select tests.act_as(tests.uid('own'));
select lives_ok($$ select public.create_group('Grace Fellowship', 'Our church', 'Be kind', 'private', 'baptist') $$,
  'owner can create a private group');
select public.create_group('Open Psalms', '', '', 'public', null);
select is((select role from public.group_members gm join public.groups g on g.id = gm.group_id
           where g.name = 'Grace Fellowship' and gm.user_id = auth.uid()), 'owner', 'creator is owner');
create temp table ids on commit drop as
  select (select id from public.groups where name = 'Grace Fellowship') as priv,
         (select id from public.groups where name = 'Open Psalms') as pub;
grant select on ids to authenticated;
create temp table inv on commit drop as select public.create_invite((select priv from ids)) as code;
grant select on inv to authenticated;

-- outsider visibility
reset role;
select tests.act_as(tests.uid('out'));
select is((select count(*)::int from public.groups where id = (select priv from ids)), 0,
  'private group invisible to non-member');
select is((select count(*)::int from public.groups where id = (select pub from ids)), 1,
  'public group visible to non-member');
select lives_ok($$ select public.join_public_group((select pub from ids)) $$, 'anyone can join a public group');
select throws_ok($$ select public.join_public_group((select priv from ids)) $$, 'P0001', 'forbidden',
  'cannot join a private group without invite');

-- site admin cannot see private groups
reset role;
select tests.act_as(tests.uid('adm'));
select is((select count(*)::int from public.groups where id = (select priv from ids))
        + (select count(*)::int from public.group_members where group_id = (select priv from ids)), 0,
  'site admin cannot see a private group or its members');

-- invites
reset role;
select tests.act_as(tests.uid('mem'));
select lives_ok($$ select public.redeem_invite((select code from inv)) $$, 'invite adds member');
select is((select count(*)::int from public.groups where id = (select priv from ids)), 1,
  'member sees private group');
reset role;
update public.group_invites set expires_at = now() - interval '1 minute';
select tests.act_as(tests.uid('out'));
select throws_ok($$ select public.redeem_invite((select code from inv)) $$, 'P0001', 'invalid_invite',
  'expired invite fails');

-- leaving removes access
reset role;
select tests.act_as(tests.uid('mem'));
select public.leave_group((select priv from ids));
select is((select count(*)::int from public.groups where id = (select priv from ids)), 0,
  'after leaving, private group is invisible');

-- banned users can't see or rejoin
reset role;
update public.group_invites set expires_at = now() + interval '1 day';
insert into public.group_members (group_id, user_id, role, banned)
  values ((select priv from ids), tests.uid('mem'), 'member', true);
select tests.act_as(tests.uid('mem'));
select is((select count(*)::int from public.groups where id = (select priv from ids)), 0,
  'banned member cannot see private group');
select throws_ok($$ select public.redeem_invite((select code from inv)) $$, 'P0001', 'banned',
  'banned member cannot rejoin');

-- ownership
reset role;
select tests.act_as(tests.uid('own'));
select throws_ok($$ select public.leave_group((select pub from ids)) $$, 'P0001', 'owner_must_transfer',
  'owner must transfer before leaving');
select lives_ok($$ select public.transfer_ownership((select pub from ids), tests.uid('out'));
                   select public.leave_group((select pub from ids)) $$,
  'after transferring ownership, old owner can leave');
reset role;
select tests.act_as(tests.uid('mem'));
select throws_ok($$ select public.set_member_role((select pub from ids), auth.uid(), 'admin') $$,
  'P0001', 'forbidden', 'non-owner cannot change roles');

-- demo
reset role;
select tests.act_as(tests.uid('demo'));
select throws_ok($$ select public.create_group('Demo', '', '', 'public', null) $$, 'P0001', 'demo_read_only',
  'demo cannot create groups');

select * from finish();
rollback;
