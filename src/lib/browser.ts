import { isExtension } from './extension';
import type { BrowserTab, MediaSession, RuntimeMessage } from '../types/lumora';

const demoTabs: BrowserTab[] = [
  { id: 101, title: 'LUMORA — New Tab', url: 'chrome://newtab/', favicon: '', active: true, audible: false, muted: false, pinned: true, index: 0 },
  { id: 102, title: 'Designing for focus — GitHub', url: 'https://github.com/', favicon: 'https://www.google.com/s2/favicons?domain=github.com&sz=64', active: false, audible: false, muted: false, pinned: true, index: 1 },
  { id: 103, title: 'Midnight Focus — SoundCloud', url: 'https://soundcloud.com/', favicon: 'https://www.google.com/s2/favicons?domain=soundcloud.com&sz=64', active: false, audible: true, muted: false, pinned: false, index: 2 },
  { id: 104, title: 'A quieter workspace — Figma', url: 'https://figma.com/', favicon: 'https://www.google.com/s2/favicons?domain=figma.com&sz=64', active: false, audible: false, muted: false, pinned: false, index: 3 },
];

const demoMedia: MediaSession[] = [
  {
    tabId: 103,
    title: 'Midnight Focus',
    artist: 'Lumora Sessions',
    artwork: '',
    source: 'soundcloud.com',
    paused: false,
    muted: false,
    currentTime: 84,
    duration: 252,
  },
];

export const runtimeRequest = async <T,>(message: RuntimeMessage): Promise<T | null> => {
  if (!isExtension()) return null;
  try {
    return (await chrome.runtime.sendMessage(message)) as T;
  } catch {
    return null;
  }
};

export const getBrowserTabs = async (): Promise<BrowserTab[]> => {
  if (!isExtension()) return demoTabs;
  const tabs = await chrome.tabs.query({ currentWindow: true });
  return tabs.map((tab, index) => ({
    id: tab.id ?? -1,
    title: tab.title ?? 'Untitled',
    url: tab.url ?? '',
    favicon: tab.favIconUrl ?? '',
    active: tab.active,
    audible: tab.audible ?? false,
    muted: tab.mutedInfo?.muted ?? false,
    pinned: tab.pinned,
    index,
  }));
};

export const getMediaSessions = async (): Promise<MediaSession[]> => {
  if (!isExtension()) return demoMedia;
  return (await runtimeRequest<MediaSession[]>({ type: 'GET_MEDIA' })) ?? [];
};

export const activateTab = async (tabId: number) => {
  if (!isExtension()) return;
  await chrome.tabs.update(tabId, { active: true });
};

export const closeTab = async (tabId: number) => {
  if (!isExtension()) return;
  await chrome.tabs.remove(tabId);
};

export const createTab = async () => {
  if (!isExtension()) {
    window.location.reload();
    return;
  }
  await chrome.tabs.create({});
};

export const setTabMuted = async (tabId: number, muted: boolean) => {
  if (!isExtension()) return;
  await chrome.tabs.update(tabId, { muted });
};

export const sendMediaCommand = async (tabId: number, command: 'play' | 'pause' | 'toggle') => {
  await runtimeRequest({ type: 'MEDIA_COMMAND', tabId, command });
};

export const navigateCurrentTab = async (url: string) => {
  if (!isExtension()) {
    window.location.assign(url);
    return;
  }
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  if (tab?.id) await chrome.tabs.update(tab.id, { url });
};

export const getFaviconUrl = (siteUrl: string) => {
  try {
    const hostname = new URL(siteUrl).hostname;
    return `https://www.google.com/s2/favicons?domain=${encodeURIComponent(hostname)}&sz=128`;
  } catch {
    return '';
  }
};
