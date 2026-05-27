import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, PanResponder } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../lib/theme';
import SpaceShip from './SpaceShip';
import { t, useLang } from '../lib/i18n';

const { width, height } = Dimensions.get('window');

// ─── Game constants ─────────────────────────────────────────────────────────
const HIGH_SCORE_KEY  = 'sk_runner_best';

const SHIP_SIZE       = 54;
const SHIP_Y          = height - 160;                 // абсолютная Y корабля
const SHIP_HITBOX_W   = 38;
const SHIP_HITBOX_H   = 38;

const ASTEROID_BASE_SIZE = 36;
const NEAR_MISS_DX    = 70;                            // px по X для near-miss
const NEAR_MISS_DY    = 50;                            // px по Y для near-miss window

const GAME_LOOP_HZ    = 30;                            // 30 FPS логика
const FRAME_MS        = 1000 / GAME_LOOP_HZ;

const STAR_COUNT      = 35;
const HUD_TOP         = 50;
const COMBO_STREAK_REQ = 3;                            // 3 near-miss = ×2 множитель
const COMBO_MULT      = 2;

// Difficulty curve
const INITIAL_SPAWN_MS = 850;
const MIN_SPAWN_MS     = 300;
const INITIAL_FALL_MS  = 2600;                         // время пролёта сверху вниз
const MIN_FALL_MS      = 1200;
const GEM_CHANCE       = 0.18;                         // 18% спавна = драгоценность вместо астероида
const GEM_REWARD       = 20;

// ─── Types ──────────────────────────────────────────────────────────────────
type Asteroid = {
  id: number;
  kind: 'rock' | 'gem';
  x: number;            // фиксированный X
  y: number;            // текущий Y (обновляется в loop)
  vy: number;           // пикселей в секунду
  size: number;         // визуальный + хитбокс
  spawnTs: number;
  nearMissed: boolean;
  scored: boolean;
  collected: boolean;
};

type FloatNum = {
  id: number;
  x: number;
  y: number;
  value: number;
  color: string;
  anim: Animated.Value;
};

type Star = {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  speed: number;        // 0..1
  size: number;
};

type Props = {
  onExit:      () => void;
  orb:         number;
  onEarnOrb:   (n: number) => void;
  onSpendOrb:  (n: number) => void;
  onAddScore:  (n: number) => void;
};

let nextAsteroidId = 1;

// ─── Component ──────────────────────────────────────────────────────────────
export default function SpaceRunner({ onExit, onEarnOrb, onAddScore }: Props) {
  useLang();
  const theme = useTheme();

  const [score, setScore]         = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [comboCount, setComboCount] = useState(0);     // near-miss streak
  const [multActive, setMultActive] = useState(false);
  const [comboText, setComboText] = useState('');

  // Asteroids/stars в state — рендерятся через map
  const [asteroids, setAsteroids] = useState<Asteroid[]>([]);
  const [, forceRender] = useState(0);

  // Refs для game loop (не вызывают re-render каждый кадр)
  const isPlayingRef = useRef(false);
  const asteroidsRef = useRef<Asteroid[]>([]);
  const shipXRef     = useRef(width / 2);
  const scoreRef     = useRef(0);
  const comboRef     = useRef(0);
  const multActiveRef= useRef(false);
  const startTimeRef = useRef(0);
  const lastSpawnRef = useRef(0);
  const lastFrameRef = useRef(0);
  const highScoreRef = useRef(0);

  // Animated values для визуала
  const shipX        = useRef(new Animated.Value(width / 2)).current;
  const shipTilt     = useRef(new Animated.Value(0)).current;
  const comboOpacity = useRef(new Animated.Value(0)).current;
  const hitFlash     = useRef(new Animated.Value(0)).current;
  const enginePulse  = useRef(new Animated.Value(0)).current;
  const shakeAnim    = useRef(new Animated.Value(0)).current;

  // Floating "+X" numbers
  const [floats, setFloats] = useState<FloatNum[]>([]);
  const floatsRef = useRef<FloatNum[]>([]);
  const nextFloatId = useRef(1);

  function addFloat(x: number, y: number, value: number, color: string) {
    const anim = new Animated.Value(0);
    const f: FloatNum = { id: nextFloatId.current++, x, y, value, color, anim };
    floatsRef.current = [...floatsRef.current, f];
    setFloats(floatsRef.current);
    Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }).start(() => {
      floatsRef.current = floatsRef.current.filter(fl => fl.id !== f.id);
      setFloats(floatsRef.current);
    });
  }

  function triggerShake(intensity: number = 10) {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  intensity, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -intensity, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  intensity * 0.6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -intensity * 0.3, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0, duration: 40, useNativeDriver: true }),
    ]).start();
  }

  // ─── Sync refs ──
  useEffect(() => { isPlayingRef.current = isPlaying; }, [isPlaying]);
  useEffect(() => { scoreRef.current = score; }, [score]);
  useEffect(() => { highScoreRef.current = highScore; }, [highScore]);
  useEffect(() => { comboRef.current = comboCount; }, [comboCount]);
  useEffect(() => { multActiveRef.current = multActive; }, [multActive]);

  // ─── Load high score ──
  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then(v => {
      if (v) {
        const n = parseInt(v, 10) || 0;
        setHighScore(n);
        highScoreRef.current = n;
      }
    });
  }, []);

  // ─── Stars (фон, ambient) ──
  const stars = useRef<Star[]>(
    Array.from({ length: STAR_COUNT }).map(() => ({
      x: Math.random() * width,
      y: Math.random() * height,
      baseX: Math.random() * width,
      baseY: Math.random() * height,
      speed: 0.4 + Math.random() * 0.8,
      size: 1 + Math.random() * 2.5,
    }))
  ).current;

  // ─── Engine pulse (idle ambient) ──
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(enginePulse, { toValue: 1, duration: 400, useNativeDriver: false }),
      Animated.timing(enginePulse, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // ─── Touch control ── ship follows finger X position (абсолютная позиция) ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (evt) => {
        if (!isPlayingRef.current) return;
        const x = evt.nativeEvent.pageX;
        moveShipTo(x);
      },
      onPanResponderMove: (evt) => {
        if (!isPlayingRef.current) return;
        const x = evt.nativeEvent.pageX;
        moveShipTo(x);
      },
      onPanResponderRelease: () => {
        Animated.spring(shipTilt, { toValue: 0, useNativeDriver: true }).start();
      },
    })
  ).current;

  function moveShipTo(x: number) {
    const clamped = Math.max(SHIP_HITBOX_W / 2, Math.min(width - SHIP_HITBOX_W / 2, x));
    const dx = clamped - shipXRef.current;
    shipXRef.current = clamped;
    shipX.setValue(clamped);
    // tilt в сторону движения
    const tilt = Math.max(-1, Math.min(1, dx / 20));
    shipTilt.setValue(tilt);
  }

  // ─── Game loop ──
  const tickGameLoop = useCallback(() => {
    if (!isPlayingRef.current) return;

    const now = Date.now();
    const dt  = lastFrameRef.current ? (now - lastFrameRef.current) / 1000 : FRAME_MS / 1000;
    lastFrameRef.current = now;

    const elapsed = (now - startTimeRef.current) / 1000;
    // Difficulty: спавн чаще + падение быстрее со временем
    const difficulty = Math.min(1, elapsed / 60);   // 0..1 за минуту
    const spawnMs    = INITIAL_SPAWN_MS - (INITIAL_SPAWN_MS - MIN_SPAWN_MS) * difficulty;
    const fallMs     = INITIAL_FALL_MS  - (INITIAL_FALL_MS  - MIN_FALL_MS)  * difficulty;

    // Spawn
    if (now - lastSpawnRef.current > spawnMs) {
      lastSpawnRef.current = now;
      spawnAsteroid(fallMs);
    }

    // Update positions + collision
    const shipMinX = shipXRef.current - SHIP_HITBOX_W / 2;
    const shipMaxX = shipXRef.current + SHIP_HITBOX_W / 2;
    const shipMinY = SHIP_Y - SHIP_HITBOX_H / 2;
    const shipMaxY = SHIP_Y + SHIP_HITBOX_H / 2;

    let crashed = false;
    let earnedThisTick = 0;

    for (const a of asteroidsRef.current) {
      a.y += a.vy * dt;

      const aMinX = a.x - a.size / 2;
      const aMaxX = a.x + a.size / 2;
      const aMinY = a.y - a.size / 2;
      const aMaxY = a.y + a.size / 2;

      // Collision check (AABB)
      const overlapX = aMaxX > shipMinX && aMinX < shipMaxX;
      const overlapY = aMaxY > shipMinY && aMinY < shipMaxY;
      if (overlapX && overlapY) {
        if (a.kind === 'gem' && !a.collected) {
          // GEM collected!
          a.collected = true;
          a.scored = true;
          earnedThisTick += GEM_REWARD;
          addFloat(a.x, a.y, GEM_REWARD, '#00C2FF');
          continue;
        }
        if (a.kind === 'rock') {
          crashed = true;
          break;
        }
      }

      // Near-miss: одинаковый Y, близко по X (но не overlap) — только для камней
      if (a.kind === 'rock' && !a.nearMissed) {
        const dy = Math.abs(a.y - SHIP_Y);
        const dx = Math.abs(a.x - shipXRef.current);
        if (dy < NEAR_MISS_DY && dx < NEAR_MISS_DX) {
          a.nearMissed = true;
          triggerNearMiss();
        }
      }

      // Passed below — award points (только rock, не gem)
      if (!a.scored && a.y > height + 50) {
        a.scored = true;
        if (a.kind === 'rock') {
          const baseReward = 5;
          const reward = multActiveRef.current ? baseReward * COMBO_MULT : baseReward;
          earnedThisTick += reward;
          addFloat(a.x, height - 60, reward, multActiveRef.current ? '#FACC15' : '#14F195');
          if (multActiveRef.current) {
            multActiveRef.current = false;
            setMultActive(false);
          }
        }
      }
    }

    // Clean up off-screen
    asteroidsRef.current = asteroidsRef.current.filter(a => a.y < height + 100);

    if (earnedThisTick > 0) {
      setScore(s => {
        const next = s + earnedThisTick;
        if (next > highScoreRef.current) {
          highScoreRef.current = next;
          setHighScore(next);
        }
        return next;
      });
    }

    if (crashed) {
      triggerShake(14);
      endGame();
      return;
    }

    // Trigger re-render for asteroids
    forceRender(n => (n + 1) % 1000000);
  }, []);

  // Game loop interval
  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(tickGameLoop, FRAME_MS);
    return () => clearInterval(id);
  }, [isPlaying, tickGameLoop]);

  // Sync asteroids ref to state (for render)
  useEffect(() => {
    setAsteroids(asteroidsRef.current);
  });

  function spawnAsteroid(fallMs: number) {
    const isGem = Math.random() < GEM_CHANCE;
    const x      = 30 + Math.random() * (width - 60);
    const size   = isGem ? ASTEROID_BASE_SIZE * 0.85 : ASTEROID_BASE_SIZE + Math.random() * 12;
    const vy     = (height + 100) / (fallMs / 1000);
    const ast: Asteroid = {
      id: nextAsteroidId++,
      kind: isGem ? 'gem' : 'rock',
      x, y: -50, vy, size,
      spawnTs: Date.now(),
      nearMissed: false,
      scored: false,
      collected: false,
    };
    asteroidsRef.current = [...asteroidsRef.current, ast];
  }

  function triggerNearMiss() {
    const newCombo = comboRef.current + 1;
    comboRef.current = newCombo;
    setComboCount(newCombo);
    if (newCombo >= COMBO_STREAK_REQ) {
      // Активируем ×2 множитель
      multActiveRef.current = true;
      setMultActive(true);
      comboRef.current = 0;
      setComboCount(0);
      setComboText('⚡ ×2 MULTIPLIER ACTIVE!');
    } else {
      setComboText(`🔥 NEAR MISS! (${newCombo}/${COMBO_STREAK_REQ})`);
    }
    // +ORB бонус за near-miss
    setScore(s => s + 2);
    comboOpacity.setValue(1);
    Animated.timing(comboOpacity, { toValue: 0, duration: 900, useNativeDriver: true }).start();
    triggerShake(4);
  }

  function startGame() {
    nextAsteroidId = 1;
    asteroidsRef.current = [];
    setAsteroids([]);
    setScore(0);
    scoreRef.current = 0;
    comboRef.current = 0;
    setComboCount(0);
    multActiveRef.current = false;
    setMultActive(false);
    startTimeRef.current = Date.now();
    lastSpawnRef.current = Date.now();
    lastFrameRef.current = Date.now();
    shipXRef.current = width / 2;
    shipX.setValue(width / 2);
    isPlayingRef.current = true;
    setIsPlaying(true);
  }

  function endGame() {
    if (!isPlayingRef.current) return;
    isPlayingRef.current = false;
    setIsPlaying(false);

    // Hit flash
    hitFlash.setValue(1);
    Animated.timing(hitFlash, { toValue: 0, duration: 700, useNativeDriver: false }).start();

    // Persist + reward
    setScore(finalScore => {
      if (finalScore > 0) {
        onEarnOrb(finalScore);
        onAddScore(Math.max(1, Math.floor(finalScore / 10)));
      }
      const best = Math.max(finalScore, highScoreRef.current);
      AsyncStorage.setItem(HIGH_SCORE_KEY, String(best)).catch(() => {});
      return finalScore;
    });
  }

  return (
    <Animated.View
      style={[s.container, { transform: [{ translateX: shakeAnim }] }]}
      {...panResponder.panHandlers}
    >
      {/* Hit flash overlay */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
        backgroundColor: '#EF4444',
        opacity: hitFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
        zIndex: 200,
      }]} />

      {/* Stars background */}
      {stars.map((star, i) => (
        <View
          key={`star${i}`}
          style={{
            position: 'absolute',
            left: star.x,
            top:  star.y,
            width: star.size, height: star.size,
            borderRadius: star.size / 2,
            backgroundColor: '#FFF',
            opacity: 0.55,
          }}
        />
      ))}

      {/* FOMO color tint при score > 500 */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={score > 500 ? ['rgba(20,241,149,0.07)', 'transparent'] : ['rgba(124,58,237,0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Asteroids + Gems */}
      {isPlaying && asteroids.map((ast) => {
        if (ast.kind === 'gem') {
          // Gem: glowing cyan diamond
          return (
            <View key={ast.id} style={{
              position: 'absolute',
              left: ast.x - ast.size / 2,
              top:  ast.y - ast.size / 2,
              width: ast.size, height: ast.size,
              alignItems: 'center', justifyContent: 'center',
              zIndex: 11,
            }}>
              <View style={{
                position: 'absolute',
                width: ast.size * 1.4, height: ast.size * 1.4,
                borderRadius: ast.size,
                backgroundColor: '#00C2FF', opacity: 0.25,
              }} />
              <Text style={{
                fontSize: ast.size * 0.92,
                textShadowColor: '#00C2FF', textShadowRadius: 14,
              }}>
                💎
              </Text>
            </View>
          );
        }
        return (
          <Text
            key={ast.id}
            style={{
              position: 'absolute',
              left: ast.x - ast.size / 2,
              top:  ast.y - ast.size / 2,
              fontSize: ast.size,
              textShadowColor: '#F97316',
              textShadowRadius: 8,
              zIndex: 10,
            }}
          >
            {theme.obstacleEmoji}
          </Text>
        );
      })}

      {/* Floating +X numbers */}
      {floats.map(f => (
        <Animated.Text
          key={f.id}
          pointerEvents="none"
          style={{
            position: 'absolute',
            left: f.x - 20,
            top:  f.y,
            color: f.color,
            fontSize: 18, fontWeight: '900',
            zIndex: 50,
            textShadowColor: '#000', textShadowRadius: 4,
            opacity: f.anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [1, 1, 0] }),
            transform: [{ translateY: f.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -50] }) }],
          }}
        >
          +{f.value}
        </Animated.Text>
      ))}

      {/* HUD */}
      <View style={[s.hud, { top: HUD_TOP }]}>
        <View>
          <Text style={s.label}>ORB SCORE</Text>
          <Text style={s.scoreText}>{score}</Text>
        </View>
        <View style={{ alignItems: 'center' }}>
          {multActive && (
            <View style={s.multBadge}>
              <Text style={s.multBadgeTxt}>⚡ ×{COMBO_MULT}</Text>
            </View>
          )}
          {!multActive && comboCount > 0 && (
            <View style={s.comboBadge}>
              <Text style={s.comboBadgeTxt}>🔥 {comboCount}/{COMBO_STREAK_REQ}</Text>
            </View>
          )}
        </View>
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={s.label}>BEST</Text>
          <Text style={s.highScoreText}>🏆 {highScore}</Text>
        </View>
      </View>

      {/* Exit (top-center, under HUD) */}
      <TouchableOpacity
        onPress={() => { if (isPlayingRef.current) endGame(); onExit(); }}
        style={[s.exitBtn, { top: HUD_TOP }]}
        activeOpacity={0.7}
      >
        <Text style={s.exitBtnTxt}>✕</Text>
      </TouchableOpacity>

      {/* Near-Miss popup */}
      <Animated.View style={[s.comboPopup, { opacity: comboOpacity }]}>
        <Text style={s.comboPopupTxt}>{comboText}</Text>
      </Animated.View>

      {/* Ship — custom-drawn from primitives, без emoji */}
      {isPlaying && (
        <Animated.View
          style={[s.shipContainer, {
            left: 0, top: SHIP_Y - SHIP_SIZE / 2,
            transform: [
              { translateX: Animated.subtract(shipX, new Animated.Value(SHIP_SIZE / 2)) },
              { rotate: shipTilt.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] }) },
            ],
          }]}
        >
          <SpaceShip
            size={SHIP_SIZE}
            primary={theme.primary}
            accent={theme.accent}
            enginePulse={enginePulse}
          />
        </Animated.View>
      )}

      {/* MENU / GAME OVER */}
      {!isPlaying && (
        <View style={s.menu}>
          <Text style={s.logo}>{t('runner.title')}</Text>
          <Text style={s.tagline}>{t('runner.tagline')}</Text>

          {score > 0 && (
            <View style={s.resultBox}>
              <Text style={s.resultLbl}>{t('runner.complete')}</Text>
              <Text style={s.resultScore}>{score} ORB</Text>
              {score >= highScore && score > 0 && (
                <Text style={s.newBest}>🏆 NEW BEST!</Text>
              )}
            </View>
          )}

          <TouchableOpacity onPress={startGame} activeOpacity={0.85} style={{ width: '80%', marginTop: 20 }}>
            <LinearGradient colors={theme.gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
              <Text style={s.btnText}>{score > 0 ? t('runner.launchAgain') : t('runner.launch')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          <TouchableOpacity onPress={onExit} activeOpacity={0.7} style={{ marginTop: 14 }}>
            <Text style={s.backBtn}>← BACK TO ARCADE</Text>
          </TouchableOpacity>

          <View style={s.tipsBox}>
            <Text style={s.tipsTitle}>{t('runner.howToPlay')}</Text>
            <Text style={s.tip}>👆  Drag finger to move ship</Text>
            <Text style={s.tip}>{theme.obstacleEmoji}  Dodge falling obstacles · +5 ORB</Text>
            <Text style={s.tip}>💎  Catch gems · +{GEM_REWARD} ORB</Text>
            <Text style={s.tip}>🔥  3 near-misses = ×2 multiplier</Text>
            <Text style={s.tip}>⚡  Difficulty ramps every minute</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Styles ─────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    position: 'absolute',
    zIndex: 50,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#020510',
  },
  hud: {
    position: 'absolute', left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    zIndex: 100,
  },
  label:        { color: '#94A3B8', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  scoreText:    { color: '#FFF', fontSize: 28, fontWeight: '900' },
  highScoreText:{ color: '#FACC15', fontSize: 18, fontWeight: '900' },
  multBadge: {
    backgroundColor: 'rgba(250,204,21,0.2)',
    paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14,
    borderWidth: 1, borderColor: '#FACC15',
  },
  multBadgeTxt: { color: '#FACC15', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  comboBadge: {
    backgroundColor: 'rgba(251,146,60,0.15)',
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(251,146,60,0.5)',
  },
  comboBadgeTxt:{ color: '#FB923C', fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  exitBtn: {
    position: 'absolute', left: '50%', marginLeft: -16,
    marginTop: 50,
    width: 32, height: 32, borderRadius: 16,
    backgroundColor: 'rgba(124,58,237,0.18)',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
    alignItems: 'center', justifyContent: 'center',
    zIndex: 110,
  },
  exitBtnTxt: { color: '#C084FC', fontSize: 14, fontWeight: '900' },

  comboPopup: {
    position: 'absolute',
    top: height * 0.32, alignSelf: 'center',
    backgroundColor: 'rgba(245,158,11,0.25)',
    paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20,
    borderWidth: 1, borderColor: '#FACC15',
    zIndex: 90,
  },
  comboPopupTxt: { color: '#FACC15', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  shipContainer: {
    position: 'absolute',
    width: SHIP_SIZE, height: SHIP_SIZE,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 100,
  },
  ship: { lineHeight: SHIP_SIZE + 4 },
  engineGlow: {
    position: 'absolute',
    bottom: 2,
    width: 12, height: 16, borderRadius: 6,
    shadowRadius: 12, shadowOpacity: 1,
  },

  menu: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    alignItems: 'center', justifyContent: 'center',
    zIndex: 120, padding: 20,
  },
  logo:    { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: 3 },
  tagline: { color: '#7C3AED', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  resultBox: {
    marginTop: 24, alignItems: 'center',
    backgroundColor: 'rgba(20,241,149,0.08)',
    borderWidth: 1, borderColor: 'rgba(20,241,149,0.3)',
    paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18,
  },
  resultLbl:   { color: '#94A3B8', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  resultScore: { color: '#14F195', fontSize: 30, fontWeight: '900', marginTop: 4 },
  newBest:     { color: '#FACC15', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  btn:         { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnText:     { color: '#020510', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  backBtn:     { color: '#475569', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  tipsBox: {
    marginTop: 30, padding: 16, borderRadius: 14,
    backgroundColor: 'rgba(124,58,237,0.08)',
    borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)',
    width: '80%',
  },
  tipsTitle: { color: '#A855F7', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  tip:       { color: '#94A3B8', fontSize: 12, marginVertical: 3 },
});
