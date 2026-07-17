/**
 * Pixel-art sprites for the Abyss Labyrinth, authored as string art.
 *
 * Each sprite is an array of equal-width rows; every character maps to a color
 * in the sprite's palette ('.' / ' ' = transparent). The renderer draws each
 * pixel as a filled Skia rect, so sprites scale crisply (chunky = pixel art)
 * and can be recolored/flashed at draw time. Bigger grids = finer detail at
 * the same on-screen size.
 */
export type Sprite = { rows: string[]; pal: Record<string, string> };

// ── Seeker (player) — hooded blade-bearer, cyan eyes, flowing cloak ───────────
export const SEEKER: Sprite = {
  pal: {
    H: '#241046', // dark hood / self-outline
    h: '#5b21b6', // hood mid
    m: '#7c3aed', // cloak
    M: '#a855f7', // cloak highlight
    F: '#150a2e', // face shadow under the hood
    E: '#22d3ee', // glowing eyes
    r: '#c4b5fd', // torch rim-light
  },
  rows: [
    '.....HHHH.....',
    '...HHhhhhHH...',
    '.rHhhhhhhhhHH.',
    '.HhhFFFFFFhhH.',
    '.HhFEEFFEEFhH.',
    '.HhhFFFFFFhhH.',
    '.HhhhhhhhhhH..',
    '..HmmMMMMmmH..',
    '.HmMmmmmmmMmH.',
    '.rmMmmmmmmMmH.',
    '.HmMmmmmmmMmH.',
    '..HmMMMMMMmH..',
    '..HmmmmmmmmH..',
    '...Hmm..mmH...',
    '...HH....HH...',
  ],
};

// ── Shade (fast wisp) — tattered spectre, yellow eyes ─────────────────────────
export const SHADE: Sprite = {
  pal: { D: '#1e1b4b', d: '#312e81', Y: '#fde047', y: '#fef9c3' },
  rows: [
    '...DDDDDD...',
    '..DDddddDD..',
    '.DDddddddDD.',
    '.DddddddddD.',
    '.DdYYddYYdD.',
    '.DdyYddYYydD',
    '.DddddddddD.',
    '..DdddddddD.',
    '..dDddddDd..',
    '...dDddDd...',
    '...d.dd.d...',
    '....d..d....',
  ],
};

// ── Wraith (tall spectre) — teal ghost, hollow glowing eyes ───────────────────
export const WRAITH: Sprite = {
  pal: { G: '#064e3b', g: '#065f46', c: '#10b981', Y: '#a7f3d0' },
  rows: [
    '....GGGG....',
    '...GggggG...',
    '..GggggggG..',
    '.GgcggggcgG.',
    '.GgYYggYYgG.',
    '.GggggggggG.',
    '.GgcggggcgG.',
    '.GggggggggG.',
    '..GggggggG..',
    '..cGggggGc..',
    '...c.gg.c...',
    '....g..g....',
  ],
};

// ── Crawler (low brute) — squat red horror, many eyes + legs ──────────────────
export const CRAWLER: Sprite = {
  pal: { R: '#450a0a', r: '#7f1d1d', o: '#ea580c', Y: '#fca5a5' },
  rows: [
    '...RRRRRR...',
    '..RrrrrrrR..',
    '.RrrrrrrrrR.',
    '.RrYrrrrYrR.',
    '.RrrooorrrR.',
    '.RrrrrrrrrR.',
    'RRrrrrrrrrRR',
    'R.R.rrrr.R.R',
    'R...R..R...R',
  ],
};

// ── Brute (elite) — hulking red bruiser, horns, molten chest ──────────────────
export const BRUTE: Sprite = {
  pal: { R: '#3f0d0d', r: '#7f1d1d', k: '#1c0a0a', O: '#fb923c', o: '#f97316' },
  rows: [
    '.k..........k.',
    '.kk........kk.',
    '..kRRRRRRRRk..',
    '..RRRRRRRRRR..',
    '.RROOrrrrOORR.',
    '.RRRRRRRRRRRR.',
    '.RRrrrrrrrrRR.',
    '.RrrrrrrrrrrR.',
    '.RrroooooorrR.',
    '.RrrrrrrrrrrR.',
    '..RRrrrrrrRR..',
    '..RR.rrrr.RR..',
    '..RR......RR..',
    '.RRR......RRR.',
  ],
};

// ── Guardian (boss) — towering armoured sentinel with a burning cyan core ──────
export const GUARDIAN: Sprite = {
  pal: {
    k: '#0b0820', // outline
    A: '#1e1b4b', // armour dark
    a: '#3730a3', // armour
    s: '#6366f1', // armour highlight
    C: '#22d3ee', // core glow
    c: '#a5f3fc', // core hot
    O: '#f472b6', // eyes
  },
  rows: [
    '......kAAAAk......',
    '....kAAaaaaAAk....',
    '...kAaaaaaaaaAk...',
    '..kAaaOaaaaOaaAk..',
    '..kAasaaaaaasaAk..',
    '.kAaaaaaaaaaaaaAk.',
    '.kAaaaaCCCCaaaaAk.',
    '.kAaaaCCccCCaaaAk.',
    '.kAaaaCCccCCaaaAk.',
    '.kAaaaaCCCCaaaaAk.',
    '.ksaaaaaaaaaaaask.',
    '.kAssaaaaaaaassAk.',
    '..kAaaaaaaaaaaAk..',
    '..AaaaA....AaaaA..',
    '..AaaaA....AaaaA..',
    '..kAAk......kAAk..',
  ],
};

// ── Loot: artifact (cyan) and treasure (gold) — faceted, shinier gem ──────────
export const GEM: Sprite = {
  pal: { c: '#67e8f9', C: '#22d3ee', e: '#0e7490', w: '#ffffff', l: '#cffafe' },
  rows: [
    '....ww....',
    '..ccllcc..',
    '.cCllllCc.',
    'cCCllwlCCc',
    '.eCCllCCe.',
    '..eCCCCe..',
    '...eCCe...',
    '....ee....',
  ],
};
export const GEM_GOLD: Sprite = {
  pal: { c: '#fde68a', C: '#facc15', e: '#a16207', w: '#ffffff', l: '#fef9c3' },
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

/** Normal-monster sprite variants — indexed by `Monster.variant` for variety. */
export const SHADE_VARIANTS: Sprite[] = [SHADE, WRAITH, CRAWLER];

/** Longest row width of a sprite (for centering). */
export function spriteW(s: Sprite): number {
  return s.rows.reduce((m, r) => Math.max(m, r.length), 0);
}
