<div align="center">

# 🌌 Seeker Quest League

### *The first tap-to-earn league for Solana Mobile Seeker*

[![Solana](https://img.shields.io/badge/Solana-Devnet-9945FF?style=for-the-badge&logo=solana&logoColor=white)](https://solana.com)
[![Seeker](https://img.shields.io/badge/Solana_Mobile-Seeker-EC4899?style=for-the-badge)](https://solanamobile.com/seeker)
[![React Native](https://img.shields.io/badge/React_Native-0.81-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://reactnative.dev)
[![Expo](https://img.shields.io/badge/Expo-SDK_54-000020?style=for-the-badge&logo=expo&logoColor=white)](https://expo.dev)
[![TypeScript](https://img.shields.io/badge/TypeScript-Strict-3178C6?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org)
[![License](https://img.shields.io/badge/License-Proprietary-FACC15?style=for-the-badge)](#license)

**Tap. Earn. Win SOL.**

[Features](#-features) · [Games](#-7-mini-games) · [Tech Stack](#-tech-stack) · [Roadmap](#-roadmap) · [Contact](#-contact)

</div>

---

## 🎯 What is Seeker Quest League?

**Seeker Quest League** is a Web3 mobile gaming experience exclusively built for the
**Solana Mobile Seeker** phone. Players tap the central orb to earn **ORB** in-game currency,
compete in 7 mini-games, and win real **SOL** prizes from a live-growing prize pool.

The app is designed around **fair, transparent Web3 mechanics**:
- All payments are on-chain Solana transactions
- Prize pool is publicly verifiable on Solana Explorer
- No KYC, no ads tracking, no Google Analytics
- Founders (early players) get a permanent **2× ORB multiplier**

---

## ✨ Features

### 🎮 Core Gameplay
- 🌌 **Tap-to-earn** central orb mechanic with energy system
- 🔥 **Combo + Boost** multipliers (up to ×15 with crits)
- 📜 **Daily Quests** rotation with ORB rewards
- 🔥 **Streak system** with optional shields (3-day → 7-day rewards)

### 💎 Web3
- 🔗 **Mobile Wallet Adapter (MWA)** integration
- 💰 **SOL payments** for premium features (0.01 – 0.05 SOL)
- 🪙 **SKORA SPL Token** — convert 10,000 ORB → 1 SKORA
- 🏛️ **Genesis Pre-Season** with growing prize pool (60% top-100 prizes, 20% SKORA airdrop, 20% treasury)
- 🌐 **Solana devnet** (Pre-Season) → **mainnet** at Season 1 launch

### 🛍 In-app Economy
- **Standard upgrades** (Signal, Crit, Wheel Luck, Horse Power) — pay in ORB
- **Premium items** — tiered SOL pricing:
  - 🛡 Shield Pack — `0.01 SOL`
  - 🔥 Mega Boost — `0.02 SOL`
  - ⬆ Instant Level — `0.03 SOL`
  - 💎 Mega Bundle — `0.05 SOL`

### 🌐 Localization
- 5 fully translated languages: **English · Русский · 中文 · 日本語 · Français**
- 200+ translation keys covering all UI and game text

### 🏆 Competition
- 🏆 Season Tournament with **SOL prize pool** for top-100
- ⚔️ Live PvP tap battles with ORB stakes
- 🥇 Public leaderboards
- 🏛️ Founder NFT for early participants

### 🎨 UX Polish
- ✨ Lottie splash animation
- 🎬 4-screen onboarding tutorial
- 🌑 Cyberpunk × galaxy × neon visual style
- 🎵 Spatial sound design (tap, crit, jackpot, level-up)

---

## 🎲 7 Mini-Games

| Game | Icon | Mechanic | Max Reward |
|------|:----:|----------|------------|
| **Fortune Wheel** | 🎰 | Spin a probability wheel — 3 free per day or pay 0.01 SOL | up to **50,000 ORB** |
| **Space Runner** | 🚀 | Dodge falling asteroids, collect gems, build near-miss combos | up to **500 ORB / run** |
| **PvP Arena** | ⚡ | 30-second live tap battles, stake ORB vs opponent | up to **9,500 ORB** |
| **Seeker Arena** | ⚔️ | Raid opponent bases, build defense, climb the tower | up to **5,000 ORB** |
| **Horse Race** | 🐎 | Tap to make your horse gallop — first to finish wins | **+500 ORB / race** |
| **Treasure Hunt** | 📦 | Explore the grid, find chests, beat the timer | up to **1,000 ORB** |
| **Seeker Lands** | 🌾 | Passive ORB generation — upgrade buildings, harvest crops | **600 ORB / hour** |

---

## 🛠 Tech Stack

### Frontend
- **React Native** 0.81 with **Expo SDK 54**
- **TypeScript** (strict mode, 0 errors)
- **Reanimated** + native Animated for 60fps animations
- **Lottie React Native** for splash/celebration animations
- **Linear Gradient** for cyberpunk visuals

### Web3
- **@solana/web3.js** + **@solana-mobile/mobile-wallet-adapter**
- **@solana/spl-token** for SKORA token operations
- **seeker-sdk** for SGT verification + .skr resolution (lazy-loaded)

### Backend
- **Supabase** (Postgres + Realtime + RLS)
  - Player profiles, scores, achievements
  - Tournament leaderboard
  - Ad campaigns
  - PvP match coordination
  - SKORA claim queue
  - On-chain payment receipts

### Native
- **Android Gradle Plugin** 8 with **gradlew assembleRelease**
- **Java keystore** signing (`seeker-release.keystore`, gitignored)

### Tooling
- **Expo CLI** for dev / EAS for cloud builds (when quota allows)
- **patch-package** for `@supabase/supabase-js` compatibility fix
- **dApp Store CLI** for Solana Mobile dApp Store submissions

---

## 📁 Project Structure

```
seeker-quest-league/
├── App.tsx                      # Main app (~3000 lines, 14 screens)
├── ParticleSystem.tsx           # Particle effects
├── StarField.tsx                # Background stars
│
├── components/                  # All game components
│   ├── FortuneWheel.tsx
│   ├── SpaceRunner.tsx
│   ├── HorseRace.tsx
│   ├── Arena.tsx
│   ├── TreasureHunt.tsx
│   ├── SeekerLands.tsx
│   ├── PvPArena.tsx
│   ├── Tournament.tsx
│   ├── EarnHub.tsx              # Sponsored ads + SKORA convert
│   ├── SKORAWallet.tsx          # Token claim interface
│   ├── GenesisNews.tsx          # Pre-Season status
│   ├── Onboarding.tsx           # 4-screen first-launch tutorial
│   └── ...
│
├── lib/                         # Core logic
│   ├── i18n.ts                  # 5 languages, 200+ keys
│   ├── solanaMobile.ts          # All SOL prices + payment helpers
│   ├── supabase.ts              # Backend client
│   ├── skora.ts                 # SPL token operations
│   ├── genesis.ts               # Pre-Season config
│   ├── pvp.ts                   # Match coordination
│   ├── ads.ts                   # Sponsored campaigns
│   ├── theme.ts                 # NFT skin themes
│   ├── notifications.ts         # Local push reminders
│   └── ...
│
├── assets/                      # Static media
│   ├── splash-orb.json          # Lottie launch animation
│   ├── icon.png                 # App icon
│   └── sounds/                  # Tap, crit, jackpot, level-up
│
├── dapp-store/                  # Solana dApp Store submission
│   ├── config.yaml              # Publisher metadata
│   ├── privacy.html             # Privacy policy (deploys to web)
│   ├── STORE-DESCRIPTIONS.md    # Listing copy
│   ├── ADVERTISER-GUIDE.md      # B2B onboarding
│   └── SUBMISSION-GUIDE.md      # CLI workflow
│
├── android/                     # Native Android project
├── scripts/                     # Token mint, prize distribution
└── supabase-*.sql               # Database schemas
```

---

## 🚀 Quick Start

### Prerequisites
- **Node.js** ≥ 20
- **Android Studio** + **JDK 17**
- **Android SDK** (build-tools 35.0.0)
- **Solana CLI** (for keypair generation)
- **Solana Seeker device** for full testing (emulator works for UI)

### Install
```bash
git clone https://github.com/maxzer210/seeker-quest-league.git
cd seeker-quest-league
npm install
```

### Configure environment
Create the following files (NOT committed):

**`skora-config.json`** — SKORA mint authority keypair (sensitive!)
**`credentials.json`** — EAS build credentials
**`seeker-release.keystore`** — Android signing key

### Run dev
```bash
npm start        # Expo dev server
npm run android  # Build + install debug to connected device
```

### Build release APK
```bash
cd android
./gradlew assembleRelease --no-daemon
# Output: android/app/build/outputs/apk/release/app-release.apk
```

### Type check
```bash
npx tsc -p tsconfig.json --noEmit --skipLibCheck
```

---

## 💰 Token Economy

### ORB (in-game)
- Earned by tapping, playing mini-games, watching ads, winning tournaments
- Used for upgrades and standard shop items
- 1 ORB = no real-world value, in-game only

### SKORA (SPL token on Solana)
- **Mint:** `3HTkC3v9CYTxGYQSegsidgzfxEQJvAotYZVozmaFc2av` (devnet)
- **Decimals:** 6
- **Total supply:** 1,000,000,000 SKORA
- **Exchange rate:** 10,000 ORB → 1 SKORA
- **Network:** Solana devnet (Pre-Season) → mainnet at Season 1

### SOL (real money)
- Paid for premium features (0.01–0.05 SOL)
- Won as Season tournament prizes (top-100 split 60% of pool)
- 100% non-custodial — keys never leave your wallet

---

## 🗺 Roadmap

### ✅ Phase 0 — Genesis Pre-Season (Q1–Q2 2026)
- Devnet deployment
- All 7 games live
- Prize pool accumulation
- Founder status unlock
- 5-language support
- dApp Store submission

### 🟡 Phase 1 — Season 1 (Q2 2026)
- Mainnet migration
- Prize distribution (60% of pool to top-100)
- SKORA airdrop activation
- Founder NFT mint

### ⚪ Phase 2 — Season 2 (Q4 2026)
- New mini-games
- NFT skin marketplace
- Guild / team features
- Expanded SKORA utility

### ⚪ Phase 3 — Decentralization (2027+)
- DAO governance for prize splits
- Community-built games
- Cross-chain bridges

See [`ROADMAP.md`](./ROADMAP.md) for the long-form vision.

---

## 🔐 Security

This repository follows strict secret-hygiene rules:

- ❌ **Never commit:** `credentials.json`, `*.keystore`, `skora-config.json`, `publisher.json`
- ❌ **Never commit:** `.env*.local`, `.mcp.json`, build logs
- ✅ **Use Mobile Wallet Adapter** — private keys never leave the user's wallet app
- ✅ **HTTPS-only** Supabase and Solana RPC
- ✅ **Anti-sybil** via Seeker Genesis Token (SGT) verification

For responsible disclosure of security vulnerabilities, email **adsskora@gmail.com** with the subject `[SECURITY]`.

---

## 📜 Documentation

- [`LITEPAPER.md`](./LITEPAPER.md) — full project vision
- [`TOKENOMICS.md`](./TOKENOMICS.md) — SKORA economy
- [`ROADMAP.md`](./ROADMAP.md) — long-term plan
- [`HANDOFF.md`](./HANDOFF.md) — current development status
- [`WEBSITE-BRIEF.md`](./WEBSITE-BRIEF.md) — landing site spec
- [`dapp-store/SUBMISSION-GUIDE.md`](./dapp-store/SUBMISSION-GUIDE.md) — publishing workflow
- [`dapp-store/STORE-DESCRIPTIONS.md`](./dapp-store/STORE-DESCRIPTIONS.md) — listing copy
- [`dapp-store/ADVERTISER-GUIDE.md`](./dapp-store/ADVERTISER-GUIDE.md) — B2B onboarding
- [`dapp-store/PRIVACY-POLICY.md`](./dapp-store/PRIVACY-POLICY.md) — privacy policy
- [`CLAUDE.md`](./CLAUDE.md) — agent context

---

## 📊 Stats

| Metric | Value |
|--------|------:|
| App.tsx lines | ~3,000 |
| Components | 17 |
| Mini-games | 7 |
| Languages | 5 |
| i18n keys | 200+ |
| TypeScript errors | 0 |
| Solana SDK version | 1.95 |
| Expo SDK | 54 |
| React Native | 0.81 |

---

## 🤝 Contributing

This is currently a **closed-source** proprietary project.
Public contributions will open after Season 1 mainnet launch.

For partnership inquiries (advertising, integrations, investments), contact **adsskora@gmail.com**.

---

## 📬 Contact

| Channel | Where |
|---------|-------|
| 📧 Email | [adsskora@gmail.com](mailto:adsskora@gmail.com) |
| 🌐 Website | [seekerquest.league](https://seekerquest.league) *(soon)* |
| 🐦 X / Twitter | *(soon)* |
| 💬 Telegram | *(soon)* |

---

## 📄 License

Copyright © 2026 Seeker Quest League.
**All rights reserved.** Proprietary software.

Code, assets, branding, and game mechanics are the exclusive property of the project owner.
Unauthorized reproduction, modification, or distribution is prohibited.

For licensing inquiries: **adsskora@gmail.com**

---

<div align="center">

**Built for Solana Mobile · Powered by Solana**

⭐ *If you're a Seeker owner, the dApp Store listing is coming soon.* ⭐

</div>
