import { useEffect, useState } from 'react';
import { BellOff, Moon, Trash2 } from 'lucide-react';
import type { LumoraSettings } from '../types/lumora';
import type { NotificationItem } from '../lib/useNotifications';
import MochiAvatar from './MochiAvatar';
import NotificationCard from './NotificationCard';
import { IconButton } from './Controls';

export default function MochiNotifications({
  settings,
  items,
  onDismiss,
  onClear,
}: {
  settings: LumoraSettings;
  items: NotificationItem[];
  onDismiss: (id: string) => void;
  onClear: () => void;
}) {
  const [expanded, setExpanded] = useState(true);
  const [celebrating, setCelebrating] = useState(false);
  const activeItems = items.filter((item) => !item.exiting);

  useEffect(() => {
    if (!activeItems.length) return;
    setCelebrating(true);
    const timer = window.setTimeout(() => setCelebrating(false), 850);
    return () => window.clearTimeout(timer);
  }, [activeItems[0]?.id]);

  useEffect(() => {
    if (!items.length) setExpanded(true);
  }, [items.length]);

  if (!settings.mochiEnabled || !items.length) return null;

  return (
    <aside className={`mochi-panel ${settings.doNotDisturb ? 'is-dnd' : ''}`} aria-label="Mochi notifications">
      <button type="button" className="mochi-trigger" onClick={() => setExpanded((value) => !value)} aria-expanded={expanded} aria-label="Toggle Mochi notifications">
        <MochiAvatar glow={settings.mochiGlow} doNotDisturb={settings.doNotDisturb} celebrating={celebrating} />
        {activeItems.length > 0 && !expanded && <span className="mochi-badge">{activeItems.length}</span>}
      </button>
      {expanded && !settings.doNotDisturb && (
        <div className="notification-stack">
          <div className="notification-stack-header">
            <span><i /> Mochi</span>
            <IconButton label="Clear all notifications" onClick={onClear}><Trash2 size={13} strokeWidth={1.6} /></IconButton>
          </div>
          {items.map((notification) => (
            <NotificationCard key={notification.id} notification={notification} onDismiss={onDismiss} />
          ))}
        </div>
      )}
      {expanded && settings.doNotDisturb && (
        <div className="dnd-pill glass-panel"><BellOff size={13} strokeWidth={1.6} /><span>Do Not Disturb</span><Moon size={12} strokeWidth={1.6} /></div>
      )}
    </aside>
  );
}
