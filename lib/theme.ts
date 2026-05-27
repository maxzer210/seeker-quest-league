import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

// ─── Theme configs (Gemini design) ──────────────────────────────────────────

export interface GameTheme {
  id: string;
  name: string;
  bgDeep: string;
  bgCard: string;
  primary: string;
  accent: string;
  orbEmoji: string;
  shipEmoji: string;
  obstacleEmoji: string;
  gradientColors: [string, string];
}

export const NFT_THEMES: Record<string, GameTheme> = {
  default: {
    id: 'default',
    name: 'Genesis Purple',
    bgDeep: '#020510',
    bgCard: '#080D1E',
    primary: '#7C3AED',
    accent:  '#EC4899',
    orbEmoji: '🌌',
    shipEmoji: '🚀',
    obstacleEmoji: '🪨',
    gradientColors: ['#7C3AED', '#EC4899'],
  },
  solana_overdrive: {
    id: 'solana_overdrive',
    name: 'Solana Overdrive',
    bgDeep: '#020C08',
    bgCard: '#061F15',
    primary: '#14F195',
    accent:  '#00C2FF',
    orbEmoji: '🟢',
    shipEmoji: '🛸',
    obstacleEmoji: '👾',
    gradientColors: ['#14F195', '#00C2FF'],
  },
  degen_gold: {
    id: 'degen_gold',
    name: 'Degenerate Gold',
    bgDeep: '#050505',
    bgCard: '#121212',
    primary: '#FACC15',
    accent:  '#F59E0B',
    orbEmoji: '🪙',
    shipEmoji: '👑',
    obstacleEmoji: '💵',
    gradientColors: ['#FACC15', '#F97316'],
  },
  supernova: {
    id: 'supernova',
    name: 'Supernova',
    bgDeep: '#0F0202',
    bgCard: '#250808',
    primary: '#EF4444',
    accent:  '#EC4899',
    orbEmoji: '🕳️',
    shipEmoji: '👾',
    obstacleEmoji: '🪐',
    gradientColors: ['#EF4444', '#831843'],
  },
};

export const THEME_ORDER: string[] = ['default', 'solana_overdrive', 'degen_gold', 'supernova'];

// ─── Runtime ────────────────────────────────────────────────────────────────

const STORAGE_KEY = '@seeker_theme';
let currentThemeId = 'default';
const listeners = new Set<(id: string) => void>();

export function getTheme(): GameTheme {
  return NFT_THEMES[currentThemeId] ?? NFT_THEMES.default;
}

export function getThemeId(): string {
  return currentThemeId;
}

export async function loadSavedTheme(): Promise<string> {
  try {
    const v = await AsyncStorage.getItem(STORAGE_KEY);
    if (v && NFT_THEMES[v]) currentThemeId = v;
  } catch (_) {}
  return currentThemeId;
}

export async function setActiveTheme(id: string) {
  if (!NFT_THEMES[id]) return;
  currentThemeId = id;
  try { await AsyncStorage.setItem(STORAGE_KEY, id); } catch (_) {}
  listeners.forEach(fn => fn(id));
}

/** Reactive hook — re-renders when theme changes */
export function useTheme(): GameTheme {
  const [id, setId] = useState<string>(currentThemeId);
  useEffect(() => {
    const handler = (newId: string) => setId(newId);
    listeners.add(handler);
    return () => { listeners.delete(handler); };
  }, []);
  return NFT_THEMES[id] ?? NFT_THEMES.default;
}
