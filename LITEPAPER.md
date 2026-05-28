# Seeker Quest League — Litepaper

*Version 0.1 · Genesis Pre-Season*
*Last updated: May 2026*

---

## TL;DR

**Seeker Quest League** is the first daily-routine arcade game built natively for the Solana Mobile Seeker phone. Players tap, play mini-games, spin a fortune wheel and compete in daily SOL tournaments. The pot grows live on-chain. Top players take it home every 24 hours.

- 📱 **Built for Seeker** — exclusive prize tiers for SGT holders
- 💰 **Daily SOL tournaments** — real, transparent, on-chain
- 🎮 **6 mini-games** — Wheel, Horse Race, Space Runner, Treasure Hunt, Arena, Lands
- 🪙 **Two tokens** — ORB (in-game) and SKORA (SPL token)
- 🏛 **Founders Program** — early players keep 2× ORB rewards forever
- ⏰ **5 minutes a day** — designed to be a morning ritual, not a grind

---

## 1. Vision

The Solana Mobile Seeker creates a unique opportunity: a phone-shaped Solana wallet in the hands of crypto-native users. These users **need** on-chain activity to support the network, but most "tap-to-earn" apps are either boring grinds or empty hype.

**Seeker Quest League solves this by making transactional activity fun, transparent, and profitable.**

We believe every Seeker owner should be able to:
1. Spend **5 minutes a day** and feel like they did something meaningful
2. Generate **real on-chain transactions** as a side effect of playing
3. Have a **measurable chance to earn SOL** every single day
4. Belong to an **exclusive community** of early Web3 mobile adopters

This is not "play to earn." This is **play to belong**.

---

## 2. Why Solana Mobile?

| Aspect | Why it matters for us |
|--------|----------------------|
| **Seed Vault** | Native, secure signing for transactions without browser-wallet friction |
| **SGT (Seeker Genesis Token)** | Cryptographic proof of device ownership → anti-sybil, exclusive rewards |
| **Mobile Wallet Adapter (MWA)** | One-tap wallet connect that just works |
| **dApp Store** | Curated distribution to crypto-native audience |
| **Low fees** | 0.01 SOL paid spins are economically viable |
| **TPS culture** | Seeker owners are required to generate activity — we make that activity fun |

We are not "an Android game that supports Solana." We are **a Solana-first mobile experience that happens to run on Android**.

---

## 3. Daily Player Journey

A Seeker Quest player's day looks like this:

```
☕ 08:00   Morning Claim       +500 ORB, 1 free spin, energy refilled
🌾 08:01   Lands Harvest       Collect overnight passive income
📊 08:02   Check rank          See your live position in today's SOL Pot

🎰 14:00   Paid spin 0.01 SOL  80% goes into today's prize pool
⚔️ 14:02   PvP Arena bout      Bet 1000 ORB vs a real player
🐎 14:05   Horse Race         Tap-race for 15s, win tickets

🎯 22:00   Final push          Last paid spins, climb the leaderboard
🏆 23:59   Pot distribution    Top-10 receive SOL directly to wallet
```

Total active time: **8-12 minutes per day**.

This is **deliberately short**. We're not competing for hours of attention — we're competing to be the **first app a Seeker owner opens each morning**.

---

## 4. Mini-Games

| Game | Mechanic | Reward |
|------|----------|--------|
| 🎰 **Fortune Wheel** | Spin freely (tickets) or pay 0.01 SOL | ORB, tickets, SKORA, jackpot |
| 🐎 **Horse Race** | Tap-mash for 15 seconds vs AI rival | ORB + tickets |
| 🚀 **Space Runner** | Swipe to dodge asteroids endlessly | ORB scaled with time survived |
| 📦 **Treasure Hunt** | Open chests with rarity tiers | Variable ORB |
| ⚔️ **Arena** | Build a base, raid other players | ORB + tournament points |
| 🌾 **Seeker Lands** | Passive ORB generation, upgrades | ORB (capped per 24h) |

All games feed into the same **ORB economy** and award **Tournament Points** that determine rank in the daily SOL Pot.

---

## 5. The ORB Economy

**ORB** is the in-game currency. It exists off-chain (in Supabase) for low friction and zero gas during gameplay.

### Sources of ORB
- Tap on Home screen (10-75 ORB per tap depending on upgrades)
- Win mini-games
- Daily streak bonuses
- Seeker Lands passive generation
- Fortune Wheel rewards
- **SGT verification bonus** (+5,000 ORB one-time for Seeker holders)
- **Founder multiplier** (2× all ORB rewards forever, granted during Pre-Season)

### Sinks for ORB
- Upgrade shop (Signal Power, Crit Chance, Wheel Luck, Horse Power)
- PvP Arena bets
- Future: NFT items, premium skins, leaderboard entries

ORB does **not** have a market price. It's a balanced internal economy with conversion bridges to SKORA (see Section 6).

---

## 6. SKORA Token (SPL)

**SKORA** is the on-chain SPL token of the Seeker Quest League ecosystem.

### Specs
| Property | Value |
|----------|-------|
| Standard | SPL Token (Solana) |
| Network | Devnet (Pre-Season), Mainnet (Season 1+) |
| Decimals | 6 |
| Total Supply | 1,000,000,000 SKORA |
| Initial mint | Treasury wallet |

### Utility
- **ORB → SKORA conversion** — 10,000 ORB = 1 SKORA, claim into wallet
- **Weekly airdrop** — top active players receive SKORA snapshots
- **Future** — token-gated content, premium tiers, governance

### Distribution (planned)
- **40% — Community rewards** — airdrops, tournaments, claim conversions
- **20% — Treasury** — long-term ecosystem development
- **15% — Founders pool** — early Pre-Season players
- **15% — Liquidity** — DEX pairs at mainnet launch
- **10% — Team & operations** — vested over 24 months

> ⚠️ Tokenomics are evolving. Final numbers will be locked at mainnet launch and published in `TOKENOMICS.md`.

---

## 7. Daily SOL Pot — the Killer Mechanic

This is the **central retention loop** of the game.

### How it works
1. Every paid Fortune Wheel spin costs **0.01 SOL**
2. **80%** of each payment goes into **today's prize pool** (on-chain, transparent)
3. **20%** funds the long-term project treasury
4. At **23:59 UTC** every day, the pool is split among the top-100 players by Tournament Points

### Distribution tiers (60% of pool to top 100)
| Rank | Share of pool |
|------|---------------|
| #1 | 30% |
| #2 | 18% |
| #3 | 12% |
| #4-10 | 3.5% each |
| #11-30 | 0.5% each |
| #31-100 | ~0.07% each |

### Example
If the daily pool reaches **2 SOL**:
- #1 takes **0.6 SOL** (~$100)
- #2 takes **0.36 SOL**
- #100 still receives a small SKORA reward + Founder credit

### Why this works
- 🔥 **FOMO** — miss a day, miss a pool
- ⏰ **Hard deadline** — 23:59 UTC creates urgency
- 💎 **Real cash, not promises** — paid out today, not "at TGE"
- 📈 **Live counter** — players watch the pool grow during the day
- 🔗 **Transparent** — treasury wallet is verifiable on Solana Explorer

---

## 8. Seeker-Exclusive Tier

Owning a Solana Mobile Seeker unlocks **automatic benefits**:

1. **SGT verification bonus** — +5,000 ORB upon first wallet connect
2. **Premium leaderboard** — only SGT holders eligible for Daily SOL Pot prizes (after Season 1)
3. **`.skr` domain auto-display** — your Seeker ID becomes your in-game username
4. **SKR staking bonus** — additional ORB multiplier for SKR stakers
5. **Founders badge** — exclusive NFT at Season 1 launch

We track ownership via the SGT mint address (not the wallet) to prevent multi-account abuse while respecting Seed Vault portability.

---

## 9. Genesis Pre-Season

We are currently in **Genesis Pre-Season** — the first month of the game.

### What this means
- ✅ Game is fully playable on devnet
- ✅ All paid 0.01 SOL spins go into a transparent accumulating pool
- ❌ **No SOL payouts yet** — we accumulate for one month
- 🏛 **Every player who completes one paid spin becomes a "Founder" — forever**

### Founder benefits (lifetime)
- 2× ORB rewards on all gameplay
- Exclusive Founder NFT badge (minted at Season 1 launch)
- Priority on future SKORA airdrops
- Listed on the "Hall of Genesis" leaderboard forever

### Why a Pre-Season?
Honest answer: we need to accumulate enough SOL to make Season 1 prizes meaningful. Promising 10 SOL prizes on day 1 with 0 SOL in treasury would be a scam.

Instead we ask early players to **invest 5-50 cents** (in 0.01 SOL increments) during Pre-Season. In exchange they:
1. Help bootstrap the prize pool
2. Get a permanent 2× multiplier
3. Earn the right to be in the launch lineup of Season 1

The treasury wallet is **fully transparent**. You can verify the accumulated amount at any time on Solana Explorer.

---

## 10. Roadmap

### Phase 1 — Genesis Pre-Season (Current)
- ✅ All 6 mini-games shipped
- ✅ MWA wallet integration
- ✅ Paid 0.01 SOL spins on devnet
- ✅ SGT verification + Founder system
- ✅ Live prize pool tracking
- 🔄 Daily testing on real Seeker hardware

### Phase 2 — Season 1 Launch (Target: 30 days from Pre-Season start)
- Daily SOL Pot distribution (automated)
- Migrate to Solana mainnet
- Submit to Solana Mobile dApp Store
- Distribute Genesis pool to Pre-Season top-100
- Founder NFT mint

### Phase 3 — Growth (Months 2-3)
- PvP Arena with live opponents and ORB stakes
- Referral system (10% of friends' SOL spend)
- Push notifications (streak reminders, pot endings)
- Weekly SKORA airdrop snapshots
- Jackpot Wheel with cross-day accumulation

### Phase 4 — Tokenomics Activation (Months 3-6)
- ORB → SKORA on-chain claim flow
- SKR staking bonus integration
- Initial DEX liquidity for SKORA
- Seasonal tournaments with theme variations

### Phase 5 — Mature Ecosystem (Months 6+)
- NFT items (skins, upgrades, collectibles)
- Cross-game progression
- Guild system
- Tournament sponsorships

---

## 11. Tokenomics at a Glance

> A full economic model is in [`TOKENOMICS.md`](./TOKENOMICS.md). This is the executive summary.

**Revenue source**: 0.01 SOL per paid Wheel spin
**Pool growth driver**: more players × more spins × more days
**Player payback**: Daily SOL prizes + future SKORA value

### Conservative projection (Month 1)
- 500 active Seeker holders
- Average 30 paid spins/player/month
- = 15,000 spins × 0.01 SOL = **150 SOL accumulated**
- = ~$26,000 at SOL=$175

### Distribution at Season 1 launch
- 60% (90 SOL / $15,600) → Top-100 prizes
- 20% (30 SOL / $5,200) → SKORA airdrop pool
- 20% (30 SOL / $5,200) → Project treasury

### Long-term sustainability
The game economy is **player-funded by design**. We do not rely on token sales, VC rounds or speculative pumps. As long as Seeker owners want fun TPS activity with real prize potential, the game funds itself.

---

## 12. Why Trust This?

We deliberately built Seeker Quest League with **maximum transparency**:

| Component | Verification |
|-----------|--------------|
| Treasury wallet | Public address, verifiable on Solana Explorer |
| Every paid spin | Logged in Supabase with on-chain `tx_signature` |
| Prize distribution | Will use automated script — code published |
| Pool size | Read live from chain, not from our DB |
| SGT verification | Direct on-chain check via official SGT mint authority |
| SKORA mint | Public mint address, fixed supply |

**No promises about price action. No "we'll make you rich" claims. Just transparent economics and fun gameplay.**

---

## 13. Risks & Disclaimers

This litepaper describes a game in active development.

- **Devnet status** — Pre-Season runs on Solana devnet. Devnet SOL has no real-world value.
- **Mainnet migration risk** — When we move to mainnet, costs and rewards become real. Do not play with money you cannot afford to spend.
- **Smart contract risk** — Token contracts and distribution scripts are not audited yet.
- **Regulatory** — Cryptocurrency games may be restricted in your jurisdiction. You are responsible for compliance.
- **No financial advice** — SKORA, ORB and SOL prize pools are not investments. They are game economy mechanics.

By playing Seeker Quest League you acknowledge these risks.

---

## 14. Links & Contact

- **dApp Store listing**: *coming Season 1*
- **Solana Explorer (treasury)**: https://explorer.solana.com/address/EekTZsoxzVEdze1HEAqLQbMnx8ScBheWBW3Dsp9QBZDT?cluster=devnet
- **SKORA mint**: `3HTkC3v9CYTxGYQSegsidgzfxEQJvAotYZVozmaFc2av`
- **Genesis Pre-Season starts**: now
- **Season 1 launch**: June 22, 2026 (00:00 UTC)

---

*This document is a living artifact. As mechanics evolve and Season 1 approaches, this litepaper will be updated. The on-chain truth always supersedes anything written here.*

**Built by Seekers, for Seekers.**
