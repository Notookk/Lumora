import { useEffect, useRef, useState } from 'react';
import { ArrowUpRight, ChevronLeft, ChevronRight, Music2, Pause, Play, Volume2, VolumeX, X } from 'lucide-react';
import { activateTab, sendMediaCommand, setTabMuted } from '../lib/browser';
import type { MediaSession } from '../types/lumora';
import { IconButton } from './Controls';

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00';
  const minutes = Math.floor(seconds / 60);
  return `${minutes}:${Math.floor(seconds % 60).toString().padStart(2, '0')}`;
};

export default function MediaChip({
  sessions,
  autoHide,
  onRefresh,
}: {
  sessions: MediaSession[];
  autoHide: boolean;
  onRefresh: () => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [optimistic, setOptimistic] = useState<{ paused?: boolean; muted?: boolean }>({});
  const hostRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (activeIndex >= sessions.length) setActiveIndex(0);
  }, [activeIndex, sessions.length]);

  useEffect(() => {
    setOptimistic({});
  }, [sessions[activeIndex]?.tabId]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!hostRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open]);

  if (!sessions.length && autoHide) return null;
  const current = sessions[activeIndex];
  const session = current ? { ...current, ...optimistic } : undefined;
  const artwork = session?.artwork || (session?.source ? `https://www.google.com/s2/favicons?domain=${encodeURIComponent(session.source)}&sz=128` : '');

  const togglePlayback = async () => {
    if (!session) return;
    const paused = !session.paused;
    setOptimistic((value) => ({ ...value, paused }));
    await sendMediaCommand(session.tabId, paused ? 'pause' : 'play');
    void onRefresh();
  };

  const toggleMute = async () => {
    if (!session) return;
    const muted = !session.muted;
    setOptimistic((value) => ({ ...value, muted }));
    await setTabMuted(session.tabId, muted);
    void onRefresh();
  };

  return (
    <div className="dock-popover-host" ref={hostRef}>
      {open && session && (
        <div className="media-popover glass-panel" role="dialog" aria-label="Media player">
          <div className="popover-topline">
            <span>Now Playing</span>
            <IconButton label="Close media player" onClick={() => setOpen(false)}><X size={14} /></IconButton>
          </div>
          <div className="media-identity">
            <div className="media-artwork">
              {artwork ? <img src={artwork} alt="" /> : <Music2 size={24} strokeWidth={1.4} />}
            </div>
            <div className="media-copy">
              <strong>{session.title}</strong>
              <span>{session.artist || session.source}</span>
            </div>
          </div>
          <div className="media-progress" aria-label={`${formatTime(session.currentTime)} of ${formatTime(session.duration)}`}>
            <span style={{ transform: `scaleX(${session.duration ? Math.min(session.currentTime / session.duration, 1) : 0})` }} />
          </div>
          <div className="media-times"><span>{formatTime(session.currentTime)}</span><span>{formatTime(session.duration)}</span></div>
          <div className="media-controls">
            {sessions.length > 1 && (
              <IconButton label="Previous media tab" onClick={() => setActiveIndex((index) => (index - 1 + sessions.length) % sessions.length)}>
                <ChevronLeft size={17} />
              </IconButton>
            )}
            <button type="button" className="media-play" onClick={() => void togglePlayback()} aria-label={session.paused ? 'Play' : 'Pause'}>
              {session.paused ? <Play size={19} fill="currentColor" /> : <Pause size={19} fill="currentColor" />}
            </button>
            <IconButton label={session.muted ? 'Unmute tab' : 'Mute tab'} onClick={() => void toggleMute()}>
              {session.muted ? <VolumeX size={17} /> : <Volume2 size={17} />}
            </IconButton>
            <IconButton label="Jump to media tab" onClick={() => void activateTab(session.tabId)}>
              <ArrowUpRight size={17} />
            </IconButton>
            {sessions.length > 1 && (
              <IconButton label="Next media tab" onClick={() => setActiveIndex((index) => (index + 1) % sessions.length)}>
                <ChevronRight size={17} />
              </IconButton>
            )}
          </div>
          {sessions.length > 1 && <p className="media-count">{activeIndex + 1} of {sessions.length} audible tabs</p>}
        </div>
      )}
      <button type="button" className="dock-chip glass-panel" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        {session && !session.paused ? (
          <span className="audio-visualizer" aria-hidden="true"><i /><i /><i /></span>
        ) : (
          <Music2 size={15} strokeWidth={1.6} aria-hidden="true" />
        )}
        <span>{session?.title || 'No Media'}</span>
      </button>
    </div>
  );
}
