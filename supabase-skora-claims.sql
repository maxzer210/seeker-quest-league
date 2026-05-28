-- ============================================================================
-- SKORA Claim Flow
-- ============================================================================
-- Players spend ORB in-game and request SKORA SPL tokens minted to their wallet.
-- This table is the queue. The processor script (scripts/process-skora-claims.js)
-- picks up pending rows, mints SKORA, updates status.
-- ============================================================================

create table if not exists public.skora_claims (
  id                uuid primary key default gen_random_uuid(),
  created_at        timestamptz not null default now(),
  processed_at      timestamptz,
  device_id         text not null,
  wallet_address    text not null,
  orb_spent         integer not null,
  skora_amount      numeric not null,
  status            text not null default 'pending',  -- pending | minted | failed | rejected
  tx_signature      text unique,
  error_message     text
);

create index if not exists skora_claims_device_id_idx
  on public.skora_claims (device_id);

create index if not exists skora_claims_wallet_idx
  on public.skora_claims (wallet_address);

create index if not exists skora_claims_status_idx
  on public.skora_claims (status);

alter table public.skora_claims enable row level security;

-- Players can create claims (insert) with sane bounds.
drop policy if exists "Allow players to create claims" on public.skora_claims;
create policy "Allow players to create claims"
  on public.skora_claims
  for insert
  to anon, authenticated
  with check (
    device_id      is not null
    and wallet_address is not null
    and orb_spent  >= 10000          -- minimum 10K ORB (= 1 SKORA)
    and orb_spent  <= 10000000       -- maximum 10M ORB (= 1000 SKORA) per single claim
    and skora_amount > 0
    and status     = 'pending'       -- can only insert as pending
  );

-- Players can read their own claims (filter on device_id in client).
drop policy if exists "Allow players to read own claims" on public.skora_claims;
create policy "Allow players to read own claims"
  on public.skora_claims
  for select
  to anon, authenticated
  using (true);

-- Only service_role (the processor script) can update status / set tx_signature.
-- We do NOT create an update policy for anon — service_role bypasses RLS.
