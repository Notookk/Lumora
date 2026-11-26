export type HeroMode = 'custom' | 'day';
export type SearchEngine = 'google' | 'duckduckgo' | 'perplexity' | 'bing';
export type WallpaperPreset = 'clouds' | 'glacier' | 'ember' | 'graphite' | 'custom-url' | 'custom-upload';
export type MochiGlow = 'ice' | 'pearl' | 'mint' | 'lavender';

export interface CustomSite {
  id: string;
  name: string;
  url: string;
}

export interface LumoraSettings {
  heroMode: HeroMode;
  customHero: string;
  searchEngine: SearchEngine;
  wallpaper: WallpaperPreset;
  wallpaperUrl: string;
  dim: number;
  vignette: number;
  glassBlur: number;
  hour12: boolean;
  aiEnabled: boolean;
  geminiKey: string;
  weatherEnabled: boolean;
  weatherApiKey: string;
  weatherCity: string;
  latitude?: number;
  longitude?: number;
  starredSiteIds: string[];
  customSites: CustomSite[];
  mochiEnabled: boolean;
  doNotDisturb: boolean;
  mochiGlow: MochiGlow;
  mediaAutoHide: boolean;
}

export type BrandIconName =
  | 'youtube'
  | 'github'
  | 'chatgpt'
  | 'claude'
  | 'gemini'
  | 'gmail'
  | 'x'
  | 'reddit'
  | 'spotify'
  | 'netflix'
  | 'notion'
  | 'figma'
  | 'linkedin'
  | 'twitch'
  | 'discord'
  | 'instagram'
  | 'whatsapp'
  | 'amazon'
  | 'stackoverflow'
  | 'vercel'
  | 'custom';

export interface FamousSite {
  id: string;
  name: string;
  url: string;
  color: string;
  icon: BrandIconName;
}

export interface BrowserTab {
  id: number;
  title: string;
  url: string;
  favicon: string;
  active: boolean;
  audible: boolean;
  muted: boolean;
  pinned: boolean;
  index: number;
}

export interface MediaSession {
  tabId: number;
  title: string;
  artist: string;
  artwork: string;
  source: string;
  paused: boolean;
  muted: boolean;
  currentTime: number;
  duration: number;
}

export type NotificationSource = 'download' | 'lumora' | 'system';

export interface LumoraNotification {
  id: string;
  title: string;
  body: string;
  source: NotificationSource;
  createdAt: number;
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  pending?: boolean;
  error?: boolean;
}

export interface WeatherData {
  temperature: number;
  code: number;
  condition: string;
  isDay: boolean;
  location: string;
  latitude?: number;
  longitude?: number;
}

export type RuntimeMessage =
  | { type: 'GET_TABS' }
  | { type: 'GET_MEDIA' }
  | { type: 'MEDIA_STATE'; session: MediaSession }
  | { type: 'MEDIA_COMMAND'; tabId: number; command: 'play' | 'pause' | 'toggle' }
  | { type: 'ACTIVATE_TAB'; tabId: number }
  | { type: 'CLOSE_TAB'; tabId: number }
  | { type: 'NEW_TAB' }
  | { type: 'SET_TAB_MUTED'; tabId: number; muted: boolean }
  | { type: 'LUMORA_TABS_CHANGED'; tabs: BrowserTab[] }
  | { type: 'LUMORA_MEDIA_CHANGED'; sessions: MediaSession[] }
  | { type: 'LUMORA_NOTIFICATION'; notification: LumoraNotification };
