-- ═══════════════════════════════════════════════════════════════════════════
-- ORB SERVER-AUTHORITATIVE — Phase 2 anti-cheat
-- ═══════════════════════════════════════════════════════════════════════════
-- Apply to: qxejdpvjggqjqoydujjd.supabase.co  (SQL Editor → NEW QUERY)
-- Version: 2.0 (2026-06-02) — closes the "client sets own ORB balance" exploit
--
-- PROBLEM THIS FIXES:
--   Before: client wrote players.orb directly via update(). Anyone with the
--   anon key (embedded in the APK) could set orb = 999,999,999 and then claim
--   real SKORA tokens. The balance was not trustworthy.
--
--   After: the orb column can ONLY be written by the apply_orb_delta RPC, which
--   rate-limits and plausibility-checks every change and writes an audit ledger.
--   Direct writes to players.orb are revoked at the column level.
--
-- ⚠️ This migration MUST be applied BEFORE the client is switched to use the RPC
--    (otherwise legitimate earns would be blocked). See rollout note at bottom.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Audit ledger — every ORB change is recorded here ─────────────────────
CREATE TABLE IF NOT EXISTS public.orb_ledger (
  id          bigint generated always as identity primary key,
  device_id   text   not null,
  delta       bigint not null,            -- + earn, - spend
  reason      text   not null,            -- 'tap','wheel','runner','shop','p2p','claim',...
  balance_after bigint not null,
  created_at  timestamptz not null default now()
);

CREATE INDEX IF NOT EXISTS orb_ledger_device_idx
  ON public.orb_ledger (device_id, created_at desc);

-- ── 2. apply_orb_delta — the ONLY way orb changes ──────────────────────────
-- Server-side rate limit + plausibility cap. Returns the new balance.
CREATE OR REPLACE FUNCTION apply_orb_delta(
  p_device_id text,
  p_delta     bigint,
  p_reason    text DEFAULT 'unknown'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance       bigint;
  v_recent_earned bigint;
  v_new_balance   bigint;
BEGIN
  -- Validate input
  IF p_device_id IS NULL OR length(p_device_id) < 8 THEN
    RAISE EXCEPTION 'Invalid device_id';
  END IF;
  -- Bound a single delta: no single action grants more than 50K or spends >10M
  IF p_delta > 50000 OR p_delta < -10000000 THEN
    RAISE EXCEPTION 'Delta out of bounds: %', p_delta;
  END IF;

  -- Plausibility: cap total POSITIVE earn to 200K ORB per rolling minute.
  -- (legit play earns far less; this throttles scripted spam.)
  IF p_delta > 0 THEN
    SELECT COALESCE(sum(delta), 0) INTO v_recent_earned
    FROM orb_ledger
    WHERE device_id = p_device_id
      AND delta > 0
      AND created_at > now() - interval '1 minute';
    IF v_recent_earned + p_delta > 200000 THEN
      RAISE EXCEPTION 'Earn rate limit exceeded';
    END IF;
  END IF;

  -- Current balance (row must exist — created on first player upsert)
  SELECT orb INTO v_balance FROM players WHERE device_id = p_device_id;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Player not found: %', p_device_id;
  END IF;

  v_new_balance := GREATEST(0, v_balance + p_delta);

  -- Reject overspend (spend more than you have)
  IF p_delta < 0 AND v_balance + p_delta < 0 THEN
    RAISE EXCEPTION 'Insufficient ORB: have %, tried to spend %', v_balance, -p_delta;
  END IF;

  UPDATE players
    SET orb = v_new_balance,
        season_orb = v_new_balance
    WHERE device_id = p_device_id;

  INSERT INTO orb_ledger (device_id, delta, reason, balance_after)
  VALUES (p_device_id, p_delta, p_reason, v_new_balance);

  RETURN jsonb_build_object('ok', true, 'balance', v_new_balance);
END $$;

-- ── 3. create_skora_claim — atomic ORB debit + claim insert ────────────────
-- Replaces the direct INSERT into skora_claims. Debits ORB server-side so the
-- claim can never exceed the trustworthy balance.
CREATE OR REPLACE FUNCTION create_skora_claim(
  p_device_id      text,
  p_wallet_address text,
  p_orb_amount     bigint
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_balance     bigint;
  v_skora       numeric;
  v_recent      int;
  v_claim_id    uuid;
BEGIN
  IF p_device_id IS NULL OR length(p_device_id) < 8 THEN
    RAISE EXCEPTION 'Invalid device_id';
  END IF;
  IF p_wallet_address IS NULL OR length(p_wallet_address) < 32 THEN
    RAISE EXCEPTION 'Invalid wallet address';
  END IF;
  IF p_orb_amount < 10000 OR p_orb_amount > 10000000 THEN
    RAISE EXCEPTION 'Claim amount out of bounds: %', p_orb_amount;
  END IF;

  -- Rate limit: max 5 claims per device per hour
  SELECT count(*) INTO v_recent FROM skora_claims
  WHERE device_id = p_device_id AND created_at > now() - interval '1 hour';
  IF v_recent >= 5 THEN
    RAISE EXCEPTION 'Too many claims this hour';
  END IF;

  -- Balance check against the trustworthy server balance
  SELECT orb INTO v_balance FROM players WHERE device_id = p_device_id;
  IF v_balance IS NULL THEN
    RAISE EXCEPTION 'Player not found';
  END IF;
  IF v_balance < p_orb_amount THEN
    RAISE EXCEPTION 'Insufficient ORB: have %, need %', v_balance, p_orb_amount;
  END IF;

  v_skora := p_orb_amount::numeric / 10000;  -- 10,000 ORB = 1 SKORA

  -- Atomic: debit ORB (+ ledger) then insert claim
  UPDATE players
    SET orb = orb - p_orb_amount,
        season_orb = season_orb - p_orb_amount
    WHERE device_id = p_device_id;

  INSERT INTO orb_ledger (device_id, delta, reason, balance_after)
  VALUES (p_device_id, -p_orb_amount, 'skora_claim', v_balance - p_orb_amount);

  INSERT INTO skora_claims (device_id, wallet_address, orb_spent, skora_amount, status)
  VALUES (p_device_id, p_wallet_address, p_orb_amount, v_skora, 'pending')
  RETURNING id INTO v_claim_id;

  RETURN jsonb_build_object('ok', true, 'claim_id', v_claim_id, 'skora', v_skora);
END $$;

-- ── 4. Column-level lockdown — client can no longer write the balance ──────
-- players has columns the client legitimately writes (username, level, streak,
-- wallet_address). We revoke ONLY the orb/season_orb columns so those other
-- updates keep working. SECURITY DEFINER functions above bypass this.
REVOKE UPDATE (orb, season_orb) ON public.players FROM anon, authenticated;

-- skora_claims: block direct INSERT — only via create_skora_claim RPC
ALTER TABLE public.skora_claims ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Allow players to create claims" ON public.skora_claims;
DROP POLICY IF EXISTS "block direct claim insert"      ON public.skora_claims;
CREATE POLICY "block direct claim insert" ON public.skora_claims
  FOR INSERT WITH CHECK (false);
-- (existing read policy "Allow players to read own claims" stays)

-- orb_ledger: read-only for clients (audit), writes only via SECURITY DEFINER
ALTER TABLE public.orb_ledger ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read own ledger"       ON public.orb_ledger;
DROP POLICY IF EXISTS "block direct ledger"   ON public.orb_ledger;
CREATE POLICY "read own ledger"     ON public.orb_ledger FOR SELECT USING (true);
CREATE POLICY "block direct ledger" ON public.orb_ledger FOR INSERT WITH CHECK (false);

-- ── 5. Grants ──────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION apply_orb_delta(text, bigint, text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION create_skora_claim(text, text, bigint)     TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- ROLLOUT ORDER (important — do NOT skip):
--   1. Apply this SQL.  Earns still work via old client (direct orb write) UNTIL
--      the REVOKE takes effect — after REVOKE, the old client's syncScore() orb
--      writes will SILENTLY FAIL (update affects 0 rows). That is acceptable:
--      balance just stops syncing up; nothing breaks.
--   2. Ship a new APK where the client calls apply_orb_delta / create_skora_claim
--      instead of writing players.orb directly (see ORB-REFACTOR-PLAN.md).
--   3. Only after that APK is live: enable the SKORA claim button.
--
-- VERIFY:
--   SELECT proname FROM pg_proc WHERE proname IN
--     ('apply_orb_delta','create_skora_claim');
--   SELECT grantee, privilege_type, column_name FROM information_schema.column_privileges
--     WHERE table_name='players' AND column_name IN ('orb','season_orb');
-- ═══════════════════════════════════════════════════════════════════════════
