-- ===========================================================================
-- FUNNEL PATCH - which language people actually choose
-- ===========================================================================
-- Project: qxejdpvjggqjqoydujjd.supabase.co   -   run in the SQL Editor
-- Requires supabase-funnel.sql to have been applied first.
--
-- The app is listed in five languages and translated in none of them fully.
-- 127 strings are hardcoded English, and the two headline features - the
-- Labyrinth and Solana Quest - contain no translated text at all. Fixing that
-- is roughly 500 translations.
--
-- Nothing anywhere records which language anyone picks. Paying for four
-- languages without knowing whether a single player has ever chosen one is the
-- expensive way to find out. Five more steps cost nothing and answer it.
--
-- The client stamps the active language on every launch, not only at the first
-- run selector, so existing players report theirs on their next open rather
-- than never.
--
-- FORMATTING: zero single quotes, zero semicolons inside text, bare
-- identifiers for names. See gotcha 11 in CLAUDE.md.
-- ===========================================================================

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
    $s$app_open,lang_picked,onboard_start,onboard_done,home_seen,first_tap,first_game,quest_open,level_2,wallet,day_2,legacy,lang_en,lang_ru,lang_zh,lang_ja,lang_fr$s$,
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
-- Language split, read on its own
-- ---------------------------------------------------------------------------
-- Deliberately a separate view. Languages are not a stage of the funnel and
-- would only clutter funnel_summary, which is read top to bottom as a sequence.

-- The list is spelled out rather than matched with LIKE: `lang_picked` is also
-- a step and also begins with lang_, and it would arrive here as a language
-- called "ed".

create or replace view public.funnel_languages as
  select right(s.step, 2)  as lang,
         count(*)::integer as devices,
         max(s.at)         as last_at
    from public.funnel_steps s
   where s.step = any (string_to_array($s$lang_en,lang_ru,lang_zh,lang_ja,lang_fr$s$, $s$,$s$))
   group by right(s.step, 2)
   order by count(*) desc;

grant select on public.funnel_languages to anon, authenticated;

-- ---------------------------------------------------------------------------
-- Check
-- ---------------------------------------------------------------------------

select * from public.funnel_languages;
