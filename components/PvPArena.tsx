import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated, Easing,
  Dimensions, Alert, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  fetchOpenMatches, fetchMyMatches, createPvpMatch, acceptPvpMatch,
  cancelPvpMatch, didWin,
  PVP_STAKES, PVP_DURATION, PVP_FEE_PCT,
  type PvpMatch,
} from '../lib/pvp';
import { t, useLang } from '../lib/i18n';

const { width: W } = Dimensions.get('window');

type Phase = 'lobby' | 'creating' | 'playing-create' | 'playing-accept' | 'result';
type Tab   = 'open' | 'history';

type Props = {
  deviceId:    string;
  username:    string;
  orb:         number;
  onSpendOrb:  (n: number) => void;
  onEarnOrb:   (n: number) => void;
  onPaySolEntry?: () => Promise<boolean>;
  solEntryCost?: number;
};

export default function PvPArena({ deviceId, username, orb, onSpendOrb, onEarnOrb, onPaySolEntry, solEntryCost }: Props) {
  useLang();
  const [premiumEntry, setPremiumEntry] = useState(false);
  // Lobby
  const [phase,      setPhase]      = useState<Phase>('lobby');
  const [tab,        setTab]        = useState<Tab>('open');
  const [openMatches, setOpenMatches] = useState<PvpMatch[]>([]);
  const [myMatches,   setMyMatches]   = useState<PvpMatch[]>([]);
  const [refreshing,  setRefreshing]  = useState(false);

  // Match creation / acceptance
  const [chosenStake,    setChosenStake]   = useState(PVP_STAKES[0]);
  const [targetMatch,    setTargetMatch]   = useState<PvpMatch | null>(null);  // when accepting
  const [resultMatch,    setResultMatch]   = useState<PvpMatch | null>(null);

  // Live tap battle
  const [secondsLeft, setSecondsLeft] = useState(PVP_DURATION);
  const [taps,        setTaps]        = useState(0);
  const tapRef      = useRef(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const tapScale = useRef(new Animated.Value(1)).current;
  const ringAnim = useRef(new Animated.Value(0)).current;

  // ── lobby data loader ────────────────────────────────────────────────────
  const reload = useCallback(async () => {
    const [open, mine] = await Promise.all([
      fetchOpenMatches(),
      fetchMyMatches(deviceId),
    ]);
    // hide own waiting matches from the open list (we show them in history)
    setOpenMatches(open.filter(m => m.challenger_id !== deviceId));
    setMyMatches(mine);
    setRefreshing(false);
  }, [deviceId]);

  useEffect(() => { reload(); }, [reload]);
  useEffect(() => {
    if (phase === 'lobby') {
      const id = setInterval(reload, 8_000);
      return () => clearInterval(id);
    }
  }, [phase, reload]);

  // ── tap battle ────────────────────────────────────────────────────────────
  function startBattle(nextPhase: 'playing-create' | 'playing-accept') {
    tapRef.current = 0;
    setTaps(0);
    setSecondsLeft(PVP_DURATION);
    setPhase(nextPhase);
    intervalRef.current = setInterval(() => {
      setSecondsLeft(prev => {
        if (prev <= 1) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          // Finalise after a tick so the UI can update
          setTimeout(() => finishBattle(nextPhase), 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }

  function tap() {
    if (phase !== 'playing-create' && phase !== 'playing-accept') return;
    tapRef.current += 1;
    setTaps(tapRef.current);
    Animated.sequence([
      Animated.timing(tapScale, { toValue: 0.92, duration: 60, useNativeDriver: true }),
      Animated.spring(tapScale, { toValue: 1, friction: 4, tension: 180, useNativeDriver: true }),
    ]).start();
    ringAnim.setValue(0);
    Animated.timing(ringAnim, { toValue: 1, duration: 350, useNativeDriver: true }).start();
  }

  async function finishBattle(currentPhase: Phase) {
    const finalScore = tapRef.current;

    if (currentPhase === 'playing-create') {
      // Create the waiting match with this score
      const m = await createPvpMatch({
        deviceId, username, score: finalScore, stakeOrb: chosenStake,
      });
      if (!m) {
        Alert.alert('Failed to create match', 'Try again in a moment.');
        // Refund stake
        onEarnOrb(chosenStake);
        setPhase('lobby');
        return;
      }
      setResultMatch(m);
      setPhase('result');
      reload();
    } else if (currentPhase === 'playing-accept' && targetMatch) {
      // Settle the existing match
      const m = await acceptPvpMatch({
        matchId:          targetMatch.id,
        challengerScore:  targetMatch.challenger_score,
        challengerId:     targetMatch.challenger_id,
        stakeOrb:         targetMatch.stake_orb,
        opponentDeviceId: deviceId,
        opponentUsername: username,
        opponentScore:    finalScore,
      });
      if (!m) {
        Alert.alert('Match unavailable', 'Someone else accepted it first. Your stake is refunded.');
        onEarnOrb(targetMatch.stake_orb);
        setPhase('lobby');
        return;
      }
      setResultMatch(m);
      setPhase('result');
      // Credit payout if winner or draw (refund)
      if (m.payout_orb && m.payout_orb > 0) {
        const isWinner = m.winner_id === deviceId;
        const isDraw   = m.winner_id === null;
        if (isWinner || isDraw) {
          onEarnOrb(m.payout_orb);
        }
      }
      setTargetMatch(null);
      reload();
    }
  }

  // ── handlers ──────────────────────────────────────────────────────────────
  async function tryCreate() {
    if (orb < chosenStake) {
      Alert.alert('Not enough ORB', `You need ${chosenStake.toLocaleString()} ORB to stake.`);
      return;
    }
    if (premiumEntry) {
      if (!onPaySolEntry) {
        Alert.alert('Premium unavailable', 'SOL entry not configured.');
        return;
      }
      const ok = await onPaySolEntry();
      if (!ok) return; // user cancelled or payment failed
    }
    onSpendOrb(chosenStake);    // lock stake
    startBattle('playing-create');
  }

  function tryAccept(m: PvpMatch) {
    if (m.challenger_id === deviceId) {
      Alert.alert('That\'s your own match', 'You can\'t play against yourself.');
      return;
    }
    if (orb < m.stake_orb) {
      Alert.alert('Not enough ORB', `You need ${m.stake_orb.toLocaleString()} ORB to accept.`);
      return;
    }
    Alert.alert(
      'Accept challenge?',
      `Stake ${m.stake_orb.toLocaleString()} ORB vs ${m.challenger_username}\n` +
      `Their score: ${m.challenger_score}\n` +
      `You have ${PVP_DURATION}s to beat it.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Accept', onPress: () => {
          onSpendOrb(m.stake_orb);
          setTargetMatch(m);
          startBattle('playing-accept');
        }},
      ],
    );
  }

  async function tryCancel(m: PvpMatch) {
    Alert.alert(
      'Cancel match?',
      `Your ${m.stake_orb.toLocaleString()} ORB stake will be refunded.`,
      [
        { text: 'Keep waiting', style: 'cancel' },
        { text: 'Cancel & refund', style: 'destructive', onPress: async () => {
          const ok = await cancelPvpMatch(m.id);
          if (ok) {
            onEarnOrb(m.stake_orb);
            reload();
          } else {
            Alert.alert('Could not cancel', 'Maybe someone just accepted it. Refresh to check.');
            reload();
          }
        }},
      ],
    );
  }

  // ── RENDER ───────────────────────────────────────────────────────────────

  // Tap battle screen
  if (phase === 'playing-create' || phase === 'playing-accept') {
    return (
      <View style={s.battleRoot}>
        <LinearGradient colors={['#1a0040','#3B0764','#831843','#1a0040']} style={s.battleHero}>
          <Text style={s.battleSub}>
            {phase === 'playing-create' ? t('pvp.creating') : `VS ${targetMatch?.challenger_username}`}
          </Text>
          <Text style={s.battleTitle}>{t('pvp.tapBattle')}</Text>
          <View style={s.battleRow}>
            <View style={s.battleStatBox}>
              <Text style={[s.battleStatNum, secondsLeft <= 5 && { color: '#EF4444' }]}>{secondsLeft}</Text>
              <Text style={s.battleStatLbl}>{t('pvp.secLeft')}</Text>
            </View>
            <View style={s.battleStatBox}>
              <Text style={s.battleStatNum}>{taps}</Text>
              <Text style={s.battleStatLbl}>{t('pvp.yourTaps')}</Text>
            </View>
            {phase === 'playing-accept' && targetMatch && (
              <View style={s.battleStatBox}>
                <Text style={[s.battleStatNum, { color: '#FB923C' }]}>{targetMatch.challenger_score}</Text>
                <Text style={s.battleStatLbl}>{t('pvp.toBeat')}</Text>
              </View>
            )}
          </View>
        </LinearGradient>

        <View style={s.tapArea}>
          <Animated.View style={[s.tapRing, {
            opacity: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [0.7, 0] }),
            transform: [{ scale: ringAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.4] }) }],
          }]} />
          <Animated.View style={{ transform: [{ scale: tapScale }] }}>
            <TouchableOpacity activeOpacity={0.85} onPress={tap} style={s.tapBtn}>
              <LinearGradient colors={['#A855F7','#EC4899']} style={s.tapBtnGrad}>
                <Text style={s.tapBtnText}>TAP</Text>
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </View>
    );
  }

  // Result screen
  if (phase === 'result' && resultMatch) {
    const meWon = resultMatch.status === 'finished' && didWin(resultMatch, deviceId);
    const isDraw = resultMatch.status === 'finished' && resultMatch.winner_id === null;
    const waiting = resultMatch.status === 'waiting';
    return (
      <View style={s.battleRoot}>
        <LinearGradient
          colors={
            waiting ? ['#0d0025','#1a0040','#0d0025']
            : meWon ? ['#052e16','#14532d','#052e16']
            : isDraw ? ['#1f2937','#374151','#1f2937']
            : ['#3f1d2d','#7c2d12','#3f1d2d']
          }
          style={s.resultCard}
        >
          <Text style={s.resultIcon}>
            {waiting ? '⏳' : meWon ? '🏆' : isDraw ? '🤝' : '💀'}
          </Text>
          <Text style={s.resultTitle}>
            {waiting ? t('pvp.waiting') : meWon ? t('pvp.winResult') : isDraw ? t('pvp.drawResult') : t('pvp.loseResult')}
          </Text>

          <View style={s.resultScores}>
            <View style={s.resultScoreBox}>
              <Text style={s.resultScoreLbl}>{t('pvp.you')}</Text>
              <Text style={s.resultScoreNum}>
                {resultMatch.challenger_id === deviceId
                  ? resultMatch.challenger_score
                  : resultMatch.opponent_score ?? 0}
              </Text>
            </View>
            <Text style={s.resultVs}>vs</Text>
            <View style={s.resultScoreBox}>
              <Text style={s.resultScoreLbl}>
                {resultMatch.challenger_id === deviceId
                  ? (resultMatch.opponent_username || 'WAITING')
                  : resultMatch.challenger_username}
              </Text>
              <Text style={s.resultScoreNum}>
                {resultMatch.challenger_id === deviceId
                  ? (resultMatch.opponent_score ?? '?')
                  : resultMatch.challenger_score}
              </Text>
            </View>
          </View>

          {resultMatch.payout_orb !== null && resultMatch.payout_orb > 0 && (meWon || isDraw) && (
            <View style={s.resultPayout}>
              <Text style={s.resultPayoutLbl}>
                {isDraw ? t('pvp.stakeRefunded') : t('pvp.payout')}
              </Text>
              <Text style={s.resultPayoutNum}>+{resultMatch.payout_orb.toLocaleString()} ORB</Text>
              {resultMatch.fee_orb ? (
                <Text style={s.resultPayoutFee}>fee {resultMatch.fee_orb} ORB ({Math.round(PVP_FEE_PCT*100)}%)</Text>
              ) : null}
            </View>
          )}

          <TouchableOpacity onPress={() => { setPhase('lobby'); setResultMatch(null); }} activeOpacity={0.85}>
            <LinearGradient colors={['#7C3AED','#5B21B6']} style={s.resultBtn}>
              <Text style={s.resultBtnText}>{t('pvp.backLobby')}</Text>
            </LinearGradient>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Creating screen (choose stake)
  if (phase === 'creating') {
    return (
      <View style={s.battleRoot}>
        <LinearGradient colors={['#0d0025','#1a0040','#0d0025']} style={s.createCard}>
          <Text style={s.createTitle}>{t('pvp.newChallenge')}</Text>
          <Text style={s.createSub}>Pick your stake. You play first — beat your own score will be hard to top.</Text>

          <View style={s.stakeRow}>
            {PVP_STAKES.map(amt => {
              const sel = chosenStake === amt;
              const canAfford = orb >= amt;
              return (
                <TouchableOpacity key={amt} onPress={() => canAfford && setChosenStake(amt)}
                  style={[s.stakeChip, sel && s.stakeChipActive, !canAfford && s.stakeChipDisabled]}
                  activeOpacity={canAfford ? 0.7 : 1}>
                  <Text style={[s.stakeChipNum, sel && s.stakeChipNumActive, !canAfford && s.stakeChipNumOff]}>
                    {amt >= 1000 ? `${amt/1000}K` : amt}
                  </Text>
                  <Text style={s.stakeChipLbl}>ORB</Text>
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={s.summaryBox}>
            <Text style={s.summaryRow}>Stake: <Text style={{color:'#EF4444'}}>{chosenStake.toLocaleString()} ORB</Text></Text>
            <Text style={s.summaryRow}>If you win: <Text style={{color:'#22C55E'}}>+{(chosenStake*2 - Math.round(chosenStake*2*PVP_FEE_PCT)).toLocaleString()} ORB</Text></Text>
            <Text style={s.summaryRow}>If you lose: <Text style={{color:'#94A3B8'}}>-{chosenStake.toLocaleString()} ORB</Text></Text>
            <Text style={s.summaryRow}>Fee: <Text style={{color:'#64748B'}}>{Math.round(PVP_FEE_PCT*100)}% (only on win)</Text></Text>
          </View>

          {/* Premium SOL entry toggle */}
          {onPaySolEntry && solEntryCost !== undefined && (
            <TouchableOpacity
              activeOpacity={0.85}
              onPress={() => setPremiumEntry(p => !p)}
              style={[s.premiumToggle, premiumEntry && s.premiumToggleActive]}
            >
              <View style={{ flex: 1 }}>
                <Text style={[s.premiumToggleTitle, premiumEntry && { color: '#FACC15' }]}>
                  💎 PREMIUM MATCH
                </Text>
                <Text style={s.premiumToggleSub}>
                  +{solEntryCost} SOL entry fee · Higher visibility · Premium badge
                </Text>
              </View>
              <View style={[s.premiumCheck, premiumEntry && s.premiumCheckActive]}>
                {premiumEntry && <Text style={s.premiumCheckMark}>✓</Text>}
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity activeOpacity={0.85} onPress={tryCreate} disabled={orb < chosenStake}>
            <LinearGradient
              colors={
                orb < chosenStake ? ['#1E293B','#0F172A']
                : premiumEntry ? ['#FACC15','#F97316']
                : ['#7C3AED','#EC4899']
              }
              style={s.createBtn}
            >
              <Text style={[s.createBtnText, orb < chosenStake && { color:'#475569' }, premiumEntry && orb >= chosenStake && { color: '#000' }]}>
                {orb >= chosenStake
                  ? (premiumEntry
                      ? `💎  PREMIUM  ·  ${solEntryCost} SOL + ${chosenStake.toLocaleString()} ORB`
                      : `⚔️  STAKE ${chosenStake.toLocaleString()} & PLAY`)
                  : 'NOT ENOUGH ORB'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => setPhase('lobby')} style={s.cancelBtn}>
            <Text style={s.cancelBtnText}>← Back</Text>
          </TouchableOpacity>
        </LinearGradient>
      </View>
    );
  }

  // Lobby (default)
  const visible = tab === 'open' ? openMatches : myMatches;

  return (
    <ScrollView style={s.root}
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); reload(); }} tintColor="#A855F7" />}
    >
      {/* Hero */}
      <LinearGradient colors={['#0d0025','#1a0040','#3B0764','#0d0025']} style={s.lobbyHero}>
        <View>
          <Text style={s.lobbyTag}>{t('pvp.title')}</Text>
          <Text style={s.lobbyTitle}>{t('pvp.tagline')}</Text>
          <Text style={s.lobbySub}>30-second tap battle. Winner takes 2× minus {Math.round(PVP_FEE_PCT*100)}% fee.</Text>
        </View>
      </LinearGradient>

      {/* Create button */}
      <TouchableOpacity activeOpacity={0.85} onPress={() => setPhase('creating')}>
        <LinearGradient colors={['#A855F7','#EC4899']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.bigCreateBtn}>
          <Text style={s.bigCreateBtnText}>{t('pvp.createChallenge')}</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Tabs */}
      <View style={s.tabRow}>
        <TouchableOpacity onPress={() => setTab('open')} style={[s.tab, tab === 'open' && s.tabActive]}>
          <Text style={[s.tabText, tab === 'open' && s.tabTextActive]}>{t('pvp.tabOpen')}</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={() => setTab('history')} style={[s.tab, tab === 'history' && s.tabActive]}>
          <Text style={[s.tabText, tab === 'history' && s.tabTextActive]}>{t('pvp.tabHistory')}</Text>
        </TouchableOpacity>
      </View>

      {/* List */}
      {visible.length === 0 ? (
        <View style={s.emptyBox}>
          <Text style={s.emptyIcon}>{tab === 'open' ? '🪑' : '📜'}</Text>
          <Text style={s.emptyTitle}>
            {tab === 'open' ? t('pvp.noOpen') : t('pvp.noHistory')}
          </Text>
          <Text style={s.emptySub}>
            {tab === 'open' ? t('pvp.beFirst') : t('pvp.createOrAccept')}
          </Text>
        </View>
      ) : (
        visible.map(m => {
          const mine     = m.challenger_id === deviceId || m.opponent_id === deviceId;
          const ownWait  = mine && m.status === 'waiting' && m.challenger_id === deviceId;
          const finished = m.status === 'finished';
          const meWon    = finished && didWin(m, deviceId);
          const meDraw   = finished && m.winner_id === null;
          const meLost   = finished && !meWon && !meDraw && mine;
          return (
            <View key={m.id} style={[
              s.matchCard,
              meWon && s.matchCardWin,
              meLost && s.matchCardLose,
              meDraw && s.matchCardDraw,
            ]}>
              <View style={s.matchTopRow}>
                <View style={{ flex: 1 }}>
                  <Text style={s.matchPlayer}>{m.challenger_username}</Text>
                  <Text style={s.matchSub}>
                    Score: {m.challenger_score}
                    {m.status === 'finished' && m.opponent_username
                      ? `  vs  ${m.opponent_username} (${m.opponent_score})`
                      : ''}
                  </Text>
                </View>
                <View style={s.matchStakeBox}>
                  <Text style={s.matchStakeNum}>{m.stake_orb.toLocaleString()}</Text>
                  <Text style={s.matchStakeLbl}>ORB</Text>
                </View>
              </View>

              {finished && (
                <View style={s.matchFooter}>
                  <Text style={[
                    s.matchStatus,
                    meWon && { color: '#22C55E' },
                    meLost && { color: '#EF4444' },
                    meDraw && { color: '#94A3B8' },
                  ]}>
                    {meWon ? `🏆 You won +${m.payout_orb} ORB`
                     : meLost ? `💀 You lost -${m.stake_orb} ORB`
                     : meDraw ? `🤝 Draw — refunded`
                     : `${m.challenger_username} ${m.winner_id === m.challenger_id ? 'won' : m.winner_id === m.opponent_id ? 'lost' : 'drew'}`}
                  </Text>
                </View>
              )}

              {ownWait && (
                <View style={s.matchActions}>
                  <Text style={s.matchWaitText}>Waiting for opponent…</Text>
                  <TouchableOpacity onPress={() => tryCancel(m)} style={s.cancelMatchBtn}>
                    <Text style={s.cancelMatchText}>Cancel & refund</Text>
                  </TouchableOpacity>
                </View>
              )}

              {!mine && m.status === 'waiting' && (
                <TouchableOpacity onPress={() => tryAccept(m)} activeOpacity={0.85}>
                  <LinearGradient colors={['#A855F7','#7C3AED']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.acceptBtn}>
                    <Text style={s.acceptBtnText}>⚔️  ACCEPT  ·  STAKE {m.stake_orb.toLocaleString()} ORB</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
            </View>
          );
        })
      )}

      <Text style={s.footnote}>
        Tap battles are 30 seconds. Stakes are held until the match resolves.{'\n'}
        5% fee applies on wins (funds the project treasury).
      </Text>
    </ScrollView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:              { flex: 1, backgroundColor: '#020510' },
  battleRoot:        { flex: 1, backgroundColor: '#020510' },

  // Lobby hero
  lobbyHero:         { paddingTop: 24, paddingBottom: 20, paddingHorizontal: 18 },
  lobbyTag:          { color: '#C084FC', fontSize: 11, letterSpacing: 3, fontWeight: '900' },
  lobbyTitle:        { color: '#FACC15', fontSize: 26, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  lobbySub:          { color: '#A78BFA', fontSize: 12, marginTop: 6 },

  // Create button
  bigCreateBtn:      { marginHorizontal: 14, marginTop: 12, paddingVertical: 16, borderRadius: 18,
                       alignItems: 'center' },
  bigCreateBtnText:  { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 2 },

  // Tabs
  tabRow:            { flexDirection: 'row', gap: 8, paddingHorizontal: 14, marginTop: 14, marginBottom: 10 },
  tab:               { flex: 1, paddingVertical: 8, borderRadius: 10,
                       backgroundColor: '#0B1120', borderWidth: 1, borderColor: '#1E293B',
                       alignItems: 'center' },
  tabActive:         { backgroundColor: 'rgba(168,85,247,0.18)', borderColor: '#7C3AED' },
  tabText:           { color: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  tabTextActive:     { color: '#C084FC' },

  // Match card
  matchCard:         { marginHorizontal: 14, marginBottom: 8, padding: 12, borderRadius: 14,
                       backgroundColor: '#0B1120', borderWidth: 1, borderColor: '#1E293B' },
  matchCardWin:      { borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.06)' },
  matchCardLose:     { borderColor: 'rgba(239,68,68,0.4)', backgroundColor: 'rgba(239,68,68,0.06)' },
  matchCardDraw:     { borderColor: '#475569' },
  matchTopRow:       { flexDirection: 'row', alignItems: 'center', gap: 12 },
  matchPlayer:       { color: '#E2E8F0', fontSize: 14, fontWeight: '800' },
  matchSub:          { color: '#64748B', fontSize: 11, marginTop: 2 },
  matchStakeBox:     { alignItems: 'center', paddingHorizontal: 10, paddingVertical: 6,
                       borderRadius: 10, backgroundColor: 'rgba(124,58,237,0.12)',
                       borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' },
  matchStakeNum:     { color: '#A855F7', fontSize: 13, fontWeight: '900' },
  matchStakeLbl:     { color: '#6D28D9', fontSize: 8, letterSpacing: 1, fontWeight: '700' },
  matchFooter:       { marginTop: 8 },
  matchStatus:       { fontSize: 11, fontWeight: '800' },
  matchActions:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       marginTop: 10 },
  matchWaitText:     { color: '#A78BFA', fontSize: 11, fontWeight: '700' },
  cancelMatchBtn:    { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8,
                       borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)' },
  cancelMatchText:   { color: '#EF4444', fontSize: 10, fontWeight: '800' },
  acceptBtn:         { marginTop: 10, paddingVertical: 10, alignItems: 'center', borderRadius: 12 },
  acceptBtnText:     { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 1 },

  // Empty
  emptyBox:          { marginHorizontal: 14, padding: 28, alignItems: 'center',
                       backgroundColor: '#0B1120', borderRadius: 16,
                       borderWidth: 1, borderColor: '#1E293B' },
  emptyIcon:         { fontSize: 36, marginBottom: 8 },
  emptyTitle:        { color: '#94A3B8', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  emptySub:          { color: '#475569', fontSize: 11, marginTop: 6, textAlign: 'center' },

  footnote:          { color: '#334155', fontSize: 9, textAlign: 'center',
                       paddingHorizontal: 28, marginTop: 14, lineHeight: 14 },

  // Create screen
  createCard:        { margin: 14, padding: 20, borderRadius: 20,
                       borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)' },
  createTitle:       { color: '#FACC15', fontSize: 20, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  createSub:         { color: '#94A3B8', fontSize: 12, textAlign: 'center', marginTop: 6, marginBottom: 18 },
  stakeRow:          { flexDirection: 'row', gap: 8, marginBottom: 18 },
  stakeChip:         { flex: 1, paddingVertical: 14, alignItems: 'center', borderRadius: 12,
                       backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B' },
  stakeChipActive:   { borderColor: '#A855F7', backgroundColor: 'rgba(168,85,247,0.15)' },
  stakeChipDisabled: { opacity: 0.35 },
  stakeChipNum:      { color: '#94A3B8', fontSize: 16, fontWeight: '900' },
  stakeChipNumActive:{ color: '#FACC15' },
  stakeChipNumOff:   { color: '#475569' },
  stakeChipLbl:      { color: '#475569', fontSize: 9, letterSpacing: 1, marginTop: 2 },

  summaryBox:        { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 14, padding: 14, gap: 6, marginBottom: 18,
                       borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' },
  summaryRow:        { color: '#94A3B8', fontSize: 12, fontWeight: '700' },

  premiumToggle:     { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14, borderRadius: 14,
                       backgroundColor: 'rgba(0,0,0,0.35)',
                       borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)', marginBottom: 14 },
  premiumToggleActive:{ borderColor: 'rgba(250,204,21,0.6)', backgroundColor: 'rgba(250,204,21,0.08)' },
  premiumToggleTitle:{ color: '#A78BFA', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  premiumToggleSub:  { color: '#64748B', fontSize: 10, marginTop: 3, fontWeight: '600' },
  premiumCheck:      { width: 24, height: 24, borderRadius: 6, borderWidth: 2, borderColor: '#334155',
                       alignItems: 'center', justifyContent: 'center' },
  premiumCheckActive:{ backgroundColor: '#FACC15', borderColor: '#FACC15' },
  premiumCheckMark:  { color: '#000', fontSize: 16, fontWeight: '900' },

  createBtn:         { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  createBtnText:     { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  cancelBtn:         { alignItems: 'center', marginTop: 12, padding: 8 },
  cancelBtnText:     { color: '#64748B', fontSize: 12 },

  // Battle screen
  battleHero:        { paddingVertical: 24, alignItems: 'center', gap: 6 },
  battleSub:         { color: '#A78BFA', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  battleTitle:       { color: '#FACC15', fontSize: 26, fontWeight: '900', letterSpacing: 3 },
  battleRow:         { flexDirection: 'row', gap: 24, marginTop: 16 },
  battleStatBox:     { alignItems: 'center' },
  battleStatNum:     { color: '#FFF', fontSize: 30, fontWeight: '900' },
  battleStatLbl:     { color: '#6D28D9', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 4 },

  tapArea:           { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tapRing:           { position: 'absolute', width: 240, height: 240, borderRadius: 120,
                       borderWidth: 3, borderColor: '#A855F7' },
  tapBtn:            { width: 220, height: 220, borderRadius: 110, overflow: 'hidden' },
  tapBtnGrad:        { flex: 1, alignItems: 'center', justifyContent: 'center' },
  tapBtnText:        { color: '#FFF', fontSize: 42, fontWeight: '900', letterSpacing: 6 },

  // Result screen
  resultCard:        { margin: 14, padding: 26, borderRadius: 22, alignItems: 'center', gap: 12,
                       borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.5)' },
  resultIcon:        { fontSize: 64 },
  resultTitle:       { color: '#FACC15', fontSize: 22, fontWeight: '900', letterSpacing: 3 },
  resultScores:      { flexDirection: 'row', alignItems: 'center', gap: 16, marginTop: 14 },
  resultScoreBox:    { alignItems: 'center', minWidth: 100 },
  resultScoreLbl:    { color: '#94A3B8', fontSize: 11, fontWeight: '800', letterSpacing: 1 },
  resultScoreNum:    { color: '#E2E8F0', fontSize: 32, fontWeight: '900', marginTop: 4 },
  resultVs:          { color: '#475569', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  resultPayout:      { alignItems: 'center', marginTop: 18 },
  resultPayoutLbl:   { color: '#A78BFA', fontSize: 10, letterSpacing: 2, fontWeight: '800' },
  resultPayoutNum:   { color: '#22C55E', fontSize: 24, fontWeight: '900' },
  resultPayoutFee:   { color: '#475569', fontSize: 10, marginTop: 4 },
  resultBtn:         { marginTop: 18, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12 },
  resultBtnText:     { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
});
