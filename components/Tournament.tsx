import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Animated, Easing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { supabase } from '../lib/supabase';

const { width: W } = Dimensions.get('window');
const TOURNAMENT_ID = 'season-zero';

const SCORE_RULES = [
  { icon: '⚔️', action: 'Arena Raid Win',     pts: 50, color: '#EF4444' },
  { icon: '📦', action: 'Treasure Chest',      pts: 30, color: '#FACC15' },
  { icon: '🎰', action: 'Wheel Win',            pts: 20, color: '#A855F7' },
  { icon: '🏇', action: 'Horse Race Win',       pts: 15, color: '#FB923C' },
  { icon: '🚀', action: 'Space Run (100s)',     pts: 10, color: '#06B6D4' },
  { icon: '🌾', action: 'Lands Harvest ×100',  pts:  1, color: '#22C55E' },
];

type ScoreRow = {
  device_id: string;
  username:  string;
  score:     number;
  updated_at: number;
};

type Props = {
  deviceId:  string;
  username:  string;
  myScore:   number;
};

export default function Tournament({ deviceId, username, myScore }: Props) {
  const [scores,    setScores]    = useState<ScoreRow[]>([]);
  const [loading,   setLoading]   = useState(false);
  const [timeLeft,  setTimeLeft]  = useState({ d: 0, h: 0, m: 0, s: 0 });
  const [prizePool, setPrizePool] = useState(0);
  const [myRank,    setMyRank]    = useState<number | null>(null);

  const glowAnim   = useRef(new Animated.Value(0)).current;
  const trophyBob  = useRef(new Animated.Value(0)).current;
  const shimmerX   = useRef(new Animated.Value(0)).current;
  const prizeScale = useRef(new Animated.Value(1)).current;

  // ── animations ──────────────────────────────────────────────────────────
  useEffect(() => {
    Animated.loop(Animated.sequence([
      Animated.timing(glowAnim, { toValue: 1, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(glowAnim, { toValue: 0, duration: 1600, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ])).start();

    Animated.loop(Animated.sequence([
      Animated.timing(trophyBob, { toValue: -7, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(trophyBob, { toValue:  0, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();

    Animated.loop(
      Animated.timing(shimmerX, { toValue: 1, duration: 2800, easing: Easing.linear, useNativeDriver: true })
    ).start();

    Animated.loop(Animated.sequence([
      Animated.timing(prizeScale, { toValue: 1.04, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(prizeScale, { toValue: 1,    duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ])).start();
  }, []);

  // ── countdown ────────────────────────────────────────────────────────────
  useEffect(() => {
    const END = new Date('2026-06-01T00:00:00Z').getTime();
    const tick = () => {
      const diff = END - Date.now();
      if (diff <= 0) { setTimeLeft({ d: 0, h: 0, m: 0, s: 0 }); return; }
      setTimeLeft({
        d: Math.floor(diff / 86400000),
        h: Math.floor((diff % 86400000) / 3600000),
        m: Math.floor((diff % 3600000)  / 60000),
        s: Math.floor((diff % 60000)    / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  // ── data ─────────────────────────────────────────────────────────────────
  const fetchScores = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await supabase
        .from('tournament_scores')
        .select('device_id, username, score, updated_at')
        .eq('tournament_id', TOURNAMENT_ID)
        .order('score', { ascending: false })
        .limit(50);
      if (data) {
        setScores(data as ScoreRow[]);
        const rank = (data as ScoreRow[]).findIndex(r => r.device_id === deviceId);
        setMyRank(rank >= 0 ? rank + 1 : null);
      }
    } catch (_) {}
    setLoading(false);
  }, [deviceId]);

  const fetchPrizePool = useCallback(async () => {
    try {
      const { data } = await supabase
        .from('tournaments')
        .select('prize_pool')
        .eq('id', TOURNAMENT_ID)
        .single();
      if (data) setPrizePool(data.prize_pool);
    } catch (_) {}
  }, []);

  useEffect(() => {
    fetchScores();
    fetchPrizePool();
    const id = setInterval(() => { fetchScores(); fetchPrizePool(); }, 30_000);
    return () => clearInterval(id);
  }, [fetchScores, fetchPrizePool]);

  // ── helpers ───────────────────────────────────────────────────────────────
  function getMedal(rank: number) {
    if (rank === 1) return '🥇';
    if (rank === 2) return '🥈';
    if (rank === 3) return '🥉';
    return `#${rank}`;
  }
  function getPrize(rank: number) {
    if (rank === 1)   return '40% prize pool + Genesis NFT';
    if (rank <= 5)    return '20% prize pool + Rare Badge';
    if (rank <= 20)   return '2,500 ORB';
    if (rank <= 100)  return '500 ORB';
    return '';
  }
  const isMe = (row: ScoreRow) => row.device_id === deviceId;

  const top3  = scores.slice(0, 3);
  const rest  = scores.slice(3);

  const glowBorder = glowAnim.interpolate({ inputRange: [0, 1], outputRange: ['rgba(168,85,247,0.4)', 'rgba(168,85,247,1)'] });

  // Podium order: 2nd (left), 1st (center), 3rd (right)
  const podiumOrder: [ScoreRow | undefined, number, [string, string], number][] = [
    [top3[1], 2, ['#1E293B', '#94A3B8'],  80],
    [top3[0], 1, ['#78350F', '#F59E0B'], 108],
    [top3[2], 3, ['#431407', '#FB923C'],  60],
  ];

  return (
    <ScrollView style={s.root} contentContainerStyle={{ paddingBottom: 32 }} showsVerticalScrollIndicator={false}>

      {/* ══ HERO ══════════════════════════════════════════════════════════ */}
      <LinearGradient colors={['#0d0025', '#1a0040', '#3B0764', '#2D0060', '#0d0025']} style={s.hero}>
        {/* Shimmer sweep */}
        <Animated.View style={[s.heroShimmer, {
          opacity: shimmerX.interpolate({ inputRange: [0, 0.3, 0.7, 1], outputRange: [0, 0.25, 0.25, 0] }),
          transform: [{ translateX: shimmerX.interpolate({ inputRange: [0, 1], outputRange: [-W, W] }) }],
        }]} />

        <Animated.Text style={[s.heroTrophy, { transform: [{ translateY: trophyBob }] }]}>🏆</Animated.Text>
        <Text style={s.heroTitle}>TOURNAMENT</Text>
        <Text style={s.heroSeason}>SEASON ZERO  ·  GENESIS LEAGUE</Text>

        {/* Countdown blocks */}
        <View style={s.countdown}>
          {([
            [timeLeft.d, 'DAYS'],
            [timeLeft.h, 'HRS'],
            [timeLeft.m, 'MIN'],
            [timeLeft.s, 'SEC'],
          ] as [number, string][]).map(([v, l], i) => (
            <React.Fragment key={i}>
              {i > 0 && <Text style={s.countSep}>:</Text>}
              <View style={s.countItem}>
                <LinearGradient colors={['#4C1D95', '#7C3AED']} style={s.countGrad}>
                  <Text style={s.countNum}>{String(v).padStart(2, '0')}</Text>
                </LinearGradient>
                <Text style={s.countLabel}>{l}</Text>
              </View>
            </React.Fragment>
          ))}
        </View>

        <Text style={s.heroHint}>⚡ Until season ends</Text>
      </LinearGradient>

      {/* ══ PRIZE POOL ═══════════════════════════════════════════════════ */}
      <View style={s.px}>
        <Animated.View style={{ transform: [{ scale: prizeScale }] }}>
          <Animated.View style={[s.prizeBorder, { borderColor: glowBorder }]}>
            <LinearGradient colors={['#1A0A2E', '#2D0060', '#1A0A2E']} style={s.prizeInner}>
              <Text style={s.prizeTopLabel}>💎  PRIZE POOL</Text>
              <Text style={s.prizeVal}>
                {prizePool > 0 ? `${prizePool} SOL` : 'Forming…'}
              </Text>
              <Text style={s.prizeHint}>Grows with every Wheel spin · 0.01 SOL each</Text>
            </LinearGradient>
          </Animated.View>
        </Animated.View>

        {/* MY RANK */}
        {myScore > 0 && (
          <LinearGradient colors={['#052e16', '#14532d', '#052e16']} style={s.myCard}>
            <View style={s.myLeft}>
              <Text style={s.myMedal}>{myRank ? getMedal(myRank) : '❓'}</Text>
              <View>
                <Text style={s.myName}>{username}</Text>
                <Text style={s.mySub}>{myRank ? getPrize(myRank) : 'Not ranked yet'}</Text>
              </View>
            </View>
            <View style={s.myRight}>
              <Text style={s.myScoreVal}>{myScore.toLocaleString()}</Text>
              <Text style={s.myScoreLabel}>PTS</Text>
            </View>
          </LinearGradient>
        )}
      </View>

      {/* ══ SCORE RULES ══════════════════════════════════════════════════ */}
      <Text style={[s.sectionTitle, s.px]}>HOW TO EARN POINTS</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16, paddingBottom: 4 }}>
        {SCORE_RULES.map((r, i) => (
          <LinearGradient key={i} colors={['#0F172A', '#1E293B']} style={s.ruleCard}>
            <Text style={s.ruleIcon}>{r.icon}</Text>
            <Text style={[s.rulePts, { color: r.color }]}>+{r.pts}</Text>
            <Text style={s.rulePtsLabel}>pts</Text>
            <Text style={s.ruleAction}>{r.action}</Text>
          </LinearGradient>
        ))}
      </ScrollView>

      {/* ══ LEADERBOARD ══════════════════════════════════════════════════ */}
      <View style={[s.lbHeader, s.px]}>
        <Text style={s.sectionTitle}>TOP SEEKERS</Text>
        <TouchableOpacity onPress={fetchScores} style={s.refreshBtn}>
          <Text style={s.refreshTxt}>{loading ? '⏳' : '🔄'}</Text>
        </TouchableOpacity>
      </View>

      {/* Podium */}
      {top3.length > 0 && (
        <View style={[s.podiumWrap, s.px]}>
          {podiumOrder.map(([row, rank, colors, barH], idx) => {
            if (!row) return <View key={idx} style={s.podiumItem} />;
            return (
              <View key={row.device_id} style={[s.podiumItem, idx === 1 && s.podiumCenter]}>
                <Text style={s.podiumUsername} numberOfLines={1}>{row.username.slice(0, 9)}</Text>
                <Text style={s.podiumScore}>{row.score.toLocaleString()}</Text>
                <LinearGradient colors={colors} style={[s.podiumBar, { height: barH }]}>
                  <Text style={s.podiumMedal}>{getMedal(rank)}</Text>
                </LinearGradient>
              </View>
            );
          })}
        </View>
      )}

      {/* Ranks 4+ */}
      <View style={s.px}>
        {scores.length === 0 && !loading && (
          <View style={s.emptyBox}>
            <Text style={s.emptyIcon}>🎯</Text>
            <Text style={s.emptyTitle}>BE THE FIRST!</Text>
            <Text style={s.emptySub}>Play games to earn tournament points</Text>
          </View>
        )}
        {rest.map((row, i) => (
          <View key={row.device_id} style={[s.lbRow, isMe(row) && s.lbRowMe]}>
            <Text style={[s.lbRank, isMe(row) && { color: '#22C55E' }]}>#{i + 4}</Text>
            <View style={s.lbInfo}>
              <Text style={[s.lbName, isMe(row) && s.lbNameMe]}>{row.username}</Text>
              <Text style={s.lbPrize}>{getPrize(i + 4)}</Text>
            </View>
            <View style={s.lbScoreWrap}>
              <Text style={[s.lbScore, isMe(row) && s.lbScoreMe]}>{row.score.toLocaleString()}</Text>
              <Text style={s.lbPts}>pts</Text>
            </View>
          </View>
        ))}
      </View>

    </ScrollView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#020510' },
  px:             { paddingHorizontal: 16 },

  // Hero
  hero:           { paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20, alignItems: 'center', overflow: 'hidden' },
  heroShimmer:    { position: 'absolute', top: 0, left: 0, bottom: 0, width: W * 0.45,
                    backgroundColor: 'rgba(255,255,255,1)', transform: [{ skewX: '-20deg' }] },
  heroTrophy:     { fontSize: 52, marginBottom: 6 },
  heroTitle:      { color: '#FACC15', fontSize: 26, fontWeight: '900', letterSpacing: 4 },
  heroSeason:     { color: '#6D28D9', fontSize: 11, letterSpacing: 2, marginTop: 4, marginBottom: 18 },
  heroHint:       { color: '#4C1D95', fontSize: 10, letterSpacing: 1, marginTop: 10 },

  // Countdown
  countdown:      { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  countItem:      { alignItems: 'center', gap: 4 },
  countGrad:      { borderRadius: 10, paddingHorizontal: 10, paddingVertical: 8, minWidth: 52, alignItems: 'center' },
  countNum:       { color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  countLabel:     { color: '#6D28D9', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  countSep:       { color: '#7C3AED', fontSize: 22, fontWeight: '900', marginBottom: 14 },

  // Prize pool
  prizeBorder:    { borderRadius: 20, borderWidth: 1.5, marginBottom: 10, marginTop: 14 },
  prizeInner:     { borderRadius: 19, padding: 18, alignItems: 'center' },
  prizeTopLabel:  { color: '#A78BFA', fontSize: 11, letterSpacing: 3, fontWeight: '700' },
  prizeVal:       { color: '#E879F9', fontSize: 34, fontWeight: '900', marginVertical: 4 },
  prizeHint:      { color: '#4C1D95', fontSize: 10, textAlign: 'center' },

  // My card
  myCard:         { borderRadius: 16, padding: 14, flexDirection: 'row', alignItems: 'center',
                    justifyContent: 'space-between', marginBottom: 16,
                    borderWidth: 1.5, borderColor: '#22C55E' },
  myLeft:         { flexDirection: 'row', alignItems: 'center', gap: 12 },
  myMedal:        { fontSize: 28 },
  myName:         { color: '#22C55E', fontSize: 15, fontWeight: '800' },
  mySub:          { color: '#4ADE80', fontSize: 11, marginTop: 2 },
  myRight:        { alignItems: 'flex-end' },
  myScoreVal:     { color: '#22C55E', fontSize: 22, fontWeight: '900' },
  myScoreLabel:   { color: '#166534', fontSize: 10, letterSpacing: 1, fontWeight: '700' },

  // Section title
  sectionTitle:   { color: '#475569', fontSize: 10, fontWeight: '700', letterSpacing: 2,
                    marginBottom: 10, marginTop: 4 },

  // Score rules
  ruleCard:       { borderRadius: 14, borderWidth: 1, borderColor: '#1E293B',
                    padding: 12, alignItems: 'center', width: 100 },
  ruleIcon:       { fontSize: 20, marginBottom: 4 },
  rulePts:        { fontSize: 18, fontWeight: '900' },
  rulePtsLabel:   { color: '#475569', fontSize: 9, letterSpacing: 1 },
  ruleAction:     { color: '#64748B', fontSize: 9, textAlign: 'center', marginTop: 4 },

  // Leaderboard header
  lbHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  refreshBtn:     { padding: 6 },
  refreshTxt:     { fontSize: 16 },

  // Podium
  podiumWrap:     { flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'center',
                    gap: 8, marginBottom: 16, marginTop: 4 },
  podiumItem:     { flex: 1, alignItems: 'center' },
  podiumCenter:   { marginBottom: 0 },
  podiumUsername: { color: '#94A3B8', fontSize: 10, fontWeight: '700', marginBottom: 2,
                    textAlign: 'center' },
  podiumScore:    { color: '#FACC15', fontSize: 11, fontWeight: '900', marginBottom: 4 },
  podiumBar:      { width: '100%', borderRadius: 10, justifyContent: 'flex-end',
                    alignItems: 'center', paddingBottom: 8 },
  podiumMedal:    { fontSize: 20 },

  // Leaderboard rows
  emptyBox:       { alignItems: 'center', paddingVertical: 32 },
  emptyIcon:      { fontSize: 36, marginBottom: 8 },
  emptyTitle:     { color: '#4C1D95', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  emptySub:       { color: '#334155', fontSize: 12, marginTop: 4 },

  lbRow:          { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0B1120',
                    borderRadius: 12, padding: 12, marginBottom: 6,
                    borderWidth: 1, borderColor: '#1E293B', gap: 10 },
  lbRowMe:        { borderColor: '#22C55E', backgroundColor: '#052e16' },
  lbRank:         { color: '#475569', fontSize: 13, fontWeight: '900', width: 36, textAlign: 'center' },
  lbInfo:         { flex: 1 },
  lbName:         { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
  lbNameMe:       { color: '#22C55E' },
  lbPrize:        { color: '#334155', fontSize: 10, marginTop: 2 },
  lbScoreWrap:    { alignItems: 'flex-end' },
  lbScore:        { color: '#FACC15', fontSize: 15, fontWeight: '900' },
  lbScoreMe:      { color: '#22C55E' },
  lbPts:          { color: '#475569', fontSize: 9, letterSpacing: 1 },
});
