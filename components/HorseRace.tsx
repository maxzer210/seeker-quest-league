import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Easing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { t, useLang } from '../lib/i18n';

const { width: W, height: H } = Dimensions.get('window');

const TRACK_H      = 110;   // height of one lane
const HORSE_SIZE   = 52;
const FINISH_X     = W - 60; // finish line X on track
const HORSE_START  = 30;     // starting X
const TRAVEL_W     = FINISH_X - HORSE_START - HORSE_SIZE;
const RACE_TIME    = 15;
const WIN_ORB      = 500;
const WIN_TICKETS  = 1;

// Crowd rows — scaling by distance
const CROWD_ROWS = [
  { scale: 0.55, opacity: 0.5, top: 0,  count: 14 },
  { scale: 0.70, opacity: 0.7, top: 20, count: 11 },
  { scale: 0.85, opacity: 0.9, top: 42, count: 9  },
];
const CROWD_EMOJIS = ['🙋','🙆','🧑','👩','🎉','🏳️','👏','😱','🤩','🙌'];
const FENCE_SPACING = 48;

interface Props {
  orb:           number;
  horsePower:    number;
  onEarnOrb:     (n: number) => void;
  onEarnTickets: (n: number) => void;
  onBack:        () => void;
}

type Phase = 'ready' | 'racing' | 'result';

export default function HorseRace({ orb, horsePower, onEarnOrb, onEarnTickets, onBack }: Props) {
  useLang();
  const [phase,       setPhase]      = useState<Phase>('ready');
  const [timeLeft,    setTimeLeft]   = useState(RACE_TIME);
  const [playerPct,   setPlayerPct]  = useState(0);   // 0–100
  const [botPct,      setBotPct]     = useState(0);
  const [result,      setResult]     = useState<'win'|'lose'|'draw'|null>(null);
  const [tapCount,    setTapCount]   = useState(0);
  const [lastTapFlash, setLastTapFlash] = useState(false);

  // Refs for game loop
  const phaseRef    = useRef<Phase>('ready');
  const playerRef   = useRef(0);
  const botRef      = useRef(0);
  const timerRef    = useRef<ReturnType<typeof setInterval> | null>(null);
  const botRef2     = useRef<ReturnType<typeof setInterval> | null>(null);

  // ── Animations ────────────────────────────────────────────────────────
  const playerBob   = useRef(new Animated.Value(0)).current;
  const botBob      = useRef(new Animated.Value(0)).current;
  const playerX     = useRef(new Animated.Value(HORSE_START)).current;
  const botX        = useRef(new Animated.Value(HORSE_START)).current;
  const playerTilt  = useRef(new Animated.Value(0)).current;
  const groundScroll= useRef(new Animated.Value(0)).current;
  const resultScale = useRef(new Animated.Value(0)).current;
  const timerPulse  = useRef(new Animated.Value(1)).current;
  const crowdWave   = useRef(new Animated.Value(0)).current;
  const finishFlash = useRef(new Animated.Value(0)).current;
  const speedLines  = useRef(new Animated.Value(0)).current;

  // ── New: stadium lights + tap floats + finish sparkles ──
  const stadiumLights = useRef(
    Array.from({ length: 6 }, () => new Animated.Value(0.3))
  ).current;
  const tapFloats = useRef(
    Array.from({ length: 6 }, () => ({
      x:  new Animated.Value(0),
      y:  new Animated.Value(0),
      op: new Animated.Value(0),
    }))
  ).current;
  const tapFloatIdx = useRef(0);
  const finishSparkles = useRef(
    Array.from({ length: 14 }, () => ({
      x:  new Animated.Value(0),
      y:  new Animated.Value(0),
      op: new Animated.Value(0),
    }))
  ).current;
  const [showFinishSparks, setShowFinishSparks] = useState(false);

  // Gallop loops
  useEffect(() => {
    const makeGallop = (anim: Animated.Value, delay: number) =>
      Animated.loop(Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: -9,  duration: 130, useNativeDriver: true, easing: Easing.inOut(Easing.ease) }),
        Animated.timing(anim, { toValue:  3,  duration: 100, useNativeDriver: true, easing: Easing.in(Easing.ease) }),
        Animated.timing(anim, { toValue:  0,  duration: 80,  useNativeDriver: true }),
      ]));
    const p = makeGallop(playerBob, 0);
    const b = makeGallop(botBob, 80);
    p.start(); b.start();
    return () => { p.stop(); b.stop(); };
  }, []);

  // Ground scroll loop
  useEffect(() => {
    const loop = Animated.loop(Animated.timing(groundScroll, {
      toValue: -FENCE_SPACING, duration: 600, easing: Easing.linear, useNativeDriver: true,
    }));
    loop.start();
    return () => loop.stop();
  }, []);

  // Crowd wave loop
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(crowdWave, { toValue: 1, duration: 1200, useNativeDriver: true }),
      Animated.timing(crowdWave, { toValue: 0, duration: 1200, useNativeDriver: true }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // Stadium lights flicker (staggered)
  useEffect(() => {
    const loops = stadiumLights.map(l => Animated.loop(Animated.sequence([
      Animated.timing(l, { toValue: 1,   duration: 250,  useNativeDriver: true }),
      Animated.timing(l, { toValue: 0.3, duration: 1750, useNativeDriver: true }),
    ])));
    const timers = loops.map((l, i) => setTimeout(() => l.start(), i * 230));
    return () => { timers.forEach(clearTimeout); loops.forEach(l => l.stop()); };
  }, []);

  // Speed lines when racing
  useEffect(() => {
    if (phase !== 'racing') { speedLines.setValue(0); return; }
    const loop = Animated.loop(Animated.timing(speedLines, {
      toValue: 1, duration: 300, easing: Easing.linear, useNativeDriver: true,
    }));
    loop.start();
    return () => loop.stop();
  }, [phase]);

  // ── Start race ────────────────────────────────────────────────────────
  const startRace = useCallback(() => {
    phaseRef.current = 'racing';
    setPhase('racing');
    setTimeLeft(RACE_TIME);
    setTapCount(0);
    playerRef.current = 0;
    botRef.current    = 0;
    setPlayerPct(0);
    setBotPct(0);
    setResult(null);
    playerX.setValue(HORSE_START);
    botX.setValue(HORSE_START);
    resultScale.setValue(0);

    // Bot: random interval tapping (simulates opponent)
    const botSpeed = 2.5 + Math.random() * 1.5;   // pct/sec
    botRef2.current = setInterval(() => {
      if (phaseRef.current !== 'racing') return;
      const jitter = (Math.random() - 0.4) * 0.8;
      const gain   = (botSpeed + jitter) * 0.1;   // per 100ms
      const next   = Math.min(100, botRef.current + gain);
      botRef.current = next;
      setBotPct(next);
      Animated.timing(botX, {
        toValue: HORSE_START + (next / 100) * TRAVEL_W,
        duration: 100, useNativeDriver: true, easing: Easing.linear,
      }).start();
      if (next >= 100 && phaseRef.current === 'racing') endRace();
    }, 100);

    // Timer
    let t = RACE_TIME;
    timerRef.current = setInterval(() => {
      if (phaseRef.current !== 'racing') return;
      t -= 1;
      setTimeLeft(t);
      // Pulse timer when < 5s
      if (t <= 5) {
        Animated.sequence([
          Animated.timing(timerPulse, { toValue: 1.3, duration: 200, useNativeDriver: true }),
          Animated.timing(timerPulse, { toValue: 1.0, duration: 200, useNativeDriver: true }),
        ]).start();
      }
      if (t <= 0) endRace();
    }, 1000);
  }, []);

  // ── Tap handler ───────────────────────────────────────────────────────
  const tapHorse = useCallback(() => {
    if (phaseRef.current !== 'racing') return;
    const gain = horsePower;
    const next = Math.min(100, playerRef.current + gain);
    playerRef.current = next;
    setPlayerPct(next);
    setTapCount(c => c + 1);

    // Animate forward
    Animated.timing(playerX, {
      toValue: HORSE_START + (next / 100) * TRAVEL_W,
      duration: 80, useNativeDriver: true, easing: Easing.out(Easing.quad),
    }).start();

    // Lurch tilt
    playerTilt.setValue(12);
    Animated.timing(playerTilt, { toValue: 0, duration: 200, useNativeDriver: true }).start();

    // Tap flash
    setLastTapFlash(true);
    setTimeout(() => setLastTapFlash(false), 100);

    // Floating +X number above horse
    const f = tapFloats[tapFloatIdx.current % tapFloats.length];
    tapFloatIdx.current += 1;
    f.x.setValue(HORSE_START + (next / 100) * TRAVEL_W);
    f.y.setValue(0);
    f.op.setValue(1);
    Animated.parallel([
      Animated.timing(f.y,  { toValue: -40, duration: 700, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
      Animated.timing(f.op, { toValue: 0,   duration: 700, useNativeDriver: true }),
    ]).start();

    if (next >= 100) endRace();
  }, [horsePower, tapFloats]);

  // ── End race ──────────────────────────────────────────────────────────
  const endRace = useCallback(() => {
    if (phaseRef.current !== 'racing') return;
    phaseRef.current = 'result';
    setPhase('result');

    if (timerRef.current)  clearInterval(timerRef.current);
    if (botRef2.current)   clearInterval(botRef2.current);

    const won  = playerRef.current >= botRef.current;
    const draw = Math.abs(playerRef.current - botRef.current) < 2;
    const r    = draw ? 'draw' : won ? 'win' : 'lose';
    setResult(r);

    if (r === 'win') {
      onEarnOrb(WIN_ORB);
      onEarnTickets(WIN_TICKETS);
      // Crowd erupts
      Animated.sequence([
        Animated.timing(crowdWave, { toValue: 3, duration: 400, useNativeDriver: true }),
        Animated.timing(crowdWave, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
      // Finish sparkles burst from finish line
      setShowFinishSparks(true);
      finishSparkles.forEach((p, i) => {
        const angle = (i / finishSparkles.length) * Math.PI * 2;
        const dist  = 80 + Math.random() * 100;
        p.x.setValue(0); p.y.setValue(0); p.op.setValue(1);
        Animated.parallel([
          Animated.timing(p.x,  { toValue: Math.cos(angle) * dist,           duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.y,  { toValue: Math.sin(angle) * dist - 30,      duration: 1100, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.op, { toValue: 0, duration: 1100, delay: 400,    useNativeDriver: true }),
        ]).start();
      });
      setTimeout(() => setShowFinishSparks(false), 1300);
    }

    // Finish flash
    finishFlash.setValue(1);
    Animated.timing(finishFlash, { toValue: 0, duration: 1000, useNativeDriver: true }).start();

    // Result card pop
    Animated.spring(resultScale, { toValue: 1, friction: 5, tension: 200, useNativeDriver: true }).start();
  }, [onEarnOrb, onEarnTickets]);

  // Cleanup
  useEffect(() => () => {
    if (timerRef.current)  clearInterval(timerRef.current);
    if (botRef2.current)   clearInterval(botRef2.current);
  }, []);

  // ── Render helpers ────────────────────────────────────────────────────
  const timerColor = timeLeft <= 5 ? '#EF4444' : timeLeft <= 9 ? '#FB923C' : '#22C55E';

  const fenceCount = Math.ceil(W / FENCE_SPACING) + 2;

  return (
    <View style={s.root}>

      {/* ── SKY + CROWD ─────────────────────────────────────────────── */}
      <LinearGradient colors={['#0A001A','#1a0040','#2D1060']} style={s.sky}>

        {/* Crowd rows */}
        {CROWD_ROWS.map((row, ri) => (
          <View key={ri} style={[s.crowdRow, { top: row.top, opacity: row.opacity }]}>
            {Array.from({ length: row.count }, (_, ci) => {
              const wave = crowdWave.interpolate({
                inputRange:  [0, 1],
                outputRange: [0, ci % 2 === 0 ? -5 : 5],
              });
              return (
                <Animated.Text key={ci} style={[s.crowdEmoji, {
                  fontSize: 18 * row.scale,
                  transform: [{ translateY: wave }],
                }]}>
                  {CROWD_EMOJIS[(ri * 5 + ci) % CROWD_EMOJIS.length]}
                </Animated.Text>
              );
            })}
          </View>
        ))}

        {/* Stadium arc lights */}
        <View style={s.lightLeft}  />
        <View style={s.lightRight} />

        {/* Stadium bulbs row (top of stadium) */}
        <View style={s.stadiumBulbsRow}>
          {stadiumLights.map((b, i) => (
            <Animated.View
              key={i}
              style={[s.stadiumBulb, {
                opacity: b,
                transform: [{ scale: b.interpolate({ inputRange: [0.3, 1], outputRange: [0.7, 1.3] }) }],
              }]}
            />
          ))}
        </View>
      </LinearGradient>

      {/* ── HUD (timer + power) ─────────────────────────────────────── */}
      <View style={s.hud}>
        <View style={s.hudLeft}>
          <Text style={s.hudPowerLabel}>POWER</Text>
          <Text style={s.hudPower}>+{horsePower}/tap</Text>
        </View>

        <Animated.View style={[s.timerWrap, { transform: [{ scale: timerPulse }] }]}>
          <Text style={[s.timer, { color: timerColor }]}>{phase === 'racing' ? timeLeft : '⏱'}</Text>
          <Text style={s.timerLabel}>{t('horse.sec')}</Text>
        </Animated.View>

        <View style={s.hudRight}>
          <Text style={s.hudTapsLabel}>{t('horse.taps')}</Text>
          <Text style={s.hudTaps}>{tapCount}</Text>
        </View>
      </View>

      {/* ── RACE TRACK ──────────────────────────────────────────────── */}
      <View style={s.trackWrap}>

        {/* Top fence */}
        <View style={s.fenceTop}>
          <Animated.View style={[s.fenceRail, { transform: [{ translateX: groundScroll }] }]}>
            {Array.from({ length: fenceCount }, (_, i) => (
              <View key={i} style={s.fencePost} />
            ))}
          </Animated.View>
          <View style={s.fenceHRail} />
        </View>

        {/* ─ LANE 1: PLAYER ─────────────────────────────────────────── */}
        <LinearGradient colors={['#2D1A0A','#3D2510','#2D1A0A']} style={s.lane}>

          {/* Scrolling track marks */}
          <Animated.View style={[s.trackMarks, { transform: [{ translateX: groundScroll }] }]}>
            {Array.from({ length: fenceCount }, (_, i) => (
              <View key={i} style={s.trackMark} />
            ))}
          </Animated.View>

          {/* Label */}
          <View style={s.laneLabel}>
            <Text style={s.laneLabelTxt}>🟣  {t('horse.you')}</Text>
          </View>

          {/* Speed lines */}
          {phase === 'racing' && (
            <Animated.View style={[s.speedLinesWrap, {
              opacity: speedLines.interpolate({ inputRange: [0, 0.5, 1], outputRange: [0.6, 0, 0.6] }),
            }]}>
              {[14, 30, 46].map(y => (
                <View key={y} style={[s.speedLine, { top: y }]} />
              ))}
            </Animated.View>
          )}

          {/* Player horse */}
          <Animated.View style={[s.horseWrap, {
            transform: [
              { translateX: playerX },
              { translateY: playerBob },
              { rotate: playerTilt.interpolate({ inputRange: [0, 12], outputRange: ['0deg', '-8deg'] }) },
            ],
          }]}>
            <Text style={s.jockey}>🧑</Text>
            <Text style={[s.horse, { color: '#A855F7' }]}>🐎</Text>
            {phase === 'racing' && playerRef.current > 5 && (
              <View style={s.dustWrap}>
                <Text style={s.dust}>💨</Text>
              </View>
            )}
          </Animated.View>

          {/* Floating +X numbers on tap */}
          {tapFloats.map((f, i) => (
            <Animated.Text
              key={`tf${i}`}
              pointerEvents="none"
              style={[s.tapFloat, {
                opacity: f.op,
                transform: [
                  { translateX: f.x },
                  { translateY: f.y },
                ],
              }]}
            >
              +{horsePower}
            </Animated.Text>
          ))}

          {/* Progress % */}
          <View style={s.pctBadge}>
            <Text style={s.pctTxt}>{Math.round(playerPct)}%</Text>
          </View>
        </LinearGradient>

        {/* Lane divider */}
        <View style={s.laneDivider}>
          <View style={s.laneDividerLine} />
        </View>

        {/* ─ LANE 2: BOT ────────────────────────────────────────────── */}
        <LinearGradient colors={['#1A0A00','#2A1200','#1A0A00']} style={s.lane}>

          <Animated.View style={[s.trackMarks, { transform: [{ translateX: groundScroll }] }]}>
            {Array.from({ length: fenceCount }, (_, i) => (
              <View key={i} style={s.trackMark} />
            ))}
          </Animated.View>

          <View style={s.laneLabel}>
            <Text style={s.laneLabelTxt}>🔴  {t('horse.bot')}</Text>
          </View>

          {/* Bot horse */}
          <Animated.View style={[s.horseWrap, {
            transform: [
              { translateX: botX },
              { translateY: botBob },
            ],
          }]}>
            <Text style={s.jockey}>🤖</Text>
            <Text style={[s.horse, { color: '#FB923C' }]}>🐎</Text>
            {phase === 'racing' && botRef.current > 5 && (
              <View style={s.dustWrap}>
                <Text style={s.dust}>💨</Text>
              </View>
            )}
          </Animated.View>

          <View style={s.pctBadge}>
            <Text style={s.pctTxt}>{Math.round(botPct)}%</Text>
          </View>
        </LinearGradient>

        {/* Bottom fence */}
        <View style={s.fenceBottom}>
          <View style={s.fenceHRail} />
          <Animated.View style={[s.fenceRail, { transform: [{ translateX: groundScroll }] }]}>
            {Array.from({ length: fenceCount }, (_, i) => (
              <View key={i} style={s.fencePost} />
            ))}
          </Animated.View>
        </View>

        {/* Finish line */}
        <Animated.View style={[s.finishLine, {
          opacity: finishFlash.interpolate({ inputRange: [0,1], outputRange: [0.85, 1] }),
        }]}>
          {Array.from({ length: 12 }, (_, i) => (
            <View key={i} style={[s.finishBlock, { backgroundColor: i % 2 === 0 ? '#fff' : '#222' }]} />
          ))}
          <Text style={s.finishLabel}>🏁</Text>
        </Animated.View>

        {/* Finish line sparkles burst on win */}
        {showFinishSparks && (
          <View pointerEvents="none" style={s.finishSparksLayer}>
            {finishSparkles.map((p, i) => (
              <Animated.Text key={i} style={[s.finishSpark, {
                opacity: p.op,
                transform: [{ translateX: p.x }, { translateY: p.y }],
              }]}>
                {['✨','🎉','💰','⚡','🏆','🌟'][i % 6]}
              </Animated.Text>
            ))}
          </View>
        )}

        {/* Lead indicator arrow */}
        {phase === 'racing' && (
          <View style={[s.leadArrow, {
            top: playerPct >= botPct ? TRACK_H * 0.3 : TRACK_H * 1.4,
          }]}>
            <Text style={s.leadArrowTxt}>{playerPct >= botPct ? '👑' : '⚡'}</Text>
          </View>
        )}
      </View>

      {/* ── GROUND ──────────────────────────────────────────────────── */}
      <LinearGradient colors={['#0A2000','#051200']} style={s.ground}>
        <Animated.View style={[s.grassStripes, { transform: [{ translateX: groundScroll }] }]}>
          {Array.from({ length: 20 }, (_, i) => (
            <View key={i} style={[s.grassStripe, i % 2 === 0 && s.grassStripeDark]} />
          ))}
        </Animated.View>
      </LinearGradient>

      {/* ── RESULT CARD ─────────────────────────────────────────────── */}
      {phase === 'result' && result && (
        <Animated.View style={[s.resultOverlay, { transform: [{ scale: resultScale }] }]}>
          <LinearGradient
            colors={result === 'win' ? ['#052E16','#14532D'] : result === 'draw' ? ['#1E1B4B','#312E81'] : ['#450A0A','#7F1D1D']}
            style={s.resultCard}
          >
            <Text style={s.resultEmoji}>{result === 'win' ? '🏆' : result === 'draw' ? '🤝' : '💀'}</Text>
            <Text style={s.resultTitle}>
              {result === 'win' ? t('horse.win') : result === 'draw' ? t('horse.drawSub') : t('horse.lose')}
            </Text>

            {result === 'win' && (
              <View style={s.resultRewards}>
                <View style={s.resultRewardItem}>
                  <Text style={s.resultRewardVal}>+{WIN_ORB}</Text>
                  <Text style={s.resultRewardLbl}>ORB</Text>
                </View>
                <View style={s.resultRewardItem}>
                  <Text style={s.resultRewardVal}>+{WIN_TICKETS}</Text>
                  <Text style={s.resultRewardLbl}>{t('horse.ticket')}</Text>
                </View>
                <View style={s.resultRewardItem}>
                  <Text style={s.resultRewardVal}>{tapCount}</Text>
                  <Text style={s.resultRewardLbl}>{t('horse.taps')}</Text>
                </View>
              </View>
            )}

            {result !== 'win' && (
              <Text style={s.resultSub}>
                {result === 'draw'
                  ? t('horse.drawSub')
                  : t('horse.lost', { bot: Math.round(botPct), you: Math.round(playerPct) })}
              </Text>
            )}

            <TouchableOpacity style={s.resultPlayAgain} onPress={startRace} activeOpacity={0.85}>
              <LinearGradient colors={['#7C3AED','#A855F7']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.resultPlayGrad}>
                <Text style={s.resultPlayTxt}>{t('horse.again')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            <TouchableOpacity style={s.resultBackBtn} onPress={onBack}>
              <Text style={s.resultBackTxt}>{t('horse.back')}</Text>
            </TouchableOpacity>
          </LinearGradient>
        </Animated.View>
      )}

      {/* ── BOTTOM: TAP BUTTON / START ──────────────────────────────── */}
      <View style={s.bottom}>
        {phase === 'ready' && (
          <View style={s.readyWrap}>
            <Text style={s.readyTitle}>{t('horse.title')}</Text>
            <Text style={s.readySub}>{t('horse.subtitle')}</Text>
            <View style={s.readyStats}>
              <View style={s.readyStatBox}>
                <Text style={s.readyStatVal}>+{horsePower}</Text>
                <Text style={s.readyStatLbl}>{t('horse.statTap')}</Text>
              </View>
              <View style={s.readyStatBox}>
                <Text style={s.readyStatVal}>{RACE_TIME}s</Text>
                <Text style={s.readyStatLbl}>{t('horse.statRace')}</Text>
              </View>
              <View style={s.readyStatBox}>
                <Text style={s.readyStatVal}>+{WIN_ORB}</Text>
                <Text style={s.readyStatLbl}>{t('horse.statWin')}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={startRace} style={s.startBtn} activeOpacity={0.85}>
              <LinearGradient colors={['#7C3AED','#EC4899']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.startGrad}>
                <Text style={s.startTxt}>🏁  {t('horse.play')}</Text>
              </LinearGradient>
            </TouchableOpacity>
            {/* Back is handled by parent App.tsx overlay (top-left) */}
          </View>
        )}

        {phase === 'racing' && (
          <TouchableOpacity
            style={[s.tapBtn, lastTapFlash && s.tapBtnFlash]}
            onPress={tapHorse}
            activeOpacity={0.75}
          >
            <LinearGradient
              colors={lastTapFlash ? ['#EC4899','#7C3AED'] : ['#4C1D95','#7C3AED']}
              start={{x:0,y:0}} end={{x:1,y:0}}
              style={s.tapGrad}
            >
              <Text style={s.tapEmoji}>🐎</Text>
              <Text style={s.tapTxt}>{t('horse.tap')}</Text>
              <Text style={s.tapSubTxt}>{t('horse.progress', { n: horsePower })}</Text>
            </LinearGradient>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1, backgroundColor: '#000' },

  // Sky & crowd
  sky:          { height: 110, position: 'relative', overflow: 'hidden' },
  crowdRow:     { position: 'absolute', left: 0, right: 0, flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 4 },
  crowdEmoji:   { textAlign: 'center' },
  lightLeft:    { position: 'absolute', top: 0, left: 20, width: 6, height: 110, backgroundColor: '#FFFFAA', opacity: 0.08, transform: [{ skewX: '12deg' }] },
  lightRight:   { position: 'absolute', top: 0, right: 20, width: 6, height: 110, backgroundColor: '#FFFFAA', opacity: 0.08, transform: [{ skewX: '-12deg' }] },

  stadiumBulbsRow: { position: 'absolute', top: 2, left: 0, right: 0,
                     flexDirection: 'row', justifyContent: 'space-around', paddingHorizontal: 20 },
  stadiumBulb:     { width: 10, height: 10, borderRadius: 5, backgroundColor: '#FFEB99',
                     shadowColor: '#FFEB99', shadowRadius: 8, shadowOpacity: 1, elevation: 8 },

  // HUD
  hud:          { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 10, backgroundColor: '#05080F', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  hudLeft:      { alignItems: 'flex-start', minWidth: 70 },
  hudRight:     { alignItems: 'flex-end', minWidth: 70 },
  hudPowerLabel:{ color: '#475569', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  hudPower:     { color: '#A855F7', fontSize: 15, fontWeight: '900' },
  hudTapsLabel: { color: '#475569', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  hudTaps:      { color: '#22C55E', fontSize: 15, fontWeight: '900' },
  timerWrap:    { alignItems: 'center' },
  timer:        { fontSize: 38, fontWeight: '900', lineHeight: 42 },
  timerLabel:   { color: '#334155', fontSize: 9, fontWeight: '700', letterSpacing: 2, marginTop: -2 },

  // Track
  trackWrap:    { position: 'relative' },

  fenceTop:     { height: 18, backgroundColor: '#0A1628', flexDirection: 'column', overflow: 'hidden' },
  fenceBottom:  { height: 18, backgroundColor: '#0A1628', overflow: 'hidden' },
  fenceRail:    { flexDirection: 'row', position: 'absolute', left: -FENCE_SPACING },
  fencePost:    { width: 6, height: 18, backgroundColor: '#FFFFFF', marginRight: FENCE_SPACING - 6, borderRadius: 1 },
  fenceHRail:   { position: 'absolute', left: 0, right: 0, height: 3, backgroundColor: '#FFFFFF', top: 7, opacity: 0.85 },

  lane:         { height: TRACK_H, overflow: 'hidden', position: 'relative' },
  laneLabel:    { position: 'absolute', left: 8, top: '50%', marginTop: -10 },
  laneLabelTxt: { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  trackMarks:   { position: 'absolute', left: -FENCE_SPACING, top: TRACK_H / 2 - 1, flexDirection: 'row' },
  trackMark:    { width: 28, height: 2, backgroundColor: 'rgba(255,255,255,0.08)', marginRight: FENCE_SPACING - 28 },

  speedLinesWrap:{ position: 'absolute', left: 0, right: 0, top: 0 },
  speedLine:    { position: 'absolute', left: 0, right: 0, height: 1, backgroundColor: 'rgba(255,255,255,0.12)' },

  horseWrap:    { position: 'absolute', bottom: 8, alignItems: 'center' },
  jockey:       { fontSize: 16, marginBottom: -4 },
  horse:        { fontSize: HORSE_SIZE * 0.9 },
  dustWrap:     { position: 'absolute', bottom: 0, right: -14 },
  dust:         { fontSize: 16, opacity: 0.6 },
  tapFloat:     { position: 'absolute', bottom: 50, left: 0,
                  color: '#FACC15', fontSize: 18, fontWeight: '900',
                  textShadowColor: '#000', textShadowRadius: 4 },
  pctBadge:     { position: 'absolute', right: 8, top: '50%', marginTop: -10 },
  pctTxt:       { color: 'rgba(255,255,255,0.4)', fontSize: 11, fontWeight: '700' },

  laneDivider:  { height: 4, backgroundColor: '#0A1628', justifyContent: 'center' },
  laneDividerLine:{ height: 1, backgroundColor: '#1E293B' },

  finishLine:   { position: 'absolute', right: 32, top: 18, bottom: 18, width: 16, flexDirection: 'column', borderRadius: 2, overflow: 'hidden' },
  finishBlock:  { flex: 1 },
  finishLabel:  { position: 'absolute', top: -20, left: -6, fontSize: 20 },
  finishSparksLayer: { position: 'absolute', right: 40, top: '50%', width: 0, height: 0 },
  finishSpark:  { position: 'absolute', fontSize: 22, marginLeft: -11, marginTop: -11 },

  leadArrow:    { position: 'absolute', right: 10 },
  leadArrowTxt: { fontSize: 18 },

  // Ground
  ground:       { height: 28, overflow: 'hidden' },
  grassStripes: { flexDirection: 'row', height: '100%', position: 'absolute', left: -FENCE_SPACING },
  grassStripe:  { width: FENCE_SPACING / 2, height: '100%', backgroundColor: '#0F3A00' },
  grassStripeDark:{ backgroundColor: '#081F00' },

  // Result
  resultOverlay:{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 50 },
  resultCard:   { borderRadius: 28, padding: 28, width: W - 40, alignItems: 'center', gap: 10, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.1)' },
  resultEmoji:  { fontSize: 56 },
  resultTitle:  { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  resultRewards:{ flexDirection: 'row', gap: 16, marginVertical: 4 },
  resultRewardItem:{ alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 14, padding: 12, minWidth: 72 },
  resultRewardVal: { color: '#22C55E', fontSize: 22, fontWeight: '900' },
  resultRewardLbl: { color: '#475569', fontSize: 10, marginTop: 2 },
  resultSub:    { color: '#94A3B8', fontSize: 13, textAlign: 'center' },
  resultPlayAgain:{ width: '100%', borderRadius: 16, overflow: 'hidden', marginTop: 6 },
  resultPlayGrad: { paddingVertical: 14, alignItems: 'center' },
  resultPlayTxt:  { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  resultBackBtn:  { paddingVertical: 8 },
  resultBackTxt:  { color: '#334155', fontSize: 13 },

  // Bottom controls
  bottom:       { flex: 1, backgroundColor: '#05080F', borderTopWidth: 1, borderTopColor: '#1E293B' },

  readyWrap:    { flex: 1, padding: 20, gap: 10, justifyContent: 'center' },
  readyTitle:   { color: '#E2E8F0', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  readySub:     { color: '#475569', fontSize: 13, lineHeight: 18 },
  readyStats:   { flexDirection: 'row', gap: 10 },
  readyStatBox: { flex: 1, backgroundColor: '#0F172A', borderRadius: 14, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  readyStatVal: { color: '#A855F7', fontSize: 18, fontWeight: '900' },
  readyStatLbl: { color: '#475569', fontSize: 10, marginTop: 2 },
  startBtn:     { borderRadius: 16, overflow: 'hidden' },
  startGrad:    { paddingVertical: 16, alignItems: 'center' },
  startTxt:     { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  backBtn:      { alignItems: 'center', paddingVertical: 6 },
  backBtnTxt:   { color: '#334155', fontSize: 13 },

  tapBtn:       { flex: 1, borderRadius: 0, overflow: 'hidden' },
  tapBtnFlash:  {},
  tapGrad:      { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 12 },
  tapEmoji:     { fontSize: 34 },
  tapTxt:       { color: '#fff', fontSize: 28, fontWeight: '900', letterSpacing: 4 },
  tapSubTxt:    { color: 'rgba(255,255,255,0.55)', fontSize: 12, position: 'absolute', bottom: 12 },
});
