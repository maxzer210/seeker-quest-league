-- ============================================================================
-- SGT (Seeker Genesis Token) bonus claims — anti-sybil tracking
-- ============================================================================
-- One claim per SGT mint. SGTs can move between wallets in the same Seed Vault,
-- but the mint address itself is unique per Seeker device.
-- ============================================================================

create table if not exists public.sgt_bonus_claims (
  id              uuid primary key default gen_random_uuid(),
  created_at      timestamptz not null default now(),
  sgt_mint        text not null unique,           -- one bonus per device
  device_id       text not null,
  wallet_address  text not null,
  orb_granted     integer not null
);

create index if not exists sgt_bonus_claims_device_id_idx
  on public.sgt_bonus_claims (device_id);

create index if not exists sgt_bonus_claims_wallet_address_idx
  on public.sgt_bonus_claims (wallet_address);

alter table public.sgt_bonus_claims enable row level security;

drop policy if exists "Allow app to claim SGT bonus" on public.sgt_bonus_claims;
create policy "Allow app to claim SGT bonus"
  on public.sgt_bonus_claims
  for insert
  to anon, authenticated
  with check (
    sgt_mint is not null
    and device_id is not null
    and wallet_address is not null
    and orb_granted > 0
    and orb_granted <= 10000   -- sanity cap
  );

-- Read own claims (for UI to show bonus already claimed)
drop policy if exists "Allow app to read SGT claims" on public.sgt_bonus_claims;
create policy "Allow app to read SGT claims"
  on public.sgt_bonus_claims
  for select
  to anon, authenticated
  using (true);
