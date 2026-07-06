import { StatusBar } from 'expo-status-bar';
import { LinearGradient } from 'expo-linear-gradient';
import { Audio } from 'expo-av';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  AppState,
  Dimensions,
  Linking,
  Modal,
  Platform,
  Share,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
  ScrollView,
  Animated,
  Alert,
  Easing,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { ParticleEmitter, ParticleEmitterHandle } from './ParticleSystem';
import { StarField } from './StarField';
import { supabase, SUPABASE_URL, type PlayerRow } from './lib/supabase';
import {
  TREASURY_WALLET,
  SOLANA_RPC,
  WHEEL_SPIN_SOL,
  ENERGY_REFILL_SOL,
  ENERGY_REFILL_LAMPORTS,
  PREMIUM_UPGRADE_SOL,
  PREMIUM_UPGRADE_LAMPORTS,
  PVP_ENTRY_SOL,
  PVP_ENTRY_LAMPORTS,
  PREMIUM_INSTANT_LEVEL_SOL,
  PREMIUM_INSTANT_LEVEL_LAMPORTS,
  PREMIUM_SKIN_SOL,
  PREMIUM_SKIN_LAMPORTS,
  PREMIUM_BOOST_PACK_SOL,
  PREMIUM_BOOST_PACK_LAMPORTS,
  PREMIUM_SHIELD_PACK_SOL,
  PREMIUM_SHIELD_PACK_LAMPORTS,
  FOUNDER_SILVER_SOL,
  FOUNDER_SILVER_LAMPORTS,
  FOUNDER_GOLD_SOL,
  FOUNDER_GOLD_LAMPORTS,
  FOUNDER_DIAMOND_SOL,
  FOUNDER_DIAMOND_LAMPORTS,
  FOUNDER_TIER_FREE_SPINS,
  ORB_TRADE_FEE_PCT,
  ORB_TRADE_BURN_PCT,
  ORB_TRADE_TREASURY_PCT,
  ORB_TRADE_MIN,
  ORB_TRADE_MAX_PER_DAY,
  connectSolanaWallet,
  payForWheelSpin,
  paySolToTreasury,
  type WheelPaymentStatus,
} from './lib/solanaMobile';
import TreasureHunt from './components/TreasureHunt';
import Arena from './components/Arena';
import SeekerLands from './components/SeekerLands';
import Tournament from './components/Tournament';
import SpaceRunner from './components/SpaceRunner';
import SKORAWallet from './components/SKORAWallet';
import FortuneWheel from './components/FortuneWheel';
import HorseRace from './components/HorseRace';
import LabyrinthOfAbyss from './components/LabyrinthOfAbyss';
import Onboarding from './components/Onboarding';
import WinCelebration, { WinCelebrationHandle } from './components/WinCelebration';
import {
  fetchSeekerProfile, claimSgtBonus,
  SGT_BONUS_ORB, type SeekerProfileSnapshot,
} from './lib/seeker';
import GenesisNews from './components/GenesisNews';
import EarnHub from './components/EarnHub';
import AdViewer from './components/AdViewer';
import type { AdCampaign } from './lib/ads';
import PvPArena from './components/PvPArena';
import { GENESIS_PHASE, FOUNDER_ORB_MULTIPLIER, getFounderMultiplier, type FounderTier } from './lib/genesis';
import { detectInstallerSource, type InstallerInfo } from './lib/installerCheck';
import {
  requestNotificationPermission, hasNotificationPermission,
  scheduleStreakReminder, scheduleLandsReady, scheduleTournamentEnding,
  scheduleEnergyFull, cancelEnergyFull,
  cancelAllScheduled, sendTestNotification,
} from './lib/notifications';
import { loadSavedLang, t, useLang, LANGUAGES, setLang } from './lib/i18n';
import {
  ensureReferralCode, claimReferral, collectReferrerRewards,
  getReferralCount, hasClaimedReferral, REFERRER_REWARD, REFERRED_REWARD,
} from './lib/referrals';
import LanguageSelector from './components/LanguageSelector';
import PremiumTapOrb from './components/PremiumTapOrb';
import PremiumWallet from './components/PremiumWallet';
import CosmeticNftTeaser from './components/CosmeticNftTeaser';
import { loadSavedTheme, setActiveTheme, NFT_THEMES, THEME_ORDER, useTheme } from './lib/theme';
import { VERSION_LABEL, VERSION_FULL, APP_VERSION, BUILD_CODE } from './lib/version';
import LottieView from 'lottie-react-native';
import * as Clipboard from 'expo-clipboard';
import { Video, ResizeMode } from 'expo-av';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');

// ─── types ────────────────────────────────────────────────────────────────────

type Screen = 'home' | 'quests' | 'wheel' | 'leaderboard' | 'signal' | 'horse' | 'shop' | 'wallet' | 'treasure' | 'arena' | 'lands' | 'tournament' | 'runner' | 'skora' | 'games' | 'profile' | 'news' | 'earn' | 'pvp' | 'labyrinth';
type UpgradeKey = 'signalPower' | 'critChance' | 'wheelLuck' | 'horsePower';

// ─── upgrade config ───────────────────────────────────────────────────────────

const TAP_VALUES   = [10, 15, 20, 30, 50, 75];
const CRIT_CHANCES = [0.08, 0.12, 0.16, 0.22, 0.30, 0.40];
const HORSE_POWERS = [4, 5, 6, 8, 10, 14];
const MAX_LEVEL         = 5;
const MAX_ENERGY        = 500;
const ENERGY_REGEN_SEC  = 20;  // seconds per +1 energy (3/min) — kept in sync online & offline
const INITIAL_ORB       = 2450; // starting gift for brand-new players
const INITIAL_TICKETS   = 100;
// Persisted progress snapshot (orb/tickets/level/xp/upgrades). Without it every
// cold start reset the balance to defaults and the first sync clobbered the
// server row — including items bought for real SOL.
const PLAYER_SNAPSHOT_KEY = 'sk_player_v1';
const COMBO_MULTIPLIERS = [1, 2, 3, 5];
const COMBO_TAPS        = 5;   // taps per level
const COMBO_RESET_MS    = 1500;

const UPGRADE_DEFS: Record<UpgradeKey, {
  name: string; icon: string; desc: string;
  valueLabels: string[]; costs: number[]; color: string;
}> = {
  signalPower: {
    name: 'Signal Power', icon: '⚡', desc: 'ORB per tap',
    valueLabels: ['10', '15', '20', '30', '50', '75'],
    costs: [500, 1500, 4000, 10000, 25000],
    color: '#A855F7',
  },
  critChance: {
    name: 'Crit Chance', icon: '🎯', desc: 'Critical hit rate',
    valueLabels: ['8%', '12%', '16%', '22%', '30%', '40%'],
    costs: [800, 2000, 5000, 12000, 30000],
    color: '#FACC15',
  },
  wheelLuck: {
    name: 'Wheel Luck', icon: '🎡', desc: 'Better spin rewards',
    valueLabels: ['Base', '+10%', '+25%', '+50%', '+100%', 'MAX'],
    costs: [1000, 3000, 7000, 15000, 40000],
    color: '#06B6D4',
  },
  horsePower: {
    name: 'Horse Power', icon: '🐎', desc: 'Progress per tap',
    valueLabels: ['4', '5', '6', '8', '10', '14'],
    costs: [600, 1800, 4500, 11000, 28000],
    color: '#FB923C',
  },
};

// ─── achievements config ──────────────────────────────────────────────────────

type AchievementState = { streakCount: number; level: number; orb: number; tournamentScore: number };
type Achievement = {
  id: string; icon: string; labelKey: string; orb: number; tickets: number;
  check: (s: AchievementState) => boolean;
};
const ACHIEVEMENTS: readonly Achievement[] = [
  { id: 'streak3',   icon: '🔥', labelKey: 'ach.streak3',  orb:  500, tickets: 0, check: s => s.streakCount     >=      3 },
  { id: 'streak7',   icon: '🔥', labelKey: 'ach.streak7',  orb: 2000, tickets: 2, check: s => s.streakCount     >=      7 },
  { id: 'level5',    icon: '💎', labelKey: 'ach.level5',   orb: 1000, tickets: 0, check: s => s.level           >=      5 },
  { id: 'level10',   icon: '💎', labelKey: 'ach.level10',  orb: 3000, tickets: 0, check: s => s.level           >=     10 },
  { id: 'orb10k',    icon: '⭐', labelKey: 'ach.orb10k',   orb:  500, tickets: 1, check: s => s.orb             >= 10_000 },
  { id: 'orb100k',   icon: '💰', labelKey: 'ach.orb100k',  orb: 5000, tickets: 5, check: s => s.orb             >= 100_000 },
  { id: 'tour500',   icon: '🏆', labelKey: 'ach.tour500',  orb: 1000, tickets: 1, check: s => s.tournamentScore >=    500 },
  { id: 'tour2k',    icon: '🏆', labelKey: 'ach.tour2k',   orb: 3000, tickets: 3, check: s => s.tournamentScore >=   2000 },
] as const;

// ─── season config ────────────────────────────────────────────────────────────

const SEASON_END = new Date('2026-06-30T00:00:00Z').getTime();

function getSeasonLeft() {
  const diff = Math.max(0, SEASON_END - Date.now());
  return {
    days: Math.floor(diff / 86400000),
    hrs:  Math.floor((diff % 86400000) / 3600000),
    mins: Math.floor((diff % 3600000)  / 60000),
    secs: Math.floor((diff % 60000)    / 1000),
  };
}

// ─── streak config ────────────────────────────────────────────────────────────

const STREAK_REWARDS = [
  { orb: 50,   tickets: 0, label: '+50 ORB'           },
  { orb: 100,  tickets: 0, label: '+100 ORB'          },
  { orb: 200,  tickets: 0, label: '+200 ORB'          },
  { orb: 300,  tickets: 1, label: '+300 ORB +1 🎫'    },
  { orb: 500,  tickets: 2, label: '+500 ORB +2 🎫'    },
  { orb: 750,  tickets: 2, label: '+750 ORB +2 🎫'    },
  { orb: 1500, tickets: 5, label: '🔥 +1500 ORB +5 🎫' },
];

function getStreakReward(streak: number) {
  return STREAK_REWARDS[(streak - 1) % 7];
}

// ─── gradient button ──────────────────────────────────────────────────────────

function GradBtn({
  onPress, label, disabled,
  colors = ['#9333EA', '#4F46E5'] as [string, string],
  style,
}: {
  onPress: () => void; label: string; disabled?: boolean;
  colors?: [string, string]; style?: object;
}) {
  return (
    <TouchableOpacity onPress={onPress} disabled={disabled} activeOpacity={0.82} style={style}>
      <LinearGradient
        colors={disabled ? ['#2D1A55', '#1A1040'] : colors}
        start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
        style={[styles.primaryButton, disabled && styles.disabledButton]}
      >
        <Text style={styles.primaryButtonText}>{label}</Text>
      </LinearGradient>
    </TouchableOpacity>
  );
}

// ─── app ──────────────────────────────────────────────────────────────────────

export default function App() {
  const [showSplash, setShowSplash] = useState(true);
  const [showSkip, setShowSkip]     = useState(false);
  const skipFade                    = useRef(new Animated.Value(0)).current;

  // Show Skip button after 3 seconds, with fade-in animation
  useEffect(() => {
    if (!showSplash) return;
    const t = setTimeout(() => {
      setShowSkip(true);
      Animated.timing(skipFade, {
        toValue: 1, duration: 400, useNativeDriver: true,
      }).start();
    }, 3000);
    return () => clearTimeout(t);
  }, [showSplash, skipFade]);

  return (
    <SafeAreaProvider>
      {showSplash ? (
        <View style={splashStyles.root}>
          <Video
            source={require('./assets/splash-video.mp4')}
            shouldPlay
            isLooping={false}
            resizeMode={ResizeMode.CONTAIN}
            style={StyleSheet.absoluteFillObject}
            onPlaybackStatusUpdate={(status) => {
              if ('didJustFinish' in status && status.didJustFinish) {
                setShowSplash(false);
              }
            }}
            onError={() => setShowSplash(false)}
          />
          {showSkip && (
            <Animated.View style={[splashStyles.skipWrap, { opacity: skipFade }]}>
              <TouchableOpacity
                onPress={() => setShowSplash(false)}
                activeOpacity={0.7}
                style={splashStyles.skipBtn}
              >
                <Text style={splashStyles.skipText}>SKIP  ›</Text>
              </TouchableOpacity>
            </Animated.View>
          )}
        </View>
      ) : (
        <AppInner />
      )}
    </SafeAreaProvider>
  );
}

const splashStyles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#0A0A12' },
  skipWrap: { position: 'absolute', top: 48, right: 16, zIndex: 100 },
  skipBtn:  { paddingHorizontal: 14, paddingVertical: 8,
              backgroundColor: 'rgba(15,23,42,0.7)',
              borderRadius: 18,
              borderWidth: 1, borderColor: 'rgba(168,85,247,0.5)' },
  skipText: { color: '#E2E8F0', fontSize: 12, fontWeight: '900', letterSpacing: 2 },
});

function SeasonCountdown() {
  const [left, setLeft] = useState(getSeasonLeft());
  useEffect(() => {
    const id = setInterval(() => setLeft(getSeasonLeft()), 1000);
    return () => clearInterval(id);
  }, []);
  return (
    <View style={styles.seasonCountdown}>
      <SeasonBlock value={left.days} label="DAYS" />
      <Text style={styles.seasonSep}>:</Text>
      <SeasonBlock value={left.hrs}  label="HRS"  />
      <Text style={styles.seasonSep}>:</Text>
      <SeasonBlock value={left.mins} label="MIN"  />
      <Text style={styles.seasonSep}>:</Text>
      <SeasonBlock value={left.secs} label="SEC"  />
    </View>
  );
}

function AppInner() {
  const insets = useSafeAreaInsets();
  const _lang  = useLang(); // re-render on language change
  const theme  = useTheme(); // re-render on theme change

  // ── state ──────────────────────────────────────────────────────────────────
  const [screen, setScreen]         = useState<Screen>('home');
  const [orb, setOrb]               = useState(INITIAL_ORB);
  const [tickets, setTickets]       = useState(INITIAL_TICKETS);
  const [lastWheelReward, setLastWheelReward] = useState<string>('');

  const [score, setScore]           = useState(0);
  const [timeLeft, setTimeLeft]     = useState(15);
  const [gameActive, setGameActive] = useState(false);

  const [boostActive, setBoostActive] = useState(false);
  const [boostTime, setBoostTime]     = useState(0);
  const [showBoost, setShowBoost]     = useState(false);

  const [critText, setCritText]         = useState('');
  const [floatingText, setFloatingText] = useState('');
  const [xp, setXp]                     = useState(0);
  const [level, setLevel]               = useState(1);
  const [levelUpText, setLevelUpText]   = useState('');

  const [dailyTapQuest, setDailyTapQuest]     = useState(0);
  const [dailyWheelQuest, setDailyWheelQuest] = useState(0);
  const [dailyBoostQuest, setDailyBoostQuest] = useState(0);


  const [upgrades, setUpgrades] = useState<Record<UpgradeKey, number>>({
    signalPower: 0, critChance: 0, wheelLuck: 0, horsePower: 0,
  });

  // Backend
  const deviceIdRef  = useRef<string>('');
  const [lbData,    setLbData]    = useState<PlayerRow[]>([]);
  const [lbLoading, setLbLoading] = useState(false);

  // Wallet
  const [walletAddr,      setWalletAddr]      = useState('');
  const [walletInput,     setWalletInput]     = useState('');
  const [solBalance,      setSolBalance]      = useState<number | null>(null);
  const [walletConnecting, setWalletConnecting] = useState(false);
  const [walletAuthToken, setWalletAuthToken] = useState('');
  const [solSpinPending, setSolSpinPending] = useState(false);
  const [solSpinStatus, setSolSpinStatus] = useState('');
  const [solShopPending, setSolShopPending] = useState(false);
  const [solShopStatus, setSolShopStatus]   = useState('');

  // Achievements (persistent)
  const [claimedAch, setClaimedAch] = useState<Set<string>>(new Set());

  // Energy
  const [energy, setEnergy]         = useState(MAX_ENERGY);
  const [energyTick, setEnergyTick] = useState(ENERGY_REGEN_SEC);

  // Combo
  const [comboLevel, setComboLevel] = useState(0);
  const [comboAnim]                 = useState(new Animated.Value(1));
  const comboCountRef               = useRef(0);
  const comboLevelRef               = useRef(0);
  const comboTimerRef               = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sounds
  const sndTap     = useRef<Audio.Sound | null>(null);
  const sndCrit    = useRef<Audio.Sound | null>(null);
  const sndJackpot = useRef<Audio.Sound | null>(null);
  const sndLevelUp = useRef<Audio.Sound | null>(null);
  const sndDead    = useRef<Audio.Sound | null>(null);

  // Onboarding + language
  const [onboarded, setOnboarded] = useState(true); // starts true, set false after load check
  const [langPicked, setLangPicked] = useState(true); // starts true, set false if no saved lang

  // Debounce refs for performance
  const syncTimerRef   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingSyncRef = useRef<{ orb: number; level: number; streak: number } | null>(null);
  const energyWriteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Progress persistence — restore-on-start guards.
  // hydratedRef blocks syncScore until saved progress is loaded, so a fresh
  // launch can never overwrite the server row with default values.
  const hydratedRef     = useRef(false);
  const achLoadedRef    = useRef(false);
  const persistTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const playerSnapRef   = useRef<{
    orb: number; tickets: number; level: number; xp: number;
    upgrades: Record<UpgradeKey, number>;
  }>({
    orb: INITIAL_ORB, tickets: INITIAL_TICKETS, level: 1, xp: 0,
    upgrades: { signalPower: 0, critChance: 0, wheelLuck: 0, horsePower: 0 },
  });

  // Payment status auto-clear timers — cancelled when a new payment starts so
  // a stale timer can't wipe a live status label.
  const shopStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spinStatusTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Win celebration
  const winRef = useRef<WinCelebrationHandle>(null);

  // Seeker profile (SGT + .skr + SKR)
  const [seekerProfile, setSeekerProfile]       = useState<SeekerProfileSnapshot | null>(null);
  const [seekerLoading, setSeekerLoading]       = useState(false);
  const [sgtBonusGranted, setSgtBonusGranted]   = useState(false);

  // Founder status — set on first paid spin during Genesis Pre-Season
  const [isFounder, setIsFounder]               = useState(false);
  const [founderTier, setFounderTier]           = useState<FounderTier>('free');
  const [usernameColor, setUsernameColor]       = useState<string>('#FACC15');
  const [showColorPicker, setShowColorPicker]   = useState(false);

  // Installer source (Solana dApp Store auto-grants Seeker status)
  const [installerInfo, setInstallerInfo]       = useState<InstallerInfo | null>(null);
  const [installerSeekerGranted, setInstallerSeekerGranted] = useState(false);

  // Sound settings
  const [soundEnabled, setSoundEnabled]   = useState(true);
  const soundEnabledRef                    = useRef(true);
  useEffect(() => { soundEnabledRef.current = soundEnabled; }, [soundEnabled]);

  // Notifications
  const [notificationsEnabled, setNotificationsEnabled] = useState(false);

  // Earn / ad viewer
  const [activeAdCampaign, setActiveAdCampaign] = useState<AdCampaign | null>(null);

  // Username
  const [username, setUsername]             = useState('');
  const [editingUsername, setEditingUsername] = useState(false);
  const [pendingUsername, setPendingUsername]  = useState('');
  const [showPrivacyModal, setShowPrivacyModal] = useState(false);
  const [showDonateModal,  setShowDonateModal]  = useState(false);
  // P2P ORB Send modal
  const [showSendOrbModal, setShowSendOrbModal] = useState(false);
  const [sendRecipient,    setSendRecipient]    = useState('');
  const [sendAmount,       setSendAmount]       = useState('');
  const [sendPending,      setSendPending]      = useState(false);
  type TransferRow = {
    id: string; sender_id: string; recipient_id: string;
    amount: number; created_at: string;
  };
  const [transferHistory, setTransferHistory] = useState<TransferRow[]>([]);

  // Referrals
  const [showReferralModal, setShowReferralModal] = useState(false);
  const [myRefCode,    setMyRefCode]    = useState('');
  const [refCount,     setRefCount]     = useState(0);
  const [refCodeInput, setRefCodeInput] = useState('');
  const [refPending,   setRefPending]   = useState(false);
  const [refClaimed,   setRefClaimed]   = useState(false);

  // Daily streak
  const [streakCount, setStreakCount]   = useState(0);
  const [streakShields, setStreakShields] = useState(0);   // shields protect 1 missed day each
  const [tournamentScore, setTournamentScore] = useState(0);
  const [streakModal, setStreakModal]   = useState(false);
  const [streakClaimed, setStreakClaimed] = useState(false);
  const [streakShieldUsedToday, setStreakShieldUsedToday] = useState(false); // for UI banner
  const [streakScaleAnim]               = useState(new Animated.Value(1));
  const [streakNumAnim]                 = useState(new Animated.Value(0));

  // Core animations
  const [floatingAnim]  = useState(new Animated.Value(0));
  const [shakeAnim]     = useState(new Animated.Value(0));
  const [flashAnim]     = useState(new Animated.Value(0));
  const [shimmerAnim]   = useState(new Animated.Value(0));

  // Visual FX
  const particleRef = useRef<ParticleEmitterHandle>(null);
  const lastTapPos  = useRef({ x: SCREEN_W / 2, y: SCREEN_H / 2 });
  const [pulseAnim] = useState(new Animated.Value(1));
  const [ringAnim]  = useState(new Animated.Value(0));
  const [lvlUpAnim] = useState(new Animated.Value(0));

  // ── streak logic ───────────────────────────────────────────────────────────

  // Load claimed achievements on mount
  useEffect(() => {
    AsyncStorage.getItem('sk_achievements')
      .then(v => {
        if (v) {
          try { setClaimedAch(new Set(JSON.parse(v))); } catch (_) {}
        }
      })
      .catch(() => {})
      // Auto-claim must wait for this — otherwise restored progress (high orb/
      // level) re-grants achievements that were already claimed.
      .finally(() => { achLoadedRef.current = true; });
  }, []);

  // Auto-claim achievements when conditions met
  useEffect(() => {
    if (!achLoadedRef.current) return;
    const state: AchievementState = { streakCount, level, orb, tournamentScore };
    const newly: Achievement[] = [];
    for (const a of ACHIEVEMENTS) {
      if (!claimedAch.has(a.id) && a.check(state)) newly.push(a);
    }
    if (newly.length === 0) return;

    const next = new Set(claimedAch);
    let orbReward = 0, ticketReward = 0;
    for (const a of newly) {
      next.add(a.id);
      orbReward    += a.orb;
      ticketReward += a.tickets;
    }
    setClaimedAch(next);
    AsyncStorage.setItem('sk_achievements', JSON.stringify([...next])).catch(() => {});
    if (orbReward > 0) {
      setOrb(o => {
        const v = o + orbReward;
        syncScore(v, level, streakCount);
        return v;
      });
    }
    if (ticketReward > 0) setTickets(t => t + ticketReward);
    // Show last unlocked celebration
    const last = newly[newly.length - 1];
    setTimeout(() => {
      winRef.current?.show(orbReward, `🏅 ${t(last.labelKey).toUpperCase()}`);
    }, 400);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [streakCount, level, Math.floor(orb / 5000), tournamentScore, claimedAch]);

  useEffect(() => {
    checkDailyStreak();
    loadEnergy();
    loadSounds();
    AsyncStorage.getItem('@seeker_onboarded').then(v => {
      setOnboarded(v === '1');
    });
    // Load saved language, or trigger selector if none
    AsyncStorage.getItem('@seeker_lang_picked').then(async picked => {
      if (picked === '1') {
        await loadSavedLang();
        setLangPicked(true);
      } else {
        await loadSavedLang(); // sets to en default
        setLangPicked(false);
      }
    });
    // Load saved theme
    loadSavedTheme();
    AsyncStorage.getItem('@founder').then(v => {
      setIsFounder(v === '1');
    });
    AsyncStorage.getItem('@founder_tier').then(v => {
      const t = (v ?? 'free') as FounderTier;
      if (['free','silver','gold','diamond'].includes(t)) setFounderTier(t);
    });
    AsyncStorage.getItem('@username_color').then(v => {
      if (v && v.startsWith('#')) setUsernameColor(v);
    });
    AsyncStorage.getItem('@sound_enabled').then(v => {
      // Default ON (null/undefined → enabled). Only '0' explicitly disables.
      const enabled = v !== '0';
      setSoundEnabled(enabled);
      soundEnabledRef.current = enabled;
    });
    // Check current notification permission (don't auto-request — wait for user toggle)
    hasNotificationPermission().then(setNotificationsEnabled);

    // Detect installer source — if from Solana dApp Store, grant Seeker status automatically
    detectInstallerSource().then(async info => {
      setInstallerInfo(info);
      if (info.isFromSolanaSource) {
        const alreadyGranted = await AsyncStorage.getItem('@installer_seeker_grant');
        if (alreadyGranted === '1') {
          setInstallerSeekerGranted(true);
        } else {
          // First time we detect dApp Store install — grant +5000 ORB bonus
          await AsyncStorage.setItem('@installer_seeker_grant', '1');
          setInstallerSeekerGranted(true);
          setOrb(prev => {
            const next = prev + 5000;
            syncScore(next, level, streakCount);
            return next;
          });
          // Delay celebration so it fires after onboarding closes
          setTimeout(() => winRef.current?.show(5000, 'SEEKER BONUS'), 1500);
        }
      }
    });
    getOrCreateDeviceId().then(async id => {
      deviceIdRef.current = id;
      const defaultName = 'Seeker#' + id.slice(-4).toUpperCase();
      setUsername(defaultName);
      setPendingUsername(defaultName);
      // Restore saved progress FIRST — everything that writes orb to the
      // server (initReferrals, syncScore) must see the real balance.
      const restored = await hydratePlayer(id);
      await initPlayer(id, restored.orb, restored.level);
      initReferrals(id);
    });
    loadWallet();
    return () => {
      sndTap.current?.unloadAsync();
      sndCrit.current?.unloadAsync();
      sndJackpot.current?.unloadAsync();
      sndLevelUp.current?.unloadAsync();
      sndDead.current?.unloadAsync();
    };
  }, []);

  // Energy refill: +1 every ENERGY_REGEN_SEC seconds, persisted via AsyncStorage
  useEffect(() => {
    const id = setInterval(() => {
      setEnergyTick(t => {
        if (t <= 1) {
          setEnergy(e => {
            const next = Math.min(e + 1, MAX_ENERGY);
            AsyncStorage.setItem('sk_energy',    next.toString()).catch(() => {});
            AsyncStorage.setItem('sk_energy_ts', Date.now().toString()).catch(() => {});
            return next;
          });
          return ENERGY_REGEN_SEC;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(id);
  }, []);

  // Persist progress snapshot: debounced on every change, so a cold start
  // restores exactly where the player left off.
  useEffect(() => {
    playerSnapRef.current = { orb, tickets, level, xp, upgrades };
    if (!hydratedRef.current) return;
    if (persistTimerRef.current) clearTimeout(persistTimerRef.current);
    persistTimerRef.current = setTimeout(() => {
      AsyncStorage.setItem(
        PLAYER_SNAPSHOT_KEY,
        JSON.stringify({ ...playerSnapRef.current, savedAt: Date.now() }),
      ).catch(() => {});
    }, 800);
  }, [orb, tickets, level, xp, upgrades]);

  // Flush the snapshot immediately when the app goes to background — Android
  // can kill the process any moment after that.
  useEffect(() => {
    const sub = AppState.addEventListener('change', s => {
      if (s !== 'active' && hydratedRef.current) {
        AsyncStorage.setItem(
          PLAYER_SNAPSHOT_KEY,
          JSON.stringify({ ...playerSnapRef.current, savedAt: Date.now() }),
        ).catch(() => {});
      }
    });
    return () => sub.remove();
  }, []);

  async function loadSounds() {
    try { await Audio.setAudioModeAsync({ playsInSilentModeIOS: true }); } catch (_) {}
    const load = async (src: Parameters<typeof Audio.Sound.createAsync>[0]) => {
      try {
        // Triple safety: shouldPlay:false at create + stopAsync + setStatusAsync
        const { sound } = await Audio.Sound.createAsync(src, { shouldPlay: false, isLooping: false, volume: 1.0 });
        try { await sound.stopAsync(); } catch (_) {}
        try { await sound.setStatusAsync({ shouldPlay: false, positionMillis: 0 }); } catch (_) {}
        return sound;
      } catch (_) { return null; }
    };
    sndTap.current     = await load(require('./assets/sounds/tap.wav'));
    sndCrit.current    = await load(require('./assets/sounds/crit.wav'));
    sndJackpot.current = await load(require('./assets/sounds/jackpot.wav'));
    sndLevelUp.current = await load(require('./assets/sounds/levelup.wav'));
    sndDead.current    = await load(require('./assets/sounds/dead.wav'));
  }

  function playSound(snd: Audio.Sound | null) {
    if (!soundEnabledRef.current) return;
    snd?.replayAsync().catch(() => {});
  }

  async function toggleSound() {
    const next = !soundEnabled;
    setSoundEnabled(next);
    await AsyncStorage.setItem('@sound_enabled', next ? '1' : '0').catch(() => {});
    if (next) {
      // Brief audible feedback when turning sound back on
      sndTap.current?.replayAsync().catch(() => {});
    }
  }

  // Request permission + schedule the engagement reminders. Shared by the
  // Settings toggle and the post-onboarding prompt. Returns whether granted.
  async function enableNotifications(): Promise<boolean> {
    const granted = await requestNotificationPermission();
    setNotificationsEnabled(granted);
    if (granted) {
      await scheduleStreakReminder(streakCount);
      if (GENESIS_PHASE) await scheduleTournamentEnding();
    }
    return granted;
  }

  async function toggleNotifications() {
    if (notificationsEnabled) {
      // Turn off — cancel all scheduled
      await cancelAllScheduled();
      setNotificationsEnabled(false);
    } else {
      const granted = await enableNotifications();
      if (!granted) {
        Alert.alert(
          'Notification permission denied',
          'Enable notifications for Seeker Quest in your device settings to receive streak reminders.'
        );
      }
    }
  }

  // ── backend helpers ────────────────────────────────────────────────────────

  async function getOrCreateDeviceId(): Promise<string> {
    let id = await AsyncStorage.getItem('sk_device_id');
    if (!id) {
      id = 'skr_' + Math.random().toString(36).slice(2) + Date.now().toString(36);
      await AsyncStorage.setItem('sk_device_id', id);
    }
    return id;
  }

  async function initPlayer(id: string, currentOrb: number, currentLevel: number) {
    try {
      await supabase.from('players').upsert({
        device_id:  id,
        username:   'Seeker#' + id.slice(-4).toUpperCase(),
        orb:        currentOrb,
        level:      currentLevel,
        streak:     0,
        season_orb: currentOrb,
      }, { onConflict: 'device_id', ignoreDuplicates: true });
    } catch (_) {}
  }

  // ── progress restore ───────────────────────────────────────────────────────

  function asNum(v: unknown): number | null {
    return typeof v === 'number' && Number.isFinite(v) ? v : null;
  }

  function sanitizeUpgrades(u: unknown): Record<UpgradeKey, number> | null {
    if (!u || typeof u !== 'object') return null;
    const out: Record<UpgradeKey, number> = { signalPower: 0, critChance: 0, wheelLuck: 0, horsePower: 0 };
    for (const k of Object.keys(out) as UpgradeKey[]) {
      const v = asNum((u as Record<string, unknown>)[k]);
      if (v !== null) out[k] = Math.max(0, Math.min(MAX_LEVEL, Math.floor(v)));
    }
    return out;
  }

  /**
   * Restore saved progress on launch. Local snapshot wins (freshest local
   * truth); the server row is the fallback for reinstalls / pre-snapshot
   * versions. Applied as a delta against the defaults so taps that happen
   * while the (async) restore is in flight are not lost.
   * Returns the values initPlayer should seed for brand-new players.
   */
  async function hydratePlayer(id: string): Promise<{ orb: number; level: number }> {
    let savedOrb: number | null = null;
    let savedLevel: number | null = null;

    try {
      const raw = await AsyncStorage.getItem(PLAYER_SNAPSHOT_KEY);
      if (raw) {
        const snap = JSON.parse(raw);
        savedOrb   = asNum(snap.orb);
        savedLevel = asNum(snap.level);
        const tix  = asNum(snap.tickets);
        const sxp  = asNum(snap.xp);
        if (tix !== null) setTickets(cur => Math.max(0, Math.floor(tix) + (cur - INITIAL_TICKETS)));
        if (sxp !== null) setXp(Math.max(0, Math.min(99, Math.floor(sxp))));
        const upg = sanitizeUpgrades(snap.upgrades);
        if (upg) setUpgrades(upg);
      }
    } catch (_) {}

    // Fallback: server row (progress from before the snapshot existed).
    if (savedOrb === null) {
      try {
        const { data } = await supabase
          .from('players')
          .select('orb, level, username')
          .eq('device_id', id)
          .maybeSingle();
        if (data) {
          savedOrb   = asNum(data.orb);
          savedLevel = savedLevel ?? asNum(data.level);
          // Custom username also used to reset to Seeker#XXXX on every launch.
          if (typeof data.username === 'string' && data.username.trim()) {
            setUsername(data.username);
            setPendingUsername(data.username);
          }
        }
      } catch (_) {}
    }

    let restoredOrb = INITIAL_ORB;
    if (savedOrb !== null) {
      const target = Math.max(0, Math.floor(savedOrb));
      restoredOrb = target;
      // Delta-apply: earnings/spends since mount shift the restored value.
      setOrb(cur => Math.max(0, target + (cur - INITIAL_ORB)));
    }
    let restoredLevel = 1;
    if (savedLevel !== null) {
      restoredLevel = Math.max(1, Math.floor(savedLevel));
      setLevel(cur => Math.max(cur, restoredLevel));
    }

    hydratedRef.current = true;
    return { orb: restoredOrb, level: restoredLevel };
  }

  // ── Referrals ───────────────────────────────────────────────────────────
  async function initReferrals(id: string) {
    try {
      const code = await ensureReferralCode(id);
      if (code) setMyRefCode(code);
      setRefClaimed(await hasClaimedReferral());
      setRefCount(await getReferralCount(id));
      // Collect rewards from friends who joined while we were away
      const collected = await collectReferrerRewards(id);
      if (collected > 0) {
        setOrb(prev => {
          const next = prev + collected;
          syncScore(next, level, streakCount);
          return next;
        });
        setTimeout(() => winRef.current?.show(collected, t('ref.collected', { n: collected })), 1800);
      }
    } catch (_) {}
  }

  async function executeClaimReferral() {
    if (!deviceIdRef.current || refPending) return;
    const code = refCodeInput.trim();
    if (!code) return;
    setRefPending(true);
    try {
      const res = await claimReferral(deviceIdRef.current, code);
      if (res.ok) {
        setRefClaimed(true);
        setRefCodeInput('');
        setOrb(prev => {
          const next = prev + res.reward;
          syncScore(next, level, streakCount);
          return next;
        });
        winRef.current?.show(res.reward, t('ref.successReferred', { n: res.reward }));
      } else {
        const msg = res.error === 'self'         ? t('ref.errSelf')
                  : res.error === 'already_used' ? t('ref.errUsed')
                  : res.error === 'not_found'    ? t('ref.errNotFound')
                  : t('ref.errFailed');
        Alert.alert(t('ref.title'), msg);
      }
    } finally {
      setRefPending(false);
    }
  }

  async function addTournamentScore(points: number) {
    // Clamp client-side to match server-side validation (1-500)
    const safePts = Math.max(1, Math.min(500, Math.floor(points)));
    const next = tournamentScore + safePts;
    setTournamentScore(next);
    if (!deviceIdRef.current) return;
    const uname = username || ('Seeker#' + deviceIdRef.current.slice(-4).toUpperCase());
    try {
      // Server-side anti-cheat RPC (validates increment + rate limit)
      await supabase.rpc('add_tournament_score', {
        p_device_id:     deviceIdRef.current,
        p_username:      uname,
        p_points:        safePts,
        p_tournament_id: 'season-zero',
      });
    } catch (_) {}
  }

  async function syncScore(currentOrb: number, currentLevel: number, currentStreak: number) {
    // Never push defaults to the server before saved progress is restored.
    if (!deviceIdRef.current || !hydratedRef.current) return;
    try {
      await supabase.from('players').update({
        orb:        currentOrb,
        level:      currentLevel,
        streak:     currentStreak,
        season_orb: currentOrb,
      }).eq('device_id', deviceIdRef.current);
    } catch (_) {}
  }

  async function fetchLeaderboard() {
    setLbLoading(true);
    try {
      const { data } = await supabase
        .from('players')
        .select('device_id, username, orb, level, streak, season_orb')
        .order('season_orb', { ascending: false })
        .limit(10);
      if (data) setLbData(data as PlayerRow[]);
    } catch (_) {}
    setLbLoading(false);
  }

  // ── wallet helpers ─────────────────────────────────────────────────────────

  async function loadWallet() {
    const saved = await AsyncStorage.getItem('sk_wallet_addr');
    const savedAuth = await AsyncStorage.getItem('sk_wallet_auth_token');
    if (savedAuth) setWalletAuthToken(savedAuth);
    if (saved) {
      setWalletAddr(saved);
      fetchSolBalance(saved);
      loadSeekerProfile(saved);
    }
  }

  function isValidSolana(addr: string) {
    return /^[1-9A-HJ-NP-Za-km-z]{32,44}$/.test(addr.trim());
  }

  async function connectWallet(address: string) {
    const trimmed = address.trim();
    if (!isValidSolana(trimmed)) return;
    await AsyncStorage.setItem('sk_wallet_addr', trimmed);
    setWalletAddr(trimmed);
    setWalletInput('');
    fetchSolBalance(trimmed);
  }

  async function connectWalletWithMwa() {
    setWalletConnecting(true);
    try {
      const session = await connectSolanaWallet();
      await AsyncStorage.setItem('sk_wallet_addr', session.address);
      await AsyncStorage.setItem('sk_wallet_auth_token', session.authToken);
      setWalletAddr(session.address);
      setWalletAuthToken(session.authToken);
      fetchSolBalance(session.address);
      // Persist wallet to players row so the prize distribution script can find it
      try {
        await supabase.from('players').update({ wallet_address: session.address })
          .eq('device_id', deviceIdRef.current);
      } catch (_) {}
      // Fire-and-forget Seeker profile fetch (mainnet)
      loadSeekerProfile(session.address);
    } catch (e: any) {
      Alert.alert('Wallet connection failed', e?.message ?? 'Could not connect Solana wallet.');
    } finally {
      setWalletConnecting(false);
    }
  }

  async function loadSeekerProfile(address: string) {
    setSeekerLoading(true);
    try {
      const profile = await fetchSeekerProfile(address);
      setSeekerProfile(profile);

      // Auto-claim one-time SGT bonus
      if (profile?.isSeeker && profile.sgtMintAddress && !sgtBonusGranted) {
        const granted = await claimSgtBonus(
          deviceIdRef.current,
          address,
          profile.sgtMintAddress,
        );
        if (granted) {
          const next = orb + SGT_BONUS_ORB;
          setOrb(next);
          syncScore(next, level, streakCount);
          setSgtBonusGranted(true);
          winRef.current?.show(SGT_BONUS_ORB, 'SEEKER BONUS');
        } else {
          // Already claimed previously — just mark UI as granted
          setSgtBonusGranted(true);
        }
      }

      // Adopt .skr domain as username if user still has the default Seeker#XXXX name
      if (profile?.skrDomain) {
        const isDefault = username.startsWith('Seeker#');
        if (isDefault) {
          setUsername(profile.skrDomain);
          setPendingUsername(profile.skrDomain);
          try {
            await supabase.from('players').update({ username: profile.skrDomain })
              .eq('device_id', deviceIdRef.current);
          } catch (_) {}
        }
      }
    } catch (_) {
      // silent
    } finally {
      setSeekerLoading(false);
    }
  }

  async function disconnectWallet() {
    await AsyncStorage.removeItem('sk_wallet_addr');
    await AsyncStorage.removeItem('sk_wallet_auth_token');
    setWalletAddr('');
    setWalletAuthToken('');
    setSolBalance(null);
  }

  async function fetchSolBalance(address: string) {
    setWalletConnecting(true);
    try {
      const res = await fetch(SOLANA_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0', id: 1,
          method: 'getBalance',
          params: [address],
        }),
      });
      const json = await res.json();
      if (json.result?.value !== undefined) setSolBalance(json.result.value / 1e9);
    } catch (_) {}
    setWalletConnecting(false);
  }

  function openPhantom() {
    Linking.openURL('phantom://').catch(() =>
      Linking.openURL('https://phantom.app')
    );
  }

  async function paySolForWheelSpin() {
    setSolSpinStatus('');
    if (!deviceIdRef.current) {
      Alert.alert('Device not ready', 'Try again in a moment.');
      return false;
    }
    if (TREASURY_WALLET === 'PASTE_TREASURY_WALLET_HERE') {
      Alert.alert('Treasury wallet required', 'Set TREASURY_WALLET in lib/solanaMobile.ts before enabling SOL spins.');
      return false;
    }

    // Server-side rate limit check (max 10 paid spins / minute / device)
    try {
      const { data: allowed } = await supabase.rpc('check_spin_rate_limit', {
        p_device_id: deviceIdRef.current,
      });
      if (allowed === false) {
        Alert.alert('Slow down', 'Maximum 10 paid spins per minute. Wait a bit and try again.');
        return false;
      }
    } catch (_) {
      // If RPC fails — allow optimistically (don't block the user from old backend versions)
    }

    setSolSpinPending(true);
    try {
      const payment = await payForWheelSpin(deviceIdRef.current, status => {
        const labels = {
          opening_wallet: 'Opening wallet...',
          authorizing: 'Approve wallet connection...',
          preparing_transaction: 'Preparing 0.01 SOL transaction...',
          requesting_signature: 'Approve 0.01 SOL payment...',
          saving_payment: 'Saving payment...',
          confirmed: 'Payment confirmed. Spinning...',
        };
        setSolSpinStatus(labels[status]);
      });
      await AsyncStorage.setItem('sk_wallet_addr', payment.address);
      await AsyncStorage.setItem('sk_wallet_auth_token', payment.authToken);
      setWalletAddr(payment.address);
      setWalletAuthToken(payment.authToken);
      fetchSolBalance(payment.address);
      try {
        await supabase.from('players').update({ wallet_address: payment.address })
          .eq('device_id', deviceIdRef.current);
      } catch (_) {}
      setLastWheelReward(`Paid spin: ${payment.signature.slice(0, 8)}...${payment.signature.slice(-6)}`);
      // First paid spin during Genesis Pre-Season → become Founder forever
      if (GENESIS_PHASE && !isFounder) {
        await AsyncStorage.setItem('@founder', '1');
        setIsFounder(true);
        winRef.current?.show(FOUNDER_ORB_MULTIPLIER * 1000, 'FOUNDER UNLOCKED');
      }
      return true;
    } catch (e: any) {
      const message = e?.message ?? 'The wallet payment was not completed.';
      Alert.alert('SOL payment failed', message);
      setSolSpinStatus(`Payment failed: ${message}`);
      return false;
    } finally {
      setSolSpinPending(false);
      if (spinStatusTimerRef.current) clearTimeout(spinStatusTimerRef.current);
      spinStatusTimerRef.current = setTimeout(() => setSolSpinStatus(''), 12000);
    }
  }

  function solStatusLabel(amountLabel: string) {
    return (status: WheelPaymentStatus) => {
      // A payment is talking — cancel any pending status auto-clear.
      if (shopStatusTimerRef.current) {
        clearTimeout(shopStatusTimerRef.current);
        shopStatusTimerRef.current = null;
      }
      const labels: Record<WheelPaymentStatus, string> = {
        opening_wallet: 'Opening wallet...',
        authorizing: 'Approve connection...',
        preparing_transaction: `Preparing ${amountLabel}...`,
        requesting_signature: `Approve ${amountLabel} payment...`,
        saving_payment: 'Confirming...',
        confirmed: 'Done!',
      };
      setSolShopStatus(labels[status] || status);
    };
  }

  function scheduleShopStatusClear(ms = 8000) {
    if (shopStatusTimerRef.current) clearTimeout(shopStatusTimerRef.current);
    shopStatusTimerRef.current = setTimeout(() => setSolShopStatus(''), ms);
  }

  async function payForEnergyRefill() {
    if (!deviceIdRef.current) return;
    if (TREASURY_WALLET === 'PASTE_TREASURY_WALLET_HERE') {
      Alert.alert('Treasury wallet required', 'Set TREASURY_WALLET in lib/solanaMobile.ts.');
      return;
    }
    setSolShopPending(true);
    try {
      const r = await paySolToTreasury(
        deviceIdRef.current, ENERGY_REFILL_LAMPORTS, ENERGY_REFILL_SOL, 'energy_refill',
        solStatusLabel(`${ENERGY_REFILL_SOL} SOL`),
      );
      await AsyncStorage.setItem('sk_wallet_addr', r.address);
      await AsyncStorage.setItem('sk_wallet_auth_token', r.authToken);
      setWalletAddr(r.address);
      setWalletAuthToken(r.authToken);
      setEnergy(MAX_ENERGY);
      AsyncStorage.setItem('sk_energy', MAX_ENERGY.toString()).catch(() => {});
      AsyncStorage.setItem('sk_energy_ts', Date.now().toString()).catch(() => {});
      cancelEnergyFull().catch(() => {});   // already full — drop the pending nudge
      winRef.current?.show(MAX_ENERGY, '⚡ ENERGY REFILLED');
    } catch (e: any) {
      Alert.alert('SOL payment failed', e?.message ?? 'Could not refill energy.');
    } finally {
      setSolShopPending(false);
      scheduleShopStatusClear();
    }
  }

  async function paySolUpgrade(key: UpgradeKey) {
    if (!deviceIdRef.current) return;
    if (upgrades[key] >= MAX_LEVEL) return;
    if (TREASURY_WALLET === 'PASTE_TREASURY_WALLET_HERE') {
      Alert.alert('Treasury wallet required', 'Set TREASURY_WALLET in lib/solanaMobile.ts.');
      return;
    }
    setSolShopPending(true);
    try {
      const r = await paySolToTreasury(
        deviceIdRef.current, PREMIUM_UPGRADE_LAMPORTS, PREMIUM_UPGRADE_SOL, 'shop_upgrade',
        solStatusLabel(`${PREMIUM_UPGRADE_SOL} SOL`),
      );
      await AsyncStorage.setItem('sk_wallet_addr', r.address);
      await AsyncStorage.setItem('sk_wallet_auth_token', r.authToken);
      setWalletAddr(r.address);
      setWalletAuthToken(r.authToken);
      setUpgrades(p => ({ ...p, [key]: p[key] + 1 }));
      particleRef.current?.emit(SCREEN_W / 2, SCREEN_H * 0.4, 'crit');
      playSound(sndLevelUp.current);
    } catch (e: any) {
      Alert.alert('SOL payment failed', e?.message ?? 'Could not upgrade.');
    } finally {
      setSolShopPending(false);
      scheduleShopStatusClear();
    }
  }

  // ── PREMIUM SHOP HANDLER (rare items in SOL) ───────────────────────────
  type PremiumItem = 'instantLevel' | 'rareSkin' | 'boostPack' | 'shieldPack';

  async function paySolForPremiumItem(item: PremiumItem) {
    if (!deviceIdRef.current) return;
    if (TREASURY_WALLET === 'PASTE_TREASURY_WALLET_HERE') {
      Alert.alert('Treasury wallet required', 'Set TREASURY_WALLET in lib/solanaMobile.ts.');
      return;
    }
    const config: Record<PremiumItem, { lamports: number; sol: number; tag: 'instant_level' | 'rare_skin' | 'boost_pack' | 'shield_pack'; label: string }> = {
      instantLevel: { lamports: PREMIUM_INSTANT_LEVEL_LAMPORTS, sol: PREMIUM_INSTANT_LEVEL_SOL, tag: 'instant_level', label: 'Instant Level Up' },
      rareSkin:     { lamports: PREMIUM_SKIN_LAMPORTS,          sol: PREMIUM_SKIN_SOL,          tag: 'rare_skin',     label: 'Rare Skin Pack'   },
      boostPack:    { lamports: PREMIUM_BOOST_PACK_LAMPORTS,    sol: PREMIUM_BOOST_PACK_SOL,    tag: 'boost_pack',    label: 'Mega Boost ×5'    },
      shieldPack:   { lamports: PREMIUM_SHIELD_PACK_LAMPORTS,   sol: PREMIUM_SHIELD_PACK_SOL,   tag: 'shield_pack',   label: 'Shield Pack ×3'   },
    };
    const cfg = config[item];
    setSolShopPending(true);
    try {
      const r = await paySolToTreasury(
        deviceIdRef.current, cfg.lamports, cfg.sol, cfg.tag,
        solStatusLabel(`${cfg.sol} SOL`),
      );
      await AsyncStorage.setItem('sk_wallet_addr', r.address);
      await AsyncStorage.setItem('sk_wallet_auth_token', r.authToken);
      setWalletAddr(r.address);
      setWalletAuthToken(r.authToken);

      // Apply rewards
      if (item === 'instantLevel') {
        const nl = level + 1;
        setLevel(nl);
        setOrb(o => o + 500);
        setLevelUpText(`⬆ INSTANT LEVEL ${nl}!`);
        setTimeout(() => setLevelUpText(''), 1800);
      } else if (item === 'boostPack') {
        setBoostActive(true);
        setBoostTime(30); // 30s of ×3 instead of 10s
      } else if (item === 'shieldPack') {
        const next = streakShields + 3;
        setStreakShields(next);
        try { await AsyncStorage.setItem('streakShields', String(next)); } catch (_) {}
      } else if (item === 'rareSkin') {
        // For now: grant 10K ORB compensation; full skin system arrives with NFT theme
        setOrb(o => o + 10_000);
      }

      Alert.alert(t('shop.purchasedTitle'), t('shop.purchasedMsg', { item: cfg.label }));
      particleRef.current?.emit(SCREEN_W / 2, SCREEN_H * 0.4, 'crit');
      playSound(sndLevelUp.current);
    } catch (e: any) {
      Alert.alert('SOL payment failed', e?.message ?? 'Could not purchase.');
    } finally {
      setSolShopPending(false);
      scheduleShopStatusClear();
    }
  }

  // ── P2P ORB TRANSFER ────────────────────────────────────────────────────
  const loadTransferHistory = useCallback(async () => {
    if (!deviceIdRef.current) return;
    try {
      const { data } = await supabase
        .from('orb_transfers')
        .select('id, sender_id, recipient_id, amount, created_at')
        .or(`sender_id.eq.${deviceIdRef.current},recipient_id.eq.${deviceIdRef.current}`)
        .order('created_at', { ascending: false })
        .limit(5);
      if (data) setTransferHistory(data as TransferRow[]);
    } catch (_) {}
  }, []);

  useEffect(() => {
    if (showSendOrbModal) loadTransferHistory();
  }, [showSendOrbModal, loadTransferHistory]);

  async function executeSendOrb() {
    const recipient = sendRecipient.trim();
    const amount    = parseInt(sendAmount, 10);

    if (!recipient) {
      Alert.alert('Recipient required', 'Enter username or device ID');
      return;
    }
    if (recipient === deviceIdRef.current) {
      Alert.alert('Cannot send to yourself');
      return;
    }
    if (!Number.isFinite(amount) || amount < ORB_TRADE_MIN) {
      Alert.alert('Minimum transfer', `Send at least ${ORB_TRADE_MIN.toLocaleString()} ORB`);
      return;
    }
    if (amount > orb) {
      Alert.alert('Insufficient balance', `You have ${orb.toLocaleString()} ORB`);
      return;
    }

    const fee      = Math.floor(amount * ORB_TRADE_FEE_PCT);
    const net      = amount - fee;
    const burned   = Math.floor(amount * ORB_TRADE_BURN_PCT);
    const treasury = fee - burned;

    Alert.alert(
      'Confirm transfer',
      `Send ${amount.toLocaleString()} ORB → ${recipient}\n\n` +
      `Recipient receives: ${net.toLocaleString()} ORB\n` +
      `🔥 Burned: ${burned.toLocaleString()} ORB\n` +
      `🏛 Treasury fee: ${treasury.toLocaleString()} ORB`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'SEND', onPress: async () => {
          setSendPending(true);
          try {
            // Try lookup by username if not a device_id format
            let recipientId = recipient;
            if (recipient.length < 30) {
              const { data: rec } = await supabase
                .from('players')
                .select('device_id')
                .eq('username', recipient)
                .maybeSingle();
              if (rec?.device_id) recipientId = rec.device_id;
            }

            const { data, error } = await supabase.rpc('transfer_orb', {
              p_sender:    deviceIdRef.current,
              p_recipient: recipientId,
              p_amount:    amount,
            });
            if (error) throw error;

            // Update local balance
            const nextOrb = orb - amount;
            setOrb(nextOrb);
            syncScore(nextOrb, level, streakCount);

            setSendRecipient('');
            setSendAmount('');
            await loadTransferHistory();
            Alert.alert('✓ Transfer complete',
              `Sent ${amount.toLocaleString()} ORB\n` +
              `Recipient received: ${data?.received?.toLocaleString() ?? net.toLocaleString()} ORB`,
            );
          } catch (e: any) {
            Alert.alert('Transfer failed', e?.message ?? 'Could not send ORB. Try again.');
          } finally {
            setSendPending(false);
          }
        }},
      ],
    );
  }

  // ── FOUNDER PASS HANDLER ────────────────────────────────────────────────
  type FounderPassTier = 'silver' | 'gold' | 'diamond';

  async function paySolForFounderPass(tier: FounderPassTier) {
    if (!deviceIdRef.current) return;
    if (TREASURY_WALLET === 'PASTE_TREASURY_WALLET_HERE') {
      Alert.alert('Treasury wallet required', 'Set TREASURY_WALLET in lib/solanaMobile.ts.');
      return;
    }
    // Prevent downgrade / re-buy of same or lower tier
    const order: FounderTier[] = ['free', 'silver', 'gold', 'diamond'];
    if (order.indexOf(tier) <= order.indexOf(founderTier)) {
      Alert.alert('Already owned', `You already have ${founderTier.toUpperCase()} or higher.`);
      return;
    }
    const config: Record<FounderPassTier, { lamports: number; sol: number; tag: 'founder_silver'|'founder_gold'|'founder_diamond'; mul: number; spins: number }> = {
      silver:  { lamports: FOUNDER_SILVER_LAMPORTS,  sol: FOUNDER_SILVER_SOL,  tag: 'founder_silver',  mul: 3,  spins: 3  },
      gold:    { lamports: FOUNDER_GOLD_LAMPORTS,    sol: FOUNDER_GOLD_SOL,    tag: 'founder_gold',    mul: 4,  spins: 5  },
      diamond: { lamports: FOUNDER_DIAMOND_LAMPORTS, sol: FOUNDER_DIAMOND_SOL, tag: 'founder_diamond', mul: 5,  spins: 10 },
    };
    const cfg = config[tier];

    Alert.alert(
      `${tier.toUpperCase()} FOUNDER PASS`,
      `Pay ${cfg.sol} SOL for permanent ×${cfg.mul} ORB + ${cfg.spins} free spins/day forever?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: `Buy ${cfg.sol} SOL`, onPress: async () => {
          setSolShopPending(true);
          try {
            const r = await paySolToTreasury(
              deviceIdRef.current!, cfg.lamports, cfg.sol, cfg.tag,
              solStatusLabel(`${cfg.sol} SOL`),
            );
            await AsyncStorage.setItem('sk_wallet_addr', r.address);
            await AsyncStorage.setItem('sk_wallet_auth_token', r.authToken);
            setWalletAddr(r.address);
            setWalletAuthToken(r.authToken);

            // Verify the payment ON-CHAIN server-side (Edge Function) before
            // granting. Unlike the old upgrade_founder_tier RPC, this does not
            // trust the client-written payment row — a forged tx_signature is
            // rejected because it isn't a real transfer to the treasury.
            const { data: verify, error: fnErr } = await supabase.functions.invoke(
              'verify-founder-payment',
              {
                body: {
                  device_id:      deviceIdRef.current!,
                  tier,
                  tx_signature:   r.signature,
                  wallet_address: r.address,
                },
              },
            );
            if (fnErr || !verify?.ok) {
              throw new Error(verify?.error ?? fnErr?.message ?? 'Backend rejected Founder upgrade');
            }

            // Apply locally only after server confirms
            setIsFounder(true);
            await AsyncStorage.setItem('@founder', '1');
            setFounderTier(tier);
            await AsyncStorage.setItem('@founder_tier', tier);

            particleRef.current?.emit(SCREEN_W / 2, SCREEN_H * 0.4, 'crit');
            playSound(sndLevelUp.current);
            winRef.current?.show(0, t('founder.unlocked', { tier: tier.toUpperCase(), mul: cfg.mul }));
          } catch (e: any) {
            Alert.alert('SOL payment failed', e?.message ?? 'Could not purchase Founder Pass.');
          } finally {
            setSolShopPending(false);
            scheduleShopStatusClear();
          }
        }},
      ],
    );
  }

  async function payForPvPEntry(): Promise<boolean> {
    if (!deviceIdRef.current) return false;
    if (TREASURY_WALLET === 'PASTE_TREASURY_WALLET_HERE') {
      Alert.alert('Treasury wallet required', 'Set TREASURY_WALLET in lib/solanaMobile.ts.');
      return false;
    }
    setSolShopPending(true);
    try {
      const r = await paySolToTreasury(
        deviceIdRef.current, PVP_ENTRY_LAMPORTS, PVP_ENTRY_SOL, 'pvp_entry',
        solStatusLabel(`${PVP_ENTRY_SOL} SOL`),
      );
      await AsyncStorage.setItem('sk_wallet_addr', r.address);
      await AsyncStorage.setItem('sk_wallet_auth_token', r.authToken);
      setWalletAddr(r.address);
      setWalletAuthToken(r.authToken);
      return true;
    } catch (e: any) {
      Alert.alert('SOL payment failed', e?.message ?? 'Could not enter premium match.');
      return false;
    } finally {
      setSolShopPending(false);
      scheduleShopStatusClear();
    }
  }

  async function loadEnergy() {
    try {
      const saved = await AsyncStorage.getItem('sk_energy');
      const ts    = await AsyncStorage.getItem('sk_energy_ts');
      if (saved !== null && ts !== null) {
        const regened = Math.floor((Date.now() - parseInt(ts, 10)) / 1000 / ENERGY_REGEN_SEC);
        setEnergy(Math.min(parseInt(saved, 10) + regened, MAX_ENERGY));
      }
    } catch (_) {}
  }

  async function checkDailyStreak() {
    try {
      const today        = new Date().toDateString();
      const lastLogin    = await AsyncStorage.getItem('lastLogin');
      const savedCount   = parseInt((await AsyncStorage.getItem('streakCount')) ?? '0', 10);
      const savedShields = parseInt((await AsyncStorage.getItem('streakShields')) ?? '0', 10);
      const claimedOn    = await AsyncStorage.getItem('claimedDate');

      setStreakShields(savedShields);

      // Already claimed today
      if (claimedOn === today) {
        setStreakCount(savedCount);
        setStreakClaimed(true);
        return;
      }

      // First ever launch
      if (!lastLogin) {
        setStreakCount(1);
        openStreakModal(1);
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      if (lastLogin === yesterday.toDateString()) {
        // Consecutive day — extend streak
        const next = savedCount + 1;
        setStreakCount(next);
        openStreakModal(next);
      } else if (lastLogin !== today) {
        // Gap detected — try to consume a shield
        if (savedShields > 0) {
          const newShields = savedShields - 1;
          setStreakShields(newShields);
          setStreakShieldUsedToday(true);
          await AsyncStorage.setItem('streakShields', newShields.toString());
          // Bump lastLogin to yesterday so streak continues from where it was
          const next = savedCount + 1;
          setStreakCount(next);
          openStreakModal(next);
        } else {
          // No shield — streak resets
          setStreakCount(1);
          openStreakModal(1);
        }
      }
    } catch (_) {
      // AsyncStorage unavailable (e.g. first run in Expo Go)
    }
  }

  function openStreakModal(streak: number) {
    setStreakCount(streak);
    streakScaleAnim.setValue(0.85);
    streakNumAnim.setValue(0);
    setStreakModal(true);
    // Delay so Modal mounts before animation fires
    setTimeout(() => {
      Animated.spring(streakScaleAnim, {
        toValue: 1, friction: 5, tension: 180, useNativeDriver: true,
      }).start();
      Animated.timing(streakNumAnim, {
        toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true,
      }).start();
    }, 80);
  }

  async function claimStreak() {
    const today  = new Date().toDateString();
    const reward = getStreakReward(streakCount);

    // Base reward
    setOrb(prev => prev + reward.orb);
    if (reward.tickets > 0) setTickets(prev => prev + reward.tickets);

    // Morning Claim bonus: always refill energy on daily claim
    setEnergy(MAX_ENERGY);
    AsyncStorage.setItem('sk_energy', MAX_ENERGY.toString()).catch(() => {});
    cancelEnergyFull().catch(() => {});   // already full — drop the pending nudge

    // Streak Shield: earn 1 shield every 7 days (caps at 3)
    let shieldEarned = false;
    if (streakCount > 0 && streakCount % 7 === 0 && streakShields < 3) {
      const nextShields = streakShields + 1;
      setStreakShields(nextShields);
      await AsyncStorage.setItem('streakShields', nextShields.toString());
      shieldEarned = true;
    }

    await AsyncStorage.setItem('lastLogin',    today);
    await AsyncStorage.setItem('streakCount',  streakCount.toString());
    await AsyncStorage.setItem('claimedDate',  today);

    setStreakClaimed(true);
    setStreakModal(false);
    particleRef.current?.emit(SCREEN_W / 2, SCREEN_H * 0.45, 'jackpot');
    playSound(sndJackpot.current);

    // If a shield was earned, celebrate after a beat so the streak modal closes first
    if (shieldEarned) {
      setTimeout(() => {
        winRef.current?.show(1, 'STREAK SHIELD');
      }, 600);
    }

    // Reschedule tomorrow's streak reminder push
    if (notificationsEnabled) {
      scheduleStreakReminder(streakCount).catch(() => {});
    }
  }

  // ── game functions ─────────────────────────────────────────────────────────

  function startSignalGame() {
    setScore(0); setTimeLeft(15);
    setGameActive(true); setScreen('signal');
  }

  // Direct tap from home screen (no timer mode — just earn ORB)
  function scheduleSyncScore(currentOrb: number, currentLevel: number, currentStreak: number) {
    pendingSyncRef.current = { orb: currentOrb, level: currentLevel, streak: currentStreak };
    if (syncTimerRef.current) clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(() => {
      const p = pendingSyncRef.current;
      if (p) { syncScore(p.orb, p.level, p.streak); pendingSyncRef.current = null; }
    }, 5000);
  }

  function scheduleEnergyWrite(nextE: number) {
    if (energyWriteTimerRef.current) clearTimeout(energyWriteTimerRef.current);
    energyWriteTimerRef.current = setTimeout(() => {
      AsyncStorage.setItem('sk_energy', nextE.toString()).catch(() => {});
    }, 2000);
  }

  // Spend 1 energy — shared by home tap & the Signal mini-game.
  // NOTE: we intentionally do NOT touch sk_energy_ts here. That key is the
  // regen anchor, updated only by the regen interval — spending must not reset
  // accumulated regen progress (previously tapSignal reset it on every tap).
  function spendEnergy() {
    setEnergy(prev => {
      const next = Math.max(0, prev - 1);
      scheduleEnergyWrite(next);
      // Just drained the tank — schedule a "energy full" re-engagement nudge
      // for when it fully regenerates (MAX_ENERGY × regen rate from empty).
      if (next === 0 && prev > 0 && notificationsEnabled) {
        scheduleEnergyFull(MAX_ENERGY * ENERGY_REGEN_SEC).catch(() => {});
      }
      return next;
    });
  }

  function handleTap() {
    if (energy === 0) return;
    const tapVal  = TAP_VALUES[upgrades.signalPower];
    const isCrit  = Math.random() < CRIT_CHANCES[upgrades.critChance];
    const mul     = boostActive ? 3 : 1;
    const founderMul = getFounderMultiplier(founderTier, isFounder);
    const base    = isCrit ? tapVal * 3 : tapVal;
    const earned  = Math.round(base * mul * founderMul * COMBO_MULTIPLIERS[Math.min(comboLevel, COMBO_MULTIPLIERS.length - 1)]);

    const nextOrb = orb + earned;
    setOrb(nextOrb);
    scheduleSyncScore(nextOrb, level, streakCount);

    // Energy
    spendEnergy();

    // Daily quest
    setDailyTapQuest(q => Math.min(q + 1, 100));

    // Floating text
    setFloatingText(isCrit ? `⚡ CRIT ×3 +${earned}` : `+${earned}`);
    Animated.timing(floatingAnim, { toValue: 1, duration: 900, useNativeDriver: true }).start(() => {
      setFloatingText(''); floatingAnim.setValue(0);
    });
    if (isCrit) { setCritText('⚡ CRITICAL!'); playSound(sndCrit.current); setTimeout(() => setCritText(''), 800); }

    // Pulse
    Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 0.92, duration: 80, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 1,    duration: 150, useNativeDriver: true }),
    ]).start();

    // Combo
    comboCountRef.current += 1;
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    const taps = comboCountRef.current;
    const newLevel = Math.min(Math.floor(taps / COMBO_TAPS), COMBO_MULTIPLIERS.length - 1);
    if (newLevel > comboLevelRef.current) {
      comboLevelRef.current = newLevel; setComboLevel(newLevel);
      Animated.sequence([
        Animated.timing(comboAnim, { toValue: 1.4, duration: 120, useNativeDriver: true }),
        Animated.timing(comboAnim, { toValue: 1,   duration: 180, useNativeDriver: true }),
      ]).start();
    } else { setComboLevel(newLevel); }
    comboTimerRef.current = setTimeout(() => {
      comboCountRef.current = 0; comboLevelRef.current = 0; setComboLevel(0);
    }, COMBO_RESET_MS);

    // Particles + sound
    particleRef.current?.emit(SCREEN_W / 2, SCREEN_H * 0.45);
    playSound(isCrit ? sndCrit.current : sndTap.current);

    // XP
    setXp(x => {
      const nx = x + 1;
      if (nx >= 100) {
        const nl = level + 1; setLevel(nl);
        setLevelUpText(`⬆ LEVEL ${nl}!`);
        playSound(sndLevelUp.current);
        Animated.sequence([
          Animated.timing(lvlUpAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.delay(1200),
          Animated.timing(lvlUpAnim, { toValue: 0, duration: 300, useNativeDriver: true }),
        ]).start(() => setLevelUpText(''));
        return 0;
      }
      return nx;
    });
  }

  function triggerCritEffects(x?: number, y?: number) {
    particleRef.current?.emit(x ?? lastTapPos.current.x, y ?? lastTapPos.current.y, 'crit');
    shakeAnim.setValue(0); flashAnim.setValue(0);
    Animated.sequence([
      Animated.timing(shakeAnim, { toValue: 10,  duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: -10, duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 6,   duration: 40, useNativeDriver: true }),
      Animated.timing(shakeAnim, { toValue: 0,   duration: 40, useNativeDriver: true }),
    ]).start();
    Animated.sequence([
      Animated.timing(flashAnim, { toValue: 1, duration: 80,  useNativeDriver: true }),
      Animated.timing(flashAnim, { toValue: 0, duration: 220, useNativeDriver: true }),
    ]).start();
  }

  function tapSignal() {
    if (!gameActive || energy <= 0) return;
    spendEnergy();
    // Combo
    comboCountRef.current += 1;
    const newLevel = Math.min(3, Math.floor(comboCountRef.current / COMBO_TAPS));
    if (newLevel > comboLevelRef.current) {
      comboLevelRef.current = newLevel;
      setComboLevel(newLevel);
      comboAnim.setValue(1.8);
      Animated.spring(comboAnim, { toValue: 1, friction: 3, tension: 180, useNativeDriver: true }).start();
    }
    if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
    comboTimerRef.current = setTimeout(() => {
      comboCountRef.current = 0;
      comboLevelRef.current = 0;
      setComboLevel(0);
    }, COMBO_RESET_MS);

    const base       = TAP_VALUES[upgrades.signalPower];
    const comboMult  = COMBO_MULTIPLIERS[comboLevelRef.current];
    const founderMul = getFounderMultiplier(founderTier, isFounder);
    const reward     = Math.round(base * comboMult * (boostActive ? 3 : 1) * founderMul);

    setScore(p => p + 1);
    setDailyTapQuest(p => Math.min(p + 1, 100));
    setOrb(p => p + reward);

    setXp(prev => {
      const newXp = prev + 5;
      if (newXp >= 100) {
        setLevel(l => l + 1);
        setOrb(o => o + 250);
        setLevelUpText('LEVEL UP! +250 ORB');
        lvlUpAnim.setValue(0);
        Animated.spring(lvlUpAnim, { toValue: 1, friction: 4, tension: 200, useNativeDriver: true }).start();
        playSound(sndLevelUp.current);
        setTimeout(() => setLevelUpText(''), 1500);
        return newXp - 100;
      }
      return newXp;
    });

    playSound(sndTap.current);

    setFloatingText(`+${reward}`);
    floatingAnim.setValue(0);
    Animated.timing(floatingAnim, { toValue: 1, duration: 600, useNativeDriver: true }).start(() => setFloatingText(''));

    if (Math.random() < CRIT_CHANCES[upgrades.critChance]) {
      setOrb(p => p + 500);
      setCritText('⚡ CRITICAL +500 ORB');
      triggerCritEffects(lastTapPos.current.x, lastTapPos.current.y);
      playSound(sndCrit.current);
      setTimeout(() => setCritText(''), 1200);
    }

    if (!boostActive && Math.random() < 0.05) setShowBoost(true);
  }

  function activateBoost() {
    setBoostActive(true); setBoostTime(10);
    setShowBoost(false);
    setDailyBoostQuest(p => Math.min(p + 1, 2));
  }

  async function saveUsername() {
    const trimmed = pendingUsername.trim().slice(0, 20);
    if (!trimmed) return;
    setUsername(trimmed);
    setEditingUsername(false);
    try {
      await supabase.from('players').update({ username: trimmed })
        .eq('device_id', deviceIdRef.current);
    } catch (_) {}
  }

  function buyUpgrade(key: UpgradeKey) {
    const lv = upgrades[key];
    if (lv >= MAX_LEVEL) return;
    const cost = UPGRADE_DEFS[key].costs[lv];
    if (orb < cost) return;
    setOrb(p => p - cost);
    setUpgrades(p => ({ ...p, [key]: p[key] + 1 }));
    particleRef.current?.emit(SCREEN_W / 2, SCREEN_H * 0.4, 'crit');
  }

  // ── navigation ─────────────────────────────────────────────────────────────
  const MAIN_TABS: Screen[] = ['home', 'games', 'shop', 'tournament', 'profile'];
  const showBack = !MAIN_TABS.includes(screen);
  function goBack() {
    const map: Partial<Record<Screen, Screen>> = {
      wallet:      'profile',
      news:        'home',
      earn:        'shop',
      skora:       'shop',
      wheel:       'games',
      treasure:    'games',
      arena:       'games',
      lands:       'games',
      pvp:         'games',
      labyrinth:   'games',
      leaderboard: 'tournament',
      signal:      'home',
      quests:      'home',
    };
    setScreen(map[screen] ?? 'home');
  }


  // ── effects ────────────────────────────────────────────────────────────────

  // Shimmer background animation (home screen hero)
  useEffect(() => {
    const shimmerLoop = Animated.loop(Animated.timing(shimmerAnim, {
      toValue: 1, duration: 2800, useNativeDriver: false,
    }));
    shimmerLoop.start();
    return () => shimmerLoop.stop();
  }, []);

  useEffect(() => {
    if (!gameActive) { pulseAnim.setValue(1); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(pulseAnim, { toValue: 1.10, duration: 700, useNativeDriver: true }),
      Animated.timing(pulseAnim, { toValue: 0.93, duration: 700, useNativeDriver: true }),
    ]));
    a.start(); return () => a.stop();
  }, [gameActive]);

  useEffect(() => {
    if (!boostActive) { ringAnim.setValue(0); return; }
    const a = Animated.loop(Animated.sequence([
      Animated.timing(ringAnim, { toValue: 1, duration: 650, useNativeDriver: true }),
      Animated.timing(ringAnim, { toValue: 0, duration: 650, useNativeDriver: true }),
    ]));
    a.start(); return () => a.stop();
  }, [boostActive]);

  useEffect(() => {
    let t: ReturnType<typeof setTimeout>;
    if (gameActive && timeLeft > 0)     t = setTimeout(() => setTimeLeft(p => p - 1), 1000);
    if (timeLeft === 0 && gameActive)   {
      setGameActive(false);
      comboCountRef.current = 0; comboLevelRef.current = 0; setComboLevel(0);
      if (comboTimerRef.current) clearTimeout(comboTimerRef.current);
      setLastWheelReward(`Signal Run: +${score * TAP_VALUES[upgrades.signalPower]} ORB`);
      syncScore(orb, level, streakCount);
    }
    if (boostActive && boostTime > 0)   t = setTimeout(() => setBoostTime(p => p - 1), 1000);
    if (boostTime === 0 && boostActive) setBoostActive(false);
    return () => clearTimeout(t);
  }, [gameActive, timeLeft, score, boostActive, boostTime]);


  // ── render ─────────────────────────────────────────────────────────────────

  const todayReward = getStreakReward(Math.max(1, streakCount));

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StarField />
      <ParticleEmitter ref={particleRef} />

      {/* Flash overlay */}
      <Animated.View pointerEvents="none" style={[styles.flashOverlay, {
        opacity: flashAnim.interpolate({ inputRange: [0, 1], outputRange: [0, 0.35] }),
      }]} />

      {/* ═══════════ DAILY STREAK MODAL ═══════════ */}
      <Modal visible={streakModal} transparent animationType="fade" statusBarTranslucent
        onRequestClose={() => setStreakModal(false)}>
        <View style={styles.modalBackdrop}>
          <Animated.View style={[styles.streakModal, { transform: [{ scale: streakScaleAnim }] }]}>

            {/* Glow ring */}
            <LinearGradient
              colors={['rgba(250,204,21,0.15)', 'rgba(251,146,60,0.1)', 'transparent']}
              style={styles.streakGlowRing}
            />

            <TouchableOpacity onPress={() => setStreakModal(false)} style={{ position: 'absolute', top: 16, right: 16 }}>
              <Text style={{ color: '#475569', fontSize: 20, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>
            <Text style={styles.streakModalLabel}>{t('streak.title')}</Text>

            {/* Big fire number */}
            <Animated.Text style={[styles.streakBigNum, {
              opacity: streakNumAnim,
              transform: [{ scale: streakNumAnim.interpolate({
                inputRange: [0, 0.7, 1], outputRange: [0.4, 1.15, 1],
              })}],
            }]}>
              🔥 {streakCount}
            </Animated.Text>
            <Text style={styles.streakDaysLabel}>
              {streakCount === 1 ? t('streak.day') : t('streak.days')}
            </Text>

            {/* 7-day track */}
            <View style={styles.streakTrack}>
              {STREAK_REWARDS.map((r, i) => {
                const dayNum  = i + 1;
                const isToday = (streakCount - 1) % 7 === i;
                const isDone  = streakClaimed
                  ? (streakCount - 1) % 7 >= i
                  : (streakCount - 1) % 7 > i;
                return (
                  <View key={i} style={[styles.streakDay, isToday && styles.streakDayToday]}>
                    <Text style={styles.streakDayIcon}>
                      {isDone ? '✅' : isToday ? '🔥' : dayNum === 7 ? '👑' : '○'}
                    </Text>
                    <Text style={[styles.streakDayNum, isToday && { color: '#FACC15' }]}>
                      {dayNum}
                    </Text>
                  </View>
                );
              })}
            </View>

            {/* Reward preview */}
            <View style={styles.streakRewardBox}>
              <Text style={styles.streakRewardLabel}>{t('streak.todayReward')}</Text>
              <Text style={styles.streakRewardValue}>{todayReward.label}</Text>
              <Text style={styles.streakRewardBonus}>{t('streak.energyRefill')}</Text>
              {streakCount > 0 && streakCount % 7 === 0 && streakShields < 3 && (
                <Text style={styles.streakRewardShield}>+ 🛡 Streak Shield (saves you 1 missed day)</Text>
              )}
            </View>

            {/* Shield status */}
            {streakShields > 0 && (
              <Text style={styles.streakShieldStatus}>
                🛡  {streakShields} {streakShields === 1 ? 'shield' : 'shields'} in your inventory
              </Text>
            )}

            {/* Claim button */}
            <TouchableOpacity onPress={claimStreak} activeOpacity={0.85} style={{ width: '100%' }}>
              <LinearGradient
                colors={['#FACC15', '#F97316']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.streakClaimBtn}
              >
                <Text style={styles.streakClaimText}>{t('streak.claim')}</Text>
              </LinearGradient>
            </TouchableOpacity>

          </Animated.View>
        </View>
      </Modal>

      {/* ═══════════ COLOR PICKER MODAL ═══════════ */}
      <Modal visible={showColorPicker} transparent animationType="fade" statusBarTranslucent
        onRequestClose={() => setShowColorPicker(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.colorPickerModal}>
            <View style={styles.colorPickerHeader}>
              <Text style={styles.colorPickerTitle}>{t('color.title')}</Text>
              <TouchableOpacity onPress={() => setShowColorPicker(false)} style={styles.sendOrbClose}>
                <Text style={{ color: '#94A3B8', fontSize: 22, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.colorPickerSub}>{t('color.sub')}</Text>

            {/* Preview */}
            <View style={styles.colorPickerPreview}>
              <Text style={[styles.colorPickerPreviewName, { color: usernameColor, textShadowColor: usernameColor, textShadowRadius: 10 }]}>
                {username || 'Seeker'}
              </Text>
            </View>

            {/* Color grid */}
            <View style={styles.colorGrid}>
              {([
                { color: '#FACC15', name: 'Gold' },
                { color: '#A855F7', name: 'Purple' },
                { color: '#EC4899', name: 'Pink' },
                { color: '#06B6D4', name: 'Cyan' },
                { color: '#22C55E', name: 'Green' },
                { color: '#FB923C', name: 'Orange' },
                { color: '#EF4444', name: 'Red' },
                { color: '#FFFFFF', name: 'White' },
                { color: '#F97316', name: 'Sunset' },
                { color: '#14B8A6', name: 'Teal' },
                { color: '#E879F9', name: 'Magenta' },
                { color: '#84CC16', name: 'Lime' },
              ]).map(c => (
                <TouchableOpacity
                  key={c.color}
                  style={[
                    styles.colorSwatch,
                    { backgroundColor: c.color },
                    usernameColor === c.color && styles.colorSwatchSelected,
                  ]}
                  onPress={async () => {
                    setUsernameColor(c.color);
                    await AsyncStorage.setItem('@username_color', c.color);
                  }}
                  activeOpacity={0.7}
                >
                  {usernameColor === c.color && (
                    <Text style={styles.colorSwatchCheck}>✓</Text>
                  )}
                </TouchableOpacity>
              ))}
            </View>

            <TouchableOpacity onPress={() => setShowColorPicker(false)} activeOpacity={0.85} style={{ marginTop: 20 }}>
              <LinearGradient
                colors={['#22D3EE', '#7C3AED']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.colorPickerDone}
              >
                <Text style={styles.colorPickerDoneTxt}>{t('color.done')}</Text>
              </LinearGradient>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* ═══════════ SEND ORB MODAL ═══════════ */}
      <Modal visible={showSendOrbModal} transparent animationType="fade" statusBarTranslucent
        onRequestClose={() => setShowSendOrbModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.sendOrbModal}>
            <ScrollView showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
            <View style={styles.sendOrbHeader}>
              <Text style={styles.sendOrbTitle}>{t('p2p.title')}</Text>
              <TouchableOpacity onPress={() => setShowSendOrbModal(false)} style={styles.sendOrbClose}>
                <Text style={{ color: '#94A3B8', fontSize: 22, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sendOrbBalance}>{t('p2p.available')}: <Text style={{ color: '#FACC15', fontWeight: '900' }}>{orb.toLocaleString()} ORB</Text></Text>

            {/* Recipient input */}
            <Text style={styles.sendOrbLabel}>{t('p2p.recipient')}</Text>
            <TextInput
              style={styles.sendOrbInput}
              value={sendRecipient}
              onChangeText={setSendRecipient}
              placeholder={t('p2p.recipientHint')}
              placeholderTextColor="#7C8BA5"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Amount input */}
            <Text style={styles.sendOrbLabel}>{t('p2p.amount')}</Text>
            <TextInput
              style={styles.sendOrbInput}
              value={sendAmount}
              onChangeText={(txt) => setSendAmount(txt.replace(/[^0-9]/g, ''))}
              placeholder={t('p2p.amountMin', { n: ORB_TRADE_MIN.toLocaleString() })}
              placeholderTextColor="#7C8BA5"
              keyboardType="number-pad"
            />

            {/* Quick amount chips */}
            <View style={styles.sendOrbChips}>
              {[1_000, 5_000, 10_000, 50_000].map(amt => (
                <TouchableOpacity
                  key={amt}
                  style={[styles.sendOrbChip, orb < amt && styles.sendOrbChipDisabled]}
                  onPress={() => orb >= amt && setSendAmount(String(amt))}
                  disabled={orb < amt}
                >
                  <Text style={[styles.sendOrbChipTxt, orb < amt && { color: '#334155' }]}>
                    {amt >= 1000 ? `${amt / 1000}K` : amt}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Preview */}
            {sendAmount && parseInt(sendAmount, 10) >= ORB_TRADE_MIN && (
              <View style={styles.sendOrbPreview}>
                <View style={styles.sendOrbPreviewRow}>
                  <Text style={styles.sendOrbPreviewKey}>{t('p2p.youSend')}</Text>
                  <Text style={styles.sendOrbPreviewVal}>{parseInt(sendAmount, 10).toLocaleString()} ORB</Text>
                </View>
                <View style={styles.sendOrbPreviewRow}>
                  <Text style={styles.sendOrbPreviewKey}>{t('p2p.receives')}</Text>
                  <Text style={[styles.sendOrbPreviewVal, { color: '#22C55E' }]}>
                    {Math.floor(parseInt(sendAmount, 10) * (1 - ORB_TRADE_FEE_PCT)).toLocaleString()} ORB
                  </Text>
                </View>
                <View style={styles.sendOrbPreviewRow}>
                  <Text style={styles.sendOrbPreviewKey}>{t('p2p.burnedRow', { pct: Math.round(ORB_TRADE_BURN_PCT * 100) })}</Text>
                  <Text style={[styles.sendOrbPreviewVal, { color: '#EF4444' }]}>
                    {Math.floor(parseInt(sendAmount, 10) * ORB_TRADE_BURN_PCT).toLocaleString()} ORB
                  </Text>
                </View>
                <View style={styles.sendOrbPreviewRow}>
                  <Text style={styles.sendOrbPreviewKey}>{t('p2p.treasuryRow', { pct: Math.round(ORB_TRADE_TREASURY_PCT * 100) })}</Text>
                  <Text style={[styles.sendOrbPreviewVal, { color: '#A78BFA' }]}>
                    {Math.floor(parseInt(sendAmount, 10) * ORB_TRADE_TREASURY_PCT).toLocaleString()} ORB
                  </Text>
                </View>
              </View>
            )}

            {/* Submit */}
            <TouchableOpacity
              onPress={executeSendOrb}
              disabled={sendPending || !sendAmount || parseInt(sendAmount, 10) < ORB_TRADE_MIN || parseInt(sendAmount, 10) > orb}
              activeOpacity={0.85}
            >
              <LinearGradient
                colors={
                  sendPending || !sendAmount || parseInt(sendAmount || '0', 10) < ORB_TRADE_MIN || parseInt(sendAmount || '0', 10) > orb
                    ? ['#1E293B', '#0F172A']
                    : ['#22C55E', '#10B981']
                }
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                style={styles.sendOrbBtn}
              >
                <Text style={[styles.sendOrbBtnText,
                  (sendPending || !sendAmount || parseInt(sendAmount || '0', 10) < ORB_TRADE_MIN || parseInt(sendAmount || '0', 10) > orb)
                    && { color: '#475569' }]}>
                  {sendPending ? t('p2p.sending') : t('p2p.sendBtn')}
                </Text>
              </LinearGradient>
            </TouchableOpacity>

            <Text style={styles.sendOrbHint}>
              {t('p2p.dailyHint', { max: ORB_TRADE_MAX_PER_DAY.toLocaleString() })}
            </Text>

            {/* ── Recent Transfers ── */}
            {transferHistory.length > 0 && (
              <View style={styles.transferHistory}>
                <Text style={styles.transferHistoryTitle}>{t('p2p.historyTitle')}</Text>
                {transferHistory.map(tx => {
                  const isSent = tx.sender_id === deviceIdRef.current;
                  const otherId = isSent ? tx.recipient_id : tx.sender_id;
                  const shortOther = otherId.length > 12 ? otherId.slice(0, 6) + '…' + otherId.slice(-4) : otherId;
                  const when = new Date(tx.created_at);
                  const timeStr = when.toLocaleString(undefined, {
                    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                  });
                  return (
                    <View key={tx.id} style={styles.transferRow}>
                      <Text style={[styles.transferIcon, { color: isSent ? '#EF4444' : '#22C55E' }]}>
                        {isSent ? '📤' : '📥'}
                      </Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.transferOther} numberOfLines={1}>
                          {isSent ? `${t('p2p.txTo')} ` : `${t('p2p.txFrom')} `}{shortOther}
                        </Text>
                        <Text style={styles.transferTime}>{timeStr}</Text>
                      </View>
                      <Text style={[styles.transferAmount, { color: isSent ? '#EF4444' : '#22C55E' }]}>
                        {isSent ? '-' : '+'}{tx.amount.toLocaleString()}
                      </Text>
                    </View>
                  );
                })}
              </View>
            )}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* ═══════════ REFERRAL MODAL ═══════════ */}
      <Modal visible={showReferralModal} transparent animationType="fade" statusBarTranslucent
        onRequestClose={() => setShowReferralModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.refModal}>
            <View style={styles.sendOrbHeader}>
              <Text style={styles.sendOrbTitle}>🎁  {t('ref.title')}</Text>
              <TouchableOpacity onPress={() => setShowReferralModal(false)} style={styles.sendOrbClose}>
                <Text style={{ color: '#94A3B8', fontSize: 22, fontWeight: '700' }}>✕</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.refModalSub}>{t('ref.subtitle', { n: REFERRED_REWARD.toLocaleString() })}</Text>

            {/* My code */}
            <Text style={styles.sendOrbLabel}>{t('ref.yourCode')}</Text>
            <View style={styles.refCodeBox}>
              <Text selectable style={styles.refCodeTxt}>{myRefCode || '—'}</Text>
            </View>
            <TouchableOpacity
              activeOpacity={0.85}
              disabled={!myRefCode}
              onPress={() => Share.share({
                message: t('ref.shareMsg', { code: myRefCode, n: REFERRED_REWARD.toLocaleString() }),
              })}
            >
              <LinearGradient colors={['#7C3AED','#4F46E5']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.refShareBtn}>
                <Text style={styles.refShareTxt}>{t('ref.share')}</Text>
              </LinearGradient>
            </TouchableOpacity>

            <View style={styles.refStatRow}>
              <Text style={styles.refStatTxt}>{t('ref.invited')}: <Text style={{ color: '#FACC15', fontWeight: '900' }}>{refCount}</Text></Text>
            </View>

            {/* Enter a friend's code */}
            {refClaimed ? (
              <Text style={styles.refClaimedNote}>✓ {t('ref.claimedNote')}</Text>
            ) : (
              <>
                <Text style={styles.sendOrbLabel}>{t('ref.haveCode')}</Text>
                <TextInput
                  style={styles.sendOrbInput}
                  value={refCodeInput}
                  onChangeText={(txt) => setRefCodeInput(txt.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 8))}
                  placeholder={t('ref.enterHint')}
                  placeholderTextColor="#7C8BA5"
                  autoCapitalize="characters"
                  autoCorrect={false}
                />
                <TouchableOpacity
                  activeOpacity={0.85}
                  disabled={refPending || refCodeInput.trim().length < 4}
                  onPress={executeClaimReferral}
                >
                  <LinearGradient
                    colors={refPending || refCodeInput.trim().length < 4 ? ['#1E293B','#0F172A'] : ['#22C55E','#10B981']}
                    start={{x:0,y:0}} end={{x:1,y:0}} style={styles.refApplyBtn}>
                    <Text style={[styles.refApplyTxt, (refPending || refCodeInput.trim().length < 4) && { color: '#475569' }]}>
                      {refPending ? t('ref.applying') : t('ref.apply')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </Modal>

      {/* ═══════════ DONATE MODAL ═══════════ */}
      <Modal visible={showDonateModal} transparent animationType="slide" statusBarTranslucent
        onRequestClose={() => setShowDonateModal(false)}>
        <TouchableOpacity style={styles.modalBackdrop} activeOpacity={1} onPress={() => setShowDonateModal(false)}>
          <TouchableOpacity activeOpacity={1} style={{ width: '100%', paddingHorizontal: 20, paddingBottom: 40 }}>
            <LinearGradient colors={['#0F172A', '#1E293B']} style={{ borderRadius: 24, padding: 24, borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)' }}>
              <Text style={{ color: '#FFF', fontSize: 18, fontWeight: '900', textAlign: 'center', marginBottom: 6 }}>{t('donate.title')}</Text>
              <Text style={{ color: '#94A3B8', fontSize: 12, textAlign: 'center', marginBottom: 20 }}>
                {t('donate.sub')}
              </Text>

              {/* Адрес */}
              <View style={{ backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 14, padding: 14, borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)', marginBottom: 16 }}>
                <Text style={{ color: '#C084FC', fontSize: 10, fontWeight: '900', letterSpacing: 1, marginBottom: 6 }}>{t('donate.label')}</Text>
                <Text selectable style={{ color: '#E2E8F0', fontSize: 11, fontFamily: 'monospace', lineHeight: 18 }}>
                  {TREASURY_WALLET}
                </Text>
              </View>

              {/* Copy button — actually copies (used to open the Share sheet) */}
              <TouchableOpacity
                activeOpacity={0.85}
                onPress={() => {
                  Clipboard.setStringAsync(TREASURY_WALLET)
                    .then(() => Alert.alert('✓', t('donate.copied')))
                    .catch(() => {});
                }}
                style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 12 }}
              >
                <LinearGradient colors={['#7C3AED', '#EC4899']} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 13, alignItems: 'center' }}>
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>{t('donate.copy')}</Text>
                </LinearGradient>
              </TouchableOpacity>

              <TouchableOpacity onPress={() => setShowDonateModal(false)} activeOpacity={0.7}
                style={{ paddingVertical: 10, alignItems: 'center' }}>
                <Text style={{ color: '#475569', fontSize: 13 }}>{t('donate.close')}</Text>
              </TouchableOpacity>
            </LinearGradient>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* ═══════════ PRIVACY POLICY MODAL ═══════════ */}
      <Modal visible={showPrivacyModal} transparent animationType="fade" statusBarTranslucent
        onRequestClose={() => setShowPrivacyModal(false)}>
        <View style={styles.modalBackdrop}>
          <View style={styles.privacyModalContent}>
            <TouchableOpacity onPress={() => setShowPrivacyModal(false)} style={styles.privacyCloseBtn}>
              <Text style={{ color: '#7C3AED', fontSize: 24, fontWeight: '700' }}>✕</Text>
            </TouchableOpacity>

            <ScrollView style={styles.privacyScroll} showsVerticalScrollIndicator={false}>
              <View style={styles.privacyHeader}>
                <Text style={styles.privacyTitle}>PRIVACY POLICY</Text>
                <Text style={styles.privacyMeta}>Seeker Quest League</Text>
              </View>

              <Text style={styles.privacyPara}>
                This Privacy Policy describes how <Text style={{ fontWeight: '700' }}>Seeker Quest League</Text> ("the App", "we", "our")
                collects, uses, and shares information when you use our mobile application.{'\n'}
                By using the App, you agree to this Privacy Policy.
              </Text>

              <Text style={styles.privacyH2}>1. INFORMATION WE COLLECT</Text>

              <Text style={styles.privacyH3}>1.1 Information You Provide</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>Username</Text> — a public name you choose. Optional. Defaults to a random pseudonym (e.g. Seeker#A1B2).</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>Solana wallet address</Text> — when you connect your Solana wallet via the Mobile Wallet Adapter (MWA). This is your public on-chain identifier.</Text>

              <Text style={styles.privacyH3}>1.2 Information Collected Automatically</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>Device identifier</Text> — a randomly generated UUID stored locally on your device. Used to track your in-game progress (ORB balance, streak, level). This is not your Android Advertising ID and is not shared with third parties.</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>Game activity</Text> — your in-game scores, tournament points, achievements.</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>On-chain transactions</Text> — when you make a paid Fortune Wheel spin (0.01 SOL), we record the transaction signature, payer wallet, and amount in our backend for prize-pool accounting. This data is also publicly verifiable on the Solana blockchain.</Text>

              <Text style={styles.privacyH3}>1.3 Information We Do NOT Collect</Text>
              <Text style={styles.privacyBullet}>❌ Real name, address, phone number, email (unless you voluntarily contact our support)</Text>
              <Text style={styles.privacyBullet}>❌ Government ID, KYC information</Text>
              <Text style={styles.privacyBullet}>❌ Contacts, photos, files, camera, microphone, location</Text>
              <Text style={styles.privacyBullet}>❌ Browsing history outside the App</Text>
              <Text style={styles.privacyBullet}>❌ Android advertising ID (AAID)</Text>
              <Text style={styles.privacyBullet}>❌ Analytics tracking via Google, Facebook or other third-party SDKs</Text>

              <Text style={styles.privacyH2}>2. HOW WE USE INFORMATION</Text>
              <Text style={styles.privacyBullet}>• Operate game mechanics (ORB, levels, achievements, tournaments)</Text>
              <Text style={styles.privacyBullet}>• Display tournament leaderboards (public usernames + scores)</Text>
              <Text style={styles.privacyBullet}>• Process Solana SOL payments for paid game features</Text>
              <Text style={styles.privacyBullet}>• Distribute SOL prizes to tournament winners</Text>
              <Text style={styles.privacyBullet}>• Prevent multi-account abuse via SGT mint tracking (anti-sybil)</Text>
              <Text style={styles.privacyBullet}>• Diagnose technical issues</Text>

              <Text style={styles.privacyH2}>3. HOW WE SHARE INFORMATION</Text>
              <Text style={styles.privacyPara}>We <Text style={{ fontWeight: '700' }}>do not sell</Text> your data to anyone.</Text>
              <Text style={styles.privacyPara}>We share information only:</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>Publicly on the Solana blockchain</Text> — any transaction you sign (paid spins, prize claims) is publicly visible on Solana Explorer</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>Publicly on the leaderboard</Text> — your username and score are visible to all players</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>With Supabase</Text> — our backend service provider. Supabase stores game state, user profiles, and tournament scores under standard data-processing terms</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>When required by law</Text> — if compelled by valid legal process</Text>

              <Text style={styles.privacyH2}>4. DATA STORAGE & SECURITY</Text>
              <Text style={styles.privacyBullet}>• Game state is stored in our Supabase database (hosted in EU/US regions)</Text>
              <Text style={styles.privacyBullet}>• On-chain data is stored permanently on the Solana blockchain</Text>
              <Text style={styles.privacyBullet}>• Local device state (device ID, settings) is stored only on your phone via Android AsyncStorage</Text>
              <Text style={styles.privacyBullet}>• We use HTTPS / TLS for all network communication</Text>

              <Text style={styles.privacyH2}>5. CRYPTOCURRENCY & WEB3</Text>
              <Text style={styles.privacyPara}>The App integrates with the Solana blockchain. Please understand:</Text>
              <Text style={styles.privacyBullet}>• We <Text style={{ fontWeight: '700' }}>never</Text> have access to your private keys, seed phrase, or wallet funds. All signing happens locally in your wallet app via Mobile Wallet Adapter.</Text>
              <Text style={styles.privacyBullet}>• All on-chain transactions are <Text style={{ fontWeight: '700' }}>public, immutable, and final</Text>. We cannot reverse them.</Text>
              <Text style={styles.privacyBullet}>• Cryptocurrency prizes (SOL, SKORA) have variable real-world value. We make no guarantees about future value.</Text>
              <Text style={styles.privacyBullet}>• The App operates on Solana <Text style={{ fontWeight: '700' }}>mainnet</Text>. All SOL payments are real transactions with real monetary value. Always review a transaction in your wallet before signing it.</Text>

              <Text style={styles.privacyH2}>6. CHILDREN'S PRIVACY</Text>
              <Text style={styles.privacyPara}>The App is not directed to children under 13. We do not knowingly collect information from anyone under 13. Cryptocurrency mechanics also make this App unsuitable for minors in most jurisdictions.</Text>

              <Text style={styles.privacyH2}>7. YOUR RIGHTS</Text>
              <Text style={styles.privacyPara}>You may:</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>Stop playing at any time</Text> — uninstall the App to remove local data</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>Disconnect your wallet</Text> — go to Profile → Wallet → Disconnect</Text>
              <Text style={styles.privacyBullet}>• <Text style={{ fontWeight: '600' }}>Request data deletion</Text> — email us at support@seekerquest-league.com with your device ID. We will delete your records within 30 days. Note: on-chain transactions cannot be deleted.</Text>

              <Text style={styles.privacyH2}>8. CHANGES TO THIS POLICY</Text>
              <Text style={styles.privacyPara}>We may update this policy. Material changes will be announced in the App and on our website. Continued use after changes means acceptance.</Text>

              <Text style={styles.privacyH2}>9. CONTACT</Text>
              <Text style={styles.privacyPara}>Questions about this policy: support@seekerquest-league.com</Text>
              <Text style={styles.privacyPara}>Project website: seekerquest-league.com</Text>
              <Text style={styles.privacyNote}>This Privacy Policy is published publicly to satisfy Solana Mobile dApp Store requirements. It is the authoritative description of our data practices.</Text>

              <View style={{ height: 32 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* App content */}
      <Animated.View style={[styles.appShake, { transform: [{ translateX: shakeAnim }] }]}>
        <StatusBar style="light" />

        {screen !== 'home' && (
          <View style={styles.compactHeader}>
            {showBack ? (
              <TouchableOpacity style={styles.compactBackRow} onPress={goBack} activeOpacity={0.7}>
                <Text style={styles.compactBackArrow}>‹</Text>
                <View>
                  <Text style={styles.compactBalanceNum}>{orb.toLocaleString()}</Text>
                  <Text style={styles.compactBalanceLbl}>ORB</Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.compactBalance}>
                <Text style={styles.compactBalanceNum}>{orb.toLocaleString()}</Text>
                <Text style={styles.compactBalanceLbl}>ORB</Text>
              </View>
            )}
            <View style={styles.compactChipRow}>
              <View style={styles.compactChip}>
                <Text style={styles.compactChipTxt}>⚡ {energy}</Text>
              </View>
              <View style={styles.compactChip}>
                <Text style={styles.compactChipTxt}>🎫 {tickets}</Text>
              </View>
              {streakCount > 0 && (
                <View style={styles.compactChip}>
                  <Text style={styles.compactChipTxt}>🔥 {streakCount}</Text>
                </View>
              )}
            </View>
          </View>
        )}

        {/* Tiny version chip — top-right corner, всегда видимый */}
        <View style={styles.versionChip} pointerEvents="none">
          <Text style={styles.versionChipTxt}>{VERSION_LABEL}</Text>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>

          {/* ═══════════ HOME ═══════════ */}
          {screen === 'home' && (
            <View>

              {/* ── Top chips row ── */}
              <View style={styles.homeTopRow}>
                <TouchableOpacity
                  style={[styles.homeChip, !streakClaimed && styles.homeChipGlow]}
                  onPress={() => !streakClaimed && openStreakModal(streakCount)}
                  activeOpacity={streakClaimed ? 1 : 0.8}
                >
                  <Text style={styles.homeChipText}>🔥 {streakCount} days</Text>
                  {!streakClaimed && <View style={styles.homeChipDot} />}
                </TouchableOpacity>

                <View style={styles.homeEnergyChip}>
                  <Text style={styles.homeChipText}>⚡ {energy}/{MAX_ENERGY}</Text>
                  {energy < MAX_ENERGY && (
                    <Text style={styles.homeEnergyTimer}>+1 в {energyTick}s</Text>
                  )}
                </View>

                <View style={styles.homeChip}>
                  <Text style={styles.homeChipText}>🎫 {tickets}</Text>
                </View>

                {streakShields > 0 && (
                  <View style={[styles.homeChip, styles.homeChipShield]}>
                    <Text style={styles.homeChipText}>🛡 {streakShields}</Text>
                  </View>
                )}
              </View>

              {/* Streak Shield used today banner */}
              {streakShieldUsedToday && (
                <TouchableOpacity onPress={() => setStreakShieldUsedToday(false)} activeOpacity={0.8}>
                  <LinearGradient colors={['#0F172A','#1E293B']} style={styles.shieldUsedBanner}>
                    <Text style={styles.shieldUsedIcon}>🛡</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.shieldUsedTitle}>STREAK SHIELD USED</Text>
                      <Text style={styles.shieldUsedSub}>
                        You missed a day but a shield protected your streak. {streakShields} shields remaining.
                      </Text>
                    </View>
                    <Text style={styles.shieldUsedDismiss}>✕</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* ── Genesis Pre-Season banner ── */}
              {GENESIS_PHASE && (
                <TouchableOpacity activeOpacity={0.85} onPress={() => setScreen('news')}>
                  <LinearGradient
                    colors={['#3B0764','#831843','#7C2D12','#3B0764']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={styles.genesisBanner}
                  >
                    <View style={styles.genesisBannerLeft}>
                      <View style={styles.genesisBadge}>
                        <View style={styles.genesisBadgeDot} />
                        <Text style={styles.genesisBadgeText}>GENESIS PRE-SEASON</Text>
                      </View>
                      <Text style={styles.genesisBannerTitle}>
                        {isFounder ? '🏛️  YOU ARE A FOUNDER' : '💎  CLAIM YOUR FOUNDER STATUS'}
                      </Text>
                      <Text style={styles.genesisBannerSub}>
                        Prize pool growing live · Season 1 launches soon
                      </Text>
                    </View>
                    <Text style={styles.genesisBannerArrow}>›</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* ── HERO CARD: identity + level + balance ── */}
              <LinearGradient
                colors={['#1a0040', '#3B0764', '#1a0040']}
                start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                style={styles.heroCard}
              >
                <View style={styles.heroCardTop}>
                  <View style={styles.heroAvatar}>
                    <Text style={styles.heroAvatarEmoji}>🌌</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.heroName, founderTier === 'diamond' && { color: usernameColor, textShadowColor: usernameColor, textShadowRadius: 8 }]} numberOfLines={1}>{username || 'Seeker'}</Text>
                    <View style={styles.heroLevelRow}>
                      <LinearGradient colors={['#FACC15', '#F97316']} style={styles.heroLevelChip}>
                        <Text style={styles.heroLevelChipTxt}>LV {level}</Text>
                      </LinearGradient>
                      {isFounder && (
                        <View style={styles.heroFounderChip}>
                          <Text style={styles.heroFounderTxt}>
                            {founderTier === 'diamond' ? '💎 DIAMOND'
                             : founderTier === 'gold' ? '🥇 GOLD'
                             : founderTier === 'silver' ? '🥈 SILVER'
                             : '💎 FOUNDER'} · ×{getFounderMultiplier(founderTier, isFounder)}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>
                  <View style={styles.heroBalance}>
                    <Text style={styles.heroCardBalanceNum}>{orb.toLocaleString()}</Text>
                    <Text style={styles.heroCardBalanceLbl}>ORB</Text>
                  </View>
                </View>

                {/* XP bar */}
                <View style={styles.heroXpWrap}>
                  <View style={styles.heroXpTrack}>
                    <LinearGradient colors={['#A855F7','#EC4899']} start={{x:0,y:0}} end={{x:1,y:0}}
                      style={[styles.heroXpFill, { width: `${xp}%` as any }]} />
                  </View>
                  <Text style={styles.heroXpTxt}>{xp} / 100 XP</Text>
                </View>
              </LinearGradient>

              {/* ── Founder Pass reminder (only for free tier) ── */}
              {founderTier === 'free' && (
                <TouchableOpacity activeOpacity={0.85} onPress={() => setScreen('shop')}
                  style={{ borderRadius: 14, overflow: 'hidden', marginBottom: 2 }}>
                  <LinearGradient colors={['#1a0040','#3B0764']} start={{x:0,y:0}} end={{x:1,y:0}}
                    style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingHorizontal: 14, gap: 10 }}>
                    <Text style={{ fontSize: 20 }}>👑</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={{ color: '#C084FC', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>FOUNDER PASS — from 0.5 SOL</Text>
                      <Text style={{ color: '#7C3AED', fontSize: 10, marginTop: 1 }}>×3–×5 ORB forever · free spins daily</Text>
                    </View>
                    <Text style={{ color: '#C084FC', fontSize: 16 }}>›</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* ── TAP TO EARN — Core Mechanic ── */}
              <View style={styles.tapHeroWrap}>
                <Text style={styles.tapHeroTitle}>{t('home.tapTitle')}</Text>
                <Text style={styles.tapHeroSub}>
                  {energy === 0
                    ? t('home.tapEnergyEmpty', { n: energyTick })
                    : boostActive
                    ? t('home.tapBoostActive')
                    : t('home.tapHintMain')}
                </Text>
              </View>

              <View style={styles.homeOrbArea}>
                <PremiumTapOrb
                  onTap={handleTap}
                  disabled={energy === 0}
                  boostActive={boostActive}
                  centerEmoji={energy === 0 ? '⚡' : boostActive ? '🔥' : '🌌'}
                  centerLabel={energy === 0 ? `${energyTick}s` : boostActive ? 'FIRE' : t('home.tap')}
                />

                {/* Floating reward text */}
                {floatingText !== '' && (
                  <Animated.Text style={[styles.homeFloating, {
                    opacity: floatingAnim.interpolate({ inputRange:[0,1], outputRange:[1,0] }),
                    transform:[
                      { translateY: floatingAnim.interpolate({ inputRange:[0,1], outputRange:[0,-70] }) },
                      { scale: floatingAnim.interpolate({ inputRange:[0,0.4,1], outputRange:[1,1.4,1] }) },
                    ],
                  }]}>{floatingText}</Animated.Text>
                )}
                {critText !== '' && (
                  <Text style={styles.homeCritText}>{critText}</Text>
                )}
                {levelUpText !== '' && (
                  <Animated.Text style={[styles.homeLevelUpText, { opacity: lvlUpAnim }]}>{levelUpText}</Animated.Text>
                )}
                {boostActive && (
                  <Text style={styles.homeBoostBadge}>🔥 BOOST ×3 — {boostTime}s</Text>
                )}
                {comboLevel > 0 && (
                  <Animated.View style={[styles.homeCombo, { transform:[{ scale: comboAnim }] }]}>
                    <Text style={styles.homeComboText}>×{COMBO_MULTIPLIERS[comboLevel]} COMBO</Text>
                  </Animated.View>
                )}
              </View>

              {/* Boost button (when available) */}
              {showBoost && (
                <TouchableOpacity style={[styles.homeBoostBtn, { marginBottom: 14 }]} onPress={activateBoost} activeOpacity={0.85}>
                  <LinearGradient colors={['#C2410C','#9A3412']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.homeBoostGrad}>
                    <Text style={styles.homeBoostText}>{t('home.activateBoost')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {/* ── Energy refill SOL (when energy not full) ── */}
              {energy < MAX_ENERGY && (
                <TouchableOpacity
                  onPress={payForEnergyRefill}
                  disabled={solShopPending}
                  activeOpacity={0.85}
                  style={{ marginTop: 10 }}
                >
                  <LinearGradient
                    colors={solShopPending ? ['#1E293B', '#0F172A'] : ['#14F195', '#00C2FF']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 12, borderRadius: 14, alignItems: 'center' }}
                  >
                    <Text style={{ color: solShopPending ? '#475569' : '#000', fontSize: 13, fontWeight: '900', letterSpacing: 1 }}>
                      {solShopPending ? `⏳  ${t('common.processing')}` : `⚡  ${t('home.refill')}  ·  ${ENERGY_REFILL_SOL} SOL`}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}
              {solShopStatus !== '' && (
                <Text style={{ color: '#14F195', textAlign: 'center', fontSize: 11, marginTop: 6, fontWeight: '700', letterSpacing: 1 }}>
                  {solShopStatus}
                </Text>
              )}

              {/* ── Daily quests ── */}
              <View style={styles.homeQuestCard}>
                <Text style={styles.homeQuestTitle}>📜 {t('home.dailyQuests')}</Text>
                <HomeQuestRow label={t('home.quest.taps')}   value={dailyTapQuest}   max={100} color="#A855F7" />
                <HomeQuestRow label={t('home.quest.spins')}  value={dailyWheelQuest} max={3}   color="#06B6D4" />
                <HomeQuestRow label={t('home.quest.boosts')} value={dailyBoostQuest} max={2}   color="#FB923C" />
              </View>

              {lastWheelReward !== '' && (
                <Text style={styles.homeLastReward}>✦ {lastWheelReward}</Text>
              )}

              {/* ── Play Games CTA ── */}
              <TouchableOpacity onPress={() => setScreen('games')} activeOpacity={0.85} style={{ marginTop: 14 }}>
                <LinearGradient
                  colors={['#06B6D4', '#7C3AED', '#EC4899']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.playGamesCta}
                >
                  <Text style={styles.playGamesIcon}>🎮</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.playGamesTitle}>{t('games.arcade')}</Text>
                    <Text style={styles.playGamesSub}>{t('home.gamesCtaSub')}</Text>
                  </View>
                  <Text style={styles.playGamesArrow}>›</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* ── Cup CTA ── */}
              <TouchableOpacity onPress={() => setScreen('tournament')} activeOpacity={0.85} style={{ marginTop: 10, marginBottom: 6 }}>
                <LinearGradient
                  colors={['#3B0764', '#7C2D12']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={styles.cupCta}
                >
                  <Text style={styles.cupCtaIcon}>🏆</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.cupCtaTitle}>{t('cup.title')}</Text>
                    <Text style={styles.cupCtaSub}>{t('home.cupCtaSub')}</Text>
                  </View>
                  <Text style={styles.cupCtaArrow}>›</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════ SHOP HUB ═══════════ */}
          {screen === 'shop' && (
            <View style={{ gap: 10 }}>
              {/* Hero */}
              <LinearGradient colors={['#0d0025','#1a0040','#0d0025']} style={styles.shopHero}>
                <Text style={styles.shopHeroTitle}>🛍  {t('shop.title')}</Text>
                <View style={styles.shopOrbBadge}>
                  <Text style={styles.shopOrbText}>💎 {orb.toLocaleString()} ORB</Text>
                </View>
                <Text style={styles.shopHeroSub}>{t('shop.subtitle')}</Text>
              </LinearGradient>

              {/* Hub navigation cards */}
              <View style={styles.shopHubGrid}>
                <TouchableOpacity onPress={() => setScreen('earn')} activeOpacity={0.85} style={styles.shopHubCard}>
                  <LinearGradient colors={['#0F3A52','#0C2A4A']} style={styles.shopHubCardGrad}>
                    <Text style={styles.shopHubIcon}>🪙</Text>
                    <Text style={[styles.shopHubName, { color: '#22D3EE' }]}>{t('shop.earn')}</Text>
                    <Text style={styles.shopHubDesc}>{t('shop.earnDesc')}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={() => setScreen('skora')} activeOpacity={0.85} style={styles.shopHubCard}>
                  <LinearGradient colors={['#064E3B','#0F3A2C']} style={styles.shopHubCardGrad}>
                    <Text style={styles.shopHubIcon}>💠</Text>
                    <Text style={[styles.shopHubName, { color: '#2DD4BF' }]}>{t('shop.skora')}</Text>
                    <Text style={styles.shopHubDesc}>{t('shop.skoraDesc')}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                <TouchableOpacity onPress={payForEnergyRefill} disabled={solShopPending || energy >= MAX_ENERGY} activeOpacity={0.85} style={styles.shopHubCard}>
                  <LinearGradient
                    colors={energy < MAX_ENERGY ? ['#14F195','#00C2FF'] : ['#1E293B','#0F172A']}
                    style={styles.shopHubCardGrad}
                  >
                    <Text style={styles.shopHubIcon}>⚡</Text>
                    <Text style={[styles.shopHubName, { color: energy < MAX_ENERGY ? '#000' : '#475569' }]}>{t('shop.refill')}</Text>
                    <Text style={[styles.shopHubDesc, { color: energy < MAX_ENERGY ? 'rgba(0,0,0,0.7)' : '#334155' }]}>
                      {energy < MAX_ENERGY ? `+100⚡ · ${ENERGY_REFILL_SOL} SOL` : t('shop.refillFull')}
                    </Text>
                  </LinearGradient>
                </TouchableOpacity>

              </View>

              {/* ── Space Runner promo ── */}
              <TouchableOpacity activeOpacity={0.85} onPress={() => setScreen('runner')}
                style={{ borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(0,194,255,0.3)' }}>
                <LinearGradient colors={['#020D1F','#041830']} style={{ flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 }}>
                  <Text style={{ fontSize: 32 }}>🚀</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={{ color: '#00C2FF', fontSize: 12, fontWeight: '900', letterSpacing: 1 }}>SPACE RUNNER</Text>
                    <Text style={{ color: '#94A3B8', fontSize: 11, marginTop: 2 }}>Die? Continue for ORB or SOL and keep your score!</Text>
                  </View>
                  <Text style={{ color: '#00C2FF', fontSize: 18 }}>›</Text>
                </LinearGradient>
              </TouchableOpacity>

              {/* ── FOUNDER PASS (TIERED — permanent ORB multiplier) ── */}
              <Text style={styles.shopSectionTitle}>👑  {t('founder.title')}  ·  {t('founder.permanent', { mul: getFounderMultiplier(founderTier, isFounder) })}</Text>
              {founderTier === 'diamond' ? (
                <View style={styles.founderMaxedCard}>
                  <Text style={styles.founderMaxedIcon}>💎</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.founderMaxedTitle}>{t('founder.maxedTitle')}</Text>
                    <Text style={styles.founderMaxedSub}>{t('founder.maxedSub')}</Text>
                  </View>
                </View>
              ) : (
                <>
                  <View style={styles.founderGrid}>
                    {([
                      { id: 'silver',  icon: '🥈', name: 'SILVER',  mul: 3, spins: 3,  price: FOUNDER_SILVER_SOL,  color: '#94A3B8', bg1: '#1E293B', bg2: '#0F172A' },
                      { id: 'gold',    icon: '🥇', name: 'GOLD',    mul: 4, spins: 5,  price: FOUNDER_GOLD_SOL,    color: '#FACC15', bg1: '#78350F', bg2: '#1F0E03' },
                      { id: 'diamond', icon: '💎', name: 'DIAMOND', mul: 5, spins: 10, price: FOUNDER_DIAMOND_SOL, color: '#22D3EE', bg1: '#164E63', bg2: '#0B1A1F' },
                    ] as { id: FounderPassTier; icon: string; name: string; mul: number; spins: number; price: number; color: string; bg1: string; bg2: string }[]).map(p => {
                      const order: FounderTier[] = ['free','silver','gold','diamond'];
                      const owned = order.indexOf(founderTier) >= order.indexOf(p.id);
                      return (
                        <TouchableOpacity
                          key={p.id}
                          onPress={() => paySolForFounderPass(p.id)}
                          disabled={solShopPending || owned}
                          activeOpacity={owned ? 1 : 0.82}
                          style={styles.founderCard}
                        >
                          <LinearGradient
                            colors={[p.bg1, p.bg2]}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={[styles.founderCardGrad, { borderColor: p.color + '99' }, owned && { opacity: 0.55 }]}
                          >
                            <View style={[styles.founderIconWrap, { backgroundColor: p.color + '22', borderColor: p.color + 'AA' }]}>
                              <Text style={styles.founderIcon}>{p.icon}</Text>
                            </View>
                            <Text style={[styles.founderName, { color: p.color }]}>{p.name}</Text>
                            <Text style={styles.founderMul}>×{p.mul} ORB</Text>
                            <Text style={styles.founderPerk}>{t('founder.spinsPerDay', { n: p.spins })}</Text>
                            {p.id === 'diamond' && (
                              <Text style={styles.founderPerk}>{t('founder.diamondPerk')}</Text>
                            )}
                            <View style={[styles.founderPriceTag, { borderColor: p.color + '99', backgroundColor: p.color + '15' }]}>
                              <Text style={[styles.founderPriceTxt, { color: p.color }]}>
                                {owned ? t('founder.owned') : `${p.price} SOL`}
                              </Text>
                            </View>
                          </LinearGradient>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                  <Text style={styles.shopSectionHint}>
                    {t('founder.hint')}
                  </Text>
                </>
              )}

              {/* ── PREMIUM ITEMS (rare, SOL-priced, tiered) ── */}
              <Text style={styles.shopSectionTitle}>💎  PREMIUM ITEMS  ·  SOL ONLY</Text>
              <View style={styles.premiumGrid}>
                {([
                  { id: 'shieldPack',   icon: '🛡', name: 'SHIELD PACK',    desc: '+3 streak shields',         color: '#22C55E', price: PREMIUM_SHIELD_PACK_SOL,   tier: 'BASIC'   },
                  { id: 'boostPack',    icon: '🔥', name: 'MEGA BOOST',     desc: '×3 ORB for 30 seconds',     color: '#FB923C', price: PREMIUM_BOOST_PACK_SOL,    tier: 'RARE'    },
                  { id: 'instantLevel', icon: '⬆',  name: 'INSTANT LEVEL', desc: '+1 LV · +500 ORB',          color: '#FACC15', price: PREMIUM_INSTANT_LEVEL_SOL, tier: 'EPIC'    },
                  { id: 'rareSkin',     icon: '💎', name: 'MEGA BUNDLE',    desc: '10 000 ORB instant drop',   color: '#EC4899', price: PREMIUM_SKIN_SOL,          tier: 'LEGEND'  },
                ] as { id: PremiumItem; icon: string; name: string; desc: string; color: string; price: number; tier: string }[]).map(p => (
                  <TouchableOpacity
                    key={p.id}
                    onPress={() => paySolForPremiumItem(p.id)}
                    disabled={solShopPending}
                    activeOpacity={0.82}
                    style={styles.premiumCard}
                  >
                    <LinearGradient
                      colors={[p.color + '30', '#0A0A12']}
                      start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                      style={[styles.premiumCardGrad, { borderColor: p.color + '66' }]}
                    >
                      {/* Tier badge top-right */}
                      <View style={[styles.premiumTierBadge, { borderColor: p.color + '88', backgroundColor: p.color + '22' }]}>
                        <Text style={[styles.premiumTierTxt, { color: p.color }]}>{p.tier}</Text>
                      </View>

                      <View style={[styles.premiumIconWrap, { borderColor: p.color + '88', backgroundColor: p.color + '22' }]}>
                        <Text style={styles.premiumIcon}>{p.icon}</Text>
                      </View>
                      <Text style={[styles.premiumName, { color: p.color }]}>{p.name}</Text>
                      <Text style={styles.premiumDesc} numberOfLines={2}>{p.desc}</Text>
                      <View style={[styles.premiumPriceTag, { borderColor: p.color + '99' }]}>
                        <Text style={[styles.premiumPriceTxt, { color: p.color }]}>
                          {solShopPending ? '⏳' : `⚡ ${p.price} SOL`}
                        </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                ))}
              </View>

              <Text style={styles.shopSectionHint}>
                {t('shop.premiumHint')}
              </Text>

              {/* Section divider */}
              <Text style={styles.shopSectionTitle}>{t('shop.upgrades')}</Text>

              {/* Upgrade cards */}
              {(Object.keys(UPGRADE_DEFS) as UpgradeKey[]).map((key) => {
                const def     = UPGRADE_DEFS[key];
                const lv      = upgrades[key];
                const maxed   = lv >= MAX_LEVEL;
                const cost    = maxed ? 0 : def.costs[lv];
                const canAfford = orb >= cost;
                const pct     = (lv / MAX_LEVEL) * 100;
                return (
                  <View key={key} style={[styles.shopCard, { borderColor: def.color + '40' }]}>
                    {/* Color accent bar */}
                    <View style={[styles.shopCardAccent, { backgroundColor: def.color }]} />

                    <View style={styles.shopCardBody}>
                      {/* Left: icon + name */}
                      <View style={styles.shopCardLeft}>
                        <View style={[styles.shopIconCircle, { backgroundColor: def.color + '22', borderColor: def.color + '55' }]}>
                          <Text style={styles.shopCardIcon}>{def.icon}</Text>
                        </View>
                        <View>
                          <Text style={[styles.shopCardName, { color: def.color }]}>{def.name}</Text>
                          <Text style={styles.shopCardDesc}>{def.desc}</Text>
                        </View>
                      </View>

                      {/* Right: level badge */}
                      <View style={[styles.shopLvBadge, { backgroundColor: def.color + '22', borderColor: def.color + '55' }]}>
                        <Text style={[styles.shopLvNum, { color: def.color }]}>LV{lv}</Text>
                        <Text style={styles.shopLvMax}>/{MAX_LEVEL}</Text>
                      </View>
                    </View>

                    {/* Progress bar */}
                    <View style={styles.shopProgressTrack}>
                      <View style={[styles.shopProgressFill, { width: `${pct}%` as any, backgroundColor: def.color }]} />
                      {/* Segment ticks */}
                      {Array.from({ length: MAX_LEVEL - 1 }).map((_, i) => (
                        <View key={i} style={[styles.shopProgressTick, { left: `${((i + 1) / MAX_LEVEL) * 100}%` as any }]} />
                      ))}
                    </View>

                    {/* Value row */}
                    <View style={styles.shopValueRow}>
                      <View style={styles.shopValueBox}>
                        <Text style={styles.shopValueLabel}>NOW</Text>
                        <Text style={[styles.shopValueNum, { color: def.color }]}>{def.valueLabels[lv]}</Text>
                      </View>
                      {!maxed && (
                        <>
                          <Text style={styles.shopArrow}>→</Text>
                          <View style={styles.shopValueBox}>
                            <Text style={styles.shopValueLabel}>NEXT</Text>
                            <Text style={styles.shopValueNumNext}>{def.valueLabels[lv + 1]}</Text>
                          </View>
                        </>
                      )}
                      <View style={{ flex: 1 }} />
                      {maxed ? (
                        <View style={[styles.shopMaxBadge, { borderColor: def.color + '60' }]}>
                          <Text style={[styles.shopMaxText, { color: def.color }]}>✦ MAX</Text>
                        </View>
                      ) : (
                        <TouchableOpacity onPress={() => buyUpgrade(key)} disabled={!canAfford} activeOpacity={0.75}>
                          <LinearGradient
                            colors={canAfford ? [def.color + 'EE', def.color + '99'] : ['#1E293B', '#0F172A']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                            style={styles.shopBuyBtn}
                          >
                            <Text style={[styles.shopBuyText, !canAfford && { color: '#334155' }]}>
                              {canAfford ? `${cost.toLocaleString()} ORB` : `Need ${(cost - orb).toLocaleString()} more`}
                            </Text>
                          </LinearGradient>
                        </TouchableOpacity>
                      )}
                    </View>

                    {/* SOL instant upgrade row */}
                    {!maxed && (
                      <TouchableOpacity
                        onPress={() => paySolUpgrade(key)}
                        disabled={solShopPending}
                        activeOpacity={0.75}
                        style={{ marginTop: 8 }}
                      >
                        <LinearGradient
                          colors={solShopPending ? ['#1E293B','#0F172A'] : ['#14F195','#00C2FF']}
                          start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                          style={{ paddingVertical: 9, paddingHorizontal: 12, borderRadius: 10, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 6 }}
                        >
                          <Text style={{ color: solShopPending ? '#475569' : '#000', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>
                            ⚡ INSTANT  ·  {PREMIUM_UPGRADE_SOL} SOL
                          </Text>
                        </LinearGradient>
                      </TouchableOpacity>
                    )}
                  </View>
                );
              })}

              {/* SOL Shop status */}
              {solShopStatus !== '' && (
                <Text style={{ color: '#14F195', textAlign: 'center', fontSize: 11, marginVertical: 6, fontWeight: '700', letterSpacing: 1 }}>
                  {solShopStatus}
                </Text>
              )}

              {/* Stats summary */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>📊 YOUR STATS</Text>
                <StatRow icon="⚡" label="Signal Power"  value={`${TAP_VALUES[upgrades.signalPower]} ORB/tap`}            color="#A855F7" />
                <StatRow icon="🎯" label="Crit Chance"   value={`${Math.round(CRIT_CHANCES[upgrades.critChance] * 100)}%`} color="#FACC15" />
                <StatRow icon="🎡" label="Wheel Luck"    value={UPGRADE_DEFS.wheelLuck.valueLabels[upgrades.wheelLuck]}   color="#06B6D4" />
                <StatRow icon="🐎" label="Horse Power"   value={`+${HORSE_POWERS[upgrades.horsePower]}/tap`}              color="#FB923C" />
              </View>

              {/* Cosmetic NFT Teaser (Gemini design) */}
              <CosmeticNftTeaser />
            </View>
          )}

          {/* ═══════════ QUESTS ═══════════ */}
          {screen === 'quests' && (
            <View>
              <View style={styles.card}>
                <Text style={styles.cardTitle}>DAILY QUESTS</Text>
                {[
                  { icon: '✅', title: 'Daily Check-in',    reward: 'Reward: 50 ORB' },
                  { icon: '🎯', title: 'Tap the Signal Run', reward: 'Reward: 150 ORB + 1 Ticket' },
                  { icon: '🟣', title: 'Open Reward Wheel',  reward: 'Reward: Bonus ORB' },
                ].map((q, i) => (
                  <View key={i} style={styles.questRow}>
                    <Text style={styles.questIcon}>{q.icon}</Text>
                    <View>
                      <Text style={styles.questItemTitle}>{q.title}</Text>
                      <Text style={styles.questReward}>{q.reward}</Text>
                    </View>
                  </View>
                ))}
              </View>
              <GradBtn onPress={startSignalGame} label="▶  COMPLETE TAP THE SIGNAL" />
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setScreen('wheel')}>
                <Text style={styles.secondaryButtonText}>GO TO REWARD WHEEL</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════ WHEEL ═══════════ */}
          {screen === 'wheel' && (
            <FortuneWheel
              orb={orb}
              tickets={tickets}
              onEarnOrb={(n) => {
                const next = orb + n;
                setOrb(next);
                syncScore(next, level, streakCount);
                setLastWheelReward(`+${n.toLocaleString()} ORB`);
                winRef.current?.show(n);
              }}
              onSpendOrb={(n) => {
                const next = Math.max(0, orb - n);
                setOrb(next);
                syncScore(next, level, streakCount);
              }}
              onEarnTickets={(n) => {
                setTickets(t => t + n);
                setLastWheelReward(`+${n} Tickets`);
              }}
              onSpendTickets={(n) => setTickets(t => Math.max(0, t - n))}
              onAddTournamentScore={addTournamentScore}
              onSpin={() => setDailyWheelQuest(p => Math.min(p + 1, 3))}
              onBeforePaidSpin={paySolForWheelSpin}
              paidSpinCostLabel={solSpinPending ? 'PAYING...' : `${WHEEL_SPIN_SOL.toFixed(2)} SOL`}
              paidSpinDisabled={solSpinPending}
              paidSpinStatus={solSpinStatus}
              freeSpinsPerDay={1 + (isFounder ? FOUNDER_TIER_FREE_SPINS[founderTier] : 0)}
            />
          )}

          {/* ═══════════ SIGNAL ═══════════ */}
          {screen === 'signal' && (
            <View style={{ gap: 10 }}>
              {boostActive && <View style={styles.boostBackgroundGlow} />}

              {/* ── HUD row ── */}
              <LinearGradient colors={['#0d0025','#1a0040','#0d0025']} style={styles.signalHud}>
                <View style={styles.signalHudBlock}>
                  <Text style={[styles.signalHudNum,
                    { color: timeLeft <= 5 ? '#EF4444' : timeLeft <= 9 ? '#FB923C' : '#22C55E' }]}>
                    {timeLeft}
                  </Text>
                  <Text style={styles.signalHudLabel}>SEC</Text>
                </View>
                <View style={styles.signalHudDivider} />
                <View style={styles.signalHudBlock}>
                  <Text style={styles.signalHudNum}>{score}</Text>
                  <Text style={styles.signalHudLabel}>TAPS</Text>
                </View>
                <View style={styles.signalHudDivider} />
                <View style={styles.signalHudBlock}>
                  <Text style={[styles.signalHudNum, { color: '#FACC15' }]}>
                    {(score * TAP_VALUES[upgrades.signalPower]).toLocaleString()}
                  </Text>
                  <Text style={styles.signalHudLabel}>ORB</Text>
                </View>
              </LinearGradient>

              {/* ── Energy bar ── */}
              <View style={styles.signalEnergyRow}>
                <Text style={styles.signalEnergyLabel}>⚡ ENERGY</Text>
                <View style={styles.signalEnergyTrack}>
                  <LinearGradient
                    colors={energy > 30 ? ['#7C3AED','#EC4899'] : ['#991B1B','#DC2626']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={[styles.signalEnergyFill, { width: `${(energy / MAX_ENERGY) * 100}%` as any }]}
                  />
                </View>
                <Text style={styles.signalEnergyCount}>{energy}/{MAX_ENERGY}</Text>
              </View>
              {energy === 0 && (
                <Text style={styles.energyEmptyText}>{t('home.tapEnergyEmpty', { n: energyTick })}</Text>
              )}

              {/* ── Combo badge ── */}
              {comboLevel > 0 && gameActive && (
                <Animated.View style={[styles.signalComboBadge, { transform: [{ scale: comboAnim }] }]}>
                  <Text style={styles.signalComboLabel}>COMBO</Text>
                  <Text style={[styles.signalComboMul, comboLevel === 3 && styles.comboMax]}>
                    ×{COMBO_MULTIPLIERS[comboLevel]}
                  </Text>
                </Animated.View>
              )}

              {/* ── Boost bar ── */}
              {boostActive && (
                <LinearGradient colors={['#7C2D12','#C2410C']} style={styles.signalBoostBar}>
                  <Text style={styles.signalBoostText}>🔥 FIRE BOOST ×3  —  {boostTime}s</Text>
                </LinearGradient>
              )}

              {/* ── TAP ORB area ── */}
              <View style={styles.orbWrapper}>
                {boostActive && (
                  <Animated.View style={[styles.boostRingOuter, {
                    opacity: ringAnim.interpolate({ inputRange: [0,1], outputRange: [0.7,0] }),
                    transform: [{ scale: ringAnim.interpolate({ inputRange: [0,1], outputRange: [1,1.6] }) }],
                  }]} />
                )}
                <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
                  <TouchableOpacity
                    style={[styles.signalOrb, boostActive && styles.signalOrbBoosted, energy === 0 && styles.signalOrbDrained]}
                    onPress={(e) => {
                      if (energy <= 0) return;
                      const { pageX, pageY } = e.nativeEvent;
                      lastTapPos.current = { x: pageX, y: pageY };
                      tapSignal();
                      particleRef.current?.emit(pageX, pageY, 'tap');
                    }}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.signalOrbText}>{energy === 0 ? '⚡' : 'TAP'}</Text>
                    {energy === 0 && <Text style={styles.signalOrbDrainedText}>{energyTick}s</Text>}
                  </TouchableOpacity>
                </Animated.View>

                {/* Floating reward text */}
                {floatingText !== '' && (
                  <Animated.Text style={[styles.floatingText, {
                    opacity: floatingAnim.interpolate({ inputRange: [0,1], outputRange: [1,0] }),
                    transform: [
                      { translateY: floatingAnim.interpolate({ inputRange: [0,1], outputRange: [0,-60] }) },
                      { scale:      floatingAnim.interpolate({ inputRange: [0,0.5,1], outputRange: [1,1.4,1] }) },
                    ],
                  }]}>{floatingText}</Animated.Text>
                )}
                {critText !== '' && <Text style={styles.critText}>{critText}</Text>}
              </View>

              {/* Level-up overlay */}
              {levelUpText !== '' && (
                <Animated.Text style={[styles.levelUpText, {
                  opacity: lvlUpAnim,
                  transform: [{ scale: lvlUpAnim.interpolate({ inputRange: [0,0.6,0.8,1], outputRange: [0.3,1.25,0.95,1] }) }],
                }]}>{levelUpText}</Animated.Text>
              )}

              {/* Boost activate button */}
              {showBoost && (
                <TouchableOpacity onPress={activateBoost} activeOpacity={0.82}>
                  <LinearGradient colors={['#C2410C','#9A3412']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.fireBoost}>
                    <Text style={styles.fireBoostText}>{t('home.activateBoost')}</Text>
                  </LinearGradient>
                </TouchableOpacity>
              )}

              {!gameActive && <GradBtn onPress={() => setScreen('wheel')} label="💎  CLAIM REWARDS" />}
            </View>
          )}

          {/* ═══════════ LEADERBOARD ═══════════ */}
          {screen === 'leaderboard' && (
            <View>
              {/* Back link */}
              <TouchableOpacity
                onPress={() => setScreen('tournament')}
                activeOpacity={0.7}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 6, marginBottom: 6 }}
              >
                <Text style={{ color: '#A855F7', fontSize: 16, fontWeight: '900' }}>‹</Text>
                <Text style={{ color: '#A855F7', fontSize: 12, fontWeight: '800', letterSpacing: 1 }}>{t('cup.backToTournament')}</Text>
              </TouchableOpacity>

              {/* Season header */}
              <LinearGradient
                colors={['rgba(124,58,237,0.35)', 'rgba(2,5,16,0.98)']}
                style={styles.seasonHeader}
              >
                <Text style={styles.seasonBadge}>✦  SEASON ZERO  ·  GENESIS LEAGUE  ✦</Text>
                <Text style={styles.seasonTitle}>SEEKER RANKINGS</Text>

                {/* Countdown */}
                <SeasonCountdown />
                <Text style={styles.seasonEndsLabel}>UNTIL SEASON ENDS</Text>
              </LinearGradient>

              {/* Prize pool */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>🏆 SEASON REWARDS</Text>
                <PrizeTier rank="🥇  #1"      reward="50,000 ORB + Genesis NFT"  color="#FACC15" />
                <PrizeTier rank="🥈  #2 – 5"  reward="10,000 ORB + Rare Badge"   color="#94A3B8" />
                <PrizeTier rank="🏅  #6 – 20" reward="2,500 ORB"                 color="#FB923C" />
                <PrizeTier rank="🎖  #21–100" reward="500 ORB"                   color="#6366F1" />
              </View>

              {/* Leaderboard */}
              <View style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                  <Text style={styles.cardTitle}>TOP SEEKERS</Text>
                  {lbLoading && <Text style={{ color: '#475569', fontSize: 11 }}>updating…</Text>}
                </View>
                {lbData.length > 0 ? (
                  lbData.map((p, i) => (
                    <LeaderRow
                      key={p.device_id}
                      rank={i + 1}
                      name={p.username}
                      orb={p.season_orb}
                      gold={i === 0}
                      highlight={p.device_id === deviceIdRef.current}
                    />
                  ))
                ) : (
                  <>
                    <LeaderRow rank={1} name="nova.skr"         orb={24900} gold />
                    <LeaderRow rank={2} name="vaultlord.skr"    orb={21450} />
                    <LeaderRow rank={3} name="signalhunter.skr" orb={19880} />
                    <LeaderRow rank={4} name="you"              orb={orb}   highlight />
                    <LeaderRow rank={5} name="degenpilot.skr"   orb={2100}  />
                    <Text style={{ color: '#334155', fontSize: 10, textAlign: 'center', marginTop: 8, letterSpacing: 1 }}>
                      CONNECT SUPABASE TO SEE REAL PLAYERS
                    </Text>
                  </>
                )}
              </View>

              <View style={styles.seasonMyRank}>
                <Text style={styles.seasonMyRankLabel}>YOUR RANK THIS SEASON</Text>
                <Text style={styles.seasonMyRankNum}>#4</Text>
                <Text style={styles.seasonMyRankSub}>Keep tapping to climb! 🚀</Text>
              </View>
            </View>
          )}

          {/* ═══════════ WALLET ═══════════ */}
          {screen === 'wallet' && (
            <View>
              {walletAddr ? (
                /* ── Premium Wallet (Gemini design) когда кошелёк подключён ── */
                <View>
                  <PremiumWallet
                    orbBalance={orb}
                    skoraBalance={(orb / 10000)}
                    solBalance={solBalance ?? 0}
                    onRefill={payForEnergyRefill}
                    onConvert={() => setScreen('skora')}
                    isVerified={seekerProfile?.isSeeker || installerSeekerGranted}
                    refillCost={`${ENERGY_REFILL_SOL} SOL`}
                  />
                  {/* Wallet address + disconnect (под premium card) */}
                  <View style={[styles.card, { marginHorizontal: 0 }]}>
                    <Text style={styles.walletAddress}>
                      {walletAddr.slice(0, 4)}...{walletAddr.slice(-4)}
                    </Text>
                    <Text style={styles.walletAddressFull}>{walletAddr}</Text>
                    <TouchableOpacity onPress={connectWalletWithMwa} activeOpacity={0.85} disabled={walletConnecting} style={{ marginTop: 12 }}>
                      <LinearGradient colors={['#14F195','#00C2FF']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.phantomBtn}>
                        <Text style={styles.phantomBtnText}>{walletConnecting ? 'CONNECTING...' : 'RECONNECT WITH MWA'}</Text>
                      </LinearGradient>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.disconnectBtn} onPress={disconnectWallet}>
                      <Text style={styles.disconnectText}>Disconnect Wallet</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ) : (
                /* ── Connect flow когда кошелёк НЕ подключён ── */
                <View>
                  <LinearGradient
                    colors={['rgba(20,184,166,0.2)', 'rgba(2,5,16,0.98)']}
                    style={styles.walletHeader}
                  >
                    <Text style={styles.walletHeaderIcon}>💎</Text>
                    <Text style={styles.walletHeaderTitle}>SOLANA WALLET</Text>
                    <Text style={styles.walletHeaderSub}>Connect to earn SKORA token</Text>
                  </LinearGradient>

                  <TouchableOpacity onPress={connectWalletWithMwa} activeOpacity={0.85} disabled={walletConnecting}>
                    <LinearGradient colors={['#14F195','#00C2FF']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.phantomBtn}>
                      <Text style={styles.phantomBtnText}>{walletConnecting ? 'CONNECTING...' : 'CONNECT WITH MWA'}</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <TouchableOpacity onPress={openPhantom} activeOpacity={0.85}>
                    <LinearGradient colors={['#9945FF','#7B61FF']} start={{x:0,y:0}} end={{x:1,y:0}} style={styles.phantomBtn}>
                      <Text style={styles.phantomBtnText}>👻  OPEN PHANTOM</Text>
                    </LinearGradient>
                  </TouchableOpacity>

                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>PASTE ADDRESS MANUALLY</Text>
                    <TextInput
                      style={styles.walletInput}
                      value={walletInput}
                      onChangeText={setWalletInput}
                      placeholder="Solana address (e.g. 7xKp...)"
                      placeholderTextColor="#7C8BA5"
                      autoCapitalize="none"
                      autoCorrect={false}
                    />
                    <GradBtn
                      label="✓  CONNECT WALLET"
                      onPress={() => connectWallet(walletInput)}
                      disabled={!isValidSolana(walletInput)}
                      colors={['#0F766E','#0891B2']}
                    />
                  </View>

                  <View style={styles.card}>
                    <Text style={styles.cardTitle}>💎 WHAT IS SKORA?</Text>
                    {[
                      { icon: '🎮', text: 'Earn ORB by playing SEEKER QUEST LEAGUE' },
                      { icon: '⚗️', text: 'Convert 10,000 ORB → 1 SKORA token' },
                      { icon: '🌐',  text: 'SKORA is an SPL token on Solana blockchain' },
                      { icon: '📈', text: 'Future listing on MEXC & top exchanges' },
                      { icon: '📱', text: 'Built for Seeker Phone — Solana Mobile' },
                    ].map((item, i) => (
                      <View key={i} style={styles.skoraRow}>
                        <Text style={styles.skoraRowIcon}>{item.icon}</Text>
                        <Text style={styles.skoraRowText}>{item.text}</Text>
                      </View>
                    ))}
                  </View>
                </View>
              )}
            </View>
          )}

          {/* ═══════════ TOURNAMENT ═══════════ */}
          {screen === 'tournament' && (
            <View>
              <Tournament
                deviceId={deviceIdRef.current}
                username={username || 'Seeker#' + deviceIdRef.current.slice(-4).toUpperCase()}
                myScore={tournamentScore}
              />
              {/* Quick link to global ORB rankings */}
              <TouchableOpacity
                onPress={() => { setScreen('leaderboard'); fetchLeaderboard(); }}
                activeOpacity={0.85}
                style={{ marginTop: 12, marginHorizontal: 4 }}
              >
                <LinearGradient
                  colors={['#7C3AED','#EC4899']}
                  start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                  style={{ paddingVertical: 14, borderRadius: 14, alignItems: 'center', flexDirection: 'row', justifyContent: 'center', gap: 10 }}
                >
                  <Text style={{ fontSize: 18 }}>🏆</Text>
                  <Text style={{ color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 2 }}>
                    {t('cup.rankings')}
                  </Text>
                  <Text style={{ color: '#FFF', fontSize: 18 }}>›</Text>
                </LinearGradient>
              </TouchableOpacity>
            </View>
          )}

          {/* ═══════════ GENESIS NEWS ═══════════ */}
          {screen === 'news' && (
            <GenesisNews
              deviceId={deviceIdRef.current}
              isFounder={isFounder}
            />
          )}

          {/* ═══════════ LANDS ═══════════ */}
          {screen === 'lands' && (
            <SeekerLands
              orb={orb}
              onOrbChange={(next) => {
                setOrb(next);
                syncScore(next, level, streakCount);
              }}
              onAfterCollect={(secondsUntilFull) => {
                // Schedule reminder push at next cap (24h)
                if (notificationsEnabled) {
                  scheduleLandsReady(secondsUntilFull).catch(() => {});
                }
              }}
            />
          )}

          {/* ═══════════ ARENA ═══════════ */}
          {screen === 'arena' && (
            <Arena
              orb={orb}
              deviceId={deviceIdRef.current}
              username={username || 'Seeker#' + deviceIdRef.current.slice(-4).toUpperCase()}
              onOrbChange={(next) => {
                setOrb(next);
                syncScore(next, level, streakCount);
              }}
              onRaidWin={() => addTournamentScore(50)}
            />
          )}

          {/* ═══════════ TREASURE HUNT ═══════════ */}
          {screen === 'treasure' && (
            <TreasureHunt
              energy={energy}
              onSpendEnergy={(n) => {
                const next = Math.max(0, energy - n);
                setEnergy(next);
                AsyncStorage.setItem('sk_energy', next.toString()).catch(() => {});
                AsyncStorage.setItem('sk_energy_ts', Date.now().toString()).catch(() => {});
              }}
              onEarnOrb={(n) => {
                const next = orb + n;
                setOrb(next);
                syncScore(next, level, streakCount);
                addTournamentScore(30); // +30 за сундук
              }}
              onSpendOrb={(n) => {
                const next = Math.max(0, orb - n);
                setOrb(next);
                syncScore(next, level, streakCount);
              }}
            />
          )}

          {/* ═══════════ SKORA WALLET ═══════════ */}
          {screen === 'skora' && (
            <SKORAWallet
              orb={orb}
              onSpendOrb={(n) => {
                const next = Math.max(0, orb - n);
                setOrb(next);
                syncScore(next, level, streakCount);
              }}
              deviceId={deviceIdRef.current}
            />
          )}

          {/* ═══════════ EARN HUB (ads + SKORA shortcut) ═══════════ */}
          {screen === 'earn' && (
            <EarnHub
              deviceId={deviceIdRef.current}
              orb={orb}
              onOpenSkoraWallet={() => setScreen('skora')}
              onOpenCampaign={(c) => setActiveAdCampaign(c)}
            />
          )}

          {/* ═══════════ PvP ARENA (live ORB stakes) ═══════════ */}
          {screen === 'pvp' && (
            <PvPArena
              deviceId={deviceIdRef.current}
              username={username || 'Seeker#' + deviceIdRef.current.slice(-4).toUpperCase()}
              orb={orb}
              onSpendOrb={(n) => {
                const next = Math.max(0, orb - n);
                setOrb(next);
                syncScore(next, level, streakCount);
              }}
              onEarnOrb={(n) => {
                const next = orb + n;
                setOrb(next);
                syncScore(next, level, streakCount);
              }}
              onPaySolEntry={payForPvPEntry}
              solEntryCost={PVP_ENTRY_SOL}
            />
          )}

          {/* ═══════════ GAMES HUB ═══════════ */}
          {screen === 'games' && (
            <View style={{ gap: 10 }}>

              {/* Header */}
              <LinearGradient colors={['#1a0040','#0F172A']} style={styles.gamesHeader}>
                <Text style={styles.gamesTitle}>🎮  {t('games.arcade')}</Text>
                <Text style={styles.gamesSubtitle}>{t('games.subtitle')}</Text>
              </LinearGradient>

              {/* All games — uniform full-width cards */}
              {([
                { id: 'labyrinth', icon: '🕳️', name: 'ABYSS LABYRINTH', tag: 'NEW · 3D', desc: 'Real-3D maze — slay shades, loot artifacts, escape alive', reward: 'Up to 10,000+ ORB per run', color: '#8B5CF6' },
                { id: 'runner',   icon: '🚀', name: 'SPACE RUNNER',  tag: t('games.featured'),   desc: t('gameDesc.runner'),   reward: t('gameReward.runner'),   color: '#00E5FF' },
                { id: 'wheel',    icon: '🎰', name: 'FORTUNE WHEEL', tag: t('gameTag.luck'),     desc: t('gameDesc.wheel'),    reward: t('gameReward.wheel'),    color: '#A855F7' },
                { id: 'pvp',      icon: '⚡', name: 'PvP ARENA',     tag: 'LIVE',                desc: t('gameDesc.pvp'),      reward: t('gameReward.pvp'),      color: '#EC4899' },
                { id: 'arena',    icon: '⚔️', name: 'SEEKER ARENA',  tag: 'PvP',                 desc: t('gameDesc.arena'),    reward: t('gameReward.arena'),    color: '#EF4444' },
                { id: 'horse',    icon: '🐎', name: 'HORSE RACE',    tag: t('gameTag.race'),     desc: t('gameDesc.horse'),    reward: t('gameReward.horse'),    color: '#FB923C' },
                { id: 'treasure', icon: '📦', name: 'TREASURE HUNT', tag: t('gameTag.explore'),  desc: t('gameDesc.treasure'), reward: t('gameReward.treasure'), color: '#FACC15' },
                { id: 'lands',    icon: '🌾', name: 'SEEKER LANDS',  tag: t('gameTag.passive'),  desc: t('gameDesc.lands'),    reward: t('gameReward.lands'),    color: '#22C55E' },
              ] as { id: Screen; icon: string; name: string; tag: string; desc: string; reward: string; color: string }[]).map((g, i) => (
                <TouchableOpacity key={i} style={styles.gameFullCard} onPress={() => setScreen(g.id)} activeOpacity={0.82}>
                  <LinearGradient colors={[g.color + '1A', '#0B1120']} style={styles.gameFullGrad}>
                    <View style={[styles.gameFullIconWrap, { borderColor: g.color + '55', backgroundColor: g.color + '18' }]}>
                      <Text style={styles.gameFullIconEmoji}>{g.icon}</Text>
                    </View>
                    <View style={styles.gameFullInfo}>
                      <View style={styles.gameFullTitleRow}>
                        <Text style={[styles.gameFullName, { color: g.color }]}>{g.name}</Text>
                        <View style={[styles.gameFullTag, { borderColor: g.color + '55' }]}>
                          <Text style={[styles.gameFullTagTxt, { color: g.color }]}>{g.tag}</Text>
                        </View>
                      </View>
                      <Text style={styles.gameFullDesc}>{g.desc}</Text>
                      <Text style={[styles.gameFullReward, { color: g.color }]}>▶  {g.reward}</Text>
                    </View>
                    <Text style={[styles.gameFullArrow, { color: g.color }]}>›</Text>
                  </LinearGradient>
                </TouchableOpacity>
              ))}
            </View>
          )}

          {/* ═══════════ PROFILE ═══════════ */}
          {screen === 'profile' && (
            <View style={{ gap: 12 }}>

              {/* ── Hero card ── */}
              <LinearGradient colors={['#0d0025','#1a0040','#3B0764','#1a0040','#0d0025']} style={styles.profileHero}>
                <View style={styles.profileAvatarWrap}>
                  <LinearGradient colors={['#7C3AED','#EC4899']} style={styles.profileAvatarGrad}>
                    <Text style={styles.profileAvatarLetter}>S</Text>
                  </LinearGradient>
                  {/* Level ring */}
                  <View style={styles.profileLvBadge}>
                    <Text style={styles.profileLvTxt}>LV{level}</Text>
                  </View>
                </View>
                {editingUsername ? (
                  <View style={styles.profileEditRow}>
                    <TextInput
                      style={styles.profileNameInput}
                      value={pendingUsername}
                      onChangeText={setPendingUsername}
                      maxLength={20}
                      autoFocus
                      selectTextOnFocus
                      placeholderTextColor="#7C8BA5"
                    />
                    <TouchableOpacity style={styles.profileEditSave} onPress={saveUsername}>
                      <Text style={styles.profileEditSaveTxt}>✓</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.profileEditCancel} onPress={() => {
                      setPendingUsername(username);
                      setEditingUsername(false);
                    }}>
                      <Text style={styles.profileEditCancelTxt}>✕</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <TouchableOpacity style={styles.profileNameRow} onPress={() => {
                    setPendingUsername(username);
                    setEditingUsername(true);
                  }}>
                    <Text style={styles.profileName}>{username || 'Seeker#????'}</Text>
                    <Text style={styles.profileEditIcon}>✏</Text>
                  </TouchableOpacity>
                )}
                <Text style={styles.profileSub}>{t('profile.season')}</Text>

                {/* XP bar */}
                <View style={styles.profileXpRow}>
                  <Text style={styles.profileXpLbl}>XP</Text>
                  <View style={styles.profileXpTrack}>
                    <LinearGradient colors={['#7C3AED','#EC4899']} start={{x:0,y:0}} end={{x:1,y:0}}
                      style={[styles.profileXpFill, { width: `${xp}%` as any }]} />
                  </View>
                  <Text style={styles.profileXpLbl}>{xp}/100</Text>
                </View>
              </LinearGradient>

              {/* ── Big 4 stats ── */}
              <View style={styles.profileStats4}>
                {[
                  { val: orb.toLocaleString(),            lbl: 'ORB',     color: '#C084FC' },
                  { val: level.toString(),                 lbl: 'LEVEL',   color: '#FACC15' },
                  { val: `${streakCount}🔥${streakShields > 0 ? ` 🛡${streakShields}` : ''}`,
                                                            lbl: 'STREAK',  color: '#FB923C' },
                  { val: tournamentScore.toLocaleString(), lbl: 'PTS',     color: '#22C55E' },
                ].map((s, i) => (
                  <LinearGradient key={i} colors={['#0F172A','#1E293B']} style={styles.profileStat4Card}>
                    <Text style={[styles.profileStat4Num, { color: s.color }]}>{s.val}</Text>
                    <Text style={styles.profileStat4Lbl}>{s.lbl}</Text>
                  </LinearGradient>
                ))}
              </View>

              {/* ── Invite friends card ── */}
              <TouchableOpacity activeOpacity={0.85} onPress={() => setShowReferralModal(true)}>
                <LinearGradient colors={['#0d0025','#3B0764','#1a0040']} start={{x:0,y:0}} end={{x:1,y:0}}
                  style={styles.refCard}>
                  <Text style={styles.refCardIcon}>🎁</Text>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.refCardTitle}>{t('ref.cardTitle')}</Text>
                    <Text style={styles.refCardSub}>{t('ref.subtitle', { n: REFERRED_REWARD.toLocaleString() })}</Text>
                  </View>
                  <View style={styles.refCardCta}>
                    <Text style={styles.refCardCtaTxt}>{refCount > 0 ? `👥 ${refCount}` : t('ref.cardCta')}</Text>
                  </View>
                </LinearGradient>
              </TouchableOpacity>

              {/* ── Seeker identity ── */}
              {/* Installer-based grant takes precedence (faster, more reliable) */}
              {installerSeekerGranted ? (
                <LinearGradient colors={['#0d0025','#3B0764','#0d0025']} style={styles.seekerCard}>
                  <View style={styles.seekerHeader}>
                    <Text style={styles.seekerBadge}>🟣  SEEKER VERIFIED ✓</Text>
                    <Text style={styles.seekerBonusTag}>+5000 ORB</Text>
                  </View>
                  <View style={styles.seekerRows}>
                    <View style={styles.seekerRow}>
                      <Text style={styles.seekerKey}>Source</Text>
                      <Text style={styles.seekerVal}>Solana dApp Store</Text>
                    </View>
                    {seekerProfile?.skrDomain && (
                      <View style={styles.seekerRow}>
                        <Text style={styles.seekerKey}>Domain</Text>
                        <Text style={styles.seekerVal}>{seekerProfile.skrDomain}</Text>
                      </View>
                    )}
                    {seekerProfile?.skrBalance !== undefined && seekerProfile.skrBalance > 0 && (
                      <View style={styles.seekerRow}>
                        <Text style={styles.seekerKey}>SKR balance</Text>
                        <Text style={styles.seekerVal}>{seekerProfile.skrBalance.toLocaleString()}</Text>
                      </View>
                    )}
                  </View>
                </LinearGradient>
              ) : walletAddr ? (
                seekerLoading && !seekerProfile ? (
                  <View style={styles.seekerCard}>
                    <Text style={styles.seekerLoading}>⏳  Checking Seeker identity…</Text>
                  </View>
                ) : seekerProfile?.isSeeker ? (
                  <LinearGradient colors={['#0d0025','#3B0764','#0d0025']} style={styles.seekerCard}>
                    <View style={styles.seekerHeader}>
                      <Text style={styles.seekerBadge}>🟣  SEEKER VERIFIED ✓</Text>
                      {sgtBonusGranted && <Text style={styles.seekerBonusTag}>+{SGT_BONUS_ORB} ORB</Text>}
                    </View>
                    <View style={styles.seekerRows}>
                      {seekerProfile.skrDomain && (
                        <View style={styles.seekerRow}>
                          <Text style={styles.seekerKey}>Domain</Text>
                          <Text style={styles.seekerVal}>{seekerProfile.skrDomain}</Text>
                        </View>
                      )}
                      <View style={styles.seekerRow}>
                        <Text style={styles.seekerKey}>SKR balance</Text>
                        <Text style={styles.seekerVal}>{seekerProfile.skrBalance.toLocaleString()}</Text>
                      </View>
                      {seekerProfile.isStaked && (
                        <View style={styles.seekerRow}>
                          <Text style={styles.seekerKey}>SKR staked</Text>
                          <Text style={styles.seekerVal}>
                            {seekerProfile.stakedAmount.toLocaleString()}
                            {seekerProfile.yieldEarned > 0 && (
                              <Text style={styles.seekerYield}>  (+{seekerProfile.yieldEarned.toFixed(2)})</Text>
                            )}
                          </Text>
                        </View>
                      )}
                    </View>
                  </LinearGradient>
                ) : seekerProfile ? (
                  <View style={styles.seekerCard}>
                    <Text style={styles.seekerLoading}>📱  Not a Seeker device</Text>
                    <Text style={styles.seekerHint}>Connect a Seeker phone for +{SGT_BONUS_ORB} ORB bonus + perks</Text>
                    {installerInfo && (
                      <Text style={styles.seekerHint}>
                        Installer: {installerInfo.installerPackage ?? 'sideloaded'}
                      </Text>
                    )}
                  </View>
                ) : null
              ) : (
                /* No wallet connected, no installer-based grant */
                <View style={styles.seekerCard}>
                  <Text style={styles.seekerLoading}>🔌  Connect wallet to verify Seeker</Text>
                  <Text style={styles.seekerHint}>Tap Wallet → CONNECT WITH MWA</Text>
                  {installerInfo && (
                    <Text style={styles.seekerHint}>
                      Installer: {installerInfo.installerPackage ?? 'sideloaded'}
                    </Text>
                  )}
                </View>
              )}

              {/* ── Quick nav: только то что нет в navbar ── */}
              <View style={styles.profileActions}>
                <TouchableOpacity style={styles.profileActionBtn} onPress={() => setScreen('wallet')}>
                  <Text style={styles.profileActionIcon}>💎</Text>
                  <Text style={styles.profileActionLabel}>Wallet</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileActionBtn} onPress={() => setScreen('news')}>
                  <Text style={styles.profileActionIcon}>📰</Text>
                  <Text style={styles.profileActionLabel}>News</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileActionBtn} onPress={() => setScreen('skora')}>
                  <Text style={styles.profileActionIcon}>💠</Text>
                  <Text style={styles.profileActionLabel}>SKORA</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.profileActionBtn} onPress={() => setScreen('earn')}>
                  <Text style={styles.profileActionIcon}>🪙</Text>
                  <Text style={styles.profileActionLabel}>Earn</Text>
                </TouchableOpacity>
              </View>

              {/* ── Send ORB to other players ── */}
              <View style={styles.profileSection}>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => setShowSendOrbModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingIcon}>📤</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingLabel}>{t('p2p.sendOrb')}</Text>
                      <Text style={styles.settingSub}>{t('p2p.sendOrbSub')}</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, color: '#22C55E' }}>›</Text>
                </TouchableOpacity>
              </View>

              {/* ── Username Color (Diamond only) ── */}
              {founderTier === 'diamond' && (
                <View style={styles.profileSection}>
                  <TouchableOpacity
                    style={styles.settingRow}
                    onPress={() => setShowColorPicker(true)}
                    activeOpacity={0.7}
                  >
                    <View style={styles.settingLeft}>
                      <Text style={styles.settingIcon}>🎨</Text>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.settingLabel}>{t('color.profileLabel')}</Text>
                        <Text style={styles.settingSub}>{t('color.profileSub')}</Text>
                      </View>
                    </View>
                    <View style={[styles.colorPreview, { backgroundColor: usernameColor }]} />
                  </TouchableOpacity>
                </View>
              )}

              {/* ── Privacy Policy ── */}
              <View style={styles.profileSection}>
                <TouchableOpacity
                  style={styles.settingRow}
                  onPress={() => setShowPrivacyModal(true)}
                  activeOpacity={0.7}
                >
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingIcon}>📋</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingLabel}>Privacy Policy</Text>
                      <Text style={styles.settingSub}>Read our terms & data practices</Text>
                    </View>
                  </View>
                  <Text style={{ fontSize: 16, color: '#7C3AED' }}>›</Text>
                </TouchableOpacity>
              </View>

              {/* ── Achievements ── */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>
                  🏅 {t('profile.achievements')}  ·  {claimedAch.size}/{ACHIEVEMENTS.length}
                </Text>
                <View style={styles.profileBadges}>
                  {ACHIEVEMENTS.map(a => {
                    const claimed = claimedAch.has(a.id);
                    return (
                      <View key={a.id} style={[styles.profileBadge, !claimed && styles.profileBadgeLocked]}>
                        <Text style={[styles.profileBadgeIcon, !claimed && { opacity: 0.35 }]}>{a.icon}</Text>
                        <Text style={[styles.profileBadgeLabel, !claimed && { color: '#334155' }]}>{t(a.labelKey)}</Text>
                        {!claimed && (
                          <Text style={{ color: '#475569', fontSize: 10, fontWeight: '700', letterSpacing: 0.5, marginTop: 4 }}>
                            +{a.orb >= 1000 ? `${a.orb / 1000}K` : a.orb} ORB{a.tickets > 0 ? `  +${a.tickets}🎫` : ''}
                          </Text>
                        )}
                        {claimed && <Text style={styles.profileBadgeCheck}>✓</Text>}
                      </View>
                    );
                  })}
                </View>
              </View>

              {/* ── Характеристики ── */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>📊 {t('profile.stats')}</Text>
                <StatRow icon="⚡" label={t('stats.signalPower')}  value={`${TAP_VALUES[upgrades.signalPower]} ORB/tap`}           color="#A855F7" />
                <StatRow icon="🎯" label={t('stats.critChance')}   value={`${Math.round(CRIT_CHANCES[upgrades.critChance]*100)}%`} color="#FACC15" />
                <StatRow icon="🎡" label={t('stats.wheelLuck')}    value={UPGRADE_DEFS.wheelLuck.valueLabels[upgrades.wheelLuck]}  color="#06B6D4" />
                <StatRow icon="🐎" label={t('stats.horsePower')}   value={`+${HORSE_POWERS[upgrades.horsePower]}/tap`}             color="#FB923C" />
                <StatRow icon="🎫" label={t('stats.tickets')}      value={tickets.toString()}                                      color="#22C55E" />
                <StatRow icon="⚡" label={t('stats.energy')}       value={`${energy}/${MAX_ENERGY}`}                               color="#EF4444" />
              </View>

              {/* ── Settings ── */}
              <View style={styles.profileSection}>
                <Text style={styles.profileSectionTitle}>⚙️ {t('profile.settings')}</Text>

                {/* Language picker */}
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingIcon}>🌐</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingLabel}>{t('lang.choose')}</Text>
                      <Text style={styles.settingSub}>
                        {LANGUAGES.find(l => l.code === _lang)?.native ?? 'English'}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -4, marginBottom: 8 }}>
                  {LANGUAGES.map(L => (
                    <TouchableOpacity
                      key={L.code}
                      onPress={() => setLang(L.code)}
                      activeOpacity={0.75}
                      style={{
                        paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12,
                        backgroundColor: _lang === L.code ? 'rgba(124,58,237,0.35)' : 'rgba(124,58,237,0.08)',
                        borderWidth: 1, borderColor: _lang === L.code ? '#7C3AED' : 'rgba(124,58,237,0.2)',
                        flexDirection: 'row', alignItems: 'center', gap: 6,
                      }}
                    >
                      <Text style={{ fontSize: 16 }}>{L.flag}</Text>
                      <Text style={{ color: _lang === L.code ? '#FFF' : '#94A3B8', fontSize: 11, fontWeight: '800' }}>
                        {L.native}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>

                {/* Theme picker (NFT tiers — preview before NFT integration) */}
                <View style={styles.settingRow}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingIcon}>🎨</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingLabel}>NFT Theme</Text>
                      <Text style={styles.settingSub}>{theme.name}</Text>
                    </View>
                  </View>
                </View>
                <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: -4, marginBottom: 8 }}>
                  {THEME_ORDER.map(tid => {
                    const T = NFT_THEMES[tid];
                    const active = theme.id === tid;
                    return (
                      <TouchableOpacity
                        key={tid}
                        onPress={() => setActiveTheme(tid)}
                        activeOpacity={0.75}
                        style={{
                          paddingHorizontal: 10, paddingVertical: 7, borderRadius: 12,
                          backgroundColor: active ? `${T.primary}40` : `${T.primary}12`,
                          borderWidth: 1.5, borderColor: active ? T.primary : `${T.primary}33`,
                          flexDirection: 'row', alignItems: 'center', gap: 6,
                        }}
                      >
                        <Text style={{ fontSize: 14 }}>{T.orbEmoji}</Text>
                        <Text style={{ color: active ? '#FFF' : T.primary, fontSize: 10, fontWeight: '900', letterSpacing: 1 }}>
                          {T.name.toUpperCase()}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Sound toggle */}
                <TouchableOpacity style={styles.settingRow} onPress={toggleSound} activeOpacity={0.7}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingIcon}>{soundEnabled ? '🔊' : '🔇'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingLabel}>{t('profile.sound')}</Text>
                      <Text style={styles.settingSub}>{t('profile.soundDesc')}</Text>
                    </View>
                  </View>
                  <View style={[styles.toggleTrack, soundEnabled && styles.toggleTrackOn]}>
                    <View style={[styles.toggleKnob, soundEnabled && styles.toggleKnobOn]} />
                  </View>
                </TouchableOpacity>

                {/* Notifications toggle */}
                <TouchableOpacity style={styles.settingRow} onPress={toggleNotifications} activeOpacity={0.7}>
                  <View style={styles.settingLeft}>
                    <Text style={styles.settingIcon}>{notificationsEnabled ? '🔔' : '🔕'}</Text>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.settingLabel}>{t('profile.notif')}</Text>
                      <Text style={styles.settingSub}>{t('profile.notifDesc')}</Text>
                    </View>
                  </View>
                  <View style={[styles.toggleTrack, notificationsEnabled && styles.toggleTrackOn]}>
                    <View style={[styles.toggleKnob, notificationsEnabled && styles.toggleKnobOn]} />
                  </View>
                </TouchableOpacity>

                {notificationsEnabled && (
                  <TouchableOpacity
                    style={styles.settingTestBtn}
                    onPress={() => sendTestNotification()}
                    activeOpacity={0.75}
                  >
                    <Text style={styles.settingTestBtnText}>{t('profile.notifTest')}</Text>
                  </TouchableOpacity>
                )}

                {/* Divider */}
                <View style={{ height: 1, backgroundColor: 'rgba(124,58,237,0.2)', marginVertical: 8 }} />

                {/* Поддержать проект */}
                <TouchableOpacity
                  activeOpacity={0.85}
                  onPress={() => setShowDonateModal(true)}
                  style={{ marginTop: 20, borderRadius: 16, overflow: 'hidden' }}
                >
                  <LinearGradient
                    colors={['#7C3AED', '#EC4899']}
                    start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}
                    style={{ paddingVertical: 14, paddingHorizontal: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10 }}
                  >
                    <Text style={{ fontSize: 20 }}>💜</Text>
                    <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 }}>{t('donate.btn')}</Text>
                  </LinearGradient>
                </TouchableOpacity>

                {/* Версия */}
                <View style={{ marginTop: 16, alignItems: 'center' }}>
                  <Text style={{ color: '#14F195', fontSize: 11, fontWeight: '900', letterSpacing: 1 }}>
                    {VERSION_FULL}
                  </Text>
                  <Text style={{ color: '#475569', fontSize: 9, marginTop: 3, letterSpacing: 1 }}>
                    SEEKER QUEST LEAGUE
                  </Text>
                </View>
              </View>

            </View>
          )}

        </ScrollView>

        {/* Navbar */}
        <View style={[styles.navbar, { paddingBottom: Math.max(insets.bottom, 6) }]}>
          {([
            { id: 'home',       icon: '🏠',  label: t('nav.home')  },
            { id: 'games',      icon: '🎮',  label: t('nav.games') },
            { id: 'shop',       icon: '🛍',  label: t('nav.shop')  },
            { id: 'tournament', icon: '🏆',  label: t('nav.cup')   },
            { id: 'profile',    icon: '👤',  label: t('nav.me')    },
          ] as { id: Screen; icon: string; label: string }[]).map(({ id, icon, label }) => {
            const active = screen === id ||
              (id === 'games'      && ['runner','arena','treasure','horse','wheel','lands','pvp','labyrinth'].includes(screen)) ||
              (id === 'profile'    && ['wallet'].includes(screen)) ||
              (id === 'shop'       && ['earn','skora'].includes(screen)) ||
              (id === 'tournament' && screen === 'leaderboard') ||
              (id === 'home'       && screen === 'news');
            return (
              <TouchableOpacity key={id} style={styles.navItem} onPress={() => {
                setScreen(id);
                if (id === 'profile') fetchLeaderboard();
              }}>
                {active && (
                  <LinearGradient
                    colors={['rgba(124,58,237,0.35)','rgba(236,72,153,0.18)']}
                    style={styles.navActivePill}
                  />
                )}
                <Text style={[styles.navIcon, active && styles.navIconActive]}>{icon}</Text>
                <Text style={[styles.navText, active && styles.navActive]}>{label}</Text>
                {active && <View style={styles.navDot} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* ═══ FULLSCREEN GAMES (поверх всего) ═══ */}
        {/* Universal back overlay for fullscreen games */}
        {(screen === 'runner' || screen === 'horse') && (
          <TouchableOpacity
            onPress={() => setScreen('games')}
            activeOpacity={0.7}
            style={[styles.fullscreenBackBtn, { top: insets.top + 12 }]}
          >
            <Text style={styles.fullscreenBackArrow}>‹</Text>
          </TouchableOpacity>
        )}

        {screen === 'runner' && (
          <View style={styles.fullscreenGame}>
            <SpaceRunner
              onExit={() => setScreen('games')}
              orb={orb}
              onEarnOrb={(n) => {
                const next = orb + n;
                setOrb(next);
                syncScore(next, level, streakCount);
                if (n >= 200) winRef.current?.show(n);
              }}
              onSpendOrb={(n) => {
                const next = Math.max(0, orb - n);
                setOrb(next);
                syncScore(next, level, streakCount);
              }}
              onAddScore={addTournamentScore}
              onPaySol={async (lamports, sol) => {
                if (!deviceIdRef.current) throw new Error('No device ID');
                await paySolToTreasury(
                  deviceIdRef.current, lamports, sol, 'runner_continue',
                  solStatusLabel(`${sol} SOL`),
                );
              }}
              onPlaySound={(snd) => {
                if      (snd === 'tap')     playSound(sndTap.current);
                else if (snd === 'crit')    playSound(sndCrit.current);
                else if (snd === 'jackpot') playSound(sndJackpot.current);
                else if (snd === 'levelup') playSound(sndLevelUp.current);
                else if (snd === 'dead')    playSound(sndDead.current);
              }}
            />
          </View>
        )}

        {/* ═══ HORSE RACE FULLSCREEN ═══ */}
        {screen === 'horse' && (
          <View style={styles.fullscreenGame}>
            <HorseRace
              orb={orb}
              horsePower={HORSE_POWERS[upgrades.horsePower]}
              onEarnOrb={(n) => { const next = orb + n; setOrb(next); syncScore(next, level, streakCount); winRef.current?.show(n); }}
              onEarnTickets={(n) => setTickets(t => t + n)}
              onBack={() => setScreen('games')}
            />
          </View>
        )}

        {/* ═══ ABYSS LABYRINTH FULLSCREEN (real 3D) ═══ */}
        {screen === 'labyrinth' && (
          <View style={styles.fullscreenGame}>
            <LabyrinthOfAbyss
              energy={energy}
              onSpendEnergy={(n) => {
                setEnergy(prev => {
                  const next = Math.max(0, prev - n);
                  AsyncStorage.setItem('sk_energy', next.toString()).catch(() => {});
                  return next;
                });
              }}
              onEarnOrb={(n) => {
                // Functional update: a barrel blast can grant several rewards
                // within one frame — a closure over `orb` would drop them.
                setOrb(prev => {
                  const next = prev + n;
                  scheduleSyncScore(next, level, streakCount);
                  return next;
                });
              }}
              onAddScore={addTournamentScore}
              onPlaySound={(snd) => {
                if      (snd === 'tap')     playSound(sndTap.current);
                else if (snd === 'crit')    playSound(sndCrit.current);
                else if (snd === 'jackpot') playSound(sndJackpot.current);
                else if (snd === 'levelup') playSound(sndLevelUp.current);
                else if (snd === 'dead')    playSound(sndDead.current);
              }}
              onExit={() => setScreen('games')}
            />
          </View>
        )}

      </Animated.View>

      {/* ═══ WIN CELEBRATION (global overlay) ═══ */}
      <WinCelebration ref={winRef} />

      {/* ═══ AD VIEWER (bottom sheet) ═══ */}
      {activeAdCampaign && (
        <AdViewer
          campaign={activeAdCampaign}
          deviceId={deviceIdRef.current}
          onClose={() => setActiveAdCampaign(null)}
          onReward={(amount) => {
            const next = orb + amount;
            setOrb(next);
            syncScore(next, level, streakCount);
            winRef.current?.show(amount, 'AD REWARD');
          }}
        />
      )}

      {/* ═══ LANGUAGE SELECTOR (first launch) ═══ */}
      {!langPicked && (
        <View style={styles.onboardingOverlay}>
          <LanguageSelector onDone={async () => {
            await AsyncStorage.setItem('@seeker_lang_picked', '1');
            setLangPicked(true);
          }} />
        </View>
      )}

      {/* ═══ ONBOARDING (first launch) ═══ */}
      {langPicked && !onboarded && (
        <View style={styles.onboardingOverlay}>
          <Onboarding onDone={async (name) => {
            await AsyncStorage.setItem('@seeker_onboarded', '1');
            setOnboarded(true);
            if (name) {
              setUsername(name);
              setPendingUsername(name);
              try {
                await supabase.from('players').update({ username: name })
                  .eq('device_id', deviceIdRef.current);
              } catch (_) {}
            }
            // Prompt for notifications right after onboarding — the moment the
            // player is most engaged. Big retention lever for a tap game.
            // (Only prompt if not already granted.)
            const has = await hasNotificationPermission();
            if (!has) {
              setTimeout(() => { enableNotifications().catch(() => {}); }, 600);
            } else {
              setNotificationsEnabled(true);
            }
          }} />
        </View>
      )}

    </SafeAreaView>
  );
}  // end AppInner

// ─── presentational components ────────────────────────────────────────────────

function HomeQuestRow({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(value / max, 1);
  return (
    <View style={hqs.row}>
      <Text style={hqs.label}>{label}</Text>
      <View style={hqs.track}>
        <View style={[hqs.fill, { width: `${pct * 100}%` as any, backgroundColor: color }]} />
      </View>
      <Text style={[hqs.count, { color }]}>{value}/{max}</Text>
    </View>
  );
}
const hqs = StyleSheet.create({
  row:   { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  label: { color: '#94A3B8', fontSize: 12, fontWeight: '700', width: 52 },
  track: { flex: 1, height: 6, backgroundColor: 'rgba(148,163,184,0.22)', borderRadius: 999, overflow: 'hidden', marginHorizontal: 10 },
  fill:  { height: '100%', borderRadius: 999 },
  count: { fontSize: 11, fontWeight: '800', width: 38, textAlign: 'right' },
});

function LeaderRow({ rank, name, orb, gold, highlight }: {
  rank: number; name: string; orb: number; gold?: boolean; highlight?: boolean;
}) {
  return (
    <View style={[styles.leaderRow, highlight && styles.leaderRowHighlight]}>
      <Text style={[styles.leaderRank, gold && styles.leaderRankGold]}>#{rank}</Text>
      <Text style={[styles.leaderName, gold && styles.leaderNameGold]}>{name}</Text>
      <Text style={styles.leaderOrb}>{orb.toLocaleString()} ORB</Text>
    </View>
  );
}

function StatRow({ icon, label, value, color }: { icon: string; label: string; value: string; color: string }) {
  return (
    <View style={styles.statRow}>
      <Text style={styles.statRowIcon}>{icon}</Text>
      <Text style={styles.statRowLabel}>{label}</Text>
      <Text style={[styles.statRowValue, { color }]}>{value}</Text>
    </View>
  );
}

function SeasonBlock({ value, label }: { value: number; label: string }) {
  return (
    <View style={styles.seasonBlock}>
      <Text style={styles.seasonBlockNum}>{String(value).padStart(2, '0')}</Text>
      <Text style={styles.seasonBlockLabel}>{label}</Text>
    </View>
  );
}

function PrizeTier({ rank, reward, color }: { rank: string; reward: string; color: string }) {
  return (
    <View style={[styles.prizeTier, { borderLeftColor: color }]}>
      <Text style={[styles.prizeTierRank, { color }]}>{rank}</Text>
      <Text style={styles.prizeTierReward}>{reward}</Text>
    </View>
  );
}

// ─── styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container:    { flex: 1, backgroundColor: '#020510', paddingTop: 32 },
  appShake:      { flex: 1 },
  fullscreenGame:    { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 200 },
  fullscreenBackBtn: { position: 'absolute', left: 12, zIndex: 250,
                       width: 44, height: 44, borderRadius: 22,
                       backgroundColor: 'rgba(15,23,42,0.88)',
                       borderWidth: 1.5, borderColor: 'rgba(124,58,237,0.5)',
                       alignItems: 'center', justifyContent: 'center',
                       shadowColor: '#7C3AED', shadowRadius: 10, shadowOpacity: 0.5, elevation: 6 },
  fullscreenBackArrow: { color: '#C084FC', fontSize: 32, fontWeight: '300', lineHeight: 34, marginLeft: -2 },
  onboardingOverlay: { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 100 },
  flashOverlay:  { position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: '#FACC15', zIndex: 999 },

  header:   { alignItems: 'center', paddingHorizontal: 20, paddingBottom: 16, paddingTop: 4 },
  logo:     { fontSize: 48, marginBottom: 6 },
  title:    { color: '#C084FC', fontSize: 22, fontWeight: '900', textAlign: 'center', letterSpacing: 4 },
  subtitle: { color: '#334155', fontSize: 11, marginTop: 6, letterSpacing: 3, fontWeight: '700' },

  // Compact header (non-home screens)
  compactHeader:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingHorizontal: 20, paddingVertical: 8, marginBottom: 6 },
  compactBalance:   { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
  compactBackRow:   { flexDirection: 'row', alignItems: 'center', gap: 4 },
  compactBackArrow: { color: '#7C3AED', fontSize: 32, fontWeight: '300', lineHeight: 34, marginRight: 2 },
  compactBalanceNum:{ color: '#FACC15', fontSize: 20, fontWeight: '900', letterSpacing: 1 },
  compactBalanceLbl:{ color: '#6D28D9', fontSize: 10, fontWeight: '900', letterSpacing: 2 },
  compactChipRow:   { flexDirection: 'row', gap: 6 },
  compactChip:      { backgroundColor: 'rgba(124,58,237,0.15)', borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)',
                      paddingHorizontal: 10, paddingVertical: 4, borderRadius: 14 },
  compactChipTxt:   { color: '#C084FC', fontSize: 11, fontWeight: '800' },

  // Version chip — bottom-left, subtle (no longer overlaps top balances)
  versionChip: {
    position: 'absolute', bottom: 74, left: 10,
    backgroundColor: 'rgba(20,241,149,0.08)',
    borderWidth: 1, borderColor: 'rgba(20,241,149,0.22)',
    paddingHorizontal: 7, paddingVertical: 2,
    borderRadius: 8,
    opacity: 0.7,
    zIndex: 200,
  },
  versionChipTxt: {
    color: '#14F195', fontSize: 8, fontWeight: '900', letterSpacing: 1,
  },

  // Shop Hub grid
  shopHubGrid:      { flexDirection: 'row', gap: 8, marginBottom: 4 },
  shopHubCard:      { flex: 1, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(99,60,200,0.25)' },
  shopHubCardGrad:  { padding: 12, gap: 4, minHeight: 92 },
  shopHubIcon:      { fontSize: 24 },
  shopHubName:      { fontSize: 13, fontWeight: '900', letterSpacing: 1.5, marginTop: 2 },
  shopHubDesc:      { color: '#94A3B8', fontSize: 10, lineHeight: 14 },
  shopSectionTitle: { color: '#A855F7', fontSize: 12, fontWeight: '900', letterSpacing: 2, marginTop: 14, marginBottom: 4 },
  shopSectionHint:  { color: '#475569', fontSize: 10, textAlign: 'center', marginTop: 6, marginBottom: 8,
                      fontWeight: '600', letterSpacing: 0.5, fontStyle: 'italic' },

  // ── Premium Shop (SOL-priced) ─────────────────────────────────────────────
  premiumGrid:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 6 },
  premiumCard:      { width: (SCREEN_W - 40 - 8) / 2 },
  premiumCardGrad:  { padding: 12, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', gap: 6, minHeight: 168 },
  premiumIconWrap:  { width: 44, height: 44, borderRadius: 22, borderWidth: 1.5,
                      alignItems: 'center', justifyContent: 'center' },
  premiumIcon:      { fontSize: 22 },
  premiumName:      { fontSize: 12, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  premiumDesc:      { color: '#94A3B8', fontSize: 10, textAlign: 'center', lineHeight: 14, minHeight: 28 },
  premiumPriceTag:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
                      backgroundColor: 'rgba(0,0,0,0.45)', marginTop: 'auto' },
  premiumPriceTxt:  { fontSize: 11, fontWeight: '900', letterSpacing: 1 },
  premiumTierBadge: { position: 'absolute', top: 6, right: 6, paddingHorizontal: 6, paddingVertical: 2,
                      borderRadius: 5, borderWidth: 1, zIndex: 5 },
  premiumTierTxt:   { fontSize: 8, fontWeight: '900', letterSpacing: 1 },

  // ── Founder Pass cards ────────────────────────────────────────────────────
  founderGrid:      { flexDirection: 'row', gap: 8, marginTop: 6 },
  founderCard:      { flex: 1 },
  founderCardGrad:  { padding: 12, borderRadius: 16, borderWidth: 1.5, alignItems: 'center', gap: 4, minHeight: 200 },
  founderIconWrap:  { width: 46, height: 46, borderRadius: 23, borderWidth: 1.5,
                      alignItems: 'center', justifyContent: 'center', marginBottom: 4 },
  founderIcon:      { fontSize: 24 },
  founderName:      { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  founderMul:       { color: '#FACC15', fontSize: 18, fontWeight: '900', marginTop: 2 },
  founderPerk:      { color: '#94A3B8', fontSize: 9, textAlign: 'center', lineHeight: 12 },
  founderPriceTag:  { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1,
                      marginTop: 'auto' },
  founderPriceTxt:  { fontSize: 11, fontWeight: '900', letterSpacing: 1 },

  founderMaxedCard: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 14,
                      borderRadius: 16, marginTop: 6,
                      backgroundColor: 'rgba(34,211,238,0.10)',
                      borderWidth: 1.5, borderColor: '#22D3EE' },
  founderMaxedIcon: { fontSize: 32 },
  founderMaxedTitle:{ color: '#22D3EE', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  founderMaxedSub:  { color: '#67E8F9', fontSize: 10, marginTop: 3, fontWeight: '600' },

  // ── Send ORB Modal ────────────────────────────────────────────────────────
  sendOrbModal:        { backgroundColor: '#0A0A12', borderRadius: 22, padding: 22, margin: 18,
                         width: '88%', maxWidth: 420, maxHeight: '88%',
                         borderWidth: 1.5, borderColor: 'rgba(34,197,94,0.4)' },

  // Referrals — profile card
  refCard:             { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 16,
                         padding: 16, borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)' },
  refCardIcon:         { fontSize: 26 },
  refCardTitle:        { color: '#F1F5F9', fontSize: 14, fontWeight: '900' },
  refCardSub:          { color: '#A78BFA', fontSize: 11, fontWeight: '700', marginTop: 2 },
  refCardCta:          { backgroundColor: 'rgba(168,85,247,0.2)', borderRadius: 12,
                         paddingHorizontal: 12, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(168,85,247,0.5)' },
  refCardCtaTxt:       { color: '#E9D5FF', fontSize: 12, fontWeight: '900' },
  // Referrals — modal
  refModal:            { backgroundColor: '#0A0A12', borderRadius: 22, padding: 22, margin: 18,
                         width: '88%', maxWidth: 420,
                         borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.45)' },
  refModalSub:         { color: '#A78BFA', fontSize: 12, fontWeight: '700', marginTop: 2, marginBottom: 8 },
  refCodeBox:          { backgroundColor: '#060F1E', borderRadius: 12, borderWidth: 1, borderColor: 'rgba(168,85,247,0.4)',
                         paddingVertical: 16, alignItems: 'center', marginBottom: 10 },
  refCodeTxt:          { color: '#FACC15', fontSize: 28, fontWeight: '900', letterSpacing: 6 },
  refShareBtn:         { borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  refShareTxt:         { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  refStatRow:          { alignItems: 'center', paddingVertical: 14 },
  refStatTxt:          { color: '#94A3B8', fontSize: 13, fontWeight: '700' },
  refClaimedNote:      { color: '#22C55E', fontSize: 12, fontWeight: '800', textAlign: 'center',
                         marginTop: 6, paddingVertical: 10 },
  refApplyBtn:         { borderRadius: 14, paddingVertical: 14, alignItems: 'center', marginTop: 10 },
  refApplyTxt:         { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  sendOrbHeader:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  sendOrbTitle:        { color: '#22C55E', fontSize: 18, fontWeight: '900', letterSpacing: 3 },
  sendOrbClose:        { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  sendOrbBalance:      { color: '#94A3B8', fontSize: 12, fontWeight: '700', marginBottom: 16 },
  sendOrbLabel:        { color: '#475569', fontSize: 10, letterSpacing: 2, fontWeight: '900',
                         marginTop: 10, marginBottom: 6 },
  sendOrbInput:        { backgroundColor: '#060F1E', borderRadius: 12, borderWidth: 1, borderColor: '#1E293B',
                         color: '#E2E8F0', fontSize: 14, paddingHorizontal: 14, paddingVertical: 12 },
  sendOrbChips:        { flexDirection: 'row', gap: 6, marginTop: 8, marginBottom: 6 },
  sendOrbChip:         { flex: 1, paddingVertical: 8, borderRadius: 10, alignItems: 'center',
                         backgroundColor: '#0F172A', borderWidth: 1, borderColor: '#1E293B' },
  sendOrbChipDisabled: { opacity: 0.35 },
  sendOrbChipTxt:      { color: '#94A3B8', fontSize: 12, fontWeight: '800' },
  sendOrbPreview:      { marginTop: 14, padding: 12, backgroundColor: 'rgba(0,0,0,0.35)', borderRadius: 12,
                         borderWidth: 1, borderColor: 'rgba(34,197,94,0.25)', gap: 7 },
  sendOrbPreviewRow:   { flexDirection: 'row', justifyContent: 'space-between' },
  sendOrbPreviewKey:   { color: '#94A3B8', fontSize: 11 },
  sendOrbPreviewVal:   { color: '#E2E8F0', fontSize: 12, fontWeight: '800' },
  sendOrbBtn:          { paddingVertical: 14, alignItems: 'center', borderRadius: 14, marginTop: 16 },
  sendOrbBtnText:      { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  sendOrbHint:         { color: '#475569', fontSize: 10, textAlign: 'center', marginTop: 12, fontWeight: '600' },

  // ── Color picker (Diamond exclusive) ──────────────────────────────────────
  colorPickerModal:    { backgroundColor: '#0A0A12', borderRadius: 22, padding: 22, margin: 18,
                         width: '88%', maxWidth: 420,
                         borderWidth: 1.5, borderColor: 'rgba(34,211,238,0.4)' },
  colorPickerHeader:   { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  colorPickerTitle:    { color: '#22D3EE', fontSize: 16, fontWeight: '900', letterSpacing: 3 },
  colorPickerSub:      { color: '#94A3B8', fontSize: 11, marginTop: 6, marginBottom: 14, fontWeight: '600' },
  colorPickerPreview:  { backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 14, paddingVertical: 16,
                         alignItems: 'center', marginBottom: 18,
                         borderWidth: 1, borderColor: 'rgba(34,211,238,0.25)' },
  colorPickerPreviewName: { fontSize: 22, fontWeight: '900', letterSpacing: 1 },
  colorGrid:           { flexDirection: 'row', flexWrap: 'wrap', gap: 12, justifyContent: 'center' },
  colorSwatch:         { width: 56, height: 56, borderRadius: 28,
                         borderWidth: 2, borderColor: 'transparent',
                         alignItems: 'center', justifyContent: 'center' },
  colorSwatchSelected: { borderColor: '#FFF',
                         shadowColor: '#FFF', shadowRadius: 8, shadowOpacity: 0.6, elevation: 6 },
  colorSwatchCheck:    { color: '#000', fontSize: 22, fontWeight: '900' },
  colorPickerDone:     { paddingVertical: 14, alignItems: 'center', borderRadius: 14 },
  colorPickerDoneTxt:  { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  colorPreview:        { width: 24, height: 24, borderRadius: 12,
                         borderWidth: 1.5, borderColor: '#1E293B' },

  // ── Transfer history (inside Send ORB modal) ──────────────────────────────
  transferHistory:     { marginTop: 18, paddingTop: 14, borderTopWidth: 1, borderTopColor: 'rgba(34,197,94,0.15)' },
  transferHistoryTitle:{ color: '#475569', fontSize: 10, letterSpacing: 2, fontWeight: '900', marginBottom: 10 },
  transferRow:         { flexDirection: 'row', alignItems: 'center', gap: 10,
                         paddingVertical: 8, paddingHorizontal: 4,
                         borderBottomWidth: 1, borderBottomColor: 'rgba(30,41,59,0.5)' },
  transferIcon:        { fontSize: 20, width: 28, textAlign: 'center' },
  transferOther:       { color: '#E2E8F0', fontSize: 12, fontWeight: '700' },
  transferTime:        { color: '#475569', fontSize: 10, marginTop: 2 },
  transferAmount:      { fontSize: 13, fontWeight: '900' },
  content:  { flex: 1, paddingHorizontal: 20 },

  // streak banner (home screen)
  streakBanner:      { flexDirection: 'row', alignItems: 'center', borderRadius: 20, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: 'rgba(250,204,21,0.3)' },
  streakBannerFire:  { fontSize: 28, marginRight: 12 },
  streakBannerCount: { color: '#FACC15', fontSize: 16, fontWeight: '900' },
  streakBannerSub:   { color: '#64748B', fontSize: 11, marginTop: 2 },
  streakBannerDot:   { backgroundColor: '#FACC15', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  streakBannerDotText: { color: '#000', fontSize: 10, fontWeight: '900' },

  // streak modal
  modalBackdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.85)', alignItems: 'center', justifyContent: 'center', padding: 24 },
  streakModal:   { width: '100%', backgroundColor: '#080D1E', borderRadius: 32, padding: 28, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(250,204,21,0.35)', overflow: 'hidden' },
  streakGlowRing:{ position: 'absolute', top: -80, left: -80, right: -80, height: 300 },
  streakModalLabel: { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 4, marginBottom: 16 },
  streakBigNum:  { fontSize: 72, fontWeight: '900', color: '#FACC15' },
  streakDaysLabel: { color: '#94A3B8', fontSize: 14, fontWeight: '700', letterSpacing: 2, marginBottom: 24 },

  streakTrack:   { flexDirection: 'row', gap: 6, marginBottom: 24 },
  streakDay:     { alignItems: 'center', width: 36, paddingVertical: 8, borderRadius: 12, backgroundColor: 'rgba(255,255,255,0.04)' },
  streakDayToday:{ backgroundColor: 'rgba(250,204,21,0.15)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.5)' },
  streakDayIcon: { fontSize: 16 },
  streakDayNum:  { color: '#475569', fontSize: 10, fontWeight: '800', marginTop: 4 },

  streakRewardBox:   { backgroundColor: 'rgba(250,204,21,0.08)', borderRadius: 16, padding: 16, alignItems: 'center', width: '100%', marginBottom: 20, borderWidth: 1, borderColor: 'rgba(250,204,21,0.2)' },
  streakRewardLabel: { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 2 },
  streakRewardValue: { color: '#FACC15', fontSize: 22, fontWeight: '900', marginTop: 6 },
  streakClaimBtn:    { padding: 18, borderRadius: 20, alignItems: 'center' },
  streakClaimText:   { color: '#000', fontSize: 16, fontWeight: '900', letterSpacing: 1 },

  // privacy policy modal
  privacyModalContent: { width: '90%', maxHeight: '85%', backgroundColor: '#080D1E', borderRadius: 28, padding: 0, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(124,58,237,0.3)' },
  privacyScroll:    { paddingHorizontal: 20, paddingVertical: 20 },
  privacyCloseBtn:  { position: 'absolute', top: 14, right: 14, zIndex: 10, padding: 4 },
  privacyHeader:    { alignItems: 'center', paddingBottom: 16, marginBottom: 16, borderBottomWidth: 1, borderBottomColor: 'rgba(124,58,237,0.2)' },
  privacyTitle:     { fontSize: 16, fontWeight: '900', color: '#C084FC', letterSpacing: 3, marginBottom: 4 },
  privacyMeta:      { fontSize: 12, color: '#64748B', fontWeight: '600', letterSpacing: 1 },
  privacyPara:      { color: '#CBD5E1', fontSize: 13, lineHeight: 20, marginBottom: 14 },
  privacyH2:        { fontSize: 12, fontWeight: '900', color: '#A855F7', letterSpacing: 2, marginTop: 18, marginBottom: 10, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: 'rgba(168,85,247,0.2)' },
  privacyH3:        { fontSize: 12, fontWeight: '700', color: '#C084FC', marginTop: 12, marginBottom: 8 },
  privacyBullet:    { color: '#CBD5E1', fontSize: 12, lineHeight: 19, marginBottom: 8, paddingLeft: 8 },
  privacyNote:      { fontSize: 11, color: '#64748B', fontStyle: 'italic', marginTop: 16, paddingTop: 12, borderTopWidth: 1, borderTopColor: 'rgba(124,58,237,0.15)' },

  // balance card
  balanceCard: { borderRadius: 28, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(139,92,246,0.5)', overflow: 'hidden' },
  label:       { color: '#6D28D9', fontSize: 10, fontWeight: '800', letterSpacing: 4, marginBottom: 10 },
  balance:     { color: '#FFFFFF', fontSize: 36, fontWeight: '900' },
  balanceRow:  { flexDirection: 'row', marginTop: 12, gap: 10 },
  statChip:    { color: '#A78BFA', fontSize: 13, fontWeight: '700', backgroundColor: 'rgba(109,40,217,0.25)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 999, borderWidth: 1, borderColor: 'rgba(139,92,246,0.35)' },
  statLabel:   { color: '#64748B', fontSize: 13, marginTop: 10 },
  xpBar:       { width: '100%', height: 8, backgroundColor: 'rgba(30,16,64,0.9)', borderRadius: 999, overflow: 'hidden', marginTop: 16, borderWidth: 1, borderColor: 'rgba(99,60,200,0.3)' },
  xpFill:      { height: '100%', borderRadius: 999 },
  xpLabel:     { color: '#475569', fontSize: 11, marginTop: 6, letterSpacing: 1 },

  card:     { backgroundColor: 'rgba(8,13,32,0.88)', borderRadius: 24, padding: 20, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(99,60,200,0.35)' },
  cardTitle:{ color: '#A855F7', fontSize: 17, fontWeight: '900', marginBottom: 12, letterSpacing: 2 },
  cardText: { color: '#64748B', fontSize: 14, lineHeight: 22 },

  questRow:       { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(5,9,22,0.7)', borderRadius: 16, padding: 14, marginBottom: 10, borderWidth: 1, borderColor: 'rgba(99,60,200,0.2)' },
  questIcon:      { fontSize: 22, marginRight: 14 },
  questItemTitle: { color: '#E2E8F0', fontSize: 15, fontWeight: '800' },
  questReward:    { color: '#475569', fontSize: 12, marginTop: 3 },

  primaryButton:     { padding: 18, borderRadius: 20, alignItems: 'center', marginBottom: 14 },
  disabledButton:    { opacity: 0.4 },
  primaryButtonText: { color: '#FFFFFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  secondaryButton:   { borderWidth: 1.5, borderColor: 'rgba(139,92,246,0.6)', backgroundColor: 'rgba(88,28,235,0.08)', padding: 16, borderRadius: 20, alignItems: 'center', marginBottom: 14 },
  secondaryButtonText: { color: '#A855F7', fontSize: 13, fontWeight: '800', letterSpacing: 1.5 },

  rewardText:     { color: '#FACC15', textAlign: 'center', marginTop: 8, fontSize: 13, fontWeight: '700' },
  jackpotText:    { color: '#FACC15', fontSize: 26, fontWeight: '900', textAlign: 'center', marginTop: 8 },
  boostRewardText:{ color: '#FB923C', fontSize: 22, fontWeight: '900', textAlign: 'center', marginTop: 8 },

  wheelCircle: { width: 230, height: 230, borderRadius: 115, borderWidth: 2, borderColor: 'rgba(139,92,246,0.8)', backgroundColor: 'rgba(20,10,45,0.95)', alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: 20, shadowColor: '#7C3AED', shadowOffset: {width:0,height:0}, shadowOpacity: 0.9, shadowRadius: 24, elevation: 24 },
  wheelEmoji:  { fontSize: 44 },
  wheelBrand:  { color: '#C084FC', fontSize: 18, fontWeight: '900', marginTop: 6, letterSpacing: 4 },
  wheelMarker: { color: '#FACC15', fontSize: 26, fontWeight: '900', marginTop: 8 },

  // ── Signal Game ───────────────────────────────────────────────────────────
  signalTimer:       { color: '#FACC15', fontSize: 26, fontWeight: '900', textAlign: 'center', marginBottom: 14, letterSpacing: 2 },
  signalScore:       { color: '#F1F5F9', fontSize: 17, textAlign: 'center', marginBottom: 8, fontWeight: '800' },
  signalReward:      { color: '#818CF8', fontSize: 15, textAlign: 'center', fontWeight: '700' },
  boostBackgroundGlow: { position: 'absolute', top:0,left:0,right:0,bottom:0, backgroundColor: '#EA580C', opacity: 0.07, borderRadius: 30 },

  // Signal HUD
  signalHud:         { borderRadius: 18, paddingVertical: 14, paddingHorizontal: 12,
                       flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around',
                       marginHorizontal: 0 },
  signalHudBlock:    { alignItems: 'center', flex: 1 },
  signalHudNum:      { color: '#E2E8F0', fontSize: 26, fontWeight: '900', letterSpacing: 1 },
  signalHudLabel:    { color: '#334155', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  signalHudDivider:  { width: 1, height: 36, backgroundColor: 'rgba(99,60,200,0.3)' },

  // Signal energy
  signalEnergyRow:   { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 4 },
  signalEnergyLabel: { color: '#475569', fontSize: 10, fontWeight: '800', letterSpacing: 1, width: 64 },
  signalEnergyTrack: { flex: 1, height: 8, backgroundColor: '#0F172A', borderRadius: 4, overflow: 'hidden',
                       borderWidth: 1, borderColor: 'rgba(124,58,237,0.25)' },
  signalEnergyFill:  { height: '100%', borderRadius: 4 },
  signalEnergyCount: { color: '#475569', fontSize: 10, fontWeight: '700', width: 40, textAlign: 'right' },

  // Signal combo
  signalComboBadge:  { alignSelf: 'center', backgroundColor: 'rgba(124,58,237,0.2)', borderRadius: 20,
                       paddingHorizontal: 24, paddingVertical: 8, borderWidth: 1, borderColor: '#7C3AED',
                       flexDirection: 'row', gap: 8, alignItems: 'center' },
  signalComboLabel:  { color: '#6D28D9', fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  signalComboMul:    { color: '#A855F7', fontSize: 20, fontWeight: '900' },

  // Signal boost bar
  signalBoostBar:    { borderRadius: 14, paddingVertical: 10, paddingHorizontal: 16, alignItems: 'center' },
  signalBoostText:   { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 1 },

  orbWrapper:     { alignSelf: 'center', alignItems: 'center', justifyContent: 'center', marginVertical: 30 },
  boostRingOuter: { position: 'absolute', width: 250, height: 250, borderRadius: 125, borderWidth: 2.5, borderColor: '#FB923C', backgroundColor: 'transparent' },
  signalOrb:      { width: 220, height: 220, borderRadius: 110, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: 'rgba(192,132,252,0.55)', shadowColor: '#7C3AED', shadowOffset:{width:0,height:0}, shadowOpacity: 1, shadowRadius: 32, elevation: 32 },
  signalOrbBoosted:{ backgroundColor: '#C2410C', borderColor: 'rgba(253,186,116,0.65)', shadowColor: '#FB923C', transform: [{scale:1.08}] },
  signalOrbText:  { color: '#FFFFFF', fontSize: 36, fontWeight: '900', letterSpacing: 6 },

  floatingText: { color: '#22C55E', fontSize: 32, textAlign: 'center', fontWeight: '900', marginTop: 10 },
  levelUpText:  { color: '#38BDF8', fontSize: 20, textAlign: 'center', fontWeight: '900', marginTop: 14, letterSpacing: 1 },
  critText:     { color: '#FACC15', fontSize: 22, textAlign: 'center', fontWeight: '900', marginTop: 14 },
  boostText:    { color: '#F97316', fontSize: 14, textAlign: 'center', marginTop: 14, fontWeight: '900' },
  fireBoost:    { padding: 18, borderRadius: 20, alignItems: 'center', marginBottom: 20 },
  fireBoostText:{ color: '#FFFFFF', fontSize: 18, fontWeight: '900', letterSpacing: 1 },

  raceLabel:  { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 2, marginBottom: 6 },
  raceTrack:  { width:'100%', height: 22, backgroundColor: 'rgba(5,9,22,0.85)', borderRadius: 999, overflow: 'hidden', marginBottom: 16, borderWidth: 1, borderColor: 'rgba(99,60,200,0.3)' },
  playerHorse:{ height: '100%', borderRadius: 999 },
  botHorse:   { height: '100%', borderRadius: 999 },
  horseResult:{ color: '#FACC15', fontSize: 20, textAlign: 'center', fontWeight: '900', marginTop: 16, letterSpacing: 1 },
  adBanner:   { marginTop: 20, backgroundColor: 'rgba(5,9,22,0.6)', padding: 12, borderRadius: 14, borderWidth: 1, borderColor: 'rgba(30,41,59,0.6)' },
  adText:     { color: '#1E293B', textAlign: 'center', fontSize: 11, fontWeight: '700', letterSpacing: 2 },

  leaderRow:          { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, marginBottom: 8, backgroundColor: 'rgba(5,9,22,0.6)' },
  leaderRowHighlight: { backgroundColor: 'rgba(88,28,235,0.2)', borderWidth: 1, borderColor: 'rgba(139,92,246,0.45)' },
  leaderRank:         { color: '#475569', fontSize: 14, fontWeight: '900', width: 32 },
  leaderRankGold:     { color: '#FACC15' },
  leaderName:         { color: '#CBD5E1', fontSize: 14, fontWeight: '700', flex: 1 },
  leaderNameGold:     { color: '#FDE68A' },
  leaderOrb:          { color: '#A855F7', fontSize: 13, fontWeight: '800' },

  // ── Shop ──────────────────────────────────────────────────────────────────
  shopHero:          { borderRadius: 20, paddingVertical: 18, paddingHorizontal: 20,
                       alignItems: 'center', gap: 6, marginBottom: 2 },
  shopHeroTitle:     { color: '#C084FC', fontSize: 20, fontWeight: '900', letterSpacing: 3 },
  shopHeroSub:       { color: '#4C1D95', fontSize: 10, letterSpacing: 1 },
  shopHeader:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18 },
  shopTitle:         { color: '#C084FC', fontSize: 20, fontWeight: '900', letterSpacing: 2 },
  shopOrbBadge:      { backgroundColor: 'rgba(109,40,217,0.3)', paddingHorizontal: 14, paddingVertical: 7,
                       borderRadius: 999, borderWidth: 1, borderColor: 'rgba(139,92,246,0.5)' },
  shopOrbText:       { color: '#FACC15', fontSize: 13, fontWeight: '900' },
  shopCard:          { backgroundColor: '#0B1120', borderRadius: 18, borderWidth: 1,
                       overflow: 'hidden', position: 'relative' },
  shopCardAccent:    { position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: 4 },
  shopCardBody:      { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       paddingHorizontal: 16, paddingTop: 14, paddingBottom: 8, paddingLeft: 22 },
  shopCardLeft:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  shopIconCircle:    { width: 48, height: 48, borderRadius: 24, borderWidth: 1,
                       alignItems: 'center', justifyContent: 'center' },
  shopCardIcon:      { fontSize: 24 },
  shopCardName:      { fontSize: 14, fontWeight: '900', letterSpacing: 0.5 },
  shopCardDesc:      { color: '#334155', fontSize: 11, marginTop: 2 },
  shopLvBadge:       { borderRadius: 12, paddingHorizontal: 10, paddingVertical: 6,
                       borderWidth: 1, flexDirection: 'row', alignItems: 'baseline', gap: 1 },
  shopLvNum:         { fontSize: 16, fontWeight: '900' },
  shopLvMax:         { color: '#334155', fontSize: 10, fontWeight: '700' },
  shopProgressTrack: { marginHorizontal: 22, height: 5, backgroundColor: '#1E293B',
                       borderRadius: 3, overflow: 'visible', position: 'relative', marginBottom: 12 },
  shopProgressFill:  { height: 5, borderRadius: 3, position: 'absolute', left: 0 },
  shopProgressTick:  { position: 'absolute', width: 1, top: -2, bottom: -2,
                       backgroundColor: '#0B1120' },
  shopValueRow:      { flexDirection: 'row', alignItems: 'center', gap: 10,
                       paddingHorizontal: 16, paddingBottom: 14, paddingLeft: 22 },
  shopValueBox:      { alignItems: 'center' },
  shopValueLabel:    { color: '#334155', fontSize: 8, fontWeight: '800', letterSpacing: 1 },
  shopValueNum:      { fontSize: 16, fontWeight: '900' },
  shopValueNumNext:  { color: '#94A3B8', fontSize: 16, fontWeight: '900' },
  shopArrow:         { color: '#334155', fontSize: 16, fontWeight: '900' },
  shopMaxBadge:      { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, borderWidth: 1,
                       backgroundColor: 'rgba(250,204,21,0.08)' },
  shopMaxText:       { fontSize: 12, fontWeight: '900', letterSpacing: 2 },
  shopBuyBtn:        { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  shopBuyText:       { color: '#FFFFFF', fontSize: 11, fontWeight: '900', letterSpacing: 0.5 },

  // kept for compat
  shopGrid:          { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginBottom: 4 },
  upgradeCard:       { width: '47.5%', backgroundColor: 'rgba(8,13,32,0.92)', borderRadius: 20, padding: 16, marginBottom: 8, borderWidth: 1, alignItems: 'center' },
  upgradeIcon:       { fontSize: 32, marginBottom: 8 },
  upgradeName:       { fontSize: 13, fontWeight: '900', letterSpacing: 1, textAlign: 'center', marginBottom: 4 },
  upgradeDesc:       { color: '#475569', fontSize: 11, textAlign: 'center', marginBottom: 12 },
  levelDots:         { flexDirection: 'row', gap: 5, marginBottom: 12 },
  levelDot:          { width: 8, height: 8, borderRadius: 4 },
  upgradeValueRow:   { flexDirection: 'row', alignItems: 'center', marginBottom: 14 },
  upgradeValueCurrent:{ fontSize: 18, fontWeight: '900' },
  upgradeArrow:       { color: '#334155', fontSize: 14, fontWeight: '700' },
  upgradeValueNext:   { color: '#94A3B8', fontSize: 15, fontWeight: '700' },
  upgradeBtn:     { paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12, alignItems: 'center', minWidth: 110 },
  upgradeBtnText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  maxedBadge:     { paddingHorizontal: 20, paddingVertical: 10, borderRadius: 12, backgroundColor: 'rgba(250,204,21,0.15)', borderWidth: 1, borderColor: 'rgba(250,204,21,0.4)' },
  maxedText:      { color: '#FACC15', fontSize: 13, fontWeight: '900', letterSpacing: 2 },

  statRow:      { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(99,60,200,0.15)' },
  statRowIcon:  { fontSize: 18, width: 28 },
  statRowLabel: { color: '#64748B', fontSize: 13, fontWeight: '600', flex: 1 },
  statRowValue: { fontSize: 15, fontWeight: '900' },

  navbar:        { flexDirection: 'row', backgroundColor: 'rgba(3,4,18,0.97)',
                   borderTopWidth: 1, borderTopColor: 'rgba(88,28,235,0.4)',
                   paddingTop: 10, paddingHorizontal: 4 },
  navItem:       { flex: 1, alignItems: 'center', paddingVertical: 6, position: 'relative' },
  navActivePill: { position: 'absolute', top: 0, left: 4, right: 4, bottom: 0,
                   borderRadius: 14, zIndex: 0,
                   shadowColor: '#A855F7', shadowRadius: 12, shadowOpacity: 0.7,
                   shadowOffset: { width: 0, height: 0 }, elevation: 8 },
  navIcon:       { fontSize: 22, opacity: 0.5, zIndex: 1 },
  navIconActive: { opacity: 1, textShadowColor: 'rgba(168,85,247,0.9)', textShadowRadius: 10,
                   textShadowOffset: { width: 0, height: 0 } },
  navText:       { color: '#64748B', fontSize: 9, fontWeight: '800', letterSpacing: 0.5, marginTop: 3, zIndex: 1 },
  navActive:     { color: '#C084FC', textShadowColor: 'rgba(168,85,247,0.8)', textShadowRadius: 8,
                   textShadowOffset: { width: 0, height: 0 } },
  navDot:        { width: 16, height: 3, borderRadius: 2, backgroundColor: '#A855F7',
                   marginTop: 3, shadowColor: '#A855F7', shadowRadius: 6,
                   shadowOpacity: 0.8, elevation: 6, zIndex: 1 },

  // ── Hero Card (identity + level + balance) ────────────────────────────────
  heroCard:         { borderRadius: 20, padding: 16, marginBottom: 14, gap: 12,
                      borderWidth: 1, borderColor: 'rgba(168,85,247,0.35)' },
  heroCardTop:      { flexDirection: 'row', alignItems: 'center', gap: 12 },
  heroAvatar:       { width: 52, height: 52, borderRadius: 26, backgroundColor: 'rgba(168,85,247,0.18)',
                      alignItems: 'center', justifyContent: 'center',
                      borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.5)' },
  heroAvatarEmoji:  { fontSize: 26 },
  heroName:         { color: '#FACC15', fontSize: 18, fontWeight: '900', letterSpacing: 0.5 },
  heroLevelRow:     { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 4 },
  heroLevelChip:    { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  heroLevelChipTxt: { color: '#000', fontSize: 10, fontWeight: '900', letterSpacing: 1 },
  heroFounderChip:  { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
                      backgroundColor: 'rgba(250,204,21,0.15)',
                      borderWidth: 1, borderColor: 'rgba(250,204,21,0.5)' },
  heroFounderTxt:   { color: '#FACC15', fontSize: 9, fontWeight: '900', letterSpacing: 1 },
  heroBalance:      { alignItems: 'flex-end' },
  heroCardBalanceNum: { color: '#FACC15', fontSize: 22, fontWeight: '900', lineHeight: 26, letterSpacing: 1 },
  heroCardBalanceLbl: { color: '#6D28D9', fontSize: 9, fontWeight: '900', letterSpacing: 2, marginTop: 1 },
  heroXpWrap:       { gap: 4 },
  heroXpTrack:      { height: 6, backgroundColor: 'rgba(15,23,42,0.7)', borderRadius: 3, overflow: 'hidden' },
  heroXpFill:       { height: 6, borderRadius: 3 },
  heroXpTxt:        { color: '#A78BFA', fontSize: 10, fontWeight: '700', letterSpacing: 1, textAlign: 'right' },

  // ── TAP hero ──────────────────────────────────────────────────────────────
  tapHeroWrap:      { alignItems: 'center', gap: 4, marginBottom: 4, marginTop: 6 },
  tapHeroTitle:     { color: '#FACC15', fontSize: 16, fontWeight: '900', letterSpacing: 4,
                      textShadowColor: 'rgba(250,204,21,0.4)', textShadowRadius: 8 },
  tapHeroSub:       { color: '#94A3B8', fontSize: 11, textAlign: 'center', paddingHorizontal: 30,
                      lineHeight: 16 },

  // ── Play Games CTA ────────────────────────────────────────────────────────
  playGamesCta:     { flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingHorizontal: 16, paddingVertical: 14, borderRadius: 18 },
  playGamesIcon:    { fontSize: 30 },
  playGamesTitle:   { color: '#FFF', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  playGamesSub:     { color: 'rgba(255,255,255,0.85)', fontSize: 11, marginTop: 2, fontWeight: '600' },
  playGamesArrow:   { color: '#FFF', fontSize: 28, fontWeight: '300' },

  // ── Cup CTA ──────────────────────────────────────────────────────────────
  cupCta:           { flexDirection: 'row', alignItems: 'center', gap: 12,
                      paddingHorizontal: 16, paddingVertical: 13, borderRadius: 16,
                      borderWidth: 1, borderColor: 'rgba(250,204,21,0.3)' },
  cupCtaIcon:       { fontSize: 26 },
  cupCtaTitle:     { color: '#FACC15', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  cupCtaSub:       { color: '#A78BFA', fontSize: 10, marginTop: 2, fontWeight: '600' },
  cupCtaArrow:     { color: '#FACC15', fontSize: 24, fontWeight: '300' },

  // ── Games hub (full-width cards) ──────────────────────────────────────────
  gameFullCard:     { borderRadius: 18, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(30,41,59,0.8)' },
  gameFullGrad:     { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  gameFullIconWrap: { width: 56, height: 56, borderRadius: 16, borderWidth: 1,
                      alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  gameFullIconEmoji:{ fontSize: 28 },
  gameFullInfo:     { flex: 1, gap: 3 },
  gameFullTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  gameFullName:     { fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  gameFullTag:      { borderWidth: 1, borderRadius: 6, paddingHorizontal: 6, paddingVertical: 2 },
  gameFullTagTxt:   { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  gameFullDesc:     { color: '#475569', fontSize: 11, lineHeight: 15 },
  gameFullReward:   { fontSize: 12, fontWeight: '700', marginTop: 2 },
  gameFullArrow:    { fontSize: 28, fontWeight: '300', opacity: 0.6, paddingHorizontal: 4 },

  // ── Games hub header ─────────────────────────────────────────────────────
  gamesHeader:       { marginHorizontal: -16, marginTop: -8, paddingHorizontal: 20, paddingVertical: 18 },
  gamesTitle:        { color: '#E2E8F0', fontSize: 24, fontWeight: '900', letterSpacing: 3 },
  gamesSubtitle:     { color: '#475569', fontSize: 12, letterSpacing: 1, marginTop: 4 },

  // Featured card
  gameFeatured:      { borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: '#00E5FF33' },
  gameFeaturedGrad:  { flexDirection: 'row', alignItems: 'center', padding: 20, gap: 12 },
  gameFeaturedLeft:  { flex: 1, gap: 6 },
  gameFeaturedBadge: { backgroundColor: '#FF6B0022', borderRadius: 8, paddingHorizontal: 8, paddingVertical: 3, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#FF6B0055' },
  gameFeaturedBadgeTxt:{ color: '#FB923C', fontSize: 9, fontWeight: '900', letterSpacing: 2 },
  gameFeaturedName:  { color: '#00E5FF', fontSize: 22, fontWeight: '900', letterSpacing: 2, textShadowColor: '#00E5FF', textShadowRadius: 8, textShadowOffset: { width: 0, height: 0 } },
  gameFeaturedDesc:  { color: '#64748B', fontSize: 12, lineHeight: 18 },
  gameFeaturedRewardRow:{ flexDirection: 'row' },
  gameFeaturedReward:{ color: '#22C55E', fontSize: 12, fontWeight: '700' },
  gameFeaturedPlayBtn:{ backgroundColor: '#00E5FF22', borderRadius: 10, paddingHorizontal: 16, paddingVertical: 8, alignSelf: 'flex-start', borderWidth: 1, borderColor: '#00E5FF66', marginTop: 4 },
  gameFeaturedPlayTxt:{ color: '#00E5FF', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  gameFeaturedEmoji: { fontSize: 72 },

  // Grid
  gamesGrid:         { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  gameGridCard:      { width: (SCREEN_W - 42) / 2, borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#1E293B' },
  gameGridGrad:      { padding: 14, gap: 4 },
  gameGridTop:       { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  gameGridIcon:      { fontSize: 28 },
  gameGridTag:       { borderWidth: 1, borderRadius: 6, paddingHorizontal: 5, paddingVertical: 2 },
  gameGridTagTxt:    { fontSize: 8, fontWeight: '900', letterSpacing: 1 },
  gameGridName:      { fontSize: 12, fontWeight: '900', letterSpacing: 0.5 },
  gameGridDesc:      { color: '#475569', fontSize: 10, lineHeight: 14 },
  gameGridReward:    { fontSize: 11, fontWeight: '700', marginTop: 4 },

  // old aliases
  gameCard:          { marginBottom: 10, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(99,60,200,0.25)' },
  gameCardGradient:  { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 14 },
  gameCardIcon:      { fontSize: 36, width: 46 },
  gameCardInfo:      { flex: 1 },
  gameCardName:      { fontSize: 15, fontWeight: '900', letterSpacing: 0.5 },
  gameCardDesc:      { color: '#64748B', fontSize: 12, marginTop: 2 },
  gameCardReward:    { borderWidth: 1, borderRadius: 10, paddingHorizontal: 10, paddingVertical: 5 },
  gameCardRewardText:{ fontSize: 11, fontWeight: '800' },

  // ── Profile ───────────────────────────────────────────────────────────────
  profileHero:        { marginHorizontal: -16, marginTop: -8, paddingHorizontal: 24,
                        paddingTop: 28, paddingBottom: 22, alignItems: 'center', gap: 6 },
  profileAvatarWrap:  { position: 'relative', marginBottom: 6 },
  profileAvatarGrad:  { width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center',
                        shadowColor: '#A855F7', shadowRadius: 16, shadowOpacity: 0.8, elevation: 10 },
  profileAvatarLetter:{ color: '#fff', fontSize: 42, fontWeight: '900', lineHeight: 50 },
  profileLvBadge:     { position: 'absolute', bottom: -2, right: -6, backgroundColor: '#FACC15',
                        borderRadius: 10, paddingHorizontal: 6, paddingVertical: 2 },
  profileLvTxt:       { color: '#000', fontSize: 9, fontWeight: '900', letterSpacing: 0.5 },
  profileNameRow:     { flexDirection: 'row', alignItems: 'center', gap: 8 },
  profileName:        { color: '#E2E8F0', fontSize: 19, fontWeight: '900', letterSpacing: 2 },
  profileEditIcon:    { color: '#475569', fontSize: 14 },
  profileEditRow:     { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', paddingHorizontal: 8 },
  profileNameInput:   { flex: 1, color: '#E2E8F0', fontSize: 16, fontWeight: '800', letterSpacing: 1,
                        borderBottomWidth: 1.5, borderBottomColor: '#7C3AED',
                        paddingVertical: 4, textAlign: 'center' },
  profileEditSave:    { backgroundColor: '#22C55E', borderRadius: 10, width: 32, height: 32,
                        alignItems: 'center', justifyContent: 'center' },
  profileEditSaveTxt: { color: '#fff', fontSize: 16, fontWeight: '900' },
  profileEditCancel:  { backgroundColor: '#374151', borderRadius: 10, width: 32, height: 32,
                        alignItems: 'center', justifyContent: 'center' },
  profileEditCancelTxt:{ color: '#94A3B8', fontSize: 14, fontWeight: '900' },
  profileSub:         { color: '#4C1D95', fontSize: 10, letterSpacing: 2 },
  profileXpRow:       { flexDirection: 'row', alignItems: 'center', gap: 8, width: '100%', marginTop: 6 },
  profileXpLbl:       { color: '#475569', fontSize: 9, fontWeight: '700', minWidth: 28 },
  profileXpTrack:     { flex: 1, height: 7, backgroundColor: 'rgba(0,0,0,0.4)', borderRadius: 4, overflow: 'hidden' },
  profileXpFill:      { height: 7, borderRadius: 4 },

  profileStats4:      { flexDirection: 'row', gap: 8 },
  profileStat4Card:   { flex: 1, borderRadius: 16, padding: 12, alignItems: 'center',
                        borderWidth: 1, borderColor: '#1E293B' },
  profileStat4Num:    { fontSize: 17, fontWeight: '900' },
  profileStat4Lbl:    { color: '#475569', fontSize: 10, letterSpacing: 1, marginTop: 3, fontWeight: '700' },

  profileSection:     { backgroundColor: '#0B1120', borderRadius: 20, padding: 16,
                        borderWidth: 1, borderColor: '#1E293B', gap: 10 },
  profileSectionTitle:{ color: '#334155', fontSize: 10, fontWeight: '900', letterSpacing: 2 },

  // Settings row + toggle switch
  settingRow:        { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                       paddingVertical: 6 },
  settingLeft:       { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  settingIcon:       { fontSize: 22, width: 28, textAlign: 'center' },
  settingLabel:      { color: '#E2E8F0', fontSize: 13, fontWeight: '700' },
  settingSub:        { color: '#64748B', fontSize: 11, marginTop: 2 },
  toggleTrack:       { width: 44, height: 26, borderRadius: 13, backgroundColor: '#1E293B',
                       padding: 3, justifyContent: 'center',
                       borderWidth: 1, borderColor: 'rgba(99,60,200,0.3)' },
  toggleTrackOn:     { backgroundColor: 'rgba(34,197,94,0.25)', borderColor: 'rgba(34,197,94,0.6)' },
  toggleKnob:        { width: 18, height: 18, borderRadius: 9, backgroundColor: '#475569' },
  toggleKnobOn:      { backgroundColor: '#22C55E', alignSelf: 'flex-end' },
  settingTestBtn:    { marginTop: 8, backgroundColor: 'rgba(96,165,250,0.10)',
                       borderRadius: 12, paddingVertical: 10, alignItems: 'center',
                       borderWidth: 1, borderColor: 'rgba(96,165,250,0.4)' },
  settingTestBtnText:{ color: '#60A5FA', fontSize: 12, fontWeight: '800', letterSpacing: 1 },
  profileBadges:      { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  profileBadge:       { backgroundColor: 'rgba(124,58,237,0.12)', borderRadius: 14, padding: 10,
                        alignItems: 'center', width: '22%', borderWidth: 1,
                        borderColor: 'rgba(124,58,237,0.25)', gap: 3 },
  profileBadgeLocked: { backgroundColor: '#080E1E', borderColor: '#1E293B' },
  profileBadgeIcon:   { fontSize: 20 },
  profileBadgeLabel:  { color: '#94A3B8', fontSize: 9, fontWeight: '700', textAlign: 'center' },
  profileBadgeCheck:  { color: '#22C55E', fontSize: 10, fontWeight: '900' },
  profileBadgeBar:    { width: '100%', height: 2, backgroundColor: '#1E293B', borderRadius: 1, overflow: 'hidden' },
  profileBadgeBarFill:{ height: 2, backgroundColor: '#A855F7', borderRadius: 1 },

  // Seeker identity block
  seekerCard:         { borderRadius: 18, padding: 14, borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.4)' },
  seekerHeader:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  seekerBadge:        { color: '#C084FC', fontSize: 13, fontWeight: '900', letterSpacing: 2 },
  seekerBonusTag:     { color: '#FACC15', fontSize: 11, fontWeight: '900', backgroundColor: 'rgba(250,204,21,0.12)',
                        paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                        borderWidth: 1, borderColor: 'rgba(250,204,21,0.4)' },
  seekerRows:         { marginTop: 10, gap: 6 },
  seekerRow:          { flexDirection: 'row', justifyContent: 'space-between' },
  seekerKey:          { color: '#64748B', fontSize: 11, fontWeight: '700', letterSpacing: 1 },
  seekerVal:          { color: '#E2E8F0', fontSize: 13, fontWeight: '800' },
  seekerYield:        { color: '#22C55E', fontSize: 11, fontWeight: '700' },
  seekerLoading:      { color: '#64748B', fontSize: 12, fontWeight: '700', letterSpacing: 1, textAlign: 'center' },
  seekerHint:         { color: '#334155', fontSize: 10, marginTop: 6, textAlign: 'center', letterSpacing: 1 },

  profileActions:     { flexDirection: 'row', gap: 8 },
  profileActionBtn:   { flex: 1, backgroundColor: '#0B1120', borderRadius: 16, padding: 12,
                        alignItems: 'center', borderWidth: 1, borderColor: '#1E293B' },
  profileActionIcon:  { fontSize: 22, marginBottom: 4 },
  profileActionLabel: { color: '#64748B', fontSize: 9, fontWeight: '700', textAlign: 'center' },

  // ── Genesis Pre-Season banner ─────────────────────────────────────────────
  genesisBanner:    { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
                      paddingVertical: 12, paddingHorizontal: 14, borderRadius: 16,
                      marginBottom: 12, borderWidth: 1.5, borderColor: 'rgba(168,85,247,0.4)' },
  genesisBannerLeft:{ flex: 1, gap: 4 },
  genesisBadge:     { flexDirection: 'row', alignItems: 'center', gap: 5,
                      alignSelf: 'flex-start', backgroundColor: 'rgba(0,0,0,0.4)',
                      paddingHorizontal: 8, paddingVertical: 3, borderRadius: 8,
                      borderWidth: 1, borderColor: 'rgba(236,72,153,0.5)' },
  genesisBadgeDot:  { width: 5, height: 5, borderRadius: 3, backgroundColor: '#EC4899' },
  genesisBadgeText: { color: '#FBCFE8', fontSize: 8, fontWeight: '900', letterSpacing: 1.5 },
  genesisBannerTitle:{ color: '#FACC15', fontSize: 13, fontWeight: '900', letterSpacing: 1, marginTop: 2 },
  genesisBannerSub: { color: '#C084FC', fontSize: 10, opacity: 0.9 },
  genesisBannerArrow:{ color: '#FACC15', fontSize: 28, fontWeight: '900' },

  // ── Home screen redesign ──────────────────────────────────────────────────
  homeTopRow:       { flexDirection: 'row', gap: 8, marginBottom: 16, alignItems: 'center' },
  homeChip:         { backgroundColor: 'rgba(8,13,32,0.9)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(99,60,200,0.3)', flexDirection: 'row', alignItems: 'center', gap: 6 },
  homeChipGlow:     { borderColor: 'rgba(250,204,21,0.5)', backgroundColor: 'rgba(250,204,21,0.08)' },
  homeChipText:     { color: '#94A3B8', fontSize: 12, fontWeight: '700' },
  homeChipDot:      { width: 6, height: 6, borderRadius: 3, backgroundColor: '#FACC15' },
  homeChipShield:   { borderColor: 'rgba(96,165,250,0.55)', backgroundColor: 'rgba(96,165,250,0.10)' },

  // Streak Shield "used today" banner
  shieldUsedBanner: { flexDirection: 'row', alignItems: 'center', gap: 12,
                      borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12,
                      marginBottom: 12, borderWidth: 1, borderColor: 'rgba(96,165,250,0.4)' },
  shieldUsedIcon:   { fontSize: 26 },
  shieldUsedTitle:  { color: '#60A5FA', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  shieldUsedSub:    { color: '#94A3B8', fontSize: 11, marginTop: 3 },
  shieldUsedDismiss:{ color: '#475569', fontSize: 18, fontWeight: '700', paddingHorizontal: 4 },

  // Streak modal additions
  streakRewardBonus:    { color: '#22C55E', fontSize: 11, fontWeight: '700', marginTop: 4 },
  streakRewardShield:   { color: '#60A5FA', fontSize: 11, fontWeight: '700', marginTop: 4, textAlign: 'center' },
  streakShieldStatus:   { color: '#60A5FA', fontSize: 12, fontWeight: '700', marginTop: 14,
                          backgroundColor: 'rgba(96,165,250,0.10)', paddingHorizontal: 14, paddingVertical: 6,
                          borderRadius: 999, borderWidth: 1, borderColor: 'rgba(96,165,250,0.3)' },
  homeEnergyChip:   { flex: 1, backgroundColor: 'rgba(8,13,32,0.9)', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 7, borderWidth: 1, borderColor: 'rgba(251,146,60,0.3)' },
  homeEnergyTimer:  { color: '#475569', fontSize: 10, marginTop: 1 },

  // ── Hero section ──────────────────────────────
  heroWrap:         { marginHorizontal: -16, marginTop: -8, marginBottom: 12 },
  heroGrad:         { alignItems: 'center', paddingTop: 28, paddingBottom: 24, paddingHorizontal: 20, overflow: 'hidden', position: 'relative' },
  heroShimmer:      { position: 'absolute', top: 0, bottom: 0, width: SCREEN_W * 0.45,
                      backgroundColor: 'rgba(255,255,255,0.12)',
                      transform: [{ skewX: '-20deg' }] },

  // S Logo
  sLogoWrap:        { alignItems: 'center', justifyContent: 'center', marginBottom: 8, position: 'relative' },
  sLogoGlow:        { position: 'absolute', width: 100, height: 100, borderRadius: 50,
                      backgroundColor: '#A855F7', },
  sLogoInner:       { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  sLogoLetter:      { fontSize: 72, fontWeight: '900', color: '#ffffff',
                      textShadowColor: '#EC4899', textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 },
                      lineHeight: 80 },
  sRocketWrap:      { position: 'absolute', bottom: -4, right: -12,
                      transform: [{ rotate: '45deg' }] },
  sRocket:          { fontSize: 22 },

  heroBrand:        { color: 'rgba(255,255,255,0.5)', fontSize: 10, fontWeight: '900',
                      letterSpacing: 6, marginBottom: 12 },
  heroBalanceNum:   { color: '#FFFFFF', fontSize: 44, fontWeight: '900', lineHeight: 48,
                      textShadowColor: '#EC4899', textShadowRadius: 16, textShadowOffset: { width: 0, height: 0 } },
  heroBalanceUnit:  { color: '#EC4899', fontSize: 13, fontWeight: '900', letterSpacing: 5, marginTop: 2, marginBottom: 10 },

  // old aliases (kept for compat)
  homeBalanceHero:  { alignItems: 'center', marginBottom: 8, paddingVertical: 4 },
  homeBalanceLabel: { color: '#334155', fontSize: 10, fontWeight: '800', letterSpacing: 4, marginBottom: 4 },
  homeBalanceNum:   { color: '#FFFFFF', fontSize: 48, fontWeight: '900', lineHeight: 52, textShadowColor: '#A855F7', textShadowRadius: 20, textShadowOffset: { width: 0, height: 0 } },
  homeBalanceUnit:  { color: '#A855F7', fontSize: 14, fontWeight: '900', letterSpacing: 4, marginTop: 2 },
  homeLevelRow:     { flexDirection: 'row', alignItems: 'center', gap: 10, marginTop: 10 },
  homeLevelBadge:   { borderRadius: 999, paddingHorizontal: 12, paddingVertical: 4 },
  homeLevelText:    { color: '#FFF', fontSize: 11, fontWeight: '900', letterSpacing: 2 },
  homeXpBarWrap:    { height: 5, backgroundColor: 'rgba(30,16,64,0.9)', borderRadius: 999, overflow: 'hidden' },
  homeXpFill:       { height: '100%', borderRadius: 999 },
  homeXpLabel:      { color: '#475569', fontSize: 9, fontWeight: '800' },

  homeOrbArea:      { alignItems: 'center', justifyContent: 'center', height: 210, marginBottom: 4 },
  homeTapHint:      { textAlign: 'center', color: '#475569', fontSize: 11, fontWeight: '600',
                      letterSpacing: 0.5, marginBottom: 14 },
  homeOrbRing:      { position: 'absolute', width: 240, height: 240, borderRadius: 120, borderWidth: 2, borderColor: '#FB923C' },
  homeOrbPulse:     { alignItems: 'center', justifyContent: 'center' },
  homeOrb:          { width: 180, height: 180, borderRadius: 90, backgroundColor: '#5B21B6', alignItems: 'center', justifyContent: 'center', borderWidth: 2.5, borderColor: 'rgba(192,132,252,0.6)', shadowColor: '#7C3AED', shadowOffset: { width: 0, height: 0 }, shadowOpacity: 1, shadowRadius: 40, elevation: 40 },
  homeOrbBoosted:   { backgroundColor: '#C2410C', borderColor: 'rgba(253,186,116,0.7)', shadowColor: '#FB923C' },
  homeOrbEmpty:     { backgroundColor: '#0F0920', borderColor: 'rgba(99,60,200,0.2)', shadowOpacity: 0.15 },
  homeOrbTapText:   { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: 6 },
  homeOrbEmptyIcon: { fontSize: 32, opacity: 0.4 },
  homeOrbEmptyTimer:{ color: '#334155', fontSize: 18, fontWeight: '700', marginTop: 4 },
  homeFloating:     { position: 'absolute', top: -10, color: '#22C55E', fontSize: 28, fontWeight: '900', textShadowColor: '#22C55E', textShadowRadius: 12, textShadowOffset: { width: 0, height: 0 } },
  homeCritText:     { position: 'absolute', bottom: -8, color: '#FACC15', fontSize: 14, fontWeight: '900', letterSpacing: 2 },
  homeLevelUpText:  { position: 'absolute', bottom: -28, color: '#38BDF8', fontSize: 14, fontWeight: '900', letterSpacing: 1 },
  homeBoostBadge:   { position: 'absolute', top: -28, color: '#FB923C', fontSize: 12, fontWeight: '900', letterSpacing: 1 },
  homeCombo:        { position: 'absolute', top: -20, backgroundColor: 'rgba(250,204,21,0.15)', borderRadius: 20, paddingHorizontal: 14, paddingVertical: 5, borderWidth: 1, borderColor: 'rgba(250,204,21,0.4)' },
  homeComboText:    { color: '#FACC15', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  homeActionRow:    { flexDirection: 'row', gap: 10, marginBottom: 14 },
  homeBoostBtn:     { borderRadius: 16, overflow: 'hidden' },
  homeWheelBtn:     { flex: 1, borderRadius: 16, overflow: 'hidden' },
  homeBoostGrad:    { paddingVertical: 13, alignItems: 'center' },
  homeBoostText:    { color: '#FFF', fontSize: 13, fontWeight: '900', letterSpacing: 1 },

  homeQuestCard:    { backgroundColor: 'rgba(8,13,32,0.88)', borderRadius: 20, padding: 16, marginBottom: 12, borderWidth: 1, borderColor: 'rgba(99,60,200,0.25)' },
  homeQuestTitle:   { color: '#64748B', fontSize: 12, fontWeight: '800', letterSpacing: 2, marginBottom: 12 },
  homeLastReward:   { color: '#334155', fontSize: 11, textAlign: 'center', marginBottom: 8, letterSpacing: 0.5 },

  energyBarRow:        { flexDirection: 'row', alignItems: 'center', marginTop: 10, gap: 8 },
  energyBarIcon:       { fontSize: 13, width: 18 },
  energyBarTrack:      { flex: 1, height: 6, backgroundColor: 'rgba(30,16,64,0.9)', borderRadius: 999, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(251,146,60,0.25)' },
  energyBarFill:       { height: '100%', borderRadius: 999, backgroundColor: '#FB923C' },
  energyBarCount:      { color: '#FB923C', fontSize: 11, fontWeight: '800', width: 46, textAlign: 'right' },
  energyRefillText:    { color: '#475569', fontSize: 11, marginTop: 4, letterSpacing: 0.5 },
  energyEmptyText:     { color: '#FB923C', fontSize: 13, textAlign: 'center', fontWeight: '800', marginTop: 8 },
  signalOrbDrained:    { backgroundColor: '#0F0920', borderColor: 'rgba(99,60,200,0.2)', shadowOpacity: 0.2 },
  signalOrbDrainedText:{ color: '#475569', fontSize: 16, fontWeight: '700', marginTop: 6 },

  // Season
  seasonHeader:      { borderRadius: 24, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(124,58,237,0.4)', overflow: 'hidden' },
  seasonBadge:       { color: '#7C3AED', fontSize: 10, fontWeight: '800', letterSpacing: 2, marginBottom: 10 },
  seasonTitle:       { color: '#C084FC', fontSize: 24, fontWeight: '900', letterSpacing: 4, marginBottom: 20 },
  seasonCountdown:   { flexDirection: 'row', alignItems: 'center', gap: 6 },
  seasonSep:         { color: '#4F46E5', fontSize: 28, fontWeight: '900', marginBottom: 14 },
  seasonBlock:       { alignItems: 'center', backgroundColor: 'rgba(99,60,200,0.2)', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 8, borderWidth: 1, borderColor: 'rgba(99,60,200,0.4)' },
  seasonBlockNum:    { color: '#E2E8F0', fontSize: 28, fontWeight: '900', lineHeight: 32 },
  seasonBlockLabel:  { color: '#475569', fontSize: 9, fontWeight: '800', letterSpacing: 2, marginTop: 2 },
  seasonEndsLabel:   { color: '#334155', fontSize: 10, fontWeight: '700', letterSpacing: 3, marginTop: 12 },

  prizeTier:         { flexDirection: 'row', alignItems: 'center', paddingVertical: 10, paddingLeft: 14, borderLeftWidth: 3, marginBottom: 8, backgroundColor: 'rgba(5,9,22,0.6)', borderRadius: 10 },
  prizeTierRank:     { fontSize: 13, fontWeight: '900', width: 90 },
  prizeTierReward:   { color: '#94A3B8', fontSize: 13, fontWeight: '700', flex: 1 },

  seasonMyRank:      { alignItems: 'center', backgroundColor: 'rgba(88,28,235,0.12)', borderRadius: 20, padding: 20, marginBottom: 20, borderWidth: 1, borderColor: 'rgba(99,60,200,0.25)' },
  seasonMyRankLabel: { color: '#475569', fontSize: 10, fontWeight: '800', letterSpacing: 3 },
  seasonMyRankNum:   { color: '#A855F7', fontSize: 52, fontWeight: '900', lineHeight: 60 },
  seasonMyRankSub:   { color: '#64748B', fontSize: 12, fontWeight: '600', marginTop: 4 },

  // Wallet
  walletHeader:        { borderRadius: 24, padding: 24, marginBottom: 16, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(20,184,166,0.3)', overflow: 'hidden' },
  walletHeaderIcon:    { fontSize: 52, marginBottom: 8 },
  walletHeaderTitle:   { color: '#2DD4BF', fontSize: 22, fontWeight: '900', letterSpacing: 4 },
  walletHeaderSub:     { color: '#475569', fontSize: 12, marginTop: 6, letterSpacing: 1 },
  walletCard:          { borderRadius: 28, padding: 24, marginBottom: 16, borderWidth: 1, borderColor: 'rgba(20,184,166,0.4)', alignItems: 'center', overflow: 'hidden' },
  walletConnectedBadge:{ flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 16 },
  walletDot:           { width: 8, height: 8, borderRadius: 4, backgroundColor: '#34D399' },
  walletConnectedText: { color: '#34D399', fontSize: 11, fontWeight: '800', letterSpacing: 3 },
  walletAddress:       { color: '#FFFFFF', fontSize: 30, fontWeight: '900', letterSpacing: 2 },
  walletAddressFull:   { color: '#334155', fontSize: 9, marginTop: 6, textAlign: 'center' },
  walletBalanceRow:    { flexDirection: 'row', gap: 10, marginTop: 20, width: '100%' },
  walletBalanceCard:   { flex: 1, backgroundColor: 'rgba(5,9,22,0.8)', borderRadius: 16, padding: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(45,212,191,0.2)' },
  walletBalanceLabel:  { color: '#64748B', fontSize: 9, fontWeight: '800', letterSpacing: 2 },
  walletBalanceValue:  { color: '#2DD4BF', fontSize: 15, fontWeight: '900', marginTop: 4 },
  conversionRow:       { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginVertical: 16 },
  conversionOrb:       { color: '#A855F7', fontSize: 13, fontWeight: '800' },
  conversionArrow:     { color: '#475569', fontSize: 18, fontWeight: '900' },
  conversionSkora:     { color: '#2DD4BF', fontSize: 18, fontWeight: '900' },
  disconnectBtn:       { alignItems: 'center', padding: 14, marginBottom: 20 },
  disconnectText:      { color: '#334155', fontSize: 13, fontWeight: '700' },
  phantomBtn:          { padding: 18, borderRadius: 20, alignItems: 'center', marginBottom: 14 },
  phantomBtnText:      { color: '#FFFFFF', fontSize: 16, fontWeight: '900', letterSpacing: 1 },
  walletInput:         { backgroundColor: 'rgba(5,9,22,0.9)', borderRadius: 14, padding: 14, color: '#E2E8F0', fontSize: 12, borderWidth: 1, borderColor: 'rgba(99,60,200,0.4)', marginBottom: 14 },
  skoraRow:            { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: 'rgba(99,60,200,0.1)' },
  skoraRowIcon:        { fontSize: 20, width: 28 },
  skoraRowText:        { color: '#94A3B8', fontSize: 12, flex: 1, lineHeight: 18 },

  comboContainer:  { alignItems: 'center', marginBottom: 8 },
  comboLabel:      { color: '#64748B', fontSize: 11, fontWeight: '800', letterSpacing: 4 },
  comboMultiplier: { color: '#FACC15', fontSize: 56, fontWeight: '900', lineHeight: 62, textShadowColor: 'rgba(250,204,21,0.5)', textShadowRadius: 18, textShadowOffset: { width: 0, height: 0 } },
  comboMax:        { color: '#FB923C', textShadowColor: 'rgba(251,146,60,0.6)' },
});
