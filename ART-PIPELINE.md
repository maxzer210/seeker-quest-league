# Арт-пайплайн «Лабиринта Бездны» — PNG-ассеты

Ты генеришь картинки по промптам ниже → кладёшь в `C:\sk\assets\labyrinth\`
с **точно такими именами** → я встраиваю. Код уже готов подхватывать их
с плавным откатом: пока файла нет, рисуется текущая процедурная версия,
ничего не ломается.

## Где генерировать

Подойдёт любой: Midjourney, DALL·E 3, Stable Diffusion / Flux, Leonardo,
Ideogram. Промпты на английском — генераторы понимают его заметно лучше.

## ⚠️ Честно о том, что получится, а что нет

| Тип ассета | Насколько хорошо ИИ справляется | Вердикт |
|---|---|---|
| Бесшовные текстуры камня | Отлично | **делаем PNG** |
| Фоновые иллюстрации (меню, смерть) | Отлично | **делаем PNG** |
| Орнаментные рамки/панели | Хорошо | **делаем PNG** |
| Крупные иконки предметов | Хорошо | **делаем PNG** |
| Спрайты персонажей/врагов | **Плохо** — каждая генерация в своём стиле, перспектива top-down почти всегда неверная, палитра плывёт | оставляем ручной pixel-art, улучшаем разрешением |

Максимальный эффект дают **пункты 1-2**: пол и стены занимают ~70% экрана,
их замена меняет вид игры сильнее, чем что-либо ещё.

---

# ПРИОРИТЕТ 1 — текстуры подземелья (наибольший эффект)

### 1. Пол — `floor_stone.png`
**Размер: 512×512, БЕСШОВНАЯ (tileable), без прозрачности**

```
seamless tileable texture, ancient dungeon stone floor, large worn flagstones
with mortar gaps, subtle cracks and chips, faint moss in the seams, dark
desaturated purple-grey stone (#2b2052 base), moody, top-down orthographic
view, flat even lighting with no directional shadows, no vignette, high detail,
dark fantasy video game texture, 512x512, PBR albedo map
```
**Negative:** `perspective, 3d rendering, light source, shadows, vignette, seams, borders, text, watermark, characters, props`

### 2. Стена (вид сверху) — `wall_stone.png`
**Размер: 512×512, БЕСШОВНАЯ, без прозрачности**

```
seamless tileable texture, top view of ancient dungeon stone brick wall,
massive carved blocks, chiselled edges, weathered surface, faint arcane
engravings, lighter violet-grey stone (#4a3a7a base), dark fantasy game
texture, orthographic top-down, flat even lighting, no shadows, 512x512
```
**Negative:** `perspective, 3d, shadows, lighting, vignette, seams, text, watermark`

### 3. Опционально — `floor_cracked.png`, `floor_mossy.png`
Те же промпты + `heavily cracked, broken flagstones` / `overgrown with dark
green lichen and moss`. Дают разнообразие пола (я буду чередовать случайно).

---

# ПРИОРИТЕТ 2 — иллюстрации экранов

### 4. Фон меню — `menu_keyart.png`
**Размер: 1080×1920 (вертикально), без прозрачности**

```
dark fantasy game key art, vertical mobile wallpaper, a lone hooded seeker
with a burning torch stands at the crumbling stone brink of a vast circular
abyss, swirling cyan and violet energy rising from the depths, glowing embers
floating upward, ancient carved runes on the stone rim, deep purple and black
palette with warm gold torchlight, volumetric fog, cinematic lighting,
atmospheric, painterly digital illustration, Diablo and Darkest Dungeon mood,
no text, empty space in the upper third for a title
```
**Negative:** `text, logo, watermark, ui, buttons, bright colours, cartoon, anime, cute`

### 5. Экран смерти — `death_art.png` (1080×1920)
```
dark fantasy game over illustration, a cracked ancient skull half-buried in
dungeon rubble, dying purple embers, an extinguished torch beside it, deep
shadow, crimson and black palette, ominous, painterly digital art, vertical
composition with empty space in the centre, no text
```

### 6. Экран победы — `victory_art.png` (1080×1920)
```
dark fantasy victory illustration, a radiant cyan portal of swirling arcane
energy opening in an ancient dungeon wall, golden light spilling across stone
floor, floating motes of light, triumphant but mysterious mood, deep violet
and cyan palette, painterly digital art, vertical, empty space in the centre,
no text
```

---

# ПРИОРИТЕТ 3 — UI-рамки (9-slice)

### 7. Панель — `frame_panel.png`
**Размер: 512×512, ПРОЗРАЧНЫЙ фон (PNG-32)**

```
ornate dark fantasy UI panel frame, empty rectangular border only, carved
blackened iron with violet gemstone corner accents, subtle arcane engraving
along the edges, game inventory panel border, transparent centre, symmetrical,
flat 2D game asset, no background, PNG with alpha
```
**Negative:** `filled centre, background, text, content, 3d, perspective, shadow`
> Важно: центр должен быть **пустым и прозрачным** — я растяну рамку по краям.

### 8. Кнопка — `frame_button.png` (512×192, прозрачный)
```
ornate dark fantasy UI button frame, horizontal pill shape, blackened iron
with violet glow along the inner edge, small gem at each end, empty
transparent centre, flat 2D game asset, no text, no background, PNG with alpha
```

---

# ПРИОРИТЕТ 4 — иконки (по желанию)

**Каждая: 256×256, ПРОЗРАЧНЫЙ фон.** Базовый шаблон — подставляй предмет:

```
dark fantasy game item icon, [ПРЕДМЕТ], centred, three-quarter view, rich
detail, violet and gold palette with cyan magical glow, painted game icon
style, dark rim lighting, transparent background, no border, no frame, no text
```

Предметы и имена файлов:
| Файл | `[ПРЕДМЕТ]` |
|---|---|
| `icon_sword.png` | `an ornate runeblade sword with a glowing cyan rune along the blade` |
| `icon_torch.png` | `a burning torch with warm golden flame` |
| `icon_boots.png` | `enchanted leather boots with cyan magical wisps` |
| `icon_heart.png` | `a crystal heart pulsing with crimson inner fire` |
| `icon_candle.png` | `a lit candle with a spectral pink flame` |
| `icon_lantern.png` | `an ornate lantern burning with spectral cyan flame` |
| `icon_orb.png` | `a glowing violet orb of arcane energy` |
| `icon_artifact.png` | `a faceted cyan crystal artifact radiating light` |

---

## Единство стиля — важно!

Чтобы ассеты выглядели как один комплект, а не сборная солянка:

1. **Генерируй всё в одной сессии одним генератором** — стиль плывёт между
   сервисами и даже между днями.
2. В Midjourney добавляй ко **всем** промптам одинаковый хвост:
   `--style raw --ar 1:1` (для 1:1) и держи один и тот же `--seed`.
3. **Палитра — общая для всего:** фиолетовый `#7C3AED`, тёмный фон `#04060F`,
   голубой акцент `#22D3EE`, золото `#FACC15`, розовый `#EC4899`.
4. Ключевые слова-якоря стиля во всех промптах: `dark fantasy`, `painterly`,
   `deep violet and black palette`, `moody`.

## Проверка перед отправкой мне

- [ ] Текстуры (1-3) — **действительно бесшовные**? (проверь: сдвинь картинку
      на половину — швов на стыке быть не должно)
- [ ] Рамки (7-8) — центр **прозрачный**, не белый и не чёрный?
- [ ] Иконки — фон **прозрачный** (PNG-32, не JPEG)?
- [ ] Имена файлов — **точно как в таблицах выше**
- [ ] Всё лежит в `C:\sk\assets\labyrinth\`

Готово — скажи, и я встрою. Начинай с пунктов 1-2, эффект увидишь сразу.
