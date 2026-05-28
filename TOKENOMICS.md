# Seeker Quest League — Tokenomics

*Working economic model · Version 0.1*
*Last updated: May 2026*

> ⚠️ **This is a working draft.** Numbers will be revised based on Pre-Season real data before mainnet launch. Treat as economic design, not a promise.

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

## 9. Open Design Questions

These need answers before mainnet:

1. **Should ORB be tradeable peer-to-peer?**
   Pro: liquidity, fun. Con: makes inflation harder to control.
   *Current stance:* No. Keep ORB strictly off-chain personal.

2. **Should SKORA be staked back into the game for boosts?**
   Pro: sink mechanism. Con: complexity.
   *Current stance:* Yes, in Phase 4. Stake 1,000 SKORA → +20% ORB rewards.

3. **Should we burn tokens at any point?**
   Pro: deflationary pressure. Con: optics, perceived value.
   *Current stance:* No. Use sinks instead.

4. **Dynamic spin pricing?**
   Pro: adapts to SOL volatility. Con: complexity, predictability matters.
   *Current stance:* No. Lock at 0.01 SOL. Revisit if SOL moves 5× in either direction.

5. **Should Founders get SOL royalty forever?**
   Pro: ultimate retention. Con: dilutes prize pool.
   *Current stance:* No. Founders get ORB multiplier + early SKORA, not perpetual SOL.

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
