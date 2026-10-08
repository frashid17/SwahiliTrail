# Swahili Trail

Kenya travel platform — plan trips, match stays, ask a multilingual guide, follow events, and open visitor analytics across the country (Nairobi, safari circuits, Rift Valley, and the Swahili coast).

## Features

- **AI Trip Planner** — Gemini builds day-by-day Kenya itineraries with rough KES budgets
- **Hotel Matching** — ranks stays by budget, vibe, and region
- **Explore & Attractions** — places, wildlife, and culture with booking tips
- **Events** — Kenya calendar + optional Ticketmaster listings
- **Live now** — temperature, sunrise/sunset (and tides on the coast) based on the visitor’s location
- **Multilingual Guide** — chat in English, Kiswahili, French, German, Chinese, Arabic
- **Destination Analytics** — visitor trends, attractions, markets, sentiment
- **Auth** — Clerk (saved trips, guide history, stay matches)
- **Database** — Supabase (optional; seed SQL included)

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

Open [http://localhost:3000](http://localhost:3000). Allow location for Live now conditions, sign in, then try Planner, Hotels, Guide, Explore, and Analytics.

## Monetization: AI limits & Trail Plus ($4/mo)

Free accounts get **3 AI uses per calendar month**, shared across:

- Guide (`/api/ai/guide`)
- Trip Planner (`/api/ai/plan`)
- Stay & Eat matcher (`/api/ai/hotels`)

**Trail Plus** unlocks unlimited AI via **Paystack** checkout.

### 1. Supabase tables

Run in the Supabase SQL editor (or use updated `supabase/schema.sql` on a fresh project):

- `supabase/migrations/20261008_ai_usage.sql`
- `supabase/migrations/20261008_ai_usage_increment.sql`
- `supabase/migrations/20261008_subscriptions.sql`
- `supabase/migrations/20261008_payments.sql`

### 2. Paystack

1. Create a Paystack account and copy the **secret key** into `.env.local` as `PAYSTACK_SECRET_KEY`
2. Set charge amount (smallest currency unit) and currency, e.g. `PAYSTACK_TRAIL_PLUS_AMOUNT=52000` and `PAYSTACK_CURRENCY=KES` for ~520 KES (~$4)
3. Optional: create a recurring Plan in Paystack and set `PAYSTACK_PLAN_CODE=PLN_...`
4. Set `NEXT_PUBLIC_APP_URL` to your public site URL (needed for callbacks in production)
5. In Paystack Dashboard → Settings → Webhooks, point to  
   `https://your-domain.com/api/billing/paystack/webhook`
6. Open `/pricing` → **Upgrade with Paystack**

Successful payments activate Trail Plus for 30 days (or until the next Paystack billing date when using a plan).

## Project layout

```
src/app/           # pages + API routes
src/components/    # shell / header / home
src/lib/ai/        # Gemini helpers
src/lib/data/      # Kenya seed data
src/lib/supabase/  # browser + server clients
supabase/schema.sql
```
