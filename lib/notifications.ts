/**
 * Local push notifications.
 *
 * Strategy: schedule-on-device, no backend required.
 * Used for streak reminders, lands harvest ready, tournament endings.
 *
 * If we later add Expo Push for broadcast events (Season 1 launch announcements,
 * Daily Pot ending blast), we'll layer that on top — local + remote can coexist.
 */
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

const CHANNEL_ID = 'seeker-quest';

// Identifiers so we can cancel/replace previously scheduled notifications
const ID_STREAK_REMINDER     = 'streak-reminder';
const ID_LANDS_READY         = 'lands-ready';
const ID_TOURNAMENT_ENDING   = 'tournament-ending';
const ID_ENERGY_FULL         = 'energy-full';

let configured = false;

async function ensureConfigured() {
  if (configured) return;
  configured = true;

  // Foreground behaviour — show banner even when app is open
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true,
      shouldShowList:   true,
      shouldPlaySound:  false,   // we have our own in-game sfx, don't double up
      shouldSetBadge:   false,
    }),
  });

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
      name: 'Seeker Quest',
      importance: Notifications.AndroidImportance.DEFAULT,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#A855F7',
    });
  }
}

/** Ask the user for notification permission. Idempotent. */
export async function requestNotificationPermission(): Promise<boolean> {
  await ensureConfigured();
  try {
    const existing = await Notifications.getPermissionsAsync();
    if (existing.granted) return true;
    if (!existing.canAskAgain) return false;
    const ask = await Notifications.requestPermissionsAsync();
    return ask.granted;
  } catch {
    return false;
  }
}

/** True if user already granted notification permission. */
export async function hasNotificationPermission(): Promise<boolean> {
  try {
    const status = await Notifications.getPermissionsAsync();
    return status.granted;
  } catch {
    return false;
  }
}

// ── Schedulers ────────────────────────────────────────────────────────────

/**
 * Reminds the player at 20:00 local time tomorrow to come back and claim
 * their morning streak so they don't break their chain.
 *
 * Called after a successful daily claim — we know they did today, so we
 * schedule the next nudge.
 */
export async function scheduleStreakReminder(currentStreak: number): Promise<void> {
  await ensureConfigured();
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_STREAK_REMINDER);
  } catch {}

  // Tomorrow at 20:00 local time
  const target = new Date();
  target.setDate(target.getDate() + 1);
  target.setHours(20, 0, 0, 0);

  const nextStreak = currentStreak + 1;
  const isMilestone = nextStreak > 0 && nextStreak % 7 === 0;

  await Notifications.scheduleNotificationAsync({
    identifier: ID_STREAK_REMINDER,
    content: {
      title: isMilestone
        ? `🛡  Day ${nextStreak} = new Streak Shield!`
        : `🔥  Don't break your ${currentStreak}-day streak`,
      body: isMilestone
        ? `Tap in to claim your milestone reward + 1 Streak Shield.`
        : `Open Seeker Quest before midnight to extend to day ${nextStreak}.`,
      data: { type: 'streak-reminder', streak: currentStreak },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: target,
      channelId: CHANNEL_ID,
    },
  });
}

/**
 * Tells the player their Lands have generated enough ORB to claim.
 * Schedule when the user does a harvest — fires when next harvest unlocks.
 *
 * @param secondsFromNow seconds until the harvest is ready (e.g. 24h = 86400)
 */
export async function scheduleLandsReady(secondsFromNow: number): Promise<void> {
  await ensureConfigured();
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_LANDS_READY);
  } catch {}

  await Notifications.scheduleNotificationAsync({
    identifier: ID_LANDS_READY,
    content: {
      title: '🌾  Your Seeker Lands are ready',
      body:  'Harvest ORB now before storage fills up.',
      data:  { type: 'lands-ready' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, secondsFromNow),
      channelId: CHANNEL_ID,
    },
  });
}

/**
 * Warns the player 60 minutes before the daily tournament ends.
 *
 * Active only post-Genesis (when daily SOL Pot distribution is live).
 * Call once per day after the player engages with the app.
 */
export async function scheduleTournamentEnding(): Promise<void> {
  await ensureConfigured();
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_TOURNAMENT_ENDING);
  } catch {}

  // 23:00 UTC today (or tomorrow if it's already past)
  const target = new Date();
  target.setUTCHours(23, 0, 0, 0);
  if (target.getTime() < Date.now() + 60_000) {
    target.setUTCDate(target.getUTCDate() + 1);
  }

  await Notifications.scheduleNotificationAsync({
    identifier: ID_TOURNAMENT_ENDING,
    content: {
      title: '⏰  Today\'s SOL pot ends in 1 hour',
      body:  'Final push! Climb the rank before 23:59 UTC.',
      data:  { type: 'tournament-ending' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: target,
      channelId: CHANNEL_ID,
    },
  });
}

/**
 * Tells the player their Signal energy has refilled to max — a strong
 * re-engagement hook for a tap game. Schedule when energy hits 0; the fire
 * time is (full regen duration) from now.
 *
 * @param secondsFromNow seconds until energy is back to max
 */
export async function scheduleEnergyFull(secondsFromNow: number): Promise<void> {
  await ensureConfigured();
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_ENERGY_FULL);
  } catch {}

  await Notifications.scheduleNotificationAsync({
    identifier: ID_ENERGY_FULL,
    content: {
      title: '⚡  Energy full — time to tap!',
      body:  'Your Signal energy is back to max. Jump in and earn ORB.',
      data:  { type: 'energy-full' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: Math.max(60, secondsFromNow),
      channelId: CHANNEL_ID,
    },
  });
}

/** Cancel a pending energy-full nudge (e.g. user refilled via SOL). */
export async function cancelEnergyFull(): Promise<void> {
  try {
    await Notifications.cancelScheduledNotificationAsync(ID_ENERGY_FULL);
  } catch {}
}

/** Cancel everything — use when user disables notifications in Settings. */
export async function cancelAllScheduled(): Promise<void> {
  try {
    await Notifications.cancelAllScheduledNotificationsAsync();
  } catch {}
}

/** Manual test — fires a notification in ~2 seconds. */
export async function sendTestNotification(): Promise<void> {
  await ensureConfigured();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: '🧪  Test notification',
      body:  'If you can see this — notifications work. Tap to dismiss.',
      data:  { type: 'test' },
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: 2,
      channelId: CHANNEL_ID,
    },
  });
}
