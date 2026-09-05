-- ═══════════════════════════════════════════════════════════════════════════
-- ORB SERVER-AUTHORITATIVE — the balance stops being the client's opinion
-- ═══════════════════════════════════════════════════════════════════════════
-- Apply to: qxejdpvjggqjqoydujjd.supabase.co  (SQL Editor → NEW QUERY)
-- Version: 3.0 (2026-09-05) — supersedes the 2.0 draft of 2026-06-02
--
-- WHY THIS EXISTS, with numbers from the live database:
--   players.orb was writable by anyone holding the anon key, which ships inside
--   the APK. The audit of 2026-09-05 found the top account at 1,082,663,328 ORB
--   with zero SOL payments — meaning no Founder tier (x1 multiplier) and no
--   bought energy refills. The honest ceiling for such an account is 4,320 taps
--   a day x 675 ORB = 2.9M/day, so that balance needs 371 days of flawless
--   play. The account was last active on its third day. The numbers were
--   written, not earned.
--
--   At 10,000 ORB = 1 SKORA the top eight accounts alone stand for ~233,000
--   SKORA, and tournament_scores decides who receives real SOL.
--
-- WHAT CHANGED SINCE THE 2.0 DRAFT (all four mattered):
--   1. SET search_path on both SECURITY DEFINER functions. Without it the
--      function resolves table names through the caller's search_path, so a
--      hostile temp schema can shadow `players`. Supabase's own linter flags
--      this; the 2.0 draft had it on neither function.
--   2. A rolling 24h earn cap. The 2.0 limit of 200K/minute permits 288M/day —
--      a hundred times the honest ceiling, so it would not have stopped the
--      exploit it was written to stop.
--   3. Per-reason delta caps. A tap cannot pay more than a max-build tap.
--   4. tournament_scores locked. The client never writes it (verified: only
--      reads in Tournament.tsx and GenesisNews.tsx, and the payout scripts run
--      under the service key), so this costs nothing and closes the table that
--      decides real SOL payouts.
--
-- ⚠️ APPLY THIS BEFORE shipping the refactored client. Order is in ROLLOUT at
--    the bottom. PART R (the Pre-Season reset) is deliberately separate — read
--    it before running it, it zeroes every balance.
-- ═══════════════════════════════════════════════════════════════════════════


-- ── 1. Audit ledger — every ORB change leaves a trace ───────────────────────
create table if not exists public.orb_ledger (
  id            bigint generated always as identity primary key,
  device_id     text   not null,
  delta         bigint not null,          -- + earn, - spend
  reason        text   not null,          -- 'tap','wheel','game_*','shop','skora_claim',…
  balance_after bigint not null,
  created_at    timestamptz not null default now()
);

create index if not exists orb_ledger_device_idx
  on public.orb_ledger (device_id, created_at desc);

-- Partial index for the rate-limit scans, which only ever look at earns.
create index if not exists orb_ledger_earn_idx
  on public.orb_ledger (device_id, created_at desc) where delta > 0;


-- ── 2. The honest ceiling, written down once ────────────────────────────────
-- All four numbers come from App.tsx, not from taste:
--
--   max_tap 20,000  — TAP_VALUES max 75, CRIT x3, boost x3, Founder Diamond x5,
--     COMBO_MULTIPLIERS max x5 = 16,875 is the most one tap can pay. Rounded up.
--
--   max_single 10,000,000 — the client batches taps for 5 seconds before
--     syncing (scheduleSyncScore), and while offline the batch keeps growing.
--     MAX_ENERGY is 500, so the largest honest single delta is a full energy
--     bar at maximum build: 500 x 16,875 = 8.4M. A tighter cap here would throw
--     away the progress of a player who tapped through a tunnel.
--
--   per_minute 12,000,000 — one full bar plus regeneration, same reasoning.
--
--   per_day 30,000,000 — this is the cap that actually does the work. Energy
--     regenerates 1 per 20s = 4,320 taps a day, so a maxed free account tops
--     out near 2.9M and a maxed Diamond account near 14.6M in expectation.
--     Doubling that leaves room for lands, mini-games, achievements, tournament
--     prizes and refills bought with SOL, which are the one honest way past the
--     energy limit. A player who genuinely reaches this will show up in
--     orb_ledger, and the number can be raised knowingly rather than guessed.
--
-- Against the attack this was written for — one request setting the balance to
-- 999,999,999 — any cap in this range is fatal to it. The precision matters for
-- not punishing real players, not for stopping the exploit.
create or replace function public.orb_limits()
returns table (max_tap bigint, max_single bigint, per_minute bigint, per_day bigint)
language sql immutable
as $$ select 20000::bigint, 10000000::bigint, 12000000::bigint, 30000000::bigint $$;


-- ── 3. apply_orb_delta — the only door the balance opens through ────────────
create or replace function public.apply_orb_delta(
  p_device_id text,
  p_delta     bigint,
  p_reason    text default 'unknown'
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance     bigint;
  v_minute      bigint;
  v_day         bigint;
  v_new_balance bigint;
  v_lim         record;
begin
  if p_device_id is null or length(p_device_id) < 8 then
    raise exception 'Invalid device_id';
  end if;
  if p_delta = 0 then
    raise exception 'Empty delta';
  end if;

  select * into v_lim from orb_limits();

  -- A tap is bounded by what a tap can pay. Everything else by the generic cap.
  if p_delta > 0 then
    if p_reason = 'tap' and p_delta > v_lim.max_tap then
      raise exception 'Tap delta above the maximum a tap can pay: %', p_delta;
    end if;
    if p_delta > v_lim.max_single then
      raise exception 'Delta out of bounds: %', p_delta;
    end if;
  elsif p_delta < -10000000 then
    raise exception 'Spend out of bounds: %', p_delta;
  end if;

  -- Rate limits apply to earns only; spending your own balance is never capped.
  if p_delta > 0 then
    select coalesce(sum(delta), 0) into v_minute
      from orb_ledger
     where device_id = p_device_id and delta > 0
       and created_at > now() - interval '1 minute';
    if v_minute + p_delta > v_lim.per_minute then
      raise exception 'Earn rate limit exceeded (minute)';
    end if;

    select coalesce(sum(delta), 0) into v_day
      from orb_ledger
     where device_id = p_device_id and delta > 0
       and created_at > now() - interval '24 hours';
    if v_day + p_delta > v_lim.per_day then
      raise exception 'Earn rate limit exceeded (day)';
    end if;
  end if;

  -- Lock the row so two concurrent calls cannot both read the same balance.
  select orb into v_balance from players where device_id = p_device_id for update;
  if v_balance is null then
    raise exception 'Player not found: %', p_device_id;
  end if;

  if p_delta < 0 and v_balance + p_delta < 0 then
    raise exception 'Insufficient ORB: have %, tried to spend %', v_balance, -p_delta;
  end if;

  v_new_balance := greatest(0, v_balance + p_delta);

  update players
     set orb = v_new_balance,
         season_orb = v_new_balance
   where device_id = p_device_id;

  insert into orb_ledger (device_id, delta, reason, balance_after)
  values (p_device_id, p_delta, left(coalesce(p_reason, 'unknown'), 40), v_new_balance);

  return jsonb_build_object('ok', true, 'balance', v_new_balance);
end $$;


-- ── 4. create_skora_claim — debit and claim in one transaction ──────────────
create or replace function public.create_skora_claim(
  p_device_id      text,
  p_wallet_address text,
  p_orb_amount     bigint
) returns jsonb
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_balance  bigint;
  v_skora    numeric;
  v_recent   int;
  v_claim_id uuid;
begin
  if p_device_id is null or length(p_device_id) < 8 then
    raise exception 'Invalid device_id';
  end if;
  -- Base58 Solana addresses are 32-44 characters.
  if p_wallet_address is null or p_wallet_address !~ '^[1-9A-HJ-NP-Za-km-z]{32,44}$' then
    raise exception 'Invalid wallet address';
  end if;
  if p_orb_amount < 10000 or p_orb_amount > 10000000 then
    raise exception 'Claim amount out of bounds: %', p_orb_amount;
  end if;

  select count(*) into v_recent from skora_claims
   where device_id = p_device_id and created_at > now() - interval '1 hour';
  if v_recent >= 5 then
    raise exception 'Too many claims this hour';
  end if;

  select orb into v_balance from players where device_id = p_device_id for update;
  if v_balance is null then
    raise exception 'Player not found';
  end if;
  if v_balance < p_orb_amount then
    raise exception 'Insufficient ORB: have %, need %', v_balance, p_orb_amount;
  end if;

  v_skora := p_orb_amount::numeric / 10000;   -- 10,000 ORB = 1 SKORA

  update players
     set orb        = orb - p_orb_amount,
         season_orb = greatest(0, season_orb - p_orb_amount)
   where device_id = p_device_id;

  insert into orb_ledger (device_id, delta, reason, balance_after)
  values (p_device_id, -p_orb_amount, 'skora_claim', v_balance - p_orb_amount);

  insert into skora_claims (device_id, wallet_address, orb_spent, skora_amount, status)
  values (p_device_id, p_wallet_address, p_orb_amount, v_skora, 'pending')
  returning id into v_claim_id;

  return jsonb_build_object('ok', true, 'claim_id', v_claim_id, 'skora', v_skora);
end $$;


-- ── 5. Lock the balance columns, leave the rest writable ────────────────────
-- players carries columns the client legitimately owns — username, level,
-- streak, wallet_address — so revoking UPDATE wholesale would break renaming
-- and wallet linking. Only the two balance columns must go.
--
-- Doing that with `revoke update (orb, season_orb)` does NOT work, and the
-- first attempt on 2026-09-05 shipped exactly that mistake: a table-wide
-- `grant update` already covers every column, and revoking a column-level
-- privilege that was never separately granted is a no-op. Verified against the
-- live database — PATCH players.orb still returned 204 afterwards.
--
-- The working shape is revoke-then-grant, the same one used for INSERT below:
-- take the table-wide privilege away, then hand back the specific columns.
revoke update on public.players from anon, authenticated;
grant update (username, level, streak, wallet_address)
  on public.players to anon, authenticated;
-- ^ orb and season_orb are absent by design. The SECURITY DEFINER functions
--   run as the owner, so they are unaffected by this.

-- INSERT is the other way in: revoking UPDATE alone still lets a cheater create
-- a brand new row with a balance already in it, then claim SKORA against it.
-- So the starting gift becomes a column default and the client stops sending a
-- balance at all. INITIAL_ORB in App.tsx:122 is 2450 — keep the two in step.
alter table public.players alter column orb        set default 2450;
alter table public.players alter column season_orb set default 2450;

revoke insert on public.players from anon, authenticated;
grant insert (device_id, username, level, streak, wallet_address)
  on public.players to anon, authenticated;
-- ^ orb and season_orb are absent by design. A new row gets the default; every
--   change after that goes through apply_orb_delta. Requires the matching
--   client change in initPlayer() — the old payload would now be rejected.


-- ── 6. skora_claims — only through the RPC ──────────────────────────────────
alter table public.skora_claims enable row level security;
drop policy if exists "Allow players to create claims" on public.skora_claims;
drop policy if exists "block direct claim insert"      on public.skora_claims;
create policy "block direct claim insert" on public.skora_claims
  for insert with check (false);
revoke insert, update, delete on public.skora_claims from anon, authenticated;


-- ── 7. tournament_scores — this table decides who receives real SOL ─────────
-- The client only reads it (Tournament.tsx:93, GenesisNews.tsx:79). The payout
-- scripts run under the service key. So nothing legitimate loses anything here.
revoke insert, update, delete on public.tournament_scores from anon, authenticated;
revoke insert, update, delete on public.tournaments       from anon, authenticated;


-- ── 8. orb_ledger — operator-only ───────────────────────────────────────────
-- The client never reads its ledger, and a blanket read policy would hand out
-- every player's device_id and full activity history. So no client access at
-- all: the ledger is written by the SECURITY DEFINER functions and read from
-- the dashboard under the service key.
alter table public.orb_ledger enable row level security;
drop policy if exists "read own ledger"     on public.orb_ledger;
drop policy if exists "block direct ledger" on public.orb_ledger;
revoke all on public.orb_ledger from anon, authenticated;


-- ── 9. Grants ───────────────────────────────────────────────────────────────
grant execute on function public.apply_orb_delta(text, bigint, text)    to anon, authenticated;
grant execute on function public.create_skora_claim(text, text, bigint) to anon, authenticated;
grant execute on function public.orb_limits()                           to anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART R — Pre-Season reset.  READ BEFORE RUNNING.  Zeroes every balance.
-- ═══════════════════════════════════════════════════════════════════════════
-- Decision of 2026-09-05: Pre-Season is declared a test season. The ORB economy
-- was provably open for its whole run, so no balance from it can be trusted,
-- including the honest ones — there is no way to tell them apart after the
-- fact. Nothing has been paid out yet, which makes this the cheapest moment
-- this will ever be.
--
-- Run this ONLY after the new APK is live, so players see the reset explained
-- in an app that can no longer be cheated. Running it early resets balances
-- that the old client would then immediately write back.
--
-- Uncomment to run:

-- begin;
--   -- Keep a copy. Untouched by the reset, useful for compensating real players.
--   create table if not exists public.preseason_snapshot as
--     select device_id, username, orb, season_orb, level, streak, wallet_address,
--            now() as snapshot_at
--       from public.players;
--
--   insert into public.orb_ledger (device_id, delta, reason, balance_after)
--     select device_id, -orb, 'preseason_reset', 0
--       from public.players where orb <> 0;
--
--   update public.players set orb = 0, season_orb = 0;
--   delete from public.tournament_scores;
-- commit;


-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLOUT ORDER — do not skip a step
--   1. Apply everything above PART R.
--      The live v1.1.4 client keeps working: its syncScore() writes to orb are
--      silently ignored (0 rows), so balances stop climbing but nothing errors.
--   2. Ship the APK that calls apply_orb_delta / create_skora_claim instead of
--      writing players.orb directly (see ORB-REFACTOR-PLAN.md).
--   3. Once that APK is live: run PART R, announce the reset, open Season 1.
--   4. Only then enable the SKORA claim button.
--
-- VERIFY
--   select proname, prosecdef, proconfig from pg_proc
--    where proname in ('apply_orb_delta','create_skora_claim');
--   -- proconfig must show search_path on both.
--
--   select grantee, privilege_type, column_name
--     from information_schema.column_privileges
--    where table_name = 'players' and column_name in ('orb','season_orb');
--   -- UPDATE must be absent for anon and authenticated.
--
--   select public.apply_orb_delta('zz-does-not-exist-1234', 100, 'tap');
--   -- must raise "Player not found", proving the function is reachable.
-- ═══════════════════════════════════════════════════════════════════════════
