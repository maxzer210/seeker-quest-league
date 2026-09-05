/**
 * SKORA Token config
 *
 * After running: node scripts/create-skora-token.js
 * paste the printed mint address into SKORA_MINT below.
 */

// ── Replace with your actual mint address after running the script ──────────
// MAINNET LAUNCH (2026-05-30)
export const SKORA_MINT    = '3Q6PN3Rf1xrrHKwkPQDnBi7aBBXHYdToG2NKwBQkGwyQ';
export const SKORA_NETWORK = 'mainnet-beta';
export const SKORA_RPC     = 'https://api.mainnet-beta.solana.com';

// ── Conversion rate ──────────────────────────────────────────────────────────
export const ORB_PER_SKORA   = 10_000;   // 10,000 ORB = 1 SKORA
export const MIN_CLAIM_ORB   = 10_000;   // minimum to claim (1 SKORA)
export const SKORA_DECIMALS  = 6;

export const MAX_CLAIM_ORB = 10_000_000; // 1,000 SKORA per claim

export function orbToSkora(orb: number): number {
  return orb / ORB_PER_SKORA;
}

export function skoraDisplay(orb: number): string {
  return orbToSkora(orb).toFixed(2);
}

// ── Claim API ────────────────────────────────────────────────────────────────
import { supabase } from './supabase';

export type SkoraClaimStatus = 'pending' | 'minted' | 'failed' | 'rejected';

export type SkoraClaimRow = {
  id:             string;
  created_at:     string;
  processed_at:   string | null;
  device_id:      string;
  wallet_address: string;
  orb_spent:      number;
  skora_amount:   number;
  status:         SkoraClaimStatus;
  tx_signature:   string | null;
  error_message:  string | null;
};

/**
 * Create a SKORA claim.
 *
 * The ORB debit happens server-side in the same transaction as the insert, so
 * the caller must NOT deduct anything itself — doing so charges the player
 * twice. On success, read the balance back from the server.
 */
export type SkoraClaimResult =
  | { ok: true;  row: SkoraClaimRow }
  | { ok: false; error: string };

export async function createSkoraClaim(input: {
  deviceId:      string;
  walletAddress: string;
  orbAmount:     number;
}): Promise<SkoraClaimResult> {
  const { deviceId, walletAddress, orbAmount } = input;
  if (orbAmount < MIN_CLAIM_ORB) return { ok: false, error: 'below minimum' };
  if (orbAmount > MAX_CLAIM_ORB) return { ok: false, error: 'above maximum' };

  // The database checks the balance and debits it inside the same transaction,
  // so a claim can never be larger than what was actually earned. A direct
  // insert here is refused now — that is how the old balances got out.
  const { data, error } = await supabase.rpc('create_skora_claim', {
    p_device_id:      deviceId,
    p_wallet_address: walletAddress,
    p_orb_amount:     Math.trunc(orbAmount),
  });

  if (error) {
    console.warn('[skora] createSkoraClaim error:', error.message);
    return { ok: false, error: error.message };
  }

  const claimId = (data as { claim_id?: unknown } | null)?.claim_id;
  if (!claimId) return { ok: false, error: 'no claim id returned' };

  const row = await getClaimStatus(String(claimId));
  return row ? { ok: true, row } : { ok: false, error: 'claim created but not readable' };
}

/** Fetch most recent claims for this device. */
export async function fetchMyClaims(deviceId: string, limit = 10): Promise<SkoraClaimRow[]> {
  const { data, error } = await supabase
    .from('skora_claims')
    .select('*')
    .eq('device_id', deviceId)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as SkoraClaimRow[];
}

/** Check status of a specific claim — used for polling after creation. */
export async function getClaimStatus(claimId: string): Promise<SkoraClaimRow | null> {
  const { data, error } = await supabase
    .from('skora_claims')
    .select('*')
    .eq('id', claimId)
    .single();
  if (error || !data) return null;
  return data as SkoraClaimRow;
}
