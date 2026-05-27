import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  TextInput, Animated, Easing, Alert,
} from 'react-native';
import { supabase } from '../lib/supabase';
import {
  SKORA_MINT, SKORA_NETWORK, ORB_PER_SKORA, MIN_CLAIM_ORB,
  orbToSkora, skoraDisplay,
} from '../lib/skora';

// ──────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────
type ClaimRow = {
  id: string;
  orb_spent: number;
  skora_amount: number;
  status: 'pending' | 'processed' | 'rejected';
  created_at: string;
  wallet_address: string;
};

type Props = {
  orb: number;
  onSpendOrb: (n: number) => void;
  deviceId: string;
};

// ──────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  pending:   '#FACC15',
  processed: '#22C55E',
  rejected:  '#EF4444',
};
const STATUS_LABEL: Record<string, string> = {
  pending:   '⏳ В очереди',
  processed: '✅ Выполнено',
  rejected:  '❌ Отклонено',
};

function shortAddr(addr: string) {
  if (!addr || addr.length < 10) return addr;
  return addr.slice(0, 6) + '...' + addr.slice(-4);
}

// ──────────────────────────────────────────────
export default function SKORAWallet({ orb, onSpendOrb, deviceId }: Props) {
  const [walletInput, setWalletInput] = useState('');
  const [savedWallet, setSavedWallet] = useState('');
  const [claims,      setClaims]      = useState<ClaimRow[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [tab,         setTab]         = useState<'claim' | 'info' | 'history'>('claim');
  const [claimAmount, setClaimAmount] = useState(MIN_CLAIM_ORB); // ORB to claim

  // Animations
  const glowAnim  = useRef(new Animated.Value(0)).current;
  const ringAnim  = useRef(new Animated.Value(0)).current;
  const scoreAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Glow pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim,  { toValue: 1,   duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowAnim,  { toValue: 0.3, duration: 1800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();
    // Ring rotation
    Animated.loop(
      Animated.timing(ringAnim, { toValue: 1, duration: 8000, easing: Easing.linear, useNativeDriver: true })
    ).start();
    // Score count up
    Animated.timing(scoreAnim, { toValue: 1, duration: 1200, easing: Easing.out(Easing.cubic), useNativeDriver: false }).start();
  }, []);

  // Load saved wallet + claims
  useEffect(() => {
    (async () => {
      try {
        const { data } = await supabase
          .from('skora_claims')
          .select('*')
          .eq('device_id', deviceId)
          .order('created_at', { ascending: false })
          .limit(20);
        if (data) setClaims(data as ClaimRow[]);
      } catch (_) {}
    })();
  }, [deviceId]);

  // Submit claim
  const submitClaim = useCallback(async () => {
    const addr = walletInput.trim();
    if (!addr || addr.length < 32) {
      Alert.alert('Ошибка', 'Введи корректный Solana-адрес кошелька');
      return;
    }
    if (claimAmount < MIN_CLAIM_ORB) {
      Alert.alert('Минимум', `Минимальная заявка: ${MIN_CLAIM_ORB.toLocaleString()} ORB (1 SKORA)`);
      return;
    }
    if (orb < claimAmount) {
      Alert.alert('Недостаточно ORB', `У тебя ${orb.toLocaleString()} ORB, нужно ${claimAmount.toLocaleString()}`);
      return;
    }
    const skoraAmt = orbToSkora(claimAmount);

    Alert.alert(
      '💎 Подтверди заявку',
      `Потратить ${claimAmount.toLocaleString()} ORB → получить ${skoraAmt.toFixed(2)} SKORA?\n\nКошелёк: ${shortAddr(addr)}`,
      [
        { text: 'Отмена', style: 'cancel' },
        {
          text: 'ПОДТВЕРДИТЬ',
          onPress: async () => {
            setLoading(true);
            try {
              const { data, error } = await supabase
                .from('skora_claims')
                .insert({
                  device_id:      deviceId,
                  wallet_address: addr,
                  orb_spent:      claimAmount,
                  skora_amount:   skoraAmt,
                  status:         'pending',
                })
                .select()
                .single();

              if (error) throw error;

              onSpendOrb(claimAmount);
              setSavedWallet(addr);
              setWalletInput('');
              setClaims(prev => [data as ClaimRow, ...prev]);
              setTab('history');
              Alert.alert('✅ Заявка принята!', `${skoraAmt.toFixed(2)} SKORA будут отправлены на твой кошелёк в течение 24 часов.`);
            } catch (e: any) {
              Alert.alert('Ошибка', e?.message ?? 'Попробуй снова');
            }
            setLoading(false);
          },
        },
      ]
    );
  }, [walletInput, claimAmount, orb, deviceId, onSpendOrb]);

  const availableSkora = orbToSkora(orb);
  const pendingSkora = claims.filter(c => c.status === 'pending').reduce((s, c) => s + c.skora_amount, 0);
  const totalEarned  = claims.filter(c => c.status === 'processed').reduce((s, c) => s + c.skora_amount, 0);

  const ringRotate = ringAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <View style={s.container}>
      {/* ── Header ── */}
      <View style={s.header}>
        <Animated.View style={[s.tokenRingOuter, { transform: [{ rotate: ringRotate }] }]}>
          <View style={s.tokenRingInner} />
        </Animated.View>
        <Animated.Text style={[s.tokenLabel, { opacity: glowAnim }]}>💎 SKORA</Animated.Text>
        <Text style={s.tokenNetwork}>{SKORA_NETWORK.toUpperCase()} · SPL TOKEN</Text>
        <Text style={s.tokenRate}>10,000 ORB = 1 SKORA</Text>

        {/* Balance row */}
        <View style={s.balanceRow}>
          <View style={s.balCard}>
            <Text style={s.balValue}>{skoraDisplay(orb)}</Text>
            <Text style={s.balLabel}>ДОСТУПНО SKORA</Text>
          </View>
          <View style={s.balCard}>
            <Text style={[s.balValue, { color: '#FACC15' }]}>{pendingSkora.toFixed(2)}</Text>
            <Text style={s.balLabel}>В ОЧЕРЕДИ</Text>
          </View>
          <View style={s.balCard}>
            <Text style={[s.balValue, { color: '#22C55E' }]}>{totalEarned.toFixed(2)}</Text>
            <Text style={s.balLabel}>ПОЛУЧЕНО</Text>
          </View>
        </View>
      </View>

      {/* ── Tabs ── */}
      <View style={s.tabRow}>
        {(['claim', 'info', 'history'] as const).map(t => (
          <TouchableOpacity key={t} style={[s.tab, tab === t && s.tabActive]} onPress={() => setTab(t)}>
            <Text style={[s.tabTxt, tab === t && s.tabTxtActive]}>
              {t === 'claim' ? '💰 Клейм' : t === 'info' ? '📄 Токен' : `📋 История${claims.length ? ` (${claims.length})` : ''}`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Claim Tab ── */}
      {tab === 'claim' && (
        <ScrollView contentContainerStyle={s.section}>
          <View style={s.claimCard}>
            <Text style={s.claimTitle}>Получи SKORA</Text>
            <Text style={s.claimDesc}>Обменяй заработанный ORB на реальный SPL-токен SKORA на Solana {SKORA_NETWORK}.</Text>

            {/* Amount selector */}
            <Text style={s.inputLabel}>Количество ORB для обмена</Text>
            <View style={s.amountRow}>
              {[10_000, 50_000, 100_000, 500_000].map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[s.amtChip, claimAmount === amt && s.amtChipActive, orb < amt && s.amtChipDisabled]}
                  onPress={() => orb >= amt && setClaimAmount(amt)}
                >
                  <Text style={[s.amtChipTxt, claimAmount === amt && s.amtChipTxtActive, orb < amt && s.amtChipTxtDisabled]}>
                    {amt >= 1_000_000 ? `${amt / 1_000_000}M` : `${amt / 1000}K`}
                  </Text>
                  <Text style={[s.amtChipSub, orb < amt && { color: '#334155' }]}>
                    = {orbToSkora(amt).toFixed(amt >= 100_000 ? 0 : 1)} SKR
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
            <View style={s.orbBalance}>
              <Text style={s.orbBalTxt}>Твой баланс: <Text style={{ color: '#A855F7', fontWeight: '900' }}>{orb.toLocaleString()} ORB</Text></Text>
            </View>

            {/* Wallet address */}
            <Text style={s.inputLabel}>Solana-адрес кошелька</Text>
            <TextInput
              style={s.walletInput}
              value={walletInput}
              onChangeText={setWalletInput}
              placeholder="Вставь адрес (Phantom / Backpack / Saga)"
              placeholderTextColor="#334155"
              autoCapitalize="none"
              autoCorrect={false}
            />
            {savedWallet !== '' && (
              <TouchableOpacity onPress={() => setWalletInput(savedWallet)} style={s.savedAddrBtn}>
                <Text style={s.savedAddrTxt}>📋 Использовать: {shortAddr(savedWallet)}</Text>
              </TouchableOpacity>
            )}

            {/* Summary */}
            {walletInput.length > 30 && (
              <View style={s.summaryBox}>
                <Text style={s.summaryRow}>
                  Отдашь: <Text style={{ color: '#EF4444', fontWeight: '800' }}>{claimAmount.toLocaleString()} ORB</Text>
                </Text>
                <Text style={s.summaryRow}>
                  Получишь: <Text style={{ color: '#22C55E', fontWeight: '800' }}>{orbToSkora(claimAmount).toFixed(2)} SKORA</Text>
                </Text>
                <Text style={s.summaryRow}>
                  Кошелёк: <Text style={{ color: '#94A3B8' }}>{shortAddr(walletInput.trim())}</Text>
                </Text>
              </View>
            )}

            <TouchableOpacity
              style={[s.claimBtn, (loading || orb < claimAmount || walletInput.length < 32) && s.claimBtnDisabled]}
              onPress={submitClaim}
              disabled={loading || orb < claimAmount || walletInput.length < 32}
            >
              <Text style={s.claimBtnTxt}>{loading ? '⏳ Отправляем...' : '💎 ПОЛУЧИТЬ SKORA'}</Text>
            </TouchableOpacity>

            <Text style={s.claimNote}>
              ⏱ Обработка заявок в течение 24ч. Токены отправляются вручную на devnet.
            </Text>
          </View>
        </ScrollView>
      )}

      {/* ── Info Tab ── */}
      {tab === 'info' && (
        <ScrollView contentContainerStyle={s.section}>
          <View style={s.infoCard}>
            <Text style={s.infoTitle}>О токене SKORA</Text>
            {[
              ['Название',   'SKORA'],
              ['Сеть',       'Solana ' + SKORA_NETWORK],
              ['Стандарт',   'SPL Token'],
              ['Decimals',   '6'],
              ['Эмиссия',    '1,000,000,000 SKORA'],
              ['Курс',       '10,000 ORB = 1 SKORA'],
              ['Mint',       (SKORA_MINT as string) === 'PASTE_MINT_ADDRESS_HERE' ? '⚠️ Настройка...' : SKORA_MINT],
            ].map(([k, v]) => (
              <View key={k} style={s.infoRow}>
                <Text style={s.infoKey}>{k}</Text>
                <Text style={[s.infoVal, k === 'Mint' && { fontSize: 10, flex: 1.5 }]} numberOfLines={1}>{v}</Text>
              </View>
            ))}

            <View style={s.divider} />
            <Text style={s.infoTitle}>Как заработать ORB</Text>
            {[
              ['⚡', 'Тап по Signal',         '10-75 ORB'],
              ['🎰', 'Выигрыш на Wheel',       '500–50K ORB'],
              ['🚀', 'Space Runner',            'Очки × 2'],
              ['⚔️', 'Победа в Arena',          '500–5K ORB'],
              ['🌾', 'Сбор урожая в Lands',     'до 600/час'],
              ['📦', 'Сундуки в Treasure Hunt', '100–1K ORB'],
            ].map(([icon, act, earn]) => (
              <View key={act} style={s.earnRow}>
                <Text style={s.earnIcon}>{icon}</Text>
                <Text style={s.earnAct}>{act}</Text>
                <Text style={s.earnVal}>{earn}</Text>
              </View>
            ))}
          </View>
        </ScrollView>
      )}

      {/* ── History Tab ── */}
      {tab === 'history' && (
        <ScrollView contentContainerStyle={s.section}>
          {claims.length === 0 ? (
            <Text style={s.emptyTxt}>Заявок пока нет{'\n'}Сыграй и заработай ORB для первого клейма!</Text>
          ) : (
            claims.map(c => (
              <View key={c.id} style={s.claimRow}>
                <View style={s.claimRowLeft}>
                  <Text style={[s.claimStatus, { color: STATUS_COLOR[c.status] }]}>{STATUS_LABEL[c.status]}</Text>
                  <Text style={s.claimWallet}>{shortAddr(c.wallet_address)}</Text>
                  <Text style={s.claimDate}>{new Date(c.created_at).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</Text>
                </View>
                <View style={s.claimRowRight}>
                  <Text style={s.claimSkora}>+{Number(c.skora_amount).toFixed(2)}</Text>
                  <Text style={s.claimSkoraLabel}>SKORA</Text>
                  <Text style={s.claimOrb}>-{Number(c.orb_spent).toLocaleString()} ORB</Text>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}
    </View>
  );
}

// ──────────────────────────────────────────────
const CYAN   = '#00E5FF';
const PURPLE = '#A855F7';
const YELLOW = '#FACC15';
const GREEN  = '#22C55E';
const BG     = '#020510';

const s = StyleSheet.create({
  container:    { flex: 1, backgroundColor: BG },

  // Header
  header:       { alignItems: 'center', paddingTop: 16, paddingBottom: 12, paddingHorizontal: 20, borderBottomWidth: 1, borderBottomColor: '#0E2A3F' },
  tokenRingOuter: { position: 'absolute', top: 8, width: 180, height: 180, borderRadius: 90, borderWidth: 1, borderColor: CYAN + '22', borderStyle: 'dashed' },
  tokenRingInner: { position: 'absolute', top: 10, left: 10, width: 160, height: 160, borderRadius: 80, borderWidth: 1, borderColor: PURPLE + '15' },
  tokenLabel:   { color: CYAN, fontSize: 32, fontWeight: '900', letterSpacing: 6, textShadowColor: CYAN, textShadowRadius: 20, textShadowOffset: { width: 0, height: 0 } },
  tokenNetwork: { color: '#475569', fontSize: 10, letterSpacing: 2, marginTop: 2 },
  tokenRate:    { color: PURPLE, fontSize: 12, fontWeight: '700', marginTop: 4, marginBottom: 12 },

  balanceRow:   { flexDirection: 'row', gap: 8, width: '100%' },
  balCard:      { flex: 1, backgroundColor: '#0A1628', borderRadius: 14, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  balValue:     { color: CYAN, fontSize: 17, fontWeight: '900' },
  balLabel:     { color: '#475569', fontSize: 8, letterSpacing: 1, marginTop: 2, textAlign: 'center' },

  // Tabs
  tabRow:       { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: '#0E2A3F' },
  tab:          { flex: 1, paddingVertical: 10, alignItems: 'center' },
  tabActive:    { borderBottomWidth: 2, borderBottomColor: CYAN },
  tabTxt:       { color: '#334155', fontSize: 11, fontWeight: '700' },
  tabTxtActive: { color: CYAN },

  section:      { padding: 14, paddingBottom: 30 },

  // Claim tab
  claimCard:    { backgroundColor: '#0A1628', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#1E293B' },
  claimTitle:   { color: CYAN, fontSize: 18, fontWeight: '900', letterSpacing: 1, marginBottom: 6 },
  claimDesc:    { color: '#64748B', fontSize: 12, lineHeight: 18, marginBottom: 16 },

  inputLabel:   { color: '#94A3B8', fontSize: 11, fontWeight: '700', letterSpacing: 1, marginBottom: 8 },

  amountRow:    { flexDirection: 'row', gap: 8, marginBottom: 8 },
  amtChip:      { flex: 1, backgroundColor: '#0F172A', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B', padding: 8, alignItems: 'center' },
  amtChipActive:{ borderColor: CYAN, backgroundColor: '#001A2E' },
  amtChipDisabled: { opacity: 0.35 },
  amtChipTxt:   { color: '#94A3B8', fontSize: 12, fontWeight: '800' },
  amtChipTxtActive: { color: CYAN },
  amtChipTxtDisabled: { color: '#334155' },
  amtChipSub:   { color: '#475569', fontSize: 9, marginTop: 2 },

  orbBalance:   { alignItems: 'flex-end', marginBottom: 16 },
  orbBalTxt:    { color: '#475569', fontSize: 11 },

  walletInput:  { backgroundColor: '#060F1E', borderRadius: 12, borderWidth: 1, borderColor: '#1E3A5F', color: '#E2E8F0', fontSize: 12, padding: 12, marginBottom: 8 },
  savedAddrBtn: { marginBottom: 12 },
  savedAddrTxt: { color: '#475569', fontSize: 11 },

  summaryBox:   { backgroundColor: '#060F1E', borderRadius: 12, padding: 12, marginBottom: 16, gap: 6, borderWidth: 1, borderColor: '#1E293B' },
  summaryRow:   { color: '#94A3B8', fontSize: 13 },

  claimBtn:     { backgroundColor: CYAN, borderRadius: 16, paddingVertical: 15, alignItems: 'center', marginBottom: 12 },
  claimBtnDisabled: { backgroundColor: '#1E293B' },
  claimBtnTxt:  { color: '#000', fontSize: 15, fontWeight: '900', letterSpacing: 1 },
  claimNote:    { color: '#334155', fontSize: 10, textAlign: 'center', lineHeight: 16 },

  // Info tab
  infoCard:     { backgroundColor: '#0A1628', borderRadius: 20, padding: 18, borderWidth: 1, borderColor: '#1E293B' },
  infoTitle:    { color: '#94A3B8', fontSize: 13, fontWeight: '700', letterSpacing: 1, marginBottom: 12 },
  infoRow:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#0F172A' },
  infoKey:      { color: '#475569', fontSize: 12 },
  infoVal:      { color: '#E2E8F0', fontSize: 12, fontWeight: '700', flex: 1, textAlign: 'right' },
  divider:      { height: 1, backgroundColor: '#1E293B', marginVertical: 16 },
  earnRow:      { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: '#0F172A' },
  earnIcon:     { fontSize: 18, width: 28 },
  earnAct:      { flex: 1, color: '#94A3B8', fontSize: 12 },
  earnVal:      { color: YELLOW, fontSize: 12, fontWeight: '700' },

  // History tab
  emptyTxt:     { color: '#334155', textAlign: 'center', marginTop: 40, fontSize: 13, lineHeight: 22 },
  claimRow:     { flexDirection: 'row', backgroundColor: '#0A1628', borderRadius: 14, padding: 14, marginBottom: 8, borderWidth: 1, borderColor: '#1E293B', justifyContent: 'space-between' },
  claimRowLeft: { gap: 3 },
  claimRowRight:{ alignItems: 'flex-end', gap: 3 },
  claimStatus:  { fontSize: 12, fontWeight: '700' },
  claimWallet:  { color: '#64748B', fontSize: 11 },
  claimDate:    { color: '#334155', fontSize: 10 },
  claimSkora:   { color: GREEN, fontSize: 20, fontWeight: '900' },
  claimSkoraLabel: { color: '#22C55E', fontSize: 9, letterSpacing: 1 },
  claimOrb:     { color: '#EF4444', fontSize: 11 },
});
