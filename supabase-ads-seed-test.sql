-- ============================================================================
-- Test Ad Campaigns — seed for showcasing EarnHub UI
-- ============================================================================
-- Insert 3 dummy campaigns of different media types so the EARN tab is not empty.
-- All use public placeholder images / a free demo video.
-- You can DELETE these any time after testing — see bottom of file.
-- ============================================================================

-- 1) IMAGE campaign — Magic Eden style NFT drop
insert into public.ad_campaigns (
  advertiser_name,    advertiser_email,    advertiser_website,
  title,              description,
  media_type,         media_url,           thumbnail_url,
  cta_label,          cta_url,
  sponsor_logo_url,   brand_color,
  reward_orb,         min_view_seconds,    max_views_per_user,
  status,             priority,            paid_sol
) values (
  'Magic Eden',       'partners@magiceden.io',  'https://magiceden.io',
  'Genesis NFT collection drops Friday',
  'Limited 1,000 mint. Whitelist closes in 48h.',
  'image',            'https://picsum.photos/seed/magiceden/1080/1920',
                      'https://picsum.photos/seed/magiceden/600/600',
  'Join whitelist →', 'https://magiceden.io',
  null,               '#FFCC00',
  300,                10,                  1,
  'active',           50,                  4
);

-- 2) VIDEO campaign — Phantom wallet
insert into public.ad_campaigns (
  advertiser_name,    advertiser_email,    advertiser_website,
  title,              description,
  media_type,         media_url,           thumbnail_url,
  cta_label,          cta_url,
  sponsor_logo_url,   brand_color,
  reward_orb,         min_view_seconds,    max_views_per_user,
  status,             priority,            paid_sol
) values (
  'Phantom',          'partners@phantom.app',   'https://phantom.app',
  'Phantom 2.0 — new UX, faster swaps',
  'Watch the trailer and try the new Phantom wallet for Solana Mobile.',
  'video',
  'https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
                      'https://picsum.photos/seed/phantom/600/600',
  'Download Phantom →',  'https://phantom.app/download',
  null,               '#AB9FF2',
  500,                15,                  1,
  'active',           100,                 8
);

-- 3) LINK campaign — Jupiter swap referral
insert into public.ad_campaigns (
  advertiser_name,    advertiser_email,    advertiser_website,
  title,              description,
  media_type,         media_url,           thumbnail_url,
  cta_label,          cta_url,
  sponsor_logo_url,   brand_color,
  reward_orb,         min_view_seconds,    max_views_per_user,
  status,             priority,            paid_sol
) values (
  'Jupiter',          'partners@jup.ag',        'https://jup.ag',
  'Best Solana swap rates — get 2% trading rebate',
  'Trade any SPL token at the best rate. Limited rebate for Seeker users.',
  'link',             'https://jup.ag',
                      'https://picsum.photos/seed/jupiter/600/600',
  'Open Jupiter →',   'https://jup.ag',
  null,               '#22C55E',
  150,                5,                   2,
  'active',           30,                  1.5
);

-- ============================================================================
-- ▶ CLEAN-UP (run separately if you want to remove test data later)
-- ============================================================================
-- delete from public.ad_views where campaign_id in (
--   select id from public.ad_campaigns
--   where advertiser_name in ('Magic Eden', 'Phantom', 'Jupiter')
-- );
-- delete from public.ad_campaigns
--   where advertiser_name in ('Magic Eden', 'Phantom', 'Jupiter');
