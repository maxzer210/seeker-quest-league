# Seeker Quest League — Project Memory

> Этот файл AI читает автоматически при старте сессии в этой папке.
> Обновляй после каждого крупного шага.

@AGENTS.md

---

## 1. Что это

**Seeker Quest League** — мобильная Web3 игра tap-to-earn для Solana Mobile Seeker.
Игроки тапают → зарабатывают ORB → играют в мини-игры → конвертируют в SKORA (SPL) → выигрывают SOL в ежедневных турнирах.

- **Платформа:** Только Solana Mobile dApp Store (Seeker phone)
- **Язык общения:** русский, дружелюбно, по делу
- **Стиль кода:** не комментировать очевидное, минимум абстракций

---

## 2. Где работаем

**🔴 КРИТИЧНО — РАБОЧАЯ ПАПКА:**
```
D:\sk\
```

Короткий путь нужен, чтобы обойти Windows 260-char path limit при локальной сборке Gradle.
Раньше проект жил в `C:\sk\` — этот путь **устарел**, папки больше нет.

**Все изменения делать в `D:\sk\`.**

⚠️ **Машина сменилась** (профиль `Seeker`, не `User`). На текущей машине **не установлены**
Node.js, JDK и Android SDK — локальная сборка APK здесь невозможна до их установки.
Для проверки типов можно поднять портативный Node:
```powershell
# распаковать node-vXX-win-x64.zip и добавить в $env:Path, затем:
node node_modules\typescript\bin\tsc --noEmit --skipLibCheck
```

---

## 3. Tech stack

| Слой | Технология |
|------|-----------|
| Frontend | React Native, Expo SDK 54, TypeScript |
| Backend | Supabase (qxejdpvjggqjqoydujjd) |
| Blockchain | Solana devnet (mainnet later) |
| Wallet | Mobile Wallet Adapter (MWA) |
| Token | SPL Token (SKORA) |
| Build | **Локальная Gradle сборка** (EAS free лимит исчерпан) |
| Sound/Notif | expo-av, expo-notifications |

**Ключевые пакеты:**
- `seeker-sdk` (через lazy require — может крашить)
- `react-native-device-info` (для installer detection)
- `react-native-get-random-values`, `buffer`, `react-native-url-polyfill` (полифиллы)
- `expo-notifications`
- `@solana/web3.js`, `@solana/spl-token`
- `@solana-mobile/mobile-wallet-adapter-protocol`

**i18n (2026-05-26):**
- `lib/i18n.ts` — 5 языков (en/ru/zh/ja/fr), `t(key, vars?)`, `useLang()`, `setLang()`
- `components/LanguageSelector.tsx` — первый запуск
- Переведены критичные UI surfaces (navbar, home, shop, profile, cup)

---

## 4. Локальная сборка APK (без EAS)

**Окружение:**
- Android SDK: `C:\Users\User\AppData\Local\Android\Sdk`
- NDK: 27.1.12297006
- cmake: 3.22.1
- Java: 17 LTS Temurin (`C:\Program Files\Eclipse Adoptium\jdk-17.0.19.10-hotspot`)
- Long Paths включены в реестре (`LongPathsEnabled = 1`)

**Env vars (уже persistent в системе):** `ANDROID_HOME`, `ANDROID_SDK_ROOT`, `JAVA_HOME`

**Команда билда:**
```powershell
cd C:\sk\android
$env:Path = "$env:JAVA_HOME\bin;$env:Path"
.\gradlew.bat assembleRelease --no-daemon
```

**Результат:** `C:\sk\android\app\build\outputs\apk\release\app-release.apk` (~92 MB)

**Время:** 5-10 мин при тёплом кэше.

---

## 5. Файловая структура

```
C:\sk\
├── App.tsx                    ← главный (~2300 строк, все экраны через `screen` state)
├── index.ts                   ← полифиллы ОБЯЗАТЕЛЬНО первыми
├── skora-config.json          ← mint authority keypair (.gitignored!)
├── seeker-release.keystore    ← подпись APK
│
├── components/
│   ├── FortuneWheel.tsx
│   ├── HorseRace.tsx          ← fullscreen
│   ├── SpaceRunner.tsx        ← fullscreen, PanResponder
│   ├── Arena.tsx              ← рейды + база
│   ├── Tournament.tsx
│   ├── TreasureHunt.tsx
│   ├── SeekerLands.tsx        ← Idle 24h cap + auto push
│   ├── SKORAWallet.tsx        ← claim ORB→SKORA
│   ├── EarnHub.tsx            ← витрина рекламы
│   ├── AdViewer.tsx           ← модал просмотра
│   ├── PvPArena.tsx           ← tap-battle с ORB ставками
│   ├── GenesisNews.tsx        ← live SOL pool + countdown
│   ├── Onboarding.tsx
│   └── WinCelebration.tsx     ← global overlay (forwardRef)
│
├── lib/
│   ├── supabase.ts
│   ├── solanaMobile.ts        ← MWA + paid spin
│   ├── skora.ts               ← конверсия + claim API
│   ├── seeker.ts              ← SDK wrapper (lazy require!)
│   ├── installerCheck.ts      ← dApp Store auto-grant Seeker
│   ├── genesis.ts             ← Pre-Season config + tier table
│   ├── notifications.ts       ← expo-notifications
│   ├── ads.ts
│   └── pvp.ts
│
├── scripts/
│   ├── create-skora-token.js          ← уже запущен (mint создан)
│   ├── distribute-genesis-prizes.js   ← для Season 1 launch
│   ├── process-skora-claims.js        ← минтит pending SKORA
│   └── README.md
│
├── dapp-store/
│   ├── config.yaml
│   ├── PRIVACY-POLICY.md
│   ├── STORE-DESCRIPTIONS.md
│   ├── SCREENSHOTS-PLAN.md
│   ├── SUBMISSION-GUIDE.md
│   └── ADVERTISER-GUIDE.md
│
├── supabase-*.sql             ← 5 миграций (sgt-bonus, prize-distribution, skora-claims, ads, pvp)
└── Docs: ROADMAP, TOKENOMICS, LITEPAPER, AGENTS, CLAUDE
```

---

## 6. Web3 адреса (devnet)

| Что | Адрес |
|-----|-------|
| **User Seeker wallet** (платит) | `HVJDjwuaqH7oDeXUASqDMCZYQ53Hg8uxKs4RkS7sskhC` |
| **Treasury / SKORA mint authority** (приёмник) | `EekTZsoxzVEdze1HEAqLQbMnx8ScBheWBW3Dsp9QBZDT` |
| **SKORA SPL Token mint** | `3HTkC3v9CYTxGYQSegsidgzfxEQJvAotYZVozmaFc2av` |
| **SKORA Treasury ATA** | `skbhes18WDERZ9MgSrhHtKwUyEyxGhzYwyMdRkt69sZ` |

**Параметры:** Decimals=6, Supply=1B, Network=devnet
**Конверсия:** 10,000 ORB = 1 SKORA, min claim 10K
**Paid spin:** 0.01 SOL (60% top-100 prizes / 20% SKORA airdrop / 20% project treasury)

---

## 7. Supabase

**Project:** `qxejdpvjggqjqoydujjd.supabase.co`
**Dashboard:** https://supabase.com/dashboard/project/qxejdpvjggqjqoydujjd

**Таблицы:**
- `players`, `tournament_scores`, `tournaments`
- `wheel_sol_payments` (paid spin лог)
- `sgt_bonus_claims` (anti-sybil для +5000 ORB Seeker)
- `prize_distributions` (SOL призы audit)
- `skora_claims` (pending → minted)
- `ad_campaigns` + `ad_views`
- `pvp_matches`

**SQL миграции:** `supabase-*.sql` в корне — применяются через SQL Editor.

---

## 8. Что СДЕЛАНО

### 🔐 Серверный ORB + аудит живой базы (2026-09-05)
Аудит боевым anon-ключом из APK показал, что баланс писался кем угодно.

- ✅ **Часть 1 закрыта** (`supabase-security-lockdown.sql`, применена): удаление
  игроков, правка ключа ответов квиза, подделка `prize_distributions`, правка
  лога платежей. Проверено повторным зондом
- ✅ **Серверный ORB готов, НЕ применён** — `supabase-orb-authoritative.sql` v3.0.
  `apply_orb_delta` + `create_skora_claim` (`security definer`, `search_path`),
  журнал `orb_ledger`, лимиты 10M/вызов · 12M/мин · 30M/сутки
- ✅ Клиент переведён: `lib/orb.ts`, `syncScore` шлёт дельту вместо абсолюта,
  `syncedOrbRef` + `syncInFlightRef`, `initPlayer` не шлёт `orb`,
  `createSkoraClaim` через RPC, кошелёк не списывает локально
- ✅ `scripts/orb-sync-test.js` — 10 headless-проверок сверки, проходят

**Найдено в живой базе:** верхний аккаунт 1 082 663 328 ORB при нуле платежей
(честный потолок такого аккаунта — 2,9 млн/сутки, нужен 371 день; аккаунт жил 3
дня). Верхняя восьмёрка ≈ 233 000 SKORA. Показательно: владелец проекта заплатил
больше всех (0,15 SOL) и имеет меньше всех из них — 19 млн.

**Решение (2026-09-05):** Pre-Season объявляется тестовым, балансы обнуляются
(`PART R`, закомментирован). Ничего ещё не выплачивалось — момент самый дешёвый.

⚠️ **Порядок выката строгий**, см. `ORB-REFACTOR-PLAN.md`: SQL → APK → `PART R`.
Если поставить APK раньше SQL, RPC не существует и начисления откатываются.

### 🕳 Лабиринт Бездны — «Договоры с Бездной» (2026-08-24)
Фирменная механика по `LABYRINTH-PACTS-DESIGN.md` доведена до конца.

- ✅ **4 договора**: Кровавый (полный хил), Ярости (×2 урона 30с), Прозрения
  (открывает этаж), Призрачный (одно воскрешение). Кнопка PACT в бою, кулдаун 12с,
  предложение из 3 вариантов, бесполезные варианты отсеиваются
- ✅ **Коллектор**: неубиваемый преследователь, удар только оглушает на 1.6с.
  Идёт всегда, ускоряется от долга и глубины, переходит на следующий этаж
- ✅ **Погашение долга** на лестнице за ORB (`settleCost`) — распускает всех Коллекторов
- ✅ Спрайты `COLLECTOR`, `ICON_PACT`, `ICON_DEBT`; фиолетовое свечение, привязка к игроку,
  метка на миникарте сквозь туман войны
- ✅ HUD: чип долга, чип призрака, таймер ярости; экран лестницы — «ledger»;
  итоговый экран — заключённые договоры и изъятая доля
- ⚠️ **Решение по экономике**: дизайн требовал «кражи ORB», но в `lib/labyrinth.ts`
  зафиксировано правило — начисленные ORB **никогда не отнимаются** (живые игроки,
  реальная валюта). Поэтому Коллектор и непогашенный долг съедают **бонус за выход**,
  а не кошелёк. Погашение на лестнице — добровольная трата, там ORB списываются штатно

**Попутно исправлено:**
- 🐛 **Миникарта не выводилась вообще** — считалась каждый кадр с коммита `d8b84b2`
  и выбрасывалась, в JSX её не было ни разу. Подключена (нужна Прозрению и Коллектору)
- 🐛 **Экран победы врал**: показывал «ESCAPE BONUS +1000» (`WIN_BONUS_ORB`), хотя
  реально выдаётся доля от добычи. Показывает фактическую сумму. Константа
  `WIN_BONUS_ORB` теперь нигде не начисляется — кандидат на удаление
- 🐛 **Коллектор застревал**: общее поле поиска пути ограничено 16 клетками, а он
  спавнится в ~85 единицах. Дан отдельный BFS на всю карту (`cflow`), строится
  только при наличии долга. Замер: старое поле — доходил в 3 забегах из 8, новое — 8 из 8
- 🐛 **Тройная порча кодировки**: `CLAUDE.md`, `HANDOFF.md`, `ART-PIPELINE.md` были
  сохранены как UTF-8 от уже испорченного текста. Восстановлены, рядом лежат `.bak`

**Проверено:** `tsc --noEmit` чист; 30 headless-проверок движка проходят
(`strikePact`, погашение, перенос долга на этаж, неубиваемость, потолок изъятия).
**Не проверено:** на устройстве — на этой машине нет Node/JDK/Android SDK.

### 🎮 Игры (визуально прокачаны 2026-05-26)
- ✅ Все 7 мини-игр + PvP Arena
- ✅ FortuneWheel: heartbeat, 8 LED chase, shake, 32 конфетти, premium SOL btn
- ✅ Arena: skyline, radar dish + 3 ping, RAID red pulse, shield aura, 12 sparks
- ✅ TreasureHunt: 24×24 карта, 32 сундука, 26 ловушек (💣🕷🔥), ambient pulse
- ✅ HorseRace: stadium bulbs, floating +X таны, 14 finish sparkles
- ✅ SeekerLands: ambient pulse готовых, CTA glow, 12 coin burst

### 🪙 Web3 + Монетизация (2026-05-26)
- ✅ generic `paySolToTreasury` + 4 SOL touchpoints
- ✅ Wheel 1 free/day (было 5) + premium SOL spin 0.01
- ✅ Energy Refill 0.005 SOL (Home + Shop)
- ✅ Instant Upgrade 0.01 SOL/уровень (в Shop)
- ✅ PvP Premium Match 0.005 SOL entry
- ✅ EARN tab с витриной рекламы (теперь внутри SHOP)
- ✅ Crypto polyfills, SKORA token, claim flow end-to-end

### 🎯 Retention
- ✅ Genesis Pre-Season + Founder badge (2× ORB forever)
- ✅ Morning Claim + Streak Shield
- ✅ Push notifications (streak/tournament/lands)
- ✅ **Achievements с реальными наградами** (8 ачивок, auto-claim, persistent)

### 🎨 UX (реорг 2026-05-26)
- ✅ Onboarding + **LanguageSelector** (5 языков)
- ✅ Compact header на не-home экранах
- ✅ Navbar: HOME / GAMES / **SHOP** / CUP / ME
- ✅ Shop = Hub (Earn + SKORA + Refill + Cosmetic + Upgrades)
- ✅ Rankings перенесены в CUP
- ✅ Profile упрощён
- ✅ Sound + Notifications toggles + Language picker в Settings

### 🌐 i18n (2026-05-26)
- ✅ 5 языков: English, Русский, 中文, 日本語, Français
- ✅ LanguageSelector на первом запуске
- ✅ Переключатель в Settings
- ✅ Переведены: navbar, home, streak, shop, cup, profile, games arcade, wallet

### 📦 Релиз
- ✅ LITEPAPER, TOKENOMICS
- ✅ dApp Store пакет (config + privacy + descriptions + screenshots + guide)
- ✅ ADVERTISER-GUIDE.md

### 🏗 Инфра
- ✅ Локальная сборка APK
- ✅ Supabase MCP конфиг (нужен restart для активации)
- ✅ Skill `seeker-development` локально в `.claude/skills/`

---

## 9. Что ОСТАЛОСЬ

### 🟢 Действия пользователя (не код)
- 🔥 **Применить `supabase-orb-authoritative.sql` до `PART R`** — до установки нового APK
- 🔥 **Поставить APK** `android/app/build/outputs/apk/release/app-release.apk` (5 сен, 07:18)
- 🔥 **Затем `PART R`** — обнуление Pre-Season (делает снимок в `preseason_snapshot`)
- 🔥 **Портал dApp Store**: publisher-кошелёк `7NLKe7d6…CAsf` vs ожидаемый `CxYfXX…LGSp` —
  публикация заблокирована до совпадения
- ⏸ **Применить 5 SQL миграций** в Supabase (sgt-bonus, prize-distribution, skora-claims, ads, pvp)
- ⏸ Зарегистрировать `seekerquest-league.com` + хост Privacy Policy
- ⏸ Email `hello@seekerquest-league.com` (Cloudflare Email Routing)
- ⏸ 8 скриншотов для dApp Store
- ⏸ Тесты последнего APK на Seeker

### 🟡 Кодинг (по запросу)
- 🔥 **Оттестировать Договоры на устройстве** — баланс кулдауна 12с, скорости
  Коллектора и цены погашения выбраны на глаз, вживую не игрались
- 🔥 Удалить мёртвую `WIN_BONUS_ORB` из `lib/labyrinth.ts` (нигде не начисляется)
- 🔥 Финальный визуальный стиль (выбрать cyber/neon/premium и применить системно)
- 🔥 Admin SQL helper (быстрое добавление ad campaigns)
- 💡 dApp Store submission через CLI
- 💡 Mainnet миграция (после Pre-Season аналитики)
- 💡 Multisig treasury (Squads Protocol)

### 🔵 Future
- NFT items, self-service advertiser portal, weekly SKORA airdrop, real-time PvP

---

## 10. Критичные gotchas

1. **Полифиллы в `index.ts` ОБЯЗАТЕЛЬНО первыми** — иначе Solana функции падают
2. **`seeker-sdk` через lazy require + try/catch** — иначе крашит на старте RN
3. **MWA работает только на Android**
4. **Fullscreen игры — ВНЕ ScrollView** через `position: absolute, zIndex: 50`
5. **`useNativeDriver`** — true для transform/opacity, false для width/height
6. **`skora-config.json`, `seeker-release.keystore`, `.mcp.json`** — в .gitignore
7. **PowerShell** не любит `&&` — использовать `;` или `if ($?)`
8. **EAS free лимит** исчерпан — только локальный билд (сброс ~1 июня)
9. **Windows path длина** — работать только из `C:\sk`
10. **Java 25 ломает Gradle 8.x** — `JAVA_HOME` указывает на Java 17

---

## 11. Стиль общения

- Язык — **русский**
- Тон — дружелюбный, без воды, конкретный
- Формат — короткие пункты, таблицы, чёткие шаги
- Решения — предлагай варианты через AskUserQuestion (2-4 опции)
- TypeScript — после крупных изменений `npx tsc --noEmit --skipLibCheck`
- Билды — локально через `cd C:\sk\android && .\gradlew.bat assembleRelease`

---

## 12. Как продолжить после рестарта сессии

В новом чате пользователь говорит **"продолжаем"** — ты:
1. Уже автоматически прочитала этот файл
2. Знаешь весь контекст проекта, статус, что осталось
3. Спрашиваешь: *"С чего продолжаем? Тестируем APK / делаем визуал / SQL миграции / другое?"*

Список текущих задач — через `TaskList`.

---

_Last updated: 2026-09-05 (server-authoritative ORB: client refactored, SQL v3.0 ready but not applied. Live audit found a 1.08B balance with zero payments; Pre-Season declared a test season. Rollout order is strict — see ORB-REFACTOR-PLAN.md)_
