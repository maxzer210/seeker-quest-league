-- ============================================================================
-- ADMIN HELPER — add a new ad campaign
-- ============================================================================
-- Copy this file, fill the fields, paste into Supabase SQL Editor → Run.
-- One row = one campaign.
--
-- Steps:
--   1. Advertiser pays SOL → confirm on Solana Explorer
--   2. Upload their video/image to Supabase Storage / Arweave / external CDN
--      → get a public direct URL
--   3. Fill the placeholders below
--   4. Run the INSERT
--   5. Campaign appears in EARN tab within seconds (auto-refresh on player side)
-- ============================================================================

insert into public.ad_campaigns (
  -- ─── Advertiser ────────────────────────────────────────────────
  advertiser_name,           -- shown on the card, e.g. 'Magic Eden'
  advertiser_email,          -- internal only, for your records
  advertiser_website,        -- optional

  -- ─── Creative ───────────────────────────────────────────────────
  title,                     -- big heading, max 60 chars
  description,               -- 1-2 sentence subtitle, max 200 chars
  media_type,                -- 'image' | 'video' | 'link'
  media_url,                 -- direct URL to the file (or external page for link)
  thumbnail_url,             -- preview shown in the card list (recommended 600×600)
  cta_label,                 -- button text, e.g. 'Mint NFT', max 20 chars
  cta_url,                   -- where the CTA leads
  sponsor_logo_url,          -- optional logo (recommended 256×256 PNG)
  brand_color,               -- hex like '#FFCC00' — used for accents/borders

  -- ─── Economy ────────────────────────────────────────────────────
  reward_orb,                -- 1-5000 ORB per view
  min_view_seconds,          -- 5-600 seconds before claim button enables
  max_views_per_user,        -- usually 1 — how many times one device can claim
  daily_view_cap,            -- safety cap (1000 default)

  -- ─── Lifecycle ──────────────────────────────────────────────────
  status,                    -- 'active' | 'paused' | 'draft' | 'ended'
  priority,                  -- higher = shown first on the list (0-100)
  paid_sol,                  -- how much advertiser paid in SOL
  starts_at,                 -- when to start (now() = immediately)
  ends_at                    -- when to auto-end (null = no end date)
) values (
  'REPLACE_ADVERTISER_NAME',
  'REPLACE_advertiser@email.com',
  'https://REPLACE.com',

  'REPLACE Catchy headline up to 60 chars',
  'REPLACE One or two sentence supporting line up to 200 chars.',
  'image',                                   -- ← change to video/link as needed
  'https://REPLACE_DIRECT_MEDIA_URL.png',
  'https://REPLACE_THUMBNAIL_URL.png',
  'Visit',
  'https://REPLACE_CTA_URL.com',
  null,                                      -- sponsor logo (optional)
  '#A855F7',                                 -- brand color (purple default)

  500,                                       -- 500 ORB per view
  15,                                        -- 15 seconds before claim
  1,                                         -- one view per user
  1000,                                      -- 1000 views/day global cap

  'active',                                  -- live immediately
  10,                                        -- normal priority
  1.0,                                       -- 1 SOL paid
  now(),
  now() + interval '30 days'                 -- ends in 30 days
);

-- ============================================================================
-- USEFUL QUERIES
-- ============================================================================

-- ▶ See all active campaigns + view counts
-- select id, advertiser_name, title, reward_orb, views_count, status, ends_at
-- from public.ad_campaigns
-- order by priority desc, created_at desc;

-- ▶ Pause a campaign (e.g. budget exhausted)
-- update public.ad_campaigns set status = 'paused' where id = 'CAMPAIGN_UUID';

-- ▶ End a campaign
-- update public.ad_campaigns set status = 'ended', ends_at = now() where id = 'CAMPAIGN_UUID';

-- ▶ Get view stats for a specific campaign
-- select count(*) as total_views, sum(reward_orb) as total_orb_paid,
--        count(distinct device_id) as unique_users
-- from public.ad_views where campaign_id = 'CAMPAIGN_UUID';

-- ▶ Top advertisers by ORB paid out
-- select c.advertiser_name, count(v.id) as views, sum(v.reward_orb) as orb_paid
-- from public.ad_campaigns c
-- left join public.ad_views v on v.campaign_id = c.id
-- group by c.advertiser_name
-- order by views desc;
