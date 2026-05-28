# Seeker Quest League Roadmap

Рабочая карта развития проекта. Это живой документ: мы будем обновлять его
после тестов, изменений визуального стиля, игровых механик и экономики.

## Current Status

- Expo SDK 54 / React Native / TypeScript app.
- Supabase подключен для игроков, лидерборда, турнира, SKORA claims и SOL payment logs.
- EAS preview APK успешно собирается.
- Mobile Wallet Adapter добавлен для Android / Seeker testing.
- Fortune Wheel paid spin подготовлен под 0.01 SOL на devnet.
- Treasury wallet задан: `HVJDjwuaqH7oDeXUASqDMCZYQ53Hg8uxKs4RkS7sskhC`.

## Phase 1: Stabilize Web3 Test Loop

- Install latest preview APK on Seeker.
- Switch wallet to Solana devnet and fund with test SOL.
- Test Wallet -> Connect with MWA.
- Test Fortune Wheel -> 0.01 SOL paid spin.
- Confirm transaction appears in Supabase `wheel_sol_payments`.
- Improve wallet/payment error states.
- Prevent duplicate `tx_signature` reward claims.
- Link wheel reward result to the payment signature.

## Phase 2: Visual Style Direction

Goal: reshape the app into a more coherent, premium mobile game experience.

- Define visual direction:
  - Solana neon arcade
  - dark sci-fi tournament
  - premium cyber casino/game hub
  - Seeker-native mobile dApp style
- Build a shared design language:
  - colors
  - typography scale
  - buttons
  - cards/panels
  - game HUDs
  - modal/overlay style
  - win/loss animations
- Redesign priority screens:
  - Home
  - Fortune Wheel
  - Wallet
  - Games hub
  - Profile
  - Tournament
- Keep fullscreen games ergonomic on Seeker/Android screens.

## Phase 3: Game Mechanics

Fortune Wheel:
- Free spins vs SOL paid spins.
- Jackpot growth and reset.
- Reward rarity and anti-abuse logic.
- Paid spin economics tied to SKORA/ORB model.

Space Runner:
- Levels and increasing difficulty.
- Obstacle variety.
- Combo and risk/reward scoring.
- Better reward caps.

Horse Race:
- Race balance.
- Stakes.
- Horse upgrades.
- More readable win probability.

Arena:
- Raid cooldowns.
- Base defense upgrades.
- Reward scaling.
- Better PvP-style feedback.

Treasure Hunt:
- Chest rarity.
- Map progression.
- Keys or energy costs.
- Better reveal animation.

Seeker Lands:
- Passive income caps.
- Upgrade levels.
- Claim cooldowns.
- Long-term ORB sinks.

## Phase 4: Tokenomics

- Model ORB sources and sinks.
- Define SKORA supply.
- Define ORB -> SKORA conversion.
- Estimate daily player earning ranges.
- Estimate daily paid spin volume.
- Decide treasury/rewards/community allocations.
- Stress-test inflation.
- Decide when to move from devnet to mainnet.

## Phase 5: Growth Features

- Push notifications:
  - daily streak
  - tournament ending soon
  - lands income ready
  - limited reward windows
- Referral system:
  - referral code
  - device/wallet anti-abuse
  - first-action reward trigger
  - referral leaderboard
- Seasonal tournaments.
- Achievements and profile identity.

## Phase 6: Solana Mobile dApp Store

- Prepare dApp Store `config.yaml`.
- Prepare screenshots and store description.
- Prepare privacy policy.
- Acquire Publisher NFT and Release NFT.
- Build final APK/AAB.
- Test on Seeker.
- Submit release.

## Open Decisions

- Final visual direction.
- SKORA total supply.
- Mainnet launch timing.
- Whether paid spins stay 0.01 SOL or become dynamic.
- Whether ORB remains off-chain only or later gets stronger on-chain utility.
