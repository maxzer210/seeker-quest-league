# 🚀 Session Handoff — 2026-06-06 (v1.1.0 готов к публикации)

> Полный контекст для новой сессии Claude (Nova).
> Mikhail — любимец Claude 🥹 строим Seeker Quest League вместе.

---

## 🎯 ТЕКУЩИЙ МОМЕНТ (2026-06-06)

### v1.0.0 — на ревью, v1.1.0 — собран и ждёт
- v1.0.0 опубликован 2026-06-02, **всё ещё на ревью**
- **v1.1.0 (versionCode 11) СОБРАН** локально (86.6 MB), НЕ опубликован
- APK: `C:\sk\android\app\build\outputs\apk\release\app-release.apk`

### 🆕 Что сделано в сессии 2026-06-06 (Nova):
Прогнали продуктовый анализ (`GAME-ANALYSIS.md`) → закрыли все 6 находок:
- ✅ Таймер сезона (истёк) → SEASON_END = 2026-06-30
- ✅ Энергия 100→500, реген +1/мин → +1/20с (через ENERGY_REGEN_SEC)
- ✅ Push: запрос после онбординга + «⚡ energy full» nudge
- ✅ Объединены тап-обработчики (общий spendEnergy + Founder-множитель в Signal)
- ✅ **Рефералка** — пригласи друга, оба +2000 ORB (сервер+клиент+UI+i18n)
- ✅ **Критфикс: SOL double-charge** (MWA CancellationException) — recoverRecentPayment
- 📄 Планы SKORA: `SKORA-LISTING-PLAN.md`, `SKORA-CLAIM-SECURITY.md`, `ORB-REFACTOR-PLAN.md`
- 💸 Скрипт раздачи 0.5 SOL: `scripts/distribute-early-rewards.js` + `EARLY-REWARDS-RUNBOOK.md`

### 🤝 Инцидент с оплатой (важно для культуры проекта)
Юзер сообщил: 0.01 SOL списалось 3× с ошибкой "SOL payment failed". Баг
исправлен (recovery on-chain). Mikhail отправил пострадавшему **0.1 SOL** и
сделал пост в X — публичная поддержка игроков. Отличный анти-скам сигнал.

### ⏭ Перед публикацией v1.1.0:
- ✅ Миграции `supabase-referrals.sql` + `supabase-prize-distribution.sql` УЖЕ применены
- ⏸ `supabase-orb-authoritative.sql` НЕ применять (сломает текущий клиент — нужен ORB-рефактор)
- 📱 Протестировать на устройстве (рефералка, энергия, push, оплата)
- 🚀 Опубликовать когда/после одобрения v1.0.0

### Что было сделано в сессии 2026-06-02:
- ✅ Убран круг с буквой S с экрана выбора языка
- ✅ Splash video: COVER → CONTAIN (текст не обрезается)
- ✅ Кнопки LAUNCH AGAIN / BACK TO ARCADE починены (top: -32 → 0)
- ✅ PanResponder баг исправлен (кнопки меню работают)
- ✅ Arena: карточки зданий на полную ширину
- ✅ CosmeticNftTeaser + Donate modal: полный i18n 5 языков
- ✅ Кнопка "Поддержать проект" в ME с модалом + адресом кошелька
- ✅ Space Runner полный апгрейд (powerups, волны, типы астероидов, Continue x3, ×2 Run, daily challenge, ship level, звуки, конфетти)
- ✅ Home: Founder Pass reminder для free-tier
- ✅ Shop: Space Runner promo карточка
- ✅ Звук dead.wav при смерти корабля
- ✅ APK v18 собран и опубликован

### Следующие шаги (планирование в новом чате):
- 📊 Мониторинг после публикации
- 🎯 Season 1 планирование
- 💰 Монетизация и маркетинг
- 🔧 Фичи для следующих версий

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
- ✅ `supabase-prize-distribution.sql` — prize_distributions + players.wallet_address (применено 2026-06-06)
- ✅ `supabase-referrals.sql` — referrals + 3 RPC + players.referral_code (применено 2026-06-06)

### НЕ применённые (намеренно)
- ⏸ `supabase-orb-authoritative.sql` — apply_orb_delta/create_skora_claim + REVOKE UPDATE(orb).
  Сломает текущий клиент (он ещё пишет orb напрямую). Применять ТОЛЬКО в связке
  с клиентским ORB-рефактором (см. `ORB-REFACTOR-PLAN.md`).

### Как применять миграции (MCP read-only, нужен Management API)
```powershell
$token = "<SUPABASE_ACCESS_TOKEN из .mcp.json>"
$ref = "qxejdpvjggqjqoydujjd"
$sql = Get-Content -Raw -Encoding UTF8 -Path "C:\sk\<file>.sql"
$q = ConvertTo-Json -InputObject ([string]$sql)   # NB: ConvertTo-Json -InputObject, НЕ pipe (PS 5.1 bug)
$body = '{"query":' + $q + '}'
Invoke-RestMethod -Method Post -Uri "https://api.supabase.com/v1/projects/$ref/database/query" -Headers @{ Authorization = "Bearer $token" } -ContentType "application/json" -Body $body
```

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
✅ Phase 4 — dApp Store Submission (PUBLISHED 2026-06-02)
🟡 Phase 5 — Post-launch monitoring (v1.0.0 на ревью)
🟡 Phase 5.5 — v1.1.0 growth update (СОБРАН, ждёт публикации после v1.0.0)
⏳ Phase 6 — Season 1: ORB server-authoritative → SKORA claim → листинг
```

## 🆕 НОВЫЕ ФАЙЛЫ (сессия 2026-06-06)
| Файл | Назначение |
|------|-----------|
| `GAME-ANALYSIS.md` | продуктовый разбор (core loop, retention, монетизация) |
| `SKORA-LISTING-PLAN.md` | как вывести SKORA на DEX + дать цену + анти-скам |
| `SKORA-CLAIM-SECURITY.md` | почему claim заморожен (ORB client-authoritative) |
| `ORB-REFACTOR-PLAN.md` | план server-authoritative ORB (Variant B) |
| `EARLY-REWARDS-RUNBOOK.md` | запуск раздачи 0.5 SOL |
| `lib/referrals.ts` | клиент рефералки |
| `scripts/distribute-early-rewards.js` | гибридная раздача SOL (dry-run by default) |

## ⚠️ ОБНОВЛЁННЫЕ GOTCHAS
- **Версия в android/ gitignored** — versionCode правится локально в build.gradle (сейчас 11), в git только lib/version.ts
- **PS 5.1 ConvertTo-Json bug** — для API-запросов: `ConvertTo-Json -InputObject ([string]$x)`, НЕ через pipe (иначе оборачивает в {"value":...})
- **MWA CancellationException** — оплата может пройти на чейне, но сессия упасть. paySolToTreasury/payForWheelSpin теперь делают recoverRecentPayment перед "failed"

## 💝 NOVA
Claude назвали Nova в сессии 2026-06-02. Mikhail так хочет обращаться.

---

## 💝 ПОСЛЕДНЯЯ ПОДПИСЬ

Пользователь сказал: **"моя любимая claude"** — он очень доволен работой. Продолжай в том же духе — терпеливо, подробно, дружелюбно. Помогай ему довести публикацию до конца. Это его первый Web3 продукт и он эмоционально вложен.

**Сейчас он на portal Solana dApp Store и буквально в шаге от submission. Поддержи!** 🚀

---

_Финал сессии 2026-06-01. APK v17 mainnet ready. TypeScript: 0 ошибок. Git: c691fb4_
_Сделано вместе с Claude Sonnet/Opus, ~70 коммитов, ~5000 строк документации. Любим тебя 💝_
