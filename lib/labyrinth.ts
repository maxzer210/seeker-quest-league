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
export const TRAP_DMG        = 14;          // hurts more, but you can now dodge it
export const TRAP_DIST       = 2.0;
export const TRAP_ARM_DIST   = 5.5;         // proximity that wakes a rune
export const TRAP_TELEGRAPH  = 0.55;        // s of warning before it fires — the dodge window
export const TRAP_BLAST      = 3.4;         // radius it actually strikes

// ── Pathfinding ──────────────────────────────────────────────────────────────
// A bounded BFS flow field around the player. Monsters walk down the gradient
// instead of charging the straight line, so they round corners and stop
// grinding against walls. Recomputed a few times a second, not per frame.
export const FLOW_RADIUS     = 16;          // cells of BFS around the player
export const FLOW_INTERVAL   = 0.22;        // s between rebuilds
export const FLOW_UNREACHED  = 0xffff;

// ── Guardian fight ───────────────────────────────────────────────────────────
export const GUARD_PHASE2_HP = 0.6;         // fraction of max HP entering phase 2
export const GUARD_PHASE3_HP = 0.3;
export const GUARD_SLAM_CD   = 3.4;         // s between shockwave slams
export const GUARD_SLAM_TELL = 0.9;         // wind-up the player can dash out of
export const GUARD_SLAM_R    = 13;          // shockwave radius
export const GUARD_SLAM_DMG  = 32;
export const GUARD_SUMMON_CD = 7.0;         // phase 2+: calls shades to its side

export const BARREL_COUNT    = 30;
export const BARREL_BLAST_R  = 15;
export const BARREL_MONSTER_DMG = 100;
export const BARREL_PLAYER_DMG  = 30;

export const PORTAL_DIST     = 3.0;
export const WIN_BONUS_ORB   = 1000;
export const WIN_TOURNAMENT_PTS = 60;

// ── Descent (multi-floor run) ────────────────────────────────────────────────
// One entry fee buys a whole descent. Each floor is a fresh, slightly larger
// and nastier maze; the stairs offer the roguelike decision — bank what you
// have, or go deeper for a fatter multiplier. ORB is granted on pickup and is
// never taken away: the risk is the earnings you forfeit by dying, not a loss.
export const FLOOR_BASE_CELLS  = 13;        // logical cells on floor 1
export const FLOOR_CELLS_STEP  = 2;         // +cells per floor
export const FLOOR_MAX_CELLS   = 30;
export const FLOOR_BASE_MOBS   = 12;
export const FLOOR_MOBS_STEP   = 4;
export const FLOOR_MAX_MOBS    = 60;
export const FLOOR_BASE_ITEMS  = 3;
export const FLOOR_MAX_ITEMS   = 7;
export const FLOOR_BASE_TRAPS  = 8;
export const FLOOR_TRAPS_STEP  = 3;
export const FLOOR_BASE_KEGS   = 5;
export const FLOOR_KEGS_STEP   = 2;
export const GUARDIAN_EVERY    = 3;         // a Guardian bars the stairs on these floors
export const DEPTH_ORB_STEP    = 0.3;       // multiplier: 1 + 0.3*(depth-1)
export const STAIRS_DIST       = 3.0;
export const EXTRACT_BONUS_ORB = 400;       // per floor cleared, paid on extraction

/** Level scale for a given depth. */
export function floorPlan(depth: number) {
  const d = Math.max(1, Math.floor(depth));
  return {
    cells:   Math.min(FLOOR_MAX_CELLS, FLOOR_BASE_CELLS + (d - 1) * FLOOR_CELLS_STEP),
    mobs:    Math.min(FLOOR_MAX_MOBS,  FLOOR_BASE_MOBS  + (d - 1) * FLOOR_MOBS_STEP),
    items:   Math.min(FLOOR_MAX_ITEMS, FLOOR_BASE_ITEMS + Math.floor((d - 1) / 2)),
    traps:   FLOOR_BASE_TRAPS + (d - 1) * FLOOR_TRAPS_STEP,
    kegs:    FLOOR_BASE_KEGS  + (d - 1) * FLOOR_KEGS_STEP,
    guardian: d % GUARDIAN_EVERY === 0,
    orbMult: 1 + DEPTH_ORB_STEP * (d - 1),
  };
}

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
  // Guardian-only fight state (ignored by regular monsters)
  phase: number;           // 1 → 3, escalates as its HP drops
  slamAt: number;          // run-clock time the next slam lands (0 = not winding up)
  lastSlam: number;
  lastSummon: number;
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

/**
 * Rune trap. Dormant until the player steps inside `TRAP_ARM_DIST`, then it
 * telegraphs for `TRAP_TELEGRAPH` seconds before striking — the window that
 * makes DASH worth pressing. `triggered` marks a spent rune.
 */
export type Trap   = { id: number; pos: Vec2; triggered: boolean; arming: number };
export type Barrel = { id: number; pos: Vec2; exploded: boolean };

/** An expanding ring left by a Guardian slam — purely visual, damage is instant. */
export type Shockwave = { x: number; z: number; life: number; max: number; radius: number };

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
  // ── descent ──
  depth: number;           // current floor, 1-based
  orbMult: number;         // reward multiplier for this floor
  stairsPos: Vec2;
  stairsLocked: boolean;   // true on Guardian floors until the boss falls
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
  // Pathfinding: BFS distance-to-player per cell, rebuilt every FLOW_INTERVAL
  flow: Uint16Array;
  flowAt: number;          // run-clock time of the last rebuild
  shockwaves: Shockwave[]; // expanding rings from Guardian slams (render + FX)
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

// ── Flow field (cheap pathfinding) ───────────────────────────────────────────
/**
 * Breadth-first flood from the player's cell, bounded to FLOW_RADIUS, writing
 * step-distance into `run.flow`. Monsters then simply step to the neighbouring
 * cell with a lower value, which routes them around corners and through
 * doorways. Cost is ~a thousand cell visits a few times a second — far cheaper
 * than per-monster A*, and good enough because everything chases one target.
 */
export function rebuildFlowField(run: RunState) {
  const { gridW, gridH, grid, flow } = run;
  flow.fill(FLOW_UNREACHED);
  const { cx, cz } = worldToCell(run.player.pos.x, run.player.pos.z, gridW, gridH);
  if (cx < 0 || cz < 0 || cx >= gridW || cz >= gridH) return;

  // Ring buffer sized for the bounded area; BFS never revisits a cell.
  const span = FLOW_RADIUS * 2 + 1;
  const queue = new Int32Array(span * span * 2);
  let head = 0, tail = 0;
  flow[cz * gridW + cx] = 0;
  queue[tail++] = cz * gridW + cx;

  while (head < tail) {
    const idx = queue[head++];
    const d = flow[idx];
    if (d >= FLOW_RADIUS) continue;
    const y = (idx / gridW) | 0, x = idx - y * gridW;
    // 4-way: diagonal squeezing through wall corners looks like clipping
    for (let k = 0; k < 4; k++) {
      const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0);
      const ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx <= 0 || ny <= 0 || nx >= gridW - 1 || ny >= gridH - 1) continue;
      if (grid[ny][nx] === 1) continue;
      const nidx = ny * gridW + nx;
      if (flow[nidx] !== FLOW_UNREACHED) continue;
      flow[nidx] = d + 1;
      if (tail < queue.length) queue[tail++] = nidx;
    }
  }
}

/**
 * Direction a monster should walk to close on the player, following the flow
 * field. Returns null when the player is unreachable or already adjacent, in
 * which case the caller falls back to steering straight at them.
 */
function flowStep(run: RunState, pos: Vec2): Vec2 | null {
  const { gridW, gridH, flow } = run;
  const { cx, cz } = worldToCell(pos.x, pos.z, gridW, gridH);
  if (cx <= 0 || cz <= 0 || cx >= gridW - 1 || cz >= gridH - 1) return null;
  const here = flow[cz * gridW + cx];
  if (here === FLOW_UNREACHED || here === 0) return null;

  let bestD = here, bx = cx, bz = cz;
  for (let k = 0; k < 4; k++) {
    const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0);
    const nz = cz + (k === 2 ? 1 : k === 3 ? -1 : 0);
    const v = flow[nz * gridW + nx];
    if (v < bestD) { bestD = v; bx = nx; bz = nz; }
  }
  if (bx === cx && bz === cz) return null;

  // Steer at the centre of the winning cell so bodies stay off the walls.
  const target = cellToWorld(bx, bz, gridW, gridH);
  const dx = target.x - pos.x, dz = target.z - pos.z;
  const len = Math.sqrt(dx * dx + dz * dz) || 1;
  return { x: dx / len, z: dz / len };
}

// ── Run factory ───────────────────────────────────────────────────────────────
export function createRun(upgrades?: Partial<LabyrinthUpgrades>): RunState {
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

  const level = buildLevel(1);

  return {
    ...level,
    player: {
      pos: { x: 0, z: 0 },
      dir: { x: 0, z: -1 },
      hp: maxHp,
      attackCooldown: 0,
      isDashing: false, dashTime: 0, dashCooldown: 0,
      moving: false, stepPhase: 0,
    },
    clock: 0,
    kills: 0,
    runOrb: 0,
    maxHp,
    moveSpeed,
    attackDmg,
    torchCells,
    emberCharges: emberLv > 0 ? 1 : 0,
    emberReviveHp: EMBER_REVIVE_HP[emberLv],
    shockwaves: [],
    particles: [],
    floats: [],
    shake: 0,
    swordSwing: 0,
  };
}

/** Everything that is regenerated per floor (the run's persistent stats are not). */
type LevelParts = Pick<RunState,
  'grid' | 'gridW' | 'gridH' | 'monsters' | 'items' | 'traps' | 'barrels' |
  'portalActive' | 'portalPos' | 'depth' | 'orbMult' | 'stairsPos' | 'stairsLocked' |
  'explored' | 'flow' | 'flowAt'>;

/** Generate one floor of the descent, scaled by depth. */
function buildLevel(depth: number): LevelParts {
  const plan = floorPlan(depth);
  const { grid, gridW, gridH } = generateMaze(plan.cells, plan.cells);

  const emptyPos = (): Vec2 => {
    for (let tries = 0; tries < 4000; tries++) {
      const cx = Math.floor(Math.random() * (gridW - 2)) + 1;
      const cz = Math.floor(Math.random() * (gridH - 2)) + 1;
      if (grid[cz][cx] === 0) return cellToWorld(cx, cz, gridW, gridH);
    }
    return { x: 0, z: 0 };
  };
  /** A spot far from the centre — used for the stairs so a floor is a journey. */
  const farPos = (): Vec2 => {
    let best = emptyPos(), bestD = 0;
    for (let i = 0; i < 40; i++) {
      const c = emptyPos();
      const d = c.x * c.x + c.z * c.z;
      if (d > bestD) { bestD = d; best = c; }
    }
    return best;
  };

  const monsters: Monster[] = Array.from({ length: plan.mobs }, (_, i): Monster => {
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
      phase: 1, slamAt: 0, lastSlam: 0, lastSummon: 0,
    };
  });

  // Every GUARDIAN_EVERY floors a Guardian holds the stairs. Its HP scales so
  // the fight stays meaningful as the seeker's blade improves.
  if (plan.guardian) {
    const hp = Math.round(GUARDIAN_HP * (1 + 0.35 * (depth / GUARDIAN_EVERY - 1)));
    monsters.push({
      id: 9000,
      pos: emptyPos(),
      hp, maxHp: hp,
      type: 'guardian', variant: 0,
      speed: GUARDIAN_SPEED,
      dead: false, lastAttack: 0, damageFlash: 0,
      knockback: { x: 0, z: 0 },
      phase: 1, slamAt: 0, lastSlam: 0, lastSummon: 0,
    });
  }

  return {
    grid, gridW, gridH,
    monsters,
    items: Array.from({ length: plan.items }, (_, i) => ({
      id: i,
      pos: emptyPos(),
      type: Math.random() > ARTIFACT_CHANCE ? 'treasure' as const : 'artifact' as const,
      collected: false,
    })),
    traps: Array.from({ length: plan.traps }, (_, i) => ({
      id: i, pos: emptyPos(), triggered: false, arming: 0,
    })),
    barrels: Array.from({ length: plan.kegs }, (_, i) => ({
      id: i, pos: emptyPos(), exploded: false,
    })),
    portalActive: false,
    portalPos: { x: 0, z: 0 },
    depth,
    orbMult: plan.orbMult,
    stairsPos: farPos(),
    stairsLocked: plan.guardian,
    explored: Array.from({ length: gridH }, () => Array(gridW).fill(0)),
    flow: new Uint16Array(gridW * gridH).fill(FLOW_UNREACHED),
    flowAt: -1,
  };
}

/**
 * Take the stairs down. The seeker keeps HP, ORB, kills and camp upgrades;
 * everything about the place is rebuilt one step deeper and nastier.
 */
export function descendFloor(run: RunState) {
  const level = buildLevel(run.depth + 1);
  Object.assign(run, level);
  run.player.pos = { x: 0, z: 0 };
  run.player.isDashing = false;
  run.player.dashTime = 0;
  run.shockwaves.length = 0;
  run.particles.length = 0;
  run.floats.length = 0;
  run.shake = 0;
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
  /** Player reached the unlocked stairs — the UI offers DESCEND or EXTRACT. */
  onStairs: () => void;
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
            const reward = Math.round(rewardFor(m.type) * r.orbMult);
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
          const reward = Math.round(rewardFor(m.type) * r.orbMult);
          r.runOrb += reward; ev.earnOrb(reward); ev.setRunOrb(r.runOrb);
          addFloat(r, m.pos.x, m.pos.z - 0.6, `+${reward}`, '#facc15');
          if (m.type === 'guardian') {
            r.shake = Math.max(r.shake, 16);
            spawnBurst(r, m.pos.x, m.pos.z, '#22d3ee', 44, 16);
            spawnBurst(r, m.pos.x, m.pos.z, '#ffffff', 18, 10);
            r.stairsLocked = false;              // the way down is clear
            ev.setMsg(`THE GUARDIAN FALLS · +${reward} ORB · the stairs unseal`);
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

  // ── pathfinding refresh ──
  if (r.clock - r.flowAt >= FLOW_INTERVAL) {
    r.flowAt = r.clock;
    rebuildFlowField(r);
  }

  // ── shockwave rings (visual decay) ──
  for (let i = r.shockwaves.length - 1; i >= 0; i--) {
    const w = r.shockwaves[i];
    w.life -= dt;
    if (w.life <= 0) r.shockwaves.splice(i, 1);
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

    // ── Guardian: escalating phases with telegraphed slams ──
    if (m.type === 'guardian') {
      const frac = m.hp / m.maxHp;
      const wantPhase = frac <= GUARD_PHASE3_HP ? 3 : frac <= GUARD_PHASE2_HP ? 2 : 1;
      if (wantPhase > m.phase) {
        m.phase = wantPhase;
        r.shake = Math.max(r.shake, 10);
        spawnBurst(r, m.pos.x, m.pos.z, '#f472b6', 26, 12);
        ev.setMsg(wantPhase === 3 ? 'THE GUARDIAN ENRAGES' : 'THE GUARDIAN AWAKENS FULLY');
        ev.playSound('crit');
      }

      // wind-up → land: the tell is the whole point, it must be dodgeable
      if (m.slamAt > 0) {
        if (r.clock >= m.slamAt) {
          m.slamAt = 0;
          m.lastSlam = r.clock;
          r.shake = Math.max(r.shake, 14);
          r.shockwaves.push({ x: m.pos.x, z: m.pos.z, life: 0.45, max: 0.45, radius: GUARD_SLAM_R });
          spawnBurst(r, m.pos.x, m.pos.z, '#22d3ee', 30, 18);
          ev.playSound('crit');
          if (!p.isDashing && dist(p.pos, m.pos) <= GUARD_SLAM_R) {
            p.hp -= GUARD_SLAM_DMG;
            ev.setHp(Math.max(0, p.hp));
            addFloat(r, p.pos.x, p.pos.z, `-${GUARD_SLAM_DMG}`, '#ef4444');
            ev.onHitFlash();
          }
        }
      } else if (d < GUARD_SLAM_R * 1.1 && r.clock - m.lastSlam > GUARD_SLAM_CD / m.phase) {
        m.slamAt = r.clock + GUARD_SLAM_TELL;      // start the tell
        ev.setMsg('The Guardian raises its fists — DASH!');
      }

      // phase 2+: call reinforcements from the dark. Capped — an uncapped
      // summon would pile up hundreds of shades over a long fight and tank fps.
      const aliveCount = r.monsters.reduce((n, x) => n + (x.dead ? 0 : 1), 0);
      if (m.phase >= 2 && aliveCount < MONSTER_COUNT + 12
          && r.clock - m.lastSummon > GUARD_SUMMON_CD && d < MONSTER_AGGRO) {
        m.lastSummon = r.clock;
        for (let s = 0; s < (m.phase === 3 ? 3 : 2); s++) {
          const a = Math.random() * Math.PI * 2;
          const sp = { x: m.pos.x + Math.cos(a) * 6, z: m.pos.z + Math.sin(a) * 6 };
          r.monsters.push({
            id: 1000 + r.monsters.length,
            pos: resolveWallCollision(r.grid, r.gridW, r.gridH, sp, 1.0),
            hp: NORMAL_HP, maxHp: NORMAL_HP,
            type: 'normal', variant: Math.floor(Math.random() * 3),
            speed: NORMAL_SPEED, dead: false, lastAttack: 0, damageFlash: 0,
            knockback: { x: 0, z: 0 }, phase: 1, slamAt: 0, lastSlam: 0, lastSummon: 0,
          });
          spawnBurst(r, sp.x, sp.z, '#a855f7', 10, 8);
        }
        ev.setMsg('The Guardian calls the shades');
      }
    }

    // ── movement: follow the flow field, fall back to straight steering ──
    // A winding-up Guardian roots itself so the tell reads clearly.
    const rooted = m.type === 'guardian' && m.slamAt > 0;
    if (!rooted && d < MONSTER_AGGRO && d > MONSTER_HIT_DIST * 0.8) {
      const speed = m.type === 'guardian' && m.phase === 3 ? m.speed * 1.5 : m.speed;
      const step = flowStep(r, m.pos) ?? { x: (p.pos.x - m.pos.x) / d, z: (p.pos.z - m.pos.z) / d };
      let next = { x: m.pos.x + step.x * speed * dt, z: m.pos.z + step.z * speed * dt };
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

  // ── rune traps: arm on approach, telegraph, then strike ──
  // The old version hit the instant you touched it, which read as unavoidable
  // chip damage. Now the rune flares first and you get a window to leave.
  for (const t of r.traps) {
    if (t.triggered) continue;
    const d = dist(t.pos, p.pos);
    if (t.arming === 0) {
      if (d <= TRAP_ARM_DIST) {
        t.arming = TRAP_TELEGRAPH;
        spawnBurst(r, t.pos.x, t.pos.z, '#f87171', 6, 4);
      }
      continue;
    }
    t.arming -= dt;
    if (t.arming > 0) continue;

    // it fires whether or not you are still standing there
    t.triggered = true;
    r.shockwaves.push({ x: t.pos.x, z: t.pos.z, life: 0.3, max: 0.3, radius: TRAP_BLAST });
    spawnBurst(r, t.pos.x, t.pos.z, '#ef4444', 18, 12);
    if (!p.isDashing && dist(t.pos, p.pos) <= TRAP_BLAST) {
      p.hp -= TRAP_DMG;
      ev.setHp(Math.max(0, p.hp));
      r.shake = Math.max(r.shake, 6);
      addFloat(r, p.pos.x, p.pos.z, `-${TRAP_DMG}`, '#f43f5e');
      ev.onHitFlash();
      ev.setMsg(`Rune sprung · -${TRAP_DMG} HP`);
    }
  }

  // loot — relics are pure reward now; the stairs, not the item count, gate
  // progress. Deeper floors pay the depth multiplier on everything.
  for (const it of r.items) {
    if (it.collected || dist(it.pos, p.pos) > COLLECT_DIST) continue;
    it.collected = true;
    const orb = Math.round((it.type === 'artifact' ? ARTIFACT_ORB : TREASURE_ORB) * r.orbMult);
    r.runOrb += orb; ev.earnOrb(orb); ev.setRunOrb(r.runOrb);
    const col = it.type === 'artifact' ? '#22d3ee' : '#facc15';
    addFloat(r, it.pos.x, it.pos.z, `+${orb}`, col);
    spawnBurst(r, it.pos.x, it.pos.z, col, 16, 8);
    ev.playSound('tap');
    ev.setCollected(r.items.reduce((n, x) => n + (x.collected ? 1 : 0), 0));
  }

  // stairs — the descent's decision point. Locked while a Guardian lives.
  if (dist(r.stairsPos, p.pos) < STAIRS_DIST) {
    if (r.stairsLocked) {
      ev.setMsg('The Guardian seals the stairs');
    } else {
      ev.playSound('levelup');
      ev.onStairs();
      return;
    }
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
