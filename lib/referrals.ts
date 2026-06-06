/**
 * Referrals — invite friends, both earn ORB.
 *
 * Server: supabase-referrals.sql (players.referral_code + referrals table + RPCs).
 * Reward delivery is split to avoid the client/server balance overwrite:
 *   • referred player grants their bonus locally on claim
 *   • referrer collects accumulated rewards on next app open (collectReferrerRewards)
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';

// Keep in sync with supabase-referrals.sql defaults
export const REFERRER_REWARD = 2000;
export const REFERRED_REWARD = 2000;

const KEY_CODE        = 'sk_ref_code';
const KEY_CLAIMED     = 'sk_ref_claimed';   // '1' once this device redeemed a code

/** Get this device's referral code, creating it server-side if needed. Cached. */
export async function ensureReferralCode(deviceId: string): Promise<string | null> {
  if (!deviceId) return null;
  try {
    const cached = await AsyncStorage.getItem(KEY_CODE);
    if (cached) return cached;
    const { data, error } = await supabase.rpc('get_or_create_referral_code', {
      p_device_id: deviceId,
    });
    if (error || !data?.ok) return null;
    const code = data.code as string;
    await AsyncStorage.setItem(KEY_CODE, code);
    return code;
  } catch {
    return null;
  }
}

export type ClaimError = 'not_found' | 'self' | 'already_used' | 'failed';
export type ClaimResult =
  | { ok: true; reward: number }
  | { ok: false; error: ClaimError };

/** Redeem a friend's code. Returns the referred bonus to grant locally. */
export async function claimReferral(referredDevice: string, code: string): Promise<ClaimResult> {
  if (!referredDevice || !code.trim()) return { ok: false, error: 'failed' };
  try {
    const already = await AsyncStorage.getItem(KEY_CLAIMED);
    if (already === '1') return { ok: false, error: 'already_used' };

    const { data, error } = await supabase.rpc('claim_referral', {
      p_referred_device: referredDevice,
      p_code:            code.trim(),
    });
    if (error) return { ok: false, error: 'failed' };
    if (!data?.ok) return { ok: false, error: (data?.error ?? 'failed') as ClaimError };

    await AsyncStorage.setItem(KEY_CLAIMED, '1');
    return { ok: true, reward: (data.referred_reward as number) ?? REFERRED_REWARD };
  } catch {
    return { ok: false, error: 'failed' };
  }
}

/** True if this device has already redeemed a referral code. */
export async function hasClaimedReferral(): Promise<boolean> {
  try { return (await AsyncStorage.getItem(KEY_CLAIMED)) === '1'; } catch { return false; }
}

/**
 * Collect any uncollected referrer rewards. Call on app open.
 * Returns total ORB to grant locally (0 if none).
 */
export async function collectReferrerRewards(deviceId: string): Promise<number> {
  if (!deviceId) return 0;
  try {
    const { data, error } = await supabase.rpc('collect_referral_rewards', {
      p_referrer_device: deviceId,
    });
    if (error || !data?.ok) return 0;
    return (data.total as number) ?? 0;
  } catch {
    return 0;
  }
}

/** How many friends this device has successfully invited. */
export async function getReferralCount(deviceId: string): Promise<number> {
  if (!deviceId) return 0;
  try {
    const { count } = await supabase
      .from('referrals')
      .select('id', { count: 'exact', head: true })
      .eq('referrer_device', deviceId);
    return count ?? 0;
  } catch {
    return 0;
  }
}
