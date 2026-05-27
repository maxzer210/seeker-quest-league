/**
 * Ad-monetisation API.
 *
 * Players see a feed of active campaigns and earn ORB by watching them.
 * Anti-fraud rules are enforced both client-side (UI) and server-side (RLS).
 */
import { supabase } from './supabase';

export type AdMediaType = 'image' | 'video' | 'link';

export type AdCampaign = {
  id:                 string;
  starts_at:          string;
  ends_at:            string | null;
  advertiser_name:    string;
  advertiser_email:   string | null;
  advertiser_website: string | null;
  title:              string;
  description:        string | null;
  media_type:         AdMediaType;
  media_url:          string;
  thumbnail_url:      string | null;
  cta_label:          string | null;
  cta_url:            string | null;
  sponsor_logo_url:   string | null;
  brand_color:        string | null;
  reward_orb:         number;
  min_view_seconds:   number;
  max_views_per_user: number;
  daily_view_cap:     number;
  status:             string;
  priority:           number;
  views_count:        number;
};

export type AdView = {
  id:           string;
  created_at:   string;
  campaign_id:  string;
  device_id:    string;
  view_seconds: number;
  reward_orb:   number;
};

// Daily ORB cap from ads per user (sanity bound)
export const DAILY_AD_ORB_CAP = 25_000;

/** Fetch all currently active campaigns sorted by priority. */
export async function fetchActiveCampaigns(): Promise<AdCampaign[]> {
  const { data, error } = await supabase
    .from('ad_campaigns')
    .select('*')
    .eq('status', 'active')
    .order('priority', { ascending: false })
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as AdCampaign[];
}

/** Fetch the user's view history for the past 24 hours. */
export async function fetchTodayViews(deviceId: string): Promise<AdView[]> {
  const since = new Date(Date.now() - 24 * 3600_000).toISOString();
  const { data, error } = await supabase
    .from('ad_views')
    .select('*')
    .eq('device_id', deviceId)
    .gte('created_at', since)
    .order('created_at', { ascending: false });
  if (error || !data) return [];
  return data as AdView[];
}

/**
 * Check if the user can still claim the reward for a given campaign.
 * Returns null if allowed, or a reason string if blocked.
 */
export function canClaimCampaign(
  campaign: AdCampaign,
  todayViews: AdView[],
): null | string {
  // Per-campaign view cap
  const ownViews = todayViews.filter(v => v.campaign_id === campaign.id);
  if (ownViews.length >= campaign.max_views_per_user) {
    return campaign.max_views_per_user === 1
      ? 'Already claimed today'
      : `Limit reached (${campaign.max_views_per_user}/day)`;
  }
  // Daily total ORB cap
  const earnedToday = todayViews.reduce((s, v) => s + v.reward_orb, 0);
  if (earnedToday + campaign.reward_orb > DAILY_AD_ORB_CAP) {
    return `Daily ad-earn cap reached (${DAILY_AD_ORB_CAP.toLocaleString()} ORB)`;
  }
  return null;
}

/** Record a completed ad view and grant the reward. */
export async function recordAdView(input: {
  campaignId:  string;
  deviceId:    string;
  viewSeconds: number;
  rewardOrb:   number;
}): Promise<boolean> {
  const { campaignId, deviceId, viewSeconds, rewardOrb } = input;
  const { error } = await supabase
    .from('ad_views')
    .insert({
      campaign_id:  campaignId,
      device_id:    deviceId,
      view_seconds: Math.min(600, Math.max(5, Math.round(viewSeconds))),
      reward_orb:   rewardOrb,
    });
  if (error) {
    console.warn('[ads] recordAdView error:', error.message);
    return false;
  }
  return true;
}

/** Sum of ORB earned from ads in the past 24h. */
export function todayEarnedOrb(views: AdView[]): number {
  return views.reduce((s, v) => s + v.reward_orb, 0);
}
