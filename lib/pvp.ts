/**
 * PvP Arena API.
 *
 * Async tap-battle:
 *   1. Challenger creates match (stake locked, score recorded).
 *   2. Opponent accepts (stake locked, plays, winner decided immediately).
 *   3. Winner takes 2× stake minus PVP_FEE_PCT.
 *
 * ORB transitions are handled by the CLIENT after these API calls succeed.
 * That means: subtract stake locally + sync, then call createPvpMatch.
 * On accept: subtract stake, play, call acceptPvpMatch, then add payout if won.
 *
 * NOT cryptographically secure — for devnet only. Mainnet would put escrow
 * into a Solana program. Good enough for our first 1000 players.
 */
import { supabase } from './supabase';

export type PvpStatus = 'waiting' | 'finished' | 'cancelled';

export type PvpMatch = {
  id:                 string;
  created_at:         string;
  finished_at:        string | null;
  status:             PvpStatus;
  game_type:          string;
  duration_seconds:   number;
  stake_orb:          number;
  challenger_id:      string;
  challenger_username: string;
  challenger_score:   number;
  opponent_id:        string | null;
  opponent_username:  string | null;
  opponent_score:     number | null;
  winner_id:          string | null;
  payout_orb:         number | null;
  fee_orb:            number | null;
};

export const PVP_FEE_PCT  = 0.05;          // 5% goes to project treasury
export const PVP_STAKES   = [100, 500, 1000, 5000];
export const PVP_DURATION = 30;            // seconds per tap battle
export const PVP_MATCH_TTL_HOURS = 24;     // can cancel waiting match after this

/** Create a new waiting match. Returns null on failure. */
export async function createPvpMatch(input: {
  deviceId:  string;
  username:  string;
  score:     number;
  stakeOrb:  number;
}): Promise<PvpMatch | null> {
  const { deviceId, username, score, stakeOrb } = input;
  if (!PVP_STAKES.includes(stakeOrb)) return null;
  if (score < 0) return null;

  const { data, error } = await supabase
    .from('pvp_matches')
    .insert({
      status:              'waiting',
      game_type:           'tap_battle',
      duration_seconds:    PVP_DURATION,
      stake_orb:           stakeOrb,
      challenger_id:       deviceId,
      challenger_username: username,
      challenger_score:    score,
    })
    .select('*')
    .single();
  if (error) {
    console.warn('[pvp] createPvpMatch error:', error.message);
    return null;
  }
  return data as PvpMatch;
}

/** Fetch all waiting matches (for the "open challenges" list). */
export async function fetchOpenMatches(limit = 30): Promise<PvpMatch[]> {
  const { data, error } = await supabase
    .from('pvp_matches')
    .select('*')
    .eq('status', 'waiting')
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as PvpMatch[];
}

/** Fetch matches involving this device (own + accepted). */
export async function fetchMyMatches(deviceId: string, limit = 20): Promise<PvpMatch[]> {
  const { data, error } = await supabase
    .from('pvp_matches')
    .select('*')
    .or(`challenger_id.eq.${deviceId},opponent_id.eq.${deviceId}`)
    .order('created_at', { ascending: false })
    .limit(limit);
  if (error || !data) return [];
  return data as PvpMatch[];
}

/**
 * Accept an open match. Computes winner, payout, fee, and updates the row.
 * Caller is responsible for locally deducting the stake BEFORE calling this
 * and crediting the payout AFTER it resolves with payout_orb > 0.
 *
 * Returns the finalised match (or null on failure / race condition).
 */
export async function acceptPvpMatch(input: {
  matchId:           string;
  challengerScore:   number;   // for winner calc
  challengerId:      string;
  stakeOrb:          number;
  opponentDeviceId:  string;
  opponentUsername:  string;
  opponentScore:     number;
}): Promise<PvpMatch | null> {
  const { matchId, challengerScore, challengerId, stakeOrb,
          opponentDeviceId, opponentUsername, opponentScore } = input;

  if (opponentDeviceId === challengerId) {
    // Self-play protection (client should already prevent this)
    return null;
  }

  const winnerId    = opponentScore > challengerScore ? opponentDeviceId
                    : opponentScore < challengerScore ? challengerId
                    : null;                                  // draw → null

  const pot     = stakeOrb * 2;
  const fee     = Math.round(pot * PVP_FEE_PCT);
  // On draw, return stakes (no fee). On win, winner takes pot-fee.
  const payout  = winnerId ? pot - fee : stakeOrb;
  const feeFinal = winnerId ? fee : 0;

  const { data, error } = await supabase
    .from('pvp_matches')
    .update({
      status:           'finished',
      opponent_id:      opponentDeviceId,
      opponent_username: opponentUsername,
      opponent_score:   opponentScore,
      winner_id:        winnerId,
      payout_orb:       payout,
      fee_orb:          feeFinal,
      finished_at:      new Date().toISOString(),
    })
    .eq('id', matchId)
    .eq('status', 'waiting')                                 // race-safe
    .select('*')
    .single();

  if (error || !data) {
    console.warn('[pvp] acceptPvpMatch error:', error?.message);
    return null;
  }
  return data as PvpMatch;
}

/** Cancel a waiting match (only the challenger can do this in UI). */
export async function cancelPvpMatch(matchId: string): Promise<boolean> {
  const { error } = await supabase
    .from('pvp_matches')
    .update({
      status:      'cancelled',
      finished_at: new Date().toISOString(),
    })
    .eq('id', matchId)
    .eq('status', 'waiting');
  return !error;
}

/** Helper for UI: did `deviceId` win this match? */
export function didWin(match: PvpMatch, deviceId: string): boolean {
  return match.winner_id === deviceId;
}
