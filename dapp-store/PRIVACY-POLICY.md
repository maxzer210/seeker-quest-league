# Privacy Policy — Seeker Quest League

*Effective date: May 25, 2026*
*Last updated: May 25, 2026*

This Privacy Policy describes how **Seeker Quest League** ("the App", "we",
"our") collects, uses, and shares information when you use our mobile
application. By using the App, you agree to this Privacy Policy.

---

## 1. Information We Collect

We collect the **minimum information** needed to operate the game and run
fair tournaments.

### 1.1 Information You Provide
- **Username** — a public name you choose. Optional. Defaults to a random
  pseudonym (e.g. `Seeker#A1B2`).
- **Solana wallet address** — when you connect your Solana wallet via the
  Mobile Wallet Adapter (MWA). This is your public on-chain identifier.

### 1.2 Information Collected Automatically
- **Device identifier** — a randomly generated UUID stored locally on your
  device. Used to track your in-game progress (ORB balance, streak, level).
  This is **not** your Android Advertising ID and is **not** shared with
  third parties.
- **Game activity** — your in-game scores, tournament points, achievements.
- **First-session milestones** — a timestamp for each of a short, fixed list of
  steps the first time you reach them: app opened, language chosen, onboarding
  finished, first tap, first game, reached level 2, wallet connected, returned
  on a later day. One timestamp per step, recorded once and never changed. We
  use it to find where new players get stuck. It is first-party only — no
  third-party analytics SDK is present in the app, and this data is not shared
  or sold.
- **On-chain transactions** — when you make a paid Fortune Wheel spin
  (0.01 SOL), we record the transaction signature, payer wallet, and
  amount in our backend for prize-pool accounting. This data is also
  publicly verifiable on the Solana blockchain.

### 1.3 Information We Do NOT Collect
- ❌ Real name, address, phone number, email (unless you voluntarily
  contact our support email)
- ❌ Government ID, KYC information
- ❌ Contacts, photos, files, camera, microphone, location
- ❌ Browsing history outside the App
- ❌ Android advertising ID (AAID)
- ❌ Analytics tracking via Google, Facebook or other third-party SDKs

---

## 2. How We Use Information

- Operate game mechanics (ORB, levels, achievements, tournaments)
- Display tournament leaderboards (public usernames + scores)
- Process Solana SOL payments for paid game features
- Distribute SOL prizes to tournament winners
- Prevent multi-account abuse via SGT mint tracking (anti-sybil)
- Diagnose technical issues

---

## 3. How We Share Information

We **do not sell** your data to anyone.

We share information only:
- **Publicly on the Solana blockchain** — any transaction you sign
  (paid spins, prize claims) is publicly visible on Solana Explorer
- **Publicly on the leaderboard** — your username and score are visible
  to all players
- **With Supabase** — our backend service provider. Supabase stores game
  state, user profiles, and tournament scores under standard data-processing
  terms ([https://supabase.com/privacy](https://supabase.com/privacy))
- **When required by law** — if compelled by valid legal process

---

## 4. Data Storage & Security

- Game state is stored in our Supabase database (hosted in EU/US regions)
- On-chain data is stored permanently on the Solana blockchain
- Local device state (device ID, settings) is stored only on your phone
  via Android AsyncStorage
- We use HTTPS / TLS for all network communication

---

## 5. Cryptocurrency & Web3

The App integrates with the Solana blockchain. Please understand:

- We **never** have access to your private keys, seed phrase, or wallet
  funds. All signing happens locally in your wallet app via Mobile Wallet
  Adapter.
- All on-chain transactions are **public, immutable, and final**. We
  cannot reverse them.
- Cryptocurrency prizes (SOL, SKORA) have variable real-world value. We
  make no guarantees about future value.
- Genesis Pre-Season runs on Solana **devnet**. Devnet SOL has no
  real-world value. Mainnet migration is planned for Season 1.

---

## 6. Children's Privacy

The App is not directed to children under 13. We do not knowingly collect
information from anyone under 13. Cryptocurrency mechanics also make this
App unsuitable for minors in most jurisdictions.

---

## 7. Your Rights

You may:
- **Stop playing at any time** — uninstall the App to remove local data
- **Disconnect your wallet** — go to Profile → Wallet → Disconnect
- **Request data deletion** — email us at support@seekerquest-league.com with your
  device ID. We will delete your records within 30 days. Note: on-chain
  transactions cannot be deleted.

---

## 8. Changes to This Policy

We may update this policy. Material changes will be announced in the App
and on our website. Continued use after changes means acceptance.

---

## 9. Contact

Questions about this policy:
**support@seekerquest-league.com**

Project website:
**https://seekerquest-league.com**

---

*This Privacy Policy is published publicly to satisfy Solana Mobile dApp
Store and Google Play Store requirements. It is the authoritative
description of our data practices.*
