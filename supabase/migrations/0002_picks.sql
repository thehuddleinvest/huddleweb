-- The Huddle — picks (strategist output). Run after 0001_init.sql.
-- founding_architecture.txt §5.1 (picks).

do $$ begin
  create type pick_category as enum ('daily_alert','buy_today');
exception when duplicate_object then null; end $$;

create table if not exists public.picks (
  id                    uuid primary key default uuid_generate_v4(),
  tier                  subscription_tier not null,
  ticker                text not null,
  publish_date          date not null default current_date,
  category              pick_category not null default 'daily_alert',
  entry_price_reference numeric,
  strategist_notes      text,
  approved_by           uuid references public.users(id),
  approved_at           timestamptz,
  published_at          timestamptz,
  created_at            timestamptz not null default now()
);

create index if not exists picks_tier_published_idx
  on public.picks (tier, published_at);

alter table public.picks enable row level security;

-- A subscriber may read a pick only if it is published AND they hold an
-- active/trialing subscription to that pick's tier. Strategist reads/writes
-- happen server-side with the service_role key (bypasses RLS).
drop policy if exists picks_select_entitled on public.picks;
create policy picks_select_entitled on public.picks
  for select using (
    published_at is not null
    and exists (
      select 1
      from public.subscriptions s
      where s.user_id = auth.uid()
        and s.status in ('active', 'trialing')
        and s.tier = picks.tier
    )
  );
