-- Undo today's check-in within 10 minutes (a mis-tap shouldn't inflate the streak).
create or replace function public.undo_check_in() returns void
language plpgsql security definer set search_path = public as $$
declare
  uid uuid := public.assert_can_write();
  c public.check_ins;
begin
  select * into c from public.check_ins
  where user_id = uid and local_date = public.user_today(uid);
  if not found then raise exception 'not_checked_in'; end if;
  if c.created_at < now() - interval '10 minutes' then raise exception 'undo_expired'; end if;
  delete from public.check_ins where user_id = uid and local_date = c.local_date;
end $$;

grant execute on function public.undo_check_in() to authenticated;
