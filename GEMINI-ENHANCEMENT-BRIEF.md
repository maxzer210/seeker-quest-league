# 🤖 GEMINI ENHANCEMENT BRIEF
## Делаем Seeker Quest League в 100 раз лучше

> **AI читающему этот файл:** ты получаешь production-ready Web3 игру для Solana Mobile Seeker и должен сделать её **AAA-уровня**. Прочитай ВСЕ файлы перечисленные ниже, потом действуй по плану.

---

## 🎯 ГЛАВНАЯ ЦЕЛЬ

Преобразовать существующее приложение из "хорошего MVP" в **визуальный/механический шедевр**. Цели:
- 🎨 **Визуал в 100 раз ярче** — современная 3D графика, particle effects, juicy animations
- 🎮 **Новые игровые механики** — добавить 3-5 новых mini-games (3D или 2.5D)
- ✨ **Премиум ощущение** — каждый тап, каждое действие должно вызывать "wow"
- 📊 **Геймификация** — больше прогрессии, achievements, событий, FOMO

**Стиль референсы:** Star Atlas, Magic Eden Drops, Genshin Impact mobile, Brawl Stars, Genshin-стиль 3D на мобиле.

---

## 📂 РАБОЧАЯ ПАПКА

**ВХОД** (читай отсюда):
```
C:\sk\
```

**ВЫХОД** (создавай отдельную папку, НЕ перезаписывай оригинал!):
```
C:\sk-enhanced\
```

Скопируй всю структуру проекта в `C:\sk-enhanced\` и работай там. Оригинал в `C:\sk\` ОСТАВЬ НЕТРОНУТЫМ.

---

## 📚 ОБЯЗАТЕЛЬНО ПРОЧИТАЙ (по порядку)

### Понять контекст
1. **`HANDOFF.md`** — текущее состояние проекта
2. **`README.md`** — публичное описание
3. **`LITEPAPER.md`** — vision проекта
4. **`TOKENOMICS.md`** — экономическая модель v0.2

### Что нельзя ломать (CRITICAL!)
5. **`SECURITY-AUDIT.md`** — security меры
6. **`TREASURY-SETUP.md`** — Web3 константы (НЕ ИЗМЕНЯТЬ адреса!)
7. **`LAUNCH-PLAYBOOK.md`** — план публикации
8. **`lib/solanaMobile.ts`** — mainnet treasury wallet ⚠️
9. **`lib/skora.ts`** — mainnet SKORA mint ⚠️

### Структура кода
10. **`App.tsx`** — основной (~3000 строк, 14 экранов)
11. **`components/`** — все игры и UI
12. **`lib/i18n.ts`** — 5 языков, 300+ ключей
13. **`assets/`** — иконка, видео splash, sounds

### Знать про ассеты
14. **`ICONS-BRIEF.md`** — стиль иконок
15. **`WEBSITE-BRIEF.md`** — стиль сайта
16. **`dapp-store/`** — submission материалы

---

## 🚫 КРИТИЧНО: ЧТО НЕЛЬЗЯ МЕНЯТЬ

| Что | Где | Почему |
|-----|-----|--------|
| `TREASURY_WALLET` | `lib/solanaMobile.ts` | Реальный mainnet кошелёк владельца |
| `SOLANA_NETWORK = 'mainnet-beta'` | `lib/solanaMobile.ts` | Мы уже на mainnet! |
| `SKORA_MINT` | `lib/skora.ts` | Реальный SPL token уже создан |
| Цены SOL (0.01, 0.5, 1.0, 2.0) | `lib/solanaMobile.ts` | Утверждённая экономика v0.2 |
| `package` name | `app.json`, `android/app/build.gradle` | dApp Store идентификатор |
| Supabase RPCs | `supabase-*.sql` | Phase 1 security |
| RLS policies | Supabase | Phase 1 security |
| ProGuard rules | `android/app/proguard-rules.pro` | Phase 1 security |
| Founder Pass tiers | `lib/genesis.ts` | Утверждённая монетизация |
| MWA integration | `lib/solanaMobile.ts` | Готов работать с реальными SOL |

**Если изменишь что-то из этого — приложение перестанет работать на mainnet или потеряет деньги владельца.**

---

## 🎨 ЧТО УЛУЧШИТЬ — VISUAL ENHANCEMENT

### 1. Главный TAP орб (центр игры)
**Сейчас:** Lottie-подобный orb с базовыми эффектами.

**Что хочется:**
- 🌌 **3D вращающийся орб** с реалистичными rim lights
- ⚡ **Procedural lightning** при крите (через `react-native-skia` shaders)
- 💥 **Shockwave** на каждый тап (расходящиеся круги)
- 🌠 **Trail of particles** следующих за пальцем
- 🎵 **Spatial sound** — звук разный в зависимости от combo

### 2. Hero Card
**Сейчас:** Простая карточка с balance и LV.

**Что хочется:**
- 🏆 **Animated rank badge** (rotates/shines)
- ✨ **Liquid metal effect** на цифрах ORB (через Skia)
- 🎨 **Animated background** — slowly shifting nebula
- 📈 **Pulsing XP bar** с lightning effect когда приближается к level up

### 3. Onboarding
**Сейчас:** 4 экрана с базовым контентом.

**Что хочется:**
- 🎬 **Cinematic transitions** — like CoD Mobile intro
- 🎯 **Interactive tutorial** — пользователь учится тапая, ошибаться нельзя
- 🚀 **3D ship flying** через экраны
- 📱 **Haptic feedback** на ключевых моментах

### 4. Все игры
**Каждой игре добавь:**
- 🎨 **Pre-game animation** (3 сек cinematic intro)
- 💫 **Win celebration** более epic (current confetti недостаточно)
- 🏆 **Reward reveal** — slot-machine style
- ⚡ **Boost / power-up effects** более ярко
- 📊 **Live stat overlays** во время игры

---

## 🎮 НОВЫЕ ИГРЫ (добавь 3-5)

### Идеи (выбери лучшие или придумай свои)

#### 1. **Crypto Crash** (быстрая игра, 30 сек)
- Multiplier растёт от 1.00x → ?
- Игрок видит rocket летящий в космос
- Должен нажать "CASH OUT" до того как rocket взорвётся (рандом)
- Чем дольше ждёшь — больше outcome, но больше риск
- **Ставка:** 100 ORB / round
- **Награда:** до 50x = 5000 ORB

#### 2. **Mineral Mining** (3D-look, idle)
- Игрок выбирает астероид
- Тап = добыча минерала (анимация бурения)
- Каждые 5 тапов = drops gem
- Цель: за 30 секунд накопить максимум
- **Бонусы:** rare gems × 10 reward

#### 3. **Stellar Drift** (skill-based runner)
- Космический корабль в трубе
- Поворот гироскопом телефона
- Уклоняется от препятствий, собирает orbs
- Прогрессивная сложность
- Гоночный leaderboard

#### 4. **Galactic Poker** (turn-based)
- 5-карточный покер vs AI
- Ставка: 500 ORB
- Win = 2x — fee
- Side bet pool накапливается всех игроков

#### 5. **Solana Snake** (классика с твистом)
- Змейка собирает SOL coins
- Каждый coin = +ORB
- При длинне 50+ → "evolve" в более красивую snake
- При длинне 100 → "transcend" → +500 ORB

#### 6. **Asteroid Defender** (tower defense)
- Защищаешь свою базу от waves астероидов
- Тапаешь = выстрел
- Long press = заряженный лазер
- 5 waves = 1 round

---

## 🆕 НОВЫЕ МЕХАНИКИ

### 1. **Achievement Trees** (Genshin-style)
- Не просто список achievements
- **Дерево связей** между ачивками
- Открываешь одну → раскрывает 2-3 новых
- Visual: glowing constellation

### 2. **Daily Events**
- 1 random event каждый день (×2 ORB hour, free spin, double tournament points)
- Push notification если игрок не зашёл

### 3. **Streak Multipliers**
- 3 дня подряд = ×1.5
- 7 дней = ×2.5
- 30 дней = ×5
- 100 дней = ×10 + Founder NFT mint

### 4. **Combo Chains**
- Тапаешь 10 раз быстро = combo level 1
- 25 = combo level 2
- 50 = combo level 3 → spawn rare bonus
- Visual: screen shake + chromatic aberration

### 5. **Mystery Boxes** (хочется loot box без gambling labeling)
- 1 free box / day
- Drops: ORB, ticket, boost, NFT shard
- Premium box: 0.05 SOL — guaranteed rare

### 6. **Social Layer**
- "Sticker" sharing (Telegram-style) внутри игры
- Friend leaderboard
- Send ORB → animated transfer (like rocket flying)

### 7. **Seasonal Themes**
- UI меняется каждый месяц (Halloween, Christmas, Solana SIWS, etc)
- Limited-time games (Christmas Slot Machine)
- Seasonal currency convertible в ORB

---

## 🔮 3D / ADVANCED VISUALS

Доступные технологии для React Native:

| Библиотека | Возможности | Сложность |
|------------|-------------|-----------|
| **react-native-skia** | 2D shaders, custom drawing, particle systems | ⭐⭐⭐ |
| **@shopify/react-native-skia** | Hardware-accelerated 2D | ⭐⭐⭐ |
| **react-three-fiber + expo-three** | True 3D через Three.js | ⭐⭐⭐⭐ |
| **expo-gl + WebGL** | Custom 3D shaders | ⭐⭐⭐⭐⭐ |
| **lottie-react-native** | Pre-rendered animations | ⭐⭐ |
| **react-native-reanimated v3** | Smooth 60fps animations | ⭐⭐ |

**Рекомендация:**
- **Skia** для main app (shaders, custom orb, particle effects)
- **Three.js** для 1-2 ключевых игр (Crypto Crash, Stellar Drift)
- **Lottie** для loading screens, intros, celebrations
- **Reanimated** для всех UI transitions

---

## 📝 STRUCTURED OUTPUT — что выдать в конце

В папке `C:\sk-enhanced\` создай помимо измененного кода:

### 1. `ENHANCEMENT-REPORT.md` — обязательно!
Структура:
```markdown
# Enhancement Report

## What I Did

### Visual Enhancements
- [Список конкретных изменений с примерами кода]

### New Games Added
- Crypto Crash (path: components/CryptoCrash.tsx)
- Stellar Drift (path: components/StellarDrift.tsx)
- ...

### New Mechanics
- Achievement Trees (path: lib/achievementTree.ts)
- Combo Chains (in App.tsx line X-Y)
- ...

### Files Modified
- App.tsx — added home screen reskin (line 1500-1700)
- ...

### Files Created
- components/CryptoCrash.tsx (350 lines)
- ...

### Dependencies Added
- @shopify/react-native-skia ^1.0.0
- ...

## Migration Steps

If owner wants to merge changes back to C:\sk\:
1. Run `npm install` (new deps)
2. Copy these files: [...]
3. Test on real device
4. Build APK

## Untouched (preserved as-is)
- All Web3 constants
- Treasury/Mint addresses
- Phase 1 security RPCs
- ProGuard rules
- Founder Pass tier prices

## TypeScript Status
- Run: `tsc --noEmit --skipLibCheck`
- Errors: 0
```

### 2. `CHANGELOG-v2.md` — для пользователей игры
Что игроки заметят в новой версии.

### 3. Все исходные файлы скопированы или новые
Папка `C:\sk-enhanced\` должна **собираться через `gradlew assembleRelease`** без ошибок.

### 4. `BEFORE-AFTER.md`
Скриншоты "что было vs что стало" — для маркетинга.

---

## ✅ КРИТЕРИИ УСПЕХА

Твоя работа считается успешной, если:

1. ✅ `tsc --noEmit --skipLibCheck` → 0 ошибок
2. ✅ `gradlew assembleRelease --no-daemon` → BUILD SUCCESSFUL
3. ✅ APK устанавливается на Seeker телефон
4. ✅ Все существующие фичи работают (P2P, Founder Pass, Tournament, etc)
5. ✅ Web3 константы НЕ изменены
6. ✅ Добавлено минимум 3 новые игры
7. ✅ Добавлено минимум 5 новых механик
8. ✅ Главный TAP орб выглядит как из AAA игры
9. ✅ `ENHANCEMENT-REPORT.md` детально описывает что сделано
10. ✅ Производительность не упала (60 FPS на mid-range телефонах)

---

## 🚀 КАК Я (CLAUDE) ПОТОМ БУДУ РАБОТАТЬ С ТВОИМ ВЫХОДОМ

Когда я получу обратно `C:\sk-enhanced\`:

1. **Прочитаю** `ENHANCEMENT-REPORT.md` — пойму что было сделано
2. **Запущу** `tsc` — проверю что компилируется
3. **Запущу** `gradlew assembleRelease` — соберу APK
4. **Проверю** что Web3 константы не сломаны (адреса те же)
5. **Сравню** размеры файлов / списки компонентов
6. **Подготовлю** к dApp Store submission (или к merge в `C:\sk\`)

Чтобы я понимала твою работу — придерживайся стиля кода и naming conventions которые уже есть. Не делай радикальный рефакторинг "потому что так лучше".

---

## ⚠️ ANTI-PATTERNS (не делай!)

| Не делай | Делай вместо |
|----------|--------------|
| Переписывать App.tsx с нуля | Постепенно улучшать существующий код |
| Менять Web3 константы | Создавать новые механики поверх существующих |
| Удалять старые игры | Добавлять новые рядом со старыми |
| Менять package name | Только новые компоненты |
| Игнорировать i18n | Все новые тексты в `lib/i18n.ts` (5 языков) |
| Удалять Founder Pass / P2P / Security | Это утверждённая монетизация и защита |
| Перекодировать в TypeScript Strict | Использовать существующий tsconfig |
| Добавлять heavy dependencies (>50MB) | Использовать lightweight libraries |
| Менять Solana RPC URL | Используй уже настроенный mainnet RPC |

---

## 🎯 PRIORITY ORDER

Если времени мало — делай в этом порядке:

1. **🔴 Visual makeover главного TAP орба** — игроки видят 80% времени
2. **🔴 Hero Card премиум-выглядит** — вторая по важности секция
3. **🟡 1 новая игра** (рекомендую Crypto Crash — быстро и весело)
4. **🟡 Combo system + visual feedback** — мгновенный wow effect
5. **🟢 Mystery Box mechanics** — даёт reason to return daily
6. **🟢 Achievement Tree** — long-term engagement
7. **🟢 Дополнительные игры (Stellar Drift, Mineral Mining)** — если есть время

---

## 💬 Если зайдёшь в тупик

Если не уверен что делать:
1. Прочитай `LAUNCH-PLAYBOOK.md` — там цели проекта
2. Спроси себя: **"что бы добавил Magic Eden или Star Atlas?"**
3. Не делай — лучше пропустить чем сломать

---

## 📊 МЕТРИКА УСПЕХА (после твоей работы)

| Метрика | До (v1) | Цель (v2) |
|---------|---------|-----------|
| Wow factor 🤩 | 6/10 | **9/10** |
| Visual quality | Mobile MVP | **AAA mobile** |
| Mini-games | 7 | **10-12** |
| Animations | базовые | **AAA-уровень** |
| Daily engagement hooks | 3 (streak, quests, energy) | **8+** |
| Premium feeling | "крипто-игра" | **"я хочу показать друзьям"** |

---

**Удачи!** Когда закончишь — положи всё в `C:\sk-enhanced\` и напиши в чате что готово. Я возьму твой output, протестирую и подготовлю к публикации.

**Не торопись.** Лучше сделать 3 крутых улучшения чем 20 средних. Quality over quantity.

---

_Document version 1.0 · Created 2026-05-30 for Gemini AI Studio enhancement task_
