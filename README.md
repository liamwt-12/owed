# Owed — owedhq.com

Invoice chasing on autopilot. Connect Xero, and Owed sends professional follow-ups in your name until you're paid.

## Stack

- **Next.js 14** (App Router)
- **Supabase** (Auth, Database, RLS)
- **Stripe** (Subscriptions, Trials)
- **Resend** (Email sending)
- **Xero API** (Invoice sync)
- **Vercel** (Hosting, Cron)

## Setup

1. Clone and install: `npm install`
2. Copy `.env.example` to `.env.local` and fill in your keys
3. Run the SQL in `supabase/schema.sql` in your Supabase SQL editor
4. `npm run dev`

## Deploy

Push to `main` — Vercel deploys automatically. Add env vars in Vercel dashboard.
