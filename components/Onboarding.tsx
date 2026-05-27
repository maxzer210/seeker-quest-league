import React, { useRef, useState } from 'react';
import {
  View, Text, TouchableOpacity, StyleSheet, Animated,
  Dimensions, TextInput,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';

const { width: W, height: H } = Dimensions.get('window');

const SLIDES = [
  {
    icon:    '✦',
    title:   'SEEKER QUEST',
    sub:     'The crypto tap-to-earn game',
    body:    'Tap, play games and climb the leaderboard. Top players win real SOL prizes every season.',
    color:   '#A855F7',
    colors:  ['#0d0025', '#1a0040', '#3B0764', '#1a0040'] as const,
  },
  {
    icon:    '⚡',
    title:   'TAP TO EARN',
    sub:     'Every tap = ORB',
    body:    'ORB is your in-game currency. Tap the signal on the Home screen, upgrade your power, earn combos and crits.',
    color:   '#FACC15',
    colors:  ['#0d0020', '#1a0040', '#2D1B00', '#1a0040'] as const,
  },
  {
    icon:    '🎮',
    title:   'PLAY GAMES',
    sub:     '6 games, endless ORB',
    body:    'Horse Race, Space Runner, Fortune Wheel, Arena Raids, Treasure Hunt, Seeker Lands — each game earns you ORB and Tournament points.',
    color:   '#22C55E',
    colors:  ['#0d0025', '#001a0d', '#003320', '#001a0d'] as const,
  },
  {
    icon:    '🏆',
    title:   'WIN PRIZES',
    sub:     'Season Zero · Genesis League',
    body:    'Top players each season win SOL from the prize pool. Every Wheel spin grows the pot. Be in the top 100 to earn.',
    color:   '#EC4899',
    colors:  ['#0d0025', '#1a0040', '#4C0028', '#1a0040'] as const,
  },
];

interface Props {
  onDone: (name: string) => void;
}

export default function Onboarding({ onDone }: Props) {
  const [slide, setSlide]   = useState(0);
  const [name,  setName]    = useState('');
  const [showName, setShowName] = useState(false);

  const slideAnim = useRef(new Animated.Value(0)).current;
  const iconBob   = useRef(new Animated.Value(0)).current;
  const iconPulse = useRef(new Animated.Value(1)).current;

  React.useEffect(() => {
    // Bob animation for icon
    Animated.loop(Animated.sequence([
      Animated.timing(iconBob, { toValue: -10, duration: 1100, useNativeDriver: true }),
      Animated.timing(iconBob, { toValue:   0, duration: 1100, useNativeDriver: true }),
    ])).start();
    Animated.loop(Animated.sequence([
      Animated.timing(iconPulse, { toValue: 1.08, duration: 900, useNativeDriver: true }),
      Animated.timing(iconPulse, { toValue: 1,    duration: 900, useNativeDriver: true }),
    ])).start();
  }, []);

  function next() {
    if (slide < SLIDES.length - 1) {
      Animated.sequence([
        Animated.timing(slideAnim, { toValue: -W, duration: 220, useNativeDriver: true }),
      ]).start(() => {
        setSlide(s => s + 1);
        slideAnim.setValue(W);
        Animated.spring(slideAnim, { toValue: 0, friction: 8, tension: 60, useNativeDriver: true }).start();
      });
    } else {
      setShowName(true);
    }
  }

  function finish() {
    const n = name.trim().slice(0, 20);
    onDone(n || '');
  }

  const cur = SLIDES[slide];

  if (showName) {
    return (
      <LinearGradient colors={['#0d0025', '#1a0040', '#3B0764', '#1a0040', '#0d0025']} style={s.root}>
        <View style={s.nameWrap}>
          <Text style={s.nameIcon}>✦</Text>
          <Text style={s.nameTitle}>WHAT'S YOUR NAME?</Text>
          <Text style={s.nameSub}>Shown on the leaderboard</Text>
          <TextInput
            style={s.nameInput}
            value={name}
            onChangeText={setName}
            placeholder="e.g. nova.skr"
            placeholderTextColor="#334155"
            maxLength={20}
            autoFocus
            autoCapitalize="none"
          />
          <TouchableOpacity onPress={finish} activeOpacity={0.85}>
            <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }} style={s.startBtn}>
              <Text style={s.startBtnText}>
                {name.trim() ? `PLAY AS ${name.trim().toUpperCase()}` : 'SKIP & START PLAYING'}
              </Text>
            </LinearGradient>
          </TouchableOpacity>
          <Text style={s.nameNote}>You can change this later in your Profile</Text>
        </View>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={[...cur.colors]} style={s.root}>
      {/* Shimmer */}
      <View style={s.shimmerLines}>
        {[0.1, 0.35, 0.65, 0.88].map((x, i) => (
          <View key={i} style={[s.shimmerLine, { left: `${x * 100}%` as any, opacity: 0.04 + i * 0.01 }]} />
        ))}
      </View>

      {/* Content */}
      <Animated.View style={[s.content, { transform: [{ translateX: slideAnim }] }]}>
        {/* Icon */}
        <Animated.Text style={[s.slideIcon, { color: cur.color,
          transform: [{ translateY: iconBob }, { scale: iconPulse }] }]}>
          {cur.icon}
        </Animated.Text>

        <Text style={[s.slideTitle, { color: cur.color }]}>{cur.title}</Text>
        <Text style={s.slideSub}>{cur.sub}</Text>

        <View style={[s.divider, { backgroundColor: cur.color + '55' }]} />

        <Text style={s.slideBody}>{cur.body}</Text>
      </Animated.View>

      {/* Dots */}
      <View style={s.dotsRow}>
        {SLIDES.map((_, i) => (
          <View key={i} style={[s.dot, i === slide && { backgroundColor: cur.color, width: 20 }]} />
        ))}
      </View>

      {/* Next button */}
      <TouchableOpacity onPress={next} activeOpacity={0.85} style={s.nextBtnWrap}>
        <LinearGradient
          colors={[cur.color + 'EE', cur.color + '88']}
          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
          style={s.nextBtn}
        >
          <Text style={s.nextBtnText}>
            {slide < SLIDES.length - 1 ? 'NEXT  →' : 'CONTINUE  →'}
          </Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* Skip */}
      <TouchableOpacity onPress={() => setShowName(true)} style={s.skipBtn}>
        <Text style={s.skipText}>skip</Text>
      </TouchableOpacity>
    </LinearGradient>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:         { flex: 1, alignItems: 'center', justifyContent: 'center' },

  shimmerLines: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 },
  shimmerLine:  { position: 'absolute', top: 0, bottom: 0, width: 1,
                  backgroundColor: '#fff' },

  content:      { alignItems: 'center', paddingHorizontal: 32, width: W },
  slideIcon:    { fontSize: 72, marginBottom: 20 },
  slideTitle:   { fontSize: 30, fontWeight: '900', letterSpacing: 4, textAlign: 'center' },
  slideSub:     { color: '#64748B', fontSize: 13, letterSpacing: 1, marginTop: 8, textAlign: 'center' },
  divider:      { width: 48, height: 2, borderRadius: 1, marginVertical: 20 },
  slideBody:    { color: '#94A3B8', fontSize: 15, lineHeight: 24, textAlign: 'center' },

  dotsRow:      { flexDirection: 'row', gap: 6, marginTop: 40, marginBottom: 20 },
  dot:          { width: 8, height: 8, borderRadius: 4, backgroundColor: '#1E293B' },

  nextBtnWrap:  { width: W - 64 },
  nextBtn:      { borderRadius: 18, paddingVertical: 18, alignItems: 'center' },
  nextBtnText:  { color: '#fff', fontSize: 16, fontWeight: '900', letterSpacing: 2 },

  skipBtn:      { marginTop: 16, padding: 10 },
  skipText:     { color: '#1E293B', fontSize: 12, letterSpacing: 1 },

  // Name screen
  nameWrap:     { alignItems: 'center', paddingHorizontal: 32, width: W },
  nameIcon:     { color: '#A855F7', fontSize: 52, marginBottom: 16 },
  nameTitle:    { color: '#E2E8F0', fontSize: 22, fontWeight: '900', letterSpacing: 3, textAlign: 'center' },
  nameSub:      { color: '#475569', fontSize: 12, marginTop: 8, marginBottom: 28, letterSpacing: 1 },
  nameInput:    { width: '100%', backgroundColor: '#0F172A', borderRadius: 16,
                  borderWidth: 1.5, borderColor: '#7C3AED',
                  color: '#E2E8F0', fontSize: 18, fontWeight: '800',
                  paddingHorizontal: 20, paddingVertical: 16,
                  textAlign: 'center', letterSpacing: 1, marginBottom: 20 },
  startBtn:     { borderRadius: 18, paddingVertical: 18, paddingHorizontal: 32 },
  startBtnText: { color: '#fff', fontSize: 15, fontWeight: '900', letterSpacing: 2 },
  nameNote:     { color: '#1E293B', fontSize: 11, marginTop: 16, letterSpacing: 0.5 },
});
