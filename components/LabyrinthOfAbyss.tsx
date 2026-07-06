/**
 * ABYSS LABYRINTH — real-3D dungeon crawler (expo-gl + react-three-fiber).
 *
 * Ported from the AI-Studio web prototype: procedural maze over a bottomless
 * abyss, sword combat, dash i-frames, traps, exploding barrels, loot and an
 * exit portal. Differences from the web build (RN constraints):
 *  - Rapier physics (WASM) replaced with grid push-out (lib/labyrinth.ts)
 *  - Bloom/postprocessing replaced with emissive materials + fog + torch light
 *  - drei/Html HUD replaced with an RN overlay (joystick, buttons, bars)
 *
 * All world mutation happens inside useFrame via refs — React state is only
 * touched on sparse gameplay events (damage, pickup, kill, phase change).
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Animated, PanResponder, StyleSheet, Text, TouchableOpacity, View,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Canvas, useFrame } from '@react-three/fiber/native';
import * as THREE from 'three';
import * as L from '../lib/labyrinth';

// ── shared input / fx bridges (RN overlay <-> GL loop) ───────────────────────
type InputState = { jx: number; jz: number; attack: boolean; dash: boolean };

type LoopEvents = {
  setHp: (hp: number) => void;
  setCollected: (n: number) => void;
  setRunOrb: (n: number) => void;
  setMsg: (m: string) => void;
  onHitFlash: () => void;
  onEnd: (won: boolean) => void;
  playSound: (s: 'tap' | 'crit' | 'jackpot' | 'levelup' | 'dead') => void;
  earnOrb: (n: number) => void;
};

type Phase = 'menu' | 'playing' | 'dead' | 'won';

const BEST_KEY = 'sk_labyrinth_best';

// ── 3D world ──────────────────────────────────────────────────────────────────
function GameWorld({
  runRef, inputRef, phaseRef, events,
}: {
  runRef: React.MutableRefObject<L.RunState | null>;
  inputRef: React.MutableRefObject<InputState>;
  phaseRef: React.MutableRefObject<Phase>;
  events: React.MutableRefObject<LoopEvents>;
}) {
  const run = runRef.current!;

  const playerRef  = useRef<THREE.Group>(null);
  const swordRef   = useRef<THREE.Group>(null);
  const torchRef   = useRef<THREE.PointLight>(null);
  const wallsRef   = useRef<THREE.InstancedMesh>(null);
  const portalRef  = useRef<THREE.Group>(null);
  const monsterRefs = useRef<(THREE.Group | null)[]>([]);
  const monsterMats = useRef<(THREE.MeshStandardMaterial | null)[]>([]);
  const itemRefs    = useRef<(THREE.Mesh | null)[]>([]);
  const trapRefs    = useRef<(THREE.Mesh | null)[]>([]);
  const barrelRefs  = useRef<(THREE.Mesh | null)[]>([]);

  const walls = useMemo(
    () => L.collectWallCells(run.grid, run.gridW, run.gridH),
    [run],
  );

  // Place wall instances once
  useEffect(() => {
    const mesh = wallsRef.current;
    if (!mesh) return;
    const m = new THREE.Matrix4();
    walls.forEach((w, i) => {
      m.setPosition(w.x, L.WALL_HEIGHT / 2, w.z);
      mesh.setMatrixAt(i, m);
    });
    mesh.instanceMatrix.needsUpdate = true;
  }, [walls]);

  useFrame(({ camera }, rawDelta) => {
    const r = runRef.current;
    if (!r || phaseRef.current !== 'playing') return;
    const dt = Math.min(rawDelta, 0.05);
    const ev = events.current;
    const inp = inputRef.current;
    const p = r.player;
    r.clock += dt;

    // ── timers ──
    if (p.attackCooldown > 0) p.attackCooldown -= dt;
    if (p.dashCooldown  > 0) p.dashCooldown  -= dt;
    if (p.dashTime > 0) { p.dashTime -= dt; if (p.dashTime <= 0) p.isDashing = false; }

    // ── movement ──
    let dx = inp.jx, dz = inp.jz;
    const len = Math.sqrt(dx * dx + dz * dz);
    if (len > 1) { dx /= len; dz /= len; }

    if (inp.dash && p.dashCooldown <= 0 && len > 0.15) {
      p.isDashing = true;
      p.dashTime = L.DASH_TIME;
      p.dashCooldown = L.DASH_COOLDOWN;
      ev.playSound('tap');
    }
    inp.dash = false;

    const speed = p.isDashing ? L.DASH_SPEED : L.PLAYER_SPEED;
    if (len > 0.15 || p.isDashing) {
      // While dashing keep the last facing direction
      const mx = p.isDashing ? p.dir.x : dx;
      const mz = p.isDashing ? p.dir.z : dz;
      let next = { x: p.pos.x + mx * speed * dt, z: p.pos.z + mz * speed * dt };
      next = L.resolveWallCollision(r.grid, r.gridW, r.gridH, next, L.PLAYER_RADIUS);
      p.pos = L.clampToBounds(next, r.gridW, r.gridH);
      if (len > 0.15) {
        const inv = 1 / (Math.sqrt(dx * dx + dz * dz) || 1);
        p.dir = { x: dx * inv, z: dz * inv };
      }
    }

    // ── attack ──
    if (inp.attack) {
      inp.attack = false;
      if (p.attackCooldown <= 0) {
        p.attackCooldown = L.ATTACK_COOLDOWN;
        let hit = false;

        // Barrels: chain-explode into monsters and the player
        for (const b of r.barrels) {
          if (b.exploded || L.dist(b.pos, p.pos) > L.ATTACK_RANGE) continue;
          const tb = { x: b.pos.x - p.pos.x, z: b.pos.z - p.pos.z };
          const tl = Math.sqrt(tb.x * tb.x + tb.z * tb.z) || 1;
          if ((tb.x / tl) * p.dir.x + (tb.z / tl) * p.dir.z < L.ATTACK_ARC_COS) continue;
          b.exploded = true;
          hit = true;
          for (const m of r.monsters) {
            if (m.dead || L.dist(m.pos, b.pos) > L.BARREL_BLAST_R) continue;
            m.hp -= L.BARREL_MONSTER_DMG;
            m.damageFlash = 0.5;
            const kb = { x: m.pos.x - b.pos.x, z: m.pos.z - b.pos.z };
            const kl = Math.sqrt(kb.x * kb.x + kb.z * kb.z) || 1;
            m.knockback = { x: (kb.x / kl) * 20, z: (kb.z / kl) * 20 };
            if (m.hp <= 0 && !m.dead) {
              m.dead = true;
              r.kills += 1;
              const reward = m.type === 'brute' ? L.BRUTE_REWARD : L.NORMAL_REWARD;
              r.runOrb += reward;
              ev.earnOrb(reward);
              ev.setRunOrb(r.runOrb);
              ev.setMsg(`💥 Barrel kill! +${reward} ORB`);
            }
          }
          if (L.dist(p.pos, b.pos) < L.BARREL_BLAST_R) {
            p.hp -= L.BARREL_PLAYER_DMG;
            ev.setHp(Math.max(0, p.hp));
            ev.onHitFlash();
          }
        }

        // Sword cone
        for (const m of r.monsters) {
          if (m.dead || L.dist(m.pos, p.pos) > L.ATTACK_RANGE) continue;
          const tm = { x: m.pos.x - p.pos.x, z: m.pos.z - p.pos.z };
          const tl = Math.sqrt(tm.x * tm.x + tm.z * tm.z) || 1;
          if ((tm.x / tl) * p.dir.x + (tm.z / tl) * p.dir.z < L.ATTACK_ARC_COS) continue;
          m.hp -= L.ATTACK_DMG;
          m.damageFlash = 0.2;
          m.knockback = { x: p.dir.x * L.KNOCKBACK_FORCE, z: p.dir.z * L.KNOCKBACK_FORCE };
          hit = true;
          if (m.hp <= 0) {
            m.dead = true;
            r.kills += 1;
            const reward = m.type === 'brute' ? L.BRUTE_REWARD : L.NORMAL_REWARD;
            r.runOrb += reward;
            ev.earnOrb(reward);
            ev.setRunOrb(r.runOrb);
            ev.setMsg(`⚔️ ${m.type === 'brute' ? 'Brute' : 'Shade'} slain! +${reward} ORB`);
          }
        }
        ev.playSound(hit ? 'crit' : 'tap');
      }
    }

    // ── monsters ──
    for (const m of r.monsters) {
      if (m.dead) continue;
      if (m.damageFlash > 0) m.damageFlash -= dt;

      // knockback decay
      if (m.knockback.x !== 0 || m.knockback.z !== 0) {
        m.pos.x += m.knockback.x * dt;
        m.pos.z += m.knockback.z * dt;
        const decay = Math.max(0, 1 - 4 * dt);
        m.knockback.x *= decay; m.knockback.z *= decay;
        if (Math.abs(m.knockback.x) + Math.abs(m.knockback.z) < 0.1) m.knockback = { x: 0, z: 0 };
      }

      const d = L.dist(m.pos, p.pos);
      if (d < L.MONSTER_AGGRO && d > L.MONSTER_HIT_DIST * 0.8) {
        const ux = (p.pos.x - m.pos.x) / d;
        const uz = (p.pos.z - m.pos.z) / d;
        let next = { x: m.pos.x + ux * m.speed * dt, z: m.pos.z + uz * m.speed * dt };
        next = L.resolveWallCollision(r.grid, r.gridW, r.gridH, next, 1.0);
        m.pos = next;
      }
      if (d <= L.MONSTER_HIT_DIST && r.clock - m.lastAttack > L.MONSTER_ATK_CD) {
        m.lastAttack = r.clock;
        if (!p.isDashing) {
          p.hp -= m.type === 'brute' ? L.BRUTE_DMG : L.NORMAL_DMG;
          ev.setHp(Math.max(0, p.hp));
          ev.onHitFlash();
          ev.playSound('dead');
        }
      }
    }

    // ── traps ──
    if (!p.isDashing) {
      for (const t of r.traps) {
        if (t.triggered || L.dist(t.pos, p.pos) > L.TRAP_DIST) continue;
        t.triggered = true;
        p.hp -= L.TRAP_DMG;
        ev.setHp(Math.max(0, p.hp));
        ev.onHitFlash();
        ev.setMsg('🩸 Trap! -10 HP');
      }
    }

    // ── loot ──
    for (const it of r.items) {
      if (it.collected || L.dist(it.pos, p.pos) > L.COLLECT_DIST) continue;
      it.collected = true;
      const orb = it.type === 'artifact' ? L.ARTIFACT_ORB : L.TREASURE_ORB;
      r.runOrb += orb;
      ev.earnOrb(orb);
      ev.setRunOrb(r.runOrb);
      const left = r.items.filter(x => !x.collected).length;
      if (left === 0) {
        r.portalActive = true;
        let pp = { x: p.pos.x, z: p.pos.z + 10 };
        pp = L.resolveWallCollision(r.grid, r.gridW, r.gridH, pp, 2);
        r.portalPos = L.clampToBounds(pp, r.gridW, r.gridH);
        ev.setMsg('🌀 All artifacts found! Reach the portal!');
        ev.playSound('levelup');
      } else {
        ev.setMsg(`✨ +${orb} ORB · ${L.ITEM_COUNT - left}/${L.ITEM_COUNT}`);
        ev.playSound('tap');
      }
      ev.setCollected(L.ITEM_COUNT - left);
    }

    // ── portal / win ──
    if (r.portalActive && L.dist(r.portalPos, p.pos) < L.PORTAL_DIST) {
      r.runOrb += L.WIN_BONUS_ORB;
      ev.earnOrb(L.WIN_BONUS_ORB);
      ev.setRunOrb(r.runOrb);
      ev.playSound('jackpot');
      ev.onEnd(true);
      return;
    }

    // ── death ──
    if (p.hp <= 0) {
      ev.playSound('dead');
      ev.onEnd(false);
      return;
    }

    // ── write world transforms ──
    const pg = playerRef.current;
    if (pg) {
      pg.position.set(p.pos.x, 0, p.pos.z);
      pg.rotation.y = Math.atan2(p.dir.x, p.dir.z);
    }
    const sw = swordRef.current;
    if (sw) {
      // Swing: cooldown runs ATTACK_COOLDOWN → 0; arc during the first 60%
      const k = Math.max(0, p.attackCooldown / L.ATTACK_COOLDOWN);
      sw.rotation.y = k > 0.4 ? -((1 - k) / 0.6) * Math.PI * 1.2 : 0;
    }
    const tr = torchRef.current;
    if (tr) {
      tr.position.set(p.pos.x, 3.2, p.pos.z);
      // Subtle torch flicker
      tr.intensity = 380 + Math.sin(r.clock * 9) * 40 + Math.sin(r.clock * 23) * 20;
    }
    r.monsters.forEach((m, i) => {
      const g = monsterRefs.current[i];
      if (!g) return;
      g.visible = !m.dead;
      if (m.dead) return;
      const bob = Math.sin(r.clock * (m.type === 'brute' ? 8 : 12) + i) * 0.15;
      g.position.set(m.pos.x, 1 + bob, m.pos.z);
      const mat = monsterMats.current[i];
      if (mat) {
        mat.color.set(m.damageFlash > 0 ? '#ffffff' : (m.type === 'brute' ? '#7f1d1d' : '#ef4444'));
      }
    });
    r.items.forEach((it, i) => {
      const mesh = itemRefs.current[i];
      if (!mesh) return;
      mesh.visible = !it.collected;
      if (!it.collected) {
        mesh.rotation.y += dt * 2;
        mesh.position.y = 1.2 + Math.sin(r.clock * 3 + i) * 0.25;
      }
    });
    r.traps.forEach((t, i) => {
      const mesh = trapRefs.current[i];
      if (mesh) mesh.visible = !t.triggered;
    });
    r.barrels.forEach((b, i) => {
      const mesh = barrelRefs.current[i];
      if (mesh) mesh.visible = !b.exploded;
    });
    const po = portalRef.current;
    if (po) {
      po.visible = r.portalActive;
      if (r.portalActive) {
        po.position.set(r.portalPos.x, 2, r.portalPos.z);
        po.rotation.y += dt * 1.5;
      }
    }

    // ── camera: third-person chase ──
    camera.position.lerp(new THREE.Vector3(p.pos.x, 21, p.pos.z + 16), 0.08);
    camera.lookAt(p.pos.x, 0, p.pos.z);
  });

  return (
    <>
      <fog attach="fog" args={['#05010d', 10, 60]} />
      <ambientLight intensity={0.35} color="#5b4a8a" />
      {/* Player torch — the only strong light; darkness sells the abyss */}
      <pointLight ref={torchRef} color="#ff9e4d" intensity={380} distance={46} decay={2} />

      {/* Abyss floor */}
      <mesh position={[0, -0.05, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <planeGeometry args={[420, 420]} />
        <meshStandardMaterial color="#0a0618" roughness={0.95} metalness={0.1} />
      </mesh>

      {/* Walls */}
      <instancedMesh ref={wallsRef} args={[undefined, undefined, walls.length]}>
        <boxGeometry args={[L.CELL_SIZE, L.WALL_HEIGHT, L.CELL_SIZE]} />
        <meshStandardMaterial color="#241a3f" roughness={0.85} metalness={0.25} />
      </instancedMesh>

      {/* Player: hooded seeker + sword pivot */}
      <group ref={playerRef}>
        <mesh position={[0, 1, 0]}>
          <coneGeometry args={[0.8, 2, 8]} />
          <meshStandardMaterial color="#7C3AED" emissive="#7C3AED" emissiveIntensity={0.35} />
        </mesh>
        <mesh position={[0, 2.1, 0]}>
          <sphereGeometry args={[0.42, 12, 12]} />
          <meshStandardMaterial color="#C4B5FD" emissive="#C4B5FD" emissiveIntensity={0.5} />
        </mesh>
        <group ref={swordRef} position={[0, 1.2, 0]}>
          <mesh position={[0.9, 0, 0.5]} rotation={[Math.PI / 2, 0, 0]}>
            <boxGeometry args={[0.14, 0.14, 2.1]} />
            <meshStandardMaterial color="#E2E8F0" emissive="#93C5FD" emissiveIntensity={1.4} />
          </mesh>
        </group>
      </group>

      {/* Monsters */}
      {run.monsters.map((m, i) => (
        <group key={m.id} ref={el => { monsterRefs.current[i] = el; }}>
          <mesh>
            <sphereGeometry args={[m.type === 'brute' ? 1.5 : 0.8, 10, 10]} />
            <meshStandardMaterial
              ref={el => { monsterMats.current[i] = el; }}
              color={m.type === 'brute' ? '#7f1d1d' : '#ef4444'}
              roughness={0.6}
            />
          </mesh>
          <mesh position={[0, m.type === 'brute' ? 1.1 : 0.65, 0]}>
            <sphereGeometry args={[0.16, 6, 6]} />
            <meshStandardMaterial color="#fef08a" emissive="#fef08a" emissiveIntensity={2} />
          </mesh>
        </group>
      ))}

      {/* Loot */}
      {run.items.map((it, i) => (
        <mesh key={it.id} ref={el => { itemRefs.current[i] = el; }}
          position={[it.pos.x, 1.2, it.pos.z]}>
          <octahedronGeometry args={[it.type === 'artifact' ? 0.75 : 0.55]} />
          <meshStandardMaterial
            color={it.type === 'artifact' ? '#22d3ee' : '#facc15'}
            emissive={it.type === 'artifact' ? '#22d3ee' : '#facc15'}
            emissiveIntensity={1.6}
          />
        </mesh>
      ))}

      {/* Traps */}
      {run.traps.map((t, i) => (
        <mesh key={t.id} ref={el => { trapRefs.current[i] = el; }}
          position={[t.pos.x, 0.06, t.pos.z]} rotation={[-Math.PI / 2, 0, 0]}>
          <circleGeometry args={[1.6, 12]} />
          <meshStandardMaterial color="#450a0a" emissive="#dc2626" emissiveIntensity={0.35}
            transparent opacity={0.85} />
        </mesh>
      ))}

      {/* Barrels */}
      {run.barrels.map((b, i) => (
        <mesh key={b.id} ref={el => { barrelRefs.current[i] = el; }}
          position={[b.pos.x, 0.9, b.pos.z]}>
          <cylinderGeometry args={[0.8, 0.95, 1.8, 10]} />
          <meshStandardMaterial color="#92400e" emissive="#f97316" emissiveIntensity={0.25} />
        </mesh>
      ))}

      {/* Exit portal */}
      <group ref={portalRef} visible={false}>
        <mesh>
          <torusGeometry args={[2.2, 0.35, 10, 32]} />
          <meshStandardMaterial color="#22d3ee" emissive="#22d3ee" emissiveIntensity={2.2} />
        </mesh>
        <pointLight color="#22d3ee" intensity={220} distance={26} decay={2} />
      </group>
    </>
  );
}

// ── main component ────────────────────────────────────────────────────────────
type Props = {
  energy: number;
  onSpendEnergy: (n: number) => void;
  onEarnOrb: (n: number) => void;
  onAddScore: (n: number) => void;
  onPlaySound: (s: 'tap' | 'crit' | 'jackpot' | 'levelup' | 'dead') => void;
  onExit: () => void;
};

export default function LabyrinthOfAbyss({
  energy, onSpendEnergy, onEarnOrb, onAddScore, onPlaySound, onExit,
}: Props) {
  const [phase, setPhase] = useState<Phase>('menu');
  const [hp, setHp]             = useState(L.PLAYER_MAX_HP);
  const [collected, setCollected] = useState(0);
  const [runOrb, setRunOrb]     = useState(0);
  const [msg, setMsg]           = useState('');
  const [best, setBest]         = useState(0);

  const runRef   = useRef<L.RunState | null>(null);
  const phaseRef = useRef<Phase>('menu');
  const inputRef = useRef<InputState>({ jx: 0, jz: 0, attack: false, dash: false });
  const eventsRef = useRef<LoopEvents>(null as unknown as LoopEvents);

  const hitFlash = useRef(new Animated.Value(0)).current;
  const stickPos = useRef(new Animated.ValueXY()).current;

  useEffect(() => {
    AsyncStorage.getItem(BEST_KEY).then(v => {
      const n = parseInt(v ?? '0', 10);
      if (Number.isFinite(n)) setBest(n);
    }).catch(() => {});
  }, []);

  function endRun(won: boolean) {
    const r = runRef.current;
    phaseRef.current = won ? 'won' : 'dead';
    setPhase(won ? 'won' : 'dead');
    if (r) {
      // Tournament points — same shape as Space Runner (orb/10, server clamps 1..500)
      const pts = Math.max(1, Math.floor(r.runOrb / 10)) + (won ? L.WIN_TOURNAMENT_PTS : 0);
      onAddScore(pts);
      if (r.runOrb > best) {
        setBest(r.runOrb);
        AsyncStorage.setItem(BEST_KEY, String(r.runOrb)).catch(() => {});
      }
    }
  }

  // Keep the loop-events object fresh without re-mounting the Canvas
  eventsRef.current = {
    setHp, setCollected, setRunOrb, setMsg,
    earnOrb: onEarnOrb,
    playSound: onPlaySound,
    onHitFlash: () => {
      hitFlash.setValue(0.45);
      Animated.timing(hitFlash, { toValue: 0, duration: 320, useNativeDriver: true }).start();
    },
    onEnd: endRun,
  };

  function startRun() {
    if (energy < L.ENTRY_ENERGY) {
      setMsg(`⚡ Need ${L.ENTRY_ENERGY} energy to descend`);
      return;
    }
    onSpendEnergy(L.ENTRY_ENERGY);
    runRef.current = L.createRun();
    inputRef.current = { jx: 0, jz: 0, attack: false, dash: false };
    setHp(L.PLAYER_MAX_HP);
    setCollected(0);
    setRunOrb(0);
    setMsg('The Abyss watches. Find 15 artifacts.');
    phaseRef.current = 'playing';
    setPhase('playing');
    onPlaySound('levelup');
  }

  // ── virtual joystick (left half) ──
  const JOY_R = 56;
  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderMove: (_e, g) => {
        let dx = g.dx, dy = g.dy;
        const d = Math.sqrt(dx * dx + dy * dy);
        if (d > JOY_R) { dx = (dx / d) * JOY_R; dy = (dy / d) * JOY_R; }
        stickPos.setValue({ x: dx, y: dy });
        inputRef.current.jx = dx / JOY_R;
        inputRef.current.jz = dy / JOY_R;   // screen down = +z (towards camera)
      },
      onPanResponderRelease: () => {
        stickPos.setValue({ x: 0, y: 0 });
        inputRef.current.jx = 0;
        inputRef.current.jz = 0;
      },
      onPanResponderTerminate: () => {
        stickPos.setValue({ x: 0, y: 0 });
        inputRef.current.jx = 0;
        inputRef.current.jz = 0;
      },
    }),
  ).current;

  const hpPct = Math.max(0, Math.min(1, hp / L.PLAYER_MAX_HP));

  return (
    <View style={s.root}>
      {(phase === 'playing' || phase === 'dead' || phase === 'won') && runRef.current && (
        <Canvas
          style={StyleSheet.absoluteFillObject}
          camera={{ position: [0, 21, 16], fov: 52, near: 0.1, far: 140 }}
          gl={{ antialias: true }}
        >
          <color attach="background" args={['#05010d']} />
          <GameWorld runRef={runRef} inputRef={inputRef} phaseRef={phaseRef} events={eventsRef} />
        </Canvas>
      )}

      {/* Damage flash */}
      <Animated.View pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#dc2626', opacity: hitFlash }]} />

      {/* ═══ MENU ═══ */}
      {phase === 'menu' && (
        <View style={s.menuWrap}>
          <Text style={s.menuIcon}>🕳️</Text>
          <Text style={s.menuTitle}>ABYSS LABYRINTH</Text>
          <Text style={s.menuSub}>
            A real-3D descent. Find {L.ITEM_COUNT} artifacts in the dark maze,{'\n'}
            slay shades with your blade, dash through traps —{'\n'}
            then escape through the portal.
          </Text>
          <View style={s.menuStats}>
            <Text style={s.menuStat}>⚔️ Sword: {L.ATTACK_DMG} dmg</Text>
            <Text style={s.menuStat}>💨 Dash: i-frames</Text>
            <Text style={s.menuStat}>🏆 Best: {best.toLocaleString()} ORB</Text>
          </View>
          <TouchableOpacity onPress={startRun} activeOpacity={0.85} style={s.startBtn}>
            <Text style={s.startTxt}>▼  DESCEND  ·  {L.ENTRY_ENERGY}⚡</Text>
          </TouchableOpacity>
          {msg !== '' && <Text style={s.menuMsg}>{msg}</Text>}
          <TouchableOpacity onPress={onExit} style={s.exitLink}>
            <Text style={s.exitLinkTxt}>‹ BACK TO ARCADE</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ═══ HUD ═══ */}
      {phase === 'playing' && (
        <>
          <View style={s.hudTop} pointerEvents="box-none">
            <View style={s.hpWrap}>
              <View style={s.hpTrack}>
                <View style={[s.hpFill, {
                  width: `${hpPct * 100}%`,
                  backgroundColor: hpPct > 0.5 ? '#22c55e' : hpPct > 0.25 ? '#f59e0b' : '#ef4444',
                }]} />
              </View>
              <Text style={s.hpTxt}>{hp} HP</Text>
            </View>
            <View style={s.hudChips}>
              <Text style={s.hudChip}>✨ {collected}/{L.ITEM_COUNT}</Text>
              <Text style={[s.hudChip, { color: '#facc15' }]}>+{runOrb.toLocaleString()}</Text>
            </View>
            <TouchableOpacity onPress={() => { phaseRef.current = 'menu'; setPhase('menu'); }}
              style={s.quitBtn}>
              <Text style={s.quitTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {msg !== '' && (
            <View style={s.msgWrap} pointerEvents="none">
              <Text style={s.msgTxt}>{msg}</Text>
            </View>
          )}

          {/* Joystick */}
          <View style={s.joyZone} {...pan.panHandlers}>
            <View style={s.joyBase}>
              <Animated.View style={[s.joyStick, { transform: stickPos.getTranslateTransform() }]} />
            </View>
          </View>

          {/* Action buttons */}
          <View style={s.btnCol} pointerEvents="box-none">
            <TouchableOpacity
              onPressIn={() => { inputRef.current.dash = true; }}
              activeOpacity={0.7} style={[s.actBtn, s.dashBtn]}>
              <Text style={s.actTxt}>💨</Text>
              <Text style={s.actLbl}>DASH</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPressIn={() => { inputRef.current.attack = true; }}
              activeOpacity={0.7} style={[s.actBtn, s.atkBtn]}>
              <Text style={s.actTxt}>⚔️</Text>
              <Text style={s.actLbl}>STRIKE</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* ═══ DEATH / VICTORY ═══ */}
      {(phase === 'dead' || phase === 'won') && (
        <View style={s.endWrap}>
          <Text style={s.endIcon}>{phase === 'won' ? '🌀' : '💀'}</Text>
          <Text style={[s.endTitle, phase === 'won' && { color: '#22d3ee' }]}>
            {phase === 'won' ? 'ESCAPED THE ABYSS' : 'THE ABYSS CLAIMS YOU'}
          </Text>
          <View style={s.endStats}>
            <Text style={s.endStat}>✨ Artifacts: {collected}/{L.ITEM_COUNT}</Text>
            <Text style={s.endStat}>⚔️ Kills: {runRef.current?.kills ?? 0}</Text>
            <Text style={[s.endStat, { color: '#facc15' }]}>💎 Earned: +{runOrb.toLocaleString()} ORB</Text>
            {phase === 'won' && (
              <Text style={[s.endStat, { color: '#22d3ee' }]}>🌀 Escape bonus: +{L.WIN_BONUS_ORB} ORB</Text>
            )}
          </View>
          <TouchableOpacity onPress={startRun} activeOpacity={0.85} style={s.startBtn}>
            <Text style={s.startTxt}>▼  DESCEND AGAIN  ·  {L.ENTRY_ENERGY}⚡</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={onExit} style={s.exitLink}>
            <Text style={s.exitLinkTxt}>‹ BACK TO ARCADE</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ── styles ────────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05010d' },

  menuWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  menuIcon:  { fontSize: 64, marginBottom: 10 },
  menuTitle: { color: '#C4B5FD', fontSize: 26, fontWeight: '900', letterSpacing: 4 },
  menuSub:   { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 12 },
  menuStats: { flexDirection: 'row', gap: 14, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' },
  menuStat:  { color: '#7C3AED', fontSize: 11, fontWeight: '800' },
  menuMsg:   { color: '#f59e0b', fontSize: 12, fontWeight: '700', marginTop: 12 },

  startBtn: { marginTop: 26, backgroundColor: '#7C3AED', paddingVertical: 16,
              paddingHorizontal: 34, borderRadius: 18,
              shadowColor: '#7C3AED', shadowRadius: 16, shadowOpacity: 0.6, elevation: 8 },
  startTxt: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  exitLink: { marginTop: 18, padding: 8 },
  exitLinkTxt: { color: '#475569', fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  hudTop:  { position: 'absolute', top: 46, left: 14, right: 14,
             flexDirection: 'row', alignItems: 'center', gap: 10 },
  hpWrap:  { flex: 1 },
  hpTrack: { height: 10, backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 6,
             overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' },
  hpFill:  { height: '100%', borderRadius: 6 },
  hpTxt:   { color: '#E2E8F0', fontSize: 10, fontWeight: '800', marginTop: 3 },
  hudChips:{ flexDirection: 'row', gap: 8 },
  hudChip: { color: '#C4B5FD', fontSize: 13, fontWeight: '900',
             backgroundColor: 'rgba(15,23,42,0.8)', paddingHorizontal: 10, paddingVertical: 5,
             borderRadius: 10, overflow: 'hidden' },
  quitBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(15,23,42,0.85)',
             alignItems: 'center', justifyContent: 'center',
             borderWidth: 1, borderColor: 'rgba(124,58,237,0.5)' },
  quitTxt: { color: '#94A3B8', fontSize: 16, fontWeight: '800' },

  msgWrap: { position: 'absolute', bottom: 190, left: 0, right: 0, alignItems: 'center' },
  msgTxt:  { color: '#E2E8F0', fontSize: 13, fontWeight: '800',
             backgroundColor: 'rgba(5,1,13,0.75)', paddingHorizontal: 16, paddingVertical: 8,
             borderRadius: 14, overflow: 'hidden' },

  joyZone: { position: 'absolute', left: 0, bottom: 0, width: '48%', height: 240,
             alignItems: 'center', justifyContent: 'center' },
  joyBase: { width: 128, height: 128, borderRadius: 64,
             backgroundColor: 'rgba(124,58,237,0.10)',
             borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.35)',
             alignItems: 'center', justifyContent: 'center' },
  joyStick:{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(196,181,253,0.55)',
             borderWidth: 1.5, borderColor: '#C4B5FD' },

  btnCol:  { position: 'absolute', right: 18, bottom: 46, gap: 14, alignItems: 'center' },
  actBtn:  { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center',
             borderWidth: 2 },
  atkBtn:  { backgroundColor: 'rgba(124,58,237,0.28)', borderColor: '#7C3AED' },
  dashBtn: { backgroundColor: 'rgba(34,211,238,0.18)', borderColor: 'rgba(34,211,238,0.6)' },
  actTxt:  { fontSize: 26 },
  actLbl:  { color: '#E2E8F0', fontSize: 9, fontWeight: '900', letterSpacing: 1, marginTop: 1 },

  endWrap:  { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center',
              backgroundColor: 'rgba(5,1,13,0.82)', padding: 28 },
  endIcon:  { fontSize: 58, marginBottom: 8 },
  endTitle: { color: '#ef4444', fontSize: 20, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  endStats: { marginTop: 18, gap: 8, alignItems: 'center' },
  endStat:  { color: '#94A3B8', fontSize: 14, fontWeight: '700' },
});
