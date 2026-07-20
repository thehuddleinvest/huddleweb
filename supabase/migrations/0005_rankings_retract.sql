-- The Huddle — scanner rankings + pick delete/retract. Run after 0004_trades.sql.

-- ---------- rankings (scanner shortlist) ----------
create table if not exists public.rankings (
  id         uuid primary key default uuid_generate_v4(),
  run_date   date not null default current_date,
  run_type   text not null default 'weekly',   -- weekly | daily
  cluster    text not null,
  ticker     text not null,
  tier       subscription_tier not null default 'kickoff',
  rank       int not null,
  score      numeric,
  signals    jsonb,
  created_at timestamptz not null default now()
);
create index if not exists rankings_run_idx on public.rankings (run_type, cluster, rank);
alter table public.rankings enable row level security;
-- No client policies: the strategist reads rankings server-side (service role).

-- ---------- pick lifecycle: soft-delete + retract ----------
alter table public.picks add column if not exists deleted_at   timestamptz;
alter table public.picks add column if not exists retracted_at timestamptz;

-- Subscribers must not see retracted picks (defense in depth beyond the query).
drop policy if exists picks_select_entitled on public.picks;
create policy picks_select_entitled on public.picks
  for select using (
    published_at is not null
    and retracted_at is null
    and exists (
      select 1
      from public.subscriptions s
      where s.user_id = auth.uid()
        and s.status in ('active', 'trialing')
        and s.tier = picks.tier
    )
  );

-- ---------- tag notifications with the pick, for exact retract targeting ----------
alter table public.notifications
  add column if not exists pick_id uuid references public.picks(id);
