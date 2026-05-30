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
 * Create a SKORA claim. Caller is responsible for deducting ORB from local
 * balance BEFORE calling this — we cannot roll back ORB on failure here,
 * but the processor script will not refund a rejected claim either.
 *
 * Best practice: wrap call site in try/catch, only deduct ORB if this resolves OK.
 */
export async function createSkoraClaim(input: {
  deviceId:      string;
  walletAddress: string;
  orbAmount:     number;
}): Promise<SkoraClaimRow | null> {
  const { deviceId, walletAddress, orbAmount } = input;
  if (orbAmount < MIN_CLAIM_ORB) return null;
  if (orbAmount > MAX_CLAIM_ORB) return null;

  const skoraAmount = orbToSkora(orbAmount);
  const { data, error } = await supabase
    .from('skora_claims')
    .insert({
      device_id:      deviceId,
      wallet_address: walletAddress,
      orb_spent:      orbAmount,
      skora_amount:   skoraAmount,
      status:         'pending',
    })
    .select('*')
    .single();

  if (error) {
    console.warn('[skora] createSkoraClaim error:', error.message);
    return null;
  }
  return data as SkoraClaimRow;
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
