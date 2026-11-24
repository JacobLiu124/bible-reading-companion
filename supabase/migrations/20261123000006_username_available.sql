-- Lets the sign-up form check a username before creating the account.
create or replace function public.username_available(name text) returns boolean
language sql stable security definer set search_path = public as $$
  select not exists (select 1 from public.profiles where username = lower(trim(name)))
$$;
grant execute on function public.username_available(text) to anon, authenticated;
