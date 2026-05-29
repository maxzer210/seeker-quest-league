# Seeker Quest League — Tokenomics

*Working economic model · Version 0.2*
*Last updated: May 2026*

> ⚠️ **This is a working draft.** Numbers will be revised based on Pre-Season real data before mainnet launch. Treat as economic design, not a promise.

## v0.2 CHANGES (May 2026)

- ✅ **P2P ORB trade enabled** — 5% fee (3% burn + 2% treasury)
- ✅ **Triple burn mechanism** — monthly buyback + ORB transfer burn + premium SOL burn
- ✅ **Founder Pass tiers** — Free / Silver / Gold / Diamond (paid upgrades)
- ✅ **Static spin pricing** — fixed at 0.01 SOL (no dynamic adjustments)

---

## 1. Three-currency system

| Currency | Type | Where it lives | Purpose |
|----------|------|---------------|---------|
| **SOL** | Native Solana | On-chain | Real money. Players pay, players win. |
| **SKORA** | SPL Token | On-chain (mainnet at launch) | Reward token. Convertible from ORB. |
| **ORB** | Off-chain | Supabase DB | Game-loop fuel. Gameless tap currency. |

**Design principle:** keep gameplay friction near zero (ORB off-chain, no gas) while making real value transactions explicit and on-chain (SOL, SKORA).

---

## 2. SKORA Token

### 2.1 Supply

| Property | Value |
|----------|-------|
| **Total supply** | 1,000,000,000 SKORA |
| **Decimals** | 6 |
| **Mint authority** | Multisig (mainnet) / single key (devnet) |
| **Freeze authority** | Same as mint authority |
| **Initial issuance** | 100% to treasury wallet at mint time |
| **Inflation** | Zero — fixed supply forever |

### 2.2 Distribution

| Bucket | % | Tokens | Vesting / unlock |
|--------|---|--------|------------------|
| **Community rewards** | 40% | 400,000,000 | Linear over 48 months via daily airdrops, ORB→SKORA conversions, tournament prizes |
| **Treasury** | 20% | 200,000,000 | Locked for 12 months, then 5% released quarterly for ecosystem development |
| **Founders pool** | 15% | 150,000,000 | Distributed to Pre-Season Founders proportional to activity, vests over 6 months from Season 1 launch |
| **Liquidity** | 15% | 150,000,000 | Initial DEX pair at mainnet launch (paired with SOL), locked LP for 24 months |
| **Team & operations** | 10% | 100,000,000 | 6-month cliff, then linear over 24 months |

### 2.3 Why these numbers

- **40% community** — game must redistribute most tokens to players to be legitimate
- **0% private sale / VC** — no insider dump pressure
- **15% liquidity locked** — anti-rug commitment
- **24-month team vest** — alignment with long-term success
- **6-month cliff on team** — proves we ship before we earn

---

## 3. ORB Economy

ORB is the heartbeat of moment-to-moment gameplay. It has **no market price** by design — it's a balanced internal economy.

### 3.1 Sources (per day, average active player)

| Source | ORB/day | Notes |
|--------|---------|-------|
| Home screen tapping | 1,500-3,000 | Energy-gated (100/day, +1/min refill) |
| Crit hits | +20-30% | Random ×3 multipliers |
| Combo multipliers | +50% | x1.5 / x2 / x2.5 chains |
| Daily streak bonus | 100-2,000 | Scales with streak length |
| Lands harvest | 500-2,000 | Once per 24h |
| Wheel free spin | 50-500 | Daily ticket |
| Wheel paid spin | 100-5,000 | 0.01 SOL, variable rewards |
| Horse Race win | 500 | + 1 ticket |
| Arena raid win | 200-1,000 | + tournament points |
| Treasure Hunt chest | 100-2,000 | Rarity-based |
| Space Runner survival | ~50/second | Capped at 100s = 5,000 |
| SGT one-time bonus | 5,000 | Seeker holders only |
| Founder multiplier | × 2 | Forever, applied to all ORB |

**Typical daily ORB earnings (no paid spins):** 5,000-15,000 ORB
**Typical daily ORB earnings (with 3 paid spins):** 8,000-25,000 ORB

### 3.2 Sinks

| Sink | Cost | Frequency |
|------|------|-----------|
| Upgrade: Signal Power (Lv5) | 25,000 ORB | Once |
| Upgrade: Crit Chance (Lv5) | 30,000 ORB | Once |
| Upgrade: Horse Power (Lv5) | 28,000 ORB | Once |
| Upgrade: Wheel Luck (Lv5) | 40,000 ORB | Once |
| Full upgrade tree | ~150,000 ORB | One-time |
| Arena PvP entry | 1,000 ORB | Per fight |
| ORB → SKORA conversion | 10,000 ORB | Per 1 SKORA claimed |
| Future: NFT items | 5,000-50,000 ORB | Per item |
| Future: Tournament entry boost | 1,000 ORB | Per entry |

### 3.3 Inflation control

The game's economic engineers face two failure modes:
1. **Hyperinflation** — too easy to earn ORB → SKORA conversion floods market → SKORA price collapses
2. **Deflation** — too hard to earn ORB → players quit before reaching first upgrade

**Our balance mechanisms:**

| Mechanism | Effect |
|-----------|--------|
| **Energy cap** (100, +1/min) | Limits tap farming to ~1,500-3,000 ORB/day baseline |
| **Daily Lands cap** (24h cooldown) | Prevents idle farming exploit |
| **Conversion rate 10K ORB = 1 SKORA** | Even high-activity player produces ~2 SKORA/day baseline |
| **Min claim 10,000 ORB** | Prevents micro-transaction spam |
| **Upgrade scaling cost** | Late-game upgrades cost 25K-40K each, absorbing ORB |
| **Paid spins return ORB** | But also drain SOL — natural offset |

**Predicted equilibrium:** an average active player nets ~2-5 SKORA/day after sinks. Top tournament players (top-10) net ~10-25 SKORA/day plus SOL prizes.

---

## 4. SOL Flow

### 4.1 Inflow (player → treasury)

```
Player pays 0.01 SOL for Wheel spin
        ↓
Treasury wallet:
   EekTZsoxzVEdze1HEAqLQbMnx8ScBheWBW3Dsp9QBZDT
        ↓
Logged to Supabase wheel_sol_payments
```

### 4.2 Outflow split (per day)

| Bucket | % of daily inflow | Use |
|--------|-------------------|-----|
| **Top-100 prizes** | 60% | Auto-distributed at 23:59 UTC daily |
| **SKORA airdrop pool** | 20% | Accumulated, distributed weekly via SKORA |
| **Project treasury** | 20% | Development, audits, marketing, RPC costs |

### 4.3 Prize tier breakdown (60% of daily pool)

| Rank | Share of prize pool | Example: 2 SOL pool |
|------|---------------------|---------------------|
| #1 | 30% | 0.600 SOL |
| #2 | 18% | 0.360 SOL |
| #3 | 12% | 0.240 SOL |
| #4-10 | 3.5% each (24.5%) | 0.070 SOL each |
| #11-30 | 0.5% each (10%) | 0.010 SOL each |
| #31-100 | ~0.071% each (5%) | 0.0014 SOL each |

**Sum check:** 30 + 18 + 12 + 24.5 + 10 + 5 = 99.5% (0.5% reserved for transaction fees and rounding)

---

## 5. Player ROI Scenarios

These are honest projections, not promises. Real outcomes depend on competition.

### 5.1 Casual player (free only)

- Plays 5 minutes/day, no paid spins
- Earns ~8,000 ORB/day = ~0.8 SKORA/day
- Never wins SOL prize (not enough activity for top-100)
- **30-day SKORA earnings: ~24 SKORA**

### 5.2 Active player (3 paid spins/day)

- Spends 0.03 SOL/day = 0.9 SOL/month
- Earns ~15,000 ORB/day = ~1.5 SKORA/day from gameplay
- Plus ~5,000 ORB/day from Wheel paid rewards (avg) = +0.5 SKORA/day
- Typically ranks #50-100 → ~0.001-0.002 SOL/day from prize pool
- **30-day net:** Spent 0.9 SOL, earned ~0.03 SOL + 60 SKORA

> ROI depends on SKORA market value at launch. If SKORA = $0.01, this player breaks even. If SKORA = $0.10, they make ~5× their SOL spend.

### 5.3 Tournament hunter (top-10 player)

- Spends 0.30 SOL/day = 9 SOL/month
- Earns 25,000+ ORB/day = ~2.5 SKORA/day from gameplay
- Active in PvP, all daily quests, all games
- Top-10 daily → average 0.05-0.10 SOL/day from prize pool
- **30-day net:** Spent 9 SOL, earned ~2.25 SOL + 75 SKORA + Founder NFT value

### 5.4 Whale (#1 daily aspirant)

- Spends 1.0 SOL/day = 30 SOL/month
- Aggressive paid spins to maintain #1
- Average #1 finish 3-5 days per week
- **30-day net:** Spent 30 SOL, earned ~10-15 SOL in prizes + 200+ SKORA + maximum reputation
- **Net loss in SOL, net gain in SKORA + status + Founder dominance**

> Whales are net donors to the prize pool. Their losses fund top-10 winners. This is **intentional and sustainable** as long as whales value status and SKORA upside more than SOL.

---

## 6. Stress Tests

### 6.1 What if no one plays?

- Treasury receives 0 SOL → daily pool = 0 → no prizes
- **No catastrophic loss** — we just have a quiet day
- Players still earn ORB, just no SOL distribution

### 6.2 What if 10,000 players join overnight?

- Daily paid spins jump from ~50/day to ~5,000/day
- Daily SOL pool: 50 SOL = $8,750
- Top-1 prize: 15 SOL = $2,625 per day
- **Pros:** massive virality
- **Cons:** server load on Supabase, RPC rate limits, dApp Store noise
- **Mitigation:** rate-limit paid spins to 10/player/day, add Helius dedicated RPC

### 6.3 What if SOL price 10×?

- Spin cost stays 0.01 SOL but doubles in USD
- Players pay less in USD per spin → demand may stay
- Prize pool USD value doubles
- **No action needed**

### 6.4 What if SOL price drops 80%?

- Players pay same 0.01 SOL but worth less in USD
- Prize pool USD value drops
- **Mitigation:** introduce dynamic pricing (cheaper spin during bear) only if necessary

### 6.5 What if a single player wins 30 days in a row?

- Earns ~30 × 0.6 SOL = 18 SOL in prizes
- Spent maybe 30 SOL to maintain rank
- **Net:** still loss for player, sustainable for game
- **Social risk:** other players quit thinking it's rigged
- **Mitigation:** publish daily distribution scripts, show all txns on Explorer

---

## 7. Treasury Wallet Management

The treasury wallet (`EekTZsoxzVEdze1HEAqLQbMnx8ScBheWBW3Dsp9QBZDT` on devnet, separate mainnet address at launch) is the heart of all SOL flows.

### 7.1 Current setup (devnet)

- Single keypair stored in `skora-config.json` (gitignored)
- Same keypair acts as SKORA mint authority
- Single point of failure — acceptable for devnet, **NOT for mainnet**

### 7.2 Mainnet setup (planned)

- **Multisig 3-of-5** via Squads Protocol
- Signers: 2 team members + 3 community trustees (publicly known)
- All withdrawals from treasury require 3 signatures
- Daily distribution script runs from delegated authority with daily SOL limit
- Mint authority transferred to multisig immediately after token creation

### 7.3 Treasury 20% breakdown (per month)

Assuming 5 SOL/month inflow during early months:

| Expense | Monthly cost |
|---------|--------------|
| Helius RPC (paid tier) | 0.3 SOL ($53) |
| Supabase (Pro) | 0.15 SOL ($26) |
| Audit setaside (saved for Q4) | 0.5 SOL ($88) |
| Marketing (X ads, KOLs) | 0.5-1.0 SOL |
| Dev contractor / bounty | 0.5-2.0 SOL |
| Reserve | remainder |

---

## 8. Conversion Mechanism: ORB → SKORA

### 8.1 Rate

```
1 SKORA = 10,000 ORB
Minimum claim: 10,000 ORB (= 1 SKORA)
Maximum claim per tx: 1,000,000 ORB (= 100 SKORA)
```

### 8.2 Flow

```
Player has 10,000+ ORB → opens SKORA Wallet
→ enters claim amount (in ORB)
→ signs transaction request
→ Supabase deducts ORB (atomic)
→ Backend script (delegated authority) mints SKORA to player's wallet
→ Transaction logged in claim history
```

### 8.3 Anti-abuse

- Rate limit: max 1 claim per 24h per device
- Minimum playtime: 7 days before first claim
- Maximum lifetime claim: bound by lifetime earned ORB
- Wallet linkage: claim must go to MWA-connected wallet

---

## 9. Design Decisions (FINAL — v0.2)

### 9.1 ✅ P2P ORB Trading — ENABLED

Players can transfer ORB to each other off-chain via Supabase.

**Constraints:**
- Minimum transfer: 1,000 ORB
- Maximum daily volume per player: 50,000 ORB (anti-money-laundering)
- Cooldown: 1 transfer per minute
- **Fee: 5% total** (3% burned + 2% to treasury)

**Why it works:** creates economic activity, adds ORB sink, supports gifting between friends without flooding the SKORA conversion pipe.

**Implementation:** atomic Supabase RPC `transfer_orb(sender, recipient, amount)` with row-level locks.

### 9.2 ✅ Triple Burn Mechanism — DEPLOYED

Three independent burn vectors create constant deflationary pressure on SKORA supply.

#### A) Monthly Buyback & Burn (main lever)
- **1st of every month**, automated script:
- 10% of treasury SOL → market buy SKORA on DEX
- Bought SKORA → permanently burned (sent to `1nc1nerator11111111111111111111111111111111`)
- All transactions publicly verifiable on Solana Explorer

**Effect estimate:** at 50 SOL/day inflow → 1,500 SOL/month → 150 SOL → SKORA buy/burn → **~5M SKORA burned/month** at $0.005

#### B) ORB Transfer Burn (continuous pressure)
- 3% of every P2P ORB transfer disappears
- At 1M ORB transfers/day → 30K ORB/day burned
- **Year 1 estimate:** ~10M ORB burned (~1,000 SKORA equivalent)

#### C) Premium SOL Auto-Burn (small but compounding)
- 5% of every premium SOL purchase (0.01–0.05 SOL items)
- Accumulated weekly → SKORA buy → burn
- **Effect:** at 30 SOL/week premium purchases → ~1.5 SOL → SKORA buy/burn

**Total Year 1 burn projection:** ~50M SKORA (5% of total supply) — strong deflationary play.

### 9.3 ❌ Dynamic Spin Pricing — REJECTED

Stays at fixed **0.01 SOL** regardless of SOL/USD volatility.
Predictability and simplicity beat micro-optimization.

### 9.4 ✅ Founder Pass Tier System — DEPLOYED

Replaces the single ×2 Founder bonus with a **4-tier paid upgrade system**.

| Tier | Cost | Bonuses |
|------|-----:|---------|
| 🟢 **Free Founder** | 1 paid spin (0.01 SOL) | ×2 ORB forever + base Founder NFT |
| 🥈 **Silver Pass** | **0.5 SOL** | ×3 ORB + Silver skin + 3 free spins/day |
| 🥇 **Gold Pass** | **1.0 SOL** | ×4 ORB + Gold skin + 5 free spins/day + NFT mint priority |
| 💎 **Diamond Pass** | **2.0 SOL** | ×5 ORB + Diamond skin + 10 free spins/day + 1% of daily prize pool + custom username color |

#### Revenue split per Pass purchase

| Bucket | % | Use |
|--------|---|-----|
| **Project treasury** | 80% | Owner revenue (development, marketing, profit) |
| **Community prize pool** | 15% | Boosts top-100 daily prizes |
| **SKORA burn pool** | 5% | Deflationary pressure |

#### Year 1 conservative projection (Founder Pass revenue)

Assumption: 1,000 daily active players
- 20% buy Silver → 200 × 0.5 SOL = **100 SOL**
- 5% buy Gold → 50 × 1.0 SOL = **50 SOL**
- 1% buy Diamond → 10 × 2.0 SOL = **20 SOL**
- **Total: ~170 SOL** (one-time payments)
- **Project share (80%):** 136 SOL → at $175/SOL = **~$24K direct profit**

This revenue is **separate from spin/refill revenue** and **does not dilute the prize pool**.

### 9.5 ❌ Eternal SOL Royalty for Founders — REJECTED

Decision: no perpetual SOL stream from prize pool to Founders.
Replaced by **Diamond tier 1% prize pool boost** which is fundable from Pass revenue, not from main game spin revenue.

### 9.6 ✅ SKORA Staking — PLANNED (Phase 4)

Future feature: stake 1,000 SKORA → +20% ORB rewards.
Adds long-term holding incentive.

---

## 10. P2P ORB Trading — Detailed Spec

### 10.1 User flow
1. Player A opens Profile → "Send ORB"
2. Enters recipient username or device_id
3. Enters amount (≥ 1,000 ORB, ≤ 50,000 ORB/day cap)
4. Confirms — sees fee preview: "You send 10,000 ORB · Recipient gets 9,500 ORB · 300 ORB burned · 200 ORB fee"
5. Tap → instant transfer (Supabase atomic op)

### 10.2 Backend (Supabase RPC)
```sql
CREATE FUNCTION transfer_orb(
  sender_id text, recipient_id text, amount int
) RETURNS jsonb AS $$
DECLARE
  fee int := amount * 5 / 100;
  burn int := amount * 3 / 100;
  treasury int := amount * 2 / 100;
  net int := amount - fee;
BEGIN
  -- Lock sender row
  UPDATE players SET orb = orb - amount WHERE device_id = sender_id AND orb >= amount;
  IF NOT FOUND THEN RAISE EXCEPTION 'Insufficient ORB'; END IF;

  -- Daily cap check
  IF (SELECT coalesce(sum(amount), 0) FROM orb_transfers
      WHERE sender_id = sender_id AND created_at > now() - interval '24 hours') + amount > 50000
  THEN RAISE EXCEPTION 'Daily transfer cap exceeded'; END IF;

  -- Credit recipient (net)
  UPDATE players SET orb = orb + net WHERE device_id = recipient_id;

  -- Burn record
  INSERT INTO orb_burned (amount, source) VALUES (burn, 'p2p_transfer');

  -- Treasury credit
  UPDATE treasury SET balance = balance + treasury;

  -- History
  INSERT INTO orb_transfers (sender_id, recipient_id, amount, fee, burned, created_at)
  VALUES (sender_id, recipient_id, amount, fee, burn, now());

  RETURN jsonb_build_object('ok', true, 'sent', amount, 'received', net, 'burned', burn);
END $$ LANGUAGE plpgsql;
```

### 10.3 Anti-abuse
- 1 minute cooldown between transfers
- 50K ORB/day cap per sender
- Cannot transfer to yourself
- Minimum 1,000 ORB per transfer
- All transfers logged immutably for audit

---

## 10. Summary Math (Year 1 Projection)

**Assumptions** (conservative):
- 1,000 active daily players by Month 3
- Average 5 paid spins/active player/day
- 1,000 × 5 × 0.01 = 50 SOL/day in spin revenue
- That's 1,500 SOL/month = 18,000 SOL/year
- At SOL = $175: ≈ **$3.15M annual SOL volume**

**Year 1 distribution:**
- 60% prize pool = 10,800 SOL → $1.89M back to players
- 20% SKORA airdrop budget = 3,600 SOL → $630K
- 20% treasury = 3,600 SOL → $630K for ops, audits, growth

**SKORA emission Year 1:**
- 40% community pool = 400M SKORA total
- Year 1 emission ≈ 100M SKORA (25% of community pool)
- Per active player: ~100,000 SKORA earned
- At even $0.005/SKORA market price: ~$500 per active player annually

> These numbers can collapse 5× lower or grow 10× higher depending on Pre-Season traction. They're directional, not promises.

---

## 11. Comparison to Similar Projects

| Project | Our advantage |
|---------|--------------|
| **Notcoin / Hamster Kombat** | Real on-chain settlement daily, not "wait for TGE forever" |
| **Tap-to-earn airdrops** | Transparent treasury, no rug risk |
| **Casino dApps** | Higher fun:risk ratio — daily tournament, not pure gambling |
| **Web3 idle games** | Mobile-native, Seeker-exclusive perks |

We are not trying to be the biggest. We are trying to be the **most aligned** with Seeker owners specifically.

---

## 12. References

- Treasury wallet (devnet): `EekTZsoxzVEdze1HEAqLQbMnx8ScBheWBW3Dsp9QBZDT`
- SKORA mint (devnet): `3HTkC3v9CYTxGYQSegsidgzfxEQJvAotYZVozmaFc2av`
- Supabase tables: `wheel_sol_payments`, `tournament_scores`, `sgt_bonus_claims`
- Distribution code (planned): `scripts/distribute-genesis-prizes.js`
- Multisig framework: [Squads Protocol](https://squads.so/)
- SOL price feed: Pyth Network at distribution time

---

*This document will be revised after every full Pre-Season month. Final mainnet numbers are not in this version. Always check the on-chain truth — it's the only audit that matters.*
