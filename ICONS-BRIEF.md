# 🎨 Icons & Visual Assets — Brief for AI Image Generators

> Готовый набор промтов для Gemini Imagen, Ideogram, или Midjourney.
> Все ассеты в едином cyberpunk × galaxy × neon стиле приложения.

---

## 🎯 Что нужно сгенерировать (приоритет)

| # | Файл | Размер | Куда | Приоритет |
|---|------|--------|------|-----------|
| 1 | `icon.png` | **512×512** | dApp Store app icon | 🔴 critical |
| 2 | `feature-graphic.png` | **1024×500** | dApp Store hero | 🔴 critical |
| 3 | `banner.png` | **1200×600** | Marketing / social | 🟡 important |
| 4 | `splash.png` | **1284×2778** | iOS-style splash | 🟢 nice |
| 5 | `adaptive-icon-fg.png` | **512×512 + transparency** | Android adaptive | 🟡 important |
| 6 | `og-image.png` | **1200×630** | Open Graph для сайта | 🟢 nice |
| 7 | `twitter-banner.png` | **1500×500** | Twitter/X профиль | 🟢 nice |

---

## 🎨 Глобальная стилевая константа

**ВСЕГДА используй в промтах:**
- Cyberpunk × galaxy × neon aesthetic
- Dark deep-space background `#020510` to `#0A0A12`
- Primary purple `#A855F7` glowing
- Accent pink `#EC4899` electric
- Gold highlights `#FACC15` for premium feel
- Cyan accents `#06B6D4` for crypto/tech
- No text unless specified (let icons speak)
- Centered composition with clear focal point
- Subtle nebula clouds in background

---

## 1️⃣ APP ICON — 512×512 (главная иконка)

> **Самый важный ассет!** Эту иконку увидят миллионы Seeker owners.
> Должна работать на размерах от 48×48 (notification) до 512×512 (store).

### Промт A — Flat Vector Glowing Orb (✅ FINAL — выбран владельцем)

```
Flat-vector style square app icon 512x512, highly readable at small sizes.

CENTER: An extremely bright, super-luminous golden orb. Minimalist design 
with an intense, dazzling golden #FACC15 inner core that radiates a very 
powerful, wide neon outer glow. The orb is the dominant light source.

AROUND: Two very thick, bold geometric orbital rings wrapping closely 
around the bright orb:
- One thick, solid bright purple #A855F7 ring.
- One thick, solid vibrant hot pink #EC4899 ring.
The rings are drawn with substantial thickness (heavy line weight) for 
maximum graphic impact at micro-sizes. No complex textures, no gradient 
blends, no micro-particles.

BACKGROUND: Solid dark background #020510 with zero details, maximizing 
the contrast of the extremely bright neon elements.

STYLE: Modern graphic design, minimalist vector icon, high-contrast 
cyberpunk neon aesthetic, ultra-high readability. Clean, thick edges, 
no noise.

Format: PNG, 512x512.
```

**Почему этот промт лучше:**
- ✅ `flat-vector` → читается на 48×48 (notification)
- ✅ `extremely bright` → видно на любых обоях
- ✅ `solid dark background` → max contrast = max recognition
- ✅ `no textures, no gradients` → чёткие edges при компрессии
- ✅ `heavy line weight` → ring не пропадает в маленьком размере

### Промт B — Stylized "S" Letter (альтернатива)

```
Square app icon 512x512 for Seeker Quest League.

CENTER: Stylized neon "S" letter formed by glowing electric lines.
The "S" has volumetric depth with gradient from gold #FACC15 (top) 
to purple #A855F7 (middle) to hot pink #EC4899 (bottom).
The letter glows with intense neon light, like a sci-fi sign.

BACKGROUND: Hexagonal pattern of subtle dark circuits, almost invisible,
on deep space #020510 background. A small constellation of stars 
in the upper-left and lower-right corners.

EFFECTS: Strong outer glow, slight chromatic aberration,
electric sparks at the letter endings.

STYLE: Premium gaming brand mark. Cyberpunk × Web3 aesthetic.
No additional text or decorative elements.

Format: PNG, 512x512.
```

### Промт C — Hexagonal Crystal (альтернатива)

```
Square app icon 512x512 for Seeker Quest League.

CENTER: A floating geometric crystal — hexagonal prism viewed from a 
3/4 angle. Translucent purple #A855F7 with hot pink #EC4899 inner glow.
A bright golden #FACC15 spark visible at its core, like a captured energy.

AROUND: Soft particle effects orbiting the crystal,
small geometric shards floating away suggesting motion.

BACKGROUND: Deep space gradient, subtle nebula clouds in purple-pink palette.

STYLE: Premium NFT / gaming icon. 3D rendered look, refined materials,
soft realistic shadows but stylized.

Format: PNG, 512x512.
```

---

## 2️⃣ FEATURE GRAPHIC — 1024×500 (dApp Store hero banner)

> Большой баннер сверху страницы листинга в dApp Store.
> Должен передавать "что это за игра" с первого взгляда.
> **СОВПАДАЕТ ПО СТИЛЮ с App Icon Промт A (flat-vector neon).**

### Промт

```
Flat-vector style horizontal feature banner 1024x500 for Web3 mobile game 
"Seeker Quest League". High-contrast minimalist cyberpunk neon aesthetic.

LEFT SIDE (40%): Bold flat-vector text composition on solid #020510 background:
- Top: small pill badge "GENESIS PRE-SEASON · LIVE" in solid purple #C084FC
- Main headline: "EARN ORB" in massive bold golden #FACC15 letters with 
  strong outer neon glow
- Subheadline: "WIN SOL" in bright pink #EC4899
- Bottom: small tagline "Tap to earn on Solana Seeker" in muted white

RIGHT SIDE (60%): Same orb design as the app icon — extremely bright 
luminous golden orb #FACC15 with two thick solid orbital rings (purple 
#A855F7 and hot pink #EC4899). Larger than icon version. Around the orb, 
6 small flat-vector planet icons in constellation arrangement, each in a 
solid bright color:
- Spinning slot wheel (purple #A855F7)
- Rocket ship (cyan #06B6D4)
- Trophy (gold #FACC15)
- Crossed swords (red #EF4444)
- Diamond gem (pink #EC4899)
- Horse silhouette (orange #FB923C)
Each planet has bold neon glow but stays flat-vector — no 3D, no textures.

BACKGROUND: Solid dark #020510. NO nebula clouds, NO stars, NO complex 
backgrounds. Just dark canvas + flat-vector elements with strong neon glow.

STYLE: Modern minimalist vector graphic design. Like Solana brand visuals 
or Phantom wallet aesthetic. High-contrast neon, clean thick edges, 
maximum readability.

Format: PNG, 1024x500 horizontal.
```

---

## 3️⃣ BANNER — 1200×600 (marketing, соцсети)

> Универсальный баннер для X, Telegram, веб-сайта hero section.
> **СОВПАДАЕТ ПО СТИЛЮ с App Icon — flat-vector minimalist.**

### Промт

```
Flat-vector style wide marketing banner 1200x600 for Seeker Quest League 
Web3 game. Minimalist high-contrast cyberpunk neon aesthetic.

LEFT-CENTER: Same orb design as the app icon — extremely bright luminous 
golden orb #FACC15 with two thick solid orbital rings in purple #A855F7 
and hot pink #EC4899. The orb is the central visual anchor.

AROUND the orb (constellation arrangement, 8 small flat-vector icons):
- Slot wheel (purple #A855F7)
- Rocket ship (cyan #06B6D4)
- Treasure chest (gold #FACC15)
- Crossed swords (red #EF4444)
- Diamond gem (pink #EC4899)
- Horse silhouette (orange #FB923C)
- Lightning bolt (yellow #FACC15)
- Trophy cup (gold #FACC15)
Each icon is flat-vector with bold neon glow. No 3D. No textures.

RIGHT SIDE: Bold flat-vector text in 3 lines:
- Line 1: "SEEKER QUEST LEAGUE" — bold golden #FACC15, large, neon glow
- Line 2: "tap. earn. win SOL." — lowercase white
- Line 3: Pill badge "GENESIS PRE-SEASON" in solid purple #7C3AED

BOTTOM-RIGHT: Small flat-vector "Built for Solana Mobile" badge in cyan.

BACKGROUND: Solid dark #020510. Optional very subtle hexagonal grid 
pattern at 5% opacity. NO nebula clouds, NO realistic stars, NO lens 
flares, NO depth of field. Keep it FLAT and minimalist.

STYLE: Modern flat-vector design like Solana / Phantom / Magic Eden 
official banners. High readability, brand-focused, premium feel.

Format: PNG, 1200x600 horizontal.
```

---

## 4️⃣ SPLASH SCREEN — 1284×2778 (iOS-style fallback)

> Полноэкранный splash для устройств без Lottie support (iOS, web fallback).

### Промт

```
Vertical phone splash screen 1284x2778 for mobile game Seeker Quest League.

CENTER (vertical middle): Massive glowing golden orb (about 40% of screen 
height) with multiple orbital rings spinning around it. Rings in alternating 
colors: purple #A855F7, pink #EC4899, cyan #06B6D4. Bright electric sparks 
emanate from the orb.

BELOW the orb: 
- Bold text "SEEKER QUEST LEAGUE" in golden #FACC15, letter-spacing 4px
- Subtitle below: "GENESIS PRE-SEASON" in purple #7C3AED, smaller

TOP and BOTTOM: Dark vignette fading to pure black.

BACKGROUND: Full-screen cosmic nebula — purple, pink, and dark blue clouds.
Hundreds of tiny stars scattered, with a few brighter ones.
Subtle parallax depth — closer stars sharper, distant stars softer.

STYLE: Cinematic, immersive, like opening title of a sci-fi blockbuster.
The orb is the hero, everything else supports it.

Format: PNG, 1284x2778 vertical (9:19.5 aspect — modern iPhone).
```

---

## 5️⃣ ADAPTIVE ICON FOREGROUND — 512×512 (Android)

> Android требует "adaptive icons" — отдельный foreground (с прозрачностью)
> и background (плоский цвет). См. https://developer.android.com/develop/ui/views/launch/icon_design_adaptive

### Промт для foreground

```
Adaptive Android icon foreground 512x512 with TRANSPARENT background.

CONTENT: Only the central glowing golden orb with one purple #A855F7 
orbital ring. The orb fills about 60% of the canvas (Android adds 
33% padding for various mask shapes). NO background — fully transparent.

The orb has internal glow effect (still readable as foreground only),
but no external lighting that would clip to the canvas edge.

STYLE: Same as main app icon (Промт A) but simplified — just the orb
+ one ring, no nebula, no stars, no rings beyond the safe zone.

Format: PNG with alpha channel, 512x512.
```

### Background color (отдельный layer в `colors.xml`)

Не нужен AI — это просто **#0A0A12** в Android resources:
```xml
<!-- android/app/src/main/res/values/colors.xml -->
<color name="iconBackground">#0A0A12</color>
```

---

## 6️⃣ OG-IMAGE — 1200×630 (для сайта)

> Open Graph preview когда ссылку на seekerquest-league.com шарят в соцсетях.
> **Flat-vector style для consistency с App Icon.**

### Промт

```
Flat-vector style Open Graph preview 1200x630 for seekerquest-league.com.
Minimalist cyberpunk neon aesthetic, high contrast.

CENTER-LEFT: Same orb design as the app icon — bright luminous golden 
orb #FACC15 with two thick orbital rings (purple #A855F7 and pink #EC4899).

CENTER-RIGHT: Bold flat-vector text composition:
- Top: "SEEKER QUEST LEAGUE" — golden #FACC15, bold, large
- Middle: "Web3 Tap-to-Earn on Solana Mobile" — white, medium
- Bottom: Pill badge "GENESIS PRE-SEASON · LIVE" in purple #7C3AED

BOTTOM-RIGHT corner: Small flat-vector "Built for Seeker" text in cyan.

BACKGROUND: Solid dark #020510. NO nebula, NO complex patterns.
Maybe one or two very subtle stars as small white dots.

STYLE: Modern flat-vector graphic design. Like Solana brand visual or 
Phantom wallet share cards. Premium, brand-focused, instantly readable.

Format: PNG, 1200x630.
```

---

## 7️⃣ TWITTER/X BANNER — 1500×500

> Header для X-аккаунта проекта.
> **Flat-vector style для consistency с App Icon.**

### Промт

```
Flat-vector style Twitter X header 1500x500 for Seeker Quest League.
Minimalist cyberpunk neon aesthetic, high contrast.

CENTER-LEFT (in the safe 1200px center area):
Large bold flat-vector text "EARN ORB. WIN SOL." with each word in its 
own bold neon color:
- "EARN" in cyan #06B6D4
- "ORB." in golden #FACC15
- "WIN" in white
- "SOL." in purple #A855F7
All letters with strong outer neon glow on solid #020510 background.

CENTER-RIGHT (in the safe area):
Same orb design as the app icon — flat-vector luminous golden orb with 
two thick orbital rings (purple #A855F7 and pink #EC4899). Around it, 
4-5 small flat-vector planet icons (wheel, rocket, trophy, gem, swords).

BOTTOM CENTER: Small flat-vector hashtags 
"#SolanaMobile #PlayToEarn #SeekerQuest" in muted gray #475569.

BACKGROUND: Solid dark #020510. NO nebula, NO complex gradients, NO 
realistic stars. Keep it FLAT.

NOTE: Twitter crops sides on mobile. Keep all important content in 
the center 1200px area.

STYLE: Modern flat-vector design. Brand-focused. Like Solana or Phantom 
official X headers.

Format: PNG, 1500x500 horizontal.
```

---

## 🤖 ГДЕ ГЕНЕРИРОВАТЬ

### Рекомендация: **Gemini в Google AI Studio**

1. Зайти на [aistudio.google.com](https://aistudio.google.com)
2. Создать чат с **Gemini 2.5 Pro** или **Imagen 3/4**
3. Загрузить `ICONS-BRIEF.md` через "+" → Upload File
4. Промт:
   > Прочитай `ICONS-BRIEF.md` и сгенерируй икону по **Промт A** (Glowing Orb).
   > Затем дай мне ещё 3 варианта той же идеи с небольшими изменениями (для выбора).

### Альтернативы

| Сервис | Лучше для | Цена |
|--------|-----------|------|
| **[Gemini Imagen](https://aistudio.google.com)** | Photorealism, soft shadows | Free tier |
| **[Ideogram](https://ideogram.ai)** | **Иконки с текстом** (banners!) | $8/mo |
| **[Midjourney v6](https://midjourney.com)** | Самое красивое из всех | $10/mo |
| **[FLUX Pro](https://flux.pro)** | Открытая модель, control | $10/mo |
| **[Recraft AI](https://recraft.ai)** | Vector logos, UI design | Free tier |

### Best practice
1. **Сгенерируй 5-10 вариантов** каждой иконки
2. **Выбери 1-2 финалиста** на каждый размер
3. **Покажи мне** — я скажу какая работает лучше для брендинга
4. **Финальную** прогони через [Squoosh](https://squoosh.app) → WebP/AVIF для оптимизации

---

## 📁 Куда положить готовые файлы

```
C:\sk\
├── assets\
│   ├── icon.png                    ← 512×512 (главная)
│   ├── adaptive-icon.png           ← 512×512 (Android foreground)
│   └── splash-icon.png             ← 512×512
├── dapp-store\media\
│   ├── icon.png                    ← копия 512×512
│   ├── feature-graphic.png         ← 1024×500
│   ├── banner.png                  ← 1200×600
│   ├── screenshot-1.png            ← 1080×1920
│   ├── ...                         ← screenshot-2..8
│   └── app-release.apk             ← (будет создан при сабмите)
└── website\
    └── og-image.png                ← 1200×630
```

---

## ✅ Проверочный чеклист

Перед финальной публикацией:
```
[ ] icon.png 512×512 — выглядит хорошо в 48×48 (notification размер)
[ ] icon.png — никакого текста (плохо читается на маленьких)
[ ] icon.png — высокий контраст (видно на любом фоне)
[ ] feature-graphic.png — текст читается с расстояния
[ ] banner.png — работает в мобильном режиме (центр виден)
[ ] Все PNG прогнаны через Squoosh (compression -50%)
[ ] adaptive-icon-fg.png имеет transparent background
[ ] Никаких watermarks от AI генератора
[ ] Все иконки — единый стиль (palette match)
```

---

## 💡 Совет по итерации

Когда генерируешь — **не пиши промт целиком за раз**. Делай так:

1. **Первая попытка** — короткий промт: "Glowing golden orb on dark space background, 512×512 app icon"
2. **Оцени** что получилось
3. **Уточни**: "Make the orb more 3D, add purple electric ring"
4. **Итерируй** 3-5 раз, добавляя детали
5. **Зафиксируй** успешный seed/параметры
6. **Генерируй** финальные варианты с того же seed

Так получится лучше чем один большой промт за раз.

---

_Document version 1.0 · Last update: 2026-05-29_
