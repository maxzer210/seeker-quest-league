import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { t, useLang } from '../lib/i18n';

const GRID        = 24;   // карта 24×24 (было 16)
const VIEWPORT    = 7;    // видимая область 7×7 (центр = игрок)
const CHEST_COUNT = 32;   // было 20
const MINE_COUNT  = 12;   // 💣 -30..150 ORB
const SPIDER_COUNT = 6;   // 🕷 -50..200 ORB + -7 ⚡
const LAVA_COUNT  = 8;    // 🔥 -5 ⚡
const MOVE_ENERGY = 1;
const START: [number, number] = [11, 11];  // центр 24×24
const CELL        = 42;

// ──────── Генератор карты по дате ────────
function getDayKey() {
  const d = new Date();
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function seededRand(seed: number) {
  let s = seed >>> 0;
  return () => {
    s ^= s << 13; s ^= s >>> 17; s ^= s << 5;
    return (s >>> 0) / 0xffffffff;
  };
}

type TileType = 'grass' | 'water' | 'rock' | 'tree';

function buildDailyMap(): {
  chests:  Map<string, number>;
  terrain: TileType[][];
  mines:   Set<string>;
  spiders: Set<string>;
  lava:    Set<string>;
} {
  const day = getDayKey();
  let seed = 0;
  for (let i = 0; i < day.length; i++) seed = seed * 31 + day.charCodeAt(i);
  const rand = seededRand(seed + 1);

  // Terrain
  const terrain: TileType[][] = Array.from({ length: GRID }, () =>
    Array.from({ length: GRID }, () => {
      const r = rand();
      if (r < 0.10) return 'water';
      if (r < 0.18) return 'rock';
      if (r < 0.28) return 'tree';
      return 'grass';
    })
  );
  // Стартовая клетка всегда проходима
  terrain[START[1]][START[0]] = 'grass';

  // Chests — не на воде/камнях и не на старте
  const chests = new Map<string, number>();
  let attempts = 0;
  while (chests.size < CHEST_COUNT && attempts < 800) {
    attempts++;
    const x = Math.floor(rand() * GRID);
    const y = Math.floor(rand() * GRID);
    const key = `${x},${y}`;
    if (key === `${START[0]},${START[1]}`) continue;
    if (terrain[y][x] === 'water' || terrain[y][x] === 'rock') continue;
    if (!chests.has(key)) {
      const reward = 50 + Math.floor(rand() * 251);
      chests.set(key, reward);
    }
  }

  // Dangers — не пересекаются с сундуками, водой, камнями, стартом
  const startKey = `${START[0]},${START[1]}`;
  const mines   = new Set<string>();
  const spiders = new Set<string>();
  const lava    = new Set<string>();

  const placeDanger = (target: Set<string>, count: number) => {
    let a = 0;
    while (target.size < count && a < 1000) {
      a++;
      const x = Math.floor(rand() * GRID);
      const y = Math.floor(rand() * GRID);
      const key = `${x},${y}`;
      if (key === startKey) continue;
      // Запрет на старт + 2 клетки радиус — чтобы нельзя было сразу налететь
      if (Math.abs(x - START[0]) <= 2 && Math.abs(y - START[1]) <= 2) continue;
      if (terrain[y][x] === 'water' || terrain[y][x] === 'rock') continue;
      if (chests.has(key) || mines.has(key) || spiders.has(key) || lava.has(key)) continue;
      target.add(key);
    }
  };
  placeDanger(mines,   MINE_COUNT);
  placeDanger(spiders, SPIDER_COUNT);
  placeDanger(lava,    LAVA_COUNT);

  return { chests, terrain, mines, spiders, lava };
}

// ──────── Иконки тайлов ────────
const TILE_EMOJI: Record<TileType, string> = {
  grass: '·',
  water: '〰',
  rock:  '⬛',
  tree:  '🌲',
};
const TILE_BG: Record<TileType, string> = {
  grass: '#0F172A',
  water: '#0C2A4A',
  rock:  '#1C1917',
  tree:  '#052E16',
};

// ──────── Props ────────
type Props = {
  energy: number;
  onSpendEnergy: (n: number) => void;
  onEarnOrb: (n: number) => void;
  onSpendOrb: (n: number) => void;
};

const STORAGE_KEY = 'sk_treasure3_';  // bumped for 24×24 map + dangers

function HowToPlayTreasure() {
  const [open, setOpen] = React.useState(false);
  const steps = [
    { icon: '🗺️', text: 'Карта 24×24. Каждый день новая. 32 сундука и 26 ловушек' },
    { icon: '📦', text: 'Сундук → +50..300 ORB. Туман открывается на 2 клетки вокруг' },
    { icon: '👣', text: '1 шаг = 1 ⚡. Энергия восстанавливается +1/мин' },
    { icon: '💣', text: 'Мина → −30..150 ORB. Скрыта в тумане. Будь внимателен!' },
    { icon: '🕷', text: 'Паук → −50..200 ORB и −7 ⚡. Самый опасный враг' },
    { icon: '🔥', text: 'Лава → −5 ⚡. Без потери ORB, но больно когда мало энергии' },
    { icon: '💀', text: 'Сработавшая ловушка → безопасно, можно ходить' },
  ];
  return (
    <View style={{ marginBottom: 10 }}>
      <TouchableOpacity onPress={() => setOpen(o => !o)} activeOpacity={0.8}
        style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start',
                 backgroundColor: 'rgba(99,60,200,0.18)', borderRadius: 20, paddingHorizontal: 14,
                 paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)' }}>
        <Text style={{ color: '#A855F7', fontSize: 11, fontWeight: '900', letterSpacing: 2 }}>
          {open ? '▲' : '?'}  {t('treasure.howToPlay')}
        </Text>
      </TouchableOpacity>
      {open && (
        <View style={{ marginTop: 8, backgroundColor: 'rgba(8,13,32,0.92)', borderRadius: 16,
                       padding: 14, borderWidth: 1, borderColor: 'rgba(99,60,200,0.25)', gap: 10 }}>
          {steps.map((st, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
              <Text style={{ fontSize: 18, width: 26 }}>{st.icon}</Text>
              <Text style={{ color: '#94A3B8', fontSize: 13, lineHeight: 19, flex: 1 }}>{st.text}</Text>
            </View>
          ))}
        </View>
      )}
    </View>
  );
}

export default function TreasureHunt({ energy, onSpendEnergy, onEarnOrb, onSpendOrb }: Props) {
  useLang();
  const mapData   = useRef(buildDailyMap());
  const dayKey    = getDayKey();
  const rewardAnim = useRef(new Animated.Value(0)).current;

  // ── Visual anims ──
  const chestPulseAnim = useRef(new Animated.Value(1)).current;
  const playerRingAnim = useRef(new Animated.Value(0)).current;
  const lightBurstAnim = useRef(new Animated.Value(0)).current;
  const burstParticles = useRef(
    Array.from({ length: 12 }, () => ({
      x:  new Animated.Value(0),
      y:  new Animated.Value(0),
      op: new Animated.Value(0),
    }))
  ).current;
  const [showBurst, setShowBurst] = useState(false);

  const [pos,      setPos]      = useState<[number, number]>(START);
  const [revealed, setRevealed] = useState<Set<string>>(
    () => new Set([`${START[0]},${START[1]}`])
  );
  const [opened,   setOpened]   = useState<Set<string>>(new Set());
  const [triggered, setTriggered] = useState<Set<string>>(new Set());  // сработавшие ловушки
  const [reward,   setReward]   = useState<number | null>(null);
  const [danger,   setDanger]   = useState<{ icon: string; label: string } | null>(null);
  const [steps,    setSteps]    = useState(0);

  const dangerAnim = useRef(new Animated.Value(0)).current;
  const redFlashAnim = useRef(new Animated.Value(0)).current;
  const cellShakeAnim = useRef(new Animated.Value(0)).current;

  // ── Ambient loops: chest pulse + player ring ──
  useEffect(() => {
    const pulse = Animated.loop(Animated.sequence([
      Animated.timing(chestPulseAnim, { toValue: 1.18, duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      Animated.timing(chestPulseAnim, { toValue: 1,    duration: 650, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
    ]));
    const ring = Animated.loop(Animated.sequence([
      Animated.timing(playerRingAnim, { toValue: 1, duration: 1400, easing: Easing.out(Easing.ease), useNativeDriver: true }),
      Animated.timing(playerRingAnim, { toValue: 0, duration: 0,    useNativeDriver: true }),
    ]));
    pulse.start(); ring.start();
    return () => { pulse.stop(); ring.stop(); };
  }, []);

  const triggerChestOpen = useCallback(() => {
    setShowBurst(true);
    lightBurstAnim.setValue(0);
    Animated.sequence([
      Animated.timing(lightBurstAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(lightBurstAnim, { toValue: 0, duration: 700, useNativeDriver: true }),
    ]).start();

    burstParticles.forEach((p, i) => {
      const angle = (i / burstParticles.length) * Math.PI * 2;
      const dist  = 75 + Math.random() * 45;
      p.x.setValue(0); p.y.setValue(0); p.op.setValue(1);
      Animated.parallel([
        Animated.timing(p.x,  { toValue: Math.cos(angle) * dist,        duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(p.y,  { toValue: Math.sin(angle) * dist - 18,   duration: 850, easing: Easing.out(Easing.cubic), useNativeDriver: true }),
        Animated.timing(p.op, { toValue: 0, duration: 850, delay: 300,  useNativeDriver: true }),
      ]).start();
    });
    setTimeout(() => setShowBurst(false), 900);
  }, []);

  // Reveal initial area around start
  useEffect(() => {
    const init = new Set<string>();
    for (let ax = -2; ax <= 2; ax++)
      for (let ay = -2; ay <= 2; ay++) {
        const rx = START[0] + ax, ry = START[1] + ay;
        if (rx >= 0 && rx < GRID && ry >= 0 && ry < GRID)
          init.add(`${rx},${ry}`);
      }
    setRevealed(init);
  }, []);

  // Load saved state
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(STORAGE_KEY + dayKey);
        if (saved) {
          const p = JSON.parse(saved);
          setPos(p.pos ?? START);
          setRevealed(new Set(p.revealed ?? []));
          setOpened(new Set(p.opened ?? []));
          setTriggered(new Set(p.triggered ?? []));
          setSteps(p.steps ?? 0);
        }
      } catch (_) {}
    })();
  }, []);

  const save = useCallback((
    p: [number, number], rev: Set<string>, op: Set<string>, tr: Set<string>, st: number,
  ) => {
    AsyncStorage.setItem(STORAGE_KEY + dayKey, JSON.stringify({
      pos: p, revealed: [...rev], opened: [...op], triggered: [...tr], steps: st,
    })).catch(() => {});
  }, [dayKey]);

  const showDanger = useCallback((icon: string, label: string) => {
    setDanger({ icon, label });
    dangerAnim.setValue(0);
    redFlashAnim.setValue(0);
    cellShakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(dangerAnim, { toValue: 1, duration: 250, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      Animated.delay(1100),
      Animated.timing(dangerAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setDanger(null));
    Animated.sequence([
      Animated.timing(redFlashAnim, { toValue: 1, duration: 120, useNativeDriver: true }),
      Animated.timing(redFlashAnim, { toValue: 0, duration: 500, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(cellShakeAnim, { toValue: 8,  duration: 50, useNativeDriver: true }),
      Animated.timing(cellShakeAnim, { toValue: -8, duration: 50, useNativeDriver: true }),
      Animated.timing(cellShakeAnim, { toValue: 5,  duration: 50, useNativeDriver: true }),
      Animated.timing(cellShakeAnim, { toValue: 0,  duration: 50, useNativeDriver: true }),
    ]).start();
  }, [dangerAnim, redFlashAnim, cellShakeAnim]);

  const showReward = useCallback((n: number) => {
    setReward(n);
    rewardAnim.setValue(0);
    Animated.sequence([
      Animated.timing(rewardAnim, { toValue: 1, duration: 300, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
      Animated.delay(900),
      Animated.timing(rewardAnim, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(() => setReward(null));
  }, [rewardAnim]);

  const move = useCallback((dx: number, dy: number) => {
    if (energy < MOVE_ENERGY) return;

    setPos(([x, y]) => {
      const nx = Math.max(0, Math.min(GRID - 1, x + dx));
      const ny = Math.max(0, Math.min(GRID - 1, y + dy));
      if (nx === x && ny === y) return [x, y];

      // Стена — вода и скала непроходимы
      const tile = mapData.current.terrain[ny][nx];
      if (tile === 'water' || tile === 'rock') return [x, y];

      onSpendEnergy(MOVE_ENERGY);

      // Открыть туман вокруг новой позиции (радиус 2)
      const newRev = new Set(revealed);
      for (let ax = -2; ax <= 2; ax++)
        for (let ay = -2; ay <= 2; ay++) {
          const rx = nx + ax, ry = ny + ay;
          if (rx >= 0 && rx < GRID && ry >= 0 && ry < GRID)
            newRev.add(`${rx},${ry}`);
        }

      const cellKey = `${nx},${ny}`;
      const m = mapData.current;

      let newOpened = opened;
      let newTriggered = triggered;

      // Chest
      const chestReward = m.chests.get(cellKey);
      if (chestReward !== undefined && !opened.has(cellKey)) {
        newOpened = new Set(opened);
        newOpened.add(cellKey);
        onEarnOrb(chestReward);
        showReward(chestReward);
        triggerChestOpen();
      }

      // Danger — только если не сработала раньше
      const isMine    = m.mines.has(cellKey)   && !triggered.has(cellKey);
      const isSpider  = m.spiders.has(cellKey) && !triggered.has(cellKey);
      const isLava    = m.lava.has(cellKey)    && !triggered.has(cellKey);

      if (isMine || isSpider || isLava) {
        newTriggered = new Set(triggered);
        newTriggered.add(cellKey);

        if (isMine) {
          const loss = 30 + Math.floor(Math.random() * 121);  // 30..150
          onSpendOrb(loss);
          showDanger('💣', `−${loss} ORB`);
        } else if (isSpider) {
          const orbLoss = 50 + Math.floor(Math.random() * 151);  // 50..200
          onSpendOrb(orbLoss);
          onSpendEnergy(7);
          showDanger('🕷', `−${orbLoss} ORB  −7 ⚡`);
        } else if (isLava) {
          onSpendEnergy(5);
          showDanger('🔥', `−5 ⚡`);
        }
      }

      const newSteps = steps + 1;
      setRevealed(newRev);
      setOpened(newOpened);
      setTriggered(newTriggered);
      setSteps(newSteps);
      save([nx, ny], newRev, newOpened, newTriggered, newSteps);
      return [nx, ny];
    });
  }, [energy, revealed, opened, triggered, steps, onSpendEnergy, onEarnOrb, onSpendOrb, save, showReward, triggerChestOpen, showDanger]);

  // ──────── Viewport: 7×7 клеток вокруг игрока ────────
  const half   = Math.floor(VIEWPORT / 2);
  const startX = pos[0] - half;
  const startY = pos[1] - half;

  const rewardScale     = rewardAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] });
  const rewardOpacity   = rewardAnim.interpolate({ inputRange: [0, 0.3, 0.85, 1], outputRange: [0, 1, 1, 0] });
  const rewardTranslate = rewardAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] });

  const foundCount = opened.size;

  return (
    <View style={s.container}>
      <Text style={s.title}>{t('treasure.title')}</Text>
      <HowToPlayTreasure />
      <View style={s.statsRow}>
        <Text style={s.stat}>📦 {foundCount}/{CHEST_COUNT}</Text>
        <Text style={s.stat}>💀 {triggered.size}/{MINE_COUNT + SPIDER_COUNT + LAVA_COUNT}</Text>
        <Text style={s.stat}>👣 {steps}</Text>
        <Text style={s.stat}>⚡ {energy}/100</Text>
      </View>

      {/* Reward popup */}
      {reward !== null && (
        <Animated.View style={[s.rewardPopup, {
          opacity: rewardOpacity,
          transform: [{ scale: rewardScale }, { translateY: rewardTranslate }],
        }]}>
          <Text style={s.rewardText}>+{reward} ORB 💰</Text>
        </Animated.View>
      )}

      {/* Danger popup */}
      {danger !== null && (
        <Animated.View style={[s.dangerPopup, {
          opacity:   dangerAnim.interpolate({ inputRange: [0, 0.3, 0.85, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { scale:      dangerAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 1] }) },
            { translateY: dangerAnim.interpolate({ inputRange: [0, 1], outputRange: [20, 0] }) },
            { translateX: cellShakeAnim },
          ],
        }]}>
          <Text style={s.dangerIcon}>{danger.icon}</Text>
          <Text style={s.dangerText}>{danger.label}</Text>
        </Animated.View>
      )}

      {/* Red flash overlay on danger */}
      <Animated.View pointerEvents="none" style={[s.redFlash, {
        opacity: redFlashAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
      }]} />

      {/* Map viewport */}
      <View style={s.mapWrapper}>
        {Array.from({ length: VIEWPORT }, (_, vy) => {
          const worldY = startY + vy;
          return (
            <View key={vy} style={s.row}>
              {Array.from({ length: VIEWPORT }, (_, vx) => {
                const worldX = startX + vx;
                const outOfBounds = worldX < 0 || worldX >= GRID || worldY < 0 || worldY >= GRID;
                const key = `${worldX},${worldY}`;
                const isPlayer  = worldX === pos[0] && worldY === pos[1];
                const isRev     = revealed.has(key);
                const terrain   = outOfBounds ? 'rock' : mapData.current.terrain[worldY]?.[worldX] ?? 'grass';
                const isChest   = mapData.current.chests.has(key);
                const isOpened  = opened.has(key);

                const bg = outOfBounds || !isRev ? '#020617' : TILE_BG[terrain];

                const m = mapData.current;
                const isMine    = m.mines.has(key);
                const isSpider  = m.spiders.has(key);
                const isLava    = m.lava.has(key);
                const isTrig    = triggered.has(key);

                let icon = '';
                if (isPlayer)                                 icon = '🧭';
                else if (!isRev || outOfBounds)               icon = '';
                else if (isChest && !isOpened)                icon = '📦';
                else if (isChest && isOpened)                 icon = '✨';
                else if (isMine && !isTrig)                   icon = '💣';
                else if (isSpider && !isTrig)                 icon = '🕷';
                else if (isLava && !isTrig)                   icon = '🔥';
                else if ((isMine || isSpider || isLava) && isTrig) icon = '💀';
                else                                          icon = TILE_EMOJI[terrain];

                const isClosedChest = isChest && !isOpened && isRev && !isPlayer;
                const dangerBg =
                  isRev && !isTrig && isLava   ? '#3F0E0E' :
                  isRev && !isTrig && isMine   ? '#1F0E12' :
                  isRev && !isTrig && isSpider ? '#1A0F1F' :
                  null;
                return (
                  <View key={vx} style={[
                    s.cell,
                    { backgroundColor: dangerBg ?? bg },
                    isPlayer && s.playerCell,
                  ]}>
                    {isClosedChest ? (
                      <Animated.Text style={[s.cellTxt, { transform: [{ scale: chestPulseAnim }] }]}>
                        {icon}
                      </Animated.Text>
                    ) : (
                      <Text style={[s.cellTxt, terrain === 'water' && s.waterTxt]}>
                        {icon}
                      </Text>
                    )}
                  </View>
                );
              })}
            </View>
          );
        })}

        {/* Player aura ring (always at viewport center) */}
        <Animated.View pointerEvents="none" style={[s.playerRing, {
          opacity:   playerRingAnim.interpolate({ inputRange: [0, 0.1, 1], outputRange: [0, 0.7, 0] }),
          transform: [{ scale: playerRingAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1.6] }) }],
        }]} />

        {/* Chest open light burst (at viewport center) */}
        {showBurst && (
          <Animated.View pointerEvents="none" style={[s.lightBurst, {
            opacity:   lightBurstAnim,
            transform: [{ scale: lightBurstAnim.interpolate({ inputRange: [0, 1], outputRange: [0.4, 2.2] }) }],
          }]} />
        )}

        {/* Burst particles (at viewport center) */}
        {showBurst && (
          <View pointerEvents="none" style={s.burstLayer}>
            {burstParticles.map((p, i) => (
              <Animated.Text key={i} style={[s.burstParticle, {
                opacity:   p.op,
                transform: [{ translateX: p.x }, { translateY: p.y }],
              }]}>
                {['💰','⚡','✨','🪙','💎'][i % 5]}
              </Animated.Text>
            ))}
          </View>
        )}

        {/* Compass overlay */}
        <View style={s.compassBadge}>
          <Text style={s.compassTxt}>{pos[0]},{pos[1]}</Text>
        </View>
      </View>

      {/* D-pad */}
      <View style={s.dpad}>
        <View style={s.dpadRow}>
          <View style={s.dpadEmpty} />
          <TouchableOpacity style={s.dpadBtn} onPress={() => move(0, -1)}>
            <Text style={s.dpadTxt}>▲</Text>
          </TouchableOpacity>
          <View style={s.dpadEmpty} />
        </View>
        <View style={s.dpadRow}>
          <TouchableOpacity style={s.dpadBtn} onPress={() => move(-1, 0)}>
            <Text style={s.dpadTxt}>◄</Text>
          </TouchableOpacity>
          <View style={[s.dpadBtn, s.dpadCenter]}>
            <Text style={s.dpadCenterTxt}>⚡</Text>
          </View>
          <TouchableOpacity style={s.dpadBtn} onPress={() => move(1, 0)}>
            <Text style={s.dpadTxt}>►</Text>
          </TouchableOpacity>
        </View>
        <View style={s.dpadRow}>
          <View style={s.dpadEmpty} />
          <TouchableOpacity style={s.dpadBtn} onPress={() => move(0, 1)}>
            <Text style={s.dpadTxt}>▼</Text>
          </TouchableOpacity>
          <View style={s.dpadEmpty} />
        </View>
      </View>

      <Text style={s.hint}>
        {energy < MOVE_ENERGY
          ? '⚠️ Нет энергии — подожди пока восстановится'
          : foundCount === CHEST_COUNT
            ? '🏆 Все сундуки найдены! Новая карта завтра'
            : `📦 ${CHEST_COUNT - foundCount} осталось · 💣🕷🔥 опасности скрыты в тумане · карта обновится завтра`}
      </Text>
    </View>
  );
}

const s = StyleSheet.create({
  container:      { flex: 1, alignItems: 'center', paddingTop: 12 },
  title:          { color: '#FACC15', fontSize: 20, fontWeight: '900', letterSpacing: 2, marginBottom: 6 },
  statsRow:       { flexDirection: 'row', gap: 16, marginBottom: 8 },
  stat:           { color: '#94A3B8', fontSize: 12, fontWeight: '600' },
  rewardPopup:    { position: 'absolute', top: 80, zIndex: 99,
                    backgroundColor: '#FACC15', paddingHorizontal: 32, paddingVertical: 12, borderRadius: 24,
                    borderWidth: 2, borderColor: '#FB923C',
                    shadowColor: '#FACC15', shadowRadius: 24, shadowOpacity: 1, elevation: 20 },
  rewardText:     { color: '#000', fontSize: 22, fontWeight: '900', letterSpacing: 1 },

  dangerPopup:    { position: 'absolute', top: 80, zIndex: 99,
                    backgroundColor: '#7F1D1D', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24,
                    borderWidth: 2, borderColor: '#EF4444', flexDirection: 'row', alignItems: 'center', gap: 10,
                    shadowColor: '#EF4444', shadowRadius: 24, shadowOpacity: 1, elevation: 20 },
  dangerIcon:     { fontSize: 22 },
  dangerText:     { color: '#FECACA', fontSize: 17, fontWeight: '900', letterSpacing: 1 },

  redFlash:       { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: '#EF4444', zIndex: 50 },
  mapWrapper:     { borderWidth: 2, borderColor: '#334155', borderRadius: 8, overflow: 'hidden', position: 'relative' },

  // Player aura ring at viewport center
  playerRing:     { position: 'absolute',
                    left:   (VIEWPORT / 2 - 0.5) * CELL - 18,
                    top:    (VIEWPORT / 2 - 0.5) * CELL - 18,
                    width: CELL + 36, height: CELL + 36, borderRadius: (CELL + 36) / 2,
                    borderWidth: 3, borderColor: '#FACC15' },

  // Chest open light burst
  lightBurst:     { position: 'absolute',
                    left:   (VIEWPORT / 2 - 0.5) * CELL - 14,
                    top:    (VIEWPORT / 2 - 0.5) * CELL - 14,
                    width: CELL + 28, height: CELL + 28, borderRadius: (CELL + 28) / 2,
                    backgroundColor: '#FACC15' },

  // Burst particles layer (centered on player cell)
  burstLayer:     { position: 'absolute',
                    left:  Math.floor(VIEWPORT / 2) * CELL + CELL / 2,
                    top:   Math.floor(VIEWPORT / 2) * CELL + CELL / 2,
                    width: 0, height: 0 },
  burstParticle:  { position: 'absolute', fontSize: 20, marginLeft: -10, marginTop: -10 },

  row:            { flexDirection: 'row' },
  cell:           { width: CELL, height: CELL, alignItems: 'center', justifyContent: 'center', borderWidth: 0.3, borderColor: '#1E293B' },
  playerCell:     { borderColor: '#FACC15', borderWidth: 1.5 },
  cellTxt:        { fontSize: 18 },
  waterTxt:       { fontSize: 14 },
  compassBadge:   { position: 'absolute', bottom: 4, right: 6 },
  compassTxt:     { color: '#475569', fontSize: 10 },
  dpad:           { marginTop: 16, gap: 4 },
  dpadRow:        { flexDirection: 'row', gap: 4, justifyContent: 'center' },
  dpadBtn:        { width: 60, height: 60, backgroundColor: '#1E293B', borderRadius: 14, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#334155' },
  dpadEmpty:      { width: 60, height: 60 },
  dpadCenter:     { backgroundColor: '#0F172A' },
  dpadTxt:        { color: '#FACC15', fontSize: 24 },
  dpadCenterTxt:  { color: '#38BDF8', fontSize: 24 },
  hint:           { color: '#475569', fontSize: 11, marginTop: 12, textAlign: 'center', paddingHorizontal: 24 },
});
