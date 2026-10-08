-- Atomic AI usage increment (avoids lost updates / reset-to-zero races)

create or replace function public.increment_ai_usage(
  p_user_id text,
  p_period text,
  p_source text
)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  new_count integer;
begin
  insert into public.ai_usage as u (user_id, period, count, last_source, updated_at)
  values (p_user_id, p_period, 1, p_source, now())
  on conflict (user_id, period)
  do update set
    count = u.count + 1,
    last_source = excluded.last_source,
    updated_at = now()
  returning u.count into new_count;

  return new_count;
end;
$$;

revoke all on function public.increment_ai_usage(text, text, text) from public;
grant execute on function public.increment_ai_usage(text, text, text) to service_role;
