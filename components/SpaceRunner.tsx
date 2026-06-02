import React, { useState, useRef, useEffect, useCallback } from 'react';
import { StyleSheet, View, Text, TouchableOpacity, Animated, Dimensions, PanResponder, Alert } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useTheme } from '../lib/theme';
import SpaceShip from './SpaceShip';
import { t, useLang } from '../lib/i18n';

const { width, height } = Dimensions.get('window');

// ─── Constants ───────────────────────────────────────────────────────────────
const HIGH_SCORE_KEY    = 'sk_runner_best';
const GAME_COUNT_KEY    = 'sk_runner_games';
const DAILY_GEM_KEY     = 'sk_runner_daily_gem';

const SHIP_SIZE         = 54;
const SHIP_Y            = Math.round(height * 0.70);
const SHIP_HITBOX_W     = 38;
const SHIP_HITBOX_H     = 38;

const ASTEROID_BASE_SIZE = 36;
const NEAR_MISS_DX      = 70;
const NEAR_MISS_DY      = 50;

const GAME_LOOP_HZ      = 30;
const FRAME_MS          = 1000 / GAME_LOOP_HZ;

const STAR_COUNT        = 35;
const HUD_TOP           = 50;
const COMBO_STREAK_REQ  = 3;
const COMBO_MULT        = 2;

const GEM_CHANCE        = 0.15;
const POWERUP_CHANCE    = 0.07;   // chance per spawn to be a powerup
const GEM_REWARD        = 20;
const DAILY_GEM_GOAL    = 5;
const DAILY_BONUS_ORB   = 500;

const POWERUP_DURATION  = 8000;  // ms
const WAVE_INTERVAL     = 30000; // every 30s
const WAVE_COUNT        = 5;

const INITIAL_SPAWN_MS  = 850;
const MIN_SPAWN_MS      = 300;
const INITIAL_FALL_MS   = 2600;
const MIN_FALL_MS       = 1200;

const CONTINUE_COST     = 200;  // ORB
const DOUBLE_RUN_COST   = 500;  // ORB

// Ship level: every 5 games = +1 level (max 5)
const SHIP_LEVEL_COLORS = ['#7C3AED', '#3B82F6', '#14F195', '#FACC15', '#EC4899'];

// ─── Types ───────────────────────────────────────────────────────────────────
type AsteroidKind    = 'rock' | 'gem' | 'shield' | 'magnet' | 'slow';
type AsteroidVariant = 'normal' | 'fast' | 'zigzag';

type Asteroid = {
  id: number;
  kind: AsteroidKind;
  variant: AsteroidVariant;
  x: number;
  y: number;
  vy: number;
  xv: number;       // zigzag horizontal velocity
  size: number;
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
  label?: string;
  anim: Animated.Value;
};

type Star = { x: number; y: number; speed: number; size: number };

const CONTINUE_SOL_COST      = 0.02;
const CONTINUE_SOL_LAMPORTS  = 2_000_000;  // 0.02 SOL
const CONTINUE_SOL2_COST     = 0.09;
const CONTINUE_SOL2_LAMPORTS = 9_000_000;  // 0.09 SOL

type Props = {
  onExit:      () => void;
  orb:         number;
  onEarnOrb:   (n: number) => void;
  onSpendOrb:  (n: number) => void;
  onAddScore:  (n: number) => void;
  onPaySol:    (lamports: number, sol: number) => Promise<void>;
  onPlaySound: (sound: 'tap' | 'crit' | 'jackpot' | 'levelup') => void;
};

let nextAsteroidId = 1;

// ─── Confetti burst ──────────────────────────────────────────────────────────
const CONFETTI_EMOJIS = ['🎉','⭐','💎','✨','🏆','💜','🌟','🎊'];
function ConfettiBurst() {
  const particles = useRef(
    Array.from({ length: 12 }, (_, i) => ({
      anim: new Animated.Value(0),
      x: width * 0.15 + Math.random() * width * 0.7,
      vy: -(120 + Math.random() * 200),
      vx: (Math.random() - 0.5) * 160,
      emoji: CONFETTI_EMOJIS[i % CONFETTI_EMOJIS.length],
    }))
  ).current;

  useEffect(() => {
    Animated.stagger(60, particles.map(p =>
      Animated.timing(p.anim, { toValue: 1, duration: 1600, useNativeDriver: true })
    )).start();
  }, []);

  return (
    <>
      {particles.map((p, i) => (
        <Animated.Text key={i} pointerEvents="none" style={{
          position: 'absolute',
          left: p.x,
          top: height * 0.4,
          fontSize: 22,
          zIndex: 300,
          opacity: p.anim.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 1, 0] }),
          transform: [
            { translateX: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.vx] }) },
            { translateY: p.anim.interpolate({ inputRange: [0, 1], outputRange: [0, p.vy] }) },
          ],
        }}>
          {p.emoji}
        </Animated.Text>
      ))}
    </>
  );
}

// ─── Component ───────────────────────────────────────────────────────────────
export default function SpaceRunner({ onExit, orb, onEarnOrb, onSpendOrb, onAddScore, onPaySol, onPlaySound }: Props) {
  useLang();
  const theme = useTheme();

  // ── Core game state ──
  const [score,      setScore]      = useState(0);
  const [highScore,  setHighScore]  = useState(0);
  const [isPlaying,  setIsPlaying]  = useState(false);
  const [comboCount, setComboCount] = useState(0);
  const [multActive, setMultActive] = useState(false);
  const [comboText,  setComboText]  = useState('');
  const [asteroids,  setAsteroids]  = useState<Asteroid[]>([]);
  const [, forceRender]             = useState(0);

  // ── Powerup state ──
  const [shieldActive, setShieldActive] = useState(false);
  const [magnetActive, setMagnetActive] = useState(false);
  const [slowActive,   setSlowActive]   = useState(false);
  const shieldRef  = useRef(false);
  const magnetRef  = useRef(false);
  const slowRef    = useRef(false);

  // ── Meta state ──
  const [shipLevel,      setShipLevel]      = useState(1);
  const [doubleRunActive, setDoubleRunActive] = useState(false);
  const [canContinue,    setCanContinue]    = useState(false);  // first continue (ORB)
  const [canContinueSol,  setCanContinueSol]  = useState(false); // second continue (0.02 SOL)
  const [canContinueSol2, setCanContinueSol2] = useState(false); // third continue (0.09 SOL)
  const [usedContinue,    setUsedContinue]    = useState(false); // used ORB continue
  const [usedContinueSol, setUsedContinueSol] = useState(false); // used 0.02 SOL continue
  const [solPending,      setSolPending]      = useState(false); // SOL tx in progress
  const usedContinueSolRef = useRef(false);
  const [dailyGems,      setDailyGems]      = useState(0);
  const [dailyDone,      setDailyDone]      = useState(false);
  const [showConfetti,   setShowConfetti]   = useState(false);
  const doubleRunRef    = useRef(false);
  const usedContinueRef = useRef(false);

  // ── Refs for game loop ──
  const isPlayingRef   = useRef(false);
  const asteroidsRef   = useRef<Asteroid[]>([]);
  const shipXRef       = useRef(width / 2);
  const scoreRef       = useRef(0);
  const comboRef       = useRef(0);
  const multActiveRef  = useRef(false);
  const startTimeRef   = useRef(0);
  const lastSpawnRef   = useRef(0);
  const lastFrameRef   = useRef(0);
  const highScoreRef   = useRef(0);
  const lastWaveRef    = useRef(0);
  const dailyGemsRef   = useRef(0);
  const dailyDoneRef   = useRef(false);

  // ── Animated values ──
  const shipX        = useRef(new Animated.Value(width / 2)).current;
  const shipTilt     = useRef(new Animated.Value(0)).current;
  const comboOpacity = useRef(new Animated.Value(0)).current;
  const hitFlash     = useRef(new Animated.Value(0)).current;
  const enginePulse  = useRef(new Animated.Value(0)).current;
  const shakeAnim    = useRef(new Animated.Value(0)).current;
  const waveFlash    = useRef(new Animated.Value(0)).current;

  // ── Floating numbers ──
  const [floats, setFloats]  = useState<FloatNum[]>([]);
  const floatsRef            = useRef<FloatNum[]>([]);
  const nextFloatId          = useRef(1);

  function addFloat(x: number, y: number, value: number, color: string, label?: string) {
    const anim = new Animated.Value(0);
    const f: FloatNum = { id: nextFloatId.current++, x, y, value, color, anim, label };
    floatsRef.current = [...floatsRef.current, f];
    setFloats([...floatsRef.current]);
    Animated.timing(anim, { toValue: 1, duration: 900, useNativeDriver: true }).start(() => {
      floatsRef.current = floatsRef.current.filter(fl => fl.id !== f.id);
      setFloats([...floatsRef.current]);
    });
  }

  function triggerShake(intensity = 10) {
    shakeAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue:  intensity,       duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -intensity,       duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  intensity * 0.6, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -intensity * 0.3, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue:  0,               duration: 40, useNativeDriver: true }),
    ]).start();
  }

  // ── Sync refs ──
  useEffect(() => { isPlayingRef.current  = isPlaying;   }, [isPlaying]);
  useEffect(() => { scoreRef.current      = score;       }, [score]);
  useEffect(() => { highScoreRef.current  = highScore;   }, [highScore]);
  useEffect(() => { comboRef.current      = comboCount;  }, [comboCount]);
  useEffect(() => { multActiveRef.current = multActive;  }, [multActive]);
  useEffect(() => { shieldRef.current     = shieldActive; }, [shieldActive]);
  useEffect(() => { magnetRef.current     = magnetActive; }, [magnetActive]);
  useEffect(() => { slowRef.current       = slowActive;   }, [slowActive]);
  useEffect(() => { doubleRunRef.current  = doubleRunActive; }, [doubleRunActive]);
  useEffect(() => { usedContinueRef.current = usedContinue; }, [usedContinue]);
  useEffect(() => { dailyGemsRef.current  = dailyGems;   }, [dailyGems]);
  useEffect(() => { dailyDoneRef.current  = dailyDone;   }, [dailyDone]);

  // ── Load persistent data ──
  useEffect(() => {
    AsyncStorage.getItem(HIGH_SCORE_KEY).then(v => {
      const n = parseInt(v ?? '0', 10) || 0;
      setHighScore(n); highScoreRef.current = n;
    });
    AsyncStorage.getItem(GAME_COUNT_KEY).then(v => {
      const games = parseInt(v ?? '0', 10) || 0;
      const lv = Math.min(5, Math.floor(games / 5) + 1);
      setShipLevel(lv);
    });
    // Daily gem progress (reset if date changed)
    AsyncStorage.getItem(DAILY_GEM_KEY).then(v => {
      if (!v) return;
      try {
        const parsed = JSON.parse(v);
        const today = new Date().toDateString();
        if (parsed.date === today) {
          setDailyGems(parsed.count);
          dailyGemsRef.current = parsed.count;
          if (parsed.count >= DAILY_GEM_GOAL) {
            setDailyDone(true); dailyDoneRef.current = true;
          }
        }
      } catch { /* ignore */ }
    });
  }, []);

  // ── Stars ──
  const stars = useRef<Star[]>(
    Array.from({ length: STAR_COUNT }).map(() => ({
      x: Math.random() * width, y: Math.random() * height,
      speed: 0.4 + Math.random() * 0.8, size: 1 + Math.random() * 2.5,
    }))
  ).current;

  // ── Engine pulse ──
  useEffect(() => {
    const loop = Animated.loop(Animated.sequence([
      Animated.timing(enginePulse, { toValue: 1, duration: 400, useNativeDriver: false }),
      Animated.timing(enginePulse, { toValue: 0, duration: 400, useNativeDriver: false }),
    ]));
    loop.start();
    return () => loop.stop();
  }, []);

  // ── Touch control ──
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder:  () => true,
      onPanResponderGrant: (evt) => {
        if (!isPlayingRef.current) return;
        moveShipTo(evt.nativeEvent.pageX);
      },
      onPanResponderMove: (evt) => {
        if (!isPlayingRef.current) return;
        moveShipTo(evt.nativeEvent.pageX);
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
    const tilt = Math.max(-1, Math.min(1, dx / 20));
    shipTilt.setValue(tilt);
  }

  // ── Spawn helpers ──
  function spawnAsteroid(fallMs: number) {
    const roll = Math.random();
    let kind: AsteroidKind;
    if (roll < POWERUP_CHANCE) {
      const r2 = Math.random();
      kind = r2 < 0.33 ? 'shield' : r2 < 0.66 ? 'magnet' : 'slow';
    } else if (roll < POWERUP_CHANCE + GEM_CHANCE) {
      kind = 'gem';
    } else {
      kind = 'rock';
    }

    const varRoll = Math.random();
    let variant: AsteroidVariant = 'normal';
    let size = ASTEROID_BASE_SIZE + Math.random() * 12;
    let vy   = (height + 100) / (fallMs / 1000);
    let xv   = 0;

    if (kind === 'rock') {
      if (varRoll < 0.25) {
        variant = 'fast';
        size    = ASTEROID_BASE_SIZE * 0.65;
        vy     *= 1.9;
      } else if (varRoll < 0.45) {
        variant = 'zigzag';
        xv      = (Math.random() > 0.5 ? 1 : -1) * (80 + Math.random() * 60);
      }
    } else {
      size = kind === 'gem' ? ASTEROID_BASE_SIZE * 0.85 : ASTEROID_BASE_SIZE * 0.9;
    }

    const ast: Asteroid = {
      id: nextAsteroidId++,
      kind, variant,
      x: 30 + Math.random() * (width - 60),
      y: -50, vy, xv, size,
      spawnTs: Date.now(),
      nearMissed: false, scored: false, collected: false,
    };
    asteroidsRef.current = [...asteroidsRef.current, ast];
  }

  function spawnWave(fallMs: number) {
    for (let i = 0; i < WAVE_COUNT; i++) {
      setTimeout(() => {
        if (!isPlayingRef.current) return;
        const ast: Asteroid = {
          id: nextAsteroidId++, kind: 'rock', variant: 'normal',
          x: (width / (WAVE_COUNT + 1)) * (i + 1),
          y: -50 - i * 30,
          vy: (height + 100) / (fallMs / 1000),
          xv: 0, size: ASTEROID_BASE_SIZE,
          spawnTs: Date.now(),
          nearMissed: false, scored: false, collected: false,
        };
        asteroidsRef.current = [...asteroidsRef.current, ast];
      }, i * 120);
    }
    // Flash effect
    waveFlash.setValue(1);
    Animated.timing(waveFlash, { toValue: 0, duration: 600, useNativeDriver: false }).start();
    // Popup
    setComboText(t('runner.wave'));
    comboOpacity.setValue(1);
    Animated.timing(comboOpacity, { toValue: 0, duration: 1400, useNativeDriver: true }).start();
  }

  function activatePowerup(kind: 'shield' | 'magnet' | 'slow') {
    if (kind === 'shield') {
      shieldRef.current = true; setShieldActive(true);
      addFloat(width / 2, SHIP_Y - 60, 0, '#14F195', '🛡');
      setComboText(t('runner.powerupShield'));
      comboOpacity.setValue(1);
      Animated.timing(comboOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }).start();
    } else if (kind === 'magnet') {
      magnetRef.current = true; setMagnetActive(true);
      addFloat(width / 2, SHIP_Y - 60, 0, '#00C2FF', '🧲');
      setComboText(t('runner.powerupMagnet'));
      comboOpacity.setValue(1);
      Animated.timing(comboOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }).start();
      setTimeout(() => { magnetRef.current = false; setMagnetActive(false); }, POWERUP_DURATION);
    } else {
      slowRef.current = true; setSlowActive(true);
      addFloat(width / 2, SHIP_Y - 60, 0, '#FACC15', '⏳');
      setComboText(t('runner.powerupSlow'));
      comboOpacity.setValue(1);
      Animated.timing(comboOpacity, { toValue: 0, duration: 1200, useNativeDriver: true }).start();
      setTimeout(() => { slowRef.current = false; setSlowActive(false); }, POWERUP_DURATION);
    }
  }

  function triggerNearMiss() {
    const newCombo = comboRef.current + 1;
    comboRef.current = newCombo;
    setComboCount(newCombo);
    if (newCombo >= COMBO_STREAK_REQ) {
      multActiveRef.current = true; setMultActive(true);
      comboRef.current = 0; setComboCount(0);
      setComboText(t('runner.multActive'));
    } else {
      setComboText(t('runner.nearMiss', { cur: newCombo, req: COMBO_STREAK_REQ }));
    }
    setScore(s => s + 2);
    comboOpacity.setValue(1);
    Animated.timing(comboOpacity, { toValue: 0, duration: 900, useNativeDriver: true }).start();
    triggerShake(4);
  }

  // ── Game loop ──
  const tickGameLoop = useCallback(() => {
    if (!isPlayingRef.current) return;

    const now = Date.now();
    const dt  = lastFrameRef.current ? (now - lastFrameRef.current) / 1000 : FRAME_MS / 1000;
    lastFrameRef.current = now;

    const elapsed    = (now - startTimeRef.current) / 1000;
    const difficulty = Math.min(1, elapsed / 60);
    const spawnMs    = INITIAL_SPAWN_MS - (INITIAL_SPAWN_MS - MIN_SPAWN_MS) * difficulty;
    const fallMs     = INITIAL_FALL_MS  - (INITIAL_FALL_MS  - MIN_FALL_MS)  * difficulty;
    const slowFactor = slowRef.current ? 0.45 : 1;

    // Spawn regular
    if (now - lastSpawnRef.current > spawnMs) {
      lastSpawnRef.current = now;
      spawnAsteroid(fallMs);
    }

    // Wave every 30s
    if (elapsed > 5 && now - lastWaveRef.current > WAVE_INTERVAL) {
      lastWaveRef.current = now;
      spawnWave(fallMs);
    }

    const shipMinX = shipXRef.current - SHIP_HITBOX_W / 2;
    const shipMaxX = shipXRef.current + SHIP_HITBOX_W / 2;
    const shipMinY = SHIP_Y - SHIP_HITBOX_H / 2;
    const shipMaxY = SHIP_Y + SHIP_HITBOX_H / 2;

    let crashed = false;
    let earnedThisTick = 0;

    for (const a of asteroidsRef.current) {
      if (a.collected) continue;

      // Magnet: attract gems toward ship X
      if (magnetRef.current && a.kind === 'gem') {
        const dx = shipXRef.current - a.x;
        a.x += dx * 0.12;
      }

      // Zigzag X movement
      if (a.variant === 'zigzag') {
        a.x += a.xv * dt;
        if (a.x < 20 || a.x > width - 20) a.xv *= -1;
      }

      a.y += a.vy * slowFactor * dt;

      const aMinX = a.x - a.size / 2;
      const aMaxX = a.x + a.size / 2;
      const aMinY = a.y - a.size / 2;
      const aMaxY = a.y + a.size / 2;

      const overlapX = aMaxX > shipMinX && aMinX < shipMaxX;
      const overlapY = aMaxY > shipMinY && aMinY < shipMaxY;

      if (overlapX && overlapY) {
        if (a.kind === 'gem') {
          a.collected = true; a.scored = true;
          const reward = doubleRunRef.current ? GEM_REWARD * 2 : GEM_REWARD;
          earnedThisTick += reward;
          addFloat(a.x, a.y, reward, '#00C2FF');
          onPlaySound('crit');
          // Daily gem tracking
          if (!dailyDoneRef.current) {
            const next = dailyGemsRef.current + 1;
            dailyGemsRef.current = next;
            setDailyGems(next);
            if (next >= DAILY_GEM_GOAL) {
              dailyDoneRef.current = true; setDailyDone(true);
              earnedThisTick += DAILY_BONUS_ORB;
              addFloat(width / 2, SHIP_Y - 80, DAILY_BONUS_ORB, '#EC4899', '✅ +' + DAILY_BONUS_ORB);
              onPlaySound('jackpot');
              setShowConfetti(true);
              setTimeout(() => setShowConfetti(false), 2000);
            }
            const today = new Date().toDateString();
            AsyncStorage.setItem(DAILY_GEM_KEY, JSON.stringify({ date: today, count: next })).catch(() => {});
          }
          continue;
        }
        if (a.kind === 'shield' || a.kind === 'magnet' || a.kind === 'slow') {
          a.collected = true; a.scored = true;
          activatePowerup(a.kind);
          onPlaySound('levelup');
          continue;
        }
        if (a.kind === 'rock') {
          if (shieldRef.current) {
            // Shield absorbs one hit
            shieldRef.current = false; setShieldActive(false);
            a.collected = true; a.scored = true;
            triggerShake(6);
            addFloat(a.x, a.y, 0, '#14F195', '🛡 BLOCKED!');
            continue;
          }
          crashed = true;
          break;
        }
      }

      // Near-miss (rock only)
      if (a.kind === 'rock' && !a.nearMissed) {
        const dy = Math.abs(a.y - SHIP_Y);
        const dx = Math.abs(a.x - shipXRef.current);
        if (dy < NEAR_MISS_DY && dx < NEAR_MISS_DX) {
          a.nearMissed = true;
          triggerNearMiss();
          onPlaySound('tap');
        }
      }

      // Passed below
      if (!a.scored && a.y > height + 50) {
        a.scored = true;
        if (a.kind === 'rock') {
          const base   = a.variant === 'fast' ? 8 : 5;
          const reward = (multActiveRef.current ? base * COMBO_MULT : base) * (doubleRunRef.current ? 2 : 1);
          earnedThisTick += reward;
          addFloat(a.x, height - 60, reward, multActiveRef.current ? '#FACC15' : '#14F195');
          if (multActiveRef.current) { multActiveRef.current = false; setMultActive(false); }
        }
      }
    }

    asteroidsRef.current = asteroidsRef.current.filter(a => a.y < height + 100 && !a.collected);

    if (earnedThisTick > 0) {
      setScore(s => {
        const next = s + earnedThisTick;
        if (next > highScoreRef.current) {
          highScoreRef.current = next; setHighScore(next);
        }
        return next;
      });
    }

    if (crashed) {
      triggerShake(14);
      onPlaySound('jackpot');
      endGame();
      return;
    }

    forceRender(n => (n + 1) % 1000000);
  }, []);

  useEffect(() => {
    if (!isPlaying) return;
    const id = setInterval(tickGameLoop, FRAME_MS);
    return () => clearInterval(id);
  }, [isPlaying, tickGameLoop]);

  useEffect(() => () => {
    if (isPlayingRef.current && scoreRef.current > highScoreRef.current) {
      AsyncStorage.setItem(HIGH_SCORE_KEY, String(scoreRef.current)).catch(() => {});
    }
  }, []);

  useEffect(() => { setAsteroids(asteroidsRef.current); });

  // ── startGame / endGame ──
  function startGame(keepScore = false) {
    nextAsteroidId = 1;
    asteroidsRef.current = [];
    setAsteroids([]);
    if (!keepScore) { setScore(0); scoreRef.current = 0; }
    comboRef.current = 0; setComboCount(0);
    multActiveRef.current = false; setMultActive(false);
    shieldRef.current = false;  setShieldActive(false);
    magnetRef.current = false;  setMagnetActive(false);
    slowRef.current   = false;  setSlowActive(false);
    startTimeRef.current  = Date.now();
    lastSpawnRef.current  = Date.now();
    lastFrameRef.current  = Date.now();
    lastWaveRef.current   = Date.now();
    shipXRef.current = width / 2;
    shipX.setValue(width / 2);
    isPlayingRef.current = true;
    setIsPlaying(true);
    setCanContinue(false);
  }

  function endGame() {
    if (!isPlayingRef.current) return;
    isPlayingRef.current = false;
    setIsPlaying(false);

    hitFlash.setValue(1);
    Animated.timing(hitFlash, { toValue: 0, duration: 700, useNativeDriver: false }).start();

    // Increment game count → ship level
    AsyncStorage.getItem(GAME_COUNT_KEY).then(v => {
      const games = (parseInt(v ?? '0', 10) || 0) + 1;
      AsyncStorage.setItem(GAME_COUNT_KEY, String(games)).catch(() => {});
      setShipLevel(Math.min(5, Math.floor(games / 5) + 1));
    });

    setScore(finalScore => {
      if (finalScore > 0) {
        onEarnOrb(finalScore);
        onAddScore(Math.max(1, Math.floor(finalScore / 10)));
      }
      const best = Math.max(finalScore, highScoreRef.current);
      AsyncStorage.setItem(HIGH_SCORE_KEY, String(best)).catch(() => {});
      return finalScore;
    });

    if (!usedContinueRef.current) {
      setCanContinue(true);
    } else if (!usedContinueSolRef.current) {
      setCanContinueSol(true);
    } else {
      setCanContinueSol2(true);
    }
  }

  function handleContinue() {
    if (orb < CONTINUE_COST) {
      Alert.alert(t('runner.notEnoughOrb'), `Need ${CONTINUE_COST} ORB`);
      return;
    }
    onSpendOrb(CONTINUE_COST);
    setUsedContinue(true);
    usedContinueRef.current = true;
    setCanContinue(false);
    setCanContinueSol(false);
    setCanContinueSol2(false);
    shieldRef.current = true; setShieldActive(true);
    startGame(true);
  }

  async function handleContinueSol() {
    setSolPending(true);
    try {
      await onPaySol(CONTINUE_SOL_LAMPORTS, CONTINUE_SOL_COST);
      setUsedContinueSol(true);
      usedContinueSolRef.current = true;
      setCanContinueSol(false);
      shieldRef.current = true; setShieldActive(true);
      startGame(true);
    } catch (e: any) {
      Alert.alert('Payment failed', e?.message ?? 'SOL transaction failed');
    } finally {
      setSolPending(false);
    }
  }

  async function handleContinueSol2() {
    setSolPending(true);
    try {
      await onPaySol(CONTINUE_SOL2_LAMPORTS, CONTINUE_SOL2_COST);
      setCanContinueSol2(false);
      shieldRef.current = true; setShieldActive(true);
      startGame(true);
    } catch (e: any) {
      Alert.alert('Payment failed', e?.message ?? 'SOL transaction failed');
    } finally {
      setSolPending(false);
    }
  }

  function handleDoubleRun() {
    if (orb < DOUBLE_RUN_COST) {
      Alert.alert(t('runner.notEnoughOrb'), `Need ${DOUBLE_RUN_COST} ORB`);
      return;
    }
    onSpendOrb(DOUBLE_RUN_COST);
    setDoubleRunActive(true);
    doubleRunRef.current = true;
    startGame();
  }

  // ── Emoji helpers ──
  function powerupEmoji(kind: AsteroidKind) {
    if (kind === 'shield') return '🛡';
    if (kind === 'magnet') return '🧲';
    return '⏳';
  }

  const shipColor = SHIP_LEVEL_COLORS[shipLevel - 1] ?? '#7C3AED';

  return (
    <Animated.View
      style={[s.container, { transform: [{ translateX: shakeAnim }] }]}
      {...panResponder.panHandlers}
    >
      {/* Hit flash */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
        backgroundColor: '#EF4444',
        opacity: hitFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.5] }),
        zIndex: 200,
      }]} />

      {/* Wave flash */}
      <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, {
        backgroundColor: '#FACC15',
        opacity: waveFlash.interpolate({ inputRange: [0, 1], outputRange: [0, 0.18] }),
        zIndex: 199,
      }]} />

      {/* Stars */}
      {stars.map((star, i) => (
        <View key={`star${i}`} style={{
          position: 'absolute', left: star.x, top: star.y,
          width: star.size, height: star.size, borderRadius: star.size / 2,
          backgroundColor: '#FFF', opacity: 0.55,
        }} />
      ))}

      {/* Background gradient */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <LinearGradient
          colors={score > 500 ? ['rgba(20,241,149,0.07)', 'transparent'] : ['rgba(124,58,237,0.08)', 'transparent']}
          style={StyleSheet.absoluteFill}
        />
      </View>

      {/* Asteroids + Gems + Powerups */}
      {isPlaying && asteroids.map(ast => {
        if (ast.collected) return null;

        if (ast.kind === 'gem') return (
          <View key={ast.id} style={{ position: 'absolute', left: ast.x - ast.size / 2, top: ast.y - ast.size / 2, width: ast.size, height: ast.size, alignItems: 'center', justifyContent: 'center', zIndex: 11 }}>
            <View style={{ position: 'absolute', width: ast.size * 1.4, height: ast.size * 1.4, borderRadius: ast.size, backgroundColor: '#00C2FF', opacity: 0.25 }} />
            <Text style={{ fontSize: ast.size * 0.92, textShadowColor: '#00C2FF', textShadowRadius: 14 }}>💎</Text>
          </View>
        );

        if (ast.kind === 'shield' || ast.kind === 'magnet' || ast.kind === 'slow') return (
          <View key={ast.id} style={{ position: 'absolute', left: ast.x - ast.size / 2, top: ast.y - ast.size / 2, width: ast.size, height: ast.size, alignItems: 'center', justifyContent: 'center', zIndex: 12 }}>
            <View style={{ position: 'absolute', width: ast.size * 1.5, height: ast.size * 1.5, borderRadius: ast.size, backgroundColor: ast.kind === 'shield' ? '#14F195' : ast.kind === 'magnet' ? '#00C2FF' : '#FACC15', opacity: 0.3 }} />
            <Text style={{ fontSize: ast.size * 0.88 }}>{powerupEmoji(ast.kind)}</Text>
          </View>
        );

        // Rock — normal, fast, zigzag
        const emoji = ast.variant === 'fast' ? '💫' : ast.variant === 'zigzag' ? '🌀' : theme.obstacleEmoji;
        return (
          <Text key={ast.id} style={{
            position: 'absolute',
            left: ast.x - ast.size / 2, top: ast.y - ast.size / 2,
            fontSize: ast.size,
            textShadowColor: ast.variant === 'fast' ? '#EF4444' : '#F97316',
            textShadowRadius: 8, zIndex: 10,
          }}>
            {emoji}
          </Text>
        );
      })}

      {/* Floating +X labels */}
      {floats.map(f => (
        <Animated.Text key={f.id} pointerEvents="none" style={{
          position: 'absolute', left: f.x - 30, top: f.y,
          color: f.color, fontSize: f.label ? 14 : 18, fontWeight: '900', zIndex: 50,
          textShadowColor: '#000', textShadowRadius: 4,
          opacity: f.anim.interpolate({ inputRange: [0, 0.2, 1], outputRange: [1, 1, 0] }),
          transform: [{ translateY: f.anim.interpolate({ inputRange: [0, 1], outputRange: [0, -55] }) }],
        }}>
          {f.label ?? `+${f.value}`}
        </Animated.Text>
      ))}

      {/* HUD */}
      {isPlaying && (
        <View style={[s.hud, { top: HUD_TOP }]}>
          <View>
            <Text style={s.label}>ORB SCORE</Text>
            <Text style={s.scoreText}>{score}</Text>
            {/* Daily gem progress */}
            {!dailyDone && (
              <Text style={s.dailyTxt}>{t('runner.dailyProgress', { n: dailyGems })}</Text>
            )}
            {dailyDone && (
              <Text style={[s.dailyTxt, { color: '#14F195' }]}>{t('runner.dailyDone')}</Text>
            )}
          </View>

          <View style={{ alignItems: 'center', gap: 4 }}>
            {/* Combo / mult */}
            {multActive && (
              <View style={s.multBadge}><Text style={s.multBadgeTxt}>⚡ ×{COMBO_MULT}</Text></View>
            )}
            {!multActive && comboCount > 0 && (
              <View style={s.comboBadge}><Text style={s.comboBadgeTxt}>🔥 {comboCount}/{COMBO_STREAK_REQ}</Text></View>
            )}
            {/* Powerup indicators */}
            <View style={{ flexDirection: 'row', gap: 4 }}>
              {shieldActive  && <View style={s.powerBadge}><Text style={s.powerBadgeTxt}>🛡</Text></View>}
              {magnetActive  && <View style={s.powerBadge}><Text style={s.powerBadgeTxt}>🧲</Text></View>}
              {slowActive    && <View style={s.powerBadge}><Text style={s.powerBadgeTxt}>⏳</Text></View>}
              {doubleRunActive && <View style={[s.powerBadge, { borderColor: '#EC4899' }]}><Text style={s.powerBadgeTxt}>×2</Text></View>}
            </View>
          </View>

          <View style={{ alignItems: 'flex-end' }}>
            <Text style={s.label}>BEST</Text>
            <Text style={s.highScoreText}>🏆 {highScore}</Text>
            <Text style={[s.label, { color: shipColor, marginTop: 2 }]}>{t('runner.shipLv', { n: shipLevel })}</Text>
          </View>
        </View>
      )}

      {/* Near-miss / powerup popup */}
      <Animated.View style={[s.comboPopup, { opacity: comboOpacity }]}>
        <Text style={s.comboPopupTxt}>{comboText}</Text>
      </Animated.View>

      {/* Ship */}
      {isPlaying && (
        <Animated.View style={[s.shipContainer, {
          left: 0, top: SHIP_Y - SHIP_SIZE / 2,
          transform: [
            { translateX: Animated.subtract(shipX, new Animated.Value(SHIP_SIZE / 2)) },
            { rotate: shipTilt.interpolate({ inputRange: [-1, 1], outputRange: ['-20deg', '20deg'] }) },
          ],
        }]}>
          {/* Shield glow ring */}
          {shieldActive && (
            <View style={{
              position: 'absolute', width: SHIP_SIZE + 20, height: SHIP_SIZE + 20,
              borderRadius: (SHIP_SIZE + 20) / 2, borderWidth: 2, borderColor: '#14F195',
              top: -10, left: -10, opacity: 0.7,
            }} />
          )}
          <SpaceShip
            size={SHIP_SIZE}
            primary={shipColor}
            accent={theme.accent}
            enginePulse={enginePulse}
          />
        </Animated.View>
      )}

      {/* Confetti — daily challenge complete */}
      {showConfetti && <ConfettiBurst />}

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
                <Text style={s.newBest}>{t('runner.newBest')}</Text>
              )}
            </View>
          )}

          {/* Continue #1 — ORB (first death) */}
          {canContinue && score > 0 && (
            <TouchableOpacity onPress={handleContinue} activeOpacity={0.85} style={{ width: '80%', marginTop: 16 }}>
              <LinearGradient colors={['#14F195', '#00C2FF']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                <Text style={s.btnText}>{t('runner.continue', { orb: CONTINUE_COST })}</Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Continue #2 — 0.02 SOL (second death) */}
          {canContinueSol && score > 0 && (
            <TouchableOpacity onPress={handleContinueSol} activeOpacity={0.85} disabled={solPending} style={{ width: '80%', marginTop: 16 }}>
              <LinearGradient colors={['#9945FF', '#14F195']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                <Text style={s.btnText}>
                  {solPending ? '⏳ PROCESSING...' : `⚡ CONTINUE · ${CONTINUE_SOL_COST} SOL`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Continue #3 — 0.09 SOL (third death) */}
          {canContinueSol2 && score > 0 && (
            <TouchableOpacity onPress={handleContinueSol2} activeOpacity={0.85} disabled={solPending} style={{ width: '80%', marginTop: 16 }}>
              <LinearGradient colors={['#EC4899', '#FACC15']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
                <Text style={s.btnText}>
                  {solPending ? '⏳ PROCESSING...' : `💎 CONTINUE · ${CONTINUE_SOL2_COST} SOL`}
                </Text>
              </LinearGradient>
            </TouchableOpacity>
          )}

          {/* Launch / Launch Again */}
          <TouchableOpacity onPress={() => startGame()} activeOpacity={0.85} style={{ width: '80%', marginTop: canContinue && score > 0 ? 8 : 20 }}>
            <LinearGradient colors={theme.gradientColors} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.btn}>
              <Text style={s.btnText}>{score > 0 ? t('runner.launchAgain') : t('runner.launch')}</Text>
            </LinearGradient>
          </TouchableOpacity>

          {/* ×2 ORB Run */}
          {!doubleRunActive && (
            <TouchableOpacity onPress={handleDoubleRun} activeOpacity={0.85} style={{ width: '80%', marginTop: 8 }}>
              <View style={s.doubleRunBtn}>
                <Text style={s.doubleRunTxt}>{t('runner.doubleRun', { orb: DOUBLE_RUN_COST })}</Text>
              </View>
            </TouchableOpacity>
          )}

          <TouchableOpacity onPress={onExit} activeOpacity={0.7} style={{ marginTop: 14 }}>
            <Text style={s.backBtn}>{t('runner.backToArcade')}</Text>
          </TouchableOpacity>

          <View style={s.tipsBox}>
            <Text style={s.tipsTitle}>{t('runner.howToPlay')}</Text>
            <Text style={s.tip}>{t('runner.tip1')}</Text>
            <Text style={s.tip}>{t('runner.tip2', { emoji: theme.obstacleEmoji })}</Text>
            <Text style={s.tip}>{t('runner.tip3', { n: GEM_REWARD })}</Text>
            <Text style={s.tip}>{t('runner.tip4')}</Text>
            <Text style={s.tip}>{t('runner.tip5')}</Text>
            <Text style={s.tip}>{t('runner.tip6')}</Text>
          </View>
        </View>
      )}
    </Animated.View>
  );
}

// ─── Styles ──────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  container: {
    position: 'absolute', zIndex: 50,
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: '#020510',
  },
  hud: {
    position: 'absolute', left: 20, right: 20,
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    zIndex: 100,
  },
  label:         { color: '#94A3B8', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  scoreText:     { color: '#FFF', fontSize: 28, fontWeight: '900' },
  highScoreText: { color: '#FACC15', fontSize: 18, fontWeight: '900' },
  dailyTxt:      { color: '#EC4899', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 2 },

  multBadge:    { backgroundColor: 'rgba(250,204,21,0.2)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 14, borderWidth: 1, borderColor: '#FACC15' },
  multBadgeTxt: { color: '#FACC15', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  comboBadge:   { backgroundColor: 'rgba(251,146,60,0.15)', paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: 'rgba(251,146,60,0.5)' },
  comboBadgeTxt:{ color: '#FB923C', fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  powerBadge:   { backgroundColor: 'rgba(20,241,149,0.15)', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10, borderWidth: 1, borderColor: 'rgba(20,241,149,0.5)' },
  powerBadgeTxt:{ fontSize: 12 },

  comboPopup:    { position: 'absolute', top: height * 0.32, alignSelf: 'center', backgroundColor: 'rgba(245,158,11,0.25)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: '#FACC15', zIndex: 90 },
  comboPopupTxt: { color: '#FACC15', fontWeight: '900', fontSize: 14, letterSpacing: 1 },

  shipContainer: { position: 'absolute', width: SHIP_SIZE, height: SHIP_SIZE, alignItems: 'center', justifyContent: 'center', zIndex: 100 },

  menu:      { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, alignItems: 'center', justifyContent: 'center', zIndex: 120, padding: 20 },
  logo:      { color: '#FFF', fontSize: 32, fontWeight: '900', letterSpacing: 3 },
  tagline:   { color: '#7C3AED', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginTop: 4 },
  resultBox: { marginTop: 24, alignItems: 'center', backgroundColor: 'rgba(20,241,149,0.08)', borderWidth: 1, borderColor: 'rgba(20,241,149,0.3)', paddingHorizontal: 28, paddingVertical: 14, borderRadius: 18 },
  resultLbl: { color: '#94A3B8', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  resultScore:{ color: '#14F195', fontSize: 30, fontWeight: '900', marginTop: 4 },
  newBest:   { color: '#FACC15', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 6 },
  btn:       { paddingVertical: 16, borderRadius: 16, alignItems: 'center' },
  btnText:   { color: '#020510', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  backBtn:   { color: '#475569', fontSize: 11, fontWeight: '800', letterSpacing: 2 },

  doubleRunBtn: { paddingVertical: 13, borderRadius: 16, alignItems: 'center', borderWidth: 1.5, borderColor: '#EC4899', backgroundColor: 'rgba(236,72,153,0.1)' },
  doubleRunTxt: { color: '#EC4899', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  tipsBox:   { marginTop: 20, padding: 16, borderRadius: 14, backgroundColor: 'rgba(124,58,237,0.08)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.2)', width: '80%' },
  tipsTitle: { color: '#A855F7', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 8, textAlign: 'center' },
  tip:       { color: '#94A3B8', fontSize: 12, marginVertical: 3 },
});
