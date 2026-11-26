import { useEffect, useRef, useState } from 'react';
import { Settings2, Star, X } from 'lucide-react';
import { famousSites } from '../data/famousSites';
import { navigateCurrentTab } from '../lib/browser';
import { useLumoraStore } from '../store/useLumoraStore';
import BrandIcon from './BrandIcon';
import { IconButton } from './Controls';

function CustomFavicon({ url, name }: { url: string; name: string }) {
  const [failed, setFailed] = useState(false);
  let favicon = '';
  try {
    favicon = `https://www.google.com/s2/favicons?domain=${encodeURIComponent(new URL(url).hostname)}&sz=128`;
  } catch {
    favicon = '';
  }
  return failed || !favicon ? <span className="site-monogram">{name.charAt(0).toUpperCase()}</span> : <img src={favicon} alt="" onError={() => setFailed(true)} />;
}

export default function StarredSitesChip({ onOpenSettings }: { onOpenSettings: () => void }) {
  const [open, setOpen] = useState(false);
  const hostRef = useRef<HTMLDivElement>(null);
  const settings = useLumoraStore((state) => state.settings);
  const sites = [
    ...famousSites.filter((site) => settings.starredSiteIds.includes(site.id)),
    ...settings.customSites.map((site) => ({ ...site, color: '#9fc9ec', icon: 'custom' as const })),
  ];

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!hostRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  return (
    <div className="dock-popover-host" ref={hostRef}>
      {open && (
        <div className="starred-popover glass-panel" role="dialog" aria-label="Starred sites">
          <div className="popover-topline">
            <div><span className="eyebrow">Your shortcuts</span><h3>Starred Sites</h3></div>
            <IconButton label="Close starred sites" onClick={() => setOpen(false)}><X size={14} /></IconButton>
          </div>
          {sites.length ? (
            <div className="starred-grid">
              {sites.map((site) => (
                <button type="button" key={site.id} className="starred-site" onClick={() => { setOpen(false); void navigateCurrentTab(site.url); }}>
                  <span className="site-icon" style={{ color: site.color }}>
                    {site.icon === 'custom' ? <CustomFavicon url={site.url} name={site.name} /> : <BrandIcon name={site.icon} size={23} />}
                  </span>
                  <span>{site.name}</span>
                </button>
              ))}
            </div>
          ) : (
            <div className="empty-state"><Star size={22} strokeWidth={1.4} /><p>No shortcuts yet.</p></div>
          )}
          <button type="button" className="manage-sites" onClick={() => { setOpen(false); onOpenSettings(); }}>
            <Settings2 size={14} strokeWidth={1.6} /> Manage sites
          </button>
        </div>
      )}
      <button type="button" className="dock-chip glass-panel" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <Star size={15} strokeWidth={1.6} aria-hidden="true" />
        <span>Starred</span>
        {sites.length > 0 && <span className="chip-count">{sites.length}</span>}
      </button>
    </div>
  );
}
