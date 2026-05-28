# Screenshots Plan — Seeker Quest League

dApp Store accepts up to **10 portrait screenshots**. We use **8**.
Each screenshot should tell a story without needing the description.

---

## Required specs

| Property | Value |
|----------|-------|
| **Orientation** | Portrait |
| **Aspect ratio** | 9:16 |
| **Recommended size** | 1080 × 1920 px |
| **Min size** | 360 × 640 px |
| **Format** | PNG (preferred) or JPG |
| **Max size per file** | 2 MB |
| **Total count** | 3–10 (we use 8) |

---

## How to take screenshots

### On Seeker phone:
1. Install the latest APK
2. Power + Volume Down to capture
3. Find files in `Internal Storage → Pictures → Screenshots`
4. Transfer to PC via USB or Telegram

### Alternative — Android Emulator with same APK:
- Slightly cleaner status bar
- Easier to crop precisely

---

## The 8 screenshots — sequence and what to show

### 1. `01-home-genesis-pre-season.png` — HERO SHOT
**Screen:** Home (default)
**Setup:**
- Make sure Genesis banner is visible at top
- Streak chip should show 3+ days for credibility
- ORB balance ≥ 5,000 (visible value)
**Caption overlay (optional, add in Figma):**
> "🏛 Be a Genesis Founder.
> Real SOL prizes. Real wallets. Real game."

### 2. `02-fortune-wheel.png` — MONETIZATION
**Screen:** Games → Fortune Wheel
**Setup:**
- Wheel visible with all reward icons
- Paid spin button visible: "0.01 SOL"
- Some animation frozen at mid-spin if possible
**Caption:**
> "🎰 Spin for ORB, SKORA, jackpots.
> 80% of every spin grows today's pool."

### 3. `03-horse-race.png` — FUN GAMEPLAY
**Screen:** Games → Horse Race (mid-race)
**Setup:**
- Both lanes visible with horses + jockeys
- Timer showing 5-8 seconds (tension)
- Player horse slightly ahead
**Caption:**
> "🐎 15 seconds of tap-mashing chaos."

### 4. `04-space-runner.png` — VISUAL APPEAL
**Screen:** Games → Space Runner (mid-game)
**Setup:**
- Ship visible with shield ring
- Multiple asteroids on screen, different colors
- ALT/TIME counter showing 30+ seconds
- ORB multiplier badge
**Caption:**
> "🚀 Dodge endless asteroids. Earn ORB per second."

### 5. `05-arena.png` — DEPTH
**Screen:** Games → Arena (BASE tab with buildings)
**Setup:**
- All 4 buildings visible with levels
- pendingOrb showing collectible income
- "СОБРАТЬ" or "COLLECT" button highlighted
**Caption:**
> "⚔️ Build your base. Raid rivals."

### 6. `06-genesis-news-pool.png` — KILLER FEATURE
**Screen:** News tab (Genesis screen)
**Setup:**
- Countdown visible (days/hrs/min/sec)
- Live SOL pool counter showing real value (1.2+ SOL)
- Pre-season leaderboard visible
**Caption:**
> "💰 Watch the pool grow live on-chain.
> Top players win SOL when the season ends."

### 7. `07-profile-seeker-verified.png` — EXCLUSIVITY
**Screen:** Profile
**Setup:**
- Wallet connected (MWA Connected badge)
- SEEKER VERIFIED card visible with .skr domain
- Founder badge "+5000 ORB" tag
- Stats: ORB, LEVEL, STREAK, PTS all populated
**Caption:**
> "🟣 Seeker holders unlock the premium tier.
> Auto-detected. No setup needed."

### 8. `08-tournament-podium.png` — COMPETITION
**Screen:** Tournament
**Setup:**
- Top 3 podium visible with medals
- Prize pool count visible
- Countdown ticking
- Score rules cards visible below
**Caption:**
> "🏆 Compete daily. Top 100 win SOL.
> Season 1 starts June 22, 2026."

---

## Optional alternatives (if any of the above is hard to capture)

### Alt A. `99-onboarding.png`
**Screen:** First-launch onboarding slide #1 or #4
- Shows the "SEEKER QUEST" title with shimmer animation
- Good for first impression but takes a slot that could show gameplay

### Alt B. `99-skora-claim.png`
**Screen:** SKORA Wallet — after ORB → SKORA conversion is live
- Shows the conversion screen and SKORA balance
- Best to save for post-launch update

### Alt C. `99-paid-spin-success.png`
**Screen:** Fortune Wheel right after a winning paid spin
- WinCelebration confetti overlay visible
- Big number "+5,000 ORB"

---

## Banner & Feature Graphic

In addition to screenshots, dApp Store requests:

### `banner-1200x600.png` (1200 × 600)
- Used as the wide hero image on the listing
- Suggested content:
  - Left: S logo with neon glow
  - Center: "SEEKER QUEST LEAGUE"
  - Subtitle: "Daily SOL Tournaments · Built for Seeker"
  - Right: small phone mockup with Genesis banner visible

### `feature-graphic-1024x500.png` (1024 × 500)
- Similar to banner but slightly different aspect
- Same content, recropped

### `app-icon-512.png` (512 × 512)
- Use the existing `assets/icon.png` (already 1024×1024, resize to 512)
- Round-cropped automatically by store

### `tile-512x512.png` (512 × 512)
- Compact tile shown in store grids
- Same as app-icon-512 but tighter crop if needed

### `publisher-icon.png` (256 × 256 minimum)
- Cryptonoframe brand icon
- Can be a simplified version of the S logo

---

## Where to save final assets

```
C:\sk\dapp-store\media\
├── app-icon-512.png
├── publisher-icon.png
├── banner-1200x600.png
├── feature-graphic-1024x500.png
├── tile-512x512.png
├── app-release.apk            ← copy from android/app/build/outputs/apk/release/
└── screenshots\
    ├── 01-home-genesis-pre-season.png
    ├── 02-fortune-wheel.png
    ├── 03-horse-race.png
    ├── 04-space-runner.png
    ├── 05-arena.png
    ├── 06-genesis-news-pool.png
    ├── 07-profile-seeker-verified.png
    └── 08-tournament-podium.png
```

Paths in `config.yaml` already reference these names — don't rename without updating the YAML.

---

## Quick capture checklist

- [ ] Connect Seeker to PC via USB or use Telegram for transfer
- [ ] Install latest APK (`C:\sk\android\app\build\outputs\apk\release\app-release.apk`)
- [ ] Play a few rounds to get realistic data (ORB > 5000, streak > 1)
- [ ] Connect wallet via MWA before capturing screenshots 6, 7
- [ ] Capture all 8 screens
- [ ] Transfer to `C:\sk\dapp-store\media\screenshots\`
- [ ] (Optional) Add caption overlays in Figma/Photoshop for store impact
- [ ] Generate banner and feature graphics
- [ ] Copy final APK to `C:\sk\dapp-store\media\app-release.apk`

When all assets are in place — we're ready to run `npx dapp-store create release`.
