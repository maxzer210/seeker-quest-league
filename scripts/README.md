# Scripts

Operational scripts for Seeker Quest League.

## `create-skora-token.js`

One-time SPL token mint on Solana devnet. Already run — mint address `3HTkC3v9CYTxGYQSegsidgzfxEQJvAotYZVozmaFc2av`.
Re-running will be a no-op because `skora-config.json` already has `mint` set.

## `distribute-genesis-prizes.js`

Distributes SOL from the treasury wallet to top-100 tournament players according to `lib/genesis.ts` tier table.

### Prerequisites

1. **Apply SQL migration:**
   ```
   Run supabase-prize-distribution.sql in Supabase SQL Editor
   ```
   Adds:
   - `players.wallet_address` column
   - `prize_distributions` table with RLS

2. **Get Supabase service_role key:**
   - Dashboard → Settings → API → service_role secret
   - **Keep secret** — bypasses RLS, has full DB access

3. **Treasury must have enough SOL:**
   - 60% of treasury → distributed
   - Plus ~5000 lamports/recipient for tx fees

### Usage

**Dry run** (recommended first):
```powershell
$env:SUPABASE_SERVICE_KEY = "<service_role_key>"
node scripts/distribute-genesis-prizes.js --dry-run
```

Output shows the planned distribution table with no transactions sent.

**Live run** (SENDS SOL):
```powershell
$env:SUPABASE_SERVICE_KEY = "<service_role_key>"
node scripts/distribute-genesis-prizes.js
```

5-second countdown before sending. Ctrl+C to abort.

**Custom season label** (for daily SOL Pot distributions later):
```powershell
node scripts/distribute-genesis-prizes.js --season=season-1-day-001
```

### What it does

1. Reads top-100 from `tournament_scores` (where `tournament_id = season-zero`)
2. Joins with `players.wallet_address`
3. Computes prize per rank from `TIER_PERCENTAGES`
4. Inserts pending row into `prize_distributions`
5. Sends SOL transaction
6. Updates row to `sent` with `tx_signature` (or `failed`)

### Recovery

If a transaction fails mid-run, the row stays in `pending` or `failed` state. Re-run the script:
- `pending` rows can be safely re-attempted (idempotent via tx_signature unique constraint)
- `failed` rows need manual investigation

---

## `process-skora-claims.js`

Polls `public.skora_claims` for `status = 'pending'`, mints SKORA SPL tokens
to each player's wallet, and marks status `minted` (with `tx_signature`) or
`failed` (with `error_message`).

### Prerequisites

1. **Apply SQL migration:**
   ```
   Run supabase-skora-claims.sql in Supabase SQL Editor
   ```

2. **Get Supabase service_role key** (same as for prize distribution).

3. **Treasury wallet must have SOL** for:
   - ATA creation fee (~0.002 SOL per first-time recipient)
   - tx fees (~5000 lamports each)

### Usage

**One-shot pass** (process whatever's pending now, then exit):
```powershell
$env:SUPABASE_SERVICE_KEY = "<service_role_key>"
node scripts/process-skora-claims.js
```

**Watch loop** (run continuously, poll every 15s):
```powershell
$env:SUPABASE_SERVICE_KEY = "<service_role_key>"
node scripts/process-skora-claims.js --watch
```

**Dry run:**
```powershell
node scripts/process-skora-claims.js --dry-run
```

### What it does per claim

1. SELECTs `skora_claims` where `status = 'pending'` (oldest first, max 20)
2. For each:
   - Validates `wallet_address` is a valid Solana pubkey → if not, marks `rejected`
   - Calls `getOrCreateAssociatedTokenAccount` (creates ATA if first time)
   - Builds `mintTo` instruction signed by mint authority
   - Sends + confirms transaction
   - UPDATEs row to `minted` with `tx_signature` and `processed_at`
3. Errors: marks `failed` with `error_message`, moves on

### Running in production

For a real deployment, run this in `--watch` mode on a tiny VPS / Railway / Fly.io.
A single t2.nano with `pm2` is enough for our scale.

### Tier table (must match `lib/genesis.ts`)

| Rank | Share |
|------|-------|
| #1 | 30% |
| #2 | 18% |
| #3 | 12% |
| #4-10 | 3.5% each |
| #11-30 | 0.5% each |
| #31-100 | 0.071% each |

60% of treasury balance is distributed. 20% reserved for SKORA airdrops, 20% for project treasury.
