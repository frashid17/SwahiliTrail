-- Public trip shares + operator lead capture (revenue story)

create table if not exists public.trip_shares (
  token text primary key,
  user_id text,
  trip_id text,
  title text not null,
  payload jsonb not null,
  created_at timestamptz not null default now(),
  expires_at timestamptz
);

create index if not exists trip_shares_user_id_idx
  on public.trip_shares (user_id, created_at desc);

alter table public.trip_shares enable row level security;

-- Public read by token (anon); writes via service role from API.
drop policy if exists "Anyone can read trip shares by token" on public.trip_shares;
create policy "Anyone can read trip shares by token"
  on public.trip_shares for select
  using (true);

create table if not exists public.operator_leads (
  id uuid primary key default gen_random_uuid(),
  share_token text references public.trip_shares (token) on delete set null,
  name text not null,
  email text,
  phone text,
  party_size integer,
  start_date text,
  notes text,
  trip_title text,
  source text not null default 'share_page',
  status text not null default 'new'
    check (status in ('new', 'contacted', 'won', 'lost')),
  created_at timestamptz not null default now()
);

create index if not exists operator_leads_created_at_idx
  on public.operator_leads (created_at desc);

alter table public.operator_leads enable row level security;

-- Inserts from API (service role). No public select.
drop policy if exists "No public read of leads" on public.operator_leads;
