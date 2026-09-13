/**
 * First-session funnel.
 *
 * On 2026-09-07 the live database held 116 players ever and 62 of them were
 * still level 1 — they opened the app once and never came back. Nothing
 * recorded where they stopped, so every theory about it was a guess. This
 * records one timestamp per device per milestone so the drop can be read
 * instead of imagined.
 *
 * Rules it follows, because telemetry that costs the player anything is worse
 * than none:
 *
 *   - every call is fire-and-forget and can never throw into the UI
 *   - a step already recorded on this install never hits the network again
 *   - marks made before the device id has loaded are buffered, not lost
 *   - nothing personal is sent: a device id the app already uses, a step name
 *     from a fixed list, and the app version
 *
 * The server keeps the same discipline — see supabase-funnel.sql, where the
 * primary key is (device_id, step) and writes are insert-or-ignore, so a step
 * is stamped once and cannot be moved afterwards.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from './supabase';
import { APP_VERSION } from './version';

export type Step =
  | 'app_open'       // the app started
  | 'lang_picked'    // language chosen on the very first launch
  | 'onboard_start'  // onboarding was shown
  | 'onboard_done'   // onboarding was finished
  | 'home_seen'      // the home screen actually rendered
  | 'first_tap'      // the first tap on the orb
  | 'first_game'     // a mini-game was opened
  | 'quest_open'     // Solana Quest was opened
  | 'level_2'        // reached level 2 — the bar the 62 never cleared
  | 'wallet'         // a wallet was connected
  | 'day_2'          // came back on a later calendar day
  | 'legacy'         // install predates the funnel — see markLaunch
  | 'lang_en' | 'lang_ru' | 'lang_zh' | 'lang_ja' | 'lang_fr';

const DONE_KEY  = '@funnel_done';
const FIRST_KEY = '@funnel_first_day';

let deviceId: string | null = null;
let done: Set<string> | null = null;
const buffered: Step[] = [];

async function loadDone(): Promise<Set<string>> {
  if (done) return done;
  try {
    const raw = await AsyncStorage.getItem(DONE_KEY);
    done = new Set<string>(raw ? JSON.parse(raw) : []);
  } catch (_) {
    done = new Set<string>();
  }
  return done;
}

/**
 * Hand over the device id once it is known. Anything marked before this point
 * was buffered — the app-open and language steps happen while the id is still
 * being read from storage, and those are exactly the ones worth having.
 */
export function attachDevice(id: string): void {
  deviceId = id;
  const pending = buffered.splice(0, buffered.length);
  for (const step of pending) void mark(step);
}

/** Record a milestone. Safe to call as often as you like. */
export async function mark(step: Step): Promise<void> {
  try {
    const seen = await loadDone();
    if (seen.has(step)) return;

    if (!deviceId) {
      if (!buffered.includes(step)) buffered.push(step);
      return;
    }

    // Marked locally before the round trip. A step that fails to reach the
    // server is lost rather than retried forever: a funnel that nags is worse
    // than a funnel with a hole, and the next install reports it anyway.
    seen.add(step);
    AsyncStorage.setItem(DONE_KEY, JSON.stringify([...seen])).catch(() => {});

    await supabase.rpc('track_step', {
      p_device_id: deviceId,
      p_step:      step,
      p_version:   APP_VERSION,
    });
  } catch (_) {
    // Telemetry never surfaces its own failures.
  }
}

/**
 * Which language this player is actually running in.
 *
 * Called on every launch rather than only at the first-run selector, because
 * the question is what the existing players use, not just what the next
 * installer picks — and at six weekly actives, waiting for new installs to
 * answer it would take months. A player who switches language later simply
 * reports both, which is fine.
 *
 * This exists to decide whether the four non-English translations are worth
 * paying for: 127 hardcoded strings across four languages is roughly 500
 * translations, and nothing anywhere records whether a single player has ever
 * chosen Chinese.
 */
export function markLanguage(lang: string): void {
  const code = (lang || '').slice(0, 2).toLowerCase();
  if (code !== 'en' && code !== 'ru' && code !== 'zh' && code !== 'ja' && code !== 'fr') return;
  void mark(`lang_${code}` as Step);
}

/**
 * Marks app_open, and day_2 when this launch falls on a later calendar day
 * than the first one. Call once per cold start.
 *
 * Local dates on purpose: the question is whether the player came back on
 * another day of their own life, not another day in UTC.
 *
 * `alreadyOnboarded` separates the two populations that will arrive together
 * on the first instrumented build. Someone who onboarded months ago is going
 * to stamp home_seen, first_game and level_2 within a minute of updating —
 * steps they cleared long before any of this existed. Counted with genuine new
 * installs they would paint a healthy funnel out of memories, which is worse
 * than no funnel at all. They are stamped `legacy` once, and funnel_summary
 * reports them in a separate column.
 */
export async function markLaunch(alreadyOnboarded: boolean): Promise<void> {
  void mark('app_open');
  try {
    const today = new Date().toDateString();
    const first = await AsyncStorage.getItem(FIRST_KEY);
    if (!first) {
      await AsyncStorage.setItem(FIRST_KEY, today);
      if (alreadyOnboarded) void mark('legacy');
      return;
    }
    if (first !== today) void mark('day_2');
  } catch (_) {}
}
