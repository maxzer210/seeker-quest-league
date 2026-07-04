import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback, Animated, Easing, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';

const { width } = Dimensions.get('window');
const ORB_SIZE = width * 0.52; // bigger, more physical presence

type Props = {
  onTap: () => void;
  /** When true, орб мутится и не реагирует на тапы (energy empty) */
  disabled?: boolean;
  /** Когда активен буст — меняем цвета волны/градиента на огненные */
  boostActive?: boolean;
  /** Текст в центре (по умолчанию "TAP"). Например, таймер energy. */
  centerLabel?: string;
  /** Emoji в центре (по умолчанию 🌌). Например ⚡ когда energy = 0. */
  centerEmoji?: string;
};

export default function PremiumTapOrb({
  onTap, disabled = false, boostActive = false,
  centerLabel = 'TAP', centerEmoji,
}: Props) {
  const theme = useTheme();
  const resolvedEmoji = centerEmoji ?? theme.orbEmoji;

  // Ambient (always-alive) animations
  const ambientPulse = useRef(new Animated.Value(1)).current;   // core "breathing" scale
  const glowPulse    = useRef(new Animated.Value(0.5)).current; // aura opacity/scale
  const spin         = useRef(new Animated.Value(0)).current;   // slow energy-ring rotation
  const haloScale1   = useRef(new Animated.Value(1)).current;
  const haloScale2   = useRef(new Animated.Value(1)).current;

  // Tap animations
  const tapScale    = useRef(new Animated.Value(1)).current;
  const waveScale   = useRef(new Animated.Value(0)).current;
  const waveOpacity = useRef(new Animated.Value(0)).current;
  const flash       = useRef(new Animated.Value(0)).current;    // bright flash on tap

  useEffect(() => {
    // Core breathing — a touch deeper so the orb feels alive
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientPulse, { toValue: 1.06, duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(ambientPulse, { toValue: 1.0,  duration: 1100, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Pulsing aura glow (breathes slightly out of phase with the core)
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowPulse, { toValue: 1,    duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
        Animated.timing(glowPulse, { toValue: 0.45, duration: 1300, easing: Easing.inOut(Easing.ease), useNativeDriver: true }),
      ])
    ).start();

    // Slow continuous rotation of the outer energy ring
    Animated.loop(
      Animated.timing(spin, { toValue: 1, duration: 9000, easing: Easing.linear, useNativeDriver: true })
    ).start();

    // Nebula halo pulses
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale1, { toValue: 1.25, duration: 1400, useNativeDriver: true }),
        Animated.timing(haloScale1, { toValue: 1.0,  duration: 1400, useNativeDriver: true }),
      ])
    ).start();
    Animated.loop(
      Animated.sequence([
        Animated.timing(haloScale2, { toValue: 1.15, duration: 1900, useNativeDriver: true }),
        Animated.timing(haloScale2, { toValue: 1.0,  duration: 1900, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  const handlePressIn = () => {
    if (disabled) return;
    Animated.spring(tapScale, { toValue: 0.9, tension: 120, friction: 5, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(tapScale, { toValue: 1, tension: 90, friction: 4, useNativeDriver: true }).start();

    // Expanding energy wave
    waveScale.setValue(0.8);
    waveOpacity.setValue(0.6);
    Animated.parallel([
      Animated.timing(waveScale,   { toValue: 1.9, duration: 320, useNativeDriver: true }),
      Animated.timing(waveOpacity, { toValue: 0,   duration: 320, useNativeDriver: true }),
    ]).start();

    // Bright flash on the core
    flash.setValue(0.5);
    Animated.timing(flash, { toValue: 0, duration: 280, useNativeDriver: true }).start();

    onTap();
  };

  const spinDeg = spin.interpolate({ inputRange: [0, 1], outputRange: ['0deg', '360deg'] });

  // Boost-режим: огненный градиент. Иначе — палитра темы.
  const gradientColors: [string, string, string] = boostActive
    ? ['#FB923C', '#EA580C', '#9A3412']
    : [theme.primary, theme.primary, theme.accent];

  const waveBorder = boostActive ? '#FB923C' : theme.accent;
  const waveBg     = boostActive ? 'rgba(251,146,60,0.22)' : `${theme.accent}33`;
  const shadowCol  = boostActive ? '#EA580C' : theme.primary;
  const auraCol    = boostActive ? '#F97316' : theme.accent;
  const coreBg     = boostActive ? '#3B0A00' : theme.bgCard;
  const coreBorder = boostActive ? 'rgba(251,146,60,0.45)' : `${theme.accent}66`;

  return (
    <View style={s.container}>
      {/* Pulsing aura glow — the "breathing" light behind the orb */}
      <Animated.View
        pointerEvents="none"
        style={[s.aura, {
          backgroundColor: auraCol,
          opacity: disabled ? 0.08 : glowPulse.interpolate({ inputRange: [0.45, 1], outputRange: [0.14, 0.34] }),
          transform: [{ scale: glowPulse.interpolate({ inputRange: [0.45, 1], outputRange: [1, 1.18] }) }],
        }]}
      />

      {/* Энергетическая волна от тапа */}
      <Animated.View style={[s.wave, {
        borderColor: waveBorder,
        backgroundColor: waveBg,
        transform: [{ scale: waveScale }],
        opacity: waveOpacity,
      }]} />

      {/* Внешнее вращающееся энергокольцо (Розовый туман) */}
      <Animated.View style={[s.halo, s.haloOuter, {
        transform: [{ scale: haloScale2 }, { rotate: spinDeg }],
      }]} />

      {/* Внутренний фоновый ореол 1 (Фиолетовое свечение) */}
      <Animated.View style={[s.halo, s.haloInner, { transform: [{ scale: haloScale1 }] }]} />

      {/* Основное интерактивное Ядро */}
      <TouchableWithoutFeedback onPressIn={handlePressIn} onPressOut={handlePressOut}>
        <Animated.View style={[
          s.orbWrapper,
          { shadowColor: shadowCol, opacity: disabled ? 0.45 : 1 },
          { transform: [{ scale: Animated.multiply(ambientPulse, tapScale) }] },
        ]}>
          <LinearGradient
            colors={gradientColors}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={s.orbGradient}
          >
            <View style={[s.orbCore, { backgroundColor: coreBg, borderColor: coreBorder }]}>
              <Text style={s.orbEmoji}>{resolvedEmoji}</Text>
              <Text style={s.orbText}>{centerLabel}</Text>
            </View>

            {/* 3D gloss highlight (top-left sheen) */}
            <View pointerEvents="none" style={s.gloss} />

            {/* Tap flash overlay */}
            <Animated.View pointerEvents="none" style={[s.tapFlash, { opacity: flash }]} />
          </LinearGradient>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 24,
    height: ORB_SIZE * 1.6,
  },
  aura: {
    position: 'absolute',
    width: ORB_SIZE * 1.5,
    height: ORB_SIZE * 1.5,
    borderRadius: (ORB_SIZE * 1.5) / 2,
  },
  orbWrapper: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    shadowRadius: 34,
    shadowOpacity: 0.9,
    elevation: 24,
  },
  orbGradient: {
    flex: 1,
    borderRadius: ORB_SIZE / 2,
    padding: 6,
    overflow: 'hidden',
  },
  orbCore: {
    flex: 1,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  orbEmoji: {
    fontSize: 40,
    marginBottom: 4,
  },
  orbText: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 5,
    textShadowColor: 'rgba(255,255,255,0.5)',
    textShadowRadius: 8,
    textShadowOffset: { width: 0, height: 0 },
  },
  gloss: {
    position: 'absolute',
    top: ORB_SIZE * 0.10,
    left: ORB_SIZE * 0.16,
    width: ORB_SIZE * 0.5,
    height: ORB_SIZE * 0.3,
    borderRadius: ORB_SIZE * 0.25,
    backgroundColor: 'rgba(255,255,255,0.18)',
    transform: [{ rotate: '-25deg' }],
  },
  tapFlash: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    borderRadius: ORB_SIZE / 2,
    backgroundColor: 'rgba(255,255,255,0.85)',
  },
  halo: {
    position: 'absolute',
    width: ORB_SIZE * 1.2,
    height: ORB_SIZE * 1.2,
    borderRadius: (ORB_SIZE * 1.2) / 2,
    borderWidth: 2,
  },
  haloInner: {
    borderColor: 'rgba(124, 58, 237, 0.25)',
    backgroundColor: 'rgba(124, 58, 237, 0.05)',
  },
  haloOuter: {
    width: ORB_SIZE * 1.4,
    height: ORB_SIZE * 1.4,
    borderRadius: (ORB_SIZE * 1.4) / 2,
    borderColor: 'rgba(236, 72, 153, 0.15)',
    borderStyle: 'dashed',
  },
  wave: {
    position: 'absolute',
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    borderWidth: 4,
  },
});
