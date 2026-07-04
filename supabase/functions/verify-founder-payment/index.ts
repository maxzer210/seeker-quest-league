// ═══════════════════════════════════════════════════════════════════════════
// verify-founder-payment — C3 fix: trust the CHAIN, not the client
// ═══════════════════════════════════════════════════════════════════════════
// The old path let the client insert a wheel_sol_payments row with any
// tx_signature and call upgrade_founder_tier(), which trusted that row —
// so a forged signature minted a free Founder Pass.
//
// This function verifies the payment ON-CHAIN before granting:
//   1. tx_signature is single-use (never already backed a Founder Pass)
//   2. the tx exists, succeeded, and is recent
//   3. it transferred >= the tier's required SOL INTO the treasury
// then grants the pass with the service-role key (bypasses RLS).
//
// Runs with the SHIPPED grant path still live (staged rollout). The client
// change to call this lands in v1.1.2; the old upgrade_founder_tier RPC is
// revoked only after the new client is adopted (Stage 2).
//
// Residual (next hardening): payer binding relies on the tx fee-payer, which
// the client passes untrusted — full proof needs a wallet-signed message.
// Single-use + real-on-chain-payment already closes the forge exploit.
// ═══════════════════════════════════════════════════════════════════════════
import { createClient } from 'jsr:@supabase/supabase-js@2';

const TREASURY = 'CxYfXXLGEm1FXcL7cVzTHe1kG3gpo5ecsKgVjXRhLGSp';
const RPC = 'https://api.mainnet-beta.solana.com';
const LAMPORTS_PER_SOL = 1_000_000_000;
const REQUIRED_SOL: Record<string, number> = { silver: 0.5, gold: 1.0, diamond: 2.0 };
const TIER_RANK: Record<string, number> = { free: 0, silver: 1, gold: 2, diamond: 3 };
const MAX_AGE_SEC = 30 * 60; // tx must be at most 30 min old

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Business outcomes (accepted OR rejected) return HTTP 200 with {ok}, so the
// supabase-js client reads the reason from `data` instead of a generic
// non-2xx FunctionsHttpError. Only genuine server faults use 5xx.
function json(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, 'Content-Type': 'application/json' },
  });
}

async function rpc(method: string, params: unknown[]): Promise<any> {
  const res = await fetch(RPC, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }),
  });
  const j = await res.json();
  return j.result;
}

// Poll a few times — a just-broadcast tx may not be queryable yet.
async function fetchTx(signature: string): Promise<any | null> {
  for (let attempt = 0; attempt < 4; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, 2000));
    try {
      const tx = await rpc('getTransaction', [
        signature,
        { maxSupportedTransactionVersion: 0, commitment: 'confirmed' },
      ]);
      if (tx) return tx;
    } catch (_) { /* retry */ }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: CORS });
  if (req.method !== 'POST') return json({ ok: false, error: 'method' }, 405);

  try {
    const { device_id, tier, tx_signature, wallet_address } = await req.json();

    if (!device_id || typeof device_id !== 'string' || device_id.length < 8) {
      return json({ ok: false, error: 'bad_device' });
    }
    const requiredSol = REQUIRED_SOL[tier];
    if (!requiredSol) return json({ ok: false, error: 'bad_tier' });
    if (!tx_signature || typeof tx_signature !== 'string' || tx_signature.length < 32) {
      return json({ ok: false, error: 'bad_signature' });
    }

    const admin = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    // 1. Single-use — a signature can back at most one Founder Pass.
    const { data: used } = await admin
      .from('founder_passes').select('device_id')
      .eq('tx_signature', tx_signature).maybeSingle();
    if (used) return json({ ok: false, error: 'signature_used' });

    // 2. On-chain verification.
    const tx = await fetchTx(tx_signature);
    if (!tx) return json({ ok: false, error: 'tx_not_found' });
    if (tx.meta?.err) return json({ ok: false, error: 'tx_failed' });
    if (tx.blockTime && (Date.now() / 1000 - tx.blockTime) > MAX_AGE_SEC) {
      return json({ ok: false, error: 'tx_too_old' });
    }

    const rawKeys = tx.transaction?.message?.accountKeys ?? [];
    const keys: string[] = rawKeys.map((k: any) => (typeof k === 'string' ? k : k?.pubkey));
    const idx = keys.indexOf(TREASURY);
    if (idx < 0) return json({ ok: false, error: 'not_to_treasury' });

    const pre = tx.meta?.preBalances?.[idx];
    const post = tx.meta?.postBalances?.[idx];
    if (pre == null || post == null) return json({ ok: false, error: 'no_balances' });
    const delta = post - pre;
    if (delta < requiredSol * LAMPORTS_PER_SOL) {
      return json({ ok: false, error: 'insufficient_amount', paid_sol: delta / LAMPORTS_PER_SOL });
    }

    // 3. Anti-downgrade.
    const { data: cur } = await admin
      .from('founder_passes').select('tier').eq('device_id', device_id).maybeSingle();
    if (cur && (TIER_RANK[cur.tier] ?? 0) >= TIER_RANK[tier]) {
      return json({ ok: false, error: 'no_downgrade', current: cur.tier });
    }

    // 4. Record the payment (idempotent on tx_signature) and grant the pass.
    await admin.from('wheel_sol_payments').upsert({
      device_id,
      wallet_address: wallet_address ?? keys[0] ?? 'unknown',
      tx_signature,
      lamports: delta,
      sol_amount: delta / LAMPORTS_PER_SOL,
      network: 'mainnet-beta',
      status: `confirmed:founder_${tier}`,
    }, { onConflict: 'tx_signature', ignoreDuplicates: true });

    const { error: grantErr } = await admin.from('founder_passes').upsert({
      device_id, tier, tx_signature, purchased_at: new Date().toISOString(),
    }, { onConflict: 'device_id' });
    if (grantErr) return json({ ok: false, error: 'grant_failed', detail: grantErr.message }, 500);

    return json({ ok: true, tier, paid_sol: delta / LAMPORTS_PER_SOL });
  } catch (e) {
    return json({ ok: false, error: 'server_error', detail: String(e) }, 500);
  }
});
