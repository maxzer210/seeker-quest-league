# Арт-пайплайн: персонажи и монстры «Лабиринта Бездны»

Продолжение `ART-PIPELINE.md` (там были текстуры и key art — они сработали).
Здесь — самое сложное для ИИ: **персонажи**.

Готовые файлы клади в `D:\sk\assets\labyrinth\` с точными именами из таблицы.
Код я подготовлю так, что при отсутствии файла остаётся текущий пиксель-арт —
можно присылать по одному и смотреть результат.

---

## Почему это должно получиться (в отличие от обычных попыток)

**Нужен ОДИН кадр на персонажа, не спрайт-лист.** Вся анимация — процедурная:
приседание при шаге, дыхание в покое, замах, отскок от удара, наклон в беге
считает код. Поэтому от генератора требуется не серия согласованных кадров
(что ИИ делает плохо), а **один хороший рисунок** (что ИИ делает хорошо).

**Стиль — живописный, не пиксельный.** Пол и стены у тебя получились
живописными; пиксельный персонаж на них смотрелся бы чужим.

---

## Общие требования ко ВСЕМ файлам

| Параметр | Значение |
|---|---|
| Размер | **1024×1024** (я уменьшу до 256 — запас на чёткость) |
| Фон | **полностью прозрачный** (PNG-32) |
| Ракурс | **вид сверху под углом ~50°** — как в Hades / Diablo: видно голову и плечи, фигура стоит вертикально, смотрит вниз-на-зрителя |
| Композиция | **одна фигура целиком**, по центру,小 отступ по краям |
| Чего быть НЕ должно | тени на земле, подставки, пола, рамки, текста, второй фигуры |

> Если генератор не умеет прозрачность — ставь **однородный ярко-зелёный фон
> `#00FF00`**, я вырежу его сам. Это надёжнее, чем плохая альфа.

---

## СТИЛЕВОЙ ПРЕФИКС — вставляй в начало КАЖДОГО промпта

```
dark fantasy game character sprite, painted digital illustration, top-down
three-quarter view from about 50 degrees above, character standing upright and
facing the viewer, full body centred in frame, dramatic rim lighting from a
torch below-left, deep violet and black palette with cyan magical accents,
crisp clean edges, transparent background, no ground, no shadow, no base,
no frame, no text, single character only,
```

**Негативный промпт (везде одинаковый):**
```
side view, front view, isometric tile, pixel art, 8-bit, chibi, cute, anime,
multiple characters, ground shadow, platform, pedestal, background scenery,
text, watermark, ui, border, cropped limbs, blurry edges
```

---

## Персонажи

### 1. Сикер (игрок) — `spr_seeker.png` ⭐ самый важный

```
[СТИЛЕВОЙ ПРЕФИКС] a hooded seeker in a tattered deep-violet cloak holding a
burning torch in the left hand and a short runed sword in the right, face
hidden in shadow under the hood with two glowing cyan eyes, worn leather
straps and a satchel, heroic but weathered silhouette, the torch casting warm
orange light across the cloak folds
```

### 2. Тень — `spr_shade.png`

```
[СТИЛЕВОЙ ПРЕФИКС] a spectral shade, a hovering wraith of torn dark-indigo
smoke with no legs, its lower body dissolving into wisps, two burning yellow
eyes in a hollow void of a face, ragged shroud edges trailing upward
```

### 3. Призрак — `spr_wraith.png`

```
[СТИЛЕВОЙ ПРЕФИКС] a tall gaunt spectre wrapped in decaying teal grave-cloth,
skeletal arms reaching forward, hollow eye sockets glowing pale green, faint
ectoplasmic mist bleeding from its ribs, elongated menacing silhouette
```

### 4. Ползун — `spr_crawler.png`

```
[СТИЛЕВОЙ ПРЕФИКС] a squat crawling horror, low to the ground on six chitinous
crimson legs, a cluster of small glowing orange eyes across a lumpy carapace,
wet dark-red hide, wide flat body built for scuttling
```

### 5. Громила (элита) — `spr_brute.png`

```
[СТИЛЕВОЙ ПРЕФИКС] a hulking brute demon, massive shoulders and small head,
cracked dark-red hide glowing with molten orange fissures across the chest,
two curved black horns, huge clenched fists, heavy imposing stance
```

### 6. Страж (босс) — `spr_guardian.png` ⭐ второй по важности

```
[СТИЛЕВОЙ ПРЕФИКС] a towering ancient armoured sentinel, heavy blackened
plate armour etched with glowing runes, a blazing cyan energy core burning in
the centre of its chest, faceless helm with two pink glowing eye slits,
enormous gauntleted fists, monumental boss-monster presence, cracks of cyan
light between the armour plates
```

---

## Единство стиля — критично

1. **Генерь всё одной пачкой, в одной сессии, одним генератором.** Стиль
   плывёт между сервисами и даже между днями.
2. Midjourney: одинаковый хвост у всех — `--style raw --ar 1:1`, и держи
   **один и тот же `--seed`** (например `--seed 4242`).
3. Начни с **сикера**. Когда он понравится — используй его как референс
   стиля (`--sref` в Midjourney или image-to-image) для остальных пяти.
4. Палитра общая: `#7C3AED` фиолетовый, `#22D3EE` голубой, `#FACC15` золото,
   `#EC4899` розовый, фон `#04060F`.

## Как проверить перед отправкой мне

- [ ] Фигура **стоит вертикально**, видно сверху под углом — не сбоку и не в
      профиль (самая частая ошибка генераторов)
- [ ] Фон **прозрачный** или ровный зелёный `#00FF00`
- [ ] **Нет тени на земле** и нет подставки — тень рисует движок
- [ ] Ничего не обрезано по краям
- [ ] Все шесть в **одном стиле** (посмотри их рядом)

## Что дальше делаю я

Добавлю в рендер путь для PNG-спрайтов с плавным откатом: есть файл — рисуем
картинку, нет — остаётся текущий пиксель-арт. Процедурная анимация
(приседание, дыхание, замах, отскок, вспышка при уроне) работает одинаково
в обоих случаях, поэтому персонажи сразу оживут.

**Присылай по одному — не жди, пока соберёшь все шесть.** Начни с сикера:
его видно каждую секунду игры, он даст самый заметный эффект.
