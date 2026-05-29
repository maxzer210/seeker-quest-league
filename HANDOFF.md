# Session Handoff — 2026-05-29

> Tokenomics v0.2 + P2P + Founder Pass + Premium Shop + Lottie + Home redesign

---

## 🎯 Что сделано (последняя сессия — Opus 4.7)

### Фаза A — UX & визуал
1. ✅ **Lottie splash screen** — 2.5с анимация орба + кольца + частицы
2. ✅ **Home screen redesign** — убран planet grid, добавлены Hero Card + TAP focus + CTA
3. ✅ **Fix Space Runner** — `top: -32, zIndex: 200` для полноэкранности
4. ✅ **README.md** — 357 строк с badges, features, structure, roadmap

### Фаза B — Tokenomics v0.2 (БОЛЬШИЕ ИЗМЕНЕНИЯ)
1. ✅ **Все SOL цены унифицированы → 0.01 SOL** (wheel, energy, upgrade, pvp)
2. ✅ **Premium Shop tiered (0.01-0.05 SOL)**:
   - Shield Pack 0.01, Mega Boost 0.02, Instant Level 0.03, Mega Bundle 0.05
3. ✅ **Founder Pass Tier System** — Silver 0.5 / Gold 1.0 / Diamond 2.0 SOL
   - Permanent ORB multipliers: ×3 / ×4 / ×5
   - Free spins/day: 3 / 5 / 10
   - Diamond: 1% prize pool + custom username color
4. ✅ **P2P ORB Trade enabled**:
   - 5% fee (3% burn + 2% treasury)
   - Min 1K, max 50K/24h, 60s cooldown
   - SQL RPC `transfer_orb()` applied to Supabase ✅
5. ✅ **Triple Burn mechanism**:
   - Monthly buyback (10% treasury → SKORA buy & burn)
   - P2P transfer burn (3%)
   - Premium SOL auto-burn (5% weekly)

### Фаза C — Security & GitHub
1. ✅ **Email rename** → `adsskora@gmail.com` (13 occurrences, 8 файлов)
2. ✅ **Secrets untracked** — credentials, keystore, logs removed from git
3. ✅ **Git history cleaned** — filter-branch removed secrets from ALL commits
4. ✅ **Private GitHub repo** — `github.com/maxzer210/seeker-quest-league`
5. ✅ **WEBSITE-BRIEF.md** — спецификация сайта для Gemini

### Build
- ✅ APK v1 собран (92.67 MB)
- ⏳ APK v2 (с P2P + Founder Pass) собирается сейчас

### Git
- 22 коммита в master
- Последний: `6c2af42` (P2P Send modal)
- Запушен на приватный GitHub

---

## 📋 Что осталось

### 🔴 User actions
| # | Задача | Время |
|---|--------|-------|
| 1 | Зарегистрировать домен `seekerquest.league` | 5 мин |
| 2 | Задеплоить `dapp-store/privacy.html` на GitHub Pages | 10 мин |
| 3 | Сделать 8 скриншотов 1080×1920 | 30 мин |
| 4 | Создать иконки: 512×512, 1200×600, 1024×500 | 1-2 ч |
| 5 | Пополнить publisher кошелёк ~0.5 SOL mainnet | 5 мин |
| 6 | Сгенерировать сайт через Gemini по WEBSITE-BRIEF.md | 1-2 ч |

### 🟡 Code TODOs
- ✅ **Founder Pass UI** — ЗАВЕРШЁН
- ✅ **P2P ORB Send modal** — ЗАВЕРШЁН
- ✅ **Supabase miграция P2P** — ПРИМЕНЕНА
- **Daily free spins логика** для Founder tier (3/5/10 spins/day)
- **Custom username color** для Diamond
- **Monthly buyback cron script** (`scripts/monthly-burn.js`)
- **Diamond 1% prize pool** интеграция
- **Transfer history** в Send ORB модале
- **i18n** для всех новых текстов
- **dApp Store CLI** установка + сабмит
- **Mainnet migration** после Pre-Season

---

## 📊 Web3 константы (НЕ ИЗМЕНЯТЬ)

```
User wallet (devnet):  HVJDjwuaqH7oDeXUASqDMCZYQ53Hg8uxKs4RkS7sskhC
Treasury (devnet):     EekTZsoxzVEdze1HEAqLQbMnx8ScBheWBW3Dsp9QBZDT
SKORA mint:            3HTkC3v9CYTxGYQSegsidgzfxEQJvAotYZVozmaFc2av
SKORA Treasury ATA:    skbhes18WDERZ9MgSrhHtKwUyEyxGhzYwyMdRkt69sZ
Supabase URL:          qxejdpvjggqjqoydujjd.supabase.co
GitHub repo:           github.com/maxzer210/seeker-quest-league (private)
Email:                 adsskora@gmail.com
```

## 💰 SOL Pricing (FINAL v0.2)

```
Standard (0.01 SOL):     Wheel spin, Energy refill, Instant upgrade, PvP entry
Premium Tier:            Shield 0.01 / Mega Boost 0.02 / Instant Level 0.03 / Mega Bundle 0.05
Founder Pass:            Silver 0.5 / Gold 1.0 / Diamond 2.0 SOL
```

## 🔥 Founder Multipliers

```
Free Founder:    ×2 ORB (1 paid spin)
Silver Pass:     ×3 ORB + 3 free spins/day
Gold Pass:       ×4 ORB + 5 free spins/day + NFT priority
Diamond Pass:    ×5 ORB + 10 free spins/day + 1% pool + custom color
```

---

## 🔥 Top-5 gotchas (для нового чата)

1. **Рабочая папка = `C:\sk\`**
2. **EAS лимит исчерпан** до ~1 июня — только `gradlew.bat assembleRelease`
3. **`seeker-sdk` через lazy require + try/catch** — статический import крашит RN
4. **GitHub чистый** — секретов нет, можно push свободно
5. **Конфликт имени `t`** — в SKORAWallet.tsx цикл переименован в `tabKey`

---

## 💬 Стиль общения

- **Русский** язык
- Дружелюбно, по делу, без воды
- Короткие пункты + таблицы
- TS check: `cd C:\sk; & "C:\sk\node_modules\.bin\tsc.cmd" -p tsconfig.json --noEmit --skipLibCheck`
- Билд: `cd C:\sk\android && .\gradlew.bat assembleRelease --no-daemon`
- Push: `git push origin master`
- Полная автономия — auto-confirm

---

_Сессия 2026-05-29. TypeScript: 0 ошибок. v0.2 ✅ P2P ✅ Founder Pass ✅ GitHub ✅ Git: 6c2af42_
