# 🔒 Security Audit & Hardening Checklist

> **Цель:** перед публикацией убедиться что приложение, бэкенд и кошельки защищены.
> Версия: 1.0 · Дата: 2026-05-29

---

## 🎯 Threat model (от чего защищаемся)

| Атакующий | Цель | Главные риски |
|-----------|------|---------------|
| **Игрок-чит** | Накачать ORB / SKORA бесплатно | Manipulation of client state, fake Supabase writes |
| **Внешний хакер** | Украсть treasury SOL | Compromised keystore / publisher.json / treasury keypair |
| **Реверс-инженер** | Получить SKORA mint authority | Hardcoded secrets in APK |
| **DoS** | Положить сервис | Spam paid spins, P2P transfer floods |
| **Phishing** | Заменить APK на дDApp Store | Поддельный publisher account |

---

## ✅ Уже сделано (текущее состояние)

| Слой | Защита | Где |
|------|--------|-----|
| Кошельки игроков | **Mobile Wallet Adapter** — приватный ключ никогда не покидает кошелёк | `lib/solanaMobile.ts` |
| База данных | **Row Level Security (RLS)** на всех таблицах | `supabase-*.sql` |
| P2P переводы | **Атомарная RPC `transfer_orb`** с проверкой баланса, дневного лимита, кулдауна | `supabase-p2p-orb.sql` |
| Прямые INSERT | **Запрещены** на критичных таблицах (orb_transfers, treasury_balance) | RLS policy `no direct inserts` |
| HTTPS | Все API вызовы только через TLS | Supabase + Helius RPC |
| Секреты в git | **Очищены из истории** (filter-branch + force push) | `.gitignore` + git history clean |
| Repo | **Приватный** GitHub | `github.com/maxzer210/seeker-quest-league` |
| APK signing keystore | **Не в git** (только локально) | `.gitignore` |
| credentials.json | **Не в git** | `.gitignore` |
| Mint authority keypair | **Не в git** | `skora-config.json` gitignored |

---

## 🔴 CRITICAL: что обязательно сделать перед mainnet

### 1. Treasury keypair NOT in `skora-config.json` на mainnet
**Проблема:** сейчас на devnet treasury wallet = SKORA mint authority (один keypair).
**Риск:** если потеряешь keypair → потеряешь и treasury, и контроль над SKORA.

**Решение:**
- На mainnet создать **отдельный** treasury keypair
- Идеально: использовать **Squads Protocol 3-of-5 multisig** для treasury
- Mint authority передать **другому multisig** (тоже multisig, не один ключ)
- См. `TREASURY-SETUP.md` подробно

### 2. Anti-sybil verification
Сейчас в приложении есть SGT (Seeker Genesis Token) проверка, но нужно:
- Backend Edge Function которая проверяет SGT владельца по wallet address
- Без SGT — игрок может играть, но **не получает SOL призов** и не претендует на Founder NFT
- Проверка в `process-genesis-prizes.js` перед distribution

### 3. Rate limiting на критичных endpoints
**Что под угрозой:**
- `wheel_sol_payments` — спам paid spins для накачки призов
- `skora_claims` — спам claim'ов
- `transfer_orb` RPC — уже есть кулдаун (60s)

**Что добавить:**
```sql
-- Edge Function rate limit: max 10 paid spins / minute per device
CREATE OR REPLACE FUNCTION check_spin_rate_limit(p_device_id text)
RETURNS boolean
LANGUAGE plpgsql
AS $$
BEGIN
  RETURN (
    SELECT count(*) FROM wheel_sol_payments
    WHERE device_id = p_device_id
      AND created_at > now() - interval '1 minute'
  ) < 10;
END $$;
```

### 4. Anti-cheat на scores
**Текущий риск:** клиент пишет `tournament_score` напрямую в Supabase.
**Атака:** игрок интерсептит запросы и пишет 9999999 очков.

**Решение:**
- Каждый increment score должен идти через **server-side RPC**, не прямой UPDATE
- RPC проверяет:
  - Не слишком ли быстро? (макс ~50 очков/сек)
  - Совпадает ли с balance change на той же сессии?
  - Sign request с device_id token (rotating JWT)

**SQL:**
```sql
CREATE OR REPLACE FUNCTION add_tournament_score(
  p_device_id text, p_points int
) RETURNS jsonb
LANGUAGE plpgsql
AS $$
BEGIN
  -- Anti-cheat: max 500 points per call
  IF p_points > 500 OR p_points < 0 THEN
    RAISE EXCEPTION 'Invalid score increment';
  END IF;
  -- Anti-cheat: cooldown
  IF EXISTS (SELECT 1 FROM tournament_scores
             WHERE device_id = p_device_id
               AND updated_at > now() - interval '1 second') THEN
    RAISE EXCEPTION 'Score rate limit';
  END IF;
  INSERT INTO tournament_scores (device_id, score, updated_at)
  VALUES (p_device_id, p_points, now())
  ON CONFLICT (device_id) DO UPDATE
    SET score = tournament_scores.score + p_points,
        updated_at = now();
  RETURN jsonb_build_object('ok', true);
END $$;
```

### 5. APK obfuscation + proguard
Сейчас APK содержит читаемый JS bundle через Hermes.
**Что добавить в `android/app/build.gradle`:**
```gradle
android {
  buildTypes {
    release {
      minifyEnabled true
      shrinkResources true
      proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
    }
  }
}
```

### 6. Certificate pinning
Добавить HTTPS certificate pinning для:
- `qxejdpvjggqjqoydujjd.supabase.co`
- Helius RPC endpoint

Защита от MITM атак.

### 7. Founder Pass validation на backend
Сейчас при покупке tier:
1. Клиент платит SOL через MWA
2. Клиент сохраняет tier локально в AsyncStorage
3. Клиент пишет в `founder_passes` таблицу

**Атака:** игрок мог бы прямым SQL update подделать tier без оплаты.

**Защита (нужно добавить):**
```sql
-- Validate tx_signature against wheel_sol_payments before tier upgrade
CREATE OR REPLACE FUNCTION upgrade_founder_tier(
  p_device_id text, p_new_tier text, p_tx_signature text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
DECLARE
  v_required_sol numeric;
  v_paid_sol numeric;
BEGIN
  v_required_sol := CASE p_new_tier
    WHEN 'silver'  THEN 0.5
    WHEN 'gold'    THEN 1.0
    WHEN 'diamond' THEN 2.0
    ELSE NULL
  END;
  IF v_required_sol IS NULL THEN RAISE EXCEPTION 'Invalid tier'; END IF;

  -- Check that this tx exists and was for the right amount
  SELECT amount_sol INTO v_paid_sol FROM wheel_sol_payments
  WHERE tx_signature = p_tx_signature
    AND device_id = p_device_id
    AND purpose = CONCAT('founder_', p_new_tier);

  IF v_paid_sol IS NULL OR v_paid_sol < v_required_sol THEN
    RAISE EXCEPTION 'Payment not verified';
  END IF;

  INSERT INTO founder_passes (device_id, tier, tx_signature)
  VALUES (p_device_id, p_new_tier, p_tx_signature)
  ON CONFLICT (device_id) DO UPDATE
    SET tier = p_new_tier, tx_signature = p_tx_signature;

  RETURN jsonb_build_object('ok', true, 'tier', p_new_tier);
END $$;
```

---

## 🟡 IMPORTANT (рекомендовано до публикации)

### 8. Backup стратегия
- **Keystore** (`seeker-release.keystore`): 3 копии в разных местах (USB, encrypted cloud, бумажный seed of MD5 hash)
- **Publisher.json**: тоже 3 копии
- **Treasury seed phrase**: hardware wallet + бумажный backup в сейф

### 9. Monitoring & alerts
Завести:
- Discord/Telegram webhook от Supabase: уведомление при крупных переводах (>10K ORB transfer, >0.5 SOL spin)
- Dashboard для админа: daily SOL inflow, top spenders, suspicious activity

### 10. Bug bounty program
После публикации:
- Опубликовать на immunefi.com или HackenProof
- Базовая выплата $500-$5000 за critical findings
- Привлечёт white-hats до атаки blackhats

### 11. Privacy disclosure
Уже есть `privacy.html`, но:
- Опубликовать на seekerquest-league.com/privacy
- Указать **юрисдикцию** (страна оператора)
- Указать **DPO** контакт для GDPR (Европа)

### 12. Terms of Service
Сейчас НЕТ ToS. Минимум:
- "We don't guarantee SOL/SKORA value"
- "Treasury operates as advertised, but losses possible due to bugs"
- "Bans for cheating / multi-accounting"
- "Right to disable accounts violating fair play"

---

## 🟢 NICE-TO-HAVE

### 13. Open-source the contracts
Опубликовать read-only исходники treasury distribution scripts:
- Доказывает что нет hidden minting
- Привлекает доверие сообщества

### 14. Public transparency page
seekerquest-league.com/transparency:
- Live SOL balance treasury
- Live SKORA supply / burned
- History of all distributions
- Список Founder Pass holders (без device IDs)

### 15. Audit by third party
Профессиональный аудит:
- Trail of Bits ($30-60K)
- OpenZeppelin Defender ($20-40K)
- Hacken ($10-20K)

Если budget позволяет — после Pre-Season ROI.

---

## 🚨 Emergency response plan

Если обнаружена уязвимость:

1. **Pause treasury withdrawals** — заморозить multisig signers
2. **Disable RPC writes** — Supabase admin panel → disable `transfer_orb`
3. **Force APK update** — push new release с фиксом
4. **Notify users** — Discord/Telegram + в-app banner
5. **Post-mortem** — публичный отчёт в течение 7 дней

**Контакты для emergency:**
- support@seekerquest-league.com (24/7)
- @seekerquest (Telegram) — будущее
- Discord moderators — будущее

---

## 📋 Pre-publish checklist

Каждый пункт перед сабмитом в dApp Store:

```
[ ] APK signed release keystore (не debug!)
[ ] proguard minification включён
[ ] Все SOL/SKORA константы → mainnet адреса
[ ] GENESIS_PHASE = true для Pre-Season ИЛИ false для Season 1
[ ] Treasury wallet — multisig (рекомендовано)
[ ] Mint authority передан multisig
[ ] Все credentials.json / keystore — 3 backup копии
[ ] Anti-cheat RPC включены (add_tournament_score)
[ ] Rate limiting активен (check_spin_rate_limit)
[ ] Founder Pass server-side validation (upgrade_founder_tier)
[ ] Privacy Policy задеплоен на /privacy
[ ] Terms of Service написан
[ ] Email support@seekerquest-league.com работает (тест!)
[ ] Monitoring webhook настроен
[ ] Backup wallet seed phrase в сейфе
[ ] Cold wallet для daily distributions
```

---

## 🔐 Резюме рисков

| Уровень | Риск | Митigation |
|---------|------|-----------|
| 🔴 **High** | Compromised mint authority keypair | Multisig 3-of-5 на mainnet |
| 🔴 **High** | Score cheating через прямой Supabase write | `add_tournament_score` RPC + RLS lockdown |
| 🟡 **Medium** | Fake Founder Pass через локальный upgrade | `upgrade_founder_tier` RPC validation |
| 🟡 **Medium** | Spam paid spins для накачки призов | Rate limit RPC |
| 🟢 **Low** | APK reverse engineering | Proguard + Hermes obfuscation |
| 🟢 **Low** | MITM атака | Certificate pinning |

---

_Document version 1.0 · Last update: 2026-05-29 · Reviewed by: AI initial draft, awaiting human review._
