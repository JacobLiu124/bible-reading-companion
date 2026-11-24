-- Moderation: reports, actions log, global restrictions, notices, account deletion.
-- Moderation records keep username snapshots so they outlive account deletion.

create table public.global_restrictions (
  user_id uuid primary key references public.profiles (id) on delete cascade,
  muted_until timestamptz,
  banned boolean not null default false
);

create table public.reports (
  id uuid primary key default gen_random_uuid(),
  is_global boolean not null,
  group_id uuid references public.groups (id) on delete cascade,
  post_id uuid references public.posts (id) on delete set null,
  comment_id uuid references public.comments (id) on delete set null,
  reporter_id uuid references public.profiles (id) on delete set null,
  reporter_username text not null,
  target_user_id uuid references public.profiles (id) on delete set null,
  target_username text not null,
  content_snapshot text not null default '',
  reason text not null check (reason in ('spam', 'harassment', 'inappropriate', 'other')),
  note text check (char_length(note) <= 500),
  status text not null default 'open' check (status in ('open', 'resolved', 'dismissed')),
  created_at timestamptz not null default now(),
  resolved_by uuid references public.profiles (id) on delete set null,
  resolved_at timestamptz
);
create index reports_open_idx on public.reports (group_id, status);

create table public.moderation_actions (
  id uuid primary key default gen_random_uuid(),
  is_global boolean not null,
  group_id uuid references public.groups (id) on delete set null,
  group_name text,
  target_user_id uuid references public.profiles (id) on delete set null,
  target_username text,
  actor_id uuid references public.profiles (id) on delete set null,
  actor_username text not null,
  action text not null check (action in
    ('remove_post', 'remove_comment', 'warn', 'mute', 'ban', 'unban', 'delete_group')),
  reason text,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);
create index moderation_actions_group_idx on public.moderation_actions (group_id, created_at desc);

create table public.notices (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'warning' check (kind in ('warning')),
  message text not null check (char_length(message) between 1 and 1000),
  created_at timestamptz not null default now(),
  acknowledged_at timestamptz
);

alter table public.global_restrictions enable row level security;
alter table public.reports enable row level security;
alter table public.moderation_actions enable row level security;
alter table public.notices enable row level security;
revoke all on public.global_restrictions from anon, authenticated;
revoke insert, update, delete on public.reports, public.moderation_actions, public.notices
  from anon, authenticated;

-- gid null = global thread
create or replace function public.can_moderate_space(gid uuid, uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select case when gid is null then public.is_site_admin(uid)
              else public.can_moderate_group(gid, uid) end
$$;

create policy "reporters and moderators see reports" on public.reports
  for select to authenticated using (
    reporter_id = auth.uid()
    or (is_global and public.is_site_admin(auth.uid()))
    or (not is_global and public.can_moderate_group(group_id, auth.uid())));
create policy "moderators see the log" on public.moderation_actions
  for select to authenticated using (
    (is_global and public.is_site_admin(auth.uid()))
    or (not is_global and group_id is not null and public.can_moderate_group(group_id, auth.uid())));
create policy "own notices" on public.notices
  for select to authenticated using (user_id = auth.uid());

create or replace function public.global_restriction(uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select case when r.banned then 'banned'
              when r.muted_until > now() then 'muted' end
  from public.global_restrictions r where r.user_id = uid
$$;

-- ---------- internal helpers ----------
create or replace function public.username_of(uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select username from public.profiles where id = uid
$$;

create or replace function public.log_action(
  gid uuid, target uuid, actor uuid, act text, why text, expires timestamptz default null)
returns void
language sql security definer set search_path = public as $$
  insert into public.moderation_actions
    (is_global, group_id, group_name, target_user_id, target_username, actor_id, actor_username,
     action, reason, expires_at)
  values (gid is null, gid, (select name from public.groups where id = gid), target,
          public.username_of(target), actor, public.username_of(actor), act, why, expires)
$$;

-- Raises forbidden unless actor may moderate target in the space.
-- Group owners/admins can't act on the owner; admins can't act on other admins.
create or replace function public.assert_can_moderate(gid uuid, actor uuid, target uuid) returns void
language plpgsql stable security definer set search_path = public as $$
declare actor_role text; target_role text;
begin
  if not public.can_moderate_space(gid, actor) then raise exception 'forbidden'; end if;
  if target is null or target = actor then return; end if;
  if gid is null then return; end if;
  target_role := (select role from public.group_members where group_id = gid and user_id = target);
  actor_role := public.group_role(gid, actor);
  if target_role = 'owner' then raise exception 'forbidden'; end if;
  if target_role = 'admin' and actor_role is distinct from 'owner'
     and not public.is_site_admin(actor) then
    raise exception 'forbidden';
  end if;
end $$;

-- ---------- RPCs ----------
create or replace function public.report_content(
  post_id uuid, comment_id uuid, reason text, note text) returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.assert_can_write();
  p public.posts;
  c public.comments;
begin
  if report_content.comment_id is not null then
    select * into c from public.comments where id = report_content.comment_id;
    if not found then raise exception 'forbidden'; end if;
    select * into p from public.posts where id = c.post_id;
  else
    select * into p from public.posts where id = report_content.post_id;
  end if;
  if p.id is null or not public.can_read_post(p.id, uid) then raise exception 'forbidden'; end if;

  insert into public.reports (is_global, group_id, post_id, comment_id, reporter_id, reporter_username,
                              target_user_id, target_username, content_snapshot, reason, note)
  values (p.group_id is null, p.group_id, p.id, c.id, uid, public.username_of(uid),
          coalesce(c.author_id, p.author_id), public.username_of(coalesce(c.author_id, p.author_id)),
          left(coalesce(c.body, concat_ws(E'\n', p.title, p.body, p.verse_ref, p.verse_text)), 2000),
          report_content.reason, nullif(trim(report_content.note), ''));
end $$;

create or replace function public.remove_post(id uuid, reason text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); p public.posts;
begin
  select * into p from public.posts where posts.id = remove_post.id;
  if not found then raise exception 'forbidden'; end if;
  perform public.assert_can_moderate(p.group_id, uid, p.author_id);
  update public.posts set removed_at = now(), removed_by = uid where posts.id = p.id;
  update public.reports set status = 'resolved', resolved_by = uid, resolved_at = now()
  where reports.post_id = p.id and reports.comment_id is null and status = 'open';
  perform public.log_action(p.group_id, p.author_id, uid, 'remove_post', reason);
end $$;

create or replace function public.remove_comment(id uuid, reason text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); c public.comments; gid uuid;
begin
  select * into c from public.comments where comments.id = remove_comment.id;
  if not found then raise exception 'forbidden'; end if;
  gid := (select group_id from public.posts where posts.id = c.post_id);
  perform public.assert_can_moderate(gid, uid, c.author_id);
  update public.comments set removed_at = now(), removed_by = uid where comments.id = c.id;
  update public.reports set status = 'resolved', resolved_by = uid, resolved_at = now()
  where reports.comment_id = c.id and status = 'open';
  perform public.log_action(gid, c.author_id, uid, 'remove_comment', reason);
end $$;

create or replace function public.warn_user(group_id uuid, uid uuid, message text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.assert_can_write(); where_txt text;
begin
  perform public.assert_can_moderate(warn_user.group_id, me, uid);
  where_txt := coalesce((select name from public.groups where id = warn_user.group_id), 'the daily global thread');
  insert into public.notices (user_id, message)
  values (uid, left('A moderator of ' || where_txt || ' sent you a warning: ' || trim(message), 1000));
  perform public.log_action(warn_user.group_id, uid, me, 'warn', message);
end $$;

create or replace function public.mute_user(group_id uuid, uid uuid, days int) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.assert_can_write(); until timestamptz;
begin
  perform public.assert_can_moderate(mute_user.group_id, me, uid);
  if days not in (1, 7) then raise exception 'invalid_duration'; end if;
  until := now() + make_interval(days => days);
  if mute_user.group_id is null then
    insert into public.global_restrictions (user_id, muted_until) values (uid, until)
    on conflict (user_id) do update set muted_until = excluded.muted_until;
  else
    update public.group_members gm set muted_until = until
    where gm.group_id = mute_user.group_id and gm.user_id = uid;
    if not found then raise exception 'not_member'; end if;
  end if;
  perform public.log_action(mute_user.group_id, uid, me, 'mute', null, until);
end $$;

create or replace function public.ban_user(group_id uuid, uid uuid, reason text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.assert_can_write();
begin
  perform public.assert_can_moderate(ban_user.group_id, me, uid);
  if uid = me then raise exception 'forbidden'; end if;
  if ban_user.group_id is null then
    insert into public.global_restrictions (user_id, banned) values (uid, true)
    on conflict (user_id) do update set banned = true;
  else
    insert into public.group_members (group_id, user_id, role, banned)
    values (ban_user.group_id, uid, 'member', true)
    on conflict on constraint group_members_pkey do update set banned = true, role = 'member';
  end if;
  perform public.log_action(ban_user.group_id, uid, me, 'ban', reason);
end $$;

create or replace function public.unban_user(group_id uuid, uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.assert_can_write();
begin
  perform public.assert_can_moderate(unban_user.group_id, me, uid);
  if unban_user.group_id is null then
    update public.global_restrictions set banned = false where user_id = uid;
  else
    delete from public.group_members gm
    where gm.group_id = unban_user.group_id and gm.user_id = uid and gm.banned;
  end if;
  perform public.log_action(unban_user.group_id, uid, me, 'unban', null);
end $$;

create or replace function public.delete_group(gid uuid, reason text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.assert_can_write(); g public.groups;
begin
  select * into g from public.groups where id = gid;
  if not found then raise exception 'forbidden'; end if;
  if public.group_role(gid, me) is distinct from 'owner'
     and not (public.is_site_admin(me) and g.visibility = 'public') then
    raise exception 'forbidden';
  end if;
  perform public.log_action(gid, g.owner_id, me, 'delete_group', reason);
  delete from public.groups where id = gid;
end $$;

create or replace function public.resolve_report(id uuid, status text) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.assert_can_write(); r public.reports;
begin
  select * into r from public.reports where reports.id = resolve_report.id;
  if not found or not public.can_moderate_space(r.group_id, me)
     or (r.is_global is false and r.group_id is null) then
    raise exception 'forbidden';
  end if;
  if resolve_report.status not in ('resolved', 'dismissed') then raise exception 'forbidden'; end if;
  update public.reports set status = resolve_report.status, resolved_by = me, resolved_at = now()
  where reports.id = r.id;
end $$;

create or replace function public.acknowledge_notice(id uuid) returns void
language plpgsql security definer set search_path = public as $$
begin
  update public.notices set acknowledged_at = now()
  where notices.id = acknowledge_notice.id and user_id = auth.uid() and acknowledged_at is null;
end $$;

create or replace function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
declare
  me uuid := public.assert_can_write();
  g record;
  heir uuid;
begin
  -- hand each owned group to the longest-standing admin, else member; else delete it
  for g in select group_id from public.group_members where user_id = me and role = 'owner' loop
    select user_id into heir from public.group_members
    where group_id = g.group_id and user_id <> me and not banned
    order by (role = 'admin') desc, joined_at asc limit 1;
    if heir is null then
      delete from public.groups where id = g.group_id;
    else
      update public.group_members set role = 'owner' where group_id = g.group_id and user_id = heir;
      update public.groups set owner_id = heir where id = g.group_id;
    end if;
  end loop;
  delete from auth.users where id = me;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'report_content(uuid,uuid,text,text)', 'remove_post(uuid,text)', 'remove_comment(uuid,text)',
    'warn_user(uuid,uuid,text)', 'mute_user(uuid,uuid,int)', 'ban_user(uuid,uuid,text)',
    'unban_user(uuid,uuid)', 'delete_group(uuid,text)', 'resolve_report(uuid,text)',
    'acknowledge_notice(uuid)', 'delete_my_account()']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

-- internal helpers are not callable by clients
revoke execute on function public.log_action(uuid,uuid,uuid,text,text,timestamptz) from public, anon, authenticated;
