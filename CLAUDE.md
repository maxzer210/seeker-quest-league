# Seeker Quest League вЂ” Project Memory

> Р­С‚РѕС‚ С„Р°Р№Р» AI С‡РёС‚Р°РµС‚ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РїСЂРё СЃС‚Р°СЂС‚Рµ СЃРµСЃСЃРёРё РІ СЌС‚РѕР№ РїР°РїРєРµ.
> РћР±РЅРѕРІР»СЏР№ РїРѕСЃР»Рµ РєР°Р¶РґРѕРіРѕ РєСЂСѓРїРЅРѕРіРѕ С€Р°РіР°.

@AGENTS.md

---

## 1. Р§С‚Рѕ СЌС‚Рѕ

**Seeker Quest League** вЂ” РјРѕР±РёР»СЊРЅР°СЏ Web3 РёРіСЂР° tap-to-earn РґР»СЏ Solana Mobile Seeker.
РРіСЂРѕРєРё С‚Р°РїР°СЋС‚ в†’ Р·Р°СЂР°Р±Р°С‚С‹РІР°СЋС‚ ORB в†’ РёРіСЂР°СЋС‚ РІ РјРёРЅРё-РёРіСЂС‹ в†’ РєРѕРЅРІРµСЂС‚РёСЂСѓСЋС‚ РІ SKORA (SPL) в†’ РІС‹РёРіСЂС‹РІР°СЋС‚ SOL РІ РµР¶РµРґРЅРµРІРЅС‹С… С‚СѓСЂРЅРёСЂР°С….

- **РџР»Р°С‚С„РѕСЂРјР°:** РўРѕР»СЊРєРѕ Solana Mobile dApp Store (Seeker phone)
- **РЇР·С‹Рє РѕР±С‰РµРЅРёСЏ:** СЂСѓСЃСЃРєРёР№, РґСЂСѓР¶РµР»СЋР±РЅРѕ, РїРѕ РґРµР»Сѓ
- **РЎС‚РёР»СЊ РєРѕРґР°:** РЅРµ РєРѕРјРјРµРЅС‚РёСЂРѕРІР°С‚СЊ РѕС‡РµРІРёРґРЅРѕРµ, РјРёРЅРёРјСѓРј Р°Р±СЃС‚СЂР°РєС†РёР№

---

## 2. Р“РґРµ СЂР°Р±РѕС‚Р°РµРј

**рџ”ґ РљР РРўРР§РќРћ вЂ” Р РђР‘РћР§РђРЇ РџРђРџРљРђ:**
```
C:\sk\
```

Р­С‚Рѕ С„РёР·РёС‡РµСЃРєР°СЏ РєРѕРїРёСЏ РёР· `C:\Users\User\Documents\Codex\2026-05-23\new-chat\seeker-quest-league\`,
СЃРґРµР»Р°РЅРЅР°СЏ С‡С‚РѕР±С‹ РѕР±РѕР№С‚Рё Windows 260-char path limit РїСЂРё Р»РѕРєР°Р»СЊРЅРѕР№ СЃР±РѕСЂРєРµ Gradle.

**Р’СЃРµ РёР·РјРµРЅРµРЅРёСЏ РґРµР»Р°С‚СЊ РІ `C:\sk\`.** РЎС‚Р°СЂР°СЏ РїР°РїРєР° СѓСЃС‚Р°СЂРµР»Р°.

---

## 3. Tech stack

| РЎР»РѕР№ | РўРµС…РЅРѕР»РѕРіРёСЏ |
|------|-----------|
| Frontend | React Native, Expo SDK 54, TypeScript |
| Backend | Supabase (qxejdpvjggqjqoydujjd) |
| Blockchain | Solana devnet (mainnet later) |
| Wallet | Mobile Wallet Adapter (MWA) |
| Token | SPL Token (SKORA) |
| Build | **Р›РѕРєР°Р»СЊРЅР°СЏ Gradle СЃР±РѕСЂРєР°** (EAS free Р»РёРјРёС‚ РёСЃС‡РµСЂРїР°РЅ) |
| Sound/Notif | expo-av, expo-notifications |

**РљР»СЋС‡РµРІС‹Рµ РїР°РєРµС‚С‹:**
- `seeker-sdk` (С‡РµСЂРµР· lazy require вЂ” РјРѕР¶РµС‚ РєСЂР°С€РёС‚СЊ)
- `react-native-device-info` (РґР»СЏ installer detection)
- `react-native-get-random-values`, `buffer`, `react-native-url-polyfill` (РїРѕР»РёС„РёР»Р»С‹)
- `expo-notifications`
- `@solana/web3.js`, `@solana/spl-token`
- `@solana-mobile/mobile-wallet-adapter-protocol`

**i18n (2026-05-26):**
- `lib/i18n.ts` вЂ” 5 СЏР·С‹РєРѕРІ (en/ru/zh/ja/fr), `t(key, vars?)`, `useLang()`, `setLang()`
- `components/LanguageSelector.tsx` вЂ” РїРµСЂРІС‹Р№ Р·Р°РїСѓСЃРє
- РџРµСЂРµРІРµРґРµРЅС‹ РєСЂРёС‚РёС‡РЅС‹Рµ UI surfaces (navbar, home, shop, profile, cup)

---

## 4. Р›РѕРєР°Р»СЊРЅР°СЏ СЃР±РѕСЂРєР° APK (Р±РµР· EAS)

**РћРєСЂСѓР¶РµРЅРёРµ:**
- Android SDK: `C:\Users\User\AppData\Local\Android\Sdk`
- NDK: 27.1.12297006
- cmake: 3.22.1
- Java: 17 LTS Temurin (`C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`)
- Long Paths РІРєР»СЋС‡РµРЅС‹ РІ СЂРµРµСЃС‚СЂРµ (`LongPathsEnabled = 1`)

**Env vars (СѓР¶Рµ persistent РІ СЃРёСЃС‚РµРјРµ):** `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `JAVA_HOME`

**РљРѕРјР°РЅРґР° Р±РёР»РґР°:**
```powershell
cd C:\sk\android
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\gradlew.bat assembleRelease --no-daemon
```

**Р РµР·СѓР»СЊС‚Р°С‚:** `C:\sk\android\app\build\outputs\apk\release\app-release.apk` (~92 MB)

**Р’СЂРµРјСЏ:** 5-10 РјРёРЅ РїСЂРё С‚С‘РїР»РѕРј РєСЌС€Рµ.

---

## 5. Р¤Р°Р№Р»РѕРІР°СЏ СЃС‚СЂСѓРєС‚СѓСЂР°

```
C:\sk\
в”њв”Ђв”Ђ App.tsx                    в†ђ РіР»Р°РІРЅС‹Р№ (~2300 СЃС‚СЂРѕРє, РІСЃРµ СЌРєСЂР°РЅС‹ С‡РµСЂРµР· `screen` state)
в”њв”Ђв”Ђ index.ts                   в†ђ РїРѕР»РёС„РёР»Р»С‹ РћР‘РЇР—РђРўР•Р›Р¬РќРћ РїРµСЂРІС‹РјРё
в”њв”Ђв”Ђ skora-config.json          в†ђ mint authority keypair (.gitignored!)
в”њв”Ђв”Ђ seeker-release.keystore    в†ђ РїРѕРґРїРёСЃСЊ APK
в”‚
в”њв”Ђв”Ђ components/
в”‚   в”њв”Ђв”Ђ FortuneWheel.tsx
в”‚   в”њв”Ђв”Ђ HorseRace.tsx          в†ђ fullscreen
в”‚   в”њв”Ђв”Ђ SpaceRunner.tsx        в†ђ fullscreen, PanResponder
в”‚   в”њв”Ђв”Ђ Arena.tsx              в†ђ СЂРµР№РґС‹ + Р±Р°Р·Р°
в”‚   в”њв”Ђв”Ђ Tournament.tsx
в”‚   в”њв”Ђв”Ђ TreasureHunt.tsx
в”‚   в”њв”Ђв”Ђ SeekerLands.tsx        в†ђ Idle 24h cap + auto push
в”‚   в”њв”Ђв”Ђ SKORAWallet.tsx        в†ђ claim ORBв†’SKORA
в”‚   в”њв”Ђв”Ђ EarnHub.tsx            в†ђ РІРёС‚СЂРёРЅР° СЂРµРєР»Р°РјС‹
в”‚   в”њв”Ђв”Ђ AdViewer.tsx           в†ђ РјРѕРґР°Р» РїСЂРѕСЃРјРѕС‚СЂР°
в”‚   в”њв”Ђв”Ђ PvPArena.tsx           в†ђ tap-battle СЃ ORB СЃС‚Р°РІРєР°РјРё
в”‚   в”њв”Ђв”Ђ GenesisNews.tsx        в†ђ live SOL pool + countdown
в”‚   в”њв”Ђв”Ђ Onboarding.tsx
в”‚   в””в”Ђв”Ђ WinCelebration.tsx     в†ђ global overlay (forwardRef)
в”‚
в”њв”Ђв”Ђ lib/
в”‚   в”њв”Ђв”Ђ supabase.ts
в”‚   в”њв”Ђв”Ђ solanaMobile.ts        в†ђ MWA + paid spin
в”‚   в”њв”Ђв”Ђ skora.ts               в†ђ РєРѕРЅРІРµСЂСЃРёСЏ + claim API
в”‚   в”њв”Ђв”Ђ seeker.ts              в†ђ SDK wrapper (lazy require!)
в”‚   в”њв”Ђв”Ђ installerCheck.ts      в†ђ dApp Store auto-grant Seeker
в”‚   в”њв”Ђв”Ђ genesis.ts             в†ђ Pre-Season config + tier table
в”‚   в”њв”Ђв”Ђ notifications.ts       в†ђ expo-notifications
в”‚   в”њв”Ђв”Ђ ads.ts
в”‚   в””в”Ђв”Ђ pvp.ts
в”‚
в”њв”Ђв”Ђ scripts/
в”‚   в”њв”Ђв”Ђ create-skora-token.js          в†ђ СѓР¶Рµ Р·Р°РїСѓС‰РµРЅ (mint СЃРѕР·РґР°РЅ)
в”‚   в”њв”Ђв”Ђ distribute-genesis-prizes.js   в†ђ РґР»СЏ Season 1 launch
в”‚   в”њв”Ђв”Ђ process-skora-claims.js        в†ђ РјРёРЅС‚РёС‚ pending SKORA
в”‚   в””в”Ђв”Ђ README.md
в”‚
в”њв”Ђв”Ђ dapp-store/
в”‚   в”њв”Ђв”Ђ config.yaml
в”‚   в”њв”Ђв”Ђ PRIVACY-POLICY.md
в”‚   в”њв”Ђв”Ђ STORE-DESCRIPTIONS.md
в”‚   в”њв”Ђв”Ђ SCREENSHOTS-PLAN.md
в”‚   в”њв”Ђв”Ђ SUBMISSION-GUIDE.md
в”‚   в””в”Ђв”Ђ ADVERTISER-GUIDE.md
в”‚
в”њв”Ђв”Ђ supabase-*.sql             в†ђ 5 РјРёРіСЂР°С†РёР№ (sgt-bonus, prize-distribution, skora-claims, ads, pvp)
в””в”Ђв”Ђ Docs: ROADMAP, TOKENOMICS, LITEPAPER, AGENTS, CLAUDE
```

---

## 6. Web3 Р°РґСЂРµСЃР° (devnet)

| Р§С‚Рѕ | РђРґСЂРµСЃ |
|-----|-------|
| **User Seeker wallet** (РїР»Р°С‚РёС‚) | `HVJDjwuaqH7oDeXUASqDMCZYQ53Hg8uxKs4RkS7sskhC` |
| **Treasury / SKORA mint authority** (РїСЂРёС‘РјРЅРёРє) | `EekTZsoxzVEdze1HEAqLQbMnx8ScBheWBW3Dsp9QBZDT` |
| **SKORA SPL Token mint** | `3HTkC3v9CYTxGYQSegsidgzfxEQJvAotYZVozmaFc2av` |
| **SKORA Treasury ATA** | `skbhes18WDERZ9MgSrhHtKwUyEyxGhzYwyMdRkt69sZ` |

**РџР°СЂР°РјРµС‚СЂС‹:** Decimals=6, Supply=1B, Network=devnet
**РљРѕРЅРІРµСЂСЃРёСЏ:** 10,000 ORB = 1 SKORA, min claim 10K
**Paid spin:** 0.01 SOL (60% top-100 prizes / 20% SKORA airdrop / 20% project treasury)

---

## 7. Supabase

**Project:** `qxejdpvjggqjqoydujjd.supabase.co`
**Dashboard:** https://supabase.com/dashboard/project/qxejdpvjggqjqoydujjd

**РўР°Р±Р»РёС†С‹:**
- `players`, `tournament_scores`, `tournaments`
- `wheel_sol_payments` (paid spin Р»РѕРі)
- `sgt_bonus_claims` (anti-sybil РґР»СЏ +5000 ORB Seeker)
- `prize_distributions` (SOL РїСЂРёР·С‹ audit)
- `skora_claims` (pending в†’ minted)
- `ad_campaigns` + `ad_views`
- `pvp_matches`

**SQL РјРёРіСЂР°С†РёРё:** `supabase-*.sql` РІ РєРѕСЂРЅРµ вЂ” РїСЂРёРјРµРЅСЏСЋС‚СЃСЏ С‡РµСЂРµР· SQL Editor.

---

## 8. Р§С‚Рѕ РЎР”Р•Р›РђРќРћ

### рџЋ® РРіСЂС‹ (РІРёР·СѓР°Р»СЊРЅРѕ РїСЂРѕРєР°С‡Р°РЅС‹ 2026-05-26)
- вњ… Р’СЃРµ 7 РјРёРЅРё-РёРіСЂ + PvP Arena
- вњ… FortuneWheel: heartbeat, 8 LED chase, shake, 32 РєРѕРЅС„РµС‚С‚Рё, premium SOL btn
- вњ… Arena: skyline, radar dish + 3 ping, RAID red pulse, shield aura, 12 sparks
- вњ… TreasureHunt: 24Г—24 РєР°СЂС‚Р°, 32 СЃСѓРЅРґСѓРєР°, 26 Р»РѕРІСѓС€РµРє (рџ’Јрџ•·рџ”Ґ), ambient pulse
- вњ… HorseRace: stadium bulbs, floating +X С‚Р°РЅС‹, 14 finish sparkles
- вњ… SeekerLands: ambient pulse РіРѕС‚РѕРІС‹С…, CTA glow, 12 coin burst

### рџЄ™ Web3 + РњРѕРЅРµС‚РёР·Р°С†РёСЏ (2026-05-26)
- вњ… generic `paySolToTreasury` + 4 SOL touchpoints
- вњ… Wheel 1 free/day (Р±С‹Р»Рѕ 5) + premium SOL spin 0.01
- вњ… Energy Refill 0.005 SOL (Home + Shop)
- вњ… Instant Upgrade 0.01 SOL/СѓСЂРѕРІРµРЅСЊ (РІ Shop)
- вњ… PvP Premium Match 0.005 SOL entry
- вњ… EARN tab СЃ РІРёС‚СЂРёРЅРѕР№ СЂРµРєР»Р°РјС‹ (С‚РµРїРµСЂСЊ РІРЅСѓС‚СЂРё SHOP)
- вњ… Crypto polyfills, SKORA token, claim flow end-to-end

### рџЋЇ Retention
- вњ… Genesis Pre-Season + Founder badge (2Г— ORB forever)
- вњ… Morning Claim + Streak Shield
- вњ… Push notifications (streak/tournament/lands)
- вњ… **Achievements СЃ СЂРµР°Р»СЊРЅС‹РјРё РЅР°РіСЂР°РґР°РјРё** (8 Р°С‡РёРІРѕРє, auto-claim, persistent)

### рџЋЁ UX (СЂРµРѕСЂРі 2026-05-26)
- вњ… Onboarding + **LanguageSelector** (5 СЏР·С‹РєРѕРІ)
- вњ… Compact header РЅР° РЅРµ-home СЌРєСЂР°РЅР°С…
- вњ… Navbar: HOME / GAMES / **SHOP** / CUP / ME
- вњ… Shop = Hub (Earn + SKORA + Refill + Cosmetic + Upgrades)
- вњ… Rankings РїРµСЂРµРЅРµСЃРµРЅС‹ РІ CUP
- вњ… Profile СѓРїСЂРѕС‰С‘РЅ
- вњ… Sound + Notifications toggles + Language picker РІ Settings

### рџЊђ i18n (2026-05-26)
- вњ… 5 СЏР·С‹РєРѕРІ: English, Р СѓСЃСЃРєРёР№, дё­ж–‡, ж—Ґжњ¬иЄћ, FranГ§ais
- вњ… LanguageSelector РЅР° РїРµСЂРІРѕРј Р·Р°РїСѓСЃРєРµ
- вњ… РџРµСЂРµРєР»СЋС‡Р°С‚РµР»СЊ РІ Settings
- вњ… РџРµСЂРµРІРµРґРµРЅС‹: navbar, home, streak, shop, cup, profile, games arcade, wallet

### рџ“¦ Р РµР»РёР·
- вњ… LITEPAPER, TOKENOMICS
- вњ… dApp Store РїР°РєРµС‚ (config + privacy + descriptions + screenshots + guide)
- вњ… ADVERTISER-GUIDE.md

### рџЏ— РРЅС„СЂР°
- вњ… Р›РѕРєР°Р»СЊРЅР°СЏ СЃР±РѕСЂРєР° APK
- вњ… Supabase MCP РєРѕРЅС„РёРі (РЅСѓР¶РµРЅ restart РґР»СЏ Р°РєС‚РёРІР°С†РёРё)
- вњ… Skill `seeker-development` Р»РѕРєР°Р»СЊРЅРѕ РІ `.claude/skills/`

---

## 9. Р§С‚Рѕ РћРЎРўРђР›РћРЎР¬

### рџџў Р”РµР№СЃС‚РІРёСЏ РїРѕР»СЊР·РѕРІР°С‚РµР»СЏ (РЅРµ РєРѕРґ)
- вЏё **РџСЂРёРјРµРЅРёС‚СЊ 5 SQL РјРёРіСЂР°С†РёР№** РІ Supabase (sgt-bonus, prize-distribution, skora-claims, ads, pvp)
- вЏё Р—Р°СЂРµРіРёСЃС‚СЂРёСЂРѕРІР°С‚СЊ `seekerquest.league` + С…РѕСЃС‚ Privacy Policy
- вЏё Email `adsskora@gmail.com` (Cloudflare Email Routing)
- вЏё 8 СЃРєСЂРёРЅС€РѕС‚РѕРІ РґР»СЏ dApp Store
- вЏё РўРµСЃС‚С‹ РїРѕСЃР»РµРґРЅРµРіРѕ APK РЅР° Seeker

### рџџЎ РљРѕРґРёРЅРі (РїРѕ Р·Р°РїСЂРѕСЃСѓ)
- рџ”Ґ Р¤РёРЅР°Р»СЊРЅС‹Р№ РІРёР·СѓР°Р»СЊРЅС‹Р№ СЃС‚РёР»СЊ (РІС‹Р±СЂР°С‚СЊ cyber/neon/premium Рё РїСЂРёРјРµРЅРёС‚СЊ СЃРёСЃС‚РµРјРЅРѕ)
- рџ”Ґ Admin SQL helper (Р±С‹СЃС‚СЂРѕРµ РґРѕР±Р°РІР»РµРЅРёРµ ad campaigns)
- рџ’Ў dApp Store submission С‡РµСЂРµР· CLI
- рџ’Ў Mainnet РјРёРіСЂР°С†РёСЏ (РїРѕСЃР»Рµ Pre-Season Р°РЅР°Р»РёС‚РёРєРё)
- рџ’Ў Multisig treasury (Squads Protocol)

### рџ”µ Future
- NFT items, self-service advertiser portal, weekly SKORA airdrop, real-time PvP

---

## 10. РљСЂРёС‚РёС‡РЅС‹Рµ gotchas

1. **РџРѕР»РёС„РёР»Р»С‹ РІ `index.ts` РћР‘РЇР—РђРўР•Р›Р¬РќРћ РїРµСЂРІС‹РјРё** вЂ” РёРЅР°С‡Рµ Solana С„СѓРЅРєС†РёРё РїР°РґР°СЋС‚
2. **`seeker-sdk` С‡РµСЂРµР· lazy require + try/catch** вЂ” РёРЅР°С‡Рµ РєСЂР°С€РёС‚ РЅР° СЃС‚Р°СЂС‚Рµ RN
3. **MWA СЂР°Р±РѕС‚Р°РµС‚ С‚РѕР»СЊРєРѕ РЅР° Android**
4. **Fullscreen РёРіСЂС‹ вЂ” Р’РќР• ScrollView** С‡РµСЂРµР· `position: absolute, zIndex: 50`
5. **`useNativeDriver`** вЂ” true РґР»СЏ transform/opacity, false РґР»СЏ width/height
6. **`skora-config.json`, `seeker-release.keystore`, `.mcp.json`** вЂ” РІ .gitignore
7. **PowerShell** РЅРµ Р»СЋР±РёС‚ `&&` вЂ” РёСЃРїРѕР»СЊР·РѕРІР°С‚СЊ `;` РёР»Рё `if ($?)`
8. **EAS free Р»РёРјРёС‚** РёСЃС‡РµСЂРїР°РЅ вЂ” С‚РѕР»СЊРєРѕ Р»РѕРєР°Р»СЊРЅС‹Р№ Р±РёР»Рґ (СЃР±СЂРѕСЃ ~1 РёСЋРЅСЏ)
9. **Windows path РґР»РёРЅР°** вЂ” СЂР°Р±РѕС‚Р°С‚СЊ С‚РѕР»СЊРєРѕ РёР· `C:\sk`
10. **Java 25 Р»РѕРјР°РµС‚ Gradle 8.x** вЂ” `JAVA_HOME` СѓРєР°Р·С‹РІР°РµС‚ РЅР° Java 17

---

## 11. РЎС‚РёР»СЊ РѕР±С‰РµРЅРёСЏ

- РЇР·С‹Рє вЂ” **СЂСѓСЃСЃРєРёР№**
- РўРѕРЅ вЂ” РґСЂСѓР¶РµР»СЋР±РЅС‹Р№, Р±РµР· РІРѕРґС‹, РєРѕРЅРєСЂРµС‚РЅС‹Р№
- Р¤РѕСЂРјР°С‚ вЂ” РєРѕСЂРѕС‚РєРёРµ РїСѓРЅРєС‚С‹, С‚Р°Р±Р»РёС†С‹, С‡С‘С‚РєРёРµ С€Р°РіРё
- Р РµС€РµРЅРёСЏ вЂ” РїСЂРµРґР»Р°РіР°Р№ РІР°СЂРёР°РЅС‚С‹ С‡РµСЂРµР· AskUserQuestion (2-4 РѕРїС†РёРё)
- TypeScript вЂ” РїРѕСЃР»Рµ РєСЂСѓРїРЅС‹С… РёР·РјРµРЅРµРЅРёР№ `npx tsc --noEmit --skipLibCheck`
- Р‘РёР»РґС‹ вЂ” Р»РѕРєР°Р»СЊРЅРѕ С‡РµСЂРµР· `cd C:\sk\android && .\gradlew.bat assembleRelease`

---

## 12. РљР°Рє РїСЂРѕРґРѕР»Р¶РёС‚СЊ РїРѕСЃР»Рµ СЂРµСЃС‚Р°СЂС‚Р° СЃРµСЃСЃРёРё

Р’ РЅРѕРІРѕРј С‡Р°С‚Рµ РїРѕР»СЊР·РѕРІР°С‚РµР»СЊ РіРѕРІРѕСЂРёС‚ **"РїСЂРѕРґРѕР»Р¶Р°РµРј"** вЂ” С‚С‹:
1. РЈР¶Рµ Р°РІС‚РѕРјР°С‚РёС‡РµСЃРєРё РїСЂРѕС‡РёС‚Р°Р»Р° СЌС‚РѕС‚ С„Р°Р№Р»
2. Р—РЅР°РµС€СЊ РІРµСЃСЊ РєРѕРЅС‚РµРєСЃС‚ РїСЂРѕРµРєС‚Р°, СЃС‚Р°С‚СѓСЃ, С‡С‚Рѕ РѕСЃС‚Р°Р»РѕСЃСЊ
3. РЎРїСЂР°С€РёРІР°РµС€СЊ: *"РЎ С‡РµРіРѕ РїСЂРѕРґРѕР»Р¶Р°РµРј? РўРµСЃС‚РёСЂСѓРµРј APK / РґРµР»Р°РµРј РІРёР·СѓР°Р» / SQL РјРёРіСЂР°С†РёРё / РґСЂСѓРіРѕРµ?"*

РЎРїРёСЃРѕРє С‚РµРєСѓС‰РёС… Р·Р°РґР°С‡ вЂ” С‡РµСЂРµР· `TaskList`.

---

_Last updated: 2026-05-26 (big autonomous session: monetization SOL + visual upgrades all games + UX reorg + Achievements + 5-lang i18n)_
