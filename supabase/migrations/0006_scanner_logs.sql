-- The Huddle — scanner intraday alerts + reports log. Run after 0005.

create table if not exists public.scanner_alerts (
  id          uuid primary key default uuid_generate_v4(),
  detected_at timestamptz not null,
  symbol      text not null,
  cluster     text,
  setup_type  text not null,      -- consolidation | squeeze | fade
  price       numeric,
  score       numeric,
  details     jsonb,
  created_at  timestamptz not null default now()
);
create index if not exists scanner_alerts_time_idx on public.scanner_alerts (detected_at desc);
alter table public.scanner_alerts enable row level security;
-- Strategist-only: read server-side with the service role. No client policies.

create table if not exists public.scanner_reports (
  id          uuid primary key default uuid_generate_v4(),
  report_date date not null default current_date,
  kind        text not null,      -- eod | accuracy
  payload     jsonb not null,
  created_at  timestamptz not null default now()
);
create index if not exists scanner_reports_time_idx on public.scanner_reports (created_at desc);
alter table public.scanner_reports enable row level security;
