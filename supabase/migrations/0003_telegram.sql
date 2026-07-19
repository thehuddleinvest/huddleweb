-- The Huddle — Telegram linking + notifications audit. Run after 0002_picks.sql.

do $$ begin
  create type notification_channel as enum ('telegram','email');
exception when duplicate_object then null; end $$;

do $$ begin
  create type notification_message_type as enum (
    'pick_delivery','trade_approval_request','trade_confirmation','system','marketing'
  );
exception when duplicate_object then null; end $$;

-- Audit trail of every message we send (§5.1 notifications).
create table if not exists public.notifications (
  id               uuid primary key default uuid_generate_v4(),
  user_id          uuid not null references public.users(id) on delete cascade,
  channel          notification_channel not null,
  message_type     notification_message_type not null,
  content_snapshot text,
  sent_at          timestamptz not null default now(),
  delivered        boolean not null default false,
  read_at          timestamptz
);
alter table public.notifications enable row level security;

drop policy if exists notifications_select_own on public.notifications;
create policy notifications_select_own on public.notifications
  for select using (auth.uid() = user_id);

-- One-time tokens that link a Telegram chat to a Huddle account.
create table if not exists public.telegram_link_tokens (
  token       text primary key,
  user_id     uuid not null references public.users(id) on delete cascade,
  created_at  timestamptz not null default now(),
  expires_at  timestamptz not null default (now() + interval '15 minutes'),
  used_at     timestamptz
);
alter table public.telegram_link_tokens enable row level security;
-- No client policies: only the service role (server) manages link tokens.
