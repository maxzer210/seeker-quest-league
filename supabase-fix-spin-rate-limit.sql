-- ═══════════════════════════════════════════════════════════════════════════
-- HOTFIX — check_spin_rate_limit referenced a non-existent column
-- ═══════════════════════════════════════════════════════════════════════════
-- Project: qxejdpvjggqjqoydujjd.supabase.co  (LIVE MAINNET)
-- Date: 2026-07-04
--
-- The function filtered on `purpose = 'wheel_spin'`, but wheel_sol_payments has
-- no `purpose` column — so every call threw, the client caught it and "allowed
-- optimistically", i.e. the 10-spins/minute limit was effectively OFF.
--
-- payForWheelSpin records wheel spins with status = 'confirmed' exactly
-- (paySolToTreasury uses 'confirmed:<purpose>'), so status='confirmed' selects
-- wheel spins precisely. Check runs BEFORE the current spin is recorded.
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.check_spin_rate_limit(p_device_id text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_recent_count int;
BEGIN
  SELECT count(*) INTO v_recent_count FROM wheel_sol_payments
  WHERE device_id = p_device_id
    AND status = 'confirmed'
    AND created_at > now() - interval '1 minute';

  -- Allow max 10 paid spins / minute
  RETURN v_recent_count < 10;
END $$;
