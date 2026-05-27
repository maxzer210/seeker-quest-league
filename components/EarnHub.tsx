import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Animated,
  Easing, Image, Linking, RefreshControl,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import {
  fetchActiveCampaigns, fetchTodayViews, canClaimCampaign, todayEarnedOrb,
  DAILY_AD_ORB_CAP, type AdCampaign, type AdView,
} from '../lib/ads';

const ADVERTISER_EMAIL = 'ads@seekerquest.league';
const ADVERTISER_TELEGRAM = 'https://t.me/seekerquest_ads';

type Props = {
  deviceId: string;
  onOpenCampaign: (campaign: AdCampaign) => void;
  onOpenSkoraWallet: () => void;
  orb: number;
};

export default function EarnHub({ deviceId, onOpenCampaign, onOpenSkoraWallet, orb }: Props) {
  const [campaigns,   setCampaigns]   = useState<AdCampaign[]>([]);
  const [todayViews,  setTodayViews]  = useState<AdView[]>([]);
  const [loading,     setLoading]     = useState(false);
  const [refreshing,  setRefreshing]  = useState(false);

  const shimmer = useRef(new Animated.Value(0)).current;
  const glow    = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(Animated.timing(shimmer, {
      toValue: 1, duration: 2600, easing: Easing.linear, useNativeDriver: true,
    })).start();
    Animated.loop(Animated.sequence([
      Animated.timing(glow, { toValue: 1, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
      Animated.timing(glow, { toValue: 0, duration: 1400, easing: Easing.inOut(Easing.ease), useNativeDriver: false }),
    ])).start();
  }, []);

  const reload = useCallback(async () => {
    setLoading(true);
    const [c, v] = await Promise.all([
      fetchActiveCampaigns(),
      fetchTodayViews(deviceId),
    ]);
    setCampaigns(c);
    setTodayViews(v);
    setLoading(false);
    setRefreshing(false);
  }, [deviceId]);

  useEffect(() => { reload(); }, [reload]);

  const earnedToday = todayEarnedOrb(todayViews);
  const earnedPct   = Math.min(100, (earnedToday / DAILY_AD_ORB_CAP) * 100);

  const glowOpacity = glow.interpolate({ inputRange: [0, 1], outputRange: [0.35, 0.85] });

  function contactAdvertiser() {
    Linking.openURL(`mailto:${ADVERTISER_EMAIL}?subject=Seeker Quest League — Ad Campaign Inquiry`)
      .catch(() => Linking.openURL(ADVERTISER_TELEGRAM));
  }

  return (
    <ScrollView
      style={s.root}
      contentContainerStyle={{ paddingBottom: 28 }}
      showsVerticalScrollIndicator={false}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); reload(); }} tintColor="#A855F7" />}
    >
      {/* ══ Hero ═════════════════════════════════════════════════════════ */}
      <LinearGradient colors={['#0d0025','#1a0040','#3B0764','#831843','#1a0040']} style={s.hero}>
        <View style={s.heroTopRow}>
          <View>
            <Text style={s.heroTag}>💎  EARN ORB</Text>
            <Text style={s.heroTitle}>Watch & Earn</Text>
          </View>
          <View style={s.balanceBadge}>
            <Text style={s.balanceLabel}>Your ORB</Text>
            <Text style={s.balanceValue}>{orb.toLocaleString()}</Text>
          </View>
        </View>

        {/* Daily progress bar */}
        <View style={s.dailyBox}>
          <View style={s.dailyHead}>
            <Text style={s.dailyLabel}>EARNED TODAY</Text>
            <Text style={s.dailyValue}>{earnedToday.toLocaleString()} / {DAILY_AD_ORB_CAP.toLocaleString()} ORB</Text>
          </View>
          <View style={s.dailyTrack}>
            <Animated.View style={[s.dailyFill, { width: `${earnedPct}%`, opacity: glowOpacity }]} />
          </View>
        </View>
      </LinearGradient>

      {/* ══ Convert to SKORA shortcut ════════════════════════════════════ */}
      <TouchableOpacity onPress={onOpenSkoraWallet} activeOpacity={0.85}>
        <LinearGradient colors={['#064E3B','#0F766E','#0d0025']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.convertCta}>
          <Text style={s.convertIcon}>⚗️</Text>
          <View style={{ flex: 1 }}>
            <Text style={s.convertTitle}>Convert ORB → SKORA</Text>
            <Text style={s.convertSub}>{(orb / 10000).toFixed(2)} SKORA available · 10,000 ORB = 1 SKORA</Text>
          </View>
          <Text style={s.convertArrow}>›</Text>
        </LinearGradient>
      </TouchableOpacity>

      {/* ══ Campaign feed ════════════════════════════════════════════════ */}
      <Text style={s.sectionTitle}>SPONSORED OFFERS</Text>

      {loading && campaigns.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>⏳</Text>
          <Text style={s.emptyTitle}>Loading offers…</Text>
        </View>
      ) : campaigns.length === 0 ? (
        <View style={s.emptyCard}>
          <Text style={s.emptyIcon}>📭</Text>
          <Text style={s.emptyTitle}>No active offers right now</Text>
          <Text style={s.emptySub}>New campaigns appear daily. Check back soon.</Text>
        </View>
      ) : (
        campaigns.map(c => {
          const block = canClaimCampaign(c, todayViews);
          const brand = c.brand_color || '#A855F7';
          return (
            <TouchableOpacity
              key={c.id}
              onPress={() => !block && onOpenCampaign(c)}
              activeOpacity={block ? 1 : 0.82}
              style={[s.adCard, { borderColor: brand + '55' }, block && s.adCardDone]}
            >
              {/* Top accent stripe */}
              <View style={[s.adAccent, { backgroundColor: brand }]} />

              <View style={s.adRow}>
                {/* Sponsor logo / thumbnail */}
                <View style={[s.adThumb, { borderColor: brand + '66' }]}>
                  {c.thumbnail_url || c.sponsor_logo_url ? (
                    <Image source={{ uri: c.thumbnail_url ?? c.sponsor_logo_url ?? '' }} style={s.adThumbImg} />
                  ) : (
                    <Text style={s.adThumbFallback}>
                      {c.media_type === 'video' ? '🎬' : c.media_type === 'image' ? '🖼️' : '🔗'}
                    </Text>
                  )}
                </View>

                {/* Body */}
                <View style={s.adBody}>
                  <Text style={s.adAdvertiser}>{c.advertiser_name.toUpperCase()}</Text>
                  <Text style={s.adTitle} numberOfLines={2}>{c.title}</Text>

                  <View style={s.adMetaRow}>
                    <View style={[s.rewardBadge, { borderColor: brand + '99' }]}>
                      <Text style={[s.rewardBadgeText, { color: brand }]}>
                        +{c.reward_orb.toLocaleString()} ORB
                      </Text>
                    </View>
                    <Text style={s.adMetaText}>
                      {c.media_type === 'video' ? `▶ ${c.min_view_seconds}s` :
                       c.media_type === 'image' ? `👁 ${c.min_view_seconds}s` :
                       '🔗 Visit'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Footer */}
              {block ? (
                <View style={[s.adFooter, s.adFooterDone]}>
                  <Text style={s.adFooterDoneText}>✓  {block}</Text>
                </View>
              ) : (
                <LinearGradient colors={[brand, brand + 'AA']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.adFooter}>
                  <Text style={s.adFooterText}>WATCH & EARN  →</Text>
                </LinearGradient>
              )}
            </TouchableOpacity>
          );
        })
      )}

      {/* ══ Advertiser CTA ═══════════════════════════════════════════════ */}
      <Text style={s.sectionTitle}>FOR BRANDS</Text>
      <LinearGradient colors={['#0F172A','#1E293B','#0F172A']} style={s.advCard}>
        <Text style={s.advTitle}>📣  Reach Seeker Holders</Text>
        <Text style={s.advText}>
          Seeker Quest League is the daily-routine hub for Solana Mobile owners.
          Run targeted ad campaigns that pay players in ORB and drive real Web3 attention.
        </Text>
        <View style={s.advBullets}>
          <Text style={s.advBullet}>• 100% on-chain native audience</Text>
          <Text style={s.advBullet}>• Pay-per-view, controllable budget</Text>
          <Text style={s.advBullet}>• Video, image, or external-link formats</Text>
          <Text style={s.advBullet}>• Anti-fraud via SGT + device caps</Text>
        </View>
        <TouchableOpacity onPress={contactAdvertiser} activeOpacity={0.85}>
          <LinearGradient colors={['#7C3AED','#EC4899']} start={{x:0,y:0}} end={{x:1,y:0}} style={s.advBtn}>
            <Text style={s.advBtnText}>📧  CONTACT US</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={s.advFootnote}>{ADVERTISER_EMAIL}  ·  {ADVERTISER_TELEGRAM.replace('https://', '')}</Text>
      </LinearGradient>

      <Text style={s.disclaimer}>
        Rewards are credited to your in-game ORB balance. Daily cap: {DAILY_AD_ORB_CAP.toLocaleString()} ORB.
        Min view: 5s. Anti-fraud limits apply.
      </Text>
    </ScrollView>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  root:           { flex: 1, backgroundColor: '#020510' },

  // Hero
  hero:           { paddingTop: 24, paddingBottom: 20, paddingHorizontal: 18 },
  heroTopRow:     { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTag:        { color: '#C084FC', fontSize: 11, letterSpacing: 3, fontWeight: '900' },
  heroTitle:      { color: '#FACC15', fontSize: 28, fontWeight: '900', letterSpacing: 1, marginTop: 4 },
  balanceBadge:   { backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 14, paddingHorizontal: 12, paddingVertical: 8,
                    borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)', alignItems: 'flex-end' },
  balanceLabel:   { color: '#6D28D9', fontSize: 9, letterSpacing: 2, fontWeight: '700' },
  balanceValue:   { color: '#FACC15', fontSize: 17, fontWeight: '900' },

  dailyBox:       { marginTop: 18, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12, padding: 10,
                    borderWidth: 1, borderColor: 'rgba(168,85,247,0.25)' },
  dailyHead:      { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  dailyLabel:     { color: '#A78BFA', fontSize: 9, letterSpacing: 2, fontWeight: '800' },
  dailyValue:     { color: '#E2E8F0', fontSize: 11, fontWeight: '800' },
  dailyTrack:     { height: 6, backgroundColor: '#1E293B', borderRadius: 3, overflow: 'hidden' },
  dailyFill:      { height: 6, borderRadius: 3, backgroundColor: '#C084FC' },

  // Convert CTA
  convertCta:     { flexDirection: 'row', alignItems: 'center', gap: 12,
                    marginHorizontal: 14, marginTop: 12, paddingHorizontal: 14, paddingVertical: 14,
                    borderRadius: 18, borderWidth: 1, borderColor: 'rgba(45,212,191,0.4)' },
  convertIcon:    { fontSize: 28 },
  convertTitle:   { color: '#2DD4BF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  convertSub:     { color: '#94A3B8', fontSize: 11, marginTop: 2 },
  convertArrow:   { color: '#2DD4BF', fontSize: 28, fontWeight: '900' },

  // Sections
  sectionTitle:   { color: '#475569', fontSize: 10, fontWeight: '900', letterSpacing: 2,
                    marginTop: 18, marginBottom: 10, paddingHorizontal: 18 },

  // Ad card
  adCard:         { marginHorizontal: 14, marginBottom: 12, borderRadius: 18, backgroundColor: '#0B1120',
                    borderWidth: 1, overflow: 'hidden' },
  adCardDone:     { opacity: 0.55 },
  adAccent:       { height: 3, width: '100%' },
  adRow:          { flexDirection: 'row', gap: 12, padding: 12 },
  adThumb:        { width: 64, height: 64, borderRadius: 14, backgroundColor: '#0F172A',
                    borderWidth: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  adThumbImg:     { width: '100%', height: '100%' },
  adThumbFallback:{ fontSize: 26 },
  adBody:         { flex: 1, gap: 4 },
  adAdvertiser:   { color: '#475569', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  adTitle:        { color: '#E2E8F0', fontSize: 14, fontWeight: '800' },
  adMetaRow:      { flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 },
  rewardBadge:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8, borderWidth: 1,
                    backgroundColor: 'rgba(168,85,247,0.10)' },
  rewardBadgeText:{ fontSize: 11, fontWeight: '900' },
  adMetaText:     { color: '#64748B', fontSize: 11, fontWeight: '700' },

  adFooter:       { paddingVertical: 10, alignItems: 'center' },
  adFooterText:   { color: '#FFF', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  adFooterDone:   { backgroundColor: 'rgba(34,197,94,0.10)' },
  adFooterDoneText:{ color: '#22C55E', fontSize: 11, fontWeight: '800', letterSpacing: 1 },

  // Empty
  emptyCard:      { marginHorizontal: 14, padding: 28, borderRadius: 18, alignItems: 'center',
                    backgroundColor: '#0B1120', borderWidth: 1, borderColor: '#1E293B' },
  emptyIcon:      { fontSize: 36, marginBottom: 8 },
  emptyTitle:     { color: '#94A3B8', fontSize: 13, fontWeight: '800', letterSpacing: 1 },
  emptySub:       { color: '#475569', fontSize: 11, marginTop: 6, textAlign: 'center' },

  // Advertiser card
  advCard:        { marginHorizontal: 14, padding: 18, borderRadius: 18,
                    borderWidth: 1, borderColor: '#1E293B' },
  advTitle:       { color: '#E2E8F0', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  advText:        { color: '#94A3B8', fontSize: 12, marginTop: 8, lineHeight: 18 },
  advBullets:     { marginTop: 12, gap: 4 },
  advBullet:      { color: '#64748B', fontSize: 11, fontWeight: '600' },
  advBtn:         { marginTop: 16, paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  advBtnText:     { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  advFootnote:    { color: '#475569', fontSize: 10, textAlign: 'center', marginTop: 10 },

  disclaimer:     { color: '#334155', fontSize: 9, textAlign: 'center',
                    paddingHorizontal: 28, marginTop: 14, lineHeight: 14 },
});
