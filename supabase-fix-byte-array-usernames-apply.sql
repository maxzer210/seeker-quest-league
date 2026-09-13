-- ===========================================================================
-- FIX (STEP 2 of 2, APPLY) - decode the byte-array .skr names in place
-- ===========================================================================
-- Run supabase-fix-byte-array-usernames.sql first and read its preview.
-- That file creates decode_skr_byte_name(), which this one uses.
--
-- Safe to re-run: the guard matches only byte arrays, so a name that has
-- already been decoded is not touched a second time. The second condition
-- means a row is only rewritten when the decode produces something that
-- actually looks like a domain.
--
-- NOTE ON FORMATTING: no apostrophes and no semicolons inside comments here,
-- deliberately. See the note in the preview file.
-- ===========================================================================

update players
   set username = decode_skr_byte_name(username)
 where username ~ '^\d+(\s*,\s*\d+)+(\.skr)?$'
   and decode_skr_byte_name(username) ~ '^[a-z0-9][a-z0-9-]{0,62}\.skr$';

update tournament_scores
   set username = decode_skr_byte_name(username)
 where username ~ '^\d+(\s*,\s*\d+)+(\.skr)?$'
   and decode_skr_byte_name(username) ~ '^[a-z0-9][a-z0-9-]{0,62}\.skr$';

-- What is left. Should return no rows.
select device_id, username
from players
where username ~ '^\d+(\s*,\s*\d+)+(\.skr)?$';

-- Tidy up. The decoder has no further use once the data is clean.
drop function if exists decode_skr_byte_name(text);
