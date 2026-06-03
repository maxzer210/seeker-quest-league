# 🛡 SKORA Claim — Security Assessment & Gate

> Анализ безопасности перед включением SKORA claim.
> Создано: 2026-06-02 · Nova
> Статус: 🔴 CLAIM ДОЛЖЕН ОСТАВАТЬСЯ ВЫКЛЮЧЕННЫМ до устранения блокера

---

## 🚨 ГЛАВНЫЙ ВЫВОД

**Включать SKORA claim СЕЙЧАС нельзя.** Не потому что не написан процессор (он есть),
а потому что **баланс ORB на сервере не является доверенным**.

Claim конвертирует ORB → реальный SPL-токен на mainnet. Если ORB можно подделать —
можно бесплатно начеканить реальные токены. Это прямой финансовый эксплойт.

---

## 🔍 Где именно дыра

### Источник правды по ORB = `players.orb`

В `App.tsx` (`syncScore`, строка ~685) баланс пишется **прямым клиентским update**:

```js
await supabase.from('players').update({
  orb:        currentOrb,     // ← клиент диктует баланс
  season_orb: currentOrb,
}).eq('device_id', deviceIdRef.current);
```

Это значит: любой человек с **anon-ключом** (а он зашит в APK и легко извлекается)
может выполнить:

```js
supabase.from('players').update({ orb: 999999999 }).eq('device_id', myDevice)
```

→ выставить себе любой баланс → затем claim'нуть 1000 SKORA на свой кошелёк.

### Почему «RPC с проверкой баланса» НЕ спасает

Наивное решение — RPC `create_skora_claim`, который проверяет
`players.orb >= orb_spent`. **Это плацебо:** читер сначала накручивает `players.orb`,
потом вызывает RPC — проверка проходит. Защищать claim, не защитив сам баланс ORB,
бессмысленно.

### Текущая RLS на skora_claims тоже дырявая

`supabase-skora-claims.sql` разрешает прямой INSERT любому anon с проверкой только
границ (10K–10M ORB, status=pending). **Нет привязки к реально потраченному ORB.**
Можно слать неограниченно claim'ов.

---

## ✅ Что для активации claim УЖЕ готово

| Компонент | Статус |
|---|---|
| SKORA токен на mainnet | ✅ |
| `skora_claims` таблица + индексы | ✅ |
| Процессор `process-skora-claims.js` | ✅ (починен: config-driven, mainnet) |
| SKORAWallet UI | ✅ (кнопка disabled) |
| `lib/skora.ts` API | ✅ |

## 🔴 Что БЛОКИРУЕТ активацию

| # | Блокер | Сложность |
|---|--------|-----------|
| B1 | **ORB-баланс client-authoritative** — `players.orb` пишется напрямую | 🔴 большой рефактор |
| B2 | RLS на `skora_claims` разрешает прямой INSERT без привязки к ORB | 🟡 средний |
| B3 | Нет server-side списания ORB атомарно с созданием claim | 🟡 средний |
| B4 | Mint authority НЕ revoked (отдельный риск доверия, см. LISTING-PLAN) | 🟢 малый |

---

## 🛠 ПРАВИЛЬНОЕ РЕШЕНИЕ (для Season 1)

Чтобы claim был безопасным, ORB-экономика должна стать **server-authoritative**.
Минимально достаточный путь:

### Вариант A — Полный (правильный, но дорогой)
Каждый earn/spend ORB идёт через RPC, сервер хранит баланс, клиент только отображает.
Большой рефактор всего App.tsx. Реалистично — отдельный спринт.

### Вариант B — Достаточный для claim (рекомендую для старта)
Не переписывая всю экономику, защитить именно конвертацию:

1. **Серверный «claimable» баланс** — отдельная колонка/таблица, которую клиент
   НЕ может писать напрямую (RLS block на UPDATE `players.orb`).
   Пополняется только серверной логикой (tournament_scores уже идёт через RPC —
   взять его как источник истины для claimable).
2. **RPC `create_skora_claim(device, wallet, orb_amount)`** SECURITY DEFINER:
   - проверяет claimable_balance >= orb_amount
   - атомарно: списывает claimable + вставляет claim (pending)
   - rate-limit (напр. 1 claim / 10 мин, max N / день)
   - возвращает claim id
3. **RLS lockdown** на `skora_claims`: `INSERT WITH CHECK (false)` — только через RPC
   (как сделано для tournament_scores в security-v1).
4. **RLS lockdown** на `players.orb` UPDATE — клиент больше не пишет баланс напрямую.
5. `lib/skora.ts` `createSkoraClaim` → переключить на `supabase.rpc('create_skora_claim')`.

> ⚠️ Шаг 4 потребует переноса всей логики начисления ORB на сервер — это и есть
> главная работа. Без него claimable можно подделать.

---

## 📋 Чек-лист перед включением кнопки claim

- [ ] ORB-баланс защищён от клиентской подделки (B1)
- [ ] `create_skora_claim` RPC с атомарным списанием + rate-limit (B2, B3)
- [ ] RLS: прямой INSERT в `skora_claims` заблокирован
- [ ] RLS: прямой UPDATE `players.orb` заблокирован
- [ ] `lib/skora.ts` использует RPC, не INSERT
- [ ] Mint authority revoked / vesting (B4 — доверие, см. SKORA-LISTING-PLAN.md)
- [ ] Процессор протестирован на devnet (SKORA_CONFIG=devnet-config)
- [ ] Лимиты: max SKORA/день на устройство + на кошелёк
- [ ] Только потом: убрать `disabled` в `SKORAWallet.tsx:259`

---

## 🎯 Решение Nova (2026-06-02)

Я **намеренно не стала писать RPC-заглушку**, которая выглядит безопасной, но
ей не является (проверка спуфабельного `players.orb`). На mainnet с реальными
деньгами ложная уверенность опаснее честного «ещё не готово».

**Что сделано в этой сессии:**
- ✅ Починен процессор: был на devnet + читал не тот config → теперь config-driven,
  по умолчанию mainnet, с предупреждением о реальном минте.
- ✅ Зафиксирован реальный блокер (этот документ).

**Следующий шаг (твоё решение для Season 1):** сделать ORB server-authoritative
по Варианту B. Это единственный честный способ включить claim без эксплойта.

---

_Создано 2026-06-02 · Nova · gate-документ перед активацией claim_
