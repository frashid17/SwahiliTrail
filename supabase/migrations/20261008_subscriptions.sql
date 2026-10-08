-- Trail Plus subscriptions (Paystack)

create table if not exists public.subscriptions (
  user_id text primary key,
  status text not null default 'inactive'
    check (status in ('active', 'inactive', 'past_due', 'cancelled')),
  plan text not null default 'trail_plus',
  provider text not null default 'paystack',
  paystack_reference text,
  paystack_customer_code text,
  paystack_subscription_code text,
  email text,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.subscriptions enable row level security;

drop policy if exists "Users read own subscription" on public.subscriptions;
create policy "Users read own subscription"
  on public.subscriptions for select
  using (
    user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claim.sub', true))
  );

-- Writes go through the service role from API routes / webhooks.
