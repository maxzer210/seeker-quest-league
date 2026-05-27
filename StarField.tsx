import React, { useEffect, useRef } from 'react';
import { Animated, Dimensions, StyleSheet, View } from 'react-native';

const { width: SW, height: SH } = Dimensions.get('screen');

// ─── static data (created once at module load, never change) ─────────────────

type StarDatum = {
  x: number; y: number; size: number;
  minOp: number; maxOp: number; dur: number; delay: number;
};
type NebulaDatum = {
  x: number; y: number; size: number;
  color: string; minOp: number; maxOp: number; dur: number;
};

const STARS: StarDatum[] = Array.from({ length: 45 }, () => ({
  x:     Math.random() * SW,
  y:     Math.random() * SH,
  size:  0.8 + Math.random() * 2.6,
  minOp: 0.04 + Math.random() * 0.12,
  maxOp: 0.38 + Math.random() * 0.62,
  dur:   1100 + Math.random() * 4200,
  delay: Math.random() * 3000,
}));

const NEBULAE: NebulaDatum[] = [
  { x: -80,       y: -60,       size: 380, color: '#7C3AED', minOp: 0.07, maxOp: 0.13, dur: 7000 },
  { x: SW * 0.55, y: -50,       size: 310, color: '#0EA5E9', minOp: 0.05, maxOp: 0.10, dur: 8800 },
  { x: -60,       y: SH * 0.38, size: 360, color: '#4F46E5', minOp: 0.05, maxOp: 0.10, dur: 9200 },
  { x: SW * 0.62, y: SH * 0.52, size: 330, color: '#7C3AED', minOp: 0.04, maxOp: 0.09, dur: 6800 },
  { x: SW * 0.15, y: SH * 0.76, size: 290, color: '#06B6D4', minOp: 0.05, maxOp: 0.09, dur: 8200 },
];

// ─── component ────────────────────────────────────────────────────────────────

/**
 * Full-screen animated star field. Mount once inside SafeAreaView.
 * All 45 star twinkles + 5 nebula pulses run on the native thread.
 * Zero re-renders after mount.
 */
export function StarField() {
  const starAnims   = useRef<Animated.Value[]>(STARS.map(() => new Animated.Value(0))).current;
  const nebulaAnims = useRef<Animated.Value[]>(NEBULAE.map(() => new Animated.Value(0))).current;

  useEffect(() => {
    const timeouts: ReturnType<typeof setTimeout>[] = [];

    // Stars: staggered starts so they don't all pulse in sync
    STARS.forEach((star, i) => {
      const t = setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(starAnims[i], { toValue: 1, duration: star.dur, useNativeDriver: true }),
            Animated.timing(starAnims[i], { toValue: 0, duration: star.dur, useNativeDriver: true }),
          ])
        ).start();
      }, star.delay);
      timeouts.push(t);
    });

    // Nebulae: stagger by index
    NEBULAE.forEach((n, i) => {
      const t = setTimeout(() => {
        Animated.loop(
          Animated.sequence([
            Animated.timing(nebulaAnims[i], { toValue: 1, duration: n.dur, useNativeDriver: true }),
            Animated.timing(nebulaAnims[i], { toValue: 0, duration: n.dur, useNativeDriver: true }),
          ])
        ).start();
      }, i * 700);
      timeouts.push(t);
    });

    return () => timeouts.forEach(clearTimeout);
  }, []);

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">

      {/* ── nebula blobs ── */}
      {NEBULAE.map((n, i) => (
        <Animated.View
          key={`nb${i}`}
          style={{
            position:        'absolute',
            left:            n.x,
            top:             n.y,
            width:           n.size,
            height:          n.size,
            borderRadius:    n.size / 2,
            backgroundColor: n.color,
            opacity: nebulaAnims[i].interpolate({
              inputRange:  [0, 1],
              outputRange: [n.minOp, n.maxOp],
            }),
          }}
        />
      ))}

      {/* ── stars ── */}
      {STARS.map((star, i) => (
        <Animated.View
          key={`st${i}`}
          style={{
            position:        'absolute',
            left:            star.x,
            top:             star.y,
            width:           star.size,
            height:          star.size,
            borderRadius:    star.size / 2,
            backgroundColor: '#FFFFFF',
            opacity: starAnims[i].interpolate({
              inputRange:  [0, 1],
              outputRange: [star.minOp, star.maxOp],
            }),
          }}
        />
      ))}

    </View>
  );
}
