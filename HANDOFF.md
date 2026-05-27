# Session Handoff — 2026-05-28

> Сводка сессии UX-редизайн + i18n завершён. Контекст для следующего чата.

---

## 🎯 Что сделано (обе сессии)

### Фаза 1 — Оптимизация производительности
1. **Debounce `syncScore`** — 5с дебаунс вместо HTTP на каждый тап
2. **Debounce energy writes** — 2с дебаунс AsyncStorage
3. **`<SeasonCountdown />`** — изолирован, не ре-рендерит AppInner каждую секунду
4. **Achievement check throttle** — `Math.floor(orb / 5000)` в deps

### Фаза 2 — i18n (ПОЛНОСТЬЮ ЗАВЕРШЁН)
Все компоненты переведены на 5 языков (en/ru/zh/ja/fr):

| Компонент | Статус |
|-----------|--------|
| FortuneWheel | ✅ |
| HorseRace | ✅ |
| Arena | ✅ |
| SpaceRunner | ✅ |
| SeekerLands | ✅ |
| TreasureHunt | ✅ |
| EarnHub | ✅ |
| GenesisNews | ✅ |
| SKORAWallet | ✅ |
| PvPArena | ✅ |
| Tournament | ✅ |

`lib/i18n.ts` — ~200+ ключей, 5 языков.

### Фаза 3 — UX редизайн

1. **Galaxy Home** — 8 планет-кнопок вместо TAP-экрана как главной
2. **TAP hint** — контекстная подсказка под орбом
3. **Games tab** — все карточки одного размера (как SpaceRunner)
4. **Navbar fix** — цвет текста `#1E293B` → `#475569` (был невидим)
5. **Back navigation** — кнопка `‹` на всех sub-screen
6. **◎ символы** — заменены на emoji (не рендерятся на Android)
7. **Shop Hub 3-card** — исправлен layout (flexWrap убран, flex:1)
8. **Privacy Policy modal** — в Profile, cyber-стиль
9. **Мелкие шрифты** — увеличены до читаемых (8→10px)

### Фаза 4 — Publishing prep
- `dapp-store/privacy.html` — готовый HTML для деплоя
- `dapp-store/SUBMISSION-GUIDE.md` — гайд по сабмиту

### Git
- 3 коммита в master: perf+i18n base → UX redesign → i18n completion
- Последний: `ab784b3`

---

## 📋 Что осталось сделать (по приоритету)

### 🔴 Действия пользователя (без кода)
| # | Задача | Время |
|---|--------|-------|
| 1 | Зарегистрировать домен `seekerquest.league` | 5 мин |
| 2 | Задеплоить `dapp-store/privacy.html` на GitHub Pages | 10 мин |
| 3 | Сделать 8 скриншотов 1080×1920 | 30 мин |
| 4 | Создать иконки: 512×512, 1200×600, 1024×500 | 1-2 ч |
| 5 | Пополнить publisher кошелёк ~0.1 SOL mainnet | 5 мин |

### 🟡 Код (следующие задачи)
- **UX аудит игровых экранов** — FortuneWheel, Arena, SpaceRunner изнутри
- **Онбординг** — первый запуск, объяснение TAP-механики
- **Mainnet migration** — переключение после Pre-Season
- **dApp Store CLI** — установка и сабмит (после скриншотов/иконок)

### dApp Store CLI команды
```powershell
cd C:\sk
npm install --save-dev @solana-mobile/dapp-store-cli
solana-keygen new --outfile dapp-store\publisher.json
npx dapp-store create publisher dapp-store/config.yaml -k dapp-store/publisher.json
npx dapp-store create app dapp-store/config.yaml -k dapp-store/publisher.json
# скопировать адреса в config.yaml
Copy-Item C:\sk\android\app\build\outputs\apk\release\app-release.apk C:\sk\dapp-store\media\app-release.apk
npx dapp-store create release dapp-store/config.yaml -k dapp-store/publisher.json -b "C:\Users\User\AppData\Local\Android\Sdk\build-tools\35.0.0"
npx dapp-store publish submit dapp-store/config.yaml -k dapp-store/publisher.json --requestor-is-authorized --complies-with-solana-dapp-store-policies
```

---

## 📊 Web3 константы (НЕ ИЗМЕНЯТЬ)

```
User wallet (devnet):  HVJDjwuaqH7oDeXUASqDMCZYQ53Hg8uxKs4RkS7sskhC
Treasury (devnet):     EekTZsoxzVEdze1HEAqLQbMnx8ScBheWBW3Dsp9QBZDT
SKORA mint:            3HTkC3v9CYTxGYQSegsidgzfxEQJvAotYZVozmaFc2av
SKORA Treasury ATA:    skbhes18WDERZ9MgSrhHtKwUyEyxGhzYwyMdRkt69sZ
Supabase URL:          qxejdpvjggqjqoydujjd.supabase.co
```

---

## 🔥 Top-5 gotchas (для нового чата)

1. **Рабочая папка = `C:\sk\`**
2. **EAS лимит исчерпан** до ~1 июня — только `gradlew.bat assembleRelease`
3. **`seeker-sdk` через lazy require + try/catch** — статический import крашит RN
4. **не собирать билд** пока много не поработали
5. **Конфликт имени `t`** — в SKORAWallet.tsx цикл по табам переименован в `tabKey` (было `t`, конфликт с функцией `t()`)

---

## 💬 Стиль общения

- **Русский** язык
- Дружелюбно, по делу, без воды
- Короткие пункты + таблицы
- TS check: `cd C:\sk; & "C:\sk\node_modules\.bin\tsc.cmd" -p tsconfig.json --noEmit --skipLibCheck`
- Билд: `cd C:\sk\android && .\gradlew.bat assembleRelease --no-daemon`
- AsyncStorage permissions: пользователь дал полную автономию

---

_Сессия завершена 2026-05-28. TypeScript: 0 ошибок. i18n 100% ✅ UX redesign ✅ Git: ab784b3_
