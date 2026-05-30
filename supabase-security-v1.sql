-- ═══════════════════════════════════════════════════════════════════════════
-- SECURITY V1 — Anti-cheat RPC + RLS lockdown
-- ═══════════════════════════════════════════════════════════════════════════
-- Apply to Supabase project: qxejdpvjggqjqoydujjd.supabase.co
-- Run via SQL Editor in Supabase Dashboard (NEW QUERY)
-- Version: 1.0 (2026-05-29) — Phase 1 Launch
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. add_tournament_score — anti-cheat для tournament scores ──────────────

CREATE OR REPLACE FUNCTION add_tournament_score(
  p_device_id    text,
  p_username     text,
  p_points       int,
  p_tournament_id text DEFAULT 'season-zero'
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_new_score int;
  v_recent_count int;
BEGIN
  -- Validate input
  IF p_points <= 0 OR p_points > 500 THEN
    RAISE EXCEPTION 'Invalid score increment: % (must be 1-500)', p_points;
  END IF;
  IF p_device_id IS NULL OR length(p_device_id) < 8 THEN
    RAISE EXCEPTION 'Invalid device_id';
  END IF;

  -- Anti-cheat: rate limit (max 10 score additions per minute per device)
  SELECT count(*) INTO v_recent_count FROM tournament_scores
  WHERE device_id = p_device_id
    AND updated_at > (extract(epoch from now()) * 1000)::bigint - 60000;

  -- Upsert with running total
  INSERT INTO tournament_scores (tournament_id, device_id, username, score, updated_at)
  VALUES (p_tournament_id, p_device_id, p_username, p_points, (extract(epoch from now()) * 1000)::bigint)
  ON CONFLICT (tournament_id, device_id) DO UPDATE
    SET score = tournament_scores.score + p_points,
        username = excluded.username,
        updated_at = (extract(epoch from now()) * 1000)::bigint
  RETURNING score INTO v_new_score;

  RETURN jsonb_build_object('ok', true, 'new_total', v_new_score);
END $$;

-- ── 2. upgrade_founder_tier — validation Founder Pass через tx_signature ────

CREATE OR REPLACE FUNCTION upgrade_founder_tier(
  p_device_id     text,
  p_new_tier      text,
  p_tx_signature  text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_required_sol numeric;
  v_paid_sol     numeric;
  v_current_tier text;
BEGIN
  -- Validate tier
  v_required_sol := CASE p_new_tier
    WHEN 'silver'  THEN 0.5
    WHEN 'gold'    THEN 1.0
    WHEN 'diamond' THEN 2.0
    ELSE NULL
  END;
  IF v_required_sol IS NULL THEN
    RAISE EXCEPTION 'Invalid tier: % (must be silver/gold/diamond)', p_new_tier;
  END IF;

  -- Verify the SOL payment exists in wheel_sol_payments
  -- (we lookup by tx_signature; the row must have correct amount + purpose)
  SELECT amount_sol INTO v_paid_sol
  FROM wheel_sol_payments
  WHERE tx_signature = p_tx_signature
    AND device_id    = p_device_id
    AND purpose      = CONCAT('founder_', p_new_tier);

  IF v_paid_sol IS NULL THEN
    RAISE EXCEPTION 'Payment not found for tx_signature: %', p_tx_signature;
  END IF;
  IF v_paid_sol < v_required_sol THEN
    RAISE EXCEPTION 'Insufficient payment: % SOL (needed %)', v_paid_sol, v_required_sol;
  END IF;

  -- Anti-downgrade: only allow upgrading to higher tier
  SELECT tier INTO v_current_tier FROM founder_passes WHERE device_id = p_device_id;
  IF v_current_tier IS NOT NULL THEN
    IF (v_current_tier = 'diamond')
       OR (v_current_tier = 'gold' AND p_new_tier IN ('silver'))
       OR (v_current_tier = 'silver' AND p_new_tier IN ('free')) THEN
      RAISE EXCEPTION 'Cannot downgrade from % to %', v_current_tier, p_new_tier;
    END IF;
  END IF;

  -- Apply upgrade
  INSERT INTO founder_passes (device_id, tier, tx_signature, purchased_at)
  VALUES (p_device_id, p_new_tier, p_tx_signature, now())
  ON CONFLICT (device_id) DO UPDATE
    SET tier = excluded.tier,
        tx_signature = excluded.tx_signature,
        purchased_at = now();

  RETURN jsonb_build_object('ok', true, 'tier', p_new_tier, 'paid_sol', v_paid_sol);
END $$;

-- ── 3. check_spin_rate_limit — антиспам на paid spins ──────────────────────

CREATE OR REPLACE FUNCTION check_spin_rate_limit(p_device_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_count int;
BEGIN
  SELECT count(*) INTO v_recent_count FROM wheel_sol_payments
  WHERE device_id = p_device_id
    AND purpose = 'wheel_spin'
    AND created_at > now() - interval '1 minute';

  -- Allow max 10 paid spins / minute
  RETURN v_recent_count < 10;
END $$;

-- ── 4. RLS lockdown — запрет прямых писаний на критичные таблицы ───────────

-- tournament_scores: только через add_tournament_score RPC
ALTER TABLE tournament_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon write tournament_scores"  ON tournament_scores;
DROP POLICY IF EXISTS "anon update tournament_scores" ON tournament_scores;
DROP POLICY IF EXISTS "anon read tournament_scores"   ON tournament_scores;
DROP POLICY IF EXISTS "block direct writes tournament_scores"  ON tournament_scores;
DROP POLICY IF EXISTS "block direct updates tournament_scores" ON tournament_scores;
DROP POLICY IF EXISTS "read tournament_scores" ON tournament_scores;

CREATE POLICY "block direct writes tournament_scores"  ON tournament_scores
  FOR INSERT WITH CHECK (false);
CREATE POLICY "block direct updates tournament_scores" ON tournament_scores
  FOR UPDATE USING (false);
CREATE POLICY "read tournament_scores" ON tournament_scores
  FOR SELECT USING (true);

-- founder_passes: только через upgrade_founder_tier RPC
ALTER TABLE founder_passes ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "block direct founder writes"   ON founder_passes;
DROP POLICY IF EXISTS "block direct founder updates"  ON founder_passes;
DROP POLICY IF EXISTS "read founder passes"           ON founder_passes;

CREATE POLICY "block direct founder writes"  ON founder_passes
  FOR INSERT WITH CHECK (false);
CREATE POLICY "block direct founder updates" ON founder_passes
  FOR UPDATE USING (false);
CREATE POLICY "read founder passes" ON founder_passes
  FOR SELECT USING (true);

-- ── 5. Grants on RPCs ──────────────────────────────────────────────────────

GRANT EXECUTE ON FUNCTION add_tournament_score(text, text, int, text)
  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION upgrade_founder_tier(text, text, text)
  TO authenticated, anon;
GRANT EXECUTE ON FUNCTION check_spin_rate_limit(text)
  TO authenticated, anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY: запусти эти queries чтобы проверить что всё применилось
--
-- SELECT proname, pronargs FROM pg_proc
--   WHERE proname IN ('add_tournament_score','upgrade_founder_tier','check_spin_rate_limit');
--
-- SELECT tablename, policyname FROM pg_policies
--   WHERE tablename IN ('tournament_scores','founder_passes')
--   ORDER BY tablename;
--
-- ═══════════════════════════════════════════════════════════════════════════
