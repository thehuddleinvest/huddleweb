# huddleweb

Frontend for **The Huddle** — Next.js 14 (App Router) + Tailwind + shadcn-style UI + Supabase.
Source of truth for all product decisions: `founding_architecture.txt` (v2.1).

> This is a **public** repo. Never commit secrets. `.env*` and any `*recovery*` /
> `*backup*` / `*credentials*` files are gitignored. Keep credential files out of
> this directory entirely.

## Run locally (Windows)

```bash
cd huddleweb
npm install
cp .env.local.example .env.local   # then fill in your SCOPED API keys
npm run dev                        # http://localhost:3000
```

Fill `.env.local` with **API keys**, not dashboard passwords:
Supabase `anon` + `service_role`, Stripe `pk_test_`/`sk_test_`, and the three
Stripe Price IDs. See `.env.local.example`.

## Connect to GitHub / Vercel

The empty `huddleweb` repo already exists and Vercel is linked to it. From this
folder:

```bash
git init
git add .
git commit -m "Scaffold: Next.js 14 landing + tier pricing + risk-ack gate"
git branch -M main
git remote add origin https://github.com/thehuddleinvest/huddleweb.git
git push -u origin main   # Vercel auto-deploys on push
```

Set the same env vars in Vercel (Project → Settings → Environment Variables).

## Structure

- `app/page.tsx` — marketing landing (hero, tiers, Playbook, how-it-works)
- `app/sign-up` — account creation with the §8.1 two-checkbox risk acknowledgment
- `app/dashboard` — subscriber dashboard v0
- `app/strategist` — strategist dashboard v0 (approve + publish picks)
- `app/terms`, `app/privacy` — legal pages (templates, attorney to finalize)
- `lib/tiers.ts` — tier names, prices, and disclaimer strings (single source)
- `lib/supabase/` — browser + server Supabase clients
- `components/` — `ui/` (primitives), `site/`, `marketing/`

## Built but not yet wired (next up)

Stripe Checkout route + webhook, Supabase auth flow, the `picks` query on the
dashboard, and the Telegram delivery hook — these belong to the FastAPI backend
(`huddle-api`) and the API routes under `app/api/`.
