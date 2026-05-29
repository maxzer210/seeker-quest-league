# 🚀 Launch Playbook — Промт для AI

> **AI читающему этот файл:** ты ассистируешь публикации Seeker Quest League в Solana Mobile dApp Store.
> Прочитай этот файл целиком + `SECURITY-AUDIT.md` + `TREASURY-SETUP.md`, потом действуй по этапам.

---

## 🎯 Главная цель

Опубликовать приложение в Solana dApp Store **безопасно** так чтобы:
1. Реальные SOL шли на multisig контролируемый владельцем
2. Не было дыр для накачки ORB / SKORA через cheating
3. Игроки могли реально выигрывать SOL призы
4. Владелец имел чёткий поток дохода

**Рабочая папка:** `C:\sk\`
**Владелец проекта email:** hello@seekerquest-league.com
**Доменные emails:** hello@, support@, ads@ — все на `seekerquest-league.com`

---

## 📋 Обязательное чтение перед началом

| Файл | Что узнаешь |
|------|-------------|
| `HANDOFF.md` | Текущий статус разработки |
| `SECURITY-AUDIT.md` | Что нужно защитить + checklist уязвимостей |
| `TREASURY-SETUP.md` | Как настроить mainnet treasury + multisig |
| `TOKENOMICS.md` | Экономика проекта v0.2 |
| `dapp-store/SUBMISSION-GUIDE.md` | CLI workflow для dApp Store |
| `dapp-store/config.yaml` | Метадата приложения |
| `lib/solanaMobile.ts` | Все SOL цены и treasury address |
| `lib/genesis.ts` | Pre-Season config |
| `TODO.md` | Незакрытые задачи разработки |
| `CLAUDE.md` | Контекст агента + стиль общения |

---

## 🛡 PHASE 1 — Security hardening (1-2 дня)

Запрос пользователя:
> "Сделай security audit и hardening перед публикацией"

### 1.1 Backend RPC hardening

Создать в Supabase Dashboard следующие RPC (SQL Editor → new query):

#### `add_tournament_score` — anti-cheat для очков
```sql
CREATE OR REPLACE FUNCTION add_tournament_score(
  p_device_id text, p_points int
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER
AS $$
BEGIN
  IF p_points <= 0 OR p_points > 500 THEN
    RAISE EXCEPTION 'Invalid score increment: %', p_points;
  END IF;
  -- Rate limit: max 1 score update per second per device
  IF EXISTS (SELECT 1 FROM tournament_scores
             WHERE device_id = p_device_id
               AND updated_at > now() - interval '1 second') THEN
    RAISE EXCEPTION 'Score rate limit exceeded';
  END IF;
  INSERT INTO tournament_scores (device_id, score, updated_at)
  VALUES (p_device_id, p_points, now())
  ON CONFLICT (device_id) DO UPDATE
    SET score = tournament_scores.score + p_points,
        updated_at = now();
  RETURN jsonb_build_object('ok', true);
END $$;

GRANT EXECUTE ON FUNCTION add_tournament_score(text, int) TO authenticated, anon;
```

#### `upgrade_founder_tier` — validation Founder Pass через tx_signature
```sql
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

  SELECT amount_sol INTO v_paid_sol FROM wheel_sol_payments
  WHERE tx_signature = p_tx_signature
    AND device_id = p_device_id
    AND purpose = CONCAT('founder_', p_new_tier);

  IF v_paid_sol IS NULL OR v_paid_sol < v_required_sol THEN
    RAISE EXCEPTION 'Payment not verified for tier %', p_new_tier;
  END IF;

  INSERT INTO founder_passes (device_id, tier, tx_signature)
  VALUES (p_device_id, p_new_tier, p_tx_signature)
  ON CONFLICT (device_id) DO UPDATE
    SET tier = p_new_tier, tx_signature = p_tx_signature;

  RETURN jsonb_build_object('ok', true, 'tier', p_new_tier);
END $$;

GRANT EXECUTE ON FUNCTION upgrade_founder_tier(text, text, text) TO authenticated, anon;
```

#### `check_spin_rate_limit` — rate limiter на paid spins
```sql
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

GRANT EXECUTE ON FUNCTION check_spin_rate_limit(text) TO authenticated, anon;
```

### 1.2 Lock RLS на таблицах

```sql
-- Прямые писания заблокировать на tournament_scores
ALTER TABLE tournament_scores ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "anon can write" ON tournament_scores;
CREATE POLICY "no direct writes" ON tournament_scores
  FOR INSERT WITH CHECK (false);
CREATE POLICY "no direct updates" ON tournament_scores
  FOR UPDATE USING (false);
CREATE POLICY "read all scores" ON tournament_scores
  FOR SELECT USING (true);

-- Аналогично для founder_passes
DROP POLICY IF EXISTS "anon can write" ON founder_passes;
CREATE POLICY "no direct founder writes" ON founder_passes
  FOR INSERT WITH CHECK (false);
```

### 1.3 Обновить клиентский код

В `App.tsx`:
- `addTournamentScore(n)` — заменить `supabase.from('tournament_scores').upsert(...)` на `supabase.rpc('add_tournament_score', { p_device_id: ..., p_points: n })`
- Founder Pass purchase — добавить `supabase.rpc('upgrade_founder_tier', { p_device_id, p_new_tier, p_tx_signature })` с проверкой tx_signature
- Paid Wheel spin — перед оплатой звать `check_spin_rate_limit`

### 1.4 APK obfuscation

В `android/app/build.gradle`:
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

Создать `android/app/proguard-rules.pro`:
```
-keep class com.facebook.react.** { *; }
-keep class com.solanamobile.** { *; }
-keep class expo.modules.** { *; }
-keepclassmembers class com.solanamobile.** { public *; }
-dontwarn java.lang.invoke.StringConcatFactory
```

### 1.5 Завершить Phase 1

После всех изменений:
```bash
# Type check
cd C:\sk
& "C:\sk\node_modules\.bin\tsc.cmd" -p tsconfig.json --noEmit --skipLibCheck

# Build release APK
cd android
.\gradlew.bat assembleRelease --no-daemon

# Commit
cd ..
git add .
git commit -m "feat(security): backend RPC validation + proguard obfuscation + rate limits"
git push origin master
```

---

## 💰 PHASE 2 — Mainnet Treasury Setup (1 день)

Запрос пользователя:
> "Подготовь mainnet — создай multisig, обнови константы, перейди на mainnet"

### 2.1 Multisig через Squads Protocol

**Action для пользователя (вне кода):**
1. Открыть https://app.squads.so/
2. Создать Multisig 3-of-5 c 5 signers
3. Скопировать multisig address

**Дай ему инструкции:**
```
1. Купи Phantom wallet и подключи 0.05 SOL для gas
2. Зайди https://app.squads.so/ → Connect Wallet
3. + New Multisig → Threshold 3 of 5
4. Добавь 5 signers (5 разных wallet addresses):
   - твой основной wallet
   - твой backup wallet (hardware)
   - trust co-founder
   - community trustee
   - emergency vault (запечатанный seed phrase)
5. Multisig address → скопируй и пришли мне
```

### 2.2 Mainnet SKORA Token

После получения multisig address:
```bash
cd C:\sk
node scripts/create-skora-token.js --network mainnet-beta --supply 1000000000 --authority <MULTISIG_ADDRESS>
```

Дождаться output:
```
✅ SKORA Mint: <MAINNET_MINT>
✅ Treasury ATA: <ATA>
```

### 2.3 Обновить константы

**`lib/solanaMobile.ts`:**
```typescript
export const SOLANA_NETWORK = 'mainnet-beta';
export const SOLANA_CHAIN = 'solana:mainnet';
export const SOLANA_RPC = 'https://mainnet.helius-rpc.com/?api-key=<HELIUS_KEY>';
export const TREASURY_WALLET: string = '<MULTISIG_ADDRESS>';
```

**`lib/skora.ts`:**
```typescript
export const SKORA_MINT    = '<MAINNET_MINT>';
export const SKORA_NETWORK = 'mainnet-beta';
export const SKORA_RPC     = 'https://mainnet.helius-rpc.com/?api-key=<HELIUS_KEY>';
```

**`lib/genesis.ts`** — оставить `GENESIS_PHASE = true` если стартуем Pre-Season на mainnet, или `false` если сразу Season 1.

**`lib/version.ts`:**
```typescript
export const APP_VERSION = '1.0.0';  // major bump
export const BUILD_CODE = 10;
```

**`android/app/build.gradle`:**
```gradle
versionCode 10
versionName "1.0.0"
```

### 2.4 Commit

```bash
git add .
git commit -m "feat(mainnet): migrate to mainnet treasury + SKORA mint + multisig (v1.0.0)"
git push origin master
```

---

## 📸 PHASE 3 — Подготовка ассетов для dApp Store (1-2 дня)

Запрос пользователя:
> "Подготовь ассеты для dApp Store — иконки и скриншоты"

### 3.1 Ассеты (нужны от пользователя)

**Иконки** (через Gemini Imagen с промтами из `WEBSITE-BRIEF.md` секция "Промт для иконки"):
```
[ ] icon.png      — 512×512   (главная иконка)
[ ] banner.png    — 1200×600  (баннер)
[ ] feature.png   — 1024×500  (feature graphic для dApp Store)
```

Положи в `C:\sk\dapp-store\media\`

**Скриншоты** (с реального устройства, после установки APK v5+):
```
[ ] screenshot-1.png — Главный экран Hero Card + TAP    1080×1920
[ ] screenshot-2.png — Genesis Pre-Season + countdown   1080×1920
[ ] screenshot-3.png — Fortune Wheel spinning           1080×1920
[ ] screenshot-4.png — Space Runner gameplay            1080×1920
[ ] screenshot-5.png — PvP tap battle                   1080×1920
[ ] screenshot-6.png — Tournament podium                1080×1920
[ ] screenshot-7.png — Shop с Founder Pass tiers        1080×1920
[ ] screenshot-8.png — SKORA Wallet                     1080×1920
```

Положи в `C:\sk\dapp-store\media\`

### 3.2 Verify config.yaml

```bash
cd C:\sk
cat dapp-store/config.yaml
```

Проверить что:
- `name`: правильный
- `email`: hello@seekerquest-league.com
- `urls.privacy`: https://seekerquest-league.com/privacy
- Все скриншоты прописаны в `media:` секции
- `version`: совпадает с APK

### 3.3 Privacy Policy deployment

Если ещё не задеплоен на сайт:
```
1. Скопируй website/privacy.html (или dapp-store/privacy.html) в репо сайта
2. URL должен быть доступен по https://seekerquest-league.com/privacy
3. Проверь curl -I https://seekerquest-league.com/privacy → 200 OK
```

---

## 📤 PHASE 4 — Submit в dApp Store (1 день)

Запрос пользователя:
> "Запусти dApp Store CLI submission процесс"

### 4.1 Установить CLI

```bash
cd C:\sk
npm install --save-dev @solana-mobile/dapp-store-cli
```

### 4.2 Создать publisher keypair (ОДИН РАЗ)

```bash
solana-keygen new --outfile dapp-store\publisher.json
# ⚠️ КРИТИЧНО: запиши seed phrase. Это identity твоего издателя.
```

Получить адрес и сказать пользователю:
```bash
solana-keygen pubkey dapp-store\publisher.json
```

→ **Действие пользователя:** перевести **~0.5 SOL mainnet** на этот адрес для gas.

### 4.3 Создать publisher на-chain

```bash
npx dapp-store create publisher dapp-store/config.yaml -k dapp-store/publisher.json
```

→ Получишь **publisher address** → запиши в config.yaml:
```yaml
publisher:
  address: <publisher_address>
```

### 4.4 Создать app на-chain

```bash
npx dapp-store create app dapp-store/config.yaml -k dapp-store/publisher.json
```

→ Запиши **app address** в config.yaml.

### 4.5 Подготовить APK

```bash
# Если ещё не собран — собрать
cd C:\sk\android
.\gradlew.bat assembleRelease --no-daemon

# Скопировать в media folder
Copy-Item C:\sk\android\app\build\outputs\apk\release\app-release.apk `
  C:\sk\dapp-store\media\app-release.apk
```

### 4.6 Создать release

```bash
cd C:\sk
npx dapp-store create release dapp-store/config.yaml `
  -k dapp-store/publisher.json `
  -b "C:\Users\User\AppData\Local\Android\Sdk\build-tools\35.0.0"
```

→ Запиши **release address** в config.yaml.

### 4.7 Финальный submit

```bash
npx dapp-store publish submit dapp-store/config.yaml `
  -k dapp-store/publisher.json `
  --requestor-is-authorized `
  --complies-with-solana-dapp-store-policies
```

→ Submission на ревью. Ожидание **3-7 дней**.

### 4.8 Backup всего

⚠️ КРИТИЧНО:
```
[ ] publisher.json — 3 копии (USB, encrypted cloud, бумажный seed)
[ ] seeker-release.keystore — 3 копии
[ ] skora-config.json — 3 копии
[ ] Treasury multisig recovery info — банковская ячейка
```

---

## 📊 PHASE 5 — После публикации (постоянная работа)

### 5.1 Monitoring

Запрос пользователя:
> "Настрой мониторинг приложения"

**Что подключить:**

1. **Discord webhook** для Supabase events:
```sql
-- Webhook на крупные транзакции
CREATE OR REPLACE FUNCTION notify_large_payment()
RETURNS TRIGGER AS $$
BEGIN
  IF NEW.amount_sol >= 0.5 THEN
    PERFORM net.http_post(
      url := '<discord_webhook_url>',
      body := jsonb_build_object(
        'content', '💰 New payment: ' || NEW.amount_sol || ' SOL (' || NEW.purpose || ')'
      )
    );
  END IF;
  RETURN NEW;
END $$ LANGUAGE plpgsql;

CREATE TRIGGER trg_large_payment AFTER INSERT ON wheel_sol_payments
  FOR EACH ROW EXECUTE FUNCTION notify_large_payment();
```

2. **Public transparency dashboard** на сайте:
- Live treasury balance
- Total burned SKORA
- Last 10 transactions
- Top-100 leaderboard live

### 5.2 Обновления приложения

При каждой новой версии (см. README.md "Scenario A" — Hotfix update):

```bash
# Bump version
# lib/version.ts: BUILD_CODE += 1, APP_VERSION new
# android/app/build.gradle: versionCode += 1

# Build
cd C:\sk\android && .\gradlew.bat assembleRelease --no-daemon

# Copy APK
Copy-Item C:\sk\android\app\build\outputs\apk\release\app-release.apk `
  C:\sk\dapp-store\media\app-release.apk -Force

# Create new release on-chain
npx dapp-store create release dapp-store/config.yaml `
  -k dapp-store/publisher.json `
  -b "C:\Users\User\AppData\Local\Android\Sdk\build-tools\35.0.0"

# Submit
npx dapp-store publish submit dapp-store/config.yaml `
  -k dapp-store/publisher.json `
  --requestor-is-authorized `
  --complies-with-solana-dapp-store-policies
```

Review обновлений: 1-3 дня.

### 5.3 Monthly distribution

1-го числа каждого месяца запускать:
```bash
cd C:\sk
node scripts/distribute-genesis-prizes.js --month <YYYY-MM>
```

Multisig signers подтверждают tx (через Squads).

### 5.4 Burn weekly

Каждое воскресенье:
```bash
node scripts/weekly-burn.js
```

10% от treasury → SKORA buyback → send to burn address.

---

## 🚨 Emergency procedures

### Если обнаружен exploit

1. **Заморозить multisig** — все signers подтверждают "pause transactions"
2. **Disable RPC в Supabase** — Dashboard → Functions → Disable `transfer_orb`, `upgrade_founder_tier`
3. **Push hotfix** — увеличить versionCode, фикс, билд, submit как emergency review
4. **Notify users** — Discord/Telegram + в-app banner через feature_flags
5. **Post-mortem** — публичный отчёт в течение 7 дней

### Если потерян publisher.json

⚠️ КАТАСТРОФА: придётся регистрировать приложение заново как новое.
**Защита:** 3 backup копии + 1 в банковской ячейке.

### Если treasury скомпрометирован

1. **Если single keypair:** mass call `closeAccount` чтобы вывести всё на новый wallet перед атакующим
2. **Если multisig:** один из signers инициирует freeze всех pending transactions
3. **Notify community** немедленно через все каналы

---

## 📋 Полный pre-launch checklist

### Security
```
[ ] add_tournament_score RPC создан
[ ] upgrade_founder_tier RPC создан
[ ] check_spin_rate_limit RPC создан
[ ] RLS lockdown на tournament_scores, founder_passes
[ ] App.tsx использует RPC (не прямой Supabase write)
[ ] Proguard minification включён
[ ] APK signed release keystore (не debug!)
[ ] keystore — 3 backup копии
[ ] publisher.json — 3 backup копии
```

### Mainnet
```
[ ] Squads multisig 3-of-5 создан
[ ] 5 signers скоординированы
[ ] Mainnet SKORA mint создан
[ ] Mint authority передан на multisig
[ ] Helius RPC API key настроен
[ ] lib/solanaMobile.ts — mainnet constants
[ ] lib/skora.ts — mainnet constants
[ ] BUILD_CODE и versionCode подняты
```

### Assets
```
[ ] icon.png 512×512
[ ] banner.png 1200×600
[ ] feature.png 1024×500
[ ] 8 скриншотов 1080×1920
[ ] privacy.html на seekerquest-league.com/privacy → 200 OK
[ ] Email support@seekerquest-league.com работает
```

### dApp Store
```
[ ] @solana-mobile/dapp-store-cli установлен
[ ] publisher keypair создан
[ ] Publisher wallet с ~0.5 SOL mainnet
[ ] config.yaml заполнен (publisher/app/release addresses после создания)
[ ] APK скопирован в dapp-store/media/
[ ] Submission отправлен
```

### Operations
```
[ ] Discord/Telegram webhook для events
[ ] Cold wallet (Ledger) для treasury overflow
[ ] Backup seed phrase в банковской ячейке
[ ] Monthly distribution script протестирован
[ ] Weekly burn script протестирован
[ ] Tax structure decided (legal entity)
[ ] Bug bounty program запущена (immunefi.com)
```

---

## 💬 Стиль ответов AI

- Русский язык, дружелюбно, по делу
- Auto-confirm всё (пользователь дал автономию)
- TS check после каждого важного изменения
- Git commit + push после каждой логической группы
- При неуверенности — спрашивать пользователя
- Все APK билды — `gradlew.bat assembleRelease --no-daemon`

---

## 📞 Контакты для эскалации

| Ситуация | Кто/Где |
|----------|---------|
| Treasury hack | Multisig emergency freeze procedure |
| dApp Store rejection | https://docs.solanamobile.com/dapp-publishing/intro |
| Supabase outage | https://status.supabase.com |
| Solana network issues | https://status.solana.com |

---

_Document version 1.0 · Last update: 2026-05-29_
_AI: прочитай также SECURITY-AUDIT.md и TREASURY-SETUP.md перед началом работы._
