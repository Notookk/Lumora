import { useEffect, useState } from 'react';
import { Plus, Volume2, VolumeX, X } from 'lucide-react';
import { activateTab, closeTab, createTab } from '../lib/browser';
import type { BrowserTab } from '../types/lumora';

function TabFavicon({ tab }: { tab: BrowserTab }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [tab.favicon]);

  return (
    <span className="tab-favicon" aria-hidden="true">
      {tab.favicon && !failed ? (
        <img src={tab.favicon} alt="" onError={() => setFailed(true)} />
      ) : (
        <span>{tab.title.trim().charAt(0).toUpperCase() || '•'}</span>
      )}
    </span>
  );
}

export default function VerticalTabRail({ tabs }: { tabs: BrowserTab[] }) {
  return (
    <aside className="tab-rail" aria-label="Open tabs">
      <div className="tab-rail-inner glass-panel">
        <div className="tab-rail-list">
          {tabs.map((tab) => (
            <div className={`tab-row ${tab.active ? 'is-active' : ''}`} key={tab.id}>
              <span className="active-tab-indicator" aria-hidden="true" />
              <button
                type="button"
                className="tab-main"
                onClick={() => void activateTab(tab.id)}
                onAuxClick={(event) => {
                  if (event.button === 1) {
                    event.preventDefault();
                    void closeTab(tab.id);
                  }
                }}
                title={tab.title}
                aria-label={`Switch to ${tab.title}`}
              >
                <TabFavicon tab={tab} />
                <span className="tab-title">{tab.title}</span>
                {tab.audible && !tab.muted && <Volume2 className="tab-audio" size={13} strokeWidth={1.7} aria-label="Playing audio" />}
                {tab.muted && <VolumeX className="tab-audio is-muted" size={13} strokeWidth={1.7} aria-label="Muted" />}
              </button>
              <button type="button" className="tab-close" onClick={() => void closeTab(tab.id)} aria-label={`Close ${tab.title}`}>
                <X size={13} strokeWidth={1.7} />
              </button>
            </div>
          ))}
        </div>
        <button type="button" className="new-tab-button" onClick={() => void createTab()} aria-label="New tab" title="New tab">
          <Plus size={18} strokeWidth={1.6} />
          <span>New Tab</span>
        </button>
      </div>
    </aside>
  );
}
