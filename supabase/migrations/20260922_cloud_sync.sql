-- Cross-device sync for My Trips + Guide (Clerk user_id)
-- Run in the Supabase SQL editor: https://supabase.com/dashboard/project/_/sql

alter table public.guide_sessions
  add column if not exists title text;

create index if not exists guide_sessions_user_id_idx
  on public.guide_sessions (user_id);

create table if not exists public.saved_trips (
  id text primary key,
  user_id text not null,
  start_date date not null,
  days integer not null,
  party_size integer not null default 1,
  companions text default 'family',
  budget text default 'mid',
  transport_mode text default 'none',
  plan jsonb not null,
  status text not null default 'upcoming'
    check (status in ('upcoming', 'completed')),
  completed_at timestamptz,
  saved_at timestamptz not null default now()
);

create index if not exists saved_trips_user_id_idx
  on public.saved_trips (user_id);

create index if not exists saved_trips_saved_at_idx
  on public.saved_trips (user_id, saved_at desc);

alter table public.saved_trips enable row level security;

-- Clerk authenticates our Next.js APIs; app filters by user_id.
-- Prefer SUPABASE_SERVICE_ROLE_KEY in production to bypass RLS entirely.
drop policy if exists "Users manage own saved trips" on public.saved_trips;
drop policy if exists "saved_trips app access" on public.saved_trips;
create policy "saved_trips app access"
  on public.saved_trips for all
  using (true)
  with check (true);

drop policy if exists "Users manage own guide sessions" on public.guide_sessions;
drop policy if exists "guide_sessions app access" on public.guide_sessions;
create policy "guide_sessions app access"
  on public.guide_sessions for all
  using (true)
  with check (true);
