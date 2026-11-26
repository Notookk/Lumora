import type { MediaSession } from '../types/lumora';

type MediaCommand = 'play' | 'pause' | 'toggle';
type MediaStatePayload = Omit<MediaSession, 'tabId'>;

interface MediaCommandMessage {
  type: 'MEDIA_COMMAND';
  command: MediaCommand;
  tabId?: number;
}

const REPORT_INTERVAL_MS = 1_000;
const METADATA_POLL_MS = 3_000;
const expectedRuntimeErrorPatterns = [
  /receiving end does not exist/i,
  /message port closed before a response was received/i,
  /extension context has been invalidated/i,
];

function isExpectedRuntimeError(error: unknown): boolean {
  return error instanceof Error
    && expectedRuntimeErrorPatterns.some((pattern) => pattern.test(error.message));
}

function isMediaCommand(message: unknown): message is MediaCommandMessage {
  if (typeof message !== 'object' || message === null) return false;
  const candidate = message as Record<string, unknown>;
  return candidate.type === 'MEDIA_COMMAND'
    && (candidate.command === 'play'
      || candidate.command === 'pause'
      || candidate.command === 'toggle');
}

function startMediaBridge(): void {
  if (typeof document === 'undefined'
    || typeof chrome === 'undefined'
    || !chrome.runtime?.onMessage) {
    return;
  }

  const mediaElements = new Set<HTMLMediaElement>();
  const mediaSession = typeof navigator === 'undefined' ? undefined : navigator.mediaSession;
  let reportTimer: ReturnType<typeof setTimeout> | undefined;
  let lastReportAt = 0;

  function isMediaElement(element: Element): element is HTMLMediaElement {
    return element.tagName === 'VIDEO' || element.tagName === 'AUDIO';
  }

  function primaryMedia(): HTMLMediaElement | undefined {
    let fallback: HTMLMediaElement | undefined;
    for (const media of mediaElements) {
      if (!media.isConnected) continue;
      if (!media.paused && !media.ended) return media;
      if (!fallback && (media.readyState > 0 || media.currentTime > 0)) fallback = media;
    }
    return fallback ?? mediaElements.values().next().value;
  }

  function bestArtwork(): string {
    const artworks = mediaSession?.metadata?.artwork ?? [];
    let best = '';
    let bestArea = -1;
    for (const artwork of artworks) {
      if (!artwork.src) continue;
      const dimensions = /^(\d+)x(\d+)$/.exec(artwork.sizes ?? '');
      const area = dimensions
        ? Number(dimensions[1]) * Number(dimensions[2])
        : artwork.sizes === 'any' ? Number.MAX_SAFE_INTEGER : 0;
      if (area > bestArea) {
        best = artwork.src;
        bestArea = area;
      }
    }
    return best;
  }

  function readMediaState(): MediaStatePayload | null {
    const media = primaryMedia();
    const metadata = mediaSession?.metadata;
    if (!media && !metadata && !mediaSession?.playbackState) return null;

    const title = metadata?.title?.trim()
      || media?.getAttribute('data-title')?.trim()
      || media?.getAttribute('title')?.trim()
      || media?.getAttribute('aria-label')?.trim()
      || document.title?.trim()
      || 'Untitled media';
    const artist = metadata?.artist?.trim()
      || media?.getAttribute('data-artist')?.trim()
      || '';
    const artwork = bestArtwork()
      || (media?.tagName === 'VIDEO' ? media.getAttribute('poster') : '')
      || '';
    const source = location.hostname || sourceFromMediaUrl(media?.currentSrc);
    const currentTime = media && Number.isFinite(media.currentTime) ? media.currentTime : 0;
    const duration = media && Number.isFinite(media.duration) ? media.duration : 0;

    return {
      title,
      artist,
      artwork,
      source,
      paused: media ? media.paused : mediaSession?.playbackState !== 'playing',
      muted: media ? media.muted || media.volume === 0 : false,
      currentTime: Math.max(0, currentTime),
      duration: Math.max(0, duration),
    };
  }

  function sourceFromMediaUrl(url: string | undefined): string {
    if (!url) return 'local media';
    try {
      return new URL(url).hostname || 'local media';
    } catch {
      return 'local media';
    }
  }

  function reportMediaState(): void {
    lastReportAt = Date.now();
    const session = readMediaState();
    if (!session) return;
    void chrome.runtime.sendMessage({ type: 'MEDIA_STATE', session }).catch((error: unknown) => {
      if (isExpectedRuntimeError(error)) return;
      console.error('[Lumora media bridge] Could not report media state', error);
    });
  }

  function scheduleReport(immediate = false): void {
    if (reportTimer !== undefined) {
      if (!immediate) return;
      clearTimeout(reportTimer);
      reportTimer = undefined;
    }
    const remaining = REPORT_INTERVAL_MS - (Date.now() - lastReportAt);
    if (immediate || remaining <= 0) {
      reportMediaState();
      return;
    }
    reportTimer = setTimeout(() => {
      reportTimer = undefined;
      reportMediaState();
    }, remaining);
  }

  function handleStateEvent(): void {
    scheduleReport(true);
  }

  function handleTimeEvent(): void {
    scheduleReport();
  }

  function attachMedia(media: HTMLMediaElement): void {
    if (mediaElements.has(media)) return;
    mediaElements.add(media);
    media.addEventListener('play', handleStateEvent, { passive: true });
    media.addEventListener('pause', handleStateEvent, { passive: true });
    media.addEventListener('ended', handleStateEvent, { passive: true });
    media.addEventListener('timeupdate', handleTimeEvent, { passive: true });
    media.addEventListener('loadedmetadata', handleStateEvent, { passive: true });
    media.addEventListener('volumechange', handleStateEvent, { passive: true });
  }

  function detachMedia(media: HTMLMediaElement): void {
    if (!mediaElements.delete(media)) return;
    media.removeEventListener('play', handleStateEvent);
    media.removeEventListener('pause', handleStateEvent);
    media.removeEventListener('ended', handleStateEvent);
    media.removeEventListener('timeupdate', handleTimeEvent);
    media.removeEventListener('loadedmetadata', handleStateEvent);
    media.removeEventListener('volumechange', handleStateEvent);
  }

  function addedMedia(node: Node): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const element = node as Element;
    let found = false;
    if (isMediaElement(element)) {
      attachMedia(element);
      found = true;
    }
    for (const media of element.querySelectorAll<HTMLMediaElement>('video, audio')) {
      attachMedia(media);
      found = true;
    }
    return found;
  }

  function removedMedia(node: Node): boolean {
    if (node.nodeType !== Node.ELEMENT_NODE) return false;
    const element = node as Element;
    let found = false;
    if (isMediaElement(element)) {
      detachMedia(element);
      found = true;
    }
    for (const media of element.querySelectorAll<HTMLMediaElement>('video, audio')) {
      detachMedia(media);
      found = true;
    }
    return found;
  }

  async function runCommand(command: MediaCommand): Promise<boolean> {
    const media = primaryMedia();
    if (!media) return false;
    try {
      if (command === 'play' || (command === 'toggle' && media.paused)) {
        await media.play();
      } else {
        media.pause();
      }
      scheduleReport(true);
      return true;
    } catch (error) {
      if (error instanceof DOMException
        && (error.name === 'NotAllowedError'
          || error.name === 'NotSupportedError'
          || error.name === 'AbortError')) {
        return false;
      }
      throw error;
    }
  }

  chrome.runtime.onMessage.addListener((message: unknown, _sender, sendResponse) => {
    if (!isMediaCommand(message)) return;
    void runCommand(message.command).then(
      (ok) => sendResponse({ ok }),
      (error: unknown) => {
        console.error('[Lumora media bridge] Media command failed', error);
        sendResponse({ ok: false });
      },
    ).catch((error: unknown) => {
      console.error('[Lumora media bridge] Could not deliver command response', error);
    });
    return true;
  });

  for (const media of document.querySelectorAll<HTMLMediaElement>('video, audio')) {
    attachMedia(media);
  }

  if (typeof MutationObserver !== 'undefined' && document.documentElement) {
    const observer = new MutationObserver((records) => {
      let mediaChanged = false;
      for (const record of records) {
        for (const node of record.removedNodes) mediaChanged = removedMedia(node) || mediaChanged;
        for (const node of record.addedNodes) mediaChanged = addedMedia(node) || mediaChanged;
      }
      if (mediaChanged) scheduleReport(true);
    });
    observer.observe(document.documentElement, { childList: true, subtree: true });
  }

  setInterval(() => scheduleReport(), METADATA_POLL_MS);
  scheduleReport(true);
}

startMediaBridge();
