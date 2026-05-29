# 📋 Seeker Quest League — TODO Backlog

> Сохранённые задачи. Обновляется по мере прогресса.
> Last update: 2026-05-29

---

## 🔴 КОД — высокий приоритет

### A) Send ORB — History секция в модале (30 мин)
Показать последние 5 переводов под формой отправки:
- Запрос `SELECT * FROM orb_transfers WHERE sender_id = X OR recipient_id = X ORDER BY created_at DESC LIMIT 5`
- Каждая строка: иконка (📤/📥), сумма, получатель/отправитель, время
- Цвет: красный для отправленных, зелёный для полученных

### B) Daily free spins для Founder tier (1 час)
- State `freeSpinsRemaining: number` + reset в полночь
- Free Founder: 0, Silver: 3, Gold: 5, Diamond: 10 / день
- Применить в Fortune Wheel (бесплатные spins не списывают SOL)
- AsyncStorage save с timestamp + сброс на новый день

### C) Custom username color для Diamond (30 мин)
- Поле `usernameColor` в state и AsyncStorage
- ColorPicker модал (8-12 пресетов: gold, neon, rainbow gradient)
- Доступно только если `founderTier === 'diamond'`
- Применить в Tournament и Profile (тоже у себя в Hero Card)

### D) Diamond 1% prize pool интеграция (1 час)
- Backend cron: при дневном distribution → 1% pool делится между Diamond игроками
- Supabase: добавить колонку `is_diamond_recipient` в `tournaments` distribution

---

## 🟡 КОД — средний приоритет

### E) Monthly buyback cron script (1 час)
- `scripts/monthly-burn.js` — Node.js скрипт
- 1-го числа: читает treasury SOL balance → 10% → DEX swap SOL→SKORA → send to burn address
- Логирует в `orb_burned` (source = 'monthly_buyback')
- Запускать через cron на сервере или GitHub Actions

### F) i18n для всех новых фич (1 час)
Добавить ключи для:
- `founder.silver`, `founder.gold`, `founder.diamond` (×3/×4/×5 + perks)
- `founder.maxed`, `founder.owned`
- `p2p.sendOrb`, `p2p.recipient`, `p2p.amount`, `p2p.preview`, `p2p.burned`, `p2p.treasury`
- `p2p.sending`, `p2p.complete`, `p2p.failed`
- `p2p.minError`, `p2p.maxError`, `p2p.cooldownError`, `p2p.selfError`

### G) Transfer history full view (30 мин)
- Отдельный экран `screen === 'history'` или модал
- Все переводы с пагинацией
- Кнопка из Send ORB модала "View all history →"

---

## 🟢 КОД — низкий приоритет

### H) UX аудит других игр (2-3 часа)
- HorseRace UI improvements
- TreasureHunt UI improvements
- SeekerLands UI improvements
- Tournament leaderboard polish
- PvP Arena polish

### I) Animations/celebrations
- Confetti при покупке Founder Pass
- Burn animation при P2P transfer (fire particles)
- Diamond glow effect на Hero Card

---

## 🔴 USER ACTIONS — без кода

### Перед публикацией в dApp Store:

| # | Задача | Время | Статус |
|---|--------|-------|--------|
| 1 | Домен `seekerquest-league.com` | 5 мин | ⏳ |
| 2 | Privacy.html на GitHub Pages | 10 мин | ⏳ |
| 3 | 8 скриншотов 1080×1920 (из APK v2) | 30 мин | ⏳ |
| 4 | Иконка 512×512 | 1 ч | ⏳ |
| 5 | Banner 1024×500 / 1200×600 | 1 ч | ⏳ |
| 6 | Сайт через Gemini (по WEBSITE-BRIEF.md) | 1-2 ч | ⏳ |
| 7 | Pополнить publisher wallet ~0.5 SOL mainnet | 5 мин | ⏳ |
| 8 | Сгенерировать publisher keypair (один раз) | 5 мин | ⏳ |

### dApp Store CLI submission:

```powershell
cd C:\sk
npm install --save-dev @solana-mobile/dapp-store-cli
solana-keygen new --outfile dapp-store\publisher.json
npx dapp-store create publisher dapp-store/config.yaml -k dapp-store/publisher.json
npx dapp-store create app dapp-store/config.yaml -k dapp-store/publisher.json
Copy-Item C:\sk\android\app\build\outputs\apk\release\app-release.apk C:\sk\dapp-store\media\app-release.apk
npx dapp-store create release dapp-store/config.yaml -k dapp-store/publisher.json -b "C:\Users\User\AppData\Local\Android\Sdk\build-tools\35.0.0"
npx dapp-store publish submit dapp-store/config.yaml -k dapp-store/publisher.json --requestor-is-authorized --complies-with-solana-dapp-store-policies
```

---

## ✅ ЗАВЕРШЕНО (для истории)

- ✅ Lottie splash screen
- ✅ Home screen redesign (Hero Card + TAP focus + CTAs)
- ✅ Fix Space Runner fullscreen
- ✅ Premium Shop tiered (0.01-0.05 SOL)
- ✅ Founder Pass tier UI (Silver/Gold/Diamond)
- ✅ P2P ORB Send modal с preview
- ✅ Supabase miграция P2P (transfer_orb RPC + tables)
- ✅ Triple burn mechanism (констант)
- ✅ Email rename → adsskora@gmail.com
- ✅ Git history cleaned from secrets
- ✅ Private GitHub repo
- ✅ README.md, HANDOFF.md, WEBSITE-BRIEF.md, TOKENOMICS.md v0.2
- ✅ APK v1 & v2 built

---

_Updated 2026-05-29 · Git: c641ce2_
