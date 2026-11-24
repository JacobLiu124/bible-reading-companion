-- Posts, comments, reactions and blocks.
-- Clients never touch the base tables: all reads go through the feed_* views
-- (which hide removed text and blocked authors) and all writes through RPCs.

create table public.posts (
  id uuid primary key default gen_random_uuid(),
  kind text not null check (kind in ('reading', 'general')),
  author_id uuid not null references public.profiles (id) on delete cascade,
  group_id uuid references public.groups (id) on delete cascade, -- null = global thread
  reading_date date,
  reference text,
  title text check (char_length(title) <= 120),
  body text check (char_length(body) <= 1000),
  verse_ref text check (char_length(verse_ref) <= 60),
  verse_text text check (char_length(verse_text) <= 500),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  removed_at timestamptz,
  removed_by uuid references public.profiles (id) on delete set null,
  constraint reading_shape check (kind <> 'reading' or
    (reading_date is not null and reference is not null and title is null
     and (nullif(trim(body), '') is not null or nullif(trim(verse_text), '') is not null))),
  constraint general_shape check (kind <> 'general' or
    (group_id is not null and reading_date is null and nullif(trim(body), '') is not null))
);
create index posts_group_idx on public.posts (group_id, created_at desc);
create index posts_global_idx on public.posts (reading_date, created_at desc) where group_id is null;
create index posts_author_idx on public.posts (author_id, created_at desc);

create table public.comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid not null references public.posts (id) on delete cascade,
  author_id uuid not null references public.profiles (id) on delete cascade,
  body text not null check (char_length(trim(body)) between 1 and 1000),
  created_at timestamptz not null default now(),
  edited_at timestamptz,
  removed_at timestamptz,
  removed_by uuid references public.profiles (id) on delete set null
);
create index comments_post_idx on public.comments (post_id, created_at);
create index comments_author_idx on public.comments (author_id, created_at desc);

create table public.reactions (
  post_id uuid not null references public.posts (id) on delete cascade,
  user_id uuid not null references public.profiles (id) on delete cascade,
  kind text not null default 'pray' check (kind in ('pray')),
  created_at timestamptz not null default now(),
  primary key (post_id, user_id, kind)
);

create table public.blocks (
  blocker_id uuid not null references public.profiles (id) on delete cascade,
  blocked_id uuid not null references public.profiles (id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (blocker_id, blocked_id),
  check (blocker_id <> blocked_id)
);

alter table public.posts enable row level security;
alter table public.comments enable row level security;
alter table public.reactions enable row level security;
alter table public.blocks enable row level security;

-- No direct table access for clients (views + RPCs only), except own blocks.
revoke all on public.posts, public.comments, public.reactions from anon, authenticated;
revoke insert, update, delete on public.blocks from anon, authenticated;
create policy "own blocks" on public.blocks
  for select to authenticated using (blocker_id = auth.uid());

-- ---------- access helpers ----------
create or replace function public.can_read_post(pid uuid, uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.posts p
                 where p.id = pid
                   and (p.group_id is null or public.can_read_group(p.group_id, uid)))
$$;

-- Replaced in the moderation migration; returns 'banned' | 'muted' | null.
create or replace function public.global_restriction(uid uuid) returns text
language sql stable security definer set search_path = public as $$
  select null::text
$$;

-- Raises if uid may not write (post/comment/react) in the given space.
-- gid null = global thread. kind: 'post' | 'comment' | 'react'.
create or replace function public.assert_can_participate(gid uuid, uid uuid, kind text)
returns void
language plpgsql stable security definer set search_path = public as $$
declare
  m public.group_members;
  newcomer boolean;
  recent int;
begin
  if gid is null then
    if public.global_restriction(uid) is not null then
      raise exception '%', public.global_restriction(uid);
    end if;
    newcomer := (select created_at > now() - interval '48 hours' from public.profiles where id = uid);
  else
    select * into m from public.group_members where group_id = gid and user_id = uid;
    if found and m.banned then raise exception 'banned'; end if;
    if not found then raise exception 'not_member'; end if;
    if m.muted_until is not null and m.muted_until > now() then raise exception 'muted'; end if;
    newcomer := m.joined_at > now() - interval '48 hours';
  end if;

  if newcomer and kind = 'post' then
    select count(*) into recent from public.posts
    where author_id = uid and group_id is not distinct from gid
      and created_at > now() - interval '1 hour';
    if recent >= 3 then raise exception 'slow_mode'; end if;
  elsif newcomer and kind = 'comment' then
    select count(*) into recent from public.comments c join public.posts p on p.id = c.post_id
    where c.author_id = uid and p.group_id is not distinct from gid
      and c.created_at > now() - interval '1 hour';
    if recent >= 10 then raise exception 'slow_mode'; end if;
  end if;
end $$;

-- ---------- views ----------
-- Run with owner privileges; every row is filtered by auth.uid() explicitly.
create view public.feed_posts as
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
  select case when p.group_id is null then public.is_site_admin(auth.uid())
              else public.can_moderate_group(p.group_id, auth.uid()) end as can
) mod
where auth.uid() is not null
  and (p.group_id is null or public.can_read_group(p.group_id, auth.uid()))
  and not exists (select 1 from public.blocks b
                  where b.blocker_id = auth.uid() and b.blocked_id = p.author_id);

create view public.feed_comments as
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
  select case when p.group_id is null then public.is_site_admin(auth.uid())
              else public.can_moderate_group(p.group_id, auth.uid()) end as can
) mod
where auth.uid() is not null
  and (p.group_id is null or public.can_read_group(p.group_id, auth.uid()))
  and not exists (select 1 from public.blocks b
                  where b.blocker_id = auth.uid() and b.blocked_id = c.author_id);

revoke all on public.feed_posts, public.feed_comments from anon;
grant select on public.feed_posts, public.feed_comments to authenticated;

-- ---------- RPCs ----------
create or replace function public.create_reading_post(
  group_ids uuid[], to_global boolean, body text, verse_ref text, verse_text text)
returns setof public.posts
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.assert_can_write();
  today date := public.user_today(uid);
  ref text;
  gid uuid;
  p public.posts;
begin
  select label into ref from public.reading_schedule where day = today;
  if ref is null then raise exception 'no_reading_today'; end if;
  if not exists (select 1 from public.check_ins where user_id = uid and local_date = today) then
    raise exception 'not_checked_in';
  end if;
  if coalesce(array_length(group_ids, 1), 0) = 0 and not coalesce(to_global, false) then
    raise exception 'no_destination';
  end if;

  -- validate every destination before writing any
  foreach gid in array coalesce(group_ids, '{}') loop
    perform public.assert_can_participate(gid, uid, 'post');
  end loop;
  if to_global then perform public.assert_can_participate(null, uid, 'post'); end if;

  foreach gid in array coalesce(group_ids, '{}') loop
    insert into public.posts (kind, author_id, group_id, reading_date, reference, body, verse_ref, verse_text)
    values ('reading', uid, gid, today, ref, nullif(trim(body), ''), nullif(trim(verse_ref), ''), nullif(trim(verse_text), ''))
    returning * into p;
    return next p;
  end loop;
  if to_global then
    insert into public.posts (kind, author_id, group_id, reading_date, reference, body, verse_ref, verse_text)
    values ('reading', uid, null, today, ref, nullif(trim(body), ''), nullif(trim(verse_ref), ''), nullif(trim(verse_text), ''))
    returning * into p;
    return next p;
  end if;
end $$;

create or replace function public.create_general_post(group_id uuid, title text, body text)
returns public.posts
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); p public.posts;
begin
  if create_general_post.group_id is null then raise exception 'global_reading_only'; end if;
  perform public.assert_can_participate(create_general_post.group_id, uid, 'post');
  insert into public.posts (kind, author_id, group_id, title, body)
  values ('general', uid, create_general_post.group_id,
          nullif(trim(create_general_post.title), ''), trim(create_general_post.body))
  returning * into p;
  return p;
end $$;

create or replace function public.add_comment(post_id uuid, body text)
returns public.comments
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); p public.posts; c public.comments;
begin
  select * into p from public.posts where id = add_comment.post_id;
  if not found or p.removed_at is not null or not public.can_read_post(p.id, uid) then
    raise exception 'forbidden';
  end if;
  perform public.assert_can_participate(p.group_id, uid, 'comment');
  insert into public.comments (post_id, author_id, body)
  values (p.id, uid, trim(add_comment.body))
  returning * into c;
  return c;
end $$;

create or replace function public.toggle_reaction(post_id uuid) returns boolean
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); p public.posts;
begin
  select * into p from public.posts where id = toggle_reaction.post_id;
  if not found or p.removed_at is not null or not public.can_read_post(p.id, uid) then
    raise exception 'forbidden';
  end if;
  perform public.assert_can_participate(p.group_id, uid, 'react');
  delete from public.reactions r where r.post_id = p.id and r.user_id = uid;
  if found then return false; end if;
  insert into public.reactions (post_id, user_id) values (p.id, uid);
  return true;
end $$;

create or replace function public.edit_post(
  id uuid, title text, body text, verse_ref text, verse_text text)
returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write();
begin
  update public.posts p set
    title = case when p.kind = 'general' then nullif(trim(edit_post.title), '') end,
    body = nullif(trim(edit_post.body), ''),
    verse_ref = case when p.kind = 'reading' then nullif(trim(edit_post.verse_ref), '') end,
    verse_text = case when p.kind = 'reading' then nullif(trim(edit_post.verse_text), '') end,
    edited_at = now()
  where p.id = edit_post.id and p.author_id = uid and p.removed_at is null;
  if not found then raise exception 'forbidden'; end if;
end $$;

create or replace function public.delete_post(id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write();
begin
  delete from public.posts p where p.id = delete_post.id and p.author_id = uid;
  if not found then raise exception 'forbidden'; end if;
end $$;

create or replace function public.edit_comment(id uuid, body text) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write();
begin
  update public.comments c set body = trim(edit_comment.body), edited_at = now()
  where c.id = edit_comment.id and c.author_id = uid and c.removed_at is null;
  if not found then raise exception 'forbidden'; end if;
end $$;

create or replace function public.delete_comment(id uuid) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write();
begin
  delete from public.comments c where c.id = delete_comment.id and c.author_id = uid;
  if not found then raise exception 'forbidden'; end if;
end $$;

create or replace function public.block_user(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.assert_can_write();
begin
  if uid = me then raise exception 'forbidden'; end if;
  insert into public.blocks (blocker_id, blocked_id) values (me, uid) on conflict do nothing;
end $$;

create or replace function public.unblock_user(uid uuid) returns void
language plpgsql security definer set search_path = public as $$
declare me uuid := public.assert_can_write();
begin
  delete from public.blocks where blocker_id = me and blocked_id = uid;
end $$;

do $$
declare f text;
begin
  foreach f in array array[
    'create_reading_post(uuid[],boolean,text,text,text)', 'create_general_post(uuid,text,text)',
    'add_comment(uuid,text)', 'toggle_reaction(uuid)', 'edit_post(uuid,text,text,text,text)',
    'delete_post(uuid)', 'edit_comment(uuid,text)', 'delete_comment(uuid)',
    'block_user(uuid)', 'unblock_user(uuid)']
  loop
    execute format('revoke execute on function public.%s from public, anon', f);
    execute format('grant execute on function public.%s to authenticated', f);
  end loop;
end $$;
