# Seeker Quest League — v1.2.6

`versionCode 22` · build `2026-09-13 · device-fixes` · APK `releases/seeker-quest-1.2.6.apk`

Идёт на смену **1.2.3** (последняя в магазине). Версии 1.2.4 и 1.2.5 в магазин не
загружались, поэтому текст ниже описывает всё, что изменилось с 1.2.3.

Английский текст уже стоит в `config.yaml` → `new_in_version`.

**Сознательно без слов о SOL, призах и SKORA.** Фонд не работал, Season Zero
закрыт возвратом платежей, обещать деньги в описании релиза нельзя до Сезона 1.

---

## What's new (English, для поля в портале)

```
v1.2.6
◎ Solana Quest now shows exactly when the next set arrives — a live countdown that is correct in every time zone
🌐 Invites and Space Runner are now translated into Русский, 中文, 日本語 and Français
🎨 Cleaner quest screens: the results button no longer sits under the navigation bar, and the home quest card is re-balanced
🔒 We now record a few anonymous first-session milestones to find where new players get stuck. Details in the updated privacy policy
🛠 Stability fixes
```

## Что нового (русский, для канала)

```
v1.2.6
◎ Solana Quest показывает, когда именно выйдет новый набор — живой отсчёт, верный в любом часовом поясе
🌐 Приглашения и Space Runner переведены на русский, китайский, японский и французский
🎨 Экраны квеста аккуратнее: кнопка на итоговом экране больше не прячется под панелью навигации, карточка квеста на главной выровнена
🔒 Теперь мы записываем несколько обезличенных вех первой сессии, чтобы понять, где новички застревают. Подробности в обновлённой политике приватности
🛠 Исправления стабильности
```

---

## Что вошло на самом деле

| Версия | Изменения |
|---|---|
| 1.2.4 | Телеметрия первой сессии (`lib/funnel.ts`, `supabase-funnel.sql`), строка в политике приватности |
| 1.2.5 | 31 перевод (`ref.*`, `runner.*`) в ru/zh/ja/fr, отметка выбранного языка |
| 1.2.6 | Отсчёт до нового набора квеста, скрыта пустая плашка места, отступ кнопки DONE, ореол и перенос строки в карточке квеста |

Все правки 1.2.6 проверены на Seeker через adb 2026-09-13.
