import React, { useRef, useEffect } from 'react';
import { View, Text, TouchableWithoutFeedback, Animated, StyleSheet, Dimensions } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { useTheme } from '../lib/theme';

const { width } = Dimensions.get('window');
const ORB_SIZE = width * 0.45; // Идеальный размер для Seeker Phone

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
  // Анимации пульсации (ambient)
  const ambientPulse = useRef(new Animated.Value(1)).current;
  const haloScale1   = useRef(new Animated.Value(1)).current;
  const haloScale2   = useRef(new Animated.Value(1)).current;

  // Анимации при тапе
  const tapScale    = useRef(new Animated.Value(1)).current;
  const waveScale   = useRef(new Animated.Value(0)).current;
  const waveOpacity = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Бесконечный цикл "дыхания" ядра
    Animated.loop(
      Animated.sequence([
        Animated.timing(ambientPulse, { toValue: 1.04, duration: 900, useNativeDriver: true }),
        Animated.timing(ambientPulse, { toValue: 1.0,  duration: 900, useNativeDriver: true }),
      ])
    ).start();

    // Смещённые по фазе пульсации ореолов для эффекта космической туманности
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
    Animated.spring(tapScale, { toValue: 0.92, tension: 100, friction: 5, useNativeDriver: true }).start();
  };

  const handlePressOut = () => {
    if (disabled) return;
    Animated.spring(tapScale, { toValue: 1, tension: 100, friction: 5, useNativeDriver: true }).start();

    waveScale.setValue(0.8);
    waveOpacity.setValue(0.6);

    Animated.parallel([
      Animated.timing(waveScale,   { toValue: 1.8, duration: 300, useNativeDriver: true }),
      Animated.timing(waveOpacity, { toValue: 0,   duration: 300, useNativeDriver: true })
    ]).start();

    onTap();
  };

  // Boost-режим: огненный градиент. Иначе — палитра темы.
  const gradientColors: [string, string, string] = boostActive
    ? ['#FB923C', '#EA580C', '#9A3412']
    : [theme.primary, theme.primary, theme.accent];

  const waveBorder = boostActive ? '#FB923C' : theme.accent;
  const waveBg     = boostActive ? 'rgba(251,146,60,0.22)' : `${theme.accent}33`;
  const shadowCol  = boostActive ? '#EA580C' : theme.primary;
  const coreBg     = boostActive ? '#3B0A00' : theme.bgCard;
  const coreBorder = boostActive ? 'rgba(251,146,60,0.45)' : `${theme.accent}66`;

  return (
    <View style={s.container}>
      {/* Энергетическая волна от тапа */}
      <Animated.View style={[s.wave, {
        borderColor: waveBorder,
        backgroundColor: waveBg,
        transform: [{ scale: waveScale }],
        opacity: waveOpacity,
      }]} />

      {/* Внешний фоновый ореол 2 (Розовый туман) */}
      <Animated.View style={[s.halo, s.haloOuter, { transform: [{ scale: haloScale2 }] }]} />

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
  orbWrapper: {
    width: ORB_SIZE,
    height: ORB_SIZE,
    borderRadius: ORB_SIZE / 2,
    shadowRadius: 30,
    shadowOpacity: 0.8,
    elevation: 24,
  },
  orbGradient: {
    flex: 1,
    borderRadius: ORB_SIZE / 2,
    padding: 6,
  },
  orbCore: {
    flex: 1,
    borderRadius: ORB_SIZE / 2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  orbEmoji: {
    fontSize: 36,
    marginBottom: 4,
  },
  orbText: {
    color: '#FFF',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: 4,
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
