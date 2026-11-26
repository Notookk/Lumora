import { useCallback, useEffect, useState } from 'react';
import { getMediaSessions } from './browser';
import { isExtension } from './extension';
import type { MediaSession } from '../types/lumora';

export const useMediaSessions = () => {
  const [sessions, setSessions] = useState<MediaSession[]>([]);

  const refresh = useCallback(async () => {
    setSessions(await getMediaSessions());
  }, []);

  useEffect(() => {
    void refresh();
    if (!isExtension()) return;

    const listener = (message: { type?: string; sessions?: MediaSession[] }) => {
      if (message.type === 'LUMORA_MEDIA_CHANGED' && message.sessions) setSessions(message.sessions);
    };
    chrome.runtime.onMessage.addListener(listener);
    const interval = window.setInterval(() => void refresh(), 3000);
    return () => {
      chrome.runtime.onMessage.removeListener(listener);
      window.clearInterval(interval);
    };
  }, [refresh]);

  return { sessions, refresh };
};
