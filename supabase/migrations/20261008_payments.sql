-- Payment history + cancel-at-period-end for Trail Plus

alter table public.subscriptions
  add column if not exists cancel_at_period_end boolean not null default false;

create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  provider text not null default 'paystack',
  reference text not null,
  amount integer not null check (amount >= 0),
  currency text not null default 'KES',
  status text not null default 'success'
    check (status in ('success', 'failed', 'pending', 'refunded')),
  paid_at timestamptz,
  description text,
  receipt_number text,
  created_at timestamptz not null default now(),
  unique (provider, reference)
);

create index if not exists payments_user_id_paid_at_idx
  on public.payments (user_id, paid_at desc);

alter table public.payments enable row level security;

drop policy if exists "Users read own payments" on public.payments;
create policy "Users read own payments"
  on public.payments for select
  using (
    user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claim.sub', true))
  );

-- Writes go through the service role from API routes / webhooks.
