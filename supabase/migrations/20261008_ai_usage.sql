-- Monthly AI usage counters for free-tier limits (Trail Plus = unlimited via Paystack)

create table if not exists public.ai_usage (
  user_id text not null,
  period text not null,
  count integer not null default 0 check (count >= 0),
  last_source text,
  updated_at timestamptz not null default now(),
  primary key (user_id, period)
);

alter table public.ai_usage enable row level security;

drop policy if exists "Users read own ai usage" on public.ai_usage;
create policy "Users read own ai usage"
  on public.ai_usage for select
  using (
    user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claim.sub', true))
  );

-- Writes go through the service role from API routes (no client insert policy).
