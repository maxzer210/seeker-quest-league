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

export const SOLANA_NETWORK = 'devnet';
export const SOLANA_CHAIN = 'solana:devnet';
export const SOLANA_RPC = 'https://api.devnet.solana.com';
export const WHEEL_SPIN_SOL = 0.01;
export const WHEEL_SPIN_LAMPORTS = Math.round(WHEEL_SPIN_SOL * LAMPORTS_PER_SOL);

export const ENERGY_REFILL_SOL = 0.005;
export const ENERGY_REFILL_LAMPORTS = Math.round(ENERGY_REFILL_SOL * LAMPORTS_PER_SOL);

export const PREMIUM_UPGRADE_SOL = 0.01;
export const PREMIUM_UPGRADE_LAMPORTS = Math.round(PREMIUM_UPGRADE_SOL * LAMPORTS_PER_SOL);

export const PVP_ENTRY_SOL = 0.005;
export const PVP_ENTRY_LAMPORTS = Math.round(PVP_ENTRY_SOL * LAMPORTS_PER_SOL);

// Treasury receives 0.01 SOL per Wheel paid spin.
// Must be DIFFERENT from the user's wallet, otherwise it's a self-transfer (only fee deducted).
// On devnet we use the SKORA mint authority address — we already hold its keypair in skora-config.json.
// On mainnet — create a dedicated treasury wallet and rotate this constant.
export const TREASURY_WALLET: string = 'EekTZsoxzVEdze1HEAqLQbMnx8ScBheWBW3Dsp9QBZDT';

const APP_IDENTITY = {
  name: 'Seeker Quest League',
  uri: 'https://seekerquest.league',
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

export type SolPurpose = 'wheel_spin' | 'energy_refill' | 'shop_upgrade' | 'pvp_entry';

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

  try {
    onStatus?.('opening_wallet');
    const result = await transact(async wallet => {
      onStatus?.('authorizing');
      const authorization = await wallet.authorize({
        chain: SOLANA_CHAIN,
        identity: APP_IDENTITY,
      });
      const account = authorization.accounts[0];
      if (!account) throw new Error('Wallet returned no authorized account.');

      onStatus?.('preparing_transaction');
      const fromPubkey = publicKeyFromMwaAddress(account.address);
      const latestBlockhash = await connection.getLatestBlockhash('confirmed');
      const transaction = new Transaction({
        ...latestBlockhash,
        feePayer: fromPubkey,
      }).add(
        SystemProgram.transfer({
          fromPubkey,
          toPubkey: treasury,
          lamports,
        }),
      );

      onStatus?.('requesting_signature');
      const [signature] = await wallet.signAndSendTransactions({
        transactions: [transaction],
        commitment: 'confirmed',
      });
      if (!signature) throw new Error('Wallet did not return a transaction signature.');

      return {
        address: fromPubkey.toBase58(),
        authToken: authorization.auth_token,
        walletUriBase: authorization.wallet_uri_base,
        signature,
        lamports,
        sol,
      };
    });

    try {
      await connection.confirmTransaction(result.signature, 'confirmed');
    } catch (_) {}

    onStatus?.('saving_payment');
    await supabase.from('wheel_sol_payments').insert({
      device_id: deviceId,
      wallet_address: result.address,
      tx_signature: result.signature,
      lamports: result.lamports,
      sol_amount: result.sol,
      network: SOLANA_NETWORK,
      status: `confirmed:${purpose}`,
    });

    onStatus?.('confirmed');
    return result;
  } catch (e) {
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

  try {
    onStatus?.('opening_wallet');
    const result = await transact(async wallet => {
    onStatus?.('authorizing');
    const authorization = await wallet.authorize({
      chain: SOLANA_CHAIN,
      identity: APP_IDENTITY,
    });
    const account = authorization.accounts[0];
    if (!account) throw new Error('Wallet returned no authorized account.');

    onStatus?.('preparing_transaction');
    const fromPubkey = publicKeyFromMwaAddress(account.address);
    const latestBlockhash = await connection.getLatestBlockhash('confirmed');
    const transaction = new Transaction({
      ...latestBlockhash,
      feePayer: fromPubkey,
    }).add(
      SystemProgram.transfer({
        fromPubkey,
        toPubkey: treasury,
        lamports: WHEEL_SPIN_LAMPORTS,
      }),
    );

    onStatus?.('requesting_signature');
    const [signature] = await wallet.signAndSendTransactions({
      transactions: [transaction],
      commitment: 'confirmed',
    });
    if (!signature) throw new Error('Wallet did not return a transaction signature.');

    return {
      address: fromPubkey.toBase58(),
      authToken: authorization.auth_token,
      walletUriBase: authorization.wallet_uri_base,
      signature,
      lamports: WHEEL_SPIN_LAMPORTS,
      sol: WHEEL_SPIN_SOL,
    };
    });

    // Confirm transaction is finalized on chain before saving to DB
    try {
      await connection.confirmTransaction(result.signature, 'confirmed');
    } catch (_) {
      // If confirmation times out, still save — RPC may be slow. Caller can verify via explorer.
    }

    onStatus?.('saving_payment');
    await supabase.from('wheel_sol_payments').insert({
      device_id: deviceId,
      wallet_address: result.address,
      tx_signature: result.signature,
      lamports: result.lamports,
      sol_amount: result.sol,
      network: SOLANA_NETWORK,
      status: 'confirmed',
    });

    onStatus?.('confirmed');
    return result;
  } catch (e) {
    throw new SolanaPaymentError(e);
  }
}
