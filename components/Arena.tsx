import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Easing, Alert, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../lib/supabase';
import { t, useLang } from '../lib/i18n';

const { width: W } = Dimensions.get('window');

// ─── CONFIG ─────────────────────────────────────────────────────────────────
const UPGRADE_COSTS  = [0, 1_000, 5_000, 20_000, 50_000];
const GENERATOR_OPH  = [0, 15, 40, 90, 200, 400];
const VAULT_PROTECT  = [0, 500, 1_500, 4_000, 10_000, 25_000];
const TOWER_DEF      = [0, 15, 30, 50, 70, 85];
const SHIELD_COST_ORB = 500;
const SHIELD_HOURS    = 8;
const RAID_COOLDOWN   = 30 * 60 * 1000;

type ArenaBase = {
  device_id: string; username: string;
  hq: number; generator: number; vault: number; tower: number;
  orb_stored: number; shield_until: number;
};
type Buildings = { generator: number; vault: number; tower: number; hq: number };
const DEFAULT_BUILDINGS: Buildings = { generator: 1, vault: 1, tower: 1, hq: 1 };

type Props = {
  orb: number;
  onOrbChange: (next: number) => void;
  deviceId: string;
  username: string;
  onRaidWin?: () => void;
};

// ─── HELPERS ─────────────────────────────────────────────────────────────────
function calcPassive(buildings: Buildings, lastTs: number): number {
  const hrs = (Date.now() - lastTs) / 3_600_000;
  return Math.floor(GENERATOR_OPH[buildings.generator] * hrs);
}

const FAKE_NAMES = ['Raider#7X2', 'CryptoWolf', 'SolHunter', 'NeonBlade', 'GhostFire', 'DarkOrb'];

// ─── MAIN ────────────────────────────────────────────────────────────────────
export default function Arena({ orb, onOrbChange, deviceId, username, onRaidWin }: Props) {
  useLang();
  const [buildings,    setBuildings]   = useState<Buildings>(DEFAULT_BUILDINGS);
  const [shieldUntil,  setShieldUntil] = useState(0);
  const [lastGenTs,    setLastGenTs]   = useState(Date.now());
  const [lastRaidTs,   setLastRaidTs]  = useState(0);
  const [pendingOrb,   setPendingOrb]  = useState(0);       // accumulated but not yet claimed
  const [tab,          setTab]         = useState<'base'|'raid'>('base');
  const [raidPhase,    setRaidPhase]   = useState<'idle'|'searching'|'result'>('idle');
  const [raidMsg,      setRaidMsg]     = useState('');
  const [raidWon,      setRaidWon]     = useState(false);
  const [raidStolen,   setRaidStolen]  = useState(0);
  const [raidOpp,      setRaidOpp]     = useState('');
  const [upgradeKey,   setUpgradeKey]  = useState<keyof Buildings | null>(null);

  const pulseAnim  = useRef(new Animated.Value(1)).current;
  const shakeAnim  = useRef(new Animated.Value(0)).current;
  const collectAnim = useRef(new Animated.Value(1)).current;
  const resultAnim  = useRef(new Animated.Value(0)).current;
  const searchAnim  = useRef(new Animated.Value(0)).current;

  // ── New visual ambient anims ──
  const raidReadyPulse = useRef(new Animated.Value(0)).current;     // raid btn ready pulse
  const shieldAuraAnim = useRef(new Animated.Value(0)).current;     // shield aura when active
  const baseGlowAnim   = useRef(new Animated.Value(0)).current;     // skyline glow breathe
  const radarPing1     = useRef(new Animated.Value(0)).current;     // radar ping waves
  const radarPing2     = useRef(new Animated.Value(0)).current;
  const radarPing3     = useRef(new Animated.Value(0)).current;
  const victorySparkAnim = useRef(
    Array.from({ length: 12 }, () => ({
      x: new Animated.Value(0), y: new Animated.Value(0), op: new Animated.Value(0),
    }))
  ).current;

  // ── Load saved ─────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('sk_arena');
        if (!raw) return;
        const s = JSON.parse(raw);
        const b: Buildings = s.buildings ?? DEFAULT_BUILDINGS;
        const ts: number   = s.lastGenTs  ?? Date.now();
        setBuildings(b);
        setShieldUntil(s.shieldUntil ?? 0);
        setLastRaidTs(s.lastRaidTs   ?? 0);
        setLastGenTs(ts);
        const passive = calcPassive(b, ts);
        if (passive > 0) setPendingOrb(passive);
      } catch (_) {}
    })();
  }, []);

  // ── Tick: add to pending every minute ──────────
  useEffect(() => {
    const id = setInterval(() => {
      const gain = Math.floor(GENERATOR_OPH[buildings.generator] / 60);
      if (gain > 0) {
        setPendingOrb(p => p + gain);
        setLastGenTs(Date.now());
      }
    }, 60_000);
    return () => clearInterval(id);
  }, [buildings.generator]);

  // ── Pulse collect button when pending > 0 ──────
  useEffect(() => {
    if (pendingOrb <= 0) { collectAnim.setValue(1); return; }
    const anim = Animated.loop(Animated.sequence([
      Animated.timing(collectAnim, { toValue: 1.06, duration: 600, useNativeDriver: true }),
      Animated.timing(collectAnim, { toValue: 0.97, duration: 600, useNativeDriver: true }),
    ]));
    anim.start();
    return () => anim.stop();
  }, [pendingOrb > 0]);

  // ── Search radar sweep ──────────────────────────
  useEffect(() => {
    if (raidPhase !== 'searching') return;
    const sweep = Animated.loop(Animated.timing(searchAnim, {
      toValue: 1, duration: 1600, easing: Easing.linear, useNativeDriver: true,
    }));
    const ping = (anim: Animated.Value, delay: number) => Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(anim, { toValue: 1, duration: 1600, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration: 0,    useNativeDriver: true }),
      ])
    );
    const p1 = ping(radarPing1, 0);
    const p2 = ping(radarPing2, 530);
    const p3 = ping(radarPing3, 1060);
    sweep.start(); p1.start(); p2.start(); p3.start();
    return () => { sweep.stop(); p1.stop(); p2.stop(); p3.stop(); };
  }, [raidPhase]);

  // ── Raid ready pulse (red glow) ─────────────────
  const raidReady       = Date.now() - lastRaidTs >= RAID_COOLDOWN;
  useEffect(() => {
    if (!raidReady) { raidReadyPulse.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(raidReadyPulse, { toValue: 1, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(raidReadyPulse, { toValue: 0, duration: 800, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [raidReady]);

  // ── Shield aura when active ─────────────────────
  useEffect(() => {
    if (shieldUntil <= Date.now()) { shieldAuraAnim.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(shieldAuraAnim, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(shieldAuraAnim, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, [shieldUntil]);

  // ── Skyline glow breathe (always) ───────────────
  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(baseGlowAnim, { toValue: 1, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(baseGlowAnim, { toValue: 0, duration: 2200, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);

  const saveState = useCallback((b: Buildings, shield: number, raid: number) => {
    AsyncStorage.setItem('sk_arena', JSON.stringify({
      buildings: b, shieldUntil: shield, lastGenTs: Date.now(), lastRaidTs: raid,
    })).catch(() => {});
  }, []);

  const syncBase = useCallback(async (b: Buildings, shield: number, orbAmt: number) => {
    if (!deviceId) return;
    try {
      await supabase.from('arena_bases').upsert({
        device_id: deviceId, username,
        hq: b.hq, generator: b.generator, vault: b.vault, tower: b.tower,
        orb_stored: orbAmt, shield_until: shield, updated_at: Date.now(),
      }, { onConflict: 'device_id' });
    } catch (_) {}
  }, [deviceId, username]);

  // ── Collect pending ──────────────────────────────
  function collectPending() {
    if (pendingOrb <= 0) return;
    const gained = pendingOrb;
    onOrbChange(orb + gained);
    setPendingOrb(0);
    setLastGenTs(Date.now());
    saveState(buildings, shieldUntil, lastRaidTs);
    // Flash
    collectAnim.setValue(1.2);
    Animated.spring(collectAnim, { toValue: 1, friction: 4, tension: 300, useNativeDriver: true }).start();
  }

  // ── Upgrade ──────────────────────────────────────
  function upgradeBuilding(type: keyof Buildings) {
    const cur = buildings[type];
    if (cur >= 5) return;
    const cost = UPGRADE_COSTS[cur];
    if (orb < cost) { Alert.alert(t('arena.alertLowOrb'), t('arena.alertNeedOrb', { n: cost.toLocaleString() })); return; }
    const next = { ...buildings, [type]: cur + 1 };
    setBuildings(next);
    onOrbChange(orb - cost);
    setUpgradeKey(null);
    saveState(next, shieldUntil, lastRaidTs);
    syncBase(next, shieldUntil, orb - cost);
    // Flash animation
    pulseAnim.setValue(1.15);
    Animated.spring(pulseAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start();
  }

  // ── Shield ────────────────────────────────────────
  function buyShield() {
    if (shieldUntil > Date.now()) {
      Alert.alert(t('arena.alertShieldActive'), t('arena.alertShieldOn')); return;
    }
    if (orb < SHIELD_COST_ORB) {
      Alert.alert(t('arena.alertLowOrb'), t('arena.alertNeedOrb', { n: SHIELD_COST_ORB })); return;
    }
    const until = Date.now() + SHIELD_HOURS * 3_600_000;
    setShieldUntil(until);
    onOrbChange(orb - SHIELD_COST_ORB);
    saveState(buildings, until, lastRaidTs);
    syncBase(buildings, until, orb - SHIELD_COST_ORB);
  }

  // ── Raid ─────────────────────────────────────────
  async function doRaid() {
    if (Date.now() - lastRaidTs < RAID_COOLDOWN) {
      const mins = Math.ceil((RAID_COOLDOWN - (Date.now() - lastRaidTs)) / 60000);
      Alert.alert(t('arena.alertRaidCooldown'), t('arena.alertRaidWait', { n: mins }));
      return;
    }
    setRaidPhase('searching');
    setRaidMsg('');
    searchAnim.setValue(0);

    await new Promise(r => setTimeout(r, 1800)); // dramatic search pause

    let target: ArenaBase | null = null;
    try {
      const { data } = await supabase.from('arena_bases').select('*')
        .neq('device_id', deviceId).lt('shield_until', Date.now())
        .order('updated_at', { ascending: false }).limit(20);
      if (data && data.length > 0) target = data[Math.floor(Math.random() * data.length)] as ArenaBase;
    } catch (_) {}

    const oppName   = target?.username ?? FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)];
    const oppTower  = target?.tower    ?? Math.ceil(Math.random() * 3);
    const oppVault  = target?.orb_stored ?? Math.floor(Math.random() * 5000 + 500);

    const myAtk   = buildings.hq * 25 + buildings.tower * 10;
    const theirDef = TOWER_DEF[oppTower];
    const won     = Math.random() * 100 > theirDef - myAtk * 0.5;

    let stolen = 0;
    if (won) {
      const unprotected = Math.max(0, oppVault - VAULT_PROTECT[buildings.vault]);
      stolen = Math.floor(unprotected * (0.15 + Math.random() * 0.20));
      onOrbChange(orb + stolen);
      onRaidWin?.();
      if (target && stolen > 0) {
        supabase.from('arena_bases').update({
          orb_stored: Math.max(0, oppVault - stolen),
        }).eq('device_id', target.device_id).then(() => {});
      }
      // Victory sparks burst
      victorySparkAnim.forEach((p, i) => {
        const angle = (i / victorySparkAnim.length) * Math.PI * 2;
        const dist  = 100 + Math.random() * 60;
        p.x.setValue(0); p.y.setValue(0); p.op.setValue(1);
        Animated.parallel([
          Animated.timing(p.x,  { toValue: Math.cos(angle) * dist,        duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.y,  { toValue: Math.sin(angle) * dist - 30,   duration: 900, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
          Animated.timing(p.op, { toValue: 0, duration: 900, delay: 350,  useNativeDriver: true }),
        ]).start();
      });
    } else {
      shakeAnim.setValue(0);
      Animated.sequence([
        Animated.timing(shakeAnim, { toValue: 12,  duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: -12, duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 8,   duration: 60, useNativeDriver: true }),
        Animated.timing(shakeAnim, { toValue: 0,   duration: 60, useNativeDriver: true }),
      ]).start();
    }

    setRaidOpp(oppName);
    setRaidWon(won);
    setRaidStolen(stolen);
    setRaidMsg(won ? t('arena.raidWon', { n: stolen.toLocaleString() }) : t('arena.raidLost'));
    setLastRaidTs(Date.now());
    setRaidPhase('result');
    saveState(buildings, shieldUntil, Date.now());
    syncBase(buildings, shieldUntil, orb + stolen);

    resultAnim.setValue(0);
    Animated.spring(resultAnim, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }).start();
  }

  // ── Derived ──────────────────────────────────────
  const shielded        = shieldUntil > Date.now();
  const shieldHoursLeft = shielded ? Math.ceil((shieldUntil - Date.now()) / 3_600_000) : 0;
  const raidMins        = raidReady ? 0 : Math.ceil((RAID_COOLDOWN - (Date.now() - lastRaidTs)) / 60000);
  const orbPerHour      = GENERATOR_OPH[buildings.generator];
  const vaultProt       = VAULT_PROTECT[buildings.vault];
  const defPct          = TOWER_DEF[buildings.tower];
  const basePower       = buildings.hq * 100 + buildings.generator * 60 + buildings.vault * 50 + buildings.tower * 70;

  type BInfo = { key: keyof Buildings; icon: string; name: string; desc: string; stat: string; color: string };
  const BINFO: BInfo[] = [
    { key: 'hq',        icon: '🏰', name: t('arena.bldgHq'),        desc: t('arena.bldgHqDesc'),   stat: `Lv. ${buildings.hq}`,              color: '#F59E0B' },
    { key: 'generator', icon: '⚡', name: t('arena.bldgGenerator'),  desc: t('arena.bldgGenDesc'),  stat: `${orbPerHour} ORB/h`,              color: '#A855F7' },
    { key: 'vault',     icon: '🏦', name: t('arena.bldgVault'),      desc: t('arena.bldgVaultDesc'),stat: `${(vaultProt/1000).toFixed(1)}K`,  color: '#22C55E' },
    { key: 'tower',     icon: '🗼', name: t('arena.bldgTower'),      desc: t('arena.bldgTowerDesc'),stat: `−${defPct}%`,                      color: '#38BDF8' },
  ];

  const spinInterp = searchAnim.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  return (
    <Animated.View style={[s.root, { transform: [{ translateX: shakeAnim }] }]}>

      {/* ── Header ─────────────────────────────── */}
      <LinearGradient colors={['#1a0040','#2d0060','#1a0040']} style={s.header}>
        <View style={s.headerTop}>
          <View>
            <Text style={s.headerTitle}>{t('arena.title')}</Text>
            <Text style={s.headerSub}>{t('arena.basePower', { n: basePower.toLocaleString() })}</Text>
          </View>
          <View style={[s.shieldBadge, shielded && s.shieldBadgeActive]}>
            {shielded && (
              <Animated.View pointerEvents="none" style={[s.shieldAura, {
                opacity:   shieldAuraAnim.interpolate({ inputRange: [0, 1], outputRange: [0.25, 0.9] }),
                transform: [{ scale: shieldAuraAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.35] }) }],
              }]} />
            )}
            <Text style={s.shieldBadgeIcon}>{shielded ? '🛡' : '💀'}</Text>
            <Text style={s.shieldBadgeTxt}>{shielded ? `${shieldHoursLeft}ч` : 'уязвим'}</Text>
          </View>
        </View>

        {/* Power bar */}
        <View style={s.powerBarTrack}>
          <LinearGradient
            colors={['#7C3AED','#EC4899']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={[s.powerBarFill, { width: `${Math.min((basePower / 1000) * 100, 100)}%` as any }]}
          />
        </View>

        {/* ── Base Skyline (mini fortress view) ── */}
        <View style={s.skylineRow}>
          {([
            { lvl: buildings.hq,        icon: '🏰', color: '#F59E0B' },
            { lvl: buildings.generator, icon: '⚡', color: '#A855F7' },
            { lvl: buildings.vault,     icon: '🏦', color: '#22C55E' },
            { lvl: buildings.tower,     icon: '🗼', color: '#38BDF8' },
          ] as const).map((b, i) => {
            const heightPct = 0.45 + (b.lvl / 5) * 0.55;  // higher level = taller
            const opacity = b.lvl > 0 ? 1 : 0.3;
            return (
              <View key={i} style={s.skylineCol}>
                <Animated.View style={[s.skylineGlow, {
                  backgroundColor: b.color,
                  opacity: baseGlowAnim.interpolate({
                    inputRange: [0, 1], outputRange: [0.15 + b.lvl * 0.05, 0.35 + b.lvl * 0.08],
                  }),
                  transform: [{ scale: baseGlowAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
                }]} />
                <View style={[s.skylineBldg, {
                  height: 38 * heightPct,
                  backgroundColor: b.color + (b.lvl > 0 ? '55' : '15'),
                  borderColor: b.color + (b.lvl > 0 ? 'AA' : '33'),
                  opacity,
                }]}>
                  <Text style={{ fontSize: 14 }}>{b.icon}</Text>
                </View>
                <Text style={[s.skylineLvl, { color: b.lvl > 0 ? b.color : '#334155' }]}>LV{b.lvl}</Text>
              </View>
            );
          })}
        </View>
      </LinearGradient>

      {/* ── Tab bar ────────────────────────────── */}
      <View style={s.tabBar}>
        <TouchableOpacity style={[s.tab, tab === 'base' && s.tabActive]} onPress={() => setTab('base')}>
          <Text style={[s.tabTxt, tab === 'base' && s.tabTxtActive]}>{t('arena.tabBase')}</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'raid' && s.tabActive]} onPress={() => setTab('raid')}>
          <Text style={[s.tabTxt, tab === 'raid' && s.tabTxtActive]}>{t('arena.tabRaid')}</Text>
          {raidReady && <View style={s.tabDot} />}
        </TouchableOpacity>
      </View>

      {/* ═══════════ BASE TAB ═══════════ */}
      {tab === 'base' && (
        <View style={s.tabContent}>

          {/* Collect button */}
          <Animated.View style={{ transform: [{ scale: collectAnim }], marginBottom: 14 }}>
            <TouchableOpacity
              style={[s.collectBtn, pendingOrb === 0 && s.collectBtnEmpty]}
              onPress={collectPending}
              activeOpacity={0.8}
              disabled={pendingOrb === 0}
            >
              <LinearGradient
                colors={pendingOrb > 0 ? ['#4C1D95','#7C3AED'] : ['#1E293B','#1E293B']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={s.collectGrad}
              >
                <Text style={s.collectIcon}>⚡</Text>
                <View>
                  <Text style={s.collectTitle}>
                    {pendingOrb > 0 ? t('arena.collect', { n: pendingOrb.toLocaleString() }) : t('arena.generatorWorking')}
                  </Text>
                  <Text style={s.collectSub}>
                    {pendingOrb > 0 ? t('arena.tapToCollect') : t('arena.orbPerHour', { n: orbPerHour })}
                  </Text>
                </View>
                {pendingOrb > 0 && <Text style={s.collectArrow}>›</Text>}
              </LinearGradient>
            </TouchableOpacity>
          </Animated.View>

          {/* Buildings grid */}
          <Text style={s.sectionLabel}>{t('lands.buildings')}</Text>
          <Animated.View style={[s.bGrid, { transform: [{ scale: pulseAnim }] }]}>
            {BINFO.map((b) => {
              const lvl     = buildings[b.key];
              const maxed   = lvl >= 5;
              const nextCost = maxed ? null : UPGRADE_COSTS[lvl];
              const canAfford = nextCost !== null && orb >= nextCost;
              return (
                <TouchableOpacity key={b.key} style={s.bCard} onPress={() => setUpgradeKey(b.key)} activeOpacity={0.8}>
                  <LinearGradient
                    colors={maxed ? ['#14532D','#166534'] : canAfford ? ['#1a0040','#0F172A'] : ['#0F172A','#0F172A']}
                    style={s.bCardGrad}
                  >
                    <Text style={s.bIcon}>{b.icon}</Text>
                    <Text style={[s.bName, { color: b.color }]}>{b.name}</Text>
                    <Text style={s.bDesc}>{b.desc}</Text>
                    <Text style={[s.bStat, { color: b.color }]}>{b.stat}</Text>

                    {/* Level dots */}
                    <View style={s.lvlRow}>
                      {[1,2,3,4,5].map(i => (
                        <View key={i} style={[s.lvlDot, i <= lvl && { backgroundColor: b.color, borderColor: b.color }]} />
                      ))}
                    </View>

                    {/* Upgrade hint */}
                    {!maxed && (
                      <View style={[s.upgHint, canAfford && s.upgHintReady]}>
                        <Text style={[s.upgHintTxt, canAfford && s.upgHintTxtReady]}>
                          {canAfford ? t('arena.upgradeReady', { cost: nextCost!.toLocaleString() }) : t('arena.upgradeLocked', { cost: nextCost!.toLocaleString() })}
                        </Text>
                      </View>
                    )}
                    {maxed && <Text style={s.maxed}>✦  МАКС</Text>}
                  </LinearGradient>
                </TouchableOpacity>
              );
            })}
          </Animated.View>

          {/* Shield */}
          <TouchableOpacity
            style={[s.shieldFullBtn, shielded && s.shieldFullBtnActive]}
            onPress={buyShield}
            activeOpacity={0.85}
          >
            <Text style={s.shieldFullIcon}>{shielded ? '🛡' : '⚠️'}</Text>
            <View>
              <Text style={s.shieldFullTitle}>
                {shielded ? t('arena.shieldActive', { h: shieldHoursLeft }) : t('arena.buyShield')}
              </Text>
              <Text style={s.shieldFullSub}>
                {shielded ? t('arena.shieldActiveDesc') : t('arena.buyShieldDesc', { cost: SHIELD_COST_ORB })}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      )}

      {/* ═══════════ RAID TAB ═══════════ */}
      {tab === 'raid' && (
        <View style={s.tabContent}>

          {/* Explain card */}
          <View style={s.raidInfoCard}>
            <Text style={s.raidInfoTitle}>{t('arena.howRaid')}</Text>
            <View style={s.raidInfoRow}><Text style={s.raidInfoIcon}>🎯</Text><Text style={s.raidInfoTxt}>{t('arena.raidStep1')}</Text></View>
            <View style={s.raidInfoRow}><Text style={s.raidInfoIcon}>⚔️</Text><Text style={s.raidInfoTxt}>{t('arena.raidStep2')}</Text></View>
            <View style={s.raidInfoRow}><Text style={s.raidInfoIcon}>💰</Text><Text style={s.raidInfoTxt}>{t('arena.raidStep3')}</Text></View>
            <View style={s.raidInfoRow}><Text style={s.raidInfoIcon}>🕐</Text><Text style={s.raidInfoTxt}>{t('arena.raidStep4')}</Text></View>
          </View>

          {/* My attack stats */}
          <View style={s.raidStatsRow}>
            <View style={s.raidStatBox}>
              <Text style={s.raidStatVal}>{buildings.hq * 25 + buildings.tower * 10}</Text>
              <Text style={s.raidStatLabel}>{t('arena.myAttack')}</Text>
            </View>
            <View style={s.raidStatDivider} />
            <View style={s.raidStatBox}>
              <Text style={s.raidStatVal}>{defPct}%</Text>
              <Text style={s.raidStatLabel}>{t('arena.myDefense')}</Text>
            </View>
            <View style={s.raidStatDivider} />
            <View style={s.raidStatBox}>
              <Text style={s.raidStatVal}>{(vaultProt/1000).toFixed(1)}K</Text>
              <Text style={s.raidStatLabel}>{t('arena.protected')}</Text>
            </View>
          </View>

          {/* Raid button / result */}
          {raidPhase === 'idle' && (
            <View style={{ position: 'relative' }}>
              {raidReady && (
                <Animated.View pointerEvents="none" style={[s.raidReadyGlow, {
                  opacity:   raidReadyPulse.interpolate({ inputRange: [0, 1], outputRange: [0.2, 0.85] }),
                  transform: [{ scale: raidReadyPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.06] }) }],
                }]} />
              )}
              <TouchableOpacity
                style={[s.raidBigBtn, !raidReady && s.raidBigBtnDisabled]}
                onPress={doRaid}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={raidReady ? ['#DC2626','#9D174D'] : ['#1E293B','#1E293B']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.raidBigGrad}
                >
                  <Text style={s.raidBigIcon}>⚔️</Text>
                  <Text style={s.raidBigTitle}>{raidReady ? t('arena.startRaid') : `${t('arena.cooldown')}  ${raidMins} min`}</Text>
                  <Text style={s.raidBigSub}>{raidReady ? 'Найти противника и атаковать' : 'Жди перед следующим рейдом'}</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {raidPhase === 'searching' && (
            <View style={s.searchingBox}>
              {/* Radar ping waves */}
              {[radarPing1, radarPing2, radarPing3].map((p, i) => (
                <Animated.View key={i} pointerEvents="none" style={[s.radarPing, {
                  opacity:   p.interpolate({ inputRange: [0, 0.05, 1], outputRange: [0, 0.8, 0] }),
                  transform: [{ scale: p.interpolate({ inputRange: [0, 1], outputRange: [0.2, 1.6] }) }],
                }]} />
              ))}
              {/* Center radar dish */}
              <View style={s.radarDish}>
                {/* Sweep wrapper — rotates around its own center, line offset to the right */}
                <Animated.View style={[s.radarSweepWrap, { transform: [{ rotate: spinInterp }] }]}>
                  <LinearGradient
                    colors={['rgba(34,197,94,0.95)', 'rgba(34,197,94,0)']}
                    start={{ x: 0, y: 0.5 }} end={{ x: 1, y: 0.5 }}
                    style={s.radarSweepLine}
                  />
                </Animated.View>
                <Text style={s.radarIcon}>📡</Text>
              </View>
              <Text style={s.searchTitle}>{t('arena.searching')}</Text>
              <Text style={s.searchSub}>Ищем уязвимого противника</Text>
            </View>
          )}

          {raidPhase === 'result' && (
            <View style={{ position: 'relative' }}>
              <Animated.View style={[
                s.raidResultBox,
                raidWon ? s.raidResultWon : s.raidResultLost,
                { transform: [{ scale: resultAnim }] },
              ]}>
                <Text style={s.raidResultEmoji}>{raidWon ? '⚔️' : '💀'}</Text>
                <Text style={s.raidResultTitle}>{raidWon ? t('arena.raidWin') : t('arena.raidLose')}</Text>
                <Text style={s.raidResultOpp}>vs {raidOpp}</Text>
                <Text style={s.raidResultMsg}>{raidMsg}</Text>
                {raidWon && raidStolen > 0 && (
                  <Text style={s.raidResultStolen}>{t('arena.orbAdded', { n: raidStolen.toLocaleString() })}</Text>
                )}
                <TouchableOpacity style={s.raidResultClose} onPress={() => setRaidPhase('idle')}>
                  <Text style={s.raidResultCloseTxt}>{t('arena.raidContinue')}</Text>
                </TouchableOpacity>
              </Animated.View>

              {/* Victory sparks (rendered above result box) */}
              {raidWon && (
                <View pointerEvents="none" style={s.sparksLayer}>
                  {victorySparkAnim.map((p, i) => (
                    <Animated.Text key={i} style={[s.spark, {
                      opacity: p.op,
                      transform: [{ translateX: p.x }, { translateY: p.y }],
                    }]}>
                      {['✨','💰','⚡','🪙','💎'][i % 5]}
                    </Animated.Text>
                  ))}
                </View>
              )}
            </View>
          )}

          {/* Upgrade to raid better */}
          <View style={s.raidTips}>
            <Text style={s.raidTipsTitle}>{t('arena.tipsTitle')}</Text>
            <Text style={s.raidTipsTxt}>{t('arena.tipsTxt1')}</Text>
            <Text style={s.raidTipsTxt}>{t('arena.tipsTxt2')}</Text>
          </View>
        </View>
      )}

      {/* ── Upgrade modal ────────────────────────── */}
      {upgradeKey !== null && (() => {
        const info = BINFO.find(b => b.key === upgradeKey)!;
        const cur  = buildings[upgradeKey];
        const maxed = cur >= 5;
        const cost  = maxed ? 0 : UPGRADE_COSTS[cur];
        const canAfford = orb >= cost;
        const nextStat = !maxed ? (() => {
          if (upgradeKey === 'generator') return `${GENERATOR_OPH[cur+1]} ORB/час`;
          if (upgradeKey === 'vault')     return `${VAULT_PROTECT[cur+1].toLocaleString()} ORB защищено`;
          if (upgradeKey === 'tower')     return `−${TOWER_DEF[cur+1]}% урона`;
          return `Уровень ${cur+1}`;
        })() : '';
        return (
          <View style={s.modalOverlay}>
            <View style={s.modalCard}>
              <LinearGradient colors={['#1a0040','#0F172A']} style={s.modalGrad}>
                <Text style={s.modalEmoji}>{info.icon}</Text>
                <Text style={[s.modalName, { color: info.color }]}>{info.name}</Text>
                <Text style={s.modalDesc}>{info.desc}</Text>

                {/* Level dots */}
                <View style={s.modalLvlRow}>
                  {[1,2,3,4,5].map(i => (
                    <View key={i} style={[s.modalLvlDot, i <= cur && { backgroundColor: info.color, borderColor: info.color }]} />
                  ))}
                </View>
                <Text style={s.modalLvlTxt}>{t('arena.levelOf', { cur })}</Text>

                {/* Stats */}
                <View style={s.modalStatBox}>
                  <Text style={s.modalStatCur}>{t('arena.statNow', { stat: info.stat })}</Text>
                  {!maxed && <Text style={s.modalStatNext}>{t('arena.statAfter', { stat: nextStat })}</Text>}
                </View>

                {maxed ? (
                  <Text style={s.modalMaxed}>{t('arena.maxLevel')}</Text>
                ) : (
                  <TouchableOpacity
                    style={[s.modalUpgBtn, !canAfford && s.modalUpgBtnDim]}
                    onPress={() => upgradeBuilding(upgradeKey)}
                    activeOpacity={0.85}
                  >
                    <LinearGradient
                      colors={canAfford ? [info.color, '#7C3AED'] : ['#1E293B','#1E293B']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                      style={s.modalUpgGrad}
                    >
                      <Text style={s.modalUpgTxt}>
                        {canAfford ? t('arena.upgradeCta', { cost: cost.toLocaleString() }) : t('arena.upgradeNeed', { cost: cost.toLocaleString() })}
                      </Text>
                    </LinearGradient>
                  </TouchableOpacity>
                )}

                <TouchableOpacity style={s.modalClose} onPress={() => setUpgradeKey(null)}>
                  <Text style={s.modalCloseTxt}>{t('common.close')}</Text>
                </TouchableOpacity>
              </LinearGradient>
            </View>
          </View>
        );
      })()}
    </Animated.View>
  );
}

// ─── STYLES ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:           { flex: 1 },

  // Header
  header:         { paddingHorizontal: 16, paddingTop: 14, paddingBottom: 12 },
  headerTop:      { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 },
  headerTitle:    { color: '#F1F5F9', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  headerSub:      { color: '#94A3B8', fontSize: 12, marginTop: 2 },
  shieldBadge:    { backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6, flexDirection: 'row', gap: 4, alignItems: 'center', borderWidth: 1, borderColor: '#334155' },
  shieldBadgeActive: { backgroundColor: '#0C2A3A', borderColor: '#22D3EE' },
  shieldBadgeIcon:{ fontSize: 14 },
  shieldBadgeTxt: { color: '#CBD5E1', fontSize: 12, fontWeight: '700' },
  shieldAura:     { position: 'absolute', top: -8, left: -8, right: -8, bottom: -8,
                    borderRadius: 16, backgroundColor: '#22D3EE', opacity: 0.3 },

  // Skyline
  skylineRow:     { flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
                    marginTop: 12, height: 56, paddingHorizontal: 8 },
  skylineCol:     { alignItems: 'center', flex: 1, position: 'relative' },
  skylineGlow:    { position: 'absolute', bottom: 6, width: 36, height: 36, borderRadius: 18 },
  skylineBldg:    { width: 32, alignItems: 'center', justifyContent: 'flex-end', paddingBottom: 2,
                    borderRadius: 4, borderWidth: 1 },
  skylineLvl:     { fontSize: 8, fontWeight: '900', letterSpacing: 1, marginTop: 2 },

  // Raid ready glow
  raidReadyGlow:  { position: 'absolute', top: -6, left: -6, right: -6, bottom: -6,
                    borderRadius: 24, backgroundColor: '#DC2626', opacity: 0.4 },

  // Radar
  radarPing:      { position: 'absolute', width: 200, height: 200, borderRadius: 100,
                    borderWidth: 2, borderColor: '#22C55E' },
  radarDish:      { width: 120, height: 120, borderRadius: 60, alignItems: 'center', justifyContent: 'center',
                    borderWidth: 2, borderColor: '#22C55E', backgroundColor: 'rgba(34,197,94,0.08)',
                    overflow: 'hidden', position: 'relative' },
  radarSweepWrap: { position: 'absolute', width: 120, height: 120, top: 0, left: 0 },
  radarSweepLine: { position: 'absolute', left: 60, top: 58, width: 60, height: 4 },
  radarIcon:      { fontSize: 36 },

  // Sparks
  sparksLayer:    { position: 'absolute', top: '50%', left: '50%', width: 0, height: 0,
                    alignItems: 'center', justifyContent: 'center' },
  spark:          { position: 'absolute', fontSize: 20 },
  powerBarTrack:  { height: 5, backgroundColor: '#1E293B', borderRadius: 3, overflow: 'hidden' },
  powerBarFill:   { height: 5, borderRadius: 3 },

  // Tabs
  tabBar:         { flexDirection: 'row', backgroundColor: '#0A0A1A', borderBottomWidth: 1, borderBottomColor: '#1E293B' },
  tab:            { flex: 1, paddingVertical: 12, alignItems: 'center', position: 'relative' },
  tabActive:      { borderBottomWidth: 2, borderBottomColor: '#7C3AED' },
  tabTxt:         { color: '#475569', fontSize: 13, fontWeight: '700', letterSpacing: 1 },
  tabTxtActive:   { color: '#A855F7' },
  tabDot:         { position: 'absolute', top: 8, right: 20, width: 8, height: 8, borderRadius: 4, backgroundColor: '#22C55E' },

  tabContent:     { padding: 14, gap: 12 },

  // Collect button
  collectBtn:     { borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: '#7C3AED' },
  collectBtnEmpty:{ borderColor: '#1E293B' },
  collectGrad:    { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  collectIcon:    { fontSize: 28 },
  collectTitle:   { color: '#F1F5F9', fontSize: 15, fontWeight: '900' },
  collectSub:     { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  collectArrow:   { color: '#A855F7', fontSize: 28, fontWeight: '900', marginLeft: 'auto' },

  // Section label
  sectionLabel:   { color: '#475569', fontSize: 10, fontWeight: '700', letterSpacing: 2, marginBottom: -4 },

  // Buildings grid
  bGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  bCard:          { width: (W - 38) / 2, borderRadius: 16, overflow: 'hidden', borderWidth: 1.5, borderColor: '#1E293B' },
  bCardGrad:      { padding: 14, alignItems: 'flex-start', gap: 4 },
  bIcon:          { fontSize: 28, marginBottom: 2 },
  bName:          { fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  bDesc:          { color: '#64748B', fontSize: 10, lineHeight: 14 },
  bStat:          { fontSize: 12, fontWeight: '700', marginTop: 2 },
  lvlRow:         { flexDirection: 'row', gap: 4, marginTop: 6 },
  lvlDot:         { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  upgHint:        { marginTop: 8, backgroundColor: '#1E293B', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, alignSelf: 'stretch' },
  upgHintReady:   { backgroundColor: 'rgba(124,58,237,0.25)', borderWidth: 1, borderColor: '#7C3AED' },
  upgHintTxt:     { color: '#475569', fontSize: 9, fontWeight: '700', letterSpacing: 1 },
  upgHintTxtReady:{ color: '#A855F7' },
  maxed:          { color: '#FACC15', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 8 },

  // Shield full button
  shieldFullBtn:  { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#1E293B', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#334155' },
  shieldFullBtnActive: { backgroundColor: '#0C2A3A', borderColor: '#22D3EE' },
  shieldFullIcon: { fontSize: 24 },
  shieldFullTitle:{ color: '#CBD5E1', fontSize: 13, fontWeight: '900' },
  shieldFullSub:  { color: '#475569', fontSize: 11, marginTop: 2 },

  // Raid tab
  raidInfoCard:   { backgroundColor: '#0F172A', borderRadius: 16, padding: 14, borderWidth: 1, borderColor: '#1E293B', gap: 8 },
  raidInfoTitle:  { color: '#7C3AED', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 2 },
  raidInfoRow:    { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  raidInfoIcon:   { fontSize: 15, width: 22 },
  raidInfoTxt:    { color: '#94A3B8', fontSize: 13, flex: 1, lineHeight: 18 },

  raidStatsRow:   { flexDirection: 'row', backgroundColor: '#0F172A', borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B' },
  raidStatBox:    { flex: 1, alignItems: 'center', paddingVertical: 14 },
  raidStatDivider:{ width: 1, backgroundColor: '#1E293B', marginVertical: 12 },
  raidStatVal:    { color: '#F1F5F9', fontSize: 20, fontWeight: '900' },
  raidStatLabel:  { color: '#475569', fontSize: 9, fontWeight: '700', letterSpacing: 1, marginTop: 2 },

  raidBigBtn:     { borderRadius: 20, overflow: 'hidden', borderWidth: 1.5, borderColor: '#7C3AED' },
  raidBigBtnDisabled: { borderColor: '#1E293B' },
  raidBigGrad:    { padding: 22, alignItems: 'center', gap: 4 },
  raidBigIcon:    { fontSize: 36, marginBottom: 4 },
  raidBigTitle:   { color: '#fff', fontSize: 18, fontWeight: '900', letterSpacing: 2 },
  raidBigSub:     { color: 'rgba(255,255,255,0.55)', fontSize: 12 },

  searchingBox:   { alignItems: 'center', padding: 32, backgroundColor: '#0F172A', borderRadius: 20, gap: 8, borderWidth: 1, borderColor: '#1E293B' },
  searchSpin:     { fontSize: 40 },
  searchTitle:    { color: '#F1F5F9', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
  searchSub:      { color: '#475569', fontSize: 12 },

  raidResultBox:  { borderRadius: 20, padding: 24, alignItems: 'center', gap: 6, borderWidth: 1.5 },
  raidResultWon:  { backgroundColor: '#052E16', borderColor: '#22C55E' },
  raidResultLost: { backgroundColor: '#450A0A', borderColor: '#EF4444' },
  raidResultEmoji:{ fontSize: 48 },
  raidResultTitle:{ color: '#fff', fontSize: 22, fontWeight: '900', letterSpacing: 2 },
  raidResultOpp:  { color: 'rgba(255,255,255,0.5)', fontSize: 13 },
  raidResultMsg:  { color: '#fff', fontSize: 15, fontWeight: '700', textAlign: 'center', marginTop: 4 },
  raidResultStolen:{ color: '#86EFAC', fontSize: 13, fontWeight: '700' },
  raidResultClose:{ marginTop: 12, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12, paddingHorizontal: 28, paddingVertical: 10 },
  raidResultCloseTxt:{ color: '#fff', fontSize: 13, fontWeight: '900', letterSpacing: 2 },

  raidTips:       { backgroundColor: '#0F172A', borderRadius: 16, padding: 14, gap: 8, borderWidth: 1, borderColor: '#1E293B' },
  raidTipsTitle:  { color: '#FACC15', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  raidTipsTxt:    { color: '#64748B', fontSize: 12, lineHeight: 18 },

  // Modal
  modalOverlay:   { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  modalCard:      { width: W - 40, borderRadius: 24, overflow: 'hidden', borderWidth: 1.5, borderColor: '#2D1B69' },
  modalGrad:      { padding: 28, alignItems: 'center', gap: 4 },
  modalEmoji:     { fontSize: 52, marginBottom: 4 },
  modalName:      { fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  modalDesc:      { color: '#64748B', fontSize: 13, marginBottom: 8 },
  modalLvlRow:    { flexDirection: 'row', gap: 8, marginVertical: 8 },
  modalLvlDot:    { width: 12, height: 12, borderRadius: 6, backgroundColor: '#1E293B', borderWidth: 1, borderColor: '#334155' },
  modalLvlTxt:    { color: '#475569', fontSize: 12, marginBottom: 10 },
  modalStatBox:   { backgroundColor: '#0F172A', borderRadius: 12, padding: 14, width: '100%', gap: 4, marginBottom: 16, borderWidth: 1, borderColor: '#1E293B' },
  modalStatCur:   { color: '#94A3B8', fontSize: 13 },
  modalStatNext:  { color: '#22C55E', fontSize: 14, fontWeight: '700' },
  modalMaxed:     { color: '#FACC15', fontSize: 16, fontWeight: '900', letterSpacing: 2, marginBottom: 16 },
  modalUpgBtn:    { width: '100%', borderRadius: 14, overflow: 'hidden', marginBottom: 8 },
  modalUpgBtnDim: { opacity: 0.5 },
  modalUpgGrad:   { paddingVertical: 14, alignItems: 'center' },
  modalUpgTxt:    { color: '#fff', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  modalClose:     { paddingVertical: 10 },
  modalCloseTxt:  { color: '#475569', fontSize: 13 },
});
