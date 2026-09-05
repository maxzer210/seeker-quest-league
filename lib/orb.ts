// Server-authoritative ORB.
//
// The balance used to be whatever the client said it was: syncScore() wrote
// players.orb directly, and the anon key that authorises that write ships
// inside the APK. See supabase-orb-authoritative.sql for what that cost.
//
// Now the client proposes a delta and the server decides. Every change lands in
// orb_ledger, and the number the server returns is the truth the UI adopts.

import { supabase } from './supabase';

export type OrbApply =
  | { ok: true;  balance: number }
  | { ok: false; balance: number | null; reason: string };

/** Reads the balance the server considers real. null when it cannot be read. */
export async function fetchOrbBalance(deviceId: string): Promise<number | null> {
  try {
    const { data, error } = await supabase
      .from('players')
      .select('orb')
      .eq('device_id', deviceId)
      .maybeSingle();
    if (error || !data) return null;
    const n = Number(data.orb);
    return Number.isFinite(n) ? n : null;
  } catch {
    return null;
  }
}

/**
 * Asks the server to move the balance by `delta`.
 *
 * On refusal the server's own balance comes back where it can be read, so the
 * caller can settle the UI onto it rather than keep showing a number that will
 * never be honoured.
 */
export async function applyOrbDelta(
  deviceId: string,
  delta: number,
  reason: string,
): Promise<OrbApply> {
  const d = Math.trunc(delta);
  if (!deviceId || d === 0) return { ok: false, balance: null, reason: 'noop' };

  try {
    const { data, error } = await supabase.rpc('apply_orb_delta', {
      p_device_id: deviceId,
      p_delta:     d,
      p_reason:    reason,
    });

    if (error) {
      return { ok: false, balance: await fetchOrbBalance(deviceId), reason: error.message };
    }
    const balance = Number((data as { balance?: unknown } | null)?.balance);
    if (!Number.isFinite(balance)) {
      return { ok: false, balance: await fetchOrbBalance(deviceId), reason: 'bad response' };
    }
    return { ok: true, balance };
  } catch (e) {
    return { ok: false, balance: null, reason: String(e) };
  }
}

// SKORA claims go through createSkoraClaim in lib/skora.ts, which owns the
// conversion rate and the claim bounds.
