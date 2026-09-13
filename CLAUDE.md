# Seeker Quest League — Project Memory

> Этот файл AI читает автоматически при старте сессии в этой папке.
> Обновляй после каждого крупного шага.

@AGENTS.md
@CLAUDE.local.md

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

✅ **Тулчейн установлен** (проверено 2026-09-05, сборка v1.2.1 прошла):

| Что | Где |
|-----|-----|
| Node | `D:\dev\node\node.exe` (v22.11.0) |
| JDK 17 | `D:\dev\jdk17` (`JAVA_HOME` уже persistent) |
| Android SDK | `D:\dev\android-sdk` (`ANDROID_HOME`, build-tools 36.0.0) |

Проверка типов:
```powershell
D:\dev\node\node.exe node_modules\typescript\bin\tsc --noEmit --skipLibCheck
```

---

## 3. Tech stack

| Слой | Технология |
|------|-----------|
| Frontend | React Native, Expo SDK 54, TypeScript |
| Backend | Supabase (qxejdpvjggqjqoydujjd) |
| Blockchain | **Платежи в SOL — mainnet-beta** (с 2026-07-13). Статус SKORA-токена не выяснен |
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

**Env vars (persistent):** `ANDROID_HOME` / `ANDROID_SDK_ROOT` = `D:\dev\android-sdk`,
`JAVA_HOME` = `D:\dev\jdk17`. Long Paths включены в реестре (`LongPathsEnabled = 1`).

**Команда билда:**
```powershell
$env:Path = "D:\dev\jdk17\bin;D:\dev\node;$env:Path"
Set-Location D:\sk\android
.\gradlew.bat assembleRelease --no-daemon
```
Node **обязательно** в `Path` — RN-плагин Gradle бандлит JS через него.

**Результат:** `D:\sk\android\app\build\outputs\apk\release\app-release.apk`
~140 MB — universal APK со всеми четырьмя ABI (arm64-v8a, armeabi-v7a, x86, x86_64).
Если размер станет проблемой для dApp Store — `abiFilters 'arm64-v8a'` даёт ~50 MB,
Seeker всё равно только arm64.

**Время:** 14 мин с нуля, 3-5 мин при тёплом кэше.

**Проверка готового APK:**
```powershell
D:\dev\android-sdk\build-tools\36.0.0\aapt2.exe dump badging <apk> | Select-String "^package:"
D:\dev\android-sdk\build-tools\36.0.0\apksigner.bat verify --print-certs <apk>
```

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

### 📉 Телеметрия первой сессии + починка витринных текстов (2026-09-12, v1.2.4 / vc 20)

**Зачем.** Аудит живой базы 2026-09-07: 116 игроков за всё время, 15 активных за
30 дней, 6 за 7, 3 за 3, 0 за сутки. **62 из 116 застряли на первом уровне.**
`ad_views` = 0. Где именно отваливаются — не записывал никто, поэтому любая
правка под это была бы угадыванием.

- ✅ `supabase-funnel.sql` **применён** (2026-09-12). Таблица `funnel_steps`
  (PK `device_id, step`, `insert … on conflict do nothing`), RPC `track_step`
  с белым списком шагов, вьюха `funnel_summary`
- ✅ `lib/funnel.ts` + разметка в `App.tsx`. 12 шагов: `app_open`,
  `lang_picked`, `onboard_start`, `onboard_done`, `home_seen`, `first_tap`,
  `first_game`, `quest_open`, `level_2`, `wallet`, `day_2`, `legacy`
- 💡 **Читать колонку `devices_new`, а не `devices`.** Существующие игроки при
  первом запуске новой сборки штампуют `home_seen`/`level_2` — то, что прошли
  месяц назад. Такие установки метятся `legacy` и вычитаются. Без этого воронка
  нарисовала бы здоровую картину из воспоминаний
- ✅ Проверено зондом на живой базе: RPC доступна anon и отбивает неизвестный шаг,
  вьюха читается, **прямая вставка в таблицу → 401**
- ⚠️ Чтение воронки открыто **сознательно** — в таблице только device_id и время,
  зато её видно снаружи дашборда. С `wheel_sol_payments` вышло наоборот: он
  закрыт RLS, и выручку из сессии посмотреть невозможно

**Порча кодировки в витринных документах.** Три файла лежали в двойной кодировке
(UTF-8 прочитан как cp1251 и сохранён снова):

| Файл | Было → стало |
|---|---|
| `STORE-DESCRIPTIONS.md` | 966 → 331 не-ASCII |
| `ADVERTISER-GUIDE.md` | 140 → 56 |
| `PRIVACY-POLICY.md` | 63 → 21 |

`STORE-DESCRIPTIONS.md` — текст листинга магазина. Если его копировали в портал,
в карточке стояло `вЂ"` вместо тире. **Вероятный кандидат на «Action Needed» у
1.2.3.** Починено, рядом `.bak`. Плюс телеметрия описана в политике приватности
и в экране приватности внутри приложения.

### 🐛 Таймер квеста откатывался раз в секунду (2026-09-07, APK v1.2.2 / vc 18)

Первый живой прогон квеста вскрыл баг, который лежал незамеченным с v1.2.0 —
квест стоял пустой, и до таймера просто никто не доходил.

- 🐛 `onEarnOrb` и `onPlaySound` передаются из `App.tsx` **инлайновыми стрелками** —
  новые функции на каждый рендер. От них зависит `commit` (`useCallback`), а от
  `commit` зависел эффект, запускающий вопрос. В App крутится интервал энергии с
  тактом ровно 1 секунда → каждую секунду эффект перезапускался, `startedAt`
  сбрасывался, часы откатывались с 9 на 10, дедлайн не наступал никогда и вопрос
  не сменялся. Оба симптома — одно следствие
- ✅ `commit` читается через реф, эффект привязан к `current?.slot` — примитиву,
  меняющемуся ровно раз за вопрос. Дедлайн и форфейт при сворачивании тоже через реф
- 💡 **Почему фикс в дочернем компоненте, а не в `App.tsx`**: реф не зависит от того,
  обернёт ли родитель колбэки в `useCallback`. Правка в App починила бы сегодня и
  сломалась бы от следующего редактирования
- ✅ Остальные семь игр проверены на ту же связку, чисто. У `HorseRace` интервалы
  живут в рефах и стартуют по действию, эффект их не перезапускает
- ✅ Подтверждено на устройстве: все пять вопросов сменяются, сияние отрисовалось

### 🏷 Имена на таблицах + ◎ Solana Quest (2026-09-05, APK v1.2.1 / vc 17)

**Имена.** Игрок жаловался: `.skr` домен виден в профиле и на главной, а в таблице
кубка одни `Seeker#XXXX`. Оказалось шире — кастомные ники тоже не показывались.

- 🐛 **Корень**: восстановление имени в `hydratePlayer` сидело внутри
  `if (savedOrb === null)` — работало только при чистой установке. Любой
  вернувшийся игрок поднимался как `Seeker#XXXX`, и именно эту заглушку
  `addTournamentScore` штамповал в `tournament_scores`. Она же обманывала эффект
  адопции `.skr`, который принимал её за «имя не выбрано» и затирал выбранный ник
- ✅ Восстановление вынесено из ветки; открывшаяся гонка (профиль `.skr` мог прийти
  раньше загрузки имени) закрыта флагом `nameRestored`
- ✅ `Tournament.tsx` резолвит живое имя из `players` — снимок в `tournament_scores`
  остаётся запасным. Чинит все исторические строки разом, включая старые APK
- 🐛 **Находка**: 9 имён в живой базе лежат байтовым массивом —
  `101,120,112,108,111,114,101,114.skr` вместо `explorer.skr`. Писали сборки до
  `normalizeSkrDomain`. Сам игрок не починит: имя не начинается с `Seeker#`, эффект
  адопции обходит его как выбранный ник. `repairUsername` в `lib/seeker.ts`
  декодирует при отображении; строки в базе чинит опциональный
  `supabase-fix-byte-array-usernames.sql` (**не применён**, PART 2 закомментирован)
- 🐛 Подиум резал имя `.slice(0, 9)` — `cryptonofreme.skr` показывался бы как
  `cryptonof`. Убрано, `numberOfLines` и так обрезает

**Solana Quest.** Экран существовал, но в проде был мёртв. Три причины:

- 🐛 **Выпусков нет с 2026-08-24.** `build_quiz_day()` никто не вызывал — он
  запускался один раз вручную внизу `supabase-quiz.sql`. Планировщика нет.
  Карточка «PLAY TODAY'S SET» на главной 12 дней вела в пустоту
- 🐛 **Банк меньше аппетита сборщика**: нужно 2+2+1 в день, а он отказывался брать
  что-либо из последних 60 дней. При 6 лёгких вопросах — 3 дня квеста, дальше ничего
- 🐛 **Правильный ответ всегда кнопка A** — у всех 20 вопросов `correct_index = 0`,
  клиент не перемешивает
- ✅ `supabase-quiz-refresh.sql` (**применить до/вместе с APK**): сборщик переписан
  на least-recently-used (пустой день невозможен), `ensure_quiz_day()` — безопасная
  RPC для anon, выпуск собирает первый открывший, все вопросы пересобраны,
  **+62 новых** (20/22/20). Итого 82 в банке
- ✅ `quiz_add` принимает варианты с правильным **первым** и мешает при вставке —
  руками расставлять 62 индекса это способ посеять неверный ключ
- ✅ Визуал: кольцо таймера на Skia (изолировано, свой такт 30fps, не перерисовывает
  кнопки), дрейфующее сияние в цветах Solana, пять точек забега вместо «2/5»,
  тряска на неверном, пульс на верном
- ✅ **Проверено на устройстве 2026-09-07** — кольцо и сияние на месте. Писалось без
  возможности запустить, сверялось только с API установленной Skia 2.2.12
  (`PaintStyle`, `StrokeCap`, `drawArc`). Свечение сделано вторым широким
  полупрозрачным `drawArc`, а не mask filter — ради предсказуемости между версиями

**Релизный текст:** `dapp-store/RELEASE-NOTES-v1.2.1.md` + `new_in_version` в
`config.yaml`.

### 🔐 Серверный ORB + аудит живой базы (2026-09-05)
Аудит боевым anon-ключом из APK показал, что баланс писался кем угодно.

- ✅ **Часть 1 закрыта** (`supabase-security-lockdown.sql`, применена): удаление
  игроков, правка ключа ответов квиза, подделка `prize_distributions`, правка
  лога платежей. Проверено повторным зондом
- ✅ **Серверный ORB ПРИМЕНЁН на живой базе** (2026-09-05) —
  `supabase-orb-authoritative.sql` v3.0 + `supabase-orb-fix-column-update.sql`.
  `apply_orb_delta` + `create_skora_claim` (`security definer`, `search_path`),
  журнал `orb_ledger`, лимиты 10M/вызов · 12M/мин · 30M/сутки.
  Проверено ключом из APK: `UPDATE players.orb` → 401, переименование → 204,
  сквозной прогон через RPC даёт верный баланс
- ⚠️ **Грабля**: `revoke update (col) ...` — пустая операция, если у роли есть
  право на всю таблицу. Нужно `revoke update on <table>` целиком, потом
  `grant update (нужные колонки)`. Первый заход это пропустил, дыра осталась
  открытой и нашлась только повторным зондом
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
- ✅ **Плагин Expo установлен** (2026-09-13) — `expo@claude-plugins-official` 1.12.5,
  область `project`. До этого был **включён в `settings.json`, но ни разу не
  установлен** (`installed_plugins.json` пустой) — включение не устанавливает.
  24 скила, ~3k токенов в каждую сессию. Ставится встроенным CLI десктопного
  приложения, в PATH его нет:
  `%APPDATA%\Claude\claude-code\<версия>\claude.exe plugin install expo@claude-plugins-official --scope project`
  - Хуки `PostToolUse`/`UserPromptExpansion` проверены: телеметрия **opt-in**,
    выключена по умолчанию и на этой машине; текст запросов не шлёт никогда
  - MCP-сервер `https://mcp.expo.dev/mcp` требует входа в аккаунт Expo
  - **Под этот проект** годятся `expo-upgrade`, `expo-dev-client`, `eas-update`,
    `expo-module`, `expo-animation`. Остальное про Expo Router, App Store, веб —
    мимо: здесь один `App.tsx`, только Android, магазин Solana
  - 💡 `eas-update` — OTA-обновления JS без ревью магазина. Фикс таймера мог уехать
    за минуты, а не за дни. Квота хватит с запасом (см. gotcha 8),
    `extra.eas.projectId` в `app.json` уже есть
  - ⚠️ **OTA не ретроактивны.** Ни 1.2.3 в магазине, ни 1.2.5 на телефоне не содержат
    `expo-updates` и получать обновления не могут. Нужен ещё один релиз через
    магазин, чтобы «проложить трубу»; после него правки JS идут в обход ревью
  - 📜 **Publisher Policy Solana Mobile** (legal.solanamobile.com/publisher-policy-web,
    прочитано 2026-09-13) **молчит** и про OTA, и про азартные механики. Молчание ≠
    разрешение. Колесо — это ещё и местные законы об азартных играх, которые от
    политики магазина не зависят

### 🚨 Призовой фонд и сезон не работали (найдено 2026-09-13)

Счётчик сезона на экране CUP стоял на нулях с июня, фонд показывал «Forming…»,
призы не выплачивались ни разу, а лидеры турнирной таблицы оказались ненадёжны.
Season Zero закрыт возвратом всех платежей (см. раздел «Возвраты» ниже).
Подробности — аккаунты, уязвимость, баланс казны, разбор скрипта раздачи — в
**`CLAUDE.local.md`**: репозиторий публичный, туда это не выносится.

### 📱 Проверка на устройстве
- Телефон Seeker по USB, `adb`: `D:devandroid-sdkplatform-toolsadb.exe`
- Скриншот: `adb exec-out screencap -p > shot.png` (из Bash — бинарный вывод цел)
- Версия: `adb shell dumpsys package com.seekerquest.league | grep version`
- Идентификатор устройства — в `CLAUDE.local.md`

## 9. Что ОСТАЛОСЬ

### 🟢 Действия пользователя (не код)
- ✅ `supabase-orb-authoritative.sql` — применён. Проверено пробой всех трёх RPC
  боевым anon-ключом: `apply_orb_delta`, `create_skora_claim`, `add_tournament_score`
  отвечают своей валидацией, а не «функция не найдена»
- ✅ **`supabase-quiz-refresh.sql` применён** (2026-09-05, двумя файлами:
  `-1-core` + `-2-bank`). Проверено по базе: выпуск на 2026-09-05 собран,
  раскладка 2+2+1 верная. Новые 62 вопроса входят в ротацию со следующего дня —
  день был построен до их вставки, а `build_quiz_day` готовый день не трогает
- 📋 **Состояние портала на 2026-09-07** (publish.solanamobile.com, издатель
  `CxYf…LGSp`, Nexoria Labs). Локальные номера версий с порталом расходились —
  сверяться только по нему:

  | Версия | vc | Статус на 2026-09-12 |
  |--------|----|--------|
  | 1.2.6 | 22 | проверена на устройстве, **загружается 2026-09-13** |
  | 1.2.5 | 21 | пропущена — всё вошло в 1.2.6 |
  | 1.2.4 | 20 | пропущена — всё вошло в 1.2.6 |
  | 1.2.3 | 19 | 🟢 **Live** (7 сен была Action Needed, одобрили сами) |
  | 1.2.2 | 18 | была In Review, перекрыта 1.2.3 |
  | 1.2.0 | 16 | была Live до 1.2.3 |
  | 1.1.4 / 1.1.2 / 1.1.0 / 1.0.0 | 15/13/11/10 | Deprecated |

  **v1.2.1 (vc 17) в магазин никогда не уходила** — её нет в списке. Ошибка
  «version code 19 already exists» была от повторной загрузки: первая прошла.
  Описание карточки правится в портале: **Store Listing** (не Details), и там
  **пять локалей** — en-US, zh-Hans-CN, ja-JP, fr-FR, ru-RU
- 🔥 **`PART R`** — обнуление Pre-Season (снимок в `preseason_snapshot`).
  Разблокирован: порядок `SQL → APK → PART R` дошёл до последнего шага.
  Ещё не запускался, `season_orb` верхнего аккаунта всё те же 1 082 663 328.
  Оговорка: у магазина есть время распространения, обнуление увидят все сразу
- ✅ **Ключ ответов проверен** (2026-09-07). 4 верных ответа с момента пересборки,
  на индексах B/C/D/D. Плюс три независимо выведённых ответа по выпуску 09-06
  совпали с `correct_index`. PART 3 отработал корректно
- ✅ **Автосборка дня подтверждена в бою.** Выпуск на 09-06 собран вручную, а на
  **09-07 — самим приложением**. `ensure_quiz_day` из клиента работает
- ⚠️ **Часовой пояс**: сервер на UTC, владелец на UTC+4. Выпуск дня меняется в
  04:00 по местному, а не в полночь. Из-за этого таблица ответов, снятая вечером
  по UTC, к утру относится уже к прошлому выпуску. Учитывать при любой сверке
- 👤 **Есть второй живой игрок** — один из девяти аккаунтов с байтовым именем
  (кто именно — в `CLAUDE.local.md`). Аргумент применить фикс имён в базе
- 💡 Опционально `supabase-fix-byte-array-usernames.sql` — чинит 9 испорченных имён
  в самой базе. Порядок не важен, приложение и без него показывает их верно
- 🔥 **Загрузить v1.2.6** (vc 22) — проверена на устройстве, `releases/seeker-quest-1.2.6.apk`,
  текст релиза в `dapp-store/RELEASE-NOTES-v1.2.6.md`. 1.2.4 и 1.2.5 пропущены
- 🔥 **Store Listing × 5 локалей — проверить на мусор кодировки.** Локальные файлы
  были битые, и если описание копировали из них, в карточке стоит `вЂ"` вместо тире.
  Это витрина: отпугивает до установки
- 💰 **Выручка** — цифры и разбор по плательщикам в `CLAUDE.local.md`. Главное
  правило: **все метрики считать без устройства владельца**, иначе его тестовые
  покупки выдают себя за спрос
- ❓ Статус SKORA-токена (devnet или mainnet) всё ещё не выяснен —
  `skora-config-mainnet.json` в проекте есть
- ✅ **Экран квеста проверен на устройстве** (2026-09-07): Skia-кольцо таймера
  отрисовывается, сияние работает, вопросы сменяются. Собиралось вслепую —
  сошлось с первого раза
- ⏸ **Применить 5 SQL миграций** в Supabase (sgt-bonus, prize-distribution, skora-claims, ads, pvp)
- ⏸ Зарегистрировать `seekerquest-league.com` + хост Privacy Policy
- ⏸ Email `hello@seekerquest-league.com` (Cloudflare Email Routing)
- ⏸ 8 скриншотов для dApp Store
- ⏸ Тесты последнего APK на Seeker

### 🧺 Очередь следующей сборки (после 1.2.6, найдено на устройстве 2026-09-13)
- **Экран ошибки квеста — тупик.** Показывает сырое `TypeError: Network request
  failed` и только кнопку BACK. Нужен человеческий текст и кнопка «Повторить»
- **Баннер на главной: «Prize pool growing live · Season 1 launches soon»** — то же
  ложное обещание, что и «Forming…» на CUP, но на самом видном месте. Решать вместе
  с Сезоном 1 и возвратами
- **Тире в начале строки** в подписи карточки квеста («— most of the score is
  speed.»). `textBreakStrategy="balanced"` убрал висячее слово, но перенёс тире.
  Лечится неразрывным пробелом перед тире в `quest.sub` во всех пяти языках
- ✅ **1.2.6 (vc 22) проверена на устройстве целиком** (2026-09-13): ореол по центру,
  висячее слово убрано, «#1 of 1» при нуле очков скрыто, отсчёт до нового набора
  («16h 29m» — сверено с UTC), кнопка DONE над жестовой панелью.
  `releases/seeker-quest-1.2.6.apk`, **в магазин не загружена**

### 💸 Возвраты Season Zero — ВЫПОЛНЕНЫ (2026-09-13)
- ✅ Все платежи игроков за Season Zero возвращены и **проверены в блокчейне**
- 🔍 Получатели определялись **по блокчейну, а не по базе** — база теряла платежи и
  до 5 сентября была открыта на запись
- ⚠️ На казну идёт атака подменой адреса: адреса для переводов брать только из
  проверенных списков, никогда из истории кошелька
- 🗃 `supabase-season-zero-refunds.sql` — журнал возвратов, **ещё не применён**
- Суммы, адреса и разбор — в `CLAUDE.local.md` и `SEASON-ZERO-REFUNDS.md` (оба не в git)

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
8. **EAS free лимит** — запись от мая **устарела**. Исчерпана была квота **сборок**
   (Free: 15 Android + 15 iOS в месяц, низкий приоритет), и она обновляется
   ежемесячно. Локальная сборка при этом работает и безлимитна. **Квота EAS Update
   отдельная** (проверено по expo.dev/pricing 2026-09-13): 1 000 MAU, 100 GiB
   трафика, 20 GiB хранилища, без овердрафта — сверх лимита обновления просто не
   доходят. При ~15 активных в месяц это фактически бесплатно.
   `eas-cli` на этой машине **не залогинен** — фактический расход не проверен
9. **Windows path длина** — работать только из `D:\sk`
10. **Java 25 ломает Gradle 8.x** — `JAVA_HOME` указывает на Java 17
11. **SQL для Supabase писать без одинарных кавычек** — только долларовые
    (`$q$текст$q$`), и ни одной точки с запятой внутри текста или комментария.
    ⚠️ **Правило про литералы, не про идентификаторы.** `drop policy if exists
    $p$Public read funnel$p$` — синтаксическая ошибка: имя политики это
    идентификатор, а `$p$…$p$` даёт строку. Имена давать голыми
    (`funnel_public_read`), тогда кавычки не нужны вообще.
    Редактор Supabase теряет границы литералов: `supabase-quiz-refresh.sql`
    дважды падал с `42P01: relation "an" does not exist`, указывая на слово из
    середины английской фразы. Причину установить не удалось — `42P01` это
    ошибка разрешения имени, то есть до Postgres дошёл синтаксически валидный
    SQL, что не сходится с «проза вылезла из сломанного литерала». Убирать не
    причину, а весь класс. Длинную миграцию резать на нумерованные файлы

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

## 🚀 С ЧЕГО НАЧАТЬ В НОВОМ ЧАТЕ (передача 2026-09-13)

**Где мы.** В магазине Live — 1.2.3. **1.2.6 (vc 22) проверена на Seeker и
загружается владельцем** (`releases/seeker-quest-1.2.6.apk`, текст релиза в
`dapp-store/RELEASE-NOTES-v1.2.6.md` и `config.yaml`). Season Zero **закрыт возвратом
всех платежей** — 11 кошельков, 0.24 SOL, каждый перевод проверен в блокчейне.

**Сначала спросить владельца, сделано ли:**
1. 1.2.6 загружена в портал и прошла ревью?
2. `supabase-season-zero-refunds.sql` применён (журнал возвратов)?
3. Store Listing × 5 локалей перевставлен из `dapp-store/STORE-LISTING-5-LOCALES.md`?
   Текст там очищен от ложных обещаний (SOL каждый день, фонд, вывод SKORA)

**Следующая большая задача — Сезон 1**, и анонс возвратов выходит вместе с ним,
не раньше (иначе приложение противоречит анонсу). Порядок:
1. 🔴 **Убрать ложные обещания из приложения**: баннер «Prize pool growing live» на
   главной, мёртвый турнир на CUP (00:00:00:00 и «Forming…»)
2. 🔴 **Лимит турнирных очков** — детали в `CLAUDE.local.md` (SQL)
3. 🔴 **Фонд из реальных спинов**, настоящие даты сезона, отдельный призовой кошелёк
   (не казна `CxYf…LGSp`, которая платит за публикации)
4. 🔴 **Скрипт раздачи**: `distribute-genesis-prizes.js` смотрит в devnet и не на тот
   кошелёк — переписать под mainnet или раздавать вручную из Phantom
5. 🟡 Экран ошибки квеста: человеческий текст + «Повторить»; тире в `quest.sub`
6. 🟡 `PART R` — обнуление ORB, одновременно с запуском Сезона 1
7. 🟢 Анонс: «тестовый сезон закрыт, платежи возвращены» + 11 ссылок Solscan из
   `SEASON-ZERO-REFUNDS.md` (сам файл не публиковать — там адреса игроков)

**Открытые вопросы:** статус SKORA (devnet/mainnet, заявки не исполняются),
`supabase-fix-byte-array-usernames*.sql` не применён, OTA через `expo-updates` не
подключены (нужен ещё один релиз через магазин).

**Инструменты сессии:** телефон Seeker по USB (`adb` в `D:\dev\android-sdk\platform-tools`,
скриншоты `adb exec-out screencap -p`), плагин Expo установлен (перезапуск чата его
подгрузит), блокчейн читается публичным RPC mainnet — **все проверки денег делать по
нему, а не по базе**.

_Last updated: 2026-09-13 — refunds of Season Zero completed and verified on-chain;
v1.2.6 verified on device and handed to the owner for upload; store copy and
config purged of promises the app does not keep. Next: Season 1, in the order
above. The commercial stance holds — see `work-as-commercial-dev` in memory: 116
players ever, the bottleneck is distribution and trust, not features.

Timezone: server UTC, owner UTC+4 — the daily quiz set rolls over at 04:00 local.
The dev PC clock runs ahead of the chain — compare transfers by signature, not time._
