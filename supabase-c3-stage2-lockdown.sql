-- ═══════════════════════════════════════════════════════════════════════════
-- C3 STAGE 2 — lock down the old self-grant path  ⚠️ DO NOT APPLY YET
-- ═══════════════════════════════════════════════════════════════════════════
-- Project: qxejdpvjggqjqoydujjd.supabase.co  (LIVE MAINNET)
--
-- Stage 1 (DONE, 2026-07-04): deployed the `verify-founder-payment` Edge
-- Function that verifies the payment ON-CHAIN before granting, and pointed the
-- v1.1.2 client at it. The old upgrade_founder_tier RPC is still callable so
-- ALREADY-SHIPPED clients (v1.1.0 / v1.1.1) keep working.
--
-- APPLY THIS ONLY AFTER v1.1.2 is published AND the old versions have largely
-- aged out (check dApp Store adoption / that no recent grants came via the RPC).
-- Applying it earlier makes Founder Pass purchases fail on old clients.
--
-- After this, the ONLY way to get a Founder Pass is the on-chain-verified Edge
-- Function (which runs as service_role and bypasses these grants), so a forged
-- tx_signature can no longer mint a pass.
-- ═══════════════════════════════════════════════════════════════════════════

-- 1. Remove the client's ability to self-grant via the trusting RPC.
REVOKE EXECUTE ON FUNCTION public.upgrade_founder_tier(text, text, text)
  FROM anon, authenticated;

-- 2. (Optional, stronger) Stop the client writing payment rows directly, so the
--    Edge Function becomes the sole writer. Only enable once every paid path
--    (wheel spin, energy, shop, pvp, founder) routes through a verified
--    server function — otherwise those still-client-inserted payments break.
--    Left commented until those paths are migrated too.
-- DROP POLICY IF EXISTS "Allow app to store wheel payments" ON public.wheel_sol_payments;

-- Post-apply check (read-only):
-- select has_function_privilege('anon',
--   'public.upgrade_founder_tier(text,text,text)', 'EXECUTE');  -- expect false
