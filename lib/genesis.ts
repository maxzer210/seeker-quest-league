/**
 * Genesis Pre-Season config.
 *
 * Bootstrap strategy: during the GENESIS_PHASE we collect 0.01 SOL per Wheel spin
 * into the treasury wallet but DO NOT pay anything out yet. At SEASON_1_START
 * we run a distribution script that splits the accumulated pool across the
 * pre-season leaderboard.
 *
 * Toggle GENESIS_PHASE to false on launch day.
 */
import { TREASURY_WALLET, SOLANA_RPC } from './solanaMobile';

// ── Phase config ─────────────────────────────────────────────────────────────
export const GENESIS_PHASE   = true;
export const SEASON_1_START  = new Date('2026-06-22T00:00:00Z').getTime();

// ── Founder benefits (forever) ───────────────────────────────────────────────
export const FOUNDER_ORB_MULTIPLIER = 2;     // x2 ORB rewards for life
export const FOUNDER_MIN_ACTIONS    = 1;     // played at least 1 paid spin during pre-season

// ── Prize distribution at Season 1 launch ────────────────────────────────────
// Pool is split as: 60% top-100 prizes, 20% SKORA airdrop pool, 20% project treasury
export const PRIZE_POOL_PCT = 0.60;
export const TIER_PERCENTAGES: Array<{ from: number; to: number; share: number }> = [
  { from: 1,  to: 1,   share: 0.30 },   // #1: 30% of prize pool
  { from: 2,  to: 2,   share: 0.18 },   // #2: 18%
  { from: 3,  to: 3,   share: 0.12 },   // #3: 12%
  { from: 4,  to: 10,  share: 0.035 },  // #4-10: 3.5% each = 24.5% total
  { from: 11, to: 30,  share: 0.005 },  // #11-30: 0.5% each = 10%
  { from: 31, to: 100, share: 0.00071 },// #31-100: ~0.071% each ≈ 5%
];

export function calculatePrize(rank: number, prizePoolSol: number): number {
  for (const tier of TIER_PERCENTAGES) {
    if (rank >= tier.from && rank <= tier.to) {
      return prizePoolSol * tier.share;
    }
  }
  return 0;
}

// ── Countdown helpers ────────────────────────────────────────────────────────
export function getTimeUntilSeason1(now: number = Date.now()) {
  const diff = Math.max(0, SEASON_1_START - now);
  return {
    days:  Math.floor(diff / 86_400_000),
    hrs:   Math.floor((diff % 86_400_000) / 3_600_000),
    mins:  Math.floor((diff % 3_600_000)  / 60_000),
    secs:  Math.floor((diff % 60_000)     / 1_000),
    totalMs: diff,
    isLaunched: diff <= 0,
  };
}

// ── Treasury pool reader ─────────────────────────────────────────────────────
/**
 * Read live SOL balance of treasury wallet from devnet RPC.
 * Returns SOL (not lamports). Returns null on failure.
 */
export async function fetchTreasuryPool(): Promise<number | null> {
  try {
    const res = await fetch(SOLANA_RPC, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        jsonrpc: '2.0',
        id: 1,
        method: 'getBalance',
        params: [TREASURY_WALLET],
      }),
    });
    const json = await res.json();
    if (typeof json?.result?.value === 'number') {
      return json.result.value / 1e9;
    }
    return null;
  } catch (_) {
    return null;
  }
}

/**
 * Of the total treasury, this much is reserved for top-100 prizes.
 */
export function getPrizePoolPortion(totalSol: number): number {
  return totalSol * PRIZE_POOL_PCT;
}

// ── USD helper (rough) ───────────────────────────────────────────────────────
// SOL price is fetched separately or hardcoded for display only.
export const SOL_USD_FALLBACK = 175;
