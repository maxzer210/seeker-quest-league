import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

interface WalletProps {
  orbBalance:   number;
  skoraBalance: number;
  solBalance:   number;
  onRefill:     () => void;
  onConvert:    () => void;
  /** Show verified badge if true */
  isVerified?:  boolean;
  /** Show "0.005 SOL" or similar — overridable */
  refillCost?:  string;
}

export default function PremiumWallet({
  orbBalance, skoraBalance, solBalance, onRefill, onConvert,
  isVerified = false, refillCost = '0.005 SOL',
}: WalletProps) {
  const glowAnim = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1,   duration: 1000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0.4, duration: 1000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  return (
    <View style={s.container}>
      {/* Заголовок */}
      <Text style={s.title}>👤 SKORA WALLET</Text>
      <Text style={s.subtitle}>SOLANA DEVNET HUB</Text>

      {/* Основная карточка баланса */}
      <View style={s.card}>
        <LinearGradient
          colors={['rgba(20, 241, 149, 0.15)', 'rgba(0, 194, 255, 0.05)']}
          style={s.cardGradient}
        >
          {/* Ряд SOL (Главный Премиум акцент) */}
          <View style={s.cryptoRow}>
            <View>
              <Text style={s.label}>SOLANA BALANCE</Text>
              <Text style={s.solValue}>{solBalance.toFixed(3)} SOL</Text>
            </View>
            <Text style={s.largeEmoji}>🪙</Text>
          </View>

          <View style={s.divider} />

          {/* Ряд токена SKORA */}
          <View style={s.cryptoRow}>
            <View>
              <Text style={s.label}>TOKEN BALANCES</Text>
              <Text style={s.skoraValue}>{skoraBalance.toFixed(4)} SKORA</Text>
              <Text style={s.orbValue}>{orbBalance.toLocaleString()} ORB</Text>
            </View>
            <Text style={s.largeEmoji}>💠</Text>
          </View>
        </LinearGradient>
      </View>

      {/* Блок действий */}
      <View style={s.actionContainer}>
        <TouchableOpacity style={s.buttonSecondary} onPress={onConvert} activeOpacity={0.8}>
          <Text style={s.btnTextSec}>CONVERT 10K ORB ➔ SKORA</Text>
        </TouchableOpacity>

        <Animated.View style={[s.refillWrapper, { shadowOpacity: glowAnim }]}>
          <TouchableOpacity onPress={onRefill} activeOpacity={0.8}>
            <LinearGradient
              colors={['#14F195', '#00C2FF']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={s.buttonPrimary}
            >
              <Text style={s.btnTextPrim}>⚡ INSTANT ENERGY REFILL</Text>
              <View style={s.badge}>
                <Text style={s.badgeText}>{refillCost}</Text>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </Animated.View>
      </View>

      {/* Плашка верификации Seeker */}
      {isVerified && (
        <View style={s.verifiedBadge}>
          <Text style={s.verifiedText}>✓ SEEKER PHONE VERIFIED</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    padding: 20,
    backgroundColor: '#020510',
  },
  title: {
    color: '#FFF',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
  },
  subtitle: {
    color: '#00C2FF',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 3,
    textAlign: 'center',
    marginBottom: 20,
  },
  card: {
    backgroundColor: '#080D1E',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(20, 241, 149, 0.3)',
    overflow: 'hidden',
    marginBottom: 20,
  },
  cardGradient: {
    padding: 24,
  },
  cryptoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    color: '#94A3B8',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 2,
    marginBottom: 6,
  },
  solValue: {
    color: '#14F195',
    fontSize: 32,
    fontWeight: '900',
  },
  skoraValue: {
    color: '#00C2FF',
    fontSize: 24,
    fontWeight: '900',
  },
  orbValue: {
    color: '#7C3AED',
    fontSize: 14,
    fontWeight: '700',
    marginTop: 2,
  },
  largeEmoji: {
    fontSize: 36,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    marginVertical: 16,
  },
  actionContainer: {
    gap: 12,
  },
  refillWrapper: {
    shadowColor: '#14F195',
    shadowRadius: 16,
    elevation: 10,
  },
  buttonPrimary: {
    flexDirection: 'row',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  btnTextPrim: {
    color: '#020510',
    fontSize: 13,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  badge: {
    backgroundColor: '#020510',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  badgeText: {
    color: '#FACC15',
    fontSize: 11,
    fontWeight: '900',
  },
  buttonSecondary: {
    backgroundColor: '#0F172A',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.4)',
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
  },
  btnTextSec: {
    color: '#C084FC',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 2,
  },
  verifiedBadge: {
    marginTop: 24,
    alignSelf: 'center',
    backgroundColor: 'rgba(20, 241, 149, 0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 30,
    borderWidth: 1,
    borderColor: 'rgba(20, 241, 149, 0.2)',
  },
  verifiedText: {
    color: '#14F195',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
