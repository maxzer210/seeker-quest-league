/**
 * SKORA SPL Token Creator
 * Run ONCE on devnet: node scripts/create-skora-token.js
 *
 * Prerequisites:
 *   npm install @solana/web3.js @solana/spl-token
 *
 * Output: skora-config.json (KEEP SECRET – contains mint authority key)
 */

const { Connection, Keypair, clusterApiUrl } = require('@solana/web3.js');
const {
  createMint,
  createAssociatedTokenAccount,
  mintTo,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} = require('@solana/spl-token');
const fs = require('fs');
const path = require('path');

const NETWORK    = 'devnet';
// Multiple RPC endpoints to try (public devnet can be flaky)
const RPC_ENDPOINTS = [
  'https://api.devnet.solana.com',
  'https://rpc.ankr.com/solana_devnet',
  'https://devnet.helius-rpc.com/?api-key=demo',
];
const CONNECTION_CONFIG = { commitment: 'confirmed', confirmTransactionInitialTimeout: 60000 };
const DECIMALS   = 6;
const TOTAL_SUPPLY = 1_000_000_000; // 1 billion SKORA (for future distribution)

async function main() {
  console.log('\n🚀 SKORA Token Creator');
  console.log('======================');
  console.log(`Network: ${NETWORK}\n`);

  // Try each RPC until one works
  let connection;
  let workingRpc = '';
  for (const rpc of RPC_ENDPOINTS) {
    try {
      process.stdout.write(`Connecting to ${rpc} ... `);
      const c = new Connection(rpc, CONNECTION_CONFIG);
      await c.getSlot(); // quick connectivity test
      connection = c;
      workingRpc = rpc;
      console.log('✅');
      break;
    } catch {
      console.log('❌ (timeout)');
    }
  }
  if (!connection) {
    console.error('\n❌ Нет подключения ни к одному RPC. Проверь интернет / VPN и попробуй снова.');
    process.exit(1);
  }
  console.log(`\nИспользуем RPC: ${workingRpc}\n`);

  // ── Load or generate mint authority keypair ─────────────────────
  const configPath = path.join(__dirname, '..', 'skora-config.json');
  let mintAuthority;

  if (fs.existsSync(configPath)) {
    const existing = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    if (existing.mint) {
      console.log('⚠️  skora-config.json already exists!');
      console.log('   Mint address:', existing.mint);
      console.log('   Delete skora-config.json to create a new token.\n');
      process.exit(0);
    }
    // Keypair saved from previous run — reuse it
    const secretKey = Buffer.from(existing.mintAuthoritySecret, 'hex');
    mintAuthority = Keypair.fromSecretKey(secretKey);
    console.log('♻️  Reusing keypair:', mintAuthority.publicKey.toBase58());
  } else {
    mintAuthority = Keypair.generate();
    console.log('🔑 Generated mint authority:', mintAuthority.publicKey.toBase58());
    // Save keypair immediately so we can reuse on retry
    fs.writeFileSync(configPath, JSON.stringify({
      mintAuthoritySecret: Buffer.from(mintAuthority.secretKey).toString('hex'),
    }, null, 2));
  }

  // ── Airdrop SOL for transaction fees (with retry logic) ────────
  console.log('⏳ Requesting devnet SOL (пробуем несколько раз)...');
  let totalAirdropped = 0;
  const AMOUNTS = [1e9, 1e9, 5e8]; // 1 SOL, 1 SOL, 0.5 SOL
  for (const amount of AMOUNTS) {
    try {
      process.stdout.write(`   Запрос ${amount / 1e9} SOL... `);
      const sig = await connection.requestAirdrop(mintAuthority.publicKey, amount);
      await connection.confirmTransaction(sig, 'confirmed');
      totalAirdropped += amount;
      console.log('✅');
      if (totalAirdropped >= 1e9) break; // enough for token creation
      await new Promise(r => setTimeout(r, 2000)); // small delay
    } catch {
      console.log('❌ (rate limited, пробуем меньше)');
      await new Promise(r => setTimeout(r, 3000));
    }
  }
  const balance = await connection.getBalance(mintAuthority.publicKey);
  console.log(`   Баланс: ${balance / 1e9} SOL\n`);
  if (balance < 5_000_000) {
    console.log('');
    console.log('══════════════════════════════════════════════════');
    console.log('❌ Недостаточно SOL для создания токена.');
    console.log('   Адрес для пополнения:');
    console.log('   ' + mintAuthority.publicKey.toBase58());
    console.log('');
    console.log('   Попробуй вручную:');
    console.log('   👉 https://faucet.quicknode.com/solana/devnet');
    console.log('   👉 https://faucet.solana.com (через 8ч)');
    console.log('');
    console.log('   После пополнения запусти скрипт снова —');
    console.log('   keypair сохранён, адрес не изменится.');
    console.log('══════════════════════════════════════════════════');
    process.exit(1);
  }

  // ── Create SPL Token Mint ───────────────────────────────────────
  console.log('🏗️  Creating SKORA SPL Token...');
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
  console.log('🎉 SKORA TOKEN CREATED SUCCESSFULLY!');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('Mint address  :', mint.toBase58());
  console.log('Treasury ATA  :', treasuryATA.toBase58());
  console.log('Network       :', NETWORK);
  console.log('Decimals      :', DECIMALS);
  console.log('Total supply  :', TOTAL_SUPPLY.toLocaleString(), 'SKORA');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log('\n📋 Explorer:');
  console.log(`   https://explorer.solana.com/address/${mint.toBase58()}?cluster=devnet`);
  console.log('\n⚠️  skora-config.json saved — ADD IT TO .gitignore!');
  console.log('   Add this to lib/skora.ts:');
  console.log(`   export const SKORA_MINT = '${mint.toBase58()}';\n`);
}

main().catch(err => {
  console.error('\n❌ Error:', err.message);
  process.exit(1);
});
