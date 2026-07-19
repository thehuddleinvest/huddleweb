-- The Huddle — Playbook trades. Run after 0003_telegram.sql.
-- founding_architecture.txt §5.1 (trades).

do $$ begin
  create type trade_side as enum ('buy','sell');
exception when duplicate_object then null; end $$;

do $$ begin
  create type trade_status as enum (
    'pending_approval','approved','executed','failed','canceled'
  );
exception when duplicate_object then null; end $$;

create table if not exists public.trades (
  id             uuid primary key default uuid_generate_v4(),
  user_id        uuid not null references public.users(id) on delete cascade,
  pick_id        uuid references public.picks(id),
  ticker         text not null,
  side           trade_side not null default 'buy',
  dollar_amount  numeric not null,
  requested_at   timestamptz not null default now(),
  approved_at    timestamptz,
  executed_at    timestamptz,
  alpaca_order_id text,
  status         trade_status not null default 'pending_approval',
  fill_price     numeric,
  shares_filled  numeric,
  error_message  text,
  created_at     timestamptz not null default now()
);

create index if not exists trades_user_idx on public.trades (user_id, created_at desc);

alter table public.trades enable row level security;

-- Subscribers can read their own trades. Creation/execution happens
-- server-side with the service_role key.
drop policy if exists trades_select_own on public.trades;
create policy trades_select_own on public.trades
  for select using (auth.uid() = user_id);
