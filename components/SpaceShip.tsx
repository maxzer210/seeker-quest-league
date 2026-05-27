import React from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

type Props = {
  size?: number;
  primary?: string;      // основной цвет корпуса
  accent?: string;       // крылья / двигатель
  enginePulse?: Animated.Value;  // 0..1
};

/**
 * Custom-drawn premium space ship.
 * Без emoji — собран из View/borderRadius/LinearGradient.
 */
export default function SpaceShip({
  size = 56, primary = '#A855F7', accent = '#EC4899', enginePulse,
}: Props) {
  const bodyW    = size * 0.42;
  const bodyH    = size * 0.7;
  const noseH    = size * 0.32;       // высота "носа" (треугольник)
  const wingW    = size * 0.18;
  const wingH    = size * 0.38;
  const cockpitR = size * 0.10;
  const engineW  = size * 0.20;
  const engineH  = size * 0.32;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      {/* Glow halo под кораблём */}
      <View
        style={[styles.glow, {
          width: size * 1.0, height: size * 1.0, borderRadius: size,
          backgroundColor: primary,
          opacity: 0.18,
          top: size * 0.05,
        }]}
      />

      {/* Левое крыло (треугольник) */}
      <View style={[styles.wingLeft, {
        left: (size - bodyW) / 2 - wingW + 4,
        top: size * 0.40,
        borderRightWidth:  wingW,
        borderTopWidth:    wingH * 0.45,
        borderBottomWidth: wingH * 0.55,
        borderRightColor: accent,
      }]} />

      {/* Правое крыло (треугольник) */}
      <View style={[styles.wingRight, {
        right: (size - bodyW) / 2 - wingW + 4,
        top: size * 0.40,
        borderLeftWidth:   wingW,
        borderTopWidth:    wingH * 0.45,
        borderBottomWidth: wingH * 0.55,
        borderLeftColor: accent,
      }]} />

      {/* Нос корабля (треугольник вверх) */}
      <View style={[styles.nose, {
        left: (size - 0) / 2 - bodyW / 2,
        top: size * 0.05,
        borderLeftWidth:   bodyW / 2,
        borderRightWidth:  bodyW / 2,
        borderBottomWidth: noseH,
        borderBottomColor: primary,
      }]} />

      {/* Корпус (прямоугольник) */}
      <LinearGradient
        colors={[primary, accent]}
        start={{ x: 0, y: 0 }} end={{ x: 0, y: 1 }}
        style={[styles.body, {
          left: (size - bodyW) / 2,
          top: size * 0.05 + noseH - 1,
          width: bodyW,
          height: bodyH - noseH,
          borderBottomLeftRadius: 4,
          borderBottomRightRadius: 4,
        }]}
      />

      {/* Кокпит (стеклянный кружок) */}
      <View style={[styles.cockpit, {
        left: (size - cockpitR * 2) / 2,
        top: size * 0.05 + noseH * 0.55,
        width: cockpitR * 2, height: cockpitR * 2,
        borderRadius: cockpitR,
      }]} />

      {/* Пламя двигателя — пульсирует если передан enginePulse */}
      <View style={{
        position: 'absolute',
        left: (size - engineW) / 2,
        top: size * 0.05 + bodyH - 4,
        width: engineW,
        height: engineH,
        alignItems: 'center',
      }}>
        {enginePulse ? (
          <Animated.View style={{
            width: engineW,
            height: engineH,
            transform: [{ scaleY: enginePulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1.3] }) }],
            opacity: enginePulse.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }),
          }}>
            <LinearGradient
              colors={[accent, '#FACC15', 'transparent']}
              start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
              style={{ flex: 1, borderBottomLeftRadius: engineW, borderBottomRightRadius: engineW }}
            />
          </Animated.View>
        ) : (
          <LinearGradient
            colors={[accent, '#FACC15', 'transparent']}
            start={{ x: 0.5, y: 0 }} end={{ x: 0.5, y: 1 }}
            style={{ width: engineW, height: engineH, borderBottomLeftRadius: engineW, borderBottomRightRadius: engineW }}
          />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    position: 'relative',
  },
  glow: {
    position: 'absolute',
    alignSelf: 'center',
  },
  nose: {
    position: 'absolute',
    width: 0, height: 0,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderStyle: 'solid',
  },
  body: {
    position: 'absolute',
  },
  wingLeft: {
    position: 'absolute',
    width: 0, height: 0,
    borderLeftColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderStyle: 'solid',
  },
  wingRight: {
    position: 'absolute',
    width: 0, height: 0,
    borderRightColor: 'transparent',
    borderTopColor: 'transparent',
    borderBottomColor: 'transparent',
    borderStyle: 'solid',
  },
  cockpit: {
    position: 'absolute',
    backgroundColor: '#E0F2FE',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.6)',
  },
});
