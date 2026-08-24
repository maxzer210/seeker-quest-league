/**
 * Solana Quest — the daily quiz.
 *
 * Five questions, ten seconds each, one attempt. The screen is deliberately
 * the calmest thing in the app: one question at a time, a draining ring, and
 * nothing else competing for attention while the clock runs.
 *
 * Nothing here knows the right answer until the server says so — see
 * lib/quiz.ts and supabase-quiz.sql.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator, Animated, Easing, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Q from '../lib/quiz';

type Props = {
  deviceId: string;
  onEarnOrb: (n: number) => void;
  onPlaySound?: (s: 'tap' | 'crit' | 'jackpot' | 'levelup' | 'dead') => void;
  onExit: () => void;
};

type Phase = 'loading' | 'intro' | 'question' | 'verdict' | 'done' | 'empty' | 'error';

export default function SolanaQuest({ deviceId, onEarnOrb, onPlaySound, onExit }: Props) {
  const [phase, setPhase]       = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Q.QuizQuestion[]>([]);
  const [answers, setAnswers]   = useState<Q.QuizAnswerRow[]>([]);
  const [index, setIndex]       = useState(0);
  const [verdict, setVerdict]   = useState<Q.QuizVerdict | null>(null);
  const [picked, setPicked]     = useState<number | null>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [msLeft, setMsLeft]     = useState(Q.QUESTION_MS);

  // Guards against double-submitting one slot from timer + tap + backgrounding.
  const submitting = useRef(false);
  const startedAt  = useRef(0);
  const ring       = useRef(new Animated.Value(1)).current;
  const cardIn     = useRef(new Animated.Value(0)).current;

  // ── load ──
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [qs, mine] = await Promise.all([
          Q.fetchTodaysQuiz(),
          Q.fetchMyAnswers(deviceId),
        ]);
        if (!alive) return;
        setQuestions(qs);
        setAnswers(mine);
        if (qs.length === 0) { setPhase('empty'); return; }
        if (Q.isDayComplete(mine)) { setPhase('done'); return; }
        setIndex(mine.length);
        setPhase('intro');
      } catch (e: any) {
        if (!alive) return;
        setErrorMsg(e?.message ?? 'Could not load today’s quest.');
        setPhase('error');
      }
    })();
    return () => { alive = false; };
  }, [deviceId]);

  const current = questions[index];

  // ── commit an answer (tap, timeout, or leaving the app) ──
  const commit = useCallback(async (choice: number | null) => {
    if (submitting.current || !current) return;
    submitting.current = true;
    const ms = Date.now() - startedAt.current;
    setPicked(choice);
    try {
      const v = await Q.submitAnswer(deviceId, current.slot, choice, ms);
      setVerdict(v);
      if (v.orb > 0) onEarnOrb(v.orb);
      onPlaySound?.(v.correct ? 'crit' : 'dead');
      setAnswers(a => [...a, {
        slot: current.slot, correct: v.correct, points: v.points,
        orb_awarded: v.orb, ms,
      }]);
      setPhase('verdict');
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Could not submit that answer.');
      setPhase('error');
    }
  }, [current, deviceId, onEarnOrb, onPlaySound]);

  // ── the running question: timer, ring, and the background forfeit ──
  useEffect(() => {
    if (phase !== 'question' || !current) return;
    submitting.current = false;
    setPicked(null);
    startedAt.current = Date.now();
    setMsLeft(Q.QUESTION_MS);

    ring.setValue(1);
    Animated.timing(ring, {
      toValue: 0,
      duration: Q.QUESTION_MS,
      easing: Easing.linear,
      useNativeDriver: false,
    }).start();

    cardIn.setValue(0);
    Animated.timing(cardIn, { toValue: 1, duration: 260, useNativeDriver: true }).start();

    const tick = setInterval(() => {
      const left = Q.QUESTION_MS - (Date.now() - startedAt.current);
      setMsLeft(Math.max(0, left));
      if (left <= 0) { clearInterval(tick); commit(null); }
    }, 100);

    // Leave the app mid-question and the question is gone. This is the part
    // that makes looking the answer up pointless rather than merely slow.
    const stop = Q.forfeitOnBackground(() => commit(null));

    return () => { clearInterval(tick); stop(); ring.stopAnimation(); };
  }, [phase, current, commit, ring, cardIn]);

  function next() {
    setVerdict(null);
    const n = index + 1;
    if (n >= questions.length) { setPhase('done'); onPlaySound?.('jackpot'); return; }
    setIndex(n);
    setPhase('question');
  }

  const secs = Math.ceil(msLeft / 1000);
  const urgent = msLeft <= 3000;

  // ══ chrome ══
  const Header = (
    <View style={s.header}>
      <TouchableOpacity onPress={onExit} style={s.back} accessibilityLabel="Back">
        <Text style={s.backTxt}>‹</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.kicker}>· DAILY QUEST ·</Text>
        <Text style={s.title}>SOLANA QUEST</Text>
      </View>
      <View style={s.progressPill}>
        <Text style={s.progressTxt}>
          {Math.min(answers.length, Q.DAILY_SLOTS)}/{Q.DAILY_SLOTS}
        </Text>
      </View>
    </View>
  );

  if (phase === 'loading') {
    return (
      <View style={s.root}>
        {Header}
        <View style={s.center}><ActivityIndicator color="#14F195" size="large" /></View>
      </View>
    );
  }

  if (phase === 'error' || phase === 'empty') {
    const empty = phase === 'empty';
    return (
      <View style={s.root}>
        {Header}
        <View style={s.center}>
          <Text style={s.bigEmoji}>{empty ? '🌙' : '⚠️'}</Text>
          <Text style={s.emptyTitle}>{empty ? 'No quest today' : 'Something went wrong'}</Text>
          <Text style={s.emptyBody}>
            {empty
              ? 'Today’s five questions have not been posted yet. Check back shortly.'
              : errorMsg}
          </Text>
          <TouchableOpacity onPress={onExit} style={s.primaryBtn}>
            <Text style={s.primaryBtnTxt}>BACK</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // ══ intro ══
  if (phase === 'intro') {
    const left = Q.DAILY_SLOTS - answers.length;
    return (
      <View style={s.root}>
        {Header}
        <ScrollView contentContainerStyle={s.introWrap} showsVerticalScrollIndicator={false}>
          <LinearGradient colors={['#14F195', '#00C2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.crest}>
            <Text style={s.crestEmoji}>◎</Text>
          </LinearGradient>

          <Text style={s.introTitle}>
            {answers.length === 0 ? 'Five questions.\nTen seconds each.' : `${left} to go.`}
          </Text>
          <Text style={s.introBody}>
            Everyone gets the same five questions today. One attempt each — a
            wrong answer stands. Answer fast: most of your score is speed.
          </Text>

          <View style={s.ruleCard}>
            <Text style={s.ruleLine}>⏱  Ten seconds a question</Text>
            <Text style={s.ruleLine}>⚡  Faster answers score higher</Text>
            <Text style={s.ruleLine}>🚪  Leave the app and the question is lost</Text>
            <Text style={s.ruleLine}>🪙  +{Q.ORB_PER_CORRECT} ORB for every correct answer</Text>
          </View>

          <TouchableOpacity
            onPress={() => { setPhase('question'); onPlaySound?.('tap'); }}
            activeOpacity={0.85}
          >
            <LinearGradient colors={['#14F195', '#00C2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.startBtn}>
              <Text style={s.startTxt}>{answers.length === 0 ? 'BEGIN' : 'CONTINUE'}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ══ done ══
  if (phase === 'done') {
    const pts = Q.totalPoints(answers);
    const right = Q.totalCorrect(answers);
    const orb = answers.reduce((n, a) => n + a.orb_awarded, 0);
    return (
      <View style={s.root}>
        {Header}
        <ScrollView contentContainerStyle={s.introWrap} showsVerticalScrollIndicator={false}>
          <LinearGradient
            colors={right >= 4 ? ['#14F195', '#00C2FF'] : ['#7C3AED', '#EC4899']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.crest}
          >
            <Text style={s.crestEmoji}>{right >= 4 ? '★' : '◎'}</Text>
          </LinearGradient>

          <Text style={s.introTitle}>
            {right === 5 ? 'Flawless.' : right >= 3 ? 'Solid run.' : 'Tomorrow, then.'}
          </Text>

          <View style={s.scoreRow}>
            <View style={s.scoreCell}>
              <Text style={s.scoreVal}>{right}/{Q.DAILY_SLOTS}</Text>
              <Text style={s.scoreLbl}>CORRECT</Text>
            </View>
            <View style={s.scoreCell}>
              <Text style={[s.scoreVal, { color: '#14F195' }]}>{pts}</Text>
              <Text style={s.scoreLbl}>POINTS</Text>
            </View>
            <View style={s.scoreCell}>
              <Text style={[s.scoreVal, { color: '#FACC15' }]}>+{orb}</Text>
              <Text style={s.scoreLbl}>ORB</Text>
            </View>
          </View>

          <Text style={s.introBody}>
            A new set of five arrives at midnight. Come back and keep the streak
            alive.
          </Text>

          <TouchableOpacity onPress={onExit} activeOpacity={0.85}>
            <LinearGradient colors={['#14F195', '#00C2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.startBtn}>
              <Text style={s.startTxt}>DONE</Text>
            </LinearGradient>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }

  // ══ question / verdict ══
  if (!current) return <View style={s.root}>{Header}</View>;

  const showing = phase === 'verdict' && verdict;
  const barWidth = ring.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] });

  return (
    <View style={s.root}>
      {Header}

      <View style={s.metaRow}>
        <View style={[s.diffPill, { borderColor: Q.difficultyColor(current.difficulty) }]}>
          <Text style={[s.diffTxt, { color: Q.difficultyColor(current.difficulty) }]}>
            {Q.difficultyName(current.difficulty)}
          </Text>
        </View>
        <Text style={s.category}>{current.category.toUpperCase()}</Text>
        {current.sponsor ? <Text style={s.sponsor}>by {current.sponsor}</Text> : null}
      </View>

      {/* The clock. Drains left to right, turns red at three seconds. */}
      {!showing && (
        <View style={s.timerWrap}>
          <View style={s.timerTrack}>
            <Animated.View
              style={[s.timerFill, { width: barWidth, backgroundColor: urgent ? '#EF4444' : '#14F195' }]}
            />
          </View>
          <Text style={[s.timerTxt, urgent && { color: '#EF4444' }]}>{secs}s</Text>
        </View>
      )}

      <ScrollView contentContainerStyle={s.qWrap} showsVerticalScrollIndicator={false}>
        <Animated.View style={{ opacity: cardIn, transform: [{ translateY: cardIn.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }}>
          <Text style={s.question}>{current.question}</Text>
        </Animated.View>

        {current.options.map((opt, i) => {
          const isPicked  = picked === i;
          const isRight   = showing && verdict!.correct_index === i;
          const isWrong   = showing && isPicked && !verdict!.correct;
          return (
            <TouchableOpacity
              key={i}
              disabled={phase !== 'question'}
              activeOpacity={0.85}
              onPress={() => commit(i)}
              style={[
                s.option,
                isPicked && !showing && s.optionPicked,
                isRight && s.optionRight,
                isWrong && s.optionWrong,
              ]}
            >
              <View style={[s.optionKey, isRight && s.optionKeyRight, isWrong && s.optionKeyWrong]}>
                <Text style={s.optionKeyTxt}>{String.fromCharCode(65 + i)}</Text>
              </View>
              <Text style={[s.optionTxt, (isRight || isWrong) && { color: '#fff' }]}>{opt}</Text>
              {isRight && <Text style={s.mark}>✓</Text>}
              {isWrong && <Text style={s.mark}>✕</Text>}
            </TouchableOpacity>
          );
        })}

        {showing && (
          <View style={s.verdictCard}>
            <Text style={[s.verdictTitle, { color: verdict!.correct ? '#14F195' : '#f472b6' }]}>
              {verdict!.correct
                ? `Correct  ·  +${verdict!.points} pts  ·  +${verdict!.orb} ORB`
                : picked === null ? 'Out of time' : 'Not quite'}
            </Text>
            <Text style={s.verdictBody}>{verdict!.explanation}</Text>
            <TouchableOpacity onPress={next} activeOpacity={0.85}>
              <LinearGradient colors={['#14F195', '#00C2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.nextBtn}>
                <Text style={s.nextTxt}>
                  {index + 1 >= questions.length ? 'SEE RESULTS' : 'NEXT QUESTION'}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  root:   { flex: 1, backgroundColor: '#020510' },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 28 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 52,
            paddingHorizontal: 18, paddingBottom: 14 },
  back:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(20,241,149,0.10)', borderWidth: 1, borderColor: 'rgba(20,241,149,0.35)' },
  backTxt:{ color: '#14F195', fontSize: 24, fontWeight: '800', marginTop: -3 },
  kicker: { color: '#14F195', fontSize: 9, fontWeight: '900', letterSpacing: 3 },
  title:  { color: '#F5F3FF', fontSize: 19, fontWeight: '900', letterSpacing: 2 },
  progressPill: { paddingHorizontal: 11, paddingVertical: 6, borderRadius: 12,
            backgroundColor: 'rgba(8,13,30,0.9)', borderWidth: 1, borderColor: 'rgba(20,241,149,0.4)' },
  progressTxt:  { color: '#14F195', fontSize: 13, fontWeight: '900' },

  introWrap: { alignItems: 'center', paddingHorizontal: 26, paddingTop: 18, paddingBottom: 40 },
  crest:     { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
               marginBottom: 20, shadowColor: '#14F195', shadowRadius: 22, shadowOpacity: 0.6, elevation: 12 },
  crestEmoji:{ fontSize: 44, color: '#02120C', fontWeight: '900' },
  introTitle:{ color: '#F5F3FF', fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 33 },
  introBody: { color: '#8b93b8', fontSize: 13.5, fontWeight: '600', textAlign: 'center',
               marginTop: 12, lineHeight: 20 },

  ruleCard:  { alignSelf: 'stretch', marginTop: 22, gap: 10, backgroundColor: 'rgba(8,13,30,0.8)',
               borderRadius: 18, padding: 18, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  ruleLine:  { color: '#c7cbe4', fontSize: 13.5, fontWeight: '700' },

  startBtn:  { marginTop: 26, paddingVertical: 15, paddingHorizontal: 56, borderRadius: 20 },
  startTxt:  { color: '#02120C', fontSize: 15, fontWeight: '900', letterSpacing: 2 },

  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, marginBottom: 10 },
  diffPill:  { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  diffTxt:   { fontSize: 9.5, fontWeight: '900', letterSpacing: 1.4 },
  category:  { color: '#5c6488', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  sponsor:   { color: '#14F195', fontSize: 10, fontWeight: '800', marginLeft: 'auto' },

  timerWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, marginBottom: 16 },
  timerTrack:{ flex: 1, height: 6, borderRadius: 3, overflow: 'hidden', backgroundColor: 'rgba(255,255,255,0.08)' },
  timerFill: { height: '100%', borderRadius: 3 },
  timerTxt:  { color: '#14F195', fontSize: 13, fontWeight: '900', width: 30, textAlign: 'right' },

  qWrap:     { paddingHorizontal: 20, paddingBottom: 44 },
  question:  { color: '#F5F3FF', fontSize: 20, fontWeight: '800', lineHeight: 28, marginBottom: 22 },

  option:    { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: 'rgba(8,13,30,0.9)',
               borderRadius: 16, paddingVertical: 15, paddingHorizontal: 15, marginBottom: 11,
               borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.28)' },
  optionPicked: { borderColor: 'rgba(20,241,149,0.7)' },
  optionRight:  { borderColor: '#14F195', backgroundColor: 'rgba(20,241,149,0.14)' },
  optionWrong:  { borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.12)' },
  optionKey:    { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(124,58,237,0.22)' },
  optionKeyRight:{ backgroundColor: '#14F195' },
  optionKeyWrong:{ backgroundColor: '#f472b6' },
  optionKeyTxt: { color: '#F5F3FF', fontSize: 13, fontWeight: '900' },
  optionTxt:    { flex: 1, color: '#c7cbe4', fontSize: 14.5, fontWeight: '700', lineHeight: 20 },
  mark:         { color: '#fff', fontSize: 17, fontWeight: '900' },

  verdictCard:  { marginTop: 8, backgroundColor: 'rgba(8,13,30,0.92)', borderRadius: 18, padding: 18,
                  borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)' },
  verdictTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  verdictBody:  { color: '#a8afd0', fontSize: 13.5, fontWeight: '600', lineHeight: 20, marginTop: 9 },
  nextBtn:      { marginTop: 16, paddingVertical: 13, borderRadius: 15, alignItems: 'center' },
  nextTxt:      { color: '#02120C', fontSize: 13.5, fontWeight: '900', letterSpacing: 1.6 },

  scoreRow:  { flexDirection: 'row', alignSelf: 'stretch', marginTop: 22, marginBottom: 4 },
  scoreCell: { flex: 1, alignItems: 'center' },
  scoreVal:  { color: '#F5F3FF', fontSize: 24, fontWeight: '900' },
  scoreLbl:  { color: '#5c6488', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 3 },

  bigEmoji:  { fontSize: 46, marginBottom: 14 },
  emptyTitle:{ color: '#F5F3FF', fontSize: 19, fontWeight: '900', textAlign: 'center' },
  emptyBody: { color: '#8b93b8', fontSize: 13.5, fontWeight: '600', textAlign: 'center',
               marginTop: 10, lineHeight: 20 },
  primaryBtn:{ marginTop: 24, paddingVertical: 13, paddingHorizontal: 40, borderRadius: 16,
               borderWidth: 1.5, borderColor: 'rgba(20,241,149,0.5)' },
  primaryBtnTxt: { color: '#14F195', fontSize: 13.5, fontWeight: '900', letterSpacing: 1.6 },
});
