/**
 * Abyss Labyrinth — pure game logic (no React, no three.js).
 *
 * Ported 1:1 from the AI-Studio web prototype (TreasureHunt.tsx 3D maze):
 * maze generation, entity spawning, and all balance numbers. Rendering and
 * the frame loop live in components/LabyrinthOfAbyss.tsx; physics is a simple
 * grid push-out (the web build used the Rapier WASM engine, which does not
 * run in React Native).
 */

// ── Balance (from the web prototype) ─────────────────────────────────────────
export const CELL_SIZE       = 5;
export const WALL_HEIGHT     = 4;
export const MAZE_W          = 40;          // logical cells; grid = 2n+1
export const MAZE_H          = 40;
export const ENTRY_ENERGY    = 30;

export const PLAYER_MAX_HP   = 100;
export const PLAYER_SPEED    = 12;          // units/sec
export const PLAYER_RADIUS   = 1.2;
export const DASH_SPEED      = 40;          // impulse 35 over 0.2s ≈ sustained 40
export const DASH_TIME       = 0.2;         // s of i-frames + burst
export const DASH_COOLDOWN   = 1.0;

export const ATTACK_RANGE    = 7;
export const ATTACK_ARC_COS  = Math.cos(Math.PI / 1.5); // 120° cone
export const ATTACK_DMG      = 50;
export const ATTACK_COOLDOWN = 0.4;
export const KNOCKBACK_FORCE = 10;
export const SWING_TIME      = 0.28;        // blade-arc duration for the render

export const MONSTER_COUNT   = 55;
export const BRUTE_CHANCE    = 0.25;
export const MONSTER_AGGRO   = 30;          // starts chasing
export const MONSTER_HIT_DIST= 2.5;
export const MONSTER_ATK_CD  = 1.0;
export const BRUTE_HP        = 150;
export const BRUTE_SPEED     = 3;
export const BRUTE_DMG       = 15;
export const BRUTE_REWARD    = 400;
export const NORMAL_HP       = 60;
export const NORMAL_SPEED    = 5.5;
export const NORMAL_DMG      = 5;
export const NORMAL_REWARD   = 150;

// The Guardian — one slow, heavily-armoured mini-boss per run. Big HP, big hurt,
// big payout. Rendered large with its own boss HP bar.
export const GUARDIAN_HP     = 700;
export const GUARDIAN_SPEED  = 3.6;
export const GUARDIAN_DMG    = 24;
export const GUARDIAN_REWARD = 3000;

export const ITEM_COUNT      = 15;
export const TREASURE_ORB    = 200;
export const ARTIFACT_ORB    = 500;
export const ARTIFACT_CHANCE = 0.4;         // else treasure
export const COLLECT_DIST    = 2.2;

export const TRAP_COUNT      = 45;
export const TRAP_DMG        = 10;
export const TRAP_DIST       = 2.0;

export const BARREL_COUNT    = 30;
export const BARREL_BLAST_R  = 15;
export const BARREL_MONSTER_DMG = 100;
export const BARREL_PLAYER_DMG  = 30;

export const PORTAL_DIST     = 3.0;
export const WIN_BONUS_ORB   = 1000;
export const WIN_TOURNAMENT_PTS = 60;

// ── Camp upgrades (permanent meta-progression, bought with ORB) ──────────────
// Five axes, levels 0-5 each. Index every table by level; level 0 must equal
// the base balance constants above so a run without upgrades is byte-identical
// to the pre-camp game.
export const UPGRADE_MAX_LEVEL   = 5;
export const TORCH_LEVELS        = [5.6, 6.1, 6.6, 7.1, 7.6, 8.1];      // light radius, cells
export const SPEED_LEVELS        = [12, 13, 14, 15, 16, 17];             // units/sec
export const MAX_HP_LEVELS       = [100, 120, 140, 160, 180, 200];
export const SWORD_DMG_LEVELS    = [50, 60, 70, 80, 90, 100];
export const EMBER_REVIVE_HP     = [0, 1, 20, 35, 50, 75];               // Second Torch: HP restored (0 = locked)
export const LANTERN_TORCH_BONUS = 0.4;                                  // Abyss Lantern (SOL cosmetic) light bonus

/** Permanent camp-upgrade levels (0-5 per axis) applied to a run at creation. */
export type LabyrinthUpgrades = {
  torch: number;      // fog-of-war light radius
  speed: number;      // move speed
  vigor: number;      // max HP
  blade: number;      // sword damage
  ember: number;      // "Second Torch" — survive one lethal hit per run
  /** Abyss Lantern cosmetic (SOL): small extra light radius; tint is render-side. */
  lantern?: boolean;
};

// ── Types ─────────────────────────────────────────────────────────────────────
export type Vec2 = { x: number; z: number };

export type MonsterType = 'brute' | 'normal' | 'guardian';

export type Monster = {
  id: number;
  pos: Vec2;
  hp: number;
  maxHp: number;           // for damage bars (boss)
  type: MonsterType;
  variant: number;         // picks the sprite among normal-monster variants
  speed: number;
  dead: boolean;
  lastAttack: number;      // run-clock seconds
  damageFlash: number;     // seconds remaining of white flash
  knockback: Vec2;         // decaying velocity
};

/** ORB payout / contact damage for a monster type. */
export function rewardFor(t: MonsterType): number {
  return t === 'guardian' ? GUARDIAN_REWARD : t === 'brute' ? BRUTE_REWARD : NORMAL_REWARD;
}
export function dmgFor(t: MonsterType): number {
  return t === 'guardian' ? GUARDIAN_DMG : t === 'brute' ? BRUTE_DMG : NORMAL_DMG;
}
export function monsterName(t: MonsterType): string {
  return t === 'guardian' ? 'The Guardian' : t === 'brute' ? 'Brute' : 'Shade';
}

export type LootItem = {
  id: number;
  pos: Vec2;
  type: 'treasure' | 'artifact';
  collected: boolean;
};

export type Trap   = { id: number; pos: Vec2; triggered: boolean };
export type Barrel = { id: number; pos: Vec2; exploded: boolean };

// Transient FX for juice (spark bursts, floating damage/reward numbers)
export type Particle = { x: number; z: number; vx: number; vz: number; life: number; max: number; color: string; size: number };
export type FloatText = { x: number; z: number; text: string; life: number; max: number; color: string; vy: number };

export type RunState = {
  grid: number[][];        // 1 = wall
  gridW: number;
  gridH: number;
  player: {
    pos: Vec2;
    dir: Vec2;             // facing (normalized)
    hp: number;
    attackCooldown: number;
    isDashing: boolean;
    dashTime: number;
    dashCooldown: number;
    moving: boolean;       // for the walk-cycle animation
    stepPhase: number;     // advances only while moving → bouncy stride
  };
  monsters: Monster[];
  items: LootItem[];
  traps: Trap[];
  barrels: Barrel[];
  portalActive: boolean;
  portalPos: Vec2;
  clock: number;           // run time, seconds
  kills: number;
  runOrb: number;          // ORB earned this run (already granted via callback)
  // Effective per-run stats — the base constants after camp upgrades. The
  // simulation and renderer read these instead of the raw constants.
  maxHp: number;
  moveSpeed: number;
  attackDmg: number;
  torchCells: number;      // light radius in cells (renderer adds flicker on top)
  emberCharges: number;    // Second Torch: lethal-hit saves left this run
  emberReviveHp: number;   // HP restored when the Second Torch flares
  explored: number[][];    // fog-of-war memory (1 = seen) — feeds the minimap
  // FX
  particles: Particle[];
  floats: FloatText[];
  shake: number;           // decaying screen-shake magnitude
  swordSwing: number;      // 1 → 0 over a swing, for the blade arc
};

// ── Maze generation ───────────────────────────────────────────────────────────
/**
 * A REAL labyrinth, not wall noise: recursive-backtracker corridors over the
 * logical cell lattice, braided (extra openings) so it is not a punishing
 * perfect maze, with carved halls for fights. Reads as "corridors and rooms" —
 * the coherent structure the old random-sprinkle generator never had.
 */
export function generateMaze(w: number, h: number) {
  const gridW = w * 2 + 1;
  const gridH = h * 2 + 1;
  // start solid; corridors are carved out
  const grid: number[][] = Array.from({ length: gridH }, () => Array(gridW).fill(1));

  // 1) depth-first corridor carve over logical cells (odd grid coords)
  const visited: boolean[][] = Array.from({ length: h }, () => Array(w).fill(false));
  const stack: Array<[number, number]> = [];
  let sx = Math.floor(w / 2), sy = Math.floor(h / 2);
  visited[sy][sx] = true;
  grid[sy * 2 + 1][sx * 2 + 1] = 0;
  stack.push([sx, sy]);
  const DIRS = [[1, 0], [-1, 0], [0, 1], [0, -1]];
  while (stack.length) {
    const [x, y] = stack[stack.length - 1];
    const nbrs: Array<[number, number, number, number]> = [];
    for (const [dx, dy] of DIRS) {
      const nx = x + dx, ny = y + dy;
      if (nx >= 0 && ny >= 0 && nx < w && ny < h && !visited[ny][nx]) nbrs.push([nx, ny, dx, dy]);
    }
    if (!nbrs.length) { stack.pop(); continue; }
    const [nx, ny, dx, dy] = nbrs[Math.floor(Math.random() * nbrs.length)];
    visited[ny][nx] = true;
    grid[y * 2 + 1 + dy][x * 2 + 1 + dx] = 0;   // knock down the wall between
    grid[ny * 2 + 1][nx * 2 + 1] = 0;
    stack.push([nx, ny]);
  }

  // 2) braid: open ~15% of walls that separate two corridors → loops, fewer
  //    dead ends, alternate routes around monsters
  for (let y = 1; y < gridH - 1; y++) {
    for (let x = 1; x < gridW - 1; x++) {
      if (grid[y][x] !== 1 || Math.random() >= 0.15) continue;
      const horiz = grid[y][x - 1] === 0 && grid[y][x + 1] === 0;
      const vert  = grid[y - 1][x] === 0 && grid[y + 1][x] === 0;
      if (horiz || vert) grid[y][x] = 0;
    }
  }

  // 3) carve halls — arena rooms for fights and loot clusters
  for (let i = 0; i < 12; i++) {
    const rw = Math.floor(Math.random() * 5) + 4;
    const rh = Math.floor(Math.random() * 4) + 3;
    const rx = Math.floor(Math.random() * (gridW - rw - 2)) + 1;
    const ry = Math.floor(Math.random() * (gridH - rh - 2)) + 1;
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) grid[y][x] = 0;
    }
  }

  // 4) spawn clearing in the centre
  const cx = Math.floor(gridW / 2);
  const cy = Math.floor(gridH / 2);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (grid[cy + dy]?.[cx + dx] !== undefined) grid[cy + dy][cx + dx] = 0;
    }
  }

  // 5) keep the outer ring solid so halls never breach the boundary
  for (let x = 0; x < gridW; x++) { grid[0][x] = 1; grid[gridH - 1][x] = 1; }
  for (let y = 0; y < gridH; y++) { grid[y][0] = 1; grid[y][gridW - 1] = 1; }

  return { grid, gridW, gridH };
}

// ── Coordinate helpers ────────────────────────────────────────────────────────
export function cellToWorld(cx: number, cz: number, gridW: number, gridH: number): Vec2 {
  return {
    x: cx * CELL_SIZE - ((gridW - 1) * CELL_SIZE) / 2,
    z: cz * CELL_SIZE - ((gridH - 1) * CELL_SIZE) / 2,
  };
}

export function worldToCell(x: number, z: number, gridW: number, gridH: number) {
  return {
    cx: Math.round((x + ((gridW - 1) * CELL_SIZE) / 2) / CELL_SIZE),
    cz: Math.round((z + ((gridH - 1) * CELL_SIZE) / 2) / CELL_SIZE),
  };
}

export function dist(a: Vec2, b: Vec2): number {
  const dx = a.x - b.x, dz = a.z - b.z;
  return Math.sqrt(dx * dx + dz * dz);
}

/**
 * Grid collision: push a circle of `radius` out of any wall cells around it.
 * Replaces the web build's Rapier rigid bodies — for an axis-aligned cell
 * maze a per-axis AABB push-out is indistinguishable in play.
 */
export function resolveWallCollision(
  grid: number[][], gridW: number, gridH: number,
  pos: Vec2, radius: number,
): Vec2 {
  const { cx, cz } = worldToCell(pos.x, pos.z, gridW, gridH);
  let { x, z } = pos;
  const half = CELL_SIZE / 2;

  for (let dz = -1; dz <= 1; dz++) {
    for (let dx = -1; dx <= 1; dx++) {
      const gx = cx + dx, gz = cz + dz;
      if (gx < 0 || gz < 0 || gx >= gridW || gz >= gridH) continue;
      if (grid[gz][gx] !== 1) continue;
      const c = cellToWorld(gx, gz, gridW, gridH);
      // Closest point on the wall AABB to the circle centre
      const nx = Math.max(c.x - half, Math.min(x, c.x + half));
      const nz = Math.max(c.z - half, Math.min(z, c.z + half));
      const ddx = x - nx, ddz = z - nz;
      const d2 = ddx * ddx + ddz * ddz;
      if (d2 < radius * radius) {
        const d = Math.sqrt(d2) || 0.0001;
        const push = (radius - d) / d;
        x += ddx * push;
        z += ddz * push;
      }
    }
  }
  return { x, z };
}

/** Keep the point inside the outer bounds of the maze. */
export function clampToBounds(pos: Vec2, gridW: number, gridH: number): Vec2 {
  const hx = ((gridW - 1) * CELL_SIZE) / 2 - PLAYER_RADIUS;
  const hz = ((gridH - 1) * CELL_SIZE) / 2 - PLAYER_RADIUS;
  return {
    x: Math.max(-hx, Math.min(hx, pos.x)),
    z: Math.max(-hz, Math.min(hz, pos.z)),
  };
}

// ── Run factory ───────────────────────────────────────────────────────────────
export function createRun(upgrades?: Partial<LabyrinthUpgrades>): RunState {
  const { grid, gridW, gridH } = generateMaze(MAZE_W, MAZE_H);

  // Clamp each axis to a valid table index; omitted axes fall back to level 0,
  // so `createRun()` behaves exactly as before the camp existed.
  const lv = (n: number | undefined) =>
    Math.max(0, Math.min(UPGRADE_MAX_LEVEL, Math.floor(n ?? 0)));
  const maxHp      = MAX_HP_LEVELS[lv(upgrades?.vigor)];
  const moveSpeed  = SPEED_LEVELS[lv(upgrades?.speed)];
  const attackDmg  = SWORD_DMG_LEVELS[lv(upgrades?.blade)];
  const torchCells = TORCH_LEVELS[lv(upgrades?.torch)]
                   + (upgrades?.lantern ? LANTERN_TORCH_BONUS : 0);
  const emberLv    = lv(upgrades?.ember);

  const emptyPos = (): Vec2 => {
    for (let tries = 0; tries < 4000; tries++) {
      const cx = Math.floor(Math.random() * (gridW - 2)) + 1;
      const cz = Math.floor(Math.random() * (gridH - 2)) + 1;
      if (grid[cz][cx] === 0) return cellToWorld(cx, cz, gridW, gridH);
    }
    return { x: 0, z: 0 };
  };

  return {
    grid, gridW, gridH,
    player: {
      pos: { x: 0, z: 0 },
      dir: { x: 0, z: -1 },
      hp: maxHp,
      attackCooldown: 0,
      isDashing: false, dashTime: 0, dashCooldown: 0,
      moving: false, stepPhase: 0,
    },
    monsters: [
      ...Array.from({ length: MONSTER_COUNT }, (_, i): Monster => {
        const isBrute = Math.random() < BRUTE_CHANCE;
        const hp = isBrute ? BRUTE_HP : NORMAL_HP;
        return {
          id: i,
          pos: emptyPos(),
          hp, maxHp: hp,
          type: isBrute ? 'brute' : 'normal',
          variant: Math.floor(Math.random() * 3),
          speed: isBrute ? BRUTE_SPEED : NORMAL_SPEED,
          dead: false, lastAttack: 0, damageFlash: 0,
          knockback: { x: 0, z: 0 },
        };
      }),
      // The Guardian mini-boss — spawned far from the centre so the descent
      // builds toward the encounter.
      {
        id: MONSTER_COUNT,
        pos: emptyPos(),
        hp: GUARDIAN_HP, maxHp: GUARDIAN_HP,
        type: 'guardian', variant: 0,
        speed: GUARDIAN_SPEED,
        dead: false, lastAttack: 0, damageFlash: 0,
        knockback: { x: 0, z: 0 },
      },
    ],
    items: Array.from({ length: ITEM_COUNT }, (_, i) => ({
      id: i,
      pos: emptyPos(),
      type: Math.random() > ARTIFACT_CHANCE ? 'treasure' as const : 'artifact' as const,
      collected: false,
    })),
    traps: Array.from({ length: TRAP_COUNT }, (_, i) => ({
      id: i, pos: emptyPos(), triggered: false,
    })),
    barrels: Array.from({ length: BARREL_COUNT }, (_, i) => ({
      id: i, pos: emptyPos(), exploded: false,
    })),
    portalActive: false,
    portalPos: { x: 0, z: 0 },
    clock: 0,
    kills: 0,
    runOrb: 0,
    maxHp,
    moveSpeed,
    attackDmg,
    torchCells,
    emberCharges: emberLv > 0 ? 1 : 0,
    emberReviveHp: EMBER_REVIVE_HP[emberLv],
    explored: Array.from({ length: gridH }, () => Array(gridW).fill(0)),
    particles: [],
    floats: [],
    shake: 0,
    swordSwing: 0,
  };
}

// ── FX helpers ────────────────────────────────────────────────────────────────
export function spawnBurst(run: RunState, x: number, z: number, color: string, count: number, speed: number) {
  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const s = speed * (0.4 + Math.random() * 0.8);
    run.particles.push({
      x, z, vx: Math.cos(a) * s, vz: Math.sin(a) * s,
      life: 0.5 + Math.random() * 0.35, max: 0.85,
      color, size: 2 + Math.random() * 2.5,
    });
  }
  if (run.particles.length > 240) run.particles.splice(0, run.particles.length - 240);
}

export function addFloat(run: RunState, x: number, z: number, text: string, color: string) {
  run.floats.push({ x, z, text, life: 1, max: 1, color, vy: 1.4 });
  if (run.floats.length > 40) run.floats.splice(0, run.floats.length - 40);
}

export type SimInput = { jx: number; jz: number; attack: boolean; dash: boolean };
export type SimEvents = {
  setHp: (hp: number) => void;
  setCollected: (n: number) => void;
  setRunOrb: (n: number) => void;
  setMsg: (m: string) => void;
  onHitFlash: () => void;
  onEnd: (won: boolean) => void;
  playSound: (s: 'tap' | 'crit' | 'jackpot' | 'levelup' | 'dead') => void;
  earnOrb: (n: number) => void;
};

/**
 * Advance the whole simulation by `dt` seconds. Pure logic + FX; the renderer
 * only reads state. Ported verbatim from the original 3D useFrame loop, plus
 * particle/float/shake juice.
 */
export function stepSimulation(run: RunState, input: SimInput, dt: number, ev: SimEvents) {
  const r = run;
  const p = r.player;
  r.clock += dt;

  // decay FX
  if (r.shake > 0) r.shake = Math.max(0, r.shake - dt * 22);
  if (r.swordSwing > 0) r.swordSwing = Math.max(0, r.swordSwing - dt / SWING_TIME);
  for (let i = r.particles.length - 1; i >= 0; i--) {
    const pa = r.particles[i];
    pa.life -= dt;
    if (pa.life <= 0) { r.particles.splice(i, 1); continue; }
    pa.x += pa.vx * dt; pa.z += pa.vz * dt;
    pa.vx *= (1 - 3 * dt); pa.vz *= (1 - 3 * dt);
  }
  for (let i = r.floats.length - 1; i >= 0; i--) {
    const f = r.floats[i];
    f.life -= dt * 1.1;
    if (f.life <= 0) { r.floats.splice(i, 1); continue; }
    f.z -= f.vy * dt;
  }

  // timers
  if (p.attackCooldown > 0) p.attackCooldown -= dt;
  if (p.dashCooldown  > 0) p.dashCooldown  -= dt;
  if (p.dashTime > 0) { p.dashTime -= dt; if (p.dashTime <= 0) p.isDashing = false; }

  // movement
  let dx = input.jx, dz = input.jz;
  const len = Math.sqrt(dx * dx + dz * dz);
  if (len > 1) { dx /= len; dz /= len; }

  // Dash always fires: along the stick if held, else along the facing
  // direction — a bare tap must never feel like a dead button.
  if (input.dash && p.dashCooldown <= 0) {
    if (len > 0.15) {
      const inv = 1 / (Math.sqrt(dx * dx + dz * dz) || 1);
      p.dir = { x: dx * inv, z: dz * inv };
    }
    p.isDashing = true;
    p.dashTime = DASH_TIME;
    p.dashCooldown = DASH_COOLDOWN;
    spawnBurst(r, p.pos.x, p.pos.z, '#c4b5fd', 8, 6);
    ev.playSound('tap');
  }
  input.dash = false;

  const speed = p.isDashing ? DASH_SPEED : r.moveSpeed;
  if (len > 0.15 || p.isDashing) {
    p.moving = true;
    p.stepPhase += dt * (p.isDashing ? 30 : 17);   // stride cadence
    const mx = p.isDashing ? p.dir.x : dx;
    const mz = p.isDashing ? p.dir.z : dz;
    let next = { x: p.pos.x + mx * speed * dt, z: p.pos.z + mz * speed * dt };
    next = resolveWallCollision(r.grid, r.gridW, r.gridH, next, PLAYER_RADIUS);
    p.pos = clampToBounds(next, r.gridW, r.gridH);
    if (len > 0.15) {
      const inv = 1 / (Math.sqrt(dx * dx + dz * dz) || 1);
      p.dir = { x: dx * inv, z: dz * inv };
    }
  } else {
    p.moving = false;
  }

  // fog-of-war memory: remember every cell the torch has revealed (minimap)
  {
    const pc = worldToCell(p.pos.x, p.pos.z, r.gridW, r.gridH);
    const R = Math.ceil(r.torchCells);
    for (let mz = -R; mz <= R; mz++) {
      for (let mx = -R; mx <= R; mx++) {
        if (mx * mx + mz * mz > R * R) continue;
        const gz = pc.cz + mz, gx = pc.cx + mx;
        if (gz >= 0 && gx >= 0 && gz < r.gridH && gx < r.gridW) r.explored[gz][gx] = 1;
      }
    }
  }

  // attack
  if (input.attack) {
    input.attack = false;
    if (p.attackCooldown <= 0) {
      p.attackCooldown = ATTACK_COOLDOWN;
      r.swordSwing = 1;
      // a quick arc of sparks so even a whiffed swing has weight
      spawnBurst(r, p.pos.x + p.dir.x * 3.5, p.pos.z + p.dir.z * 3.5, '#e0f2fe', 5, 6);
      let hit = false;

      for (const b of r.barrels) {
        if (b.exploded || dist(b.pos, p.pos) > ATTACK_RANGE) continue;
        const tb = { x: b.pos.x - p.pos.x, z: b.pos.z - p.pos.z };
        const tl = Math.sqrt(tb.x * tb.x + tb.z * tb.z) || 1;
        if ((tb.x / tl) * p.dir.x + (tb.z / tl) * p.dir.z < ATTACK_ARC_COS) continue;
        b.exploded = true; hit = true;
        r.shake = Math.max(r.shake, 9);
        spawnBurst(r, b.pos.x, b.pos.z, '#f97316', 22, 12);
        for (const m of r.monsters) {
          if (m.dead || dist(m.pos, b.pos) > BARREL_BLAST_R) continue;
          m.hp -= BARREL_MONSTER_DMG;
          m.damageFlash = 0.5;
          const kb = { x: m.pos.x - b.pos.x, z: m.pos.z - b.pos.z };
          const kl = Math.sqrt(kb.x * kb.x + kb.z * kb.z) || 1;
          m.knockback = { x: (kb.x / kl) * 20, z: (kb.z / kl) * 20 };
          if (m.hp <= 0 && !m.dead) {
            m.dead = true; r.kills += 1;
            const reward = rewardFor(m.type);
            r.runOrb += reward; ev.earnOrb(reward); ev.setRunOrb(r.runOrb);
            addFloat(r, m.pos.x, m.pos.z, `+${reward}`, '#facc15');
            spawnBurst(r, m.pos.x, m.pos.z, '#ef4444', 12, 8);
            if (m.type === 'guardian') { r.shake = Math.max(r.shake, 16); spawnBurst(r, m.pos.x, m.pos.z, '#22d3ee', 40, 15); ev.setMsg('THE GUARDIAN FALLS · +3000 ORB'); ev.playSound('jackpot'); }
          }
        }
        if (dist(p.pos, b.pos) < BARREL_BLAST_R) {
          p.hp -= BARREL_PLAYER_DMG;
          ev.setHp(Math.max(0, p.hp));
          addFloat(r, p.pos.x, p.pos.z, `-${BARREL_PLAYER_DMG}`, '#ef4444');
          ev.onHitFlash();
        }
      }

      for (const m of r.monsters) {
        if (m.dead || dist(m.pos, p.pos) > ATTACK_RANGE) continue;
        const tm = { x: m.pos.x - p.pos.x, z: m.pos.z - p.pos.z };
        const tl = Math.sqrt(tm.x * tm.x + tm.z * tm.z) || 1;
        if ((tm.x / tl) * p.dir.x + (tm.z / tl) * p.dir.z < ATTACK_ARC_COS) continue;
        m.hp -= r.attackDmg;
        m.damageFlash = 0.22;
        const kbForce = m.type === 'guardian' ? 2 : m.type === 'brute' ? 6 : KNOCKBACK_FORCE;
        m.knockback = { x: p.dir.x * kbForce, z: p.dir.z * kbForce };
        hit = true;
        r.shake = Math.max(r.shake, 3);                 // every clean hit thumps
        addFloat(r, m.pos.x, m.pos.z, String(r.attackDmg), '#ffffff');
        spawnBurst(r, m.pos.x, m.pos.z, '#fca5a5', 10, 9);
        spawnBurst(r, m.pos.x, m.pos.z, '#ffffff', 4, 12);   // bright impact flash
        if (m.hp <= 0) {
          m.dead = true; r.kills += 1;
          const reward = rewardFor(m.type);
          r.runOrb += reward; ev.earnOrb(reward); ev.setRunOrb(r.runOrb);
          addFloat(r, m.pos.x, m.pos.z - 0.6, `+${reward}`, '#facc15');
          if (m.type === 'guardian') {
            r.shake = Math.max(r.shake, 16);
            spawnBurst(r, m.pos.x, m.pos.z, '#22d3ee', 44, 16);
            spawnBurst(r, m.pos.x, m.pos.z, '#ffffff', 18, 10);
            ev.setMsg('THE GUARDIAN FALLS · +3000 ORB');
            ev.playSound('jackpot');
          } else {
            r.shake = Math.max(r.shake, 8);
            spawnBurst(r, m.pos.x, m.pos.z, '#ef4444', 16, 11);
            ev.setMsg(`${monsterName(m.type)} slain · +${reward} ORB`);
          }
        }
      }
      ev.playSound(hit ? 'crit' : 'tap');
    }
  }

  // monsters
  for (const m of r.monsters) {
    if (m.dead) continue;
    if (m.damageFlash > 0) m.damageFlash -= dt;
    if (m.knockback.x !== 0 || m.knockback.z !== 0) {
      m.pos.x += m.knockback.x * dt;
      m.pos.z += m.knockback.z * dt;
      const decay = Math.max(0, 1 - 4 * dt);
      m.knockback.x *= decay; m.knockback.z *= decay;
      if (Math.abs(m.knockback.x) + Math.abs(m.knockback.z) < 0.1) m.knockback = { x: 0, z: 0 };
    }
    const d = dist(m.pos, p.pos);
    if (d < MONSTER_AGGRO && d > MONSTER_HIT_DIST * 0.8) {
      const ux = (p.pos.x - m.pos.x) / d;
      const uz = (p.pos.z - m.pos.z) / d;
      let next = { x: m.pos.x + ux * m.speed * dt, z: m.pos.z + uz * m.speed * dt };
      next = resolveWallCollision(r.grid, r.gridW, r.gridH, next, 1.0);
      m.pos = next;
    }
    if (d <= MONSTER_HIT_DIST && r.clock - m.lastAttack > MONSTER_ATK_CD) {
      m.lastAttack = r.clock;
      if (!p.isDashing) {
        const dmg = dmgFor(m.type);
        p.hp -= dmg;
        ev.setHp(Math.max(0, p.hp));
        r.shake = Math.max(r.shake, m.type === 'guardian' ? 9 : 4);
        addFloat(r, p.pos.x, p.pos.z, `-${dmg}`, '#ef4444');
        spawnBurst(r, p.pos.x, p.pos.z, '#ef4444', 6, 6);
        ev.onHitFlash();
        ev.playSound('dead');
      }
    }
  }

  // traps
  if (!p.isDashing) {
    for (const t of r.traps) {
      if (t.triggered || dist(t.pos, p.pos) > TRAP_DIST) continue;
      t.triggered = true;
      p.hp -= TRAP_DMG;
      ev.setHp(Math.max(0, p.hp));
      r.shake = Math.max(r.shake, 4);
      addFloat(r, p.pos.x, p.pos.z, `-${TRAP_DMG}`, '#f43f5e');
      ev.onHitFlash();
      ev.setMsg('Trap sprung · -10 HP');
    }
  }

  // loot
  for (const it of r.items) {
    if (it.collected || dist(it.pos, p.pos) > COLLECT_DIST) continue;
    it.collected = true;
    const orb = it.type === 'artifact' ? ARTIFACT_ORB : TREASURE_ORB;
    r.runOrb += orb; ev.earnOrb(orb); ev.setRunOrb(r.runOrb);
    const col = it.type === 'artifact' ? '#22d3ee' : '#facc15';
    addFloat(r, it.pos.x, it.pos.z, `+${orb}`, col);
    spawnBurst(r, it.pos.x, it.pos.z, col, 16, 8);
    const left = r.items.filter(x => !x.collected).length;
    if (left === 0) {
      r.portalActive = true;
      let pp = { x: p.pos.x, z: p.pos.z + 10 };
      pp = resolveWallCollision(r.grid, r.gridW, r.gridH, pp, 2);
      r.portalPos = clampToBounds(pp, r.gridW, r.gridH);
      ev.setMsg('All artifacts found · reach the portal!');
      ev.playSound('levelup');
    } else {
      ev.playSound('tap');
    }
    ev.setCollected(ITEM_COUNT - left);
  }

  // portal / win
  if (r.portalActive && dist(r.portalPos, p.pos) < PORTAL_DIST) {
    r.runOrb += WIN_BONUS_ORB;
    ev.earnOrb(WIN_BONUS_ORB); ev.setRunOrb(r.runOrb);
    ev.playSound('jackpot');
    ev.onEnd(true);
    return;
  }

  // death — unless the Second Torch flares (camp insurance, once per run):
  // the seeker is pulled back from the brink, nearby shades are blasted away,
  // and every monster's attack timer is pushed out for a short grace window.
  if (p.hp <= 0) {
    if (r.emberCharges > 0) {
      r.emberCharges -= 1;
      p.hp = Math.max(1, r.emberReviveHp);
      ev.setHp(p.hp);
      r.shake = Math.max(r.shake, 12);
      spawnBurst(r, p.pos.x, p.pos.z, '#fbbf24', 26, 13);
      spawnBurst(r, p.pos.x, p.pos.z, '#ffffff', 10, 8);
      addFloat(r, p.pos.x, p.pos.z, `+${Math.max(1, r.emberReviveHp)}`, '#fbbf24');
      for (const m of r.monsters) {
        if (m.dead) continue;
        m.lastAttack = r.clock + 1.4;          // grace period before the next hit
        const d = dist(m.pos, p.pos);
        if (d < 14) {                          // flare shockwave shoves the pack back
          const ux = (m.pos.x - p.pos.x) / (d || 1);
          const uz = (m.pos.z - p.pos.z) / (d || 1);
          m.knockback = { x: ux * 22, z: uz * 22 };
        }
      }
      ev.setMsg('THE SECOND TORCH FLARES · DEATH DENIED');
      ev.playSound('levelup');
      ev.onHitFlash();
      return;
    }
    ev.playSound('dead');
    ev.onEnd(false);
  }
}

/** Build wall instance positions (world coords) for rendering. */
export function collectWallCells(grid: number[][], gridW: number, gridH: number): Vec2[] {
  const walls: Vec2[] = [];
  for (let z = 0; z < gridH; z++) {
    for (let x = 0; x < gridW; x++) {
      if (grid[z][x] === 1) walls.push(cellToWorld(x, z, gridW, gridH));
    }
  }
  return walls;
}
