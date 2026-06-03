#!/usr/bin/env node
/**
 * SKORA Claim Processor
 *
 * Polls Supabase for pending skora_claims, mints SKORA tokens to player wallets,
 * updates status to 'minted' (with tx signature) or 'failed' (with error message).
 *
 * Usage:
 *   $env:SUPABASE_SERVICE_KEY = "<key>"
 *   node scripts/process-skora-claims.js                 # one-shot pass
 *   node scripts/process-skora-claims.js --watch         # loop forever, every 15s
 *   node scripts/process-skora-claims.js --dry-run       # simulate
 *
 * Prerequisites:
 *   - supabase-skora-claims.sql applied
 *   - skora-config-mainnet.json present (mint authority keypair + mint + network)
 *   - SKORA token already minted (mint address in config)
 *
 * Network/RPC/mint are read FROM the config file (created by
 * create-skora-mainnet.js), not hardcoded — so this processor follows whatever
 * network the token actually lives on. Override the config path with
 * SKORA_CONFIG env if needed (e.g. a devnet config for testing).
 */

const {
  Connection, Keypair, PublicKey, sendAndConfirmTransaction, Transaction,
} = require('@solana/web3.js');
const {
  getOrCreateAssociatedTokenAccount, createMintToInstruction,
  TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const { createClient } = require('@supabase/supabase-js');
const fs   = require('fs');
const path = require('path');

const DECIMALS = 6;
const RPC_FALLBACK = {
  'mainnet-beta': 'https://api.mainnet-beta.solana.com',
  'devnet':       'https://api.devnet.solana.com',
};

const SUPABASE_URL = 'https://qxejdpvjggqjqoydujjd.supabase.co';
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;

const args     = process.argv.slice(2);
const WATCH    = args.includes('--watch');
const DRY_RUN  = args.includes('--dry-run');
const INTERVAL = 15_000;

// Resolve which config file to load. Default = mainnet config produced by
// create-skora-mainnet.js. Allow override for testing on devnet.
function configPath() {
  if (process.env.SKORA_CONFIG) return path.resolve(process.env.SKORA_CONFIG);
  const mainnet = path.join(__dirname, '..', 'skora-config-mainnet.json');
  if (fs.existsSync(mainnet)) return mainnet;
  return path.join(__dirname, '..', 'skora-config.json'); // legacy fallback
}

function loadConfig() {
  const p = configPath();
  if (!fs.existsSync(p)) throw new Error(`config not found: ${p}`);
  const cfg = JSON.parse(fs.readFileSync(p, 'utf8'));
  if (!cfg.mintAuthoritySecret) throw new Error('mintAuthoritySecret missing in config');
  if (!cfg.mint) throw new Error('mint address missing in config — run create-skora-mainnet.js first');
  const keypair = Keypair.fromSecretKey(Buffer.from(cfg.mintAuthoritySecret, 'hex'));
  const network = cfg.network || 'mainnet-beta';
  const rpcUrl  = cfg.rpc || RPC_FALLBACK[network] || RPC_FALLBACK['mainnet-beta'];
  return { keypair, mint: new PublicKey(cfg.mint), network, rpcUrl, configFile: p };
}

async function processOne(supabase, connection, mintAuthority, mintAddress, claim) {
  console.log(`\n→ Processing #${claim.id.slice(0, 8)} | ${claim.orb_spent.toLocaleString()} ORB → ${claim.skora_amount} SKORA | ${claim.wallet_address.slice(0, 6)}…${claim.wallet_address.slice(-4)}`);

  if (DRY_RUN) {
    console.log('   🧪 DRY RUN — skipping mint');
    return;
  }

  let recipient;
  try {
    recipient = new PublicKey(claim.wallet_address);
  } catch {
    await supabase.from('skora_claims').update({
      status:        'rejected',
      error_message: 'invalid wallet address',
      processed_at:  new Date().toISOString(),
    }).eq('id', claim.id);
    console.log('   ❌ rejected: invalid wallet');
    return;
  }

  try {
    // Get or create the recipient's SKORA Associated Token Account
    const recipientAta = await getOrCreateAssociatedTokenAccount(
      connection,
      mintAuthority,        // payer for ATA creation
      mintAddress,
      recipient,
    );

    // Mint SKORA (amount × 10^decimals)
    const amountRaw = BigInt(Math.round(claim.skora_amount * 10 ** DECIMALS));
    const tx = new Transaction().add(
      createMintToInstruction(
        mintAddress,
        recipientAta.address,
        mintAuthority.publicKey,
        amountRaw,
      ),
    );
    const sig = await sendAndConfirmTransaction(connection, tx, [mintAuthority], {
      commitment: 'confirmed',
    });

    await supabase.from('skora_claims').update({
      status:       'minted',
      tx_signature: sig,
      processed_at: new Date().toISOString(),
    }).eq('id', claim.id);

    console.log(`   ✅ minted, tx: ${sig.slice(0, 16)}…`);
  } catch (e) {
    const msg = (e && e.message) ? e.message.slice(0, 500) : 'unknown error';
    await supabase.from('skora_claims').update({
      status:        'failed',
      error_message: msg,
      processed_at:  new Date().toISOString(),
    }).eq('id', claim.id);
    console.log(`   ❌ failed: ${msg}`);
  }
}

async function pass(supabase, connection, mintAuthority, mintAddress) {
  const { data: claims, error } = await supabase
    .from('skora_claims')
    .select('*')
    .eq('status', 'pending')
    .order('created_at', { ascending: true })
    .limit(20);

  if (error) {
    console.error('❌ fetch error:', error.message);
    return 0;
  }
  if (!claims?.length) return 0;

  console.log(`\n📋 ${claims.length} pending claim(s)...`);
  for (const c of claims) {
    await processOne(supabase, connection, mintAuthority, mintAddress, c);
  }
  return claims.length;
}

async function main() {
  if (!SUPABASE_SERVICE_KEY) {
    console.error('❌ SUPABASE_SERVICE_KEY env var is required.');
    process.exit(1);
  }

  const { keypair, mint, network, rpcUrl, configFile } = loadConfig();

  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('  💎 SKORA Claim Processor');
  console.log(`  Network: ${network}`);
  console.log(`  Config:  ${path.basename(configFile)}`);
  console.log(`  Mode:    ${DRY_RUN ? 'DRY RUN' : WATCH ? 'WATCH (loop)' : 'ONE-SHOT'}`);
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');

  if (network === 'mainnet-beta' && !DRY_RUN) {
    console.log('  ⚠️  MAINNET — this mints REAL SKORA tokens.');
  }

  const connection = new Connection(rpcUrl, 'confirmed');
  const supabase   = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false },
  });

  console.log('Mint authority:', keypair.publicKey.toBase58());
  console.log('SKORA mint:    ', mint.toBase58());
  console.log('Treasury balance:', (await connection.getBalance(keypair.publicKey)) / 1e9, 'SOL');

  if (!WATCH) {
    await pass(supabase, connection, keypair, mint);
    console.log('\n✅ Done.');
    return;
  }

  // Watch loop
  console.log(`\n👀 Watching for pending claims every ${INTERVAL / 1000}s. Ctrl+C to stop.`);
  let lastBeat = Date.now();
  while (true) {
    try {
      const count = await pass(supabase, connection, keypair, mint);
      if (count === 0) {
        const since = Math.floor((Date.now() - lastBeat) / 60_000);
        if (since >= 5) {
          console.log(`💤 ${new Date().toLocaleTimeString()} — no pending claims (last ${since} min)`);
          lastBeat = Date.now();
        }
      } else {
        lastBeat = Date.now();
      }
    } catch (e) {
      console.error('❌ pass error:', e.message);
    }
    await new Promise(r => setTimeout(r, INTERVAL));
  }
}

main().catch(e => {
  console.error('\n❌ Fatal:', e.message);
  process.exit(1);
});
