-- ═══════════════════════════════════════════════════════════════════════════
-- HOTFIX — mainnet payments were being rejected + Founder RPC was broken
-- ═══════════════════════════════════════════════════════════════════════════
-- Project: qxejdpvjggqjqoydujjd.supabase.co  (LIVE MAINNET)
-- Date: 2026-07-04
--
-- WHAT WAS BROKEN (confirmed against the live DB):
--
--  1. RLS INSERT policy on wheel_sol_payments hardcoded:
--        network='devnet' AND lamports=10000000 AND sol_amount=0.01
--     The mainnet client sends network='mainnet-beta' and non-0.01 amounts,
--     so EVERY payment insert since the mainnet launch was silently rejected.
--     (Client does `await ...insert(...)` without checking `.error`, so the
--      app continued as if paid.) Result: 0 mainnet payment rows recorded.
--
--  2. upgrade_founder_tier() reads columns `amount_sol` and `purpose` that DO
--     NOT EXIST (real columns: `sol_amount`, `status`). Combined with (1), a
--     paid Founder Pass ALWAYS failed at the RPC step AFTER the user had
--     already paid 0.5–2.0 SOL on-chain → real money lost, no pass granted.
--     The client encodes the purpose in `status` as 'confirmed:founder_<tier>'.
--
-- SCOPE OF THIS HOTFIX: make legitimate mainnet payments record + make the
-- Founder RPC read the correct columns. This restores the feature without an
-- APK rebuild (client already sends the right data).
--
-- ⚠️ KNOWN REMAINING RISK (tracked separately — C3 in the audit):
-- The client still writes payment rows directly, and this RPC trusts that
-- table. A technical attacker could forge a row + a fake tx_signature to mint
-- a free Founder Pass. The proper fix is on-chain verification in a Supabase
-- Edge Function (verify recipient=treasury, amount, unique sig, fresh
-- blockTime) before trusting the payment. This hotfix does NOT close that;
-- it only stops the money loss / makes the feature functional.
-- ═══════════════════════════════════════════════════════════════════════════

BEGIN;

-- ── 1. Replace the devnet-locked INSERT policy with sane mainnet bounds ──────
DROP POLICY IF EXISTS "Allow app to store wheel payments" ON public.wheel_sol_payments;

CREATE POLICY "Allow app to store wheel payments"
  ON public.wheel_sol_payments
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (
    device_id       IS NOT NULL
    AND wallet_address IS NOT NULL
    AND tx_signature   IS NOT NULL
    AND lamports    > 0
    AND lamports    <= 5000000000          -- ≤ 5 SOL sanity cap
    AND sol_amount  > 0
    AND sol_amount  <= 5
    AND network IN ('mainnet-beta', 'devnet')
    AND status LIKE 'confirmed%'           -- 'confirmed' | 'confirmed:<purpose>'
  );

-- ── 2. Fix upgrade_founder_tier to use the real column names ─────────────────
--     amount_sol -> sol_amount ; purpose='founder_x' -> status='confirmed:founder_x'
CREATE OR REPLACE FUNCTION public.upgrade_founder_tier(
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
  v_required_sol := CASE p_new_tier
    WHEN 'silver'  THEN 0.5
    WHEN 'gold'    THEN 1.0
    WHEN 'diamond' THEN 2.0
    ELSE NULL
  END;
  IF v_required_sol IS NULL THEN
    RAISE EXCEPTION 'Invalid tier: % (must be silver/gold/diamond)', p_new_tier;
  END IF;

  -- Verify the SOL payment row exists (real columns: sol_amount, status).
  SELECT sol_amount INTO v_paid_sol
  FROM wheel_sol_payments
  WHERE tx_signature = p_tx_signature
    AND device_id    = p_device_id
    AND status       = CONCAT('confirmed:founder_', p_new_tier);

  IF v_paid_sol IS NULL THEN
    RAISE EXCEPTION 'Payment not found for tx_signature: %', p_tx_signature;
  END IF;
  IF v_paid_sol < v_required_sol THEN
    RAISE EXCEPTION 'Insufficient payment: % SOL (needed %)', v_paid_sol, v_required_sol;
  END IF;

  -- Anti-downgrade
  SELECT tier INTO v_current_tier FROM founder_passes WHERE device_id = p_device_id;
  IF v_current_tier IS NOT NULL THEN
    IF (v_current_tier = 'diamond')
       OR (v_current_tier = 'gold'   AND p_new_tier IN ('silver'))
       OR (v_current_tier = 'silver' AND p_new_tier IN ('free')) THEN
      RAISE EXCEPTION 'Cannot downgrade from % to %', v_current_tier, p_new_tier;
    END IF;
  END IF;

  INSERT INTO founder_passes (device_id, tier, tx_signature, purchased_at)
  VALUES (p_device_id, p_new_tier, p_tx_signature, now())
  ON CONFLICT (device_id) DO UPDATE
    SET tier = excluded.tier,
        tx_signature = excluded.tx_signature,
        purchased_at = now();

  RETURN jsonb_build_object('ok', true, 'tier', p_new_tier, 'paid_sol', v_paid_sol);
END $$;

COMMIT;

-- ── Post-apply sanity checks (run manually, read-only) ──────────────────────
-- select pg_get_expr(polwithcheck, polrelid) from pg_policy
--   where polname='Allow app to store wheel payments';
-- select 1 from pg_proc where proname='upgrade_founder_tier';
