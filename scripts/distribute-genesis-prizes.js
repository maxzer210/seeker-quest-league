#!/usr/bin/env node
/**
 * Genesis Pre-Season → Season 1 Prize Distribution
 *
 * Reads top-100 players from Supabase tournament_scores, calculates prize
 * shares per the tier table, and sends SOL from the treasury wallet.
 * Every payout is logged to public.prize_distributions for audit.
 *
 * Usage:
 *   node scripts/distribute-genesis-prizes.js --dry-run   # simulate, no on-chain tx
 *   node scripts/distribute-genesis-prizes.js             # REAL — sends SOL
 *   node scripts/distribute-genesis-prizes.js --season=season-1-day-001
 *
 * Prerequisites:
 *   1. supabase-prize-distribution.sql applied (creates prize_distributions, players.wallet_address)
 *   2. skora-config.json present (holds the treasury keypair)
 *   3. SUPABASE_SERVICE_KEY env var set (bypasses RLS for insert)
 *   4. Treasury must have enough SOL for: (sum of prizes) + (fees per recipient)
 */

const {
  Connection, Keypair, PublicKey, LAMPORTS_PER_SOL,
  SystemProgram, Transaction, sendAndConfirmTransaction,
} = require('@solana/web3.js');
const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

// ── Config (kept in sync with lib/genesis.ts) ──────────────────────────────
const NETWORK         = 'devnet';
const RPC_URL         = 'https://api.devnet.solana.com';
const POOL_TO_PRIZES  = 0.60;   // 60% of treasury goes to top-100 prizes
const TIER_PERCENTAGES = [
  { from: 1,  to: 1,   share: 0.30   },
  { from: 2,  to: 2,   share: 0.18   },
  { from: 3,  to: 3,   share: 0.12   },
  { from: 4,  to: 10,  share: 0.035  },
  { from: 11, to: 30,  share: 0.005  },
  { from: 31, to: 100, share: 0.00071 },
];

const SUPABASE_URL = 'https://qxejdpvjggqjqoydujjd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY; // REQUIRED for inserting into prize_distributions

const TOURNAMENT_ID = 'season-zero';

// ── CLI args ──────────────────────────────────────────────────────────────
const args    = process.argv.slice(2);
const DRY_RUN = args.includes('--dry-run');
const SEASON_ARG = args.find(a => a.startsWith('--season='));
const SEASON_ID  = SEASON_ARG ? SEASON_ARG.split('=')[1] : 'genesis';

// ── Helpers ───────────────────────────────────────────────────────────────
function calculatePrize(rank, prizePoolSol) {
  for (const t of TIER_PERCENTAGES) {
    if (rank >= t.from && rank <= t.to) return prizePoolSol * t.share;
  }
  return 0;
}

function loadTreasuryKeypair() {
  const configPath = path.join(__dirname, '..', 'skora-config.json');
  if (!fs.existsSync(configPath)) {
    throw new Error('skora-config.json not found — cannot load treasury keypair');
  }
  const cfg = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  if (!cfg.mintAuthoritySecret) {
    throw new Error('skora-config.json missing mintAuthoritySecret');
  }
  return Keypair.fromSecretKey(Buffer.from(cfg.mintAuthoritySecret, 'hex'));
}

function fmtSol(lamports) {
  return (lamports / LAMPORTS_PER_SOL).toFixed(4) + ' SOL';
}

async function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

// ── Main ──────────────────────────────────────────────────────────────────
async function main() {
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`  🏆 Genesis Prize Distribution`);
  console.log(`  Season: ${SEASON_ID}`);
  console.log(`  Network: ${NETWORK}`);
  console.log(`  Mode: ${DRY_RUN ? '🧪 DRY RUN (no on-chain tx)' : '🚀 LIVE (will send SOL!)'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY env var is required.');
    console.error('   Get it from: Supabase Dashboard → Settings → API → service_role key');
    console.error('   Then run:    $env:SUPABASE_SERVICE_KEY="<key>"; node scripts/distribute-genesis-prizes.js');
    process.exit(1);
  }

  const treasury   = loadTreasuryKeypair();
  const connection = new Connection(RPC_URL, 'confirmed');
  const supabase   = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  // 1. Treasury balance
  const treasuryBalance = await connection.getBalance(treasury.publicKey);
  console.log(`💰 Treasury wallet: ${treasury.publicKey.toBase58()}`);
  console.log(`   Balance: ${fmtSol(treasuryBalance)}`);

  const prizePoolSol = (treasuryBalance / LAMPORTS_PER_SOL) * POOL_TO_PRIZES;
  console.log(`   Prize pool (60% of treasury): ${prizePoolSol.toFixed(4)} SOL\n`);

  if (prizePoolSol < 0.001) {
    console.error('❌ Prize pool < 0.001 SOL — nothing meaningful to distribute. Abort.');
    process.exit(1);
  }

  // 2. Fetch top-100 players (with wallet_address)
  console.log('📊 Fetching top-100 players from Supabase...');
  const { data: scores, error: scoresErr } = await supabase
    .from('tournament_scores')
    .select('device_id, username, score, updated_at')
    .eq('tournament_id', TOURNAMENT_ID)
    .order('score', { ascending: false })
    .limit(100);
  if (scoresErr) throw scoresErr;
  if (!scores?.length) {
    console.error('❌ No players found in tournament_scores. Abort.');
    process.exit(1);
  }

  // 3. Enrich with wallet_address from players table
  const deviceIds = scores.map(s => s.device_id);
  const { data: players } = await supabase
    .from('players')
    .select('device_id, wallet_address')
    .in('device_id', deviceIds);
  const walletByDevice = Object.fromEntries(
    (players ?? []).map(p => [p.device_id, p.wallet_address])
  );

  // 4. Build distribution plan
  console.log('📋 Building distribution plan:\n');
  console.log('Rank | Player                     | Score    | Prize        | Wallet');
  console.log('-----+----------------------------+----------+--------------+----------------------');

  const plan = [];
  let totalPrizeLamports = 0;
  let skippedNoWallet = 0;

  for (let i = 0; i < scores.length; i++) {
    const rank   = i + 1;
    const player = scores[i];
    const wallet = walletByDevice[player.device_id];
    const prizeSol = calculatePrize(rank, prizePoolSol);
    const prizeLamports = Math.floor(prizeSol * LAMPORTS_PER_SOL);

    if (!wallet) {
      console.log(`#${String(rank).padStart(3)} | ${player.username.padEnd(26)} | ${String(player.score).padStart(8)} | ${fmtSol(prizeLamports).padStart(12)} | ⚠️ no wallet — SKIPPED`);
      skippedNoWallet++;
      continue;
    }

    let pubkey;
    try { pubkey = new PublicKey(wallet); }
    catch {
      console.log(`#${String(rank).padStart(3)} | ${player.username.padEnd(26)} | ${String(player.score).padStart(8)} | ${fmtSol(prizeLamports).padStart(12)} | ⚠️ invalid wallet — SKIPPED`);
      skippedNoWallet++;
      continue;
    }

    plan.push({
      rank, player, wallet, pubkey, prizeSol, prizeLamports,
    });
    totalPrizeLamports += prizeLamports;
    console.log(`#${String(rank).padStart(3)} | ${player.username.padEnd(26)} | ${String(player.score).padStart(8)} | ${fmtSol(prizeLamports).padStart(12)} | ${wallet.slice(0, 6)}...${wallet.slice(-4)}`);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Total recipients: ${plan.length}  (skipped no wallet: ${skippedNoWallet})`);
  console.log(`Total to distribute: ${fmtSol(totalPrizeLamports)}`);
  const estFees = plan.length * 5000; // 5000 lamports per tx (rough)
  console.log(`Est. tx fees: ${fmtSol(estFees)} (${plan.length} txs × 0.000005 SOL)`);
  console.log(`Treasury needs at least: ${fmtSol(totalPrizeLamports + estFees)}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

  if (treasuryBalance < totalPrizeLamports + estFees) {
    console.error(`❌ Treasury balance too low. Need ${fmtSol(totalPrizeLamports + estFees)}, have ${fmtSol(treasuryBalance)}.`);
    process.exit(1);
  }

  if (DRY_RUN) {
    console.log('🧪 Dry run complete. No transactions sent. No DB rows inserted.\n');
    return;
  }

  console.log('⚠️  PROCEEDING WITH LIVE SOL DISTRIBUTION IN 5 SECONDS. Ctrl+C to abort.');
  await sleep(5_000);
  console.log('🚀 Sending...\n');

  // 5. Execute distributions (one tx per recipient — simpler, recoverable)
  let successCount = 0;
  let failCount    = 0;

  for (const item of plan) {
    const { rank, player, wallet, pubkey, prizeSol, prizeLamports } = item;

    try {
      // Insert pending row first (so we don't double-pay on retry)
      const { data: pending, error: insErr } = await supabase
        .from('prize_distributions')
        .insert({
          season_id:      SEASON_ID,
          device_id:      player.device_id,
          wallet_address: wallet,
          username:       player.username,
          rank,
          score:          player.score,
          prize_sol:      prizeSol,
          prize_lamports: prizeLamports,
          status:         'pending',
        })
        .select('id')
        .single();
      if (insErr) throw insErr;

      // Send SOL
      const tx = new Transaction().add(
        SystemProgram.transfer({
          fromPubkey: treasury.publicKey,
          toPubkey:   pubkey,
          lamports:   prizeLamports,
        }),
      );
      const sig = await sendAndConfirmTransaction(connection, tx, [treasury], {
        commitment: 'confirmed',
      });

      // Mark as sent
      await supabase
        .from('prize_distributions')
        .update({ status: 'sent', tx_signature: sig })
        .eq('id', pending.id);

      console.log(`✅ #${rank} ${player.username}: ${fmtSol(prizeLamports)} → ${sig.slice(0, 16)}...`);
      successCount++;
    } catch (e) {
      console.error(`❌ #${rank} ${player.username} FAILED: ${e.message}`);
      try {
        await supabase
          .from('prize_distributions')
          .update({ status: 'failed' })
          .eq('device_id', player.device_id)
          .eq('season_id', SEASON_ID)
          .is('tx_signature', null);
      } catch (_) {}
      failCount++;
    }

    // Slight delay to avoid RPC rate-limit
    await sleep(300);
  }

  console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`✅ Sent successfully: ${successCount}`);
  console.log(`❌ Failed:            ${failCount}`);
  console.log(`Final treasury balance: ${fmtSol(await connection.getBalance(treasury.publicKey))}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
}

main().catch(e => {
  console.error('\n❌ Fatal error:', e.message);
  process.exit(1);
});
