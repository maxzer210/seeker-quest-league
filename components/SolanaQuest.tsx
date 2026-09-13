/**
 * Solana Quest — the daily quiz.
 *
 * Five questions, ten seconds each, one attempt. The screen stays the calmest
 * thing in the app: one question at a time and nothing competing with the
 * clock. Everything decorative sits behind the content and never moves fast
 * enough to pull the eye off the question.
 *
 * Motion discipline, same as the Labyrinth chrome: Skia draws, Animated moves,
 * and every Animated value here runs on the native driver. The one thing that
 * ticks in JS is the countdown ring, and it is isolated in its own memoised
 * component so a 30fps redraw of one arc never re-renders the answer buttons.
 *
 * Nothing here knows the right answer until the server says so — see
 * lib/quiz.ts and supabase-quiz.sql.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, Easing, ScrollView, StyleSheet, Text,
  TouchableOpacity, View,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import LottieView from 'lottie-react-native';
import {
  Canvas, Picture, Skia, createPicture, PaintStyle, StrokeCap,
} from '@shopify/react-native-skia';
import * as Q from '../lib/quiz';

type Props = {
  deviceId: string;
  onEarnOrb: (n: number) => void;
  onPlaySound?: (s: 'tap' | 'crit' | 'jackpot' | 'levelup' | 'dead') => void;
  onExit: () => void;
};

type Phase = 'loading' | 'intro' | 'question' | 'verdict' | 'done' | 'empty' | 'error';

// Solana's own palette, used straight rather than tinted — this is the one
// screen in the app that is explicitly about Solana.
const GREEN  = '#14F195';
const PURPLE = '#9945FF';
const CYAN   = '#00C2FF';
const AMBER  = '#FFC53D';
const ROSE   = '#FF4D6D';

// ── the countdown ring ──────────────────────────────────────────────────────
// Owns its own clock so the parent does not re-render while it drains. The
// picture is a track arc, a wide soft arc for the glow, and the crisp arc on
// top — three drawArc calls, cheap enough to record thirty times a second.

const RING_BOX = 128;
const RING_PAD = 14;
const RING_D   = RING_BOX - RING_PAD * 2;
const RING_W   = 9;

const RingTimer = React.memo(function RingTimer({
  startTs, duration,
}: { startTs: number; duration: number }) {
  const [left, setLeft] = useState(duration);

  useEffect(() => {
    setLeft(duration);
    const id = setInterval(() => {
      setLeft(Math.max(0, duration - (Date.now() - startTs)));
    }, 33);
    return () => clearInterval(id);
  }, [startTs, duration]);

  const p      = Math.max(0, Math.min(1, left / duration));
  const secs   = Math.ceil(left / 1000);
  const urgent = left <= 3000;
  const color  = urgent ? ROSE : p > 0.45 ? GREEN : AMBER;

  const pic = useMemo(() => createPicture((canvas) => {
    const oval = Skia.XYWHRect(RING_PAD, RING_PAD, RING_D, RING_D);

    const track = Skia.Paint();
    track.setStyle(PaintStyle.Stroke);
    track.setStrokeWidth(RING_W);
    track.setStrokeCap(StrokeCap.Round);
    track.setColor(Skia.Color('#FFFFFF14'));
    track.setAntiAlias(true);
    canvas.drawArc(oval, 0, 360, false, track);

    if (p <= 0) return;
    const sweep = -360 * p;      // anticlockwise, so the ring unwinds

    // Glow first: same arc, much wider and faint. Cheaper and more predictable
    // across Skia versions than a mask filter, and reads the same on screen.
    const glow = Skia.Paint();
    glow.setStyle(PaintStyle.Stroke);
    glow.setStrokeWidth(RING_W * 2.6);
    glow.setStrokeCap(StrokeCap.Round);
    glow.setColor(Skia.Color(color + '33'));
    glow.setAntiAlias(true);
    canvas.drawArc(oval, -90, sweep, false, glow);

    const arc = Skia.Paint();
    arc.setStyle(PaintStyle.Stroke);
    arc.setStrokeWidth(RING_W);
    arc.setStrokeCap(StrokeCap.Round);
    arc.setColor(Skia.Color(color));
    arc.setAntiAlias(true);
    canvas.drawArc(oval, -90, sweep, false, arc);
  }, { x: 0, y: 0, width: RING_BOX, height: RING_BOX }), [p, color]);

  return (
    <View style={s.ringBox}>
      <Canvas style={StyleSheet.absoluteFill}>
        <Picture picture={pic} />
      </Canvas>
      <Text style={[s.ringNum, { color }]}>{secs}</Text>
      <Text style={s.ringUnit}>SEC</Text>
    </View>
  );
});

// ── drawn glyphs ────────────────────────────────────────────────────────────
// The rule list used OS emoji. On this device the clock came out as a hairline
// outline and the door as a brown slab — they are drawn by the system font, so
// they answer to nobody and look different on every phone. The Labyrinth chrome
// already refuses to render OS emoji for that reason; this screen now follows.
// Four tiny static pictures, recorded once per (name, size, colour).

type GlyphName = 'clock' | 'bolt' | 'door' | 'coin';

const Glyph = React.memo(function Glyph({
  name, size = 19, color = GREEN,
}: { name: GlyphName; size?: number; color?: string }) {
  const pic = useMemo(() => createPicture((canvas) => {
    const s = size;
    const line = Skia.Paint();
    line.setStyle(PaintStyle.Stroke);
    line.setStrokeWidth(Math.max(1.35, s * 0.088));
    line.setStrokeCap(StrokeCap.Round);
    line.setColor(Skia.Color(color));
    line.setAntiAlias(true);

    const solid = Skia.Paint();
    solid.setColor(Skia.Color(color));
    solid.setAntiAlias(true);

    if (name === 'clock') {
      canvas.drawCircle(s / 2, s / 2, s * 0.37, line);
      const hands = Skia.Path.Make();
      hands.moveTo(s / 2, s * 0.30);
      hands.lineTo(s / 2, s * 0.52);
      hands.lineTo(s * 0.70, s * 0.60);
      canvas.drawPath(hands, line);
    } else if (name === 'bolt') {
      const p = Skia.Path.Make();
      p.moveTo(s * 0.58, s * 0.06);
      p.lineTo(s * 0.24, s * 0.56);
      p.lineTo(s * 0.45, s * 0.56);
      p.lineTo(s * 0.40, s * 0.94);
      p.lineTo(s * 0.76, s * 0.42);
      p.lineTo(s * 0.53, s * 0.42);
      p.close();
      canvas.drawPath(p, solid);
    } else if (name === 'door') {
      canvas.drawRRect(
        Skia.RRectXY(Skia.XYWHRect(s * 0.25, s * 0.10, s * 0.50, s * 0.80), s * 0.07, s * 0.07),
        line,
      );
      canvas.drawCircle(s * 0.63, s * 0.52, s * 0.055, solid);
    } else {
      canvas.drawCircle(s / 2, s / 2, s * 0.37, line);
      canvas.drawCircle(s / 2, s / 2, s * 0.14, solid);
    }
  }, { x: 0, y: 0, width: size, height: size }), [name, size, color]);

  return (
    <Canvas style={{ width: size, height: size }}>
      <Picture picture={pic} />
    </Canvas>
  );
});

// ── when the next set arrives ───────────────────────────────────────────────
// The done screen used to say "a new set arrives at midnight". The set rolls
// over at midnight UTC — the server builds it on current_date — which for a
// player on UTC+4 is four in the morning, and for someone in New York is eight
// the evening before. A countdown is true in every time zone, and "back in 3h
// 12m" is a better reason to return than a vague "tomorrow".

function msToNextUtcMidnight(): number {
  const now = new Date();
  // Date.UTC normalises day overflow, so the last day of a month rolls correctly.
  const next = Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1);
  return next - now.getTime();
}

const NextSetIn = React.memo(function NextSetIn() {
  const [ms, setMs] = useState(msToNextUtcMidnight);

  useEffect(() => {
    // Minutes are the finest unit shown, so a slow tick is enough.
    const id = setInterval(() => setMs(msToNextUtcMidnight()), 30000);
    return () => clearInterval(id);
  }, []);

  const h = Math.floor(ms / 3_600_000);
  const m = Math.max(1, Math.ceil((ms % 3_600_000) / 60_000));
  const when = h > 0 ? `${h}h ${m}m` : `${m}m`;

  return (
    <Text style={s.introBody}>
      A new set of five arrives in {when}. Come back and keep the streak alive.
    </Text>
  );
});

// ── drifting aurora behind everything ───────────────────────────────────────
// Three slow blobs on the native driver. Long, unequal periods so they never
// visibly loop.

function Aurora() {
  const a = useRef(new Animated.Value(0)).current;
  const b = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const drift = (v: Animated.Value, ms: number) =>
      Animated.loop(Animated.sequence([
        Animated.timing(v, { toValue: 1, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(v, { toValue: 0, duration: ms, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ]));
    const la = drift(a, 9000);
    const lb = drift(b, 13000);
    la.start(); lb.start();
    return () => { la.stop(); lb.stop(); };
  }, [a, b]);

  return (
    <View pointerEvents="none" style={StyleSheet.absoluteFill}>
      <Animated.View style={[s.blob, s.blobA, {
        transform: [
          { translateY: a.interpolate({ inputRange: [0, 1], outputRange: [-24, 26] }) },
          { scale:      a.interpolate({ inputRange: [0, 1], outputRange: [1, 1.14] }) },
        ],
      }]}>
        <LinearGradient colors={[GREEN + '2E', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={[s.blob, s.blobB, {
        transform: [
          { translateX: b.interpolate({ inputRange: [0, 1], outputRange: [22, -22] }) },
          { scale:      b.interpolate({ inputRange: [0, 1], outputRange: [1.1, 0.94] }) },
        ],
      }]}>
        <LinearGradient colors={[PURPLE + '33', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>

      <Animated.View style={[s.blob, s.blobC, {
        opacity: b.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0.95] }),
      }]}>
        <LinearGradient colors={[CYAN + '22', 'transparent']} style={StyleSheet.absoluteFill} />
      </Animated.View>
    </View>
  );
}

export default function SolanaQuest({ deviceId, onEarnOrb, onPlaySound, onExit }: Props) {
  const [phase, setPhase]         = useState<Phase>('loading');
  const [questions, setQuestions] = useState<Q.QuizQuestion[]>([]);
  const [answers, setAnswers]     = useState<Q.QuizAnswerRow[]>([]);
  const [index, setIndex]         = useState(0);
  const [verdict, setVerdict]     = useState<Q.QuizVerdict | null>(null);
  const [picked, setPicked]       = useState<number | null>(null);
  const [errorMsg, setErrorMsg]   = useState('');
  // Drives the ring. A new value restarts it; the ref below stays the source
  // of truth for how long the answer actually took.
  const [startTs, setStartTs]     = useState(0);
  // Where the run landed among everyone who played today. Fetched only once the
  // day is over — mid-run it would be a number that changes under the player.
  const [rank, setRank]           = useState<number | null>(null);
  const [fieldSize, setFieldSize] = useState(0);

  // The app draws edge to edge, so the gesture bar sits on top of the bottom of
  // every screen. Without this the DONE button was half hidden under it.
  const insets = useSafeAreaInsets();

  // Guards against double-submitting one slot from timer + tap + backgrounding.
  const submitting = useRef(false);
  const startedAt  = useRef(0);
  const cardIn     = useRef(new Animated.Value(0)).current;
  const shake      = useRef(new Animated.Value(0)).current;
  const rightPulse = useRef(new Animated.Value(0)).current;

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

  // ── standing for the day, once the run is finished ──
  useEffect(() => {
    if (phase !== 'done') return;
    let alive = true;
    Q.fetchLeaderboard(200)
      .then(rows => {
        if (!alive) return;
        const i = rows.findIndex(r => r.device_id === deviceId);
        setRank(i >= 0 ? i + 1 : null);
        setFieldSize(rows.length);
      })
      .catch(() => {});
    return () => { alive = false; };
  }, [phase, deviceId]);

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

      if (v.correct) {
        rightPulse.setValue(0);
        Animated.timing(rightPulse, {
          toValue: 1, duration: 520, easing: Easing.out(Easing.cubic), useNativeDriver: true,
        }).start();
      } else {
        shake.setValue(0);
        Animated.timing(shake, {
          toValue: 1, duration: 380, easing: Easing.linear, useNativeDriver: true,
        }).start();
      }
    } catch (e: any) {
      setErrorMsg(e?.message ?? 'Could not submit that answer.');
      setPhase('error');
    }
  }, [current, deviceId, onEarnOrb, onPlaySound, rightPulse, shake]);

  // `commit` is rebuilt on every render of the parent, because onEarnOrb and
  // onPlaySound are inline arrows there. The effect below must not depend on
  // it: App re-renders once a second on the energy tick, and a dependency on
  // commit restarted the question every time — the clock fell to 9, jumped
  // back to 10, and the deadline never arrived, so the question never ended.
  // Reading it through a ref keeps the effect keyed to the slot alone.
  const commitRef = useRef(commit);
  useEffect(() => { commitRef.current = commit; });

  // ── the running question: clock, entrance, and the background forfeit ──
  // Keyed on the slot, not on `current` or `commit`: a primitive that changes
  // exactly once per question and nothing else.
  useEffect(() => {
    if (phase !== 'question' || !current) return;
    submitting.current = false;
    setPicked(null);
    const now = Date.now();
    startedAt.current = now;
    setStartTs(now);

    cardIn.setValue(0);
    Animated.timing(cardIn, { toValue: 1, duration: 300, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();

    // Display ticks live in RingTimer. This one only enforces the deadline, so
    // it can stay slow and cost the parent nothing.
    const tick = setInterval(() => {
      if (Date.now() - startedAt.current >= Q.QUESTION_MS) {
        clearInterval(tick);
        commitRef.current(null);
      }
    }, 120);

    // Leave the app mid-question and the question is gone. This is the part
    // that makes looking the answer up pointless rather than merely slow.
    const stop = Q.forfeitOnBackground(() => commitRef.current(null));

    return () => { clearInterval(tick); stop(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, current?.slot, cardIn]);

  function next() {
    setVerdict(null);
    const n = index + 1;
    if (n >= questions.length) { setPhase('done'); onPlaySound?.('jackpot'); return; }
    setIndex(n);
    setPhase('question');
  }

  // ══ chrome ══
  // Five dots instead of "2/5": the shape of the run so far, readable at a
  // glance without doing arithmetic.
  const Dots = (
    <View style={s.dots}>
      {Array.from({ length: Q.DAILY_SLOTS }).map((_, i) => {
        const a = answers[i];
        const isNow = i === answers.length && phase !== 'done';
        return (
          <View
            key={i}
            style={[
              s.dot,
              a && (a.correct ? s.dotRight : s.dotWrong),
              isNow && s.dotNow,
            ]}
          />
        );
      })}
    </View>
  );

  const Header = (
    <View style={s.header}>
      <TouchableOpacity onPress={onExit} style={s.back} accessibilityLabel="Back">
        <Text style={s.backTxt}>‹</Text>
      </TouchableOpacity>
      <View style={{ flex: 1 }}>
        <Text style={s.kicker}>· DAILY QUEST ·</Text>
        <Text style={s.title}>SOLANA QUEST</Text>
      </View>
      {Dots}
    </View>
  );

  if (phase === 'loading') {
    return (
      <View style={s.root}>
        <Aurora />
        {Header}
        <View style={s.center}>
          <LottieView
            source={require('../assets/lottie/quest-loading.json')}
            autoPlay
            loop
            style={{ width: 120, height: 120 }}
          />
        </View>
      </View>
    );
  }

  if (phase === 'error' || phase === 'empty') {
    const empty = phase === 'empty';
    return (
      <View style={s.root}>
        <Aurora />
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
        <Aurora />
        {Header}
        <ScrollView contentContainerStyle={[s.introWrap, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          <View style={s.crestHalo}>
            <LinearGradient colors={[GREEN, CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.crest}>
              <Text style={s.crestEmoji}>◎</Text>
            </LinearGradient>
          </View>

          <Text style={s.introTitle}>
            {answers.length === 0 ? 'Five questions.\nTen seconds each.' : `${left} to go.`}
          </Text>
          <Text style={s.introBody}>
            Everyone gets the same five questions today. One attempt each — a
            wrong answer stands. Answer fast: most of your score is speed.
          </Text>

          <View style={s.ruleCard}>
            {([
              ['clock', 'Ten seconds a question',                      GREEN],
              ['bolt',  'Faster answers score higher',                 AMBER],
              ['door',  'Leave the app and the question is lost',      ROSE],
              ['coin',  `+${Q.ORB_PER_CORRECT} ORB for every correct answer`, '#FACC15'],
            ] as [GlyphName, string, string][]).map(([g, text, tint], i) => (
              <React.Fragment key={g}>
                {i > 0 && <View style={s.ruleSep} />}
                <View style={s.ruleRow}>
                  <View style={s.ruleIcon}><Glyph name={g} color={tint} /></View>
                  <Text style={s.ruleLine}>{text}</Text>
                </View>
              </React.Fragment>
            ))}
          </View>

          <TouchableOpacity
            onPress={() => { setPhase('question'); onPlaySound?.('tap'); }}
            activeOpacity={0.85}
          >
            <LinearGradient colors={[GREEN, CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.startBtn}>
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
    const great = right >= 4;
    return (
      <View style={s.root}>
        <Aurora />
        {Header}
        <ScrollView contentContainerStyle={[s.introWrap, { paddingBottom: 40 + insets.bottom }]} showsVerticalScrollIndicator={false}>
          <View style={[s.crestHalo, !great && s.crestHaloAlt]}>
            <LinearGradient
              colors={great ? [GREEN, CYAN] : [PURPLE, '#EC4899']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={s.crest}
            >
              <Text style={s.crestEmoji}>{great ? '★' : '◎'}</Text>
            </LinearGradient>
          </View>

          <Text style={s.introTitle}>
            {right === 5 ? 'Flawless.' : right >= 3 ? 'Solid run.' : 'Tomorrow, then.'}
          </Text>

          <View style={s.scoreRow}>
            <View style={s.scoreCell}>
              <Text style={s.scoreVal}>{right}/{Q.DAILY_SLOTS}</Text>
              <Text style={s.scoreLbl}>CORRECT</Text>
            </View>
            <View style={s.scoreDivider} />
            <View style={s.scoreCell}>
              <Text style={[s.scoreVal, { color: GREEN }]}>{pts}</Text>
              <Text style={s.scoreLbl}>POINTS</Text>
            </View>
            <View style={s.scoreDivider} />
            <View style={s.scoreCell}>
              <Text style={[s.scoreVal, { color: '#FACC15' }]}>+{orb}</Text>
              <Text style={s.scoreLbl}>ORB</Text>
            </View>
          </View>

          {/* Only a real standing. "#1 of 1 player today" at zero points read as
              a hollow brag — a rank means nothing without anyone to rank
              against or any score to rank by. */}
          {rank !== null && fieldSize > 1 && pts > 0 && (
            <View style={s.rankStrip}>
              <Text style={s.rankPlace}>#{rank}</Text>
              <Text style={s.rankOf}>
                of {fieldSize} {fieldSize === 1 ? 'player' : 'players'} today
              </Text>
            </View>
          )}

          {/* Which five they were, and how each one went. Without this the
              screen is three numbers and no memory of the run. */}
          <View style={s.recap}>
            {answers.map(a => {
              const q = questions.find(x => x.slot === a.slot);
              return (
                <View key={a.slot} style={s.recapRow}>
                  <View style={[s.recapDot, a.correct ? s.recapDotOk : s.recapDotNo]}>
                    <Text style={s.recapMark}>{a.correct ? '✓' : '✕'}</Text>
                  </View>
                  <Text style={s.recapQ} numberOfLines={2}>
                    {q ? q.question : `Question ${a.slot}`}
                  </Text>
                  <Text style={[s.recapPts, { color: a.correct ? GREEN : '#3f4661' }]}>
                    {a.correct ? `+${a.points}` : '0'}
                  </Text>
                </View>
              );
            })}
          </View>

          <NextSetIn />

          <TouchableOpacity onPress={onExit} activeOpacity={0.85}>
            <LinearGradient colors={[GREEN, CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.startBtn}>
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

  const shakeX = shake.interpolate({
    inputRange:  [0, 0.2, 0.4, 0.6, 0.8, 1],
    outputRange: [0, -9, 9, -6, 4, 0],
  });

  return (
    <View style={s.root}>
      <Aurora />
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

      <ScrollView contentContainerStyle={[s.qWrap, { paddingBottom: 44 + insets.bottom }]} showsVerticalScrollIndicator={false}>
        {/* The clock. Gone the moment the answer lands — nothing to read into
            a number that has stopped meaning anything. */}
        {!showing && (
          <View style={s.ringWrap}>
            <RingTimer startTs={startTs} duration={Q.QUESTION_MS} />
          </View>
        )}

        <Animated.View style={{
          opacity: cardIn,
          transform: [
            { translateY: cardIn.interpolate({ inputRange: [0, 1], outputRange: [16, 0] }) },
            { translateX: shakeX },
          ],
        }}>
          {/* The difficulty already has a pill above; the rule repeats it where
              the eye actually lands, so the tier reads without being read. */}
          <View style={s.questionWrap}>
            <View style={[s.questionBar, { backgroundColor: Q.difficultyColor(current.difficulty) }]} />
            <Text style={s.question}>{current.question}</Text>
          </View>

          {current.options.map((opt, i) => {
            const isPicked  = picked === i;
            const isRight   = showing && verdict!.correct_index === i;
            const isWrong   = showing && isPicked && !verdict!.correct;
            const dimmed    = showing && !isRight && !isWrong;
            return (
              <Animated.View
                key={i}
                style={isRight ? {
                  transform: [{
                    scale: rightPulse.interpolate({
                      inputRange: [0, 0.45, 1], outputRange: [1, 1.035, 1],
                    }),
                  }],
                } : undefined}
              >
                <TouchableOpacity
                  disabled={phase !== 'question'}
                  activeOpacity={0.85}
                  onPress={() => commit(i)}
                  style={[
                    s.option,
                    isPicked && !showing && s.optionPicked,
                    isRight && s.optionRight,
                    isWrong && s.optionWrong,
                    dimmed && s.optionDim,
                  ]}
                >
                  <View style={[s.optionKey, isRight && s.optionKeyRight, isWrong && s.optionKeyWrong]}>
                    <Text style={[s.optionKeyTxt, (isRight || isWrong) && { color: '#02120C' }]}>
                      {String.fromCharCode(65 + i)}
                    </Text>
                  </View>
                  <Text style={[s.optionTxt, (isRight || isWrong) && { color: '#fff' }]}>{opt}</Text>
                  {isRight && <Text style={s.mark}>✓</Text>}
                  {isWrong && <Text style={s.mark}>✕</Text>}
                </TouchableOpacity>
              </Animated.View>
            );
          })}
        </Animated.View>

        {showing && (
          <View style={[s.verdictCard, { borderColor: verdict!.correct ? GREEN + '55' : '#f472b655' }]}>
            <View style={s.verdictHead}>
              <View style={[s.verdictBadge, { backgroundColor: verdict!.correct ? GREEN : '#f472b6' }]}>
                <Text style={s.verdictBadgeTxt}>{verdict!.correct ? '✓' : '✕'}</Text>
              </View>
              <Text style={[s.verdictTitle, { color: verdict!.correct ? GREEN : '#f472b6' }]}>
                {verdict!.correct
                  ? `+${verdict!.points} pts  ·  +${verdict!.orb} ORB`
                  : picked === null ? 'Out of time' : 'Not quite'}
              </Text>
            </View>
            <Text style={s.verdictBody}>{verdict!.explanation}</Text>
            <TouchableOpacity onPress={next} activeOpacity={0.85}>
              <LinearGradient colors={[GREEN, CYAN]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.nextBtn}>
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

  // aurora
  blob:   { position: 'absolute', borderRadius: 400, overflow: 'hidden' },
  blobA:  { top: -110, left: -90,  width: 340, height: 340 },
  blobB:  { top: 190,  right: -130, width: 380, height: 380 },
  blobC:  { bottom: -140, left: -60, width: 400, height: 400 },

  header: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingTop: 52,
            paddingHorizontal: 18, paddingBottom: 14 },
  back:   { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center',
            backgroundColor: 'rgba(20,241,149,0.10)', borderWidth: 1, borderColor: 'rgba(20,241,149,0.35)' },
  backTxt:{ color: GREEN, fontSize: 24, fontWeight: '800', marginTop: -3 },
  kicker: { color: GREEN, fontSize: 9, fontWeight: '900', letterSpacing: 3 },
  title:  { color: '#F5F3FF', fontSize: 19, fontWeight: '900', letterSpacing: 2 },

  dots:     { flexDirection: 'row', gap: 6, alignItems: 'center' },
  dot:      { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.14)' },
  dotRight: { backgroundColor: GREEN },
  dotWrong: { backgroundColor: '#f472b6' },
  dotNow:   { width: 10, height: 10, borderRadius: 5, backgroundColor: 'transparent',
              borderWidth: 2, borderColor: '#F5F3FF' },

  introWrap: { alignItems: 'center', paddingHorizontal: 26, paddingTop: 18, paddingBottom: 40 },
  crestHalo: { width: 128, height: 128, borderRadius: 64, alignItems: 'center', justifyContent: 'center',
               marginBottom: 18, backgroundColor: 'rgba(20,241,149,0.10)',
               borderWidth: 1, borderColor: 'rgba(20,241,149,0.22)' },
  crestHaloAlt: { backgroundColor: 'rgba(153,69,255,0.12)', borderColor: 'rgba(153,69,255,0.28)' },
  crest:     { width: 96, height: 96, borderRadius: 48, alignItems: 'center', justifyContent: 'center',
               shadowColor: GREEN, shadowRadius: 22, shadowOpacity: 0.6, elevation: 12 },
  crestEmoji:{ fontSize: 44, color: '#02120C', fontWeight: '900' },
  introTitle:{ color: '#F5F3FF', fontSize: 26, fontWeight: '900', textAlign: 'center', lineHeight: 33 },
  introBody: { color: '#8b93b8', fontSize: 13.5, fontWeight: '600', textAlign: 'center',
               marginTop: 12, lineHeight: 20 },

  ruleCard:  { alignSelf: 'stretch', marginTop: 22, backgroundColor: 'rgba(8,13,30,0.82)',
               borderRadius: 18, paddingVertical: 6, paddingHorizontal: 16,
               borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  ruleRow:   { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 11 },
  ruleIcon:  { width: 22, alignItems: 'center', justifyContent: 'center' },
  ruleLine:  { flex: 1, color: '#c7cbe4', fontSize: 13.5, fontWeight: '700' },
  ruleSep:   { height: 1, backgroundColor: 'rgba(255,255,255,0.05)' },

  startBtn:  { marginTop: 26, paddingVertical: 15, paddingHorizontal: 56, borderRadius: 20 },
  startTxt:  { color: '#02120C', fontSize: 15, fontWeight: '900', letterSpacing: 2 },

  metaRow:   { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 20, marginBottom: 4 },
  diffPill:  { paddingHorizontal: 9, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  diffTxt:   { fontSize: 9.5, fontWeight: '900', letterSpacing: 1.4 },
  category:  { color: '#5c6488', fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  sponsor:   { color: GREEN, fontSize: 10, fontWeight: '800', marginLeft: 'auto' },

  ringWrap:  { alignItems: 'center', marginTop: 6, marginBottom: 14 },
  ringBox:   { width: RING_BOX, height: RING_BOX, alignItems: 'center', justifyContent: 'center' },
  ringNum:   { fontSize: 40, fontWeight: '900', marginTop: 6 },
  ringUnit:  { color: '#5c6488', fontSize: 9, fontWeight: '900', letterSpacing: 2.5, marginTop: -4 },

  qWrap:     { paddingHorizontal: 20, paddingBottom: 44 },
  questionWrap: { flexDirection: 'row', gap: 13, marginBottom: 22 },
  questionBar:  { width: 3, borderRadius: 2, opacity: 0.85 },
  question:  { flex: 1, color: '#F5F3FF', fontSize: 20, fontWeight: '800', lineHeight: 28 },

  option:    { flexDirection: 'row', alignItems: 'center', gap: 13, backgroundColor: 'rgba(8,13,30,0.9)',
               borderRadius: 16, paddingVertical: 15, paddingHorizontal: 15, marginBottom: 11,
               borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.28)' },
  optionPicked: { borderColor: 'rgba(20,241,149,0.7)', backgroundColor: 'rgba(20,241,149,0.07)' },
  optionRight:  { borderColor: GREEN, backgroundColor: 'rgba(20,241,149,0.14)',
                  shadowColor: GREEN, shadowRadius: 14, shadowOpacity: 0.5, elevation: 6 },
  optionWrong:  { borderColor: '#f472b6', backgroundColor: 'rgba(244,114,182,0.12)' },
  optionDim:    { opacity: 0.4 },
  optionKey:    { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(124,58,237,0.22)' },
  optionKeyRight:{ backgroundColor: GREEN },
  optionKeyWrong:{ backgroundColor: '#f472b6' },
  optionKeyTxt: { color: '#F5F3FF', fontSize: 13, fontWeight: '900' },
  optionTxt:    { flex: 1, color: '#c7cbe4', fontSize: 14.5, fontWeight: '700', lineHeight: 20 },
  mark:         { color: '#fff', fontSize: 17, fontWeight: '900' },

  verdictCard:  { marginTop: 10, backgroundColor: 'rgba(8,13,30,0.94)', borderRadius: 18, padding: 18,
                  borderWidth: 1 },
  verdictHead:  { flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 10 },
  verdictBadge: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  verdictBadgeTxt: { color: '#02120C', fontSize: 13, fontWeight: '900' },
  verdictTitle: { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  verdictBody:  { color: '#a8afd0', fontSize: 13.5, fontWeight: '600', lineHeight: 20 },
  nextBtn:      { marginTop: 16, paddingVertical: 13, borderRadius: 15, alignItems: 'center' },
  nextTxt:      { color: '#02120C', fontSize: 13.5, fontWeight: '900', letterSpacing: 1.6 },

  rankStrip: { flexDirection: 'row', alignItems: 'baseline', gap: 8, marginTop: 20,
               paddingHorizontal: 16, paddingVertical: 9, borderRadius: 14,
               backgroundColor: 'rgba(20,241,149,0.09)',
               borderWidth: 1, borderColor: 'rgba(20,241,149,0.26)' },
  rankPlace: { color: GREEN, fontSize: 19, fontWeight: '900', letterSpacing: 0.5 },
  rankOf:    { color: '#8b93b8', fontSize: 12, fontWeight: '700' },

  recap:      { alignSelf: 'stretch', marginTop: 20, backgroundColor: 'rgba(8,13,30,0.82)',
                borderRadius: 18, paddingVertical: 4, paddingHorizontal: 14,
                borderWidth: 1, borderColor: 'rgba(124,58,237,0.28)' },
  recapRow:   { flexDirection: 'row', alignItems: 'center', gap: 11, paddingVertical: 11 },
  recapDot:   { width: 19, height: 19, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  recapDotOk: { backgroundColor: GREEN },
  recapDotNo: { backgroundColor: 'rgba(244,114,182,0.28)' },
  recapMark:  { color: '#02120C', fontSize: 11, fontWeight: '900' },
  recapQ:     { flex: 1, color: '#a8afd0', fontSize: 12.5, fontWeight: '600', lineHeight: 17 },
  recapPts:   { fontSize: 12.5, fontWeight: '900', minWidth: 34, textAlign: 'right' },

  scoreRow:  { flexDirection: 'row', alignSelf: 'stretch', alignItems: 'center', marginTop: 22, marginBottom: 4 },
  scoreCell: { flex: 1, alignItems: 'center' },
  scoreDivider: { width: 1, height: 30, backgroundColor: 'rgba(255,255,255,0.08)' },
  scoreVal:  { color: '#F5F3FF', fontSize: 24, fontWeight: '900' },
  scoreLbl:  { color: '#5c6488', fontSize: 9.5, fontWeight: '800', letterSpacing: 1.4, marginTop: 3 },

  bigEmoji:  { fontSize: 46, marginBottom: 14 },
  emptyTitle:{ color: '#F5F3FF', fontSize: 19, fontWeight: '900', textAlign: 'center' },
  emptyBody: { color: '#8b93b8', fontSize: 13.5, fontWeight: '600', textAlign: 'center',
               marginTop: 10, lineHeight: 20 },
  primaryBtn:{ marginTop: 24, paddingVertical: 13, paddingHorizontal: 40, borderRadius: 16,
               borderWidth: 1.5, borderColor: 'rgba(20,241,149,0.5)' },
  primaryBtnTxt: { color: GREEN, fontSize: 13.5, fontWeight: '900', letterSpacing: 1.6 },
});
