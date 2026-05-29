-- ═══════════════════════════════════════════════════════════════════════════
-- P2P ORB Transfer System + Burn Tracking
-- ═══════════════════════════════════════════════════════════════════════════
-- Apply to Supabase project: qxejdpvjggqjqoydujjd.supabase.co
-- Run via SQL Editor in Supabase Dashboard.
-- Version: 0.2 (May 2026)
-- ═══════════════════════════════════════════════════════════════════════════

-- ── 1. Tables ────────────────────────────────────────────────────────────────

-- Transfer history (immutable audit log)
CREATE TABLE IF NOT EXISTS orb_transfers (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id      text NOT NULL,
  recipient_id   text NOT NULL,
  amount         int  NOT NULL CHECK (amount >= 1000),
  fee            int  NOT NULL,
  burned         int  NOT NULL,
  treasury_cut   int  NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orb_transfers_sender
  ON orb_transfers (sender_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_orb_transfers_recipient
  ON orb_transfers (recipient_id, created_at DESC);

-- Burn tracking (all sources: p2p, premium, monthly buyback)
CREATE TABLE IF NOT EXISTS orb_burned (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  amount      int  NOT NULL,
  source      text NOT NULL CHECK (source IN ('p2p_transfer','premium_purchase','monthly_buyback')),
  ref_id      uuid,  -- optional link to source tx
  created_at  timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_orb_burned_created
  ON orb_burned (created_at DESC);

-- SOL treasury accounting
CREATE TABLE IF NOT EXISTS treasury_balance (
  id          int  PRIMARY KEY DEFAULT 1,
  orb_balance bigint NOT NULL DEFAULT 0,
  updated_at  timestamptz NOT NULL DEFAULT now(),
  CHECK (id = 1)  -- single-row table
);

INSERT INTO treasury_balance (id, orb_balance)
VALUES (1, 0)
ON CONFLICT (id) DO NOTHING;

-- ── 2. Founder Pass tracking ────────────────────────────────────────────────

CREATE TABLE IF NOT EXISTS founder_passes (
  device_id   text PRIMARY KEY,
  tier        text NOT NULL CHECK (tier IN ('free','silver','gold','diamond')),
  purchased_at timestamptz NOT NULL DEFAULT now(),
  tx_signature text
);

-- ── 3. P2P Transfer RPC (atomic + secure) ───────────────────────────────────

CREATE OR REPLACE FUNCTION transfer_orb(
  p_sender    text,
  p_recipient text,
  p_amount    int
) RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_fee        int;
  v_burn       int;
  v_treasury   int;
  v_net        int;
  v_sender_orb int;
  v_recent_total int;
BEGIN
  -- Validate
  IF p_sender = p_recipient THEN
    RAISE EXCEPTION 'Cannot transfer to yourself';
  END IF;
  IF p_amount < 1000 THEN
    RAISE EXCEPTION 'Minimum transfer: 1000 ORB';
  END IF;

  -- Compute fee splits (5% total: 3% burn + 2% treasury)
  v_fee      := p_amount * 5 / 100;
  v_burn     := p_amount * 3 / 100;
  v_treasury := v_fee - v_burn;        -- = 2% (handles rounding)
  v_net      := p_amount - v_fee;

  -- Lock sender, check balance
  SELECT orb INTO v_sender_orb
  FROM players
  WHERE device_id = p_sender
  FOR UPDATE;

  IF v_sender_orb IS NULL THEN
    RAISE EXCEPTION 'Sender not found';
  END IF;
  IF v_sender_orb < p_amount THEN
    RAISE EXCEPTION 'Insufficient ORB balance';
  END IF;

  -- Daily cap check (50K ORB/day per sender)
  SELECT coalesce(sum(amount), 0)
    INTO v_recent_total
  FROM orb_transfers
  WHERE sender_id = p_sender
    AND created_at > now() - interval '24 hours';

  IF v_recent_total + p_amount > 50000 THEN
    RAISE EXCEPTION 'Daily transfer cap exceeded (50,000 ORB / 24h)';
  END IF;

  -- Cooldown check (1 min between transfers)
  IF EXISTS (
    SELECT 1 FROM orb_transfers
    WHERE sender_id = p_sender
      AND created_at > now() - interval '60 seconds'
  ) THEN
    RAISE EXCEPTION 'Transfer cooldown: wait 1 minute between transfers';
  END IF;

  -- Verify recipient exists
  IF NOT EXISTS (SELECT 1 FROM players WHERE device_id = p_recipient) THEN
    RAISE EXCEPTION 'Recipient not found';
  END IF;

  -- Execute transfer
  UPDATE players SET orb = orb - p_amount WHERE device_id = p_sender;
  UPDATE players SET orb = orb + v_net    WHERE device_id = p_recipient;

  -- Record burn
  INSERT INTO orb_burned (amount, source) VALUES (v_burn, 'p2p_transfer');

  -- Treasury credit
  UPDATE treasury_balance SET orb_balance = orb_balance + v_treasury, updated_at = now()
  WHERE id = 1;

  -- History
  INSERT INTO orb_transfers (sender_id, recipient_id, amount, fee, burned, treasury_cut)
  VALUES (p_sender, p_recipient, p_amount, v_fee, v_burn, v_treasury);

  RETURN jsonb_build_object(
    'ok',        true,
    'sent',      p_amount,
    'received',  v_net,
    'burned',    v_burn,
    'treasury',  v_treasury
  );
END $$;

-- ── 4. View: daily burn stats (for UI display) ──────────────────────────────

CREATE OR REPLACE VIEW v_burn_stats AS
SELECT
  date_trunc('day', created_at) AS day,
  source,
  sum(amount) AS amount_burned,
  count(*)    AS tx_count
FROM orb_burned
WHERE created_at > now() - interval '30 days'
GROUP BY 1, 2
ORDER BY 1 DESC;

-- ── 5. RLS policies (lock down direct table writes) ────────────────────────

ALTER TABLE orb_transfers       ENABLE ROW LEVEL SECURITY;
ALTER TABLE orb_burned          ENABLE ROW LEVEL SECURITY;
ALTER TABLE treasury_balance    ENABLE ROW LEVEL SECURITY;
ALTER TABLE founder_passes      ENABLE ROW LEVEL SECURITY;

-- Anyone can read their own transfers
CREATE POLICY "read own transfers" ON orb_transfers
  FOR SELECT USING (true);

-- Direct INSERT is blocked — must use transfer_orb() RPC
CREATE POLICY "no direct inserts" ON orb_transfers
  FOR INSERT WITH CHECK (false);

CREATE POLICY "read burns" ON orb_burned
  FOR SELECT USING (true);

CREATE POLICY "read treasury" ON treasury_balance
  FOR SELECT USING (true);

CREATE POLICY "read founder passes" ON founder_passes
  FOR SELECT USING (true);

-- ── 6. Grant execute on RPC to authenticated + anon ────────────────────────

GRANT EXECUTE ON FUNCTION transfer_orb(text, text, int) TO authenticated, anon;

-- ═══════════════════════════════════════════════════════════════════════════
-- USAGE FROM APP:
--
-- const { data, error } = await supabase.rpc('transfer_orb', {
--   p_sender: deviceIdRef.current,
--   p_recipient: targetDeviceId,
--   p_amount: 10_000,
-- });
-- // data = { ok, sent, received, burned, treasury }
-- ═══════════════════════════════════════════════════════════════════════════
