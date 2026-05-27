import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, Animated, Easing, Dimensions,
  TouchableOpacity, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';
import {
  GENESIS_PHASE, SEASON_1_START, FOUNDER_ORB_MULTIPLIER,
  getTimeUntilSeason1, fetchTreasuryPool, getPrizePoolPortion,
  calculatePrize, SOL_USD_FALLBACK,
} from '../lib/genesis';
import { TREASURY_WALLET } from '../lib/solanaMobile';

const { width: W } = Dimensions.get('window');

type PreSeasonRow = {
  device_id: string;
  username:  string;
  score:     number;
};

type Props = {
  deviceId: string;
  isFounder: boolean;
};

export default function GenesisNews({ deviceId, isFounder }: Props) {
  const [now,        setNow]        = useState(Date.now());
  const [pool,       setPool]       = useState<number | null>(null);
  const [scores,     setScores]     = useState<PreSeasonRow[]>([]);
  const [myRank,     setMyRank]     = useState<number | null>(null);
  const [solUsd]                    = useState(SOL_USD_FALLBACK);

  const glowAnim = useRef(new Animated.Value(0)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;
  const shimmer  = useRef(new Animated.Value(0)).current;

  // ── animations ──────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ])).start();

    Animated.loop(Animated.timing(ringAnim, {
      toValue: 1, duration: 12000, easing: Easing.linear, useNativeDriver: true,
    })).start();

    Animated.loop(Animated.timing(shimmer, {
      toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true,
    })).start();
  }, []);

  // ── countdown tick ──────────────────────────────────────────────────────
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);

  // ── live pool ───────────────────────────────────────────────────────────
  const reloadPool = useCallback(async () => {
    const sol = await fetchTreasuryPool();
    setPool(sol);
  }, []);

  useEffect(() => {
    reloadPool();
    const id = setInterval(reloadPool, 30_000); // every 30s
    return () => clearInterval(id);
  }, [reloadPool]);

  // ── leaderboard ─────────────────────────────────────────────────────────
  const reloadScores = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('tournament_scores')
        .select('device_id, username, score')
        .eq('tournament_id', 'season-zero')
        .order('score', { ascending: false })
        .limit(50);
      if (data) {
        setScores(data as PreSeasonRow[]);
        const idx = (data as PreSeasonRow[]).findIndex(r => r.device_id === deviceId);
        setMyRank(idx >= 0 ? idx + 1 : null);
      }
    } catch (_) {}
  }, [deviceId]);

  useEffect(() => {
    reloadScores();
    const id = setInterval(reloadScores, 30_000);
    return () => clearInterval(id);
  }, [reloadScores]);

  // ── derived ─────────────────────────────────────────────────────────────
  const cd = getTimeUntilSeason1(now);
  const prizePoolSol = pool !== null ? getPrizePoolPortion(pool) : null;
  const myPrize = (myRank && prizePoolSol !== null) ? calculatePrize(myRank, prizePoolSol) : 0;

  const glowOpacity = glowAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const ringRotate  = ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  function openExplorer() {
    Linking.openURL(`https://explorer.solana.com/address/${TREASURY_WALLET}?cluster=devnet`);
  }

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <LinearGradient colors={['#0d0025','#1a0040','#3B0764','#831843','#1a0040','#0d0025']} style={s.hero}>
        <Animated.View style={[s.heroShimmer, {
          opacity: shimmer.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 0.25, 0.25, 0] }),
          transform: [{ translateX: shimmer.interpolate({ inputRange: [0, 1], outputRange: [-W, W] }) }],
        }]} />

        <View style={s.heroPhaseBadge}>
          <Animated.View style={[s.heroPhaseDot, { opacity: glowOpacity }]} />
          <Text style={s.heroPhaseText}>GENESIS PRE-SEASON</Text>
        </View>

        <Text style={s.heroTitle}>SEEKER LEAGUE</Text>
        <Text style={s.heroTag}>The first season ever. Be a founder.</Text>

        {/* Countdown */}
        <View style={s.countdown}>
          {([
            [cd.days, 'DAYS'],
            [cd.hrs,  'HRS'],
            [cd.mins, 'MIN'],
            [cd.secs, 'SEC'],
          ] as [number, string][]).map(([v, l], i) => (
            <React.Fragment key={i}>
              {i > 0 && <Text style={s.countSep}>:</Text>}
              <View style={s.countItem}>
                <LinearGradient colors={['#4C1D95','#7C3AED']} style={s.countGrad}>
                  <Text style={s.countNum}>{String(v).padStart(2, '0')}</Text>
                </LinearGradient>
                <Text style={s.countLabel}>{l}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>
        <Text style={s.heroSub}>UNTIL SEASON 1 LAUNCH</Text>
      </LinearGradient>

      {/* ══ PRIZE POOL ═══════════════════════════════════════════════════ */}
      <View style={s.px}>
        <View style={s.poolWrap}>
          <Animated.View style={[s.poolRing, { transform: [{ rotate: ringRotate }] }]} />
          <LinearGradient colors={['#1A0A2E','#2D0060','#1A0A2E']} style={s.poolBox}>
            <Text style={s.poolLabel}>💰  ACCUMULATING PRIZE POOL</Text>
            <Text style={s.poolValue}>
              {pool === null ? '— SOL' : `${pool.toFixed(3)} SOL`}
            </Text>
            <Text style={s.poolUsd}>
              ≈ ${pool === null ? '—' : (pool * solUsd).toFixed(0)}
            </Text>
            <View style={s.poolBreakdown}>
              <View style={s.poolRow}>
                <Text style={s.poolKey}>For top 100 prizes (60%)</Text>
                <Text style={s.poolVal}>{prizePoolSol === null ? '—' : `${prizePoolSol.toFixed(3)} SOL`}</Text>
              </View>
              <View style={s.poolRow}>
                <Text style={s.poolKey}>For SKORA airdrop (20%)</Text>
                <Text style={s.poolVal}>{pool === null ? '—' : `${(pool * 0.2).toFixed(3)} SOL`}</Text>
              </View>
              <View style={s.poolRow}>
                <Text style={s.poolKey}>Project treasury (20%)</Text>
                <Text style={s.poolVal}>{pool === null ? '—' : `${(pool * 0.2).toFixed(3)} SOL`}</Text>
              </View>
            </View>
            <TouchableOpacity onPress={openExplorer} style={s.explorerBtn}>
              <Text style={s.explorerText}>🔗 View on Solana Explorer</Text>
            </TouchableOpacity>
          </LinearGradient>
        </View>
      </View>

      {/* ══ MY RANK ══════════════════════════════════════════════════════ */}
      {myRank !== null && (
        <View style={s.px}>
          <LinearGradient colors={['#052e16','#14532d','#052e16']} style={s.myCard}>
            <View style={s.myLeft}>
              <Text style={s.myRankBadge}>#{myRank}</Text>
              <View>
                <Text style={s.myTitle}>YOUR PRE-SEASON RANK</Text>
                <Text style={s.mySub}>
                  Estimated prize: <Text style={s.mySolPrize}>{myPrize.toFixed(4)} SOL</Text>
                </Text>
              </View>
            </View>
          </LinearGradient>
        </View>
      )}

      {/* ══ FOUNDER STATUS ═══════════════════════════════════════════════ */}
      <View style={s.px}>
        <LinearGradient
          colors={isFounder ? ['#3B0764','#7C2D12','#3B0764'] : ['#0F172A','#1E293B','#0F172A']}
          style={s.founderCard}
        >
          <View style={s.founderHeader}>
            <Text style={s.founderIcon}>{isFounder ? '🏛️' : '🔒'}</Text>
            <Text style={[s.founderTitle, { color: isFounder ? '#FACC15' : '#475569' }]}>
              {isFounder ? 'FOUNDER ✓' : 'FOUNDER LOCKED'}
            </Text>
          </View>
          <Text style={s.founderText}>
            {isFounder
              ? `You played during Genesis Pre-Season.\nYou get ${FOUNDER_ORB_MULTIPLIER}x ORB rewards FOREVER + exclusive Founder NFT at launch.`
              : `Play at least 1 paid Wheel spin during pre-season to become a Founder and unlock ${FOUNDER_ORB_MULTIPLIER}x ORB rewards forever.`
            }
          </Text>
        </LinearGradient>
      </View>

      {/* ══ TOP 10 PROJECTION ════════════════════════════════════════════ */}
      <Text style={[s.sectionTitle, s.px]}>WHO WINS AT SEASON 1 LAUNCH</Text>
      <View style={s.px}>
        {scores.length === 0 && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🌱</Text>
            <Text style={s.emptyTitle}>BE THE FIRST FOUNDER</Text>
            <Text style={s.emptySub}>No players ranked yet. Tap, play, spin — and own the leaderboard.</Text>
          </View>
        )}
        {scores.slice(0, 10).map((row, i) => {
          const rank  = i + 1;
          const prize = prizePoolSol !== null ? calculatePrize(rank, prizePoolSol) : 0;
          const me    = row.device_id === deviceId;
          return (
            <View key={row.device_id} style={[s.lbRow, me && s.lbRowMe]}>
              <Text style={[s.lbRank, me && { color: '#22C55E' }]}>
                {rank === 1 ? '🥇' : rank === 2 ? '🥈' : rank === 3 ? '🥉' : `#${rank}`}
              </Text>
              <View style={{ flex: 1 }}>
                <Text style={[s.lbName, me && { color: '#22C55E' }]}>{row.username}</Text>
                <Text style={s.lbScore}>{row.score.toLocaleString()} pts</Text>
              </View>
              <View style={s.lbPrize}>
                <Text style={s.lbPrizeNum}>{prize.toFixed(4)}</Text>
                <Text style={s.lbPrizeLabel}>SOL</Text>
              </View>
            </View>
          );
        })}
      </View>

      {/* ══ HOW IT WORKS ═════════════════════════════════════════════════ */}
      <Text style={[s.sectionTitle, s.px]}>HOW PRE-SEASON WORKS</Text>
      <View style={s.px}>
        {[
          { icon: '🎰', title: 'Play & spin',
            text: 'Every paid 0.01 SOL Wheel spin goes into the prize pool (live above)' },
          { icon: '🏆', title: 'Earn points',
            text: 'Win games → score tournament points → climb the pre-season leaderboard' },
          { icon: '🏛️', title: 'Become a Founder',
            text: `1 paid spin = Founder badge + ${FOUNDER_ORB_MULTIPLIER}x ORB rewards forever` },
          { icon: '💎', title: 'Season 1 launch',
            text: '60% of pool → top 100 prizes. 20% → SKORA airdrop. Auto-distributed.' },
        ].map((step, i) => (
          <View key={i} style={s.howRow}>
            <Text style={s.howIcon}>{step.icon}</Text>
            <View style={{ flex: 1 }}>
              <Text style={s.howTitle}>{step.title}</Text>
              <Text style={s.howText}>{step.text}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* ══ DISCLAIMER ═══════════════════════════════════════════════════ */}
      <Text style={s.disclaimer}>
        Genesis Pre-Season is on Solana devnet for testing.{'\n'}
        Treasury wallet is transparent and verifiable on-chain.{'\n'}
        Prize distribution will happen automatically at Season 1 launch.
      </Text>
    </ScrollView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#020510' },
  px:             { paddingHorizontal: 16, marginBottom: 12 },

  // Hero
  hero:           { paddingTop: 32, paddingBottom: 28, paddingHorizontal: 20,
                    alignItems: 'center', overflow: 'hidden' },
  heroShimmer:    { position: 'absolute', top: 0, left: 0, bottom: 0, width: W * 0.5,
                    backgroundColor: 'rgba(255,255,255,1)', transform: [{ skewX: '-20deg' }] },

  heroPhaseBadge: { flexDirection: 'row', alignItems: 'center', gap: 6,
                    backgroundColor: 'rgba(168,85,247,0.18)', borderRadius: 999,
                    paddingHorizontal: 12, paddingVertical: 5,
                    borderWidth: 1, borderColor: 'rgba(168,85,247,0.5)' },
  heroPhaseDot:   { width: 6, height: 6, borderRadius: 3, backgroundColor: '#EC4899' },
  heroPhaseText:  { color: '#C084FC', fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  heroTitle:      { color: '#FACC15', fontSize: 30, fontWeight: '900', letterSpacing: 4, marginTop: 14 },
  heroTag:        { color: '#A78BFA', fontSize: 12, letterSpacing: 1, marginTop: 6, marginBottom: 22 },
  heroSub:        { color: '#4C1D95', fontSize: 9, letterSpacing: 2, marginTop: 12 },

  // Countdown
  countdown:      { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  countItem:      { alignItems: 'center', gap: 4 },
  countGrad:      { borderRadius: 10, paddingHorizontal: 11, paddingVertical: 9, minWidth: 58, alignItems: 'center' },
  countNum:       { color: '#fff', fontSize: 24, fontWeight: '900', letterSpacing: 1 },
  countLabel:     { color: '#6D28D9', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  countSep:       { color: '#7C3AED', fontSize: 22, fontWeight: '900', marginBottom: 16 },

  // Pool
  poolWrap:       { marginTop: 14, position: 'relative' },
  poolRing:       { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6,
                    borderRadius: 26, borderWidth: 1, borderColor: 'rgba(168,85,247,0.3)',
                    borderStyle: 'dashed' },
  poolBox:        { borderRadius: 20, padding: 18, alignItems: 'center',
                    borderWidth: 1.5, borderColor: '#7C3AED' },
  poolLabel:      { color: '#A78BFA', fontSize: 10, letterSpacing: 3, fontWeight: '800' },
  poolValue:      { color: '#FACC15', fontSize: 38, fontWeight: '900', marginTop: 6, letterSpacing: -1 },
  poolUsd:        { color: '#6D28D9', fontSize: 13, fontWeight: '700', marginTop: 2 },
  poolBreakdown:  { width: '100%', gap: 6, marginTop: 16,
                    paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(124,58,237,0.25)' },
  poolRow:        { flexDirection: 'row', justifyContent: 'space-between' },
  poolKey:        { color: '#64748B', fontSize: 11 },
  poolVal:        { color: '#E2E8F0', fontSize: 11, fontWeight: '800' },
  explorerBtn:    { marginTop: 14, paddingVertical: 6, paddingHorizontal: 12,
                    borderRadius: 12, borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' },
  explorerText:   { color: '#A78BFA', fontSize: 10, fontWeight: '700', letterSpacing: 1 },

  // My rank
  myCard:         { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center',
                    borderWidth: 1.5, borderColor: '#22C55E' },
  myLeft:         { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  myRankBadge:    { color: '#22C55E', fontSize: 26, fontWeight: '900', letterSpacing: -1 },
  myTitle:        { color: '#22C55E', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  mySub:          { color: '#4ADE80', fontSize: 12, marginTop: 2 },
  mySolPrize:     { color: '#FACC15', fontWeight: '900' },

  // Founder
  founderCard:    { borderRadius: 16, padding: 16, borderWidth: 1.5,
                    borderColor: 'rgba(250,204,21,0.4)' },
  founderHeader:  { flexDirection: 'row', alignItems: 'center', gap: 10 },
  founderIcon:    { fontSize: 28 },
  founderTitle:   { fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  founderText:    { color: '#94A3B8', fontSize: 12, marginTop: 8, lineHeight: 18 },

  // Section
  sectionTitle:   { color: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: 2,
                    marginTop: 4, marginBottom: 10, paddingHorizontal: 16 },

  // Leaderboard
  emptyBox:       { alignItems: 'center', paddingVertical: 32,
                    backgroundColor: '#0B1120', borderRadius: 16, borderWidth: 1, borderColor: '#1E293B' },
  emptyIcon:      { fontSize: 36, marginBottom: 8 },
  emptyTitle:     { color: '#C084FC', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  emptySub:       { color: '#475569', fontSize: 11, marginTop: 6, textAlign: 'center',
                    paddingHorizontal: 20 },

  lbRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1120',
                    borderRadius: 12, padding: 12, marginBottom: 6,
                    borderWidth: 1, borderColor: '#1E293B', gap: 12 },
  lbRowMe:        { borderColor: '#22C55E', backgroundColor: '#052e16' },
  lbRank:         { color: '#475569', fontSize: 18, fontWeight: '900', width: 36, textAlign: 'center' },
  lbName:         { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
  lbScore:        { color: '#475569', fontSize: 10, marginTop: 2 },
  lbPrize:        { alignItems: 'flex-end' },
  lbPrizeNum:     { color: '#FACC15', fontSize: 13, fontWeight: '900' },
  lbPrizeLabel:   { color: '#4C1D95', fontSize: 8, letterSpacing: 1 },

  // How it works
  howRow:         { flexDirection: 'row', gap: 12, backgroundColor: '#0B1120',
                    borderRadius: 12, padding: 12, marginBottom: 6,
                    borderWidth: 1, borderColor: '#1E293B' },
  howIcon:        { fontSize: 22 },
  howTitle:       { color: '#E2E8F0', fontSize: 13, fontWeight: '800' },
  howText:        { color: '#64748B', fontSize: 11, marginTop: 2, lineHeight: 16 },

  // Disclaimer
  disclaimer:     { color: '#334155', fontSize: 10, textAlign: 'center', lineHeight: 16,
                    paddingHorizontal: 24, marginTop: 16 },
});
