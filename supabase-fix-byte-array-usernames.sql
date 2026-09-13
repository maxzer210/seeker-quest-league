-- ===========================================================================
-- FIX (STEP 1 of 2, PREVIEW) - .skr domains stored as stringified byte arrays
-- ===========================================================================
-- Project: qxejdpvjggqjqoydujjd.supabase.co   -   run in the SQL Editor
--
-- Builds that predate normalizeSkrDomain() in lib/seeker.ts wrote the domain
-- exactly as the SDK handed it over, a byte array, so those rows read
-- "101,120,112,108,111,114,101,114.skr" instead of "explorer.skr".
-- 9 rows in players were affected as of 2026-09-05.
--
-- The app already decodes these on read via repairUsername, so this migration
-- is about the stored data: old clients, the prize-distribution script and the
-- dashboard all still see the raw char codes. Nothing breaks without it.
--
-- The owner cannot fix it from inside the app: the name no longer starts with
-- "Seeker#", so the .skr adoption effect treats it as a name they chose.
--
-- This file only creates the decoder and SHOWS you what would change.
-- Run supabase-fix-byte-array-usernames-apply.sql afterwards to write it.
--
-- NOTE ON FORMATTING: no apostrophes and no semicolons inside comments in this
-- file, deliberately. The Supabase SQL Editor tracks string literals without
-- honouring -- comments, so an apostrophe in a comment shifts every quote
-- after it and the file fails with a nonsense error far from the real cause.
-- ===========================================================================

-- Printable ASCII only, the same rule as decodeBytes() on the client.
create or replace function decode_skr_byte_name(raw text)
returns text
language sql
immutable
as $$
  select string_agg(chr(b), '' order by ord) || '.skr'
  from (
    select btrim(part)::int as b, ord
    from unnest(string_to_array(regexp_replace(raw, '\.skr$', '', 'i'), ','))
         with ordinality as u(part, ord)
  ) t
  where b between 32 and 126
$$;

-- Preview. Read the "after" column before running the apply file.
select device_id,
       username                       as stored_now,
       decode_skr_byte_name(username) as would_become
from players
where username ~ '^\d+(\s*,\s*\d+)+(\.skr)?$'
order by device_id;
