-- ============================================================================
-- Ad Campaigns + Views (Earn ORB by Watching Ads)
-- ============================================================================
-- ad_campaigns — what we show. Admin (you) creates these manually after the
-- advertiser pays in SOL (off-chain agreement for now).
-- ad_views — anti-fraud log, one row per view, used to cap daily earnings.
-- ============================================================================

create table if not exists public.ad_campaigns (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  starts_at           timestamptz not null default now(),
  ends_at             timestamptz,

  -- Advertiser
  advertiser_name     text not null,
  advertiser_email    text,
  advertiser_website  text,

  -- Creative
  title               text not null,
  description         text,
  media_type          text not null check (media_type in ('image','video','link')),
  media_url           text not null,          -- direct URL (Supabase Storage / Arweave / external CDN)
  thumbnail_url       text,                   -- preview card image
  cta_label           text default 'Visit',   -- "Visit", "Mint NFT", "Trade now"
  cta_url             text,                   -- where the button leads
  sponsor_logo_url    text,
  brand_color         text default '#A855F7', -- hex, used for accents

  -- Reward economics
  reward_orb          integer not null check (reward_orb > 0 and reward_orb <= 5000),
  min_view_seconds    integer not null default 15 check (min_view_seconds >= 5),
  max_views_per_user  integer not null default 1 check (max_views_per_user >= 1),
  daily_view_cap      integer not null default 1000, -- safety cap globally

  -- Lifecycle
  status              text not null default 'active' check (status in ('draft','active','paused','ended')),
  priority            integer not null default 0,    -- higher = shown first
  paid_sol            numeric not null default 0,    -- how much advertiser paid total
  views_count         integer not null default 0     -- denormalized counter
);

create index if not exists ad_campaigns_status_idx
  on public.ad_campaigns (status, priority desc, created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- ad_views — anti-fraud, daily cap, reward audit trail
-- ──────────────────────────────────────────────────────────────────────────
create table if not exists public.ad_views (
  id                  uuid primary key default gen_random_uuid(),
  created_at          timestamptz not null default now(),
  campaign_id         uuid not null references public.ad_campaigns(id) on delete cascade,
  device_id           text not null,
  view_seconds        integer not null,           -- actual seconds watched
  reward_orb          integer not null,           -- ORB granted
  unique (campaign_id, device_id, created_at)     -- soft dedupe at write time
);

create index if not exists ad_views_campaign_idx on public.ad_views (campaign_id);
create index if not exists ad_views_device_idx   on public.ad_views (device_id, created_at desc);

-- ──────────────────────────────────────────────────────────────────────────
-- RLS
-- ──────────────────────────────────────────────────────────────────────────
alter table public.ad_campaigns enable row level security;
alter table public.ad_views     enable row level security;

-- Everyone can read active campaigns (anon + authenticated)
drop policy if exists "Public read active campaigns" on public.ad_campaigns;
create policy "Public read active campaigns"
  on public.ad_campaigns
  for select
  to anon, authenticated
  using (status = 'active' and (ends_at is null or ends_at > now()));

-- Players can insert ad_views (with sane bounds)
drop policy if exists "Allow ad view insert" on public.ad_views;
create policy "Allow ad view insert"
  on public.ad_views
  for insert
  to anon, authenticated
  with check (
    device_id      is not null
    and view_seconds >= 5         -- minimum 5 seconds
    and view_seconds <= 600       -- reasonable max (10 min)
    and reward_orb   > 0
    and reward_orb   <= 5000
  );

-- Players can read own view history (for "earned today" counter)
drop policy if exists "Allow players read own views" on public.ad_views;
create policy "Allow players read own views"
  on public.ad_views
  for select
  to anon, authenticated
  using (true);
