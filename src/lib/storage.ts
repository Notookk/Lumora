import { isExtension } from './extension';
import type { LumoraSettings } from '../types/lumora';

const SETTINGS_KEY = 'lumoraSettings';

export const loadSettings = async (): Promise<Partial<LumoraSettings> | undefined> => {
  if (isExtension()) {
    const result = await chrome.storage.local.get(SETTINGS_KEY);
    return result[SETTINGS_KEY] as Partial<LumoraSettings> | undefined;
  }

  const stored = localStorage.getItem(SETTINGS_KEY);
  if (!stored) return undefined;
  try {
    return JSON.parse(stored) as Partial<LumoraSettings>;
  } catch {
    return undefined;
  }
};

export const saveSettings = async (settings: LumoraSettings): Promise<void> => {
  if (isExtension()) {
    await chrome.storage.local.set({ [SETTINGS_KEY]: settings });
    return;
  }
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const subscribeToSettings = (callback: (settings: Partial<LumoraSettings>) => void) => {
  if (isExtension()) {
    const listener = (changes: Record<string, chrome.storage.StorageChange>, area: string) => {
      if (area === 'local' && changes[SETTINGS_KEY]?.newValue) {
        callback(changes[SETTINGS_KEY].newValue as Partial<LumoraSettings>);
      }
    };
    chrome.storage.onChanged.addListener(listener);
    return () => chrome.storage.onChanged.removeListener(listener);
  }

  const listener = (event: StorageEvent) => {
    if (event.key === SETTINGS_KEY && event.newValue) {
      callback(JSON.parse(event.newValue) as Partial<LumoraSettings>);
    }
  };
  window.addEventListener('storage', listener);
  return () => window.removeEventListener('storage', listener);
};
