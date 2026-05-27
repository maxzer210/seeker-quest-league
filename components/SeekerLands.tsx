import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, ScrollView,
  Modal, Animated, Easing, Dimensions,
} from 'react-native';
import { t, useLang } from '../lib/i18n';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width: SW } = Dimensions.get('window');

// ──────────────────────────────────────────────
// LAND TYPES
// ──────────────────────────────────────────────
type Rarity = 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';

const LAND_CONFIG: Record<Rarity, {
  icon: string; label: string; color: string; bg: string;
  orbPerHour: number; claimCost: number; total: number; mapColor: string;
}> = {
  common:    { icon: '🌾', label: 'Равнина',  color: '#94A3B8', bg: '#1E293B', mapColor: '#334155', orbPerHour: 8,   claimCost: 500,     total: 120 },
  uncommon:  { icon: '🌲', label: 'Лес',      color: '#4ADE80', bg: '#052E16', mapColor: '#166534', orbPerHour: 25,  claimCost: 2_500,   total: 50  },
  rare:      { icon: '🏔', label: 'Горы',     color: '#60A5FA', bg: '#0C1A4A', mapColor: '#1D4ED8', orbPerHour: 70,  claimCost: 10_000,  total: 20  },
  epic:      { icon: '🌋', label: 'Вулкан',   color: '#FB923C', bg: '#3B0A00', mapColor: '#C2410C', orbPerHour: 200, claimCost: 40_000,  total: 8   },
  legendary: { icon: '💎', label: 'Кристал',  color: '#E879F9', bg: '#2E0A3A', mapColor: '#A21CAF', orbPerHour: 600, claimCost: 150_000, total: 2   },
};

const RARITY_ORDER: Rarity[] = ['common', 'uncommon', 'rare', 'epic', 'legendary'];

// ──────────────────────────────────────────────
// IDLE CAP — storage fills up in 24h, must collect to keep earning
// ──────────────────────────────────────────────
const MAX_IDLE_HOURS = 24;
const MAX_IDLE_MS    = MAX_IDLE_HOURS * 3_600_000;

/** Returns hours-since-last-collect, capped at MAX_IDLE_HOURS. */
function cappedHoursSince(lastCollect: number, now: number = Date.now()): number {
  return Math.min(MAX_IDLE_HOURS, (now - lastCollect) / 3_600_000);
}

/** True if the plot has reached the 24h cap and is no longer accumulating. */
function isStorageFull(lastCollect: number, now: number = Date.now()): boolean {
  return (now - lastCollect) >= MAX_IDLE_MS;
}

/** 0..1 fill progress of the storage (1 = full, can't collect more). */
function storageFillPct(lastCollect: number, now: number = Date.now()): number {
  return Math.min(1, (now - lastCollect) / MAX_IDLE_MS);
}

// ──────────────────────────────────────────────
// MAP GENERATION
// ──────────────────────────────────────────────
const MAP_W = 20;
const MAP_H = 10;

function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

type Plot = { id: string; x: number; y: number; rarity: Rarity };

function buildMap(): Plot[] {
  const rand = seededRand(0xDEADBEEF);
  const pool: Rarity[] = [];
  for (const r of RARITY_ORDER)
    for (let i = 0; i < LAND_CONFIG[r].total; i++) pool.push(r);
  for (let i = pool.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [pool[i], pool[j]] = [pool[j], pool[i]];
  }
  const plots: Plot[] = [];
  for (let y = 0; y < MAP_H; y++)
    for (let x = 0; x < MAP_W; x++)
      plots.push({ id: `${x},${y}`, x, y, rarity: pool[y * MAP_W + x] ?? 'common' });
  return plots;
}

const ALL_PLOTS = buildMap();

// ──────────────────────────────────────────────
type OwnedPlot = { id: string; rarity: Rarity; claimedAt: number; lastCollect: number };
type Props = {
  orb: number;
  onOrbChange: (n: number) => void;
  /** Called when player harvests — pass max seconds until any plot refills to cap, so caller can schedule push. */
  onAfterCollect?: (secondsUntilNextCap: number) => void;
};

const MINIMAP_CELL = Math.floor((SW - 32) / MAP_W);
const LIST_CELL    = Math.floor((SW - 32) / 5);

export default function SeekerLands({ orb, onOrbChange, onAfterCollect }: Props) {
  useLang();
  const [owned,     setOwned]     = useState<Record<string, OwnedPlot>>({});
  const [selected,  setSelected]  = useState<Plot | null>(null);
  const [filter,    setFilter]    = useState<Rarity | null>(null);
  const [view,      setView]      = useState<'map' | 'owned'>('map');
  const [tick,      setTick]      = useState(0);

  const collectAnim  = useRef(new Animated.Value(0)).current;
  const collectAmt   = useRef(0);
  const modalAnim    = useRef(new Animated.Value(0)).current;
  const coinAnims    = useRef([...Array(12)].map(() => ({
    x: new Animated.Value(0), y: new Animated.Value(0), op: new Animated.Value(0),
  }))).current;
  // Ambient pulse for ready plots
  const readyPulse   = useRef(new Animated.Value(0)).current;
  // Pulse for "Collect All" CTA
  const ctaPulse     = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(readyPulse, { toValue: 1, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(readyPulse, { toValue: 0, duration: 700, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);

  useEffect(() => {
    const a = Animated.loop(Animated.sequence([
      Animated.timing(ctaPulse, { toValue: 1, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(ctaPulse, { toValue: 0, duration: 900, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    a.start();
    return () => a.stop();
  }, []);

  // Tick every second for timers
  useEffect(() => {
    const id = setInterval(() => setTick(t => t + 1), 1000);
    return () => clearInterval(id);
  }, []);

  // Load
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem('sk_lands');
        if (raw) setOwned(JSON.parse(raw));
      } catch (_) {}
    })();
  }, []);

  const save = useCallback((o: Record<string, OwnedPlot>) => {
    AsyncStorage.setItem('sk_lands', JSON.stringify(o)).catch(() => {});
  }, []);

  useEffect(() => {
    if (selected) {
      modalAnim.setValue(0);
      Animated.spring(modalAnim, { toValue: 1, friction: 6, tension: 200, useNativeDriver: true }).start();
    }
  }, [selected]);

  // ── Coin burst animation ──
  function burstCoins() {
    coinAnims.forEach((c, i) => {
      c.x.setValue(0); c.y.setValue(0); c.op.setValue(1);
      const angle = (i / coinAnims.length) * Math.PI * 2;
      const dist  = 70 + Math.random() * 40;
      Animated.parallel([
        Animated.timing(c.x, { toValue: Math.cos(angle) * dist,        duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(c.y, { toValue: Math.sin(angle) * dist - 30,   duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.sequence([
          Animated.delay(400),
          Animated.timing(c.op, { toValue: 0, duration: 400, useNativeDriver: true }),
        ]),
      ]).start();
    });
  }

  function showCollect(amount: number) {
    collectAmt.current = amount;
    collectAnim.setValue(0);
    Animated.sequence([
      Animated.spring(collectAnim, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.delay(1000),
      Animated.timing(collectAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
    ]).start();
    burstCoins();
  }

  // ── Claim ──
  function claimPlot(plot: Plot) {
    const cost = LAND_CONFIG[plot.rarity].claimCost;
    if (orb < cost) return;
    const now   = Date.now();
    const entry: OwnedPlot = { id: plot.id, rarity: plot.rarity, claimedAt: now, lastCollect: now };
    const next  = { ...owned, [plot.id]: entry };
    setOwned(next);
    onOrbChange(orb - cost);
    save(next);
    setSelected(null);
  }

  // ── Collect single ──
  function collectPlot(plot: Plot) {
    const op     = owned[plot.id];
    if (!op) return;
    const hours  = cappedHoursSince(op.lastCollect);
    const amount = Math.floor(LAND_CONFIG[op.rarity].orbPerHour * hours);
    if (amount < 1) return;
    const next = { ...owned, [plot.id]: { ...op, lastCollect: Date.now() } };
    setOwned(next);
    onOrbChange(orb + amount);
    save(next);
    setSelected(null);
    showCollect(amount);
    // Schedule push for 24h from now (when storage will be full again)
    onAfterCollect?.(MAX_IDLE_HOURS * 3600);
  }

  // ── Collect ALL ──
  function collectAll() {
    let total = 0;
    const next = { ...owned };
    for (const op of Object.values(owned)) {
      const hours  = cappedHoursSince(op.lastCollect);
      const amount = Math.floor(LAND_CONFIG[op.rarity].orbPerHour * hours);
      if (amount > 0) { total += amount; next[op.id] = { ...op, lastCollect: Date.now() }; }
    }
    if (total === 0) return;
    setOwned(next);
    onOrbChange(orb + total);
    save(next);
    showCollect(total);
    onAfterCollect?.(MAX_IDLE_HOURS * 3600);
  }

  // ── Helpers ──
  function getPending(op: OwnedPlot) {
    const hours = cappedHoursSince(op.lastCollect);
    return Math.floor(LAND_CONFIG[op.rarity].orbPerHour * hours);
  }
  function getTimeToNext(op: OwnedPlot) {
    if (isStorageFull(op.lastCollect)) return 'STORAGE FULL';
    const secPassed = (Date.now() - op.lastCollect) / 1000;
    const secPerOrb = 3600 / LAND_CONFIG[op.rarity].orbPerHour;
    const remaining = secPerOrb - (secPassed % secPerOrb);
    const m = Math.floor(remaining / 60);
    const s = Math.floor(remaining % 60);
    return `${m}м ${s}с`;
  }

  /** Time until 24h cap reached (formatted). For UI hints. */
  function getTimeToCap(op: OwnedPlot): string {
    const msToCap = MAX_IDLE_MS - (Date.now() - op.lastCollect);
    if (msToCap <= 0) return 'FULL';
    const h = Math.floor(msToCap / 3_600_000);
    const m = Math.floor((msToCap % 3_600_000) / 60_000);
    return h > 0 ? `${h}ч ${m}м до cap` : `${m}м до cap`;
  }

  // ── Stats ──
  const ownedList     = Object.values(owned);
  const totalOrbPerHr = ownedList.reduce((s, o) => s + LAND_CONFIG[o.rarity].orbPerHour, 0);
  const pendingOrb    = ownedList.reduce((s, o) => s + getPending(o), 0);
  const filteredPlots = filter ? ALL_PLOTS.filter(p => p.rarity === filter) : ALL_PLOTS;

  return (
    <View style={s.container}>
      {/* Header */}
      <Text style={s.title}>{t('lands.title')}</Text>

      {/* Stats */}
      <View style={s.statsRow}>
        <View style={s.statBox}>
          <Text style={s.statNum}>{ownedList.length}</Text>
          <Text style={s.statLbl}>участков</Text>
        </View>
        <View style={s.statBox}>
          <Text style={s.statNum}>{totalOrbPerHr}</Text>
          <Text style={s.statLbl}>ORB/час</Text>
        </View>
        <View style={[s.statBox, pendingOrb > 0 && s.statBoxGlow]}>
          <Text style={[s.statNum, pendingOrb > 0 && s.statNumGlow]}>{pendingOrb.toLocaleString()}</Text>
          <Text style={s.statLbl}>к сбору</Text>
        </View>
      </View>

      {/* Collect All */}
      {pendingOrb > 0 && (
        <Animated.View style={{
          transform: [{ scale: ctaPulse.interpolate({ inputRange: [0, 1], outputRange: [1, 1.03] }) }],
          shadowColor: '#22C55E',
          shadowRadius: 16,
          shadowOpacity: ctaPulse.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.9] }) as any,
          elevation: 12,
        }}>
          <TouchableOpacity style={s.collectAllBtn} onPress={collectAll} activeOpacity={0.85}>
            <Text style={s.collectAllTxt}>💰 {t('lands.collectAll')} · +{pendingOrb.toLocaleString()} ORB</Text>
          </TouchableOpacity>
        </Animated.View>
      )}

      {/* View toggle */}
      <View style={s.toggleRow}>
        <TouchableOpacity style={[s.toggleBtn, view === 'map' && s.toggleActive]} onPress={() => setView('map')}>
          <Text style={s.toggleTxt}>🗺 Карта мира</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.toggleBtn, view === 'owned' && s.toggleActive]} onPress={() => setView('owned')}>
          <Text style={s.toggleTxt}>🏠 Мои земли ({ownedList.length})</Text>
        </TouchableOpacity>
      </View>

      {view === 'map' && (
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 20 }}>
          {/* Rarity legend */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={s.filterRow} contentContainerStyle={{ gap: 6 }}>
            <TouchableOpacity style={[s.filterChip, !filter && s.filterActive]} onPress={() => setFilter(null)}>
              <Text style={s.filterTxt}>Все</Text>
            </TouchableOpacity>
            {RARITY_ORDER.map(r => (
              <TouchableOpacity key={r}
                style={[s.filterChip, filter === r && s.filterActive, { borderColor: LAND_CONFIG[r].color }]}
                onPress={() => setFilter(filter === r ? null : r)}>
                <Text style={s.filterTxt}>{LAND_CONFIG[r].icon} {LAND_CONFIG[r].label} ({LAND_CONFIG[r].total})</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* Mini-map */}
          <View style={s.minimap}>
            {Array.from({ length: MAP_H }, (_, row) => (
              <View key={row} style={{ flexDirection: 'row' }}>
                {Array.from({ length: MAP_W }, (_, col) => {
                  const plot  = ALL_PLOTS[row * MAP_W + col];
                  const cfg   = LAND_CONFIG[plot.rarity];
                  const op    = owned[plot.id];
                  const ready = op ? getPending(op) > 0 : false;
                  return (
                    <TouchableOpacity
                      key={col}
                      style={[
                        s.mmCell,
                        { backgroundColor: cfg.mapColor },
                        op && { borderColor: cfg.color, borderWidth: 1 },
                      ]}
                      onPress={() => setSelected(plot)}
                    >
                      {ready && (
                        <Animated.View style={[s.mmDot, {
                          opacity:   readyPulse.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }),
                          transform: [{ scale: readyPulse.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1.3] }) }],
                        }]} />
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ))}
            {/* Legend */}
            <View style={s.mmLegend}>
              {RARITY_ORDER.map(r => (
                <View key={r} style={s.mmLegendItem}>
                  <View style={[s.mmLegendDot, { backgroundColor: LAND_CONFIG[r].mapColor }]} />
                  <Text style={s.mmLegendTxt}>{LAND_CONFIG[r].label}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Plot grid (filtered) */}
          <View style={s.plotGrid}>
            {filteredPlots.slice(0, 40).map(plot => {
              const cfg = LAND_CONFIG[plot.rarity];
              const op  = owned[plot.id];
              const ready = op ? getPending(op) > 0 : false;
              return (
                <TouchableOpacity key={plot.id}
                  style={[s.plotCell, { backgroundColor: cfg.bg, borderColor: op ? cfg.color : '#1E293B' }]}
                  onPress={() => setSelected(plot)}>
                  <Text style={s.plotIcon}>{cfg.icon}</Text>
                  {op && <View style={[s.ownedBadge, { backgroundColor: cfg.color }]}><Text style={s.ownedBadgeTxt}>✓</Text></View>}
                  {ready && (
                    <Animated.View style={[s.readyBadge, {
                      transform: [{ scale: readyPulse.interpolate({ inputRange: [0, 1], outputRange: [0.85, 1.2] }) }],
                    }]}>
                      <Text style={s.readyBadgeTxt}>💰</Text>
                    </Animated.View>
                  )}
                </TouchableOpacity>
              );
            })}
          </View>
        </ScrollView>
      )}

      {view === 'owned' && (
        <ScrollView style={s.scroll} contentContainerStyle={{ paddingBottom: 20 }}>
          {ownedList.length === 0 ? (
            <View style={s.emptyOwned}>
              <Text style={s.emptyOwnedIcon}>🗺</Text>
              <Text style={s.emptyOwnedTxt}>У тебя нет участков</Text>
              <Text style={s.emptyOwnedSub}>Перейди на карту и купи первый участок</Text>
              <TouchableOpacity style={s.goMapBtn} onPress={() => setView('map')}>
                <Text style={s.goMapTxt}>Открыть карту</Text>
              </TouchableOpacity>
            </View>
          ) : (
            ownedList.map(op => {
              const cfg     = LAND_CONFIG[op.rarity];
              const pending = getPending(op);
              const timer   = getTimeToNext(op);
              const plot    = ALL_PLOTS.find(p => p.id === op.id)!;
              const fillPct = storageFillPct(op.lastCollect);
              const full    = isStorageFull(op.lastCollect);
              return (
                <TouchableOpacity key={op.id} style={[s.ownedRow, { borderColor: cfg.color }, full && s.ownedRowFull]}
                  onPress={() => setSelected(plot)}>
                  <Text style={s.ownedRowIcon}>{cfg.icon}</Text>
                  <View style={s.ownedRowInfo}>
                    <View style={s.ownedRowHead}>
                      <Text style={[s.ownedRowName, { color: cfg.color }]}>{cfg.label} {op.id}</Text>
                      {full && <View style={s.fullBadge}><Text style={s.fullBadgeText}>FULL</Text></View>}
                    </View>
                    <Text style={s.ownedRowStat}>{cfg.orbPerHour} ORB/час · {timer}</Text>
                    {/* Storage fill bar */}
                    <View style={s.storageTrack}>
                      <View style={[s.storageFill, {
                        width: `${fillPct * 100}%` as any,
                        backgroundColor: full ? '#EF4444' : cfg.color,
                      }]} />
                    </View>
                  </View>
                  <View style={s.ownedRowRight}>
                    {pending > 0 ? (
                      <TouchableOpacity style={[s.collectSmallBtn, full && { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.15)' }]} onPress={() => collectPlot(plot)}>
                        <Text style={[s.collectSmallTxt, full && { color: '#FCA5A5' }]}>+{pending}</Text>
                      </TouchableOpacity>
                    ) : (
                      <Text style={s.ownedRowPending}>⏳</Text>
                    )}
                  </View>
                </TouchableOpacity>
              );
            })
          )}
        </ScrollView>
      )}

      {/* Collect popup + coins */}
      <Animated.View style={[s.collectPopup, {
        opacity: collectAnim,
        transform: [
          { scale: collectAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }) },
          { translateY: collectAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
        ],
      }]}>
        <Text style={s.collectPopupTxt}>+{collectAmt.current.toLocaleString()} ORB 💰</Text>
      </Animated.View>
      {coinAnims.map((c, i) => (
        <Animated.Text key={i} style={[s.coin, {
          opacity: c.op,
          transform: [{ translateX: c.x }, { translateY: c.y }],
        }]}>{['💰','🪙','✨','💎'][i % 4]}</Animated.Text>
      ))}

      {/* Plot Modal */}
      <Modal visible={!!selected} transparent animationType="none" onRequestClose={() => setSelected(null)}>
        <TouchableOpacity style={s.modalBg} activeOpacity={1} onPress={() => setSelected(null)}>
          {selected && (() => {
            const cfg     = LAND_CONFIG[selected.rarity];
            const op      = owned[selected.id];
            const canAfford = orb >= cfg.claimCost;
            const pending = op ? getPending(op) : 0;
            const timer   = op ? getTimeToNext(op) : '';
            return (
              <Animated.View style={[s.modalCard, { borderColor: cfg.color, transform: [{ scale: modalAnim }] }]}>
                <TouchableOpacity activeOpacity={1}>
                  <Text style={s.modalIcon}>{cfg.icon}</Text>
                  <Text style={[s.modalRarity, { color: cfg.color }]}>{cfg.label.toUpperCase()}</Text>
                  <Text style={s.modalCoords}>Координаты {selected.x},{selected.y}</Text>

                  <View style={[s.modalStats, { backgroundColor: cfg.bg }]}>
                    <View style={s.modalStatRow}>
                      <Text style={s.modalStatIcon}>⚡</Text>
                      <Text style={s.modalStatTxt}>{cfg.orbPerHour} ORB / час</Text>
                    </View>
                    {!op && (
                      <View style={s.modalStatRow}>
                        <Text style={s.modalStatIcon}>💰</Text>
                        <Text style={s.modalStatTxt}>Цена: {cfg.claimCost.toLocaleString()} ORB</Text>
                      </View>
                    )}
                    {op && (
                      <>
                        <View style={s.modalStatRow}>
                          <Text style={s.modalStatIcon}>💰</Text>
                          <Text style={s.modalStatTxt}>Накоплено: {pending.toLocaleString()} ORB</Text>
                        </View>
                        <View style={s.modalStatRow}>
                          <Text style={s.modalStatIcon}>⏳</Text>
                          <Text style={s.modalStatTxt}>След. +1 ORB через {timer}</Text>
                        </View>
                      </>
                    )}
                    <View style={s.modalStatRow}>
                      <Text style={s.modalStatIcon}>📦</Text>
                      <Text style={s.modalStatTxt}>В мире: {cfg.total} участков</Text>
                    </View>
                  </View>

                  {!op ? (
                    <TouchableOpacity
                      style={[s.actionBtn, !canAfford && s.actionBtnDisabled, { backgroundColor: canAfford ? cfg.color + 'CC' : '#1E293B' }]}
                      onPress={() => claimPlot(selected)}>
                      <Text style={s.actionBtnTxt}>
                        {canAfford ? `КУПИТЬ · ${cfg.claimCost.toLocaleString()} ORB` : `Нужно ещё ${(cfg.claimCost - orb).toLocaleString()} ORB`}
                      </Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={[s.actionBtn, pending < 1 && s.actionBtnDisabled, { backgroundColor: pending > 0 ? '#22C55E' : '#1E293B' }]}
                      onPress={() => collectPlot(selected)}>
                      <Text style={s.actionBtnTxt}>
                        {pending > 0 ? `СОБРАТЬ · +${pending.toLocaleString()} ORB` : 'Накапливается...'}
                      </Text>
                    </TouchableOpacity>
                  )}

                  <View style={s.nftHint}>
                    <Text style={s.nftHintTxt}>{t('lands.nftHint')}</Text>
                  </View>

                  <TouchableOpacity onPress={() => setSelected(null)} style={s.closeRow}>
                    <Text style={s.closeTxt}>✕ закрыть</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Animated.View>
            );
          })()}
        </TouchableOpacity>
      </Modal>
    </View>
  );
}

// ──────────────────────────────────────────────
const s = StyleSheet.create({
  container:       { flex: 1, paddingTop: 12, paddingHorizontal: 16 },
  title:           { color: '#FACC15', fontSize: 22, fontWeight: '900', letterSpacing: 2, textAlign: 'center', marginBottom: 8 },

  statsRow:        { flexDirection: 'row', gap: 8, marginBottom: 8, justifyContent: 'center' },
  statBox:         { flex: 1, backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1, borderColor: '#1E293B', padding: 10, alignItems: 'center' },
  statBoxGlow:     { borderColor: '#22C55E' },
  statNum:         { color: '#F1F5F9', fontSize: 20, fontWeight: '900' },
  statNumGlow:     { color: '#22C55E' },
  statLbl:         { color: '#64748B', fontSize: 11 },

  collectAllBtn:   { backgroundColor: '#15803D', borderRadius: 14, padding: 12, alignItems: 'center', marginBottom: 8 },
  collectAllTxt:   { color: '#fff', fontSize: 14, fontWeight: '900' },

  toggleRow:       { flexDirection: 'row', gap: 8, marginBottom: 8 },
  toggleBtn:       { flex: 1, backgroundColor: '#0F172A', borderRadius: 12, padding: 10, alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  toggleActive:    { borderColor: '#FACC15', backgroundColor: '#1E293B' },
  toggleTxt:       { color: '#CBD5E1', fontSize: 12, fontWeight: '700' },

  scroll:          { flex: 1 },

  filterRow:       { maxHeight: 38, marginBottom: 8 },
  filterChip:      { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 20, borderWidth: 1, borderColor: '#334155', backgroundColor: '#0F172A' },
  filterActive:    { backgroundColor: '#1E293B' },
  filterTxt:       { color: '#CBD5E1', fontSize: 11 },

  minimap:         { backgroundColor: '#020617', borderRadius: 10, padding: 4, marginBottom: 12, borderWidth: 1, borderColor: '#1E293B' },
  mmCell:          { width: MINIMAP_CELL, height: MINIMAP_CELL, borderRadius: 1, position: 'relative' },
  mmDot:           { position: 'absolute', top: 1, right: 1, width: 3, height: 3, borderRadius: 2, backgroundColor: '#22C55E' },
  mmLegend:        { flexDirection: 'row', flexWrap: 'wrap', gap: 8, padding: 6 },
  mmLegendItem:    { flexDirection: 'row', alignItems: 'center', gap: 4 },
  mmLegendDot:     { width: 10, height: 10, borderRadius: 2 },
  mmLegendTxt:     { color: '#64748B', fontSize: 10 },

  plotGrid:        { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  plotCell:        { width: LIST_CELL, height: LIST_CELL, borderRadius: 10, borderWidth: 1.5, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  plotIcon:        { fontSize: LIST_CELL * 0.4 },
  ownedBadge:      { position: 'absolute', top: 3, right: 3, width: 14, height: 14, borderRadius: 7, alignItems: 'center', justifyContent: 'center' },
  ownedBadgeTxt:   { color: '#fff', fontSize: 8, fontWeight: '900' },
  readyBadge:      { position: 'absolute', bottom: 2, right: 2 },
  readyBadgeTxt:   { fontSize: 10 },

  emptyOwned:      { alignItems: 'center', paddingTop: 40, gap: 8 },
  emptyOwnedIcon:  { fontSize: 48 },
  emptyOwnedTxt:   { color: '#F1F5F9', fontSize: 16, fontWeight: '700' },
  emptyOwnedSub:   { color: '#64748B', fontSize: 13, textAlign: 'center' },
  goMapBtn:        { backgroundColor: '#1E293B', borderRadius: 12, paddingHorizontal: 20, paddingVertical: 10, marginTop: 8 },
  goMapTxt:        { color: '#FACC15', fontSize: 14, fontWeight: '700' },

  ownedRow:        { flexDirection: 'row', alignItems: 'center', backgroundColor: '#0F172A', borderRadius: 14, borderWidth: 1.5, padding: 12, marginBottom: 8, gap: 12 },
  ownedRowFull:    { borderColor: '#EF4444', backgroundColor: 'rgba(239,68,68,0.08)' },
  ownedRowIcon:    { fontSize: 28 },
  ownedRowInfo:    { flex: 1 },
  ownedRowHead:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ownedRowName:    { fontSize: 14, fontWeight: '800' },
  ownedRowStat:    { color: '#64748B', fontSize: 11, marginTop: 2 },
  fullBadge:       { backgroundColor: 'rgba(239,68,68,0.2)', borderRadius: 6,
                     paddingHorizontal: 6, paddingVertical: 2,
                     borderWidth: 1, borderColor: 'rgba(239,68,68,0.6)' },
  fullBadgeText:   { color: '#EF4444', fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  storageTrack:    { width: '100%', height: 3, backgroundColor: '#1E293B', borderRadius: 2,
                     marginTop: 6, overflow: 'hidden' },
  storageFill:     { height: '100%', borderRadius: 2 },
  ownedRowRight:   { alignItems: 'center' },
  ownedRowPending: { fontSize: 20 },
  collectSmallBtn: { backgroundColor: '#15803D', borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6 },
  collectSmallTxt: { color: '#fff', fontSize: 12, fontWeight: '900' },

  collectPopup:    { position: 'absolute', top: '35%', alignSelf: 'center', backgroundColor: '#15803D', paddingHorizontal: 28, paddingVertical: 12, borderRadius: 24, zIndex: 99 },
  collectPopupTxt: { color: '#fff', fontSize: 20, fontWeight: '900' },
  coin:            { position: 'absolute', top: '45%', alignSelf: 'center', fontSize: 20, zIndex: 100 },

  modalBg:         { flex: 1, backgroundColor: 'rgba(0,0,0,0.88)', justifyContent: 'center', alignItems: 'center' },
  modalCard:       { backgroundColor: '#0A0F1E', borderRadius: 24, padding: 24, width: 300, borderWidth: 2, alignItems: 'center' },
  modalIcon:       { fontSize: 56, textAlign: 'center', marginBottom: 6 },
  modalRarity:     { fontSize: 16, fontWeight: '900', letterSpacing: 2, textAlign: 'center' },
  modalCoords:     { color: '#475569', fontSize: 11, textAlign: 'center', marginBottom: 12 },
  modalStats:      { borderRadius: 12, padding: 12, width: '100%', gap: 8, marginBottom: 14 },
  modalStatRow:    { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalStatIcon:   { fontSize: 16 },
  modalStatTxt:    { color: '#94A3B8', fontSize: 13 },
  actionBtn:       { width: '100%', borderRadius: 14, padding: 13, alignItems: 'center', marginBottom: 10 },
  actionBtnDisabled: { backgroundColor: '#1E293B' },
  actionBtnTxt:    { color: '#fff', fontSize: 14, fontWeight: '900' },
  nftHint:         { backgroundColor: '#1E1030', borderRadius: 10, padding: 8, width: '100%', marginBottom: 10 },
  nftHintTxt:      { color: '#A855F7', fontSize: 12, textAlign: 'center' },
  closeRow:        { paddingVertical: 6 },
  closeTxt:        { color: '#475569', fontSize: 13, textAlign: 'center' },
});
