-- ===========================================================================
-- FIRST-SESSION FUNNEL - where the 53 percent go
-- ===========================================================================
-- Project: qxejdpvjggqjqoydujjd.supabase.co   -   run in the SQL Editor
--
-- On 2026-09-07 the live database held 116 players ever, 15 active in thirty
-- days, 6 in seven, 3 in three. 62 of the 116 were still level 1: they opened
-- the app and never came back. Nothing recorded WHERE they stopped, so every
-- fix for it would have been a guess.
--
-- This records one timestamp per device per milestone. Not an event stream:
-- the primary key is (device_id, step) and writes are insert-or-ignore, so a
-- step can be stamped once and never moved. That bounds the table at one row
-- per device per step, makes the write idempotent, and means a client that
-- retries or reinstalls cannot inflate anything.
--
-- FORMATTING, deliberately: zero single-quote characters, zero semicolons
-- inside any text. See gotcha 11 in CLAUDE.md.
-- ===========================================================================

create table if not exists public.funnel_steps (
  device_id   text        not null,
  step        text        not null,
  at          timestamptz not null default now(),
  app_version text,
  primary key (device_id, step)
);

create index if not exists funnel_steps_step_idx on public.funnel_steps (step, at desc);

-- ---------------------------------------------------------------------------
-- The only way in
-- ---------------------------------------------------------------------------
-- security definer, so anon never touches the table directly. The step name is
-- checked against a fixed list: an unknown name is dropped rather than stored,
-- which keeps a rogue client from filling the table with invented steps.

create or replace function public.track_step(
  p_device_id text,
  p_step      text,
  p_version   text default null
) returns boolean
language plpgsql
security definer
set search_path = public
as $fn$
declare
  v_allowed text[] := string_to_array(
    $s$app_open,lang_picked,onboard_start,onboard_done,home_seen,first_tap,first_game,quest_open,level_2,wallet,day_2,legacy$s$,
    $s$,$s$);
begin
  if p_device_id is null or length(p_device_id) < 8 or length(p_device_id) > 64 then
    return false;
  end if;
  if not (p_step = any (v_allowed)) then
    return false;
  end if;

  insert into public.funnel_steps (device_id, step, app_version)
  values (p_device_id, p_step, left(coalesce(p_version, $s$?$s$), 16))
  on conflict (device_id, step) do nothing;

  return true;
end $fn$;

-- ---------------------------------------------------------------------------
-- Reading it
-- ---------------------------------------------------------------------------
-- The funnel in one query, ordered by the sequence a real session goes through
-- rather than alphabetically, so the drop is read top to bottom.
--
-- devices_new is the column that answers the question. A device stamped
-- `legacy` was installed before any of this existed, and it will stamp
-- home_seen, first_game and level_2 within a minute of updating — steps it
-- cleared long ago. Counting those with genuine new installs would paint a
-- healthy funnel out of memories.

create or replace view public.funnel_summary as
  with legacy as (
    select device_id from public.funnel_steps where step = $s$legacy$s$
  )
  select s.step,
         count(*)::integer                                    as devices,
         count(*) filter (where l.device_id is null)::integer as devices_new,
         min(s.at)                                            as first_at,
         max(s.at)                                            as last_at
    from public.funnel_steps s
    left join legacy l on l.device_id = s.device_id
   group by s.step
   order by case s.step
     when $s$app_open$s$      then 1
     when $s$lang_picked$s$   then 2
     when $s$onboard_start$s$ then 3
     when $s$onboard_done$s$  then 4
     when $s$home_seen$s$     then 5
     when $s$first_tap$s$     then 6
     when $s$first_game$s$    then 7
     when $s$quest_open$s$    then 8
     when $s$level_2$s$       then 9
     when $s$wallet$s$        then 10
     when $s$day_2$s$         then 11
     else 99 end;

-- ---------------------------------------------------------------------------
-- Permissions
-- ---------------------------------------------------------------------------
-- Writes only through the function. Reads are open on purpose: the table holds
-- device ids and timestamps and nothing else, all of which players already
-- exposes, and being able to read the funnel from outside the dashboard is
-- what makes it useful to act on. If that trade stops being worth it, revoke
-- the two selects below and read it from the Supabase dashboard instead.

alter table public.funnel_steps enable row level security;

-- The policy name is a bare identifier: lowercase and underscores only, so it
-- needs no quoting of any kind. Dollar quoting produces a string literal, and
-- a literal is a syntax error where the parser wants a name.
drop policy if exists funnel_public_read on public.funnel_steps;
create policy funnel_public_read on public.funnel_steps for select using (true);

revoke insert, update, delete on public.funnel_steps from anon, authenticated;
grant  select on public.funnel_steps   to anon, authenticated;
grant  select on public.funnel_summary to anon, authenticated;
grant  execute on function public.track_step(text, text, text) to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Check
-- ---------------------------------------------------------------------------

select * from public.funnel_summary;
