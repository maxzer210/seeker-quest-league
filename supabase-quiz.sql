-- ============================================================================
-- Solana Quest — daily quiz
-- ============================================================================
-- Five questions a day, the same five for everyone, one attempt each.
--
-- The whole point of this file is that the client NEVER sees a correct answer
-- before it commits. The app holds a publishable anon key, so anything it can
-- select, a determined player can select too. Therefore:
--
--   * quiz_questions has NO public select policy at all
--   * the app reads the view quiz_today, which omits correct_index and
--     explanation
--   * answers go through submit_quiz_answer(), a security-definer function
--     that grades server-side and is the only thing that writes ORB
--
-- A unique constraint on (device_id, quiz_date, slot) makes re-answering
-- impossible, which is what stops "guess, look it up, guess again".
-- ============================================================================

-- ── the bank ────────────────────────────────────────────────────────────────
create table if not exists public.quiz_questions (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  locale        text        not null default 'en',
  difficulty    smallint    not null check (difficulty between 1 and 3),
  category      text        not null,
  question      text        not null,
  options       jsonb       not null,          -- exactly 4 strings
  correct_index smallint    not null check (correct_index between 0 and 3),
  explanation   text        not null,          -- shown after answering; the teaching bit
  sponsor       text,                          -- null = house question
  active        boolean     not null default true,
  check (jsonb_typeof(options) = 'array' and jsonb_array_length(options) = 4)
);

-- ── which five make up a given day ──────────────────────────────────────────
create table if not exists public.quiz_daily (
  quiz_date   date     not null,
  slot        smallint not null check (slot between 1 and 5),
  question_id uuid     not null references public.quiz_questions(id) on delete restrict,
  primary key (quiz_date, slot)
);

-- ── what players answered ───────────────────────────────────────────────────
create table if not exists public.quiz_answers (
  id          bigserial primary key,
  answered_at timestamptz not null default now(),
  device_id   text        not null,
  quiz_date   date        not null,
  slot        smallint    not null,
  question_id uuid        not null references public.quiz_questions(id),
  choice      smallint    check (choice is null or choice between 0 and 3), -- null = forfeited
  correct     boolean     not null,
  ms          integer     not null check (ms >= 0),
  points      integer     not null default 0,
  orb_awarded integer     not null default 0,
  -- one shot per question, forever. This is the anti-retry lock.
  unique (device_id, quiz_date, slot)
);

create index if not exists quiz_answers_device_idx on public.quiz_answers (device_id, quiz_date desc);
create index if not exists quiz_answers_date_idx   on public.quiz_answers (quiz_date desc, points desc);
create index if not exists quiz_daily_date_idx     on public.quiz_daily (quiz_date desc);

-- ── the only thing the app may read ─────────────────────────────────────────
-- correct_index and explanation are deliberately absent.
create or replace view public.quiz_today as
  select d.quiz_date,
         d.slot,
         q.id as question_id,
         q.locale,
         q.difficulty,
         q.category,
         q.question,
         q.options,
         q.sponsor
  from public.quiz_daily d
  join public.quiz_questions q on q.id = d.question_id
  where d.quiz_date = current_date
    and q.active;

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.quiz_questions enable row level security;
alter table public.quiz_daily     enable row level security;
alter table public.quiz_answers   enable row level security;

-- quiz_questions: NO select policy on purpose. RLS with no policy denies all,
-- so the answer key is unreachable with the anon key.

-- quiz_daily is harmless on its own (it only maps dates to question ids)
drop policy if exists "Public read quiz_daily" on public.quiz_daily;
create policy "Public read quiz_daily" on public.quiz_daily for select using (true);

-- Answers are readable so the app can draw a leaderboard and your own history.
drop policy if exists "Public read quiz_answers" on public.quiz_answers;
create policy "Public read quiz_answers" on public.quiz_answers for select using (true);

-- Nobody writes answers directly — only through the function below.
revoke insert, update, delete on public.quiz_answers from anon, authenticated;

grant select on public.quiz_today to anon, authenticated;

-- ── scoring ─────────────────────────────────────────────────────────────────
-- Speed is most of the score. That is the anti-cheat: someone who looks the
-- answer up still answers slowly and still loses the leaderboard to someone
-- who simply knew it. ORB stays small on purpose — the moment the reward is
-- worth cheating for, no amount of clever defence holds.
create or replace function public.quiz_points(p_correct boolean, p_ms integer, p_limit_ms integer)
returns integer language sql immutable as $$
  select case
    when not p_correct then 0
    else 100 + greatest(0, round(100.0 * (p_limit_ms - least(p_ms, p_limit_ms)) / p_limit_ms))::integer
  end;
$$;

-- ── the one way to answer ───────────────────────────────────────────────────
create or replace function public.submit_quiz_answer(
  p_device_id text,
  p_slot      smallint,
  p_choice    smallint,     -- null when the player left the app or ran out of time
  p_ms        integer
) returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_limit_ms  constant integer := 10000;   -- keep in step with QUESTION_MS in lib/quiz.ts
  v_orb_right constant integer := 200;
  v_q         record;
  v_correct   boolean;
  v_points    integer;
  v_orb       integer;
begin
  if p_device_id is null or length(p_device_id) = 0 then
    return jsonb_build_object('error', 'no device id');
  end if;

  select q.id, q.correct_index, q.explanation
    into v_q
    from public.quiz_daily d
    join public.quiz_questions q on q.id = d.question_id
   where d.quiz_date = current_date
     and d.slot = p_slot
     and q.active;

  if not found then
    return jsonb_build_object('error', 'no question for today');
  end if;

  -- Clamp rather than trust: a client can claim it answered in 3 ms.
  p_ms := greatest(0, least(coalesce(p_ms, v_limit_ms), v_limit_ms));

  v_correct := p_choice is not null and p_choice = v_q.correct_index;
  v_points  := public.quiz_points(v_correct, p_ms, v_limit_ms);
  v_orb     := case when v_correct then v_orb_right else 0 end;

  begin
    insert into public.quiz_answers
      (device_id, quiz_date, slot, question_id, choice, correct, ms, points, orb_awarded)
    values
      (p_device_id, current_date, p_slot, v_q.id, p_choice, v_correct, p_ms, v_points, v_orb);
  exception when unique_violation then
    -- Already answered. Say so plainly and award nothing.
    return jsonb_build_object('error', 'already answered', 'slot', p_slot);
  end;

  return jsonb_build_object(
    'correct',       v_correct,
    'correct_index', v_q.correct_index,
    'explanation',   v_q.explanation,
    'points',        v_points,
    'orb',           v_orb
  );
end;
$$;

grant execute on function public.submit_quiz_answer(text, smallint, smallint, integer) to anon, authenticated;

-- ── today's standing, for the leaderboard ───────────────────────────────────
create or replace view public.quiz_leaderboard_today as
  select a.device_id,
         sum(a.points)::integer                       as points,
         count(*) filter (where a.correct)::integer   as correct,
         sum(a.ms)::integer                           as total_ms
  from public.quiz_answers a
  where a.quiz_date = current_date
  group by a.device_id
  order by points desc, total_ms asc;

grant select on public.quiz_leaderboard_today to anon, authenticated;

-- ── how a day gets built ────────────────────────────────────────────────────
-- Picks 2 easy, 2 medium, 1 hard that have not been used in the last 60 days.
-- Run it once per day (pg_cron, or just call it from an admin screen).
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

  with recent as (
    select question_id from public.quiz_daily where quiz_date > p_date - 60
  ),
  picked as (
    (select id from public.quiz_questions
      where active and difficulty = 1 and id not in (select question_id from recent)
      order by random() limit 2)
    union all
    (select id from public.quiz_questions
      where active and difficulty = 2 and id not in (select question_id from recent)
      order by random() limit 2)
    union all
    (select id from public.quiz_questions
      where active and difficulty = 3 and id not in (select question_id from recent)
      order by random() limit 1)
  )
  select array_agg(id) into v_ids from picked;

  v_n := coalesce(array_length(v_ids, 1), 0);
  if v_n < 5 then
    return -v_n;   -- not enough unused questions; the bank needs topping up
  end if;

  insert into public.quiz_daily (quiz_date, slot, question_id)
  select p_date, i::smallint, v_ids[i] from generate_series(1, 5) i;

  return 5;
end;
$$;

-- ============================================================================
-- Seed questions
-- ============================================================================
insert into public.quiz_questions (difficulty, category, question, options, correct_index, explanation) values

-- ── easy ──
(1, 'basics', 'What is the smallest unit of SOL called?',
 '["Lamport","Satoshi","Gwei","Wei"]'::jsonb, 0,
 'A lamport is one billionth of a SOL, named after Leslie Lamport whose work on distributed systems underpins Solana''s consensus.'),

(1, 'basics', 'What are smart contracts called on Solana?',
 '["Programs","Contracts","Scripts","Modules"]'::jsonb, 0,
 'Solana calls them programs. They are stateless — data lives in separate accounts that programs read and write.'),

(1, 'basics', 'Which language are most Solana programs written in?',
 '["Rust","Solidity","Go","Python"]'::jsonb, 0,
 'Rust dominates, with C and C++ also supported. Anchor is the most common Rust framework for writing them.'),

(1, 'basics', 'What is Solana''s timekeeping innovation called?',
 '["Proof of History","Proof of Stake","Proof of Work","Proof of Time"]'::jsonb, 0,
 'Proof of History creates a verifiable ordering of events before consensus, so validators do not have to agree on time itself.'),

(1, 'mobile', 'What is the second-generation Solana Mobile phone called?',
 '["Seeker","Saga","Sonar","Signal"]'::jsonb, 0,
 'Seeker follows the Saga. Both ship with Seed Vault and the dApp Store built into the operating system.'),

(1, 'basics', 'Where does a Solana program store its data?',
 '["In separate accounts","Inside the program","On IPFS","In the block header"]'::jsonb, 0,
 'Programs are stateless. State lives in accounts they own, which is what makes parallel execution possible.'),

-- ── medium ──
(2, 'accounts', 'What must every Solana account hold to avoid being purged?',
 '["A rent-exempt minimum","A staking deposit","An NFT","A validator signature"]'::jsonb, 0,
 'Accounts must keep a minimum balance scaled to their size. Fall below it and the account can be reclaimed — which is why a transfer that would empty your wallet gets rejected.'),

(2, 'tokens', 'What does ATA stand for in Solana token handling?',
 '["Associated Token Account","Automated Trading Agent","Anchor Test Adapter","Address Table Account"]'::jsonb, 0,
 'An Associated Token Account is the deterministic address that holds a given token for a given owner, so wallets can find it without a lookup.'),

(2, 'ecosystem', 'Which protocol is best known as Solana''s DEX aggregator?',
 '["Jupiter","Serum","Raydium","Orca"]'::jsonb, 0,
 'Jupiter routes a swap across many venues to find the best price, and most Solana wallets embed it for their swap feature.'),

(2, 'tokens', 'Which program issues most fungible tokens on Solana?',
 '["SPL Token","ERC-20","Metaplex","Token Metadata"]'::jsonb, 0,
 'The SPL Token program is the standard. Token-2022 extends it with extras like transfer fees and confidential transfers.'),

(2, 'mobile', 'What does Seed Vault on Solana Mobile protect?',
 '["Private keys, in secure hardware","Your app downloads","Chat history","NFT images"]'::jsonb, 0,
 'Seed Vault keeps keys in the phone''s secure element, so apps request signatures without ever seeing the key material.'),

(2, 'network', 'Roughly how long is a Solana slot?',
 '["About 400 milliseconds","About 4 seconds","About 12 seconds","About 1 minute"]'::jsonb, 0,
 'A slot is around 400ms, the window in which a leader may produce a block. It is why the chain feels immediate.'),

(2, 'ecosystem', 'What is Metaplex primarily used for on Solana?',
 '["NFT standards and tooling","Lending","Perpetuals","Bridging"]'::jsonb, 0,
 'Metaplex defines the token metadata standard and the tooling most Solana NFT collections are minted with.'),

(2, 'mobile', 'How do Solana apps request a signature from a mobile wallet?',
 '["Mobile Wallet Adapter","WalletConnect","Direct key access","Email link"]'::jsonb, 0,
 'Mobile Wallet Adapter is the Android protocol that lets a dApp hand a transaction to a wallet app and get it back signed.'),

-- ── hard ──
(3, 'history', 'Who is the lamport named after?',
 '["Leslie Lamport","Larry Lamport","Linda Lamport","Louis Lamport"]'::jsonb, 0,
 'Leslie Lamport, a Turing Award winner whose papers on logical clocks and Byzantine fault tolerance shaped the whole field.'),

(3, 'network', 'What limits how long a signed Solana transaction stays valid?',
 '["Its recent blockhash expires","A 10-minute timer","The fee payer''s balance","Validator vote count"]'::jsonb, 0,
 'Every transaction cites a recent blockhash and is rejected once that falls out of the validators'' window — roughly a minute or two. Take too long approving and you must sign again.'),

(3, 'accounts', 'Why can Solana execute many transactions in parallel?',
 '["Transactions declare the accounts they touch","It uses sharding","Blocks are bigger","Programs run off-chain"]'::jsonb, 0,
 'Each transaction lists the accounts it will read and write up front, so the runtime can safely run non-overlapping ones at the same time. This is Sealevel.'),

(3, 'fees', 'What are priority fees on Solana used for?',
 '["Bidding for earlier inclusion","Paying validators rent","Burning supply","Funding the treasury"]'::jsonb, 0,
 'A priority fee is paid per compute unit to make a transaction more attractive to the current leader when blocks are contested.'),

(3, 'ecosystem', 'What problem do Address Lookup Tables solve?',
 '["Fitting more accounts in one transaction","Faster RPC reads","Cheaper NFT mints","Cross-chain messaging"]'::jsonb, 0,
 'Versioned transactions can reference an on-chain table of addresses instead of listing each one, so a single transaction can touch far more accounts.'),

(3, 'staking', 'What happens to a validator''s stake when it goes offline?',
 '["It stops earning rewards","It is burned immediately","It transfers to another validator","Nothing at all"]'::jsonb, 0,
 'Solana has no slashing for downtime today — an offline validator simply misses its rewards, and its delegators earn less that epoch.')

on conflict do nothing;

-- Build today's issue so the app has something to show right away.
select public.build_quiz_day(current_date);
