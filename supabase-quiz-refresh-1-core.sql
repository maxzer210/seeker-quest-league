-- ===========================================================================
-- SOLANA QUEST 1 of 2 - CORE: picker, trigger, re-seat the answers
-- ===========================================================================
-- Project: qxejdpvjggqjqoydujjd.supabase.co   -   run in the SQL Editor
-- Requires supabase-quiz.sql to have been applied first.
--
-- FORMATTING, deliberately: zero single-quote characters, and zero semicolons
-- inside any text. Every string is dollar-quoted. An earlier version failed in
-- the SQL Editor with an error naming a word buried in an English sentence,
-- which means something between the editor and Postgres was losing track of
-- where string literals begin and end. This file gives it nothing to lose
-- track of. Running it twice is harmless.
-- ===========================================================================

-- ═══════════════════════════════════════════════════════════════════════════
-- PART 1 — a picker that cannot run dry
-- ═══════════════════════════════════════════════════════════════════════════
-- Instead of excluding anything used in the last 60 days and giving up when
-- too little is left, order by least-recently-used and take the top n. With a
-- healthy bank that picks unseen questions anyway, and with a thin one it recycles
-- the oldest rather than posting nothing. A quiz that repeats is a small
-- disappointment. A quiz that is absent is a dead button on the home screen.

create or replace function public.build_quiz_day(p_date date default current_date)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  v_ids uuid[];
  v_n   integer;
begin
  if exists (select 1 from public.quiz_daily where quiz_date = p_date) then
    return 0;   -- already built, leave it alone
  end if;

  with lastuse as (
    select question_id, max(quiz_date) as used
      from public.quiz_daily
     where quiz_date < p_date
     group by question_id
  ),
  ranked as (
    select q.id,
           q.difficulty,
           row_number() over (
             partition by q.difficulty
             order by l.used nulls first, random()
           ) as rn
      from public.quiz_questions q
      left join lastuse l on l.question_id = q.id
     where q.active
  ),
  picked as (
    select id from ranked where difficulty = 1 and rn <= 2
    union all
    select id from ranked where difficulty = 2 and rn <= 2
    union all
    select id from ranked where difficulty = 3 and rn <= 1
  )
  select array_agg(id) into v_ids from picked;

  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n < 5 then
    return -v_n;   -- the bank is missing a whole difficulty tier
  end if;

  insert into public.quiz_daily (quiz_date, slot, question_id)
  select p_date, i::smallint, v_ids[i] from generate_series(1, 5) i;

  return 5;
end;
$$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 2 — let the first player of the day build it
-- ═══════════════════════════════════════════════════════════════════════════
-- There is no scheduler on this project and no admin screen. Rather than add
-- either, the app calls this before reading quiz_today: whoever opens the quest
-- first that day builds the issue, everyone after gets 0 and the same five
-- questions. It takes no arguments, only ever touches current_date, and is
-- idempotent — there is nothing here worth abusing and no way to reach the
-- answer key through it.

create or replace function public.ensure_quiz_day()
returns integer
language sql
security definer
set search_path = public
as $$
  select public.build_quiz_day(current_date);
$$;

revoke execute on function public.build_quiz_day(date) from anon, authenticated;
grant  execute on function public.ensure_quiz_day()    to   anon, authenticated;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 3 — move the answer off button A
-- ═══════════════════════════════════════════════════════════════════════════
-- Permutes the options of every question and moves correct_index with them.
-- Already-recorded quiz_answers are unaffected: they store the verdict, not a
-- reference into this array. Questions in the live issue for today are skipped so
-- nobody sees the buttons change underneath them mid-run.

do $$
declare
  r         record;
  v_opts    text[];
  v_perm    text[];
  v_correct text;
begin
  for r in
    select id, options, correct_index
      from public.quiz_questions
     where id not in (select question_id from public.quiz_daily where quiz_date = current_date)
  loop
    select array_agg(value order by ordinality) into v_opts
      from jsonb_array_elements_text(r.options) with ordinality;

    v_correct := v_opts[r.correct_index + 1];

    select array_agg(o order by random()) into v_perm from unnest(v_opts) o;

    update public.quiz_questions
       set options       = to_jsonb(v_perm),
           correct_index = array_position(v_perm, v_correct) - 1
     where id = r.id;
  end loop;
end $$;


-- ═══════════════════════════════════════════════════════════════════════════
-- PART 5 — build today, and report
-- ═══════════════════════════════════════════════════════════════════════════

select public.ensure_quiz_day() as slots_built;

select difficulty,
       count(*)                                    as in_bank,
       count(*) filter (where correct_index = 0)   as answer_on_a
  from public.quiz_questions
 where active
 group by difficulty
 order by difficulty;

-- answer_on_a should now be roughly a quarter of each tier, not all of it.

select slot, difficulty, category, question
  from public.quiz_today
 order by slot;
