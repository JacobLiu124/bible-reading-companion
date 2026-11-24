-- Profiles, weekly goals, reading schedule and check-ins.
-- All access rules live here (RLS + security definer RPCs).

-- ---------- helpers ----------
create or replace function public.is_valid_timezone(tz text) returns boolean
language sql stable as $$
  select exists (select 1 from pg_timezone_names where name = tz)
$$;

create or replace function public.week_start(d date) returns date
language sql immutable as $$
  select d - (extract(isodow from d)::int - 1)
$$;

-- ---------- profiles ----------
create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  username text not null unique check (username ~ '^[a-z0-9_]{3,24}$'),
  display_name text not null check (char_length(display_name) between 1 and 40),
  denomination text check (denomination in (
    'anglican', 'baptist', 'lutheran', 'methodist', 'presbyterian_reformed',
    'pentecostal_charismatic', 'non_denominational', 'other_protestant')),
  timezone text not null default 'UTC' check (public.is_valid_timezone(timezone)),
  weekly_goal int not null default 3 check (weekly_goal between 1 and 7),
  is_site_admin boolean not null default false,
  is_demo boolean not null default false,
  created_at timestamptz not null default now()
);

create or replace function public.is_site_admin(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_site_admin from public.profiles where id = uid), false)
$$;

create or replace function public.is_demo(uid uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select coalesce((select is_demo from public.profiles where id = uid), false)
$$;

create or replace function public.user_today(uid uuid) returns date
language sql stable security definer set search_path = public as $$
  select (now() at time zone coalesce(
    (select timezone from public.profiles where id = uid), 'UTC'))::date
$$;

-- Raises demo_read_only / not_signed_in; used at the top of every write RPC.
create or replace function public.assert_can_write() returns uuid
language plpgsql stable security definer set search_path = public as $$
declare uid uuid := auth.uid();
begin
  if uid is null then raise exception 'forbidden'; end if;
  if public.is_demo(uid) then raise exception 'demo_read_only'; end if;
  return uid;
end $$;

alter table public.profiles enable row level security;

create policy "profiles readable by signed-in users" on public.profiles
  for select to authenticated using (true);

create policy "users update own profile" on public.profiles
  for update to authenticated
  using (id = auth.uid() and not public.is_demo(auth.uid()))
  with check (id = auth.uid());

-- Only these columns are user-editable; flags and goal go through RPCs.
revoke insert, update, delete on public.profiles from anon, authenticated;
grant update (display_name, denomination, timezone) on public.profiles to authenticated;

-- ---------- goal history ----------
create table public.goal_history (
  user_id uuid not null references public.profiles (id) on delete cascade,
  effective_week_start date not null,
  goal int not null check (goal between 1 and 7),
  primary key (user_id, effective_week_start)
);
alter table public.goal_history enable row level security;
create policy "own goal history" on public.goal_history
  for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.goal_history from anon, authenticated;

-- ---------- signup trigger ----------
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
declare
  meta jsonb := coalesce(new.raw_user_meta_data, '{}'::jsonb);
  uname text := lower(coalesce(meta->>'username', ''));
  tz text := coalesce(meta->>'timezone', 'UTC');
begin
  if uname !~ '^[a-z0-9_]{3,24}$' then
    uname := 'user_' || substr(replace(new.id::text, '-', ''), 1, 8);
  end if;
  if not public.is_valid_timezone(tz) then tz := 'UTC'; end if;

  insert into public.profiles (id, username, display_name, timezone)
  values (new.id, uname,
          left(coalesce(nullif(trim(meta->>'display_name'), ''), uname), 40), tz);

  insert into public.goal_history (user_id, effective_week_start, goal)
  values (new.id, public.week_start((now() at time zone tz)::date), 3);
  return new;
end $$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- reading schedule ----------
create table public.reading_schedule (
  day date primary key,
  book text not null,
  chapter int not null check (chapter > 0),
  label text not null
);
alter table public.reading_schedule enable row level security;
create policy "schedule readable" on public.reading_schedule
  for select to authenticated using (true);
create policy "site admins manage schedule" on public.reading_schedule
  for all to authenticated
  using (public.is_site_admin(auth.uid()))
  with check (public.is_site_admin(auth.uid()));
revoke insert, update, delete on public.reading_schedule from anon;
-- authenticated keeps table privileges so admins can write; RLS limits it,
-- but a failing policy on insert raises 42501 for non-admins.

-- ---------- check-ins ----------
create table public.check_ins (
  user_id uuid not null references public.profiles (id) on delete cascade,
  local_date date not null,
  created_at timestamptz not null default now(),
  primary key (user_id, local_date)
);
alter table public.check_ins enable row level security;
create policy "own check-ins" on public.check_ins
  for select to authenticated using (user_id = auth.uid());
revoke insert, update, delete on public.check_ins from anon, authenticated;

create or replace function public.check_in() returns date
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); d date;
begin
  d := public.user_today(uid);
  insert into public.check_ins (user_id, local_date) values (uid, d)
  on conflict do nothing;
  return d;
end $$;

create or replace function public.set_weekly_goal(goal int) returns void
language plpgsql security definer set search_path = public as $$
declare uid uuid := public.assert_can_write(); ws date;
begin
  if goal is null or goal < 1 or goal > 7 then raise exception 'invalid_goal'; end if;
  ws := public.week_start(public.user_today(uid));
  update public.profiles set weekly_goal = goal where id = uid;
  insert into public.goal_history (user_id, effective_week_start, goal)
  values (uid, ws, goal)
  on conflict (user_id, effective_week_start) do update set goal = excluded.goal;
end $$;

-- RPCs callable by signed-in users only.
revoke execute on function public.check_in() from public, anon;
revoke execute on function public.set_weekly_goal(int) from public, anon;
grant execute on function public.check_in() to authenticated;
grant execute on function public.set_weekly_goal(int) to authenticated;
