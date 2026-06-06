-- ═══════════════════════════════════════════════════════════════════════════
-- REFERRALS — invite friends, both earn ORB
-- ═══════════════════════════════════════════════════════════════════════════
-- Apply to: qxejdpvjggqjqoydujjd.supabase.co  (SQL Editor → NEW QUERY)
-- Version: 1.0 (2026-06-03)
--
-- Model:
--   • Each player has a short referral_code (players.referral_code).
--   • A NEW player enters a friend's code once → referrals row is created.
--   • Referred player gets their bonus immediately (client grants locally).
--   • Referrer is offline → collects accumulated rewards on next app open via
--     collect_referral_rewards() (client grants locally, avoids server/client
--     balance overwrite).
--
-- Anti-abuse:
--   • referred_device is UNIQUE → a device can only be referred once, ever.
--   • self-referral blocked in RPC.
--   • direct INSERT/UPDATE on referrals blocked by RLS — only via RPCs.
-- ═══════════════════════════════════════════════════════════════════════════

-- ── reward amounts (keep in sync with lib/referrals.ts) ────────────────────
-- referrer: 2000 ORB · referred: 2000 ORB

-- ── 1. players.referral_code ───────────────────────────────────────────────
ALTER TABLE public.players
  ADD COLUMN IF NOT EXISTS referral_code text;

CREATE UNIQUE INDEX IF NOT EXISTS players_referral_code_idx
  ON public.players (referral_code);

-- ── 2. referrals table ─────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.referrals (
  id                bigint generated always as identity primary key,
  created_at        timestamptz not null default now(),
  referrer_device   text   not null,
  referred_device   text   not null unique,   -- a device can only be referred once
  referrer_reward   integer not null default 2000,
  referred_reward   integer not null default 2000,
  referrer_collected boolean not null default false
);

CREATE INDEX IF NOT EXISTS referrals_referrer_idx
  ON public.referrals (referrer_device);

-- ── 3. get_or_create_referral_code — assign a unique code to a device ───────
CREATE OR REPLACE FUNCTION get_or_create_referral_code(p_device_id text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_code     text;
  v_existing text;
  v_alphabet text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; -- no ambiguous 0/O/1/I
  v_try      int := 0;
BEGIN
  IF p_device_id IS NULL OR length(p_device_id) < 8 THEN
    RAISE EXCEPTION 'Invalid device_id';
  END IF;

  SELECT referral_code INTO v_existing FROM players WHERE device_id = p_device_id;
  IF v_existing IS NOT NULL THEN
    RETURN jsonb_build_object('ok', true, 'code', v_existing);
  END IF;

  LOOP
    v_try := v_try + 1;
    v_code := 'SQ' ||
      string_agg(substr(v_alphabet, (floor(random() * length(v_alphabet)) + 1)::int, 1), '')
      FROM generate_series(1, 4);
    BEGIN
      UPDATE players SET referral_code = v_code WHERE device_id = p_device_id;
      EXIT;  -- success
    EXCEPTION WHEN unique_violation THEN
      IF v_try > 10 THEN RAISE EXCEPTION 'Could not generate unique code'; END IF;
    END;
  END LOOP;

  RETURN jsonb_build_object('ok', true, 'code', v_code);
END $$;

-- ── 4. claim_referral — new player redeems a friend's code ─────────────────
CREATE OR REPLACE FUNCTION claim_referral(
  p_referred_device text,
  p_code            text
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_referrer_device text;
  v_referred_reward int;
BEGIN
  IF p_referred_device IS NULL OR length(p_referred_device) < 8 THEN
    RAISE EXCEPTION 'Invalid device_id';
  END IF;

  -- Resolve referrer by code (case-insensitive)
  SELECT device_id INTO v_referrer_device
  FROM players WHERE upper(referral_code) = upper(trim(p_code));

  IF v_referrer_device IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_found');
  END IF;
  IF v_referrer_device = p_referred_device THEN
    RETURN jsonb_build_object('ok', false, 'error', 'self');
  END IF;

  -- Insert referral (unique on referred_device prevents double-claim)
  BEGIN
    INSERT INTO referrals (referrer_device, referred_device)
    VALUES (v_referrer_device, p_referred_device)
    RETURNING referred_reward INTO v_referred_reward;
  EXCEPTION WHEN unique_violation THEN
    RETURN jsonb_build_object('ok', false, 'error', 'already_used');
  END;

  RETURN jsonb_build_object('ok', true, 'referred_reward', v_referred_reward);
END $$;

-- ── 5. collect_referral_rewards — referrer claims accumulated rewards ───────
CREATE OR REPLACE FUNCTION collect_referral_rewards(p_referrer_device text)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_total int;
  v_count int;
BEGIN
  IF p_referrer_device IS NULL OR length(p_referrer_device) < 8 THEN
    RAISE EXCEPTION 'Invalid device_id';
  END IF;

  SELECT COALESCE(sum(referrer_reward), 0), count(*)
    INTO v_total, v_count
  FROM referrals
  WHERE referrer_device = p_referrer_device AND referrer_collected = false;

  IF v_count > 0 THEN
    UPDATE referrals SET referrer_collected = true
    WHERE referrer_device = p_referrer_device AND referrer_collected = false;
  END IF;

  RETURN jsonb_build_object('ok', true, 'total', v_total, 'count', v_count);
END $$;

-- ── 6. RLS — referrals writable only via RPCs ──────────────────────────────
ALTER TABLE public.referrals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "read referrals"          ON public.referrals;
DROP POLICY IF EXISTS "block referral insert"   ON public.referrals;
DROP POLICY IF EXISTS "block referral update"   ON public.referrals;
CREATE POLICY "read referrals"        ON public.referrals FOR SELECT USING (true);
CREATE POLICY "block referral insert" ON public.referrals FOR INSERT WITH CHECK (false);
CREATE POLICY "block referral update" ON public.referrals FOR UPDATE USING (false);

-- ── 7. Grants ──────────────────────────────────────────────────────────────
GRANT EXECUTE ON FUNCTION get_or_create_referral_code(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION claim_referral(text, text)        TO anon, authenticated;
GRANT EXECUTE ON FUNCTION collect_referral_rewards(text)    TO anon, authenticated;

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFY:
--   SELECT proname FROM pg_proc WHERE proname IN
--     ('get_or_create_referral_code','claim_referral','collect_referral_rewards');
--   SELECT count(*) FROM referrals;
-- ═══════════════════════════════════════════════════════════════════════════
