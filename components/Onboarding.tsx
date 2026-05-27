import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated, Easing,
  Dimensions, TextInput, ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { t, useLang } from '../lib/i18n';

const { width: SW } = Dimensions.get('window');

interface OnboardingProps {
  onDone: (username?: string) => void;
}

export default function Onboarding({ onDone }: OnboardingProps) {
  const insets = useSafeAreaInsets();
  const lang = useLang();

  const [screen, setScreen] = useState(0);
  const [username, setUsername] = useState('');
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    fadeAnim.setValue(0);
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 400,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [screen, fadeAnim]);

  const handleNext = () => {
    if (screen < 3) {
      setScreen(screen + 1);
    } else {
      onDone(username.trim() || undefined);
    }
  };

  const handleSkip = () => {
    onDone(undefined);
  };

  return (
    <View style={[s.container, { paddingTop: insets.top, paddingBottom: insets.bottom }]}>
      <Animated.View style={[s.screenContainer, { opacity: fadeAnim }]}>
        {screen === 0 && <Screen0 />}
        {screen === 1 && <Screen1 />}
        {screen === 2 && <Screen2 />}
        {screen === 3 && <Screen3 username={username} setUsername={setUsername} />}
      </Animated.View>

      {/* Progress dots */}
      <View style={s.dotsContainer}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[s.dot, i === screen && s.dotActive]}
          />
        ))}
      </View>

      {/* Buttons */}
      <View style={s.buttonsRow}>
        <TouchableOpacity style={s.skipBtn} onPress={handleSkip}>
          <Text style={s.skipBtnText}>
            {screen === 3 ? t('common.skip') : t('common.skip')}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={s.nextBtn} onPress={handleNext}>
          <Text style={s.nextBtnText}>
            {screen === 3 ? t('common.done') : t('common.next')}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

function Screen0() {
  return (
    <ScrollView style={s.screenScroll} contentContainerStyle={s.screenContent}>
      <Text style={s.title}>🚀 Seeker Quest League</Text>
      <Text style={s.subtitle}>{t('onboarding.welcome')}</Text>
      <Text style={s.description}>
        {t('onboarding.desc0')}
      </Text>
    </ScrollView>
  );
}

function Screen1() {
  return (
    <ScrollView style={s.screenScroll} contentContainerStyle={s.screenContent}>
      <Text style={s.title}>{t('onboarding.tapTitle')}</Text>
      <View style={s.itemsContainer}>
        <Item emoji="👆" text={t('onboarding.tap1')} />
        <Item emoji="⚡" text={t('onboarding.tap2')} />
        <Item emoji="🔥" text={t('onboarding.tap3')} />
        <Item emoji="💎" text={t('onboarding.tap4')} />
      </View>
    </ScrollView>
  );
}

function Screen2() {
  return (
    <ScrollView style={s.screenScroll} contentContainerStyle={s.screenContent}>
      <Text style={s.title}>{t('onboarding.gamesTitle')}</Text>
      <View style={s.itemsContainer}>
        <Game emoji="🎰" name={t('onboarding.gameWheel')} />
        <Game emoji="⚔️" name={t('onboarding.gameArena')} />
        <Game emoji="🚀" name={t('onboarding.gameRunner')} />
        <Game emoji="🎯" name={t('onboarding.gameTreasure')} />
      </View>
    </ScrollView>
  );
}

function Screen3({ username, setUsername }: { username: string; setUsername: (u: string) => void }) {
  return (
    <ScrollView style={s.screenScroll} contentContainerStyle={s.screenContent}>
      <Text style={s.title}>{t('onboarding.currenciesTitle')}</Text>
      <View style={s.currencyBox}>
        <Text style={s.currencyLabel}>
          <Text style={s.orbEmoji}>⭐</Text> {t('onboarding.orbDesc')}
        </Text>
      </View>
      <View style={s.currencyBox}>
        <Text style={s.currencyLabel}>
          <Text style={s.skoraEmoji}>💰</Text> {t('onboarding.skoraDesc')}
        </Text>
      </View>
      <Text style={s.namePrompt}>{t('onboarding.namePrompt')}</Text>
      <TextInput
        style={s.nameInput}
        placeholder={t('onboarding.namePlaceholder')}
        placeholderTextColor="#94A3B8"
        value={username}
        onChangeText={setUsername}
        maxLength={16}
      />
    </ScrollView>
  );
}

function Item({ emoji, text }: { emoji: string; text: string }) {
  return (
    <View style={s.item}>
      <Text style={s.itemEmoji}>{emoji}</Text>
      <Text style={s.itemText}>{text}</Text>
    </View>
  );
}

function Game({ emoji, name }: { emoji: string; name: string }) {
  return (
    <View style={s.gameBox}>
      <Text style={s.gameEmoji}>{emoji}</Text>
      <Text style={s.gameName}>{name}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
  },
  screenContainer: {
    flex: 1,
    marginTop: 20,
  },
  screenScroll: {
    flex: 1,
  },
  screenContent: {
    paddingBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#F1F5F9',
    marginBottom: 12,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#E0F2FE',
    marginBottom: 16,
    textAlign: 'center',
  },
  description: {
    fontSize: 15,
    color: '#CBD5E1',
    lineHeight: 24,
    textAlign: 'center',
  },
  itemsContainer: {
    gap: 12,
    marginTop: 16,
  },
  item: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 8,
    padding: 12,
    gap: 12,
  },
  itemEmoji: {
    fontSize: 24,
    minWidth: 32,
  },
  itemText: {
    fontSize: 14,
    color: '#CBD5E1',
    flex: 1,
    lineHeight: 20,
  },
  currencyBox: {
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 8,
    padding: 16,
    marginVertical: 8,
  },
  currencyLabel: {
    fontSize: 14,
    color: '#CBD5E1',
    lineHeight: 22,
  },
  orbEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  skoraEmoji: {
    fontSize: 18,
    marginRight: 4,
  },
  gameBox: {
    alignItems: 'center',
    backgroundColor: 'rgba(30, 41, 59, 0.8)',
    borderRadius: 8,
    padding: 16,
    marginBottom: 8,
  },
  gameEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  gameName: {
    fontSize: 14,
    color: '#CBD5E1',
    fontWeight: '500',
    textAlign: 'center',
  },
  namePrompt: {
    fontSize: 14,
    color: '#CBD5E1',
    marginTop: 20,
    marginBottom: 8,
    textAlign: 'center',
  },
  namePlaceholder: {
    color: '#94A3B8',
  },
  nameInput: {
    borderWidth: 1,
    borderColor: '#475569',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: '#F1F5F9',
    fontSize: 14,
    backgroundColor: 'rgba(15, 23, 42, 0.5)',
  },
  dotsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#475569',
  },
  dotActive: {
    backgroundColor: '#60A5FA',
    width: 24,
  },
  buttonsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  skipBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#475569',
    alignItems: 'center',
  },
  skipBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  nextBtn: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#3B82F6',
    alignItems: 'center',
  },
  nextBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
