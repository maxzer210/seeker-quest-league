import { Platform } from 'react-native';
import {
  Connection,
  LAMPORTS_PER_SOL,
  PublicKey,
  SystemProgram,
  Transaction,
} from '@solana/web3.js';
import { transact } from '@solana-mobile/mobile-wallet-adapter-protocol-web3js';
import { supabase } from './supabase';

// ── MAINNET LAUNCH (2026-05-30) ───────────────────────────────────────────
export const SOLANA_NETWORK = 'mainnet-beta';
export const SOLANA_CHAIN = 'solana:mainnet';
export const SOLANA_RPC = 'https://api.mainnet-beta.solana.com';
// Note: public RPC is rate-limited. Upgrade to Helius/QuickNode when DAU grows.
export const WHEEL_SPIN_SOL = 0.01;
export const WHEEL_SPIN_LAMPORTS = Math.round(WHEEL_SPIN_SOL * LAMPORTS_PER_SOL);

export const ENERGY_REFILL_SOL = 0.01;
export const ENERGY_REFILL_LAMPORTS = Math.round(ENERGY_REFILL_SOL * LAMPORTS_PER_SOL);

export const PREMIUM_UPGRADE_SOL = 0.01;
export const PREMIUM_UPGRADE_LAMPORTS = Math.round(PREMIUM_UPGRADE_SOL * LAMPORTS_PER_SOL);

export const PVP_ENTRY_SOL = 0.01;
export const PVP_ENTRY_LAMPORTS = Math.round(PVP_ENTRY_SOL * LAMPORTS_PER_SOL);

// ── PREMIUM SHOP (SOL-priced items, tiered by impact) ──────────────────────
// Tier 1 — Defensive utility (cheapest)
export const PREMIUM_SHIELD_PACK_SOL = 0.01;
export const PREMIUM_SHIELD_PACK_LAMPORTS = Math.round(PREMIUM_SHIELD_PACK_SOL * LAMPORTS_PER_SOL);

// Tier 2 — Temporary boost
export const PREMIUM_BOOST_PACK_SOL = 0.02;
export const PREMIUM_BOOST_PACK_LAMPORTS = Math.round(PREMIUM_BOOST_PACK_SOL * LAMPORTS_PER_SOL);

// Tier 3 — Permanent progression
export const PREMIUM_INSTANT_LEVEL_SOL = 0.03;
export const PREMIUM_INSTANT_LEVEL_LAMPORTS = Math.round(PREMIUM_INSTANT_LEVEL_SOL * LAMPORTS_PER_SOL);

// Tier 4 — Big instant ORB drop (top)
export const PREMIUM_SKIN_SOL = 0.05;
export const PREMIUM_SKIN_LAMPORTS = Math.round(PREMIUM_SKIN_SOL * LAMPORTS_PER_SOL);

// ── FOUNDER PASS TIERS (revenue stream, NOT prize pool dilution) ────────────
// 80% → project treasury (owner revenue)
// 15% → prize pool community
// 5%  → SKORA burn pool
export const FOUNDER_SILVER_SOL  = 0.5;
export const FOUNDER_SILVER_LAMPORTS  = Math.round(FOUNDER_SILVER_SOL  * LAMPORTS_PER_SOL);
export const FOUNDER_GOLD_SOL    = 1.0;
export const FOUNDER_GOLD_LAMPORTS    = Math.round(FOUNDER_GOLD_SOL    * LAMPORTS_PER_SOL);
export const FOUNDER_DIAMOND_SOL = 2.0;
export const FOUNDER_DIAMOND_LAMPORTS = Math.round(FOUNDER_DIAMOND_SOL * LAMPORTS_PER_SOL);

// Founder tier multipliers (applied on top of base ×2 Founder bonus)
export const FOUNDER_TIER_MULTIPLIERS = {
  free:    2,   // 1 paid spin → ×2 (base Founder)
  silver:  3,   // 0.5 SOL    → ×3
  gold:    4,   // 1.0 SOL    → ×4
  diamond: 5,   // 2.0 SOL    → ×5
} as const;

// Daily free spins per tier
export const FOUNDER_TIER_FREE_SPINS = {
  free:    0,
  silver:  3,
  gold:    5,
  diamond: 10,
} as const;

// ── P2P ORB TRADE (off-chain via Supabase, 5% fee: 3% burn + 2% treasury) ──
export const ORB_TRADE_FEE_PCT       = 0.05;
export const ORB_TRADE_BURN_PCT      = 0.03;   // 3% burned forever
export const ORB_TRADE_TREASURY_PCT  = 0.02;   // 2% to treasury
export const ORB_TRADE_MIN           = 1_000;
export const ORB_TRADE_MAX_PER_DAY   = 50_000;
export const ORB_TRADE_COOLDOWN_MS   = 60_000; // 1 min between transfers

// ── BURN MECHANICS ─────────────────────────────────────────────────────────
// Auto buyback: 10% of treasury SOL burned monthly via DEX → SKORA buyback
export const MONTHLY_BUYBACK_BURN_PCT  = 0.10;
// 5% of every premium SOL purchase goes to SKORA burn pool (weekly burn)
export const PREMIUM_SOL_BURN_PCT      = 0.05;

// Treasury receives 0.01 SOL per Wheel paid spin + premium SOL purchases.
// MAINNET treasury wallet — owned by project owner via Phantom.
// Created: 2026-05-30 for Season 1 launch.
export const TREASURY_WALLET: string = 'CxYfXXLGEm1FXcL7cVzTHe1kG3gpo5ecsKgVjXRhLGSp';

const APP_IDENTITY = {
  name: 'Seeker Quest League',
  uri: 'https://seekerquest-league.com',
};

export type SolanaWalletSession = {
  address: string;
  authToken: string;
  walletUriBase?: string;
};

export type WheelPaymentResult = SolanaWalletSession & {
  signature: string;
  lamports: number;
  sol: number;
};

export type WheelPaymentStatus =
  | 'opening_wallet'
  | 'authorizing'
  | 'preparing_transaction'
  | 'requesting_signature'
  | 'saving_payment'
  | 'confirmed';

export class SolanaPaymentError extends Error {
  code?: string;
  details?: string;

  constructor(error: unknown) {
    const e = error as { message?: string; code?: string; name?: string; stack?: string };
    const code = e?.code ?? e?.name;
    const message = e?.message ?? 'Unknown wallet error';
    super(code ? `${code}: ${message}` : message);
    this.name = 'SolanaPaymentError';
    this.code = code;
    this.details = e?.stack;
  }
}

function assertAndroidMwa() {
  if (Platform.OS !== 'android') {
    throw new Error('Mobile Wallet Adapter works only on Android devices.');
  }
}

function base64ToBytes(value: string): Uint8Array {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const clean = value.replace(/=+$/, '');
  const bytes: number[] = [];

  for (let i = 0; i < clean.length; i += 4) {
    const chunk =
      (chars.indexOf(clean[i]) << 18) |
      (chars.indexOf(clean[i + 1]) << 12) |
      ((chars.indexOf(clean[i + 2]) & 63) << 6) |
      (chars.indexOf(clean[i + 3]) & 63);

    bytes.push((chunk >> 16) & 255);
    if (clean[i + 2] !== undefined) bytes.push((chunk >> 8) & 255);
    if (clean[i + 3] !== undefined) bytes.push(chunk & 255);
  }

  return new Uint8Array(bytes);
}

function publicKeyFromMwaAddress(base64Address: string) {
  try {
    return new PublicKey(base64ToBytes(base64Address));
  } catch (_) {
    return new PublicKey(base64Address);
  }
}

function ensureTreasuryWallet() {
  if (TREASURY_WALLET === 'PASTE_TREASURY_WALLET_HERE') {
    throw new Error('Set TREASURY_WALLET in lib/solanaMobile.ts before paid SOL spins.');
  }
  return new PublicKey(TREASURY_WALLET);
}

/**
 * Recovery for the MWA CancellationException money-loss bug.
 *
 * The wallet can broadcast the transfer on-chain (SOL leaves the wallet) yet
 * the MWA session throws (e.g. CancellationException) before returning the
 * signature — so the client thinks the payment failed and the user pays again.
 *
 * Before declaring failure we scan the payer's recent transactions for a
 * transfer of exactly `lamports` into the treasury within `windowSec`. If we
 * find one, the payment really happened — return its signature so the caller
 * can treat it as success instead of charging the user twice.
 *
 * SECURITY: we skip any candidate whose signature is ALREADY recorded in
 * wheel_sol_payments. Matching by amount alone let a user reuse a previous
 * payment's tx (pay once for spin #1, then cancel spin #2 before it broadcasts
 * — recovery would find spin #1's tx and grant spin #2 free). Amounts also
 * collide across purposes (wheel/energy/pvp are all 0.01 SOL). A tx that
 * already backs a recorded payment can never back a new one.
 */
async function isSignatureAlreadyRecorded(signature: string): Promise<boolean> {
  try {
    const { data } = await supabase
      .from('wheel_sol_payments')
      .select('tx_signature')
      .eq('tx_signature', signature)
      .maybeSingle();
    return !!data;
  } catch (_) {
    // On lookup failure, be conservative and treat it as already-recorded so
    // recovery can't accidentally reuse a tx we couldn't verify as fresh.
    return true;
  }
}

async function recoverRecentPayment(
  connection: Connection,
  fromAddress: string,
  treasury: PublicKey,
  lamports: number,
  windowSec = 180,
): Promise<string | null> {
  const fromPk = new PublicKey(fromAddress);
  const treasuryStr = treasury.toBase58();
  // The cancellation can fire the instant the tx is broadcast — it may not be
  // queryable yet. Poll a few times before giving up.
  for (let attempt = 0; attempt < 3; attempt++) {
    if (attempt > 0) await new Promise(r => setTimeout(r, 2500));
    try {
      const sigs = await connection.getSignaturesForAddress(fromPk, { limit: 10 });
      const nowSec = Date.now() / 1000;
      for (const s of sigs) {
        if (s.err) continue;
        if (s.blockTime && nowSec - s.blockTime > windowSec) continue;
        const tx = await connection.getTransaction(s.signature, {
          maxSupportedTransactionVersion: 0,
          commitment: 'confirmed',
        });
        if (!tx || tx.meta?.err) continue;
        const msg: any = tx.transaction.message;
        const keys: any[] = msg.staticAccountKeys ?? msg.accountKeys ?? [];
        const idx = keys.findIndex((k: any) =>
          (typeof k?.toBase58 === 'function' ? k.toBase58() : String(k)) === treasuryStr);
        if (idx < 0) continue;
        const pre  = tx.meta?.preBalances?.[idx];
        const post = tx.meta?.postBalances?.[idx];
        if (pre == null || post == null) continue;
        if (post - pre !== lamports) continue;
        // Fresh tx only — one that already backs a recorded payment is off limits.
        if (await isSignatureAlreadyRecorded(s.signature)) continue;
        return s.signature;
      }
    } catch (_) {}
  }
  return null;
}

export async function connectSolanaWallet(): Promise<SolanaWalletSession> {
  assertAndroidMwa();

  return transact(async wallet => {
    const authorization = await wallet.authorize({
      chain: SOLANA_CHAIN,
      identity: APP_IDENTITY,
    });
    const account = authorization.accounts[0];
    if (!account) throw new Error('Wallet returned no authorized account.');

    return {
      address: publicKeyFromMwaAddress(account.address).toBase58(),
      authToken: authorization.auth_token,
      walletUriBase: authorization.wallet_uri_base,
    };
  });
}

export type SolPurpose = 'wheel_spin' | 'energy_refill' | 'shop_upgrade' | 'pvp_entry'
  | 'instant_level' | 'rare_skin' | 'boost_pack' | 'shield_pack'
  | 'founder_silver' | 'founder_gold' | 'founder_diamond'
  | 'runner_continue';

/**
 * Sign in the wallet, then broadcast + confirm OURSELVES.
 *
 * The old flow used wallet.signAndSendTransactions, which makes the WALLET
 * broadcast the tx and wait for confirmation. On the rate-limited public
 * mainnet RPC that wait routinely outlived the MWA association and threw
 * java.util.concurrent.CancellationException — so paid transactions never
 * landed (zero mainnet payments were ever recorded).
 *
 * Now the wallet ONLY signs (fast, no network); the MWA session ends
 * immediately and the app sends the raw tx on its own connection. The
 * blockhash is fetched BEFORE the session so no network call happens inside it.
 *
 * `setFrom` lets the caller capture payer/authToken for on-chain recovery even
 * if a later step throws.
 */
async function signAndBroadcast(
  connection: Connection,
  treasury: PublicKey,
  lamports: number,
  onStatus: ((status: WheelPaymentStatus) => void) | undefined,
  setFrom: (address: string, authToken: string, walletUriBase?: string) => void,
): Promise<{ address: string; authToken: string; walletUriBase?: string; signature: string }> {
  onStatus?.('opening_wallet');
  const latestBlockhash = await connection.getLatestBlockhash('confirmed');

  const signed = await transact(async wallet => {
    onStatus?.('authorizing');
    const authorization = await wallet.authorize({ chain: SOLANA_CHAIN, identity: APP_IDENTITY });
    const account = authorization.accounts[0];
    if (!account) throw new Error('Wallet returned no authorized account.');

    onStatus?.('preparing_transaction');
    const fromPubkey = publicKeyFromMwaAddress(account.address);
    setFrom(fromPubkey.toBase58(), authorization.auth_token, authorization.wallet_uri_base);
    const transaction = new Transaction({ ...latestBlockhash, feePayer: fromPubkey }).add(
      SystemProgram.transfer({ fromPubkey, toPubkey: treasury, lamports }),
    );

    onStatus?.('requesting_signature');
    // Sign only — do NOT let the wallet broadcast/confirm (that wait is what cancels).
    const [signedTx] = await wallet.signTransactions({ transactions: [transaction] });
    if (!signedTx) throw new Error('Wallet did not return a signed transaction.');
    return {
      signedTx,
      address: fromPubkey.toBase58(),
      authToken: authorization.auth_token,
      walletUriBase: authorization.wallet_uri_base,
    };
  });

  // Broadcast + confirm on our own connection, outside the wallet session.
  const signature = await connection.sendRawTransaction(signed.signedTx.serialize(), {
    skipPreflight: false,
    preflightCommitment: 'confirmed',
  });
  try {
    await connection.confirmTransaction(
      {
        signature,
        blockhash: latestBlockhash.blockhash,
        lastValidBlockHeight: latestBlockhash.lastValidBlockHeight,
      },
      'confirmed',
    );
  } catch (_) {
    // Confirmation timeout on a slow RPC — the tx may still land. Save it and let
    // the caller verify; recovery covers the "broadcast but unconfirmed" case.
  }

  return {
    address: signed.address,
    authToken: signed.authToken,
    walletUriBase: signed.walletUriBase,
    signature,
  };
}

export async function paySolToTreasury(
  deviceId: string,
  lamports: number,
  sol: number,
  purpose: SolPurpose,
  onStatus?: (status: WheelPaymentStatus) => void,
): Promise<WheelPaymentResult> {
  assertAndroidMwa();

  const treasury = ensureTreasuryWallet();
  const connection = new Connection(SOLANA_RPC, 'confirmed');

  // Hoisted so we can recover if the MWA session cancels after broadcasting.
  let fromAddress: string | null = null;
  let authTokenOuter = '';
  let walletUriOuter: string | undefined;

  try {
    const r = await signAndBroadcast(connection, treasury, lamports, onStatus,
      (addr, tok, uri) => { fromAddress = addr; authTokenOuter = tok; walletUriOuter = uri; });

    onStatus?.('saving_payment');
    await supabase.from('wheel_sol_payments').insert({
      device_id: deviceId,
      wallet_address: r.address,
      tx_signature: r.signature,
      lamports,
      sol_amount: sol,
      network: SOLANA_NETWORK,
      status: `confirmed:${purpose}`,
    });

    onStatus?.('confirmed');
    return { address: r.address, authToken: r.authToken, walletUriBase: r.walletUriBase, signature: r.signature, lamports, sol };
  } catch (e) {
    // The wallet session may have cancelled AFTER we broadcast — verify on-chain
    // before declaring failure, so we never charge the user twice.
    if (fromAddress) {
      const recovered = await recoverRecentPayment(connection, fromAddress, treasury, lamports);
      if (recovered) {
        onStatus?.('saving_payment');
        try {
          await supabase.from('wheel_sol_payments').insert({
            device_id: deviceId,
            wallet_address: fromAddress,
            tx_signature: recovered,
            lamports,
            sol_amount: sol,
            network: SOLANA_NETWORK,
            status: `confirmed:${purpose}`,
          });
        } catch (_) {}
        onStatus?.('confirmed');
        return {
          address: fromAddress,
          authToken: authTokenOuter,
          walletUriBase: walletUriOuter,
          signature: recovered,
          lamports,
          sol,
        };
      }
    }
    throw new SolanaPaymentError(e);
  }
}

export async function payForWheelSpin(
  deviceId: string,
  onStatus?: (status: WheelPaymentStatus) => void,
): Promise<WheelPaymentResult> {
  assertAndroidMwa();

  const treasury = ensureTreasuryWallet();
  const connection = new Connection(SOLANA_RPC, 'confirmed');

  // Hoisted so we can recover if the MWA session cancels after broadcasting.
  let fromAddress: string | null = null;
  let authTokenOuter = '';
  let walletUriOuter: string | undefined;

  try {
    const r = await signAndBroadcast(connection, treasury, WHEEL_SPIN_LAMPORTS, onStatus,
      (addr, tok, uri) => { fromAddress = addr; authTokenOuter = tok; walletUriOuter = uri; });

    onStatus?.('saving_payment');
    await supabase.from('wheel_sol_payments').insert({
      device_id: deviceId,
      wallet_address: r.address,
      tx_signature: r.signature,
      lamports: WHEEL_SPIN_LAMPORTS,
      sol_amount: WHEEL_SPIN_SOL,
      network: SOLANA_NETWORK,
      status: 'confirmed',
    });

    onStatus?.('confirmed');
    return { address: r.address, authToken: r.authToken, walletUriBase: r.walletUriBase, signature: r.signature, lamports: WHEEL_SPIN_LAMPORTS, sol: WHEEL_SPIN_SOL };
  } catch (e) {
    // The wallet session may have cancelled AFTER we broadcast — verify on-chain
    // before declaring failure, so we never charge the user twice.
    if (fromAddress) {
      const recovered = await recoverRecentPayment(connection, fromAddress, treasury, WHEEL_SPIN_LAMPORTS);
      if (recovered) {
        onStatus?.('saving_payment');
        try {
          await supabase.from('wheel_sol_payments').insert({
            device_id: deviceId,
            wallet_address: fromAddress,
            tx_signature: recovered,
            lamports: WHEEL_SPIN_LAMPORTS,
            sol_amount: WHEEL_SPIN_SOL,
            network: SOLANA_NETWORK,
            status: 'confirmed',
          });
        } catch (_) {}
        onStatus?.('confirmed');
        return {
          address: fromAddress,
          authToken: authTokenOuter,
          walletUriBase: walletUriOuter,
          signature: recovered,
          lamports: WHEEL_SPIN_LAMPORTS,
          sol: WHEEL_SPIN_SOL,
        };
      }
    }
    throw new SolanaPaymentError(e);
  }
}
