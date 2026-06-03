# 🔧 ORB Server-Authoritative — Client Refactor Plan

> План перевода клиента на серверный баланс ORB.
> Создано: 2026-06-02 · Nova
> Зависит от: `supabase-orb-authoritative.sql` (применить ПЕРВЫМ)

---

## 🎯 Цель

Сейчас клиент сам считает ORB и пишет `players.orb` напрямую (спуфится).
После рефактора клиент только **просит сервер** изменить баланс и **отображает**
то, что вернул сервер.

---

## 🧩 Ядро решения: один helper

Вместо ~30 разрозненных `setOrb(...) + syncScore(...)` — единая функция:

```ts
// добавить в App.tsx (или lib/orb.ts)
async function applyOrbDelta(delta: number, reason: string) {
  if (!deviceIdRef.current) return;
  // оптимистичный апдейт для отзывчивости UI
  setOrb(prev => Math.max(0, prev + delta));
  try {
    const { data, error } = await supabase.rpc('apply_orb_delta', {
      p_device_id: deviceIdRef.current,
      p_delta:     delta,
      p_reason:    reason,
    });
    if (error) throw error;
    // сервер — источник истины: выравниваем локальный баланс
    if (data?.balance != null) setOrb(data.balance);
  } catch (e) {
    // откат оптимистичного апдейта при отказе сервера
    setOrb(prev => Math.max(0, prev - delta));
  }
}
```

> Локальный `orb` остаётся для мгновенного UI, но **финальное значение всегда
> приходит с сервера**. Рассинхрон самокорректируется при каждом действии.

---

## 🔁 Что меняем (карта ~30 мест)

Все вызовы вида `setOrb(next); syncScore(next, ...)` → `applyOrbDelta(delta, reason)`.

| Группа | Строки (App.tsx) | reason |
|--------|------------------|--------|
| Тап-награда | ~478, 542 | `'tap'` |
| Wheel (500/10K/jackpot) | ~1001, 1013 | `'wheel'` |
| P2P send (списание) | ~1102 | `'p2p_send'` |
| Streak claim | ~1303 | `'streak'` |
| Mini-game награды | ~1375, 1482, 1488, 1506 | `'game_*'` |
| Shop покупки (списание) | ~1538 | `'shop'` |
| Прочие игры (Arena/Horse/...) | 2677–3119 | `'game_*'` |
| Profile / прочее | 3637–3692 | по контексту |
| FortuneWheel onEarnOrb/onSpendOrb | 3671, 3691 | `'wheel'` |

> Точные строки уточнить при правке — файл живой. Логика везде одинаковая:
> вычислить `delta` (было `next - orb`), вызвать `applyOrbDelta(delta, reason)`.

---

## ❌ Что удаляем

- `syncScore()` запись `orb`/`season_orb` — сервер теперь сам пишет баланс.
  Оставить в `syncScore` только `level` и `streak` (их клиент пишет легитимно).
- Прямой INSERT в `skora_claims` (`SKORAWallet.tsx`) → заменить на
  `supabase.rpc('create_skora_claim', {...})`.

---

## 🧪 Тест-план перед билдом

1. Применить `supabase-orb-authoritative.sql` на Supabase.
2. Проверить: старый клиент после REVOKE не падает (orb просто не растёт вверх).
3. Собрать APK с рефактором, проверить:
   - тап начисляет ORB (через RPC, баланс совпадает с сервером)
   - покупка в shop списывает
   - попытка списать больше баланса → отказ сервера, откат UI
   - rate-limit: спам-скрипт упирается в «Earn rate limit exceeded»
4. Claim (`create_skora_claim`) на devnet-конфиге процессора.
5. Только потом — включить кнопку claim (`SKORAWallet.tsx:259`).

---

## ⚠️ Риски и заметки

| Риск | Митигейшн |
|------|-----------|
| Сетевая задержка на каждое начисление | оптимистичный UI + выравнивание |
| Оффлайн-игра | копить дельту локально, слать при коннекте (фаза 2) |
| Rate-limit мешает честному игроку | лимит 200K ORB/мин — заведомо выше нормальной игры |
| Старые клиенты (до апдейта APK) | баланс просто не синхронизируется вверх, не ломается |

---

## 📋 Порядок выполнения

- [ ] 1. Применить `supabase-orb-authoritative.sql`
- [ ] 2. Добавить `applyOrbDelta` helper в App.tsx
- [ ] 3. Заменить ~30 мест на `applyOrbDelta(delta, reason)`
- [ ] 4. Почистить `syncScore` (убрать orb/season_orb)
- [ ] 5. `SKORAWallet.tsx` → `create_skora_claim` RPC
- [ ] 6. TS check + сборка APK
- [ ] 7. Тесты (см. выше)
- [ ] 8. Опубликовать APK
- [ ] 9. Включить claim → Season 1

---

_Создано 2026-06-02 · Nova · парный документ к supabase-orb-authoritative.sql_
