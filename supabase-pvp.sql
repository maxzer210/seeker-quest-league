-- ============================================================================
-- PvP Arena — async tap-battle with ORB stakes
-- ============================================================================
-- Flow:
--   1. Challenger creates a match: stakes ORB, plays 30s tap-battle, score saved.
--      Status: 'waiting'.
--   2. Opponent accepts: stakes ORB too, plays 30s, sees result immediately.
--      Status: 'finished', winner_id set.
--   3. Winner takes 2× stake minus 5% project fee.
--   4. If no one accepts in 24h, challenger can cancel → ORB refunded.
-- ============================================================================

create table if not exists public.pvp_matches (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  finished_at         timestamptz,

  status              text not null default 'waiting'
                        check (status in ('waiting','finished','cancelled')),
  game_type           text not null default 'tap_battle',
  duration_seconds    integer not null default 30 check (duration_seconds between 10 and 120),
  stake_orb           integer not null check (stake_orb >= 100 and stake_orb <= 1000000),

  -- Challenger (creator)
  challenger_id       text not null,
  challenger_username text not null,
  challenger_score    integer not null check (challenger_score >= 0),

  -- Opponent (acceptor) — null while waiting
  opponent_id         text,
  opponent_username   text,
  opponent_score      integer check (opponent_score is null or opponent_score >= 0),

  -- Result
  winner_id           text,
  payout_orb          integer,
  fee_orb             integer
);

create index if not exists pvp_matches_status_idx
  on public.pvp_matches (status, created_at desc);

create index if not exists pvp_matches_challenger_idx
  on public.pvp_matches (challenger_id, created_at desc);

create index if not exists pvp_matches_opponent_idx
  on public.pvp_matches (opponent_id, created_at desc);

alter table public.pvp_matches enable row level security;

-- Public read of all matches (so players see open challenges + history)
drop policy if exists "Public read pvp_matches" on public.pvp_matches;
create policy "Public read pvp_matches"
  on public.pvp_matches
  for select
  to anon, authenticated
  using (true);

-- Anyone can create a new match (insert) with sane bounds + must start as waiting.
drop policy if exists "Allow create pvp match" on public.pvp_matches;
create policy "Allow create pvp match"
  on public.pvp_matches
  for insert
  to anon, authenticated
  with check (
    status            = 'waiting'
    and challenger_id is not null
    and challenger_username is not null
    and challenger_score    >= 0
    and stake_orb           >= 100
    and stake_orb           <= 1000000
    and opponent_id   is null
    and winner_id     is null
  );

-- Anyone can update a waiting match — to accept (set opponent + score + winner + finished)
-- OR to cancel one they created (after 24h).
-- We intentionally keep RLS simple here; client enforces "can't play your own match"
-- and stale-cancel logic. For mainnet we'll move to a Postgres function with auth.
drop policy if exists "Allow accept or cancel pvp match" on public.pvp_matches;
create policy "Allow accept or cancel pvp match"
  on public.pvp_matches
  for update
  to anon, authenticated
  using (status = 'waiting')
  with check (
    -- after update, status must be finished (acceptance) or cancelled (refund)
    status in ('finished','cancelled')
    -- if finished, opponent and winner must be set
    and (
      status = 'cancelled'
      or (
        opponent_id   is not null
        and opponent_score is not null
        and winner_id is not null
      )
    )
  );
