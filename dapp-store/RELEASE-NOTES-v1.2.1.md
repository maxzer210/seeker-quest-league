# Seeker Quest League — v1.2.1

`versionCode 17` · build stamp `2026-09-05 · solana-quest`

Paste-ready copy for the dApp Store "What's new" field. The same text is
already in `config.yaml` under `new_in_version`.

---

## Store copy (English, ~900 chars)

> **v1.2.1 — Solana Quest, properly**
>
> ◎ Solana Quest is back, and it now posts a fresh set every single day — five questions, ten seconds each, one attempt
> 🧠 82 questions in the bank, from lamports to Turbine and durable nonces, each one explained after you answer
> 🎲 Answers are properly shuffled. Previously the right answer was always the first button — that is fixed, and every old question has been re-seated
> 🎨 Redrawn quest screen: a live countdown ring, drifting Solana aurora, and your run laid out as five dots you can read at a glance
> 🏆 The cup table finally shows real names. Your .skr domain or the name you chose, instead of Seeker#XXXX
> 🟣 Your chosen name now survives a restart, and .skr domains that were stored as raw byte codes are decoded on sight
> ⚡ Faster leaderboard rendering and a calmer question screen

## Short form (social / Discord, ~280 chars)

> Seeker Quest v1.2.1 is live.
>
> ◎ Solana Quest posts a new set daily again — 82 questions, ten seconds each
> 🎲 Answers no longer always sit on button A
> 🏆 Leaderboards show your real name, not Seeker#XXXX
> 🎨 New quest screen with a live countdown ring

## Русская версия (для канала / поста)

> **v1.2.1 — Solana Quest как надо**
>
> ◎ Solana Quest снова выходит — новый набор каждый день, пять вопросов по десять секунд, одна попытка
> 🧠 82 вопроса в банке: от лампортов до Turbine и durable nonce, с разбором после ответа
> 🎲 Варианты наконец перемешаны. Раньше правильный ответ всегда был первой кнопкой — исправлено, старые вопросы пересобраны
> 🎨 Экран квеста перерисован: живое кольцо таймера, дрейфующее сияние в цветах Solana, забег виден как пять точек
> 🏆 В таблице кубка настоящие имена — твой .skr домен или выбранный ник вместо Seeker#XXXX
> 🟣 Выбранное имя больше не слетает при перезапуске, а .skr домены, сохранённые байтовыми кодами, декодируются на лету

---

## What actually shipped, for the record

**Names on leaderboards**

- The stored name was only ever read back on a fresh install, so every
  returning player came up as `Seeker#XXXX` — and that placeholder was what got
  stamped into their tournament row on the next score. Fixed in `App.tsx`.
- The cup table read a snapshot of the name taken when the points were scored.
  It now resolves the live name from `players`, which repairs every historical
  row at once, including ones written by older builds.
- `.skr` domains stored by pre-`normalizeSkrDomain` builds as stringified byte
  arrays (`99,114,...,119.skr`) are decoded on read by `repairUsername`.

**Solana Quest**

- Nothing was calling `build_quiz_day()`. The last issue was 2026-08-24 and the
  home screen had been advertising an empty quest for twelve days.
  `ensure_quiz_day()` is now called by the first player to open it each day.
- The picker refused to reuse anything from the past 60 days and gave up rather
  than posting a short issue — with six easy questions in the bank that was
  three days of quiz. It now orders least-recently-used and always fills five.
- All 20 seeded questions had `correct_index = 0` and the client does not
  shuffle. Every question is re-seated, and new ones are shuffled on insert.
- 62 new questions: 20 easy, 22 medium, 20 hard.

**Requires** `supabase-quiz-refresh.sql` to be applied before or alongside the
APK. Without it the app runs fine but `ensure_quiz_day` does not exist, the RPC
call fails silently, and the quest stays empty exactly as it is today.
