import { useCallback, useEffect, useState, type CSSProperties } from 'react';
import { Settings2, Sparkles } from 'lucide-react';
import AISidebar from './components/AISidebar';
import BottomDock from './components/BottomDock';
import HeroDisplay from './components/HeroDisplay';
import MochiNotifications from './components/MochiNotifications';
import SearchBar from './components/SearchBar';
import SettingsDrawer from './components/SettingsDrawer';
import VerticalTabRail from './components/VerticalTabRail';
import { isExtension } from './lib/extension';
import { useBrowserTabs } from './lib/useBrowserTabs';
import { useMediaSessions } from './lib/useMediaSessions';
import { useNotifications } from './lib/useNotifications';
import { loadWallpaper } from './lib/wallpaperDb';
import { useLumoraStore } from './store/useLumoraStore';
import type { LumoraNotification } from './types/lumora';

type SettingsTab = 'general' | 'apis' | 'sites' | 'mochi';

export default function App() {
  const settings = useLumoraStore((state) => state.settings);
  const hydrate = useLumoraStore((state) => state.hydrate);
  const { tabs } = useBrowserTabs();
  const { sessions, refresh: refreshMedia } = useMediaSessions();
  const { items, push, dismiss, clear } = useNotifications();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [settingsTab, setSettingsTab] = useState<SettingsTab>('general');
  const [aiOpen, setAiOpen] = useState(false);
  const [customWallpaper, setCustomWallpaper] = useState('');

  useEffect(() => {
    void hydrate();
  }, [hydrate]);

  const openSettings = useCallback((tab: SettingsTab = 'general') => {
    setSettingsTab(tab);
    setSettingsOpen(true);
  }, []);

  useEffect(() => {
    if (!settings.aiEnabled) setAiOpen(false);
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.altKey && event.key.toLowerCase() === 'l' && settings.aiEnabled) {
        event.preventDefault();
        setAiOpen((value) => !value);
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [settings.aiEnabled]);

  useEffect(() => {
    if (!isExtension()) return;
    const listener = (message: { type?: string; notification?: LumoraNotification }) => {
      if (message.type === 'LUMORA_NOTIFICATION' && message.notification) {
        const { id: _id, createdAt: _createdAt, ...notification } = message.notification;
        push(notification);
      }
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [push]);

  useEffect(() => {
    if (settings.wallpaper !== 'custom-upload') {
      setCustomWallpaper('');
      return;
    }
    let objectUrl = '';
    let cancelled = false;
    void loadWallpaper().then((blob) => {
      if (!blob || cancelled) return;
      objectUrl = URL.createObjectURL(blob);
      setCustomWallpaper(objectUrl);
    }).catch(() => setCustomWallpaper(''));
    return () => {
      cancelled = true;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [settings.wallpaper]);

  const wallpaperImage = settings.wallpaper === 'custom-upload'
    ? customWallpaper
    : settings.wallpaper === 'custom-url'
      ? settings.wallpaperUrl
      : settings.wallpaper === 'clouds'
        ? '/wallpapers/default-clouds.webp'
        : '';

  const appStyle = {
    '--glass-blur': `${settings.glassBlur}px`,
    '--wallpaper-dim': settings.dim / 100,
    '--vignette-opacity': settings.vignette / 100,
  } as CSSProperties;

  return (
    <div className={`lumora-app preset-${settings.wallpaper}`} style={appStyle}>
      <div className="wallpaper" style={wallpaperImage ? { backgroundImage: `url("${wallpaperImage.replaceAll('"', '%22')}")` } : undefined} aria-hidden="true" />
      <div className="wallpaper-dim" aria-hidden="true" />
      <div className="wallpaper-vignette" aria-hidden="true" />
      <div className="wallpaper-grain" aria-hidden="true" />

      <SearchBar />
      <HeroDisplay onOpenSettings={() => openSettings('general')} />
      <VerticalTabRail tabs={tabs} />
      <BottomDock sessions={sessions} onRefreshMedia={refreshMedia} onOpenSettings={() => openSettings('sites')} />

      <div className={`utility-controls ${settings.mochiEnabled ? '' : 'mochi-off'}`}>
        {settings.aiEnabled && (
          <button type="button" className="utility-button glass-panel" onClick={() => setAiOpen(true)} aria-label="Open AI sidebar" title="Open AI sidebar (Alt + L)">
            <Sparkles size={16} strokeWidth={1.5} />
          </button>
        )}
        <button type="button" className="utility-button glass-panel" onClick={() => openSettings('general')} aria-label="Open settings" title="Settings">
          <Settings2 size={17} strokeWidth={1.5} />
        </button>
      </div>

      <MochiNotifications settings={settings} items={items} onDismiss={dismiss} onClear={clear} />

      {settings.aiEnabled && (
        <button type="button" className={`ai-trigger glass-panel ${aiOpen ? 'is-hidden' : ''}`} onClick={() => setAiOpen(true)} aria-label="Open Lumora AI" title="Lumora AI (Alt + L)">
          <Sparkles size={17} strokeWidth={1.5} /><span>AI</span>
        </button>
      )}

      <AISidebar open={aiOpen} onClose={() => setAiOpen(false)} />
      <SettingsDrawer
        open={settingsOpen}
        initialTab={settingsTab}
        onClose={() => setSettingsOpen(false)}
        onTestNotification={() => push({ title: 'Hello from Mochi', body: 'Your notification queue is alive and glowing.', source: 'lumora' })}
        onClearNotifications={clear}
      />
    </div>
  );
}
