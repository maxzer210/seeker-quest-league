# 🎁 Early Rewards — Runbook (0.5 SOL первая раздача)

> Как безопасно раздать первые 0.5 SOL и подтвердить обещание «Win real SOL».
> Создано: 2026-06-03 · Nova · модель: HYBRID

---

## 💰 Что раздаём

| Пул | Сумма | Кому |
|---|---|---|
| 🏆 Competitive | 0.35 SOL | Топ-10 по очкам турнира (#1≈0.105, #2≈0.063, #3≈0.042, #4-6≈0.028, #7-10≈0.014) |
| 🎁 Early-bird | 0.15 SOL | Первые 30 игроков с привязанным кошельком, поровну (~0.005 каждому) |

Параметры меняются в шапке `scripts/distribute-early-rewards.js`
(`COMPETITIVE_POOL`, `EARLYBIRD_POOL`, `EARLYBIRD_COUNT`, `COMPETITIVE_SHARES`).

---

## ✅ Предусловия

1. Миграция `supabase-prize-distribution.sql` применена (таблица `prize_distributions`
   + колонка `players.wallet_address`). — проверить в Supabase.
2. **Отдельный** distribution-кошелёк (НЕ Phantom-treasury):
   ```powershell
   cd C:\sk
   solana-keygen new --outfile distribution-wallet.json
   ```
   Запиши показанный address и **переведи на него ~0.51 SOL mainnet**
   (0.5 на призы + запас на комиссии).
3. Service key из Supabase (Settings → API → service_role).

> ⚠️ `distribution-wallet.json` — СЕКРЕТ. Убедись что он в `.gitignore` (как
> остальные keypair-файлы). Не коммить!

---

## 🧪 Шаг 1 — DRY RUN (безопасно, ничего не отправляет)

```powershell
cd C:\sk
$env:SUPABASE_SERVICE_KEY = "<service_role key>"
node scripts/distribute-early-rewards.js
```

Скрипт покажет таблицу: кто, сколько, на какой кошелёк — **без отправки**.
Проверь:
- сколько игроков реально с кошельком (если 0 в early-bird — рано раздавать);
- суммы выглядят адекватно;
- хватает баланса на кошельке.

---

## 🚀 Шаг 2 — LIVE (реальная отправка mainnet SOL)

Только после проверки dry-run:

```powershell
node scripts/distribute-early-rewards.js --live
```

- 5 секунд на отмену (Ctrl+C).
- Каждая выплата: вставка `pending` → отправка SOL → пометка `sent` + tx_signature.
- Идемпотентно: повторный запуск НЕ платит дважды (пропускает уже `sent`).

---

## 🔎 Шаг 3 — Проверка / прозрачность

- Каждый tx виден на Solana Explorer.
- Таблица `prize_distributions` (публичное чтение) — можно показать комьюнити
  как доказательство выплат.
- Можно сделать пост: «Genesis Early Rewards выплачены — N игроков, 0.5 SOL,
  все tx on-chain».

---

## 🧯 Если что-то пошло не так

| Симптом | Что делать |
|---|---|
| `wallet balance too low` | докинуть SOL на distribution-wallet |
| early-bird пустой | мало игроков с кошельком — подождать рост базы |
| часть `failed` | повторный `--live` допошлёт только непосланное (идемпотентно) |
| `keypair not found` | проверь `distribution-wallet.json` или `DISTRIBUTION_KEYPAIR` env |

---

## ⚠️ Важно

- Это **не** автоматизация — запускаешь вручную, осознанно.
- Не трогает приложение / APK — на ревью ничего не меняется.
- Treasury Phantom (`CxYfXX…LGSp`) НЕ используется скриптом — раздаём с
  отдельного кошелька, чтобы не держать seed основного в файле.

---

_Создано 2026-06-03 · Nova · парный файл к scripts/distribute-early-rewards.js_
