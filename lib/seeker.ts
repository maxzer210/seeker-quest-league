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

/**
 * Normalize a .skr domain coming from the SDK.
 *
 * The SDK can return the domain as a Uint8Array / number[] / Buffer-like (or a
 * stringified byte array like "99,114,121,..."). Rendered directly in <Text>
 * that shows up as raw comma-separated char codes. Decode to a real string.
 */
/**
 * Printable ASCII only — anything else is not part of a domain. Built with a
 * loop rather than String.fromCharCode(...bytes), which blows the stack on a
 * long array.
 */
function decodeBytes(bytes: number[]): string {
  let out = '';
  for (const b of bytes) {
    if (Number.isFinite(b) && b >= 0x20 && b <= 0x7e) out += String.fromCharCode(b);
  }
  return out;
}

export function normalizeSkrDomain(raw: any): string | null {
  if (raw == null) return null;

  let s: string;

  if (typeof raw === 'string') {
    const trimmed = raw.trim();
    if (!trimmed) return null;
    // The SDK hands this back as a stringified byte array — and sometimes with
    // the ".skr" suffix already glued on the end: "99,114,121,...,101.skr".
    // The old test demanded the WHOLE string be digits and commas, so that
    // variant fell through untouched and the profile screen printed the raw
    // char codes. Strip a trailing suffix before deciding what we are holding.
    const body = trimmed.replace(/\.skr\s*$/i, '');
    // Two or more numbers, so a genuinely numeric name like "123.skr" stays a
    // name instead of being decoded into punctuation.
    s = /^\d+(\s*,\s*\d+)+$/.test(body)
      ? decodeBytes(body.split(',').map(n => parseInt(n.trim(), 10)))
      : trimmed;
  } else if (Array.isArray(raw)) {
    s = decodeBytes(raw.map(Number));
  } else if (raw instanceof Uint8Array) {
    s = decodeBytes(Array.from(raw));
  } else if (raw?.type === 'Buffer' && Array.isArray(raw.data)) {
    s = decodeBytes(raw.data.map(Number));
  } else {
    s = String(raw);
  }

  s = s.trim().toLowerCase();
  if (!s) return null;
  if (s.endsWith('.skr')) s = s.slice(0, -4);
  // A name that survived decoding but still looks like junk is worse than no
  // name at all: it would be shown on the profile and adopted as the username.
  if (!/^[a-z0-9][a-z0-9-]{0,62}$/.test(s)) return null;
  return s + '.skr';
}

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
    if (!profile) return null;
    // Decode .skr domain — SDK may hand it back as raw bytes.
    return {
      ...(profile as SeekerProfileSnapshot),
      skrDomain: normalizeSkrDomain((profile as any).skrDomain),
    };
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
