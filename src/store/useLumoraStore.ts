import { create } from 'zustand';
import type { LumoraSettings } from '../types/lumora';
import { loadSettings, saveSettings, subscribeToSettings } from '../lib/storage';

export const defaultSettings: LumoraSettings = {
  heroMode: 'custom',
  customHero: 'LUMORA',
  searchEngine: 'google',
  wallpaper: 'clouds',
  wallpaperUrl: '',
  dim: 24,
  vignette: 34,
  glassBlur: 24,
  hour12: false,
  aiEnabled: false,
  geminiKey: '',
  weatherEnabled: true,
  weatherApiKey: '',
  weatherCity: '',
  starredSiteIds: ['youtube', 'github', 'chatgpt', 'gmail', 'x', 'reddit', 'spotify', 'notion'],
  customSites: [],
  mochiEnabled: true,
  doNotDisturb: false,
  mochiGlow: 'ice',
  mediaAutoHide: false,
};

interface LumoraStore {
  settings: LumoraSettings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updateSettings: (patch: Partial<LumoraSettings>) => Promise<void>;
  resetSettings: () => Promise<void>;
}

let unsubscribe: (() => void) | undefined;

export const useLumoraStore = create<LumoraStore>((set, get) => ({
  settings: defaultSettings,
  hydrated: false,
  hydrate: async () => {
    const stored = await loadSettings();
    set({ settings: { ...defaultSettings, ...stored }, hydrated: true });
    unsubscribe?.();
    unsubscribe = subscribeToSettings((settings) => {
      set({ settings: { ...defaultSettings, ...settings } });
    });
  },
  updateSettings: async (patch) => {
    const settings = { ...get().settings, ...patch };
    set({ settings });
    await saveSettings(settings);
  },
  resetSettings: async () => {
    set({ settings: defaultSettings });
    await saveSettings(defaultSettings);
  },
}));
