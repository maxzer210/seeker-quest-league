# Seeker Quest League — v1.2.2

`versionCode 18` · build stamp `2026-09-07 · quest-timer-fix`

Supersedes `RELEASE-NOTES-v1.2.1.md`. v1.2.1 was published on 2026-09-07 and
was live for a few hours with an unplayable quest — the clock reset every
second and never advanced. Almost nobody will have seen it, and most players
arrive here from v1.2.0, so the copy below still leads with the features rather
than the fix.

The store copy is already in `config.yaml` under `new_in_version`.

---

## Store copy (English, ~950 chars)

> **v1.2.2 — Solana Quest, properly**
>
> ◎ Solana Quest is back, and it now posts a fresh set every single day — five questions, ten seconds each, one attempt
> 🧠 82 questions in the bank, from lamports to Turbine and durable nonces, each one explained after you answer
> 🎲 Answers are properly shuffled. The right answer used to be the first button every single time — that is fixed, and every old question has been re-seated
> 🎨 Redrawn quest screen: a live countdown ring, drifting Solana aurora, and your run laid out as five dots you can read at a glance
> 🏆 The cup table finally shows real names. Your .skr domain or the name you chose, instead of Seeker#XXXX
> 🟣 Your chosen name now survives a restart, and .skr domains stored as raw byte codes are decoded on sight
> 🛠 Fixed the quest clock rewinding every second and never reaching the next question

## Short form (social / Discord, ~290 chars)

> Seeker Quest v1.2.2 is live.
>
> ◎ Solana Quest posts a new set daily again — 82 questions, ten seconds each
> 🎲 Answers no longer always sit on button A
> 🏆 Leaderboards show your real name, not Seeker#XXXX
> 🎨 New quest screen with a live countdown ring
> 🛠 Quest clock no longer rewinds

## Русская версия (для канала / поста)

> **v1.2.2 — Solana Quest как надо**
>
> ◎ Solana Quest снова выходит — новый набор каждый день, пять вопросов по десять секунд, одна попытка
> 🧠 82 вопроса в банке: от лампортов до Turbine и durable nonce, с разбором после ответа
> 🎲 Варианты наконец перемешаны. Раньше правильный ответ всегда был первой кнопкой — исправлено, старые вопросы пересобраны
> 🎨 Экран квеста перерисован: живое кольцо таймера, дрейфующее сияние в цветах Solana, забег виден как пять точек
> 🏆 В таблице кубка настоящие имена — твой .skr домен или выбранный ник вместо Seeker#XXXX
> 🟣 Выбранное имя больше не слетает при перезапуске, а .skr домены, сохранённые байтовыми кодами, декодируются на лету
> 🛠 Часы квеста больше не откатываются назад

---

## Delta from v1.2.1, for the record

One change: the question effect in `components/SolanaQuest.tsx` no longer
depends on `commit`.

`onEarnOrb` and `onPlaySound` are inline arrows in `App.tsx`, so they are new
functions on every render of the parent. `commit` is a `useCallback` over them,
so it was new on every render too — and the effect that starts a question
listed it as a dependency. App re-renders once a second on the energy tick, so
every second the effect tore down and restarted: `startedAt` was reset, the
clock jumped back to 10, and the deadline never arrived, so the question never
ended.

`commit` is now read through a ref and the effect is keyed on `current?.slot` —
a primitive that changes exactly once per question. The fix lives in the child
rather than in `App.tsx` on purpose: a ref does not depend on the parent
keeping its callbacks stable, so a later edit to `App.tsx` cannot reintroduce
it.

The defect predates v1.2.1 — the same dependency array shipped in v1.2.0. It
could not surface until the quest had questions to show, which it had not since
2026-08-24.

The other seven games were checked for the same pattern and are clean:
`HorseRace` keeps its intervals in refs and starts them from an action, not
from an effect.

## Still unverified on a device

- The Skia countdown ring and the aurora background have never been seen
  running. They were written against the installed API surface but not looked
  at.
- The re-seated answer key: no correct answer has been scored since PART 3
  shuffled every question, so the key is reasoned-about but not proven.
