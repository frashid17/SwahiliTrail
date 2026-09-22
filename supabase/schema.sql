-- Swahili Trail — Supabase schema
-- Run this in the Supabase SQL editor for your project.

create extension if not exists "pgcrypto";

create table if not exists public.profiles (
  id text primary key,
  email text,
  full_name text,
  preferred_language text default 'en',
  created_at timestamptz default now()
);

create table if not exists public.hotels (
  id text primary key,
  name text not null,
  area text not null,
  rating numeric(2,1) not null,
  price_per_night integer not null,
  currency text default 'KES',
  tags text[] default '{}',
  vibe text,
  description text,
  amenities text[] default '{}',
  image_gradient text,
  created_at timestamptz default now()
);

create table if not exists public.itineraries (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  title text not null,
  days integer not null,
  interests text[] default '{}',
  budget text,
  plan jsonb not null,
  created_at timestamptz default now()
);

create table if not exists public.hotel_matches (
  id uuid primary key default gen_random_uuid(),
  user_id text not null,
  preferences jsonb not null,
  matched_hotel_ids text[] default '{}',
  rationale text,
  created_at timestamptz default now()
);

create table if not exists public.guide_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  title text,
  language text not null default 'en',
  messages jsonb not null default '[]',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

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

create table if not exists public.analytics_events (
  id uuid primary key default gen_random_uuid(),
  user_id text,
  event_type text not null,
  payload jsonb default '{}',
  created_at timestamptz default now()
);

alter table public.profiles enable row level security;
alter table public.hotels enable row level security;
alter table public.itineraries enable row level security;
alter table public.hotel_matches enable row level security;
alter table public.guide_sessions enable row level security;
alter table public.saved_trips enable row level security;
alter table public.analytics_events enable row level security;

-- Public read for hotels (demo catalogue)
create policy "Hotels are publicly readable"
  on public.hotels for select
  using (true);

-- User-owned rows (Clerk user id stored as text)
create policy "Users manage own itineraries"
  on public.itineraries for all
  using (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claim.sub', true)))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claim.sub', true)));

create policy "Users manage own hotel matches"
  on public.hotel_matches for all
  using (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claim.sub', true)))
  with check (user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claim.sub', true)));

create policy "Users manage own guide sessions"
  on public.guide_sessions for all
  using (true)
  with check (true);

create policy "Users manage own saved trips"
  on public.saved_trips for all
  using (true)
  with check (true);

create policy "Users insert own analytics events"
  on public.analytics_events for insert
  with check (
    user_id is null
    or user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claim.sub', true))
  );

create policy "Users read own analytics events"
  on public.analytics_events for select
  using (
    user_id is null
    or user_id = coalesce(auth.jwt() ->> 'sub', current_setting('request.jwt.claim.sub', true))
  );

-- Seed hotels
insert into public.hotels (id, name, area, rating, price_per_night, currency, tags, vibe, description, amenities, image_gradient)
values
  ('nyali-breeze', 'Nyali Breeze Resort', 'Nyali', 4.7, 18500, 'KES', array['beachfront','family','pool'], 'Relaxed beach luxury', 'Ocean-facing rooms steps from Nyali Beach with a calm pool deck and sunset dining.', array['Wi-Fi','Pool','Restaurant','Airport shuttle'], 'from-teal-600 via-cyan-500 to-sky-400'),
  ('old-town-haven', 'Old Town Haven Boutique', 'Mombasa Old Town', 4.5, 9800, 'KES', array['heritage','culture','boutique'], 'Swahili heritage charm', 'Courtyard stays in the heart of Old Town — walking distance to Fort Jesus and spice markets.', array['Wi-Fi','Breakfast','Rooftop terrace','Guided walks'], 'from-amber-700 via-orange-500 to-rose-400'),
  ('diani-horizon', 'Diani Horizon Suites', 'Diani Beach', 4.8, 24000, 'KES', array['beachfront','romantic','spa'], 'Quiet coastal escape', 'White-sand Diani stays with spa treatments and water-sport packages.', array['Spa','Kayaks','Wi-Fi','Bar'], 'from-sky-700 via-teal-500 to-emerald-400'),
  ('bamburi-bay', 'Bamburi Bay Lodge', 'Bamburi', 4.2, 7200, 'KES', array['budget','family','wildlife'], 'Value near Haller Park', 'Practical base near Haller Park and Bamburi Beach — great for families and short stays.', array['Wi-Fi','Parking','Restaurant','Kids club'], 'from-emerald-700 via-teal-600 to-cyan-400'),
  ('mama-ngina-view', 'Mama Ngina Waterfront Inn', 'Mama Ngina Waterfront', 4.6, 14500, 'KES', array['city','waterfront','business'], 'Harbor city pulse', 'Modern rooms overlooking Mama Ngina promenade — ideal for city explorers and events.', array['Wi-Fi','Gym','Coworking nook','Cafe'], 'from-blue-800 via-cyan-600 to-teal-400'),
  ('kilifi-creek', 'Kilifi Creek Retreat', 'Kilifi (day trip base)', 4.4, 16000, 'KES', array['nature','quiet','romantic'], 'Creek-side calm', 'A peaceful creek retreat for travelers pairing Mombasa city days with coastal nature.', array['Wi-Fi','Kayaks','Breakfast','Garden'], 'from-cyan-800 via-teal-500 to-lime-400')
on conflict (id) do nothing;
