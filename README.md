# Swahili Trail

AI coastal tourism companion for **AI and Digital Tourism Day** (Mombasa Tourism Council / Swahilipot Hub) — theme: *Digital Agenda and Artificial Intelligence to Redesign Tourism*.

## Features

- **AI Trip Planner** — Gemini builds day-by-day Mombasa itineraries
- **Hotel Matching** — ranks stays by budget, vibe, and must-haves
- **Multilingual Guide** — chat in English, Kiswahili, French, German, Chinese, Arabic
- **Tourism Analytics** — visitor trends, attractions, markets, sentiment
- **Auth** — Clerk
- **Database** — Supabase (optional for demo; seed SQL included)

## Stack

Next.js 16 · React 19 · Tailwind CSS 4 · Clerk · Supabase · Google Generative AI · Framer Motion · Recharts

## Setup

```bash
npm install
cp .env.example .env.local
```

### 1. Clerk

Already linked via `clerk init`. Keys should be in `.env.local`. If needed:

```bash
npx clerk env pull
```

### 2. Google AI

1. Create an API key at [Google AI Studio](https://aistudio.google.com/apikey)
2. Set `GOOGLE_AI_API_KEY` in `.env.local`

### 3. Supabase (optional but recommended)

1. Create a project at [supabase.com](https://supabase.com)
2. Set `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
3. Run `supabase/schema.sql` in the SQL editor

Without Supabase, the app still runs using local hotel/attraction/analytics seed data; AI saves are skipped.

### Run

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in, then try Planner, Hotels, Guide, and Analytics.

## Demo flow (event day)

1. Landing → brand story for Digital Tourism Day  
2. Sign up with Clerk  
3. Generate a 3-day itinerary  
4. Match a Nyali / Old Town hotel  
5. Ask the guide in Kiswahili  
6. Show analytics dashboard to stakeholders  

## Project layout

```
src/app/           # pages + API routes
src/components/    # shell / header
src/lib/ai/        # Gemini helpers
src/lib/data/      # Mombasa seed data
src/lib/supabase/  # browser + server clients
supabase/schema.sql
```
