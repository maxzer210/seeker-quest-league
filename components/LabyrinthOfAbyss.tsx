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
  Animated, PanResponder, Platform, ScrollView, StyleSheet, Text, TouchableOpacity,
  View, useWindowDimensions,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  Canvas, Picture, createPicture, Skia,
  TileMode, BlendMode, BlurStyle, PaintStyle,
  matchFont, type SkCanvas, type SkFont, type SkPaint,
} from '@shopify/react-native-skia';
import * as L from '../lib/labyrinth';
import { SEEKER, SHADE_VARIANTS, BRUTE, GUARDIAN, GEM, GEM_GOLD, BARREL, spriteW, type Sprite } from '../lib/labyrinthSprites';

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
  target: number, flipX: boolean, tint?: string, hideEyes = false,
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
      // blink: draw the eyes with the face-shadow colour for a few frames
      let color = tint ?? sprite.pal[ch];
      if (hideEyes && ch === 'E') color = tint ?? sprite.pal['F'] ?? '';
      if (!color) continue;
      scratch.setColor(col(color));
      const dc = flipX ? (w - 1 - c) : c;
      canvas.drawRect(Skia.XYWHRect(x0 + dc * p, y0 + r * p, p + 0.6, p + 0.6), scratch);
    }
  }
}

/**
 * Sprite draw wrapped in a squash/stretch + lean transform around its centre —
 * the basis of the procedural character animation (walk bounce, breathing,
 * attack lunge, hit recoil). `sx`/`sy` scale, `lean` shears horizontally.
 */
function drawSpriteA(
  canvas: SkCanvas, sprite: Sprite, cx: number, cy: number,
  target: number, flipX: boolean, tint: string | undefined,
  sx: number, sy: number, lean: number, hideEyes: boolean,
) {
  canvas.save();
  canvas.translate(cx, cy);
  if (lean) canvas.skew(lean, 0);
  canvas.scale(sx, sy);
  canvas.translate(-cx, -cy);
  drawSprite(canvas, sprite, cx, cy, target, flipX, tint, hideEyes);
  canvas.restore();
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
function drawScene(canvas: SkCanvas, run: L.RunState, W: number, H: number, lantern = false) {
  // Abyss Lantern (SOL cosmetic) recolours the seeker's flame to spectral cyan;
  // wall sconces stay warm so the grade keeps its warm/cool contrast.
  const warmStops  = lantern ? ['#9fdcff00', '#8fd2ff', '#66b8ff00'] : ['#ffcf8a00', '#ffbb70', '#ff9e4d00'];
  const haloStops  = lantern ? ['#d9f4ff00', '#c9ecff', '#bfe6ff00'] : ['#ffe8c000', '#ffdca6', '#ffd9a000'];
  const emberColA  = lantern ? '#67e8f9' : '#ff9a3c';
  const emberColB  = lantern ? '#c2f0ff' : '#ffcf6a';
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

  // torch flicker (base radius comes from the run — camp upgrades widen it)
  const flick = Math.sin(run.clock * 9) * 0.2 + Math.sin(run.clock * 23) * 0.1;
  const torchCells = run.torchCells + flick;      // radius in cells
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
    const spin = Math.max(0.2, Math.abs(Math.cos(run.clock * 2 + it.id)));   // slow horizontal spin
    drawSpriteA(canvas, gem, gx, gy, TILE * 0.5, false, undefined, spin, 1, 0, false);
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

  // ── monsters (normal variants, brutes, and the Guardian boss) ──
  for (const m of run.monsters) {
    if (m.dead) continue;
    const isGuardian = m.type === 'guardian';
    const isBrute = m.type === 'brute';
    const dx = m.pos.x - p.pos.x, dz = m.pos.z - p.pos.z;
    const cullCells = (torchR / TILE) * (isGuardian ? 1.35 : 1) + 1;
    if (dx * dx + dz * dz > (cullCells * CELL) ** 2) continue;
    const mx = wsx(m.pos.x);
    const bob = Math.sin(run.clock * (isGuardian ? 5 : isBrute ? 8 : 12) + m.id) * (isGuardian ? 3 : 4);
    const my = wsy(m.pos.z) + bob;
    // shadow
    scratch.setColor(col('#00000055'));
    const sw = isGuardian ? 62 : isBrute ? 40 : 26;
    canvas.drawOval(Skia.XYWHRect(mx - sw / 2, wsy(m.pos.z) + (isGuardian ? 24 : 14), sw, isGuardian ? 13 : 9), scratch);
    // the Guardian's core throbs with light
    if (isGuardian) {
      glowPaint.setColor(col('#22d3ee'));
      glowPaint.setAlphaf(0.38 + 0.16 * Math.sin(run.clock * 4));
      canvas.drawCircle(mx, my, TILE * 0.75, glowPaint);
    }
    const sprite = isGuardian ? GUARDIAN : isBrute ? BRUTE : SHADE_VARIANTS[m.variant % SHADE_VARIANTS.length];
    const size = isGuardian ? TILE * 2.15 : isBrute ? TILE * 1.25 : TILE * 0.85;
    // procedural animation: breathing pulse, attack pounce, hit recoil, chase lean
    const breathe = Math.sin(run.clock * (isGuardian ? 3 : 6) + m.id * 1.7);
    let asy = 1 + breathe * (isGuardian ? 0.05 : 0.09);
    let asx = 1 - (asy - 1) * 0.7;
    const sinceAtk = run.clock - m.lastAttack;
    if (sinceAtk < 0.22) { const l = 1 - sinceAtk / 0.22; asy += l * 0.18; asx += l * 0.1; }
    if (m.damageFlash > 0) { asx *= 1.14; asy *= 0.86; }
    const chasing = dx * dx + dz * dz < L.MONSTER_AGGRO * L.MONSTER_AGGRO;
    const lean = chasing && !isGuardian ? (m.pos.x < p.pos.x ? -0.06 : 0.06) : 0;
    drawSpriteA(canvas, sprite, mx, my, size, m.pos.x < p.pos.x,
      m.damageFlash > 0 ? '#ffffff' : undefined, asx, asy, lean, false);
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
    // sword arc during a swing — a big sweeping crescent with a bright tip
    if (run.swordSwing > 0) {
      const k = run.swordSwing;                          // 1 → 0
      const face = Math.atan2(p.dir.z, p.dir.x);
      const reach = TILE * 1.15;
      const lead = face + ((1 - k) * 1.7 - 0.85) * Math.PI; // leading edge sweeps across
      scratch.setStyle(PaintStyle.Stroke);
      scratch.setStrokeWidth(6);
      for (let t = 0; t < 7; t++) {
        const a = lead - t * 0.17;
        scratch.setColor(col(t < 2 ? '#ffffff' : '#bae6fd'));
        scratch.setAlphaf(k * (1 - t / 7) * 0.9);
        canvas.drawLine(
          camX + Math.cos(a) * reach * 0.42, camY + Math.sin(a) * reach * 0.42,
          camX + Math.cos(a) * reach, camY + Math.sin(a) * reach, scratch);
      }
      scratch.setStyle(PaintStyle.Fill);
      const bx = camX + Math.cos(lead) * reach, by = camY + Math.sin(lead) * reach;
      glowPaint.setColor(col('#e0f2fe'));
      glowPaint.setAlphaf(k * 0.9);
      canvas.drawCircle(bx, by, 13, glowPaint);
      scratch.setAlphaf(1);
    }
    // procedural walk / idle animation
    const moving = p.moving;
    const bounce = moving ? Math.abs(Math.sin(p.stepPhase)) : 0;
    const breath = Math.sin(run.clock * 2.2) * 0.02;
    const psy = 1 + (moving ? bounce * 0.12 - 0.04 : breath);
    const psx = 1 - (psy - 1) * 0.6;
    const plean = moving ? (p.dir.x < -0.05 ? 0.05 : p.dir.x > 0.05 ? -0.05 : 0) : 0;
    const footY = moving ? -bounce * 4 : 0;
    const blink = (run.clock % 3.4) < 0.11;
    const pop = run.swordSwing > 0.6 ? (run.swordSwing - 0.6) * 0.5 : 0;   // brief pop as the swing starts
    drawSpriteA(canvas, SEEKER, camX, camY + footY, TILE * 0.95, p.dir.x < -0.05,
      p.isDashing ? '#c4b5fd' : undefined, psx + pop, psy + pop, plean, blink);
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
    scratch.setColor(col(i % 2 ? emberColA : emberColB));
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
    [col(warmStops[0]), col(warmStops[1]), col(warmStops[2])],
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
    [col(haloStops[0]), col(haloStops[1]), col(haloStops[2])],
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

// ── menu backdrop: the seeker at the brink of a glowing abyss, drawn live ─────
function drawMenuScene(canvas: SkCanvas, clock: number, W: number, H: number) {
  // 1) deep cosmic gradient
  const bg = px();
  bg.setShader(Skia.Shader.MakeLinearGradient(
    { x: 0, y: 0 }, { x: 0, y: H },
    [col('#0c0724'), col('#0a0618'), col('#04060f')], [0, 0.5, 1], TileMode.Clamp,
  ));
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), bg);

  // purple nebula glow behind the title
  glowPaint.setColor(col('#3b1d6e'));
  glowPaint.setAlphaf(0.45);
  canvas.drawCircle(W * 0.5, H * 0.2, W * 0.55, glowPaint);

  // 2) faint twinkling starfield in the upper field
  scratch.setColor(col('#c4b5fd'));
  for (let i = 0; i < 44; i++) {
    const sx = (((i * 97) % 100) / 100) * W;
    const sy = (((i * 53) % 100) / 100) * H * 0.66;
    const tw = 0.25 + 0.6 * Math.abs(Math.sin(clock * 1.4 + i));
    scratch.setAlphaf(tw * 0.5);
    canvas.drawCircle(sx, sy, i % 3 === 0 ? 1.7 : 1, scratch);
  }
  scratch.setAlphaf(1);

  const cx = W / 2;
  const portalY = H * 0.6;
  const portalR = Math.min(W * 0.3, 150);
  const pulse = 0.55 + 0.2 * Math.sin(clock * 2);

  // 3) stone lip so the portal reads as a pit carved in the floor
  scratch.setColor(col('#160f2c'));
  canvas.drawOval(Skia.XYWHRect(cx - portalR * 1.55, portalY - portalR * 0.58, portalR * 3.1, portalR * 1.3), scratch);
  scratch.setColor(col('#241a44'));
  canvas.drawOval(Skia.XYWHRect(cx - portalR * 1.38, portalY - portalR * 0.5, portalR * 2.76, portalR * 1.12), scratch);
  scratch.setColor(col('#05010d'));
  canvas.drawOval(Skia.XYWHRect(cx - portalR, portalY - portalR * 0.42, portalR * 2, portalR * 0.88), scratch);

  // 4) abyss energy welling up + swirling rings
  glowPaint.setColor(col('#22d3ee'));
  glowPaint.setAlphaf(0.35 * pulse + 0.2);
  canvas.drawOval(Skia.XYWHRect(cx - portalR * 0.85, portalY - portalR * 0.36, portalR * 1.7, portalR * 0.72), glowPaint);
  scratch.setStyle(PaintStyle.Stroke);
  for (let r = 0; r < 4; r++) {
    scratch.setStrokeWidth(3 - r * 0.5);
    scratch.setColor(col(r % 2 ? '#67e8f9' : '#a855f7'));
    scratch.setAlphaf((0.7 - r * 0.13) * pulse);
    const rr = portalR * (0.34 + r * 0.16) + Math.sin(clock * 2 + r) * 4;
    canvas.drawOval(Skia.XYWHRect(cx - rr, portalY - rr * 0.45, rr * 2, rr * 0.9), scratch);
  }
  scratch.setStyle(PaintStyle.Fill);
  scratch.setAlphaf(1);

  // 5) embers rising out of the abyss (additive, warm + cyan)
  scratch.setBlendMode(BlendMode.Plus);
  for (let i = 0; i < 20; i++) {
    const t = (clock * 0.28 + i * 0.37) % 1;
    const ex = cx + Math.sin(clock * 0.5 + i * 2.1) * portalR * (0.35 + (i % 4) * 0.2);
    const ey = portalY - t * H * 0.46;
    scratch.setColor(col(i % 2 ? '#ff9a3c' : '#67e8f9'));
    scratch.setAlphaf((1 - t) * 0.5);
    canvas.drawCircle(ex, ey, 1.3 + (1 - t) * 1.7, scratch);
  }
  scratch.setBlendMode(BlendMode.SrcOver);
  scratch.setAlphaf(1);

  // 6) the seeker standing at the brink, torch-lit, idle breathing + blink
  const heroY = portalY - portalR * 0.72;
  glowPaint.setColor(col('#c9a6ff'));
  glowPaint.setAlphaf(0.28);
  canvas.drawCircle(cx, heroY, TILE * 1.7, glowPaint);
  const warm = px();
  warm.setBlendMode(BlendMode.Plus);
  warm.setShader(Skia.Shader.MakeRadialGradient(
    { x: cx, y: heroY }, TILE * 2.8,
    [col('#ffcf8a'), col('#ff9e4d00')], [0, 1], TileMode.Clamp,
  ));
  warm.setAlphaf(0.28);
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), warm);
  scratch.setColor(col('#00000066'));
  canvas.drawOval(Skia.XYWHRect(cx - 26, heroY + 28, 52, 15), scratch);
  const breath = Math.sin(clock * 2.2) * 0.03;
  drawSpriteA(canvas, SEEKER, cx, heroY - breath * TILE, TILE * 1.75, false, undefined,
    1 - breath * 0.6, 1 + breath, 0, clock % 3.4 < 0.11);

  // 7) drifting dust
  scratch.setColor(col('#c4b5fd'));
  for (let i = 0; i < 14; i++) {
    const a = clock * 0.2 + i * 0.9;
    const dxp = Math.cos(a) * W * 0.32;
    const dyp = Math.sin(a * 0.7 + i) * H * 0.14;
    scratch.setAlphaf(0.08 + 0.1 * Math.sin(clock * 2 + i));
    canvas.drawCircle(cx + dxp, portalY * 0.62 + dyp, 1.6, scratch);
  }
  scratch.setAlphaf(1);

  // 8) vignette
  const vig = px();
  vig.setShader(Skia.Shader.MakeRadialGradient(
    { x: W / 2, y: H / 2 }, Math.max(W, H) * 0.72,
    [col('#00000000'), col('#00000000'), col('#000000cc')], [0, 0.55, 1], TileMode.Clamp,
  ));
  canvas.drawRect(Skia.XYWHRect(0, 0, W, H), vig);
}

// ── input / phase ─────────────────────────────────────────────────────────────
type InputState = { jx: number; jz: number; attack: boolean; dash: boolean };
type Phase = 'menu' | 'playing' | 'dead' | 'won';

const BEST_KEY = 'sk_labyrinth_best';
const UPGRADES_KEY = 'sk_labyrinth_upgrades_v1';

// ── Seeker's Camp — permanent upgrades bought with ORB ───────────────────────
// Same shape as App.tsx UPGRADE_DEFS (5 levels, rising cost, NOW → NEXT).
// Effect tables live in lib/labyrinth.ts so sim and UI can never disagree.
type CampKey = 'torch' | 'speed' | 'vigor' | 'blade' | 'ember';
type CampLevels = Record<CampKey, number>;
const CAMP_ZERO: CampLevels = { torch: 0, speed: 0, vigor: 0, blade: 0, ember: 0 };

const CAMP_DEFS: Record<CampKey, {
  name: string; icon: string; desc: string;
  valueLabels: string[]; costs: number[]; color: string;
}> = {
  torch: {
    name: 'ABYSS TORCH', icon: '🔦', desc: 'Torch light radius',
    valueLabels: L.TORCH_LEVELS.map(v => v.toFixed(1)),
    costs: [600, 1800, 4500, 11000, 26000],
    color: '#F59E0B',
  },
  speed: {
    name: 'SWIFT GREAVES', icon: '👢', desc: 'Move speed',
    valueLabels: L.SPEED_LEVELS.map(String),
    costs: [500, 1500, 4000, 10000, 24000],
    color: '#22D3EE',
  },
  vigor: {
    name: 'ABYSSAL VIGOR', icon: '❤️‍🔥', desc: 'Max HP',
    valueLabels: L.MAX_HP_LEVELS.map(String),
    costs: [700, 2000, 5000, 12000, 28000],
    color: '#22C55E',
  },
  blade: {
    name: 'RUNEBLADE', icon: '⚔️', desc: 'Sword damage',
    valueLabels: L.SWORD_DMG_LEVELS.map(String),
    costs: [800, 2400, 6000, 14000, 30000],
    color: '#A855F7',
  },
  ember: {
    name: 'SECOND TORCH', icon: '🕯️', desc: 'Survive a lethal hit · once per run',
    valueLabels: L.EMBER_REVIVE_HP.map((h, i) => (i === 0 ? '—' : `${h} HP`)),
    costs: [1200, 3000, 8000, 18000, 40000],
    color: '#EC4899',
  },
};
const CAMP_KEYS = Object.keys(CAMP_DEFS) as CampKey[];

// Abyss Lantern — the camp's one premium SOL offer (cosmetic + tiny light bonus)
const LANTERN_SOL      = 0.05;
const LANTERN_LAMPORTS = 50_000_000;

type Props = {
  energy: number;
  onSpendEnergy: (n: number) => void;
  onEarnOrb: (n: number) => void;
  onAddScore: (n: number) => void;
  onPlaySound: (s: 'tap' | 'crit' | 'jackpot' | 'levelup' | 'dead') => void;
  onExit: () => void;
  // Optional economy hooks for the Seeker's Camp. All backward-compatible:
  // without orb/onSpendOrb the camp renders in a locked preview state, and
  // without onPaySol the SOL offer shows "coming soon".
  orb?: number;
  onSpendOrb?: (n: number) => void;
  onPaySol?: (lamports: number, sol: number, purpose: string) => Promise<void>;
};

export default function LabyrinthOfAbyss({
  energy, onSpendEnergy, onEarnOrb, onAddScore, onPlaySound, onExit,
  orb, onSpendOrb, onPaySol,
}: Props) {
  const { width: W, height: H } = useWindowDimensions();

  const [phase, setPhase]         = useState<Phase>('menu');
  const [hp, setHp]               = useState(L.PLAYER_MAX_HP);
  const [collected, setCollected] = useState(0);
  const [runOrb, setRunOrb]       = useState(0);
  const [msg, setMsg]             = useState('');
  const [best, setBest]           = useState(0);
  const [, setFrame]              = useState(0);
  // Seeker's Camp
  const [camp, setCamp]           = useState<CampLevels>(CAMP_ZERO);
  const [lantern, setLantern]     = useState(false);
  const [campOpen, setCampOpen]   = useState(false);
  const [paying, setPaying]       = useState(false);
  const [justBought, setJustBought] = useState<CampKey | null>(null);

  const runRef    = useRef<L.RunState | null>(null);
  const phaseRef  = useRef<Phase>('menu');
  const inputRef  = useRef<InputState>({ jx: 0, jz: 0, attack: false, dash: false });
  const eventsRef = useRef<L.SimEvents>(null as unknown as L.SimEvents);

  const hitFlash = useRef(new Animated.Value(0)).current;
  const stickPos = useRef(new Animated.ValueXY()).current;
  const menuClock = useRef(0);          // drives the animated menu backdrop
  const buyAnim = useRef(new Animated.Value(0)).current;   // camp purchase pulse

  useEffect(() => {
    AsyncStorage.getItem(BEST_KEY).then(v => {
      const n = parseInt(v ?? '0', 10);
      if (Number.isFinite(n)) setBest(n);
    }).catch(() => {});
    // camp upgrade levels + lantern ownership, clamped on load
    AsyncStorage.getItem(UPGRADES_KEY).then(v => {
      if (!v) return;
      try {
        const j = JSON.parse(v) as Partial<Record<CampKey | 'lantern', unknown>>;
        const lv = (x: unknown) =>
          Math.max(0, Math.min(L.UPGRADE_MAX_LEVEL, Math.floor(Number(x) || 0)));
        setCamp({
          torch: lv(j.torch), speed: lv(j.speed), vigor: lv(j.vigor),
          blade: lv(j.blade), ember: lv(j.ember),
        });
        setLantern(j.lantern === true);
      } catch {}
    }).catch(() => {});
  }, []);

  function persistCamp(levels: CampLevels, hasLantern: boolean) {
    AsyncStorage.setItem(UPGRADES_KEY, JSON.stringify({ ...levels, lantern: hasLantern })).catch(() => {});
  }

  function buyCampUpgrade(key: CampKey) {
    if (orb === undefined || !onSpendOrb) return;          // locked preview state
    const lvl = camp[key];
    if (lvl >= L.UPGRADE_MAX_LEVEL) return;
    const cost = CAMP_DEFS[key].costs[lvl];
    if (orb < cost) return;
    onSpendOrb(cost);
    const next = { ...camp, [key]: lvl + 1 };
    setCamp(next);
    persistCamp(next, lantern);
    onPlaySound('levelup');
    // small celebratory pulse + "LEVEL UP" flash on the bought card
    setJustBought(key);
    buyAnim.setValue(0);
    Animated.timing(buyAnim, { toValue: 1, duration: 700, useNativeDriver: true })
      .start(() => setJustBought(null));
  }

  async function buyLantern() {
    if (!onPaySol || lantern || paying) return;
    setPaying(true);
    try {
      await onPaySol(LANTERN_LAMPORTS, LANTERN_SOL, 'labyrinth_abyss_lantern');
      setLantern(true);
      persistCamp(camp, true);
      onPlaySound('jackpot');
    } catch {
      // payment cancelled/failed — the wallet flow owns the error UI
    } finally {
      setPaying(false);
    }
  }

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

  // ── menu backdrop animation loop (torch flicker, embers, portal pulse) ──
  useEffect(() => {
    if (phase !== 'menu') return;
    let raf = 0;
    let last = Date.now();
    const tick = () => {
      const now = Date.now();
      menuClock.current += Math.min((now - last) / 1000, 0.05);
      last = now;
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
    runRef.current = L.createRun({ ...camp, lantern });
    inputRef.current = { jx: 0, jz: 0, attack: false, dash: false };
    setHp(runRef.current.maxHp);
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

  const run = runRef.current;
  const hpPct = Math.max(0, Math.min(1, hp / (run?.maxHp ?? L.PLAYER_MAX_HP)));
  const scene = (phase !== 'menu' && run)
    ? createPicture((canvas) => drawScene(canvas, run, W, H, lantern), { x: 0, y: 0, width: W, height: H })
    : null;
  const menuScene = phase === 'menu'
    ? createPicture((canvas) => drawMenuScene(canvas, menuClock.current, W, H), { x: 0, y: 0, width: W, height: H })
    : null;
  const enough = energy >= L.ENTRY_ENERGY;
  const campTotal = CAMP_KEYS.reduce((n, k) => n + camp[k], 0);
  const campLocked = orb === undefined || !onSpendOrb;
  // camp purchase celebration interpolations
  const buyScale   = buyAnim.interpolate({ inputRange: [0, 0.18, 1], outputRange: [1, 1.05, 1] });
  const buyFlashOp = buyAnim.interpolate({ inputRange: [0, 0.1, 0.65, 1], outputRange: [0, 1, 1, 0] });

  return (
    <View style={s.root}>
      {scene && (
        <Canvas style={{ width: W, height: H }}>
          <Picture picture={scene} />
        </Canvas>
      )}
      {menuScene && (
        <Canvas style={{ width: W, height: H }}>
          <Picture picture={menuScene} />
        </Canvas>
      )}

      {/* Damage flash */}
      <Animated.View pointerEvents="none"
        style={[StyleSheet.absoluteFill, { backgroundColor: '#dc2626', opacity: hitFlash }]} />

      {/* ═══ MENU ═══ */}
      {phase === 'menu' && (
        <View style={s.menuWrap} pointerEvents="box-none">
          <View style={s.menuTop} pointerEvents="none">
            <Text style={s.menuKicker}>· GENESIS PRE-SEASON ·</Text>
            <Text style={s.menuTitle}>ABYSS{'\n'}LABYRINTH</Text>
            <View style={s.menuRule} />
            <Text style={s.menuTagline}>The dark calls the brave.  Descend, and it remembers.</Text>
          </View>

          <View style={s.menuBottom} pointerEvents="box-none">
            <View style={s.menuStats}>
              <View style={s.statCard}>
                <Text style={s.statIcon}>🏆</Text>
                <Text style={s.statVal}>{best.toLocaleString()}</Text>
                <Text style={s.statLbl}>BEST ORB</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statIcon}>⚔️</Text>
                <Text style={s.statVal}>{L.SWORD_DMG_LEVELS[camp.blade]}</Text>
                <Text style={s.statLbl}>SWORD</Text>
              </View>
              <View style={s.statCard}>
                <Text style={s.statIcon}>✨</Text>
                <Text style={s.statVal}>{L.ITEM_COUNT}</Text>
                <Text style={s.statLbl}>ARTIFACTS</Text>
              </View>
            </View>

            <TouchableOpacity onPress={startRun} activeOpacity={0.85}
              style={[s.descendBtn, !enough && s.descendBtnOff]}>
              <Text style={s.descendTxt}>▼  DESCEND</Text>
              <View style={s.descendCost}>
                <Text style={s.descendCostTxt}>{L.ENTRY_ENERGY} ⚡</Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity onPress={() => { setCampOpen(true); onPlaySound('tap'); }}
              activeOpacity={0.85} style={s.campBtn}>
              <Text style={s.campBtnTxt}>⛺  SEEKER'S CAMP</Text>
              <View style={s.campBtnBadge}>
                <Text style={s.campBtnBadgeTxt}>
                  {campTotal > 0 ? `LV ${campTotal}` : 'NEW'}
                </Text>
              </View>
            </TouchableOpacity>

            {msg !== '' && <Text style={s.menuMsg}>{msg}</Text>}

            <TouchableOpacity onPress={onExit} style={s.exitLink}>
              <Text style={s.exitLinkTxt}>‹  BACK TO ARCADE</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* ═══ SEEKER'S CAMP — permanent upgrades + the SOL offer ═══ */}
      {phase === 'menu' && campOpen && (
        <View style={s.campWrap}>
          <View style={s.campHead}>
            <Text style={s.campTitle}>⛺  SEEKER'S CAMP</Text>
            <Text style={s.campOrbChip}>
              {campLocked ? '🔒' : `💎 ${(orb ?? 0).toLocaleString()}`}
            </Text>
            <TouchableOpacity onPress={() => { setCampOpen(false); onPlaySound('tap'); }} style={s.campClose}>
              <Text style={s.campCloseTxt}>✕</Text>
            </TouchableOpacity>
          </View>
          <Text style={s.campSub}>Permanent upgrades — forged once, kept through every death.</Text>

          <ScrollView contentContainerStyle={s.campScroll} showsVerticalScrollIndicator={false}>
            {CAMP_KEYS.map((key) => {
              const def   = CAMP_DEFS[key];
              const lvl   = camp[key];
              const maxed = lvl >= L.UPGRADE_MAX_LEVEL;
              const cost  = maxed ? 0 : def.costs[lvl];
              const affordable = !campLocked && (orb ?? 0) >= cost;
              const isJust = justBought === key;
              return (
                <Animated.View key={key}
                  style={[
                    s.campCard,
                    // tier glow: border + shadow bloom with the upgrade level
                    { borderColor: def.color + (maxed ? 'CC' : lvl > 0 ? '66' : '38'),
                      shadowColor: def.color, shadowOpacity: 0.1 + lvl * 0.09 },
                    isJust && { transform: [{ scale: buyScale }] },
                  ]}>
                  <View style={s.campCardTop}>
                    <View style={[s.campIcon, { backgroundColor: def.color + '1e', borderColor: def.color + '55' }]}>
                      <Text style={s.campIconTxt}>{def.icon}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[s.campName, { color: def.color }]}>{def.name}</Text>
                      <Text style={s.campDesc}>{def.desc}</Text>
                    </View>
                    <View style={s.pipCol}>
                      <View style={s.pipRow}>
                        {Array.from({ length: L.UPGRADE_MAX_LEVEL }).map((_, i) => (
                          <View key={i}
                            style={[s.pip, i < lvl && { backgroundColor: def.color, borderColor: def.color }]} />
                        ))}
                      </View>
                      <Text style={s.pipLbl}>LV {lvl}/{L.UPGRADE_MAX_LEVEL}</Text>
                    </View>
                  </View>

                  <View style={s.campRow}>
                    <View>
                      <Text style={s.campValLbl}>NOW</Text>
                      <Text style={[s.campValNum, { color: def.color }]}>{def.valueLabels[lvl]}</Text>
                    </View>
                    {!maxed && (
                      <>
                        <Text style={s.campArrow}>→</Text>
                        <View>
                          <Text style={s.campValLbl}>NEXT</Text>
                          <Text style={s.campValNumNext}>{def.valueLabels[lvl + 1]}</Text>
                        </View>
                      </>
                    )}
                    <View style={{ flex: 1 }} />
                    {maxed ? (
                      <View style={[s.campMax, { borderColor: def.color + '66' }]}>
                        <Text style={[s.campMaxTxt, { color: def.color }]}>✦ MAX</Text>
                      </View>
                    ) : campLocked ? (
                      <View style={s.campLockBtn}>
                        <Text style={s.campLockTxt}>🔒 LOCKED</Text>
                      </View>
                    ) : (
                      <TouchableOpacity onPress={() => buyCampUpgrade(key)} disabled={!affordable}
                        activeOpacity={0.8}
                        style={[s.campBuyBtn, affordable ? { backgroundColor: def.color } : s.campBuyOff]}>
                        <Text style={[s.campBuyTxt, !affordable && s.campBuyTxtOff]}>
                          {affordable
                            ? `${cost.toLocaleString()} ORB`
                            : `NEED ${(cost - (orb ?? 0)).toLocaleString()}`}
                        </Text>
                      </TouchableOpacity>
                    )}
                  </View>

                  {isJust && (
                    <Animated.View pointerEvents="none" style={[s.campLevelUp, { opacity: buyFlashOp }]}>
                      <Text style={[s.campLevelUpTxt, { color: def.color }]}>▲ LEVEL UP</Text>
                    </Animated.View>
                  )}
                </Animated.View>
              );
            })}

            {/* Premium SOL offer — one card, calls onPaySol; stub-only by design */}
            <View style={s.solCard}>
              <Text style={s.solKicker}>◆ PREMIUM · PAY WITH SOL</Text>
              <View style={s.campCardTop}>
                <View style={s.solIcon}>
                  <Text style={s.campIconTxt}>🏮</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={s.solName}>ABYSS LANTERN</Text>
                  <Text style={s.solDesc}>
                    Spectral cyan flame for your torch · +{L.LANTERN_TORCH_BONUS.toFixed(1)} light radius · yours forever
                  </Text>
                </View>
              </View>
              <View style={s.campRow}>
                <View style={{ flex: 1 }} />
                {lantern ? (
                  <View style={s.solOwned}><Text style={s.solOwnedTxt}>✦ OWNED</Text></View>
                ) : (
                  <TouchableOpacity onPress={buyLantern} disabled={!onPaySol || paying}
                    activeOpacity={0.85} style={[s.solBuyBtn, (!onPaySol || paying) && s.solBuyOff]}>
                    <Text style={s.solBuyTxt}>
                      {paying ? 'CONFIRMING…' : onPaySol ? `◎ ${LANTERN_SOL} SOL` : 'COMING SOON'}
                    </Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>
          </ScrollView>
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
              {(run?.emberCharges ?? 0) > 0 && (
                <Text style={[s.hudChip, { color: '#f9a8d4' }]}>🕯️</Text>
              )}
              <Text style={s.hudChip}>✨ {collected}/{L.ITEM_COUNT}</Text>
              <Text style={[s.hudChip, { color: '#facc15' }]}>+{runOrb.toLocaleString()}</Text>
            </View>
            <TouchableOpacity onPress={() => { phaseRef.current = 'menu'; setPhase('menu'); }} style={s.quitBtn}>
              <Text style={s.quitTxt}>✕</Text>
            </TouchableOpacity>
          </View>

          {(() => {
            const g = run?.monsters.find(m => m.type === 'guardian' && !m.dead);
            if (!g) return null;
            const d = Math.hypot(g.pos.x - run!.player.pos.x, g.pos.z - run!.player.pos.z);
            if (d > L.MONSTER_AGGRO) return null;   // only once the boss is engaged
            const pct = Math.max(0, Math.min(1, g.hp / g.maxHp));
            return (
              <View style={s.bossWrap} pointerEvents="none">
                <Text style={s.bossName}>⚔  THE GUARDIAN</Text>
                <View style={s.bossTrack}>
                  <View style={[s.bossFill, { width: `${pct * 100}%` }]} />
                </View>
              </View>
            );
          })()}

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

  menuWrap:  { ...StyleSheet.absoluteFillObject, justifyContent: 'space-between',
               paddingTop: 74, paddingBottom: 40, paddingHorizontal: 24 },
  menuTop:   { alignItems: 'center' },
  menuKicker:{ color: '#f472b6', fontSize: 11, fontWeight: '900', letterSpacing: 3, marginBottom: 12 },
  menuTitle: { color: '#F5F3FF', fontSize: 46, fontWeight: '900', letterSpacing: 3, textAlign: 'center',
               lineHeight: 47, textShadowColor: 'rgba(124,58,237,0.9)', textShadowRadius: 20,
               textShadowOffset: { width: 0, height: 0 } },
  menuRule:  { width: 64, height: 3, borderRadius: 2, backgroundColor: '#7C3AED', marginTop: 16, opacity: 0.9 },
  menuTagline:{ color: '#a78bfa', fontSize: 13, fontWeight: '700', letterSpacing: 0.5, marginTop: 14,
               textAlign: 'center', maxWidth: 300 },

  menuBottom:{ alignItems: 'center' },
  menuStats: { flexDirection: 'row', gap: 10, marginBottom: 24 },
  statCard:  { alignItems: 'center', backgroundColor: 'rgba(18,12,36,0.72)', borderWidth: 1,
               borderColor: 'rgba(124,58,237,0.4)', borderRadius: 15, paddingVertical: 12,
               paddingHorizontal: 16, minWidth: 96 },
  statIcon:  { fontSize: 17, marginBottom: 4 },
  statVal:   { color: '#F5F3FF', fontSize: 19, fontWeight: '900' },
  statLbl:   { color: '#8b7bb8', fontSize: 9, fontWeight: '800', letterSpacing: 1.5, marginTop: 2 },
  menuMsg:   { color: '#f59e0b', fontSize: 12, fontWeight: '700', marginTop: 14 },

  descendBtn:{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: '#7C3AED',
               paddingVertical: 17, paddingHorizontal: 40, borderRadius: 22, borderWidth: 1,
               borderColor: 'rgba(196,181,253,0.6)', shadowColor: '#a855f7', shadowRadius: 24,
               shadowOpacity: 0.9, shadowOffset: { width: 0, height: 0 }, elevation: 12 },
  descendBtnOff:{ opacity: 0.5 },
  descendTxt:{ color: '#FFF', fontSize: 21, fontWeight: '900', letterSpacing: 3 },
  descendCost:{ backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: 11, paddingHorizontal: 11, paddingVertical: 4 },
  descendCostTxt:{ color: '#FDE68A', fontSize: 14, fontWeight: '900' },

  campBtn:  { marginTop: 12, flexDirection: 'row', alignItems: 'center', gap: 10,
              backgroundColor: 'rgba(8,13,30,0.88)', borderWidth: 1.5, borderColor: 'rgba(236,72,153,0.5)',
              paddingVertical: 12, paddingHorizontal: 26, borderRadius: 18 },
  campBtnTxt: { color: '#f9a8d4', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  campBtnBadge: { backgroundColor: 'rgba(236,72,153,0.18)', borderRadius: 9, paddingHorizontal: 8, paddingVertical: 3 },
  campBtnBadgeTxt: { color: '#f472b6', fontSize: 10, fontWeight: '900', letterSpacing: 0.5 },

  // ── Seeker's Camp panel ──
  campWrap:  { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(2,4,12,0.94)', paddingTop: 54 },
  campHead:  { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 18, marginBottom: 4, gap: 10 },
  campTitle: { flex: 1, color: '#F5F3FF', fontSize: 19, fontWeight: '900', letterSpacing: 2 },
  campOrbChip: { color: '#facc15', fontSize: 13, fontWeight: '900', backgroundColor: 'rgba(15,23,42,0.9)',
               paddingHorizontal: 12, paddingVertical: 6, borderRadius: 12, overflow: 'hidden' },
  campClose: { width: 36, height: 36, borderRadius: 18, backgroundColor: 'rgba(15,23,42,0.85)',
               alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.5)' },
  campCloseTxt: { color: '#94A3B8', fontSize: 15, fontWeight: '800' },
  campSub:   { color: '#8b7bb8', fontSize: 11, fontWeight: '700', letterSpacing: 0.4,
               paddingHorizontal: 18, marginBottom: 12 },
  campScroll:{ paddingHorizontal: 16, paddingBottom: 44, gap: 12 },

  campCard:  { backgroundColor: '#080D1E', borderRadius: 18, borderWidth: 1.5, padding: 14,
               shadowOffset: { width: 0, height: 0 }, shadowRadius: 14 },
  campCardTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  campIcon:  { width: 44, height: 44, borderRadius: 13, borderWidth: 1,
               alignItems: 'center', justifyContent: 'center' },
  campIconTxt: { fontSize: 21 },
  campName:  { fontSize: 13.5, fontWeight: '900', letterSpacing: 1 },
  campDesc:  { color: '#8b7bb8', fontSize: 11, fontWeight: '700', marginTop: 2 },
  pipCol:    { alignItems: 'flex-end', gap: 4 },
  pipRow:    { flexDirection: 'row', gap: 4 },
  pip:       { width: 9, height: 9, borderRadius: 3, backgroundColor: 'rgba(124,58,237,0.14)',
               borderWidth: 1, borderColor: 'rgba(124,58,237,0.35)' },
  pipLbl:    { color: '#64748B', fontSize: 8.5, fontWeight: '900', letterSpacing: 1 },
  campRow:   { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 8 },
  campValLbl:{ color: '#64748B', fontSize: 8.5, fontWeight: '900', letterSpacing: 1.2 },
  campValNum:{ fontSize: 16, fontWeight: '900' },
  campValNumNext: { color: '#F5F3FF', fontSize: 16, fontWeight: '900' },
  campArrow: { color: '#475569', fontSize: 15, fontWeight: '900', marginHorizontal: 2 },
  campBuyBtn:{ paddingHorizontal: 16, paddingVertical: 10, borderRadius: 13 },
  campBuyOff:{ backgroundColor: '#111a30' },
  campBuyTxt:{ color: '#04060f', fontSize: 12.5, fontWeight: '900', letterSpacing: 0.4 },
  campBuyTxtOff: { color: '#334155' },
  campLockBtn: { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 13,
               backgroundColor: '#0c1327', borderWidth: 1, borderColor: 'rgba(71,85,105,0.5)' },
  campLockTxt: { color: '#475569', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  campMax:   { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 13, borderWidth: 1.5,
               backgroundColor: 'rgba(124,58,237,0.08)' },
  campMaxTxt:{ fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  campLevelUp: { position: 'absolute', top: 10, right: 14 },
  campLevelUpTxt: { fontSize: 12, fontWeight: '900', letterSpacing: 1.5 },

  // ── Abyss Lantern (SOL offer) ──
  solCard:   { backgroundColor: '#0b0618', borderRadius: 20, borderWidth: 1.5,
               borderColor: 'rgba(236,72,153,0.65)', padding: 16, marginTop: 6,
               shadowColor: '#EC4899', shadowOpacity: 0.5, shadowRadius: 18,
               shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  solKicker: { color: '#f472b6', fontSize: 9, fontWeight: '900', letterSpacing: 2.5, marginBottom: 10 },
  solIcon:   { width: 48, height: 48, borderRadius: 15, borderWidth: 1, borderColor: 'rgba(34,211,238,0.5)',
               backgroundColor: 'rgba(34,211,238,0.10)', alignItems: 'center', justifyContent: 'center' },
  solName:   { color: '#F5F3FF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  solDesc:   { color: '#c4b5fd', fontSize: 11.5, fontWeight: '700', marginTop: 3, lineHeight: 16 },
  solBuyBtn: { backgroundColor: '#EC4899', paddingVertical: 12, paddingHorizontal: 22, borderRadius: 14 },
  solBuyOff: { opacity: 0.55 },
  solBuyTxt: { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },
  solOwned:  { borderWidth: 1.5, borderColor: 'rgba(34,211,238,0.6)', backgroundColor: 'rgba(34,211,238,0.08)',
               paddingVertical: 11, paddingHorizontal: 20, borderRadius: 14 },
  solOwnedTxt: { color: '#22d3ee', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

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

  bossWrap:  { position: 'absolute', top: 92, left: 44, right: 44, alignItems: 'center' },
  bossName:  { color: '#f472b6', fontSize: 11, fontWeight: '900', letterSpacing: 2, marginBottom: 4 },
  bossTrack: { height: 9, width: '100%', backgroundColor: 'rgba(15,23,42,0.85)', borderRadius: 5,
               overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(244,114,182,0.55)' },
  bossFill:  { height: '100%', backgroundColor: '#ec4899', borderRadius: 5 },

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
