# 🚀 Session Handoff — 2026-06-01 (MAINNET + SUBMISSION)

> Полный контекст для новой сессии Claude.
> Пользователь — любимец Claude 🥹 он публикует Seeker Quest League в Solana dApp Store ПРЯМО СЕЙЧАС.

---

## 🎯 ТЕКУЩИЙ МОМЕНТ (где остановились)

Пользователь **на portal публикации** `https://publish.solanamobile.com`:
- ✅ Publisher Profile создан (Individual, имя реальное пользователя)
- 🔄 Заполняет **App Profile** — на экране "Let's add your dApp details!"
- ⏳ После заполнения — Save → Submit on-chain → получит API key → CLI submission

### Следующие шаги для пользователя:
1. Загрузить иконку 512×512 → `C:\sk\dapp-store\media\icon-512.png`
2. Загрузить banner 1200×600 → `C:\sk\dapp-store\media\banner-1200x600.png`
3. Загрузить 4-6 screenshots → `C:\sk\dapp-store\media\screenshot-1..6.png`
4. Загрузить Editor's Choice graphic 1200×1200 → `C:\sk\dapp-store\media\graphic-1200x1200.png`
5. Заполнить тексты (см. ниже готовые)
6. Save → подпись в Phantom (~0.01 SOL gas)
7. Сгенерировать API key
8. Прислать API key → запустить CLI submission

### CLI submission команда (когда будет API key):
```powershell
cd C:\sk
$env:DAPP_STORE_API_KEY = "<KEY_FROM_USER>"
npx dapp-store --apk-file C:\sk\dapp-store\media\app-release.apk --whats-new "🚀 v1.0.0 — Genesis Pre-Season Launch · 7 mini-games · Real SOL on mainnet"
```

---

## 💰 КРИТИЧНЫЕ АДРЕСА (MAINNET — реальные деньги!)

```
Treasury wallet (Phantom):   CxYfXXLGEm1FXcL7cVzTHe1kG3gpo5ecsKgVjXRhLGSp
Mint Authority (file):       34xy3XaMk8FCfvVRPWViB6C6tNUWqS1TELy7D2rAa5Tz
Publisher (file + Phantom):  7NLKe7d6NxCjAGB4fSzyRUV6U3bmrJru2cMNKiQwCAsf
SKORA Mint (mainnet!):       3Q6PN3Rf1xrrHKwkPQDnBi7aBBXHYdToG2NKwBQkGwyQ
SKORA Treasury ATA:          7wmAbrn6LU7FRLPqwePWvekvwAcsetHdGyZJ61YsrJm1
Supabase:                    qxejdpvjggqjqoydujjd.supabase.co
GitHub repo:                 github.com/maxzer210/seeker-quest-league (private)
```

### Доменные email
- `hello@seekerquest-league.com` — general / partnership / publisher contact
- `support@seekerquest-league.com` — privacy / security / data deletion
- `ads@seekerquest-league.com` — advertisers B2B

### Сайт
- `https://seekerquest-league.com` — live
- `https://seekerquest-league.com/privacy.html` — privacy policy
- `https://seekerquest-league.com/terms.html` — terms of use

---

## 📦 APK v17 (ФИНАЛЬНЫЙ MAINNET RELEASE)

**Путь:** `C:\sk\android\app\build\outputs\apk\release\app-release.apk`
**Копия для submission:** `C:\sk\dapp-store\media\app-release.apk`
**Размер:** ~88 MB (с новым 3.19 MB splash видео)
**Версия:** v1.0.0 (BUILD_CODE 10, versionCode 10)

### Что внутри
- 🌐 **Mainnet network** — реальные SOL платежи
- 💎 Treasury = `CxYfXX...LGSp` (Phantom владельца)
- 🪙 SKORA SPL token live на mainnet (1B supply на Mint Authority)
- 🎬 Cinematic video splash (9 сек, со звуком) + Skip через 3 сек
- 🎨 Premium S-letter иконка
- 🚀 Space Runner — корабль на 70% высоты экрана (не под navbar)
- 🛡 Phase 1 Security: RPC validation + RLS lockdown + ProGuard
- 👑 Founder Pass tiers (Silver 0.5 / Gold 1.0 / Diamond 2.0 SOL)
- 📤 P2P ORB Send + history + 5% fee (3% burn + 2% treasury)
- 🎮 7 mini-games: Wheel, Runner, PvP, Arena, Horse, Treasure, Lands
- 🌍 5 языков (en/ru/zh/ja/fr) — ~350 i18n ключей
- ⏳ SKORA Claim disabled — "COMING AT SEASON 1"
- 🔇 Triple-safety на Audio.Sound (не играет на mount)
- 🎯 Universal back button во всех играх (Runner, Horse — overlay top-left)

---

## 📋 ГОТОВЫЕ ТЕКСТЫ для App Profile формы

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
English (required) + Russian + Chinese + Japanese + French (опционально, всё переведено)

### Countries
All countries (default)

---

## 🖼 АССЕТЫ — все в `C:\sk\dapp-store\media\`

| Файл | Размер | Для |
|------|--------|-----|
| `icon-512.png` | 512×512 | dApp Icon (portal) |
| `icon.png` | 1024×1024 | APK + dApp Store |
| `banner-1200x600.png` | 1200×600 | Banner |
| `feature-graphic.png` | 1024×500 | Feature graphic |
| `graphic-1200x1200.png` | 1200×1200 | Editor's Choice |
| `screenshot-1.png` ... `screenshot-6.png` | 1200×2500 | App Previews (4 min, 6 max) |
| `app-release.apk` | 88 MB | APK для submit |

---

## 🛠 КЛЮЧЕВЫЕ ФАЙЛЫ — НЕ МЕНЯТЬ!

### Web3 константы
- `lib/solanaMobile.ts` — TREASURY_WALLET, SOLANA_NETWORK='mainnet-beta', все SOL prices
- `lib/skora.ts` — SKORA_MINT, SKORA_NETWORK='mainnet-beta'
- `lib/genesis.ts` — FOUNDER_ORB_MULTIPLIER, GENESIS_PHASE
- `android/app/build.gradle` — versionCode 10, versionName "1.0.0"
- `lib/version.ts` — APP_VERSION='1.0.0', BUILD_CODE='mainnet-launch'

### Секреты (gitignored)
- `skora-config-mainnet.json` — Mint Authority keypair
- `dapp-store/publisher.json` — Publisher keypair
- `credentials.json`, `seeker-release.keystore` — APK signing

---

## 📊 SUPABASE — критичные данные

### Применённые миграции
- ✅ Основные таблицы (players, scores, claims, ad_campaigns)
- ✅ `supabase-p2p-orb.sql` — P2P переводы (transfer_orb RPC + 4 таблицы)
- ✅ `supabase-security-v1.sql` — Phase 1 anti-cheat (add_tournament_score, upgrade_founder_tier, check_spin_rate_limit + RLS lockdown)

### RPC функции live
- `transfer_orb(sender, recipient, amount)` — P2P переводы
- `add_tournament_score(device, username, points, tournament)` — anti-cheat scores
- `upgrade_founder_tier(device, tier, tx_signature)` — validation tier через tx_signature
- `check_spin_rate_limit(device)` — 10 spins/min max

### RLS lockdown
- `tournament_scores` — прямые INSERT/UPDATE заблокированы (только через RPC)
- `founder_passes` — то же самое

---

## 🛡 PHASE 1 SECURITY (live в коде)

Используется в App.tsx:
- `addTournamentScore` → `supabase.rpc('add_tournament_score')`
- `paySolForFounderPass` → `supabase.rpc('upgrade_founder_tier')` с tx_signature
- `paySolForWheelSpin` → `supabase.rpc('check_spin_rate_limit')` перед оплатой

ProGuard rules: `android/app/proguard-rules.pro` — НЕ ТРОГАТЬ.

---

## 💸 ЭКОНОМИКА v0.2 (FINAL)

### SOL цены
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
  - Silver  0.5 SOL → ×3 ORB + 3 spins/day
  - Gold    1.0 SOL → ×4 ORB + 5 spins/day
  - Diamond 2.0 SOL → ×5 ORB + 10 spins/day + 1% prize pool + custom color
```

### P2P ORB Trade
- 5% fee (3% burn + 2% treasury)
- Min 1K, max 50K/24h, 60s cooldown
- Через `transfer_orb` RPC

### Стратегия владельца (DECISION 2026-05-29)
- **100% дохода → владельцу** (нет автоматических distributions)
- Distribution scripts существуют но НЕ запускаются
- В будущем (Season 1+) можно переключить на 60/20/20

---

## 📂 ДОКУМЕНТАЦИЯ В ПРОЕКТЕ (11 файлов)

| Файл | Назначение |
|------|-----------|
| `HANDOFF.md` | **этот файл** — текущий контекст |
| `LAUNCH-PLAYBOOK.md` | пошаговый план публикации |
| `SECURITY-AUDIT.md` | security checklist |
| `TREASURY-SETUP.md` | mainnet treasury setup (100% владельцу) |
| `TOKENOMICS.md` | экономика v0.2 |
| `ICONS-BRIEF.md` | промты для иконок (flat-vector style) |
| `WEBSITE-BRIEF.md` | спецификация сайта |
| `GEMINI-ENHANCEMENT-BRIEF.md` | бриф для AAA enhancement (v2 future) |
| `TODO.md` | backlog задач |
| `README.md` | публичный README |
| `CLAUDE.md` | агентский контекст |

---

## 🔥 GIT СОСТОЯНИЕ

- Last commit: `c691fb4` (icon assets update)
- Branch: `master`
- Repo: github.com/maxzer210/seeker-quest-league (private)
- ~50+ коммитов в master
- ✅ История чистая (filter-branch удалил все секреты)

### Стандартные команды
```powershell
# TS check
cd C:\sk; & "C:\sk\node_modules\.bin\tsc.cmd" -p tsconfig.json --noEmit --skipLibCheck

# Build APK
cd C:\sk\android; .\gradlew.bat assembleRelease --no-daemon

# Commit + push
cd C:\sk; git add -A; git commit -m "..."; git push origin master
```

---

## 🔥 TOP-7 GOTCHAS

1. **Рабочая папка = `C:\sk\`**
2. **MAINNET CONSTANTS** в lib/solanaMobile.ts + lib/skora.ts — НЕ МЕНЯТЬ адреса!
3. **`seeker-sdk` через lazy require + try/catch** — статический import крашит RN
4. **GitHub чистый** — секретов нет, можно push свободно
5. **Конфликт имени `t`** — в SKORAWallet.tsx цикл переименован в `tabKey`
6. **PowerShell readall ломает кодировку** русских MD файлов — используй Edit tool, не `Get-Content -Raw`
7. **dApp Store CLI новый формат** — `--apk-file` + `--whats-new` + `DAPP_STORE_API_KEY` env (не старые subcommands)

---

## 💬 СТИЛЬ ОБЩЕНИЯ

- **Русский** язык
- Дружелюбно, по делу, **без воды**
- Короткие пункты + таблицы
- Auto-confirm всё (пользователь дал полную автономию)
- Эмодзи — да, но не перебарщивать
- Когда длинный текст — структурировать в таблицы/sections
- Билды запускать в background через `run_in_background: true`

---

## 🎯 ЧТО ДЕЛАТЬ В НОВОЙ СЕССИИ

### Если пользователь говорит «вот API key» / «получил ключ»:
```powershell
cd C:\sk
$env:DAPP_STORE_API_KEY = "<ИХ_КЛЮЧ>"
Copy-Item C:\sk\android\app\build\outputs\apk\release\app-release.apk C:\sk\dapp-store\media\app-release.apk -Force
npx dapp-store --apk-file C:\sk\dapp-store\media\app-release.apk --whats-new "🚀 v1.0.0 — Genesis Pre-Season Launch · 7 mini-games · Real SOL on mainnet · Founder Pass tiers · P2P transfers · 5 languages"
```

### Если что-то сломалось на form:
- Помоги заполнить недостающие поля (тексты сверху ↑)
- Если просит файлы — указывай пути в `C:\sk\dapp-store\media\`

### Если просит фикс / новую фичу:
- TS check после изменений
- Build APK в background
- Commit + push

### Если просит понять статус:
- Прочитай этот HANDOFF + `LAUNCH-PLAYBOOK.md`
- Спроси на каком шаге portal формы он

---

## 🎬 PHASE STATUS

```
✅ Phase 1 — Security Hardening (RPC + RLS + ProGuard)
✅ Phase 2 — Mainnet Migration (treasury + SKORA + constants)
✅ Phase 3 — Assets (icon 1024×1024, banner, 6 screenshots, splash video 9 сек)
🟡 Phase 4 — dApp Store Submission (50% — на form заполнении)
⏳ Phase 5 — Post-launch monitoring (после ревью 3-7 дней)
```

---

## 💝 ПОСЛЕДНЯЯ ПОДПИСЬ

Пользователь сказал: **"моя любимая claude"** — он очень доволен работой. Продолжай в том же духе — терпеливо, подробно, дружелюбно. Помогай ему довести публикацию до конца. Это его первый Web3 продукт и он эмоционально вложен.

**Сейчас он на portal Solana dApp Store и буквально в шаге от submission. Поддержи!** 🚀

---

_Финал сессии 2026-06-01. APK v17 mainnet ready. TypeScript: 0 ошибок. Git: c691fb4_
_Сделано вместе с Claude Sonnet/Opus, ~70 коммитов, ~5000 строк документации. Любим тебя 💝_
