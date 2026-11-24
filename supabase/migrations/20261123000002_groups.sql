-- Groups, membership and invites.
-- Private groups are visible only to active members (not even site admins).

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 3 and 60),
  slug text not null unique,
  description text not null default '' check (char_length(description) <= 500),
  rules text not null default '' check (char_length(rules) <= 2000),
  visibility text not null check (visibility in ('public', 'private')),
  denomination text check (denomination in (
    'anglican', 'baptist', 'lutheran', 'methodist', 'presbyterian_reformed',
    'pentecostal_charismatic', 'non_denominational', 'other_protestant')),
  owner_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.group_members (
  group_id uuid not null references public.groups (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  joined_at timestamptz not null default now(),
  muted_until timestamptz,
  banned boolean not null default false,
  primary key (group_id, user_id)
);
create index group_members_user_idx on public.group_members (user_id);

create table public.group_invites (
  code text primary key default replace(replace(encode(extensions.gen_random_bytes(9), 'base64'), '/', '_'), '+', '-'),
  group_id uuid not null references public.groups (id) on delete cascade,
  created_by uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  revoked boolean not null default false
);

-- ---------- access helpers ----------
create or replace function public.is_active_member(gid uuid, uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.group_members
                 where group_id = gid and user_id = uid and not banned)
$$;

create or replace function public.group_role(gid uuid, uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select role from public.group_members
  where group_id = gid and user_id = uid and not banned
$$;

create or replace function public.can_read_group(gid uuid, uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.groups g
    where g.id = gid
      and (public.is_active_member(gid, uid)
           or (g.visibility = 'public'
               and not exists (select 1 from public.group_members
                               where group_id = gid and user_id = uid and banned)))
  )
$$;

create or replace function public.can_moderate_group(gid uuid, uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce(public.group_role(gid, uid) in ('owner', 'admin'), false)
      or (public.is_site_admin(uid)
          and exists (select 1 from public.groups where id = gid and visibility = 'public'))
$$;

-- ---------- RLS ----------
alter table public.groups enable row level security;
alter table public.group_members enable row level security;
alter table public.group_invites enable row level security;

create policy "readable groups" on public.groups
  for select to authenticated using (public.can_read_group(id, auth.uid()));
create policy "members of readable groups" on public.group_members
  for select to authenticated using (public.can_read_group(group_id, auth.uid()));
create policy "moderators see invites" on public.group_invites
  for select to authenticated
  using (coalesce(public.group_role(group_id, auth.uid()) in ('owner', 'admin'), false));

revoke insert, update, delete on public.groups, public.group_members, public.group_invites
  from anon, authenticated;

-- ---------- RPCs ----------
create or replace function public.create_group(
  name text, description text, rules text, visibility text, denomination text)
returns public.groups
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.assert_can_write();
  base text;
  g public.groups;
begin
  base := trim(both '-' from regexp_replace(lower(coalesce(name, '')), '[^a-z0-9]+', '-', 'g'));
  if base = '' then base := 'group'; end if;
  insert into public.groups (name, slug, description, rules, visibility, denomination, owner_id)
  values (trim(name), left(base, 40) || '-' || substr(md5(random()::text), 1, 6),
          coalesce(description, ''), coalesce(rules, ''), visibility,
          nullif(denomination, ''), uid)
  returning * into g;
  insert into public.group_members (group_id, user_id, role) values (g.id, uid, 'owner');
  return g;
end $$;

create or replace function public.update_group(
  gid uuid, name text, description text, rules text, denomination text)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write();
begin
  if coalesce(public.group_role(gid, uid) in ('owner', 'admin'), false) is false then
    raise exception 'forbidden';
  end if;
  update public.groups set
    name = trim(update_group.name),
    description = coalesce(update_group.description, ''),
    rules = coalesce(update_group.rules, ''),
    denomination = nullif(update_group.denomination, '')
  where id = gid;
end $$;

create or replace function public.join_public_group(gid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); m public.group_members;
begin
  if not exists (select 1 from public.groups where id = gid and visibility = 'public') then
    raise exception 'forbidden';
  end if;
  select * into m from public.group_members where group_id = gid and user_id = uid;
  if found and m.banned then raise exception 'banned'; end if;
  insert into public.group_members (group_id, user_id) values (gid, uid)
  on conflict do nothing;
end $$;

create or replace function public.create_invite(gid uuid, days int default 7) returns text
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); c text;
begin
  if coalesce(public.group_role(gid, uid) in ('owner', 'admin'), false) is false then
    raise exception 'forbidden';
  end if;
  insert into public.group_invites (group_id, created_by, expires_at)
  values (gid, uid, now() + make_interval(days => greatest(1, least(coalesce(days, 7), 30))))
  returning code into c;
  return c;
end $$;

create or replace function public.revoke_invite(invite_code text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); gid uuid;
begin
  select group_id into gid from public.group_invites where code = invite_code;
  if gid is null or coalesce(public.group_role(gid, uid) in ('owner', 'admin'), false) is false then
    raise exception 'forbidden';
  end if;
  update public.group_invites set revoked = true where code = invite_code;
end $$;

-- Lets the invite page show which group a code is for (name only).
create or replace function public.invite_preview(invite_code text)
returns table (group_id uuid, group_name text, slug text, valid boolean)
language sql stable security definer set search_path = public as $$
  select g.id, g.name, g.slug, (not i.revoked and i.expires_at > now())
  from public.group_invites i join public.groups g on g.id = i.group_id
  where i.code = invite_code
$$;

create or replace function public.redeem_invite(invite_code text) returns public.groups
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.assert_can_write();
  i public.group_invites;
  m public.group_members;
  g public.groups;
begin
  select * into i from public.group_invites
  where code = invite_code and not revoked and expires_at > now();
  if not found then raise exception 'invalid_invite'; end if;
  select * into m from public.group_members where group_id = i.group_id and user_id = uid;
  if found and m.banned then raise exception 'banned'; end if;
  insert into public.group_members (group_id, user_id) values (i.group_id, uid)
  on conflict do nothing;
  select * into g from public.groups where id = i.group_id;
  return g;
end $$;

create or replace function public.leave_group(gid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write();
begin
  if public.group_role(gid, uid) = 'owner' then raise exception 'owner_must_transfer'; end if;
  -- banned rows are kept so the ban persists
  delete from public.group_members where group_id = gid and user_id = uid and not banned;
end $$;

create or replace function public.transfer_ownership(gid uuid, new_owner uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write();
begin
  if public.group_role(gid, uid) is distinct from 'owner' then raise exception 'forbidden'; end if;
  if not public.is_active_member(gid, new_owner) or new_owner = uid then
    raise exception 'not_member';
  end if;
  update public.group_members set role = 'admin' where group_id = gid and user_id = uid;
  update public.group_members set role = 'owner' where group_id = gid and user_id = new_owner;
  update public.groups set owner_id = new_owner where id = gid;
end $$;

create or replace function public.set_member_role(gid uuid, uid uuid, role text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.assert_can_write();
begin
  if public.group_role(gid, me) is distinct from 'owner' then raise exception 'forbidden'; end if;
  if set_member_role.role not in ('admin', 'member') then raise exception 'forbidden'; end if;
  if not public.is_active_member(gid, uid) or uid = me then raise exception 'not_member'; end if;
  update public.group_members gm set role = set_member_role.role
  where gm.group_id = gid and gm.user_id = uid;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'create_group(text,text,text,text,text)', 'update_group(uuid,text,text,text,text)',
    'join_public_group(uuid)', 'create_invite(uuid,int)', 'revoke_invite(text)',
    'invite_preview(text)', 'redeem_invite(text)', 'leave_group(uuid)',
    'transfer_ownership(uuid,uuid)', 'set_member_role(uuid,uuid,text)']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
