import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

export default function CosmeticNftTeaser() {
  const shimmerValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.timing(shimmerValue, {
        toValue: 1,
        duration: 2500,
        useNativeDriver: true,
      })
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const pulseOpacity = shimmerValue.interpolate({
    inputRange: [0, 0.5, 1],
    outputRange: [0.3, 0.8, 0.3],
  });

  return (
    <View style={s.container}>
      <LinearGradient
        colors={['#1a0040', '#3B0764', '#831843']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={s.card}
      >
        {/* Живой пульсирующий слой блика */}
        <Animated.View style={[StyleSheet.absoluteFill, { opacity: pulseOpacity }]}>
          <LinearGradient
            colors={['transparent', 'rgba(250, 204, 21, 0.15)', 'transparent']}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>

        {/* Контент карточки */}
        <View style={s.content}>
          <View style={s.headerRow}>
            <Text style={s.badge}>🎨 COSMETIC NFTS</Text>
            <View style={s.premiumBadge}>
              <Text style={s.premiumText}>COMING SOON</Text>
            </View>
          </View>

          <Text style={s.emojiIcon}>🎭✨</Text>

          <Text style={s.title}>КАСТОМИЗАЦИЯ ОРБА</Text>
          <Text style={s.description}>
            Уникальные скины ядра, эксклюзивные анимации взрывов и статус-ауры для холдеров лимитированных NFT Genesis.
          </Text>

          {/* Прогресс-бар заглушка */}
          <View style={s.progressContainer}>
            <View style={s.progressBarBg}>
              <LinearGradient
                colors={['#7C3AED', '#EC4899']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 0 }}
                style={s.progressBarFill}
              />
            </View>
            <Text style={s.progressText}>ЗАГРУЗКА АССЕТОВ... 88%</Text>
          </View>
        </View>
      </LinearGradient>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    marginTop: 14,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(236, 72, 153, 0.3)',
    overflow: 'hidden',
    shadowColor: '#EC4899',
    shadowRadius: 15,
    shadowOpacity: 0.3,
    elevation: 8,
  },
  card: {
    padding: 20,
  },
  content: {
    zIndex: 2,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  badge: {
    color: '#C084FC',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 1.5,
  },
  premiumBadge: {
    backgroundColor: '#FACC15',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  premiumText: {
    color: '#020510',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
  emojiIcon: {
    fontSize: 40,
    textAlign: 'center',
    marginVertical: 10,
  },
  title: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 2,
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    color: '#94A3B8',
    fontSize: 11,
    textAlign: 'center',
    lineHeight: 16,
    paddingHorizontal: 10,
    marginBottom: 20,
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBarBg: {
    width: '100%',
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 3,
    overflow: 'hidden',
    marginBottom: 6,
  },
  progressBarFill: {
    width: '88%',
    height: '100%',
    borderRadius: 3,
  },
  progressText: {
    color: '#EC4899',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 1,
  },
});
