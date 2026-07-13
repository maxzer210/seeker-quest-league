/**
 * ABYSS LABYRINTH — 2D pixel-art dungeon crawler (Skia renderer).
 *
 * The 3D expo-gl build rendered black on the emulator (EGL_BAD_MATCH), so this
 * is a top-down 2.5D rewrite on react-native-skia: a torch-lit maze with fog of
 * war, pixel-art sprites, particle juice and screen shake — reliable on every
 * device and iterable with live visual feedback.
 *
 * All gameplay lives in lib/labyrinth.ts (stepSimulation); this file only reads
 * state to draw and owns the RN overlay HUD (joystick, buttons, menus).
 */
import React, { useEffect, useRef, useState } from 'react';
import {
  Animated, PanResponder, Platform, StyleSheet, Text, TouchableOpacity,
  View, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Canvas, Picture, createPicture, Skia,
  TileMode, BlendMode, BlurStyle, PaintStyle,
  matchFont, type SkCanvas, type SkFont, type SkPaint,
} from '@shopify/react-native-skia';
import * as L from '../lib/labyrinth';
import { SEEKER, SHADE, BRUTE, GEM, GEM_GOLD, BARREL, spriteW, type Sprite } from '../lib/labyrinthSprites';

const TILE = 46;           // screen px per maze cell
const CELL = L.CELL_SIZE;  // world units per cell

// ── fonts (system, synchronous) ──────────────────────────────────────────────
function tryFont(size: number, weight: '400' | '700' | '900'): SkFont | null {
  try {
    return matchFont({
      fontFamily: Platform.select({ android: 'sans-serif', default: 'Helvetica' }) as string,
      fontSize: size, fontStyle: 'normal', fontWeight: weight,
    });
  } catch { return null; }
}
const FONT_FLOAT = tryFont(19, '900');

// ── reusable paints ──────────────────────────────────────────────────────────
const px = () => Skia.Paint();
const scratch = px();
const glowPaint = px();
glowPaint.setMaskFilter(Skia.MaskFilter.MakeBlur(BlurStyle.Normal, 8, true));

function col(c: string) { return Skia.Color(c); }

// ── pixel-sprite draw ─────────────────────────────────────────────────────────
function drawSprite(
  canvas: SkCanvas, sprite: Sprite, cx: number, cy: number,
  target: number, flipX: boolean, tint?: string,
) {
  const w = spriteW(sprite);
  const h = sprite.rows.length;
  const p = target / w;                     // px size so sprite spans `target`
  const x0 = cx - (w * p) / 2;
  const y0 = cy - (h * p) / 2;
  for (let r = 0; r < h; r++) {
    const row = sprite.rows[r];
    for (let c = 0; c < row.length; c++) {
      const ch = row[c];
      if (ch === '.' || ch === ' ') continue;
      const color = tint ?? sprite.pal[ch];
      if (!color) continue;
      scratch.setColor(col(color));
      const dc = flipX ? (w - 1 - c) : c;
      canvas.drawRect(Skia.XYWHRect(x0 + dc * p, y0 + r * p, p + 0.6, p + 0.6), scratch);
    }
  }
}

// deterministic per-cell variation
function hash(a: number, b: number): number {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
}

const FLOOR_SHADES = ['#241a44', '#2b2052', '#1e1638', '#322459'];
const WALL_BASE = '#4a3a7a';
const WALL_TOP  = '#6b53a8';
const WALL_DARK = '#241a40';
const WALL_SEAM = '#2f2456';
const FLOOR_CHIP = '#31265c';    // lighter stone chip that catches the firelight
const MOSS       = '#2f6b4a';    // faint lichen near walls

// ── the whole scene, drawn imperatively each frame ───────────────────────────
function drawScene(canvas: SkCanvas, run: L.RunState, W: number, H: number) {
  const p = run.player;
  const ox = ((run.gridW - 1) * CELL) / 2;
  const oz = ((run.gridH - 1) * CELL) / 2;
  const pcx = (p.pos.x + ox) / CELL;
  const pcz = (p.pos.z + oz) / CELL;

  const sx = run.shake > 0 ? (Math.random() * 2 - 1) * run.shake : 0;
  const sy = run.shake > 0 ? (Math.random() * 2 - 1) * run.shake : 0;
  const camX = W / 2 + sx;
  const camY = H / 2 + sy;

  // world → screen
  const wsx = (wx: number) => camX + ((wx + ox) / CELL - pcx) * TILE;
  const wsy = (wz: number) => camY + ((wz + oz) / CELL - pcz) * TILE;
  // cell centre → screen
  const csx = (c: number) => camX + (c + 0.5 - pcx) * TILE;
  const csy = (c: number) => camY + (c + 0.5 - pcz) * TILE;

  // background
  canvas.drawColor(col('#04060f'));

  // torch flicker
  const flick = Math.sin(run.clock * 9) * 0.2 + Math.sin(run.clock * 23) * 0.1;
  const torchCells = 5.6 + flick;                 // radius in cells
  const torchR = torchCells * TILE;

  // only draw cells near the torch (everything else is black anyway)
  const vis = Math.ceil(torchCells) + 2;
  const cx0 = Math.max(0, Math.floor(pcx) - vis);
  const cx1 = Math.min(run.gridW - 1, Math.ceil(pcx) + vis);
  const cz0 = Math.max(0, Math.floor(pcz) - vis);
  const cz1 = Math.min(run.gridH - 1, Math.ceil(pcz) + vis);

  // ── floor (ancient stone, ambient-occluded at the walls) ──
  for (let cz = cz0; cz <= cz1; cz++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      if (run.grid[cz][cx] === 1) continue;          // wall tiles are drawn opaque below
      const scx = csx(cx), scy = csy(cz);
      const x = scx - TILE / 2, y = scy - TILE / 2;
      const shade = FLOOR_SHADES[Math.floor(hash(cx, cz) * FLOOR_SHADES.length)];
      scratch.setColor(col(shade));
      canvas.drawRect(Skia.XYWHRect(x, y, TILE + 0.6, TILE + 0.6), scratch);
      // tile grout — thin dark lines on right + bottom read the floor as tiles
      scratch.setColor(col('#0d0a1c'));
      canvas.drawRect(Skia.XYWHRect(x, scy + TILE / 2 - 1, TILE + 0.6, 1.5), scratch);
      canvas.drawRect(Skia.XYWHRect(scx + TILE / 2 - 1, y, 1.5, TILE + 0.6), scratch);
      // stone detail — dark crack or a light chip that catches the torch
      const hf = hash(cx * 3, cz * 7);
      if (hf > 0.82) {
        scratch.setColor(col('#0c0a18'));
        canvas.drawRect(Skia.XYWHRect(scx - 4, scy + 2, 8, 3), scratch);
      } else if (hf < 0.09) {
        scratch.setColor(col(FLOOR_CHIP));
        canvas.drawRect(Skia.XYWHRect(scx + 5, scy - 6, 4, 3), scratch);
      }
      // ambient occlusion: soft dark contact shadow on edges that touch a wall
      scratch.setColor(col('#000000'));
      scratch.setAlphaf(0.36);
      if (run.grid[cz]?.[cx - 1] === 1) canvas.drawRect(Skia.XYWHRect(x, y, 7, TILE + 0.6), scratch);
      if (run.grid[cz]?.[cx + 1] === 1) canvas.drawRect(Skia.XYWHRect(x + TILE - 6, y, 7, TILE + 0.6), scratch);
      if (run.grid[cz - 1]?.[cx] === 1) canvas.drawRect(Skia.XYWHRect(x, y, TILE + 0.6, 7), scratch);
      if (run.grid[cz + 1]?.[cx] === 1) canvas.drawRect(Skia.XYWHRect(x, y + TILE - 6, TILE + 0.6, 7), scratch);
      // faint moss where two walls meet a corner
      if (hf > 0.6 && hf < 0.66 && run.grid[cz + 1]?.[cx] === 1) {
        scratch.setColor(col(MOSS));
        scratch.setAlphaf(0.5);
        canvas.drawRect(Skia.XYWHRect(scx - 6, scy + TILE / 2 - 5, 12, 4), scratch);
      }
      scratch.setAlphaf(1);
    }
  }

  // ── walls (chunky bricks with a lit top face) ──
  for (let cz = cz0; cz <= cz1; cz++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      if (run.grid[cz][cx] !== 1) continue;
      const scx = csx(cx), scy = csy(cz);
      const x = scx - TILE / 2, y = scy - TILE / 2;
      // cast shadow onto the floor below — fakes block height
      if (cz + 1 <= run.gridH - 1 && run.grid[cz + 1][cx] !== 1) {
        scratch.setColor(col('#00000066'));
        canvas.drawRect(Skia.XYWHRect(x + 3, y + TILE, TILE + 0.6, 8), scratch);
      }
      // body
      scratch.setColor(col(hash(cx, cz) > 0.5 ? WALL_BASE : '#3a2e5e'));
      canvas.drawRect(Skia.XYWHRect(x, y, TILE + 0.6, TILE + 0.6), scratch);
      // lit top strip
      scratch.setColor(col(WALL_TOP));
      canvas.drawRect(Skia.XYWHRect(x, y, TILE + 0.6, 7), scratch);
      // left edge highlight (rim)
      scratch.setColor(col('#5a4590'));
      canvas.drawRect(Skia.XYWHRect(x, y, 3, TILE + 0.6), scratch);
      // dark base
      scratch.setColor(col(WALL_DARK));
      canvas.drawRect(Skia.XYWHRect(x, y + TILE - 5, TILE + 0.6, 6), scratch);
      // brick seam
      scratch.setColor(col(WALL_SEAM));
      canvas.drawRect(Skia.XYWHRect(x, y + TILE / 2 - 1, TILE + 0.6, 2), scratch);
      canvas.drawRect(Skia.XYWHRect(x + TILE / 2 - 1, y, 2, TILE / 2), scratch);
    }
  }

  // ── wall sconces (flickering torches that punctuate the dark) ──
  // Chosen deterministically from the grid: a wall with open floor directly
  // below it can hold a torch that faces the camera and spills light forward.
  for (let cz = cz0; cz <= cz1; cz++) {
    for (let cx = cx0; cx <= cx1; cx++) {
      if (run.grid[cz][cx] !== 1) continue;
      if (!(cz + 1 <= run.gridH - 1 && run.grid[cz + 1][cx] === 0)) continue;
      if (hash(cx * 7 + 3, cz * 13 + 5) < 0.80) continue;     // ~1 in 5 eligible walls
      const scx = csx(cx);
      const baseY = csy(cz) + TILE * 0.28;                    // low on the wall face
      const seed = cx * 2.3 + cz * 1.7;
      const fl = 0.62 + 0.30 * Math.sin(run.clock * 11 + seed) + 0.12 * Math.sin(run.clock * 27 + seed * 2);
      // warm light pool spilling onto the floor below the torch
      const pool = px();
      pool.setBlendMode(BlendMode.Plus);
      pool.setShader(Skia.Shader.MakeRadialGradient(
        { x: scx, y: baseY + TILE * 0.55 }, TILE * (1.7 + fl * 0.35),
        [col('#ffa64d'), col('#ff8c3a00')], [0, 1], TileMode.Clamp,
      ));
      pool.setAlphaf(0.42 * fl);
      canvas.drawRect(Skia.XYWHRect(scx - TILE * 2.4, baseY - TILE, TILE * 4.8, TILE * 3.8), pool);
      // iron bracket
      scratch.setColor(col('#1c1208'));
      canvas.drawRect(Skia.XYWHRect(scx - 2, baseY, 4, 11), scratch);
      // flame — glow halo, warm body, hot tip (height flickers)
      const fh = 10 + fl * 7;
      glowPaint.setColor(col('#ff7a1a'));
      glowPaint.setAlphaf(0.9);
      canvas.drawCircle(scx, baseY - fh * 0.4, 5 + fl * 2, glowPaint);
      scratch.setColor(col('#ffb43c'));
      canvas.drawCircle(scx, baseY - fh * 0.4, 3.2, scratch);
      scratch.setColor(col('#ffe6a0'));
      canvas.drawCircle(scx, baseY - fh * 0.58, 1.7, scratch);
    }
  }

  // ── traps (arcane sigils etched into the floor) ──
  for (const t of run.traps) {
    if (t.triggered) continue;
    const dx = t.pos.x - p.pos.x, dz = t.pos.z - p.pos.z;
    if (dx * dx + dz * dz > (torchR / TILE * CELL) ** 2) continue;
    const tx = wsx(t.pos.x), ty = wsy(t.pos.z);
    const pulse = 0.45 + 0.35 * Math.sin(run.clock * 3.5 + t.id);
    const R = TILE * 0.34;
    // menacing bloom underneath
    glowPaint.setColor(col('#ef4444'));
    glowPaint.setAlphaf(0.16 + 0.28 * pulse);
    canvas.drawCircle(tx, ty, R * 1.5, glowPaint);
    // sigil strokes
    scratch.setStyle(PaintStyle.Stroke);
    scratch.setStrokeWidth(2.2);
    scratch.setColor(col('#f87171'));
    scratch.setAlphaf(0.5 + 0.4 * pulse);
    canvas.drawCircle(tx, ty, R, scratch);
    // two counter-rotating triangles = a slowly spinning arcane star
    const tri = (rot: number, rad: number) => {
      for (let i = 0; i < 3; i++) {
        const a0 = rot + (i / 3) * Math.PI * 2;
        const a1 = rot + ((i + 1) / 3) * Math.PI * 2;
        canvas.drawLine(tx + Math.cos(a0) * rad, ty + Math.sin(a0) * rad,
                        tx + Math.cos(a1) * rad, ty + Math.sin(a1) * rad, scratch);
      }
    };
    tri(run.clock * 0.5 + t.id, R * 0.82);
    tri(-run.clock * 0.5 + t.id, R * 0.82);
    scratch.setStyle(PaintStyle.Fill);
    // molten core
    scratch.setColor(col('#fecaca'));
    scratch.setAlphaf(pulse);
    canvas.drawCircle(tx, ty, 2.6, scratch);
    scratch.setAlphaf(1);
  }

  // ── barrels ──
  for (const b of run.barrels) {
    if (b.exploded) continue;
    const dx = b.pos.x - p.pos.x, dz = b.pos.z - p.pos.z;
    if (dx * dx + dz * dz > (torchR / TILE * CELL) ** 2) continue;
    // shadow
    scratch.setColor(col('#00000066'));
    canvas.drawOval(Skia.XYWHRect(wsx(b.pos.x) - 16, wsy(b.pos.z) + 12, 32, 10), scratch);
    drawSprite(canvas, BARREL, wsx(b.pos.x), wsy(b.pos.z), TILE * 0.78, false);
  }

  // ── loot (bloom + bob + rising sparkle) ──
  for (const it of run.items) {
    if (it.collected) continue;
    const dx = it.pos.x - p.pos.x, dz = it.pos.z - p.pos.z;
    if (dx * dx + dz * dz > (torchR / TILE * CELL) ** 2) continue;
    const gx = wsx(it.pos.x);
    const gy = wsy(it.pos.z) + Math.sin(run.clock * 3 + it.id) * 5;
    const gem = it.type === 'artifact' ? GEM : GEM_GOLD;
    const glow = it.type === 'artifact' ? '#22d3ee' : '#facc15';
    const pulse = 0.5 + 0.25 * Math.sin(run.clock * 4 + it.id);
    // ground-glow pool so the gem lights its tile
    glowPaint.setColor(col(glow));
    glowPaint.setAlphaf(0.24 + 0.16 * pulse);
    canvas.drawCircle(gx, wsy(it.pos.z) + 4, TILE * 0.5, glowPaint);
    // hot halo around the gem
    glowPaint.setAlphaf(0.45 * pulse);
    canvas.drawCircle(gx, gy, TILE * 0.26, glowPaint);
    drawSprite(canvas, gem, gx, gy, TILE * 0.5, false);
    // rising sparkles
    scratch.setBlendMode(BlendMode.Plus);
    scratch.setColor(col('#ffffff'));
    for (let k = 0; k < 3; k++) {
      const t2 = (run.clock * 0.6 + it.id + k * 0.33) % 1;
      scratch.setAlphaf((1 - t2) * 0.6);
      canvas.drawCircle(gx + Math.sin((it.id + k) * 2.1) * 8, gy - t2 * TILE * 0.7, 1.4, scratch);
    }
    scratch.setBlendMode(BlendMode.SrcOver);
    scratch.setAlphaf(1);
  }

  // ── portal ──
  if (run.portalActive) {
    const dx = run.portalPos.x - p.pos.x, dz = run.portalPos.z - p.pos.z;
    if (dx * dx + dz * dz <= (torchR / TILE * CELL * 1.4) ** 2) {
      const qx = wsx(run.portalPos.x), qy = wsy(run.portalPos.z);
      glowPaint.setColor(col('#22d3ee'));
      glowPaint.setAlphaf(0.75);
      canvas.drawCircle(qx, qy, TILE * 0.9, glowPaint);
      scratch.setStyle(PaintStyle.Stroke);
      for (let ring = 0; ring < 3; ring++) {
        scratch.setStrokeWidth(4 - ring);
        scratch.setColor(col(ring % 2 ? '#67e8f9' : '#22d3ee'));
        scratch.setAlphaf(0.9 - ring * 0.2);
        canvas.drawCircle(qx, qy, TILE * (0.4 + ring * 0.18) + Math.sin(run.clock * 3) * 3, scratch);
      }
      scratch.setStyle(PaintStyle.Fill);
      scratch.setAlphaf(1);
    }
  }

  // ── monsters ──
  for (const m of run.monsters) {
    if (m.dead) continue;
    const dx = m.pos.x - p.pos.x, dz = m.pos.z - p.pos.z;
    if (dx * dx + dz * dz > (torchR / TILE * CELL + CELL) ** 2) continue;
    const mx = wsx(m.pos.x);
    const bob = Math.sin(run.clock * (m.type === 'brute' ? 8 : 12) + m.id) * 4;
    const my = wsy(m.pos.z) + bob;
    // shadow
    scratch.setColor(col('#00000055'));
    const sw = m.type === 'brute' ? 40 : 26;
    canvas.drawOval(Skia.XYWHRect(mx - sw / 2, wsy(m.pos.z) + 14, sw, 9), scratch);
    const sprite = m.type === 'brute' ? BRUTE : SHADE;
    const size = m.type === 'brute' ? TILE * 1.25 : TILE * 0.82;
    drawSprite(canvas, sprite, mx, my, size, m.pos.x < p.pos.x, m.damageFlash > 0 ? '#ffffff' : undefined);
  }

  // ── player + sword ──
  {
    // soft warm aura so the seeker reads as the source of light (drawn under
    // the sprite, before the fog/warm overlays, so the hero stays the focus)
    glowPaint.setColor(col('#c9a6ff'));
    glowPaint.setAlphaf(0.34);
    canvas.drawCircle(camX, camY, TILE * 1.2, glowPaint);
    // shadow
    scratch.setColor(col('#00000066'));
    canvas.drawOval(Skia.XYWHRect(camX - 16, camY + 16, 32, 10), scratch);
    // sword arc during a swing
    if (run.swordSwing > 0) {
      const k = run.swordSwing;                       // 1 → 0
      const sweep = (1 - k) * Math.PI * 1.4 - Math.PI * 0.7;
      const ang = Math.atan2(p.dir.z, p.dir.x) + sweep;
      const bx = camX + Math.cos(ang) * TILE * 0.85;
      const by = camY + Math.sin(ang) * TILE * 0.85;
      glowPaint.setColor(col('#bae6fd'));
      glowPaint.setAlphaf(k * 0.8);
      canvas.drawCircle(bx, by, 10, glowPaint);
      scratch.setStyle(PaintStyle.Stroke);
      scratch.setStrokeWidth(5);
      scratch.setColor(col('#e0f2fe'));
      scratch.setAlphaf(k);
      canvas.drawLine(camX + Math.cos(ang) * 12, camY + Math.sin(ang) * 12, bx, by, scratch);
      scratch.setStyle(PaintStyle.Fill);
      scratch.setAlphaf(1);
    }
    drawSprite(canvas, SEEKER, camX, camY, TILE * 0.95, p.dir.x < -0.05, p.isDashing ? '#c4b5fd' : undefined);
  }

  // ── particles (additive) ──
  scratch.setBlendMode(BlendMode.Plus);
  for (const pa of run.particles) {
    const a = Math.max(0, pa.life / pa.max);
    scratch.setColor(col(pa.color));
    scratch.setAlphaf(a);
    canvas.drawCircle(wsx(pa.x), wsy(pa.z), pa.size * (0.5 + a * 0.6), scratch);
  }
  scratch.setBlendMode(BlendMode.SrcOver);
  scratch.setAlphaf(1);

  // ── ambient dust motes drifting in the torchlight ──
  scratch.setColor(col('#c4b5fd'));
  for (let i = 0; i < 16; i++) {
    const a = run.clock * 0.25 + i * 0.85;
    const rad = TILE * (0.8 + (i % 6) * 0.7);
    const dxp = Math.cos(a) * rad;
    const dyp = Math.sin(a * 0.7 + i) * rad * 0.6;
    scratch.setAlphaf(0.18 + 0.14 * Math.sin(run.clock * 2 + i));
    canvas.drawCircle(camX + dxp, camY + dyp, 1.7, scratch);
  }
  scratch.setAlphaf(1);

  // ── warm embers rising from the seeker's torch ──
  scratch.setBlendMode(BlendMode.Plus);
  for (let i = 0; i < 7; i++) {
    const t2 = (run.clock * 0.35 + i * 0.37) % 1;
    const ex = camX + Math.sin(run.clock * 0.6 + i * 2.1) * TILE * (0.5 + (i % 3) * 0.5);
    const ey = camY + TILE * 0.6 - t2 * TILE * 2.4;
    scratch.setColor(col(i % 2 ? '#ff9a3c' : '#ffcf6a'));
    scratch.setAlphaf((1 - t2) * 0.5);
    canvas.drawCircle(ex, ey, 1.5 + (1 - t2) * 1.2, scratch);
  }
  scratch.setBlendMode(BlendMode.SrcOver);
  scratch.setAlphaf(1);

  // ── cinematic lighting: warm torch core, cool abyss shadows ──
  // 1) Fog: clear near field → deep cool-blue shadow → black abyss at the rim.
  const lightP = px();
  lightP.setShader(Skia.Shader.MakeRadialGradient(
    { x: camX, y: camY }, torchR,
    [col('#060c1a00'), col('#060c1a00'), col('#070d1e55'), col('#060a16e8'), col('#04060fff')],
    [0, 0.42, 0.66, 0.86, 1], TileMode.Clamp,
  ));
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), lightP);

  // 2) Cool fill (additive): lift the mid-field shadows toward moonlit teal so
  //    they read cool against the warm torch — the "teal & orange" grade. Zero
  //    at the centre (kept warm) and at the black rim.
  const coolP = px();
  coolP.setBlendMode(BlendMode.Plus);
  coolP.setShader(Skia.Shader.MakeRadialGradient(
    { x: camX, y: camY }, torchR * 1.15,
    [col('#0e1c3a00'), col('#17305c'), col('#0e1c3a00')],
    [0.18, 0.6, 1], TileMode.Clamp,
  ));
  coolP.setAlphaf(0.44);
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), coolP);

  // 3) Warm torch glow (additive) — a firelit pool, gentle enough that the
  //    seeker stays crisp inside it rather than blowing out to white. The
  //    inner stop is transparent so it never washes the sprite at the centre.
  const warmP = px();
  warmP.setBlendMode(BlendMode.Plus);
  warmP.setShader(Skia.Shader.MakeRadialGradient(
    { x: camX, y: camY }, TILE * 3.6,
    [col('#ffcf8a00'), col('#ffbb70'), col('#ff9e4d00')],
    [0, 0.42, 1], TileMode.Clamp,
  ));
  warmP.setAlphaf(0.42);
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), warmP);

  // 4) A soft warm halo hugging the seeker — reads as torchlight without a
  //    hard hot core, so the hooded sprite and its cyan eyes stay legible.
  const coreP = px();
  coreP.setBlendMode(BlendMode.Plus);
  coreP.setShader(Skia.Shader.MakeRadialGradient(
    { x: camX, y: camY }, TILE * 1.5,
    [col('#ffe8c000'), col('#ffdca6'), col('#ffd9a000')],
    [0.28, 0.55, 1], TileMode.Clamp,
  ));
  coreP.setAlphaf(0.32);
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), coreP);

  // ── floating damage / reward numbers ──
  if (FONT_FLOAT) {
    for (const f of run.floats) {
      const a = Math.max(0, Math.min(1, f.life / f.max));
      scratch.setColor(col(f.color));
      scratch.setAlphaf(a);
      const tw = FONT_FLOAT.getTextWidth(f.text);
      canvas.drawText(f.text, wsx(f.x) - tw / 2, wsy(f.z), scratch, FONT_FLOAT);
    }
    scratch.setAlphaf(1);
  }

  // ── vignette ──
  const vig = px();
  vig.setShader(Skia.Shader.MakeRadialGradient(
    { x: W / 2, y: H / 2 }, Math.max(W, H) * 0.72,
    [col('#00000000'), col('#00000000'), col('#000000b0')],
    [0, 0.62, 1], TileMode.Clamp,
  ));
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), vig);
}

// ── input / phase ─────────────────────────────────────────────────────────────
type InputState = { jx: number; jz: number; attack: boolean; dash: boolean };
type Phase = 'menu' | 'playing' | 'dead' | 'won';

const BEST_KEY = 'sk_labyrinth_best';

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
  const { width: W, height: H } = useWindowDimensions();

  const [phase, setPhase]         = useState<Phase>('menu');
  const [hp, setHp]               = useState(L.PLAYER_MAX_HP);
  const [collected, setCollected] = useState(0);
  const [runOrb, setRunOrb]       = useState(0);
  const [msg, setMsg]             = useState('');
  const [best, setBest]           = useState(0);
  const [, setFrame]              = useState(0);

  const runRef    = useRef<L.RunState | null>(null);
  const phaseRef  = useRef<Phase>('menu');
  const inputRef  = useRef<InputState>({ jx: 0, jz: 0, attack: false, dash: false });
  const eventsRef = useRef<L.SimEvents>(null as unknown as L.SimEvents);

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
      const pts = Math.max(1, Math.floor(r.runOrb / 10)) + (won ? L.WIN_TOURNAMENT_PTS : 0);
      onAddScore(pts);
      if (r.runOrb > best) {
        setBest(r.runOrb);
        AsyncStorage.setItem(BEST_KEY, String(r.runOrb)).catch(() => {});
      }
    }
  }

  eventsRef.current = {
    setHp, setCollected, setRunOrb, setMsg,
    earnOrb: onEarnOrb,
    playSound: onPlaySound,
    onHitFlash: () => {
      hitFlash.setValue(0.4);
      Animated.timing(hitFlash, { toValue: 0, duration: 320, useNativeDriver: true }).start();
    },
    onEnd: endRun,
  };

  // ── game loop ──
  useEffect(() => {
    if (phase !== 'playing') return;
    let raf = 0;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      const dt = Math.min((now - last) / 1000, 0.05);
      last = now;
      const r = runRef.current;
      if (r && phaseRef.current === 'playing') {
        L.stepSimulation(r, inputRef.current, dt, eventsRef.current);
      }
      setFrame(f => (f + 1) & 0xffff);
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [phase]);

  function startRun() {
    if (energy < L.ENTRY_ENERGY) {
      setMsg(`Need ${L.ENTRY_ENERGY} energy to descend`);
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

  // ── joystick ──
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
        inputRef.current.jz = dy / JOY_R;
      },
      onPanResponderRelease: () => {
        stickPos.setValue({ x: 0, y: 0 });
        inputRef.current.jx = 0; inputRef.current.jz = 0;
      },
      onPanResponderTerminate: () => {
        stickPos.setValue({ x: 0, y: 0 });
        inputRef.current.jx = 0; inputRef.current.jz = 0;
      },
    }),
  ).current;

  const hpPct = Math.max(0, Math.min(1, hp / L.PLAYER_MAX_HP));
  const run = runRef.current;
  const scene = (phase !== 'menu' && run)
    ? createPicture((canvas) => drawScene(canvas, run, W, H), { x: 0, y: 0, width: W, height: H })
    : null;

  return (
    <View style={s.root}>
      {scene && (
        <Canvas style={{ width: W, height: H }}>
          <Picture picture={scene} />
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
            A torch-lit descent. Find {L.ITEM_COUNT} artifacts in the dark maze,{'\n'}
            cut down the shades, dash through traps —{'\n'}
            then escape through the portal.
          </Text>
          <View style={s.menuStats}>
            <Text style={s.menuStat}>⚔️ Sword {L.ATTACK_DMG}</Text>
            <Text style={s.menuStat}>💨 Dash i-frames</Text>
            <Text style={s.menuStat}>🏆 Best {best.toLocaleString()}</Text>
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
            <TouchableOpacity onPress={() => { phaseRef.current = 'menu'; setPhase('menu'); }} style={s.quitBtn}>
              <Text style={s.quitTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {msg !== '' && (
            <View style={s.msgWrap} pointerEvents="none">
              <Text style={s.msgTxt}>{msg}</Text>
            </View>
          )}

          <View style={s.joyZone} {...pan.panHandlers}>
            <View style={s.joyBase}>
              <Animated.View style={[s.joyStick, { transform: stickPos.getTranslateTransform() }]} />
            </View>
          </View>

          <View style={s.btnCol} pointerEvents="box-none">
            <TouchableOpacity onPressIn={() => { inputRef.current.dash = true; }}
              activeOpacity={0.7} style={[s.actBtn, s.dashBtn]}>
              <Text style={s.actTxt}>💨</Text><Text style={s.actLbl}>DASH</Text>
            </TouchableOpacity>
            <TouchableOpacity onPressIn={() => { inputRef.current.attack = true; }}
              activeOpacity={0.7} style={[s.actBtn, s.atkBtn]}>
              <Text style={s.actTxt}>⚔️</Text><Text style={s.actLbl}>STRIKE</Text>
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
            <Text style={s.endStat}>✨ Artifacts {collected}/{L.ITEM_COUNT}</Text>
            <Text style={s.endStat}>⚔️ Kills {run?.kills ?? 0}</Text>
            <Text style={[s.endStat, { color: '#facc15' }]}>💎 +{runOrb.toLocaleString()} ORB</Text>
            {phase === 'won' && (
              <Text style={[s.endStat, { color: '#22d3ee' }]}>🌀 Escape bonus +{L.WIN_BONUS_ORB}</Text>
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

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#05010d' },

  menuWrap:  { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 28 },
  menuIcon:  { fontSize: 64, marginBottom: 10 },
  menuTitle: { color: '#C4B5FD', fontSize: 26, fontWeight: '900', letterSpacing: 4 },
  menuSub:   { color: '#94A3B8', fontSize: 13, textAlign: 'center', lineHeight: 20, marginTop: 12 },
  menuStats: { flexDirection: 'row', gap: 14, marginTop: 18, flexWrap: 'wrap', justifyContent: 'center' },
  menuStat:  { color: '#7C3AED', fontSize: 11, fontWeight: '800' },
  menuMsg:   { color: '#f59e0b', fontSize: 12, fontWeight: '700', marginTop: 12 },

  startBtn: { marginTop: 26, backgroundColor: '#7C3AED', paddingVertical: 16, paddingHorizontal: 34,
              borderRadius: 18, shadowColor: '#7C3AED', shadowRadius: 16, shadowOpacity: 0.6, elevation: 8 },
  startTxt: { color: '#FFF', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  exitLink: { marginTop: 18, padding: 8 },
  exitLinkTxt: { color: '#475569', fontSize: 12, fontWeight: '800', letterSpacing: 2 },

  hudTop:  { position: 'absolute', top: 46, left: 14, right: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
  hpWrap:  { flex: 1 },
  hpTrack: { height: 10, backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 6, overflow: 'hidden',
             borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' },
  hpFill:  { height: '100%', borderRadius: 6 },
  hpTxt:   { color: '#E2E8F0', fontSize: 10, fontWeight: '800', marginTop: 3 },
  hudChips:{ flexDirection: 'row', gap: 8 },
  hudChip: { color: '#C4B5FD', fontSize: 13, fontWeight: '900', backgroundColor: 'rgba(15,23,42,0.8)',
             paddingHorizontal: 10, paddingVertical: 5, borderRadius: 10, overflow: 'hidden' },
  quitBtn: { width: 38, height: 38, borderRadius: 19, backgroundColor: 'rgba(15,23,42,0.85)',
             alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.5)' },
  quitTxt: { color: '#94A3B8', fontSize: 16, fontWeight: '800' },

  msgWrap: { position: 'absolute', bottom: 190, left: 0, right: 0, alignItems: 'center' },
  msgTxt:  { color: '#E2E8F0', fontSize: 13, fontWeight: '800', backgroundColor: 'rgba(5,1,13,0.75)',
             paddingHorizontal: 16, paddingVertical: 8, borderRadius: 14, overflow: 'hidden' },

  joyZone: { position: 'absolute', left: 0, bottom: 0, width: '48%', height: 240, alignItems: 'center', justifyContent: 'center' },
  joyBase: { width: 128, height: 128, borderRadius: 64, backgroundColor: 'rgba(124,58,237,0.10)',
             borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.35)', alignItems: 'center', justifyContent: 'center' },
  joyStick:{ width: 54, height: 54, borderRadius: 27, backgroundColor: 'rgba(196,181,253,0.55)',
             borderWidth: 1.5, borderColor: '#C4B5FD' },

  btnCol:  { position: 'absolute', right: 18, bottom: 46, gap: 14, alignItems: 'center' },
  actBtn:  { width: 76, height: 76, borderRadius: 38, alignItems: 'center', justifyContent: 'center', borderWidth: 2 },
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
