import type { SearchEngine } from '../types/lumora';

const engines: Record<SearchEngine, (query: string) => string> = {
  google: (query) => `https://www.google.com/search?q=${encodeURIComponent(query)}`,
  duckduckgo: (query) => `https://duckduckgo.com/?q=${encodeURIComponent(query)}`,
  perplexity: (query) => `https://www.perplexity.ai/search?q=${encodeURIComponent(query)}`,
  bing: (query) => `https://www.bing.com/search?q=${encodeURIComponent(query)}`,
};

export const resolveSearch = (input: string, engine: SearchEngine) => {
  const value = input.trim();
  if (!value) return null;

  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).toString();
    } catch {
      return null;
    }
  }

  if (/^localhost(?::\d+)?(?:[/?#]|$)/i.test(value)) return `http://${value}`;
  if (/^(?:[\w-]+\.)+[a-z]{2,}(?::\d+)?(?:[/?#]|$)/i.test(value)) return `https://${value}`;
  return engines[engine](value);
};
