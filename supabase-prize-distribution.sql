-- ============================================================================
-- Prize Distribution support
-- ============================================================================
-- 1. Add wallet_address column to players (so we know where to send SOL)
-- 2. Create prize_distributions log table (audit trail for every payout)
-- ============================================================================

-- Add wallet_address column to players if not exists
alter table public.players
  add column if not exists wallet_address text;

create index if not exists players_wallet_address_idx
  on public.players (wallet_address);

-- Prize distribution log
create table if not exists public.prize_distributions (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  season_id         text not null,             -- 'genesis' for Pre-Season payout, 'season-1', 'season-1-day-001', ...
  device_id         text not null,
  wallet_address    text not null,
  username          text,
  rank              integer not null,
  score             integer not null,
  prize_sol         numeric not null,
  prize_lamports    bigint not null,
  tx_signature      text unique,               -- null if dry-run, populated after on-chain send
  status            text not null default 'pending'  -- pending / sent / failed
);

create index if not exists prize_distributions_season_idx
  on public.prize_distributions (season_id);

create index if not exists prize_distributions_device_idx
  on public.prize_distributions (device_id);

alter table public.prize_distributions enable row level security;

-- Public can read distributions (transparency)
drop policy if exists "Allow public read prize distributions" on public.prize_distributions;
create policy "Allow public read prize distributions"
  on public.prize_distributions
  for select
  to anon, authenticated
  using (true);

-- Only the distribution script (service role) can insert.
-- We do NOT create an insert policy for anon — only service_role bypasses RLS.
