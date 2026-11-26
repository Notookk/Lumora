import { useEffect, useState } from 'react';
import { Download, Info, Sparkles, X } from 'lucide-react';
import type { NotificationItem } from '../lib/useNotifications';
import { IconButton } from './Controls';

const relativeTime = (timestamp: number) => {
  const seconds = Math.max(0, Math.floor((Date.now() - timestamp) / 1000));
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
};

export default function NotificationCard({
  notification,
  onDismiss,
}: {
  notification: NotificationItem;
  onDismiss: (id: string) => void;
}) {
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    const interval = window.setInterval(() => setNow(Date.now()), 30000);
    return () => window.clearInterval(interval);
  }, []);

  const Icon = notification.source === 'download' ? Download : notification.source === 'lumora' ? Sparkles : Info;
  return (
    <article className={`notification-card glass-panel ${notification.exiting ? 'is-exiting' : ''}`} role="status">
      <span className={`notification-source source-${notification.source}`}><Icon size={16} strokeWidth={1.6} /></span>
      <div className="notification-copy">
        <strong>{notification.title}</strong>
        <p>{notification.body}</p>
      </div>
      <div className="notification-meta">
        <time dateTime={new Date(notification.createdAt).toISOString()}>{relativeTime(now)}</time>
        <IconButton label="Dismiss notification" onClick={() => onDismiss(notification.id)}><X size={13} /></IconButton>
      </div>
    </article>
  );
}
