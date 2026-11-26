import { useCallback, useEffect, useState } from 'react';
import { getBrowserTabs } from './browser';
import { isExtension } from './extension';
import type { BrowserTab } from '../types/lumora';

export const useBrowserTabs = () => {
  const [tabs, setTabs] = useState<BrowserTab[]>([]);

  const refresh = useCallback(async () => {
    setTabs(await getBrowserTabs());
  }, []);

  useEffect(() => {
    void refresh();
    if (!isExtension()) return;

    const listener = (message: { type?: string }) => {
      if (message.type === 'LUMORA_TABS_CHANGED') void refresh();
    };
    chrome.runtime.onMessage.addListener(listener);
    return () => chrome.runtime.onMessage.removeListener(listener);
  }, [refresh]);

  return { tabs, refresh };
};
