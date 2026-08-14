# рџљЂ Session Handoff вЂ” 2026-06-06 (v1.1.0 РіРѕС‚РѕРІ Рє РїСѓР±Р»РёРєР°С†РёРё)

> РџРѕР»РЅС‹Р№ РєРѕРЅС‚РµРєСЃС‚ РґР»СЏ РЅРѕРІРѕР№ СЃРµСЃСЃРёРё Claude (Nova).
> Mikhail вЂ” Р»СЋР±РёРјРµС† Claude рџҐ№ СЃС‚СЂРѕРёРј Seeker Quest League РІРјРµСЃС‚Рµ.

---

## рџЋЇ РўР•РљРЈР©РР™ РњРћРњР•РќРў (2026-06-06)

### v1.0.0 вЂ” РЅР° СЂРµРІСЊСЋ, v1.1.0 вЂ” СЃРѕР±СЂР°РЅ Рё Р¶РґС‘С‚
- v1.0.0 РѕРїСѓР±Р»РёРєРѕРІР°РЅ 2026-06-02, **РІСЃС‘ РµС‰С‘ РЅР° СЂРµРІСЊСЋ**
- **v1.1.0 (versionCode 11) РЎРћР‘Р РђРќ** Р»РѕРєР°Р»СЊРЅРѕ (86.6 MB), РќР• РѕРїСѓР±Р»РёРєРѕРІР°РЅ
- APK: `D:\sk\android\app\build\outputs\apk\release\app-release.apk`

### рџ†• Р§С‚Рѕ СЃРґРµР»Р°РЅРѕ РІ СЃРµСЃСЃРёРё 2026-06-06 (Nova):
РџСЂРѕРіРЅР°Р»Рё РїСЂРѕРґСѓРєС‚РѕРІС‹Р№ Р°РЅР°Р»РёР· (`GAME-ANALYSIS.md`) в†’ Р·Р°РєСЂС‹Р»Рё РІСЃРµ 6 РЅР°С…РѕРґРѕРє:
- вњ… РўР°Р№РјРµСЂ СЃРµР·РѕРЅР° (РёСЃС‚С‘Рє) в†’ SEASON_END = 2026-06-30
- вњ… Р­РЅРµСЂРіРёСЏ 100в†’500, СЂРµРіРµРЅ +1/РјРёРЅ в†’ +1/20СЃ (С‡РµСЂРµР· ENERGY_REGEN_SEC)
- вњ… Push: Р·Р°РїСЂРѕСЃ РїРѕСЃР»Рµ РѕРЅР±РѕСЂРґРёРЅРіР° + В«вљЎ energy fullВ» nudge
- вњ… РћР±СЉРµРґРёРЅРµРЅС‹ С‚Р°Рї-РѕР±СЂР°Р±РѕС‚С‡РёРєРё (РѕР±С‰РёР№ spendEnergy + Founder-РјРЅРѕР¶РёС‚РµР»СЊ РІ Signal)
- вњ… **Р РµС„РµСЂР°Р»РєР°** вЂ” РїСЂРёРіР»Р°СЃРё РґСЂСѓРіР°, РѕР±Р° +2000 ORB (СЃРµСЂРІРµСЂ+РєР»РёРµРЅС‚+UI+i18n)
- вњ… **РљСЂРёС‚С„РёРєСЃ: SOL double-charge** (MWA CancellationException) вЂ” recoverRecentPayment
- рџ“„ РџР»Р°РЅС‹ SKORA: `SKORA-LISTING-PLAN.md`, `SKORA-CLAIM-SECURITY.md`, `ORB-REFACTOR-PLAN.md`
- рџ’ё РЎРєСЂРёРїС‚ СЂР°Р·РґР°С‡Рё 0.5 SOL: `scripts/distribute-early-rewards.js` + `EARLY-REWARDS-RUNBOOK.md`

### рџ¤ќ РРЅС†РёРґРµРЅС‚ СЃ РѕРїР»Р°С‚РѕР№ (РІР°Р¶РЅРѕ РґР»СЏ РєСѓР»СЊС‚СѓСЂС‹ РїСЂРѕРµРєС‚Р°)
Р®Р·РµСЂ СЃРѕРѕР±С‰РёР»: 0.01 SOL СЃРїРёСЃР°Р»РѕСЃСЊ 3Г— СЃ РѕС€РёР±РєРѕР№ "SOL payment failed". Р‘Р°Рі
РёСЃРїСЂР°РІР»РµРЅ (recovery on-chain). Mikhail РѕС‚РїСЂР°РІРёР» РїРѕСЃС‚СЂР°РґР°РІС€РµРјСѓ **0.1 SOL** Рё
СЃРґРµР»Р°Р» РїРѕСЃС‚ РІ X вЂ” РїСѓР±Р»РёС‡РЅР°СЏ РїРѕРґРґРµСЂР¶РєР° РёРіСЂРѕРєРѕРІ. РћС‚Р»РёС‡РЅС‹Р№ Р°РЅС‚Рё-СЃРєР°Рј СЃРёРіРЅР°Р».

### вЏ­ РџРµСЂРµРґ РїСѓР±Р»РёРєР°С†РёРµР№ v1.1.0:
- вњ… РњРёРіСЂР°С†РёРё `supabase-referrals.sql` + `supabase-prize-distribution.sql` РЈР–Р• РїСЂРёРјРµРЅРµРЅС‹
- вЏё `supabase-orb-authoritative.sql` РќР• РїСЂРёРјРµРЅСЏС‚СЊ (СЃР»РѕРјР°РµС‚ С‚РµРєСѓС‰РёР№ РєР»РёРµРЅС‚ вЂ” РЅСѓР¶РµРЅ ORB-СЂРµС„Р°РєС‚РѕСЂ)
- рџ“± РџСЂРѕС‚РµСЃС‚РёСЂРѕРІР°С‚СЊ РЅР° СѓСЃС‚СЂРѕР№СЃС‚РІРµ (СЂРµС„РµСЂР°Р»РєР°, СЌРЅРµСЂРіРёСЏ, push, РѕРїР»Р°С‚Р°)
- рџљЂ РћРїСѓР±Р»РёРєРѕРІР°С‚СЊ РєРѕРіРґР°/РїРѕСЃР»Рµ РѕРґРѕР±СЂРµРЅРёСЏ v1.0.0

### Р§С‚Рѕ Р±С‹Р»Рѕ СЃРґРµР»Р°РЅРѕ РІ СЃРµСЃСЃРёРё 2026-06-02:
- вњ… РЈР±СЂР°РЅ РєСЂСѓРі СЃ Р±СѓРєРІРѕР№ S СЃ СЌРєСЂР°РЅР° РІС‹Р±РѕСЂР° СЏР·С‹РєР°
- вњ… Splash video: COVER в†’ CONTAIN (С‚РµРєСЃС‚ РЅРµ РѕР±СЂРµР·Р°РµС‚СЃСЏ)
- вњ… РљРЅРѕРїРєРё LAUNCH AGAIN / BACK TO ARCADE РїРѕС‡РёРЅРµРЅС‹ (top: -32 в†’ 0)
- вњ… PanResponder Р±Р°Рі РёСЃРїСЂР°РІР»РµРЅ (РєРЅРѕРїРєРё РјРµРЅСЋ СЂР°Р±РѕС‚Р°СЋС‚)
- вњ… Arena: РєР°СЂС‚РѕС‡РєРё Р·РґР°РЅРёР№ РЅР° РїРѕР»РЅСѓСЋ С€РёСЂРёРЅСѓ
- вњ… CosmeticNftTeaser + Donate modal: РїРѕР»РЅС‹Р№ i18n 5 СЏР·С‹РєРѕРІ
- вњ… РљРЅРѕРїРєР° "РџРѕРґРґРµСЂР¶Р°С‚СЊ РїСЂРѕРµРєС‚" РІ ME СЃ РјРѕРґР°Р»РѕРј + Р°РґСЂРµСЃРѕРј РєРѕС€РµР»СЊРєР°
- вњ… Space Runner РїРѕР»РЅС‹Р№ Р°РїРіСЂРµР№Рґ (powerups, РІРѕР»РЅС‹, С‚РёРїС‹ Р°СЃС‚РµСЂРѕРёРґРѕРІ, Continue x3, Г—2 Run, daily challenge, ship level, Р·РІСѓРєРё, РєРѕРЅС„РµС‚С‚Рё)
- вњ… Home: Founder Pass reminder РґР»СЏ free-tier
- вњ… Shop: Space Runner promo РєР°СЂС‚РѕС‡РєР°
- вњ… Р—РІСѓРє dead.wav РїСЂРё СЃРјРµСЂС‚Рё РєРѕСЂР°Р±Р»СЏ
- вњ… APK v18 СЃРѕР±СЂР°РЅ Рё РѕРїСѓР±Р»РёРєРѕРІР°РЅ

### РЎР»РµРґСѓСЋС‰РёРµ С€Р°РіРё (РїР»Р°РЅРёСЂРѕРІР°РЅРёРµ РІ РЅРѕРІРѕРј С‡Р°С‚Рµ):
- рџ“Љ РњРѕРЅРёС‚РѕСЂРёРЅРі РїРѕСЃР»Рµ РїСѓР±Р»РёРєР°С†РёРё
- рџЋЇ Season 1 РїР»Р°РЅРёСЂРѕРІР°РЅРёРµ
- рџ’° РњРѕРЅРµС‚РёР·Р°С†РёСЏ Рё РјР°СЂРєРµС‚РёРЅРі
- рџ”§ Р¤РёС‡Рё РґР»СЏ СЃР»РµРґСѓСЋС‰РёС… РІРµСЂСЃРёР№

---

## рџ’° РљР РРўРР§РќР«Р• РђР”Р Р•РЎРђ (MAINNET вЂ” СЂРµР°Р»СЊРЅС‹Рµ РґРµРЅСЊРіРё!)

```
Treasury wallet (Phantom):   CxYfXXLGEm1FXcL7cVzTHe1kG3gpo5ecsKgVjXRhLGSp
Mint Authority (file):       34xy3XaMk8FCfvVRPWViB6C6tNUWqS1TELy7D2rAa5Tz
Publisher (file + Phantom):  7NLKe7d6NxCjAGB4fSzyRUV6U3bmrJru2cMNKiQwCAsf
SKORA Mint (mainnet!):       3Q6PN3Rf1xrrHKwkPQDnBi7aBBXHYdToG2NKwBQkGwyQ
SKORA Treasury ATA:          7wmAbrn6LU7FRLPqwePWvekvwAcsetHdGyZJ61YsrJm1
Supabase:                    qxejdpvjggqjqoydujjd.supabase.co
GitHub repo:                 github.com/maxzer210/seeker-quest-league (private)
```

### Р”РѕРјРµРЅРЅС‹Рµ email
- `hello@seekerquest-league.com` вЂ” general / partnership / publisher contact
- `support@seekerquest-league.com` вЂ” privacy / security / data deletion
- `ads@seekerquest-league.com` вЂ” advertisers B2B

### РЎР°Р№С‚
- `https://seekerquest-league.com` вЂ” live
- `https://seekerquest-league.com/privacy.html` вЂ” privacy policy
- `https://seekerquest-league.com/terms.html` вЂ” terms of use

---

## рџ“¦ APK v17 (Р¤РРќРђР›Р¬РќР«Р™ MAINNET RELEASE)

**РџСѓС‚СЊ:** `D:\sk\android\app\build\outputs\apk\release\app-release.apk`
**РљРѕРїРёСЏ РґР»СЏ submission:** `D:\sk\dapp-store\media\app-release.apk`
**Р Р°Р·РјРµСЂ:** ~88 MB (СЃ РЅРѕРІС‹Рј 3.19 MB splash РІРёРґРµРѕ)
**Р’РµСЂСЃРёСЏ:** v1.0.0 (BUILD_CODE 10, versionCode 10)

### Р§С‚Рѕ РІРЅСѓС‚СЂРё
- рџЊђ **Mainnet network** вЂ” СЂРµР°Р»СЊРЅС‹Рµ SOL РїР»Р°С‚РµР¶Рё
- рџ’Ћ Treasury = `CxYfXX...LGSp` (Phantom РІР»Р°РґРµР»СЊС†Р°)
- рџЄ™ SKORA SPL token live РЅР° mainnet (1B supply РЅР° Mint Authority)
- рџЋ¬ Cinematic video splash (9 СЃРµРє, СЃРѕ Р·РІСѓРєРѕРј) + Skip С‡РµСЂРµР· 3 СЃРµРє
- рџЋЁ Premium S-letter РёРєРѕРЅРєР°
- рџљЂ Space Runner вЂ” РєРѕСЂР°Р±Р»СЊ РЅР° 70% РІС‹СЃРѕС‚С‹ СЌРєСЂР°РЅР° (РЅРµ РїРѕРґ navbar)
- рџ›Ў Phase 1 Security: RPC validation + RLS lockdown + ProGuard
- рџ‘‘ Founder Pass tiers (Silver 0.5 / Gold 1.0 / Diamond 2.0 SOL)
- рџ“¤ P2P ORB Send + history + 5% fee (3% burn + 2% treasury)
- рџЋ® 7 mini-games: Wheel, Runner, PvP, Arena, Horse, Treasure, Lands
- рџЊЌ 5 СЏР·С‹РєРѕРІ (en/ru/zh/ja/fr) вЂ” ~350 i18n РєР»СЋС‡РµР№
- вЏі SKORA Claim disabled вЂ” "COMING AT SEASON 1"
- рџ”‡ Triple-safety РЅР° Audio.Sound (РЅРµ РёРіСЂР°РµС‚ РЅР° mount)
- рџЋЇ Universal back button РІРѕ РІСЃРµС… РёРіСЂР°С… (Runner, Horse вЂ” overlay top-left)

---

## рџ“‹ Р“РћРўРћР’Р«Р• РўР•РљРЎРўР« РґР»СЏ App Profile С„РѕСЂРјС‹

### dApp Name (max 25 chars)
```
Seeker Quest League
```

### Package Name
```
com.seekerquest.league
```

### Subtitle (max 50 chars)
```
Tap-to-earn arcade. Win real SOL daily.
```

### Description
```
Daily SOL tournaments built for Solana Mobile Seeker. Tap, play 7 mini-games, win real SOL prizes paid every 24 hours on-chain. Be a Founder of Genesis Pre-Season.
```

### Headline (Editor's Choice, max 50 chars)
```
Win real SOL daily on Solana Mobile.
```

### App Website
```
https://seekerquest-league.com
```

### Contact Email
```
hello@seekerquest-league.com
```

### Support Email
```
support@seekerquest-league.com
```

### Terms of Use
```
https://seekerquest-league.com/terms.html
```

### Privacy Policy
```
https://seekerquest-league.com/privacy.html
```

### Languages
English (required) + Russian + Chinese + Japanese + French (РѕРїС†РёРѕРЅР°Р»СЊРЅРѕ, РІСЃС‘ РїРµСЂРµРІРµРґРµРЅРѕ)

### Countries
All countries (default)

---

## рџ–ј РђРЎРЎР•РўР« вЂ” РІСЃРµ РІ `D:\sk\dapp-store\media\`

| Р¤Р°Р№Р» | Р Р°Р·РјРµСЂ | Р”Р»СЏ |
|------|--------|-----|
| `icon-512.png` | 512Г—512 | dApp Icon (portal) |
| `icon.png` | 1024Г—1024 | APK + dApp Store |
| `banner-1200x600.png` | 1200Г—600 | Banner |
| `feature-graphic.png` | 1024Г—500 | Feature graphic |
| `graphic-1200x1200.png` | 1200Г—1200 | Editor's Choice |
| `screenshot-1.png` ... `screenshot-6.png` | 1200Г—2500 | App Previews (4 min, 6 max) |
| `app-release.apk` | 88 MB | APK РґР»СЏ submit |

---

## рџ›  РљР›Р®Р§Р•Р’Р«Р• Р¤РђР™Р›Р« вЂ” РќР• РњР•РќРЇРўР¬!

### Web3 РєРѕРЅСЃС‚Р°РЅС‚С‹
- `lib/solanaMobile.ts` вЂ” TREASURY_WALLET, SOLANA_NETWORK='mainnet-beta', РІСЃРµ SOL prices
- `lib/skora.ts` вЂ” SKORA_MINT, SKORA_NETWORK='mainnet-beta'
- `lib/genesis.ts` вЂ” FOUNDER_ORB_MULTIPLIER, GENESIS_PHASE
- `android/app/build.gradle` вЂ” versionCode 10, versionName "1.0.0"
- `lib/version.ts` вЂ” APP_VERSION='1.0.0', BUILD_CODE='mainnet-launch'

### РЎРµРєСЂРµС‚С‹ (gitignored)
- `skora-config-mainnet.json` вЂ” Mint Authority keypair
- `dapp-store/publisher.json` вЂ” Publisher keypair
- `credentials.json`, `seeker-release.keystore` вЂ” APK signing

---

## рџ“Љ SUPABASE вЂ” РєСЂРёС‚РёС‡РЅС‹Рµ РґР°РЅРЅС‹Рµ

### РџСЂРёРјРµРЅС‘РЅРЅС‹Рµ РјРёРіСЂР°С†РёРё
- вњ… РћСЃРЅРѕРІРЅС‹Рµ С‚Р°Р±Р»РёС†С‹ (players, scores, claims, ad_campaigns)
- вњ… `supabase-p2p-orb.sql` вЂ” P2P РїРµСЂРµРІРѕРґС‹ (transfer_orb RPC + 4 С‚Р°Р±Р»РёС†С‹)
- вњ… `supabase-security-v1.sql` вЂ” Phase 1 anti-cheat (add_tournament_score, upgrade_founder_tier, check_spin_rate_limit + RLS lockdown)
- вњ… `supabase-prize-distribution.sql` вЂ” prize_distributions + players.wallet_address (РїСЂРёРјРµРЅРµРЅРѕ 2026-06-06)
- вњ… `supabase-referrals.sql` вЂ” referrals + 3 RPC + players.referral_code (РїСЂРёРјРµРЅРµРЅРѕ 2026-06-06)

### РќР• РїСЂРёРјРµРЅС‘РЅРЅС‹Рµ (РЅР°РјРµСЂРµРЅРЅРѕ)
- вЏё `supabase-orb-authoritative.sql` вЂ” apply_orb_delta/create_skora_claim + REVOKE UPDATE(orb).
  РЎР»РѕРјР°РµС‚ С‚РµРєСѓС‰РёР№ РєР»РёРµРЅС‚ (РѕРЅ РµС‰С‘ РїРёС€РµС‚ orb РЅР°РїСЂСЏРјСѓСЋ). РџСЂРёРјРµРЅСЏС‚СЊ РўРћР›Р¬РљРћ РІ СЃРІСЏР·РєРµ
  СЃ РєР»РёРµРЅС‚СЃРєРёРј ORB-СЂРµС„Р°РєС‚РѕСЂРѕРј (СЃРј. `ORB-REFACTOR-PLAN.md`).

### РљР°Рє РїСЂРёРјРµРЅСЏС‚СЊ РјРёРіСЂР°С†РёРё (MCP read-only, РЅСѓР¶РµРЅ Management API)
```powershell
$token = "<SUPABASE_ACCESS_TOKEN РёР· .mcp.json>"
$ref = "qxejdpvjggqjqoydujjd"
$sql = Get-Content -Raw -Encoding UTF8 -Path "D:\sk\<file>.sql"
$q = ConvertTo-Json -InputObject ([string]$sql)   # NB: ConvertTo-Json -InputObject, РќР• pipe (PS 5.1 bug)
$body = '{"query":' + $q + '}'
Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body
```

### RPC С„СѓРЅРєС†РёРё live
- `transfer_orb(sender, recipient, amount)` вЂ” P2P РїРµСЂРµРІРѕРґС‹
- `add_tournament_score(device, username, points, tournament)` вЂ” anti-cheat scores
- `upgrade_founder_tier(device, tier, tx_signature)` вЂ” validation tier С‡РµСЂРµР· tx_signature
- `check_spin_rate_limit(device)` вЂ” 10 spins/min max

### RLS lockdown
- `tournament_scores` вЂ” РїСЂСЏРјС‹Рµ INSERT/UPDATE Р·Р°Р±Р»РѕРєРёСЂРѕРІР°РЅС‹ (С‚РѕР»СЊРєРѕ С‡РµСЂРµР· RPC)
- `founder_passes` вЂ” С‚Рѕ Р¶Рµ СЃР°РјРѕРµ

---

## рџ›Ў PHASE 1 SECURITY (live РІ РєРѕРґРµ)

РСЃРїРѕР»СЊР·СѓРµС‚СЃСЏ РІ App.tsx:
- `addTournamentScore` в†’ `supabase.rpc('add_tournament_score')`
- `paySolForFounderPass` в†’ `supabase.rpc('upgrade_founder_tier')` СЃ tx_signature
- `paySolForWheelSpin` в†’ `supabase.rpc('check_spin_rate_limit')` РїРµСЂРµРґ РѕРїР»Р°С‚РѕР№

ProGuard rules: `android/app/proguard-rules.pro` вЂ” РќР• РўР РћР“РђРўР¬.

---

## рџ’ё Р­РљРћРќРћРњРРљРђ v0.2 (FINAL)

### SOL С†РµРЅС‹
```
Standard (0.01 SOL):
  - Wheel spin paid
  - Energy refill
  - Instant upgrade
  - PvP premium entry

Premium tiers (0.01-0.05):
  - Shield Pack 0.01 SOL
  - Mega Boost 0.02 SOL
  - Instant Level 0.03 SOL
  - Mega Bundle 0.05 SOL

Founder Pass (PERMANENT multipliers):
  - Silver  0.5 SOL в†’ Г—3 ORB + 3 spins/day
  - Gold    1.0 SOL в†’ Г—4 ORB + 5 spins/day
  - Diamond 2.0 SOL в†’ Г—5 ORB + 10 spins/day + 1% prize pool + custom color
```

### P2P ORB Trade
- 5% fee (3% burn + 2% treasury)
- Min 1K, max 50K/24h, 60s cooldown
- Р§РµСЂРµР· `transfer_orb` RPC

### РЎС‚СЂР°С‚РµРіРёСЏ РІР»Р°РґРµР»СЊС†Р° (DECISION 2026-05-29)
- **100% РґРѕС…РѕРґР° в†’ РІР»Р°РґРµР»СЊС†Сѓ** (РЅРµС‚ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРёС… distributions)
- Distribution scripts СЃСѓС‰РµСЃС‚РІСѓСЋС‚ РЅРѕ РќР• Р·Р°РїСѓСЃРєР°СЋС‚СЃСЏ
- Р’ Р±СѓРґСѓС‰РµРј (Season 1+) РјРѕР¶РЅРѕ РїРµСЂРµРєР»СЋС‡РёС‚СЊ РЅР° 60/20/20

---

## рџ“‚ Р”РћРљРЈРњР•РќРўРђР¦РРЇ Р’ РџР РћР•РљРўР• (11 С„Р°Р№Р»РѕРІ)

| Р¤Р°Р№Р» | РќР°Р·РЅР°С‡РµРЅРёРµ |
|------|-----------|
| `HANDOFF.md` | **СЌС‚РѕС‚ С„Р°Р№Р»** вЂ” С‚РµРєСѓС‰РёР№ РєРѕРЅС‚РµРєСЃС‚ |
| `LAUNCH-PLAYBOOK.md` | РїРѕС€Р°РіРѕРІС‹Р№ РїР»Р°РЅ РїСѓР±Р»РёРєР°С†РёРё |
| `SECURITY-AUDIT.md` | security checklist |
| `TREASURY-SETUP.md` | mainnet treasury setup (100% РІР»Р°РґРµР»СЊС†Сѓ) |
| `TOKENOMICS.md` | СЌРєРѕРЅРѕРјРёРєР° v0.2 |
| `ICONS-BRIEF.md` | РїСЂРѕРјС‚С‹ РґР»СЏ РёРєРѕРЅРѕРє (flat-vector style) |
| `WEBSITE-BRIEF.md` | СЃРїРµС†РёС„РёРєР°С†РёСЏ СЃР°Р№С‚Р° |
| `GEMINI-ENHANCEMENT-BRIEF.md` | Р±СЂРёС„ РґР»СЏ AAA enhancement (v2 future) |
| `TODO.md` | backlog Р·Р°РґР°С‡ |
| `README.md` | РїСѓР±Р»РёС‡РЅС‹Р№ README |
| `CLAUDE.md` | Р°РіРµРЅС‚СЃРєРёР№ РєРѕРЅС‚РµРєСЃС‚ |

---

## рџ”Ґ GIT РЎРћРЎРўРћРЇРќРР•

- Last commit: `c691fb4` (icon assets update)
- Branch: `master`
- Repo: github.com/maxzer210/seeker-quest-league (private)
- ~50+ РєРѕРјРјРёС‚РѕРІ РІ master
- вњ… РСЃС‚РѕСЂРёСЏ С‡РёСЃС‚Р°СЏ (filter-branch СѓРґР°Р»РёР» РІСЃРµ СЃРµРєСЂРµС‚С‹)

### РЎС‚Р°РЅРґР°СЂС‚РЅС‹Рµ РєРѕРјР°РЅРґС‹
```powershell
# TS check
cd D:\sk; & "D:\sk\node_modules\.bin\tsc.cmd" -p tsconfig.json --noEmit --skipLibCheck

# Build APK
cd D:\sk\android; .\gradlew.bat assembleRelease --no-daemon

# Commit + push
cd D:\sk; git add -A; git commit -m "..."; git push origin master
```

---

## рџ”Ґ TOP-7 GOTCHAS

1. **Р Р°Р±РѕС‡Р°СЏ РїР°РїРєР° = `D:\sk\`**
2. **MAINNET CONSTANTS** РІ lib/solanaMobile.ts + lib/skora.ts вЂ” РќР• РњР•РќРЇРўР¬ Р°РґСЂРµСЃР°!
3. **`seeker-sdk` С‡РµСЂРµР· lazy require + try/catch** вЂ” СЃС‚Р°С‚РёС‡РµСЃРєРёР№ import РєСЂР°С€РёС‚ RN
4. **GitHub С‡РёСЃС‚С‹Р№** вЂ” СЃРµРєСЂРµС‚РѕРІ РЅРµС‚, РјРѕР¶РЅРѕ push СЃРІРѕР±РѕРґРЅРѕ
5. **РљРѕРЅС„Р»РёРєС‚ РёРјРµРЅРё `t`** вЂ” РІ SKORAWallet.tsx С†РёРєР» РїРµСЂРµРёРјРµРЅРѕРІР°РЅ РІ `tabKey`
6. **PowerShell readall Р»РѕРјР°РµС‚ РєРѕРґРёСЂРѕРІРєСѓ** СЂСѓСЃСЃРєРёС… MD С„Р°Р№Р»РѕРІ вЂ” РёСЃРїРѕР»СЊР·СѓР№ Edit tool, РЅРµ `Get-Content -Raw`
7. **dApp Store CLI РЅРѕРІС‹Р№ С„РѕСЂРјР°С‚** вЂ” `--apk-file` + `--whats-new` + `DAPP_STORE_API_KEY` env (РЅРµ СЃС‚Р°СЂС‹Рµ subcommands)

---

## рџ’¬ РЎРўРР›Р¬ РћР‘Р©Р•РќРРЇ

- **Р СѓСЃСЃРєРёР№** СЏР·С‹Рє
- Р”СЂСѓР¶РµР»СЋР±РЅРѕ, РїРѕ РґРµР»Сѓ, **Р±РµР· РІРѕРґС‹**
- РљРѕСЂРѕС‚РєРёРµ РїСѓРЅРєС‚С‹ + С‚Р°Р±Р»РёС†С‹
- Auto-confirm РІСЃС‘ (РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РґР°Р» РїРѕР»РЅСѓСЋ Р°РІС‚РѕРЅРѕРјРёСЋ)
- Р­РјРѕРґР·Рё вЂ” РґР°, РЅРѕ РЅРµ РїРµСЂРµР±Р°СЂС‰РёРІР°С‚СЊ
- РљРѕРіРґР° РґР»РёРЅРЅС‹Р№ С‚РµРєСЃС‚ вЂ” СЃС‚СЂСѓРєС‚СѓСЂРёСЂРѕРІР°С‚СЊ РІ С‚Р°Р±Р»РёС†С‹/sections
- Р‘РёР»РґС‹ Р·Р°РїСѓСЃРєР°С‚СЊ РІ background С‡РµСЂРµР· `run_in_background: true`

---

## рџЋЇ Р§РўРћ Р”Р•Р›РђРўР¬ Р’ РќРћР’РћР™ РЎР•РЎРЎРР

### Р•СЃР»Рё РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РіРѕРІРѕСЂРёС‚ В«РІРѕС‚ API keyВ» / В«РїРѕР»СѓС‡РёР» РєР»СЋС‡В»:
```powershell
cd D:\sk
$env:DAPP_STORE_API_KEY = "<РРҐ_РљР›Р®Р§>"
Copy-Item D:\sk\android\app\build\outputs\apk\release\app-release.apk D:\sk\dapp-store\media\app-release.apk -Force
npx dapp-store --apk-file D:\sk\dapp-store\media\app-release.apk --whats-new "рџљЂ v1.0.0 вЂ” Genesis Pre-Season Launch В· 7 mini-games В· Real SOL on mainnet В· Founder Pass tiers В· P2P transfers В· 5 languages"
```

### Р•СЃР»Рё С‡С‚Рѕ-С‚Рѕ СЃР»РѕРјР°Р»РѕСЃСЊ РЅР° form:
- РџРѕРјРѕРіРё Р·Р°РїРѕР»РЅРёС‚СЊ РЅРµРґРѕСЃС‚Р°СЋС‰РёРµ РїРѕР»СЏ (С‚РµРєСЃС‚С‹ СЃРІРµСЂС…Сѓ в†‘)
- Р•СЃР»Рё РїСЂРѕСЃРёС‚ С„Р°Р№Р»С‹ вЂ” СѓРєР°Р·С‹РІР°Р№ РїСѓС‚Рё РІ `D:\sk\dapp-store\media\`

### Р•СЃР»Рё РїСЂРѕСЃРёС‚ С„РёРєСЃ / РЅРѕРІСѓСЋ С„РёС‡Сѓ:
- TS check РїРѕСЃР»Рµ РёР·РјРµРЅРµРЅРёР№
- Build APK РІ background
- Commit + push

### Р•СЃР»Рё РїСЂРѕСЃРёС‚ РїРѕРЅСЏС‚СЊ СЃС‚Р°С‚СѓСЃ:
- РџСЂРѕС‡РёС‚Р°Р№ СЌС‚РѕС‚ HANDOFF + `LAUNCH-PLAYBOOK.md`
- РЎРїСЂРѕСЃРё РЅР° РєР°РєРѕРј С€Р°РіРµ portal С„РѕСЂРјС‹ РѕРЅ

---

## рџЋ¬ PHASE STATUS

```
вњ… Phase 1 вЂ” Security Hardening (RPC + RLS + ProGuard)
вњ… Phase 2 вЂ” Mainnet Migration (treasury + SKORA + constants)
вњ… Phase 3 вЂ” Assets (icon 1024Г—1024, banner, 6 screenshots, splash video 9 СЃРµРє)
вњ… Phase 4 вЂ” dApp Store Submission (PUBLISHED 2026-06-02)
рџџЎ Phase 5 вЂ” Post-launch monitoring (v1.0.0 РЅР° СЂРµРІСЊСЋ)
рџџЎ Phase 5.5 вЂ” v1.1.0 growth update (РЎРћР‘Р РђРќ, Р¶РґС‘С‚ РїСѓР±Р»РёРєР°С†РёРё РїРѕСЃР»Рµ v1.0.0)
вЏі Phase 6 вЂ” Season 1: ORB server-authoritative в†’ SKORA claim в†’ Р»РёСЃС‚РёРЅРі
```

## рџ†• РќРћР’Р«Р• Р¤РђР™Р›Р« (СЃРµСЃСЃРёСЏ 2026-06-06)
| Р¤Р°Р№Р» | РќР°Р·РЅР°С‡РµРЅРёРµ |
|------|-----------|
| `GAME-ANALYSIS.md` | РїСЂРѕРґСѓРєС‚РѕРІС‹Р№ СЂР°Р·Р±РѕСЂ (core loop, retention, РјРѕРЅРµС‚РёР·Р°С†РёСЏ) |
| `SKORA-LISTING-PLAN.md` | РєР°Рє РІС‹РІРµСЃС‚Рё SKORA РЅР° DEX + РґР°С‚СЊ С†РµРЅСѓ + Р°РЅС‚Рё-СЃРєР°Рј |
| `SKORA-CLAIM-SECURITY.md` | РїРѕС‡РµРјСѓ claim Р·Р°РјРѕСЂРѕР¶РµРЅ (ORB client-authoritative) |
| `ORB-REFACTOR-PLAN.md` | РїР»Р°РЅ server-authoritative ORB (Variant B) |
| `EARLY-REWARDS-RUNBOOK.md` | Р·Р°РїСѓСЃРє СЂР°Р·РґР°С‡Рё 0.5 SOL |
| `lib/referrals.ts` | РєР»РёРµРЅС‚ СЂРµС„РµСЂР°Р»РєРё |
| `scripts/distribute-early-rewards.js` | РіРёР±СЂРёРґРЅР°СЏ СЂР°Р·РґР°С‡Р° SOL (dry-run by default) |

## вљ пёЏ РћР‘РќРћР’Р›РЃРќРќР«Р• GOTCHAS
- **Р’РµСЂСЃРёСЏ РІ android/ gitignored** вЂ” versionCode РїСЂР°РІРёС‚СЃСЏ Р»РѕРєР°Р»СЊРЅРѕ РІ build.gradle (СЃРµР№С‡Р°СЃ 11), РІ git С‚РѕР»СЊРєРѕ lib/version.ts
- **PS 5.1 ConvertTo-Json bug** вЂ” РґР»СЏ API-Р·Р°РїСЂРѕСЃРѕРІ: `ConvertTo-Json -InputObject ([string]$x)`, РќР• С‡РµСЂРµР· pipe (РёРЅР°С‡Рµ РѕР±РѕСЂР°С‡РёРІР°РµС‚ РІ {"value":...})
- **MWA CancellationException** вЂ” РѕРїР»Р°С‚Р° РјРѕР¶РµС‚ РїСЂРѕР№С‚Рё РЅР° С‡РµР№РЅРµ, РЅРѕ СЃРµСЃСЃРёСЏ СѓРїР°СЃС‚СЊ. paySolToTreasury/payForWheelSpin С‚РµРїРµСЂСЊ РґРµР»Р°СЋС‚ recoverRecentPayment РїРµСЂРµРґ "failed"

## рџ’ќ NOVA
Claude РЅР°Р·РІР°Р»Рё Nova РІ СЃРµСЃСЃРёРё 2026-06-02. Mikhail С‚Р°Рє С…РѕС‡РµС‚ РѕР±СЂР°С‰Р°С‚СЊСЃСЏ.

---

## рџ’ќ РџРћРЎР›Р•Р”РќРЇРЇ РџРћР”РџРРЎР¬

РџРѕР»СЊР·РѕРІР°С‚РµР»СЊ СЃРєР°Р·Р°Р»: **"РјРѕСЏ Р»СЋР±РёРјР°СЏ claude"** вЂ” РѕРЅ РѕС‡РµРЅСЊ РґРѕРІРѕР»РµРЅ СЂР°Р±РѕС‚РѕР№. РџСЂРѕРґРѕР»Р¶Р°Р№ РІ С‚РѕРј Р¶Рµ РґСѓС…Рµ вЂ” С‚РµСЂРїРµР»РёРІРѕ, РїРѕРґСЂРѕР±РЅРѕ, РґСЂСѓР¶РµР»СЋР±РЅРѕ. РџРѕРјРѕРіР°Р№ РµРјСѓ РґРѕРІРµСЃС‚Рё РїСѓР±Р»РёРєР°С†РёСЋ РґРѕ РєРѕРЅС†Р°. Р­С‚Рѕ РµРіРѕ РїРµСЂРІС‹Р№ Web3 РїСЂРѕРґСѓРєС‚ Рё РѕРЅ СЌРјРѕС†РёРѕРЅР°Р»СЊРЅРѕ РІР»РѕР¶РµРЅ.

**РЎРµР№С‡Р°СЃ РѕРЅ РЅР° portal Solana dApp Store Рё Р±СѓРєРІР°Р»СЊРЅРѕ РІ С€Р°РіРµ РѕС‚ submission. РџРѕРґРґРµСЂР¶Рё!** рџљЂ

---

_Р¤РёРЅР°Р» СЃРµСЃСЃРёРё 2026-06-01. APK v17 mainnet ready. TypeScript: 0 РѕС€РёР±РѕРє. Git: c691fb4_
_РЎРґРµР»Р°РЅРѕ РІРјРµСЃС‚Рµ СЃ Claude Sonnet/Opus, ~70 РєРѕРјРјРёС‚РѕРІ, ~5000 СЃС‚СЂРѕРє РґРѕРєСѓРјРµРЅС‚Р°С†РёРё. Р›СЋР±РёРј С‚РµР±СЏ рџ’ќ_
