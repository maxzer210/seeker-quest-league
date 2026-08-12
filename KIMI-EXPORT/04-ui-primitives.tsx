/**
 * LabyrinthUI — shared ornate RPG primitives for the Abyss Labyrinth chrome.
 *
 * AAA rule: the labyrinth UI never renders OS emoji. Every glyph is a
 * hand-authored pixel sprite (lib/labyrinthSprites) drawn through <PixelIcon>,
 * a tiny STATIC Skia canvas — the picture is recorded once per (sprite, size)
 * with useMemo, so icons cost nothing per frame.
 *
 * The chrome language is "engraved dark stone": an outer glow line, an inner
 * parchment hairline, corner accents, and a subtle vertical gradient for depth
 * (expo-linear-gradient is already a dependency). 60fps discipline: no RAF
 * loops live here; all motion is native-driver Animated (transform/opacity).
 */
import React, { useMemo, useRef } from 'react';
import {
  Animated, StyleProp, StyleSheet, Text, TextStyle, TouchableOpacity, View, ViewStyle,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Canvas, Picture, Skia, createPicture } from '@shopify/react-native-skia';
import { spriteW, type Sprite } from '../lib/labyrinthSprites';

// ── tier / rarity language (Seeker's Camp upgrade levels) ────────────────────
// L0-1 slate · L2 green · L3 blue · L4 purple · L5 gold — the classic loot ramp.
export const TIER_COLORS = ['#64748B', '#64748B', '#22C55E', '#3B82F6', '#A855F7', '#FACC15'] as const;
export const TIER_NAMES  = ['COMMON', 'COMMON', 'UNCOMMON', 'RARE', 'EPIC', 'LEGENDARY'] as const;

export function tierColor(level: number): string {
  return TIER_COLORS[Math.max(0, Math.min(TIER_COLORS.length - 1, level))];
}
export function tierName(level: number): string {
  return TIER_NAMES[Math.max(0, Math.min(TIER_NAMES.length - 1, level))];
}

// ── <PixelIcon> — a sprite as a static Skia canvas ───────────────────────────
export const PixelIcon = React.memo(function PixelIcon({ sprite, size, style }: {
  sprite: Sprite;
  size: number;
  style?: StyleProp<ViewStyle>;
}) {
  // Recorded once: per-pixel rects over a transparent background. The canvas
  // never re-renders, so a screen full of icons stays free at runtime.
  const pic = useMemo(() => createPicture((canvas) => {
    const w = spriteW(sprite);
    const h = sprite.rows.length;
    const p = size / Math.max(w, h);            // pixel size so the sprite fits the box
    const x0 = (size - w * p) / 2;
    const y0 = (size - h * p) / 2;
    const paint = Skia.Paint();
    for (let r = 0; r < h; r++) {
      const row = sprite.rows[r];
      for (let c = 0; c < row.length; c++) {
        const ch = row[c];
        if (ch === '.' || ch === ' ') continue;
        const color = sprite.pal[ch];
        if (!color) continue;
        paint.setColor(Skia.Color(color));
        canvas.drawRect(Skia.XYWHRect(x0 + c * p, y0 + r * p, p + 0.4, p + 0.4), paint);
      }
    }
  }, { x: 0, y: 0, width: size, height: size }), [sprite, size]);

  return (
    <Canvas style={[{ width: size, height: size }, style]} pointerEvents="none">
      <Picture picture={pic} />
    </Canvas>
  );
});

// ── <OrnateCard> — layered engraved frame ────────────────────────────────────
// Outer glow line → depth gradient → inner parchment hairline → corner accents.
export function OrnateCard({ glow = '#7C3AED', radius = 18, style, contentStyle, children }: {
  glow?: string;                       // 6-digit hex; alpha suffixes are appended
  radius?: number;
  style?: StyleProp<ViewStyle>;        // outer frame (size / margins / shadow strength)
  contentStyle?: StyleProp<ViewStyle>; // inner padding / layout
  children?: React.ReactNode;
}) {
  return (
    <View style={[u.cardOuter, { borderRadius: radius, borderColor: glow + '4D', shadowColor: glow }, style]}>
      {/* dark-stone depth: near-black base lifting to a faint violet top edge */}
      <View pointerEvents="none" style={[StyleSheet.absoluteFill, { borderRadius: radius - 1, overflow: 'hidden' }]}>
        <LinearGradient colors={['#151030', '#0B0722', '#070512'] as const} style={StyleSheet.absoluteFill} />
      </View>
      {/* inner parchment hairline */}
      <View pointerEvents="none" style={[u.cardHairline, { borderRadius: Math.max(4, radius - 4) }]} />
      <View style={[u.cardContent, contentStyle]}>{children}</View>
      {/* corner accents */}
      <View pointerEvents="none" style={[u.corner, u.cornerTL, { borderColor: glow + 'B3' }]} />
      <View pointerEvents="none" style={[u.corner, u.cornerTR, { borderColor: glow + 'B3' }]} />
      <View pointerEvents="none" style={[u.corner, u.cornerBL, { borderColor: glow + 'B3' }]} />
      <View pointerEvents="none" style={[u.corner, u.cornerBR, { borderColor: glow + 'B3' }]} />
    </View>
  );
}

// ── <RuneButton> — circular rune-ring action button ──────────────────────────
const RUNE_TICKS = [0, 45, 90, 135, 180, 225, 270, 315] as const;

export function RuneButton({ sprite, label, color, size = 82, onPressIn, disabled = false, style }: {
  sprite: Sprite;
  label: string;
  color: string;                       // 6-digit hex
  size?: number;
  onPressIn?: () => void;              // fired on touch-down (game inputs are press-in)
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const press = useRef(new Animated.Value(0)).current;
  const scale = press.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] });
  const flash = press.interpolate({ inputRange: [0, 1], outputRange: [0, 0.26] });
  const down = () => {
    onPressIn?.();
    Animated.timing(press, { toValue: 1, duration: 50, useNativeDriver: true }).start();
  };
  const up = () => {
    Animated.timing(press, { toValue: 0, duration: 180, useNativeDriver: true }).start();
  };
  const inner = size - 18;
  return (
    <TouchableOpacity activeOpacity={1} onPressIn={down} onPressOut={up} disabled={disabled} style={style}>
      <Animated.View style={[u.runeRoot, {
        width: size, height: size, borderRadius: size / 2,
        borderColor: color + '73', backgroundColor: color + '17',
        shadowColor: color, transform: [{ scale }],
      }]}>
        {/* rune ticks around the ring */}
        {RUNE_TICKS.map((deg) => (
          <View key={deg} pointerEvents="none"
            style={[StyleSheet.absoluteFill, u.runeTickWrap, { transform: [{ rotate: `${deg}deg` }] }]}>
            <View style={[u.runeTick, { backgroundColor: color + '99' }]} />
          </View>
        ))}
        {/* inner disc: icon + small-caps label */}
        <View style={[u.runeInner, {
          width: inner, height: inner, borderRadius: inner / 2, borderColor: color + '59',
        }]}>
          <PixelIcon sprite={sprite} size={size * 0.34} />
          <Text style={u.runeLbl}>{label}</Text>
        </View>
        {/* pressed flash */}
        <Animated.View pointerEvents="none"
          style={[StyleSheet.absoluteFill, { borderRadius: size / 2, backgroundColor: color, opacity: flash }]} />
      </Animated.View>
    </TouchableOpacity>
  );
}

// ── <TierPips> — diamond upgrade pips, tinted by the current tier ────────────
export function TierPips({ level, max = 5, size = 8 }: {
  level: number;
  max?: number;
  size?: number;
}) {
  const c = tierColor(level);
  return (
    <View style={u.pipRow}>
      {Array.from({ length: max }).map((_, i) => {
        const lit = i < level;
        return (
          <View key={i} style={[u.pipDiamond, {
            width: size, height: size,
            backgroundColor: lit ? c : 'rgba(100,116,139,0.14)',
            borderColor: lit ? c : 'rgba(100,116,139,0.45)',
          }, lit && { shadowColor: c, shadowOpacity: 0.9, shadowRadius: 4, shadowOffset: { width: 0, height: 0 } }]} />
        );
      })}
    </View>
  );
}

// ── <StatMedallion> — ornate mini stat card (icon / value / small-caps) ──────
export function StatMedallion({ sprite, value, label, color = '#7C3AED', minWidth = 98 }: {
  sprite: Sprite;
  value: string;
  label: string;
  color?: string;                      // 6-digit hex
  minWidth?: number;
}) {
  return (
    <OrnateCard glow={color} radius={14} style={{ minWidth }} contentStyle={u.medContent}>
      <View style={[u.medIconRing, { borderColor: color + '5E', backgroundColor: color + '14' }]}>
        <PixelIcon sprite={sprite} size={19} />
      </View>
      <Text style={u.medVal}>{value}</Text>
      <Text style={u.medLbl}>{label}</Text>
    </OrnateCard>
  );
}

// ── <EngravedTitle> — dual-shadow display type (glow bloom + engraved ink) ───
// RN Text takes one shadow, so we stack two perfectly-aligned Texts: a glow
// underlay (wide soft shadow) and an ink overlay (tight dark bite below).
export function EngravedTitle({
  text, size = 22, color = '#F5F3FF', glow = '#7C3AED', letterSpacing = 3, lineHeight, align = 'center', style,
}: {
  text: string;
  size?: number;
  color?: string;
  glow?: string;
  letterSpacing?: number;
  lineHeight?: number;
  align?: 'left' | 'center';
  style?: StyleProp<ViewStyle>;
}) {
  const base: TextStyle = {
    fontSize: size, fontWeight: '900', letterSpacing, textAlign: align,
    ...(lineHeight !== undefined ? { lineHeight } : null),
  };
  return (
    <View style={style}>
      <Text style={[base, u.titleUnder, { color: glow, textShadowColor: glow }]}>{text}</Text>
      <Text style={[base, u.titleOver, { color }]}>{text}</Text>
    </View>
  );
}

// ── <OrnamentRule> — line · diamond · line divider ───────────────────────────
export function OrnamentRule({ color = '#7C3AED', width = 150, style }: {
  color?: string;                      // 6-digit hex
  width?: number;
  style?: StyleProp<ViewStyle>;
}) {
  return (
    <View style={[u.ruleRow, { width }, style]}>
      <View style={[u.ruleLine, { backgroundColor: color + '73' }]} />
      <View style={[u.ruleDiamond, { backgroundColor: color, shadowColor: color }]} />
      <View style={[u.ruleLine, { backgroundColor: color + '73' }]} />
    </View>
  );
}

const u = StyleSheet.create({
  // OrnateCard
  cardOuter:    { borderWidth: 1.5, backgroundColor: '#070512',
                  shadowOpacity: 0.45, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 6 },
  cardHairline: { position: 'absolute', top: 3, left: 3, right: 3, bottom: 3,
                  borderWidth: 1, borderColor: 'rgba(226,232,240,0.07)' },
  cardContent:  { padding: 12 },
  corner:       { position: 'absolute', width: 10, height: 10 },
  cornerTL:     { top: 4, left: 4, borderTopWidth: 2, borderLeftWidth: 2, borderTopLeftRadius: 3 },
  cornerTR:     { top: 4, right: 4, borderTopWidth: 2, borderRightWidth: 2, borderTopRightRadius: 3 },
  cornerBL:     { bottom: 4, left: 4, borderBottomWidth: 2, borderLeftWidth: 2, borderBottomLeftRadius: 3 },
  cornerBR:     { bottom: 4, right: 4, borderBottomWidth: 2, borderRightWidth: 2, borderBottomRightRadius: 3 },

  // RuneButton
  runeRoot:     { borderWidth: 2, alignItems: 'center', justifyContent: 'center',
                  shadowOpacity: 0.55, shadowRadius: 12, shadowOffset: { width: 0, height: 0 }, elevation: 7 },
  runeTickWrap: { alignItems: 'center' },
  runeTick:     { width: 2, height: 5, marginTop: 2, borderRadius: 1 },
  runeInner:    { borderWidth: 1, alignItems: 'center', justifyContent: 'center',
                  backgroundColor: 'rgba(5,3,16,0.55)' },
  runeLbl:      { color: '#E2E8F0', fontSize: 9, fontWeight: '900', letterSpacing: 1.5, marginTop: 2 },

  // TierPips
  pipRow:       { flexDirection: 'row', gap: 5, paddingHorizontal: 2 },
  pipDiamond:   { borderWidth: 1, borderRadius: 1.5, transform: [{ rotate: '45deg' }] },

  // StatMedallion
  medContent:   { alignItems: 'center', paddingVertical: 11, paddingHorizontal: 10 },
  medIconRing:  { width: 32, height: 32, borderRadius: 16, borderWidth: 1,
                  alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
  medVal:       { color: '#F5F3FF', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  medLbl:       { color: '#8B7BB8', fontSize: 8.5, fontWeight: '800', letterSpacing: 1.8, marginTop: 3 },

  // EngravedTitle
  titleUnder:   { position: 'absolute', left: 0, right: 0, top: 0,
                  textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  titleOver:    { textShadowColor: 'rgba(0,0,0,0.85)', textShadowRadius: 2, textShadowOffset: { width: 0, height: 2 } },

  // OrnamentRule
  ruleRow:      { flexDirection: 'row', alignItems: 'center', gap: 8 },
  ruleLine:     { flex: 1, height: 1.5, borderRadius: 1 },
  ruleDiamond:  { width: 7, height: 7, borderRadius: 1.5, transform: [{ rotate: '45deg' }],
                  shadowOpacity: 0.9, shadowRadius: 5, shadowOffset: { width: 0, height: 0 } },
});
