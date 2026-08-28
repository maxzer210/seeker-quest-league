import React, { useEffect, useRef, forwardRef, useImperativeHandle } from 'react';
import {
  View, Text, StyleSheet, Animated, Easing, Dimensions,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import LottieView from 'lottie-react-native';

const { width: W, height: H } = Dimensions.get('window');

const CONFETTI_COUNT = 18;
const CONFETTI_COLORS = ['#A855F7','#EC4899','#FACC15','#22C55E','#06B6D4','#FB923C'];

export interface WinCelebrationHandle {
  show: (amount: number, label?: string) => void;
}

interface ConfettiPiece {
  x: Animated.Value;
  y: Animated.Value;
  rot: Animated.Value;
  scale: Animated.Value;
  color: string;
  size: number;
  startX: number;
}

const WinCelebration = forwardRef<WinCelebrationHandle>((_props, ref) => {
  const visible    = useRef(new Animated.Value(0)).current;
  const cardScale  = useRef(new Animated.Value(0)).current;
  const orbCounter = useRef(new Animated.Value(0)).current;
  const amountRef  = useRef(0);
  const labelRef   = useRef('ORB');
  const [displayAmount, setDisplayAmount] = React.useState(0);
  const [displayLabel,  setDisplayLabel]  = React.useState('ORB');
  const [isVisible,     setIsVisible]     = React.useState(false);

  // Pre-create confetti pieces
  const confetti = useRef<ConfettiPiece[]>(
    Array.from({ length: CONFETTI_COUNT }, (_, i) => ({
      x:      new Animated.Value(0),
      y:      new Animated.Value(0),
      rot:    new Animated.Value(0),
      scale:  new Animated.Value(0),
      color:  CONFETTI_COLORS[i % CONFETTI_COLORS.length],
      size:   6 + Math.random() * 8,
      startX: (Math.random() - 0.5) * W * 0.9,
    }))
  ).current;

  useImperativeHandle(ref, () => ({
    show(amount: number, label = 'ORB') {
      amountRef.current  = amount;
      labelRef.current   = label;
      setDisplayAmount(amount);
      setDisplayLabel(label);
      setIsVisible(true);

      // Reset
      visible.setValue(0);
      cardScale.setValue(0);
      orbCounter.setValue(0);
      confetti.forEach(p => {
        p.x.setValue(0); p.y.setValue(0);
        p.rot.setValue(0); p.scale.setValue(0);
      });

      // Sequence
      Animated.parallel([
        // Backdrop fade in
        Animated.timing(visible, { toValue: 1, duration: 250, useNativeDriver: true }),
        // Card spring
        Animated.spring(cardScale, { toValue: 1, friction: 5, tension: 180, useNativeDriver: true }),
        // Confetti burst
        ...confetti.map(p => Animated.parallel([
          Animated.timing(p.scale, { toValue: 1, duration: 300, easing: Easing.out(Easing.back(2)), useNativeDriver: true }),
          Animated.timing(p.x, { toValue: p.startX, duration: 800 + Math.random() * 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.y, { toValue: -(H * 0.35 + Math.random() * H * 0.25), duration: 800 + Math.random() * 400, easing: Easing.out(Easing.quad), useNativeDriver: true }),
          Animated.timing(p.rot, { toValue: (Math.random() - 0.5) * 720, duration: 1200, easing: Easing.linear, useNativeDriver: true }),
        ])),
      ]).start();

      // ORB counter
      const listener = orbCounter.addListener(({ value }) => {
        setDisplayAmount(Math.round(value));
      });
      Animated.timing(orbCounter, {
        toValue: amount, duration: 800, easing: Easing.out(Easing.quad), useNativeDriver: false,
      }).start();

      // Auto-dismiss after 2.2s
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(visible,   { toValue: 0, duration: 300, useNativeDriver: true }),
          Animated.timing(cardScale, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => {
          setIsVisible(false);
          orbCounter.removeListener(listener);
        });
      }, 2200);
    },
  }));

  if (!isVisible) return null;

  return (
    <Animated.View style={[s.backdrop, { opacity: visible }]} pointerEvents="none">
      {/* Rings and sparkles behind everything. Vector, so it stays sharp on any
          screen, and it only mounts while the overlay is up. */}
      {isVisible && (
        <LottieView
          source={require('../assets/lottie/victory.json')}
          autoPlay
          loop={false}
          style={s.lottieBurst}
          resizeMode="cover"
        />
      )}

      {/* Coins rising through the card */}
      {isVisible && (
        <LottieView
          source={require('../assets/lottie/orb-collect.json')}
          autoPlay
          loop
          style={s.lottieCoins}
          resizeMode="cover"
        />
      )}

      {/* Confetti */}
      {confetti.map((p, i) => (
        <Animated.View key={i} style={[s.confettiPiece, {
          backgroundColor: p.color,
          width:  p.size,
          height: p.size,
          borderRadius: i % 3 === 0 ? p.size / 2 : 2,
          transform: [
            { translateX: p.x },
            { translateY: p.y },
            { rotate: p.rot.interpolate({ inputRange: [-720, 720], outputRange: ['-720deg', '720deg'] }) },
            { scale: p.scale },
          ],
        }]} />
      ))}

      {/* Card */}
      <Animated.View style={[s.cardWrap, { transform: [{ scale: cardScale }] }]}>
        <LinearGradient colors={['#1a0040', '#3B0764', '#831843', '#1a0040']} style={s.card}>
          <Text style={s.winText}>🏆  YOU WIN!</Text>
          <View style={s.amountRow}>
            <Text style={s.amountPlus}>+</Text>
            <Text style={s.amountNum}>{displayAmount.toLocaleString()}</Text>
            <Text style={s.amountLabel}>{displayLabel}</Text>
          </View>
          <View style={s.shineLine} />
        </LinearGradient>
      </Animated.View>
    </Animated.View>
  );
});

WinCelebration.displayName = 'WinCelebration';
export default WinCelebration;

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop:     { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                  backgroundColor: 'rgba(0,0,0,0.75)', zIndex: 999,
                  alignItems: 'center', justifyContent: 'center' },

  confettiPiece:{ position: 'absolute', top: H * 0.55, left: W / 2 },

  // Both sit behind the card and ignore touches — the backdrop already does.
  lottieBurst:  { position: 'absolute', width: W * 1.15, height: W * 1.15 },
  lottieCoins:  { position: 'absolute', width: W * 0.9,  height: W * 0.9, bottom: H * 0.28 },

  cardWrap:     { alignItems: 'center' },
  card:         { borderRadius: 28, paddingVertical: 28, paddingHorizontal: 40,
                  alignItems: 'center', borderWidth: 1.5, borderColor: '#A855F7',
                  shadowColor: '#A855F7', shadowRadius: 32, shadowOpacity: 0.9, elevation: 24 },
  winText:      { color: '#FACC15', fontSize: 24, fontWeight: '900', letterSpacing: 3, marginBottom: 12 },
  amountRow:    { flexDirection: 'row', alignItems: 'flex-end', gap: 4 },
  amountPlus:   { color: '#22C55E', fontSize: 28, fontWeight: '900', lineHeight: 52 },
  amountNum:    { color: '#ffffff', fontSize: 52, fontWeight: '900', letterSpacing: -1 },
  amountLabel:  { color: '#A855F7', fontSize: 22, fontWeight: '900', lineHeight: 52, marginLeft: 4 },
  shineLine:    { width: 80, height: 2, borderRadius: 1, backgroundColor: '#EC4899',
                  marginTop: 16, opacity: 0.6 },
});
