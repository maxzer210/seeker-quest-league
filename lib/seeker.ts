/**
 * Seeker SDK wrapper.
 *
 * SGT verification, .skr domain resolution, SKR balance/staking all live on MAINNET.
 * Our app's paid Wheel spins live on DEVNET via lib/solanaMobile.ts.
 *
 * SDK is loaded LAZILY with try/catch — if it fails to import (e.g. native deps
 * missing in React Native), the app keeps working and Seeker features are
 * silently disabled instead of crashing on startup.
 */
import { Connection, PublicKey } from '@solana/web3.js';
import { supabase } from './supabase';

export const SEEKER_RPC = 'https://api.mainnet-beta.solana.com';
export const SGT_BONUS_ORB = 5000;

let cachedConnection: Connection | null = null;

export function getSeekerConnection(): Connection {
  if (!cachedConnection) {
    cachedConnection = new Connection(SEEKER_RPC, 'confirmed');
  }
  return cachedConnection;
}

export type SeekerProfileSnapshot = {
  walletAddress: string;
  isSeeker:      boolean;
  sgtMintAddress: string | null;
  skrDomain:     string | null;
  skrBalance:    number;
  isStaked:      boolean;
  stakedAmount:  number;
  yieldEarned:   number;
};

// ── Lazy SDK loader ──────────────────────────────────────────────────────────
// We wrap the require() so that if seeker-sdk (or any of its native peer deps)
// fails to load at runtime, the rest of the app continues to function.
let _sdkPromise: Promise<any> | null = null;

async function loadSdk(): Promise<any | null> {
  if (_sdkPromise) return _sdkPromise;
  _sdkPromise = (async () => {
    try {
      // Dynamic require — Metro bundles it, but errors at load time are caught here.
      const sdk = require('seeker-sdk');
      return sdk;
    } catch (e) {
      console.warn('[seeker] SDK failed to load:', (e as Error).message);
      return null;
    }
  })();
  return _sdkPromise;
}

/**
 * Aggregate Seeker profile — single call to fetch SGT + .skr + SKR + stake.
 * Returns null if the wallet string is invalid, the SDK is unavailable, or the RPC totally fails.
 */
export async function fetchSeekerProfile(
  walletAddress: string,
): Promise<SeekerProfileSnapshot | null> {
  if (!walletAddress) return null;
  try {
    new PublicKey(walletAddress);
  } catch {
    return null;
  }

  const sdk = await loadSdk();
  if (!sdk?.getSeekerProfile) {
    return null;
  }

  try {
    const connection = getSeekerConnection();
    const profile = await sdk.getSeekerProfile(connection, walletAddress);
    return profile as SeekerProfileSnapshot;
  } catch (e) {
    console.warn('[seeker] fetchSeekerProfile failed:', (e as Error).message);
    return null;
  }
}

/**
 * Claim the one-time SGT bonus (+5000 ORB).
 *
 * Anti-sybil: we track the SGT mint address in Supabase, not the wallet.
 * SGT can move between wallets in the same Seed Vault — but the mint stays unique per device.
 *
 * @returns true if bonus was newly granted, false if already claimed (or not eligible).
 */
export async function claimSgtBonus(
  deviceId: string,
  walletAddress: string,
  sgtMintAddress: string,
): Promise<boolean> {
  if (!sgtMintAddress || !deviceId) return false;

  try {
    const { error } = await supabase
      .from('sgt_bonus_claims')
      .insert({
        sgt_mint:       sgtMintAddress,
        device_id:      deviceId,
        wallet_address: walletAddress,
        orb_granted:    SGT_BONUS_ORB,
      });

    if (error) {
      // 23505 = unique_violation — bonus already claimed for this SGT
      if (error.code === '23505') return false;
      console.warn('[seeker] claimSgtBonus insert error:', error);
      return false;
    }
    return true;
  } catch (e) {
    console.warn('[seeker] claimSgtBonus exception:', (e as Error).message);
    return false;
  }
}

/**
 * Pretty display name: prefer .skr domain, fall back to truncated address.
 */
export function displayWalletName(
  address: string,
  skrDomain: string | null,
): string {
  if (skrDomain) return skrDomain;
  if (!address) return '';
  return address.slice(0, 4) + '...' + address.slice(-4);
}
