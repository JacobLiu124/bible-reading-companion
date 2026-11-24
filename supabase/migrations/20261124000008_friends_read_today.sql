-- People who share a group with me (not banned, not blocked by me) and have checked in
-- today in their own timezone. Powers the "Ruth, Sam and 4 others read today" row.
create or replace function public.friends_read_today()
returns table (user_id uuid, username text, display_name text, checked_in_at timestamptz)
language sql stable security definer set search_path = public as $$
  select distinct on (p.id) p.id, p.username, p.display_name, c.created_at
  from public.group_members mine
  join public.group_members theirs
    on theirs.group_id = mine.group_id and theirs.user_id <> mine.user_id and not theirs.banned
  join public.profiles p on p.id = theirs.user_id
  join public.check_ins c on c.user_id = p.id and c.local_date = public.user_today(p.id)
  where mine.user_id = auth.uid() and not mine.banned
    and not exists (select 1 from public.blocks b where b.blocker_id = auth.uid() and b.blocked_id = p.id)
  order by p.id
$$;

grant execute on function public.friends_read_today() to authenticated;
