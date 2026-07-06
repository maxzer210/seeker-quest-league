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
export const MAZE_W          = 30;          // logical cells; grid = 2n+1
export const MAZE_H          = 30;
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

export const MONSTER_COUNT   = 30;
export const BRUTE_CHANCE    = 0.2;
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

export const ITEM_COUNT      = 15;
export const TREASURE_ORB    = 200;
export const ARTIFACT_ORB    = 500;
export const ARTIFACT_CHANCE = 0.4;         // else treasure
export const COLLECT_DIST    = 2.2;

export const TRAP_COUNT      = 30;
export const TRAP_DMG        = 10;
export const TRAP_DIST       = 2.0;

export const BARREL_COUNT    = 20;
export const BARREL_BLAST_R  = 15;
export const BARREL_MONSTER_DMG = 100;
export const BARREL_PLAYER_DMG  = 30;

export const PORTAL_DIST     = 3.0;
export const WIN_BONUS_ORB   = 1000;
export const WIN_TOURNAMENT_PTS = 60;

// ── Types ─────────────────────────────────────────────────────────────────────
export type Vec2 = { x: number; z: number };

export type Monster = {
  id: number;
  pos: Vec2;
  hp: number;
  type: 'brute' | 'normal';
  speed: number;
  dead: boolean;
  lastAttack: number;      // run-clock seconds
  damageFlash: number;     // seconds remaining of white flash
  knockback: Vec2;         // decaying velocity
};

export type LootItem = {
  id: number;
  pos: Vec2;
  type: 'treasure' | 'artifact';
  collected: boolean;
};

export type Trap   = { id: number; pos: Vec2; triggered: boolean };
export type Barrel = { id: number; pos: Vec2; exploded: boolean };

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
};

// ── Maze generation (verbatim port) ──────────────────────────────────────────
export function generateMaze(w: number, h: number) {
  const gridW = w * 2 + 1;
  const gridH = h * 2 + 1;
  const grid: number[][] = Array.from({ length: gridH }, () => Array(gridW).fill(0));

  for (let y = 0; y < gridH; y++) {
    for (let x = 0; x < gridW; x++) {
      if (Math.random() > 0.8) {
        grid[y][x] = 1;
        if (x < gridW - 1 && Math.random() > 0.4) grid[y][x + 1] = 1;
        if (y < gridH - 1 && Math.random() > 0.4) grid[y + 1][x] = 1;
      }
    }
  }

  // Carve open rooms
  for (let i = 0; i < 8; i++) {
    const rw = Math.floor(Math.random() * 4) + 3;
    const rh = Math.floor(Math.random() * 4) + 3;
    const rx = Math.floor(Math.random() * (gridW - rw - 2)) + 1;
    const ry = Math.floor(Math.random() * (gridH - rh - 2)) + 1;
    for (let y = ry; y < ry + rh; y++) {
      for (let x = rx; x < rx + rw; x++) grid[y][x] = 0;
    }
  }

  // Clear spawn area in the centre
  const cx = Math.floor(gridW / 2);
  const cy = Math.floor(gridH / 2);
  for (let dy = -2; dy <= 2; dy++) {
    for (let dx = -2; dx <= 2; dx++) {
      if (grid[cy + dy]?.[cx + dx] !== undefined) grid[cy + dy][cx + dx] = 0;
    }
  }

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
export function createRun(): RunState {
  const { grid, gridW, gridH } = generateMaze(MAZE_W, MAZE_H);

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
      hp: PLAYER_MAX_HP,
      attackCooldown: 0,
      isDashing: false, dashTime: 0, dashCooldown: 0,
    },
    monsters: Array.from({ length: MONSTER_COUNT }, (_, i) => {
      const isBrute = Math.random() < BRUTE_CHANCE;
      return {
        id: i,
        pos: emptyPos(),
        hp: isBrute ? BRUTE_HP : NORMAL_HP,
        type: isBrute ? 'brute' as const : 'normal' as const,
        speed: isBrute ? BRUTE_SPEED : NORMAL_SPEED,
        dead: false, lastAttack: 0, damageFlash: 0,
        knockback: { x: 0, z: 0 },
      };
    }),
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
  };
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
