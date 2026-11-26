import { useEffect, useRef, useState } from 'react';
import {
  Bell,
  Check,
  ChevronRight,
  CloudUpload,
  Eye,
  EyeOff,
  Image,
  LocateFixed,
  Monitor,
  Palette,
  Plus,
  RotateCcw,
  SlidersHorizontal,
  Sparkles,
  Star,
  Trash2,
  X,
} from 'lucide-react';
import { famousSites } from '../data/famousSites';
import { deleteWallpaper, saveWallpaper } from '../lib/wallpaperDb';
import { defaultSettings, useLumoraStore } from '../store/useLumoraStore';
import type { CustomSite, MochiGlow, WallpaperPreset } from '../types/lumora';
import BrandIcon from './BrandIcon';
import { IconButton, SettingRow, SettingSection, Toggle } from './Controls';

type SettingsTab = 'general' | 'apis' | 'sites' | 'mochi';

const tabs: Array<{ id: SettingsTab; label: string; icon: typeof SlidersHorizontal }> = [
  { id: 'general', label: 'General', icon: SlidersHorizontal },
  { id: 'apis', label: 'APIs & AI', icon: Sparkles },
  { id: 'sites', label: 'Starred Sites', icon: Star },
  { id: 'mochi', label: 'Mochi', icon: Bell },
];

const wallpapers: Array<{ id: WallpaperPreset; label: string }> = [
  { id: 'clouds', label: 'Midnight' },
  { id: 'glacier', label: 'Glacier' },
  { id: 'ember', label: 'Ember' },
  { id: 'graphite', label: 'Graphite' },
];

const glowOptions: Array<{ id: MochiGlow; label: string }> = [
  { id: 'ice', label: 'Ice Blue' },
  { id: 'pearl', label: 'Warm Pearl' },
  { id: 'mint', label: 'Soft Mint' },
  { id: 'lavender', label: 'Lavender' },
];

export default function SettingsDrawer({
  open,
  initialTab = 'general',
  onClose,
  onTestNotification,
  onClearNotifications,
}: {
  open: boolean;
  initialTab?: SettingsTab;
  onClose: () => void;
  onTestNotification: () => void;
  onClearNotifications: () => void;
}) {
  const [tab, setTab] = useState<SettingsTab>(initialTab);
  const [wallpaperUrl, setWallpaperUrl] = useState('');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [showWeatherKey, setShowWeatherKey] = useState(false);
  const [siteName, setSiteName] = useState('');
  const [siteUrl, setSiteUrl] = useState('');
  const [notice, setNotice] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);
  const { settings, updateSettings } = useLumoraStore();

  useEffect(() => {
    if (open) {
      setTab(initialTab);
      setWallpaperUrl(settings.wallpaperUrl);
      setNotice('');
      window.setTimeout(() => closeRef.current?.focus(), 60);
    }
  }, [open, initialTab]);

  useEffect(() => {
    if (!open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [open, onClose]);

  if (!open) return null;

  const toggleStarred = (id: string) => {
    const starred = settings.starredSiteIds.includes(id);
    void updateSettings({
      starredSiteIds: starred
        ? settings.starredSiteIds.filter((siteId) => siteId !== id)
        : [...settings.starredSiteIds, id],
    });
  };

  const applyWallpaperUrl = () => {
    try {
      const url = new URL(/^https?:\/\//i.test(wallpaperUrl) ? wallpaperUrl : `https://${wallpaperUrl}`);
      if (!['http:', 'https:'].includes(url.protocol)) throw new Error('Invalid protocol');
      void updateSettings({ wallpaper: 'custom-url', wallpaperUrl: url.toString() });
      setNotice('Wallpaper URL applied.');
    } catch {
      setNotice('Enter a valid image URL.');
    }
  };

  const uploadWallpaper = async (file?: File) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setNotice('Choose an image file.');
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setNotice('Choose an image smaller than 20 MB.');
      return;
    }
    try {
      await saveWallpaper(file);
      await updateSettings({ wallpaper: 'custom-upload' });
      setNotice('Wallpaper saved locally.');
    } catch {
      setNotice('The wallpaper could not be saved.');
    }
  };

  const addCustomSite = () => {
    const name = siteName.trim();
    if (!name || !siteUrl.trim()) {
      setNotice('Enter a site name and URL.');
      return;
    }
    try {
      const url = new URL(/^https?:\/\//i.test(siteUrl) ? siteUrl : `https://${siteUrl}`);
      if (!['http:', 'https:'].includes(url.protocol) || !url.hostname.includes('.')) throw new Error('Invalid URL');
      const site: CustomSite = { id: `custom-${globalThis.crypto.randomUUID()}`, name: name.slice(0, 32), url: url.toString() };
      void updateSettings({ customSites: [...settings.customSites, site], starredSiteIds: [...settings.starredSiteIds, site.id] });
      setSiteName('');
      setSiteUrl('');
      setNotice(`${site.name} added.`);
    } catch {
      setNotice('Enter a valid site URL.');
    }
  };

  const useCurrentLocation = () => {
    if (!navigator.geolocation) {
      setNotice('Geolocation is not available.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        void updateSettings({ latitude: position.coords.latitude, longitude: position.coords.longitude, weatherCity: '' });
        setNotice('Location updated.');
      },
      () => setNotice('Location access was not granted.'),
      { timeout: 8000, maximumAge: 600000 },
    );
  };

  return (
    <div className="settings-layer">
      <button type="button" className="drawer-backdrop" aria-label="Close settings" onClick={onClose} />
      <aside className="settings-drawer glass-panel" role="dialog" aria-modal="true" aria-labelledby="settings-title">
        <header className="settings-header">
          <div>
            <span className="eyebrow">Your workspace</span>
            <h2 id="settings-title">LUMORA Settings</h2>
          </div>
          <button ref={closeRef} type="button" className="icon-button" aria-label="Close settings" onClick={onClose}><X size={18} /></button>
        </header>

        <nav className="settings-tabs" aria-label="Settings sections">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button type="button" key={id} className={tab === id ? 'is-active' : ''} onClick={() => { setTab(id); setNotice(''); }} aria-current={tab === id ? 'page' : undefined}>
              <Icon size={15} strokeWidth={1.6} /><span>{label}</span>
            </button>
          ))}
        </nav>

        <div className="settings-content">
          {tab === 'general' && (
            <>
              <SettingSection title="Identity" description="The first thing you see when a new tab opens.">
                <SettingRow title="Hero mode">
                  <div className="segmented compact">
                    <button type="button" className={settings.heroMode === 'custom' ? 'is-active' : ''} onClick={() => void updateSettings({ heroMode: 'custom' })}>Custom</button>
                    <button type="button" className={settings.heroMode === 'day' ? 'is-active' : ''} onClick={() => void updateSettings({ heroMode: 'day' })}>Auto-Day</button>
                  </div>
                </SettingRow>
                {settings.heroMode === 'custom' && (
                  <label className="field-label">Custom word or name
                    <input value={settings.customHero} maxLength={18} onChange={(event) => void updateSettings({ customHero: event.target.value })} placeholder="LUMORA" />
                  </label>
                )}
                <SettingRow title="Search engine">
                  <select value={settings.searchEngine} onChange={(event) => void updateSettings({ searchEngine: event.target.value as typeof settings.searchEngine })}>
                    <option value="google">Google</option><option value="duckduckgo">DuckDuckGo</option><option value="perplexity">Perplexity</option><option value="bing">Bing</option>
                  </select>
                </SettingRow>
                <SettingRow title="Clock format">
                  <div className="segmented compact">
                    <button type="button" className={!settings.hour12 ? 'is-active' : ''} onClick={() => void updateSettings({ hour12: false })}>24h</button>
                    <button type="button" className={settings.hour12 ? 'is-active' : ''} onClick={() => void updateSettings({ hour12: true })}>12h</button>
                  </div>
                </SettingRow>
              </SettingSection>

              <SettingSection title="Atmosphere" description="Local wallpapers, tuned glass, and a little darkness.">
                <div className="wallpaper-grid">
                  {wallpapers.map((wallpaper) => (
                    <button type="button" key={wallpaper.id} className={`wallpaper-option preset-${wallpaper.id} ${settings.wallpaper === wallpaper.id ? 'is-active' : ''}`} onClick={() => void updateSettings({ wallpaper: wallpaper.id })}>
                      {wallpaper.id === 'clouds' && <img src="/wallpapers/default-clouds.webp" alt="" />}
                      <span>{wallpaper.label}</span>
                      {settings.wallpaper === wallpaper.id && <i><Check size={12} /></i>}
                    </button>
                  ))}
                </div>
                <label className="field-label">Image URL
                  <div className="input-action">
                    <input value={wallpaperUrl} onChange={(event) => setWallpaperUrl(event.target.value)} placeholder="https://example.com/wallpaper.jpg" />
                    <button type="button" onClick={applyWallpaperUrl}>Apply</button>
                  </div>
                </label>
                <input ref={fileRef} className="visually-hidden" type="file" accept="image/*" onChange={(event) => void uploadWallpaper(event.target.files?.[0])} />
                <div className="button-row">
                  <button type="button" className="secondary-button" onClick={() => fileRef.current?.click()}><CloudUpload size={15} /> Upload image</button>
                  {settings.wallpaper === 'custom-upload' && <button type="button" className="text-button" onClick={() => { void deleteWallpaper(); void updateSettings({ wallpaper: 'clouds' }); }}><Trash2 size={14} /> Remove</button>}
                </div>
                <SettingRow title={`Background dim · ${settings.dim}%`}><input className="range" type="range" min="0" max="75" value={settings.dim} onChange={(event) => void updateSettings({ dim: Number(event.target.value) })} /></SettingRow>
                <SettingRow title={`Vignette · ${settings.vignette}%`}><input className="range" type="range" min="0" max="70" value={settings.vignette} onChange={(event) => void updateSettings({ vignette: Number(event.target.value) })} /></SettingRow>
                <SettingRow title={`Glass blur · ${settings.glassBlur}px`}><input className="range" type="range" min="8" max="40" value={settings.glassBlur} onChange={(event) => void updateSettings({ glassBlur: Number(event.target.value) })} /></SettingRow>
                <SettingRow title="Hide media chip when idle" description="Keep the bottom dock minimal when nothing is playing."><Toggle checked={settings.mediaAutoHide} onChange={(value) => void updateSettings({ mediaAutoHide: value })} label="Hide media chip when idle" /></SettingRow>
              </SettingSection>
            </>
          )}

          {tab === 'apis' && (
            <>
              <SettingSection title="Gemini AI" description="An optional streaming assistant, opened with Alt + L.">
                <SettingRow title="Enable AI sidebar"><Toggle checked={settings.aiEnabled} onChange={(value) => void updateSettings({ aiEnabled: value })} label="Enable AI sidebar" /></SettingRow>
                <label className="field-label">Gemini API key
                  <div className="secret-input">
                    <input type={showGeminiKey ? 'text' : 'password'} value={settings.geminiKey} onChange={(event) => void updateSettings({ geminiKey: event.target.value })} placeholder="AIza..." autoComplete="off" />
                    <button type="button" aria-label={showGeminiKey ? 'Hide API key' : 'Show API key'} onClick={() => setShowGeminiKey((value) => !value)}>{showGeminiKey ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </label>
                <p className="helper-copy">Stored only in this browser. Requests go directly to Google Gemini. <a href="https://aistudio.google.com/app/apikey" target="_blank" rel="noreferrer">Get a key <ChevronRight size={12} /></a></p>
              </SettingSection>

              <SettingSection title="Weather" description="Open-Meteo works without a key. OpenWeatherMap is optional.">
                <SettingRow title="Show weather"><Toggle checked={settings.weatherEnabled} onChange={(value) => void updateSettings({ weatherEnabled: value })} label="Show weather" /></SettingRow>
                <label className="field-label">City override
                  <input value={settings.weatherCity} onChange={(event) => void updateSettings({ weatherCity: event.target.value })} placeholder="Use current location" />
                </label>
                <button type="button" className="secondary-button" onClick={useCurrentLocation}><LocateFixed size={15} /> Use my location</button>
                <label className="field-label">OpenWeatherMap API key <span className="optional">Optional</span>
                  <div className="secret-input">
                    <input type={showWeatherKey ? 'text' : 'password'} value={settings.weatherApiKey} onChange={(event) => void updateSettings({ weatherApiKey: event.target.value })} placeholder="Stored locally" autoComplete="off" />
                    <button type="button" aria-label={showWeatherKey ? 'Hide weather API key' : 'Show weather API key'} onClick={() => setShowWeatherKey((value) => !value)}>{showWeatherKey ? <EyeOff size={15} /> : <Eye size={15} />}</button>
                  </div>
                </label>
              </SettingSection>
              <div className="privacy-note"><Monitor size={16} /><p>No Lumora server, account, analytics, or tracking. API keys never leave this browser except in direct requests to the provider you configure.</p></div>
            </>
          )}

          {tab === 'sites' && (
            <>
              <SettingSection title="Curated shortcuts" description="Choose the sites that appear in your Starred dock.">
                <div className="catalog-grid">
                  {famousSites.map((site) => {
                    const active = settings.starredSiteIds.includes(site.id);
                    return (
                      <button type="button" key={site.id} className={`catalog-site ${active ? 'is-active' : ''}`} onClick={() => toggleStarred(site.id)} aria-pressed={active}>
                        <span style={{ color: site.color }}><BrandIcon name={site.icon} size={20} /></span>
                        <span>{site.name}</span>
                        <i>{active && <Check size={11} />}</i>
                      </button>
                    );
                  })}
                </div>
              </SettingSection>
              <SettingSection title="Custom sites" description="Add a name and URL. Favicons load from Google's favicon service with a monogram fallback.">
                <div className="custom-site-form">
                  <input value={siteName} onChange={(event) => setSiteName(event.target.value)} placeholder="Name" maxLength={32} />
                  <input value={siteUrl} onChange={(event) => setSiteUrl(event.target.value)} placeholder="https://example.com" />
                  <button type="button" className="primary-button" onClick={addCustomSite}><Plus size={15} /> Add</button>
                </div>
                {settings.customSites.length > 0 && (
                  <div className="custom-site-list">
                    {settings.customSites.map((site) => (
                      <div key={site.id}>
                        <span><strong>{site.name}</strong><small>{site.url}</small></span>
                        <IconButton label={`Remove ${site.name}`} onClick={() => void updateSettings({ customSites: settings.customSites.filter((item) => item.id !== site.id), starredSiteIds: settings.starredSiteIds.filter((id) => id !== site.id) })}><Trash2 size={14} /></IconButton>
                      </div>
                    ))}
                  </div>
                )}
              </SettingSection>
            </>
          )}

          {tab === 'mochi' && (
            <>
              <SettingSection title="Companion" description="A compact original squircle that appears only when a notification arrives.">
                <SettingRow title="Enable Mochi & notifications"><Toggle checked={settings.mochiEnabled} onChange={(value) => void updateSettings({ mochiEnabled: value })} label="Enable Mochi and notifications" /></SettingRow>
                <SettingRow title="Do Not Disturb" description="Mochi sleeps and the notification stack stays hidden."><Toggle checked={settings.doNotDisturb} onChange={(value) => void updateSettings({ doNotDisturb: value })} label="Do Not Disturb" /></SettingRow>
                <div className="field-label">Glow color
                  <div className="glow-options">
                    {glowOptions.map((glow) => (
                      <button type="button" key={glow.id} className={`glow-option glow-${glow.id} ${settings.mochiGlow === glow.id ? 'is-active' : ''}`} onClick={() => void updateSettings({ mochiGlow: glow.id })}><i /><span>{glow.label}</span>{settings.mochiGlow === glow.id && <Check size={13} />}</button>
                    ))}
                  </div>
                </div>
              </SettingSection>
              <SettingSection title="Notification tools" description="Downloads and Lumora events appear here. The queue keeps the three newest cards.">
                <div className="button-row">
                  <button type="button" className="primary-button" onClick={onTestNotification}><Sparkles size={15} /> Send test notification</button>
                  <button type="button" className="secondary-button" onClick={onClearNotifications}><Trash2 size={15} /> Clear all</button>
                </div>
              </SettingSection>
            </>
          )}
          {notice && <p className="settings-notice" role="status">{notice}</p>}
        </div>

        <footer className="settings-footer">
          <span><Palette size={13} /> Made for a quieter browser.</span>
          <button type="button" className="text-button" onClick={() => { void updateSettings(defaultSettings); setNotice('Settings restored to defaults.'); }}><RotateCcw size={13} /> Reset</button>
        </footer>
      </aside>
    </div>
  );
}
