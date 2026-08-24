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
// Enemies wind up before they strike. Without a tell, contact damage lands on
// an invisible timer and the fight reads as mush; with one, backing off or
// dashing through is a real decision.
export const MONSTER_WINDUP  = 0.42;
export const BRUTE_WINDUP    = 0.62;        // heavier, slower, more readable
// Hitstop: freeze the world for a few frames on impact so a blow lands with
// weight. The single cheapest upgrade to how combat feels.
export const HITSTOP_HIT     = 0.05;
export const HITSTOP_KILL    = 0.11;
// Landing blows in quick succession builds a damage combo — rewards pressing
// the attack instead of trading one safe swing at a time.
export const COMBO_WINDOW    = 2.2;
export const COMBO_STEP      = 0.12;        // +12% damage per stack
export const COMBO_MAX       = 5;
export const BRUTE_HP        = 150;
export const BRUTE_SPEED     = 3;
export const BRUTE_DMG       = 15;
export const BRUTE_REWARD    = 120;
export const NORMAL_HP       = 60;
export const NORMAL_SPEED    = 5.5;
export const NORMAL_DMG      = 5;
export const NORMAL_REWARD   = 45;

// The Guardian — one slow, heavily-armoured mini-boss per run. Big HP, big hurt,
// big payout. Rendered large with its own boss HP bar.
export const GUARDIAN_HP     = 700;
export const GUARDIAN_SPEED  = 3.6;
export const GUARDIAN_DMG    = 24;
export const GUARDIAN_REWARD = 700;

export const ITEM_COUNT      = 15;
export const TREASURE_ORB    = 70;
export const ARTIFACT_ORB    = 170;
export const ARTIFACT_CHANCE = 0.4;         // else treasure
export const COLLECT_DIST    = 2.2;

export const TRAP_COUNT      = 45;
export const TRAP_DMG        = 14;          // hurts more, but you can now dodge it
export const TRAP_DIST       = 2.0;
// Wake distance has to be well outside the blast, or the rune lights up under
// your feet and the tell may as well not exist.
export const TRAP_ARM_DIST   = 13;          // proximity that wakes a rune
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
export const FLOOR_BASE_MOBS   = 22;        // a sparse floor reads as unfinished
export const FLOOR_MOBS_STEP   = 6;
export const FLOOR_MAX_MOBS    = 70;
export const FLOOR_BASE_ITEMS  = 3;
export const FLOOR_MAX_ITEMS   = 7;
export const FLOOR_BASE_TRAPS  = 8;
export const FLOOR_TRAPS_STEP  = 3;
export const FLOOR_BASE_KEGS   = 5;
export const FLOOR_KEGS_STEP   = 2;
export const GUARDIAN_EVERY    = 3;         // a Guardian bars the stairs on these floors
export const DEPTH_ORB_STEP    = 0.15;      // multiplier: 1 + 0.15*(depth-1)
export const STAIRS_DIST       = 3.0;
/**
 * Extraction pays a share of everything hauled this run — and it is the ONLY
 * thing death takes away, since collected ORB is banked on pickup and never
 * clawed back (these are live mainnet players; confiscating earned currency
 * would be a nerf). That makes the stairwell a real wager: the deeper you are,
 * the bigger the bonus riding on surviving one more floor. With a flat
 * per-floor bonus the maths said "always descend" and the choice was fake.
 */
export const EXTRACT_SHARE     = 0.35;

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

// ═══════════════════════════════════════════════════════════════════════════
// GEAR — weapons and armour
// ═══════════════════════════════════════════════════════════════════════════
// A camp upgrade that reads "+10 damage" changes a number, not a decision, so
// nobody wants to buy it. Gear here changes HOW the fight goes: reach, rhythm,
// crowd control, whether you brawl or kite. Every piece is a trade, never a
// strict upgrade, so the choice survives after everything is unlocked.

export type WeaponId = 'runeblade' | 'cleaver' | 'fangs' | 'lance' | 'brand';

export type WeaponDef = {
  id: WeaponId;
  name: string;
  tagline: string;          // the playstyle in a few words
  dmg: number;
  cooldown: number;         // seconds between swings
  range: number;
  arcDeg: number;           // full width of the strike cone
  knockback: number;
  pierce?: boolean;         // hits every enemy in the cone, never stops at one
  burn?: number;            // damage per second applied on hit
  lifesteal?: number;       // HP returned per connect
  cost: number;             // ORB; 0 = owned from the start
  tier: 0 | 1 | 2 | 3 | 4;  // drives the rarity colour in the UI
};

export const WEAPONS: Record<WeaponId, WeaponDef> = {
  runeblade: {
    id: 'runeblade', name: 'RUNEBLADE', tagline: 'Balanced · the blade you start with',
    dmg: 50, cooldown: 0.4, range: 7, arcDeg: 120, knockback: 10,
    cost: 0, tier: 0,
  },
  fangs: {
    id: 'fangs', name: 'TWIN FANGS', tagline: 'Blistering speed · builds combo fast',
    dmg: 26, cooldown: 0.17, range: 5.5, arcDeg: 80, knockback: 4,
    lifesteal: 1, cost: 26000, tier: 1,
  },
  cleaver: {
    id: 'cleaver', name: 'ABYSS CLEAVER', tagline: 'Slow and brutal · clears crowds',
    dmg: 118, cooldown: 0.78, range: 8, arcDeg: 200, knockback: 26,
    cost: 42000, tier: 2,
  },
  lance: {
    id: 'lance', name: 'VOID LANCE', tagline: 'Long reach · skewers a whole line',
    dmg: 64, cooldown: 0.52, range: 13, arcDeg: 42, knockback: 8,
    pierce: true, cost: 68000, tier: 3,
  },
  brand: {
    id: 'brand', name: 'EMBER BRAND', tagline: 'Sets the Abyss alight · burns over time',
    dmg: 44, cooldown: 0.44, range: 7.5, arcDeg: 130, knockback: 9,
    burn: 26, cost: 96000, tier: 4,
  },
};

export type ArmorId = 'garb' | 'plate' | 'shadowweave' | 'aegis';

export type ArmorDef = {
  id: ArmorId;
  name: string;
  tagline: string;
  hpBonus: number;          // flat max HP
  speedMult: number;
  damageTaken: number;      // 1 = normal, 0.75 = takes a quarter less
  dashCdMult: number;
  cost: number;
  tier: 0 | 1 | 2 | 3 | 4;
};

export const ARMORS: Record<ArmorId, ArmorDef> = {
  garb: {
    id: 'garb', name: "SEEKER'S GARB", tagline: 'Plain cloth · nothing gained, nothing lost',
    hpBonus: 0, speedMult: 1, damageTaken: 1, dashCdMult: 1, cost: 0, tier: 0,
  },
  shadowweave: {
    id: 'shadowweave', name: 'SHADOWWEAVE', tagline: 'Fast and frail · dash almost at will',
    hpBonus: -25, speedMult: 1.22, damageTaken: 1.15, dashCdMult: 0.55, cost: 30000, tier: 1,
  },
  plate: {
    id: 'plate', name: 'IRONSCALE PLATE', tagline: 'Heavy shell · slow but hard to kill',
    hpBonus: 70, speedMult: 0.86, damageTaken: 0.78, dashCdMult: 1.25, cost: 48000, tier: 2,
  },
  aegis: {
    id: 'aegis', name: "WARDEN'S AEGIS", tagline: 'Runed guard · turns aside the worst blows',
    hpBonus: 30, speedMult: 0.95, damageTaken: 0.6, dashCdMult: 1.1, cost: 88000, tier: 4,
  },
};

// ═══════════════════════════════════════════════════════════════════════════
// RELICS — the in-run build
// ═══════════════════════════════════════════════════════════════════════════
// Shrines offer three, you take one, and they stack for the rest of the run.
// This is the reason to start another run: the gear is the same but the build
// never is. Effects are plain numbers so the simulation stays readable.

export type RelicId =
  | 'vampire' | 'glasscannon' | 'chain' | 'emberdash' | 'greed'
  | 'secondwind' | 'crit' | 'bulwark' | 'longreach' | 'swiftblade'
  | 'thorns' | 'hoard';

export type RelicDef = {
  id: RelicId;
  name: string;
  desc: string;
  tier: 1 | 2 | 3;
};

export const RELICS: Record<RelicId, RelicDef> = {
  vampire:     { id: 'vampire',     name: 'VAMPIRIC EDGE',  desc: 'Killing blows return 8 HP',                tier: 2 },
  glasscannon: { id: 'glasscannon', name: 'GLASS CANNON',   desc: '+55% damage dealt, +35% damage taken',     tier: 3 },
  chain:       { id: 'chain',       name: 'CHAIN LIGHTNING',desc: 'Hits arc to one more nearby enemy',        tier: 3 },
  emberdash:   { id: 'emberdash',   name: 'EMBER TRAIL',    desc: 'Dashing scorches what you pass through',   tier: 2 },
  greed:       { id: 'greed',       name: 'GREED',          desc: '+35% ORB from everything',                 tier: 2 },
  secondwind:  { id: 'secondwind',  name: 'SECOND WIND',    desc: 'A kill clears your dash cooldown',         tier: 2 },
  crit:        { id: 'crit',        name: "ASSASSIN'S MARK",desc: '20% of hits strike for triple damage',     tier: 3 },
  bulwark:     { id: 'bulwark',     name: 'BULWARK',        desc: '-22% damage taken',                        tier: 2 },
  longreach:   { id: 'longreach',   name: 'LONG REACH',     desc: '+40% weapon reach and arc',                tier: 1 },
  swiftblade:  { id: 'swiftblade',  name: 'SWIFT BLADE',    desc: '-25% time between swings',                 tier: 2 },
  thorns:      { id: 'thorns',      name: 'THORNS',         desc: 'Attackers take 30 damage back',            tier: 1 },
  hoard:       { id: 'hoard',       name: "MISER'S HOARD",  desc: '+18 max HP for every relic you hold',      tier: 1 },
};

export const RELIC_IDS = Object.keys(RELICS) as RelicId[];
export const SHRINE_DIST = 3.0;
export const SHRINE_CHOICES = 3;

/** Everything the relics add up to, recomputed whenever one is taken. */
export type RunMods = {
  dmgMult: number;
  takenMult: number;
  orbMult: number;
  lifestealKill: number;
  chain: number;
  emberDash: boolean;
  dashOnKill: boolean;
  critChance: number;
  reachMult: number;
  swingMult: number;
  thorns: number;
  hpBonus: number;
};

export function computeMods(relics: RelicId[]): RunMods {
  const m: RunMods = {
    dmgMult: 1, takenMult: 1, orbMult: 1, lifestealKill: 0, chain: 0,
    emberDash: false, dashOnKill: false, critChance: 0, reachMult: 1,
    swingMult: 1, thorns: 0, hpBonus: 0,
  };
  for (const id of relics) {
    switch (id) {
      case 'vampire':     m.lifestealKill += 8; break;
      case 'glasscannon': m.dmgMult *= 1.55; m.takenMult *= 1.35; break;
      case 'chain':       m.chain += 1; break;
      case 'emberdash':   m.emberDash = true; break;
      case 'greed':       m.orbMult *= 1.35; break;
      case 'secondwind':  m.dashOnKill = true; break;
      case 'crit':        m.critChance += 0.2; break;
      case 'bulwark':     m.takenMult *= 0.78; break;
      case 'longreach':   m.reachMult *= 1.4; break;
      case 'swiftblade':  m.swingMult *= 0.75; break;
      case 'thorns':      m.thorns += 30; break;
      case 'hoard':       break;   // resolved below, needs the final count
    }
  }
  const hoards = relics.filter(r => r === 'hoard').length;
  if (hoards) m.hpBonus += 18 * relics.length * hoards;
  return m;
}

/** The gear a seeker walks in with. */
export type Loadout = { weapon: WeaponId; armor: ArmorId };

// ═══════════════════════════════════════════════════════════════════════════
// ABYSS PACTS — the signature mechanic
// ═══════════════════════════════════════════════════════════════════════════
// The menu has always promised "descend, and it remembers". This makes that
// literal: power can be borrowed mid-fight at any moment, and every loan puts
// a Collector on the floor that walks toward you for the rest of the run and
// follows you down the stairs. The cost is not a stat, it is a pursuer — so
// greed turns into a chase instead of a number.

export type PactId = 'blood' | 'fury' | 'sight' | 'ghost';

export type PactDef = { id: PactId; name: string; desc: string };

export const PACTS: Record<PactId, PactDef> = {
  blood: { id: 'blood', name: 'PACT OF BLOOD',  desc: 'Healed to full, here and now' },
  fury:  { id: 'fury',  name: 'PACT OF FURY',   desc: 'Double damage for 30 seconds' },
  sight: { id: 'sight', name: 'PACT OF SIGHT',  desc: 'The whole floor laid bare' },
  ghost: { id: 'ghost', name: 'PACT OF GHOSTS', desc: 'Rise once from your own death' },
};
export const PACT_IDS = Object.keys(PACTS) as PactId[];

export const PACT_COOLDOWN    = 12;     // s between pacts, so it is not spammed
export const PACT_OFFER       = 3;      // choices shown
export const FURY_TIME        = 30;
export const FURY_MULT        = 2;

export const COLLECTOR_HP      = 900;   // effectively unkillable; hits stagger
export const COLLECTOR_SPEED   = 4.4;   // base, before debt and depth scaling
export const COLLECTOR_SPEED_PER_DEBT = 0.5;
export const COLLECTOR_SPEED_PER_FLOOR = 0.22;
export const COLLECTOR_DMG     = 26;
export const COLLECTOR_ORB_TOLL= 0.12;  // share of run ORB taken on contact
export const COLLECTOR_STAGGER = 1.6;   // s of stun a solid hit buys you
export const COLLECTOR_ATK_CD  = 1.8;
/**
 * Collectors get their own pathfinding, because the shared one cannot serve
 * them: `flow` is deliberately bounded to FLOW_RADIUS cells so ordinary
 * monsters cost nothing, and a Collector spawns at the far edge of the floor —
 * far outside it. On the bounded field it would fall back to straight-line
 * steering, press into the first wall and never arrive, which would quietly
 * void the one promise the mechanic makes: it always knows the way. So this
 * field floods the whole grid, and it only runs while a debt is outstanding.
 */
export const COLLECTOR_FLOW_INTERVAL = 0.5;

/** ORB demanded to settle the debt at a stairwell. */
export function settleCost(debt: number, depth: number): number {
  return Math.round(debt * (900 + 260 * depth));
}
/** Share of the haul the Abyss keeps if you extract still owing. */
export function unpaidPenalty(debt: number): number {
  return Math.min(0.75, debt * 0.15);
}
/** Ceiling on everything the Abyss can seize — extraction never pays negative. */
export const TOLL_CAP = 0.9;

/**
 * What a Collector actually seizes is the extraction bonus, never ORB already
 * banked. Picked-up ORB is granted the moment it is touched and is never
 * clawed back (see the descent notes above — these are live players and the
 * currency is real to them). So the debt bites where death already bites: the
 * payout riding on surviving, which keeps the wager honest and the rule intact.
 */
export function tollShare(run: RunState): number {
  return Math.min(TOLL_CAP, run.toll + unpaidPenalty(run.debt));
}
/** ORB actually handed over on extraction, after the Abyss takes its share. */
export function extractBonus(run: RunState): number {
  return Math.round(run.runOrb * EXTRACT_SHARE * (1 - tollShare(run)));
}

/** How fast the Collectors walk right now — debt and depth both wind them up. */
export function collectorSpeed(run: RunState): number {
  return COLLECTOR_SPEED
       + COLLECTOR_SPEED_PER_DEBT  * Math.max(0, run.debt - 1)
       + COLLECTOR_SPEED_PER_FLOOR * (run.depth - 1);
}

/**
 * The three pacts put on the table. Offers that would do nothing are dropped —
 * a full-health seeker is not tempted by healing, and a floor already laid bare
 * has nothing left to reveal — so the choice is never padded with a dud.
 */
export function rollPactOffer(run: RunState): PactId[] {
  const useful = PACT_IDS.filter(id => {
    if (id === 'ghost' && run.ghost) return false;
    if (id === 'sight' && run.sighted) return false;
    if (id === 'blood' && run.player.hp >= run.maxHp) return false;
    if (id === 'fury'  && run.clock < run.furyUntil) return false;
    return true;
  });
  const pool = useful.length ? useful.slice() : PACT_IDS.slice();
  const out: PactId[] = [];
  for (let i = 0; i < PACT_OFFER && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

// ── Types ─────────────────────────────────────────────────────────────────────
export type Vec2 = { x: number; z: number };

export type MonsterType = 'brute' | 'normal' | 'guardian' | 'collector';

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
  windup: number;          // seconds left of the attack tell (0 = not winding up)
  burn: number;            // seconds of burning left (Ember Brand / Ember Trail)
  burnDps: number;         // damage per second while burning
  stagger: number;         // Collector only: seconds it stays rooted after a hit
  // Guardian-only fight state (ignored by regular monsters)
  phase: number;           // 1 → 3, escalates as its HP drops
  slamAt: number;          // run-clock time the next slam lands (0 = not winding up)
  lastSlam: number;
  lastSummon: number;
};

/** ORB payout / contact damage for a monster type. */
export function rewardFor(t: MonsterType): number {
  if (t === 'collector') return 0;          // it cannot die, so it never pays
  return t === 'guardian' ? GUARDIAN_REWARD : t === 'brute' ? BRUTE_REWARD : NORMAL_REWARD;
}
export function dmgFor(t: MonsterType): number {
  if (t === 'collector') return COLLECTOR_DMG;
  return t === 'guardian' ? GUARDIAN_DMG : t === 'brute' ? BRUTE_DMG : NORMAL_DMG;
}
export function monsterName(t: MonsterType): string {
  if (t === 'collector') return 'The Collector';
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

/** A relic shrine: walk into it and it offers three, you keep one. */
export type Shrine = { id: number; pos: Vec2; taken: boolean; offer: RelicId[] };

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
  // Second, unbounded field — Collectors only, and only while you owe
  cflow: Uint16Array;
  cflowAt: number;
  hitstop: number;         // seconds the world stays frozen after an impact
  combo: number;           // consecutive hits landed inside COMBO_WINDOW
  comboAt: number;         // run-clock time of the last landed hit
  shockwaves: Shockwave[]; // expanding rings from Guardian slams (render + FX)
  // ── gear and build ──
  weapon: WeaponDef;
  armor: ArmorDef;
  relics: RelicId[];
  mods: RunMods;
  shrines: Shrine[];       // relic offers standing on this floor
  // ── the debt owed to the Abyss ──
  debt: number;            // pacts struck and not yet settled
  pactsStruck: number;     // total this run, for the summary — settling never lowers it
  pactCd: number;          // seconds until another pact may be struck
  furyUntil: number;       // run-clock time a Fury pact expires
  ghost: boolean;          // a Ghost pact is holding one death in reserve
  sighted: boolean;        // a Sight pact has revealed this floor
  toll: number;            // share of the extraction bonus already seized on contact
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
 * The Collectors' field: the same flood, unbounded, over the whole floor. No
 * radius cap, so there is nowhere on the map a Collector cannot path from.
 * Rebuilt on its own slower cadence and only while a debt stands, so a run
 * with no pacts pays nothing for it.
 */
export function rebuildCollectorFlow(run: RunState) {
  const { gridW, gridH, grid, cflow } = run;
  cflow.fill(FLOW_UNREACHED);
  const { cx, cz } = worldToCell(run.player.pos.x, run.player.pos.z, gridW, gridH);
  if (cx < 0 || cz < 0 || cx >= gridW || cz >= gridH) return;

  const queue = new Int32Array(gridW * gridH);
  let head = 0, tail = 0;
  cflow[cz * gridW + cx] = 0;
  queue[tail++] = cz * gridW + cx;

  while (head < tail) {
    const idx = queue[head++];
    const d = cflow[idx];
    const y = (idx / gridW) | 0, x = idx - y * gridW;
    for (let k = 0; k < 4; k++) {
      const nx = x + (k === 0 ? 1 : k === 1 ? -1 : 0);
      const ny = y + (k === 2 ? 1 : k === 3 ? -1 : 0);
      if (nx <= 0 || ny <= 0 || nx >= gridW - 1 || ny >= gridH - 1) continue;
      if (grid[ny][nx] === 1) continue;
      const nidx = ny * gridW + nx;
      if (cflow[nidx] !== FLOW_UNREACHED) continue;
      cflow[nidx] = d + 1;
      if (tail < queue.length) queue[tail++] = nidx;
    }
  }
}

/**
 * Direction a monster should walk to close on the player, following the flow
 * field. Returns null when the player is unreachable or already adjacent, in
 * which case the caller falls back to steering straight at them.
 */
function flowStep(run: RunState, pos: Vec2, field: Uint16Array = run.flow): Vec2 | null {
  const { gridW, gridH } = run;
  const { cx, cz } = worldToCell(pos.x, pos.z, gridW, gridH);
  if (cx <= 0 || cz <= 0 || cx >= gridW - 1 || cz >= gridH - 1) return null;
  const here = field[cz * gridW + cx];
  if (here === FLOW_UNREACHED || here === 0) return null;

  let bestD = here, bx = cx, bz = cz;
  for (let k = 0; k < 4; k++) {
    const nx = cx + (k === 0 ? 1 : k === 1 ? -1 : 0);
    const nz = cz + (k === 2 ? 1 : k === 3 ? -1 : 0);
    const v = field[nz * gridW + nx];
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
export function createRun(
  upgrades?: Partial<LabyrinthUpgrades>,
  loadout?: Partial<Loadout>,
): RunState {
  // Clamp each axis to a valid table index; omitted axes fall back to level 0,
  // so `createRun()` behaves exactly as before the camp existed.
  const lv = (n: number | undefined) =>
    Math.max(0, Math.min(UPGRADE_MAX_LEVEL, Math.floor(n ?? 0)));
  // Gear layers on top of the camp: the camp raises your floor, the weapon and
  // armour decide how the fight actually plays.
  const weapon = WEAPONS[loadout?.weapon ?? 'runeblade'] ?? WEAPONS.runeblade;
  const armor  = ARMORS[loadout?.armor ?? 'garb'] ?? ARMORS.garb;
  const maxHp      = Math.max(30, MAX_HP_LEVELS[lv(upgrades?.vigor)] + armor.hpBonus);
  const moveSpeed  = SPEED_LEVELS[lv(upgrades?.speed)] * armor.speedMult;
  // The camp's blade levels now read as a bonus on top of the weapon, so a
  // maxed camp still matters whichever weapon you carry.
  const attackDmg  = Math.round(
    weapon.dmg * (1 + (SWORD_DMG_LEVELS[lv(upgrades?.blade)] - SWORD_DMG_LEVELS[0]) / 100));
  const torchCells = TORCH_LEVELS[lv(upgrades?.torch)]
                   + (upgrades?.lantern ? LANTERN_TORCH_BONUS : 0);
  const emberLv    = lv(upgrades?.ember);

  const level = buildLevel(1);

  return {
    ...level,
    weapon, armor,
    relics: [],
    mods: computeMods([]),
    debt: 0,
    pactsStruck: 0,
    pactCd: 0,
    furyUntil: -99,
    ghost: false,
    sighted: false,
    toll: 0,
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
    hitstop: 0,
    combo: 0,
    comboAt: -99,
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
  'explored' | 'flow' | 'flowAt' | 'cflow' | 'cflowAt' | 'shrines'>;

/** Pick `n` distinct relics the seeker does not already carry. */
export function rollRelics(held: RelicId[], n: number): RelicId[] {
  const pool = RELIC_IDS.filter(id => !held.includes(id));
  const out: RelicId[] = [];
  for (let i = 0; i < n && pool.length; i++) {
    out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0]);
  }
  return out;
}

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
      windup: 0, burn: 0, burnDps: 0, stagger: 0, phase: 1, slamAt: 0, lastSlam: 0, lastSummon: 0,
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
      windup: 0, burn: 0, burnDps: 0, stagger: 0, phase: 1, slamAt: 0, lastSlam: 0, lastSummon: 0,
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
    // One shrine per floor; the offer is rolled when the floor is built and
    // filtered against what the seeker already holds at pickup time.
    shrines: [{ id: depth, pos: emptyPos(), taken: false, offer: [] }],
    portalActive: false,
    portalPos: { x: 0, z: 0 },
    depth,
    orbMult: plan.orbMult,
    stairsPos: farPos(),
    stairsLocked: plan.guardian,
    explored: Array.from({ length: gridH }, () => Array(gridW).fill(0)),
    flow: new Uint16Array(gridW * gridH).fill(FLOW_UNREACHED),
    flowAt: -1,
    cflow: new Uint16Array(gridW * gridH).fill(FLOW_UNREACHED),
    cflowAt: -1,
  };
}

// ═══════════════════════════════════════════════════════════════════════════
// Pacts — striking them, and the Collectors they put on your heels
// ═══════════════════════════════════════════════════════════════════════════

let collectorSeq = 5000;

/** The empty cell furthest from the seeker — where a Collector steps in. */
function farthestFrom(run: RunState, from: Vec2): Vec2 {
  let best: Vec2 | null = null;
  let bestD = -1;
  for (let cz = 1; cz < run.gridH - 1; cz++) {
    for (let cx = 1; cx < run.gridW - 1; cx++) {
      if (run.grid[cz][cx] === 1) continue;
      const w = cellToWorld(cx, cz, run.gridW, run.gridH);
      const d = (w.x - from.x) ** 2 + (w.z - from.z) ** 2;
      if (d > bestD) { bestD = d; best = w; }
    }
  }
  return best ?? { x: 0, z: 0 };
}

/** Put one Collector on the current floor, at the far edge, already walking. */
export function spawnCollector(run: RunState) {
  run.monsters.push({
    id: collectorSeq++,
    pos: farthestFrom(run, run.player.pos),
    hp: COLLECTOR_HP, maxHp: COLLECTOR_HP,
    type: 'collector', variant: 0,
    speed: COLLECTOR_SPEED,
    dead: false, lastAttack: 0, damageFlash: 0,
    knockback: { x: 0, z: 0 },
    windup: 0, burn: 0, burnDps: 0, stagger: 0,
    phase: 1, slamAt: 0, lastSlam: 0, lastSummon: 0,
  });
}

export function collectorCount(run: RunState): number {
  return run.monsters.reduce((n, m) => n + (m.type === 'collector' && !m.dead ? 1 : 0), 0);
}

/**
 * Borrow power from the Abyss. The effect lands instantly and for free — the
 * price is a Collector that starts walking toward you from across the floor
 * and does not stop for the rest of the run.
 */
export function strikePact(run: RunState, id: PactId, ev: SimEvents) {
  const p = run.player;
  run.debt += 1;
  run.pactsStruck += 1;
  run.pactCd = PACT_COOLDOWN;

  switch (id) {
    case 'blood':
      p.hp = run.maxHp;
      ev.setHp(p.hp);
      addFloat(run, p.pos.x, p.pos.z, 'WHOLE AGAIN', '#f87171');
      spawnBurst(run, p.pos.x, p.pos.z, '#ef4444', 26, 11);
      break;
    case 'fury':
      run.furyUntil = run.clock + FURY_TIME;
      addFloat(run, p.pos.x, p.pos.z, `×${FURY_MULT} DAMAGE`, '#fb923c');
      spawnBurst(run, p.pos.x, p.pos.z, '#fb923c', 26, 13);
      break;
    case 'sight':
      run.sighted = true;
      for (let z = 0; z < run.gridH; z++) run.explored[z].fill(1);
      addFloat(run, p.pos.x, p.pos.z, 'THE FLOOR LAID BARE', '#22d3ee');
      spawnBurst(run, p.pos.x, p.pos.z, '#22d3ee', 22, 10);
      break;
    case 'ghost':
      run.ghost = true;
      addFloat(run, p.pos.x, p.pos.z, 'ONE DEATH HELD', '#a78bfa');
      spawnBurst(run, p.pos.x, p.pos.z, '#a78bfa', 26, 11);
      break;
  }

  spawnCollector(run);
  // Path it now rather than on the next scheduled rebuild — the first half
  // second of a Collector's walk is the one the player is watching.
  rebuildCollectorFlow(run);
  run.cflowAt = run.clock;
  run.shake = Math.max(run.shake, 11);
  ev.setMsg(`${PACTS[id].name} · THE ABYSS SENDS A COLLECTOR`);
  ev.playSound('crit');
}

/**
 * Pay the debt off at a stairwell. Returns false when the purse is short, so
 * the UI can keep the button honest instead of half-charging the player.
 */
export function settleDebt(run: RunState, purse: number): boolean {
  const cost = settleCost(run.debt, run.depth);
  if (run.debt <= 0 || purse < cost) return false;
  run.debt = 0;
  // Collectors are the debt made flesh — clearing the ledger dismisses them.
  for (const m of run.monsters) if (m.type === 'collector') m.dead = true;
  return true;
}

/**
 * Take the stairs down. The seeker keeps HP, ORB, kills and camp upgrades;
 * everything about the place is rebuilt one step deeper and nastier — and
 * every unsettled debt walks in behind you, one Collector per pact.
 */
export function descendFloor(run: RunState) {
  const debt = run.debt;
  const level = buildLevel(run.depth + 1);
  Object.assign(run, level);
  run.player.pos = { x: 0, z: 0 };
  run.player.isDashing = false;
  run.player.dashTime = 0;
  run.shockwaves.length = 0;
  run.particles.length = 0;
  run.floats.length = 0;
  run.shake = 0;
  run.sighted = false;             // a new floor is dark again
  for (let i = 0; i < debt; i++) spawnCollector(run);
  if (debt > 0) { rebuildCollectorFlow(run); run.cflowAt = run.clock; }
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

  // Hitstop: hold the whole world still for a few frames after an impact. The
  // renderer keeps drawing, so a blow reads as a jolt rather than a number
  // quietly changing. Nothing else in the frame runs while it is active.
  if (r.hitstop > 0) {
    r.hitstop = Math.max(0, r.hitstop - dt);
    return;
  }

  r.clock += dt;
  // the combo lapses if you stop pressing the attack
  if (r.combo > 0 && r.clock - r.comboAt > COMBO_WINDOW) r.combo = 0;

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
  if (r.pactCd > 0) {
    r.pactCd = Math.max(0, r.pactCd - dt);
    if (r.pactCd === 0) ev.setMsg('The Abyss will bargain again');
  }
  // Fury lapsing is worth announcing — the damage number silently halving
  // otherwise reads as the game cheating you.
  if (r.furyUntil > 0 && r.clock >= r.furyUntil && r.clock - dt < r.furyUntil) {
    ev.setMsg('THE FURY FADES');
  }

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
          m.damageFlash = 0.5;
          const kb = { x: m.pos.x - b.pos.x, z: m.pos.z - b.pos.z };
          const kl = Math.sqrt(kb.x * kb.x + kb.z * kb.z) || 1;
          m.knockback = { x: (kb.x / kl) * 20, z: (kb.z / kl) * 20 };
          // A keg buys time against a Collector, never a kill
          if (m.type === 'collector') { m.stagger = Math.max(m.stagger, COLLECTOR_STAGGER); continue; }
          m.hp -= BARREL_MONSTER_DMG;
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

        // A Collector cannot be killed, only bought off in seconds. The blade
        // roots it where it stands — that stagger IS the reward for turning
        // and swinging, and it is the only way to open a gap.
        if (m.type === 'collector') {
          m.stagger = COLLECTOR_STAGGER;
          m.damageFlash = 0.3;
          m.knockback = { x: p.dir.x * 8, z: p.dir.z * 8 };
          hit = true;
          r.shake = Math.max(r.shake, 5);
          addFloat(r, m.pos.x, m.pos.z, 'STAGGERED', '#c4b5fd');
          spawnBurst(r, m.pos.x, m.pos.z, '#a78bfa', 14, 10);
          continue;
        }

        // combo scales the blow; it only builds while you keep connecting,
        // and a Fury pact doubles whatever it works out to
        const fury = r.clock < r.furyUntil ? FURY_MULT : 1;
        const dmg = Math.round(r.attackDmg * (1 + r.combo * COMBO_STEP) * fury);
        m.hp -= dmg;
        m.damageFlash = 0.22;
        const kbForce = m.type === 'guardian' ? 2 : m.type === 'brute' ? 6 : KNOCKBACK_FORCE;
        m.knockback = { x: p.dir.x * kbForce, z: p.dir.z * kbForce };
        hit = true;
        r.shake = Math.max(r.shake, 3);                 // every clean hit thumps
        addFloat(r, m.pos.x, m.pos.z, String(dmg), r.combo > 0 ? '#fde047' : '#ffffff');
        spawnBurst(r, m.pos.x, m.pos.z, '#fca5a5', 10, 9);
        spawnBurst(r, m.pos.x, m.pos.z, '#ffffff', 4, 12);   // bright impact flash
        if (m.hp <= 0) {
          m.dead = true; r.kills += 1;
          r.hitstop = Math.max(r.hitstop, HITSTOP_KILL);   // kills hit harder
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
      if (hit) {
        // land the blow: freeze briefly, then bank the combo
        r.hitstop = Math.max(r.hitstop, HITSTOP_HIT);
        r.combo = Math.min(COMBO_MAX, r.combo + 1);
        r.comboAt = r.clock;
        if (r.combo >= 2) ev.setMsg(`COMBO ×${r.combo} · +${Math.round(r.combo * COMBO_STEP * 100)}% damage`);
      } else {
        r.combo = 0;                                  // a whiff drops the chain
      }
      ev.playSound(hit ? 'crit' : 'tap');
    }
  }

  // ── pathfinding refresh ──
  if (r.clock - r.flowAt >= FLOW_INTERVAL) {
    r.flowAt = r.clock;
    rebuildFlowField(r);
  }
  // The Collectors' whole-floor field — only while something is owed
  if (r.debt > 0 && r.clock - r.cflowAt >= COLLECTOR_FLOW_INTERVAL) {
    r.cflowAt = r.clock;
    rebuildCollectorFlow(r);
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

    // ── Collector: the debt, walking ──
    // No aggro range, no losing the trail, no death. It simply comes, and it
    // gets faster the more you owe and the deeper you are. The only levers are
    // the blade (buys seconds) and the stairwell (buys it off).
    if (m.type === 'collector') {
      if (m.stagger > 0) {
        m.stagger -= dt;
        // it strains against the stun, so the reprieve reads as temporary
        if (Math.random() < 0.35) spawnBurst(r, m.pos.x, m.pos.z, '#7c3aed', 1, 3);
      } else if (d > MONSTER_HIT_DIST * 0.8) {
        const spd = collectorSpeed(r);
        // its own unbounded field first; the bounded one is a fine shortcut
        // once it is close, and the straight line is only ever a last resort
        const step = flowStep(r, m.pos, r.cflow)
                  ?? flowStep(r, m.pos)
                  ?? { x: (p.pos.x - m.pos.x) / (d || 1), z: (p.pos.z - m.pos.z) / (d || 1) };
        const next = resolveWallCollision(
          r.grid, r.gridW, r.gridH,
          { x: m.pos.x + step.x * spd * dt, z: m.pos.z + step.z * spd * dt }, 1.0);
        m.pos = next;
      }
      // a slow violet drip so you can feel it closing even at the torch's edge
      if (Math.random() < dt * 6) spawnBurst(r, m.pos.x, m.pos.z, '#6d28d9', 1, 2);

      if (d <= MONSTER_HIT_DIST && r.clock - m.lastAttack > COLLECTOR_ATK_CD && !p.isDashing) {
        m.lastAttack = r.clock;
        p.hp -= COLLECTOR_DMG;
        ev.setHp(Math.max(0, p.hp));
        r.shake = Math.max(r.shake, 12);
        r.hitstop = Math.max(r.hitstop, HITSTOP_KILL);
        addFloat(r, p.pos.x, p.pos.z, `-${COLLECTOR_DMG}`, '#a78bfa');
        spawnBurst(r, p.pos.x, p.pos.z, '#7c3aed', 18, 10);
        ev.onHitFlash();
        ev.playSound('dead');
        // It takes its cut of what the run would have paid out — the banked
        // ORB in the purse is never touched.
        if (r.toll < TOLL_CAP) {
          r.toll = Math.min(TOLL_CAP, r.toll + COLLECTOR_ORB_TOLL);
          addFloat(r, p.pos.x, p.pos.z - 1.2, 'THE ABYSS TAKES ITS CUT', '#c4b5fd');
          ev.setMsg(`THE COLLECTOR TOUCHES YOU · ${Math.round(tollShare(r) * 100)}% of the bonus lost`);
        }
      }
      continue;
    }

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
            knockback: { x: 0, z: 0 }, windup: 0, burn: 0, burnDps: 0, stagger: 0,
            phase: 1, slamAt: 0, lastSlam: 0, lastSummon: 0,
          });
          spawnBurst(r, sp.x, sp.z, '#a855f7', 10, 8);
        }
        ev.setMsg('The Guardian calls the shades');
      }
    }

    // ── movement: follow the flow field, fall back to straight steering ──
    // Anything mid-swing roots itself so the tell stays readable and the
    // player can actually walk out of the strike.
    const rooted = m.windup > 0 || (m.type === 'guardian' && m.slamAt > 0);
    if (!rooted && d < MONSTER_AGGRO && d > MONSTER_HIT_DIST * 0.8) {
      const speed = m.type === 'guardian' && m.phase === 3 ? m.speed * 1.5 : m.speed;
      const step = flowStep(r, m.pos) ?? { x: (p.pos.x - m.pos.x) / d, z: (p.pos.z - m.pos.z) / d };
      let next = { x: m.pos.x + step.x * speed * dt, z: m.pos.z + step.z * speed * dt };
      next = resolveWallCollision(r.grid, r.gridW, r.gridH, next, 1.0);
      m.pos = next;
    }

    // ── attack: wind up in view, then strike ──
    // The Guardian keeps its own slam telegraph and skips this one.
    if (m.type !== 'guardian') {
      if (m.windup > 0) {
        m.windup -= dt;
        if (m.windup <= 0) {
          m.lastAttack = r.clock;
          // the blow lands where the monster is now — step out and it whiffs
          if (!p.isDashing && dist(m.pos, p.pos) <= MONSTER_HIT_DIST * 1.35) {
            const dmg = dmgFor(m.type);
            p.hp -= dmg;
            ev.setHp(Math.max(0, p.hp));
            r.shake = Math.max(r.shake, 5);
            r.hitstop = Math.max(r.hitstop, HITSTOP_HIT);
            addFloat(r, p.pos.x, p.pos.z, `-${dmg}`, '#ef4444');
            spawnBurst(r, p.pos.x, p.pos.z, '#ef4444', 8, 7);
            ev.onHitFlash();
            ev.playSound('dead');
          } else {
            spawnBurst(r, m.pos.x, m.pos.z, '#94a3b8', 5, 5);   // missed
          }
        }
      } else if (d <= MONSTER_HIT_DIST && r.clock - m.lastAttack > MONSTER_ATK_CD) {
        m.windup = m.type === 'brute' ? BRUTE_WINDUP : MONSTER_WINDUP;
      }
    } else if (d <= MONSTER_HIT_DIST && r.clock - m.lastAttack > MONSTER_ATK_CD) {
      m.lastAttack = r.clock;
      if (!p.isDashing) {
        const dmg = dmgFor(m.type);
        p.hp -= dmg;
        ev.setHp(Math.max(0, p.hp));
        r.shake = Math.max(r.shake, 9);
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
    // A Ghost pact spends itself first — it is borrowed, the Second Torch was
    // paid for at the camp, and nobody wants to burn the thing they bought
    // while a free save is still in hand.
    if (r.ghost) {
      r.ghost = false;
      p.hp = Math.max(1, Math.round(r.maxHp * 0.5));
      ev.setHp(p.hp);
      r.shake = Math.max(r.shake, 14);
      spawnBurst(r, p.pos.x, p.pos.z, '#a78bfa', 30, 14);
      spawnBurst(r, p.pos.x, p.pos.z, '#ffffff', 12, 9);
      addFloat(r, p.pos.x, p.pos.z, `+${p.hp}`, '#a78bfa');
      for (const m of r.monsters) {
        if (m.dead) continue;
        m.lastAttack = r.clock + 1.4;
        if (m.type === 'collector') m.stagger = Math.max(m.stagger, COLLECTOR_STAGGER);
        const d = dist(m.pos, p.pos);
        if (d < 14) {
          const ux = (m.pos.x - p.pos.x) / (d || 1);
          const uz = (m.pos.z - p.pos.z) / (d || 1);
          m.knockback = { x: ux * 22, z: uz * 22 };
        }
      }
      ev.setMsg('THE PACT OF GHOSTS PAYS OUT · YOU RISE');
      ev.playSound('levelup');
      ev.onHitFlash();
      return;
    }
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
