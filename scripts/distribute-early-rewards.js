#!/usr/bin/env node
/**
 * Early Rewards Distribution — Genesis goodwill payout (HYBRID model)
 *
 * Backs up the "Win real SOL" promise with a real first distribution.
 * Budget: 0.5 SOL split into two pools:
 *   • Competitive (0.35 SOL) → top-10 by tournament score
 *   • Early-bird  (0.15 SOL) → first N players with a connected wallet, equal split
 *
 * SAFETY: defaults to DRY-RUN. Real SOL is only sent with the explicit --live flag.
 *
 * Usage:
 *   $env:SUPABASE_SERVICE_KEY = "<service_role key>"
 *   node scripts/distribute-early-rewards.js               # DRY RUN (default, no tx)
 *   node scripts/distribute-early-rewards.js --live        # REAL — sends mainnet SOL
 *
 * Prerequisites:
 *   1. supabase-prize-distribution.sql applied (players.wallet_address + prize_distributions)
 *   2. distribution-wallet.json present — a DEDICATED keypair (NOT the Phantom treasury),
 *      funded with ~0.51 SOL mainnet. Create with:
 *        solana-keygen new --outfile distribution-wallet.json
 *      Accepts either a raw byte-array keypair (solana-keygen) or { secret: "<hex>" }.
 *      Override path with DISTRIBUTION_KEYPAIR env.
 *   3. SUPABASE_SERVICE_KEY env set (service_role — bypasses RLS to log payouts)
 *
 * Idempotent: a (season_id, device_id) already marked 'sent' is skipped on re-run.
 */

const {
  Connection, Keypair, PublicKey, LAMPORTS_PER_SOL,
  SystemProgram, Transaction, sendAndConfirmTransaction,
} = require('@solana/web3.js');
const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

// ── Config ──────────────────────────────────────────────────────────────────
const NETWORK = 'mainnet-beta';
const RPC_URL = 'https://api.mainnet-beta.solana.com';

const SEASON_ID      = 'early-rewards-001';
const TOURNAMENT_ID  = 'season-zero';

const COMPETITIVE_POOL = 0.35;   // SOL to top-10
const EARLYBIRD_POOL   = 0.15;   // SOL to first N players
const EARLYBIRD_COUNT  = 30;     // how many early players share the early-bird pool

// Competitive shares of COMPETITIVE_POOL (must sum to 1.0)
const COMPETITIVE_SHARES = [
  0.30,                          // #1
  0.18,                          // #2
  0.12,                          // #3
  0.08, 0.08, 0.08,              // #4-6
  0.04, 0.04, 0.04, 0.04,        // #7-10
];

const SUPABASE_URL = 'https://qxejdpvjggqjqoydujjd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const args = process.argv.slice(2);
const LIVE = args.includes('--live');   // default = dry run

// ── Helpers ───────────────────────────────────────────────────────────────
function fmtSol(lamports) { return (lamports / LAMPORTS_PER_SOL).toFixed(5) + ' SOL'; }
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

function loadDistributionKeypair() {
  const p = process.env.DISTRIBUTION_KEYPAIR
    ? path.resolve(process.env.DISTRIBUTION_KEYPAIR)
    : path.join(__dirname, '..', 'distribution-wallet.json');
  if (!fs.existsSync(p)) throw new Error(`distribution keypair not found: ${p}`);
  const raw = JSON.parse(fs.readFileSync(p, 'utf8'));
  // solana-keygen format = array of bytes
  if (Array.isArray(raw)) return Keypair.fromSecretKey(Uint8Array.from(raw));
  // { secret: "<hex>" } or { mintAuthoritySecret: "<hex>" }
  const hex = raw.secret || raw.mintAuthoritySecret;
  if (!hex) throw new Error('keypair file has no byte-array, .secret, or .mintAuthoritySecret');
  return Keypair.fromSecretKey(Buffer.from(hex, 'hex'));
}

// ── Build recipient plan ────────────────────────────────────────────────────
async function buildPlan(supabase) {
  const compPlan = [];
  const earlyPlan = [];

  // 1. Competitive: top-10 by score, enrich with wallet
  const { data: scores, error: scErr } = await supabase
    .from('tournament_scores')
    .select('device_id, username, score')
    .eq('tournament_id', TOURNAMENT_ID)
    .order('score', { ascending: false })
    .limit(COMPETITIVE_SHARES.length);
  if (scErr) throw scErr;

  const compDeviceIds = (scores ?? []).map(s => s.device_id);
  let walletByDevice = {};
  if (compDeviceIds.length) {
    const { data: cp } = await supabase
      .from('players').select('device_id, wallet_address').in('device_id', compDeviceIds);
    walletByDevice = Object.fromEntries((cp ?? []).map(p => [p.device_id, p.wallet_address]));
  }

  (scores ?? []).forEach((s, i) => {
    const rank   = i + 1;
    const wallet = walletByDevice[s.device_id];
    const sol    = COMPETITIVE_POOL * COMPETITIVE_SHARES[i];
    compPlan.push({ category: 'competitive', rank, ...s, wallet, sol });
  });

  // 2. Early-bird: first N players with a wallet (by created_at if available)
  let players, ebErr;
  ({ data: players, error: ebErr } = await supabase
    .from('players')
    .select('device_id, username, wallet_address, created_at')
    .not('wallet_address', 'is', null)
    .order('created_at', { ascending: true })
    .limit(EARLYBIRD_COUNT));
  if (ebErr) {
    // created_at may not exist — fall back to default order
    ({ data: players } = await supabase
      .from('players')
      .select('device_id, username, wallet_address')
      .not('wallet_address', 'is', null)
      .limit(EARLYBIRD_COUNT));
  }
  const ebShare = (players?.length ? EARLYBIRD_POOL / players.length : 0);
  (players ?? []).forEach((p, i) => {
    earlyPlan.push({
      category: 'early-bird', rank: 900 + i, score: 0,
      device_id: p.device_id, username: p.username,
      wallet: p.wallet_address, sol: ebShare,
    });
  });

  return { compPlan, earlyPlan };
}

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  🎁 Early Rewards Distribution (HYBRID)');
  console.log(`  Season:  ${SEASON_ID}`);
  console.log(`  Network: ${NETWORK}`);
  console.log(`  Mode:    ${LIVE ? '🚀 LIVE — sends REAL SOL' : '🧪 DRY RUN (no tx)'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY env var is required.');
    process.exit(1);
  }

  const wallet     = loadDistributionKeypair();
  const connection = new Connection(RPC_URL, 'confirmed');
  const supabase   = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, { auth: { persistSession: false } });

  const balance = await connection.getBalance(wallet.publicKey);
  console.log(`💰 Distribution wallet: ${wallet.publicKey.toBase58()}`);
  console.log(`   Balance: ${fmtSol(balance)}\n`);

  const { compPlan, earlyPlan } = await buildPlan(supabase);
  const all = [...compPlan, ...earlyPlan];

  // Idempotency: skip device+season already sent
  const { data: already } = await supabase
    .from('prize_distributions')
    .select('device_id').eq('season_id', SEASON_ID).eq('status', 'sent');
  const paidSet = new Set((already ?? []).map(r => r.device_id));

  console.log('Cat         | Rank | Player                | Prize        | Wallet / status');
  console.log('------------+------+-----------------------+--------------+------------------');

  let totalLamports = 0;
  const payable = [];
  for (const item of all) {
    const lamports = Math.floor(item.sol * LAMPORTS_PER_SOL);
    let note = '';
    if (paidSet.has(item.device_id)) note = '⏭ already paid';
    else if (!item.wallet) note = '⚠️ no wallet — skip';
    else { try { new PublicKey(item.wallet); payable.push({ ...item, lamports }); totalLamports += lamports; note = item.wallet.slice(0,6)+'…'+item.wallet.slice(-4); } catch { note = '⚠️ bad wallet — skip'; } }
    console.log(`${item.category.padEnd(11)} | ${String(item.rank).padStart(4)} | ${(item.username||'').slice(0,21).padEnd(21)} | ${fmtSol(lamports).padStart(12)} | ${note}`);
  }

  const estFees = payable.length * 5000;
  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Recipients to pay: ${payable.length}`);
  console.log(`Total to send:     ${fmtSol(totalLamports)}  (+ ~${fmtSol(estFees)} fees)`);
  console.log(`Wallet needs:      ${fmtSol(totalLamports + estFees)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!LIVE) {
    console.log('🧪 Dry run complete. No SOL sent. Re-run with --live to distribute.\n');
    return;
  }
  if (balance < totalLamports + estFees) {
    console.error(`❌ Wallet balance too low. Need ${fmtSol(totalLamports + estFees)}, have ${fmtSol(balance)}.`);
    process.exit(1);
  }

  console.log('⚠️  LIVE distribution in 5s. Ctrl+C to abort.');
  await sleep(5000);

  let ok = 0, fail = 0;
  for (const item of payable) {
    try {
      const { data: pending, error: insErr } = await supabase
        .from('prize_distributions')
        .insert({
          season_id: SEASON_ID, device_id: item.device_id, wallet_address: item.wallet,
          username: item.username, rank: item.rank, score: item.score || 0,
          prize_sol: item.sol, prize_lamports: item.lamports, status: 'pending',
        }).select('id').single();
      if (insErr) throw insErr;

      const tx = new Transaction().add(SystemProgram.transfer({
        fromPubkey: wallet.publicKey, toPubkey: new PublicKey(item.wallet), lamports: item.lamports,
      }));
      const sig = await sendAndConfirmTransaction(connection, tx, [wallet], { commitment: 'confirmed' });

      await supabase.from('prize_distributions').update({ status: 'sent', tx_signature: sig }).eq('id', pending.id);
      console.log(`✅ ${item.category} #${item.rank} ${item.username}: ${fmtSol(item.lamports)} → ${sig.slice(0,16)}…`);
      ok++;
    } catch (e) {
      console.error(`❌ ${item.category} #${item.rank} ${item.username} FAILED: ${e.message}`);
      fail++;
    }
    await sleep(300);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Sent: ${ok}   ❌ Failed: ${fail}`);
  console.log(`Final wallet balance: ${fmtSol(await connection.getBalance(wallet.publicKey))}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(e => { console.error('\n❌ Fatal:', e.message); process.exit(1); });
