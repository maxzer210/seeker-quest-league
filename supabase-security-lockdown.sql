-- ============================================================================
-- Security lockdown — findings from the live audit of 2026-08-24
-- ============================================================================
-- Probed with the publishable key that ships inside the APK, so everything
-- below is what any player holding the app can already do today.
--
-- WRITE access found open to anon:
--   UPDATE players            → set anyone's ORB to any number
--   DELETE players            → wipe all 109 accounts
--   INSERT skora_claims       → request unlimited SKORA payouts
--   UPDATE tournament_scores  → rig the board that pays out real SOL
--   UPDATE quiz_questions     → overwrite the quiz answer key
--   INSERT prize_distributions→ forge payout records
--
-- READ access found open to anon:
--   players — all 109 rows including device_id and 25 wallet addresses
--
-- This file is split in two. PART 1 is safe to apply right now: nothing the
-- shipped app does depends on it. PART 2 closes the money holes but needs the
-- client to change first, so it is left commented with the reasoning.
-- ============================================================================


-- ════════════════════════════════════════════════════════════════════════════
-- PART 1 — apply now. Zero impact on the live app.
-- ════════════════════════════════════════════════════════════════════════════

-- ── 1.1  Nobody should ever delete a player from the client ─────────────────
revoke delete on public.players from anon, authenticated;
drop policy if exists "Public delete players" on public.players;

-- ── 1.2  The quiz answer key must not be writable ───────────────────────────
-- Reading it is already blocked (verified: the key returns empty), but writing
-- was open, which is just as bad: overwrite correct_index and every answer you
-- give becomes the right one.
revoke insert, update, delete on public.quiz_questions from anon, authenticated;
revoke insert, update, delete on public.quiz_daily     from anon, authenticated;

-- ── 1.3  Payout records are written by the distribution script only ─────────
-- scripts/distribute-genesis-prizes.js runs with the service key, so it is
-- unaffected by revoking anon.
revoke insert, update, delete on public.prize_distributions from anon, authenticated;

-- ── 1.4  Payment log is append-only from the app, never editable ────────────
-- INSERT is already blocked (verified 401); make sure edits are too.
revoke update, delete on public.wheel_sol_payments from anon, authenticated;

-- ── 1.5  Stop handing out device ids and wallet addresses ───────────────────
-- The leaderboard needs a name and a score. It does not need the identifier
-- that authenticates a player, nor everyone's wallet.
create or replace view public.leaderboard as
  select username, orb, level, streak, season_orb, updated_at
  from public.players
  order by season_orb desc nulls last;

grant select on public.leaderboard to anon, authenticated;

-- Point the app at the view, then run PART 2's revoke on players select.


-- ════════════════════════════════════════════════════════════════════════════
-- PART 2 — the money holes. Needs the client to change first.
-- ════════════════════════════════════════════════════════════════════════════
-- Applying these today would break v1.1.4, which is live for 109 players: it
-- writes orb straight into players and inserts skora_claims directly. The fix
-- is the server-authoritative ORB work already sketched in ORB-REFACTOR-PLAN.md.
--
-- Until then these stay open, and that is a known, accepted risk — not an
-- oversight. Worth knowing: the top account currently holds 274,382,505 ORB,
-- which is 27,438 SKORA at the published rate. That may be a test account, or
-- it may be someone who already found this.

-- -- 2.1  ORB may only move through a checked function
-- revoke insert, update on public.players from anon, authenticated;
-- -- then: create function claim_orb(device_id, delta, reason) security definer
-- --       that validates the delta against energy spent and rate limits.

-- -- 2.2  Claims must be validated, not accepted on trust
-- revoke insert on public.skora_claims from anon, authenticated;
-- -- then: create function request_skora_claim(device_id, wallet, orb_amount)
-- --       security definer that checks the balance server-side and deducts it
-- --       in the same transaction.

-- -- 2.3  Tournament scores decide who receives SOL
-- revoke insert, update on public.tournament_scores from anon, authenticated;
-- -- then: submit_score(device_id, game, score) with a per-game ceiling.

-- -- 2.4  Once the app reads public.leaderboard instead of players
-- revoke select on public.players from anon, authenticated;


-- ════════════════════════════════════════════════════════════════════════════
-- Verify what PART 1 changed
-- ════════════════════════════════════════════════════════════════════════════
select table_name, privilege_type, grantee
from information_schema.role_table_grants
where table_schema = 'public'
  and grantee in ('anon', 'authenticated')
  and table_name in ('players', 'quiz_questions', 'quiz_daily',
                     'prize_distributions', 'wheel_sol_payments')
order by table_name, grantee, privilege_type;
