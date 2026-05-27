import React, {
  forwardRef,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { Animated, StyleSheet, View } from 'react-native';

// ─── config ───────────────────────────────────────────────────────────────────

const POOL_SIZE = 24;
const RING_POOL = 3;

const TAP_PALETTE     = ['#A855F7', '#C084FC', '#7C3AED', '#E879F9', '#D946EF'];
const CRIT_PALETTE    = ['#FB923C', '#FACC15', '#F97316', '#FDE68A', '#FBBF24'];
const JACKPOT_PALETTE = ['#FACC15', '#34D399', '#60A5FA', '#F472B6', '#A78BFA', '#FB923C'];

// ─── types ────────────────────────────────────────────────────────────────────

export type EmitType = 'tap' | 'crit' | 'jackpot';

export type ParticleEmitterHandle = {
  /** Call with screen coords from nativeEvent.pageX / pageY */
  emit: (x: number, y: number, type?: EmitType) => void;
};

type Slot = {
  tx:     Animated.Value;
  ty:     Animated.Value;
  op:     Animated.Value; // core opacity
  glow:   Animated.Value; // bloom halo opacity (driven separately)
  sc:     Animated.Value;
  rot:    Animated.Value;
  rotDeg: ReturnType<Animated.Value['interpolate']>; // pre-computed, never recreated
};

type Ring = {
  tx: Animated.Value;
  ty: Animated.Value;
  sc: Animated.Value;
  op: Animated.Value;
};

// ─── pool factories (called once per component mount) ─────────────────────────

function makeSlots(): Slot[] {
  return Array.from({ length: POOL_SIZE }, () => {
    const rot = new Animated.Value(0);
    return {
      tx:     new Animated.Value(0),
      ty:     new Animated.Value(0),
      op:     new Animated.Value(0),
      glow:   new Animated.Value(0),
      sc:     new Animated.Value(1),
      rot,
      // Pre-compute interpolation node once — never recreated on re-render
      rotDeg: rot.interpolate({
        inputRange:  [-20, 20],
        outputRange: ['-1145deg', '1145deg'],
      }),
    };
  });
}

function makeRings(): Ring[] {
  return Array.from({ length: RING_POOL }, () => ({
    tx: new Animated.Value(0),
    ty: new Animated.Value(0),
    sc: new Animated.Value(0.1),
    op: new Animated.Value(0),
  }));
}

// ─── component ────────────────────────────────────────────────────────────────

/**
 * Mount once inside SafeAreaView (fills parent absolutely, pointerEvents="none").
 * Call ref.current.emit(pageX, pageY, type) on tap / crit / jackpot.
 *
 * Architecture:
 *  - 24-slot pre-allocated pool → zero GC on rapid taps
 *  - Every animation uses useNativeDriver: true → JS thread untouched per-frame
 *  - Each particle = bloom halo (large, dim) + bright core (rotating diamond or circle)
 *  - Ring bursts expand outward on crit/jackpot
 *  - One batched setTick re-render per emit to pick up new color/size metadata
 */
export const ParticleEmitter = forwardRef<ParticleEmitterHandle>(
  function ParticleEmitter(_, ref) {
    const slots      = useRef<Slot[]>(makeSlots());
    const rings      = useRef<Ring[]>(makeRings());
    const inUse      = useRef<boolean[]>(new Array(POOL_SIZE).fill(false));
    const ringInUse  = useRef<boolean[]>(new Array(RING_POOL).fill(false));

    // Metadata in refs: updated before setTick so the render sees correct values
    const colors     = useRef<string[]>(new Array(POOL_SIZE).fill('#A855F7'));
    const sizes      = useRef<number[]>(new Array(POOL_SIZE).fill(8));
    const isDiamond  = useRef<boolean[]>(new Array(POOL_SIZE).fill(false));
    const ringColors = useRef<string[]>(new Array(RING_POOL).fill('#A855F7'));
    const ringSizes  = useRef<number[]>(new Array(RING_POOL).fill(50));

    const [, setTick] = useState(0);

    useImperativeHandle(
      ref,
      () => ({
        emit(x, y, type = 'tap') {
          const palette =
            type === 'jackpot' ? JACKPOT_PALETTE :
            type === 'crit'    ? CRIT_PALETTE    : TAP_PALETTE;

          const pCount =
            type === 'jackpot' ? 20 :
            type === 'crit'    ? 12 : 6;

          const rCount =
            type === 'jackpot' ? 3 :
            type === 'crit'    ? 2 : 0;

          // ── particles ────────────────────────────────────────────────────
          let pSpawned = 0;
          for (let i = 0; i < POOL_SIZE && pSpawned < pCount; i++) {
            if (inUse.current[i]) continue;
            inUse.current[i] = true;

            const angle   = (pSpawned / pCount) * Math.PI * 2 + (Math.random() - 0.5) * 1.4;
            const minDist = type === 'jackpot' ? 65 : type === 'crit' ? 50 : 26;
            const dist    = minDist + Math.random() * 70;
            const ms      = 380 + Math.random() * 300;
            const initOp  = type === 'tap' ? 0.82 : 1.0;
            const rotEnd  = (Math.random() - 0.5) * 18; // radians, maps to ±~515 deg

            colors.current[i]    = palette[Math.floor(Math.random() * palette.length)];
            sizes.current[i]     =
              type === 'jackpot' ? 7  + Math.random() * 11 :
              type === 'crit'    ? 8  + Math.random() * 10 :
                                   4  + Math.random() * 8;
            isDiamond.current[i] = Math.random() < 0.38;

            const s = slots.current[i];
            s.tx.setValue(x);
            s.ty.setValue(y);
            s.op.setValue(initOp);
            s.glow.setValue(initOp * 0.28);
            s.sc.setValue(0.08);
            s.rot.setValue(0);

            Animated.parallel([
              Animated.timing(s.tx,   { toValue: x + Math.cos(angle) * dist, duration: ms, useNativeDriver: true }),
              Animated.timing(s.ty,   { toValue: y + Math.sin(angle) * dist, duration: ms, useNativeDriver: true }),
              Animated.timing(s.op,   { toValue: 0, duration: ms, useNativeDriver: true }),
              Animated.timing(s.glow, { toValue: 0, duration: ms, useNativeDriver: true }),
              Animated.spring(s.sc,   { toValue: 1, friction: 4.5, tension: 85, useNativeDriver: true }),
              Animated.timing(s.rot,  { toValue: rotEnd, duration: ms, useNativeDriver: true }),
            ]).start(() => { inUse.current[i] = false; });

            pSpawned++;
          }

          // ── rings ─────────────────────────────────────────────────────────
          let rSpawned = 0;
          for (let i = 0; i < RING_POOL && rSpawned < rCount; i++) {
            if (ringInUse.current[i]) continue;
            ringInUse.current[i] = true;

            const delay = rSpawned * 140;
            const sz    = type === 'jackpot' ? 60 : 46;

            ringColors.current[i] = palette[Math.floor(Math.random() * palette.length)];
            ringSizes.current[i]  = sz;

            const r = rings.current[i];
            // top: -sz/2, left: -sz/2 in style centers the ring at (tx, ty)
            r.tx.setValue(x);
            r.ty.setValue(y);
            r.sc.setValue(0.1);
            r.op.setValue(0.9);

            Animated.sequence([
              Animated.delay(delay),
              Animated.parallel([
                Animated.timing(r.sc, {
                  toValue:  type === 'jackpot' ? 3.2 : 2.5,
                  duration: 600,
                  useNativeDriver: true,
                }),
                Animated.sequence([
                  Animated.timing(r.op, { toValue: 0.75, duration: 80,  useNativeDriver: true }),
                  Animated.timing(r.op, { toValue: 0,    duration: 520, useNativeDriver: true }),
                ]),
              ]),
            ]).start(() => { ringInUse.current[i] = false; });

            rSpawned++;
          }

          if (pSpawned > 0 || rSpawned > 0) setTick(n => n + 1);
        },
      }),
      []
    );

    return (
      <View style={StyleSheet.absoluteFill} pointerEvents="none">

        {/* ── ring bursts ── */}
        {rings.current.map((r, i) => {
          const sz  = ringSizes.current[i];
          const clr = ringColors.current[i];
          return (
            <Animated.View
              key={`ring-${i}`}
              style={{
                position:        'absolute',
                top:             -sz / 2,   // centers ring on ty
                left:            -sz / 2,   // centers ring on tx
                width:           sz,
                height:          sz,
                borderRadius:    sz / 2,
                borderWidth:     2.5,
                borderColor:     clr,
                backgroundColor: 'transparent',
                opacity:         r.op,
                transform: [
                  { translateX: r.tx },
                  { translateY: r.ty },
                  { scale: r.sc },
                ],
              }}
            />
          );
        })}

        {/* ── particles: bloom halo + bright core ── */}
        {slots.current.map((s, i) => {
          const sz  = sizes.current[i];
          const clr = colors.current[i];
          // Diamond: low border-radius square that rotates → spinning star effect
          const br  = isDiamond.current[i] ? sz * 0.12 : sz / 2;

          return (
            <React.Fragment key={i}>

              {/*
               * Bloom halo: 2.8× larger, ~28% opacity, circular (always).
               * top/left offset of -sz*0.9 centers the halo on the core's tx/ty.
               * Core center = (tx + sz/2, ty + sz/2); halo center = (tx - sz*0.9 + sz*1.4, ...) = same.
               */}
              <Animated.View
                style={{
                  position:        'absolute',
                  top:             -sz * 0.9,
                  left:            -sz * 0.9,
                  width:           sz * 2.8,
                  height:          sz * 2.8,
                  borderRadius:    sz * 1.4,
                  backgroundColor: clr,
                  opacity:         s.glow,
                  transform: [
                    { translateX: s.tx },
                    { translateY: s.ty },
                    { scale: s.sc },
                  ],
                }}
              />

              {/* Bright core: sharp edges, spins via rotDeg */}
              <Animated.View
                style={{
                  position:        'absolute',
                  top:             0,
                  left:            0,
                  width:           sz,
                  height:          sz,
                  borderRadius:    br,
                  backgroundColor: clr,
                  opacity:         s.op,
                  transform: [
                    { translateX: s.tx },
                    { translateY: s.ty },
                    { scale: s.sc },
                    { rotate: s.rotDeg },
                  ],
                }}
              />

            </React.Fragment>
          );
        })}

      </View>
    );
  }
);
