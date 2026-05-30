# 💰 Treasury Setup — Куда идут реальные SOL

> **Цель:** объяснить путь SOL от игрока до владельца проекта.
> Перед mainnet рекомендовано настроить multisig и cold storage.

---

## 🎯 ТЕКУЩАЯ СТРАТЕГИЯ (Launch v1)

> **Решение владельца (29.05.2026):**
> На старте все собранные SOL идут **владельцу проекта (100%)**.
> Никаких автоматических распределений призов или buyback нет.
> Distribution scripts существуют (см. ниже), но **не запускаются**.

**Это означает:**
- ✅ Игроки платят 0.01–2.0 SOL → попадает в Treasury wallet владельца
- ✅ Все Founder Pass (0.5–2.0 SOL) → владельцу
- ✅ Все Premium Items (0.01–0.05 SOL) → владельцу
- ❌ **НЕТ** призового фонда top-100
- ❌ **НЕТ** SKORA buyback & burn
- ❌ **НЕТ** автоматических airdrops

**Когда включить distribution:** позже, когда будет critical mass DAU
и community давление на transparency. Тогда переключиться на 60/20/20.

**Что показывать игрокам:** UI про "prize pool" можно скрыть, или оставить
как "Genesis Pre-Season — призы будут распределены при старте Season 1"
(техническое решение — это просто отложенный distribution).


---

## 🎯 TL;DR

```
Игрок платит 0.01–2.0 SOL
        ↓
Mobile Wallet Adapter (Phantom/Backpack/Saga)
        ↓
On-chain transfer to TREASURY_WALLET
        ↓
Запись в Supabase wheel_sol_payments
        ↓
[Месячный distribution script]
        ├─→ 60% top-100 prize pool
        ├─→ 20% SKORA airdrop / buyback
        └─→ 20% project treasury (твой доход)
```

---

## 🔍 Текущее состояние (devnet, Pre-Season)

| Параметр | Значение | Где |
|----------|----------|-----|
| Network | `devnet` (test) | `lib/solanaMobile.ts:12` |
| Treasury wallet | `EekTZsoxzVEdze1HEAqLQbMnx8ScBheWBW3Dsp9QBZDT` | `lib/solanaMobile.ts:48` |
| SKORA mint | `3HTkC3v9CYTxGYQSegsidgzfxEQJvAotYZVozmaFc2av` | `lib/skora.ts:9` |
| Mint authority keypair | `skora-config.json` (локально) | gitignored |
| RPC | `https://api.devnet.solana.com` | `lib/solanaMobile.ts:14` |

⚠️ **На devnet SOL не имеет ценности!** Это тестовая сеть. Все покупки сейчас — симуляция.

---

## 🚀 Mainnet миграция — пошагово

### Step 1: Создать mainnet Treasury keypair (≈ 10 мин)

**Вариант A — Single keypair (НЕ для production!):**
```bash
solana-keygen new --outfile treasury-mainnet.json
solana-keygen pubkey treasury-mainnet.json
# → запиши публичный адрес
```

⚠️ **Использовать ТОЛЬКО для тестов или ранней Alpha.** Single keypair = single point of failure.

**Вариант B — Multisig (РЕКОМЕНДОВАНО для production):**

Используй **[Squads Protocol](https://squads.so/)** — индустриальный стандарт для Solana multisig:

1. Зайти на https://app.squads.so/
2. Подключить wallet (Phantom)
3. Create Multisig:
   - **Threshold 3-of-5** (нужно 3 подписи из 5 для любой операции)
   - **5 signers:**
     - Signer 1: твой основной wallet (теплый)
     - Signer 2: твой backup wallet (cold storage hardware)
     - Signer 3: trusted co-founder / advisor wallet
     - Signer 4: community-elected trustee (можно через snapshot голосование)
     - Signer 5: emergency wallet (sealed seed phrase в сейфе)
4. Получить multisig address → это новый **TREASURY_WALLET**

### Step 2: Создать mainnet SKORA SPL Token (≈ 5 мин)

```bash
# Используй scripts/create-skora-token.js, но укажи --network mainnet-beta
node scripts/create-skora-token.js --network mainnet-beta --supply 1000000000

# Output:
# Mint address: <NEW_MAINNET_MINT_ADDRESS>
# Mint authority: <multisig_address>  ← ВАЖНО: передать на multisig сразу
# Treasury ATA: <ассоциированный_token_account>
```

После создания **передать mint authority на ОТДЕЛЬНЫЙ multisig** (не тот же что treasury — изоляция полномочий):

```bash
spl-token authorize <MINT_ADDRESS> mint <MINT_AUTHORITY_MULTISIG>
spl-token authorize <MINT_ADDRESS> freeze <FREEZE_AUTHORITY_MULTISIG>
# Или для disable freeze:
spl-token authorize <MINT_ADDRESS> freeze --disable
```

### Step 3: Mainnet RPC

Не используй `https://api.mainnet-beta.solana.com` — он rate-limited.

**Платные RPC варианты:**

| Provider | Цена | Лимиты |
|----------|------|--------|
| **[Helius](https://helius.dev/)** | $99/mo Pro | Unlimited RPC + staked SOL benefits |
| **[QuickNode](https://www.quicknode.com/)** | $49/mo | 1M req/mo |
| **[Alchemy](https://www.alchemy.com/)** | $49/mo | 300M req/mo |
| **[Triton](https://triton.one/)** | Custom | Bare-metal nodes |

Рекомендация: **Helius** (лучшая интеграция Solana Mobile, есть SDK).

### Step 4: Обновить константы в коде

В `lib/solanaMobile.ts`:
```typescript
export const SOLANA_NETWORK = 'mainnet-beta';
export const SOLANA_CHAIN = 'solana:mainnet';
export const SOLANA_RPC = 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY';
export const TREASURY_WALLET: string = '<MAINNET_MULTISIG_ADDRESS>';
```

В `lib/skora.ts`:
```typescript
export const SKORA_MINT    = '<NEW_MAINNET_MINT>';
export const SKORA_NETWORK = 'mainnet-beta';
export const SKORA_RPC     = 'https://mainnet.helius-rpc.com/?api-key=YOUR_KEY';
```

В `lib/genesis.ts`:
```typescript
export const GENESIS_PHASE = false; // Pre-Season закончен
```

В `dapp-store/config.yaml`:
```yaml
# Обновить project URL на mainnet explorer
```

Также — поднять `BUILD_CODE` в `lib/version.ts` и в `android/app/build.gradle` (versionCode).

### Step 5: Daily distribution script

`scripts/distribute-genesis-prizes.js` — уже есть skeleton. Нужно адаптировать:

```javascript
// Запускается каждый день в 23:59 UTC по cron
const treasury = await connection.getBalance(TREASURY_WALLET);
const dailyPool = treasury - LAST_DISTRIBUTED_BALANCE;

const top100 = await supabase
  .from('tournament_scores')
  .select('device_id, score, wallet_address')
  .order('score', { ascending: false })
  .limit(100);

for (const [rank, player] of top100.entries()) {
  const share = calculateShare(rank + 1); // см. TOKENOMICS.md
  const amount = Math.floor(dailyPool * 0.60 * share);
  await sendSol(player.wallet_address, amount, treasuryMultisig);
}
```

⚠️ **Multisig подписания нужны для каждого distribution** — это особенность Squads.
Для автоматизации: настроить **delegated authority** с дневным лимитом 50 SOL.

### Step 6: Cold storage для крупных балансов

Когда treasury накапливает >10 SOL — перемещать в cold wallet:
- **Ledger Nano X** (~$150)
- Или **Solflare Hardware**

Только сумму нужную для 7 дней distribution держать на multisig (~5-10 SOL).
Остальное в холодном хранении.

---

## 💸 Где конкретно SOL "оседают"

### Игрок платит 0.01 SOL за wheel spin:

1. **Phantom/Backpack** подписывает transaction:
   ```
   From: <player_wallet>
   To:   <TREASURY_WALLET>
   Amount: 10_000_000 lamports (0.01 SOL)
   ```

2. **Solana network** валидирует и подтверждает (~400ms)

3. **App** получает `tx_signature` и пишет в Supabase:
   ```sql
   INSERT INTO wheel_sol_payments (
     device_id, tx_signature, amount_sol, purpose, created_at
   ) VALUES (...);
   ```

4. **Treasury wallet** теперь содержит на 0.01 SOL больше.

### Откуда брать SOL с treasury:

#### Если **multisig:**
- Заходишь на app.squads.so
- "Propose Transaction" → "Transfer SOL" → from treasury to your personal wallet
- Нужно 3 подписи (3 из 5 signers)
- После подтверждения SOL уходит на твой адрес

#### Если **single keypair (не рекомендовано):**
- Импортируй приватный ключ в Phantom
- Просто отправь SOL на свой основной кошелёк
- ⚠️ Хотите потерять access ко всему treasury? Не теряйте этот keypair

---

## 📊 Куда расходуется treasury (по TOKENOMICS v0.2)

Каждый месяц по distribution:

| % | Куда | Сумма (при 10 SOL/мес) |
|---|------|------------------------|
| **60%** | Призовой фонд top-100 игроков | 6 SOL |
| **20%** | SKORA airdrop pool + monthly buyback & burn | 2 SOL |
| **20%** | Project treasury — **твоя прибыль** | 2 SOL |

**Из 20% project treasury** примерные траты:
- Helius RPC: $99 = 0.3 SOL
- Supabase Pro: $25 = 0.07 SOL
- Marketing (ads, KOLs): 0.5 SOL
- Dev/freelance: 0.5 SOL
- **Чистая прибыль:** 0.6 SOL/мес → масштабируется с DAU

При **1000 DAU + 5 paid spins/день**:
- Treasury inflow: 50 SOL/день = 1500 SOL/месяц
- **Твоя 20% доля:** 300 SOL/месяц ≈ **$52K при SOL=$175**

---

## ⚠️ Налоги и legal

### Где платить налоги?
Зависит от юрисдикции владельца проекта:
- **Россия:** 13% НДФЛ или ИП 6%
- **США:** 15-37% federal capital gains
- **Европа:** varies, 0-40%
- **UAE:** 0% (рекомендовано для крипто-бизнесов)

### Legal entity
Желательно открыть юридическое лицо:
- **Cayman Islands** — стандарт для Web3 protocols
- **UAE (Dubai DMCC)** — favorable crypto regulation
- **British Virgin Islands** — анонимность

Это снимает personal liability и упрощает налогообложение.

### KYC требования
Если оборот **>$10K/мес** — некоторые юрисдикции требуют KYC регистрации.
Solana dApp Store сам **не требует KYC**, но банки/exchanges могут.

---

## 🛡 Опасности

### 1. Потеря treasury keypair
**Митigation:**
- Multisig (3-of-5)
- 3 backup копии seed phrase
- Один backup — в банковской ячейке

### 2. Hack через скомпрометированный signer
**Митigation:**
- Каждый signer на отдельном устройстве
- Hardware wallets для крупных операций
- Daily limit делегированной authority

### 3. Rug pull suspicion
Игроки могут не доверять централизованному treasury.
**Митigation:**
- Опубликовать multisig адрес публично
- Publicly-tracked signers (community-elected)
- Real-time transparency dashboard на сайте

### 4. Network congestion / failed transactions
**Митigation:**
- Helius staked RPC (приоритетная обработка)
- Priority fees при mass distribution
- Retry logic в distribution script

---

## ✅ Pre-mainnet checklist

```
[ ] Squads Protocol multisig 3-of-5 создан
[ ] 5 signers скоординированы (gnosis-like signatures workflow)
[ ] Mainnet treasury получил тестовые ~0.1 SOL (network access verified)
[ ] Mainnet SKORA token mint создан
[ ] Mint authority передан на отдельный multisig
[ ] Helius RPC подключен с API key
[ ] lib/solanaMobile.ts константы обновлены
[ ] lib/skora.ts константы обновлены
[ ] lib/genesis.ts GENESIS_PHASE = false (или true для следующего сезона)
[ ] android/app/build.gradle versionCode++ и versionName updated
[ ] Distribution script протестирован на devnet с фейковыми данными
[ ] Cold wallet (Ledger) куплен и настроен
[ ] Backup seed phrase в банковской ячейке
[ ] Tax structure decided (юр. лицо?)
[ ] Privacy Policy обновлён под mainnet
```

---

## 🔗 Полезные ссылки

- [Squads Protocol](https://squads.so/) — multisig
- [Helius](https://helius.dev/) — RPC + indexing
- [Solana Mobile dApp Store](https://github.com/solana-mobile/dapp-store)
- [SPL Token CLI docs](https://spl.solana.com/token)
- [Ledger Solana setup](https://www.ledger.com/coin/wallet/solana)

---

_Document version 1.0 · Last update: 2026-05-29_
