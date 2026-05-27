import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, SafeAreaView } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { LANGUAGES, setLang, t, useLang } from '../lib/i18n';

type Props = {
  onDone: () => void;
};

export default function LanguageSelector({ onDone }: Props) {
  const _lang = useLang(); // force re-render on lang change

  return (
    <SafeAreaView style={s.root}>
      <View style={s.content}>
        {/* Logo */}
        <View style={s.logoWrap}>
          <LinearGradient colors={['#7C3AED', '#EC4899']} style={s.logoCircle}>
            <Text style={s.logoLetter}>S</Text>
          </LinearGradient>
          <Text style={s.brand}>SEEKER QUEST LEAGUE</Text>
          <Text style={s.tagline}>SEASON ZERO  ·  GENESIS LEAGUE</Text>
        </View>

        {/* Title */}
        <View style={s.titleWrap}>
          <Text style={s.title}>🌐  {t('lang.choose')}</Text>
          <Text style={s.subtitle}>{t('lang.subtitle')}</Text>
        </View>

        {/* Language buttons */}
        <View style={s.btnList}>
          {LANGUAGES.map(L => (
            <TouchableOpacity
              key={L.code}
              activeOpacity={0.85}
              onPress={async () => { await setLang(L.code); }}
              style={s.btnWrap}
            >
              <LinearGradient
                colors={_lang === L.code ? ['#7C3AED', '#EC4899'] : ['#0F172A', '#1E293B']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={[s.btn, _lang === L.code && s.btnActive]}
              >
                <Text style={s.flag}>{L.flag}</Text>
                <View style={{ flex: 1 }}>
                  <Text style={[s.btnNative, _lang === L.code && { color: '#FFF' }]}>{L.native}</Text>
                  <Text style={[s.btnName, _lang === L.code && { color: 'rgba(255,255,255,0.7)' }]}>{L.name}</Text>
                </View>
                {_lang === L.code && <Text style={s.check}>✓</Text>}
              </LinearGradient>
            </TouchableOpacity>
          ))}
        </View>

        {/* Continue */}
        <TouchableOpacity activeOpacity={0.85} onPress={onDone} style={s.continueWrap}>
          <LinearGradient
            colors={['#14F195', '#00C2FF']}
            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
            style={s.continue}
          >
            <Text style={s.continueTxt}>{t('common.continue')}  →</Text>
          </LinearGradient>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  root:        { flex: 1, backgroundColor: '#020510' },
  content:     { flex: 1, paddingHorizontal: 24, paddingVertical: 32, justifyContent: 'space-between' },

  logoWrap:    { alignItems: 'center', gap: 8 },
  logoCircle:  { width: 90, height: 90, borderRadius: 45, alignItems: 'center', justifyContent: 'center' },
  logoLetter:  { color: '#FFF', fontSize: 48, fontWeight: '900' },
  brand:       { color: '#C084FC', fontSize: 18, fontWeight: '900', letterSpacing: 3, marginTop: 12 },
  tagline:     { color: '#475569', fontSize: 10, letterSpacing: 2, fontWeight: '700' },

  titleWrap:   { alignItems: 'center', gap: 6 },
  title:       { color: '#F1F5F9', fontSize: 20, fontWeight: '900', textAlign: 'center', letterSpacing: 1 },
  subtitle:    { color: '#64748B', fontSize: 12 },

  btnList:     { gap: 8 },
  btnWrap:     { borderRadius: 16, overflow: 'hidden' },
  btn:         { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 14,
                 borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' },
  btnActive:   { borderColor: 'rgba(124,58,237,0.7)' },
  flag:        { fontSize: 26 },
  btnNative:   { color: '#E2E8F0', fontSize: 16, fontWeight: '900' },
  btnName:     { color: '#475569', fontSize: 11, marginTop: 2 },
  check:       { color: '#FFF', fontSize: 22, fontWeight: '900' },

  continueWrap:{ borderRadius: 18, overflow: 'hidden' },
  continue:    { paddingVertical: 16, alignItems: 'center' },
  continueTxt: { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 2 },
});
