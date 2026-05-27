import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, Modal, StyleSheet, TouchableOpacity, Image,
  Animated, Easing, Dimensions, Linking,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Video, ResizeMode } from 'expo-av';
import { recordAdView, type AdCampaign } from '../lib/ads';

const { width: W, height: H } = Dimensions.get('window');

type Props = {
  campaign: AdCampaign | null;
  deviceId: string;
  onClose: () => void;
  onReward: (orb: number) => void;
};

export default function AdViewer({ campaign, deviceId, onClose, onReward }: Props) {
  const [elapsed,   setElapsed]   = useState(0);
  const [claimed,   setClaimed]   = useState(false);
  const [submitting,setSubmitting]= useState(false);
  const startedAt = useRef<number>(0);
  const tickRef   = useRef<ReturnType<typeof setInterval> | null>(null);
  const progress  = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!campaign) return;
    setElapsed(0);
    setClaimed(false);
    setSubmitting(false);
    startedAt.current = Date.now();
    progress.setValue(0);

    tickRef.current = setInterval(() => {
      const sec = Math.floor((Date.now() - startedAt.current) / 1000);
      setElapsed(sec);
      const pct = Math.min(1, sec / campaign.min_view_seconds);
      Animated.timing(progress, { toValue: pct, duration: 200, easing: Easing.linear, useNativeDriver: false }).start();
    }, 250);

    return () => {
      if (tickRef.current) clearInterval(tickRef.current);
    };
  }, [campaign]);

  if (!campaign) return null;

  const remaining = Math.max(0, campaign.min_view_seconds - elapsed);
  const canClaim  = elapsed >= campaign.min_view_seconds;
  const brand     = campaign.brand_color || '#A855F7';

  async function handleClaim() {
    if (claimed || submitting || !canClaim) return;
    setSubmitting(true);
    const ok = await recordAdView({
      campaignId:  campaign!.id,
      deviceId,
      viewSeconds: elapsed,
      rewardOrb:   campaign!.reward_orb,
    });
    setSubmitting(false);
    if (ok) {
      setClaimed(true);
      onReward(campaign!.reward_orb);
      // Auto-close after a moment
      setTimeout(() => onClose(), 1200);
    }
  }

  function openCta() {
    if (campaign!.cta_url) Linking.openURL(campaign!.cta_url).catch(() => {});
  }

  return (
    <Modal visible animationType="fade" transparent statusBarTranslucent onRequestClose={onClose}>
      <View style={s.backdrop}>
        <LinearGradient colors={['#0d0025','#1a0040','#0d0025']} style={s.sheet}>

          {/* Top bar */}
          <View style={s.topBar}>
            <View style={s.sponsorRow}>
              {campaign.sponsor_logo_url ? (
                <Image source={{ uri: campaign.sponsor_logo_url }} style={s.sponsorLogo} />
              ) : (
                <View style={[s.sponsorLogoFallback, { backgroundColor: brand + '33', borderColor: brand + '88' }]}>
                  <Text style={{ color: brand, fontSize: 18, fontWeight: '900' }}>
                    {campaign.advertiser_name.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
              <View>
                <Text style={s.sponsorName}>{campaign.advertiser_name}</Text>
                <Text style={s.sponsorTag}>SPONSORED</Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={s.closeBtn}>
              <Text style={s.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Title */}
          <Text style={s.title}>{campaign.title}</Text>
          {campaign.description && (
            <Text style={s.description}>{campaign.description}</Text>
          )}

          {/* Media */}
          <View style={[s.media, { borderColor: brand + '55' }]}>
            {campaign.media_type === 'video' ? (
              <Video
                source={{ uri: campaign.media_url }}
                style={s.mediaContent}
                resizeMode={ResizeMode.COVER}
                shouldPlay
                isLooping
                useNativeControls={false}
              />
            ) : campaign.media_type === 'image' ? (
              <Image source={{ uri: campaign.media_url }} style={s.mediaContent} resizeMode="cover" />
            ) : (
              <View style={s.linkPreview}>
                <Text style={s.linkPreviewIcon}>🔗</Text>
                <Text style={s.linkPreviewText} numberOfLines={2}>{campaign.media_url}</Text>
                {campaign.cta_url && (
                  <TouchableOpacity onPress={openCta} activeOpacity={0.8}>
                    <Text style={[s.linkPreviewCta, { color: brand }]}>OPEN  →</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </View>

          {/* CTA button */}
          {campaign.cta_url && campaign.media_type !== 'link' && (
            <TouchableOpacity onPress={openCta} activeOpacity={0.85} style={[s.ctaBtn, { borderColor: brand }]}>
              <Text style={[s.ctaBtnText, { color: brand }]}>
                {campaign.cta_label || 'Learn more'}  →
              </Text>
            </TouchableOpacity>
          )}

          {/* Progress + claim */}
          <View style={s.bottomBar}>
            <View style={s.progressTrack}>
              <Animated.View style={[s.progressFill, {
                width: progress.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] }),
                backgroundColor: brand,
              }]} />
            </View>

            {claimed ? (
              <LinearGradient colors={['#22C55E','#16A34A']} style={s.claimBtn}>
                <Text style={s.claimBtnText}>✓  CLAIMED +{campaign.reward_orb.toLocaleString()} ORB</Text>
              </LinearGradient>
            ) : (
              <TouchableOpacity
                onPress={handleClaim}
                disabled={!canClaim || submitting}
                activeOpacity={0.85}
              >
                <LinearGradient
                  colors={canClaim ? [brand, brand + 'AA'] : ['#1E293B', '#0F172A']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={s.claimBtn}
                >
                  <Text style={[s.claimBtnText, !canClaim && { color: '#475569' }]}>
                    {submitting ? 'CLAIMING…'
                      : canClaim ? `CLAIM  +${campaign.reward_orb.toLocaleString()} ORB`
                      : `WATCH ${remaining}s MORE…`}
                  </Text>
                </LinearGradient>
              </TouchableOpacity>
            )}
          </View>

        </LinearGradient>
      </View>
    </Modal>
  );
}

// ─── STYLES ───────────────────────────────────────────────────────────────────
const s = StyleSheet.create({
  backdrop:           { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', justifyContent: 'flex-end' },
  sheet:              { borderTopLeftRadius: 28, borderTopRightRadius: 28,
                        padding: 18, paddingBottom: 28, gap: 12,
                        borderTopWidth: 1, borderColor: 'rgba(168,85,247,0.4)' },

  topBar:             { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sponsorRow:         { flexDirection: 'row', alignItems: 'center', gap: 10 },
  sponsorLogo:        { width: 36, height: 36, borderRadius: 12 },
  sponsorLogoFallback:{ width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center',
                        borderWidth: 1 },
  sponsorName:        { color: '#E2E8F0', fontSize: 13, fontWeight: '800' },
  sponsorTag:         { color: '#475569', fontSize: 8, fontWeight: '900', letterSpacing: 2, marginTop: 2 },
  closeBtn:           { width: 32, height: 32, borderRadius: 16, alignItems: 'center', justifyContent: 'center',
                        backgroundColor: 'rgba(15,23,42,0.8)' },
  closeBtnText:       { color: '#94A3B8', fontSize: 16, fontWeight: '700' },

  title:              { color: '#FACC15', fontSize: 18, fontWeight: '900', letterSpacing: 1 },
  description:        { color: '#94A3B8', fontSize: 12, lineHeight: 18 },

  media:              { width: '100%', aspectRatio: 16/9, borderRadius: 16, overflow: 'hidden',
                        borderWidth: 1, backgroundColor: '#000' },
  mediaContent:       { width: '100%', height: '100%' },
  linkPreview:        { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 16 },
  linkPreviewIcon:    { fontSize: 36, marginBottom: 8 },
  linkPreviewText:    { color: '#94A3B8', fontSize: 12, textAlign: 'center' },
  linkPreviewCta:     { fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: 12 },

  ctaBtn:             { paddingVertical: 12, alignItems: 'center', borderRadius: 12,
                        borderWidth: 1.5, backgroundColor: 'rgba(0,0,0,0.3)' },
  ctaBtnText:         { fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  bottomBar:          { gap: 10, marginTop: 6 },
  progressTrack:      { height: 4, backgroundColor: '#1E293B', borderRadius: 2, overflow: 'hidden' },
  progressFill:       { height: '100%', borderRadius: 2 },

  claimBtn:           { paddingVertical: 16, alignItems: 'center', borderRadius: 14 },
  claimBtnText:       { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
});
