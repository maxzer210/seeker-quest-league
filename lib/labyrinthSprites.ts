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

// ── Collector (the debt made flesh) — faceless violet creditor in a long robe ──
// Deliberately NOT monstrous: no claws, no teeth, no eyes to plead with. It is
// taller and narrower than anything else on the floor, it carries the ledger
// chain, and it reads at a glance as "this one is not a fight".
export const COLLECTOR: Sprite = {
  pal: {
    k: '#160629', // outline / void
    V: '#2e1065', // robe dark
    v: '#4c1d95', // robe
    m: '#6d28d9', // robe highlight
    B: '#000000', // the hollow where a face should be
    g: '#a78bfa', // sigil glow
    G: '#ddd6fe', // sigil hot
  },
  rows: [
    '....kkVVkk....',
    '...kVVvvVVk...',
    '..kVvBBBBvVk..',
    '..kVBBBBBBVk..',
    '..kVBBGGBBVk..',
    '..kVvBBBBvVk..',
    '..kVvvvvvvVk..',
    '.kVvvmggmvvVk.',
    '.kVvvmGGmvvVk.',
    '.kVvvmggmvvVk.',
    '.kVvvvvvvvvVk.',
    '.kVvvvvvvvvVk.',
    '.kVVvvvvvvVVk.',
    '..kVVvvvvVVk..',
    '..kVVVVVVVVk..',
    '...kkVVVVkk...',
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

// ═════════════════════════════════════════════════════════════════════════════
// DUNGEON SET DRESSING — small props scattered deterministically over the maze.
// An empty corridor reads as a prototype; bones, rubble and banners read as a
// place someone died in. Drawn by the renderer from a grid hash, so they cost
// no state and never move between frames.
// ═════════════════════════════════════════════════════════════════════════════

// ── Skull lying on the floor ──────────────────────────────────────────────────
export const PROP_SKULL: Sprite = {
  pal: { b: '#cbc4b0', B: '#e8e2d2', k: '#1a1524', s: '#8a8272' },
  rows: [
    '.kbbbbk.',
    'kbBBBBbk',
    'bBBBBBBb',
    'bBkkBkkb',
    'bBBBBBBb',
    '.bBsbsBb',
    '.kbsbsbk',
    '..kkkkk.',
  ],
};

// ── Scattered bones ───────────────────────────────────────────────────────────
export const PROP_BONES: Sprite = {
  pal: { b: '#b8b1a0', B: '#ddd6c4', k: '#1a1524' },
  rows: [
    '.B..k...B.',
    'BbB.kb.BbB',
    '.B.kbk..B.',
    '..kbk.....',
    '.Bbk...BbB',
    'BbB...kB..',
  ],
};

// ── Rubble — broken masonry ───────────────────────────────────────────────────
export const PROP_RUBBLE: Sprite = {
  pal: { d: '#241a44', m: '#3a2e5e', l: '#4a3a7a', k: '#120e22' },
  rows: [
    '...kmk....',
    '..kmllmk..',
    '.kmlllmdk.',
    'kdmllmddmk',
    'kddmmdddmk',
    '.kkdddkkk.',
  ],
};

// ── Wall banner — tattered heraldic cloth ─────────────────────────────────────
export const PROP_BANNER: Sprite = {
  pal: { k: '#0f0a1e', r: '#4c1d95', R: '#6d28d9', g: '#a16207', G: '#facc15' },
  rows: [
    'kgGGGGgk',
    'krRRRRrk',
    'krRRRRrk',
    'krRGGRrk',
    'krRGGRrk',
    'krRRRRrk',
    'krRRRRrk',
    '.krRRrk.',
    '.krRRrk.',
    '..k.k.k.',
  ],
};

// ── Wall chain — rusted hanging links ─────────────────────────────────────────
export const PROP_CHAIN: Sprite = {
  pal: { k: '#0f0a1e', m: '#57534e', l: '#8b8378' },
  rows: [
    '.klk.',
    '.kmk.',
    '.klk.',
    '.kmk.',
    '.klk.',
    '.kmk.',
    'klmlk',
    '.kkk.',
  ],
};

// ── Glowing cave mushroom — a cold light accent on the floor ──────────────────
export const PROP_SHROOM: Sprite = {
  pal: { k: '#0b1a1e', c: '#0e7490', C: '#22d3ee', l: '#a5f3fc', s: '#164e63' },
  rows: [
    '..kCCk..',
    '.kCllCk.',
    'kCllllCk',
    'kCCllCCk',
    '.kcCCck.',
    '..ksck..',
    '..ksck..',
    '..kkkk..',
  ],
};

/** Floor clutter, indexed by a per-cell hash in the renderer. */
export const FLOOR_PROPS: Sprite[] = [PROP_BONES, PROP_RUBBLE, PROP_SKULL, PROP_RUBBLE, PROP_SHROOM];

// ═════════════════════════════════════════════════════════════════════════════
// UI ICON SPRITES — hand-authored pixel icons for the RPG chrome.
// The labyrinth UI never uses OS emoji: every button, chip, stat card and
// upgrade card renders one of these through <PixelIcon> (components/LabyrinthUI).
// Rule: every row of a sprite MUST have the same width (validated offline).
// ═════════════════════════════════════════════════════════════════════════════

// ── Sword — upright runeblade, gold crossguard, violet grip ───────────────────
export const ICON_SWORD: Sprite = {
  pal: {
    k: '#0b0820', b: '#cbd5e1', B: '#f1f5f9',
    g: '#facc15', G: '#b45309', h: '#7c3aed', p: '#a855f7', P: '#e9d5ff',
  },
  rows: [
    '......b......',
    '.....kbB.....',
    '.....kbB.....',
    '.....kbB.....',
    '.....kbB.....',
    '.....kbB.....',
    '....kkbBk....',
    '.ggkkkbBkkgg.',
    '..gggGgGggg..',
    '.....khk.....',
    '.....khk.....',
    '....kpPpk....',
    '.....kpk.....',
  ],
};

// ── Boot — swift greave, cyan leather ─────────────────────────────────────────
export const ICON_BOOT: Sprite = {
  pal: { k: '#0b0820', c: '#0e7490', C: '#22d3ee', s: '#164e63' },
  rows: [
    '...kkkk.....',
    '...kcCck....',
    '...kcCck....',
    '...kcCck....',
    '...kcCck....',
    '...kcCckk...',
    '...kcCccck..',
    '..kkcCcccck.',
    '.kccccccccck',
    '.kkkkkkkkkk.',
    '.ssssssssss.',
  ],
};

// ── Torch — wall-brand with a warm flame ──────────────────────────────────────
export const ICON_TORCH: Sprite = {
  pal: { w: '#ff9a3c', W: '#ffcf6a', F: '#ffe6a0', f: '#fffbeb', k: '#0b0820', h: '#92400e' },
  rows: [
    '....wWw....',
    '...wWFWw...',
    '...WFfFW...',
    '...wWFWw...',
    '....kkk....',
    '....khk....',
    '....khk....',
    '....khk....',
    '....khk....',
    '...kkhkk...',
  ],
};

// ── Heart aflame — abyssal vigor ──────────────────────────────────────────────
export const ICON_HEART: Sprite = {
  pal: { k: '#0b0820', R: '#dc2626', r: '#fda4af', O: '#fb923c', o: '#fef3c7' },
  rows: [
    '.kkk....kkk.',
    'kRRRk..kRRRk',
    'kRrRRkkRRrRk',
    'kRRRRRRRRRRk',
    'kRRROOORRRRk',
    '.kRROoORRRk.',
    '..kRROORRk..',
    '...kRRRRk...',
    '....kRRk....',
    '.....kk.....',
  ],
};

// ── Candle — the Second Torch (survive one lethal hit) ────────────────────────
export const ICON_CANDLE: Sprite = {
  pal: { f: '#fffbeb', w: '#ff9a3c', F: '#ffcf6a', k: '#0b0820', C: '#f472b6', c: '#fbcfe8', G: '#b45309' },
  rows: [
    '.....f.....',
    '....wFw....',
    '....wFw....',
    '.....k.....',
    '...kCcCk...',
    '...kCcCk...',
    '...kCCCk...',
    '...kCcCk...',
    '...kCCCk...',
    '..kkCCCkk..',
    '..kGGGGGk..',
    '...kkkkk...',
  ],
};

// ── Trophy — golden chalice for the best run ──────────────────────────────────
export const ICON_TROPHY: Sprite = {
  pal: { k: '#0b0820', G: '#b45309', g: '#facc15', w: '#fef9c3' },
  rows: [
    '.kkkkkkkkkk.',
    '.kGggwgggGk.',
    '.kGggwgggGk.',
    '..kGggggGk..',
    '...kGggGk...',
    '....kGGk....',
    '.....kk.....',
    '....kggk....',
    '...kGggGk...',
    '..kGggggGk..',
    '..kkkkkkkk..',
  ],
};

// ── Star sparkle — artifacts ──────────────────────────────────────────────────
export const ICON_STAR: Sprite = {
  pal: { w: '#22d3ee', W: '#a5f3fc', f: '#ffffff' },
  rows: [
    '.....w.....',
    '.....W.....',
    '....wWw....',
    '.wWWWfWWWw.',
    '....wWw....',
    '.....W.....',
    '.....w.....',
  ],
};

// ── Skull — the Abyss claims you ──────────────────────────────────────────────
export const ICON_SKULL: Sprite = {
  pal: { k: '#0b0820', b: '#e7e5e4', r: '#f87171', t: '#78716c' },
  rows: [
    '....kkkkkkkk....',
    '..kkbbbbbbbbkk..',
    '..kbbbbbbbbbbk..',
    '.kbbbbbbbbbbbbk.',
    '.kbbkkkbbkkkbbk.',
    '.kbbkrkbbkrkbbk.',
    '.kbbkkkbbkkkbbk.',
    '.kbbbbbkkbbbbbk.',
    '..kbbbbbbbbbbk..',
    '..kbtbtbtbtbbk..',
    '...kkkkkkkkkk...',
  ],
};

// ── Portal swirl — escape / the way out ───────────────────────────────────────
export const ICON_PORTAL: Sprite = {
  pal: { c: '#0e7490', C: '#22d3ee', w: '#67e8f9', W: '#e0f2fe' },
  rows: [
    '.....cccccc.....',
    '...cc......cc...',
    '..c...CCCC...c..',
    '.c..CC....CC..c.',
    '.c..C..ww..C..c.',
    'c..C..wWWw..C..c',
    'c..C..wWWw..C..c',
    '.c..C..ww..C..c.',
    '.c..CC....CC..c.',
    '..c...CCCC...c..',
    '...cc......cc...',
    '.....cccccc.....',
  ],
};

// ── Tent — Seeker's Camp ──────────────────────────────────────────────────────
export const ICON_TENT: Sprite = {
  pal: { k: '#0b0820', f: '#facc15', p: '#9d174d', P: '#ec4899' },
  rows: [
    '.....kf.....',
    '.....kk.....',
    '....kpPk....',
    '...kpPPpk...',
    '..kpPPPPpk..',
    '..kpPkkPpk..',
    '.kpPPkkPPpk.',
    '.kpPPkkPPpk.',
    'kppPPkkPPppk',
    'kkkkkkkkkkkk',
  ],
};

// ── Lightning bolt — energy cost ──────────────────────────────────────────────
export const ICON_BOLT: Sprite = {
  pal: { k: '#78350f', E: '#fde047' },
  rows: [
    '.....kEE',
    '....kEE.',
    '...kEE..',
    '..kEEEEE',
    '....kEE.',
    '...kEE..',
    '..kEE...',
    '.kEE....',
    'kEE.....',
  ],
};

// ── Lock — feature gated / preview state ──────────────────────────────────────
export const ICON_LOCK: Sprite = {
  pal: { m: '#94a3b8', k: '#0b0820', s: '#64748b', K: '#0f172a' },
  rows: [
    '...mmmm...',
    '..mm..mm..',
    '..mm..mm..',
    '.kkkkkkkk.',
    '.kssssssk.',
    '.kssKKssk.',
    '.kssKKssk.',
    '.kssssssk.',
    '.kkkkkkkk.',
  ],
};

// ── Coin / ORB — the in-game currency ─────────────────────────────────────────
export const ICON_ORB: Sprite = {
  pal: { k: '#78350f', g: '#facc15', w: '#fef9c3', G: '#b45309', D: '#f59e0b' },
  rows: [
    '...kkkk...',
    '..kggggk..',
    '.kgwwgggk.',
    '.kggDDggk.',
    '.kggDDggk.',
    '.kgggggGk.',
    '..kggGGk..',
    '...kkkk...',
  ],
};

// ── Abyss Lantern — iron cage, spectral cyan flame (SOL premium) ──────────────
export const ICON_LANTERN: Sprite = {
  pal: { k: '#0b0820', G: '#475569', c: '#22d3ee', C: '#d9f9ff' },
  rows: [
    '.....kk.....',
    '....k..k....',
    '....kkkk....',
    '..kkGGGGkk..',
    '..kGccccGk..',
    '..kGcCCcGk..',
    '..kGcCCcGk..',
    '..kGccccGk..',
    '..kkGGGGkk..',
    '....kkkk....',
    '.....kk.....',
  ],
};

// ── Dash — double wind chevrons ───────────────────────────────────────────────
export const ICON_DASH: Sprite = {
  pal: { C: '#67e8f9' },
  rows: [
    '.CC....CC...',
    '..CC....CC..',
    '...CC....CC.',
    '....CC....CC',
    '...CC....CC.',
    '..CC....CC..',
    '.CC....CC...',
  ],
};

// ── Pact — a broken chain link, the bargain and its price in one mark ─────────
export const ICON_PACT: Sprite = {
  pal: { v: '#7c3aed', g: '#a78bfa', G: '#ddd6fe' },
  rows: [
    '..GGg....gGG',
    '.Gv..v..v..v',
    '.g....v.v...',
    '.v.....v....',
    '.v....v.....',
    '.g...v.v....',
    '.Gv.v..v..v.',
    '..GGg....gGG',
  ],
};

// ── Debt — the Collector's mark, worn by the HUD chip while you owe ───────────
export const ICON_DEBT: Sprite = {
  pal: { v: '#6d28d9', g: '#a78bfa', G: '#ede9fe' },
  rows: [
    '...vvvvvv...',
    '..vggggggv..',
    '.vg.GGGG.gv.',
    '.vgG.gg.Ggv.',
    '.vg.G..G.gv.',
    '.vgG.gg.Ggv.',
    '..vggggggv..',
    '...vvvvvv...',
  ],
};

/** Normal-monster sprite variants — indexed by `Monster.variant` for variety. */
export const SHADE_VARIANTS: Sprite[] = [SHADE, WRAITH, CRAWLER];

/** Longest row width of a sprite (for centering). */
export function spriteW(s: Sprite): number {
  return s.rows.reduce((m, r) => Math.max(m, r.length), 0);
}
