-- ═══════════════════════════════════════════════════════════════════════════
-- Fix for the one thing the 2026-09-05 lockdown did not close
-- ═══════════════════════════════════════════════════════════════════════════
-- supabase-orb-authoritative.sql used
--
--     revoke update (orb, season_orb) on public.players from anon;
--
-- which does nothing when a table-wide `grant update` is already in place: a
-- column-level revoke cannot cut into a table-level privilege. Verified after
-- applying it — PATCH players.orb still returned 204 with the app's own key.
--
-- The working shape is to take the whole privilege away and hand back the
-- columns the client legitimately writes. Safe to run on the live database:
-- those four columns are all the client ever updates (username on rename and
-- .skr adoption, wallet_address on wallet link, level and streak on sync).
--
-- This is already folded into supabase-orb-authoritative.sql. Run this file
-- only if that one was applied before the fix.
-- ═══════════════════════════════════════════════════════════════════════════

revoke update on public.players from anon, authenticated;

grant update (username, level, streak, wallet_address)
  on public.players to anon, authenticated;

-- Verify: UPDATE must appear for these four column names and no others.
select grantee, column_name, privilege_type
  from information_schema.column_privileges
 where table_name = 'players'
   and grantee in ('anon', 'authenticated')
   and privilege_type = 'UPDATE'
 order by grantee, column_name;
