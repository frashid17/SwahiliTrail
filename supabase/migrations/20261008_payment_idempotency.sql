-- Pending checkouts + webhook event dedupe for Paystack Trail Plus

alter table public.payments
  add column if not exists provider_event_id text;

create unique index if not exists payments_provider_event_id_uidx
  on public.payments (provider, provider_event_id)
  where provider_event_id is not null;

create table if not exists public.billing_webhook_events (
  id uuid primary key default gen_random_uuid(),
  provider text not null default 'paystack',
  event_id text not null,
  event_name text,
  reference text,
  processed_at timestamptz not null default now(),
  unique (provider, event_id)
);

create index if not exists billing_webhook_events_reference_idx
  on public.billing_webhook_events (reference);

alter table public.billing_webhook_events enable row level security;

-- Service role only (no public policies).
