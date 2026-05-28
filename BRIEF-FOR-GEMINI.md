# Visual Design Brief — Seeker Quest League

> Brief for handing off visual design work to another AI assistant.
> Generated from full context of development sessions.

---

## 1. Общая концепция

**Название:** Seeker Quest League
**Жанр:** Web3 tap-to-earn + arcade hub (mobile)
**Платформа:** Только Solana Mobile **Seeker phone** (Android), distribution через Solana dApp Store
**Суть:**
- Игрок тапает → зарабатывает игровую валюту **ORB**
- Играет в **7 мини-игр** → выигрывает ORB
- Конвертирует 10,000 ORB → 1 **SKORA** (SPL token на Solana devnet)
- Соревнуется в ежедневных турнирах за призовой фонд в **реальных SOL**
- Платит SOL за премиум-действия (paid spin, energy refill, instant upgrades, premium PvP)

**Целевая аудитория:**
- Solana Mobile / Seeker phone holders (~150K+ устройств)
- Web3-native пользователи, crypto-degens
- Возраст 18-35, мобильные геймеры с интересом к Web3
- Не казуальные — ожидают "наглядных" механик заработка и риск/награда

**Монетизация:**
- Платные SOL транзакции (0.005-0.01 SOL за действие)
- Реклама внутри игры (EARN-секция, видео/баннеры)
- 5% fee на PvP победы
- Будущее: cosmetic NFTs

---

## 2. Сеттинг и атмосфера

**Мир:** Космическое / cyber-неоновое пространство. Звёзды, фиолетово-розовые туманности. Чувство "криптокосмоса" — не sci-fi реалистичный, а стилизованный.

**Настроение:**
- 🌌 **Глубокое тёмное небо** (#020510) — игра ВСЕГДА в dark mode
- ⚡ **Энергия, скорость, азарт** — анимации повсюду, всё пульсирует
- 💰 **Казино + аркада** — золото джекпотов, LED-чейзы, мигающие лампы
- 🎯 **Премиум для Solana holders** — золото SOL контрастно с обычным фиолетом

**Эмоциональные крючки:**
- Радость находки (золотая взрывная анимация при выигрыше)
- Боль проигрыша (красный flash + shake) → желание попробовать ещё
- Зависимость прогресса (heartbeat пульс на джекпоте, ambient glow)
- FOMO (Pre-Season countdown, streak shield, lim. founder status)

---

## 3. Визуальный стиль

### Палитра (используется уже везде в коде)

```
BACKGROUND
#020510   глубокая основа
#080D1E   карточки 
#0F172A   nested карточки
#1E293B   bordered блоки

PURPLE (главный бренд)
#7C3AED   primary
#A855F7   средний
#C084FC   светлый акцент
#3B0764   глубокий фон
#1a0040   градиент-старт
#EC4899   pink accent (часто парный)

GOLD (rewards, jackpot, премиум)
#FACC15   primary gold
#F59E0B   amber
#FB923C   orange
#F97316   deep orange

CRYPTO/SOL (премиум tier — должен отличаться от обычного фиолета)
#14F195   Solana green
#00C2FF   crypto cyan
#22D3EE   accent cyan
#06B6D4   teal

STATES
#22C55E   успех / collect
#EF4444   опасность / потеря
#FECACA   мягкий красный текст
#94A3B8   secondary text
#475569   muted text
#64748B   helper text
#334155   disabled

GRADIENTS используемые часто:
['#7C3AED', '#EC4899']      основная фиолетово-розовая
['#FACC15', '#F97316']      gold (premium / SOL)
['#14F195', '#00C2FF']      SOL премиум (зелёно-cyan)
['#1a0040','#3B0764','#831843','#1a0040']  hero gradient (4 stops)
```

### Типографика
- Только системные шрифты (без custom fonts)
- **letterSpacing** активно используется (1-4) для заголовков
- **fontWeight: '900'** для крупных чисел/заголовков
- Заглавные буквы для CTA: `СОБРАТЬ ВСЁ`, `START`, `НАЧАТЬ РЕЙД`
- Размеры: 9-11 labels, 13-14 body, 18-22 titles, 28-44 hero numbers

### Иконография
- **Только emoji** — никаких SVG/PNG ассетов
- Стандартные: 🏠 🎮 🛍 🏆 👤 💰 ⚡ 🔥 🎯 💎 🎰 🐎 🏰 🌾 ⚔️ 🛡 📦 🌟 ✨ 🪙
- Решения по флагам: 🇬🇧 🇷🇺 🇨🇳 🇯🇵 🇫🇷

### Анимационные принципы

**Везде используется `useNativeDriver: true`** (transform, opacity).

Типы анимаций:
- **Ambient loops** — постоянные дышащие/пульсирующие элементы (glow, heartbeat)
- **Tap feedback** — pulse 0.92→1, ring expansion, particle burst
- **Reward** — confetti (18-32 emoji), light burst, scale+spring
- **Loss** — shake (5 keyframes ±10px @ 50ms each) + red flash
- **Anticipation** — slow easing на финальной фазе спина

**Скорости (стандарт):**
- Quick feedback: 80-200ms
- Pulse cycle: 600-900ms
- Long ambient: 1400-2200ms
- Confetti/burst: 700-1100ms

### Стилистические паттерны

**Cards:**
```typescript
{ backgroundColor: 'rgba(8,13,32,0.88)', 
  borderRadius: 24, 
  padding: 20, 
  borderWidth: 1, 
  borderColor: 'rgba(99,60,200,0.35)' }
```

**Buttons (gradient):**
```typescript
<LinearGradient
  colors={['#7C3AED', '#EC4899']}
  start={{x:0,y:0}} end={{x:1,y:0}}
  style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center' }}>
  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 2 }}>
    BUTTON LABEL
  </Text>
</LinearGradient>
```

**Глубокие тени для важных элементов:**
```typescript
{ shadowColor: '#FACC15', shadowRadius: 24, shadowOpacity: 1, elevation: 20 }
```

---

## 4. Текущие механики и UI

### Структура навигации (5 табов)

```
┌─────────────────────────────────────────────────────────────┐
│ Compact header (orb/⚡/🎫/🔥 chips) — НЕ на HOME             │
│ ИЛИ Big header (logo + brand + tagline) — только HOME       │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│              ScrollView with screen content                 │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  🏠 HOME  │ 🎮 GAMES │ 🛍 SHOP │ 🏆 CUP │ 👤 ME            │
└─────────────────────────────────────────────────────────────┘
```

### HOME screen
- 🟣 Brand logo + "SEEKER QUEST LEAGUE" + "SEASON ZERO • GENESIS LEAGUE" tagline
- Top chip row: 🔥 streak, ⚡ energy, 🎫 tickets, 🛡 shield (if any)
- Genesis Pre-Season banner (gradient + "CLAIM YOUR FOUNDER STATUS")
- Hero balance card (ORB баланс + LV badge + XP bar)
- **Main TAP orb** — большой круг, fires on touch (с pulse, particle, sound)
- Action row: 🔥 BOOST (если активен) + 🎰 КОЛЕСО
- **INSTANT REFILL** SOL button (когда energy < 100)
- DAILY QUESTS panel (Taps/Spins/Boosts progress bars)

### GAMES screen
- ARCADE hero
- **Featured card** (большой) — Space Runner with rocket art (emoji)
- **2×2 Grid** остальных игр:
  - ⚔️ Seeker Arena (PvP — рейды + базы)
  - 🎰 Fortune Wheel (удача — колесо с jackpot)
  - 📦 Treasure Hunt (explore — карта с сундуками и ловушками)
  - 🐎 Horse Race (гонка — 2 коня)
  - 🌾 Seeker Lands (idle — пассивный доход)
  - ⚔️ PvP Arena (live tap battle с ORB ставками)

### SHOP screen (центральный хаб)
1. Hero: "🛍 МАГАЗИН"
2. **Hub Grid (2×2)** навигационные карточки:
   - 🪙 EARN ORB → реклама
   - 💠 SKORA → конвертация
   - ⚡ REFILL (0.005 SOL) → +100 energy
   - 🎨 COSMETIC (Coming Soon, disabled state)
3. **UPGRADES section** — список 4 апгрейдов, у каждого:
   - Иконка + название + описание
   - Level dots (5)
   - Progress bar
   - "NOW → NEXT" значения
   - **Кнопка ORB** (фиолетовая, цена в ORB)
   - **Кнопка SOL INSTANT** (бирюзовая, 0.01 SOL)

### CUP screen
- 🏆 Trophy hero
- TOURNAMENT title + countdown (DAYS:HRS:MIN:SEC)
- "PRIZE POOL: Forming..." card (растёт с каждым SOL spin)
- "HOW TO EARN POINTS" horizontal scroll (карточки с pts)
- **🏆 SEEKER RANKINGS · TOP 100** кнопка → переход на leaderboard

### Leaderboard screen
- "‹ НАЗАД К ТУРНИРУ" link
- Season header (countdown)
- Prize tiers (🥇 #1: 50K ORB + Genesis NFT, etc.)
- Top players list

### ME (Profile) screen
- Avatar S-logo + username (editable) + LV badge
- 4 stat boxes (ORB, LEVEL, STREAK 🔥, PTS)
- Seeker verification card (Connect wallet hint OR ✓ verified)
- Quick nav row: Wallet · News · SKORA · Earn
- 🏅 ACHIEVEMENTS (8 ачивок в виде badge grid с прогрессом и наградой)
- 📊 STATS (Signal Power, Crit, Wheel Luck, Horse Power, Tickets, Energy)
- ⚙️ SETTINGS:
  - 🌐 Language picker (5 chip-кнопок с флагами)
  - 🔊 Sound toggle
  - 🔔 Notifications toggle

### Modal patterns
- **Streak modal**: 7-day track + big number + reward preview + Claim button
- **Plot modal** (Lands): icon + rarity + stats + Claim/Collect button
- **WinCelebration** (global overlay): big emoji + amount + label, fires via `winRef.current?.show(amount, label)`
- **Onboarding** (first launch, после language selector)
- **AdViewer** (bottom sheet для просмотра рекламы)

### Game-specific UI

**FortuneWheel:**
- Большое круглое колесо с 12 сегментами
- 8 LED-лампочек по ободу с chase-анимацией
- Outer glow ring (пульсирующий)
- Pointer triangle (золотой, bouncing)
- Hub центр "SKORA" с пульсом
- Free spin counter (dots)
- Jackpot banner с heartbeat-пульсом ORB suma
- Premium SOL spin button (золотой gradient + 💎 PREMIUM badge)

**Arena:**
- Header с power bar + shield badge
- **Mini-skyline** — 4 здания (🏰⚡🏦🗼) высотой пропорциональной уровню, с дышащим glow
- Tab bar: БАЗА / РЕЙД
- Building cards 2×2 (на БАЗА)
- **Radar dish** (на РЕЙД при поиске): 120×120 круг с sweep arm + 3 концентрические ping волны
- Result card с emoji + sparks burst на победе

**TreasureHunt:**
- Mini-map 24×24 с fog of war (viewport 7×7)
- 32 chest 📦 (с pulse-анимацией закрытых)
- 26 ловушек скрытых в тумане: 💣 mines / 🕷 spiders / 🔥 lava (после срабатывания 💀)
- Player marker 🧭 с расходящимся жёлтым кольцом
- D-pad управление (▲◄►▼)
- Reward popup (зелёный) / Danger popup (красный)
- Red flash overlay при попадании в ловушку

**HorseRace:**
- 2 lane track
- Stadium с 6 мигающими LED bulbs (staggered chase)
- Crowd rows (3 ряда emoji 🙋🙆🧑👩🎉)
- Speed lines, dust, gallop bob
- Floating "+X" числа на каждый тап
- Finish line с checkered pattern
- Sparkles burst (14 шт) при победе

**SeekerLands:**
- Mini-map 20×10 cells (caped to color by rarity)
- 5 rarities: 🌾🌲🏔🌋💎
- Plot grid с owned/ready badges
- Storage fill bar (24h cap)
- Pulsing 💰 badge на готовых
- Coin burst (12 эмодзи: 💰🪙✨💎) при сборе

---

## 5. Технический стек

### Core
- **React Native** 0.81.x
- **Expo SDK 54**
- **TypeScript** (strict)
- Target: **Android only** (MWA не работает на iOS)

### UI / Styling
- **NO Tailwind**, NO StyleSheet abstraction, NO themed components
- Чистый **React Native StyleSheet.create** + **inline styles**
- **expo-linear-gradient** — основной инструмент для красоты (использован 200+ раз)
- **React Native Animated API** — все анимации через Animated.Value + Animated.loop/sequence/parallel/spring/timing
- **useNativeDriver: true** обязательно для transform/opacity (false для width/height)
- **react-native-safe-area-context** для insets
- НЕТ react-native-svg, НЕТ Reanimated 3, НЕТ Skia — только базовый RN

### Иконки и графика
- **Emoji as icons** — никаких иконочных шрифтов, SVG или PNG ассетов
- Никаких custom fonts (системные)
- Звуки: `expo-av`, четыре .wav файла (tap, crit, jackpot, levelup) в `assets/sounds/`

### Backend
- **Supabase** (PostgreSQL, 10 таблиц)
- **Solana Web3.js + Mobile Wallet Adapter** (MWA, только Android)
- **SPL Token** для SKORA
- AsyncStorage для local persistence

### Файловая структура (важно для Gemini)
```
C:\sk\
├── App.tsx                    ← главный (~3000 строк, все screens в одном файле через `screen` state)
├── components/
│   ├── FortuneWheel.tsx       ← полностью самодостаточный
│   ├── Arena.tsx              ← полностью самодостаточный
│   ├── TreasureHunt.tsx       
│   ├── HorseRace.tsx          ← fullscreen
│   ├── SpaceRunner.tsx        ← fullscreen, PanResponder
│   ├── SeekerLands.tsx
│   ├── PvPArena.tsx
│   ├── Tournament.tsx
│   ├── EarnHub.tsx
│   ├── AdViewer.tsx
│   ├── SKORAWallet.tsx
│   ├── Onboarding.tsx
│   ├── LanguageSelector.tsx   ← первый запуск
│   ├── GenesisNews.tsx
│   └── WinCelebration.tsx     ← global overlay через forwardRef
├── lib/
│   ├── i18n.ts                ← 5 языков (en/ru/zh/ja/fr), t() function
│   ├── supabase.ts
│   ├── solanaMobile.ts        ← paySolToTreasury() generic
│   ├── skora.ts
│   ├── genesis.ts
│   ├── notifications.ts
│   └── pvp.ts, ads.ts, ...
├── ParticleSystem.tsx         ← global particle emitter (forwardRef API: emit(x,y,type))
└── StarField.tsx              ← background stars layer
```

### Соглашения по компонентам
- Каждый game-компонент — самодостаточный, принимает props из App.tsx (orb, callbacks)
- Все компоненты — function components с React hooks
- Refs для Animated.Value (не useState — для производительности)
- StyleSheet.create в конце файла, `const s = StyleSheet.create({...})`
- Color codes inline в стилях (не переменные) — палитра выше

### i18n использование
```typescript
import { t, useLang } from '../lib/i18n';

function MyComp() {
  const _ = useLang(); // re-render trigger
  return <Text>{t('nav.home')}</Text>;
}
```

### Ограничения / гочи
- **`react-native-svg` НЕ установлен** — всё рисуется через View/borderRadius/transforms
- **Android Long Path support** включён, работаем в `C:\sk\` (не Documents\...)
- **EAS build лимит исчерпан** — только локальная `gradlew.bat assembleRelease`
- **Onboarding и LanguageSelector** через `onboardingOverlay` style (zIndex 100)
- **Fullscreen игры** через `position: absolute, zIndex: 50` — ВНЕ ScrollView
- **Polyfills в `index.ts`** (react-native-get-random-values, buffer, url-polyfill) — обязательно ПЕРВЫМИ

---

## 🎯 Что хочется от нового визуального вклада

**Что уже хорошо** (не трогать без причины):
- Темная палитра + неоновые акценты
- Анимация everywhere
- Heartbeat / pulse / chase эффекты
- Particle bursts
- Compact header pattern

**Что можно усилить:**
- Унификация через design tokens (lib/theme.ts — не создан)
- HomeScreen tap-orb — сейчас простой фиолетовый круг, можно сделать более "premium" (multi-stop gradient, animated halo, energy waves)
- Onboarding flow визуально слабый — можно сделать иллюстрированные slides
- Wallet screen — самый базовый, нуждается в визуальном языке Solana brand
- Cosmetic NFT placeholder в Shop — можно превратить в красивый teaser
- Achievement unlock celebration — сейчас через WinCelebration overlay, можно сделать кастомным
- Skins / themes концепция (для будущих NFT) — нужны 3-4 вариации палитры (cyber-blue, gold-luxury, neon-pink)

**Принципы для Gemini:**
1. **Не добавлять зависимости** (никаких новых npm packages)
2. **Не использовать SVG / Skia / Reanimated** — только базовый RN Animated
3. **Emoji вместо PNG/SVG иконок**
4. **Сохранять useNativeDriver: true**
5. **Темная тема ALWAYS** — никаких светлых вариантов
6. **Solana brand colors** для SOL touchpoints (#14F195 / #00C2FF)
7. **Gold (#FACC15)** для всего что относится к выигрышу/премиум

---

_Брифинг закрыт. Полный код: C:\sk\ — все файлы README/CLAUDE.md/HANDOFF.md содержат подробности проекта._
