import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing,
  Modal, ScrollView, Dimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { LinearGradient } from 'expo-linear-gradient';
import { t, useLang } from '../lib/i18n';

const { width: W } = Dimensions.get('window');
const WHEEL_SIZE  = Math.min(W - 40, 320);
const WHEEL_R     = WHEEL_SIZE / 2;
const SEG_R       = WHEEL_R * 0.72;   // radius where segment icons sit
const SEG_ICON_SZ = WHEEL_SIZE * 0.14; // size of each segment circle
const N_SEG       = 12;
const DEG_PER_SEG = 360 / N_SEG;

// ─── Segment definitions ────────────────────────────────────────────────────

type RewardType = 'empty' | 'orb' | 'ticket' | 'boost' | 'jackpot' | 'x2';

interface Segment {
  label:  string;
  emoji:  string;
  color:  string;
  glow:   string;
  reward: { type: RewardType; amount: number };
  weight: number; // relative probability
}

const SEGMENTS: Segment[] = [
  { label: 'ПУСТО',     emoji: '💀', color: '#1E293B', glow: '#334155', reward: { type: 'empty',   amount: 0     }, weight: 20 },
  { label: '500 ORB',   emoji: '⚡', color: '#4C1D95', glow: '#7C3AED', reward: { type: 'orb',     amount: 500   }, weight: 14 },
  { label: 'ПУСТО',     emoji: '💀', color: '#1E293B', glow: '#334155', reward: { type: 'empty',   amount: 0     }, weight: 20 },
  { label: '2 000 ORB', emoji: '🎯', color: '#1E3A8A', glow: '#3B82F6', reward: { type: 'orb',     amount: 2000  }, weight: 10 },
  { label: '3 ТИКЕТА',  emoji: '🎫', color: '#064E3B', glow: '#10B981', reward: { type: 'ticket',  amount: 3     }, weight:  8 },
  { label: 'ПУСТО',     emoji: '💀', color: '#1E293B', glow: '#334155', reward: { type: 'empty',   amount: 0     }, weight: 20 },
  { label: '×2 МНОЖ',   emoji: '✨', color: '#312E81', glow: '#818CF8', reward: { type: 'x2',      amount: 2     }, weight:  6 },
  { label: '1 000 ORB', emoji: '⚡', color: '#4C1D95', glow: '#A855F7', reward: { type: 'orb',     amount: 1000  }, weight: 12 },
  { label: 'ПУСТО',     emoji: '💀', color: '#1E293B', glow: '#334155', reward: { type: 'empty',   amount: 0     }, weight: 20 },
  { label: '10К ORB',   emoji: '💎', color: '#1E3A8A', glow: '#60A5FA', reward: { type: 'orb',     amount: 10000 }, weight:  4 },
  { label: 'БУСТ ×3',   emoji: '🔥', color: '#7C2D12', glow: '#FB923C', reward: { type: 'boost',   amount: 1     }, weight:  5 },
  { label: 'ДЖЕКПОТ',   emoji: '🌟', color: '#78350F', glow: '#FACC15', reward: { type: 'jackpot', amount: -1    }, weight:  1 },
];

const TOTAL_WEIGHT = SEGMENTS.reduce((s, seg) => s + seg.weight, 0);

const FREE_SPINS_PER_DAY = 1;
const JACKPOT_START      = 50_000;
const JACKPOT_GROW       = 5_000; // per paid spin
const PAID_SPIN_ORB      = 10_000;

// Storage keys
const KEY_FREE   = 'sk_wheel_free_';   // legacy: stored REMAINING (deprecated)
const KEY_USED   = 'sk_wheel_used_';   // + today date — stores spins USED today
const KEY_JACK   = 'sk_wheel_jackpot';
const KEY_MULT   = 'sk_wheel_mult';    // active x2 multiplier expiry

// ─── Props ──────────────────────────────────────────────────────────────────

interface Props {
  orb:                number;
  tickets:            number;
  onEarnOrb:          (n: number) => void;
  onSpendOrb:         (n: number) => void;
  onEarnTickets:      (n: number) => void;
  onSpendTickets:     (n: number) => void;
  onAddTournamentScore: (n: number) => void;
  onSpin?:            () => void;
  onBeforePaidSpin?:  () => Promise<boolean>;
  paidSpinCostLabel?: string;
  paidSpinDisabled?:  boolean;
  paidSpinStatus?:    string;
  /** Daily free spins limit — base 1 + Founder tier bonus (Silver +3, Gold +5, Diamond +10). */
  freeSpinsPerDay?:   number;
}

// ─── Helpers ────────────────────────────────────────────────────────────────

function segLabel(seg: Segment): string {
  switch (seg.reward.type) {
    case 'empty':   return t('fortune.segEmpty');
    case 'ticket':  return t('fortune.segTickets', { n: seg.reward.amount });
    case 'x2':      return t('fortune.segX2');
    case 'boost':   return t('fortune.segBoost');
    case 'jackpot': return t('fortune.segJackpot');
    case 'orb': {
      const n = seg.reward.amount;
      return `${n >= 1000 ? (n / 1000).toFixed(0) + 'K' : n} ORB`;
    }
    default: return seg.label;
  }
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

function pickSegment(): number {
  let r = Math.random() * TOTAL_WEIGHT;
  for (let i = 0; i < SEGMENTS.length; i++) {
    r -= SEGMENTS[i].weight;
    if (r <= 0) return i;
  }
  return 0;
}

/** Degrees to rotate so segment `idx` ends up under the top pointer */
function degForSegment(currentDeg: number, idx: number): number {
  // Pointer is at top = 270° in standard coords = -90° offset
  // Segment idx centre is at idx * DEG_PER_SEG + DEG_PER_SEG/2
  const segCentre = idx * DEG_PER_SEG + DEG_PER_SEG / 2;
  const target    = 360 - segCentre; // we need -segCentre to land under pointer
  const extra     = 5 * 360;         // at least 5 full rotations
  const current   = currentDeg % 360;
  const diff      = ((target - current) + 360) % 360;
  return currentDeg + extra + diff;
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function FortuneWheel({
  orb, tickets,
  onEarnOrb, onSpendOrb, onEarnTickets, onSpendTickets, onAddTournamentScore, onSpin,
  onBeforePaidSpin, paidSpinCostLabel, paidSpinDisabled, paidSpinStatus,
  freeSpinsPerDay = FREE_SPINS_PER_DAY,
}: Props) {

  useLang();
  const [freeLeft,    setFreeLeft]    = useState(freeSpinsPerDay);
  const [jackpot,     setJackpot]     = useState(JACKPOT_START);
  const [spinning,    setSpinning]    = useState(false);
  const [lastResult,  setLastResult]  = useState<Segment | null>(null);
  const [showWin,     setShowWin]     = useState(false);
  const [multActive,  setMultActive]  = useState(false);

  const spinAnim    = useRef(new Animated.Value(0)).current;
  const currentDeg  = useRef(0);
  const winScale    = useRef(new Animated.Value(0)).current;
  const winOpacity  = useRef(new Animated.Value(0)).current;
  const pointerAnim = useRef(new Animated.Value(1)).current;

  // ── Ambient animations (always alive) ──
  const outerGlowAnim    = useRef(new Animated.Value(0)).current;
  const hubPulseAnim     = useRef(new Animated.Value(1)).current;
  const jackpotPulseAnim = useRef(new Animated.Value(1)).current;
  const wheelShakeAnim   = useRef(new Animated.Value(0)).current;
  const lossFlashAnim    = useRef(new Animated.Value(0)).current;

  // Marquee LED bulbs around rim (8 chase)
  const NUM_BULBS = 8;
  const bulbsAnim = useRef(
    Array.from({ length: NUM_BULBS }, () => new Animated.Value(0.25))
  ).current;

  // Confetti particles (32 — was 18)
  const confetti = useRef(
    Array.from({ length: 32 }, () => ({
      x:   new Animated.Value(0),
      y:   new Animated.Value(0),
      op:  new Animated.Value(0),
      rot: new Animated.Value(0),
    }))
  ).current;

  // Load persisted state
  useEffect(() => {
    (async () => {
      const today = todayKey();
      const usedStr = await AsyncStorage.getItem(KEY_USED + today);
      let used = usedStr !== null ? parseInt(usedStr, 10) : 0;
      // One-time migration from legacy "remaining" key
      if (usedStr === null) {
        const legacy = await AsyncStorage.getItem(KEY_FREE + today);
        if (legacy !== null) {
          used = Math.max(0, FREE_SPINS_PER_DAY - parseInt(legacy, 10));
          await AsyncStorage.setItem(KEY_USED + today, String(used));
        }
      }
      setFreeLeft(Math.max(0, freeSpinsPerDay - used));

      const jack = await AsyncStorage.getItem(KEY_JACK);
      if (jack) setJackpot(parseInt(jack, 10));

      const multExp = await AsyncStorage.getItem(KEY_MULT);
      if (multExp && parseInt(multExp, 10) > Date.now()) setMultActive(true);
    })();
  }, [freeSpinsPerDay]);

  // Recompute free spins when Founder tier changes (props update)
  useEffect(() => {
    (async () => {
      const today = todayKey();
      const usedStr = await AsyncStorage.getItem(KEY_USED + today);
      const used = usedStr !== null ? parseInt(usedStr, 10) : 0;
      setFreeLeft(Math.max(0, freeSpinsPerDay - used));
    })();
  }, [freeSpinsPerDay]);

  // ── Pointer bounce ──
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pointerAnim, { toValue: 1.3, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(pointerAnim, { toValue: 1,   duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // ── Ambient loops: outer glow, hub pulse, jackpot heartbeat ──
  useEffect(() => {
    const glow = Animated.loop(Animated.sequence([
      Animated.timing(outerGlowAnim, { toValue: 1, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(outerGlowAnim, { toValue: 0, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const hub = Animated.loop(Animated.sequence([
      Animated.timing(hubPulseAnim, { toValue: 1.12, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(hubPulseAnim, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const jack = Animated.loop(Animated.sequence([
      Animated.timing(jackpotPulseAnim, { toValue: 1.08, duration: 580, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(jackpotPulseAnim, { toValue: 1,    duration: 580, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    glow.start(); hub.start(); jack.start();
    return () => { glow.stop(); hub.stop(); jack.stop(); };
  }, []);

  // ── LED marquee chase ──
  useEffect(() => {
    const loops = bulbsAnim.map(b => Animated.loop(Animated.sequence([
      Animated.timing(b, { toValue: 1,    duration: 200,  useNativeDriver: true }),
      Animated.timing(b, { toValue: 0.25, duration: 1400, useNativeDriver: true }),
    ])));
    const timers = loops.map((l, i) => setTimeout(() => l.start(), i * 150));
    return () => { timers.forEach(clearTimeout); loops.forEach(l => l.stop()); };
  }, []);

  // ── Spin logic ──────────────────────────────────────────────────────────
  const doSpin = useCallback(async (isPaid: boolean) => {
    if (spinning) return;

    const today = todayKey();
    let newFree = freeLeft;

    if (!isPaid) {
      if (freeLeft <= 0) return;
      newFree = freeLeft - 1;
      setFreeLeft(newFree);
      // Save USED count (not remaining) so tier upgrades take effect immediately
      const used = freeSpinsPerDay - newFree;
      await AsyncStorage.setItem(KEY_USED + today, String(used));
    } else {
      if (onBeforePaidSpin) {
        const paid = await onBeforePaidSpin();
        if (!paid) return;
      } else {
        // Fallback for local/dev builds without SOL payments.
        if (orb < PAID_SPIN_ORB) return;
        onSpendOrb(PAID_SPIN_ORB);
      }
      const newJack = jackpot + JACKPOT_GROW;
      setJackpot(newJack);
      await AsyncStorage.setItem(KEY_JACK, newJack.toString());
    }

    setSpinning(true);
    setLastResult(null);
    setShowWin(false);
    onSpin?.();

    const segIdx  = pickSegment();
    const target  = degForSegment(currentDeg.current, segIdx);
    const duration = 4000 + Math.random() * 1000;

    spinAnim.setValue(currentDeg.current);
    Animated.timing(spinAnim, {
      toValue:  target,
      duration,
      easing:   Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start(async () => {
      currentDeg.current = target;
      setSpinning(false);

      const seg = SEGMENTS[segIdx];
      setLastResult(seg);

      // Apply reward
      const multiplier = multActive ? 2 : 1;
      if (seg.reward.type === 'orb') {
        const earned = seg.reward.amount * multiplier;
        onEarnOrb(earned);
        onAddTournamentScore(20);
      } else if (seg.reward.type === 'ticket') {
        onEarnTickets(seg.reward.amount);
      } else if (seg.reward.type === 'boost') {
        // Boost handled externally — just notify with tournament score
        onAddTournamentScore(10);
      } else if (seg.reward.type === 'x2') {
        const exp = Date.now() + 30 * 60 * 1000; // 30 minutes
        setMultActive(true);
        await AsyncStorage.setItem(KEY_MULT, exp.toString());
      } else if (seg.reward.type === 'jackpot') {
        const won = jackpot;
        onEarnOrb(won);
        const resetJack = JACKPOT_START;
        setJackpot(resetJack);
        await AsyncStorage.setItem(KEY_JACK, resetJack.toString());
        onAddTournamentScore(100);
      }

      // Loss reaction — shake + red flash
      if (seg.reward.type === 'empty') {
        wheelShakeAnim.setValue(0);
        lossFlashAnim.setValue(0);
        Animated.sequence([
          Animated.timing(wheelShakeAnim, { toValue:  10, duration: 50, useNativeDriver: true }),
          Animated.timing(wheelShakeAnim, { toValue: -10, duration: 50, useNativeDriver: true }),
          Animated.timing(wheelShakeAnim, { toValue:   7, duration: 50, useNativeDriver: true }),
          Animated.timing(wheelShakeAnim, { toValue:  -4, duration: 50, useNativeDriver: true }),
          Animated.timing(wheelShakeAnim, { toValue:   0, duration: 50, useNativeDriver: true }),
        ]).start();
        Animated.sequence([
          Animated.timing(lossFlashAnim, { toValue: 1, duration: 100, useNativeDriver: true }),
          Animated.timing(lossFlashAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
        ]).start();
      }

      // Win celebration (skip for empty)
      if (seg.reward.type !== 'empty') {
        setShowWin(true);
        winScale.setValue(0);
        winOpacity.setValue(0);

        Animated.parallel([
          Animated.spring(winScale,   { toValue: 1, tension: 120, friction: 6, useNativeDriver: true }),
          Animated.timing(winOpacity, { toValue: 1, duration: 300, useNativeDriver: true }),
        ]).start();

        // Confetti burst
        confetti.forEach((p, i) => {
          const angle = (i / confetti.length) * Math.PI * 2;
          const dist  = 80 + Math.random() * 80;
          p.x.setValue(0); p.y.setValue(0); p.op.setValue(1); p.rot.setValue(0);
          Animated.parallel([
            Animated.timing(p.x,   { toValue: Math.cos(angle) * dist, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(p.y,   { toValue: Math.sin(angle) * dist - 40, duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
            Animated.timing(p.op,  { toValue: 0, duration: 900, delay: 400, useNativeDriver: true }),
            Animated.timing(p.rot, { toValue: 1, duration: 900, useNativeDriver: true }),
          ]).start();
        });

        setTimeout(() => { setShowWin(false); }, 3000);
      }
    });
  }, [spinning, freeLeft, orb, jackpot, multActive, onEarnOrb, onSpendOrb, onEarnTickets, onAddTournamentScore, onSpin, onBeforePaidSpin]);

  // ── Wheel rotation interpolation ──
  const wheelRotate = spinAnim.interpolate({
    inputRange:  [0, 360],
    outputRange: ['0deg', '360deg'],
    extrapolate: 'extend',
  });

  // ── Render ──
  return (
    <View style={s.container}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={s.scroll}>

        {/* ── Jackpot banner ── */}
        <LinearGradient colors={['rgba(250,204,21,0.18)', 'rgba(251,146,60,0.1)', 'rgba(2,5,16,0)']}
          style={s.jackpotBanner}>
          <Text style={s.jackpotLabel}>{t('fortune.jackpot')}</Text>
          <Animated.Text style={[s.jackpotAmount, { transform: [{ scale: jackpotPulseAnim }] }]}>
            {jackpot.toLocaleString()}
          </Animated.Text>
          <Text style={s.jackpotUnit}>ORB</Text>
          <Text style={s.jackpotSub}>{t('fortune.jackpotGrow')}</Text>
        </LinearGradient>

        {/* ── Free spins counter ── */}
        <View style={s.spinsRow}>
          {Array.from({ length: FREE_SPINS_PER_DAY }).map((_, i) => (
            <View key={i} style={[s.spinDot, i < freeLeft ? s.spinDotActive : s.spinDotUsed]} />
          ))}
          <Text style={s.spinsLabel}>{t('fortune.freeLeft', { n: freeLeft })}</Text>
        </View>

        {/* ── Multiplier badge ── */}
        {multActive && (
          <View style={s.multBadge}>
            <Text style={s.multText}>{t('fortune.multiplierActive')}</Text>
          </View>
        )}

        {/* ── Wheel ── */}
        <Animated.View style={[s.wheelWrap, { transform: [{ translateX: wheelShakeAnim }] }]}>
          {/* Animated outer glow ring */}
          <Animated.View style={[s.glowRing, {
            width: WHEEL_SIZE + 32, height: WHEEL_SIZE + 32, borderRadius: (WHEEL_SIZE + 32) / 2,
            opacity:   outerGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
            transform: [{ scale: outerGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
          }]} />

          {/* Red loss flash overlay */}
          <Animated.View pointerEvents="none" style={[s.lossFlash, {
            width: WHEEL_SIZE + 60, height: WHEEL_SIZE + 60, borderRadius: (WHEEL_SIZE + 60) / 2,
            opacity: lossFlashAnim,
          }]} />

          {/* LED bulb chase around rim */}
          {bulbsAnim.map((bAnim, i) => {
            const angle = (i / NUM_BULBS) * Math.PI * 2 - Math.PI / 2;
            const r = WHEEL_R + 18;
            const x = WHEEL_R + Math.cos(angle) * r - 4;
            const y = WHEEL_R + Math.sin(angle) * r - 4 + 20;  // +20 for wheelWrap centering
            return (
              <Animated.View
                key={`bulb${i}`}
                style={[s.ledBulb, {
                  left: x, top: y,
                  opacity: bAnim,
                  transform: [{ scale: bAnim.interpolate({ inputRange: [0.25, 1], outputRange: [0.7, 1.3] }) }],
                }]}
              />
            );
          })}

          {/* Pointer */}
          <Animated.View style={[s.pointer, { transform: [{ scale: pointerAnim }] }]}>
            <View style={s.pointerTriangle} />
          </Animated.View>

          {/* Spinning wheel */}
          <Animated.View style={[s.wheel, { width: WHEEL_SIZE, height: WHEEL_SIZE, borderRadius: WHEEL_R,
            transform: [{ rotate: wheelRotate }] }]}>
            {/* Segments as colored circles */}
            {SEGMENTS.map((seg, i) => {
              const angle = (i * DEG_PER_SEG - 90) * (Math.PI / 180);
              const cx    = WHEEL_R + Math.cos(angle) * SEG_R - SEG_ICON_SZ / 2;
              const cy    = WHEEL_R + Math.sin(angle) * SEG_R - SEG_ICON_SZ / 2;
              return (
                <View key={i} style={[s.segCircle, {
                  left:            cx,
                  top:             cy,
                  width:           SEG_ICON_SZ,
                  height:          SEG_ICON_SZ,
                  borderRadius:    SEG_ICON_SZ / 2,
                  backgroundColor: seg.color,
                  borderColor:     seg.glow,
                  shadowColor:     seg.glow,
                }]}>
                  <Text style={{ fontSize: SEG_ICON_SZ * 0.44 }}>{seg.emoji}</Text>
                </View>
              );
            })}

            {/* Spoke lines */}
            {SEGMENTS.map((_, i) => {
              const angle = i * DEG_PER_SEG;
              return (
                <View key={`sp${i}`} style={[s.spoke, {
                  transform: [
                    { translateX: WHEEL_R - 1 },
                    { translateY: 0 },
                    { rotate: `${angle}deg` },
                  ],
                }]} />
              );
            })}

            {/* Center hub */}
            <Animated.View style={[s.hub, { left: WHEEL_R - 28, top: WHEEL_R - 28, transform: [{ scale: hubPulseAnim }] }]}>
              <Text style={s.hubText}>SKORA</Text>
            </Animated.View>
          </Animated.View>
        </Animated.View>

        {/* ── Spin buttons ── */}
        <View style={s.btnRow}>
          <TouchableOpacity
            style={[s.freeBtn, (spinning || freeLeft === 0) && s.btnDisabled]}
            onPress={() => doSpin(false)}
            disabled={spinning || freeLeft === 0}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={freeLeft > 0 ? ['#7C3AED', '#4F46E5'] : ['#1E293B', '#0F172A']}
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.btnGrad}
            >
              <Text style={[s.btnText, freeLeft === 0 && s.btnTextDim]}>
                {spinning ? t('fortune.spinning') : t('fortune.freeBtn', { n: freeLeft })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity
            style={[s.paidBtn, (spinning || paidSpinDisabled || (!onBeforePaidSpin && orb < PAID_SPIN_ORB)) && s.btnDisabled]}
            onPress={() => doSpin(true)}
            disabled={spinning || paidSpinDisabled || (!onBeforePaidSpin && orb < PAID_SPIN_ORB)}
            activeOpacity={0.85}
          >
            <LinearGradient
              colors={
                paidSpinDisabled || (!onBeforePaidSpin && orb < PAID_SPIN_ORB) ? ['#1E293B', '#0F172A']
                : onBeforePaidSpin ? ['#FACC15', '#F97316']   // SOL = gold
                : ['#B45309', '#D97706']                       // ORB fallback
              }
              start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
              style={s.btnGrad}
            >
              {onBeforePaidSpin && !paidSpinDisabled && (
                <View style={s.premiumPill}><Text style={s.premiumPillTxt}>{t('fortune.premiumBadge')}</Text></View>
              )}
              <Text style={[s.btnText,
                (paidSpinDisabled || (!onBeforePaidSpin && orb < PAID_SPIN_ORB)) && s.btnTextDim,
                onBeforePaidSpin && !paidSpinDisabled && { color: '#000' },
              ]}>
                {onBeforePaidSpin
                ? `🎰  ${paidSpinCostLabel ?? `${(PAID_SPIN_ORB / 1000).toFixed(0)}K ORB`}`
                : t('fortune.paidBtn', { cost: paidSpinCostLabel ?? `${(PAID_SPIN_ORB / 1000).toFixed(0)}K ORB` })}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
        </View>

        <Text style={s.solNote}>{t('fortune.solNote', { cost: paidSpinCostLabel ?? '10K ORB' })}</Text>
        {paidSpinStatus ? <Text style={s.solStatus}>{paidSpinStatus}</Text> : null}

        {/* ── Last result ── */}
        {lastResult && (
          <View style={[s.resultCard, { borderColor: lastResult.glow + '60' }]}>
            <Text style={s.resultEmoji}>{lastResult.emoji}</Text>
            <View style={{ flex: 1 }}>
              <Text style={[s.resultLabel, { color: lastResult.glow }]}>{segLabel(lastResult)}</Text>
              <Text style={s.resultSub}>
                {lastResult.reward.type === 'empty'   ? t('fortune.noLuck') :
                 lastResult.reward.type === 'jackpot' ? t('fortune.jackpotResult') :
                 lastResult.reward.type === 'boost'   ? t('fortune.resultBoost') :
                 lastResult.reward.type === 'x2'      ? t('fortune.resultX2') :
                 lastResult.reward.type === 'ticket'  ? t('fortune.resultTicket', { n: lastResult.reward.amount }) :
                 t('fortune.resultOrb', { n: lastResult.reward.amount.toLocaleString() })}
              </Text>
            </View>
          </View>
        )}

        {/* ── Prize table ── */}
        <View style={s.prizeTable}>
          <Text style={s.prizeTableTitle}>{t('fortune.prizes')}</Text>
          {SEGMENTS.filter((seg, i, arr) =>
            arr.findIndex(s2 => s2.label === seg.label) === i
          ).map((seg, i) => (
            <View key={i} style={s.prizeRow}>
              <Text style={{ fontSize: 18, width: 28 }}>{seg.emoji}</Text>
              <Text style={[s.prizeLabel, { color: seg.glow }]}>{segLabel(seg)}</Text>
              <View style={[s.prizeChance, { borderColor: seg.glow + '40' }]}>
                <Text style={[s.prizeChanceText, { color: seg.glow }]}>
                  {seg.reward.type === 'empty' ? t('fortune.chanceOften') :
                   seg.weight >= 12 ? t('fortune.chanceOften') :
                   seg.weight >= 6  ? t('fortune.chanceRare') :
                   seg.weight >= 3  ? t('fortune.chanceVeryRare') : t('fortune.chanceUltra')}
                </Text>
              </View>
            </View>
          ))}
        </View>

      </ScrollView>

      {/* ── Win overlay ── */}
      {showWin && lastResult && lastResult.reward.type !== 'empty' && (
        <View style={s.winOverlay} pointerEvents="none">
          {/* Confetti */}
          {confetti.map((p, i) => (
            <Animated.Text key={i} style={[s.confettiPiece, {
              transform: [
                { translateX: p.x },
                { translateY: p.y },
                { rotate: p.rot.interpolate({ inputRange: [0, 1], outputRange: ['0deg', `${(i % 2 === 0 ? 360 : -360)}deg`] }) },
              ],
              opacity: p.op,
            }]}>
              {['🌟','💎','⚡','🎯','🎫','✨','🔥','💰','🪙'][i % 9]}
            </Animated.Text>
          ))}

          {/* Win card */}
          <Animated.View style={[s.winCard, {
            transform: [{ scale: winScale }],
            opacity:   winOpacity,
          }]}>
            <Text style={s.winEmoji}>{lastResult.emoji}</Text>
            <Text style={[s.winTitle, { color: lastResult.glow }]}>
              {lastResult.reward.type === 'jackpot' ? t('fortune.jackpotResult') : t('common.claim')}
            </Text>
            <Text style={s.winAmount}>
              {lastResult.reward.type === 'orb'     ? `+${lastResult.reward.amount.toLocaleString()} ORB` :
               lastResult.reward.type === 'ticket'  ? t('fortune.winTicket', { n: lastResult.reward.amount }) :
               lastResult.reward.type === 'jackpot' ? `+${jackpot.toLocaleString()} ORB` :
               lastResult.reward.type === 'boost'   ? t('fortune.winBoost') :
               lastResult.reward.type === 'x2'      ? t('fortune.winX2') : ''}
            </Text>
          </Animated.View>
        </View>
      )}
    </View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────

const BG     = '#020510';
const PURPLE = '#A855F7';
const GOLD   = '#FACC15';

const s = StyleSheet.create({
  container:  { flex: 1, backgroundColor: BG },
  scroll:     { paddingHorizontal: 16, paddingBottom: 40 },

  // Jackpot
  jackpotBanner: { alignItems: 'center', paddingVertical: 16, borderRadius: 20, marginBottom: 14,
                   borderWidth: 1, borderColor: 'rgba(250,204,21,0.25)' },
  jackpotLabel:  { color: '#64748B', fontSize: 10, fontWeight: '800', letterSpacing: 3 },
  jackpotAmount: { color: GOLD, fontSize: 44, fontWeight: '900', textShadowColor: GOLD,
                   textShadowRadius: 16, textShadowOffset: { width: 0, height: 0 } },
  jackpotUnit:   { color: GOLD, fontSize: 13, fontWeight: '900', letterSpacing: 4, marginTop: -4 },
  jackpotSub:    { color: '#475569', fontSize: 11, marginTop: 6 },

  // Free spins
  spinsRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 10, justifyContent: 'center' },
  spinDot:       { width: 12, height: 12, borderRadius: 6 },
  spinDotActive: { backgroundColor: PURPLE, shadowColor: PURPLE, shadowRadius: 6, shadowOpacity: 1, elevation: 6 },
  spinDotUsed:   { backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  spinsLabel:    { color: '#475569', fontSize: 12, fontWeight: '700' },

  multBadge:     { backgroundColor: 'rgba(99,60,200,0.2)', borderRadius: 20, paddingHorizontal: 16,
                   paddingVertical: 8, alignSelf: 'center', marginBottom: 10,
                   borderWidth: 1, borderColor: 'rgba(139,92,246,0.5)' },
  multText:      { color: '#818CF8', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  // Wheel
  wheelWrap:     { alignItems: 'center', justifyContent: 'center', marginVertical: 16,
                   height: WHEEL_SIZE + 40 },
  glowRing:      { position: 'absolute', borderWidth: 2, borderColor: PURPLE + '40',
                   backgroundColor: 'transparent', shadowColor: PURPLE, shadowRadius: 24,
                   shadowOpacity: 0.9, elevation: 14 },
  lossFlash:     { position: 'absolute', backgroundColor: '#EF4444', opacity: 0 },
  ledBulb:       { position: 'absolute', width: 8, height: 8, borderRadius: 4,
                   backgroundColor: GOLD, shadowColor: GOLD,
                   shadowRadius: 8, shadowOpacity: 1, elevation: 8 },
  pointer:       { position: 'absolute', top: 4, zIndex: 20 },
  pointerTriangle: { width: 0, height: 0, borderLeftWidth: 10, borderRightWidth: 10,
                     borderBottomWidth: 22, borderStyle: 'solid',
                     borderLeftColor: 'transparent', borderRightColor: 'transparent',
                     borderBottomColor: GOLD,
                     shadowColor: GOLD, shadowRadius: 8, shadowOpacity: 1, elevation: 8 },

  wheel:         { backgroundColor: '#080D1E', borderWidth: 3, borderColor: PURPLE + '80',
                   shadowColor: PURPLE, shadowRadius: 24, shadowOpacity: 0.8, elevation: 20 },
  segCircle:     { position: 'absolute', alignItems: 'center', justifyContent: 'center',
                   borderWidth: 1.5, shadowOpacity: 0.8, shadowRadius: 6, elevation: 4 },
  spoke:         { position: 'absolute', top: 0, left: 0, width: 1, height: WHEEL_R - SEG_ICON_SZ / 2 - 4,
                   backgroundColor: '#1E293B', opacity: 0.6 },
  hub:           { position: 'absolute', width: 56, height: 56, borderRadius: 28,
                   backgroundColor: '#0A0F1E', borderWidth: 2, borderColor: PURPLE,
                   alignItems: 'center', justifyContent: 'center',
                   shadowColor: PURPLE, shadowRadius: 10, shadowOpacity: 1, elevation: 10 },
  hubText:       { color: PURPLE, fontSize: 9, fontWeight: '900', letterSpacing: 1 },

  // Buttons
  btnRow:        { gap: 10, marginBottom: 8 },
  freeBtn:       { borderRadius: 18, overflow: 'hidden' },
  paidBtn:       { borderRadius: 18, overflow: 'hidden' },
  btnGrad:       { paddingVertical: 15, alignItems: 'center' },
  btnText:       { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  btnTextDim:    { color: '#475569' },
  btnDisabled:   { opacity: 0.6 },
  premiumPill:   { position: 'absolute', top: 4, right: 10, backgroundColor: 'rgba(0,0,0,0.6)',
                   paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  premiumPillTxt:{ color: GOLD, fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  solNote:       { color: '#334155', fontSize: 11, textAlign: 'center', marginBottom: 16 },
  solStatus:     { color: '#00E5FF', fontSize: 11, textAlign: 'center', marginTop: -10, marginBottom: 16, fontWeight: '800' },

  // Last result
  resultCard:    { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: 'rgba(8,13,32,0.9)',
                   borderRadius: 16, padding: 14, marginBottom: 16, borderWidth: 1 },
  resultEmoji:   { fontSize: 32 },
  resultLabel:   { fontSize: 16, fontWeight: '900' },
  resultSub:     { color: '#64748B', fontSize: 12, marginTop: 3 },

  // Prize table
  prizeTable:    { backgroundColor: 'rgba(8,13,32,0.88)', borderRadius: 20, padding: 16,
                   borderWidth: 1, borderColor: 'rgba(99,60,200,0.25)' },
  prizeTableTitle:{ color: '#475569', fontSize: 10, fontWeight: '800', letterSpacing: 3, marginBottom: 12 },
  prizeRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6,
                   borderBottomWidth: 1, borderBottomColor: 'rgba(99,60,200,0.1)' },
  prizeLabel:    { flex: 1, fontSize: 13, fontWeight: '700' },
  prizeChance:   { borderWidth: 1, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  prizeChanceText:{ fontSize: 10, fontWeight: '800' },

  // Win overlay
  winOverlay:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                   alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' },
  confettiPiece: { position: 'absolute', fontSize: 20 },
  winCard:       { backgroundColor: '#080D1E', borderRadius: 28, padding: 32,
                   alignItems: 'center', borderWidth: 2, borderColor: GOLD,
                   shadowColor: GOLD, shadowRadius: 30, shadowOpacity: 0.8, elevation: 30 },
  winEmoji:      { fontSize: 56, marginBottom: 8 },
  winTitle:      { fontSize: 22, fontWeight: '900', letterSpacing: 2, marginBottom: 8 },
  winAmount:     { color: '#E2E8F0', fontSize: 28, fontWeight: '900' },
});
