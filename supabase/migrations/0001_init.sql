-- The Huddle — initial schema (payment + account spine).
-- Run this in the Supabase SQL editor (Dashboard → SQL → New query → paste → Run).
-- Mirrors founding_architecture.txt §5.1 (subset needed for launch).

create extension if not exists "uuid-ossp";

-- ---------- enums ----------
do $$ begin
  create type subscription_tier as enum (
    'kickoff','drive','endzone',
    'playbook_only','playbook_kickoff','playbook_drive','playbook_endzone'
  );
exception when duplicate_object then null; end $$;

do $$ begin
  create type subscription_status as enum ('trialing','active','past_due','canceled');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_pref as enum ('telegram','email','both');
exception when duplicate_object then null; end $$;

-- ---------- users (mirrors auth.users) ----------
create table if not exists public.users (
  id                        uuid primary key references auth.users(id) on delete cascade,
  email                     text unique not null,
  first_name                text,
  telegram_chat_id          bigint,
  notification_preference   notification_pref not null default 'email',
  alpaca_oauth_token_encrypted text,
  alpaca_account_id         text,
  default_trade_amounts     jsonb not null default '{"kickoff":100,"drive":500,"endzone":1000}'::jsonb,
  risk_ack_signup_at        timestamptz,
  risk_ack_signup_ip        inet,
  risk_ack_playbook_at      timestamptz,
  stripe_customer_id        text,
  comped_by                 uuid references public.users(id),
  created_at                timestamptz not null default now(),
  updated_at                timestamptz not null default now()
);

-- ---------- subscriptions ----------
create table if not exists public.subscriptions (
  id                     uuid primary key default uuid_generate_v4(),
  user_id                uuid not null references public.users(id) on delete cascade,
  tier                   subscription_tier not null,
  stripe_subscription_id text unique,
  status                 subscription_status not null default 'trialing',
  current_period_start   timestamptz,
  current_period_end     timestamptz,
  canceled_at            timestamptz,
  created_at             timestamptz not null default now(),
  updated_at             timestamptz not null default now()
);

-- ---------- audit_log (compliance trail) ----------
create table if not exists public.audit_log (
  id          uuid primary key default uuid_generate_v4(),
  actor_type  text not null,
  actor_id    uuid,
  action      text not null,
  entity_type text,
  entity_id   text,
  metadata    jsonb,
  ip_address  inet,
  "timestamp" timestamptz not null default now()
);

-- ---------- mirror new auth users into public.users ----------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.users (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- row level security ----------
alter table public.users         enable row level security;
alter table public.subscriptions enable row level security;
alter table public.audit_log     enable row level security;

-- Users can read and update only their own row.
drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
  for select using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
  for update using (auth.uid() = id);

-- Users can read only their own subscriptions.
drop policy if exists subs_select_own on public.subscriptions;
create policy subs_select_own on public.subscriptions
  for select using (auth.uid() = user_id);

-- audit_log has RLS enabled with NO policies: no client (anon/authenticated)
-- can read or write it. Only the service_role key (server-side) bypasses RLS.
