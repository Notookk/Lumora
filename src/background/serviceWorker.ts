import type { BrowserTab, LumoraNotification, MediaSession, RuntimeMessage } from '../types/lumora';

type MediaCommand = Extract<RuntimeMessage, { type: 'MEDIA_COMMAND' }>['command'];
type MediaStateMessage = {
  type: 'MEDIA_STATE';
  session: Omit<MediaSession, 'tabId'>;
};
type ServiceWorkerMessage = Exclude<RuntimeMessage, { type: 'MEDIA_STATE' }> | MediaStateMessage;

interface MediaCommandResponse {
  ok?: boolean;
}

const mediaSessions = new Map<number, MediaSession>();

const noReceiverPattern = /receiving end does not exist/i;
const expectedMessageErrorPatterns = [
  noReceiverPattern,
  /message port closed before a response was received/i,
  /the tab was closed/i,
  /cannot access contents of url/i,
  /cannot access a chrome-extension url/i,
];
const expectedTabErrorPatterns = [
  /no tab with id/i,
  /the tab was closed/i,
  /frame with id .* was removed/i,
  /cannot access contents of url/i,
  /cannot access a chrome-extension url/i,
  /missing host permission/i,
  /manifest must request permission/i,
];

function matchesChromeError(error: unknown, patterns: readonly RegExp[]): boolean {
  return error instanceof Error && patterns.some((pattern) => pattern.test(error.message));
}

function isExpectedRuntimeError(error: unknown): boolean {
  return matchesChromeError(error, [
    ...expectedMessageErrorPatterns,
    /extension context has been invalidated/i,
  ]);
}

function logUnexpectedError(context: string): (error: unknown) => void {
  return (error) => console.error(`[Lumora] ${context}`, error);
}

function toBrowserTab(tab: chrome.tabs.Tab, index: number): BrowserTab | null {
  if (tab.id === undefined) return null;
  return {
    id: tab.id,
    title: tab.title ?? 'Untitled',
    url: tab.url ?? '',
    favicon: tab.favIconUrl ?? '',
    active: tab.active ?? false,
    audible: tab.audible ?? false,
    muted: tab.mutedInfo?.muted ?? false,
    pinned: tab.pinned ?? false,
    index,
  };
}

async function getBrowserTabs(): Promise<BrowserTab[]> {
  const tabs = await chrome.tabs.query({});
  return tabs.flatMap((tab, index) => {
    const mapped = toBrowserTab(tab, index);
    return mapped ? [mapped] : [];
  });
}

function sourceFromUrl(url: string | undefined): string {
  if (!url) return 'unknown';
  try {
    return new URL(url).hostname || 'local media';
  } catch {
    return 'local media';
  }
}

async function getMediaSessions(): Promise<MediaSession[]> {
  const audibleTabs = await chrome.tabs.query({ audible: true });
  return audibleTabs.flatMap((tab) => {
    if (tab.id === undefined) return [];
    const stored = mediaSessions.get(tab.id);
    return [{
      tabId: tab.id,
      title: stored?.title || tab.title || 'Untitled media',
      artist: stored?.artist ?? '',
      artwork: stored?.artwork ?? '',
      source: stored?.source || sourceFromUrl(tab.url),
      paused: stored?.paused ?? false,
      muted: tab.mutedInfo?.muted ?? stored?.muted ?? false,
      currentTime: stored?.currentTime ?? 0,
      duration: stored?.duration ?? 0,
    }];
  });
}

async function broadcast(message: RuntimeMessage): Promise<void> {
  try {
    await chrome.runtime.sendMessage(message);
  } catch (error) {
    if (!isExpectedRuntimeError(error)) throw error;
  }
}

async function broadcastTabsChanged(): Promise<void> {
  await broadcast({ type: 'LUMORA_TABS_CHANGED', tabs: await getBrowserTabs() });
}

async function broadcastMediaChanged(): Promise<void> {
  const sessions = [...mediaSessions.values()].sort((a, b) => a.tabId - b.tabId);
  await broadcast({ type: 'LUMORA_MEDIA_CHANGED', sessions });
}

function sessionsEqual(a: MediaSession | undefined, b: MediaSession): boolean {
  return a !== undefined
    && a.title === b.title
    && a.artist === b.artist
    && a.artwork === b.artwork
    && a.source === b.source
    && a.paused === b.paused
    && a.muted === b.muted
    && a.currentTime === b.currentTime
    && a.duration === b.duration;
}

function isInjectableUrl(url: string | undefined): boolean {
  if (!url) return false;
  try {
    const protocol = new URL(url).protocol;
    return protocol === 'http:' || protocol === 'https:' || protocol === 'file:';
  } catch {
    return false;
  }
}

async function getInjectableTab(tabId: number): Promise<chrome.tabs.Tab | null> {
  try {
    const tab = await chrome.tabs.get(tabId);
    return isInjectableUrl(tab.url) ? tab : null;
  } catch (error) {
    if (matchesChromeError(error, expectedTabErrorPatterns)) return null;
    throw error;
  }
}

async function sendMediaCommand(
  tabId: number,
  command: MediaCommand,
): Promise<MediaCommandResponse | undefined> {
  return await chrome.tabs.sendMessage(tabId, {
    type: 'MEDIA_COMMAND',
    tabId,
    command,
  }) as MediaCommandResponse | undefined;
}

async function relayMediaCommand(tabId: number, command: MediaCommand): Promise<boolean> {
  const tab = await getInjectableTab(tabId);
  if (!tab) return false;

  try {
    const response = await sendMediaCommand(tabId, command);
    return response?.ok !== false;
  } catch (error) {
    if (!matchesChromeError(error, [noReceiverPattern])) {
      if (matchesChromeError(error, expectedMessageErrorPatterns)) return false;
      throw error;
    }
  }

  try {
    await chrome.scripting.executeScript({
      target: { tabId, allFrames: false },
      world: 'ISOLATED',
      files: ['mediaBridge.js'],
    });
  } catch (error) {
    if (matchesChromeError(error, expectedTabErrorPatterns)) return false;
    throw error;
  }

  try {
    const response = await sendMediaCommand(tabId, command);
    return response?.ok !== false;
  } catch (error) {
    if (matchesChromeError(error, expectedMessageErrorPatterns)) return false;
    throw error;
  }
}

async function createNewTab(): Promise<void> {
  await chrome.tabs.create({});
}

async function handleRuntimeMessage(
  message: ServiceWorkerMessage,
  sender: chrome.runtime.MessageSender,
): Promise<unknown> {
  switch (message.type) {
    case 'GET_TABS':
      return getBrowserTabs();
    case 'GET_MEDIA':
      return getMediaSessions();
    case 'MEDIA_STATE': {
      const tabId = sender.tab?.id;
      if (tabId === undefined) return false;
      const session: MediaSession = { ...message.session, tabId };
      const changed = !sessionsEqual(mediaSessions.get(tabId), session);
      mediaSessions.set(tabId, session);
      if (changed) await broadcastMediaChanged();
      return true;
    }
    case 'MEDIA_COMMAND':
      return relayMediaCommand(message.tabId, message.command);
    case 'ACTIVATE_TAB':
      await chrome.tabs.update(message.tabId, { active: true });
      return true;
    case 'CLOSE_TAB':
      await chrome.tabs.remove(message.tabId);
      return true;
    case 'NEW_TAB':
      await createNewTab();
      return true;
    case 'SET_TAB_MUTED':
      await chrome.tabs.update(message.tabId, { muted: message.muted });
      return true;
    default:
      return undefined;
  }
}

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  void handleRuntimeMessage(message as ServiceWorkerMessage, sender).then(
    (response) => sendResponse(response),
    (error: unknown) => {
      console.error('[Lumora] Runtime message failed', error);
      sendResponse({ ok: false });
    },
  ).catch(logUnexpectedError('Could not deliver runtime response'));
  return true;
});

const reportTabError = logUnexpectedError('Tab update broadcast failed');
chrome.tabs.onCreated.addListener(() => {
  void broadcastTabsChanged().catch(reportTabError);
});
chrome.tabs.onRemoved.addListener((tabId) => {
  if (mediaSessions.delete(tabId)) {
    void broadcastMediaChanged().catch(logUnexpectedError('Media removal broadcast failed'));
  }
  void broadcastTabsChanged().catch(reportTabError);
});
chrome.tabs.onUpdated.addListener((tabId, changeInfo) => {
  if (typeof changeInfo.url === 'string' && mediaSessions.delete(tabId)) {
    void broadcastMediaChanged().catch(logUnexpectedError('Media navigation broadcast failed'));
  }
  const muted = changeInfo.mutedInfo?.muted;
  const session = mediaSessions.get(tabId);
  if (muted !== undefined && session && session.muted !== muted) {
    mediaSessions.set(tabId, { ...session, muted });
    void broadcastMediaChanged().catch(logUnexpectedError('Media mute broadcast failed'));
  }
  void broadcastTabsChanged().catch(reportTabError);
});
chrome.tabs.onActivated.addListener(() => {
  void broadcastTabsChanged().catch(reportTabError);
});
chrome.tabs.onMoved.addListener(() => {
  void broadcastTabsChanged().catch(reportTabError);
});

chrome.downloads.onChanged.addListener((delta) => {
  if (delta.state?.current !== 'complete') return;
  void (async () => {
    const [download] = await chrome.downloads.search({ id: delta.id });
    if (!download) return;
    const rawFilename = download.filename
      ?? download.finalUrl?.split(/[\\/]/).filter(Boolean).pop()
      ?? 'Download';
    const filename = rawFilename.split(/[\\/]/).filter(Boolean).pop() ?? rawFilename;
    const notification: LumoraNotification = {
      id: `download-${delta.id}-${Date.now()}`,
      title: 'Download complete',
      body: `${filename} is ready.`,
      source: 'download',
      createdAt: Date.now(),
    };
    await broadcast({ type: 'LUMORA_NOTIFICATION', notification });
  })().catch(logUnexpectedError('Download notification failed'));
});

chrome.action.onClicked.addListener(() => {
  void createNewTab().catch(logUnexpectedError('Could not open a new tab'));
});
