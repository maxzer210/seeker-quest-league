/**
 * Pixel-art sprites for the Abyss Labyrinth, authored as string art.
 *
 * Each sprite is an array of equal-width rows; every character maps to a color
 * in the sprite's palette ('.' / ' ' = transparent). The renderer draws each
 * pixel as a filled Skia rect, so sprites scale crisply (chunky = pixel art)
 * and can be recolored/flashed at draw time.
 */
export type Sprite = { rows: string[]; pal: Record<string, string> };

// ── Seeker (player) — hooded blade-bearer, cyan eyes ──────────────────────────
export const SEEKER: Sprite = {
  pal: { H: '#3b0f6b', h: '#6d28d9', b: '#8b5cf6', F: '#e9d5ff', E: '#22d3ee', B: '#a855f7' },
  rows: [
    '....HHHH....',
    '...HHHHHH...',
    '..HHHHHHHH..',
    '..HHFFFFHH..',
    '..HHEFFEHH..',
    '..HHFFFFHH..',
    '..HHHHHHHH..',
    '..HhhhhhhH..',
    '.HhhhbbhhhH.',
    '.HhhbBBbhhH.',
    '.HhhhBBhhhH.',
    '..HhhhhhhH..',
    '..hh....hh..',
    '..HH....HH..',
  ],
};

// ── Shade (normal monster) — dark wisp, yellow eyes ───────────────────────────
export const SHADE: Sprite = {
  pal: { D: '#312e81', d: '#1e1b4b', Y: '#fde047' },
  rows: [
    '....DDDD....',
    '...DDDDDD...',
    '..DDDDDDDD..',
    '.DDDDDDDDDD.',
    '.DDYYDDYYDD.',
    '.DDDDDDDDDD.',
    '.dDDDDDDDDd.',
    '..dDDDDDDd..',
    '..ddDDDDdd..',
    '...ddDDdd...',
    '...d.dd.d...',
    '....d..d....',
  ],
};

// ── Brute (elite monster) — hulking red, horns, orange eyes ───────────────────
export const BRUTE: Sprite = {
  pal: { R: '#7f1d1d', r: '#991b1b', k: '#1c0a0a', O: '#fb923c' },
  rows: [
    '.k..........k.',
    '.kk........kk.',
    '..kRRRRRRRRk..',
    '..RRRRRRRRRR..',
    '.RRRRRRRRRRRR.',
    '.RROORRRROORR.',
    '.RRRRRRRRRRRR.',
    '.RRRrrrrrrRRR.',
    '.RRrrrrrrrrRR.',
    '.RRrrrrrrrrRR.',
    '..RRrrrrrrRR..',
    '..RR.rrr..RR..',
    '..RR......RR..',
    '.RRR......RRR.',
  ],
};

// ── Loot: artifact (cyan) and treasure (gold) share a gem shape ───────────────
export const GEM: Sprite = {
  pal: { c: '#67e8f9', C: '#22d3ee', e: '#0e7490', w: '#ffffff' },
  rows: [
    '...ww...',
    '..cCCc..',
    '.cCCCCc.',
    'cCCwCCCc',
    '.eCCCCe.',
    '..eCCe..',
    '...ee...',
  ],
};
export const GEM_GOLD: Sprite = {
  pal: { c: '#fde68a', C: '#facc15', e: '#a16207', w: '#ffffff' },
  rows: GEM.rows,
};

// ── Barrel (explosive) ────────────────────────────────────────────────────────
export const BARREL: Sprite = {
  pal: { w: '#78350f', W: '#92400e', h: '#b45309', i: '#f59e0b', k: '#451a03' },
  rows: [
    '.kWWWWk.',
    'kWiWWiWk',
    'WWWWWWWW',
    'WhWWWWhW',
    'WWWWWWWW',
    'kWiWWiWk',
    'WWWWWWWW',
    'WhWWWWhW',
    'WWWWWWWW',
    'kWWWWWWk',
    '.kWWWWk.',
  ],
};

/** Longest row width of a sprite (for centering). */
export function spriteW(s: Sprite): number {
  return s.rows.reduce((m, r) => Math.max(m, r.length), 0);
}
