/**
 * SKORA SPL Token Creator — MAINNET
 *
 * Run: node scripts/create-skora-mainnet.js
 *
 * Step 1: Run once — generates mint authority keypair, shows address to fund.
 * Step 2: Send ~0.05 SOL mainnet to that address.
 * Step 3: Run again — creates SKORA token on mainnet.
 *
 * Output: skora-config-mainnet.json (KEEP SECRET — contains mint authority key)
 */

const { Connection, Keypair } = require('@solana/web3.js');
const {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

const NETWORK    = 'mainnet-beta';
const RPC        = 'https://api.mainnet-beta.solana.com';
const DECIMALS   = 6;
const TOTAL_SUPPLY = 1_000_000_000; // 1 billion SKORA
const MIN_BALANCE_LAMPORTS = 30_000_000; // 0.03 SOL minimum for create + mint

async function main() {
  console.log('\n🚀 SKORA Token Creator — MAINNET');
  console.log('==================================');
  console.log(`Network: ${NETWORK}\n`);

  const connection = new Connection(RPC, { commitment: 'confirmed', confirmTransactionInitialTimeout: 90000 });
  console.log(`Connected to ${RPC}\n`);

  const configPath = path.join(__dirname, '..', 'skora-config-mainnet.json');
  let mintAuthority;

  if (fs.existsSync(configPath)) {
    const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (existing.mint) {
      console.log('⚠️  skora-config-mainnet.json already has a mint!');
      console.log('   Mint address:', existing.mint);
      console.log('   Delete skora-config-mainnet.json to create a new token.\n');
      process.exit(0);
    }
    // Keypair saved from previous run — reuse it
    const secretKey = Buffer.from(existing.mintAuthoritySecret, 'hex');
    mintAuthority = Keypair.fromSecretKey(secretKey);
    console.log('♻️  Reusing keypair from previous step.');
    console.log('   Address:', mintAuthority.publicKey.toBase58());
  } else {
    mintAuthority = Keypair.generate();
    console.log('🔑 Generated NEW mint authority keypair.');
    console.log('   Address:', mintAuthority.publicKey.toBase58());
    fs.writeFileSync(configPath, JSON.stringify({
      mintAuthoritySecret: Buffer.from(mintAuthority.secretKey).toString('hex'),
      address: mintAuthority.publicKey.toBase58(),
    }, null, 2));
    console.log('\n💾 Keypair saved to skora-config-mainnet.json');
  }

  // ── Check balance ──────────────────────────────────────────────
  const balance = await connection.getBalance(mintAuthority.publicKey);
  console.log(`\n💰 Current balance: ${balance / 1e9} SOL`);

  if (balance < MIN_BALANCE_LAMPORTS) {
    console.log('\n══════════════════════════════════════════════════');
    console.log('⏸  STEP 1 COMPLETE — Now fund this address.');
    console.log('══════════════════════════════════════════════════');
    console.log('');
    console.log('  📬 Send ~0.05 SOL MAINNET to:');
    console.log('  👉 ' + mintAuthority.publicKey.toBase58());
    console.log('');
    console.log('  After SOL arrives, run this script again:');
    console.log('  > node scripts/create-skora-mainnet.js');
    console.log('');
    console.log('══════════════════════════════════════════════════');
    process.exit(0);
  }

  // ── Create SPL Token Mint ───────────────────────────────────────
  console.log('\n🏗️  Creating SKORA SPL Token on mainnet...');
  const mint = await createMint(
    connection,
    mintAuthority,                // payer
    mintAuthority.publicKey,      // mint authority
    mintAuthority.publicKey,      // freeze authority
    DECIMALS
  );
  console.log('✅ Mint created:', mint.toBase58());

  // ── Create treasury token account ──────────────────────────────
  console.log('🏦 Creating treasury token account...');
  const treasuryATA = await createAssociatedTokenAccount(
    connection,
    mintAuthority,               // payer
    mint,                        // mint
    mintAuthority.publicKey      // owner
  );
  console.log('✅ Treasury ATA:', treasuryATA.toBase58());

  // ── Mint initial supply to treasury ────────────────────────────
  console.log(`⚙️  Minting ${TOTAL_SUPPLY.toLocaleString()} SKORA to treasury...`);
  await mintTo(
    connection,
    mintAuthority,                             // payer
    mint,                                      // mint
    treasuryATA,                               // destination
    mintAuthority,                             // mint authority
    BigInt(TOTAL_SUPPLY) * BigInt(10 ** DECIMALS)
  );
  console.log('✅ Initial supply minted!\n');

  // ── Save config ─────────────────────────────────────────────────
  const config = {
    mint:                mint.toBase58(),
    treasuryATA:         treasuryATA.toBase58(),
    mintAuthority:       mintAuthority.publicKey.toBase58(),
    mintAuthoritySecret: Buffer.from(mintAuthority.secretKey).toString('hex'),
    network:             NETWORK,
    decimals:            DECIMALS,
    totalSupply:         TOTAL_SUPPLY,
    created:             new Date().toISOString(),
  };

  fs.writeFileSync(configPath, JSON.stringify(config, null, 2));

  // ── Print results ───────────────────────────────────────────────
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('🎉 SKORA TOKEN CREATED ON MAINNET!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Mint address  :', mint.toBase58());
  console.log('Treasury ATA  :', treasuryATA.toBase58());
  console.log('Network       :', NETWORK);
  console.log('Decimals      :', DECIMALS);
  console.log('Total supply  :', TOTAL_SUPPLY.toLocaleString(), 'SKORA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 Explorer:');
  console.log(`   https://explorer.solana.com/address/${mint.toBase58()}`);
  console.log('\n📝 Update lib/skora.ts:');
  console.log(`   SKORA_MINT    = '${mint.toBase58()}'`);
  console.log(`   SKORA_NETWORK = 'mainnet-beta'`);
  console.log(`   SKORA_RPC     = '${RPC}'`);
  console.log('\n⚠️  KEEP skora-config-mainnet.json SECRET!');
  console.log('   It contains the mint authority private key.\n');
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
