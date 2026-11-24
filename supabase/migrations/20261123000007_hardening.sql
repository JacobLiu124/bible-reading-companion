-- Hardening after review:
--  1. Internal helpers that take a uid are no longer callable by clients (they leaked
--     private-group membership). RLS policies now use caller-only helpers.
--  2. Reporters can't read report rows, and removed content can't be reported, so removed
--     text can't be read back through content_snapshot.
--  3. Muted/banned users can't edit their existing posts/comments.
--  4. The shared demo account's password and email can't be changed.

-- ---------- caller-only helpers for RLS policies ----------
create or replace function public.am_site_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_site_admin(auth.uid())
$$;

create or replace function public.am_demo() returns boolean
language sql stable security definer set search_path = public as $$
  select public.is_demo(auth.uid())
$$;

create or replace function public.i_can_read_group(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_read_group(gid, auth.uid())
$$;

create or replace function public.my_group_role(gid uuid) returns text
language sql stable security definer set search_path = public as $$
  select public.group_role(gid, auth.uid())
$$;

create or replace function public.i_can_moderate_group(gid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select public.can_moderate_group(gid, auth.uid())
$$;

-- ---------- rewrite policies onto caller-only helpers ----------
drop policy "users update own profile" on public.profiles;
create policy "users update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid() and not public.am_demo())
  with check (id = auth.uid());

drop policy "site admins manage schedule" on public.reading_schedule;
create policy "site admins manage schedule" on public.reading_schedule
  for all to authenticated
  using (public.am_site_admin())
  with check (public.am_site_admin());

drop policy "readable groups" on public.groups;
create policy "readable groups" on public.groups
  for select to authenticated using (public.i_can_read_group(id));

drop policy "members of readable groups" on public.group_members;
create policy "members of readable groups" on public.group_members
  for select to authenticated using (public.i_can_read_group(group_id));

drop policy "moderators see invites" on public.group_invites;
create policy "moderators see invites" on public.group_invites
  for select to authenticated
  using (coalesce(public.my_group_role(group_id) in ('owner', 'admin'), false));

-- Reporters no longer read their own reports (the snapshot could expose removed text).
drop policy "reporters and moderators see reports" on public.reports;
create policy "moderators see reports" on public.reports
  for select to authenticated using (
    (is_global and public.am_site_admin())
    or (not is_global and public.i_can_moderate_group(group_id)));

drop policy "moderators see the log" on public.moderation_actions;
create policy "moderators see the log" on public.moderation_actions
  for select to authenticated using (
    (is_global and public.am_site_admin())
    or (not is_global and group_id is not null and public.i_can_moderate_group(group_id)));

-- ---------- feed views: function calls are checked as the caller, so use caller-only helpers ----------
create or replace view public.feed_posts as
select
  p.id, p.kind, p.group_id, g.name as group_name, g.slug as group_slug,
  p.author_id, a.username as author_username, a.display_name as author_display_name,
  p.reading_date, p.reference,
  case when p.removed_at is null or mod.can then p.title end as title,
  case when p.removed_at is null or mod.can then p.body end as body,
  case when p.removed_at is null or mod.can then p.verse_ref end as verse_ref,
  case when p.removed_at is null or mod.can then p.verse_text end as verse_text,
  p.created_at, p.edited_at, (p.removed_at is not null) as removed,
  (select count(*) from public.reactions r where r.post_id = p.id) as reaction_count,
  exists (select 1 from public.reactions r where r.post_id = p.id and r.user_id = auth.uid()) as reacted_by_me,
  (select count(*) from public.comments c where c.post_id = p.id and c.removed_at is null) as comment_count,
  mod.can as can_moderate
from public.posts p
join public.profiles a on a.id = p.author_id
left join public.groups g on g.id = p.group_id
cross join lateral (
  select case when p.group_id is null then public.am_site_admin()
              else public.i_can_moderate_group(p.group_id) end as can
) mod
where auth.uid() is not null
  and (p.group_id is null or public.i_can_read_group(p.group_id))
  and not exists (select 1 from public.blocks b
                  where b.blocker_id = auth.uid() and b.blocked_id = p.author_id);

create or replace view public.feed_comments as
select
  c.id, c.post_id, c.author_id, a.username as author_username,
  a.display_name as author_display_name,
  case when c.removed_at is null or mod.can then c.body end as body,
  c.created_at, c.edited_at, (c.removed_at is not null) as removed,
  mod.can as can_moderate
from public.comments c
join public.posts p on p.id = c.post_id
join public.profiles a on a.id = c.author_id
cross join lateral (
  select case when p.group_id is null then public.am_site_admin()
              else public.i_can_moderate_group(p.group_id) end as can
) mod
where auth.uid() is not null
  and (p.group_id is null or public.i_can_read_group(p.group_id))
  and not exists (select 1 from public.blocks b
                  where b.blocker_id = auth.uid() and b.blocked_id = c.author_id);


-- ---------- removed content can't be reported ----------
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
    if not found or c.removed_at is not null then raise exception 'forbidden'; end if;
    select * into p from public.posts where id = c.post_id;
  else
    select * into p from public.posts where id = report_content.post_id;
  end if;
  if p.id is null or p.removed_at is not null or not public.can_read_post(p.id, uid) then
    raise exception 'forbidden';
  end if;

  insert into public.reports (is_global, group_id, post_id, comment_id, reporter_id, reporter_username,
                              target_user_id, target_username, content_snapshot, reason, note)
  values (p.group_id is null, p.group_id, p.id, c.id, uid, public.username_of(uid),
          coalesce(c.author_id, p.author_id), public.username_of(coalesce(c.author_id, p.author_id)),
          left(coalesce(c.body, concat_ws(E'\n', p.title, p.body, p.verse_ref, p.verse_text)), 2000),
          report_content.reason, nullif(trim(report_content.note), ''));
end $$;

-- ---------- edits respect mutes and bans ----------
create or replace function public.edit_post(
  id uuid, title text, body text, verse_ref text, verse_text text)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); p public.posts;
begin
  select * into p from public.posts where posts.id = edit_post.id and author_id = uid and removed_at is null;
  if not found then raise exception 'forbidden'; end if;
  perform public.assert_can_participate(p.group_id, uid, 'edit');
  update public.posts set
    title = case when p.kind = 'general' then nullif(trim(edit_post.title), '') end,
    body = nullif(trim(edit_post.body), ''),
    verse_ref = case when p.kind = 'reading' then nullif(trim(edit_post.verse_ref), '') end,
    verse_text = case when p.kind = 'reading' then nullif(trim(edit_post.verse_text), '') end,
    edited_at = now()
  where posts.id = p.id;
end $$;

create or replace function public.edit_comment(id uuid, body text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); c public.comments; gid uuid;
begin
  select * into c from public.comments where comments.id = edit_comment.id and author_id = uid and removed_at is null;
  if not found then raise exception 'forbidden'; end if;
  gid := (select group_id from public.posts where posts.id = c.post_id);
  perform public.assert_can_participate(gid, uid, 'edit');
  update public.comments set body = trim(edit_comment.body), edited_at = now() where comments.id = c.id;
end $$;

-- ---------- protect the shared demo account ----------
create or replace function public.protect_demo_account() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  if public.is_demo(old.id) then
    raise exception 'demo_read_only';
  end if;
  return new;
end $$;

create trigger protect_demo_account
  before update of encrypted_password, email, phone on auth.users
  for each row
  when (old.encrypted_password is distinct from new.encrypted_password
        or old.email is distinct from new.email
        or old.phone is distinct from new.phone)
  execute function public.protect_demo_account();

-- ---------- function privileges: deny by default, allow-list RPCs ----------
alter default privileges in schema public revoke execute on functions from public, anon, authenticated;

do $$
declare f record;
begin
  for f in
    select p.oid::regprocedure as sig
    from pg_proc p join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public'
  loop
    execute format('revoke execute on function %s from public, anon, authenticated', f.sig);
  end loop;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    -- RPCs
    'check_in()', 'set_weekly_goal(int)',
    'create_group(text,text,text,text,text)', 'update_group(uuid,text,text,text,text)',
    'join_public_group(uuid)', 'create_invite(uuid,int)', 'revoke_invite(text)',
    'invite_preview(text)', 'redeem_invite(text)', 'leave_group(uuid)',
    'transfer_ownership(uuid,uuid)', 'set_member_role(uuid,uuid,text)',
    'create_reading_post(uuid[],boolean,text,text,text)', 'create_general_post(uuid,text,text)',
    'add_comment(uuid,text)', 'toggle_reaction(uuid)', 'edit_post(uuid,text,text,text,text)',
    'delete_post(uuid)', 'edit_comment(uuid,text)', 'delete_comment(uuid)',
    'block_user(uuid)', 'unblock_user(uuid)',
    'report_content(uuid,uuid,text,text)', 'remove_post(uuid,text)', 'remove_comment(uuid,text)',
    'warn_user(uuid,uuid,text)', 'mute_user(uuid,uuid,int)', 'ban_user(uuid,uuid,text)',
    'unban_user(uuid,uuid)', 'delete_group(uuid,text)', 'resolve_report(uuid,text)',
    'acknowledge_notice(uuid)', 'delete_my_account()', 'username_available(text)',
    -- caller-only helpers used by RLS policies, and the timezone check constraint
    'am_site_admin()', 'am_demo()', 'i_can_read_group(uuid)', 'my_group_role(uuid)',
    'i_can_moderate_group(uuid)', 'is_valid_timezone(text)', 'week_start(date)']
  loop
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;

grant execute on function public.username_available(text) to anon;
