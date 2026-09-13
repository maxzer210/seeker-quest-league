/**
 * Solana Quest — daily quiz client.
 *
 * Five questions a day, the same five for everyone, one attempt each. The
 * correct answer is never in this file and never reaches the device: the app
 * reads `quiz_today` (which omits the key) and submits to a server function
 * that grades and awards. See supabase-quiz.sql for why.
 */
import { AppState, type AppStateStatus } from 'react-native';
import { supabase } from './supabase';

/** Time allowed per question. Must match v_limit_ms in submit_quiz_answer(). */
export const QUESTION_MS = 10_000;

/** Questions in a daily issue. */
export const DAILY_SLOTS = 5;

/** Reward for a correct answer, mirrored from the server for display only. */
export const ORB_PER_CORRECT = 200;

export type QuizQuestion = {
  quiz_date: string;
  slot: number;
  question_id: string;
  locale: string;
  difficulty: 1 | 2 | 3;
  category: string;
  question: string;
  options: string[];
  sponsor: string | null;
};

export type QuizVerdict = {
  correct: boolean;
  correct_index: number;
  explanation: string;
  points: number;
  orb: number;
};

export type QuizAnswerRow = {
  slot: number;
  correct: boolean;
  points: number;
  orb_awarded: number;
  ms: number;
};

export type LeaderRow = {
  device_id: string;
  points: number;
  correct: number;
  total_ms: number;
};

/**
 * Today's five, in slot order. Empty array means no issue was built.
 *
 * The issue is built by whoever opens the quest first that day. There is no
 * scheduler on the project, and the version of this that relied on someone
 * running build_quiz_day() by hand posted exactly one issue and then left the
 * home screen advertising an empty quest for twelve days. ensure_quiz_day() is
 * idempotent and returns 0 for everyone after the first, so the cost of this
 * is one cheap call per open.
 *
 * A failure here is not fatal: if the issue already exists the read below
 * still finds it.
 */
export async function fetchTodaysQuiz(): Promise<QuizQuestion[]> {
  try {
    await supabase.rpc('ensure_quiz_day');
  } catch (_) {}

  const { data, error } = await supabase
    .from('quiz_today')
    .select('*')
    .order('slot', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as QuizQuestion[];
}

/** Which slots this device has already spent today. */
export async function fetchMyAnswers(deviceId: string): Promise<QuizAnswerRow[]> {
  const today = new Date().toISOString().slice(0, 10);
  const { data, error } = await supabase
    .from('quiz_answers')
    .select('slot, correct, points, orb_awarded, ms')
    .eq('device_id', deviceId)
    .eq('quiz_date', today)
    .order('slot', { ascending: true });
  if (error) throw new Error(error.message);
  return (data ?? []) as QuizAnswerRow[];
}

/**
 * Commit an answer. `choice` is null when the player ran out of time or left
 * the app mid-question — both forfeit the slot.
 *
 * The server refuses a second answer for the same slot, so a wrong guess
 * cannot be walked back after looking the answer up.
 */
export async function submitAnswer(
  deviceId: string,
  slot: number,
  choice: number | null,
  ms: number,
): Promise<QuizVerdict> {
  const { data, error } = await supabase.rpc('submit_quiz_answer', {
    p_device_id: deviceId,
    p_slot: slot,
    p_choice: choice,
    p_ms: Math.round(ms),
  });
  if (error) throw new Error(error.message);
  const v = data as QuizVerdict & { error?: string };
  if (v?.error) throw new Error(v.error);
  return v;
}

export async function fetchLeaderboard(limit = 20): Promise<LeaderRow[]> {
  const { data, error } = await supabase
    .from('quiz_leaderboard_today')
    .select('*')
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as LeaderRow[];
}

/**
 * Forfeit the question if the app goes to the background.
 *
 * This is the cheapest and strongest of the anti-lookup measures: a ten second
 * timer already makes searching hard, and this makes leaving to search cost
 * you the question outright. Returns an unsubscribe function.
 */
export function forfeitOnBackground(onLeave: () => void): () => void {
  const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
    if (s !== 'active') onLeave();
  });
  return () => sub.remove();
}

/** Points a correct answer is worth at `ms`. Mirrors quiz_points() in SQL. */
export function pointsFor(correct: boolean, ms: number): number {
  if (!correct) return 0;
  const clamped = Math.max(0, Math.min(ms, QUESTION_MS));
  return 100 + Math.round((100 * (QUESTION_MS - clamped)) / QUESTION_MS);
}

export function difficultyName(d: number): string {
  return d === 3 ? 'HARD' : d === 2 ? 'MEDIUM' : 'EASY';
}

export function difficultyColor(d: number): string {
  return d === 3 ? '#f472b6' : d === 2 ? '#fbbf24' : '#22d3ee';
}

/** True once every slot in the issue has been spent. */
export function isDayComplete(answers: QuizAnswerRow[]): boolean {
  return answers.length >= DAILY_SLOTS;
}

export function totalPoints(answers: QuizAnswerRow[]): number {
  return answers.reduce((n, a) => n + a.points, 0);
}

export function totalCorrect(answers: QuizAnswerRow[]): number {
  return answers.reduce((n, a) => n + (a.correct ? 1 : 0), 0);
}

/** Seconds until the next issue, for the "come back tomorrow" line. */
export function secondsUntilTomorrow(): number {
  const now = new Date();
  const midnight = new Date(now);
  midnight.setHours(24, 0, 0, 0);
  return Math.max(0, Math.floor((midnight.getTime() - now.getTime()) / 1000));
}
