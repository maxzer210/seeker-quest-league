---
name: seeker-development
description: Build Solana Mobile Seeker apps with seeker-sdk. Use when the user wants to verify Seeker device ownership (SGT), resolve .skr domains, query SKR token balances, build staking/unstaking transactions, gate content to Seeker owners, implement anti-sybil measures, query guardian pools, get staking stats, or build any feature targeting Solana Seeker users. Also trigger on mentions of "Seeker", "SGT", "Genesis Token", ".skr domain", "SKR token", "SKR staking", "Seeker ID", "Seed Vault", "dApp Store", or "Solana Mobile" in a build context.
---

# Seeker Development Skill

Complete skill for building on the Solana Seeker ecosystem using `seeker-sdk`.

## Setup

Always install before writing any Seeker-related code:

```bash
npm install seeker-sdk @solana/web3.js
```

Peer dependency: @solana/web3.js ^1.95.0

Every function requires a Connection:

```typescript
import { Connection } from "@solana/web3.js";
const connection = new Connection("https://api.mainnet-beta.solana.com");
// Use a dedicated RPC (Helius, Triton, QuickNode) for production
```

## On-Chain Constants

These are verified. Do not change or guess alternatives.

- SGT Mint Authority: GT2zuHVaZQYZSyQMgJPLzvkmyztfyXg2NJunqFp4p3A4
- SGT Metadata Address: GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te
- SGT Group Address: GT22s89nU4iWFkNXj1Bw6uYhJJWDRPpShHt4Bk8f99Te
- Token-2022 Program: TokenzQdBNbLqP5VEhdkAS6EPFLC1PHnBqCXEpPxuEb
- SKR Mint: SKRbvo6Gf7GondiT3BbTfuRDPqLWei4j2Qy2NPGZhW3
- SKR Staking Program: SKRskrmtL83pcL4YqLWt6iPefDqwXQWHSw9S9vz94BZ
- .skr domains use AllDomains protocol (NOT Bonfida SNS)

## SGT Verification

The Seeker Genesis Token is a Token-2022 NFT minted once per device. It proves device ownership.

### Simple boolean check
```typescript
import { isSeeker } from "seeker-sdk";
const isSeekerUser = await isSeeker(connection, walletAddress);
```

### Full verification with anti-sybil
```typescript
import { verifySGT } from "seeker-sdk";

const usedMints = new Set<string>(); // persist to DB in production

const result = await verifySGT({
  connection,
  walletAddress,
  usedMints, // rejects SGTs already seen
});

if (result.isSeeker) {
  usedMints.add(result.mintAddress!);
  // grant reward
}
// result: { isSeeker: boolean, mintAddress: string | null, walletAddress: string }
```

### Anti-sybil note
SGTs can transfer between wallets in the same Seed Vault. Always track mint addresses (not wallet addresses) to prevent double-claiming. The mint address is unique per device and stays the same after transfer.

## .skr Domain Resolution

.skr domains are Seeker IDs powered by AllDomains. Do NOT use @bonfida/spl-name-service (that is for .sol only).

```typescript
import { resolveSkrDomain, reverseResolveSkr, getSkrDomains, isSkrDomain } from "seeker-sdk";

// Forward: domain -> wallet
const owner = await resolveSkrDomain(connection, "saicharan.skr");

// Reverse: wallet -> domain
const domain = await reverseResolveSkr(connection, walletAddress);

// All domains for a wallet
const domains = await getSkrDomains(connection, walletAddress);

// Validate format
isSkrDomain("saicharan.skr"); // true
```

Display pattern: show .skr name when available, fall back to truncated address.

## SKR Token

```typescript
import { getSKRBalance, hasMinSKR, getSKRStakeInfo } from "seeker-sdk";

// Balance
const { uiBalance } = await getSKRBalance(connection, walletAddress);

// Token-gate
const hasEnough = await hasMinSKR(connection, walletAddress, 1000);

// Staking info
const stake = await getSKRStakeInfo(connection, walletAddress);
// { isStaked, depositedAmount, currentAmount, yieldEarned, unstakingAmount }
```

## Staking Instructions

Build TransactionInstruction objects for wallet adapters. Zero Anchor runtime dependency.

```typescript
import {
  createStakeInstruction,
  createUnstakeInstruction,
  createCancelUnstakeInstruction,
  createWithdrawInstruction,
  deriveUserStakePda,
} from "seeker-sdk";

// Stake
const stakeIx = createStakeInstruction({
  user: walletPublicKey,
  guardianPool: guardianPoolAddress,
  amount: BigInt(10_000_000_000), // 6 decimals
});

// Unstake
const [userStakePda] = deriveUserStakePda(walletPublicKey, guardianPoolAddress);
const unstakeIx = createUnstakeInstruction({
  user: walletPublicKey,
  userStake: userStakePda,
  guardianPool: guardianPoolAddress,
  shares: BigInt(10_000_000_000),
});

// Cancel unstake during cooldown
const cancelIx = createCancelUnstakeInstruction({
  user: walletPublicKey,
  userStake: userStakePda,
  guardianPool: guardianPoolAddress,
});

// Withdraw after cooldown
const withdrawIx = createWithdrawInstruction({
  user: walletPublicKey,
  userStake: userStakePda,
});
```

## Guardian Pools

```typescript
import { getGuardianPool, getGuardiansForStaker, getAllGuardians } from "seeker-sdk";

const pool = await getGuardianPool(connection, poolAddress);
const myGuardians = await getGuardiansForStaker(connection, walletAddress);
const allGuardians = await getAllGuardians(connection);
```

## Global Staking Stats

```typescript
import { getStakingStats } from "seeker-sdk";

const stats = await getStakingStats(connection);
// { totalShares, sharePrice, sharePriceMultiplier, totalValueLocked,
//   minStakeAmount, cooldownSeconds, guardianCount, vaultAddress }
```

## PDA Helpers

```typescript
import {
  deriveStakeConfigPda,
  deriveUserStakePda,
  deriveGuardianPoolPda,
  deriveStakeVaultPda,
} from "seeker-sdk";
```

## Aggregate Profile

One call for everything:

```typescript
import { getSeekerProfile } from "seeker-sdk";

const profile = await getSeekerProfile(connection, walletAddress);
// { walletAddress, isSeeker, sgtMintAddress, skrDomain, skrBalance,
//   isStaked, stakedAmount, yieldEarned }
```

Uses Promise.allSettled internally so partial RPC failures don't break the entire call.

## Error Handling

All errors extend SeekerVerifyError: SGTVerificationError, DomainResolutionError, InvalidAddressError, RpcError.

```typescript
import { SGTVerificationError, RpcError } from "seeker-sdk";

try {
  await verifySGT({ connection, walletAddress });
} catch (e) {
  if (e instanceof RpcError) { /* handle RPC failure */ }
  if (e instanceof SGTVerificationError) { /* handle verification failure */ }
}
```

## Links

- SDK: https://github.com/saicharanpogul/seeker-sdk
- npm: https://www.npmjs.com/package/seeker-sdk
- Solana Mobile Docs: https://docs.solanamobile.com
- SGT Docs: https://docs.solanamobile.com/marketing/engaging-seeker-users
- Developer Hub: https://buildonseeker.com
