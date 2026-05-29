# 🌐 Brief for AI: Build the Seeker Quest League Website

> **AI читающему этот файл:** ты создаёшь маркетинговый сайт для Web3 мобильной игры на Solana. Прочитай этот файл целиком, потом просмотри файлы из секции «Контекст», потом начинай делать сайт.

---

## 📋 ЗАДАЧА

Создать **одностраничный landing-сайт** для проекта **Seeker Quest League** —
Web3 tap-to-earn игры на Solana Mobile Seeker. Сайт нужен для:

1. Privacy Policy (требование dApp Store)
2. Маркетинг — привлечение игроков и инвесторов
3. Информация о Genesis Pre-Season и призовом фонде
4. Социальные ссылки

**Домен (зарезервирован):** `seekerquest-league.com`

**Тех. стек:** Pure HTML/CSS/JS (один файл `index.html` + минимум зависимостей).
Никаких React/Next.js — сайт должен деплоиться на GitHub Pages / Cloudflare Pages
бесплатно и работать без билда.

---

## 🎯 СУТЬ ПРОЕКТА

**Seeker Quest League** — это:

- 🎮 Tap-to-earn мобильная игра (тапаешь орб → получаешь ORB-валюту)
- 🌐 Эксклюзив для Solana Mobile **Seeker** телефона
- 💰 Real-money призы в **SOL** для топ-100 игроков сезона
- 🎰 7 мини-игр внутри: Fortune Wheel, Space Runner, PvP Arena, Horse Race, Treasure Hunt, Seeker Lands, Arena
- 💎 SKORA token (SPL) для обмена ORB на крипту
- 🏛️ Founder NFT для ранних игроков
- 5 языков (en/ru/zh/ja/fr)

**Genesis Pre-Season** — текущая фаза до Season 1 launch.
Каждый платный 0.01 SOL спин Fortune Wheel идёт в призовой фонд.

---

## 🎨 ВИЗУАЛЬНЫЙ СТИЛЬ

Стиль приложения — **cyberpunk × galaxy × neon**.

### Цветовая палитра

```
Background:    #020510  (deep space)
Surface:       #0A0A12  (cards)
Surface-2:     #0B1120  (deeper cards)
Border:        #1E293B

PRIMARY:       #A855F7  (purple — main brand)
PRIMARY-2:     #7C3AED  (deeper purple)
ACCENT-PINK:   #EC4899  (hot pink)
ACCENT-CYAN:   #06B6D4  (electric cyan)
ACCENT-GOLD:   #FACC15  (gold — premium / prizes)
ACCENT-GREEN:  #22C55E  (success)
ACCENT-RED:    #EF4444  (danger)

Text-Hi:       #E2E8F0  (white-ish)
Text-Mid:      #94A3B8  (muted)
Text-Low:      #475569  (labels)
Text-Glow:     #C084FC  (purple highlights)
```

### Градиенты (используй щедро)

- `linear-gradient(135deg, #1a0040, #3B0764, #1a0040)` — hero фон
- `linear-gradient(90deg, #A855F7, #EC4899)` — primary кнопка
- `linear-gradient(90deg, #06B6D4, #7C3AED, #EC4899)` — rainbow CTA
- `linear-gradient(135deg, #FACC15, #F97316)` — gold accent

### Типографика

- **Headings:** жирный (font-weight 900), широкое letter-spacing (2-4px), UPPERCASE
- **Body:** Inter, system-ui, sans-serif
- **Code/numbers:** монолитные большие, золотые `#FACC15`
- Drop shadows / text glow для главных заголовков

### Эффекты

- Glow / neon shadows (`text-shadow`, `box-shadow` цветные)
- Анимированные орбы пульсируют
- Частицы летают на фоне (canvas или CSS)
- Hover на кнопках — увеличение, glow усиливается
- Smooth scroll
- Gradient borders с радиусом 18-22px

---

## 🏗 СТРУКТУРА САЙТА (одна страница, scroll)

### 1. NAV (sticky top)
- Логотип "SEEKER QUEST LEAGUE" слева (с маленьким орбом-иконкой)
- Ссылки: Features / Genesis / Tokenomics / Roadmap / Privacy
- Кнопка справа: "PLAY NOW →" (gold gradient, glow)
- Прозрачный фон с blur, темнеет при скролле

### 2. HERO (на весь viewport)
- Слева: большой текст
  - Маленький badge: "GENESIS PRE-SEASON · LIVE"
  - H1: **EARN ORB. WIN SOL.**
  - H2: "The first tap-to-earn league for Solana Mobile Seeker."
  - CTA: "DOWNLOAD ON dAPP STORE" + secondary "READ LITEPAPER"
  - Под кнопками: "📱 Seeker exclusive · 🪙 Solana native · 🌐 5 languages"
- Справа: огромный анимированный орб с орбитальными кольцами + 8 микро-планет вокруг (можно через CSS keyframes или SVG)
- Фон: nebula gradient + canvas star particles

### 3. LIVE STATS (бар через всю ширину)
4 столбца с большими цифрами (анимированный counter at scroll):
- `12.5 SOL` ACCUMULATING PRIZE POOL
- `1,247` ACTIVE PLAYERS
- `847K ORB` EARNED TODAY
- `Genesis` CURRENT SEASON

### 4. THE 7 GAMES (карточная сетка)
Заголовок: "ONE APP · SEVEN WAYS TO EARN"
Сетка из 7 карточек, каждая со своим цветом и иконкой:

| Игра | Иконка | Цвет | Описание |
|------|--------|------|----------|
| Fortune Wheel | 🎰 | purple | Spin to win up to 50,000 ORB |
| Space Runner | 🚀 | cyan | Dodge asteroids · Survive · Score |
| PvP Arena | ⚡ | pink | 30-sec tap battles · Stake ORB |
| Horse Race | 🐎 | orange | Tap to gallop · First to finish wins |
| Treasure Hunt | 📦 | gold | Find chests · Earn rewards |
| Seeker Lands | 🌾 | green | Passive ORB generation |
| Tournament | 🏆 | amber | Season-long leaderboard for SOL |

Каждая карта: иконка + название + 1-line описание + "Max reward" badge.
Hover: подсветка цветной рамки.

### 5. GENESIS PRE-SEASON (огромный hero блок)
- Заголовок: "GENESIS PRE-SEASON"
- Подзаголовок: "Be a Founder. Earn 2× ORB Forever."
- 3 столбца:
  - 💰 **Prize Pool grows live** — каждый платный спин (0.01 SOL) идёт в фонд
  - 🏛️ **1 paid spin = Founder NFT** — навсегда 2× множитель ORB
  - 🎁 **60/20/20 split** — 60% top-100 призов, 20% SKORA airdrop, 20% treasury
- CTA: "BECOME A FOUNDER"

### 6. SKORA TOKENOMICS
- "10,000 ORB = 1 SKORA"
- Большой светящийся SKORA token visual (cyan crystal)
- Bullet points:
  - SPL Token on Solana
  - Mint authority + 1B total supply
  - 20% of prize pool → SKORA airdrop at Season 1
- "Read Tokenomics →" link

### 7. ROADMAP (горизонтальный timeline)
4 фазы с прогресс-баром:
- ✅ **GENESIS** (Pre-Season) — testing on devnet
- 🟡 **SEASON 1** (Q2 2026) — mainnet launch + SKORA distribution
- ⚪ **SEASON 2** (Q4 2026) — new games + NFT marketplace
- ⚪ **SEASON 3** (2027) — DAO governance

### 8. WHY SOLANA MOBILE SEEKER (3-колоночный блок)
- 🔒 **Seed Vault** — hardware-secured wallet, no extensions
- 💸 **Fee-free dApp Store** — no Apple 30% tax
- 🌐 **Genesis Token (SGT)** — anti-sybil + bonus rewards

### 9. SOCIAL PROOF / PRESS (если есть)
- "Built for Solana Mobile" badge
- Logos: Solana, Seeker, Anchor (если есть партнёрства)

### 10. FOOTER
- 3 колонки:
  - **Project**: About / Roadmap / Tokenomics / Litepaper
  - **Community**: Twitter / Telegram / Discord / GitHub
  - **Legal**: Privacy Policy / Terms / Contact
- Внизу: `© 2026 Seeker Quest League · hello@seekerquest-league.com`
- Маленький Solana logo

---

## 📄 PRIVACY POLICY (отдельная страница `/privacy`)

Уже есть готовый HTML — `dapp-store/privacy.html`.
Скопируй его как `privacy.html` и подгони стиль под сайт.
Контактный email: **hello@seekerquest-league.com**

---

## 📁 ФАЙЛЫ ДЛЯ ЧТЕНИЯ (КОНТЕКСТ)

Чтобы понять проект глубже, прочитай:

1. **`LITEPAPER.md`** — полное описание проекта, экономика, vision
2. **`TOKENOMICS.md`** — детали SKORA token
3. **`ROADMAP.md`** — план развития
4. **`HANDOFF.md`** — текущий статус разработки
5. **`dapp-store/STORE-DESCRIPTIONS.md`** — маркетинговые тексты (уже готовы!)
6. **`dapp-store/privacy.html`** — готовый Privacy Policy
7. **`App.tsx`** (style блоки) — цветовая палитра и UI patterns
8. **`components/Onboarding.tsx`** — copy для приветствия

---

## ✅ ТЕХНИЧЕСКИЕ ТРЕБОВАНИЯ

- **Single page** `index.html` + `privacy.html`
- Inline CSS или один `style.css`
- Без билд-систем (никакого Vite/Webpack)
- Зависимости только через CDN если очень нужно (например Lucide для иконок)
- **Responsive** — mobile-first, breakpoints на 768px / 1280px
- **Performance** — Lighthouse 90+
- **SEO** — meta tags, OG image, structured data
- **Анимации** — CSS keyframes + IntersectionObserver для scroll-reveal
- **Dark theme only** (никаких light переключателей)

---

## 🎯 КЛЮЧЕВЫЕ СЛОГАНЫ (используй везде)

- Hero: **"EARN ORB. WIN SOL."**
- Sub: "The first tap-to-earn league for Solana Mobile Seeker."
- CTA: **"BECOME A FOUNDER"** / "DOWNLOAD NOW"
- Genesis: **"Be a Founder. Earn 2× ORB Forever."**
- Footer slogan: "Built for Solana Mobile · Powered by Solana"

---

## 🔗 ССЫЛКИ (заглушки на пока)

- dApp Store: `#` (заполнить после публикации)
- Twitter/X: `https://x.com/seekerquest` (заглушка)
- Telegram: `https://t.me/seekerquest` (заглушка)
- GitHub: `https://github.com/seekerquest` (заглушка)
- Litepaper: `/litepaper.pdf` (потом сгенерим из MD)
- Email: `mailto:hello@seekerquest-league.com`

---

## 💡 ВДОХНОВЛЕНИЕ ОТ САЙТОВ

Стиль: смесь
- **Solana.com** — clean Web3
- **Star Atlas** — космос + cyber
- **Phantom.com** — neon градиенты
- **Magic Eden** — premium feel

---

## 📦 РЕЗУЛЬТАТ

В конце дай:

1. `index.html` — landing
2. `privacy.html` — privacy policy (готовый адаптируй)
3. `style.css` (опц.) — если разделил
4. `script.js` (опц.) — для частиц и scroll-reveal
5. `og-image.png` — описание как сгенерировать через Imagen
6. `README.md` — как задеплоить на GitHub Pages / Cloudflare Pages

Сразу создай файлы в папке `/website/` внутри проекта.

---

**Контакт для деталей:** `hello@seekerquest-league.com`
**Проект готов на ~85%, осталось только это и иконки.**
